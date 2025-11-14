"use strict";
/**
 * AgentTool Wrapper Framework for LAPA v1.2 Phase 10
 *
 * This module implements the core AgentTool wrapper system with abstraction layer
 * for different agent types and standardized tool execution. It integrates with
 * the event bus system for communication and supports the 12-agent helix team patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentToolRegistry = exports.AgentToolRegistry = exports.HelixTeamAgentWrapper = exports.AgentToolManager = exports.BaseAgentTool = void 0;
const event_bus_js_1 = require("./event-bus.js");
const perf_hooks_1 = require("perf_hooks");
/**
 * Abstract base class for all agent tools
 * Provides common functionality and enforces the AgentTool interface
 */
class BaseAgentTool {
    name;
    type;
    description;
    version;
    eventBus;
    constructor(name, type, description, version) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.version = version;
        this.eventBus = event_bus_js_1.eventBus;
    }
    /**
     * Publish an event to the event bus
     * @param eventType Type of event
     * @param payload Event payload
     */
    async publishEvent(eventType, payload) {
        await this.eventBus.publish({
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            timestamp: Date.now(),
            source: this.name,
            payload
        });
    }
    /**
     * Log tool execution metrics
     * @param context Execution context
     * @param result Execution result
     * @param startTime Start time of execution
     */
    logExecutionMetrics(context, result, startTime) {
        const duration = perf_hooks_1.performance.now() - startTime;
        // Publish performance metric event
        this.publishEvent('performance.metric', {
            metric: 'tool_execution_time',
            value: duration,
            unit: 'milliseconds',
            toolName: this.name,
            taskId: context.taskId,
            agentId: context.agentId
        }).catch(console.error);
        // If execution failed, publish error event
        if (!result.success) {
            this.publishEvent('system.error', {
                error: result.error || 'Unknown error',
                component: this.name,
                taskId: context.taskId,
                agentId: context.agentId
            }).catch(console.error);
        }
    }
}
exports.BaseAgentTool = BaseAgentTool;
/**
 * Agent Tool Registry
 * Manages registration and retrieval of agent tools
 */
class AgentToolRegistry {
    tools = new Map();
    factories = new Map();
    /**
     * Register a tool
     * @param tool Tool to register
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    /**
     * Register a tool factory
     * @param toolName Name of the tool
     * @param factory Factory function to create the tool
     */
    registerToolFactory(toolName, factory) {
        this.factories.set(toolName, factory);
    }
    /**
     * Get a tool by name
     * @param toolName Name of the tool
     * @returns Tool or undefined if not found
     */
    getTool(toolName) {
        return this.tools.get(toolName);
    }
    /**
     * Create a tool using its factory
     * @param toolName Name of the tool
     * @param config Configuration for the tool
     * @returns Created tool or undefined if factory not found
     */
    createTool(toolName, config) {
        const factory = this.factories.get(toolName);
        if (factory) {
            return factory(config);
        }
        return undefined;
    }
    /**
     * Get all registered tool names
     * @returns Array of tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * Check if a tool is registered
     * @param toolName Name of the tool
     * @returns Boolean indicating if tool is registered
     */
    hasTool(toolName) {
        return this.tools.has(toolName) || this.factories.has(toolName);
    }
}
exports.AgentToolRegistry = AgentToolRegistry;
/**
 * Agent Tool Manager
 * Manages agent tools for a specific agent
 */
class AgentToolManager {
    tools = new Map();
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Add a tool to this agent
     * @param tool Tool to add
     */
    addTool(tool) {
        this.tools.set(tool.name, tool);
    }
    /**
     * Get a tool by name
     * @param toolName Name of the tool
     * @returns Tool or undefined if not found
     */
    getTool(toolName) {
        return this.tools.get(toolName);
    }
    /**
     * Execute a tool by name
     * @param toolName Name of the tool
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async executeTool(toolName, context) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool '${toolName}' not found`,
                executionTime: 0
            };
        }
        // Validate parameters
        if (!tool.validateParameters(context.parameters)) {
            return {
                success: false,
                error: `Invalid parameters for tool '${toolName}'`,
                executionTime: 0
            };
        }
        // Execute tool
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = await tool.execute(context);
            const endTime = perf_hooks_1.performance.now();
            const executionTime = endTime - startTime;
            // Add execution time to result
            result.executionTime = executionTime;
            // Log metrics
            if (tool instanceof BaseAgentTool) {
                tool['logExecutionMetrics'](context, result, startTime);
            }
            return result;
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            const executionTime = endTime - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime
            };
        }
    }
    /**
     * Get all tool names for this agent
     * @returns Array of tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
}
exports.AgentToolManager = AgentToolManager;
/**
 * Helix Team Agent Wrapper
 * Wraps an agent in the 12-agent helix team pattern
 */
class HelixTeamAgentWrapper {
    id;
    type;
    name;
    capabilities;
    workload;
    capacity;
    tools = [];
    toolManager;
    constructor(id, type, name, capabilities, workload, capacity, registry) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.capabilities = capabilities;
        this.workload = workload;
        this.capacity = capacity;
        this.toolManager = new AgentToolManager(registry);
    }
    /**
     * Add a tool to this agent
     * @param tool Tool to add
     */
    addTool(tool) {
        this.tools.push(tool);
        this.toolManager.addTool(tool);
    }
    /**
     * Execute a tool by name
     * @param toolName Name of the tool
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async executeTool(toolName, context) {
        return this.toolManager.executeTool(toolName, context);
    }
}
exports.HelixTeamAgentWrapper = HelixTeamAgentWrapper;
// Export singleton instances
exports.agentToolRegistry = new AgentToolRegistry();
//# sourceMappingURL=agent-tool.js.map