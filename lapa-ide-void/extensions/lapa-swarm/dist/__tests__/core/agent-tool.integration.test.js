"use strict";
/**
 * Integration Tests for AgentTool Framework with Event Bus
 *
 * This module contains integration tests demonstrating compatibility between
 * the AgentTool framework and the event bus system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const agent_tool_ts_1 = require("../../core/agent-tool.ts");
const tool_executor_js_1 = require("../../core/utils/tool-executor.js");
// Mock tool for testing
class MockTool extends agent_tool_ts_1.BaseAgentTool {
    executionCount = 0;
    lastContext = null;
    constructor() {
        super('mock-tool', 'testing', 'Mock tool for testing', '1.0.0');
    }
    async execute(context) {
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
    validateParameters(params) {
        return !!params.testParam;
    }
}
(0, vitest_1.describe)('AgentTool Integration with Event Bus', () => {
    let eventBus;
    let toolExecutor;
    let mockTool;
    let events = [];
    (0, vitest_1.beforeEach)(() => {
        // Create a new event bus for testing
        eventBus = new event_bus_ts_1.LAPAEventBus();
        // Create tool executor with event publishing enabled
        toolExecutor = new tool_executor_js_1.ToolExecutor({
            enableEventPublishing: true,
            enableMetricsCollection: true
        });
        // Override the eventBus in ToolExecutor to use our test instance
        toolExecutor.eventBus = eventBus;
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
    (0, vitest_1.afterEach)(() => {
        // Clear the registry after each test
        agent_tool_ts_1.agentToolRegistry.tools.clear();
        agent_tool_ts_1.agentToolRegistry.factories.clear();
    });
    (0, vitest_1.it)('should publish events when tool is executed successfully', async () => {
        const context = {
            taskId: 'test-task-1',
            agentId: 'test-agent-1',
            toolName: 'mock-tool',
            parameters: { testParam: 'test-value' },
            context: {}
        };
        const result = await toolExecutor.executeTool(mockTool, context);
        // Check that the tool was executed
        (0, vitest_1.expect)(mockTool.executionCount).toBe(1);
        (0, vitest_1.expect)(mockTool.lastContext).toEqual(context);
        // Check that events were published
        (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
        // Check for execution start event
        const startEvent = events.find(e => e.type === 'started');
        (0, vitest_1.expect)(startEvent).toBeDefined();
        (0, vitest_1.expect)(startEvent.payload.toolName).toBe('mock-tool');
        (0, vitest_1.expect)(startEvent.payload.taskId).toBe('test-task-1');
        (0, vitest_1.expect)(startEvent.payload.agentId).toBe('test-agent-1');
        // Check for execution completed event
        const completedEvent = events.find(e => e.type === 'completed');
        (0, vitest_1.expect)(completedEvent).toBeDefined();
        (0, vitest_1.expect)(completedEvent.payload.toolName).toBe('mock-tool');
        (0, vitest_1.expect)(completedEvent.payload.taskId).toBe('test-task-1');
        (0, vitest_1.expect)(completedEvent.payload.agentId).toBe('test-agent-1');
        (0, vitest_1.expect)(completedEvent.payload.success).toBe(true);
        // Check for performance metric events
        const metricEvents = events.filter(e => e.type === 'metric');
        (0, vitest_1.expect)(metricEvents.length).toBeGreaterThan(0);
        // Check for execution time metric
        const executionTimeMetric = metricEvents.find(e => e.payload.metric === 'tool_execution_time');
        (0, vitest_1.expect)(executionTimeMetric).toBeDefined();
        (0, vitest_1.expect)(executionTimeMetric.payload.value).toBeGreaterThan(0);
        (0, vitest_1.expect)(executionTimeMetric.payload.unit).toBe('milliseconds');
    });
    (0, vitest_1.it)('should publish error events when tool execution fails', async () => {
        // Create a tool that always fails
        class FailingTool extends agent_tool_ts_1.BaseAgentTool {
            constructor() {
                super('failing-tool', 'testing', 'Tool that always fails', '1.0.0');
            }
            async execute(context) {
                throw new Error('Simulated tool failure');
            }
            validateParameters(params) {
                return true;
            }
        }
        const failingTool = new FailingTool();
        const context = {
            taskId: 'test-task-2',
            agentId: 'test-agent-2',
            toolName: 'failing-tool',
            parameters: {},
            context: {}
        };
        const result = await toolExecutor.executeTool(failingTool, context);
        // Check that the result indicates failure
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBe('Simulated tool failure');
        // Check that events were published
        (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
        // Check for execution start event
        const startEvent = events.find(e => e.type === 'started');
        (0, vitest_1.expect)(startEvent).toBeDefined();
        // Check for execution failed event
        const failedEvent = events.find(e => e.type === 'failed');
        (0, vitest_1.expect)(failedEvent).toBeDefined();
        (0, vitest_1.expect)(failedEvent.payload.toolName).toBe('failing-tool');
        (0, vitest_1.expect)(failedEvent.payload.taskId).toBe('test-task-2');
        (0, vitest_1.expect)(failedEvent.payload.agentId).toBe('test-agent-2');
        (0, vitest_1.expect)(failedEvent.payload.error).toBe('Simulated tool failure');
        // Check for error metric
        const errorMetric = events.find(e => e.type === 'metric' && e.payload.metric === 'tool_execution_errors');
        (0, vitest_1.expect)(errorMetric).toBeDefined();
        (0, vitest_1.expect)(errorMetric.payload.value).toBe(1);
        (0, vitest_1.expect)(errorMetric.payload.unit).toBe('count');
    });
    (0, vitest_1.it)('should register and retrieve tools from the registry', () => {
        // Register tool
        agent_tool_ts_1.agentToolRegistry.registerTool(mockTool);
        // Check that tool is registered
        (0, vitest_1.expect)(agent_tool_ts_1.agentToolRegistry.hasTool('mock-tool')).toBe(true);
        // Retrieve tool
        const retrievedTool = agent_tool_ts_1.agentToolRegistry.getTool('mock-tool');
        (0, vitest_1.expect)(retrievedTool).toBe(mockTool);
        // Check tool names
        const toolNames = agent_tool_ts_1.agentToolRegistry.getToolNames();
        (0, vitest_1.expect)(toolNames).toContain('mock-tool');
    });
    (0, vitest_1.it)('should handle tool execution timeout', async () => {
        // Create a tool that takes longer than the timeout
        class SlowTool extends agent_tool_ts_1.BaseAgentTool {
            constructor() {
                super('slow-tool', 'testing', 'Tool that takes time to execute', '1.0.0');
            }
            async execute(context) {
                // Sleep for 100ms
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    success: true,
                    output: 'Slow execution completed',
                    executionTime: 0
                };
            }
            validateParameters(params) {
                return true;
            }
        }
        const slowTool = new SlowTool();
        const context = {
            taskId: 'test-task-3',
            agentId: 'test-agent-3',
            toolName: 'slow-tool',
            parameters: {},
            context: {}
        };
        // Create executor with short timeout
        const timeoutExecutor = new tool_executor_js_1.ToolExecutor({
            enableEventPublishing: true,
            enableMetricsCollection: true,
            timeoutMs: 50 // 50ms timeout
        });
        // Override the eventBus in ToolExecutor to use our test instance
        timeoutExecutor.eventBus = eventBus;
        const result = await timeoutExecutor.executeTool(slowTool, context);
        // Check that the result indicates timeout failure
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('timed out');
        // Check that events were published
        (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
        // Check for execution failed event
        const failedEvent = events.find(e => e.type === 'failed');
        (0, vitest_1.expect)(failedEvent).toBeDefined();
        (0, vitest_1.expect)(failedEvent.payload.toolName).toBe('slow-tool');
        (0, vitest_1.expect)(failedEvent.payload.error).toContain('timed out');
    });
});
//# sourceMappingURL=agent-tool.integration.test.js.map