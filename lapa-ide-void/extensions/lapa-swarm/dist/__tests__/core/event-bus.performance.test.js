"use strict";
/**
 * Performance Tests for LAPA Core Event Bus
 *
 * These tests verify the performance characteristics of the event bus system,
 * ensuring it meets the <1s performance requirement for event handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const event_bus_ts_1 = require("../../core/event-bus.ts");
describe('LAPA Core Event Bus Performance', () => {
    let testEventBus;
    beforeEach(() => {
        testEventBus = new event_bus_ts_1.LAPAEventBus();
    });
    afterEach(() => {
        testEventBus.clear();
    });
    it('should handle single event publishing within 1ms', async () => {
        // Create a test event
        const testEvent = {
            id: 'perf-test-event-1',
            type: 'task.created',
            timestamp: Date.now(),
            source: 'perf-test-agent',
            payload: {
                taskId: 'perf-task-1',
                description: 'Performance test task',
                type: 'perf-test',
                priority: 1,
                context: { test: true }
            }
        };
        // Measure the time to publish and receive an event
        const startTime = performance.now();
        // Set up a promise to capture the event
        const eventPromise = new Promise((resolve) => {
            testEventBus.subscribe('task.created', (event) => {
                resolve(event);
            });
        });
        // Publish the event
        await testEventBus.publish(testEvent);
        // Wait for the event to be received
        await eventPromise;
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Verify performance is within 1ms
        expect(duration).toBeLessThan(1);
    });
    it('should handle 100 concurrent events within 10ms', async () => {
        // Create multiple test events
        const events = [];
        for (let i = 0; i < 100; i++) {
            events.push({
                id: `perf-test-event-${i}`,
                type: 'task.created',
                timestamp: Date.now(),
                source: 'perf-test-agent',
                payload: {
                    taskId: `perf-task-${i}`,
                    description: `Performance test task ${i}`,
                    type: 'perf-test',
                    priority: i % 10,
                    context: { index: i }
                }
            });
        }
        // Set up promises to capture all events
        const eventPromises = [];
        for (let i = 0; i < 100; i++) {
            const promise = new Promise((resolve) => {
                testEventBus.subscribe('task.created', (event) => {
                    if (event.payload.taskId === `perf-task-${i}`) {
                        resolve(event);
                    }
                });
            });
            eventPromises.push(promise);
        }
        // Measure the time to publish and receive all events
        const startTime = performance.now();
        // Publish all events concurrently
        await Promise.all(events.map(event => testEventBus.publish(event)));
        // Wait for all events to be received
        await Promise.all(eventPromises);
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Verify performance is within 10ms for 100 events
        expect(duration).toBeLessThan(10);
    });
    it('should handle high-frequency event publishing within 50ms', async () => {
        // Create a large number of events
        const eventCount = 1000;
        const events = [];
        for (let i = 0; i < eventCount; i++) {
            events.push({
                id: `hf-event-${i}`,
                type: 'task.created',
                timestamp: Date.now(),
                source: 'hf-test-agent',
                payload: {
                    taskId: `hf-task-${i}`,
                    description: `High frequency task ${i}`,
                    type: 'hf-test',
                    priority: i % 5,
                    context: { batch: 'high-frequency' }
                }
            });
        }
        // Counter for received events
        let receivedEventCount = 0;
        // Set up a subscription to count events
        testEventBus.subscribe('task.created', () => {
            receivedEventCount++;
        });
        // Measure the time to publish all events
        const startTime = performance.now();
        // Publish all events sequentially (simulating high-frequency publishing)
        for (const event of events) {
            await testEventBus.publish(event);
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Wait a bit for all events to be processed
        await new Promise(resolve => setTimeout(resolve, 10));
        // Verify all events were received
        expect(receivedEventCount).toBe(eventCount);
        // Verify performance is within 50ms for 1000 events
        expect(duration).toBeLessThan(50);
    });
    it('should maintain performance under subscription load', async () => {
        // Create multiple subscribers
        const subscriberCount = 50;
        let totalReceivedEvents = 0;
        // Set up multiple subscribers
        for (let i = 0; i < subscriberCount; i++) {
            testEventBus.subscribe('task.created', () => {
                totalReceivedEvents++;
            });
        }
        // Create test events
        const events = [];
        for (let i = 0; i < 100; i++) {
            events.push({
                id: `sub-load-event-${i}`,
                type: 'task.created',
                timestamp: Date.now(),
                source: 'sub-load-agent',
                payload: {
                    taskId: `sub-load-task-${i}`,
                    description: `Subscription load test task ${i}`,
                    type: 'sub-load-test',
                    priority: 1,
                    context: { loadTest: true }
                }
            });
        }
        // Measure performance
        const startTime = performance.now();
        // Publish all events
        await Promise.all(events.map(event => testEventBus.publish(event)));
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Wait for event processing
        await new Promise(resolve => setTimeout(resolve, 20));
        // Verify all subscribers received all events
        expect(totalReceivedEvents).toBe(subscriberCount * events.length);
        // Verify performance is within acceptable limits
        expect(duration).toBeLessThan(20);
    });
});
//# sourceMappingURL=event-bus.performance.test.js.map