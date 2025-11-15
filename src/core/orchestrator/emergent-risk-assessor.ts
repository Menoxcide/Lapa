/**
 * Emergent Risk Assessor
 * 
 * Systematic assessment of risks in multi-agent orchestration.
 * Implements risk taxonomy and evaluation framework from MAEBE.
 * 
 * Based on: "MAEBE: Multi-Agent Emergent Behavior Framework"
 * Authors: Sinem Erisken, Timothy Gothard, Martin Leitgab, Ram Potham
 * arXiv:2506.03053v2
 */

import { WorkflowState } from '../swarm/langgraph.orchestrator.ts';
import { AgentInteraction, OrchestrationContext, OrchestrationMetrics } from './maebe-evaluator.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Performance thresholds for risk assessment
 */
export interface PerformanceThresholds {
  maxLatencyMs: number;
  maxResourceContention: number; // 0-1
  minSuccessRate: number; // 0-1
  maxHandoffDepth: number;
  maxConcurrentHandoffs: number;
  custom?: Record<string, number>;
}

/**
 * Default performance thresholds
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxLatencyMs: 1000, // 1 second
  maxResourceContention: 0.7,
  minSuccessRate: 0.95,
  maxHandoffDepth: 10,
  maxConcurrentHandoffs: 5
};

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  coordinationRisks: CoordinationRiskReport;
  behavioralRisks: BehavioralRiskReport;
  performanceRisks: PerformanceRiskReport;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategies: string[];
  timestamp: Date;
}

/**
 * Coordination risk report
 */
export interface CoordinationRiskReport {
  detected: boolean;
  risks: CoordinationRisk[];
  overallScore: number; // 0-1 (higher = more risky)
  criticalIssues: string[];
}

/**
 * Coordination risk
 */
export interface CoordinationRisk {
  type: 'handoff_failure' | 'context_loss' | 'agent_conflict' | 'deadlock' | 'circular_dependency';
  severity: number; // 0-1
  description: string;
  affectedAgents: string[];
  evidence: Record<string, any>;
}

/**
 * Behavioral risk report
 */
export interface BehavioralRiskReport {
  detected: boolean;
  risks: BehavioralRisk[];
  overallScore: number; // 0-1 (higher = more risky)
  criticalIssues: string[];
}

/**
 * Behavioral risk
 */
export interface BehavioralRisk {
  type: 'unexpected_interaction' | 'cascading_failure' | 'moral_shift' | 'consensus_failure' | 'escalation';
  severity: number; // 0-1
  description: string;
  affectedAgents: string[];
  evidence: Record<string, any>;
}

/**
 * Performance risk report
 */
export interface PerformanceRiskReport {
  detected: boolean;
  risks: PerformanceRisk[];
  overallScore: number; // 0-1 (higher = more risky)
  criticalIssues: string[];
}

/**
 * Performance risk
 */
export interface PerformanceRisk {
  type: 'latency_degradation' | 'resource_contention' | 'bottleneck' | 'throughput_degradation' | 'memory_pressure';
  severity: number; // 0-1
  description: string;
  affectedMetrics: string[];
  evidence: Record<string, any>;
}

/**
 * Risk assessor configuration
 */
export interface RiskAssessorConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  enableAgentLightningTracking: boolean;
  custom?: Record<string, any>;
}

/**
 * Default risk assessor configuration
 */
const DEFAULT_CONFIG: RiskAssessorConfig = {
  enabled: true,
  thresholds: DEFAULT_THRESHOLDS,
  enableAgentLightningTracking: true
};

/**
 * Emergent Risk Assessor class
 */
export class EmergentRiskAssessor {
  private config: RiskAssessorConfig;
  private riskHistory: Map<string, RiskAssessment[]> = new Map();

  constructor(config?: Partial<RiskAssessorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      console.log('Emergent Risk Assessor initialized');
    }
  }

  /**
   * Comprehensive risk assessment
   */
  async assessRisks(
    orchestrationContext: OrchestrationContext,
    agentInteractions: AgentInteraction[]
  ): Promise<RiskAssessment> {
    const spanId = this.config.enableAgentLightningTracking
      ? agl.emitSpan('maebe.assess_risks', {
          taskId: orchestrationContext.taskId,
          agentCount: orchestrationContext.agentIds.length,
          interactionCount: agentInteractions.length
        })
      : '';

    try {
      // Parallel risk assessment
      const [coordination, behavioral, performance] = await Promise.all([
        this.assessCoordinationRisks(orchestrationContext, agentInteractions),
        this.assessBehavioralRisks(orchestrationContext, agentInteractions),
        this.assessPerformanceRisks(orchestrationContext)
      ]);
      
      // Calculate overall risk
      const overallRiskLevel = this.calculateOverallRisk(
        coordination,
        behavioral,
        performance
      );
      
      // Generate mitigation strategies
      const mitigationStrategies = this.generateMitigationStrategies(
        coordination,
        behavioral,
        performance,
        overallRiskLevel
      );

      const assessment: RiskAssessment = {
        coordinationRisks: coordination,
        behavioralRisks: behavioral,
        performanceRisks: performance,
        overallRiskLevel,
        mitigationStrategies,
        timestamp: new Date()
      };

      // Track with Agent Lightning
      if (this.config.enableAgentLightningTracking && spanId) {
        // Note: emitMetric is not available on agl, using emitSpan instead
        agl.emitSpan('maebe.risk_assessment', {
          overallRiskLevel,
          coordinationScore: coordination.overallScore,
          behavioralScore: behavioral.overallScore,
          performanceScore: performance.overallScore
        });
        agl.endSpan(spanId, overallRiskLevel === 'critical' ? 'error' : 'success', {
          overallRiskLevel,
          coordinationRisks: coordination.risks.length,
          behavioralRisks: behavioral.risks.length,
          performanceRisks: performance.risks.length
        });
      }

      // Store in history
      const taskId = orchestrationContext.taskId;
      if (!this.riskHistory.has(taskId)) {
        this.riskHistory.set(taskId, []);
      }
      this.riskHistory.get(taskId)!.push(assessment);

      return assessment;
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
   * Assesses coordination risks
   */
  async assessCoordinationRisks(
    orchestrationContext: OrchestrationContext,
    agentInteractions: AgentInteraction[]
  ): Promise<CoordinationRiskReport> {
    const risks: CoordinationRisk[] = [];

    // 1. Handoff failures
    const handoffInteractions = agentInteractions.filter(i => i.interactionType === 'handoff');
    const failedHandoffs = handoffInteractions.filter(i => i.outcome === 'failure');
    
    if (failedHandoffs.length > 0) {
      const failureRate = failedHandoffs.length / handoffInteractions.length;
      risks.push({
        type: 'handoff_failure',
        severity: Math.min(1.0, failureRate * 1.5), // Amplify failure rate
        description: `${failedHandoffs.length} handoff failures (${(failureRate * 100).toFixed(1)}% failure rate)`,
        affectedAgents: Array.from(new Set(failedHandoffs.flatMap(h => [h.sourceAgentId, h.targetAgentId]))),
        evidence: {
          failureRate,
          failedCount: failedHandoffs.length,
          totalHandoffs: handoffInteractions.length
        }
      });
    }

    // 2. Context loss
    const contextLossPatterns = this.detectContextLoss(agentInteractions, orchestrationContext);
    if (contextLossPatterns.length > 0) {
      risks.push({
        type: 'context_loss',
        severity: 0.6,
        description: `Context loss detected in ${contextLossPatterns.length} interactions`,
        affectedAgents: Array.from(new Set(contextLossPatterns.flatMap(p => [p.sourceAgentId, p.targetAgentId]))),
        evidence: { contextLossCount: contextLossPatterns.length }
      });
    }

    // 3. Agent conflicts
    const conflicts = this.detectAgentConflicts(agentInteractions);
    if (conflicts.length > 0) {
      risks.push({
        type: 'agent_conflict',
        severity: 0.7,
        description: `${conflicts.length} agent conflicts detected`,
        affectedAgents: Array.from(new Set(conflicts.flatMap(c => [c.sourceAgentId, c.targetAgentId]))),
        evidence: { conflictCount: conflicts.length }
      });
    }

    // 4. Deadlocks and circular dependencies
    const deadlocks = this.detectDeadlocks(agentInteractions);
    if (deadlocks.length > 0) {
      risks.push({
        type: 'deadlock',
        severity: 0.9,
        description: `${deadlocks.length} potential deadlocks detected`,
        affectedAgents: deadlocks.flatMap(d => d.agents),
        evidence: { deadlockCount: deadlocks.length }
      });
    }

    const detected = risks.length > 0;
    const overallScore = detected
      ? Math.max(...risks.map(r => r.severity))
      : 0;
    const criticalIssues = risks
      .filter(r => r.severity >= 0.8)
      .map(r => r.description);

    return {
      detected,
      risks,
      overallScore,
      criticalIssues
    };
  }

  /**
   * Assesses behavioral risks
   */
  async assessBehavioralRisks(
    orchestrationContext: OrchestrationContext,
    agentInteractions: AgentInteraction[]
  ): Promise<BehavioralRiskReport> {
    const risks: BehavioralRisk[] = [];

    // 1. Unexpected interactions
    const unexpectedInteractions = this.detectUnexpectedInteractions(
      agentInteractions,
      orchestrationContext
    );
    if (unexpectedInteractions.length > 0) {
      risks.push({
        type: 'unexpected_interaction',
        severity: 0.5,
        description: `${unexpectedInteractions.length} unexpected interactions detected`,
        affectedAgents: Array.from(new Set(
          unexpectedInteractions.flatMap(i => [i.sourceAgentId, i.targetAgentId])
        )),
        evidence: { unexpectedCount: unexpectedInteractions.length }
      });
    }

    // 2. Cascading failures
    const cascades = this.detectCascadingFailures(agentInteractions);
    if (cascades.length > 0) {
      risks.push({
        type: 'cascading_failure',
        severity: 0.8,
        description: `${cascades.length} cascading failure chains detected`,
        affectedAgents: cascades.flatMap(c => c.agents),
        evidence: { cascadeCount: cascades.length, maxChainLength: Math.max(...cascades.map(c => c.chainLength)) }
      });
    }

    // 3. Consensus failures (if applicable)
    const consensusInteractions = agentInteractions.filter(i => i.interactionType === 'consensus');
    const consensusFailures = consensusInteractions.filter(i => i.outcome === 'failure');
    if (consensusFailures.length > 0 && consensusInteractions.length > 0) {
      const failureRate = consensusFailures.length / consensusInteractions.length;
      if (failureRate > 0.3) {
        risks.push({
          type: 'consensus_failure',
          severity: Math.min(1.0, failureRate * 2),
          description: `High consensus failure rate: ${(failureRate * 100).toFixed(1)}%`,
          affectedAgents: Array.from(new Set(
            consensusFailures.flatMap(i => [i.sourceAgentId, i.targetAgentId])
          )),
          evidence: { failureRate, failedCount: consensusFailures.length }
        });
      }
    }

    // 4. Escalation patterns
    const escalations = this.detectEscalationPatterns(agentInteractions);
    if (escalations.length > 0) {
      risks.push({
        type: 'escalation',
        severity: 0.6,
        description: `${escalations.length} escalation patterns detected`,
        affectedAgents: escalations.flatMap(e => e.agents),
        evidence: { escalationCount: escalations.length }
      });
    }

    const detected = risks.length > 0;
    const overallScore = detected
      ? Math.max(...risks.map(r => r.severity))
      : 0;
    const criticalIssues = risks
      .filter(r => r.severity >= 0.8)
      .map(r => r.description);

    return {
      detected,
      risks,
      overallScore,
      criticalIssues
    };
  }

  /**
   * Assesses performance risks
   */
  async assessPerformanceRisks(
    orchestrationContext: OrchestrationContext
  ): Promise<PerformanceRiskReport> {
    const risks: PerformanceRisk[] = [];
    const metrics = orchestrationContext.metrics;
    const thresholds = this.config.thresholds;

    // 1. Latency degradation
    if (metrics.averageLatency > thresholds.maxLatencyMs) {
      const severity = Math.min(1.0, metrics.averageLatency / (thresholds.maxLatencyMs * 2));
      risks.push({
        type: 'latency_degradation',
        severity,
        description: `Average latency ${metrics.averageLatency}ms exceeds threshold ${thresholds.maxLatencyMs}ms`,
        affectedMetrics: ['averageLatency'],
        evidence: {
          currentLatency: metrics.averageLatency,
          threshold: thresholds.maxLatencyMs,
          excess: metrics.averageLatency - thresholds.maxLatencyMs
        }
      });
    }

    // 2. Resource contention
    if (metrics.resourceContention > thresholds.maxResourceContention) {
      const severity = (metrics.resourceContention - thresholds.maxResourceContention) / 
                       (1 - thresholds.maxResourceContention);
      risks.push({
        type: 'resource_contention',
        severity,
        description: `Resource contention ${(metrics.resourceContention * 100).toFixed(1)}% exceeds threshold ${(thresholds.maxResourceContention * 100).toFixed(1)}%`,
        affectedMetrics: ['resourceContention'],
        evidence: {
          currentContention: metrics.resourceContention,
          threshold: thresholds.maxResourceContention
        }
      });
    }

    // 3. Handoff success rate degradation
    if (metrics.handoffSuccessRate < thresholds.minSuccessRate) {
      const severity = (thresholds.minSuccessRate - metrics.handoffSuccessRate) / thresholds.minSuccessRate;
      risks.push({
        type: 'throughput_degradation',
        severity,
        description: `Handoff success rate ${(metrics.handoffSuccessRate * 100).toFixed(1)}% below threshold ${(thresholds.minSuccessRate * 100).toFixed(1)}%`,
        affectedMetrics: ['handoffSuccessRate'],
        evidence: {
          currentRate: metrics.handoffSuccessRate,
          threshold: thresholds.minSuccessRate,
          deficit: thresholds.minSuccessRate - metrics.handoffSuccessRate
        }
      });
    }

    // 4. Coordination bottlenecks
    if (metrics.coordinationAttempts > 0) {
      const coordinationRate = metrics.coordinationSuccessRate;
      if (coordinationRate < 0.8) {
        risks.push({
          type: 'bottleneck',
          severity: 1.0 - coordinationRate,
          description: `Coordination success rate ${(coordinationRate * 100).toFixed(1)}% indicates bottlenecks`,
          affectedMetrics: ['coordinationSuccessRate'],
          evidence: {
            coordinationRate,
            attempts: metrics.coordinationAttempts
          }
        });
      }
    }

    // 5. Handoff depth analysis
    if (metrics.handoffCount > thresholds.maxHandoffDepth) {
      risks.push({
        type: 'latency_degradation',
        severity: Math.min(1.0, (metrics.handoffCount - thresholds.maxHandoffDepth) / thresholds.maxHandoffDepth),
        description: `Handoff depth ${metrics.handoffCount} exceeds maximum ${thresholds.maxHandoffDepth}`,
        affectedMetrics: ['handoffCount'],
        evidence: {
          currentDepth: metrics.handoffCount,
          threshold: thresholds.maxHandoffDepth
        }
      });
    }

    const detected = risks.length > 0;
    const overallScore = detected
      ? Math.max(...risks.map(r => r.severity))
      : 0;
    const criticalIssues = risks
      .filter(r => r.severity >= 0.8)
      .map(r => r.description);

    return {
      detected,
      risks,
      overallScore,
      criticalIssues
    };
  }

  /**
   * Calculates overall risk level from all risk categories
   */
  private calculateOverallRisk(
    coordination: CoordinationRiskReport,
    behavioral: BehavioralRiskReport,
    performance: PerformanceRiskReport
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Weighted combination: coordination 40%, behavioral 30%, performance 30%
    const weightedScore = (
      coordination.overallScore * 0.4 +
      behavioral.overallScore * 0.3 +
      performance.overallScore * 0.3
    );

    // Take maximum to catch critical issues in any category
    const maxScore = Math.max(
      coordination.overallScore,
      behavioral.overallScore,
      performance.overallScore
    );

    // Use maximum for critical/high, weighted for medium/low
    const finalScore = maxScore >= 0.8 ? maxScore : weightedScore;

    if (finalScore >= 0.8) {
      return 'critical';
    } else if (finalScore >= 0.6) {
      return 'high';
    } else if (finalScore >= 0.3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generates mitigation strategies based on risks
   */
  private generateMitigationStrategies(
    coordination: CoordinationRiskReport,
    behavioral: BehavioralRiskReport,
    performance: PerformanceRiskReport,
    overallRiskLevel: string
  ): string[] {
    const strategies: string[] = [];

    if (overallRiskLevel === 'critical') {
      strategies.push('CRITICAL: Immediate intervention required. Consider pausing orchestration.');
    }

    // Coordination mitigation strategies
    for (const risk of coordination.risks) {
      switch (risk.type) {
        case 'handoff_failure':
          strategies.push('Improve handoff reliability: Review agent compatibility and handoff protocols');
          break;
        case 'context_loss':
          strategies.push('Enhance context preservation: Implement better context compression and transfer');
          break;
        case 'agent_conflict':
          strategies.push('Resolve agent conflicts: Implement conflict resolution mechanisms');
          break;
        case 'deadlock':
          strategies.push('BREAK DEADLOCK: Implement timeout mechanisms and deadlock detection');
          break;
      }
    }

    // Behavioral mitigation strategies
    for (const risk of behavioral.risks) {
      switch (risk.type) {
        case 'cascading_failure':
          strategies.push('Implement circuit breakers to prevent cascading failures');
          break;
        case 'consensus_failure':
          strategies.push('Improve consensus mechanisms: Review voting and agreement protocols');
          break;
        case 'escalation':
          strategies.push('Monitor escalation patterns: Implement escalation limits');
          break;
      }
    }

    // Performance mitigation strategies
    for (const risk of performance.risks) {
      switch (risk.type) {
        case 'latency_degradation':
          strategies.push('Optimize latency: Review agent selection and reduce handoff depth');
          break;
        case 'resource_contention':
          strategies.push('Reduce resource contention: Balance workloads and implement queuing');
          break;
        case 'bottleneck':
          strategies.push('Identify and resolve bottlenecks: Review coordination patterns');
          break;
        case 'throughput_degradation':
          strategies.push('Improve throughput: Optimize handoff success rates and reduce failures');
          break;
      }
    }

    if (strategies.length === 0) {
      strategies.push('No specific mitigation strategies needed. System operating within acceptable risk levels.');
    }

    return strategies;
  }

  /**
   * Detects context loss in interactions
   */
  private detectContextLoss(
    interactions: AgentInteraction[],
    context: OrchestrationContext
  ): AgentInteraction[] {
    // Detect interactions where context might be lost
    // Simple heuristic: interactions with empty or minimal context
    return interactions.filter(i => 
      !i.context || Object.keys(i.context).length === 0
    );
  }

  /**
   * Detects agent conflicts
   */
  private detectAgentConflicts(interactions: AgentInteraction[]): AgentInteraction[] {
    // Detect conflicting interactions (same agents, opposing outcomes)
    const conflicts: AgentInteraction[] = [];
    const interactionMap = new Map<string, AgentInteraction[]>();

    for (const interaction of interactions) {
      const key = `${interaction.sourceAgentId}-${interaction.targetAgentId}`;
      if (!interactionMap.has(key)) {
        interactionMap.set(key, []);
      }
      interactionMap.get(key)!.push(interaction);
    }

    for (const [key, group] of interactionMap.entries()) {
      const outcomes = group.map(i => i.outcome);
      // Conflict if we have both success and failure for same agent pair
      if (outcomes.includes('success') && outcomes.includes('failure')) {
        conflicts.push(...group);
      }
    }

    return conflicts;
  }

  /**
   * Detects deadlocks and circular dependencies
   */
  private detectDeadlocks(interactions: AgentInteraction[]): Array<{ agents: string[]; cycle: string[] }> {
    const deadlocks: Array<{ agents: string[]; cycle: string[] }> = [];
    
    // Build dependency graph
    const graph = new Map<string, string[]>();
    for (const interaction of interactions.filter(i => i.interactionType === 'handoff')) {
      if (!graph.has(interaction.sourceAgentId)) {
        graph.set(interaction.sourceAgentId, []);
      }
      graph.get(interaction.sourceAgentId)!.push(interaction.targetAgentId);
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (agent: string, path: string[]): boolean => {
      visited.add(agent);
      recStack.add(agent);
      path.push(agent);

      const neighbors = graph.get(agent) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, path)) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          deadlocks.push({ agents: Array.from(new Set(cycle)), cycle });
          return true;
        }
      }

      recStack.delete(agent);
      path.pop();
      return false;
    };

    for (const agent of graph.keys()) {
      if (!visited.has(agent)) {
        hasCycle(agent, []);
      }
    }

    return deadlocks;
  }

  /**
   * Detects unexpected interactions
   */
  private detectUnexpectedInteractions(
    interactions: AgentInteraction[],
    context: OrchestrationContext
  ): AgentInteraction[] {
    // Interactions with agents not in the expected set
    const expectedAgents = new Set(context.agentIds);
    return interactions.filter(i =>
      !expectedAgents.has(i.sourceAgentId) || !expectedAgents.has(i.targetAgentId)
    );
  }

  /**
   * Detects cascading failures
   */
  private detectCascadingFailures(interactions: AgentInteraction[]): Array<{ agents: string[]; chainLength: number }> {
    const cascades: Array<{ agents: string[]; chainLength: number }> = [];
    const failureInteractions = interactions.filter(i => i.outcome === 'failure');

    for (const interaction of failureInteractions) {
      const chain: string[] = [interaction.sourceAgentId];
      let current = interaction.targetAgentId;

      // Follow failure chain
      while (current && chain.length < 10) {
        chain.push(current);
        const nextFailure = failureInteractions.find(
          i => i.sourceAgentId === current && i.interactionType === 'handoff'
        );
        if (nextFailure) {
          current = nextFailure.targetAgentId;
        } else {
          break;
        }
      }

      if (chain.length >= 3) {
        cascades.push({ agents: Array.from(new Set(chain)), chainLength: chain.length });
      }
    }

    return cascades;
  }

  /**
   * Detects escalation patterns
   */
  private detectEscalationPatterns(interactions: AgentInteraction[]): Array<{ agents: string[] }> {
    const escalations: Array<{ agents: string[] }> = [];
    
    // Detect patterns where same agents interact repeatedly with increasing frequency
    const interactionCounts = new Map<string, number>();
    for (const interaction of interactions) {
      const key = `${interaction.sourceAgentId}-${interaction.targetAgentId}`;
      interactionCounts.set(key, (interactionCounts.get(key) || 0) + 1);
    }

    const avgCount = Array.from(interactionCounts.values()).reduce((a, b) => a + b, 0) / interactionCounts.size;
    const threshold = avgCount * 2;

    for (const [key, count] of interactionCounts.entries()) {
      if (count > threshold) {
        const [source, target] = key.split('-');
        escalations.push({ agents: [source, target] });
      }
    }

    return escalations;
  }
}

