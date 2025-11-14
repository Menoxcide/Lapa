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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../../core/event-bus.ts';
import type { LAPAEvent } from '../../core/types/event-types.ts';

describe('Event Bus Stress Tests', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    eventBus.removeAllListeners();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('High Volume Event Publishing', () => {
    it('should handle 10,000 events efficiently', async () => {
      const events: LAPAEvent[] = [];
      const receivedEvents: LAPAEvent[] = [];

      eventBus.subscribe('test.event', (event) => {
        receivedEvents.push(event);
      });

      const startTime = Date.now();

      // Publish 10,000 events
      for (let i = 0; i < 10000; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'test.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        });
      }

      const duration = Date.now() - startTime;

      expect(receivedEvents.length).toBe(10000);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(duration / 10000).toBeLessThan(1); // Average < 1ms per event
    });

    it('should maintain event ordering under high load', async () => {
      const receivedEvents: LAPAEvent[] = [];
      const eventCount = 1000;

      eventBus.subscribe('ordered.event', (event) => {
        receivedEvents.push(event);
      });

      // Publish events with sequential indices
      for (let i = 0; i < eventCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'ordered.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        });
      }

      // Verify ordering
      for (let i = 0; i < eventCount; i++) {
        expect(receivedEvents[i].payload.index).toBe(i);
      }
    });

    it('should handle burst publishing (1000 events in 100ms)', async () => {
      const receivedEvents: LAPAEvent[] = [];
      const burstSize = 1000;

      eventBus.subscribe('burst.event', (event) => {
        receivedEvents.push(event);
      });

      const startTime = Date.now();

      // Publish all events in parallel
      const promises = Array.from({ length: burstSize }, (_, i) =>
        eventBus.publish({
          id: `burst-${i}`,
          type: 'burst.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        })
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
        eventBus.subscribe('concurrent.event', (event) => {
          receivedCounts[i]++;
        });
      }

      // Publish events
      const eventCount = 100;
      for (let i = 0; i < eventCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'concurrent.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        });
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
        const unsubscribe = eventBus.subscribe('dynamic.event', () => {
          receivedCounts[i] = (receivedCounts[i] || 0) + 1;
        });
        subscribers.push(unsubscribe);
      }

      // Publish events
      for (let i = 0; i < 100; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'dynamic.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        });
      }

      // Unsubscribe half
      for (let i = 0; i < 25; i++) {
        subscribers[i]();
      }

      // Publish more events
      for (let i = 100; i < 200; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'dynamic.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { index: i }
        });
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
      eventBus.subscribe('filtered.event', (event) => {
        if (event.payload && typeof event.payload === 'object' && 'value' in event.payload) {
          const value = (event.payload as any).value;
          if (value > 500 && value < 750) {
            filteredEvents.push(event);
          }
        }
      }, (event) => {
        return event.payload && typeof event.payload === 'object' && 'value' in event.payload;
      });

      // Publish events with various values
      for (let i = 0; i < filterCount; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'filtered.event',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { value: i }
        });
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

      eventBus.subscribe('multi.filter', (event) => {
        results1.push(event);
      }, (event) => event.payload && (event.payload as any).category === 'A');

      eventBus.subscribe('multi.filter', (event) => {
        results2.push(event);
      }, (event) => event.payload && (event.payload as any).category === 'B');

      eventBus.subscribe('multi.filter', (event) => {
        results3.push(event);
      }, (event) => event.payload && (event.payload as any).category === 'C');

      const eventCount = 1000;
      for (let i = 0; i < eventCount; i++) {
        const category = ['A', 'B', 'C'][i % 3];
        await eventBus.publish({
          id: `event-${i}`,
          type: 'multi.filter',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { category, index: i }
        });
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
          type: 'memory.test',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { data: 'x'.repeat(100) }
        });
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
        const unsubscribe = eventBus.subscribe('cleanup.test', () => {});
        unsubscribes.push(unsubscribe);
      }

      // Unsubscribe all
      unsubscribes.forEach(unsub => unsub());

      // Publish events - should not trigger any listeners
      for (let i = 0; i < 100; i++) {
        await eventBus.publish({
          id: `event-${i}`,
          type: 'cleanup.test',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: {}
        });
      }

      // No listeners should be active
      expect(eventBus.listenerCount('cleanup.test')).toBe(0);
    });
  });

  describe('Event Type Diversity', () => {
    it('should handle 100 different event types efficiently', async () => {
      const receivedCounts = new Map<string, number>();

      // Subscribe to 100 different event types
      for (let i = 0; i < 100; i++) {
        const eventType = `diverse.event.${i}`;
        eventBus.subscribe(eventType, () => {
          receivedCounts.set(eventType, (receivedCounts.get(eventType) || 0) + 1);
        });
      }

      // Publish events of each type
      for (let i = 0; i < 100; i++) {
        const eventType = `diverse.event.${i}`;
        await eventBus.publish({
          id: `event-${i}`,
          type: eventType,
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { type: i }
        });
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
      eventBus.subscribe('error.test', (event) => {
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
          type: 'error.test',
          timestamp: Date.now(),
          source: 'stress-test',
          payload: { shouldError: i % 10 === 0, index: i }
        });
      }

      // Should have processed all events despite errors
      expect(successfulEvents.length).toBe(90);
      expect(errorCount).toBe(10);
    });
  });
});

