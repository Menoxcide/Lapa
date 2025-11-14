"use strict";
/**
 * Phase 18 Integration for LAPA v1.2.2
 *
 * This module provides unified interface for Phase 18: Benchmark Suite v2
 * with Grafana dashboard integration and comprehensive performance monitoring.
 *
 * Phase 18: Benchmark Suite v2 - Complete
 *
 * Features:
 * - Unified benchmark suite execution
 * - Prometheus metrics integration
 * - Grafana dashboard support
 * - Performance regression detection
 * - 99.5% performance fidelity target
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phase18Integration = exports.Phase18Integration = void 0;
exports.getPhase18Integration = getPhase18Integration;
const bench_v2_ts_1 = require("../observability/bench-v2.ts");
const prometheus_ts_1 = require("../observability/prometheus.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
/**
 * Phase 18 Integration
 */
class Phase18Integration {
    config;
    benchmarkSuite;
    prometheusMetrics;
    initialized = false;
    componentStatus = new Map();
    constructor(config = {}) {
        this.config = {
            enableBenchmarkSuite: config.enableBenchmarkSuite !== false,
            enablePrometheus: config.enablePrometheus !== false,
            enableGrafana: config.enableGrafana !== false,
            targetFidelity: config.targetFidelity || 99.5,
            enableRegressionDetection: config.enableRegressionDetection !== false,
            historicalTracking: config.historicalTracking !== false,
            prometheusConfig: {
                enabled: config.enablePrometheus !== false,
                prefix: 'lapa_',
                ...config.prometheusConfig
            },
            ...config
        };
    }
    /**
     * Initialize Phase 18 components
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Initialize Prometheus metrics
            if (this.config.enablePrometheus) {
                try {
                    this.prometheusMetrics = new prometheus_ts_1.PrometheusMetrics(this.config.prometheusConfig, event_bus_ts_1.eventBus);
                    this.componentStatus.set('prometheus', { enabled: true });
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    this.componentStatus.set('prometheus', { enabled: false, error: errorMsg });
                    console.warn('Prometheus metrics initialization failed:', errorMsg);
                }
            }
            // Initialize benchmark suite
            if (this.config.enableBenchmarkSuite) {
                try {
                    this.benchmarkSuite = (0, bench_v2_ts_1.getBenchmarkSuiteV2)({
                        enabled: true,
                        prometheusMetrics: this.prometheusMetrics,
                        eventBus: event_bus_ts_1.eventBus,
                        targetFidelity: this.config.targetFidelity,
                        enableRegressionDetection: this.config.enableRegressionDetection,
                        historicalTracking: this.config.historicalTracking
                    });
                    this.componentStatus.set('benchmarkSuite', { enabled: true });
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    this.componentStatus.set('benchmarkSuite', { enabled: false, error: errorMsg });
                    console.warn('Benchmark suite initialization failed:', errorMsg);
                }
            }
            // Setup event listeners
            this.setupEventListeners();
            this.initialized = true;
            // Emit initialization event
            await event_bus_ts_1.eventBus.publish({
                type: 'phase18.initialized',
                payload: {
                    components: Object.fromEntries(this.componentStatus),
                    timestamp: Date.now()
                }
            });
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Phase 18 initialization failed: ${errorMsg}`);
        }
    }
    /**
     * Setup event listeners for automatic workflow triggers
     */
    setupEventListeners() {
        // Listen for benchmark requests
        event_bus_ts_1.eventBus.subscribe('benchmark.request', async (event) => {
            if (this.benchmarkSuite) {
                try {
                    const results = await this.benchmarkSuite.runBenchmarkSuite();
                    await event_bus_ts_1.eventBus.publish({
                        type: 'benchmark.completed',
                        payload: { results }
                    });
                }
                catch (error) {
                    await event_bus_ts_1.eventBus.publish({
                        type: 'benchmark.failed',
                        payload: { error: error instanceof Error ? error.message : String(error) }
                    });
                }
            }
        });
    }
    /**
     * Run comprehensive benchmark suite
     */
    async runBenchmarkSuite() {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.benchmarkSuite) {
            throw new Error('Benchmark suite not initialized');
        }
        return await this.benchmarkSuite.runBenchmarkSuite();
    }
    /**
     * Get performance metrics summary
     */
    async getPerformanceMetrics() {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.benchmarkSuite) {
            throw new Error('Benchmark suite not initialized');
        }
        return await this.benchmarkSuite.getPerformanceMetrics();
    }
    /**
     * Export metrics to Prometheus format
     */
    exportPrometheusMetrics() {
        if (!this.prometheusMetrics) {
            return '';
        }
        let exportStr = this.prometheusMetrics.exportMetrics();
        if (this.benchmarkSuite) {
            const benchmarkExport = this.benchmarkSuite.exportPrometheusMetrics();
            if (benchmarkExport) {
                exportStr += '\n' + benchmarkExport;
            }
        }
        return exportStr;
    }
    /**
     * Get benchmark results
     */
    getBenchmarkResults() {
        if (!this.benchmarkSuite) {
            return [];
        }
        return this.benchmarkSuite.getResults();
    }
    /**
     * Get historical benchmark results
     */
    getHistoricalResults() {
        if (!this.benchmarkSuite) {
            return [];
        }
        return this.benchmarkSuite.getHistoricalResults();
    }
    /**
     * Detect performance regressions
     */
    detectRegressions() {
        if (!this.benchmarkSuite) {
            return [];
        }
        return this.benchmarkSuite.detectRegressions();
    }
    /**
     * Get component status
     */
    getComponentStatus() {
        return Object.fromEntries(this.componentStatus);
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            components: this.getComponentStatus(),
            benchmarkResults: this.getBenchmarkResults().length,
            historicalResults: this.getHistoricalResults().length,
            regressions: this.detectRegressions().length
        };
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // Clear benchmark results if needed
        if (this.benchmarkSuite) {
            this.benchmarkSuite.clearResults();
        }
        // Reset metrics if needed
        if (this.prometheusMetrics) {
            this.prometheusMetrics.resetMetrics();
        }
        this.initialized = false;
        // Emit cleanup event
        await event_bus_ts_1.eventBus.publish({
            type: 'phase18.cleanup',
            payload: { timestamp: Date.now() }
        });
    }
}
exports.Phase18Integration = Phase18Integration;
/**
 * Default Phase 18 integration instance (lazy initialization)
 */
let defaultPhase18Integration = null;
/**
 * Get or create default Phase 18 integration
 */
function getPhase18Integration(config) {
    if (!defaultPhase18Integration) {
        defaultPhase18Integration = new Phase18Integration(config);
    }
    return defaultPhase18Integration;
}
/**
 * Default export for convenience
 */
exports.phase18Integration = getPhase18Integration();
//# sourceMappingURL=phase18-integration.js.map