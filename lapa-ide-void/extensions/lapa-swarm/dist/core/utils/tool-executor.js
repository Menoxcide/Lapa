"use strict";
/**
 * Tool Executor for LAPA Core
 *
 * This module implements the standardized tool execution logic with event bus integration.
 * It provides a unified interface for executing agent tools while leveraging the event
 * bus for communication and monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchToolExecutor = exports.toolExecutor = exports.BatchToolExecutor = exports.ToolExecutor = void 0;
const event_bus_ts_1 = require("../event-bus.ts");
const perf_hooks_1 = require("perf_hooks");
/**
 * Default Tool Executor Options
 */
const DEFAULT_OPTIONS = {
    enableEventPublishing: true,
    enableMetricsCollection: true,
    timeoutMs: 30000 // 30 seconds
};
/**
 * Tool Executor Class
 *
 * Provides standardized execution of agent tools with event bus integration,
 * timeout handling, and metrics collection.
 */
class ToolExecutor {
    eventBus;
    options;
    constructor(options) {
        this.eventBus = event_bus_ts_1.eventBus;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Execute a tool with the given context
     * @param tool Tool to execute
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async executeTool(tool, context) {
        const startTime = perf_hooks_1.performance.now();
        // Publish execution start event if enabled
        if (this.options.enableEventPublishing) {
            await this.publishEvent('tool.execution.started', {
                toolName: tool.name,
                agentId: context.agentId,
                taskId: context.taskId,
                timestamp: startTime
            }).catch(console.error);
        }
        try {
            // Execute tool with timeout if specified
            let result;
            if (this.options.timeoutMs) {
                result = await this.executeWithTimeout(tool, context, this.options.timeoutMs);
            }
            else {
                result = await tool.execute(context);
            }
            const endTime = perf_hooks_1.performance.now();
            const executionResult = {
                ...result,
                toolName: tool.name,
                agentId: context.agentId,
                taskId: context.taskId,
                startTime,
                endTime
            };
            // Collect metrics if enabled
            if (this.options.enableMetricsCollection) {
                await this.collectMetrics(executionResult).catch(console.error);
            }
            // Publish execution completed event if enabled
            if (this.options.enableEventPublishing) {
                await this.publishEvent('tool.execution.completed', {
                    toolName: tool.name,
                    agentId: context.agentId,
                    taskId: context.taskId,
                    success: result.success,
                    executionTime: executionResult.endTime - executionResult.startTime,
                    timestamp: endTime
                }).catch(console.error);
            }
            return executionResult;
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            const executionResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: endTime - startTime,
                toolName: tool.name,
                agentId: context.agentId,
                taskId: context.taskId,
                startTime,
                endTime
            };
            // Publish execution failed event if enabled
            if (this.options.enableEventPublishing) {
                await this.publishEvent('tool.execution.failed', {
                    toolName: tool.name,
                    agentId: context.agentId,
                    taskId: context.taskId,
                    error: executionResult.error,
                    executionTime: executionResult.executionTime,
                    timestamp: endTime
                }).catch(console.error);
            }
            return executionResult;
        }
    }
    /**
     * Execute a tool with timeout
     * @param tool Tool to execute
     * @param context Execution context
     * @param timeoutMs Timeout in milliseconds
     * @returns Promise resolving to execution result
     */
    async executeWithTimeout(tool, context, timeoutMs) {
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            // Execute tool
            tool.execute(context)
                .then(result => {
                clearTimeout(timeout);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    /**
     * Collect metrics from tool execution
     * @param result Tool execution result
     */
    async collectMetrics(result) {
        // Publish performance metric
        await this.publishEvent('performance.metric', {
            metric: 'tool_execution_time',
            value: result.executionTime,
            unit: 'milliseconds',
            toolName: result.toolName,
            taskId: result.taskId,
            agentId: result.agentId
        }).catch(console.error);
        // If execution failed, publish error metric
        if (!result.success) {
            await this.publishEvent('performance.metric', {
                metric: 'tool_execution_errors',
                value: 1,
                unit: 'count',
                toolName: result.toolName,
                taskId: result.taskId,
                agentId: result.agentId
            }).catch(console.error);
        }
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
            source: 'tool-executor',
            payload
        });
    }
    /**
     * Update executor options
     * @param options New options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
    /**
     * Get current executor options
     * @returns Current options
     */
    getOptions() {
        return { ...this.options };
    }
}
exports.ToolExecutor = ToolExecutor;
/**
 * Batch Tool Executor
 *
 * Executes multiple tools in parallel with coordinated event publishing
 */
class BatchToolExecutor {
    executor;
    constructor(options) {
        this.executor = new ToolExecutor(options);
    }
    /**
     * Execute multiple tools concurrently
     * @param tools Tools to execute
     * @param contexts Execution contexts for each tool
     * @returns Promise resolving to array of execution results
     */
    async executeTools(tools, contexts) {
        if (tools.length !== contexts.length) {
            throw new Error('Number of tools must match number of contexts');
        }
        // Execute all tools concurrently
        const promises = tools.map((tool, index) => this.executor.executeTool(tool, contexts[index]));
        return Promise.all(promises);
    }
    /**
     * Execute tools with dependency handling
     * @param toolChain Array of tools and their dependencies
     * @param initialContext Initial execution context
     * @returns Promise resolving to final execution result
     */
    async executeToolChain(toolChain, initialContext) {
        const results = [];
        const contextMap = {};
        for (const { tool, dependencies } of toolChain) {
            // Build context for this tool
            const context = {
                ...initialContext,
                toolName: tool.name,
                parameters: {
                    ...initialContext.parameters,
                    ...contextMap
                }
            };
            // Check dependencies
            if (dependencies) {
                for (const dep of dependencies) {
                    if (!(dep in contextMap)) {
                        throw new Error(`Missing dependency '${dep}' for tool '${tool.name}'`);
                    }
                }
            }
            // Execute tool
            const result = await this.executor.executeTool(tool, context);
            results.push(result);
            // Store result for future dependencies
            contextMap[tool.name] = result.output;
        }
        return results;
    }
}
exports.BatchToolExecutor = BatchToolExecutor;
// Export singleton instances
exports.toolExecutor = new ToolExecutor();
exports.batchToolExecutor = new BatchToolExecutor();
//# sourceMappingURL=tool-executor.js.map