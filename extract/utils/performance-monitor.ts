/**
 * Performance Monitoring Utility
 * 
 * Tracks and reports performance metrics for optimization verification.
 * Provides real-time monitoring and historical analysis.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetric[];
  summary: {
    memoryUsage: number;
    cpuUsage: number;
    latency: number;
    cacheHitRate: number;
  };
}

/**
 * Performance Monitor
 * 
 * Tracks performance metrics for optimization verification
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics
  private snapshots: PerformanceSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 100; // Keep last 100 snapshots
  private startTime: number = Date.now();

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.recordMetric('memory.heapUsed', usage.heapUsed, 'bytes', { type: 'heap' });
      this.recordMetric('memory.heapTotal', usage.heapTotal, 'bytes', { type: 'heap' });
      this.recordMetric('memory.rss', usage.rss, 'bytes', { type: 'rss' });
      this.recordMetric('memory.external', usage.external, 'bytes', { type: 'external' });
    }
  }

  /**
   * Record latency for an operation
   */
  recordLatency(operation: string, latency: number): void {
    this.recordMetric(`latency.${operation}`, latency, 'ms', { operation });
  }

  /**
   * Record cache hit rate
   */
  recordCacheHitRate(cacheName: string, hitRate: number): void {
    this.recordMetric(`cache.${cacheName}.hitRate`, hitRate, 'percent', { cache: cacheName });
  }

  /**
   * Create a performance snapshot
   */
  createSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // Last minute

    // Calculate summary metrics
    const memoryMetrics = recentMetrics.filter(m => m.name.startsWith('memory.'));
    const latencyMetrics = recentMetrics.filter(m => m.name.startsWith('latency.'));
    const cacheMetrics = recentMetrics.filter(m => m.name.includes('hitRate'));

    const memoryUsage = memoryMetrics
      .filter(m => m.name === 'memory.heapUsed')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(memoryMetrics.length, 1);

    const avgLatency = latencyMetrics.length > 0
      ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
      : 0;

    const avgCacheHitRate = cacheMetrics.length > 0
      ? cacheMetrics.reduce((sum, m) => sum + m.value, 0) / cacheMetrics.length
      : 0;

    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      metrics: recentMetrics,
      summary: {
        memoryUsage,
        cpuUsage: 0, // Would need system metrics for this
        latency: avgLatency,
        cacheHitRate: avgCacheHitRate
      }
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }

    return snapshot;
  }

  /**
   * Get performance report
   */
  getReport(): {
    uptime: number;
    totalMetrics: number;
    recentSnapshot?: PerformanceSnapshot;
    trends: {
      memoryTrend: 'increasing' | 'decreasing' | 'stable';
      latencyTrend: 'increasing' | 'decreasing' | 'stable';
      cacheHitRateTrend: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    const recentSnapshot = this.snapshots[this.snapshots.length - 1];
    const previousSnapshot = this.snapshots[this.snapshots.length - 2];

    let memoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let latencyTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let cacheHitRateTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (recentSnapshot && previousSnapshot) {
      const memoryDiff = recentSnapshot.summary.memoryUsage - previousSnapshot.summary.memoryUsage;
      const latencyDiff = recentSnapshot.summary.latency - previousSnapshot.summary.latency;
      const cacheDiff = recentSnapshot.summary.cacheHitRate - previousSnapshot.summary.cacheHitRate;

      memoryTrend = Math.abs(memoryDiff) < 1000 ? 'stable' : (memoryDiff > 0 ? 'increasing' : 'decreasing');
      latencyTrend = Math.abs(latencyDiff) < 10 ? 'stable' : (latencyDiff > 0 ? 'increasing' : 'decreasing');
      cacheHitRateTrend = Math.abs(cacheDiff) < 1 ? 'stable' : (cacheDiff > 0 ? 'increasing' : 'decreasing');
    }

    return {
      uptime: Date.now() - this.startTime,
      totalMetrics: this.metrics.length,
      recentSnapshot,
      trends: {
        memoryTrend,
        latencyTrend,
        cacheHitRateTrend
      }
    };
  }

  /**
   * Check if performance meets quality gates
   */
  checkQualityGates(): {
    passed: boolean;
    results: {
      latency: { passed: boolean; value: number; target: number };
      memory: { passed: boolean; value: number; target: number };
      cacheHitRate: { passed: boolean; value: number; target: number };
    };
  } {
    const snapshot = this.createSnapshot();
    const summary = snapshot.summary;

    const latencyTarget = 1000; // 1 second
    const memoryTarget = 500 * 1024 * 1024; // 500MB
    const cacheHitRateTarget = 90; // 90%

    const results = {
      latency: {
        passed: summary.latency < latencyTarget,
        value: summary.latency,
        target: latencyTarget
      },
      memory: {
        passed: summary.memoryUsage < memoryTarget,
        value: summary.memoryUsage,
        target: memoryTarget
      },
      cacheHitRate: {
        passed: summary.cacheHitRate >= cacheHitRateTarget,
        value: summary.cacheHitRate,
        target: cacheHitRateTarget
      }
    };

    const passed = results.latency.passed && results.memory.passed && results.cacheHitRate.passed;

    return { passed, results };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.snapshots = [];
    this.startTime = Date.now();
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  getAverageMetric(name: string, timeWindow?: number): number {
    let metrics = this.getMetricsByName(name);
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      metrics = metrics.filter(m => m.timestamp >= cutoff);
    }

    if (metrics.length === 0) {
      return 0;
    }

    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-record memory usage every 30 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceMonitor.recordMemoryUsage();
  }, 30000); // Every 30 seconds
}

