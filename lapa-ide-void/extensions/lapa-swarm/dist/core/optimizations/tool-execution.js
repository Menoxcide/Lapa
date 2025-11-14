"use strict";
/**
 * Optimized Tool Execution for LAPA v1.2 Phase 10
 *
 * This module implements optimizations for agent tool execution to achieve
 * <200ms per tool performance target. It includes caching, batching, and
 * resource management optimizations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizedBatchToolExecutor = exports.optimizedToolExecutor = exports.OptimizedBatchToolExecutor = exports.OptimizedToolExecutor = void 0;
const perf_hooks_1 = require("perf_hooks");
const caching_ts_1 = require("./caching.ts");
// Default configuration optimized for <200ms per tool
const DEFAULT_CONFIG = {
    enableCaching: true,
    cacheTTL: 30000, // 30 seconds
    enableBatching: true,
    maxBatchSize: 5,
    maxBatchDelay: 10, // ms
    enableResourceManagement: true,
    maxConcurrentExecutions: 20,
    timeoutMs: 15000 // 15 seconds
};
/**
 * Optimized Tool Executor with caching and batching
 */
class OptimizedToolExecutor {
    config;
    executionQueue = [];
    batchTimer = null;
    activeExecutions = 0;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Execute a tool with optimizations
     * @param tool Tool to execute
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async executeTool(tool, context) {
        const startTime = perf_hooks_1.performance.now();
        // Check cache if enabled
        if (this.config.enableCaching) {
            const cachedResult = caching_ts_1.lapaCacheManager.toolExecutionCache.getCachedResult(tool.name, context.parameters);
            if (cachedResult) {
                // Return cached result with updated timestamps
                const endTime = perf_hooks_1.performance.now();
                return {
                    ...cachedResult.result,
                    toolName: tool.name,
                    agentId: context.agentId,
                    taskId: context.taskId,
                    startTime,
                    endTime
                };
            }
        }
        // Use batching if enabled
        if (this.config.enableBatching) {
            return this.executeWithBatching(tool, context, startTime);
        }
        // Direct execution with resource management
        return this.executeDirectly(tool, context, startTime);
    }
    /**
     * Execute tool with batching optimization
     * @param tool Tool to execute
     * @param context Execution context
     * @param startTime Start time for execution
     * @returns Promise resolving to execution result
     */
    async executeWithBatching(tool, context, startTime) {
        return new Promise((resolve, reject) => {
            // Add to execution queue
            this.executionQueue.push({
                tool,
                context,
                resolve,
                reject,
                timestamp: startTime
            });
            // Clear existing timer
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
            }
            // Process immediately if queue is full
            if (this.executionQueue.length >= this.config.maxBatchSize) {
                this.processBatch();
                return;
            }
            // Schedule processing with max delay
            this.batchTimer = setTimeout(() => {
                this.processBatch();
            }, this.config.maxBatchDelay);
        });
    }
    /**
     * Process a batch of tool executions
     */
    async processBatch() {
        // Prevent concurrent batch processing
        if (this.activeExecutions > 0) {
            return;
        }
        // Take a batch of requests
        const batch = this.executionQueue.splice(0, this.config.maxBatchSize);
        // Process batch concurrently with resource management
        this.activeExecutions = batch.length;
        try {
            // Execute all tools in batch concurrently
            const promises = batch.map(async (request) => {
                try {
                    const result = await this.executeDirectly(request.tool, request.context, request.timestamp);
                    request.resolve(result);
                }
                catch (error) {
                    request.reject(error);
                }
            });
            await Promise.all(promises);
        }
        finally {
            this.activeExecutions = 0;
            // Schedule next batch if there are more requests
            if (this.executionQueue.length > 0) {
                // Use setImmediate to yield to event loop
                setImmediate(() => {
                    this.processBatch();
                });
            }
        }
    }
    /**
     * Execute tool directly with resource management
     * @param tool Tool to execute
     * @param context Execution context
     * @param startTime Start time for execution
     * @returns Promise resolving to execution result
     */
    async executeDirectly(tool, context, startTime) {
        // Resource management - limit concurrent executions
        if (this.config.enableResourceManagement) {
            while (this.activeExecutions >= this.config.maxConcurrentExecutions) {
                // Wait for a slot to become available
                await new Promise(resolve => setImmediate(resolve));
            }
            this.activeExecutions++;
        }
        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(tool, context);
            const endTime = perf_hooks_1.performance.now();
            const executionResult = {
                ...result,
                toolName: tool.name,
                agentId: context.agentId,
                taskId: context.taskId,
                startTime,
                endTime
            };
            // Cache result if successful and caching is enabled
            if (this.config.enableCaching && result.success) {
                caching_ts_1.lapaCacheManager.toolExecutionCache.cacheResult(tool.name, context.parameters, result, endTime - startTime);
            }
            return executionResult;
        }
        finally {
            if (this.config.enableResourceManagement) {
                this.activeExecutions--;
            }
        }
    }
    /**
     * Execute tool with timeout
     * @param tool Tool to execute
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async executeWithTimeout(tool, context) {
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Tool execution timed out after ${this.config.timeoutMs}ms`));
            }, this.config.timeoutMs);
            // Execute tool
            tool.execute(context)
                .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
                .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    /**
     * Update executor configuration
     * @param config Partial configuration to update
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get current queue size
     * @returns Number of pending executions
     */
    getQueueSize() {
        return this.executionQueue.length;
    }
    /**
     * Clear the execution queue
     */
    clearQueue() {
        // Reject all pending requests
        for (const request of this.executionQueue) {
            request.reject(new Error('Tool execution cancelled'));
        }
        this.executionQueue.length = 0;
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }
    /**
     * Get cache hit rate
     * @returns Cache hit rate as a percentage
     */
    getCacheHitRate() {
        const metrics = caching_ts_1.lapaCacheManager.toolExecutionCache.getMetrics();
        return metrics.hitRate * 100;
    }
}
exports.OptimizedToolExecutor = OptimizedToolExecutor;
/**
 * Batch Tool Executor with optimizations
 */
class OptimizedBatchToolExecutor {
    executor;
    constructor(config) {
        this.executor = new OptimizedToolExecutor(config);
    }
    /**
     * Execute multiple tools concurrently with optimizations
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
     * Execute tools with dependency handling and optimizations
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
    /**
     * Update executor configuration
     * @param config Partial configuration to update
     */
    updateConfig(config) {
        this.executor.updateConfig(config);
    }
    /**
     * Get current configuration
     * @returns Current configuration
     */
    getConfig() {
        return this.executor.getConfig();
    }
}
exports.OptimizedBatchToolExecutor = OptimizedBatchToolExecutor;
// Export singleton instances
exports.optimizedToolExecutor = new OptimizedToolExecutor();
exports.optimizedBatchToolExecutor = new OptimizedBatchToolExecutor();
//# sourceMappingURL=tool-execution.js.map