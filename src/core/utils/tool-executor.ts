/**
 * Tool Executor for LAPA Core
 * 
 * This module implements the standardized tool execution logic with event bus integration.
 * It provides a unified interface for executing agent tools while leveraging the event
 * bus for communication and monitoring.
 */

import { LAPAEventBus, eventBus } from '../event-bus';
import { 
  AgentToolExecutionContext, 
  AgentToolExecutionResult,
  AgentTool
} from '../types/agent-types';
import { performance } from 'perf_hooks';
import { BaseAgentTool } from '../agent-tool';

/**
 * Tool Executor Options
 */
export interface ToolExecutorOptions {
  enableEventPublishing: boolean;
  enableMetricsCollection: boolean;
  timeoutMs?: number;
}

/**
 * Default Tool Executor Options
 */
const DEFAULT_OPTIONS: ToolExecutorOptions = {
  enableEventPublishing: true,
  enableMetricsCollection: true,
  timeoutMs: 30000 // 30 seconds
};

/**
 * Tool Executor Result with Additional Metadata
 */
export interface ToolExecutorResult extends AgentToolExecutionResult {
  toolName: string;
  agentId: string;
  taskId: string;
  startTime: number;
  endTime: number;
}

/**
 * Tool Executor Class
 * 
 * Provides standardized execution of agent tools with event bus integration,
 * timeout handling, and metrics collection.
 */
export class ToolExecutor {
  private eventBus: LAPAEventBus;
  private options: ToolExecutorOptions;

  constructor(options?: Partial<ToolExecutorOptions>) {
    this.eventBus = eventBus;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a tool with the given context
   * @param tool Tool to execute
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  async executeTool(tool: AgentTool, context: AgentToolExecutionContext): Promise<ToolExecutorResult> {
    const startTime = performance.now();
    
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
      let result: AgentToolExecutionResult;
      
      if (this.options.timeoutMs) {
        result = await this.executeWithTimeout(tool, context, this.options.timeoutMs);
      } else {
        result = await tool.execute(context);
      }

      const endTime = performance.now();
      const executionResult: ToolExecutorResult = {
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
    } catch (error) {
      const endTime = performance.now();
      const executionResult: ToolExecutorResult = {
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
  private async executeWithTimeout(
    tool: AgentTool, 
    context: AgentToolExecutionContext, 
    timeoutMs: number
  ): Promise<AgentToolExecutionResult> {
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
  private async collectMetrics(result: ToolExecutorResult): Promise<void> {
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
  private async publishEvent(eventType: string, payload: any): Promise<void> {
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
  updateOptions(options: Partial<ToolExecutorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current executor options
   * @returns Current options
   */
  getOptions(): ToolExecutorOptions {
    return { ...this.options };
  }
}

/**
 * Batch Tool Executor
 * 
 * Executes multiple tools in parallel with coordinated event publishing
 */
export class BatchToolExecutor {
  private executor: ToolExecutor;

  constructor(options?: Partial<ToolExecutorOptions>) {
    this.executor = new ToolExecutor(options);
  }

  /**
   * Execute multiple tools concurrently
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
   * Execute tools with dependency handling
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
      const result = await this.executor.executeTool(tool, context);
      results.push(result);

      // Store result for future dependencies
      contextMap[tool.name] = result.output;
    }

    return results;
  }
}

// Export singleton instances
export const toolExecutor = new ToolExecutor();
export const batchToolExecutor = new BatchToolExecutor();