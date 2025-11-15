/**
 * MCP Performance Benchmarker for LAPA v1.0.0
 * 
 * This module provides automated performance benchmarking for MCP servers:
 * - Tool call latency benchmarking
 * - Throughput testing
 * - Memory usage profiling
 * - Connection pool performance
 * - Error rate tracking
 * - Performance regression detection
 * 
 * Phase: MCP Performance Optimization
 */

import { eventBus } from '../core/event-bus.ts';
import type { MCPConnector } from './mcp-connector.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

// Benchmark configuration
export interface MCPBenchmarkConfig {
  enabled: boolean;
  warmupIterations: number;
  benchmarkIterations: number;
  concurrency: number;
  timeoutMs: number;
  trackMemory: boolean;
  trackCPU: boolean;
  historicalTracking: boolean;
}

const DEFAULT_CONFIG: MCPBenchmarkConfig = {
  enabled: true,
  warmupIterations: 5,
  benchmarkIterations: 50,
  concurrency: 10,
  timeoutMs: 30000,
  trackMemory: true,
  trackCPU: false, // CPU tracking requires additional dependencies
  historicalTracking: true
};

// Benchmark result
export interface MCPBenchmarkResult {
  serverName: string;
  toolName: string;
  timestamp: number;
  latency: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p50: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
  memory?: {
    baseline: number;
    peak: number;
    average: number;
    leak: number; // Memory increase over time
  };
  errors: {
    count: number;
    rate: number;
    types: Map<string, number>;
  };
  metadata: {
    warmupIterations: number;
    benchmarkIterations: number;
    concurrency: number;
    duration: number;
  };
}

// Performance threshold
export interface MCPPerformanceThreshold {
  maxLatencyMs: number; // Target: <1000ms
  maxP95LatencyMs: number; // Target: <2000ms
  maxP99LatencyMs: number; // Target: <5000ms
  minThroughputRps: number; // Target: >10 RPS
  maxErrorRate: number; // Target: <0.01 (1%)
  maxMemoryMB: number; // Target: <500MB
}

const DEFAULT_THRESHOLDS: MCPPerformanceThreshold = {
  maxLatencyMs: 1000,
  maxP95LatencyMs: 2000,
  maxP99LatencyMs: 5000,
  minThroughputRps: 10,
  maxErrorRate: 0.01,
  maxMemoryMB: 500
};

// Performance regression
export interface MCPPerformanceRegression {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * MCP Performance Benchmarker
 * 
 * Provides automated performance benchmarking for MCP servers and tools.
 */
export class MCPBenchmarker {
  private config: MCPBenchmarkConfig;
  private thresholds: MCPPerformanceThreshold;
  private historicalResults: MCPBenchmarkResult[] = [];
  private benchmarks: Map<string, MCPBenchmarkResult> = new Map();

  constructor(config?: Partial<MCPBenchmarkConfig>, thresholds?: Partial<MCPPerformanceThreshold>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Benchmark a single tool call
   */
  async benchmarkTool(
    connector: MCPConnector,
    serverName: string,
    toolName: string,
    toolArgs: Record<string, unknown> = {},
    agentId?: string
  ): Promise<MCPBenchmarkResult> {
    if (!this.config.enabled) {
      throw new Error('Benchmarking is disabled');
    }

    // Warmup phase
    if (this.config.warmupIterations > 0) {
      for (let i = 0; i < this.config.warmupIterations; i++) {
        try {
          await connector.callTool(toolName, toolArgs, agentId);
        } catch (error) {
          // Ignore warmup errors
        }
      }
    }

    // Memory baseline
    const memoryBaseline = this.config.trackMemory
      ? process.memoryUsage().heapUsed
      : 0;

    // Benchmark phase
    const latencies: number[] = [];
    const memorySamples: number[] = [];
    const errors: Map<string, number> = new Map();
    let successfulRequests = 0;
    let failedRequests = 0;

    const startTime = Date.now();

    // Run benchmarks with concurrency
    const iterationsPerConcurrency = Math.ceil(this.config.benchmarkIterations / this.config.concurrency);
    const promises: Promise<void>[] = [];

    for (let c = 0; c < this.config.concurrency; c++) {
      promises.push(
        (async () => {
          for (let i = 0; i < iterationsPerConcurrency; i++) {
            const iterationStart = performance.now();
            
            try {
              if (this.config.trackMemory && i % 5 === 0) {
                memorySamples.push(process.memoryUsage().heapUsed);
              }

              await connector.callTool(toolName, toolArgs, agentId);
              
              const latency = performance.now() - iterationStart;
              latencies.push(latency);
              successfulRequests++;
            } catch (error) {
              failedRequests++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              const errorType = this.categorizeError(errorMessage);
              errors.set(errorType, (errors.get(errorType) || 0) + 1);
              
              const latency = performance.now() - iterationStart;
              latencies.push(latency); // Include failed request latency
            }
          }
        })()
      );
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate statistics
    latencies.sort((a, b) => a - b);
    const latencyStats = this.calculateLatencyStats(latencies);
    
    const totalRequests = successfulRequests + failedRequests;
    const throughput = {
      requestsPerSecond: (totalRequests / duration) * 1000,
      totalRequests,
      successfulRequests,
      failedRequests
    };

    // Memory statistics
    let memoryStats: MCPBenchmarkResult['memory'] | undefined;
    if (this.config.trackMemory && memorySamples.length > 0) {
      const peak = Math.max(...memorySamples);
      const average = memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length;
      const leak = memorySamples.length > 1
        ? memorySamples[memorySamples.length - 1] - memorySamples[0]
        : 0;

      memoryStats = {
        baseline: memoryBaseline,
        peak,
        average,
        leak
      };
    }

    const result: MCPBenchmarkResult = {
      serverName,
      toolName,
      timestamp: Date.now(),
      latency: latencyStats,
      throughput,
      memory: memoryStats,
      errors: {
        count: failedRequests,
        rate: totalRequests > 0 ? failedRequests / totalRequests : 0,
        types: errors
      },
      metadata: {
        warmupIterations: this.config.warmupIterations,
        benchmarkIterations: this.config.benchmarkIterations,
        concurrency: this.config.concurrency,
        duration
      }
    };

    // Store result
    const resultKey = `${serverName}:${toolName}`;
    this.benchmarks.set(resultKey, result);

    // Track historically
    if (this.config.historicalTracking) {
      this.historicalResults.push(result);
      // Keep only last 1000 results
      if (this.historicalResults.length > 1000) {
        this.historicalResults.shift();
      }
    }

    // Publish benchmark event
    await eventBus.publish({
      id: `mcp-benchmark-${Date.now()}-${resultKey}`,
      type: 'mcp.benchmark.completed',
      timestamp: Date.now(),
      source: 'mcp-benchmarker',
      payload: result
    } as LAPAEvent).catch(console.error);

    return result;
  }

  /**
   * Benchmark multiple tools in parallel
   */
  async benchmarkTools(
    connector: MCPConnector,
    serverName: string,
    tools: Array<{ name: string; args?: Record<string, unknown> }>,
    agentId?: string
  ): Promise<Map<string, MCPBenchmarkResult>> {
    const results = new Map<string, MCPBenchmarkResult>();

    await Promise.all(
      tools.map(async (tool) => {
        const result = await this.benchmarkTool(
          connector,
          serverName,
          tool.name,
          tool.args,
          agentId
        );
        results.set(tool.name, result);
      })
    );

    return results;
  }

  /**
   * Benchmark an entire MCP server
   */
  async benchmarkServer(
    connector: MCPConnector,
    serverName: string,
    agentId?: string
  ): Promise<Map<string, MCPBenchmarkResult>> {
    const tools = connector.getTools();
    
    const toolsToBenchmark = tools.map(name => ({
      name,
      args: this.getDefaultArgsForTool(name)
    }));

    return this.benchmarkTools(connector, serverName, toolsToBenchmark, agentId);
  }

  /**
   * Check performance against thresholds
   */
  checkPerformanceThresholds(result: MCPBenchmarkResult): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Latency checks
    if (result.latency.mean > this.thresholds.maxLatencyMs) {
      violations.push(`Mean latency ${result.latency.mean.toFixed(2)}ms exceeds threshold ${this.thresholds.maxLatencyMs}ms`);
    }
    if (result.latency.p95 > this.thresholds.maxP95LatencyMs) {
      violations.push(`P95 latency ${result.latency.p95.toFixed(2)}ms exceeds threshold ${this.thresholds.maxP95LatencyMs}ms`);
    }
    if (result.latency.p99 > this.thresholds.maxP99LatencyMs) {
      violations.push(`P99 latency ${result.latency.p99.toFixed(2)}ms exceeds threshold ${this.thresholds.maxP99LatencyMs}ms`);
    }

    // Throughput checks
    if (result.throughput.requestsPerSecond < this.thresholds.minThroughputRps) {
      violations.push(`Throughput ${result.throughput.requestsPerSecond.toFixed(2)} RPS below threshold ${this.thresholds.minThroughputRps} RPS`);
    }

    // Error rate checks
    if (result.errors.rate > this.thresholds.maxErrorRate) {
      violations.push(`Error rate ${(result.errors.rate * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.maxErrorRate * 100).toFixed(2)}%`);
    }

    // Memory checks
    if (result.memory && result.memory.peak > this.thresholds.maxMemoryMB * 1024 * 1024) {
      violations.push(`Peak memory ${(result.memory.peak / 1024 / 1024).toFixed(2)}MB exceeds threshold ${this.thresholds.maxMemoryMB}MB`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(currentResult: MCPBenchmarkResult): MCPPerformanceRegression[] {
    const regressions: MCPPerformanceRegression[] = [];
    const resultKey = `${currentResult.serverName}:${currentResult.toolName}`;

    // Find previous result
    const previousResults = this.historicalResults
      .filter(r => r.serverName === currentResult.serverName && r.toolName === currentResult.toolName)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (previousResults.length === 0) {
      return regressions; // No baseline to compare
    }

    const previousResult = previousResults[0];

    // Check latency regression
    if (currentResult.latency.mean > previousResult.latency.mean * 1.2) {
      const change = currentResult.latency.mean - previousResult.latency.mean;
      const changePercent = (change / previousResult.latency.mean) * 100;
      
      regressions.push({
        metric: 'latency.mean',
        currentValue: currentResult.latency.mean,
        previousValue: previousResult.latency.mean,
        change,
        changePercent,
        severity: changePercent > 100 ? 'critical' : changePercent > 50 ? 'high' : changePercent > 20 ? 'medium' : 'low'
      });
    }

    // Check throughput regression
    if (currentResult.throughput.requestsPerSecond < previousResult.throughput.requestsPerSecond * 0.8) {
      const change = currentResult.throughput.requestsPerSecond - previousResult.throughput.requestsPerSecond;
      const changePercent = (change / previousResult.throughput.requestsPerSecond) * 100;
      
      regressions.push({
        metric: 'throughput.rps',
        currentValue: currentResult.throughput.requestsPerSecond,
        previousValue: previousResult.throughput.requestsPerSecond,
        change,
        changePercent,
        severity: Math.abs(changePercent) > 50 ? 'critical' : Math.abs(changePercent) > 30 ? 'high' : 'medium'
      });
    }

    // Check error rate regression
    if (currentResult.errors.rate > previousResult.errors.rate * 1.5 && currentResult.errors.rate > 0.01) {
      const change = currentResult.errors.rate - previousResult.errors.rate;
      const changePercent = previousResult.errors.rate > 0 ? (change / previousResult.errors.rate) * 100 : 100;
      
      regressions.push({
        metric: 'errors.rate',
        currentValue: currentResult.errors.rate,
        previousValue: previousResult.errors.rate,
        change,
        changePercent,
        severity: currentResult.errors.rate > 0.1 ? 'critical' : currentResult.errors.rate > 0.05 ? 'high' : 'medium'
      });
    }

    // Check memory regression
    if (currentResult.memory && previousResult.memory && currentResult.memory.peak > previousResult.memory.peak * 1.3) {
      const change = currentResult.memory.peak - previousResult.memory.peak;
      const changePercent = (change / previousResult.memory.peak) * 100;
      
      regressions.push({
        metric: 'memory.peak',
        currentValue: currentResult.memory.peak,
        previousValue: previousResult.memory.peak,
        change,
        changePercent,
        severity: changePercent > 100 ? 'critical' : changePercent > 50 ? 'high' : 'medium'
      });
    }

    return regressions;
  }

  /**
   * Generate performance report
   */
  generateReport(results: Map<string, MCPBenchmarkResult>): string {
    const lines: string[] = [];
    lines.push('# MCP Performance Benchmark Report');
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    for (const [key, result] of results) {
      lines.push(`## ${result.serverName} - ${result.toolName}`);
      lines.push(`\n### Latency Statistics`);
      lines.push(`- Mean: ${result.latency.mean.toFixed(2)}ms`);
      lines.push(`- Median: ${result.latency.median.toFixed(2)}ms`);
      lines.push(`- P95: ${result.latency.p95.toFixed(2)}ms`);
      lines.push(`- P99: ${result.latency.p99.toFixed(2)}ms`);
      lines.push(`- Min: ${result.latency.min.toFixed(2)}ms`);
      lines.push(`- Max: ${result.latency.max.toFixed(2)}ms`);
      lines.push(`- Std Dev: ${result.latency.stdDev.toFixed(2)}ms`);

      lines.push(`\n### Throughput`);
      lines.push(`- Requests/Second: ${result.throughput.requestsPerSecond.toFixed(2)}`);
      lines.push(`- Total Requests: ${result.throughput.totalRequests}`);
      lines.push(`- Successful: ${result.throughput.successfulRequests}`);
      lines.push(`- Failed: ${result.throughput.failedRequests}`);

      if (result.memory) {
        lines.push(`\n### Memory Usage`);
        lines.push(`- Baseline: ${(result.memory.baseline / 1024 / 1024).toFixed(2)}MB`);
        lines.push(`- Peak: ${(result.memory.peak / 1024 / 1024).toFixed(2)}MB`);
        lines.push(`- Average: ${(result.memory.average / 1024 / 1024).toFixed(2)}MB`);
        lines.push(`- Leak: ${(result.memory.leak / 1024 / 1024).toFixed(2)}MB`);
      }

      lines.push(`\n### Error Rate`);
      lines.push(`- Rate: ${(result.errors.rate * 100).toFixed(2)}%`);
      lines.push(`- Count: ${result.errors.count}`);
      if (result.errors.types.size > 0) {
        lines.push(`- Error Types:`);
        for (const [type, count] of result.errors.types) {
          lines.push(`  - ${type}: ${count}`);
        }
      }

      // Check thresholds
      const thresholdCheck = this.checkPerformanceThresholds(result);
      if (!thresholdCheck.passed) {
        lines.push(`\n### ⚠️ Threshold Violations`);
        for (const violation of thresholdCheck.violations) {
          lines.push(`- ${violation}`);
        }
      }

      // Check regressions
      const regressions = this.detectRegressions(result);
      if (regressions.length > 0) {
        lines.push(`\n### ⚠️ Performance Regressions`);
        for (const regression of regressions) {
          lines.push(`- ${regression.metric}: ${regression.changePercent.toFixed(2)}% change (${regression.severity} severity)`);
        }
      }

      lines.push('\n---\n');
    }

    return lines.join('\n');
  }

  /**
   * Get benchmark result for a tool
   */
  getBenchmarkResult(serverName: string, toolName: string): MCPBenchmarkResult | undefined {
    return this.benchmarks.get(`${serverName}:${toolName}`);
  }

  /**
   * Get all benchmark results
   */
  getAllResults(): Map<string, MCPBenchmarkResult> {
    return new Map(this.benchmarks);
  }

  /**
   * Get historical results
   */
  getHistoricalResults(serverName?: string, toolName?: string): MCPBenchmarkResult[] {
    if (!serverName && !toolName) {
      return [...this.historicalResults];
    }

    return this.historicalResults.filter(r => {
      if (serverName && r.serverName !== serverName) return false;
      if (toolName && r.toolName !== toolName) return false;
      return true;
    });
  }

  // Private helper methods

  private calculateLatencyStats(latencies: number[]): MCPBenchmarkResult['latency'] {
    if (latencies.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        stdDev: 0
      };
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    const mean = sum / latencies.length;
    const variance = latencies.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / latencies.length;
    const stdDev = Math.sqrt(variance);

    const median = latencies[Math.floor(latencies.length / 2)];
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1];
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || latencies[latencies.length - 1];

    return {
      min: latencies[0],
      max: latencies[latencies.length - 1],
      mean,
      median,
      p50,
      p95,
      p99,
      stdDev
    };
  }

  private categorizeError(errorMessage: string): string {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('timeout')) return 'timeout';
    if (lower.includes('rate limit')) return 'rate_limit';
    if (lower.includes('validation') || lower.includes('invalid')) return 'validation';
    if (lower.includes('permission') || lower.includes('authorization')) return 'authorization';
    if (lower.includes('connection')) return 'connection';
    if (lower.includes('network')) return 'network';
    return 'unknown';
  }

  private getDefaultArgsForTool(toolName: string): Record<string, unknown> {
    // Provide sensible defaults for common tool patterns
    // This is a simple implementation; could be enhanced with tool schema introspection
    if (toolName.includes('read') || toolName.includes('get')) {
      return { limit: 10 };
    }
    if (toolName.includes('search') || toolName.includes('query')) {
      return { query: 'test' };
    }
    return {};
  }
}

// Export singleton instance
export const mcpBenchmarker = new MCPBenchmarker();

