/**
 * MoE Router for LAPA Core Agents
 * 
 * This module implements the Mixture of Experts (MoE) routing logic for distributing
 * tasks among specialized agents in the LAPA swarm. It analyzes incoming tasks
 * and routes them to the most appropriate agent based on expertise and workload.
 */

import { agl } from '../utils/agent-lightning-hooks.ts';
import { MAEBEEvaluator } from '../orchestrator/maebe-evaluator.ts';
import { TrustSystem, OrchestrationContext } from '../orchestrator/trust-system.ts';

// Define agent types in the LAPA swarm
export type AgentType =
  | 'planner'      // High-level task planning and decomposition
  | 'coder'        // Code generation and implementation
  | 'reviewer'     // Code review and quality assurance
  | 'debugger'     // Bug detection and fixing
  | 'optimizer'    // Performance optimization
  | 'tester'       // Test creation and execution
  | 'researcher'   // Research and information gathering
  | 'error-explainer'  // Error explanation and debugging assistance
  | 'custom'       // Custom agent type for specialized tasks
  | 'removable';   // Removable agent type for temporary agents

// Define a task with its characteristics
export interface Task {
  id: string;
  description: string;
  type: string;
  priority: number;
  context?: Record<string, unknown>;
}

// Define an agent with its capabilities
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  expertise: string[];
  workload: number; // Number of active tasks
  capacity: number; // Maximum concurrent tasks
}

// Routing result
export interface RoutingResult {
  agent: Agent;
  confidence: number;
  reasoning: string;
  trustScore?: number;
  trustRecommendation?: 'trust' | 'distrust' | 'cautious';
}

/**
 * LAPA MoE Router class
 */
export class MoERouter {
  private agents: Agent[] = [];
  private maxMemoryEntries: number;
  private routingMemory: Array<{ taskId: string; agentId: string; timestamp: Date }> = [];
  private maebeEvaluator?: MAEBEEvaluator;
  private trustSystem?: TrustSystem;
  private enableTrustAwareRouting: boolean;
  
  /**
   * Registers an agent with the router
   * @param agent The agent to register
   */
  constructor(
    maxMemoryEntries: number = 1000, 
    enableMAEBE: boolean = false,
    trustSystem?: TrustSystem,
    enableTrustAwareRouting: boolean = false
  ) {
    this.maxMemoryEntries = maxMemoryEntries;
    this.trustSystem = trustSystem;
    this.enableTrustAwareRouting = enableTrustAwareRouting && trustSystem !== undefined;
    
    // Initialize MAEBE evaluator if enabled
    if (enableMAEBE) {
      this.maebeEvaluator = new MAEBEEvaluator({
        enabled: true,
        enableAgentLightningTracking: true
      });
    }

    // Register agents with trust system if enabled
    if (this.enableTrustAwareRouting && this.trustSystem) {
      // Register existing agents
      this.agents.forEach(agent => this.trustSystem!.registerAgent(agent));
    }
  }
  
  registerAgent(agent: Agent): void {
    this.agents.push(agent);
    console.log(`Registered agent: ${agent.name} (${agent.type})`);
    
    // Register with trust system if enabled
    if (this.enableTrustAwareRouting && this.trustSystem) {
      this.trustSystem.registerAgent(agent);
    }
  }
  
  /**
   * Unregisters an agent from the router
   * @param agentId The ID of the agent to unregister
   */
  unregisterAgent(agentId: string): void {
    this.agents = this.agents.filter(agent => agent.id !== agentId);
    console.log(`Unregistered agent with ID: ${agentId}`);
    
    // Unregister from trust system if enabled
    if (this.enableTrustAwareRouting && this.trustSystem) {
      this.trustSystem.unregisterAgent(agentId);
    }
  }
  
  /**
   * Updates an agent's workload
   * @param agentId The ID of the agent
   * @param workload The new workload value
   */
  updateAgentWorkload(agentId: string, workload: number): void {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.workload = workload;
    }
  }
  
  /**
   * Routes a task to the most appropriate agent
   * @param task The task to route
   * @returns Routing result with selected agent and confidence
   */
  routeTask(task: Task): RoutingResult {
    // Use async version if trust-aware routing is enabled
    if (this.enableTrustAwareRouting && this.trustSystem) {
      // For synchronous compatibility, we'll use a cached trust approach
      // Full async trust evaluation should use routeTaskWithTrust
      return this.routeTaskSync(task);
    }
    return this.routeTaskSync(task);
  }

  /**
   * Routes a task with trust-aware evaluation (async)
   * @param task The task to route
   * @returns Routing result with selected agent, confidence, and trust information
   */
  async routeTaskWithTrust(task: Task): Promise<RoutingResult> {
    if (!this.trustSystem) {
      // Fallback to sync routing if trust system not available
      return this.routeTaskSync(task);
    }

    const spanId = agl.emitSpan('moe.router.route_trust', {
      taskId: task.id,
      taskType: task.type,
      priority: task.priority
    });

    try {
      if (this.agents.length === 0) {
        agl.endSpan(spanId, 'error', { error: 'No agents registered' });
        throw new Error('No agents registered with the router');
      }

      // Get trust-ranked agents
      const trustRanking = await this.trustSystem.rankAgentsByTrust(
        this.agents,
        task
      );

      // Filter agents by capacity and trust
      const availableAgents = trustRanking.agents.filter(a => 
        a.agent.workload < a.agent.capacity &&
        a.trustEvaluation.recommendation !== 'distrust'
      );

      if (availableAgents.length === 0) {
        // Fallback to sync routing if no trusted agents available
        console.warn('No trusted agents available, falling back to standard routing');
        return this.routeTaskSync(task);
      }

      // Select top trusted agent
      const selected = availableAgents[0];
      const trustEvaluation = selected.trustEvaluation;

      // Calculate combined score (trust + expertise + workload)
      const expertiseScore = this.calculateExpertiseMatch(task, selected.agent);
      const workloadFactor = 1 - (selected.agent.workload / selected.agent.capacity);
      
      // Combine: trust 30%, expertise 50%, workload 20%
      const totalScore = (
        trustEvaluation.trustScore * 0.3 +
        expertiseScore * 0.5 +
        workloadFactor * 0.2
      );

      const result: RoutingResult = {
        agent: selected.agent,
        confidence: Math.min(totalScore, 1.0),
        reasoning: `Trust-aware routing: ${trustEvaluation.reasoning}. Expertise: ${(expertiseScore * 100).toFixed(0)}%, Workload: ${(workloadFactor * 100).toFixed(0)}%`,
        trustScore: trustEvaluation.trustScore,
        trustRecommendation: trustEvaluation.recommendation
      };

      // Record routing decision
      this.recordRoutingDecision(task.id, selected.agent.id);

      agl.emitMetric('moe.router.trust_routing', {
        taskId: task.id,
        agentId: selected.agent.id,
        trustScore: trustEvaluation.trustScore,
        confidence: result.confidence
      });

      agl.endSpan(spanId, 'success', {
        agentId: selected.agent.id,
        agentType: selected.agent.type,
        confidence: result.confidence,
        trustScore: trustEvaluation.trustScore
      });

      return result;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      // Fallback to sync routing on error
      return this.routeTaskSync(task);
    }
  }

  /**
   * Synchronous routing (original implementation)
   * @param task The task to route
   * @returns Routing result with selected agent and confidence
   */
  private routeTaskSync(task: Task): RoutingResult {
    // Track task routing with Agent Lightning
    const spanId = agl.emitSpan('moe.router.route', {
      taskId: task.id,
      taskType: task.type,
      priority: task.priority
    });

    try {
      if (this.agents.length === 0) {
        agl.endSpan(spanId, 'error', { error: 'No agents registered' });
        throw new Error('No agents registered with the router');
      }
      
      // Check routing memory first for recently used agents
      const recentRouting = this.getRecentRouting(task.id);
      if (recentRouting) {
        const agent = this.agents.find(a => a.id === recentRouting.agentId);
        if (agent && agent.workload < agent.capacity) {
          const result = {
            agent,
            confidence: 0.9,
            reasoning: 'Using recent routing decision'
          };
          agl.endSpan(spanId, 'success', {
            agentId: agent.id,
            agentType: agent.type,
            confidence: 0.9
          });
          return result;
        }
      }
    
      // Calculate suitability scores for each agent
    const scores = this.agents.map(agent => {
      // Skip agents at full capacity
      if (agent.workload >= agent.capacity) {
        return { agent, score: -1, reasoning: 'At full capacity' };
      }
      
      // Calculate expertise match score (0-1)
      const expertiseScore = this.calculateExpertiseMatch(task, agent);
      
      // Calculate workload factor (0-1, higher = less loaded)
      const workloadFactor = 1 - (agent.workload / agent.capacity);
      
      // Calculate MAEBE emergent behavior score (if enabled)
      // Note: MAEBE evaluation is async, so we use cached scores or default
      // For full integration, consider making routeTask async or use cached scores
      let maebeScore = 1.0; // Default: no risk
      if (this.maebeEvaluator) {
        try {
          // Use cached behavior history for synchronous scoring
          // Full async evaluation would require making routeTask async
          const agentBehaviors = (this.maebeEvaluator as any).behaviorHistory?.get(agent.id);
          if (agentBehaviors && agentBehaviors.length > 0) {
            // Calculate average severity and invert for score (higher severity = lower score)
            const avgSeverity = agentBehaviors.reduce((sum: number, b: any) => sum + b.severity, 0) / agentBehaviors.length;
            maebeScore = Math.max(0, 1.0 - avgSeverity);
          }
        } catch (maebeError) {
          console.warn('MAEBE score calculation failed, using default:', maebeError);
          maebeScore = 1.0;
        }
      }
      
      // Combine scores with weights: expertise 70%, workload 20%, MAEBE 10%
      // If trust-aware routing is enabled but we're in sync mode, trust is not included
      const totalScore = (expertiseScore * 0.7) + (workloadFactor * 0.2) + (maebeScore * 0.1);
      
      return {
        agent,
        score: totalScore,
        reasoning: `Expertise match: ${(expertiseScore * 100).toFixed(1)}%, Workload factor: ${(workloadFactor * 100).toFixed(1)}%`
      };
    });
    
    // Filter out agents at full capacity
    const validScores = scores.filter(s => s.score >= 0);
    
    if (validScores.length === 0) {
      // All agents at full capacity, select the one with lowest workload
      const leastLoaded = [...this.agents].sort((a, b) => a.workload - b.workload)[0];
      const result = {
        agent: leastLoaded,
        confidence: 0.3,
        reasoning: 'All agents at capacity, selecting least loaded agent'
      };
      agl.endSpan(spanId, 'success', {
        agentId: leastLoaded.id,
        agentType: leastLoaded.type,
        confidence: 0.3,
        warning: 'All agents at capacity'
      });
      return result;
    }
    
    // Log scores for debugging
    console.log('Agent scores:', validScores.map(s => ({
      agent: `${s.agent.name} (${s.agent.type})`,
      score: s.score,
      reasoning: s.reasoning
    })));
    
    // Select the agent with highest score
    const bestMatch = validScores.reduce((best, current) => {
      // If scores are equal, prefer reviewer for review tasks, then coder for code tasks
      if (current.score === best.score) {
        // Log tie-breaking decision
        console.log(`Tie detected between ${best.agent.name} (${best.agent.type}) and ${current.agent.name} (${current.agent.type}) with score ${current.score}`);
        
        // For review tasks, prefer reviewer agent
        if (task.description.toLowerCase().includes('review') && best.agent.type !== 'reviewer' && current.agent.type === 'reviewer') {
          console.log(`Breaking tie by preferring reviewer agent for review task`);
          return current;
        }
        
        // For code tasks, prefer coder agent
        if (task.description.toLowerCase().includes('code') && best.agent.type !== 'coder' && current.agent.type === 'coder') {
          console.log(`Breaking tie by preferring coder agent for code task`);
          return current;
        }
        
        // Default to first agent (existing behavior)
        console.log(`Breaking tie by selecting first agent (existing behavior)`);
        return best;
      }
      
      return current.score > best.score ? current : best;
    });
    
    // Convert score to confidence (0-1)
    const confidence = Math.min(bestMatch.score, 1);
    
    // Record routing decision for memory
    this.recordRoutingDecision(task.id, bestMatch.agent.id);

    const result = {
      agent: bestMatch.agent,
      confidence,
      reasoning: bestMatch.reasoning
    };

      // Track successful routing
      agl.endSpan(spanId, 'success', {
        agentId: bestMatch.agent.id,
        agentType: bestMatch.agent.type,
        confidence
      });
      
      return result;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Calculates expertise match between task and agent
   * @param task The task to evaluate
   * @param agent The agent to evaluate
   * @returns Match score between 0 and 1
   */
  private calculateExpertiseMatch(task: Task, agent: Agent): number {
    // Simple keyword matching approach
    const taskLower = task.description.toLowerCase();
    let matchCount = 0;
    
    // Log expertise matching for debugging
    console.log(`Matching task "${task.description}" against agent ${agent.name} (${agent.type}) expertise:`, agent.expertise);
    
    for (const expertise of agent.expertise) {
      if (taskLower.includes(expertise.toLowerCase())) {
        console.log(`Found match: "${expertise}" in task description`);
        matchCount++;
      }
    }
    
    // Normalize to 0-1 scale
    const score = matchCount / agent.expertise.length;
    console.log(`Expertise match score for ${agent.name} (${agent.type}): ${score} (${matchCount}/${agent.expertise.length})`);
    return score;
  }
  
  /**
   * Gets all registered agents
   * @returns Array of registered agents
   */
  getAgents(): Agent[] {
    return [...this.agents];
  }

  /**
   * Gets registered agents (alias for getAgents for compatibility)
   * @returns Array of registered agents
   */
  getRegisteredAgents(): Agent[] {
    return this.getAgents();
  }

  /**
   * Sets trust system for trust-aware routing
   * @param trustSystem The trust system to use
   * @param enable Whether to enable trust-aware routing
   */
  setTrustSystem(trustSystem: TrustSystem, enable: boolean = true): void {
    this.trustSystem = trustSystem;
    this.enableTrustAwareRouting = enable;
    
    // Register all existing agents with trust system
    if (enable) {
      this.agents.forEach(agent => trustSystem.registerAgent(agent));
    }
  }
  
  /**
   * Gets agent by ID
   * @param agentId The ID of the agent
   * @returns The agent or undefined if not found
   */
  getAgentById(agentId: string): Agent | undefined {
    return this.agents.find(agent => agent.id === agentId);
  }
  
  /**
   * Records a routing decision for memory
   * @param taskId Task ID
   * @param agentId Agent ID
   */
  private recordRoutingDecision(taskId: string, agentId: string): void {
    this.routingMemory.push({
      taskId,
      agentId,
      timestamp: new Date()
    });
    
    // Trim memory if it exceeds the limit
    if (this.routingMemory.length > this.maxMemoryEntries) {
      this.routingMemory = this.routingMemory.slice(-this.maxMemoryEntries);
    }
  }
  
  /**
   * Gets recent routing decision for a task
   * @param taskId Task ID
   * @returns Routing decision or undefined if not found
   */
  private getRecentRouting(taskId: string): { agentId: string; timestamp: Date } | undefined {
    // Look for routing decisions in the last 10 minutes
    const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
    
    // Find the most recent routing decision for this task
    const recentRouting = this.routingMemory
      .filter(entry => entry.taskId === taskId && entry.timestamp > cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    return recentRouting ? { agentId: recentRouting.agentId, timestamp: recentRouting.timestamp } : undefined;
  }
}

// Default export for convenience
export const moeRouter = new MoERouter();