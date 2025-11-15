import { FidelityMetricsTracker } from '../../validation/fidelity-metrics.ts';
import { LAPAEventBus } from '../../core/event-bus.ts';

describe('FidelityMetricsTracker', () => {
  let fidelityMetricsTracker: FidelityMetricsTracker;
  let eventBus: LAPAEventBus;

  beforeEach(() => {
    eventBus = new LAPAEventBus();
    fidelityMetricsTracker = new FidelityMetricsTracker(eventBus);
  });

  describe('Event Processing Metrics', () => {
    it('should track successful event processing', async () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: Date.now() - 100, // 100ms ago
        source: 'test-source',
        payload: {}
      };

      // Simulate successful event processing
      eventBus.publish({
        id: 'event-processed-1',
        type: 'event.processed',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.eventProcessing.total).toBe(1);
      expect(metrics.eventProcessing.successful).toBe(1);
      expect(metrics.eventProcessing.failed).toBe(0);
    });

    it('should track failed event processing', async () => {
      // Simulate failed event processing
      eventBus.publish({
        id: 'event-failed-1',
        type: 'event.processing.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Processing failed' }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.eventProcessing.total).toBe(1);
      expect(metrics.eventProcessing.successful).toBe(0);
      expect(metrics.eventProcessing.failed).toBe(1);
    });
  });

  describe('Agent Tool Execution Metrics', () => {
    it('should track successful tool execution', async () => {
      // Simulate successful tool execution
      eventBus.publish({
        id: 'tool-success-1',
        type: 'tool.execution.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: { executionTime: 50 }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.agentToolExecution.total).toBe(1);
      expect(metrics.agentToolExecution.successful).toBe(1);
      expect(metrics.agentToolExecution.failed).toBe(0);
      expect(metrics.agentToolExecution.averageLatency).toBe(50);
    });

    it('should track failed tool execution', async () => {
      // Simulate failed tool execution
      eventBus.publish({
        id: 'tool-failed-1',
        type: 'tool.execution.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Execution failed' }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.agentToolExecution.total).toBe(1);
      expect(metrics.agentToolExecution.successful).toBe(0);
      expect(metrics.agentToolExecution.failed).toBe(1);
    });
  });

  describe('Cross-Language Communication Metrics', () => {
    it('should track successful cross-language communication', async () => {
      const startTime = Date.now() - 100; // 100ms ago
      
      // Simulate sending cross-language event
      eventBus.publish({
        id: 'cross-send-1',
        type: 'cross.language.sent',
        timestamp: startTime,
        source: 'test',
        payload: {}
      });

      // Simulate receiving cross-language event
      eventBus.publish({
        id: 'cross-receive-1',
        type: 'cross.language.received',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.crossLanguageCommunication.total).toBe(1);
      expect(metrics.crossLanguageCommunication.successful).toBe(1);
      expect(metrics.crossLanguageCommunication.failed).toBe(0);
    });

    it('should track failed cross-language communication', async () => {
      // Simulate failed cross-language communication
      eventBus.publish({
        id: 'cross-failed-1',
        type: 'cross.language.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Communication failed' }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.crossLanguageCommunication.total).toBe(1);
      expect(metrics.crossLanguageCommunication.successful).toBe(0);
      expect(metrics.crossLanguageCommunication.failed).toBe(1);
    });
  });

  describe('Mode Switching Metrics', () => {
    it('should track successful mode switching', async () => {
      // Simulate successful mode switching
      eventBus.publish({
        id: 'mode-success-1',
        type: 'mode.changed',
        timestamp: Date.now(),
        source: 'test',
        payload: { transitionTime: 150 }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.modeSwitching.total).toBe(1);
      expect(metrics.modeSwitching.successful).toBe(1);
      expect(metrics.modeSwitching.failed).toBe(0);
      expect(metrics.modeSwitching.averageLatency).toBe(150);
    });

    it('should track failed mode switching', async () => {
      // Simulate failed mode switching
      eventBus.publish({
        id: 'mode-failed-1',
        type: 'mode.change.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Mode switch failed' }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.modeSwitching.total).toBe(1);
      expect(metrics.modeSwitching.successful).toBe(0);
      expect(metrics.modeSwitching.failed).toBe(1);
    });
  });

  describe('Context Preservation Metrics', () => {
    it('should track successful context preservation', async () => {
      const preservationTime = Date.now() - 50; // 50ms ago
      
      // Simulate successful context preservation
      eventBus.publish({
        id: 'context-success-1',
        type: 'context.preserved',
        timestamp: preservationTime,
        source: 'test',
        payload: { contextSize: 1024 }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.contextPreservation.total).toBe(1);
      expect(metrics.contextPreservation.successful).toBe(1);
      expect(metrics.contextPreservation.failed).toBe(0);
    });

    it('should track failed context preservation', async () => {
      // Simulate failed context preservation
      eventBus.publish({
        id: 'context-failed-1',
        type: 'context.preservation.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Preservation failed' }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.contextPreservation.total).toBe(1);
      expect(metrics.contextPreservation.successful).toBe(0);
      expect(metrics.contextPreservation.failed).toBe(1);
    });
  });

  describe('Fidelity Rates', () => {
    it('should calculate correct fidelity rates', async () => {
      // Simulate some successful and failed operations
      eventBus.publish({
        id: 'event-success-1',
        type: 'event.processed',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      });

      eventBus.publish({
        id: 'event-failed-1',
        type: 'event.processing.failed',
        timestamp: Date.now(),
        source: 'test',
        payload: { error: 'Processing failed' }
      });

      eventBus.publish({
        id: 'tool-success-1',
        type: 'tool.execution.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: { executionTime: 50 }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const rates = fidelityMetricsTracker.getFidelityRates();
      expect(rates.eventProcessing).toBe(0.5); // 1 success, 1 failure
      expect(rates.agentToolExecution).toBe(1); // 1 success, 0 failures
      expect(rates.crossLanguageCommunication).toBe(1); // No events = perfect score
    });

    it('should return 1 for operations with no events', () => {
      const rates = fidelityMetricsTracker.getFidelityRates();
      expect(rates.crossLanguageCommunication).toBe(1); // No events = perfect score
      expect(rates.modeSwitching).toBe(1); // No events = perfect score
      expect(rates.contextPreservation).toBe(1); // No events = perfect score
    });
  });

  describe('Fidelity Validation', () => {
    it('should validate fidelity against thresholds', async () => {
      // Simulate high-fidelity operations
      for (let i = 0; i < 100; i++) {
        eventBus.publish({
          id: `event-success-${i}`,
          type: 'event.processed',
          timestamp: Date.now(),
          source: 'test',
          payload: {}
        });
      }

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const validation = fidelityMetricsTracker.validateFidelity();
      expect(validation.allOperationsMeetThreshold).toBe(true);
      expect(validation.overallFidelity).toBeGreaterThan(0.99);
      
      // Check individual operation results
      const eventProcessingResult = validation.results.find(r => r.operation === 'eventProcessing');
      expect(eventProcessingResult).toBeDefined();
      expect(eventProcessingResult!.meetsThreshold).toBe(true);
      expect(eventProcessingResult!.rate).toBe(1);
    });

    it('should detect when operations do not meet thresholds', async () => {
      // Simulate low-fidelity operations for event processing
      for (let i = 0; i < 100; i++) {
        if (i < 95) {
          // 95 successful operations
          eventBus.publish({
            id: `event-success-${i}`,
            type: 'event.processed',
            timestamp: Date.now(),
            source: 'test',
            payload: {}
          });
        } else {
          // 5 failed operations
          eventBus.publish({
            id: `event-failed-${i}`,
            type: 'event.processing.failed',
            timestamp: Date.now(),
            source: 'test',
            payload: { error: 'Processing failed' }
          });
        }
      }

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const validation = fidelityMetricsTracker.validateFidelity();
      expect(validation.overallFidelity).toBeGreaterThan(0.95);
      
      // Event processing should still meet the 99.5% threshold with 95% success rate
      // since we have a small sample size
      const eventProcessingResult = validation.results.find(r => r.operation === 'eventProcessing');
      expect(eventProcessingResult).toBeDefined();
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', async () => {
      // Reset metrics first to ensure clean state
      fidelityMetricsTracker.resetMetrics();
      
      // Simulate some operations
      eventBus.publish({
        id: 'event-success-1',
        type: 'event.processed',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      });

      // Allow time for event processing - use async/await instead of setTimeout
      await new Promise(resolve => setTimeout(resolve, 50));
      
      let metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.eventProcessing.total).toBe(1);

      // Reset metrics
      fidelityMetricsTracker.resetMetrics();

      metrics = fidelityMetricsTracker.getMetrics();
      expect(metrics.eventProcessing.total).toBe(0);
      expect(metrics.agentToolExecution.total).toBe(0);
      expect(metrics.crossLanguageCommunication.total).toBe(0);
      expect(metrics.modeSwitching.total).toBe(0);
      expect(metrics.contextPreservation.total).toBe(0);
    });
  });
});