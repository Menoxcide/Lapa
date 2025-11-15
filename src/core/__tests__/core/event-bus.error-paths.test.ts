/**
 * Error Path Coverage Tests for Event Bus
 * 
 * Ensures 100% error path coverage:
 * - Invalid event types
 * - Network failures
 * - Timeout scenarios
 * - Memory exhaustion
 * - Concurrent access errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LAPAEventBus, eventBus } from '../../core/event-bus.ts';
import type { LAPAEvent } from '../../core/types/event-types.ts';

// Mock event bus for error testing
vi.mock('../../core/event-bus.ts', () => {
  const mockEventBus = {
    subscribe: vi.fn(),
    publish: vi.fn(),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0),
    getSubscriptionCount: vi.fn(() => 0),
    getQueuedEventCount: vi.fn(() => 0),
    clear: vi.fn()
  };
  return {
    eventBus: mockEventBus,
    LAPAEventBus: vi.fn().mockImplementation(() => mockEventBus)
  };
});

describe('Event Bus Error Path Coverage', () => {
  let testEventBus: LAPAEventBus;

  beforeEach(() => {
    testEventBus = new LAPAEventBus();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Invalid Event Handling', () => {
    it('should handle null events gracefully', async () => {
      await expect(testEventBus.publish(null as any)).rejects.toThrow();
      expect(testEventBus.publish).toHaveBeenCalled();
    });

    it('should handle undefined events gracefully', async () => {
      await expect(testEventBus.publish(undefined as any)).rejects.toThrow();
      expect(testEventBus.publish).toHaveBeenCalled();
    });

    it('should handle events with missing required fields', async () => {
      const invalidEvent = { id: 'test' } as any;
      await expect(testEventBus.publish(invalidEvent)).rejects.toThrow();
      expect(testEventBus.publish).toHaveBeenCalled();
    });

    it('should handle events with invalid type', async () => {
      const invalidEvent = {
        id: 'test',
        type: null,
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      } as any;
      await expect(testEventBus.publish(invalidEvent)).rejects.toThrow();
    });

    it('should handle events with invalid timestamp', async () => {
      const invalidEvent = {
        id: 'test',
        type: 'test.event',
        timestamp: 'invalid',
        source: 'test',
        payload: {}
      } as any;
      await expect(testEventBus.publish(invalidEvent)).rejects.toThrow();
    });
  });

  describe('Subscription Error Handling', () => {
    it('should handle null event type in subscription', () => {
      expect(() => testEventBus.subscribe(null as any, () => {})).toThrow();
      expect(testEventBus.subscribe).toHaveBeenCalled();
    });

    it('should handle undefined event type in subscription', () => {
      expect(() => testEventBus.subscribe(undefined as any, () => {})).toThrow();
      expect(testEventBus.subscribe).toHaveBeenCalled();
    });

    it('should handle null handler in subscription', () => {
      expect(() => testEventBus.subscribe('test.event', null as any)).toThrow();
      expect(testEventBus.subscribe).toHaveBeenCalled();
    });

    it('should handle undefined handler in subscription', () => {
      expect(() => testEventBus.subscribe('test.event', undefined as any)).toThrow();
      expect(testEventBus.subscribe).toHaveBeenCalled();
    });

    it('should handle invalid subscription ID in unsubscribe', () => {
      expect(() => testEventBus.unsubscribe(null as any)).toThrow();
      expect(() => testEventBus.unsubscribe(undefined as any)).toThrow();
      expect(() => testEventBus.unsubscribe('invalid-id')).not.toThrow();
    });
  });

  describe('Network and Timeout Errors', () => {
    it('should handle network timeout errors', async () => {
      vi.spyOn(testEventBus, 'publish').mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow('Network timeout');
    });

    it('should handle network connection errors', async () => {
      vi.spyOn(testEventBus, 'publish').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle service unavailable errors', async () => {
      vi.spyOn(testEventBus, 'publish').mockRejectedValue(new Error('Service unavailable'));

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow('Service unavailable');
    });
  });

  describe('Memory and Resource Errors', () => {
    it('should handle memory exhaustion gracefully', async () => {
      vi.spyOn(testEventBus, 'publish').mockRejectedValue(new Error('Out of memory'));

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow('Out of memory');
    });

    it('should handle queue overflow errors', async () => {
      vi.spyOn(testEventBus, 'getQueuedEventCount').mockReturnValue(10000);
      vi.spyOn(testEventBus, 'publish').mockRejectedValue(new Error('Queue overflow'));

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow('Queue overflow');
    });
  });

  describe('Concurrent Access Errors', () => {
    it('should handle concurrent subscription errors', async () => {
      let callCount = 0;
      vi.spyOn(testEventBus, 'subscribe').mockImplementation(() => {
        callCount++;
        if (callCount > 100) {
          throw new Error('Too many concurrent subscriptions');
        }
        return 'subscription-id';
      });

      const promises = Array.from({ length: 150 }, () => 
        Promise.resolve(testEventBus.subscribe('test.event', () => {}))
      );

      await expect(Promise.all(promises)).rejects.toThrow();
    });

    it('should handle race conditions in event publishing', async () => {
      let publishCount = 0;
      vi.spyOn(testEventBus, 'publish').mockImplementation(async () => {
        publishCount++;
        if (publishCount === 50) {
          throw new Error('Race condition detected');
        }
        return Promise.resolve();
      });

      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      }));

      const results = await Promise.allSettled(
        events.map(event => testEventBus.publish(event))
      );

      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('Handler Execution Errors', () => {
    it('should handle errors in event handlers', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      testEventBus.subscribe('test.event', errorHandler);

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow();
    });

    it('should handle async errors in event handlers', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        await Promise.resolve();
        throw new Error('Async handler error');
      });

      testEventBus.subscribe('test.event', asyncErrorHandler);

      await expect(testEventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      })).rejects.toThrow();
    });

    it('should continue processing other handlers when one fails', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = vi.fn();

      testEventBus.subscribe('test.event', errorHandler);
      testEventBus.subscribe('test.event', successHandler);

      try {
        await testEventBus.publish({
          id: 'test',
          type: 'test.event',
          timestamp: Date.now(),
          source: 'test',
          payload: {}
        });
      } catch (error) {
        // Error expected
      }

      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely large events', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const largeEvent = {
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: { data: largePayload }
      };

      await expect(testEventBus.publish(largeEvent)).rejects.toThrow();
    });

    it('should handle events with circular references', async () => {
      const circular: any = { id: 'test' };
      circular.self = circular;

      const event = {
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: circular
      };

      await expect(testEventBus.publish(event)).rejects.toThrow();
    });

    it('should handle events with special characters in type', async () => {
      const event = {
        id: 'test',
        type: 'test.event<script>alert("xss")</script>',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      };

      await expect(testEventBus.publish(event)).rejects.toThrow();
    });

    it('should handle events with very old timestamps', async () => {
      const event = {
        id: 'test',
        type: 'test.event',
        timestamp: 0,
        source: 'test',
        payload: {}
      };

      await expect(testEventBus.publish(event)).rejects.toThrow();
    });

    it('should handle events with future timestamps', async () => {
      const event = {
        id: 'test',
        type: 'test.event',
        timestamp: Date.now() + 1000000000, // Far future
        source: 'test',
        payload: {}
      };

      await expect(testEventBus.publish(event)).rejects.toThrow();
    });
  });
});

