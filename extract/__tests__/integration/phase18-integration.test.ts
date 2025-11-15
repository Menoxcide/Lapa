/**
 * Phase 18 Integration Tests
 * 
 * Comprehensive test coverage for Phase 18: Benchmark Suite v2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Phase18Integration, phase18Integration } from '../../orchestrator/phase18-integration.ts';
import { eventBus } from '../../core/event-bus.ts';
import { PrometheusMetrics } from '../../observability/prometheus.ts';

describe('Phase 18 Integration', () => {
  let integration: Phase18Integration;

  beforeEach(() => {
    integration = new Phase18Integration({
      enableBenchmarkSuite: true,
      enablePrometheus: true,
      targetFidelity: 99.5
    });
  });

  afterEach(async () => {
    await integration.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(integration.initialize()).resolves.not.toThrow();
    });

    it('should initialize with default config', async () => {
      const defaultIntegration = new Phase18Integration();
      await expect(defaultIntegration.initialize()).resolves.not.toThrow();
      await defaultIntegration.cleanup();
    });

    it('should handle initialization errors gracefully', async () => {
      const badIntegration = new Phase18Integration({
        enablePrometheus: true,
        prometheusConfig: {
          enabled: true,
          prefix: 'lapa_'
        }
      });
      // Should not throw even if Prometheus fails
      await expect(badIntegration.initialize()).resolves.not.toThrow();
      await badIntegration.cleanup();
    });

    it('should get component status', async () => {
      await integration.initialize();
      const status = integration.getComponentStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('object');
    });
  });

  describe('Benchmark Suite', () => {
    it('should run benchmark suite', async () => {
      await integration.initialize();
      const results = await integration.runBenchmarkSuite();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should get performance metrics', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const metrics = await integration.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.handoffLatency).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.compressionRatio).toBeDefined();
      expect(metrics.eventThroughput).toBeDefined();
      expect(metrics.taskCompletionRate).toBeDefined();
      expect(metrics.overallFidelity).toBeDefined();
    });

    it('should get benchmark results', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const results = integration.getBenchmarkResults();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get historical results', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const historical = integration.getHistoricalResults();
      expect(historical).toBeDefined();
      expect(Array.isArray(historical)).toBe(true);
    });

    it('should detect regressions', async () => {
      await integration.initialize();
      // Run benchmarks multiple times to generate history
      await integration.runBenchmarkSuite();
      await integration.runBenchmarkSuite();
      const regressions = integration.detectRegressions();
      expect(regressions).toBeDefined();
      expect(Array.isArray(regressions)).toBe(true);
    });
  });

  describe('Prometheus Metrics', () => {
    it('should export Prometheus metrics', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const exportStr = integration.exportPrometheusMetrics();
      expect(exportStr).toBeDefined();
      expect(typeof exportStr).toBe('string');
      expect(exportStr.length).toBeGreaterThan(0);
    });

    it('should export metrics in Prometheus format', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const exportStr = integration.exportPrometheusMetrics();
      // Check for Prometheus format indicators
      expect(exportStr).toContain('# HELP');
      expect(exportStr).toContain('# TYPE');
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      await integration.initialize();
      await integration.runBenchmarkSuite();
      const stats = integration.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.components).toBeDefined();
      expect(typeof stats.benchmarkResults).toBe('number');
      expect(typeof stats.historicalResults).toBe('number');
      expect(typeof stats.regressions).toBe('number');
    });
  });

  describe('Event Integration', () => {
    it('should emit initialization event', async () => {
      let eventReceived = false;
      eventBus.subscribe('phase18.initialized' as any, () => {
        eventReceived = true;
      });

      await integration.initialize();
      // Give event time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(eventReceived).toBe(true);
    });

    it('should handle benchmark request events', async () => {
      await integration.initialize();
      let completed = false;
      eventBus.subscribe('benchmark.completed' as any, () => {
        completed = true;
      });

      await eventBus.publish({
        type: 'benchmark.request',
        payload: {}
      } as any);

      // Give event time to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(completed).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await integration.initialize();
      await expect(integration.cleanup()).resolves.not.toThrow();
    });

    it('should emit cleanup event', async () => {
      await integration.initialize();
      let eventReceived = false;
      eventBus.subscribe('phase18.cleanup' as any, () => {
        eventReceived = true;
      });

      await integration.cleanup();
      // Give event time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(eventReceived).toBe(true);
    });
  });

  describe('Default Export', () => {
    it('should export default integration instance', () => {
      expect(phase18Integration).toBeDefined();
      expect(phase18Integration).toBeInstanceOf(Phase18Integration);
    });
  });
});

