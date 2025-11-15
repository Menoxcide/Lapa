/**
 * Integration Tests for LAPA Core Event Bus
 * 
 * These tests verify the functionality of the event bus system, including
 * event publishing, subscription management, and performance characteristics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LAPAEventBus, eventBus } from '../../core/event-bus.ts';
import { 
  LAPAEventMap, 
  TaskCreatedEvent, 
  HandoffInitiatedEvent,
  SystemErrorEvent
} from '../../core/types/event-types.ts';
import { setupDefaultLAPARoutes } from '../../core/utils/event-router.ts';

// Mock performance.now for consistent timing tests
vi.mock('perf_hooks', () => ({
  performance: {
    now: vi.fn(() => Date.now())
  }
}));

let now = 0;

describe('LAPA Core Event Bus Integration', () => {
  let testEventBus: LAPAEventBus;

  beforeEach(() => {
    testEventBus = new LAPAEventBus();
    setupDefaultLAPARoutes();
    now = 0;
  });

  afterEach(() => {
    testEventBus.clear();
    vi.clearAllMocks();
  });

  describe('Event Publishing and Subscription', () => {
    it('should publish and receive events with <1s performance', async () => {
      // Record start time
      const startTime = now;
      
      // Create a test event
      const testEvent: TaskCreatedEvent = {
        id: 'test-event-1',
        type: 'task.created',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          taskId: 'task-123',
          description: 'Test task',
          type: 'integration-test',
          priority: 1,
          context: { test: true }
        }
      };

      // Set up a promise to capture the event
      const eventPromise = new Promise<TaskCreatedEvent>((resolve) => {
        testEventBus.subscribe('task.created', (event) => {
          resolve(event);
        });
      });

      // Publish the event
      await testEventBus.publish(testEvent);

      // Wait for the event to be received
      const receivedEvent = await eventPromise;

      // Record end time
      const endTime = now;
      const duration = endTime - startTime;

      // Verify the event was received correctly
      expect(receivedEvent).toEqual(testEvent);
      
      // Verify performance is <1s (1000ms)
      expect(duration).toBeLessThan(1000);
    }, 1000); // 1 second timeout

    it('should handle multiple concurrent events with <1s performance', async () => {
      // Record start time
      const startTime = now;
      
      // Create multiple test events
      const events: TaskCreatedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          id: `test-event-${i}`,
          type: 'task.created',
          timestamp: Date.now(),
          source: 'test-agent',
          payload: {
            taskId: `task-${i}`,
            description: `Test task ${i}`,
            type: 'concurrency-test',
            priority: i,
            context: { index: i }
          }
        });
      }

      // Set up promises to capture all events
      const eventPromises: Promise<TaskCreatedEvent>[] = [];
      for (let i = 0; i < 10; i++) {
        const promise = new Promise<TaskCreatedEvent>((resolve) => {
          testEventBus.subscribe('task.created', (event) => {
            if (event.payload.taskId === `task-${i}`) {
              resolve(event);
            }
          });
        });
        eventPromises.push(promise);
      }

      // Publish all events concurrently
      await Promise.all(events.map(event => testEventBus.publish(event)));

      // Wait for all events to be received
      const receivedEvents = await Promise.all(eventPromises);

      // Record end time
      const endTime = now;
      const duration = endTime - startTime;

      // Verify all events were received correctly
      expect(receivedEvents).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(receivedEvents[i]).toEqual(events[i]);
      }
      
      // Verify performance is <1s (1000ms)
      expect(duration).toBeLessThan(1000);
    }, 1000); // 1 second timeout

    it('should route events to appropriate targets', async () => {
      // Create a handoff event
      const handoffEvent: HandoffInitiatedEvent = {
        id: 'handoff-event-1',
        type: 'handoff.initiated',
        timestamp: Date.now(),
        source: 'source-agent',
        payload: {
          sourceAgentId: 'source-agent',
          targetAgentId: 'target-agent',
          taskId: 'task-456',
          context: { data: 'test' },
          priority: 'medium'
        }
      };

      // Set up a promise to capture the routed event
      const routedEventPromise = new Promise<HandoffInitiatedEvent>((resolve) => {
        testEventBus.subscribe('handoff.initiated', (event) => {
          resolve(event);
        });
      });

      // Publish the event
      await testEventBus.publish(handoffEvent);

      // Wait for the event to be received
      const routedEvent = await routedEventPromise;

      // Verify the event was routed correctly
      expect(routedEvent.target).toBe('target-agent');
    });

    it('should handle system errors and broadcast to all agents', async () => {
      // Create a system error event
      const errorEvent: SystemErrorEvent = {
        id: 'error-event-1',
        type: 'system.error',
        timestamp: Date.now(),
        source: 'test-component',
        payload: {
          error: 'Test error',
          component: 'test-component'
        }
      };

      // Set up a promise to capture the error event
      const errorEventPromise = new Promise<SystemErrorEvent>((resolve) => {
        testEventBus.subscribe('system.error', (event) => {
          resolve(event);
        });
      });

      // Publish the error event
      await testEventBus.publish(errorEvent);

      // Wait for the event to be received
      const receivedErrorEvent = await errorEventPromise;

      // Verify the error event was broadcast correctly
      expect(receivedErrorEvent.target).toBe('all-agents');
    });
  });

  describe('Subscription Management', () => {
    it('should manage subscriptions correctly', async () => {
      // Initial subscription count should be 0
      expect(testEventBus.getSubscriptionCount()).toBe(0);
      expect(typeof testEventBus.getSubscriptionCount).toBe('function');

      // Subscribe to an event type
      const subscriptionId = testEventBus.subscribe('task.created', () => {});
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');

      // Subscription count should be 1
      expect(testEventBus.getSubscriptionCount()).toBe(1);
      expect(testEventBus.getSubscriptionCount()).toBeGreaterThan(0);

      // Unsubscribe
      testEventBus.unsubscribe(subscriptionId);

      // Subscription count should be 0 again
      expect(testEventBus.getSubscriptionCount()).toBe(0);
      expect(testEventBus.getSubscriptionCount()).toBeLessThan(1);
    });

    it('should apply filters to subscriptions', async () => {
      // Counter for received events
      let receivedEventCount = 0;

      // Subscribe with a filter that only accepts high priority tasks
      testEventBus.subscribe('task.created', () => {
        receivedEventCount++;
      }, (event) => event.payload.priority > 5);

      // Create low priority event
      const lowPriorityEvent: TaskCreatedEvent = {
        id: 'low-priority-event',
        type: 'task.created',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          taskId: 'low-priority-task',
          description: 'Low priority task',
          type: 'filter-test',
          priority: 3,
          context: {}
        }
      };

      // Create high priority event
      const highPriorityEvent: TaskCreatedEvent = {
        id: 'high-priority-event',
        type: 'task.created',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          taskId: 'high-priority-task',
          description: 'High priority task',
          type: 'filter-test',
          priority: 8,
          context: {}
        }
      };

      // Publish both events
      await testEventBus.publish(lowPriorityEvent);
      await testEventBus.publish(highPriorityEvent);

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Only the high priority event should have been received
      expect(receivedEventCount).toBe(1);
    });
  });

  describe('Event Queue Management', () => {
    it('should queue events when exceeding maximum concurrent events', async () => {
      // Configure event bus with very low concurrent limit
      const limitedEventBus = new LAPAEventBus({ maxConcurrentEvents: 1 });

      // Initially queue should be empty
      expect(limitedEventBus.getQueuedEventCount()).toBe(0);

      // Create multiple events
      const events: TaskCreatedEvent[] = [];
      for (let i = 0; i < 5; i++) {
        events.push({
          id: `queued-event-${i}`,
          type: 'task.created',
          timestamp: Date.now(),
          source: 'test-agent',
          payload: {
            taskId: `queued-task-${i}`,
            description: `Queued task ${i}`,
            type: 'queue-test',
            priority: 1,
            context: {}
          }
        });
      }

      // Publish all events - first one should process, others should queue
      const publishPromises = events.map(event => limitedEventBus.publish(event));
      
      // Allow time for initial processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Some events should be queued
      expect(limitedEventBus.getQueuedEventCount()).toBeGreaterThan(0);

      // Wait for all events to be processed
      await Promise.all(publishPromises);

      // Queue should be empty now
      expect(limitedEventBus.getQueuedEventCount()).toBe(0);

      // Clean up
      limitedEventBus.clear();
    });
  });

  describe('Cross-Language Compatibility', () => {
    it('should serialize and deserialize events for interop', async () => {
      // Import the serialization functions
      const { serializeEventForInterop, deserializeEventFromInterop } = await import('../../core/types/event-types.js');

      // Create a test event
      const testEvent: TaskCreatedEvent = {
        id: 'interop-test-event',
        type: 'task.created',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          taskId: 'interop-task',
          description: 'Interop test task',
          type: 'interop-test',
          priority: 5,
          context: { test: true, value: 42 }
        },
        metadata: {
          version: '1.0',
          test: true
        }
      };

      // Serialize for interop
      const serializedEvent = serializeEventForInterop(testEvent);

      // Verify serialization
      expect(serializedEvent.id).toBe(testEvent.id);
      expect(serializedEvent.type).toBe(testEvent.type);
      expect(serializedEvent.timestamp).toBe(testEvent.timestamp);
      expect(serializedEvent.source).toBe(testEvent.source);
      expect(typeof serializedEvent.payload).toBe('string'); // Should be serialized JSON
      expect(serializedEvent.metadata).toBeDefined();

      // Deserialize from interop
      const deserializedEvent = deserializeEventFromInterop(serializedEvent);

      // Verify deserialization
      expect(deserializedEvent).toEqual(testEvent);
    });
  });
});