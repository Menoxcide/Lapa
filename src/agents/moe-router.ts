/**
 * MoE Router for LAPA Core Agents
 * 
 * This module implements the Mixture of Experts (MoE) routing logic for distributing
 * tasks among specialized agents in the LAPA swarm. It analyzes incoming tasks
 * and routes them to the most appropriate agent based on expertise and workload.
 */

// Define agent types in the LAPA swarm
export type AgentType =
  | 'planner'      // High-level task planning and decomposition
  | 'coder'        // Code generation and implementation
  | 'reviewer'     // Code review and quality assurance
  | 'debugger'     // Bug detection and fixing
  | 'optimizer'    // Performance optimization
  | 'tester'       // Test creation and execution
  | 'researcher';  // Research and information gathering

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
}

/**
 * LAPA MoE Router class
 */
export class MoERouter {
  private agents: Agent[] = [];
  private maxMemoryEntries: number;
  private routingMemory: Array<{ taskId: string; agentId: string; timestamp: Date }> = [];
  
  /**
   * Registers an agent with the router
   * @param agent The agent to register
   */
  constructor(maxMemoryEntries: number = 1000) {
    this.maxMemoryEntries = maxMemoryEntries;
  }
  
  registerAgent(agent: Agent): void {
    this.agents.push(agent);
    console.log(`Registered agent: ${agent.name} (${agent.type})`);
  }
  
  /**
   * Unregisters an agent from the router
   * @param agentId The ID of the agent to unregister
   */
  unregisterAgent(agentId: string): void {
    this.agents = this.agents.filter(agent => agent.id !== agentId);
    console.log(`Unregistered agent with ID: ${agentId}`);
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
    if (this.agents.length === 0) {
      throw new Error('No agents registered with the router');
    }
    
    // Check routing memory first for recently used agents
    const recentRouting = this.getRecentRouting(task.id);
    if (recentRouting) {
      const agent = this.agents.find(a => a.id === recentRouting.agentId);
      if (agent && agent.workload < agent.capacity) {
        return {
          agent,
          confidence: 0.9,
          reasoning: 'Using recent routing decision'
        };
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
      
      // Combine scores with weights
      const totalScore = (expertiseScore * 0.8) + (workloadFactor * 0.2);
      
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
      return {
        agent: leastLoaded,
        confidence: 0.3,
        reasoning: 'All agents at capacity, selecting least loaded agent'
      };
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
    
    return {
      agent: bestMatch.agent,
      confidence,
      reasoning: bestMatch.reasoning
    };
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