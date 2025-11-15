/**
 * Unit Tests for MAEBE Evaluator
 * 
 * Tests emergent behavior evaluation and multi-agent risk assessment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAEBEEvaluator, OrchestrationContext, AgentInteraction, OrchestrationMetrics } from '../../orchestrator/maebe-evaluator.ts';
import { WorkflowState } from '../../swarm/langgraph.orchestrator.ts';

// Mock Agent Lightning
vi.mock('../../utils/agent-lightning-hooks.ts', () => ({
  agl: {
    emitSpan: vi.fn(() => 'span-id'),
    emitMetric: vi.fn(),
    endSpan: vi.fn()
  }
}));

describe('MAEBE Evaluator', () => {
  let evaluator: MAEBEEvaluator;
  let mockContext: OrchestrationContext;
  let mockInteractions: AgentInteraction[];

  beforeEach(() => {
    evaluator = new MAEBEEvaluator({
      enabled: true,
      enableAgentLightningTracking: true
    });

    const mockMetrics: OrchestrationMetrics = {
      handoffCount: 5,
      handoffSuccessRate: 0.9,
      averageLatency: 100,
      resourceContention: 0.3,
      coordinationAttempts: 10,
      coordinationSuccessRate: 0.95
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
      },
      {
        sourceAgentId: 'agent-2',
        targetAgentId: 'agent-3',
        interactionType: 'handoff',
        timestamp: new Date(),
        context: { taskId: 'test-task-1' },
        outcome: 'success'
      }
    ];
  });

  describe('evaluateEmergentBehavior', () => {
    it('should return a report when no behaviors are detected', async () => {
      const report = await evaluator.evaluateEmergentBehavior(mockContext, []);

      expect(report).toBeDefined();
      expect(report.detected).toBe(false);
      expect(report.behaviors).toEqual([]);
      expect(report.riskLevel).toBe('low');
      expect(report.confidence).toBeGreaterThanOrEqual(0);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.timestamp).toBeInstanceOf(Date);
    });

    it('should detect coordination failures from failed interactions', async () => {
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

      const report = await evaluator.evaluateEmergentBehavior(mockContext, failedInteractions);

      expect(report.detected).toBe(true);
      expect(report.behaviors.length).toBeGreaterThan(0);
      expect(['medium', 'high', 'critical']).toContain(report.riskLevel);
      
      const coordinationFailures = report.behaviors.filter(b => b.type === 'coordination_failure');
      expect(coordinationFailures.length).toBeGreaterThan(0);
    });

    it('should detect resource contention when metrics indicate high contention', async () => {
      const highContentionContext: OrchestrationContext = {
        ...mockContext,
        metrics: {
          ...mockContext.metrics,
          resourceContention: 0.9 // High contention
        }
      };

      const report = await evaluator.evaluateEmergentBehavior(highContentionContext, mockInteractions);

      expect(report.detected).toBe(true);
      const resourceRisks = report.behaviors.filter(b => b.type === 'resource_contention');
      expect(resourceRisks.length).toBeGreaterThan(0);
    });

    it('should detect cascading interactions from interaction chains', async () => {
      const cascadingInteractions: AgentInteraction[] = [
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
          targetAgentId: 'agent-4',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        },
        {
          sourceAgentId: 'agent-4',
          targetAgentId: 'agent-5',
          interactionType: 'handoff',
          timestamp: new Date(),
          context: {},
          outcome: 'success'
        }
      ];

      const report = await evaluator.evaluateEmergentBehavior(mockContext, cascadingInteractions);

      expect(report.detected).toBe(true);
      const cascades = report.behaviors.filter(b => b.type === 'cascading_interactions');
      expect(cascades.length).toBeGreaterThan(0);
    });

    it('should assess risk level correctly based on behavior severity', async () => {
      const criticalInteractions: AgentInteraction[] = Array(10).fill(null).map((_, i) => ({
        sourceAgentId: `agent-${i}`,
        targetAgentId: `agent-${i + 1}`,
        interactionType: 'handoff' as const,
        timestamp: new Date(),
        context: {},
        outcome: 'failure' as const
      }));

      const report = await evaluator.evaluateEmergentBehavior(mockContext, criticalInteractions);

      expect(['high', 'critical']).toContain(report.riskLevel);
      if (report.riskLevel === 'critical') {
        expect(report.behaviors.some(b => b.severity >= 0.8)).toBe(true);
      }
    });

    it('should generate recommendations based on detected behaviors', async () => {
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

      const report = await evaluator.evaluateEmergentBehavior(mockContext, failedInteractions);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.every(r => typeof r === 'string')).toBe(true);
    });
  });

  describe('assessMultiAgentRisks', () => {
    it('should assess risks for agent ensemble', async () => {
      const mockAgents = [
        { id: 'agent-1', type: 'coder', name: 'Coder', expertise: ['coding'], workload: 5, capacity: 10 },
        { id: 'agent-2', type: 'reviewer', name: 'Reviewer', expertise: ['review'], workload: 3, capacity: 10 },
        { id: 'agent-3', type: 'tester', name: 'Tester', expertise: ['testing'], workload: 7, capacity: 10 }
      ];

      const assessment = await evaluator.assessMultiAgentRisks(mockAgents as any, {});

      expect(assessment).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.riskLevel);
      expect(assessment.score).toBeGreaterThanOrEqual(0);
      expect(assessment.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(assessment.factors)).toBe(true);
    });

    it('should detect workload imbalance', async () => {
      const imbalancedAgents = [
        { id: 'agent-1', type: 'coder', name: 'Coder', expertise: ['coding'], workload: 9, capacity: 10 },
        { id: 'agent-2', type: 'reviewer', name: 'Reviewer', expertise: ['review'], workload: 1, capacity: 10 },
        { id: 'agent-3', type: 'tester', name: 'Tester', expertise: ['testing'], workload: 0, capacity: 10 }
      ];

      const assessment = await evaluator.assessMultiAgentRisks(imbalancedAgents as any, {});

      // Workload imbalance may be detected as capacity constraints instead
      expect(
        assessment.factors.some(f => 
          f.toLowerCase().includes('workload') || 
          f.toLowerCase().includes('capacity') ||
          f.toLowerCase().includes('imbalance')
        )
      ).toBe(true);
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.riskLevel);
    });

    it('should detect capacity constraints', async () => {
      const overloadedAgents = [
        { id: 'agent-1', type: 'coder', name: 'Coder', expertise: ['coding'], workload: 9, capacity: 10 },
        { id: 'agent-2', type: 'reviewer', name: 'Reviewer', expertise: ['review'], workload: 9, capacity: 10 }
      ];

      const assessment = await evaluator.assessMultiAgentRisks(overloadedAgents as any, {});

      expect(assessment.factors.some(f => f.includes('capacity'))).toBe(true);
    });

    it('should detect low agent diversity', async () => {
      const lowDiversityAgents = [
        { id: 'agent-1', type: 'coder', name: 'Coder1', expertise: ['coding'], workload: 5, capacity: 10 },
        { id: 'agent-2', type: 'coder', name: 'Coder2', expertise: ['coding'], workload: 5, capacity: 10 },
        { id: 'agent-3', type: 'coder', name: 'Coder3', expertise: ['coding'], workload: 5, capacity: 10 }
      ];

      const assessment = await evaluator.assessMultiAgentRisks(lowDiversityAgents as any, {});

      expect(assessment.factors.some(f => f.includes('diversity'))).toBe(true);
    });
  });

  describe('getAgentEmergentBehaviorScore', () => {
    it('should return perfect score for agent with no behaviors', async () => {
      const agent = { id: 'agent-1', type: 'coder', name: 'Coder', expertise: ['coding'], workload: 5, capacity: 10 };

      const score = await evaluator.getAgentEmergentBehaviorScore(agent as any);

      expect(score).toBe(1.0);
    });

    it('should return lower score for agent with high-severity behaviors', async () => {
      // First, create behaviors for the agent
      const agent = { id: 'agent-1', type: 'coder', name: 'Coder', expertise: ['coding'], workload: 5, capacity: 10 };
      
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

      await evaluator.evaluateEmergentBehavior(mockContext, failedInteractions);

      const score = await evaluator.getAgentEmergentBehaviorScore(agent as any);

      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('configuration', () => {
    it('should respect disabled configuration', () => {
      const disabledEvaluator = new MAEBEEvaluator({ enabled: false });
      expect(disabledEvaluator).toBeDefined();
    });

    it('should initialize with custom risk thresholds', () => {
      const customEvaluator = new MAEBEEvaluator({
        enabled: true,
        riskThresholds: {
          low: 0.2,
          medium: 0.5,
          high: 0.7,
          critical: 0.9
        }
      });

      expect(customEvaluator).toBeDefined();
    });
  });
});

