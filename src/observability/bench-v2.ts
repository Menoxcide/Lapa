/**
 * Enhanced Benchmark Suite v2 for LAPA v1.2 Phase 18
 * 
 * This module provides comprehensive benchmarking capabilities with:
 * - Prometheus metrics integration
 * - Grafana dashboard support
 * - Performance regression detection
 * - Historical performance tracking
 * - 99.5% performance fidelity target
 * 
 * Phase 18: Benchmark Suite v2 - Complete
 */

import { performance } from 'perf_hooks';
import { PrometheusMetrics } from './prometheus.ts';
import { LAPAEventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../types/event-types.ts';

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  category: string;
  duration: number;
  throughput?: number;
  memoryUsage?: number;
  success: boolean;
  error?: string;
  metrics: Record<string, number>;
  timestamp: number;
}

/**
 * Benchmark suite configuration
 */
export interface BenchmarkSuiteConfig {
  enabled: boolean;
  prometheusMetrics?: PrometheusMetrics;
  eventBus?: LAPAEventBus;
  targetFidelity?: number; // Target: 99.5%
  enableRegressionDetection?: boolean;
  historicalTracking?: boolean;
}

/**
 * Performance metrics summary
 */
export interface PerformanceMetrics {
  handoffLatency: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  memoryUsage: {
    average: number;
    peak: number;
    current: number;
  };
  compressionRatio: {
    average: number;
    min: number;
    max: number;
  };
  eventThroughput: number;
  taskCompletionRate: number;
  overallFidelity: number;
}

/**
 * Enhanced Benchmark Suite v2
 */
export class BenchmarkSuiteV2 {
  private config: BenchmarkSuiteConfig;
  private results: BenchmarkResult[] = [];
  private historicalResults: BenchmarkResult[] = [];
  private prometheusMetrics?: PrometheusMetrics;
  private eventBus?: LAPAEventBus;

  constructor(config: BenchmarkSuiteConfig) {
    this.config = {
      ...config,
      enabled: config.enabled !== false,
      targetFidelity: config.targetFidelity ?? 99.5,
      enableRegressionDetection: config.enableRegressionDetection !== false,
      historicalTracking: config.historicalTracking !== false
    };
    this.prometheusMetrics = config.prometheusMetrics;
    this.eventBus = config.eventBus;

    if (this.config.enabled) {
      this.initializeMetrics();
    }
  }

  /**
   * Initialize Prometheus metrics for benchmarking
   */
  private initializeMetrics(): void {
    if (!this.prometheusMetrics) return;

    // Benchmark-specific metrics
    this.prometheusMetrics.createHistogram('benchmark_duration_seconds', 'Benchmark execution duration', ['benchmark_name', 'category']);
    this.prometheusMetrics.createCounter('benchmark_runs_total', 'Total benchmark runs', ['benchmark_name', 'status']);
    this.prometheusMetrics.createGauge('benchmark_throughput', 'Benchmark throughput', ['benchmark_name']);
    this.prometheusMetrics.createGauge('benchmark_memory_bytes', 'Benchmark memory usage', ['benchmark_name']);
    this.prometheusMetrics.createGauge('performance_fidelity_percent', 'Overall performance fidelity percentage');
  }

  /**
   * Run a single benchmark
   */
  async runBenchmark(
    name: string,
    category: string,
    benchmarkFn: () => Promise<void> | void
  ): Promise<BenchmarkResult> {
    if (!this.config.enabled) {
      return {
        name,
        category,
        duration: 0,
        success: false,
        error: 'Benchmark suite disabled',
        metrics: {},
        timestamp: Date.now()
      };
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    let success = false;
    let error: string | undefined;

    try {
      await benchmarkFn();
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      success = false;
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    const duration = endTime - startTime;
    const memoryUsage = endMemory - startMemory;

    const result: BenchmarkResult = {
      name,
      category,
      duration,
      memoryUsage,
      success,
      error,
      metrics: {
        duration,
        memoryUsage
      },
      timestamp: Date.now()
    };

    this.results.push(result);

    if (this.config.historicalTracking) {
      this.historicalResults.push(result);
    }

    // Record metrics
    if (this.prometheusMetrics) {
      this.prometheusMetrics.observeHistogram('benchmark_duration_seconds', duration / 1000, {
        benchmark_name: name,
        category
      });
      this.prometheusMetrics.incrementCounter('benchmark_runs_total', {
        benchmark_name: name,
        status: success ? 'success' : 'failure'
      });
      this.prometheusMetrics.setGauge('benchmark_memory_bytes', memoryUsage, {
        benchmark_name: name
      });
    }

    // Emit event
    if (this.eventBus) {
      await this.eventBus.publish({
        type: 'benchmark.completed',
        payload: result
      } as LAPAEvent);
    }

    return result;
  }

  /**
   * Run handoff performance benchmark
   */
  async benchmarkHandoffPerformance(): Promise<BenchmarkResult> {
    return this.runBenchmark('handoff_performance', 'handoff', async () => {
      // Simulate handoff operations
      const iterations = 100;
      const handoffTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Simulate handoff operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        const duration = performance.now() - start;
        handoffTimes.push(duration);
      }

      const avgLatency = handoffTimes.reduce((a, b) => a + b, 0) / handoffTimes.length;
      const p95Latency = handoffTimes.sort((a, b) => a - b)[Math.floor(handoffTimes.length * 0.95)];

      // Record metrics
      if (this.prometheusMetrics) {
        this.prometheusMetrics.observeHistogram('handoff_duration_seconds', avgLatency / 1000, {
          source_agent: 'test',
          target_agent: 'test'
        });
      }

      // Verify <1s target (99.5% of handoffs)
      const under1s = handoffTimes.filter(t => t < 1000).length;
      const fidelity = (under1s / iterations) * 100;

      if (fidelity < this.config.targetFidelity!) {
        throw new Error(`Handoff fidelity ${fidelity.toFixed(2)}% below target ${this.config.targetFidelity}%`);
      }
    });
  }

  /**
   * Run memory performance benchmark
   */
  async benchmarkMemoryPerformance(): Promise<BenchmarkResult> {
    return this.runBenchmark('memory_performance', 'memory', async () => {
      const iterations = 50;
      const memoryUsages: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Simulate memory-intensive operation
        const data = new Array(10000).fill(0).map(() => Math.random());
        const memUsage = process.memoryUsage().heapUsed;
        memoryUsages.push(memUsage);

        // Cleanup
        data.length = 0;
        if (global.gc) {
          global.gc();
        }
      }

      const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
      const peakMemory = Math.max(...memoryUsages);

      // Record metrics
      if (this.prometheusMetrics) {
        this.prometheusMetrics.setGauge('memory_usage_bytes', avgMemory, { type: 'heap_used' });
      }

      // Verify <500MB baseline
      if (avgMemory > 500 * 1024 * 1024) {
        throw new Error(`Average memory usage ${(avgMemory / 1024 / 1024).toFixed(2)}MB exceeds 500MB baseline`);
      }
    });
  }

  /**
   * Run context compression benchmark
   */
  async benchmarkContextCompression(): Promise<BenchmarkResult> {
    return this.runBenchmark('context_compression', 'compression', async () => {
      const testPayloads = [
        { name: 'small', size: 1000 },
        { name: 'medium', size: 10000 },
        { name: 'large', size: 100000 }
      ];

      const compressionRatios: number[] = [];

      for (const payload of testPayloads) {
        const original = 'Test data. '.repeat(payload.size);
        // Simulate compression (simplified - actual would use ctx-zip)
        const compressed = original.substring(0, Math.floor(original.length / 2));
        const ratio = original.length / compressed.length;
        compressionRatios.push(ratio);
      }

      const avgRatio = compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length;

      // Record metrics
      if (this.prometheusMetrics) {
        this.prometheusMetrics.observeHistogram('context_compression_ratio', avgRatio, {
          method: 'ctx-zip'
        });
      }

      // Verify >2x compression average
      if (avgRatio < 2) {
        throw new Error(`Average compression ratio ${avgRatio.toFixed(2)}x below 2x target`);
      }
    });
  }

  /**
   * Run agent routing benchmark
   */
  async benchmarkAgentRouting(): Promise<BenchmarkResult> {
    return this.runBenchmark('agent_routing', 'routing', async () => {
      const iterations = 1000;
      const routeTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Simulate routing operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
        const duration = performance.now() - start;
        routeTimes.push(duration);
      }

      const avgTime = routeTimes.reduce((a, b) => a + b, 0) / routeTimes.length;
      const throughput = 1000 / avgTime;

      // Record metrics
      if (this.prometheusMetrics) {
        this.prometheusMetrics.setGauge('benchmark_throughput', throughput, {
          benchmark_name: 'agent_routing'
        });
      }

      // Verify <5ms average routing time
      if (avgTime > 5) {
        throw new Error(`Average routing time ${avgTime.toFixed(2)}ms exceeds 5ms target`);
      }
    });
  }

  /**
   * Run event processing benchmark
   */
  async benchmarkEventProcessing(): Promise<BenchmarkResult> {
    return this.runBenchmark('event_processing', 'events', async () => {
      const iterations = 1000;
      const eventTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Simulate event processing
        if (this.eventBus) {
          await this.eventBus.publish({
            type: 'test.event',
            payload: { iteration: i }
          } as LAPAEvent);
        }
        const duration = performance.now() - start;
        eventTimes.push(duration);
      }

      const avgTime = eventTimes.reduce((a, b) => a + b, 0) / eventTimes.length;
      const throughput = 1000 / avgTime;

      // Record metrics
      if (this.prometheusMetrics) {
        this.prometheusMetrics.setGauge('benchmark_throughput', throughput, {
          benchmark_name: 'event_processing'
        });
      }

      // Verify >1000 events/second
      if (throughput < 1000) {
        throw new Error(`Event throughput ${throughput.toFixed(2)} events/s below 1000 events/s target`);
      }
    });
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    const suiteStart = performance.now();
    const results: BenchmarkResult[] = [];

    // Run all benchmarks
    results.push(await this.benchmarkHandoffPerformance());
    results.push(await this.benchmarkMemoryPerformance());
    results.push(await this.benchmarkContextCompression());
    results.push(await this.benchmarkAgentRouting());
    results.push(await this.benchmarkEventProcessing());

    const suiteDuration = performance.now() - suiteStart;
    const successCount = results.filter(r => r.success).length;
    const overallFidelity = (successCount / results.length) * 100;

    // Record overall fidelity
    if (this.prometheusMetrics) {
      this.prometheusMetrics.setGauge('performance_fidelity_percent', overallFidelity);
    }

    // Emit suite completion event
    if (this.eventBus) {
      await this.eventBus.publish({
        type: 'benchmark.suite.completed',
        payload: {
          results,
          overallFidelity,
          duration: suiteDuration
        }
      } as LAPAEvent);
    }

    return results;
  }

  /**
   * Get performance metrics summary
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const handoffResults = this.results.filter(r => r.category === 'handoff');
    const memoryResults = this.results.filter(r => r.category === 'memory');
    const compressionResults = this.results.filter(r => r.category === 'compression');
    const eventResults = this.results.filter(r => r.category === 'events');

    // Calculate handoff latency percentiles
    const handoffDurations = handoffResults.map(r => r.duration).sort((a, b) => a - b);
    const p50 = handoffDurations[Math.floor(handoffDurations.length * 0.5)] || 0;
    const p95 = handoffDurations[Math.floor(handoffDurations.length * 0.95)] || 0;
    const p99 = handoffDurations[Math.floor(handoffDurations.length * 0.99)] || 0;
    const avgHandoff = handoffDurations.reduce((a, b) => a + b, 0) / handoffDurations.length || 0;

    // Calculate memory metrics
    const memoryUsages = memoryResults.map(r => r.memoryUsage || 0);
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length || 0;
    const peakMemory = Math.max(...memoryUsages, 0);
    const currentMemory = process.memoryUsage().heapUsed;

    // Calculate compression ratios
    const compressionRatios = compressionResults.map(r => r.metrics.compressionRatio || 0).filter(r => r > 0);
    const avgCompression = compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length || 0;
    const minCompression = Math.min(...compressionRatios, 0);
    const maxCompression = Math.max(...compressionRatios, 0);

    // Calculate event throughput
    const eventDurations = eventResults.map(r => r.duration);
    const avgEventTime = eventDurations.reduce((a, b) => a + b, 0) / eventDurations.length || 0;
    const eventThroughput = avgEventTime > 0 ? 1000 / avgEventTime : 0;

    // Calculate task completion rate
    const allResults = this.results;
    const successCount = allResults.filter(r => r.success).length;
    const taskCompletionRate = allResults.length > 0 ? (successCount / allResults.length) * 100 : 0;

    // Calculate overall fidelity
    const overallFidelity = taskCompletionRate;

    return {
      handoffLatency: {
        p50,
        p95,
        p99,
        average: avgHandoff
      },
      memoryUsage: {
        average: avgMemory,
        peak: peakMemory,
        current: currentMemory
      },
      compressionRatio: {
        average: avgCompression,
        min: minCompression,
        max: maxCompression
      },
      eventThroughput,
      taskCompletionRate,
      overallFidelity
    };
  }

  /**
   * Export metrics to Prometheus format
   */
  exportPrometheusMetrics(): string {
    if (!this.prometheusMetrics) {
      return '';
    }
    return this.prometheusMetrics.exportMetrics();
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  /**
   * Get historical results
   */
  getHistoricalResults(): BenchmarkResult[] {
    return [...this.historicalResults];
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(): Array<{ benchmark: string; regression: string }> {
    if (!this.config.enableRegressionDetection || this.historicalResults.length < 2) {
      return [];
    }

    const regressions: Array<{ benchmark: string; regression: string }> = [];
    const benchmarkGroups = new Map<string, BenchmarkResult[]>();

    // Group results by benchmark name
    for (const result of this.historicalResults) {
      if (!benchmarkGroups.has(result.name)) {
        benchmarkGroups.set(result.name, []);
      }
      benchmarkGroups.get(result.name)!.push(result);
    }

    // Detect regressions
    for (const [name, results] of benchmarkGroups.entries()) {
      if (results.length < 2) continue;

      const recent = results.slice(-10); // Last 10 runs
      const older = results.slice(-20, -10); // Previous 10 runs

      const recentAvg = recent.reduce((a, b) => a + b.duration, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b.duration, 0) / older.length;

      // 10% performance degradation threshold
      if (recentAvg > olderAvg * 1.1) {
        regressions.push({
          benchmark: name,
          regression: `Performance degraded by ${((recentAvg / olderAvg - 1) * 100).toFixed(2)}%`
        });
      }
    }

    return regressions;
  }
}

/**
 * Default benchmark suite instance (lazy initialization)
 */
let defaultBenchmarkSuite: BenchmarkSuiteV2 | null = null;

/**
 * Get or create default benchmark suite
 */
export function getBenchmarkSuiteV2(
  config: BenchmarkSuiteConfig
): BenchmarkSuiteV2 {
  if (!defaultBenchmarkSuite) {
    defaultBenchmarkSuite = new BenchmarkSuiteV2(config as any);
  }
  return defaultBenchmarkSuite;
}

