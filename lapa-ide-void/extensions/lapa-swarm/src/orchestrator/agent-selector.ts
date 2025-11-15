/**
 * AI-Powered Agent Selection System
 * 
 * ML-based agent selection that learns from past deployments
 * to optimize agent selection for tasks.
 */

import { neuraforgeOrchestrator, type AgentDeployment } from './neuraforge-orchestrator.ts';
import { agentMonitor } from './agent-monitor.ts';

export interface TaskAnalysis {
  taskDescription: string;
  keywords: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // milliseconds
  requiredCapabilities: string[];
  preferredAgents: string[];
}

export interface AgentRecommendation {
  agentName: string;
  confidence: number; // 0-1
  reasoning: string;
  estimatedSuccessRate: number; // 0-1
  estimatedTime: number; // milliseconds
  capabilities: string[];
}

export interface SelectionHistory {
  taskDescription: string;
  selectedAgent: string;
  success: boolean;
  actualTime: number;
  timestamp: Date;
}

/**
 * AI-Powered Agent Selector
 */
export class AgentSelector {
  private selectionHistory: SelectionHistory[] = [];
  private agentCapabilities: Map<string, string[]> = new Map();
  private agentPerformance: Map<string, { successes: number; failures: number; avgTime: number }> = new Map();
  // Optimized: Capability index for O(1) lookups instead of O(n) searches
  private capabilityIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeAgentCapabilities();
    this.buildCapabilityIndex();
  }

  /**
   * Initialize agent capabilities mapping
   */
  private initializeAgentCapabilities(): void {
    const capabilities: Record<string, string[]> = {
      'ARCHITECT': ['planning', 'architecture', 'design', 'system-design', 'decomposition'],
      'CODER': ['coding', 'implementation', 'programming', 'development', 'code-generation'],
      'REVIEWER': ['code-review', 'quality-assurance', 'best-practices', 'linting', 'validation'],
      'TEST': ['testing', 'test-creation', 'test-automation', 'quality-assurance', 'validation'],
      'DEBUGGER': ['debugging', 'troubleshooting', 'bug-fixing', 'error-handling', 'diagnostics'],
      'OPTIMIZER': ['optimization', 'performance', 'efficiency', 'resource-management', 'profiling'],
      'PLANNER': ['planning', 'task-decomposition', 'scheduling', 'coordination', 'strategy'],
      'VALIDATOR': ['validation', 'verification', 'testing', 'quality-assurance', 'compliance'],
      'INTEGRATOR': ['integration', 'merging', 'coordination', 'system-integration', 'api-integration'],
      'DEPLOYER': ['deployment', 'release-management', 'ci-cd', 'devops', 'infrastructure'],
      'DOCUMENTATION': ['documentation', 'writing', 'technical-writing', 'api-docs', 'guides'],
      'RESEARCH_WIZARD': ['research', 'information-gathering', 'analysis', 'investigation', 'exploration'],
      'MCP': ['mcp', 'protocol', 'integration', 'tool-development', 'server-development'],
      'FEATURE': ['feature-development', 'implementation', 'innovation', 'product-development'],
      'FILESYSTEM': ['filesystem', 'file-management', 'cleanup', 'organization', 'archiving'],
      'NEURAFORGE': ['orchestration', 'coordination', 'multi-agent', 'workflow', 'planning'],
      'PERSONA_EVOLVER': ['evolution', 'optimization', 'system-improvement', 'analysis', 'refinement']
    };

    for (const [agent, caps] of Object.entries(capabilities)) {
      this.agentCapabilities.set(agent, caps);
    }
  }

  /**
   * Build capability index for fast O(1) lookups
   * Maps capability -> Set of agents that have that capability
   */
  private buildCapabilityIndex(): void {
    for (const [agentName, capabilities] of this.agentCapabilities) {
      for (const capability of capabilities) {
        const lowerCap = capability.toLowerCase();
        if (!this.capabilityIndex.has(lowerCap)) {
          this.capabilityIndex.set(lowerCap, new Set());
        }
        this.capabilityIndex.get(lowerCap)!.add(agentName);
      }
    }
  }

  /**
   * Analyze task and recommend best agent
   */
  async selectAgent(taskDescription: string): Promise<AgentRecommendation[]> {
    // Analyze task
    const analysis = this.analyzeTask(taskDescription);

    // Get recommendations
    const recommendations = await this.generateRecommendations(analysis);

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  }

  /**
   * Analyze task to extract features
   * Optimized with capability index for faster lookups
   */
  private analyzeTask(taskDescription: string): TaskAnalysis {
    const lower = taskDescription.toLowerCase();
    
    // Extract keywords using capability index (O(1) lookups)
    const keywords: string[] = [];
    const agentMatches = new Map<string, number>(); // Track match counts
    
    // Check each capability in the index
    for (const [capability, agents] of this.capabilityIndex) {
      if (lower.includes(capability)) {
        keywords.push(capability);
        // Increment match count for each agent with this capability
        for (const agentName of agents) {
          agentMatches.set(agentName, (agentMatches.get(agentName) || 0) + 1);
        }
      }
    }

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    const wordCount = taskDescription.split(/\s+/).length;
    if (wordCount < 10) complexity = 'simple';
    else if (wordCount > 50) complexity = 'complex';

    // Estimate duration (simple heuristic)
    let estimatedDuration = 5000; // 5 seconds default
    if (complexity === 'simple') estimatedDuration = 2000;
    else if (complexity === 'complex') estimatedDuration = 15000;

    // Extract required capabilities
    const requiredCapabilities = [...new Set(keywords)];

    // Find preferred agents using pre-computed matches (optimized)
    const preferredAgents = Array.from(agentMatches.keys())
      .filter(agentName => (agentMatches.get(agentName) || 0) > 0)
      .sort((a, b) => (agentMatches.get(b) || 0) - (agentMatches.get(a) || 0)); // Sort by match count

    return {
      taskDescription,
      keywords,
      complexity,
      estimatedDuration,
      requiredCapabilities,
      preferredAgents
    };
  }

  /**
   * Generate agent recommendations
   */
  private async generateRecommendations(analysis: TaskAnalysis): Promise<AgentRecommendation[]> {
    const recommendations: AgentRecommendation[] = [];

    // Score each agent
    for (const agentName of analysis.preferredAgents) {
      const capabilities = this.agentCapabilities.get(agentName) || [];
      const performance = this.agentPerformance.get(agentName) || { successes: 0, failures: 0, avgTime: 0 };

      // Calculate capability match score
      const capabilityMatches = capabilities.filter(cap =>
        analysis.requiredCapabilities.some(req =>
          req.toLowerCase().includes(cap.toLowerCase()) ||
          cap.toLowerCase().includes(req.toLowerCase())
        )
      ).length;
      
      const capabilityScore = capabilities.length > 0
        ? capabilityMatches / capabilities.length
        : 0;

      // Calculate performance score
      const totalAttempts = performance.successes + performance.failures;
      const successRate = totalAttempts > 0
        ? performance.successes / totalAttempts
        : 0.8; // Default optimistic rate

      // Calculate confidence (weighted combination)
      const confidence = (capabilityScore * 0.6) + (successRate * 0.4);

      // Estimate time based on historical performance
      const estimatedTime = performance.avgTime > 0
        ? performance.avgTime
        : analysis.estimatedDuration;

      // Generate reasoning
      const reasoning = this.generateReasoning(agentName, capabilityScore, successRate, capabilityMatches);

      recommendations.push({
        agentName,
        confidence,
        reasoning,
        estimatedSuccessRate: successRate,
        estimatedTime,
        capabilities
      });
    }

    // If no preferred agents, recommend based on task keywords
    if (recommendations.length === 0) {
      // Fallback to general agents
      const fallbackAgents = ['CODER', 'PLANNER', 'ARCHITECT'];
      for (const agentName of fallbackAgents) {
        recommendations.push({
          agentName,
          confidence: 0.5,
          reasoning: `General-purpose agent recommended for: ${analysis.taskDescription.substring(0, 50)}...`,
          estimatedSuccessRate: 0.7,
          estimatedTime: analysis.estimatedDuration,
          capabilities: this.agentCapabilities.get(agentName) || []
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    agentName: string,
    capabilityScore: number,
    successRate: number,
    matches: number
  ): string {
    const reasons: string[] = [];

    if (capabilityScore > 0.7) {
      reasons.push(`Strong capability match (${(capabilityScore * 100).toFixed(0)}%)`);
    } else if (capabilityScore > 0.4) {
      reasons.push(`Moderate capability match (${(capabilityScore * 100).toFixed(0)}%)`);
    }

    if (successRate > 0.9) {
      reasons.push(`Excellent historical performance (${(successRate * 100).toFixed(0)}% success rate)`);
    } else if (successRate > 0.7) {
      reasons.push(`Good historical performance (${(successRate * 100).toFixed(0)}% success rate)`);
    }

    if (matches > 0) {
      reasons.push(`${matches} capability match${matches > 1 ? 'es' : ''} found`);
    }

    if (reasons.length === 0) {
      reasons.push('General-purpose agent suitable for this task');
    }

    return `${agentName}: ${reasons.join(', ')}.`;
  }

  /**
   * Record selection outcome for learning
   */
  recordOutcome(
    taskDescription: string,
    selectedAgent: string,
    success: boolean,
    actualTime: number
  ): void {
    const history: SelectionHistory = {
      taskDescription,
      selectedAgent,
      success,
      actualTime,
      timestamp: new Date()
    };

    this.selectionHistory.push(history);

    // Keep last 1000 records
    if (this.selectionHistory.length > 1000) {
      this.selectionHistory.shift();
    }

    // Update performance metrics
    const performance = this.agentPerformance.get(selectedAgent) || {
      successes: 0,
      failures: 0,
      avgTime: 0
    };

    if (success) {
      performance.successes++;
    } else {
      performance.failures++;
    }

    // Update average time (exponential moving average)
    if (performance.avgTime === 0) {
      performance.avgTime = actualTime;
    } else {
      performance.avgTime = (performance.avgTime * 0.9) + (actualTime * 0.1);
    }

    this.agentPerformance.set(selectedAgent, performance);
  }

  /**
   * Get selection history
   */
  getSelectionHistory(): SelectionHistory[] {
    return [...this.selectionHistory];
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(): Map<string, { successes: number; failures: number; avgTime: number }> {
    return new Map(this.agentPerformance);
  }

  /**
   * Get best agent for task (single recommendation)
   */
  async getBestAgent(taskDescription: string): Promise<AgentRecommendation | null> {
    const recommendations = await this.selectAgent(taskDescription);
    return recommendations.length > 0 ? recommendations[0] : null;
  }
}

// Export singleton instance
export const agentSelector = new AgentSelector();

