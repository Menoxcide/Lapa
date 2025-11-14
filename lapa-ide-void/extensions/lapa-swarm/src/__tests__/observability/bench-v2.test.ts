/**
 * Benchmark Suite v2 Tests
 * 
 * Comprehensive test coverage for Phase 18 benchmark suite
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BenchmarkSuiteV2, getBenchmarkSuiteV2 } from '../../observability/bench-v2.ts';
import { PrometheusMetrics } from '../../observability/prometheus.ts';
import { eventBus } from '../../core/event-bus.ts';

describe('Benchmark Suite v2', () => {
  let benchmarkSuite: BenchmarkSuiteV2;
  let prometheusMetrics: PrometheusMetrics;

  beforeEach(() => {
    prometheusMetrics = new PrometheusMetrics(
      { enabled: true, prefix: 'lapa_' },
      eventBus
    );
    benchmarkSuite = new BenchmarkSuiteV2({
      enabled: true,
      prometheusMetrics,
      eventBus,
      targetFidelity: 99.5,
      enableRegressionDetection: true,
      historicalTracking: true
    } as any);
  });

  afterEach(() => {
    benchmarkSuite.clearResults();
  });

  describe('Initialization', () => {
    it('should create benchmark suite', () => {
      expect(benchmarkSuite).toBeDefined();
      expect(benchmarkSuite).toBeInstanceOf(BenchmarkSuiteV2);
    });

    it('should initialize with default config', () => {
      const suite = new BenchmarkSuiteV2({
        enabled: true
      } as any);
      expect(suite).toBeDefined();
    });

    it('should handle disabled suite', async () => {
      const disabledSuite = new BenchmarkSuiteV2({
        enabled: false
      } as any);
      const result = await disabledSuite.runBenchmark('test', 'test', async () => {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });

  describe('Single Benchmark', () => {
    it('should run a simple benchmark', async () => {
      const result = await benchmarkSuite.runBenchmark('test_benchmark', 'test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('test_benchmark');
      expect(result.category).toBe('test');
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle benchmark errors', async () => {
      const result = await benchmarkSuite.runBenchmark('error_benchmark', 'test', async () => {
        throw new Error('Test error');
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Test error');
    });

    it('should track memory usage', async () => {
      const result = await benchmarkSuite.runBenchmark('memory_benchmark', 'test', async () => {
        const data = new Array(1000).fill(0);
        data.length = 0;
      });

      expect(result.memoryUsage).toBeDefined();
      expect(typeof result.memoryUsage).toBe('number');
    });
  });

  describe('Handoff Performance Benchmark', () => {
    it('should run handoff performance benchmark', async () => {
      const result = await benchmarkSuite.benchmarkHandoffPerformance();
      expect(result).toBeDefined();
      expect(result.name).toBe('handoff_performance');
      expect(result.category).toBe('handoff');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Memory Performance Benchmark', () => {
    it('should run memory performance benchmark', async () => {
      const result = await benchmarkSuite.benchmarkMemoryPerformance();
      expect(result).toBeDefined();
      expect(result.name).toBe('memory_performance');
      expect(result.category).toBe('memory');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Context Compression Benchmark', () => {
    it('should run context compression benchmark', async () => {
      const result = await benchmarkSuite.benchmarkContextCompression();
      expect(result).toBeDefined();
      expect(result.name).toBe('context_compression');
      expect(result.category).toBe('compression');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Agent Routing Benchmark', () => {
    it('should run agent routing benchmark', async () => {
      const result = await benchmarkSuite.benchmarkAgentRouting();
      expect(result).toBeDefined();
      expect(result.name).toBe('agent_routing');
      expect(result.category).toBe('routing');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Event Processing Benchmark', () => {
    it('should run event processing benchmark', async () => {
      const result = await benchmarkSuite.benchmarkEventProcessing();
      expect(result).toBeDefined();
      expect(result.name).toBe('event_processing');
      expect(result.category).toBe('events');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Benchmark Suite', () => {
    it('should run comprehensive benchmark suite', async () => {
      const results = await benchmarkSuite.runBenchmarkSuite();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    }, 60000);

    it('should track all benchmark results', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const allResults = benchmarkSuite.getResults();
      expect(allResults.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Performance Metrics', () => {
    it('should get performance metrics', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const metrics = await benchmarkSuite.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.handoffLatency).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.compressionRatio).toBeDefined();
      expect(metrics.eventThroughput).toBeDefined();
      expect(metrics.taskCompletionRate).toBeDefined();
      expect(metrics.overallFidelity).toBeDefined();
    }, 60000);

    it('should calculate handoff latency percentiles', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const metrics = await benchmarkSuite.getPerformanceMetrics();
      expect(metrics.handoffLatency.p50).toBeGreaterThanOrEqual(0);
      expect(metrics.handoffLatency.p95).toBeGreaterThanOrEqual(0);
      expect(metrics.handoffLatency.p99).toBeGreaterThanOrEqual(0);
      expect(metrics.handoffLatency.average).toBeGreaterThanOrEqual(0);
    }, 60000);
  });

  describe('Prometheus Export', () => {
    it('should export Prometheus metrics', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const exportStr = benchmarkSuite.exportPrometheusMetrics();
      expect(exportStr).toBeDefined();
      expect(typeof exportStr).toBe('string');
    }, 60000);

    it('should export metrics in Prometheus format', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const exportStr = benchmarkSuite.exportPrometheusMetrics();
      // Check for Prometheus format indicators
      if (exportStr.length > 0) {
        expect(exportStr).toContain('# HELP');
        expect(exportStr).toContain('# TYPE');
      }
    }, 60000);
  });

  describe('Historical Tracking', () => {
    it('should track historical results', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      const historical = benchmarkSuite.getHistoricalResults();
      expect(historical).toBeDefined();
      expect(Array.isArray(historical)).toBe(true);
    }, 60000);

    it('should detect regressions', async () => {
      // Run benchmarks multiple times to generate history
      await benchmarkSuite.runBenchmarkSuite();
      await benchmarkSuite.runBenchmarkSuite();
      const regressions = benchmarkSuite.detectRegressions();
      expect(regressions).toBeDefined();
      expect(Array.isArray(regressions)).toBe(true);
    }, 120000);
  });

  describe('Results Management', () => {
    it('should get all results', () => {
      const results = benchmarkSuite.getResults();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should clear results', async () => {
      await benchmarkSuite.runBenchmarkSuite();
      expect(benchmarkSuite.getResults().length).toBeGreaterThan(0);
      benchmarkSuite.clearResults();
      expect(benchmarkSuite.getResults().length).toBe(0);
    }, 60000);
  });

  describe('Default Export', () => {
    it('should export getBenchmarkSuiteV2 function', () => {
      expect(getBenchmarkSuiteV2).toBeDefined();
      expect(typeof getBenchmarkSuiteV2).toBe('function');
    });

    it('should create default instance', () => {
      const suite = getBenchmarkSuiteV2({
        enabled: true,
        prometheusMetrics,
        eventBus
      });
      expect(suite).toBeDefined();
      expect(suite).toBeInstanceOf(BenchmarkSuiteV2);
    });
  });
});

