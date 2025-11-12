/**
 * Swarm Delegate for LAPA v1.1 Local-First Implementation
 * 
 * This module implements the swarm delegate that integrates local client functionality
 * into swarm operations. It enables swarm-level handoff functionality using local inference
 * while maintaining compatibility with existing swarm consensus and voting mechanisms.
 */

import { LocalHandoffSystem, localHandoff } from '../orchestrator/handoffs.local.ts';
import { ConsensusVotingSystem, VoteOption } from './consensus.voting.ts';
import { ContextHandoffManager } from './context.handoff.ts';
import { Task, Agent } from '../agents/moe-router.ts';
import { z } from 'zod';

// Zod schema for SwarmDelegateConfig validation
const swarmDelegateConfigSchema = z.object({
  enableLocalInference: z.boolean(),
  latencyTargetMs: z.number().min(0),
  maxConcurrentDelegations: z.number().min(1),
  enableConsensusVoting: z.boolean()
});

// Type definitions for swarm delegate
export interface SwarmDelegateConfig {
  enableLocalInference: boolean;
  latencyTargetMs: number;
  maxConcurrentDelegations: number;
  enableConsensusVoting: boolean;
}

// Context interface for tasks
export interface TaskContext {
  [key: string]: unknown;
}

// Zod schema for DelegationResult validation
const delegationResultSchema = z.object({
  success: z.boolean(),
  taskId: z.string(),
  delegatedToAgentId: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  metrics: z.object({
    duration: z.number(),
    latencyWithinTarget: z.boolean()
  }).optional()
});

export interface DelegationResult {
  success: boolean;
  taskId: string;
  delegatedToAgentId?: string;
  result?: unknown;
  error?: string;
  metrics?: {
    duration: number;
    latencyWithinTarget: boolean;
  };
}

// Zod schema for SwarmAgent validation
const swarmAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilities: z.array(z.string()),
  workload: z.number(),
  isLocal: z.boolean(),
  type: z.string(),
  capacity: z.number()
});

export interface SwarmAgent {
  id: string;
  name: string;
  capabilities: string[];
  workload: number;
  isLocal: boolean;
  type: string;
  capacity: number;
}

/**
 * LAPA Swarm Delegate
 * 
 * Manages delegation of tasks within the swarm using local inference when available,
 * integrating with consensus mechanisms for collective decision-making.
 */
export class SwarmDelegate {
  private localHandoffSystem: LocalHandoffSystem;
  private consensusVotingSystem: ConsensusVotingSystem;
  private contextHandoffManager: ContextHandoffManager;
  private config: SwarmDelegateConfig;
  private registeredAgents: Map<string, SwarmAgent> = new Map();
  
  constructor(config?: Partial<SwarmDelegateConfig>) {
    this.localHandoffSystem = new LocalHandoffSystem();
    this.consensusVotingSystem = new ConsensusVotingSystem();
    this.contextHandoffManager = new ContextHandoffManager();
    
    // Validate config with Zod schema
    const validatedConfig = swarmDelegateConfigSchema.parse({
      enableLocalInference: true,
      latencyTargetMs: 2000,
      maxConcurrentDelegations: 10,
      enableConsensusVoting: true,
      ...config
    });
    
    this.config = validatedConfig;
  }
  
  /**
   * Registers a swarm agent for potential delegation
   * @param agent Swarm agent instance
   */
  registerAgent(agent: SwarmAgent): void {
    // Validate agent with Zod schema
    const validatedAgent = swarmAgentSchema.parse(agent);
    
    this.registeredAgents.set(validatedAgent.id, validatedAgent);
    this.consensusVotingSystem.registerAgent({
      id: validatedAgent.id,
      name: validatedAgent.name,
      expertise: validatedAgent.capabilities,
      workload: validatedAgent.workload,
      type: validatedAgent.type,
      capacity: validatedAgent.capacity
    } as Agent);
    console.log(`Registered swarm agent: ${validatedAgent.name} (${validatedAgent.id})`);
  }
  
  /**
   * Delegates a task to the most appropriate agent using local inference when possible
   * @param task Task to delegate
   * @param context Context for the task
   * @returns Promise that resolves with the delegation result
   */
  async delegateTask(task: Task, context: TaskContext): Promise<DelegationResult> {
    const startTime = performance.now();
    
    try {
      console.log(`Delegating task: ${task.id} using swarm delegate`);
      
      // If local inference is enabled and we have local agents, try local delegation first
      if (this.config.enableLocalInference && this.hasLocalAgents()) {
        const localResult = await this.delegateToLocalAgent(task, context);
        if (localResult.success) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          const result = {
            ...localResult,
            metrics: {
              duration,
              latencyWithinTarget: duration <= this.config.latencyTargetMs
            }
          };
          
          // Validate result with Zod schema
          return delegationResultSchema.parse(result);
        }
      }
      
      // Fall back to consensus-based delegation if local delegation failed or is disabled
      const consensusResult = await this.delegateViaConsensus(task, context);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result = {
        ...consensusResult,
        metrics: {
          duration,
          latencyWithinTarget: duration <= this.config.latencyTargetMs
        }
      };
      
      // Validate result with Zod schema
      return delegationResultSchema.parse(result);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Task delegation failed for ${task.id}:`, error);
      
      const result = {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration,
          latencyWithinTarget: duration <= this.config.latencyTargetMs
        }
      };
      
      // Validate result with Zod schema
      return delegationResultSchema.parse(result);
    }
  }
  
  /**
   * Delegates a task to a local agent using local inference
   * @param task Task to delegate
   * @param context Context for the task
   * @returns Promise that resolves with the delegation result
   */
  private async delegateToLocalAgent(task: Task, context: TaskContext): Promise<DelegationResult> {
    try {
      console.log(`Attempting local delegation for task: ${task.id}`);
      
      // Use the localHandoff function for zero-key handoff
      const result = await localHandoff(task, context);
      
      // Extract the target agent from the result if available
      const targetAgentId = result.handoffMetrics?.providerUsed || 'unknown-local-agent';
      
      console.log(`Local delegation successful for task: ${task.id}`);
      
      return {
        success: true,
        taskId: task.id,
        delegatedToAgentId: targetAgentId,
        result
      };
    } catch (error) {
      console.error(`Local delegation failed for task ${task.id}:`, error);
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Delegates a task via consensus voting among swarm agents
   * @param task Task to delegate
   * @param context Context for the task
   * @returns Promise that resolves with the delegation result
   */
  private async delegateViaConsensus(task: Task, context: TaskContext): Promise<DelegationResult> {
    if (!this.config.enableConsensusVoting) {
      return {
        success: false,
        taskId: task.id,
        error: 'Consensus voting is disabled'
      };
    }
    
    try {
      console.log(`Initiating consensus-based delegation for task: ${task.id}`);
      
      // Create voting options based on registered agents
      const agentOptions: VoteOption[] = Array.from(this.registeredAgents.values()).map(agent => ({
        id: agent.id,
        label: agent.name,
        value: agent
      }));
      
      if (agentOptions.length === 0) {
        throw new Error('No agents registered for consensus voting');
      }
      
      // Create voting session
      const sessionId = this.consensusVotingSystem.createVotingSession(
        `Task delegation: ${task.description}`,
        agentOptions
      );
      
      // Simulate agents casting votes (in a real implementation, agents would evaluate the task)
      const agents = Array.from(this.registeredAgents.values());
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        // Simple heuristic: agents with relevant capabilities get higher votes
        const hasRelevantCapability = agent.capabilities.some(cap =>
          task.description.toLowerCase().includes(cap.toLowerCase())
        );
        
        // Cast vote with rationale
        this.consensusVotingSystem.castVote(
          sessionId,
          agent.id,
          agent.id,
          hasRelevantCapability ? `Agent has relevant capability for task` : `General purpose agent`
        );
      }
      
      // Close voting and get result
      const consensusResult = this.consensusVotingSystem.closeVotingSession('weighted-majority');
      
      if (!consensusResult.consensusReached || !consensusResult.winningOption) {
        throw new Error('Failed to reach consensus on task delegation');
      }
      
      const winningAgentId = consensusResult.winningOption.id;
      const winningAgent = this.registeredAgents.get(winningAgentId);
      
      if (!winningAgent) {
        throw new Error(`Winning agent ${winningAgentId} not found`);
      }
      
      console.log(`Consensus reached: delegating task ${task.id} to agent ${winningAgent.name}`);
      
      // Perform context handoff to the winning agent
      const handoffRequest = {
        sourceAgentId: 'swarm-delegate',
        targetAgentId: winningAgentId,
        taskId: task.id,
        context,
        priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                 ? task.priority.toString() as 'low' | 'medium' | 'high'
                 : 'medium'
      };
      
      const handoffResponse = await this.contextHandoffManager.initiateHandoff(handoffRequest);
      
      if (!handoffResponse.success) {
        throw new Error(`Failed to initiate context handoff: ${handoffResponse.error}`);
      }
      
      // Complete handoff on target agent
      const handoffResult = await this.contextHandoffManager.completeHandoff(
        handoffResponse.handoffId, 
        winningAgentId
      );
      
      return {
        success: true,
        taskId: task.id,
        delegatedToAgentId: winningAgentId,
        result: handoffResult
      };
    } catch (error) {
      console.error(`Consensus-based delegation failed for task ${task.id}:`, error);
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Checks if there are any local agents registered
   * @returns Boolean indicating if local agents exist
   */
  private hasLocalAgents(): boolean {
    const agents = Array.from(this.registeredAgents.values());
    for (let i = 0; i < agents.length; i++) {
      if (agents[i].isLocal) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Gets current swarm delegate configuration
   * @returns Current configuration
   */
  getConfig(): SwarmDelegateConfig {
    return { ...this.config };
  }
  
  /**
   * Updates swarm delegate configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<SwarmDelegateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Swarm delegate configuration updated:', this.config);
  }
  
  /**
   * Gets registered agents
   * @returns Array of registered agents
   */
  getRegisteredAgents(): SwarmAgent[] {
    return Array.from(this.registeredAgents.values());
  }
}

// Export singleton instance
export const swarmDelegate = new SwarmDelegate();

/**
 * Convenience function for delegating tasks using the swarm delegate
 * @param task Task to delegate
 * @param context Context for the task
 * @returns Promise that resolves with the delegation result
 */
export async function delegateTask(task: Task, context: TaskContext): Promise<DelegationResult> {
  return await swarmDelegate.delegateTask(task, context);
}