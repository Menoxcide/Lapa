/**
 * Optimized Tool Execution for LAPA v1.2 Phase 10
 * 
 * This module implements optimizations for agent tool execution to achieve
 * <200ms per tool performance target. It includes caching, batching, and
 * resource management optimizations.
 */

import {
  AgentToolExecutionContext,
  AgentToolExecutionResult,
  AgentTool
} from '../types/agent-types.js';
import { performance } from 'perf_hooks';
import { lapaCacheManager } from './caching.ts';
import { ToolExecutorResult } from '../utils/tool-executor.js';

// Tool execution optimization configuration
interface ToolExecutionConfig {
  enableCaching: boolean;
  cacheTTL: number; // Time to live in milliseconds
  enableBatching: boolean;
  maxBatchSize: number;
  maxBatchDelay: number; // ms
  enableResourceManagement: boolean;
  maxConcurrentExecutions: number;
  timeoutMs: number;
}

// Default configuration optimized for <200ms per tool
const DEFAULT_CONFIG: ToolExecutionConfig = {
  enableCaching: true,
  cacheTTL: 30000, // 30 seconds
  enableBatching: true,
  maxBatchSize: 5,
  maxBatchDelay: 10, // ms
  enableResourceManagement: true,
  maxConcurrentExecutions: 20,
  timeoutMs: 15000 // 15 seconds
};

// Batch execution request
interface BatchExecutionRequest {
  tool: AgentTool;
  context: AgentToolExecutionContext;
  resolve: (result: ToolExecutorResult) => void;
  reject: (error: any) => void;
  timestamp: number;
}

/**
 * Optimized Tool Executor with caching and batching
 */
export class OptimizedToolExecutor {
  private config: ToolExecutionConfig;
  private executionQueue: BatchExecutionRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private activeExecutions: number = 0;

  constructor(config?: Partial<ToolExecutionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a tool with optimizations
   * @param tool Tool to execute
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  async executeTool(tool: AgentTool, context: AgentToolExecutionContext): Promise<ToolExecutorResult> {
    const startTime = performance.now();

    // Check cache if enabled
    if (this.config.enableCaching) {
      const cachedResult = lapaCacheManager.toolExecutionCache.getCachedResult(
        tool.name, 
        context.parameters
      );
      
      if (cachedResult) {
        // Return cached result with updated timestamps
        const endTime = performance.now();
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
  private async executeWithBatching(
    tool: AgentTool, 
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<ToolExecutorResult> {
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
  private async processBatch(): Promise<void> {
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
          const result = await this.executeDirectly(
            request.tool, 
            request.context, 
            request.timestamp
          );
          
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      });

      await Promise.all(promises);
    } finally {
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
  private async executeDirectly(
    tool: AgentTool, 
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<ToolExecutorResult> {
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

      const endTime = performance.now();
      const executionResult: ToolExecutorResult = {
        ...result,
        toolName: tool.name,
        agentId: context.agentId,
        taskId: context.taskId,
        startTime,
        endTime
      };

      // Cache result if successful and caching is enabled
      if (this.config.enableCaching && result.success) {
        lapaCacheManager.toolExecutionCache.cacheResult(
          tool.name,
          context.parameters,
          result,
          endTime - startTime
        );
      }

      return executionResult;
    } finally {
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
  private async executeWithTimeout(
    tool: AgentTool, 
    context: AgentToolExecutionContext
  ): Promise<AgentToolExecutionResult> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      // Execute tool
      tool.execute(context)
        .then((result: AgentToolExecutionResult) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Update executor configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<ToolExecutionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ToolExecutionConfig {
    return { ...this.config };
  }

  /**
   * Get current queue size
   * @returns Number of pending executions
   */
  getQueueSize(): number {
    return this.executionQueue.length;
  }

  /**
   * Clear the execution queue
   */
  clearQueue(): void {
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
  getCacheHitRate(): number {
    const metrics = lapaCacheManager.toolExecutionCache.getMetrics();
    return metrics.hitRate * 100;
  }
}

/**
 * Batch Tool Executor with optimizations
 */
export class OptimizedBatchToolExecutor {
  private executor: OptimizedToolExecutor;

  constructor(config?: Partial<ToolExecutionConfig>) {
    this.executor = new OptimizedToolExecutor(config);
  }

  /**
   * Execute multiple tools concurrently with optimizations
   * @param tools Tools to execute
   * @param contexts Execution contexts for each tool
   * @returns Promise resolving to array of execution results
   */
  async executeTools(
    tools: AgentTool[], 
    contexts: AgentToolExecutionContext[]
  ): Promise<ToolExecutorResult[]> {
    if (tools.length !== contexts.length) {
      throw new Error('Number of tools must match number of contexts');
    }

    // Execute all tools concurrently
    const promises = tools.map((tool, index) => 
      this.executor.executeTool(tool, contexts[index])
    );

    return Promise.all(promises);
  }

  /**
   * Execute tools with dependency handling and optimizations
   * @param toolChain Array of tools and their dependencies
   * @param initialContext Initial execution context
   * @returns Promise resolving to final execution result
   */
  async executeToolChain(
    toolChain: Array<{ tool: AgentTool; dependencies?: string[] }>,
    initialContext: AgentToolExecutionContext
  ): Promise<ToolExecutorResult[]> {
    const results: ToolExecutorResult[] = [];
    const contextMap: Record<string, any> = {};

    for (const { tool, dependencies } of toolChain) {
      // Build context for this tool
      const context: AgentToolExecutionContext = {
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
      const result: ToolExecutorResult = await this.executor.executeTool(tool, context);
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
  updateConfig(config: Partial<ToolExecutionConfig>): void {
    this.executor.updateConfig(config);
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ToolExecutionConfig {
    return this.executor.getConfig();
  }
}

// Export singleton instances
export const optimizedToolExecutor = new OptimizedToolExecutor();
export const optimizedBatchToolExecutor = new OptimizedBatchToolExecutor();