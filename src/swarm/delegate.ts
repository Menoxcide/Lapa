/**
 * Swarm Delegate for LAPA v1.2 Protocol-Resonant Nexus — Phase 10
 * 
 * This module implements the swarm delegate with AutoGen Core integration and Roo Mode support.
 * It enables swarm-level handoff functionality using local inference with <1s latency target
 * while maintaining compatibility with existing swarm consensus and voting mechanisms.
 */

import { LocalHandoffSystem, localHandoff } from '../orchestrator/handoffs.local.ts';
import { ConsensusVotingSystem, VoteOption } from './consensus.voting.ts';
import { ContextHandoffManager } from './context.handoff.ts';
import { Task, Agent } from '../agents/moe-router.ts';
import { rooModeController, RooModeController } from '../modes/modes.ts';
import { RooMode } from '../modes/types/mode-types.ts';
import { eventBus, LAPAEventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import { performance } from 'perf_hooks';

// Zod schema for SwarmDelegateConfig validation
const swarmDelegateConfigSchema = z.object({
  enableLocalInference: z.boolean(),
  latencyTargetMs: z.number().min(0),
  maxConcurrentDelegations: z.number().min(1),
  enableConsensusVoting: z.boolean(),
  enableAutoGenCore: z.boolean(),
  enableRooModeIntegration: z.boolean(),
  enableFastPath: z.boolean() // Fast path for <1s delegate
});

// Type definitions for swarm delegate
export interface SwarmDelegateConfig {
  enableLocalInference: boolean;
  latencyTargetMs: number;
  maxConcurrentDelegations: number;
  enableConsensusVoting: boolean;
  enableAutoGenCore: boolean;
  enableRooModeIntegration: boolean;
  enableFastPath: boolean;
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
 * LAPA Swarm Delegate with AutoGen Core + Roo Mode Integration
 * 
 * Manages delegation of tasks within the swarm using local inference when available,
 * integrating with AutoGen Core, Roo Modes, and consensus mechanisms for collective decision-making.
 * Optimized for <1s handoff latency.
 */
export class SwarmDelegate {
  private localHandoffSystem: LocalHandoffSystem;
  private consensusVotingSystem: ConsensusVotingSystem;
  private contextHandoffManager: ContextHandoffManager;
  private rooModeController: RooModeController;
  private eventBus: LAPAEventBus;
  private config: SwarmDelegateConfig;
  private registeredAgents: Map<string, SwarmAgent> = new Map();
  private autogenCoreAgents: Map<string, SwarmAgent> = new Map();
  private fastPathCache: Map<string, { agentId: string; timestamp: number }> = new Map();
  private readonly FAST_PATH_TTL = 5000; // 5 seconds cache TTL
  
  constructor(config?: Partial<SwarmDelegateConfig>, eventBusInstance?: LAPAEventBus, modeController?: RooModeController) {
    this.localHandoffSystem = new LocalHandoffSystem();
    this.consensusVotingSystem = new ConsensusVotingSystem();
    this.contextHandoffManager = new ContextHandoffManager();
    this.eventBus = eventBusInstance || eventBus;
    this.rooModeController = modeController || rooModeController;
    
    // Validate config with Zod schema
    const validatedConfig = swarmDelegateConfigSchema.parse({
      enableLocalInference: true,
      latencyTargetMs: 1000, // <1s target for Phase 10
      maxConcurrentDelegations: 10,
      enableConsensusVoting: true,
      enableAutoGenCore: true,
      enableRooModeIntegration: true,
      enableFastPath: true,
      ...config
    });
    
    this.config = validatedConfig;
    
    // Subscribe to mode change events for Roo mode integration
    if (this.config.enableRooModeIntegration) {
      this.eventBus.subscribe('mode.changed', async (event) => {
        // Clear fast path cache on mode change
        this.fastPathCache.clear();
        console.log('Fast path cache cleared due to mode change');
      });
    }
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
   * Delegates a task to the most appropriate agent using AutoGen Core + Roo Mode integration
   * Optimized for <1s handoff latency with fast path caching
   * @param task Task to delegate
   * @param context Context for the task
   * @returns Promise that resolves with the delegation result
   */
  async delegateTask(task: Task, context: TaskContext): Promise<DelegationResult> {
    const startTime = performance.now();
    
    try {
      console.log(`Delegating task: ${task.id} using swarm delegate (AutoGen Core + Roo Mode)`);
      
      // Fast path: Check cache for recent similar task delegations (<1s optimization)
      if (this.config.enableFastPath) {
        const cached = this.getFastPathAgent(task);
        if (cached) {
          console.log(`Using fast path cache for task: ${task.id}`);
          const fastResult = await this.delegateToCachedAgent(task, context, cached.agentId);
          if (fastResult.success) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const result = {
              ...fastResult,
              metrics: {
                duration,
                latencyWithinTarget: duration <= this.config.latencyTargetMs
              }
            };
            
            return delegationResultSchema.parse(result);
          }
        }
      }
      
      // Get current Roo mode for mode-aware delegation
      const currentMode = this.config.enableRooModeIntegration 
        ? this.rooModeController.getCurrentMode() 
        : null;
      
      // AutoGen Core integration: Try AutoGen agents first if enabled
      if (this.config.enableAutoGenCore && this.hasAutoGenAgents()) {
        const autogenResult = await this.delegateToAutoGenAgent(task, context, currentMode);
        if (autogenResult.success) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Cache successful delegation for fast path
          if (this.config.enableFastPath && autogenResult.delegatedToAgentId) {
            this.setFastPathAgent(task, autogenResult.delegatedToAgentId);
          }
          
          const result = {
            ...autogenResult,
            metrics: {
              duration,
              latencyWithinTarget: duration <= this.config.latencyTargetMs
            }
          };
          
          return delegationResultSchema.parse(result);
        }
      }
      
      // If local inference is enabled and we have local agents, try local delegation
      if (this.config.enableLocalInference && this.hasLocalAgents()) {
        const localResult = await this.delegateToLocalAgent(task, context);
        if (localResult.success) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Cache successful delegation for fast path
          if (this.config.enableFastPath && localResult.delegatedToAgentId) {
            this.setFastPathAgent(task, localResult.delegatedToAgentId);
          }
          
          const result = {
            ...localResult,
            metrics: {
              duration,
              latencyWithinTarget: duration <= this.config.latencyTargetMs
            }
          };
          
          return delegationResultSchema.parse(result);
        }
      }
      
      // Fall back to consensus-based delegation if other methods failed or are disabled
      const consensusResult = await this.delegateViaConsensus(task, context);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Cache successful delegation for fast path
      if (this.config.enableFastPath && consensusResult.delegatedToAgentId) {
        this.setFastPathAgent(task, consensusResult.delegatedToAgentId);
      }
      
      const result = {
        ...consensusResult,
        metrics: {
          duration,
          latencyWithinTarget: duration <= this.config.latencyTargetMs
        }
      };
      
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
  
  /**
   * Registers an AutoGen Core agent
   * @param agent AutoGen Core agent instance
   */
  registerAutoGenAgent(agent: SwarmAgent): void {
    const validatedAgent = swarmAgentSchema.parse(agent);
    this.autogenCoreAgents.set(validatedAgent.id, validatedAgent);
    this.registeredAgents.set(validatedAgent.id, validatedAgent);
    console.log(`Registered AutoGen Core agent: ${validatedAgent.name} (${validatedAgent.id})`);
  }
  
  /**
   * Delegates a task to an AutoGen Core agent with Roo mode awareness
   * @param task Task to delegate
   * @param context Context for the task
   * @param currentMode Current Roo mode (if available)
   * @returns Promise that resolves with the delegation result
   */
  private async delegateToAutoGenAgent(
    task: Task, 
    context: TaskContext, 
    currentMode: RooMode | null
  ): Promise<DelegationResult> {
    try {
      console.log(`Attempting AutoGen Core delegation for task: ${task.id}${currentMode ? ` (mode: ${currentMode})` : ''}`);
      
      // Select best AutoGen agent based on task and current mode
      const selectedAgent = this.selectAutoGenAgent(task, currentMode);
      
      if (!selectedAgent) {
        return {
          success: false,
          taskId: task.id,
          error: 'No suitable AutoGen Core agent found'
        };
      }
      
      // Enhance context with mode information if available
      const enhancedContext = currentMode 
        ? { ...context, rooMode: currentMode, modeCapabilities: this.rooModeController.getModeConfig(currentMode)?.capabilities }
        : context;
      
      // Use local handoff system with AutoGen Core integration
      const result = await localHandoff(task, enhancedContext);
      
      const targetAgentId = result.handoffMetrics?.providerUsed || selectedAgent.id;
      
      console.log(`AutoGen Core delegation successful for task: ${task.id}`);
      
      return {
        success: true,
        taskId: task.id,
        delegatedToAgentId: targetAgentId,
        result
      };
    } catch (error) {
      console.error(`AutoGen Core delegation failed for task ${task.id}:`, error);
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Selects the best AutoGen Core agent for a task based on capabilities and current mode
   * @param task Task to delegate
   * @param currentMode Current Roo mode (if available)
   * @returns Selected agent or undefined
   */
  private selectAutoGenAgent(task: Task, currentMode: RooMode | null): SwarmAgent | undefined {
    const agents = Array.from(this.autogenCoreAgents.values());
    
    if (agents.length === 0) {
      return undefined;
    }
    
    // If mode is available, filter agents by mode capabilities
    if (currentMode) {
      const modeConfig = this.rooModeController.getModeConfig(currentMode);
      const modeCapabilities = modeConfig?.capabilities || [];
      
      // Find agents with matching capabilities
      const matchingAgents = agents.filter(agent => 
        modeCapabilities.some(cap => agent.capabilities.includes(cap))
      );
      
      if (matchingAgents.length > 0) {
        // Select agent with lowest workload
        return matchingAgents.reduce((best, current) => 
          current.workload < best.workload ? current : best
        );
      }
    }
    
    // Fallback: Select agent with matching task capabilities or lowest workload
    const taskKeywords = task.description.toLowerCase().split(/\s+/);
    const matchingAgents = agents.filter(agent =>
      agent.capabilities.some(cap => 
        taskKeywords.some(keyword => cap.toLowerCase().includes(keyword))
      )
    );
    
    if (matchingAgents.length > 0) {
      return matchingAgents.reduce((best, current) => 
        current.workload < best.workload ? current : best
      );
    }
    
    // Final fallback: Lowest workload agent
    return agents.reduce((best, current) => 
      current.workload < best.workload ? current : best
    );
  }
  
  /**
   * Checks if there are any AutoGen Core agents registered
   * @returns Boolean indicating if AutoGen agents exist
   */
  private hasAutoGenAgents(): boolean {
    return this.autogenCoreAgents.size > 0;
  }
  
  /**
   * Fast path: Get cached agent for similar task
   * @param task Task to delegate
   * @returns Cached agent info or undefined
   */
  private getFastPathAgent(task: Task): { agentId: string; timestamp: number } | undefined {
    const cacheKey = this.getTaskCacheKey(task);
    const cached = this.fastPathCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.FAST_PATH_TTL) {
      return cached;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.fastPathCache.delete(cacheKey);
    }
    
    return undefined;
  }
  
  /**
   * Fast path: Cache agent for similar task
   * @param task Task that was delegated
   * @param agentId Agent ID that handled the task
   */
  private setFastPathAgent(task: Task, agentId: string): void {
    const cacheKey = this.getTaskCacheKey(task);
    this.fastPathCache.set(cacheKey, {
      agentId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Delegates to a cached agent (fast path)
   * @param task Task to delegate
   * @param context Context for the task
   * @param agentId Cached agent ID
   * @returns Promise that resolves with the delegation result
   */
  private async delegateToCachedAgent(
    task: Task, 
    context: TaskContext, 
    agentId: string
  ): Promise<DelegationResult> {
    const agent = this.registeredAgents.get(agentId);
    
    if (!agent) {
      return {
        success: false,
        taskId: task.id,
        error: `Cached agent ${agentId} not found`
      };
    }
    
    try {
      const handoffRequest = {
        sourceAgentId: 'swarm-delegate',
        targetAgentId: agentId,
        taskId: task.id,
        context,
        priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                 ? task.priority.toString() as 'low' | 'medium' | 'high'
                 : 'medium'
      };
      
      const handoffResponse = await this.contextHandoffManager.initiateHandoff(handoffRequest);
      
      if (!handoffResponse.success) {
        throw new Error(`Failed to initiate handoff: ${handoffResponse.error}`);
      }
      
      const handoffResult = await this.contextHandoffManager.completeHandoff(
        handoffResponse.handoffId,
        agentId
      );
      
      return {
        success: true,
        taskId: task.id,
        delegatedToAgentId: agentId,
        result: handoffResult
      };
    } catch (error) {
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Generates a cache key for a task based on its characteristics
   * @param task Task to generate key for
   * @returns Cache key string
   */
  private getTaskCacheKey(task: Task): string {
    // Use task description keywords and current mode for cache key
    const mode = this.config.enableRooModeIntegration 
      ? this.rooModeController.getCurrentMode() 
      : 'default';
    const keywords = task.description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join('-');
    
    return `${mode}-${keywords}`;
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