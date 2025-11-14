/**
 * Integration Tests for AgentTool Framework with Event Bus
 * 
 * This module contains integration tests demonstrating compatibility between
 * the AgentTool framework and the event bus system.
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { LAPAEventBus } from '../../core/event-bus.ts';
import { 
  BaseAgentTool, 
  AgentToolExecutionContext, 
  AgentToolExecutionResult,
  AgentToolType,
  agentToolRegistry
} from '../../core/agent-tool.ts';
import { ToolExecutor, ToolExecutorResult } from '../../core/utils/tool-executor.js';

// Mock tool for testing
class MockTool extends BaseAgentTool {
  public executionCount: number = 0;
  public lastContext: AgentToolExecutionContext | null = null;

  constructor() {
    super('mock-tool', 'testing', 'Mock tool for testing', '1.0.0');
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    this.executionCount++;
    this.lastContext = context;
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      success: true,
      output: `Executed with param: ${context.parameters.testParam}`,
      executionTime: 0
    };
  }

  validateParameters(params: Record<string, any>): boolean {
    return !!params.testParam;
  }
}

describe('AgentTool Integration with Event Bus', () => {
  let eventBus: LAPAEventBus;
  let toolExecutor: ToolExecutor;
  let mockTool: MockTool;
  let events: any[] = [];

  beforeEach(() => {
    // Create a new event bus for testing
    eventBus = new LAPAEventBus();
    
    // Create tool executor with event publishing enabled
    toolExecutor = new ToolExecutor({
      enableEventPublishing: true,
      enableMetricsCollection: true
    });
    
    // Override the eventBus in ToolExecutor to use our test instance
    (toolExecutor as any).eventBus = eventBus;
    
    // Create mock tool
    mockTool = new MockTool();
    
    // Clear events array
    events = [];
    
    // Subscribe to all events for testing
    eventBus.subscribe('tool.execution.started', (event) => {
      events.push({ type: 'started', payload: event.payload });
    });
    
    eventBus.subscribe('tool.execution.completed', (event) => {
      events.push({ type: 'completed', payload: event.payload });
    });
    
    eventBus.subscribe('tool.execution.failed', (event) => {
      events.push({ type: 'failed', payload: event.payload });
    });
    
    eventBus.subscribe('performance.metric', (event) => {
      events.push({ type: 'metric', payload: event.payload });
    });
  });

  afterEach(() => {
    // Clear the registry after each test
    (agentToolRegistry as any).tools.clear();
    (agentToolRegistry as any).factories.clear();
  });

  it('should publish events when tool is executed successfully', async () => {
    const context: AgentToolExecutionContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      toolName: 'mock-tool',
      parameters: { testParam: 'test-value' },
      context: {}
    };

    const result = await toolExecutor.executeTool(mockTool, context);
    
    // Check that the tool was executed
    expect(mockTool.executionCount).toBe(1);
    expect(mockTool.lastContext).toEqual(context);
    
    // Check that events were published
    expect(events.length).toBeGreaterThan(0);
    
    // Check for execution start event
    const startEvent = events.find(e => e.type === 'started');
    expect(startEvent).toBeDefined();
    expect(startEvent.payload.toolName).toBe('mock-tool');
    expect(startEvent.payload.taskId).toBe('test-task-1');
    expect(startEvent.payload.agentId).toBe('test-agent-1');
    
    // Check for execution completed event
    const completedEvent = events.find(e => e.type === 'completed');
    expect(completedEvent).toBeDefined();
    expect(completedEvent.payload.toolName).toBe('mock-tool');
    expect(completedEvent.payload.taskId).toBe('test-task-1');
    expect(completedEvent.payload.agentId).toBe('test-agent-1');
    expect(completedEvent.payload.success).toBe(true);
    
    // Check for performance metric events
    const metricEvents = events.filter(e => e.type === 'metric');
    expect(metricEvents.length).toBeGreaterThan(0);
    
    // Check for execution time metric
    const executionTimeMetric = metricEvents.find(e => e.payload.metric === 'tool_execution_time');
    expect(executionTimeMetric).toBeDefined();
    expect(executionTimeMetric.payload.value).toBeGreaterThan(0);
    expect(executionTimeMetric.payload.unit).toBe('milliseconds');
  });

  it('should publish error events when tool execution fails', async () => {
    // Create a tool that always fails
    class FailingTool extends BaseAgentTool {
      constructor() {
        super('failing-tool', 'testing', 'Tool that always fails', '1.0.0');
      }

      async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
        throw new Error('Simulated tool failure');
      }

      validateParameters(params: Record<string, any>): boolean {
        return true;
      }
    }

    const failingTool = new FailingTool();
    const context: AgentToolExecutionContext = {
      taskId: 'test-task-2',
      agentId: 'test-agent-2',
      toolName: 'failing-tool',
      parameters: {},
      context: {}
    };

    const result: ToolExecutorResult = await toolExecutor.executeTool(failingTool, context);
    
    // Check that the result indicates failure
    expect(result.success).toBe(false);
    expect(result.error).toBe('Simulated tool failure');
    
    // Check that events were published
    expect(events.length).toBeGreaterThan(0);
    
    // Check for execution start event
    const startEvent = events.find(e => e.type === 'started');
    expect(startEvent).toBeDefined();
    
    // Check for execution failed event
    const failedEvent = events.find(e => e.type === 'failed');
    expect(failedEvent).toBeDefined();
    expect(failedEvent.payload.toolName).toBe('failing-tool');
    expect(failedEvent.payload.taskId).toBe('test-task-2');
    expect(failedEvent.payload.agentId).toBe('test-agent-2');
    expect(failedEvent.payload.error).toBe('Simulated tool failure');
    
    // Check for error metric
    const errorMetric = events.find(e => e.type === 'metric' && e.payload.metric === 'tool_execution_errors');
    expect(errorMetric).toBeDefined();
    expect(errorMetric.payload.value).toBe(1);
    expect(errorMetric.payload.unit).toBe('count');
  });

  it('should register and retrieve tools from the registry', () => {
    // Register tool
    agentToolRegistry.registerTool(mockTool);
    
    // Check that tool is registered
    expect(agentToolRegistry.hasTool('mock-tool')).toBe(true);
    
    // Retrieve tool
    const retrievedTool = agentToolRegistry.getTool('mock-tool');
    expect(retrievedTool).toBe(mockTool);
    
    // Check tool names
    const toolNames = agentToolRegistry.getToolNames();
    expect(toolNames).toContain('mock-tool');
  });

  it('should handle tool execution timeout', async () => {
    // Create a tool that takes longer than the timeout
    class SlowTool extends BaseAgentTool {
      constructor() {
        super('slow-tool', 'testing', 'Tool that takes time to execute', '1.0.0');
      }

      async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
        // Sleep for 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          output: 'Slow execution completed',
          executionTime: 0
        };
      }

      validateParameters(params: Record<string, any>): boolean {
        return true;
      }
    }

    const slowTool = new SlowTool();
    const context: AgentToolExecutionContext = {
      taskId: 'test-task-3',
      agentId: 'test-agent-3',
      toolName: 'slow-tool',
      parameters: {},
      context: {}
    };

    // Create executor with short timeout
    const timeoutExecutor = new ToolExecutor({
      enableEventPublishing: true,
      enableMetricsCollection: true,
      timeoutMs: 50 // 50ms timeout
    });
    
    // Override the eventBus in ToolExecutor to use our test instance
    (timeoutExecutor as any).eventBus = eventBus;

    const result: ToolExecutorResult = await timeoutExecutor.executeTool(slowTool, context);
    
    // Check that the result indicates timeout failure
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
    
    // Check that events were published
    expect(events.length).toBeGreaterThan(0);
    
    // Check for execution failed event
    const failedEvent = events.find(e => e.type === 'failed');
    expect(failedEvent).toBeDefined();
    expect(failedEvent.payload.toolName).toBe('slow-tool');
    expect(failedEvent.payload.error).toContain('timed out');
  });
});