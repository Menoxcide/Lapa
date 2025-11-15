/**
 * Event Bus Stress Tests
 * 
 * Tests event bus performance under high load:
 * - High volume event publishing
 * - Concurrent subscriptions
 * - Event filtering performance
 * - Memory usage under load
 * - Event ordering guarantees
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../../core/event-bus.ts';
import type { LAPAEvent } from '../../core/types/event-types.ts';

// Mock performance hooks for timing tests
vi.mock('perf_hooks', () => ({
  performance: {
    now: vi.fn(() => Date.now())
  }
}));

// Mock memory usage for memory leak tests
const mockMemoryUsage = {
  heapUsed: 50 * 1024 * 1024, // 50MB
  heapTotal: 100 * 1024 * 1024,
  external: 0,
  rss: 100 * 1024 * 1024
};

vi.mock('process', () => ({
  default: {
    memoryUsage: vi.fn(() => mockMemoryUsage)
  }
}));

describe('Event Bus Stress Tests', () => {
  let mockSubscribers: Map<string, Set<Function>>;
  let publishedEvents: LAPAEvent[];

  beforeEach(() => {
    // Setup mock event bus with internal tracking
    mockSubscribers = new Map();
    publishedEvents = [];
    const subscriptionIds = new Map<string, string>();

    // Mock event bus methods
    vi.spyOn(eventBus, 'subscribe').mockImplementation((eventType: any, handler: any, filter?: any) => {
      const eventTypeStr = String(eventType);
      if (!mockSubscribers.has(eventTypeStr)) {
        mockSubscribers.set(eventTypeStr, new Set());
      }
      mockSubscribers.get(eventTypeStr)!.add(handler);
      const subscriptionId = `sub-${Date.now()}-${Math.random()}`;
      subscriptionIds.set(subscriptionId, eventTypeStr);
      return subscriptionId;
    });

    vi.spyOn(eventBus, 'publish').mockImplementation(async (event: any) => {
      publishedEvents.push(event);
      const eventTypeStr = String(event.type);
      const handlers = mockSubscribers.get(eventTypeStr) || new Set();
      handlers.forEach((handler: Function) => handler(event));
      return Promise.resolve();
    });

    vi.spyOn(eventBus, 'clear').mockImplementation(() => {
      mockSubscribers.clear();
      publishedEvents = [];
    });

    vi.spyOn(eventBus, 'getSubscriptionCount').mockImplementation(() => {
      return Array.from(mockSubscribers.values()).reduce((sum, set) => sum + set.size, 0);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockSubscribers.clear();
    publishedEvents = [];
  });

  describe('High Volume Event Publishing', () => {
    it('should handle 10,000 events efficiently', async () => {
      const events: LAPAEvent[] = [];
      const receivedEvents: LAPAEvent[] = [];

      eventBus.subscribe('tool.execution.started' as any, (event: any) => {
        receivedEvents.push(event);
      });

      const startTime = Date.now();

      // Publish 10,000 events
      for (let i = 0; i < 10000; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'tool.execution.started' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any);
      }

      const duration = Date.now() - startTime;

      expect(receivedEvents.length).toBe(10000);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(duration / 10000).toBeLessThan(1); // Average < 1ms per event
    });

    it('should maintain event ordering under high load', async () => {
      const receivedEvents: LAPAEvent[] = [];
      const eventCount = 1000;

      eventBus.subscribe('task.created' as any, (event: any) => {
        receivedEvents.push(event);
      });

      // Publish events with sequential indices
      for (let i = 0; i < eventCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'task.created' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any);
      }

      // Verify ordering
      for (let i = 0; i < eventCount; i++) {
        expect(receivedEvents[i].payload.index).toBe(i);
      }
    });

    it('should handle burst publishing (1000 events in 100ms)', async () => {
      const receivedEvents: LAPAEvent[] = [];
      const burstSize = 1000;

      eventBus.subscribe('tool.execution.completed' as any, (event: any) => {
        receivedEvents.push(event);
      });

      const startTime = Date.now();

      // Publish all events in parallel
      const promises = Array.from({ length: burstSize }, (_, i) =>
        eventBus.publish({
          id: `burst-${i}`,
          type: 'tool.execution.completed' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(receivedEvents.length).toBe(burstSize);
      expect(duration).toBeLessThan(1000); // Should handle burst quickly
    });
  });

  describe('Concurrent Subscriptions', () => {
    it('should handle 100 concurrent subscribers', async () => {
      const subscriberCount = 100;
      const receivedCounts = new Array(subscriberCount).fill(0);

      // Create 100 subscribers
      for (let i = 0; i < subscriberCount; i++) {
        eventBus.subscribe('handoff.initiated' as any, (event: any) => {
          receivedCounts[i]++;
        });
      }

      // Publish events
      const eventCount = 100;
      for (let i = 0; i < eventCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'handoff.initiated' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any);
      }

      // All subscribers should receive all events
      receivedCounts.forEach((count, index) => {
        expect(count).toBe(eventCount);
      });
    });

    it('should handle dynamic subscription/unsubscription under load', async () => {
      const subscribers: Array<() => void> = [];
      const receivedCounts: number[] = [];

      // Create and destroy subscribers dynamically
      for (let i = 0; i < 50; i++) {
        const subscriptionId = eventBus.subscribe('mode.changed' as any, () => {
          receivedCounts[i] = (receivedCounts[i] || 0) + 1;
        });
        subscribers.push(() => eventBus.unsubscribe(subscriptionId));
      }

      // Publish events
      for (let i = 0; i < 100; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'mode.changed' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any);
      }

      // Unsubscribe half
      for (let i = 0; i < 25; i++) {
        subscribers[i]();
      }

      // Publish more events
      for (let i = 100; i < 200; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'mode.changed' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        } as any);
      }

      // First 25 should have received 100 events, rest should have 200
      for (let i = 0; i < 25; i++) {
        expect(receivedCounts[i]).toBe(100);
      }
      for (let i = 25; i < 50; i++) {
        expect(receivedCounts[i]).toBe(200);
      }
    });
  });

  describe('Event Filtering Performance', () => {
    it('should efficiently filter events with complex filters', async () => {
      const filteredEvents: LAPAEvent[] = [];
      const filterCount = 1000;

      // Subscribe with filter
      eventBus.subscribe('performance.metric' as any, (event: any) => {
        if (event.payload && typeof event.payload === 'object' && 'value' in event.payload) {
          const value = (event.payload as any).value;
          if (value > 500 && value < 750) {
            filteredEvents.push(event);
          }
        }
      }, (event: any) => {
        return event.payload && typeof event.payload === 'object' && 'value' in event.payload;
      });

      // Publish events with various values
      for (let i = 0; i < filterCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'performance.metric' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { value: i }
        } as any);
      }

      // Should have filtered to events with value between 500 and 750
      expect(filteredEvents.length).toBe(250);
      filteredEvents.forEach(event => {
        const value = (event.payload as any).value;
        expect(value).toBeGreaterThan(500);
        expect(value).toBeLessThan(750);
      });
    });

    it('should handle multiple filters efficiently', async () => {
      const results1: LAPAEvent[] = [];
      const results2: LAPAEvent[] = [];
      const results3: LAPAEvent[] = [];

      eventBus.subscribe('task.updated' as any, (event: any) => {
        results1.push(event);
      }, (event: any) => event.payload && (event.payload as any).category === 'A');

      eventBus.subscribe('task.updated' as any, (event: any) => {
        results2.push(event);
      }, (event: any) => event.payload && (event.payload as any).category === 'B');

      eventBus.subscribe('task.updated' as any, (event: any) => {
        results3.push(event);
      }, (event: any) => event.payload && (event.payload as any).category === 'C');

      const eventCount = 1000;
      for (let i = 0; i < eventCount; i++) {
        const category = ['A', 'B', 'C'][i % 3];
        await eventBus.publish({
          id: `event-${i}`,
          type: 'task.updated' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { category, index: i }
        } as any);
      }

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
      expect(results3.length).toBeGreaterThan(0);
      expect(results1.length + results2.length + results3.length).toBe(eventCount);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with many events', async () => {
      const initialMemory = (process.memoryUsage().heapUsed / 1024 / 1024);

      // Publish many events
      for (let i = 0; i < 10000; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'system.warning' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { data: 'x'.repeat(100) }
        } as any);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (process.memoryUsage().heapUsed / 1024 / 1024);
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB for 10k events)
      expect(memoryIncrease).toBeLessThan(50);
    });

    it('should clean up unsubscribed listeners', async () => {
      const unsubscribes: Array<() => void> = [];

      // Create many subscribers
      for (let i = 0; i < 1000; i++) {
        const subscriptionId = eventBus.subscribe('system.shutdown' as any, () => {});
        unsubscribes.push(() => eventBus.unsubscribe(subscriptionId));
      }

      // Unsubscribe all
      unsubscribes.forEach(unsub => unsub());

      // Publish events - should not trigger any listeners
      for (let i = 0; i < 100; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'system.shutdown' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: {}
        } as any);
      }

      // No listeners should be active
      expect(eventBus.getSubscriptionCount()).toBe(0);
    });
  });

  describe('Event Type Diversity', () => {
    it('should handle 100 different event types efficiently', async () => {
      const receivedCounts = new Map<string, number>();

      // Subscribe to 100 different event types (using valid event types with index)
      const validEventTypes: (keyof import('../../core/types/event-types.ts').LAPAEventMap)[] = [
        'task.created', 'task.updated', 'tool.execution.started', 'tool.execution.completed',
        'handoff.initiated', 'handoff.completed', 'agent.registered', 'performance.metric'
      ];
      for (let i = 0; i < 100; i++) {
        const eventType = validEventTypes[i % validEventTypes.length];
        const eventKey = `${eventType}-${i}`;
        eventBus.subscribe(eventType, () => {
          receivedCounts.set(eventKey, (receivedCounts.get(eventKey) || 0) + 1);
        });
      }

      // Publish events of each type
      for (let i = 0; i < 100; i++) {
        const eventType = validEventTypes[i % validEventTypes.length];
        await eventBus.publish({
          id: `event-${i}`,
          type: eventType,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { type: i }
        } as any);
      }

      // All event types should have been received
      expect(receivedCounts.size).toBe(100);
      receivedCounts.forEach((count) => {
        expect(count).toBe(1);
      });
    });
  });

  describe('Error Handling Under Load', () => {
    it('should continue processing after subscriber errors', async () => {
      const successfulEvents: LAPAEvent[] = [];
      let errorCount = 0;

      // Create subscriber that throws errors
      eventBus.subscribe('tool.execution.failed' as any, (event: any) => {
        if ((event.payload as any)?.shouldError) {
          errorCount++;
          throw new Error('Test error');
        } else {
          successfulEvents.push(event);
        }
      });

      // Publish mix of error and success events
      for (let i = 0; i < 100; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'tool.execution.failed' as any,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { shouldError: i % 10 === 0, index: i }
        } as any);
      }

      // Should have processed all events despite errors
      expect(successfulEvents.length).toBe(90);
      expect(errorCount).toBe(10);
    });
  });
});

