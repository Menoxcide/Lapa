"use strict";
/**
 * Phase 18 Integration Tests
 *
 * Comprehensive test coverage for Phase 18: Benchmark Suite v2
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const phase18_integration_ts_1 = require("../../orchestrator/phase18-integration.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('Phase 18 Integration', () => {
    let integration;
    (0, vitest_1.beforeEach)(() => {
        integration = new phase18_integration_ts_1.Phase18Integration({
            enableBenchmarkSuite: true,
            enablePrometheus: true,
            targetFidelity: 99.5
        });
    });
    (0, vitest_1.afterEach)(async () => {
        await integration.cleanup();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            await (0, vitest_1.expect)(integration.initialize()).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should initialize with default config', async () => {
            const defaultIntegration = new phase18_integration_ts_1.Phase18Integration();
            await (0, vitest_1.expect)(defaultIntegration.initialize()).resolves.not.toThrow();
            await defaultIntegration.cleanup();
        });
        (0, vitest_1.it)('should handle initialization errors gracefully', async () => {
            const badIntegration = new phase18_integration_ts_1.Phase18Integration({
                enablePrometheus: true,
                prometheusConfig: {
                    enabled: true,
                    prefix: 'lapa_'
                }
            });
            // Should not throw even if Prometheus fails
            await (0, vitest_1.expect)(badIntegration.initialize()).resolves.not.toThrow();
            await badIntegration.cleanup();
        });
        (0, vitest_1.it)('should get component status', async () => {
            await integration.initialize();
            const status = integration.getComponentStatus();
            (0, vitest_1.expect)(status).toBeDefined();
            (0, vitest_1.expect)(typeof status).toBe('object');
        });
    });
    (0, vitest_1.describe)('Benchmark Suite', () => {
        (0, vitest_1.it)('should run benchmark suite', async () => {
            await integration.initialize();
            const results = await integration.runBenchmarkSuite();
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            (0, vitest_1.expect)(results.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should get performance metrics', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const metrics = await integration.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.handoffLatency).toBeDefined();
            (0, vitest_1.expect)(metrics.memoryUsage).toBeDefined();
            (0, vitest_1.expect)(metrics.compressionRatio).toBeDefined();
            (0, vitest_1.expect)(metrics.eventThroughput).toBeDefined();
            (0, vitest_1.expect)(metrics.taskCompletionRate).toBeDefined();
            (0, vitest_1.expect)(metrics.overallFidelity).toBeDefined();
        });
        (0, vitest_1.it)('should get benchmark results', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const results = integration.getBenchmarkResults();
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should get historical results', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const historical = integration.getHistoricalResults();
            (0, vitest_1.expect)(historical).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(historical)).toBe(true);
        });
        (0, vitest_1.it)('should detect regressions', async () => {
            await integration.initialize();
            // Run benchmarks multiple times to generate history
            await integration.runBenchmarkSuite();
            await integration.runBenchmarkSuite();
            const regressions = integration.detectRegressions();
            (0, vitest_1.expect)(regressions).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(regressions)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Prometheus Metrics', () => {
        (0, vitest_1.it)('should export Prometheus metrics', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const exportStr = integration.exportPrometheusMetrics();
            (0, vitest_1.expect)(exportStr).toBeDefined();
            (0, vitest_1.expect)(typeof exportStr).toBe('string');
            (0, vitest_1.expect)(exportStr.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should export metrics in Prometheus format', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const exportStr = integration.exportPrometheusMetrics();
            // Check for Prometheus format indicators
            (0, vitest_1.expect)(exportStr).toContain('# HELP');
            (0, vitest_1.expect)(exportStr).toContain('# TYPE');
        });
    });
    (0, vitest_1.describe)('Statistics', () => {
        (0, vitest_1.it)('should get statistics', async () => {
            await integration.initialize();
            await integration.runBenchmarkSuite();
            const stats = integration.getStatistics();
            (0, vitest_1.expect)(stats).toBeDefined();
            (0, vitest_1.expect)(stats.components).toBeDefined();
            (0, vitest_1.expect)(typeof stats.benchmarkResults).toBe('number');
            (0, vitest_1.expect)(typeof stats.historicalResults).toBe('number');
            (0, vitest_1.expect)(typeof stats.regressions).toBe('number');
        });
    });
    (0, vitest_1.describe)('Event Integration', () => {
        (0, vitest_1.it)('should emit initialization event', async () => {
            let eventReceived = false;
            event_bus_ts_1.eventBus.subscribe('phase18.initialized', () => {
                eventReceived = true;
            });
            await integration.initialize();
            // Give event time to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
        (0, vitest_1.it)('should handle benchmark request events', async () => {
            await integration.initialize();
            let completed = false;
            event_bus_ts_1.eventBus.subscribe('benchmark.completed', () => {
                completed = true;
            });
            await event_bus_ts_1.eventBus.publish({
                type: 'benchmark.request',
                payload: {}
            });
            // Give event time to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            (0, vitest_1.expect)(completed).toBe(true);
        });
    });
    (0, vitest_1.describe)('Cleanup', () => {
        (0, vitest_1.it)('should cleanup resources', async () => {
            await integration.initialize();
            await (0, vitest_1.expect)(integration.cleanup()).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should emit cleanup event', async () => {
            await integration.initialize();
            let eventReceived = false;
            event_bus_ts_1.eventBus.subscribe('phase18.cleanup', () => {
                eventReceived = true;
            });
            await integration.cleanup();
            // Give event time to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
    });
    (0, vitest_1.describe)('Default Export', () => {
        (0, vitest_1.it)('should export default integration instance', () => {
            (0, vitest_1.expect)(phase18_integration_ts_1.phase18Integration).toBeDefined();
            (0, vitest_1.expect)(phase18_integration_ts_1.phase18Integration).toBeInstanceOf(phase18_integration_ts_1.Phase18Integration);
        });
    });
});
//# sourceMappingURL=phase18-integration.test.js.map