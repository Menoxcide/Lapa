/**
 * Compatibility Layer for LAPA Agent Infrastructure
 * 
 * This module provides backward compatibility between the new AgentTool framework
 * and existing agent infrastructure in v1.1 Phase 9.
 */

import { MoERouter, Agent as LegacyAgent, Task as LegacyTask } from '../../agents/moe-router.ts';
import { 
  HelixTeamAgentWrapper, 
  AgentToolManager,
  agentToolRegistry
} from '../agent-tool.ts';
import { 
  Agent as NewAgent,
  AgentTool,
  HelixAgentType
} from '../types/agent-types.ts';

/**
 * Adapter class to convert legacy agents to new agent format
 */
export class LegacyAgentAdapter extends HelixTeamAgentWrapper {
  private legacyAgent: LegacyAgent;
  
  constructor(legacyAgent: LegacyAgent, registry = agentToolRegistry) {
    super(
      legacyAgent.id,
      legacyAgent.type as unknown as HelixAgentType, // Type assertion for compatibility
      legacyAgent.name,
      legacyAgent.expertise,
      legacyAgent.workload,
      legacyAgent.capacity,
      registry
    );
    
    this.legacyAgent = legacyAgent;
  }
  
  /**
   * Get the underlying legacy agent
   * @returns The legacy agent
   */
  getLegacyAgent(): LegacyAgent {
    return this.legacyAgent;
  }
}

/**
 * Adapter class to convert new agents to legacy format
 */
export class NewAgentAdapter implements LegacyAgent {
  private newAgent: NewAgent;
  
  constructor(newAgent: NewAgent) {
    this.newAgent = newAgent;
  }
  
  get id(): string {
    return this.newAgent.id;
  }
  
  get type(): any { // Using 'any' to maintain compatibility with LegacyAgent type
    return this.newAgent.type;
  }
  
  get name(): string {
    return this.newAgent.name;
  }
  
  get expertise(): string[] {
    return this.newAgent.capabilities;
  }
  
  get workload(): number {
    return this.newAgent.workload;
  }
  
  get capacity(): number {
    return this.newAgent.capacity;
  }
  
  /**
   * Get the underlying new agent
   * @returns The new agent
   */
  getNewAgent(): NewAgent {
    return this.newAgent;
  }
}

/**
 * Compatibility wrapper for MoE Router
 * 
 * This class wraps the existing MoE Router to work with both legacy and new agents
 */
export class CompatibleMoERouter {
  private legacyRouter: MoERouter;
  
  constructor(legacyRouter: MoERouter = new MoERouter()) {
    this.legacyRouter = legacyRouter;
  }
  
  /**
   * Register an agent (works with both legacy and new agents)
   * @param agent Agent to register
   */
  registerAgent(agent: LegacyAgent | NewAgent): void {
    // If it's a new agent, adapt it to legacy format
    if (this.isNewAgent(agent)) {
      const adapter = new NewAgentAdapter(agent);
      this.legacyRouter.registerAgent(adapter);
    } else {
      // It's already a legacy agent
      this.legacyRouter.registerAgent(agent);
    }
  }
  
  /**
   * Unregister an agent
   * @param agentId ID of the agent to unregister
   */
  unregisterAgent(agentId: string): void {
    this.legacyRouter.unregisterAgent(agentId);
  }
  
  /**
   * Route a task (works with both legacy and new task formats)
   * @param task Task to route
   * @returns Routing result
   */
  routeTask(task: LegacyTask): { agent: LegacyAgent | NewAgent; confidence: number; reasoning: string } {
    const result = this.legacyRouter.routeTask(task);
    
    // If the agent is an adapter, return the underlying new agent
    if (result.agent instanceof NewAgentAdapter) {
      return {
        agent: result.agent.getNewAgent(),
        confidence: result.confidence,
        reasoning: result.reasoning
      };
    }
    
    // Check if the agent is a legacy adapter and return the underlying legacy agent
    // This would require checking if the agent is an instance of LegacyAgentAdapter
    // For now, we'll just return the agent as is
    return result as any; // Type assertion to maintain compatibility
  }
  
  /**
   * Update agent workload
   * @param agentId ID of the agent
   * @param workload New workload value
   */
  updateAgentWorkload(agentId: string, workload: number): void {
    this.legacyRouter.updateAgentWorkload(agentId, workload);
  }
  
  /**
   * Get all registered agents
   * @returns Array of registered agents
   */
  getAgents(): (LegacyAgent | NewAgent)[] {
    const legacyAgents = this.legacyRouter.getAgents();
    
    // Convert adapters back to new agents if needed
    return legacyAgents.map(agent => {
      if (agent instanceof NewAgentAdapter) {
        return agent.getNewAgent();
      }
      return agent;
    });
  }
  
  /**
   * Get agent by ID
   * @param agentId ID of the agent
   * @returns The agent or undefined if not found
   */
  getAgentById(agentId: string): LegacyAgent | NewAgent | undefined {
    const agent = this.legacyRouter.getAgentById(agentId);
    
    if (!agent) {
      return undefined;
    }
    
    // If the agent is an adapter, return the underlying new agent
    if (agent instanceof NewAgentAdapter) {
      return agent.getNewAgent();
    }
    
    return agent;
  }
  
  /**
   * Check if an agent is a new agent
   * @param agent Agent to check
   * @returns Boolean indicating if agent is a new agent
   */
  private isNewAgent(agent: LegacyAgent | NewAgent): agent is NewAgent {
    // Check if the agent has the properties of a new agent
    return 'tools' in agent && Array.isArray((agent as NewAgent).tools);
  }
}

/**
 * Compatibility layer for tool execution
 * 
 * This class provides a bridge between legacy tool execution and new tool execution
 */
export class CompatibleToolExecutor {
  /**
   * Execute a tool on a legacy agent
   * @param agent Legacy agent
   * @param toolName Name of the tool to execute
   * @param parameters Tool parameters
   * @returns Execution result
   */
  static async executeToolOnLegacyAgent(
    agent: LegacyAgent,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<any> {
    // In v1.1, agents didn't have a standardized tool execution interface
    // This is a placeholder for backward compatibility
    console.warn(`Tool execution on legacy agent ${agent.id} is not supported`);
    return {
      success: false,
      error: 'Tool execution not supported on legacy agents'
    };
  }
  
  /**
   * Execute a tool on a new agent
   * @param agent New agent
   * @param toolName Name of the tool to execute
   * @param context Execution context
   * @returns Execution result
   */
  static async executeToolOnNewAgent(
    agent: NewAgent,
    toolName: string,
    context: any
  ): Promise<any> {
    // Delegate to the agent's tool execution method
    return agent.executeTool(toolName, context);
  }
  
  /**
   * Unified tool execution method
   * @param agent Agent to execute tool on
   * @param toolName Name of the tool to execute
   * @param context Execution context
   * @returns Execution result
   */
  static async executeTool(
    agent: LegacyAgent | NewAgent,
    toolName: string,
    context: any
  ): Promise<any> {
    // Check if agent is a new agent
    if ('tools' in agent && Array.isArray((agent as NewAgent).tools)) {
      return this.executeToolOnNewAgent(agent as NewAgent, toolName, context);
    } else {
      // Assume it's a legacy agent
      return this.executeToolOnLegacyAgent(agent as LegacyAgent, toolName, context);
    }
  }
}

// Export singleton instance for convenience
export const compatibleMoERouter = new CompatibleMoERouter();