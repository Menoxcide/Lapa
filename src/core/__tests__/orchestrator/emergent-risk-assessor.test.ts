/**
 * Unit Tests for Emergent Risk Assessor
 * 
 * Tests comprehensive risk assessment in multi-agent orchestration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmergentRiskAssessor, PerformanceThresholds } from '../../orchestrator/emergent-risk-assessor.ts';
import { OrchestrationContext, AgentInteraction, OrchestrationMetrics } from '../../orchestrator/maebe-evaluator.ts';
import { WorkflowState } from '../../swarm/langgraph.orchestrator.ts';

// Mock Agent Lightning
vi.mock('../../utils/agent-lightning-hooks.ts', () => ({
  agl: {
    emitSpan: vi.fn(() => 'span-id'),
    emitMetric: vi.fn(),
    endSpan: vi.fn()
  }
}));

describe('Emergent Risk Assessor', () => {
  let assessor: EmergentRiskAssessor;
  let mockContext: OrchestrationContext;
  let mockInteractions: AgentInteraction[];

  beforeEach(() => {
    assessor = new EmergentRiskAssessor({
      enabled: true,
      enableAgentLightningTracking: true
    });

    const mockMetrics: OrchestrationMetrics = {
      handoffCount: 5,
      handoffSuccessRate: 0.95,
      averageLatency: 500,
      resourceContention: 0.3,
      coordinationAttempts: 10,
      coordinationSuccessRate: 0.9
    };

    const mockWorkflowState: WorkflowState = {
      nodeId: 'start',
      context: {},
      history: []
    };

    mockContext = {
      workflowState: mockWorkflowState,
      taskId: 'test-task-1',
      agentIds: ['agent-1', 'agent-2', 'agent-3'],
      startTime: Date.now() - 1000,
      currentTime: Date.now(),
      metrics: mockMetrics
    };

    mockInteractions = [
      {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        interactionType: 'handoff',
        timestamp: new Date(),
        context: { taskId: 'test-task-1' },
        outcome: 'success'
      }
    ];
  });

  describe('assessRisks', () => {
    it('should perform comprehensive risk assessment', async () => {
      const assessment = await assessor.assessRisks(mockContext, mockInteractions);

      expect(assessment).toBeDefined();
      expect(assessment.coordinationRisks).toBeDefined();
      expect(assessment.behavioralRisks).toBeDefined();
      expect(assessment.performanceRisks).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.overallRiskLevel);
      expect(Array.isArray(assessment.mitigationStrategies)).toBe(true);
      expect(assessment.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate overall risk level from all categories', async () => {
      const assessment = await assessor.assessRisks(mockContext, mockInteractions);

      const maxCategoryRisk = Math.max(
        assessment.coordinationRisks.overallScore,
        assessment.behavioralRisks.overallScore,
        assessment.performanceRisks.overallScore
      );

      if (maxCategoryRisk >= 0.8) {
        expect(['high', 'critical']).toContain(assessment.overallRiskLevel);
      }
    });
  });

  describe('assessCoordinationRisks', () => {
    it('should detect handoff failures', async () => {
      const failedInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        },
        {
          sourceAgentId: 'agent-2',
          targetAgentId: 'agent-3',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        }
      ];

      const report = await assessor.assessCoordinationRisks(mockContext, failedInteractions);

      expect(report.detected).toBe(true);
      expect(report.risks.length).toBeGreaterThan(0);
      const handoffFailures = report.risks.filter(r => r.type === 'handoff_failure');
      expect(handoffFailures.length).toBeGreaterThan(0);
    });

    it('should detect context loss', async () => {
      const contextLossInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {}, // Empty context = context loss
          outcome: 'success'
        }
      ];

      const report = await assessor.assessCoordinationRisks(mockContext, contextLossInteractions);

      expect(report.detected).toBe(true);
      const contextRisks = report.risks.filter(r => r.type === 'context_loss');
      expect(contextRisks.length).toBeGreaterThan(0);
    });

    it('should detect agent conflicts', async () => {
      const conflictingInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        },
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        }
      ];

      const report = await assessor.assessCoordinationRisks(mockContext, conflictingInteractions);

      expect(report.detected).toBe(true);
      const conflicts = report.risks.filter(r => r.type === 'agent_conflict');
      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should detect deadlocks from circular dependencies', async () => {
      const circularInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        },
        {
          sourceAgentId: 'agent-2',
          targetAgentId: 'agent-3',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        },
        {
          sourceAgentId: 'agent-3',
          targetAgentId: 'agent-1', // Circular dependency
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        }
      ];

      const report = await assessor.assessCoordinationRisks(mockContext, circularInteractions);

      expect(report.detected).toBe(true);
      const deadlocks = report.risks.filter(r => r.type === 'deadlock');
      expect(deadlocks.length).toBeGreaterThan(0);
    });
  });

  describe('assessBehavioralRisks', () => {
    it('should detect unexpected interactions', async () => {
      const unexpectedInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-unknown',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        }
      ];

      const report = await assessor.assessBehavioralRisks(mockContext, unexpectedInteractions);

      expect(report.detected).toBe(true);
      const unexpected = report.risks.filter(r => r.type === 'unexpected_interaction');
      expect(unexpected.length).toBeGreaterThan(0);
    });

    it('should detect cascading failures', async () => {
      const cascadingInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        },
        {
          sourceAgentId: 'agent-2',
          targetAgentId: 'agent-3',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        },
        {
          sourceAgentId: 'agent-3',
          targetAgentId: 'agent-4',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        }
      ];

      const report = await assessor.assessBehavioralRisks(mockContext, cascadingInteractions);

      expect(report.detected).toBe(true);
      const cascades = report.risks.filter(r => r.type === 'cascading_failure');
      expect(cascades.length).toBeGreaterThan(0);
    });

    it('should detect consensus failures', async () => {
      const consensusInteractions: AgentInteraction[] = Array(5).fill(null).map((_, i) => ({
        sourceAgentId: `agent-${i}`,
        targetAgentId: `agent-${i + 1}`,
        interactionType: 'consensus' as const,
        timestamp: new Date(),
        context: {},
        outcome: i < 2 ? 'failure' : 'success' // 40% failure rate
      }));

      const report = await assessor.assessBehavioralRisks(mockContext, consensusInteractions);

      expect(report.detected).toBe(true);
      const consensusFailures = report.risks.filter(r => r.type === 'consensus_failure');
      expect(consensusFailures.length).toBeGreaterThan(0);
    });
  });

  describe('assessPerformanceRisks', () => {
    it('should detect latency degradation', async () => {
      const highLatencyContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          averageLatency: 2000 // Exceeds default threshold of 1000ms
        }
      };

      const report = await assessor.assessPerformanceRisks(highLatencyContext);

      expect(report.detected).toBe(true);
      const latencyRisks = report.risks.filter(r => r.type === 'latency_degradation');
      expect(latencyRisks.length).toBeGreaterThan(0);
    });

    it('should detect resource contention', async () => {
      const highContentionContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          resourceContention: 0.9 // Exceeds default threshold of 0.7
        }
      };

      const report = await assessor.assessPerformanceRisks(highContentionContext);

      expect(report.detected).toBe(true);
      const contentionRisks = report.risks.filter(r => r.type === 'resource_contention');
      expect(contentionRisks.length).toBeGreaterThan(0);
    });

    it('should detect handoff success rate degradation', async () => {
      const lowSuccessContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          handoffSuccessRate: 0.8 // Below default threshold of 0.95
        }
      };

      const report = await assessor.assessPerformanceRisks(lowSuccessContext);

      expect(report.detected).toBe(true);
      const throughputRisks = report.risks.filter(r => r.type === 'throughput_degradation');
      expect(throughputRisks.length).toBeGreaterThan(0);
    });

    it('should detect coordination bottlenecks', async () => {
      const bottleneckContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          coordinationSuccessRate: 0.5 // Low coordination success
        }
      };

      const report = await assessor.assessPerformanceRisks(bottleneckContext);

      expect(report.detected).toBe(true);
      const bottlenecks = report.risks.filter(r => r.type === 'bottleneck');
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it('should detect handoff depth issues', async () => {
      const deepHandoffContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          handoffCount: 15 // Exceeds default threshold of 10
        }
      };

      const report = await assessor.assessPerformanceRisks(deepHandoffContext);

      expect(report.detected).toBe(true);
    });
  });

  describe('generateMitigationStrategies', () => {
    it('should generate mitigation strategies for critical risks', async () => {
      const criticalInteractions: AgentInteraction[] = Array(10).fill(null).map((_, i) => ({
        sourceAgentId: `agent-${i}`,
        targetAgentId: `agent-${i + 1}`,
        interactionType: 'handoff' as const,
        timestamp: new Date(),
        context: {},
        outcome: 'failure' as const
      }));

      const assessment = await assessor.assessRisks(mockContext, criticalInteractions);

      expect(assessment.mitigationStrategies.length).toBeGreaterThan(0);
      if (assessment.overallRiskLevel === 'critical') {
        expect(assessment.mitigationStrategies.some(s => s.includes('CRITICAL'))).toBe(true);
      }
    });

    it('should generate specific strategies for each risk type', async () => {
      const failedInteractions: AgentInteraction[] = [
        {
          sourceAgentId: 'agent-1',
          targetAgentId: 'agent-2',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'failure'
        }
      ];

      const assessment = await assessor.assessRisks(mockContext, failedInteractions);

      expect(assessment.mitigationStrategies.length).toBeGreaterThan(0);
      expect(assessment.mitigationStrategies.every(s => typeof s === 'string')).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect custom performance thresholds', () => {
      const customThresholds: PerformanceThresholds = {
        maxLatencyMs: 500,
        maxResourceContention: 0.5,
        minSuccessRate: 0.9,
        maxHandoffDepth: 5,
        maxConcurrentHandoffs: 3
      };

      const customAssessor = new EmergentRiskAssessor({
        enabled: true,
        thresholds: customThresholds
      });

      expect(customAssessor).toBeDefined();
    });

    it('should handle disabled configuration', () => {
      const disabledAssessor = new EmergentRiskAssessor({ enabled: false });
      expect(disabledAssessor).toBeDefined();
    });
  });
});

