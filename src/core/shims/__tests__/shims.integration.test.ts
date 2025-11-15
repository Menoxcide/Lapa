/**
 * Integration Tests for Cross-Language Shims in LAPA v1.2 Phase 10
 * 
 * These tests demonstrate cross-language event communication between
 * TypeScript, .NET, and Python components through the shims.
 */

import { DotNetShim } from '../dotnet-shim.ts';
import { PythonShim } from '../python-shim.ts';
import { LAPAEventBus, eventBus } from '../../core/event-bus.ts';
import { CrossLanguageEvent } from '../../core/types/event-types.ts';
import { serializeEventForInterop } from '../types/serialization.ts';

describe('Cross-Language Shims Integration', () => {
  let dotNetShim: DotNetShim;
  let pythonShim: PythonShim;
  let testEventBus: LAPAEventBus;

  beforeEach(async () => {
    // Create a fresh event bus for testing
    testEventBus = new LAPAEventBus();
    
    // Initialize shims
    dotNetShim = new DotNetShim();
    pythonShim = new PythonShim();
    
    // Override the event bus in shims for testing
    (dotNetShim as any).eventBus = testEventBus;
    (pythonShim as any).eventBus = testEventBus;
    
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
    const sendEventSpy = jest.spyOn(dotNetShim as any, 'sendEvent');
    
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
    const sendEventSpy = jest.spyOn(pythonShim as any, 'sendEvent');
    
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
    const mockCrossLanguageEvent: CrossLanguageEvent = {
      id: 'test-3',
      type: 'agent.registered',
      timestamp: Date.now(),
      source: 'dotnet-agent',
      payload: JSON.stringify({ agentId: 'dotnet-1', name: 'Test Agent' })
    };

    // Spy on the event bus publish method
    const publishSpy = jest.spyOn(testEventBus, 'publish');
    
    // Simulate receiving an event from the .NET shim
    await (dotNetShim as any).handleIncomingEvent(mockCrossLanguageEvent);
    
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
    const mockCrossLanguageEvent: CrossLanguageEvent = {
      id: 'test-4',
      type: 'agent.workload.updated',
      timestamp: Date.now(),
      source: 'python-agent',
      payload: JSON.stringify({ agentId: 'python-1', workload: 5, capacity: 10 })
    };

    // Spy on the event bus publish method
    const publishSpy = jest.spyOn(testEventBus, 'publish');
    
    // Simulate receiving an event from the Python shim
    await (pythonShim as any).handleIncomingEvent(mockCrossLanguageEvent);
    
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
    const dotNetSendEventSpy = jest.spyOn(dotNetShim as any, 'sendEvent');
    const pythonSendEventSpy = jest.spyOn(pythonShim as any, 'sendEvent');
    
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