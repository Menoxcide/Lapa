"use strict";
/**
 * Benchmark Suite v2 Tests
 *
 * Comprehensive test coverage for Phase 18 benchmark suite
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const bench_v2_ts_1 = require("../../observability/bench-v2.ts");
const prometheus_ts_1 = require("../../observability/prometheus.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('Benchmark Suite v2', () => {
    let benchmarkSuite;
    let prometheusMetrics;
    (0, vitest_1.beforeEach)(() => {
        prometheusMetrics = new prometheus_ts_1.PrometheusMetrics({ enabled: true, prefix: 'lapa_' }, event_bus_ts_1.eventBus);
        benchmarkSuite = new bench_v2_ts_1.BenchmarkSuiteV2({
            enabled: true,
            prometheusMetrics,
            eventBus: event_bus_ts_1.eventBus,
            targetFidelity: 99.5,
            enableRegressionDetection: true,
            historicalTracking: true
        });
    });
    (0, vitest_1.afterEach)(() => {
        benchmarkSuite.clearResults();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create benchmark suite', () => {
            (0, vitest_1.expect)(benchmarkSuite).toBeDefined();
            (0, vitest_1.expect)(benchmarkSuite).toBeInstanceOf(bench_v2_ts_1.BenchmarkSuiteV2);
        });
        (0, vitest_1.it)('should initialize with default config', () => {
            const suite = new bench_v2_ts_1.BenchmarkSuiteV2({
                enabled: true
            });
            (0, vitest_1.expect)(suite).toBeDefined();
        });
        (0, vitest_1.it)('should handle disabled suite', async () => {
            const disabledSuite = new bench_v2_ts_1.BenchmarkSuiteV2({
                enabled: false
            });
            const result = await disabledSuite.runBenchmark('test', 'test', async () => { });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('disabled');
        });
    });
    (0, vitest_1.describe)('Single Benchmark', () => {
        (0, vitest_1.it)('should run a simple benchmark', async () => {
            const result = await benchmarkSuite.runBenchmark('test_benchmark', 'test', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('test_benchmark');
            (0, vitest_1.expect)(result.category).toBe('test');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.duration).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle benchmark errors', async () => {
            const result = await benchmarkSuite.runBenchmark('error_benchmark', 'test', async () => {
                throw new Error('Test error');
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBeDefined();
            (0, vitest_1.expect)(result.error).toContain('Test error');
        });
        (0, vitest_1.it)('should track memory usage', async () => {
            const result = await benchmarkSuite.runBenchmark('memory_benchmark', 'test', async () => {
                const data = new Array(1000).fill(0);
                data.length = 0;
            });
            (0, vitest_1.expect)(result.memoryUsage).toBeDefined();
            (0, vitest_1.expect)(typeof result.memoryUsage).toBe('number');
        });
    });
    (0, vitest_1.describe)('Handoff Performance Benchmark', () => {
        (0, vitest_1.it)('should run handoff performance benchmark', async () => {
            const result = await benchmarkSuite.benchmarkHandoffPerformance();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('handoff_performance');
            (0, vitest_1.expect)(result.category).toBe('handoff');
            (0, vitest_1.expect)(result.success).toBe(true);
        }, 30000);
    });
    (0, vitest_1.describe)('Memory Performance Benchmark', () => {
        (0, vitest_1.it)('should run memory performance benchmark', async () => {
            const result = await benchmarkSuite.benchmarkMemoryPerformance();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('memory_performance');
            (0, vitest_1.expect)(result.category).toBe('memory');
            (0, vitest_1.expect)(result.success).toBe(true);
        }, 30000);
    });
    (0, vitest_1.describe)('Context Compression Benchmark', () => {
        (0, vitest_1.it)('should run context compression benchmark', async () => {
            const result = await benchmarkSuite.benchmarkContextCompression();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('context_compression');
            (0, vitest_1.expect)(result.category).toBe('compression');
            (0, vitest_1.expect)(result.success).toBe(true);
        }, 30000);
    });
    (0, vitest_1.describe)('Agent Routing Benchmark', () => {
        (0, vitest_1.it)('should run agent routing benchmark', async () => {
            const result = await benchmarkSuite.benchmarkAgentRouting();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('agent_routing');
            (0, vitest_1.expect)(result.category).toBe('routing');
            (0, vitest_1.expect)(result.success).toBe(true);
        }, 30000);
    });
    (0, vitest_1.describe)('Event Processing Benchmark', () => {
        (0, vitest_1.it)('should run event processing benchmark', async () => {
            const result = await benchmarkSuite.benchmarkEventProcessing();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.name).toBe('event_processing');
            (0, vitest_1.expect)(result.category).toBe('events');
            (0, vitest_1.expect)(result.success).toBe(true);
        }, 30000);
    });
    (0, vitest_1.describe)('Benchmark Suite', () => {
        (0, vitest_1.it)('should run comprehensive benchmark suite', async () => {
            const results = await benchmarkSuite.runBenchmarkSuite();
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            (0, vitest_1.expect)(results.length).toBeGreaterThan(0);
        }, 60000);
        (0, vitest_1.it)('should track all benchmark results', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const allResults = benchmarkSuite.getResults();
            (0, vitest_1.expect)(allResults.length).toBeGreaterThan(0);
        }, 60000);
    });
    (0, vitest_1.describe)('Performance Metrics', () => {
        (0, vitest_1.it)('should get performance metrics', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const metrics = await benchmarkSuite.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.handoffLatency).toBeDefined();
            (0, vitest_1.expect)(metrics.memoryUsage).toBeDefined();
            (0, vitest_1.expect)(metrics.compressionRatio).toBeDefined();
            (0, vitest_1.expect)(metrics.eventThroughput).toBeDefined();
            (0, vitest_1.expect)(metrics.taskCompletionRate).toBeDefined();
            (0, vitest_1.expect)(metrics.overallFidelity).toBeDefined();
        }, 60000);
        (0, vitest_1.it)('should calculate handoff latency percentiles', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const metrics = await benchmarkSuite.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics.handoffLatency.p50).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(metrics.handoffLatency.p95).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(metrics.handoffLatency.p99).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(metrics.handoffLatency.average).toBeGreaterThanOrEqual(0);
        }, 60000);
    });
    (0, vitest_1.describe)('Prometheus Export', () => {
        (0, vitest_1.it)('should export Prometheus metrics', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const exportStr = benchmarkSuite.exportPrometheusMetrics();
            (0, vitest_1.expect)(exportStr).toBeDefined();
            (0, vitest_1.expect)(typeof exportStr).toBe('string');
        }, 60000);
        (0, vitest_1.it)('should export metrics in Prometheus format', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const exportStr = benchmarkSuite.exportPrometheusMetrics();
            // Check for Prometheus format indicators
            if (exportStr.length > 0) {
                (0, vitest_1.expect)(exportStr).toContain('# HELP');
                (0, vitest_1.expect)(exportStr).toContain('# TYPE');
            }
        }, 60000);
    });
    (0, vitest_1.describe)('Historical Tracking', () => {
        (0, vitest_1.it)('should track historical results', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            const historical = benchmarkSuite.getHistoricalResults();
            (0, vitest_1.expect)(historical).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(historical)).toBe(true);
        }, 60000);
        (0, vitest_1.it)('should detect regressions', async () => {
            // Run benchmarks multiple times to generate history
            await benchmarkSuite.runBenchmarkSuite();
            await benchmarkSuite.runBenchmarkSuite();
            const regressions = benchmarkSuite.detectRegressions();
            (0, vitest_1.expect)(regressions).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(regressions)).toBe(true);
        }, 120000);
    });
    (0, vitest_1.describe)('Results Management', () => {
        (0, vitest_1.it)('should get all results', () => {
            const results = benchmarkSuite.getResults();
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should clear results', async () => {
            await benchmarkSuite.runBenchmarkSuite();
            (0, vitest_1.expect)(benchmarkSuite.getResults().length).toBeGreaterThan(0);
            benchmarkSuite.clearResults();
            (0, vitest_1.expect)(benchmarkSuite.getResults().length).toBe(0);
        }, 60000);
    });
    (0, vitest_1.describe)('Default Export', () => {
        (0, vitest_1.it)('should export getBenchmarkSuiteV2 function', () => {
            (0, vitest_1.expect)(bench_v2_ts_1.getBenchmarkSuiteV2).toBeDefined();
            (0, vitest_1.expect)(typeof bench_v2_ts_1.getBenchmarkSuiteV2).toBe('function');
        });
        (0, vitest_1.it)('should create default instance', () => {
            const suite = (0, bench_v2_ts_1.getBenchmarkSuiteV2)({
                enabled: true,
                prometheusMetrics,
                eventBus: event_bus_ts_1.eventBus
            });
            (0, vitest_1.expect)(suite).toBeDefined();
            (0, vitest_1.expect)(suite).toBeInstanceOf(bench_v2_ts_1.BenchmarkSuiteV2);
        });
    });
});
//# sourceMappingURL=bench-v2.test.js.map