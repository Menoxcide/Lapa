/**
 * Trust System for Orchestrator-Agent Coordination
 * 
 * Implements trust-aware orchestration with zero-shot trust evaluation
 * Based on: "Agentic AI with Orchestrator-Agent Trust: A Modular Visual Classification Framework 
 * with Trust-Aware Orchestration and RAG-Based Reasoning"
 * 
 * Features:
 * - Zero-shot trust evaluation for agents without history
 * - RAG-enhanced trust evaluation with evidence retrieval
 * - Performance-based trust updates
 * - Trust-aware agent ranking
 * - Historical trust tracking
 */

import { RAGPipeline } from '../rag/pipeline.ts';
import { Agent, Task } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Agent trust information
 */
export interface AgentTrust {
  agentId: string;
  trustScore: number; // 0-1
  confidence: number; // 0-1
  history: TrustHistory[];
  capabilities: string[];
  performanceMetrics: PerformanceMetrics;
  zeroShotTrust?: ZeroShotTrustMetrics;
  lastUpdated: number;
}

/**
 * Trust history entry
 */
export interface TrustHistory {
  timestamp: number;
  taskId: string;
  success: boolean;
  performanceScore: number;
  trustChange: number;
}

/**
 * Performance metrics for trust calculation
 */
export interface PerformanceMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averagePerformanceScore: number;
  recentPerformanceTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Zero-shot trust metrics for agents without history
 */
export interface ZeroShotTrustMetrics {
  capabilityMatch: number; // 0-1
  similarityScore: number; // 0-1
  historicalPattern: number; // 0-1
  ragEvidence: number; // 0-1
  overallScore: number; // 0-1
}

/**
 * Trust evaluation result
 */
export interface TrustEvaluation {
  agentId: string;
  trustScore: number;
  confidence: number;
  reasoning: string;
  factors: TrustFactor[];
  recommendation: 'trust' | 'distrust' | 'cautious';
}

/**
 * Trust factor contributing to evaluation
 */
export interface TrustFactor {
  type: 'performance' | 'capability' | 'consistency' | 'history' | 'rag_evidence';
  weight: number;
  score: number;
  evidence: string;
}

/**
 * Orchestration context for trust evaluation
 */
export interface OrchestrationContext {
  task: Task;
  systemState?: Record<string, any>;
  similarTasks?: Task[];
}

/**
 * Task result for trust updates
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  performanceScore: number; // 0-1
  duration?: number;
  error?: string;
}

/**
 * Trust-ranked agents result
 */
export interface TrustRankedAgents {
  agents: Array<{
    agent: Agent;
    trustEvaluation: TrustEvaluation;
    rank: number;
    totalScore: number;
  }>;
  rankingCriteria: string;
  timestamp: number;
}

/**
 * Trust system configuration
 */
export interface TrustSystemConfig {
  minTrustThreshold: number; // Minimum trust score for routing (default: 0.3)
  trustDecayRate: number; // Trust decay per time period (default: 0.01)
  confidenceThreshold: number; // Minimum confidence for high-trust decisions (default: 0.7)
  ragWeight: number; // Weight for RAG evidence in trust calculation (default: 0.2)
  performanceWeight: number; // Weight for performance history (default: 0.3)
  capabilityWeight: number; // Weight for capability matching (default: 0.3)
  consistencyWeight: number; // Weight for consistency (default: 0.2)
  enableRAG: boolean; // Enable RAG-enhanced trust evaluation (default: true)
  maxHistorySize: number; // Maximum trust history entries per agent (default: 100)
}

const DEFAULT_CONFIG: TrustSystemConfig = {
  minTrustThreshold: 0.3,
  trustDecayRate: 0.01,
  confidenceThreshold: 0.7,
  ragWeight: 0.2,
  performanceWeight: 0.3,
  capabilityWeight: 0.3,
  consistencyWeight: 0.2,
  enableRAG: true,
  maxHistorySize: 100
};

/**
 * Trust System for Orchestrator-Agent Coordination
 */
export class TrustSystem {
  private agentTrusts: Map<string, AgentTrust> = new Map();
  private trustHistory: Map<string, TrustHistory[]> = new Map();
  private ragPipeline?: RAGPipeline;
  private config: TrustSystemConfig;
  private agentRegistry: Map<string, Agent> = new Map();
  
  constructor(
    ragPipeline?: RAGPipeline,
    config?: Partial<TrustSystemConfig>
  ) {
    this.ragPipeline = ragPipeline;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Registers an agent for trust tracking
   */
  registerAgent(agent: Agent): void {
    this.agentRegistry.set(agent.id, agent);
    if (!this.agentTrusts.has(agent.id)) {
      this.initializeTrust(agent.id);
    }
  }

  /**
   * Unregisters an agent
   */
  unregisterAgent(agentId: string): void {
    this.agentRegistry.delete(agentId);
    this.agentTrusts.delete(agentId);
    this.trustHistory.delete(agentId);
  }

  /**
   * Evaluates agent trust for orchestration decision
   */
  async evaluateTrust(
    agentId: string,
    context: OrchestrationContext
  ): Promise<TrustEvaluation> {
    const spanId = agl.emitSpan('trust.evaluate', {
      agentId,
      taskId: context.task.id,
      taskType: context.task.type
    });

    try {
      const agent = this.agentRegistry.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not registered`);
      }

      const currentTrust = this.agentTrusts.get(agentId);
      
      // Zero-shot trust evaluation
      const zeroShotTrust = await this.evaluateZeroShotTrust(agent, context);
      
      // Historical trust evaluation
      const historicalTrust = currentTrust 
        ? await this.evaluateHistoricalTrust(currentTrust, context)
        : null;
      
      // RAG-enhanced trust evaluation
      const ragTrust = this.config.enableRAG && this.ragPipeline
        ? await this.evaluateRAGTrust(agent, context)
        : { score: 0.5, evidence: 'RAG disabled or unavailable' };
      
      // Combine trust factors
      const trustFactors: TrustFactor[] = [
        {
          type: 'capability',
          weight: this.config.capabilityWeight,
          score: zeroShotTrust.capabilityMatch,
          evidence: `Agent capabilities match task requirements: ${this.calculateCapabilityMatch(agent, context.task).toFixed(2)}`
        },
        {
          type: 'performance',
          weight: this.config.performanceWeight,
          score: historicalTrust?.trustScore || 0.5,
          evidence: historicalTrust 
            ? `Historical performance: ${historicalTrust.trustScore.toFixed(2)}`
            : 'No historical data available'
        },
        {
          type: 'rag_evidence',
          weight: this.config.ragWeight,
          score: ragTrust.score,
          evidence: ragTrust.evidence
        },
        {
          type: 'consistency',
          weight: this.config.consistencyWeight,
          score: currentTrust 
            ? this.calculateConsistency(currentTrust)
            : 0.5,
          evidence: currentTrust
            ? `Consistency score: ${this.calculateConsistency(currentTrust).toFixed(2)}`
            : 'No consistency data available'
        }
      ];
      
      // Calculate weighted trust score
      const trustScore = trustFactors.reduce((sum, factor) => 
        sum + (factor.score * factor.weight), 0
      );
      
      // Calculate confidence
      const confidence = this.calculateConfidence(trustFactors, historicalTrust);
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(trustScore, confidence);
      
      const evaluation: TrustEvaluation = {
        agentId,
        trustScore,
        confidence,
        reasoning: this.generateReasoning(trustFactors, trustScore),
        factors: trustFactors,
        recommendation
      };

      agl.emitMetric('trust.evaluation', {
        agentId,
        trustScore,
        confidence,
        recommendation
      });

      agl.endSpan(spanId, 'success', {
        trustScore,
        confidence,
        recommendation
      });

      return evaluation;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Zero-shot trust evaluation for agents without history
   */
  async evaluateZeroShotTrust(
    agent: Agent,
    context: OrchestrationContext
  ): Promise<ZeroShotTrustMetrics> {
    // Evaluate capability match
    const capabilityMatch = this.calculateCapabilityMatch(agent, context.task);
    
    // Evaluate similarity to successful agents
    const similarityScore = await this.calculateSimilarityScore(
      agent,
      context.similarTasks || []
    );
    
    // Evaluate historical patterns (if similar agents exist)
    const historicalPattern = await this.evaluateHistoricalPattern(
      agent,
      context
    );
    
    // RAG-based evidence retrieval
    const ragEvidence = this.config.enableRAG && this.ragPipeline
      ? await this.retrieveRAGEvidence(agent, context)
      : 0.5;
    
    // Calculate overall zero-shot trust
    const overallScore = (
      capabilityMatch * 0.4 +
      similarityScore * 0.3 +
      historicalPattern * 0.2 +
      ragEvidence * 0.1
    );
    
    return {
      capabilityMatch,
      similarityScore,
      historicalPattern,
      ragEvidence,
      overallScore
    };
  }
  
  /**
   * RAG-enhanced trust evaluation
   */
  private async evaluateRAGTrust(
    agent: Agent,
    context: OrchestrationContext
  ): Promise<{ score: number; evidence: string }> {
    if (!this.ragPipeline) {
      return {
        score: 0.5,
        evidence: 'RAG pipeline not available'
      };
    }

    try {
      // Retrieve relevant context from RAG
      const query = `Agent trust evaluation for ${agent.type} on ${context.task.type} task: ${context.task.description}`;
      const ragResults = await this.ragPipeline.searchSimilar(query, 5);
      
      if (ragResults.length === 0) {
        return {
          score: 0.5,
          evidence: 'No RAG evidence found'
        };
      }
      
      // Analyze RAG results for trust indicators
      const trustIndicators = this.analyzeRAGResults(ragResults, agent, context);
      
      // Calculate trust score from RAG evidence
      const score = this.calculateRAGTrustScore(trustIndicators);
      
      // Generate evidence string
      const evidence = this.generateRAGEvidence(ragResults, trustIndicators);
      
      return { score, evidence };
    } catch (error) {
      console.warn('RAG trust evaluation failed:', error);
      return {
        score: 0.5,
        evidence: `RAG evaluation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Updates trust based on task performance
   */
  async updateTrust(
    agentId: string,
    taskResult: TaskResult
  ): Promise<AgentTrust> {
    const spanId = agl.emitSpan('trust.update', {
      agentId,
      taskId: taskResult.taskId
    });

    try {
      const currentTrust = this.agentTrusts.get(agentId) || this.initializeTrust(agentId);
      
      // Calculate performance-based trust change
      const trustChange = this.calculateTrustChange(taskResult);
      
      // Update trust score
      const newTrustScore = Math.max(0, Math.min(1, 
        currentTrust.trustScore + trustChange
      ));
      
      // Update confidence based on task history
      const newConfidence = this.updateConfidence(
        currentTrust,
        taskResult,
        trustChange
      );
      
      // Add to history
      const trustHistory: TrustHistory = {
        timestamp: Date.now(),
        taskId: taskResult.taskId,
        success: taskResult.success,
        performanceScore: taskResult.performanceScore,
        trustChange
      };
      
      const history = this.trustHistory.get(agentId) || [];
      const updatedHistory = [...history, trustHistory].slice(-this.config.maxHistorySize);
      this.trustHistory.set(agentId, updatedHistory);
      
      // Update performance metrics
      const performanceMetrics = this.updatePerformanceMetrics(
        currentTrust.performanceMetrics,
        taskResult
      );
      
      const updatedTrust: AgentTrust = {
        ...currentTrust,
        trustScore: newTrustScore,
        confidence: newConfidence,
        history: updatedHistory,
        performanceMetrics,
        lastUpdated: Date.now()
      };
      
      // Store updated trust
      this.agentTrusts.set(agentId, updatedTrust);
      
      // Track trust update
      agl.emitMetric('trust.update', {
        agentId,
        oldTrustScore: currentTrust.trustScore,
        newTrustScore,
        trustChange,
        success: taskResult.success
      });

      agl.endSpan(spanId, 'success', {
        newTrustScore,
        trustChange
      });
      
      return updatedTrust;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Gets trust-aware agent ranking
   */
  async rankAgentsByTrust(
    agents: Agent[],
    task: Task
  ): Promise<TrustRankedAgents> {
    const spanId = agl.emitSpan('trust.rank_agents', {
      taskId: task.id,
      agentCount: agents.length
    });

    try {
      const context: OrchestrationContext = {
        task,
        systemState: await this.getSystemState(),
        similarTasks: await this.getSimilarTasks(task)
      };
      
      // Evaluate trust for each agent
      const trustEvaluations = await Promise.all(
        agents.map(agent => this.evaluateTrust(agent.id, context))
      );
      
      // Rank agents by trust score and confidence
      const rankedAgents = agents.map((agent, index) => ({
        agent,
        trustEvaluation: trustEvaluations[index],
        rank: index + 1,
        totalScore: this.calculateTotalScore(trustEvaluations[index])
      })).sort((a, b) => b.totalScore - a.totalScore)
        .map((item, index) => ({ ...item, rank: index + 1 }));
      
      const result: TrustRankedAgents = {
        agents: rankedAgents,
        rankingCriteria: 'trust_and_confidence',
        timestamp: Date.now()
      };

      agl.endSpan(spanId, 'success', {
        rankedCount: rankedAgents.length
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
   * Gets trust information for an agent
   */
  getAgentTrust(agentId: string): AgentTrust | undefined {
    return this.agentTrusts.get(agentId);
  }

  /**
   * Gets all agent trusts
   */
  getAllAgentTrusts(): Map<string, AgentTrust> {
    return new Map(this.agentTrusts);
  }

  // Private helper methods

  private initializeTrust(agentId: string): AgentTrust {
    const agent = this.agentRegistry.get(agentId);
    const trust: AgentTrust = {
      agentId,
      trustScore: 0.5, // Start with neutral trust
      confidence: 0.0, // Low confidence initially
      history: [],
      capabilities: agent?.expertise || [],
      performanceMetrics: {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averagePerformanceScore: 0,
        recentPerformanceTrend: 'stable'
      },
      lastUpdated: Date.now()
    };
    this.agentTrusts.set(agentId, trust);
    return trust;
  }

  private async evaluateHistoricalTrust(
    trust: AgentTrust,
    context: OrchestrationContext
  ): Promise<{ trustScore: number; confidence: number } | null> {
    if (trust.history.length === 0) {
      return null;
    }

    // Calculate average trust from history
    const recentHistory = trust.history.slice(-10); // Last 10 tasks
    const avgTrust = recentHistory.reduce((sum, h) => 
      sum + (h.success ? 1 : 0), 0
    ) / recentHistory.length;

    // Confidence based on history size
    const confidence = Math.min(1.0, trust.history.length / 20);

    return {
      trustScore: avgTrust,
      confidence
    };
  }

  private calculateCapabilityMatch(agent: Agent, task: Task): number {
    const taskLower = task.description.toLowerCase();
    let matchCount = 0;
    
    for (const expertise of agent.expertise) {
      if (taskLower.includes(expertise.toLowerCase())) {
        matchCount++;
      }
    }
    
    // Normalize to 0-1 scale
    return agent.expertise.length > 0 
      ? matchCount / agent.expertise.length 
      : 0.5;
  }

  private async calculateSimilarityScore(
    agent: Agent,
    similarTasks: Task[]
  ): Promise<number> {
    if (similarTasks.length === 0) {
      return 0.5;
    }

    // Check if similar tasks were successful with similar agents
    let successCount = 0;
    for (const task of similarTasks) {
      // This would ideally check historical success with similar agents
      // For now, return neutral score
      successCount += 0.5;
    }

    return successCount / similarTasks.length;
  }

  private async evaluateHistoricalPattern(
    agent: Agent,
    context: OrchestrationContext
  ): Promise<number> {
    // Check if similar agents have good history
    const similarAgents = Array.from(this.agentTrusts.values())
      .filter(t => t.capabilities.some(c => 
        agent.expertise.includes(c)
      ));

    if (similarAgents.length === 0) {
      return 0.5;
    }

    const avgTrust = similarAgents.reduce((sum, t) => 
      sum + t.trustScore, 0
    ) / similarAgents.length;

    return avgTrust;
  }

  private async retrieveRAGEvidence(
    agent: Agent,
    context: OrchestrationContext
  ): Promise<number> {
    if (!this.ragPipeline) {
      return 0.5;
    }

    try {
      const query = `Agent performance for ${agent.type} on ${context.task.type}`;
      const results = await this.ragPipeline.searchSimilar(query, 3);
      
      if (results.length === 0) {
        return 0.5;
      }

      // Calculate average similarity as evidence score
      const avgSimilarity = results.reduce((sum, r) => 
        sum + (r.similarity || 0.5), 0
      ) / results.length;

      return avgSimilarity;
    } catch (error) {
      console.warn('RAG evidence retrieval failed:', error);
      return 0.5;
    }
  }

  private analyzeRAGResults(
    ragResults: Array<{ content: string; similarity: number; filePath: string }>,
    agent: Agent,
    context: OrchestrationContext
  ): Array<{ indicator: string; score: number }> {
    const indicators: Array<{ indicator: string; score: number }> = [];
    
    for (const result of ragResults) {
      const contentLower = result.content.toLowerCase();
      const positiveIndicators = ['success', 'reliable', 'trust', 'good', 'excellent'];
      const negativeIndicators = ['fail', 'error', 'unreliable', 'poor', 'bad'];
      
      let score = 0.5;
      for (const indicator of positiveIndicators) {
        if (contentLower.includes(indicator)) {
          score += 0.1;
        }
      }
      for (const indicator of negativeIndicators) {
        if (contentLower.includes(indicator)) {
          score -= 0.1;
        }
      }
      
      indicators.push({
        indicator: result.content.substring(0, 50),
        score: Math.max(0, Math.min(1, score))
      });
    }
    
    return indicators;
  }

  private calculateRAGTrustScore(
    indicators: Array<{ indicator: string; score: number }>
  ): number {
    if (indicators.length === 0) {
      return 0.5;
    }

    return indicators.reduce((sum, i) => sum + i.score, 0) / indicators.length;
  }

  private generateRAGEvidence(
    ragResults: Array<{ content: string; similarity: number; filePath: string }>,
    indicators: Array<{ indicator: string; score: number }>
  ): string {
    if (ragResults.length === 0) {
      return 'No RAG evidence found';
    }

    const avgScore = this.calculateRAGTrustScore(indicators);
    return `RAG evidence: ${ragResults.length} results found, average trust score: ${avgScore.toFixed(2)}`;
  }

  private calculateTrustChange(taskResult: TaskResult): number {
    // Successful tasks increase trust, failed tasks decrease it
    const baseChange = taskResult.success ? 0.1 : -0.15;
    
    // Scale by performance score
    const performanceMultiplier = taskResult.performanceScore;
    
    return baseChange * performanceMultiplier;
  }

  private updateConfidence(
    currentTrust: AgentTrust,
    taskResult: TaskResult,
    trustChange: number
  ): number {
    // Confidence increases with more history
    const historySize = currentTrust.history.length + 1;
    const baseConfidence = Math.min(1.0, historySize / 20);
    
    // Adjust based on consistency
    const consistency = this.calculateConsistency(currentTrust);
    const consistencyBonus = consistency * 0.2;
    
    return Math.min(1.0, baseConfidence + consistencyBonus);
  }

  private calculateConsistency(trust: AgentTrust): number {
    if (trust.history.length < 2) {
      return 0.5;
    }

    const recentHistory = trust.history.slice(-10);
    const successRate = recentHistory.filter(h => h.success).length / recentHistory.length;
    
    // Consistency is higher when success rate is stable
    const variance = recentHistory.reduce((sum, h) => {
      const diff = (h.success ? 1 : 0) - successRate;
      return sum + (diff * diff);
    }, 0) / recentHistory.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - variance);
  }

  private updatePerformanceMetrics(
    current: PerformanceMetrics,
    taskResult: TaskResult
  ): PerformanceMetrics {
    const totalTasks = current.totalTasks + 1;
    const successfulTasks = current.successfulTasks + (taskResult.success ? 1 : 0);
    const failedTasks = current.failedTasks + (taskResult.success ? 0 : 1);
    
    const newAvgScore = (
      (current.averagePerformanceScore * current.totalTasks) + 
      taskResult.performanceScore
    ) / totalTasks;
    
    // Determine trend
    const recentHistory = this.trustHistory.get(current.totalTasks.toString()) || [];
    const recentSuccessRate = recentHistory.length > 0
      ? recentHistory.filter(h => h.success).length / recentHistory.length
      : 0.5;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentSuccessRate > 0.7) {
      trend = 'improving';
    } else if (recentSuccessRate < 0.3) {
      trend = 'declining';
    }
    
    return {
      totalTasks,
      successfulTasks,
      failedTasks,
      averagePerformanceScore: newAvgScore,
      recentPerformanceTrend: trend
    };
  }

  private calculateTotalScore(evaluation: TrustEvaluation): number {
    // Combine trust score and confidence
    return (evaluation.trustScore * 0.7) + (evaluation.confidence * 0.3);
  }

  private generateRecommendation(
    trustScore: number,
    confidence: number
  ): 'trust' | 'distrust' | 'cautious' {
    if (trustScore >= 0.7 && confidence >= this.config.confidenceThreshold) {
      return 'trust';
    } else if (trustScore < this.config.minTrustThreshold) {
      return 'distrust';
    } else {
      return 'cautious';
    }
  }

  private generateReasoning(
    factors: TrustFactor[],
    trustScore: number
  ): string {
    const factorDescriptions = factors.map(f => 
      `${f.type}: ${(f.score * 100).toFixed(0)}%`
    ).join(', ');
    
    return `Trust score: ${(trustScore * 100).toFixed(0)}% based on ${factorDescriptions}`;
  }

  private async getSystemState(): Promise<Record<string, any>> {
    // Return current system state
    return {
      timestamp: Date.now(),
      agentCount: this.agentRegistry.size,
      trustTrackingEnabled: true
    };
  }

  private async getSimilarTasks(task: Task): Promise<Task[]> {
    // Find similar tasks from history
    const similarTasks: Task[] = [];
    
    for (const history of this.trustHistory.values()) {
      for (const entry of history) {
        // This would ideally match similar tasks
        // For now, return empty array
      }
    }
    
    return similarTasks;
  }
}

