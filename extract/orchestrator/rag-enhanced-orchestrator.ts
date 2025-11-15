/**
 * RAG-Enhanced Orchestrator
 * 
 * Integrates RAG-based reasoning with orchestration decisions
 * Combines trust-aware agent selection with knowledge-augmented routing
 * 
 * Features:
 * - RAG-based decision support
 * - Context retrieval for orchestration
 * - Evidence-based trust evaluation
 * - Knowledge-augmented routing
 */

import { RAGPipeline } from '../rag/pipeline.ts';
import { TrustSystem, TrustRankedAgents, OrchestrationContext } from './trust-system.ts';
import { LangGraphOrchestrator } from '../swarm/langgraph.orchestrator.ts';
import { MoERouter, Agent, Task } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * RAG context for orchestration
 */
export interface RAGContext {
  patterns: string[];
  knowledge: string[];
  recommendations: string[];
  sources: string[];
  confidence: number;
}

/**
 * Task result
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  performanceScore: number;
  output?: any;
  error?: string;
  duration?: number;
}

/**
 * RAG-Enhanced Orchestrator configuration
 */
export interface RAGEnhancedOrchestratorConfig {
  minTrustThreshold: number;
  enableRAG: boolean;
  ragResultLimit: number;
  trustWeight: number;
  expertiseWeight: number;
  workloadWeight: number;
}

const DEFAULT_CONFIG: RAGEnhancedOrchestratorConfig = {
  minTrustThreshold: 0.3,
  enableRAG: true,
  ragResultLimit: 10,
  trustWeight: 0.3,
  expertiseWeight: 0.5,
  workloadWeight: 0.2
};

/**
 * RAG-Enhanced Orchestrator
 */
export class RAGEnhancedOrchestrator {
  private ragPipeline?: RAGPipeline;
  private trustSystem: TrustSystem;
  private langGraphOrchestrator: LangGraphOrchestrator;
  private moeRouter: MoERouter;
  private config: RAGEnhancedOrchestratorConfig;
  
  constructor(
    trustSystem: TrustSystem,
    langGraphOrchestrator: LangGraphOrchestrator,
    moeRouter: MoERouter,
    ragPipeline?: RAGPipeline,
    config?: Partial<RAGEnhancedOrchestratorConfig>
  ) {
    this.trustSystem = trustSystem;
    this.langGraphOrchestrator = langGraphOrchestrator;
    this.moeRouter = moeRouter;
    this.ragPipeline = ragPipeline;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Executes task with RAG-enhanced trust-aware orchestration
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const spanId = agl.emitSpan('rag_orchestrator.execute', {
      taskId: task.id,
      taskType: task.type
    });

    try {
      // Retrieve relevant context from RAG
      const ragContext = this.config.enableRAG && this.ragPipeline
        ? await this.retrieveRAGContext(task)
        : null;
      
      // Get trust-ranked agents
      const availableAgents = this.moeRouter.getAgents();
      const trustRanking = await this.trustSystem.rankAgentsByTrust(
        availableAgents,
        task
      );
      
      // Select agent based on trust ranking
      const selectedAgent = this.selectTrustedAgent(trustRanking, task);
      
      // Create orchestration context with RAG information
      const orchestrationContext: OrchestrationContext = {
        task,
        systemState: await this.getSystemState(),
        similarTasks: []
      };
      
      const trustEvaluation = trustRanking.agents.find(a => 
        a.agent.id === selectedAgent.id
      )?.trustEvaluation;
      
      // Log orchestration decision
      agl.emitMetric('rag_orchestrator.agent_selected', {
        taskId: task.id,
        agentId: selectedAgent.id,
        agentType: selectedAgent.type,
        trustScore: trustEvaluation?.trustScore || 0,
        confidence: trustEvaluation?.confidence || 0,
        ragContextAvailable: ragContext !== null
      });
      
      // Execute task with trust-aware orchestration
      const startTime = Date.now();
      const taskResult = await this.executeWithTrustAwareness(
        orchestrationContext,
        selectedAgent,
        ragContext
      );
      const duration = Date.now() - startTime;
      
      // Update trust based on performance
      await this.trustSystem.updateTrust(selectedAgent.id, {
        taskId: task.id,
        success: taskResult.success,
        performanceScore: taskResult.performanceScore,
        duration
      });
      
      agl.endSpan(spanId, taskResult.success ? 'success' : 'error', {
        agentId: selectedAgent.id,
        duration,
        success: taskResult.success
      });
      
      return {
        ...taskResult,
        duration
      };
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Retrieves RAG context for orchestration decision
   */
  private async retrieveRAGContext(task: Task): Promise<RAGContext | null> {
    if (!this.ragPipeline) {
      return null;
    }

    try {
      // Query RAG for relevant orchestration patterns
      const query = `Orchestration patterns for ${task.type} task: ${task.description}`;
      const ragResults = await this.ragPipeline.searchSimilar(
        query, 
        this.config.ragResultLimit
      );
      
      if (ragResults.length === 0) {
        return {
          patterns: [],
          knowledge: [],
          recommendations: [],
          sources: [],
          confidence: 0.0
        };
      }
      
      // Extract relevant patterns and knowledge
      const patterns = this.extractOrchestrationPatterns(ragResults);
      const knowledge = this.extractKnowledge(ragResults);
      const recommendations = this.extractRecommendations(ragResults);
      
      return {
        patterns,
        knowledge,
        recommendations,
        sources: ragResults.map(r => r.filePath).filter((v, i, a) => a.indexOf(v) === i),
        confidence: this.calculateRAGConfidence(ragResults)
      };
    } catch (error) {
      console.warn('RAG context retrieval failed:', error);
      return null;
    }
  }
  
  /**
   * Selects agent based on trust ranking
   */
  private selectTrustedAgent(
    trustRanking: TrustRankedAgents,
    task: Task
  ): Agent {
    // Filter agents by minimum trust threshold
    const trustedAgents = trustRanking.agents.filter(a => 
      a.trustEvaluation.trustScore >= this.config.minTrustThreshold &&
      a.trustEvaluation.recommendation !== 'distrust'
    );
    
    if (trustedAgents.length === 0) {
      // Fallback to top-ranked agent even if below threshold
      console.warn(`No agents meet trust threshold ${this.config.minTrustThreshold}, using top-ranked agent`);
      return trustRanking.agents[0].agent;
    }
    
    // Select highest-ranked trusted agent
    return trustedAgents[0].agent;
  }

  /**
   * Executes task with trust-aware orchestration
   */
  private async executeWithTrustAwareness(
    context: OrchestrationContext,
    agent: Agent,
    ragContext: RAGContext | null
  ): Promise<TaskResult> {
    try {
      // Use LangGraph orchestrator for execution
      // This is a simplified version - actual implementation would use full workflow
      const workflowResult = await this.langGraphOrchestrator.executeWorkflow({
        nodes: [{
          id: 'task_execution',
          type: 'agent',
          agentId: agent.id,
          task: context.task
        }],
        edges: [],
        initialState: {
          context: {
            task: context.task,
            agent: agent,
            ragContext: ragContext
          }
        }
      });

      // Determine success and performance score
      const success = workflowResult.success || false;
      const performanceScore = this.calculatePerformanceScore(
        workflowResult,
        success
      );

      return {
        taskId: context.task.id,
        success,
        performanceScore,
        output: workflowResult.output,
        error: workflowResult.error
      };
    } catch (error) {
      return {
        taskId: context.task.id,
        success: false,
        performanceScore: 0.0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extracts orchestration patterns from RAG results
   */
  private extractOrchestrationPatterns(
    ragResults: Array<{ content: string; similarity: number }>
  ): string[] {
    const patterns: string[] = [];
    
    for (const result of ragResults) {
      // Extract patterns from content (simplified)
      const patternMatches = result.content.match(/pattern[:\s]+([^\.]+)/gi);
      if (patternMatches) {
        patterns.push(...patternMatches.map(m => m.replace(/pattern[:\s]+/i, '').trim()));
      }
    }
    
    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Extracts knowledge from RAG results
   */
  private extractKnowledge(
    ragResults: Array<{ content: string; similarity: number }>
  ): string[] {
    return ragResults
      .filter(r => r.similarity > 0.7) // High similarity results
      .map(r => r.content.substring(0, 200)) // First 200 chars
      .slice(0, 5); // Top 5
  }

  /**
   * Extracts recommendations from RAG results
   */
  private extractRecommendations(
    ragResults: Array<{ content: string; similarity: number }>
  ): string[] {
    const recommendations: string[] = [];
    
    for (const result of ragResults) {
      // Extract recommendations (simplified)
      const recMatches = result.content.match(/recommend[^\\.]+/gi);
      if (recMatches) {
        recommendations.push(...recMatches.map(m => m.trim()));
      }
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Calculates RAG confidence from results
   */
  private calculateRAGConfidence(
    ragResults: Array<{ similarity: number }>
  ): number {
    if (ragResults.length === 0) {
      return 0.0;
    }

    // Average similarity as confidence
    const avgSimilarity = ragResults.reduce((sum, r) => 
      sum + (r.similarity || 0), 0
    ) / ragResults.length;

    // Scale by result count (more results = higher confidence)
    const countFactor = Math.min(1.0, ragResults.length / 10);
    
    return avgSimilarity * countFactor;
  }

  /**
   * Calculates performance score from workflow result
   */
  private calculatePerformanceScore(
    workflowResult: any,
    success: boolean
  ): number {
    if (!success) {
      return 0.0;
    }

    // Base score for success
    let score = 0.7;

    // Add bonus for completion time (faster = better)
    if (workflowResult.duration) {
      const timeBonus = Math.max(0, 1 - (workflowResult.duration / 10000)); // 10s baseline
      score += timeBonus * 0.2;
    }

    // Add bonus for quality indicators
    if (workflowResult.quality) {
      score += workflowResult.quality * 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Gets current system state
   */
  private async getSystemState(): Promise<Record<string, any>> {
    return {
      timestamp: Date.now(),
      agentCount: this.moeRouter.getAgents().length,
      trustSystemEnabled: true,
      ragEnabled: this.config.enableRAG && this.ragPipeline !== undefined
    };
  }
}

