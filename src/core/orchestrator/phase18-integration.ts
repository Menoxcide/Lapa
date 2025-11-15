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

import { BenchmarkSuiteV2, getBenchmarkSuiteV2, type BenchmarkResult, type PerformanceMetrics } from '../observability/bench-v2.ts';
import { PrometheusMetrics } from '../observability/prometheus.ts';
import { eventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../types/event-types.ts';

/**
 * Phase 18 integration configuration
 */
export interface Phase18Config {
  enableBenchmarkSuite?: boolean;
  enablePrometheus?: boolean;
  enableGrafana?: boolean;
  targetFidelity?: number;
  enableRegressionDetection?: boolean;
  historicalTracking?: boolean;
  prometheusConfig?: {
    enabled: boolean;
    prefix?: string;
  };
}

/**
 * Phase 18 Integration
 */
export class Phase18Integration {
  private config: Phase18Config;
  private benchmarkSuite?: BenchmarkSuiteV2;
  private prometheusMetrics?: PrometheusMetrics;
  private initialized: boolean = false;
  private componentStatus: Map<string, { enabled: boolean; error?: string }> = new Map();

  constructor(config: Phase18Config = {}) {
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
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize Prometheus metrics
      if (this.config.enablePrometheus) {
        try {
          this.prometheusMetrics = new PrometheusMetrics(
            this.config.prometheusConfig!,
            eventBus
          );
          this.componentStatus.set('prometheus', { enabled: true });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.componentStatus.set('prometheus', { enabled: false, error: errorMsg });
          console.warn('Prometheus metrics initialization failed:', errorMsg);
        }
      }

      // Initialize benchmark suite
      if (this.config.enableBenchmarkSuite) {
        try {
          this.benchmarkSuite = getBenchmarkSuiteV2({
            enabled: true,
            prometheusMetrics: this.prometheusMetrics,
            eventBus: eventBus,
            targetFidelity: this.config.targetFidelity,
            enableRegressionDetection: this.config.enableRegressionDetection,
            historicalTracking: this.config.historicalTracking
          });
          this.componentStatus.set('benchmarkSuite', { enabled: true });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.componentStatus.set('benchmarkSuite', { enabled: false, error: errorMsg });
          console.warn('Benchmark suite initialization failed:', errorMsg);
        }
      }

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;

      // Emit initialization event
      await eventBus.publish({
        type: 'phase18.initialized',
        payload: {
          components: Object.fromEntries(this.componentStatus),
          timestamp: Date.now()
        }
      } as LAPAEvent);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Phase 18 initialization failed: ${errorMsg}`);
    }
  }

  /**
   * Setup event listeners for automatic workflow triggers
   */
  private setupEventListeners(): void {
    // Listen for benchmark requests
    eventBus.subscribe('benchmark.request' as any, async (event: LAPAEvent) => {
      if (this.benchmarkSuite) {
        try {
          const results = await this.benchmarkSuite.runBenchmarkSuite();
          await eventBus.publish({
            type: 'benchmark.completed',
            payload: { results }
          } as LAPAEvent);
        } catch (error) {
          await eventBus.publish({
            type: 'benchmark.failed',
            payload: { error: error instanceof Error ? error.message : String(error) }
          } as LAPAEvent);
        }
      }
    });
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
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
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
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
  exportPrometheusMetrics(): string {
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
  getBenchmarkResults(): BenchmarkResult[] {
    if (!this.benchmarkSuite) {
      return [];
    }
    return this.benchmarkSuite.getResults();
  }

  /**
   * Get historical benchmark results
   */
  getHistoricalResults(): BenchmarkResult[] {
    if (!this.benchmarkSuite) {
      return [];
    }
    return this.benchmarkSuite.getHistoricalResults();
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(): Array<{ benchmark: string; regression: string }> {
    if (!this.benchmarkSuite) {
      return [];
    }
    return this.benchmarkSuite.detectRegressions();
  }

  /**
   * Get component status
   */
  getComponentStatus(): Record<string, { enabled: boolean; error?: string }> {
    return Object.fromEntries(this.componentStatus);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    components: Record<string, { enabled: boolean; error?: string }>;
    benchmarkResults: number;
    historicalResults: number;
    regressions: number;
  } {
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
  async cleanup(): Promise<void> {
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
    await eventBus.publish({
      type: 'phase18.cleanup',
      payload: { timestamp: Date.now() }
    } as LAPAEvent);
  }
}

/**
 * Default Phase 18 integration instance (lazy initialization)
 */
let defaultPhase18Integration: Phase18Integration | null = null;

/**
 * Get or create default Phase 18 integration
 */
export function getPhase18Integration(config?: Phase18Config): Phase18Integration {
  if (!defaultPhase18Integration) {
    defaultPhase18Integration = new Phase18Integration(config);
  }
  return defaultPhase18Integration;
}

/**
 * Default export for convenience
 */
export const phase18Integration = getPhase18Integration();

