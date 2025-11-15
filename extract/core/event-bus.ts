/**
 * AutoGen Core Event Bus for LAPA v1.2 Phase 10
 * 
 * This module implements a typed pub-sub messaging system for agent communication
 * within the LAPA swarm. It maintains local-first principles while enabling
 * seamless integration with existing swarm orchestration mechanisms.
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// Event type definitions
import type { LAPAEvent, LAPAEventMap } from './types/event-types.js';

// Event routing utilities
import { routeEvent } from './utils/event-router.js';

// Subscription management
interface Subscription {
  eventId: string;
  listener: (...args: any[]) => void;
  filter?: (event: LAPAEvent) => boolean;
}

// Event bus configuration
interface EventBusConfig {
  enableLocalFirst: boolean;
  maxConcurrentEvents: number;
  eventTTL: number; // Time to live in milliseconds
  enableEventCompression: boolean;
}

// Default configuration
const DEFAULT_CONFIG: EventBusConfig = {
  enableLocalFirst: true,
  maxConcurrentEvents: 1000,
  eventTTL: 60000, // 1 minute
  enableEventCompression: true
};

/**
 * LAPA Core Event Bus
 * Implements a typed pub-sub messaging system for agent communication
 */
export class LAPAEventBus {
  private emitter: EventEmitter;

  public emit(event: string | symbol, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): LAPAEventBus {
    return this as LAPAEventBus;
  }
  private subscriptions: Map<string, Subscription>;
  private config: EventBusConfig;
  private eventQueue: LAPAEvent[];
  private activeEventCount: number;
  private eventTimers: Map<string, NodeJS.Timeout>;
  private readonly MAX_QUEUE_SIZE: number = 1000; // Bounded queue limit

  constructor(config?: Partial<EventBusConfig>) {
    this.emitter = new EventEmitter();
    this.subscriptions = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventQueue = [];
    this.activeEventCount = 0;
    this.eventTimers = new Map();
    
    // Set maximum listeners to handle high-volume event scenarios
    this.emitter.setMaxListeners(this.config.maxConcurrentEvents);
  }

  /**
   * Publishes an event to the bus
   * @param event The event to publish
   * @returns Promise that resolves when the event is published
   */
  async publish<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): Promise<void> {
    // Check if we've exceeded maximum concurrent events
    if (this.activeEventCount >= this.config.maxConcurrentEvents) {
      // Bounded queue with backpressure: drop oldest events if queue is full
      if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
        // Drop oldest event (FIFO) to prevent unbounded growth
        const droppedEvent = this.eventQueue.shift();
        if (droppedEvent) {
          // Emit warning event for monitoring
          this.emitter.emit('event.dropped', { 
            eventId: droppedEvent.id, 
            type: droppedEvent.type,
            reason: 'queue_full'
          });
        }
      }
      // Queue the event for later processing
      this.eventQueue.push(event);
      return;
    }

    // Increment active event counter
    this.activeEventCount++;

    try {
      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = Date.now();
      }

      // Add event ID if not present
      if (!event.id) {
        event.id = this.generateEventId();
      }

      // Set up TTL timer for the event
      this.setupEventTTL(event.id);

      // Route event based on type and filters
      const routedEvent = await routeEvent(event);

      // Emit the event
      this.emitter.emit(event.type, routedEvent);

      // Process queued events if any
      this.processQueuedEvents();
    } finally {
      // Decrement active event counter
      this.activeEventCount--;
    }
  }

  /**
   * Subscribes to events of a specific type
   * @param eventType The type of event to subscribe to
   * @param listener The listener function to call when events are emitted
   * @param filter Optional filter function to determine which events to process
   * @returns Subscription ID
   */
  subscribe<T extends keyof LAPAEventMap>(
    eventType: T,
    listener: (event: LAPAEventMap[T]) => void,
    filter?: (event: LAPAEventMap[T]) => boolean
  ): string {
    const eventId = this.generateEventId();
    
    // Wrap the listener with filter logic if provided
    const wrappedListener = (event: LAPAEventMap[T]) => {
      // Apply filter if provided
      if (filter && !filter(event)) {
        return;
      }
      
      // Call the original listener
      listener(event);
    };

    // Add the listener to the emitter
    this.emitter.on(eventType, wrappedListener);

    // Store subscription information
    this.subscriptions.set(eventId, {
      eventId,
      listener: wrappedListener,
      filter
    });

    return eventId;
  }

  /**
   * Unsubscribes from events
   * @param subscriptionId The subscription ID to unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      // Remove the listener from the emitter
      this.emitter.removeListener(subscription.eventId, subscription.listener);
      
      // Remove the subscription
      this.subscriptions.delete(subscriptionId);
      
      // Clear any TTL timer for this subscription
      if (this.eventTimers.has(subscriptionId)) {
        clearTimeout(this.eventTimers.get(subscriptionId)!);
        this.eventTimers.delete(subscriptionId);
      }
    }
  }

  /**
   * Gets the current number of active subscriptions
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Gets the current number of queued events
   * @returns Number of queued events
   */
  getQueuedEventCount(): number {
    return this.eventQueue.length;
  }

  /**
   * Gets the current number of active events
   * @returns Number of active events
   */
  getActiveEventCount(): number {
    return this.activeEventCount;
  }

  /**
   * Updates the event bus configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<EventBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update maximum listeners if needed
    if (newConfig.maxConcurrentEvents) {
      this.emitter.setMaxListeners(newConfig.maxConcurrentEvents);
    }
  }

  /**
   * Gets the current configuration
   * @returns Current configuration
   */
  getConfig(): EventBusConfig {
    return { ...this.config };
  }

  /**
   * Flushes all queued events
   * @returns Promise that resolves when all events are processed
   */
  async flush(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        await this.publish(event);
      }
    }
  }

  /**
   * Clears all subscriptions and queued events
   * Optimized to prevent memory leaks
   */
  clear(): void {
    // Clear all subscriptions
    const subscriptionIds = Array.from(this.subscriptions.keys());
    for (const subscriptionId of subscriptionIds) {
      this.unsubscribe(subscriptionId);
    }
    this.subscriptions.clear();
    
    // Clear event queue (optimized: set length to 0 for faster GC)
    this.eventQueue.length = 0;
    
    // Clear all timers (optimized: clear all at once)
    const timers = Array.from(this.eventTimers.values());
    for (const timer of timers) {
      clearTimeout(timer);
    }
    this.eventTimers.clear();
    
    // Reset active event count
    this.activeEventCount = 0;
    
    // Remove all listeners from emitter to prevent memory leaks
    this.emitter.removeAllListeners();
  }

  /**
   * Generates a unique event ID
   * @returns Unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sets up TTL for an event
   * @param eventId The event ID
   */
  private setupEventTTL(eventId: string): void {
    if (this.config.eventTTL > 0) {
      const timer = setTimeout(() => {
        // Emit timeout event
        this.emitter.emit('event.timeout', { eventId });
        
        // Clean up
        this.eventTimers.delete(eventId);
      }, this.config.eventTTL);
      
      this.eventTimers.set(eventId, timer);
    }
  }

  /**
   * Processes queued events
   */
  private processQueuedEvents(): void {
    // Process events while we're below the maximum concurrent limit
    while (this.eventQueue.length > 0 && this.activeEventCount < this.config.maxConcurrentEvents) {
      const event = this.eventQueue.shift();
      if (event) {
        // Using setImmediate to avoid blocking the event loop
        setImmediate(() => {
          this.publish(event).catch(console.error);
        });
      }
    }
  }
}

// Export singleton instance
export const eventBus = new LAPAEventBus();