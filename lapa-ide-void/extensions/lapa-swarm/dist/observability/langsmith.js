"use strict";
/**
 * LangSmith Tracing Integration for LAPA v1.2 Phase 15
 *
 * This module provides comprehensive observability through LangSmith tracing,
 * enabling detailed tracking of agent interactions, handoffs, and system events.
 *
 * Features:
 * - Distributed tracing across agent handoffs
 * - Performance monitoring and latency tracking
 * - Error tracking and debugging
 * - Integration with LAPA event bus
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangSmithTracer = void 0;
exports.getLangSmithTracer = getLangSmithTracer;
const events_1 = require("events");
const langsmith_1 = require("langsmith");
/**
 * LangSmith Trace Manager
 *
 * Manages distributed tracing across the LAPA system using LangSmith.
 */
class LangSmithTracer extends events_1.EventEmitter {
    config;
    eventBus;
    activeSpans = new Map();
    traceQueue = [];
    flushInterval = null;
    enabled;
    constructor(config, eventBus) {
        super();
        this.config = {
            ...config,
            apiKey: config.apiKey || process.env.LANGSMITH_API_KEY,
            projectName: config.projectName || 'lapa-v1.2',
            environment: config.environment || process.env.NODE_ENV || 'development',
            enabled: config.enabled !== false,
            endpoint: config.endpoint || 'https://api.smith.langchain.com',
            timeout: config.timeout ?? 5000
        };
        this.enabled = this.config.enabled && !!this.config.apiKey;
        this.eventBus = eventBus;
        if (this.enabled) {
            this.setupEventListeners();
            this.startFlushInterval();
        }
    }
    /**
     * Setup event bus listeners for automatic tracing
     */
    setupEventListeners() {
        // Trace handoff events
        this.eventBus.subscribe('handoff.initiated', (event) => {
            this.startSpan('handoff.initiated', {
                agentId: event.payload.sourceAgentId,
                targetAgentId: event.payload.targetAgentId,
                taskId: event.payload.taskId,
                priority: event.payload.priority
            }, event.id);
        });
        this.eventBus.subscribe('handoff.completed', (event) => {
            this.endSpan(event.id, 'success', {
                duration: event.payload.duration,
                result: event.payload.result
            });
        });
        this.eventBus.subscribe('handoff.failed', (event) => {
            this.endSpan(event.id, 'error', {
                error: event.payload.error,
                duration: event.payload.duration
            });
        });
        // Trace task events
        this.eventBus.subscribe('task.created', (event) => {
            this.startSpan('task.created', {
                taskId: event.payload.taskId,
                type: event.payload.type,
                priority: event.payload.priority
            }, event.id);
        });
        this.eventBus.subscribe('task.completed', (event) => {
            this.endSpan(event.id, 'success', {
                duration: event.payload.duration,
                result: event.payload.result
            });
        });
        this.eventBus.subscribe('task.failed', (event) => {
            this.endSpan(event.id, 'error', {
                error: event.payload.error,
                duration: event.payload.duration
            });
        });
        // Trace agent events
        this.eventBus.subscribe('agent.registered', (event) => {
            this.logEvent('agent.registered', {
                agentId: event.payload.agentId,
                name: event.payload.name,
                capabilities: event.payload.capabilities
            });
        });
        // Trace performance metrics
        this.eventBus.subscribe('performance.metric', (event) => {
            this.logMetric(event.payload.metric, event.payload.value, event.payload.tags || []);
        });
    }
    /**
     * Start a new trace span
     */
    startSpan(name, metadata = {}, spanId, parentSpanId) {
        if (!this.enabled)
            return spanId || '';
        const id = spanId || this.generateSpanId();
        const span = {
            id,
            name,
            startTime: Date.now(),
            metadata,
            tags: [],
            children: [],
            status: 'pending',
            parentId: parentSpanId
        };
        if (parentSpanId) {
            const parent = this.activeSpans.get(parentSpanId);
            if (parent) {
                parent.children.push(span);
            }
        }
        this.activeSpans.set(id, span);
        this.emit('span-started', span);
        return id;
    }
    /**
     * End a trace span
     */
    endSpan(spanId, status = 'success', metadata = {}) {
        if (!this.enabled)
            return;
        const span = this.activeSpans.get(spanId);
        if (!span) {
            this.emit('warning', `Span ${spanId} not found`);
            return;
        }
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.status = status;
        span.metadata = { ...span.metadata, ...metadata };
        if (status === 'error' && metadata.error) {
            span.error = metadata.error instanceof Error
                ? metadata.error
                : new Error(String(metadata.error));
        }
        this.activeSpans.delete(spanId);
        this.traceQueue.push(span);
        this.emit('span-ended', span);
        // Flush if queue is large
        if (this.traceQueue.length >= 100) {
            this.flushTraces();
        }
    }
    /**
     * Log an event (no span, just event tracking)
     */
    logEvent(name, metadata = {}) {
        if (!this.enabled)
            return;
        const eventSpan = {
            id: this.generateSpanId(),
            name: `event.${name}`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            metadata,
            tags: ['event'],
            children: [],
            status: 'success'
        };
        this.traceQueue.push(eventSpan);
        this.emit('event-logged', eventSpan);
    }
    /**
     * Log a metric
     */
    logMetric(metricName, value, tags = []) {
        if (!this.enabled)
            return;
        const metricSpan = {
            id: this.generateSpanId(),
            name: `metric.${metricName}`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            metadata: { value, metricName },
            tags: ['metric', ...tags],
            children: [],
            status: 'success'
        };
        this.traceQueue.push(metricSpan);
        this.emit('metric-logged', metricSpan);
    }
    /**
     * Create trace context for distributed tracing
     */
    createTraceContext(parentContext) {
        return {
            traceId: parentContext?.traceId || this.generateTraceId(),
            spanId: this.generateSpanId(),
            parentSpanId: parentContext?.spanId,
            baggage: parentContext?.baggage || {}
        };
    }
    /**
     * Flush traces to LangSmith
     */
    async flushTraces() {
        if (!this.enabled || this.traceQueue.length === 0)
            return;
        const traces = [...this.traceQueue];
        this.traceQueue = [];
        try {
            // Send traces to LangSmith API
            if (this.config.apiKey) {
                await this.sendToLangSmith(traces);
            }
            // Emit for potential external handlers
            this.emit('traces-flushed', traces);
        }
        catch (error) {
            this.emit('error', error);
            // Re-queue traces on error
            this.traceQueue.unshift(...traces);
        }
    }
    /**
     * Start automatic flush interval
     */
    startFlushInterval() {
        if (this.flushInterval)
            return;
        this.flushInterval = setInterval(() => {
            this.flushTraces();
        }, 10000); // Flush every 10 seconds
    }
    /**
     * Stop automatic flush interval
     */
    stopFlushInterval() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }
    /**
     * Generate unique span ID
     */
    generateSpanId() {
        return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique trace ID
     */
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get active spans
     */
    getActiveSpans() {
        return Array.from(this.activeSpans.values());
    }
    /**
     * Get trace by ID
     */
    getTrace(traceId) {
        // Search in active spans
        for (const span of this.activeSpans.values()) {
            if (span.id === traceId)
                return span;
        }
        // Search in queue
        return this.traceQueue.find(span => span.id === traceId);
    }
    /**
     * Shutdown tracer
     */
    async shutdown() {
        this.stopFlushInterval();
        await this.flushTraces();
        this.enabled = false;
        this.emit('shutdown');
    }
    /**
     * Send traces to LangSmith API
     */
    async sendToLangSmith(traces) {
        if (!this.config.apiKey) {
            throw new Error('LangSmith API key is required');
        }
        const client = new langsmith_1.Client({
            apiUrl: this.config.endpoint,
            apiKey: this.config.apiKey
        });
        // Convert traces to LangSmith run format
        const runs = traces.map(trace => ({
            id: trace.id,
            name: trace.name,
            start_time: trace.startTime,
            end_time: trace.endTime ?? undefined,
            run_type: 'chain',
            inputs: {},
            outputs: trace.metadata,
            error: trace.error?.message,
            serialized: {},
            events: [],
            extra: {
                tags: trace.tags,
                metadata: {
                    ...trace.metadata,
                    duration: trace.duration,
                    status: trace.status
                }
            },
            parent_run_id: trace.parentId,
            child_runs: trace.children.map(child => ({
                id: child.id,
                name: child.name,
                start_time: child.startTime,
                end_time: child.endTime ?? undefined,
                run_type: 'chain',
                inputs: {},
                outputs: child.metadata,
                error: child.error?.message,
                serialized: {},
                events: [],
                extra: {
                    tags: child.tags,
                    metadata: {
                        ...child.metadata,
                        duration: child.duration,
                        status: child.status
                    }
                }
            }))
        }));
        // Send runs to LangSmith
        for (const run of runs) {
            try {
                await client.createRun(run);
            }
            catch (error) {
                console.error(`Failed to send trace ${run.id} to LangSmith:`, error);
                // Don't rethrow to avoid blocking other traces
            }
        }
        console.log(`[LangSmith] Flushed ${traces.length} traces to ${this.config.projectName}`);
    }
}
exports.LangSmithTracer = LangSmithTracer;
/**
 * Default LangSmith tracer instance (lazy initialization)
 */
let defaultTracer = null;
/**
 * Get or create default LangSmith tracer
 */
function getLangSmithTracer(eventBus) {
    if (!defaultTracer && eventBus) {
        defaultTracer = new LangSmithTracer({
            enabled: true,
            projectName: 'lapa-v1.2'
        }, eventBus);
    }
    if (!defaultTracer) {
        throw new Error('LangSmith tracer requires event bus. Initialize with getLangSmithTracer(eventBus)');
    }
    return defaultTracer;
}
//# sourceMappingURL=langsmith.js.map