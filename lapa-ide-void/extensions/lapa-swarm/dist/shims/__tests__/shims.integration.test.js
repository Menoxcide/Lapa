"use strict";
/**
 * Integration Tests for Cross-Language Shims in LAPA v1.2 Phase 10
 *
 * These tests demonstrate cross-language event communication between
 * TypeScript, .NET, and Python components through the shims.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const dotnet_shim_ts_1 = require("../dotnet-shim.ts");
const python_shim_ts_1 = require("../python-shim.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
describe('Cross-Language Shims Integration', () => {
    let dotNetShim;
    let pythonShim;
    let testEventBus;
    beforeEach(async () => {
        // Create a fresh event bus for testing
        testEventBus = new event_bus_ts_1.LAPAEventBus();
        // Initialize shims
        dotNetShim = new dotnet_shim_ts_1.DotNetShim();
        pythonShim = new python_shim_ts_1.PythonShim();
        // Override the event bus in shims for testing
        dotNetShim.eventBus = testEventBus;
        pythonShim.eventBus = testEventBus;
        await dotNetShim.initialize();
        await pythonShim.initialize();
    });
    afterEach(async () => {
        await dotNetShim.shutdown();
        await pythonShim.shutdown();
    });
    it('should forward events from TypeScript to .NET shim', async () => {
        // Create a mock event
        const mockEvent = {
            id: 'test-1',
            type: 'task.created',
            timestamp: Date.now(),
            source: 'test-source',
            payload: { taskId: 'task-1', description: 'Test task' }
        };
        // Spy on the sendEvent method of the .NET shim
        const sendEventSpy = jest.spyOn(dotNetShim, 'sendEvent');
        // Publish event to the event bus
        await testEventBus.publish(mockEvent);
        // Wait for a short time to allow event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify that the event was sent to the .NET shim
        expect(sendEventSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: mockEvent.id,
            type: mockEvent.type,
            payload: JSON.stringify(mockEvent.payload)
        }));
    });
    it('should forward events from TypeScript to Python shim', async () => {
        // Create a mock event
        const mockEvent = {
            id: 'test-2',
            type: 'task.completed',
            timestamp: Date.now(),
            source: 'test-source',
            payload: { taskId: 'task-1', result: 'Success' }
        };
        // Spy on the sendEvent method of the Python shim
        const sendEventSpy = jest.spyOn(pythonShim, 'sendEvent');
        // Publish event to the event bus
        await testEventBus.publish(mockEvent);
        // Wait for a short time to allow event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify that the event was sent to the Python shim
        expect(sendEventSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: mockEvent.id,
            type: mockEvent.type,
            payload: JSON.stringify(mockEvent.payload)
        }));
    });
    it('should handle incoming events from .NET shim', async () => {
        // Create a mock cross-language event
        const mockCrossLanguageEvent = {
            id: 'test-3',
            type: 'agent.registered',
            timestamp: Date.now(),
            source: 'dotnet-agent',
            payload: JSON.stringify({ agentId: 'dotnet-1', name: 'Test Agent' })
        };
        // Spy on the event bus publish method
        const publishSpy = jest.spyOn(testEventBus, 'publish');
        // Simulate receiving an event from the .NET shim
        await dotNetShim.handleIncomingEvent(mockCrossLanguageEvent);
        // Wait for a short time to allow event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify that the event was published to the event bus
        expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: mockCrossLanguageEvent.id,
            type: mockCrossLanguageEvent.type,
            source: mockCrossLanguageEvent.source
        }));
    });
    it('should handle incoming events from Python shim', async () => {
        // Create a mock cross-language event
        const mockCrossLanguageEvent = {
            id: 'test-4',
            type: 'agent.workload.updated',
            timestamp: Date.now(),
            source: 'python-agent',
            payload: JSON.stringify({ agentId: 'python-1', workload: 5, capacity: 10 })
        };
        // Spy on the event bus publish method
        const publishSpy = jest.spyOn(testEventBus, 'publish');
        // Simulate receiving an event from the Python shim
        await pythonShim.handleIncomingEvent(mockCrossLanguageEvent);
        // Wait for a short time to allow event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify that the event was published to the event bus
        expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: mockCrossLanguageEvent.id,
            type: mockCrossLanguageEvent.type,
            source: mockCrossLanguageEvent.source
        }));
    });
    it('should maintain <1s latency for cross-platform communication', async () => {
        // Create a mock event
        const mockEvent = {
            id: 'test-5',
            type: 'performance.metric',
            timestamp: Date.now(),
            source: 'test-source',
            payload: { metric: 'test-latency', value: 0, unit: 'milliseconds' }
        };
        // Record start time
        const startTime = Date.now();
        // Spy on the sendEvent methods
        const dotNetSendEventSpy = jest.spyOn(dotNetShim, 'sendEvent');
        const pythonSendEventSpy = jest.spyOn(pythonShim, 'sendEvent');
        // Publish event to the event bus
        await testEventBus.publish(mockEvent);
        // Wait for a short time to allow event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        // Record end time
        const endTime = Date.now();
        const totalLatency = endTime - startTime;
        // Verify that the event was sent to both shims
        expect(dotNetSendEventSpy).toHaveBeenCalled();
        expect(pythonSendEventSpy).toHaveBeenCalled();
        // Verify that the total latency is less than 1 second
        expect(totalLatency).toBeLessThan(1000);
    });
});
//# sourceMappingURL=shims.integration.test.js.map