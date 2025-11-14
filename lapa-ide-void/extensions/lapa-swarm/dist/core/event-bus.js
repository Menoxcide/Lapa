"use strict";
/**
 * AutoGen Core Event Bus for LAPA v1.2 Phase 10
 *
 * This module implements a typed pub-sub messaging system for agent communication
 * within the LAPA swarm. It maintains local-first principles while enabling
 * seamless integration with existing swarm orchestration mechanisms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.LAPAEventBus = void 0;
const events_1 = require("events");
// Event routing utilities
const event_router_js_1 = require("./utils/event-router.js");
// Default configuration
const DEFAULT_CONFIG = {
    enableLocalFirst: true,
    maxConcurrentEvents: 1000,
    eventTTL: 60000, // 1 minute
    enableEventCompression: true
};
/**
 * LAPA Core Event Bus
 * Implements a typed pub-sub messaging system for agent communication
 */
class LAPAEventBus {
    emitter;
    emit(event, ...args) {
        return this.emitter.emit(event, ...args);
    }
    on(event, listener) {
        return this;
    }
    subscriptions;
    config;
    eventQueue;
    activeEventCount;
    eventTimers;
    constructor(config) {
        this.emitter = new events_1.EventEmitter();
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
    async publish(event) {
        // Check if we've exceeded maximum concurrent events
        if (this.activeEventCount >= this.config.maxConcurrentEvents) {
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
            const routedEvent = await (0, event_router_js_1.routeEvent)(event);
            // Emit the event
            this.emitter.emit(event.type, routedEvent);
            // Process queued events if any
            this.processQueuedEvents();
        }
        finally {
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
    subscribe(eventType, listener, filter) {
        const eventId = this.generateEventId();
        // Wrap the listener with filter logic if provided
        const wrappedListener = (event) => {
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
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            // Remove the listener from the emitter
            this.emitter.removeListener(subscription.eventId, subscription.listener);
            // Remove the subscription
            this.subscriptions.delete(subscriptionId);
            // Clear any TTL timer for this subscription
            if (this.eventTimers.has(subscriptionId)) {
                clearTimeout(this.eventTimers.get(subscriptionId));
                this.eventTimers.delete(subscriptionId);
            }
        }
    }
    /**
     * Gets the current number of active subscriptions
     * @returns Number of active subscriptions
     */
    getSubscriptionCount() {
        return this.subscriptions.size;
    }
    /**
     * Gets the current number of queued events
     * @returns Number of queued events
     */
    getQueuedEventCount() {
        return this.eventQueue.length;
    }
    /**
     * Gets the current number of active events
     * @returns Number of active events
     */
    getActiveEventCount() {
        return this.activeEventCount;
    }
    /**
     * Updates the event bus configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Flushes all queued events
     * @returns Promise that resolves when all events are processed
     */
    async flush() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event) {
                await this.publish(event);
            }
        }
    }
    /**
     * Clears all subscriptions and queued events
     */
    clear() {
        // Clear all subscriptions
        const subscriptionIds = Array.from(this.subscriptions.keys());
        for (const subscriptionId of subscriptionIds) {
            this.unsubscribe(subscriptionId);
        }
        // Clear event queue
        this.eventQueue.length = 0;
        // Clear all timers
        const timers = Array.from(this.eventTimers.values());
        for (const timer of timers) {
            clearTimeout(timer);
        }
        this.eventTimers.clear();
    }
    /**
     * Generates a unique event ID
     * @returns Unique event ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Sets up TTL for an event
     * @param eventId The event ID
     */
    setupEventTTL(eventId) {
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
    processQueuedEvents() {
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
exports.LAPAEventBus = LAPAEventBus;
// Export singleton instance
exports.eventBus = new LAPAEventBus();
//# sourceMappingURL=event-bus.js.map