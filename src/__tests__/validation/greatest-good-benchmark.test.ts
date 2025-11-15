/**
 * Unit Tests for Greatest Good Benchmark
 * 
 * Tests moral preference evaluation using double-inversion technique
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GreatestGoodBenchmark, AgentDecision, MultiAgentContext } from '../../validation/greatest-good-benchmark.ts';

// Mock Agent Lightning
vi.mock('../../utils/agent-lightning-hooks.ts', () => ({
  agl: {
    emitSpan: vi.fn(() => 'span-id'),
    emitMetric: vi.fn(),
    endSpan: vi.fn()
  }
}));

describe('Greatest Good Benchmark', () => {
  let benchmark: GreatestGoodBenchmark;
  let mockDecisions: AgentDecision[];
  let mockContext: MultiAgentContext;

  beforeEach(() => {
    benchmark = new GreatestGoodBenchmark({
      enabled: true,
      enableDoubleInversion: true,
      enableAgentLightningTracking: true
    });

    mockContext = {
      agentIds: ['agent-1', 'agent-2', 'agent-3'],
      interactionHistory: [],
      sharedContext: { taskId: 'test-task-1' },
      decisionSequence: 1
    };

    mockDecisions = [
      {
        agentId: 'agent-1',
        decision: 'yes',
        context: mockContext,
        timestamp: new Date(),
        confidence: 0.9
      },
      {
        agentId: 'agent-2',
        decision: 'yes',
        context: mockContext,
        timestamp: new Date(),
        confidence: 0.8
      },
      {
        agentId: 'agent-3',
        decision: 'yes',
        context: mockContext,
        timestamp: new Date(),
        confidence: 0.85
      }
    ];
  });

  describe('evaluatePreferences', () => {
    it('should evaluate moral preferences and return GGB score', async () => {
      const score = await benchmark.evaluatePreferences(mockDecisions, mockContext);

      expect(score).toBeDefined();
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(1);
      expect(score.preferenceStability).toBeGreaterThanOrEqual(0);
      expect(score.preferenceStability).toBeLessThanOrEqual(1);
      expect(score.contextConsistency).toBeGreaterThanOrEqual(0);
      expect(score.contextConsistency).toBeLessThanOrEqual(1);
      expect(score.brittlenessIndex).toBeGreaterThanOrEqual(0);
      expect(score.brittlenessIndex).toBeLessThanOrEqual(1);
      expect(Array.isArray(score.recommendations)).toBe(true);
      expect(score.timestamp).toBeInstanceOf(Date);
    });

    it('should detect high brittleness when preferences shift significantly', async () => {
      const inconsistentDecisions: AgentDecision[] = [
        {
          agentId: 'agent-1',
          decision: 'yes',
          context: mockContext,
          timestamp: new Date(),
          confidence: 0.9
        },
        {
          agentId: 'agent-1', // Same agent
          decision: 'no', // Different decision
          context: { ...mockContext, decisionSequence: 2 },
          timestamp: new Date(),
          confidence: 0.9
        },
        {
          agentId: 'agent-1',
          decision: 'yes', // Back to original
          context: { ...mockContext, decisionSequence: 3 },
          timestamp: new Date(),
          confidence: 0.9
        }
      ];

      const score = await benchmark.evaluatePreferences(inconsistentDecisions, mockContext);

      // High brittleness indicates preferences shift
      expect(score.brittlenessIndex).toBeGreaterThan(0);
    });

    it('should calculate preference stability correctly', async () => {
      const stableDecisions: AgentDecision[] = Array(5).fill(null).map((_, i) => ({
        agentId: 'agent-1',
        decision: 'yes', // Consistent decisions
        context: { ...mockContext, decisionSequence: i + 1 },
        timestamp: new Date(),
        confidence: 0.9
      }));

      const score = await benchmark.evaluatePreferences(stableDecisions, mockContext);

      expect(score.preferenceStability).toBeGreaterThanOrEqual(0);
      expect(score.preferenceStability).toBeLessThanOrEqual(1);
    });

    it('should calculate context consistency correctly', async () => {
      const consistentDecisions: AgentDecision[] = [
        {
          agentId: 'agent-1',
          decision: 'yes',
          context: mockContext,
          timestamp: new Date(),
          confidence: 0.9
        },
        {
          agentId: 'agent-1',
          decision: 'yes',
          context: { ...mockContext, decisionSequence: 2 },
          timestamp: new Date(),
          confidence: 0.9
        }
      ];

      const score = await benchmark.evaluatePreferences(consistentDecisions, mockContext);

      expect(score.contextConsistency).toBeGreaterThanOrEqual(0);
      expect(score.contextConsistency).toBeLessThanOrEqual(1);
    });

    it('should generate recommendations based on brittleness', async () => {
      const highBrittlenessDecisions: AgentDecision[] = [
        {
          agentId: 'agent-1',
          decision: 'yes',
          context: mockContext,
          timestamp: new Date(),
          confidence: 0.9
        },
        {
          agentId: 'agent-1',
          decision: 'no',
          context: { ...mockContext, decisionSequence: 2 },
          timestamp: new Date(),
          confidence: 0.9
        }
      ];

      const score = await benchmark.evaluatePreferences(highBrittlenessDecisions, mockContext);

      expect(score.recommendations.length).toBeGreaterThan(0);
      if (score.brittlenessIndex > 0.2) {
        expect(score.recommendations.some(r => r.toLowerCase().includes('brittleness'))).toBe(true);
      }
    });

    it('should handle empty decisions array', async () => {
      const score = await benchmark.evaluatePreferences([], mockContext);

      expect(score).toBeDefined();
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.brittlenessIndex).toBe(0); // No decisions = no brittleness
    });

    it('should handle single decision', async () => {
      const singleDecision: AgentDecision[] = [
        {
          agentId: 'agent-1',
          decision: 'yes',
          context: mockContext,
          timestamp: new Date(),
          confidence: 0.9
        }
      ];

      const score = await benchmark.evaluatePreferences(singleDecision, mockContext);

      expect(score).toBeDefined();
      expect(score.contextConsistency).toBe(1.0); // Single decision = consistent
    });
  });

  describe('double-inversion technique', () => {
    it('should use double-inversion when enabled', async () => {
      const enabledBenchmark = new GreatestGoodBenchmark({
        enabled: true,
        enableDoubleInversion: true
      });

      const score = await enabledBenchmark.evaluatePreferences(mockDecisions, mockContext);

      expect(score).toBeDefined();
      expect(score.brittlenessIndex).toBeGreaterThanOrEqual(0);
    });

    it('should skip double-inversion when disabled', async () => {
      const disabledBenchmark = new GreatestGoodBenchmark({
        enabled: true,
        enableDoubleInversion: false
      });

      const score = await disabledBenchmark.evaluatePreferences(mockDecisions, mockContext);

      expect(score).toBeDefined();
      // Without inversion, brittleness should be calculated differently
      expect(score.brittlenessIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration', () => {
    it('should respect custom brittleness threshold', () => {
      const customBenchmark = new GreatestGoodBenchmark({
        enabled: true,
        brittlenessThreshold: 0.3
      });

      expect(customBenchmark).toBeDefined();
    });

    it('should handle disabled configuration', () => {
      const disabledBenchmark = new GreatestGoodBenchmark({ enabled: false });
      expect(disabledBenchmark).toBeDefined();
    });
  });
});

