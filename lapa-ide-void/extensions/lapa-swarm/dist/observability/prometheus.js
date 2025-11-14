"use strict";
/**
 * Prometheus Metrics Integration for LAPA v1.2 Phase 15
 *
 * This module provides comprehensive metrics collection and monitoring
 * using Prometheus-compatible metrics. Supports deepagents callbacks
 * and integration with Grafana dashboards.
 *
 * Features:
 * - Counter, Gauge, Histogram, and Summary metrics
 * - DeepAgents callback integration
 * - Performance metrics tracking
 * - Agent workload metrics
 * - Handoff latency metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusMetrics = void 0;
exports.getPrometheusMetrics = getPrometheusMetrics;
const events_1 = require("events");
/**
 * Prometheus Metrics Manager
 *
 * Manages Prometheus-compatible metrics collection and export.
 */
class PrometheusMetrics extends events_1.EventEmitter {
    config;
    eventBus;
    metrics = new Map();
    deepAgentsCallbacks = [];
    enabled;
    constructor(config, eventBus) {
        super();
        this.config = {
            ...config,
            enabled: config.enabled !== false,
            port: config.port ?? 9090,
            path: config.path ?? '/metrics',
            collectDefaultMetrics: config.collectDefaultMetrics !== false,
            prefix: config.prefix ?? 'lapa_'
        };
        this.enabled = this.config.enabled;
        this.eventBus = eventBus;
        if (this.enabled) {
            this.initializeDefaultMetrics();
            this.setupEventListeners();
        }
    }
    async initialize() { return; }
    /**
     * Initialize default metrics
     */
    initializeDefaultMetrics() {
        // Handoff metrics
        this.createCounter('handoffs_total', 'Total number of handoffs', ['source_agent', 'target_agent', 'status']);
        this.createHistogram('handoff_duration_seconds', 'Handoff duration in seconds', ['source_agent', 'target_agent']);
        // Task metrics
        this.createCounter('tasks_total', 'Total number of tasks', ['type', 'status']);
        this.createHistogram('task_duration_seconds', 'Task duration in seconds', ['type']);
        // Agent metrics
        this.createGauge('agents_active', 'Number of active agents');
        this.createGauge('agents_workload', 'Agent workload', ['agent_id']);
        // Performance metrics
        this.createHistogram('event_processing_duration_seconds', 'Event processing duration', ['event_type']);
        this.createCounter('events_total', 'Total number of events', ['event_type']);
        // Error metrics
        this.createCounter('errors_total', 'Total number of errors', ['type', 'severity']);
        // Memory metrics
        this.createGauge('memory_usage_bytes', 'Memory usage in bytes', ['type']);
        // Context compression metrics
        this.createHistogram('context_compression_ratio', 'Context compression ratio', ['method']);
        this.createCounter('context_compressions_total', 'Total number of context compressions', ['method']);
    }
    /**
     * Setup event bus listeners for automatic metrics collection
     */
    setupEventListeners() {
        // Handoff metrics
        this.eventBus.subscribe('handoff.initiated', (event) => {
            this.incrementCounter('handoffs_total', {
                source_agent: event.payload.sourceAgentId,
                target_agent: event.payload.targetAgentId,
                status: 'initiated'
            });
        });
        this.eventBus.subscribe('handoff.completed', (event) => {
            this.incrementCounter('handoffs_total', {
                source_agent: event.payload.sourceAgentId,
                target_agent: event.payload.targetAgentId,
                status: 'completed'
            });
            this.observeHistogram('handoff_duration_seconds', event.payload.duration / 1000, {
                source_agent: event.payload.sourceAgentId,
                target_agent: event.payload.targetAgentId
            });
        });
        this.eventBus.subscribe('handoff.failed', (event) => {
            this.incrementCounter('handoffs_total', {
                source_agent: event.payload.sourceAgentId,
                target_agent: event.payload.targetAgentId,
                status: 'failed'
            });
            this.incrementCounter('errors_total', {
                type: 'handoff',
                severity: 'error'
            });
        });
        // Task metrics
        this.eventBus.subscribe('task.created', (event) => {
            this.incrementCounter('tasks_total', {
                type: event.payload.type,
                status: 'created'
            });
        });
        this.eventBus.subscribe('task.completed', (event) => {
            this.incrementCounter('tasks_total', {
                type: event.payload.type,
                status: 'completed'
            });
            this.observeHistogram('task_duration_seconds', event.payload.duration / 1000, {
                type: event.payload.type
            });
        });
        this.eventBus.subscribe('task.failed', (event) => {
            this.incrementCounter('tasks_total', {
                type: event.payload.type,
                status: 'failed'
            });
            this.incrementCounter('errors_total', {
                type: 'task',
                severity: 'error'
            });
        });
        // Agent metrics
        this.eventBus.subscribe('agent.registered', (event) => {
            this.setGauge('agents_active', this.getMetricValue('agents_active') + 1);
        });
        this.eventBus.subscribe('agent.unregistered', (event) => {
            this.setGauge('agents_active', Math.max(0, this.getMetricValue('agents_active') - 1));
        });
        this.eventBus.subscribe('agent.workload.updated', (event) => {
            this.setGauge('agents_workload', event.payload.workload, {
                agent_id: event.payload.agentId
            });
        });
        // Performance metrics
        this.eventBus.subscribe('performance.metric', (event) => {
            const metric = event.payload.metric;
            const value = event.payload.value;
            const tags = event.payload.tags || [];
            if (metric.includes('duration') || metric.includes('latency')) {
                this.observeHistogram('event_processing_duration_seconds', value / 1000, {
                    event_type: tags[0] || 'unknown'
                });
            }
        });
        // Context compression metrics
        this.eventBus.subscribe('context.compressed', (event) => {
            const ratio = event.payload.originalSize > 0
                ? event.payload.compressedSize / event.payload.originalSize
                : 0;
            this.observeHistogram('context_compression_ratio', ratio, {
                method: event.payload.method || 'unknown'
            });
            this.incrementCounter('context_compressions_total', {
                method: event.payload.method || 'unknown'
            });
        });
    }
    /**
     * Create a counter metric
     */
    createCounter(name, help, labelNames = []) {
        const fullName = `${this.config.prefix}${name}`;
        this.metrics.set(fullName, {
            name: fullName,
            type: 'counter',
            help,
            values: []
        });
    }
    /**
     * Create a gauge metric
     */
    createGauge(name, help, labelNames = []) {
        const fullName = `${this.config.prefix}${name}`;
        this.metrics.set(fullName, {
            name: fullName,
            type: 'gauge',
            help,
            values: []
        });
    }
    /**
     * Create a histogram metric
     */
    createHistogram(name, help, labelNames = []) {
        const fullName = `${this.config.prefix}${name}`;
        this.metrics.set(fullName, {
            name: fullName,
            type: 'histogram',
            help,
            values: []
        });
    }
    /**
     * Increment a counter
     */
    incrementCounter(name, labels = {}) {
        if (!this.enabled)
            return;
        const fullName = `${this.config.prefix}${name}`;
        const metric = this.metrics.get(fullName);
        if (!metric || metric.type !== 'counter') {
            this.emit('warning', `Counter ${fullName} not found`);
            return;
        }
        const labelArray = Object.entries(labels).map(([name, value]) => ({ name, value }));
        const existing = metric.values.find(v => v.labels.length === labelArray.length &&
            v.labels.every((l, i) => l.name === labelArray[i].name && l.value === labelArray[i].value));
        if (existing) {
            existing.value += 1;
        }
        else {
            metric.values.push({
                labels: labelArray,
                value: 1,
                timestamp: Date.now()
            });
        }
        // Trigger deepagents callbacks
        this.triggerDeepAgentsCallbacks(fullName, existing?.value || 1, labels);
        this.emit('counter-incremented', { name: fullName, labels, value: existing?.value || 1 });
    }
    /**
     * Set a gauge value
     */
    setGauge(name, value, labels = {}) {
        if (!this.enabled)
            return;
        const fullName = `${this.config.prefix}${name}`;
        const metric = this.metrics.get(fullName);
        if (!metric || metric.type !== 'gauge') {
            this.emit('warning', `Gauge ${fullName} not found`);
            return;
        }
        const labelArray = Object.entries(labels).map(([name, value]) => ({ name, value }));
        const existing = metric.values.find(v => v.labels.length === labelArray.length &&
            v.labels.every((l, i) => l.name === labelArray[i].name && l.value === labelArray[i].value));
        if (existing) {
            existing.value = value;
            existing.timestamp = Date.now();
        }
        else {
            metric.values.push({
                labels: labelArray,
                value,
                timestamp: Date.now()
            });
        }
        // Trigger deepagents callbacks
        this.triggerDeepAgentsCallbacks(fullName, value, labels);
        this.emit('gauge-set', { name: fullName, labels, value });
    }
    /**
     * Observe a histogram value
     */
    observeHistogram(name, value, labels = {}) {
        if (!this.enabled)
            return;
        const fullName = `${this.config.prefix}${name}`;
        const metric = this.metrics.get(fullName);
        if (!metric || metric.type !== 'histogram') {
            this.emit('warning', `Histogram ${fullName} not found`);
            return;
        }
        const labelArray = Object.entries(labels).map(([name, value]) => ({ name, value }));
        const existing = metric.values.find(v => v.labels.length === labelArray.length &&
            v.labels.every((l, i) => l.name === labelArray[i].name && l.value === labelArray[i].value));
        if (existing) {
            // For histogram, we might want to track multiple values
            // For simplicity, we'll track the latest value
            existing.value = value;
            existing.timestamp = Date.now();
        }
        else {
            metric.values.push({
                labels: labelArray,
                value,
                timestamp: Date.now()
            });
        }
        // Trigger deepagents callbacks
        this.triggerDeepAgentsCallbacks(fullName, value, labels);
        this.emit('histogram-observed', { name: fullName, labels, value });
    }
    /**
     * Get metric value (for internal use)
     */
    getMetricValue(name, labels = {}) {
        const fullName = `${this.config.prefix}${name}`;
        const metric = this.metrics.get(fullName);
        if (!metric)
            return 0;
        const labelArray = Object.entries(labels).map(([name, value]) => ({ name, value }));
        const existing = metric.values.find(v => v.labels.length === labelArray.length &&
            v.labels.every((l, i) => l.name === labelArray[i].name && l.value === labelArray[i].value));
        return existing?.value || 0;
    }
    /**
     * Register a deepagents callback
     */
    registerDeepAgentsCallback(callback) {
        this.deepAgentsCallbacks.push(callback);
        this.emit('callback-registered', callback);
    }
    /**
     * Unregister a deepagents callback
     */
    unregisterDeepAgentsCallback(callback) {
        const index = this.deepAgentsCallbacks.indexOf(callback);
        if (index > -1) {
            this.deepAgentsCallbacks.splice(index, 1);
            this.emit('callback-unregistered', callback);
        }
    }
    /**
     * Trigger deepagents callbacks
     */
    triggerDeepAgentsCallbacks(metricName, value, labels) {
        for (const callback of this.deepAgentsCallbacks) {
            try {
                callback(metricName, value, labels);
            }
            catch (error) {
                this.emit('callback-error', { callback, error });
            }
        }
    }
    /**
     * Export metrics in Prometheus format
     */
    exportMetrics() {
        const lines = [];
        for (const metric of this.metrics.values()) {
            // Write HELP line
            lines.push(`# HELP ${metric.name} ${metric.help}`);
            lines.push(`# TYPE ${metric.name} ${metric.type}`);
            // Write metric values
            for (const value of metric.values) {
                const labelString = value.labels.length > 0
                    ? `{${value.labels.map(l => `${l.name}="${l.value}"`).join(',')}}`
                    : '';
                lines.push(`${metric.name}${labelString} ${value.value}`);
            }
        }
        return lines.join('\n') + '\n';
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        return new Map(this.metrics);
    }
    /**
     * Get a specific metric
     */
    getMetric(name) {
        const fullName = `${this.config.prefix}${name}`;
        return this.metrics.get(fullName);
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        for (const metric of this.metrics.values()) {
            metric.values = [];
        }
        this.emit('metrics-reset');
    }
    /**
     * Collect memory metrics
     */
    collectMemoryMetrics() {
        if (!this.enabled)
            return;
        const memUsage = process.memoryUsage();
        this.setGauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
        this.setGauge('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
        this.setGauge('memory_usage_bytes', memUsage.rss, { type: 'rss' });
        this.setGauge('memory_usage_bytes', memUsage.external, { type: 'external' });
    }
    /**
     * Start metrics collection interval
     */
    startCollectionInterval(intervalMs = 5000) {
        return setInterval(() => {
            this.collectMemoryMetrics();
        }, intervalMs);
    }
}
exports.PrometheusMetrics = PrometheusMetrics;
/**
 * Default Prometheus metrics instance (lazy initialization)
 */
let defaultMetrics = null;
/**
 * Get or create default Prometheus metrics
 */
function getPrometheusMetrics(eventBus) {
    if (!defaultMetrics && eventBus) {
        defaultMetrics = new PrometheusMetrics({
            enabled: true,
            prefix: 'lapa_'
        }, eventBus);
    }
    if (!defaultMetrics) {
        throw new Error('Prometheus metrics requires event bus. Initialize with getPrometheusMetrics(eventBus)');
    }
    return defaultMetrics;
}
//# sourceMappingURL=prometheus.js.map