/**
 * AgentTool Wrapper Framework for LAPA v1.2 Phase 10
 * 
 * This module implements the core AgentTool wrapper system with abstraction layer
 * for different agent types and standardized tool execution. It integrates with
 * the event bus system for communication and supports the 12-agent helix team patterns.
 */

import { LAPAEventBus, eventBus } from './event-bus.js';
import { 
  AgentTool, 
  AgentToolType, 
  AgentToolExecutionContext, 
  AgentToolExecutionResult,
  Agent,
  HelixAgentType
} from './types/agent-types.js';
import { performance } from 'perf_hooks';

/**
 * Abstract base class for all agent tools
 * Provides common functionality and enforces the AgentTool interface
 */
export abstract class BaseAgentTool implements AgentTool {
  protected eventBus: LAPAEventBus;
  
  constructor(
    public readonly name: string,
    public readonly type: AgentToolType,
    public readonly description: string,
    public readonly version: string
  ) {
    this.eventBus = eventBus;
  }

  /**
   * Execute the tool with the given context
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  abstract execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>;

  /**
   * Validate tool parameters
   * @param params Parameters to validate
   * @returns Boolean indicating if parameters are valid
   */
  abstract validateParameters(params: Record<string, any>): boolean;

  /**
   * Publish an event to the event bus
   * @param eventType Type of event
   * @param payload Event payload
   */
  protected async publishEvent(eventType: string, payload: any): Promise<void> {
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
  protected logExecutionMetrics(
    context: AgentToolExecutionContext, 
    result: AgentToolExecutionResult, 
    startTime: number
  ): void {
    const duration = performance.now() - startTime;
    
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

/**
 * Agent Tool Registry
 * Manages registration and retrieval of agent tools
 */
class AgentToolRegistry {
  private tools: Map<string, AgentTool> = new Map();
  private factories: Map<string, (config?: Record<string, any>) => AgentTool> = new Map();

  /**
   * Register a tool
   * @param tool Tool to register
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register a tool factory
   * @param toolName Name of the tool
   * @param factory Factory function to create the tool
   */
  registerToolFactory(toolName: string, factory: (config?: Record<string, any>) => AgentTool): void {
    this.factories.set(toolName, factory);
  }

  /**
   * Get a tool by name
   * @param toolName Name of the tool
   * @returns Tool or undefined if not found
   */
  getTool(toolName: string): AgentTool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Create a tool using its factory
   * @param toolName Name of the tool
   * @param config Configuration for the tool
   * @returns Created tool or undefined if factory not found
   */
  createTool(toolName: string, config?: Record<string, any>): AgentTool | undefined {
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
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   * @param toolName Name of the tool
   * @returns Boolean indicating if tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName) || this.factories.has(toolName);
  }
}

/**
 * Agent Tool Manager
 * Manages agent tools for a specific agent
 */
export class AgentToolManager {
  private tools: Map<string, AgentTool> = new Map();
  private registry: AgentToolRegistry;

  constructor(registry: AgentToolRegistry) {
    this.registry = registry;
  }

  /**
   * Add a tool to this agent
   * @param tool Tool to add
   */
  addTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param toolName Name of the tool
   * @returns Tool or undefined if not found
   */
  getTool(toolName: string): AgentTool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Execute a tool by name
   * @param toolName Name of the tool
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  async executeTool(toolName: string, context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
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
    const startTime = performance.now();
    try {
      const result = await tool.execute(context);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Add execution time to result
      result.executionTime = executionTime;
      
      // Log metrics
      if (tool instanceof BaseAgentTool) {
        tool['logExecutionMetrics'](context, result, startTime);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
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
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Helix Team Agent Wrapper
 * Wraps an agent in the 12-agent helix team pattern
 */
export class HelixTeamAgentWrapper implements Agent {
  public readonly tools: AgentTool[] = [];
  private toolManager: AgentToolManager;

  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly name: string,
    public readonly capabilities: string[],
    public readonly workload: number,
    public readonly capacity: number,
    registry: AgentToolRegistry
  ) {
    this.toolManager = new AgentToolManager(registry);
  }

  /**
   * Add a tool to this agent
   * @param tool Tool to add
   */
  addTool(tool: AgentTool): void {
    this.tools.push(tool);
    this.toolManager.addTool(tool);
  }

  /**
   * Execute a tool by name
   * @param toolName Name of the tool
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  async executeTool(toolName: string, context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    return this.toolManager.executeTool(toolName, context);
  }
}

// Export types
export type { AgentToolType, AgentToolExecutionContext, AgentToolExecutionResult };

// Export classes
export { AgentToolRegistry };

// Export singleton instances
export const agentToolRegistry = new AgentToolRegistry();