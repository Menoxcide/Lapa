"use strict";
/**
 * Phase 15 Integration for LAPA v1.2.2
 *
 * This module integrates all Phase 15 components:
 * - Repository Rules Manager (repo-rules.ts)
 * - LangSmith Tracer (langsmith.ts)
 * - Prometheus Metrics (prometheus.ts)
 *
 * It provides a unified interface for Phase 15 features (Codegen + Observability)
 * and integrates them with the orchestrator and event bus.
 *
 * Target: 99.5% fidelity with comprehensive observability and code generation rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrometheusMetrics = exports.getLangSmithTracer = exports.repoRulesManager = exports.phase15Integration = exports.Phase15Integration = void 0;
const repo_rules_ts_1 = require("../core/repo-rules.ts");
Object.defineProperty(exports, "repoRulesManager", { enumerable: true, get: function () { return repo_rules_ts_1.repoRulesManager; } });
const langsmith_ts_1 = require("../observability/langsmith.ts");
Object.defineProperty(exports, "getLangSmithTracer", { enumerable: true, get: function () { return langsmith_ts_1.getLangSmithTracer; } });
const prometheus_ts_1 = require("../observability/prometheus.ts");
Object.defineProperty(exports, "getPrometheusMetrics", { enumerable: true, get: function () { return prometheus_ts_1.getPrometheusMetrics; } });
const event_bus_ts_1 = require("../core/event-bus.ts");
/**
 * Phase 15 Integration Manager
 *
 * Manages initialization and coordination of all Phase 15 components.
 */
class Phase15Integration {
    config;
    initialized = false;
    repoRules;
    langSmithTracer;
    prometheusMetrics;
    constructor(config) {
        this.config = {
            enableRepoRules: config?.enableRepoRules ?? true,
            enableLangSmith: config?.enableLangSmith ?? true,
            enablePrometheus: config?.enablePrometheus ?? true,
            autoInitialize: config?.autoInitialize ?? false,
            langSmithConfig: config?.langSmithConfig,
            prometheusConfig: config?.prometheusConfig
        };
        this.repoRules = repo_rules_ts_1.repoRulesManager;
        if (this.config.autoInitialize) {
            this.initialize().catch(console.error);
        }
    }
    /**
     * Initializes all Phase 15 components
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            console.log('[Phase15] Initializing Phase 15 components...');
            // Initialize Repository Rules Manager
            if (this.config.enableRepoRules) {
                try {
                    // Repository rules manager is already initialized as singleton
                    console.log('[Phase15] Repository Rules Manager initialized');
                }
                catch (error) {
                    console.warn('[Phase15] Repository Rules Manager initialization failed:', error);
                }
            }
            // Initialize LangSmith Tracer
            if (this.config.enableLangSmith) {
                try {
                    if (this.config.langSmithConfig) {
                        // Initialize with custom config if provided
                        this.langSmithTracer = new langsmith_ts_1.LangSmithTracer({
                            enabled: true,
                            projectName: 'lapa-v1.2',
                            ...this.config.langSmithConfig
                        }, event_bus_ts_1.eventBus);
                    }
                    else {
                        // Use default tracer
                        this.langSmithTracer = (0, langsmith_ts_1.getLangSmithTracer)(event_bus_ts_1.eventBus);
                    }
                    console.log('[Phase15] LangSmith Tracer initialized');
                }
                catch (error) {
                    console.warn('[Phase15] LangSmith Tracer initialization failed:', error);
                    this.langSmithTracer = undefined;
                }
            }
            // Initialize Prometheus Metrics
            if (this.config.enablePrometheus) {
                try {
                    if (this.config.prometheusConfig) {
                        // Initialize with custom config if provided
                        this.prometheusMetrics = new prometheus_ts_1.PrometheusMetrics({
                            enabled: true,
                            prefix: 'lapa_',
                            ...this.config.prometheusConfig
                        }, event_bus_ts_1.eventBus);
                    }
                    else {
                        // Use default metrics
                        this.prometheusMetrics = (0, prometheus_ts_1.getPrometheusMetrics)(event_bus_ts_1.eventBus);
                    }
                    // Start memory metrics collection
                    if (this.prometheusMetrics) {
                        this.prometheusMetrics.startCollectionInterval(5000);
                    }
                    console.log('[Phase15] Prometheus Metrics initialized');
                }
                catch (error) {
                    console.warn('[Phase15] Prometheus Metrics initialization failed:', error);
                    this.prometheusMetrics = undefined;
                }
            }
            // Setup event listeners for cross-component communication
            this.setupEventListeners();
            this.initialized = true;
            await event_bus_ts_1.eventBus.publish({
                id: `phase15-init-${Date.now()}`,
                type: 'phase15.initialized',
                timestamp: Date.now(),
                source: 'phase15-integration',
                payload: {
                    components: {
                        repoRules: this.config.enableRepoRules,
                        langSmith: this.config.enableLangSmith,
                        prometheus: this.config.enablePrometheus
                    }
                }
            });
            console.log('[Phase15] All components initialized successfully');
        }
        catch (error) {
            console.error('[Phase15] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Sets up event listeners for cross-component communication
     */
    setupEventListeners() {
        // Listen for file operations that need repo rules validation
        event_bus_ts_1.eventBus.subscribe('file.created', async (event) => {
            if (this.config.enableRepoRules && event.payload?.filePath) {
                const validation = await this.repoRules.validateFilePath(event.payload.filePath);
                if (!validation.valid) {
                    await event_bus_ts_1.eventBus.publish({
                        id: `repo-rule-violation-${Date.now()}`,
                        type: 'repo-rules.violation',
                        timestamp: Date.now(),
                        source: 'phase15-integration',
                        payload: {
                            filePath: event.payload.filePath,
                            violations: validation.violations,
                            suggestions: validation.suggestions
                        }
                    });
                }
            }
        });
        event_bus_ts_1.eventBus.subscribe('file.modified', async (event) => {
            if (this.config.enableRepoRules && event.payload?.filePath) {
                const validation = await this.repoRules.validateFilePath(event.payload.filePath);
                if (!validation.valid) {
                    await event_bus_ts_1.eventBus.publish({
                        id: `repo-rule-violation-${Date.now()}`,
                        type: 'repo-rules.violation',
                        timestamp: Date.now(),
                        source: 'phase15-integration',
                        payload: {
                            filePath: event.payload.filePath,
                            violations: validation.violations,
                            suggestions: validation.suggestions
                        }
                    });
                }
            }
        });
        // Listen for code generation events that need tracing
        event_bus_ts_1.eventBus.subscribe('code.generated', async (event) => {
            if (this.config.enableLangSmith && this.langSmithTracer && event.payload) {
                const spanId = this.langSmithTracer.startSpan('code.generated', {
                    filePath: event.payload.filePath,
                    language: event.payload.language,
                    lines: event.payload.lines
                });
                // End span when code generation completes
                setTimeout(() => {
                    this.langSmithTracer?.endSpan(spanId, 'success', {
                        result: 'code generated successfully'
                    });
                }, 100);
            }
        });
        // Listen for repository validation events
        event_bus_ts_1.eventBus.subscribe('repo.validation.requested', async (event) => {
            if (this.config.enableRepoRules) {
                const validation = await this.repoRules.validateRepository();
                await event_bus_ts_1.eventBus.publish({
                    id: `repo-validation-${Date.now()}`,
                    type: 'repo.validation.completed',
                    timestamp: Date.now(),
                    source: 'phase15-integration',
                    payload: {
                        valid: validation.valid,
                        violations: validation.violations,
                        suggestions: validation.suggestions
                    }
                });
            }
        });
    }
    /**
     * Validates a file path against repository rules
     */
    async validateFilePath(filePath) {
        if (!this.config.enableRepoRules) {
            throw new Error('Repository Rules Manager is not enabled');
        }
        return await this.repoRules.validateFilePath(filePath);
    }
    /**
     * Validates the entire repository structure
     */
    async validateRepository() {
        if (!this.config.enableRepoRules) {
            throw new Error('Repository Rules Manager is not enabled');
        }
        return await this.repoRules.validateRepository();
    }
    /**
     * Validates import dependencies between layers
     */
    async validateImportDependency(fromPath, toPath) {
        if (!this.config.enableRepoRules) {
            throw new Error('Repository Rules Manager is not enabled');
        }
        return await this.repoRules.validateImportDependency(fromPath, toPath);
    }
    /**
     * Gets code generation template for a given file type
     */
    getCodeGenTemplate(type, name) {
        if (!this.config.enableRepoRules) {
            throw new Error('Repository Rules Manager is not enabled');
        }
        return this.repoRules.getCodeGenTemplate(type, name);
    }
    /**
     * Starts a trace span using LangSmith
     */
    startTrace(name, metadata = {}, parentSpanId) {
        if (!this.config.enableLangSmith || !this.langSmithTracer) {
            // Return empty string if not enabled (allows graceful degradation)
            return '';
        }
        return this.langSmithTracer.startSpan(name, metadata, undefined, parentSpanId);
    }
    /**
     * Ends a trace span using LangSmith
     */
    endTrace(spanId, status = 'success', metadata = {}) {
        if (!this.config.enableLangSmith || !this.langSmithTracer || !spanId) {
            // Gracefully handle if not enabled or invalid spanId
            return;
        }
        this.langSmithTracer.endSpan(spanId, status, metadata);
    }
    /**
     * Creates a trace context for distributed tracing
     */
    createTraceContext(parentContext) {
        if (!this.config.enableLangSmith || !this.langSmithTracer) {
            // Return a minimal context if not enabled
            return {
                traceId: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                spanId: `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                baggage: {}
            };
        }
        return this.langSmithTracer.createTraceContext(parentContext);
    }
    /**
     * Logs an event using LangSmith
     */
    logEvent(name, metadata = {}) {
        if (!this.config.enableLangSmith || !this.langSmithTracer) {
            // Gracefully handle if not enabled
            return;
        }
        this.langSmithTracer.logEvent(name, metadata);
    }
    /**
     * Logs a metric using LangSmith
     */
    logMetric(metricName, value, tags = []) {
        if (!this.config.enableLangSmith || !this.langSmithTracer) {
            // Gracefully handle if not enabled
            return;
        }
        this.langSmithTracer.logMetric(metricName, value, tags);
    }
    /**
     * Gets active spans from LangSmith
     */
    getActiveSpans() {
        if (!this.config.enableLangSmith || !this.langSmithTracer) {
            return [];
        }
        return this.langSmithTracer.getActiveSpans();
    }
    /**
     * Increments a Prometheus counter
     */
    incrementCounter(name, labels = {}) {
        if (!this.config.enablePrometheus || !this.prometheusMetrics) {
            throw new Error('Prometheus Metrics is not enabled');
        }
        this.prometheusMetrics.incrementCounter(name, labels);
    }
    /**
     * Sets a Prometheus gauge value
     */
    setGauge(name, value, labels = {}) {
        if (!this.config.enablePrometheus || !this.prometheusMetrics) {
            throw new Error('Prometheus Metrics is not enabled');
        }
        this.prometheusMetrics.setGauge(name, value, labels);
    }
    /**
     * Observes a Prometheus histogram value
     */
    observeHistogram(name, value, labels = {}) {
        if (!this.config.enablePrometheus || !this.prometheusMetrics) {
            throw new Error('Prometheus Metrics is not enabled');
        }
        this.prometheusMetrics.observeHistogram(name, value, labels);
    }
    /**
     * Exports Prometheus metrics in text format
     */
    exportPrometheusMetrics() {
        if (!this.config.enablePrometheus || !this.prometheusMetrics) {
            throw new Error('Prometheus Metrics is not enabled');
        }
        return this.prometheusMetrics.exportMetrics();
    }
    /**
     * Gets all Prometheus metrics
     */
    getPrometheusMetrics() {
        if (!this.config.enablePrometheus || !this.prometheusMetrics) {
            return new Map();
        }
        return this.prometheusMetrics.getMetrics();
    }
    /**
     * Comprehensive workflow: Validate code → Trace generation → Collect metrics
     */
    async executeFullWorkflow(filePath, codeContent) {
        const results = {};
        try {
            // Step 1: Validate file path against repo rules
            if (this.config.enableRepoRules) {
                const validation = await this.repoRules.validateFilePath(filePath);
                results.validation = validation;
                if (!validation.valid) {
                    // Log violation as event
                    if (this.config.enableLangSmith) {
                        this.logEvent('repo-rule-violation', {
                            filePath,
                            violations: validation.violations.length
                        });
                    }
                }
            }
            // Step 2: Start trace for code generation
            if (this.config.enableLangSmith && this.langSmithTracer) {
                const traceId = this.startTrace('code-generation-workflow', {
                    filePath,
                    codeLength: codeContent?.length || 0
                });
                results.traceId = traceId;
                // End trace when workflow completes
                setTimeout(() => {
                    this.endTrace(traceId, 'success', {
                        validationPassed: results.validation?.valid || false
                    });
                }, 100);
            }
            // Step 3: Collect metrics
            if (this.config.enablePrometheus && this.prometheusMetrics) {
                // Increment code generation counter
                this.incrementCounter('code_generations_total', {
                    file_path: filePath,
                    validation_passed: results.validation?.valid ? 'true' : 'false'
                });
                // Observe code size histogram
                if (codeContent) {
                    this.observeHistogram('code_size_bytes', codeContent.length, {
                        file_path: filePath
                    });
                }
                results.metrics = this.getPrometheusMetrics();
            }
            return results;
        }
        catch (error) {
            console.error('[Phase15] Full workflow execution failed:', error);
            // Log error to LangSmith if enabled
            if (this.config.enableLangSmith && this.langSmithTracer) {
                this.logEvent('workflow-error', {
                    error: error instanceof Error ? error.message : String(error),
                    filePath
                });
            }
            throw error;
        }
    }
    /**
     * Cleans up all Phase 15 components
     */
    async cleanup() {
        try {
            if (this.config.enableLangSmith && this.langSmithTracer) {
                await this.langSmithTracer.shutdown();
            }
            // Prometheus metrics don't need explicit cleanup
            // Repository rules manager is a singleton, no cleanup needed
            this.initialized = false;
            console.log('[Phase15] Cleanup completed');
        }
        catch (error) {
            console.error('[Phase15] Cleanup failed:', error);
        }
    }
    /**
     * Gets status of all Phase 15 components
     */
    getStatus() {
        return {
            initialized: this.initialized,
            components: {
                repoRules: this.config.enableRepoRules,
                langSmith: this.config.enableLangSmith && !!this.langSmithTracer,
                prometheus: this.config.enablePrometheus && !!this.prometheusMetrics
            },
            stats: {
                activeSpans: this.langSmithTracer?.getActiveSpans().length || 0,
                prometheusMetricsCount: this.prometheusMetrics?.getMetrics().size || 0
            }
        };
    }
}
exports.Phase15Integration = Phase15Integration;
// Export singleton instance
exports.phase15Integration = new Phase15Integration({
    autoInitialize: false // Initialize manually or via config
});
//# sourceMappingURL=phase15-integration.js.map