/**
 * MAEBE: Multi-Agent Emergent Behavior Evaluator
 * 
 * Implements systematic evaluation framework for emergent behaviors
 * in NEURAFORGE multi-agent orchestration system.
 * 
 * Based on: "MAEBE: Multi-Agent Emergent Behavior Framework"
 * Authors: Sinem Erisken, Timothy Gothard, Martin Leitgab, Ram Potham
 * arXiv:2506.03053v2
 */

import { WorkflowState } from '../swarm/langgraph.orchestrator.ts';
import type { Agent } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Orchestration context for MAEBE evaluation
 */
export interface OrchestrationContext {
  workflowState: WorkflowState;
  taskId: string;
  agentIds: string[];
  startTime: number;
  currentTime: number;
  metrics: OrchestrationMetrics;
  custom?: Record<string, any>;
}

/**
 * Agent interaction record
 */
export interface AgentInteraction {
  sourceAgentId: string;
  targetAgentId: string;
  interactionType: 'handoff' | 'coordination' | 'conflict' | 'consensus' | 'delegation';
  timestamp: Date;
  context: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial';
  metadata?: Record<string, any>;
}

/**
 * Orchestration metrics
 */
export interface OrchestrationMetrics {
  handoffCount: number;
  handoffSuccessRate: number;
  averageLatency: number;
  resourceContention: number;
  coordinationAttempts: number;
  coordinationSuccessRate: number;
  custom?: Record<string, number>;
}

/**
 * Emergent behavior report
 */
export interface EmergentBehaviorReport {
  detected: boolean;
  behaviors: EmergentBehavior[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  recommendations: string[];
  timestamp: Date;
}

/**
 * Emergent behavior description
 */
export interface EmergentBehavior {
  type: string;
  description: string;
  affectedAgents: string[];
  severity: number; // 0-1
  evidence: BehaviorEvidence[];
  detectedAt: Date;
}

/**
 * Evidence for emergent behavior
 */
export interface BehaviorEvidence {
  type: 'pattern' | 'anomaly' | 'interaction' | 'metric' | 'decision';
  description: string;
  confidence: number; // 0-1
  data: Record<string, any>;
}

/**
 * MAEBE configuration
 */
export interface MAEBEConfig {
  enabled: boolean;
  riskThresholds: RiskThresholds;
  behaviorDetectionEnabled: boolean;
  patternAnalysisEnabled: boolean;
  enableAgentLightningTracking: boolean;
  custom?: Record<string, any>;
}

/**
 * Risk thresholds for behavior classification
 */
export interface RiskThresholds {
  low: number; // 0-0.3
  medium: number; // 0.3-0.6
  high: number; // 0.6-0.8
  critical: number; // 0.8-1.0
}

/**
 * Default MAEBE configuration
 */
const DEFAULT_CONFIG: MAEBEConfig = {
  enabled: true,
  riskThresholds: {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 1.0
  },
  behaviorDetectionEnabled: true,
  patternAnalysisEnabled: true,
  enableAgentLightningTracking: true
};

/**
 * Interaction pattern extracted from agent interactions
 */
interface InteractionPattern {
  type: string;
  frequency: number;
  agents: string[];
  characteristics: Record<string, any>;
  riskScore: number; // 0-1
}

/**
 * MAEBE Evaluator class
 */
export class MAEBEEvaluator {
  private config: MAEBEConfig;
  private behaviorHistory: Map<string, EmergentBehavior[]> = new Map();
  private riskThresholds: RiskThresholds;
  private interactionPatterns: Map<string, InteractionPattern[]> = new Map();

  constructor(config?: Partial<MAEBEConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.riskThresholds = this.config.riskThresholds;
    
    if (this.config.enabled) {
      console.log('MAEBE Evaluator initialized');
    }
  }

  /**
   * Evaluates emergent behaviors in orchestration context
   */
  async evaluateEmergentBehavior(
    orchestrationContext: OrchestrationContext,
    agentInteractions: AgentInteraction[]
  ): Promise<EmergentBehaviorReport> {
    const spanId = this.config.enableAgentLightningTracking
      ? agl.emitSpan('maebe.evaluate_emergent_behavior', {
          taskId: orchestrationContext.taskId,
          agentCount: orchestrationContext.agentIds.length,
          interactionCount: agentInteractions.length
        })
      : '';

    try {
      // 1. Collect agent interaction patterns
      const patterns = this.extractInteractionPatterns(agentInteractions, orchestrationContext);
      
      // 2. Identify emergent behaviors
      const behaviors = await this.identifyEmergentBehaviors(
        patterns,
        orchestrationContext,
        agentInteractions
      );
      
      // 3. Assess risk level
      const riskLevel = this.assessRiskLevel(behaviors);
      
      // 4. Generate recommendations
      const recommendations = this.generateRecommendations(behaviors, riskLevel, orchestrationContext);
      
      const report: EmergentBehaviorReport = {
        detected: behaviors.length > 0,
        behaviors,
        riskLevel,
        confidence: this.calculateConfidence(behaviors),
        recommendations,
        timestamp: new Date()
      };

      // Track with Agent Lightning
      if (this.config.enableAgentLightningTracking && spanId) {
        // Note: emitMetric is not available on agl, using emitSpan instead
        agl.emitSpan('maebe.emergent_behavior.detected', {
          detected: report.detected,
          behaviorCount: behaviors.length,
          riskLevel: report.riskLevel,
          confidence: report.confidence
        });
        agl.endSpan(spanId, report.detected ? 'error' : 'success', {
          detected: report.detected,
          behaviorCount: behaviors.length,
          riskLevel: report.riskLevel
        });
      }

      return report;
    } catch (error) {
      if (this.config.enableAgentLightningTracking && spanId) {
        agl.endSpan(spanId, 'error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }

  /**
   * Assesses multi-agent risks for an agent ensemble
   */
  async assessMultiAgentRisks(
    agentEnsemble: Agent[],
    taskContext: Record<string, any>
  ): Promise<{ riskLevel: 'low' | 'medium' | 'high' | 'critical'; score: number; factors: string[] }> {
    const spanId = this.config.enableAgentLightningTracking
      ? agl.emitSpan('maebe.assess_multi_agent_risks', {
          agentCount: agentEnsemble.length
        })
      : '';

    try {
      // Assess various risk factors
      const factors: string[] = [];
      let riskScore = 0;

      // 1. Agent diversity risk
      const agentTypes = new Set(agentEnsemble.map(a => a.type));
      if (agentTypes.size < agentEnsemble.length * 0.5) {
        riskScore += 0.2;
        factors.push('Low agent diversity');
      }

      // 2. Workload imbalance risk
      const workloads = agentEnsemble.map(a => a.workload / a.capacity);
      const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
      const workloadVariance = workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length;
      if (workloadVariance > 0.3) {
        riskScore += 0.2;
        factors.push('Workload imbalance detected');
      }

      // 3. Capacity constraints risk
      const overloadedAgents = agentEnsemble.filter(a => a.workload >= a.capacity * 0.9);
      if (overloadedAgents.length > 0) {
        riskScore += 0.3;
        factors.push(`${overloadedAgents.length} agents near capacity`);
      }

      // 4. Expertise overlap risk
      const expertiseOverlap = this.calculateExpertiseOverlap(agentEnsemble);
      if (expertiseOverlap > 0.8) {
        riskScore += 0.2;
        factors.push('High expertise overlap');
      }

      // Normalize risk score to 0-1
      riskScore = Math.min(1.0, riskScore);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore < this.riskThresholds.low) {
        riskLevel = 'low';
      } else if (riskScore < this.riskThresholds.medium) {
        riskLevel = 'medium';
      } else if (riskScore < this.riskThresholds.high) {
        riskLevel = 'high';
      } else {
        riskLevel = 'critical';
      }

      if (this.config.enableAgentLightningTracking && spanId) {
        // Note: emitMetric is not available on agl, using emitSpan instead
        agl.emitSpan('maebe.multi_agent_risk', {
          riskLevel,
          riskScore,
          factorCount: factors.length
        });
        agl.endSpan(spanId, riskLevel === 'critical' ? 'error' : 'success', {
          riskLevel,
          riskScore
        });
      }

      return { riskLevel, score: riskScore, factors };
    } catch (error) {
      if (this.config.enableAgentLightningTracking && spanId) {
        agl.endSpan(spanId, 'error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }

  /**
   * Gets emergent behavior score for an agent (for use in agent selection)
   */
  async getAgentEmergentBehaviorScore(agent: Agent): Promise<number> {
    // Higher score = lower risk (normalized to 0-1)
    const agentId = agent.id;
    const behaviors = this.behaviorHistory.get(agentId) || [];
    
    if (behaviors.length === 0) {
      return 1.0; // No behaviors detected = perfect score
    }

    // Calculate average severity (invert so higher severity = lower score)
    const avgSeverity = behaviors.reduce((sum, b) => sum + b.severity, 0) / behaviors.length;
    return Math.max(0, 1.0 - avgSeverity);
  }

  /**
   * Extracts interaction patterns from agent interactions
   */
  private extractInteractionPatterns(
    interactions: AgentInteraction[],
    context: OrchestrationContext
  ): InteractionPattern[] {
    const patterns: Map<string, InteractionPattern> = new Map();

    for (const interaction of interactions) {
      const patternKey = `${interaction.sourceAgentId}-${interaction.targetAgentId}-${interaction.interactionType}`;
      
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          type: interaction.interactionType,
          frequency: 0,
          agents: [interaction.sourceAgentId, interaction.targetAgentId],
          characteristics: {},
          riskScore: interaction.outcome === 'failure' ? 0.7 : 0.2
        });
      }

      const pattern = patterns.get(patternKey)!;
      pattern.frequency++;
      
      // Update characteristics based on outcomes
      if (interaction.outcome === 'failure') {
        pattern.riskScore = Math.min(1.0, pattern.riskScore + 0.1);
      }
    }

    return Array.from(patterns.values());
  }

  /**
   * Identifies emergent behaviors from patterns
   */
  private async identifyEmergentBehaviors(
    patterns: InteractionPattern[],
    context: OrchestrationContext,
    interactions: AgentInteraction[]
  ): Promise<EmergentBehavior[]> {
    const behaviors: EmergentBehavior[] = [];

    // 1. Detect coordination failures
    const failurePatterns = patterns.filter(p => p.riskScore > 0.6);
    if (failurePatterns.length > 0) {
      behaviors.push({
        type: 'coordination_failure',
        description: 'High rate of coordination failures detected',
        affectedAgents: Array.from(new Set(failurePatterns.flatMap(p => p.agents))),
        severity: Math.min(1.0, failurePatterns.reduce((sum, p) => sum + p.riskScore, 0) / failurePatterns.length),
        evidence: failurePatterns.map(p => ({
          type: 'pattern',
          description: `Frequent ${p.type} failures between agents`,
          confidence: p.riskScore,
          data: { patternType: p.type, frequency: p.frequency }
        })),
        detectedAt: new Date()
      });
    }

    // 2. Detect cascading interactions
    const cascadingPatterns = this.detectCascadingPatterns(interactions);
    if (cascadingPatterns.length > 0) {
      behaviors.push({
        type: 'cascading_interactions',
        description: 'Cascading agent interactions detected',
        affectedAgents: cascadingPatterns.flatMap(p => p.agents),
        severity: 0.6,
        evidence: cascadingPatterns.map(p => ({
          type: 'pattern',
          description: 'Cascading interaction chain detected',
          confidence: 0.7,
          data: { chainLength: p.agents.length }
        })),
        detectedAt: new Date()
      });
    }

    // 3. Detect resource contention
    if (context.metrics.resourceContention > 0.7) {
      behaviors.push({
        type: 'resource_contention',
        description: 'High resource contention detected',
        affectedAgents: context.agentIds,
        severity: context.metrics.resourceContention,
        evidence: [{
          type: 'metric',
          description: `Resource contention at ${(context.metrics.resourceContention * 100).toFixed(1)}%`,
          confidence: 0.9,
          data: { resourceContention: context.metrics.resourceContention }
        }],
        detectedAt: new Date()
      });
    }

    // 4. Detect unexpected handoff patterns
    const unexpectedHandoffs = this.detectUnexpectedHandoffs(interactions, context);
    if (unexpectedHandoffs.length > 0) {
      behaviors.push({
        type: 'unexpected_handoffs',
        description: 'Unexpected handoff patterns detected',
        affectedAgents: unexpectedHandoffs.flatMap(h => [h.sourceAgentId, h.targetAgentId]),
        severity: 0.5,
        evidence: unexpectedHandoffs.map(h => ({
          type: 'anomaly',
          description: `Unexpected handoff from ${h.sourceAgentId} to ${h.targetAgentId}`,
          confidence: 0.6,
          data: { handoff: h }
        })),
        detectedAt: new Date()
      });
    }

    // Store behaviors in history
    for (const behavior of behaviors) {
      for (const agentId of behavior.affectedAgents) {
        if (!this.behaviorHistory.has(agentId)) {
          this.behaviorHistory.set(agentId, []);
        }
        this.behaviorHistory.get(agentId)!.push(behavior);
      }
    }

    return behaviors;
  }

  /**
   * Detects cascading interaction patterns
   */
  private detectCascadingPatterns(interactions: AgentInteraction[]): InteractionPattern[] {
    const cascades: InteractionPattern[] = [];
    const visited = new Set<string>();

    for (const interaction of interactions) {
      if (visited.has(interaction.sourceAgentId)) continue;
      
      const chain: string[] = [interaction.sourceAgentId];
      let current = interaction.targetAgentId;
      
      // Follow interaction chain
      while (current && !visited.has(current) && chain.length < 5) {
        chain.push(current);
        visited.add(current);
        
        const nextInteraction = interactions.find(
          i => i.sourceAgentId === current && i.interactionType === 'handoff'
        );
        if (nextInteraction) {
          current = nextInteraction.targetAgentId;
        } else {
          break;
        }
      }

      if (chain.length >= 3) {
        cascades.push({
          type: 'cascade',
          frequency: chain.length,
          agents: chain,
          characteristics: { chainLength: chain.length },
          riskScore: Math.min(1.0, chain.length * 0.15)
        });
      }
    }

    return cascades;
  }

  /**
   * Detects unexpected handoff patterns
   */
  private detectUnexpectedHandoffs(
    interactions: AgentInteraction[],
    context: OrchestrationContext
  ): AgentInteraction[] {
    const unexpected: AgentInteraction[] = [];
    
    // Handoffs that occur too frequently
    const handoffCounts = new Map<string, number>();
    for (const interaction of interactions.filter(i => i.interactionType === 'handoff')) {
      const key = `${interaction.sourceAgentId}-${interaction.targetAgentId}`;
      handoffCounts.set(key, (handoffCounts.get(key) || 0) + 1);
    }

    const avgHandoffs = Array.from(handoffCounts.values()).reduce((a, b) => a + b, 0) / handoffCounts.size;
    const threshold = avgHandoffs * 2; // More than 2x average

    for (const [key, count] of handoffCounts.entries()) {
      if (count > threshold) {
        const [source, target] = key.split('-');
        const matchingInteraction = interactions.find(
          i => i.sourceAgentId === source && i.targetAgentId === target
        );
        if (matchingInteraction) {
          unexpected.push(matchingInteraction);
        }
      }
    }

    return unexpected;
  }

  /**
   * Assesses overall risk level from behaviors
   */
  private assessRiskLevel(behaviors: EmergentBehavior[]): 'low' | 'medium' | 'high' | 'critical' {
    if (behaviors.length === 0) {
      return 'low';
    }

    const maxSeverity = Math.max(...behaviors.map(b => b.severity));
    const avgSeverity = behaviors.reduce((sum, b) => sum + b.severity, 0) / behaviors.length;
    const criticalBehaviors = behaviors.filter(b => b.severity >= 0.8).length;

    if (criticalBehaviors > 0 || maxSeverity >= this.riskThresholds.critical) {
      return 'critical';
    } else if (maxSeverity >= this.riskThresholds.high || avgSeverity >= 0.6) {
      return 'high';
    } else if (maxSeverity >= this.riskThresholds.medium || avgSeverity >= 0.4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculates confidence in behavior detection
   */
  private calculateConfidence(behaviors: EmergentBehavior[]): number {
    if (behaviors.length === 0) {
      return 1.0; // High confidence in "no behaviors"
    }

    // Average evidence confidence
    const allEvidence = behaviors.flatMap(b => b.evidence);
    const avgEvidenceConfidence = allEvidence.reduce((sum, e) => sum + e.confidence, 0) / allEvidence.length;
    
    // Factor in behavior count (more behaviors = more evidence)
    const behaviorCountFactor = Math.min(1.0, behaviors.length / 3.0);
    
    return (avgEvidenceConfidence * 0.7) + (behaviorCountFactor * 0.3);
  }

  /**
   * Generates recommendations based on behaviors and risk level
   */
  private generateRecommendations(
    behaviors: EmergentBehavior[],
    riskLevel: string,
    context: OrchestrationContext
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Immediate intervention required: Critical emergent behaviors detected');
      recommendations.push('Consider pausing orchestration until issues are resolved');
    } else if (riskLevel === 'high') {
      recommendations.push('High-risk emergent behaviors detected: Monitor closely');
      recommendations.push('Review agent selection and coordination patterns');
    }

    // Behavior-specific recommendations
    for (const behavior of behaviors) {
      switch (behavior.type) {
        case 'coordination_failure':
          recommendations.push('Improve agent coordination: Review handoff protocols');
          break;
        case 'cascading_interactions':
          recommendations.push('Limit cascade depth: Implement circuit breakers');
          break;
        case 'resource_contention':
          recommendations.push('Optimize resource allocation: Balance agent workloads');
          break;
        case 'unexpected_handoffs':
          recommendations.push('Review handoff patterns: Optimize agent selection');
          break;
      }
    }

    return recommendations;
  }

  /**
   * Calculates expertise overlap between agents
   */
  private calculateExpertiseOverlap(agents: Agent[]): number {
    if (agents.length < 2) return 0;

    const allExpertise = new Set<string>();
    agents.forEach(a => {
      if ('expertise' in a && Array.isArray(a.expertise)) {
        a.expertise.forEach(e => allExpertise.add(e));
      }
    });

    if (allExpertise.size === 0) return 0;

    // Calculate Jaccard similarity
    let totalOverlap = 0;
    let pairs = 0;

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a1 = agents[i];
        const a2 = agents[j];
        
        const expertise1 = ('expertise' in a1 && Array.isArray(a1.expertise)) 
          ? new Set(a1.expertise) 
          : new Set<string>();
        const expertise2 = ('expertise' in a2 && Array.isArray(a2.expertise)) 
          ? new Set(a2.expertise) 
          : new Set<string>();

        const intersection = new Set([...expertise1].filter(x => expertise2.has(x)));
        const union = new Set([...expertise1, ...expertise2]);
        
        totalOverlap += intersection.size / union.size;
        pairs++;
      }
    }

    return pairs > 0 ? totalOverlap / pairs : 0;
  }
}

