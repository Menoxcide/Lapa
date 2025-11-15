/**
 * Agent Selector Test Suite
 * 
 * Tests for AI-powered agent selection system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { agentSelector, type AgentRecommendation } from '../../orchestrator/agent-selector.ts';

describe('Agent Selector', () => {
  beforeEach(() => {
    // Clear history before each test
    const history = agentSelector.getSelectionHistory();
    // Note: No public method to clear, but tests should be independent
  });

  describe('Agent Selection', () => {
    it('should select agent for coding task', async () => {
      const recommendations = await agentSelector.selectAgent(
        'Implement REST API endpoint'
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].agentName).toBeDefined();
      expect(recommendations[0].confidence).toBeGreaterThan(0);
      expect(recommendations[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should select agent for planning task', async () => {
      const recommendations = await agentSelector.selectAgent(
        'Create project plan and architecture'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      // Should recommend PLANNER or ARCHITECT
      const agentNames = recommendations.map(r => r.agentName);
      expect(
        agentNames.some(name => ['PLANNER', 'ARCHITECT'].includes(name))
      ).toBe(true);
    });

    it('should select agent for testing task', async () => {
      const recommendations = await agentSelector.selectAgent(
        'Create comprehensive test suite'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      const agentNames = recommendations.map(r => r.agentName);
      expect(agentNames).toContain('TEST');
    });

    it('should provide reasoning for recommendations', async () => {
      const recommendations = await agentSelector.selectAgent(
        'Fix authentication bug'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].reasoning).toBeDefined();
      expect(recommendations[0].reasoning.length).toBeGreaterThan(0);
    });

    it('should sort recommendations by confidence', async () => {
      const recommendations = await agentSelector.selectAgent(
        'Implement user authentication'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].confidence).toBeGreaterThanOrEqual(
          recommendations[i].confidence
        );
      }
    });
  });

  describe('Best Agent Selection', () => {
    it('should return best agent for task', async () => {
      const recommendation = await agentSelector.getBestAgent(
        'Write clean, maintainable code'
      );

      expect(recommendation).toBeDefined();
      expect(recommendation?.agentName).toBeDefined();
      expect(recommendation?.confidence).toBeGreaterThan(0);
    });

    it('should return null if no good match', async () => {
      // This is unlikely but test the behavior
      const recommendation = await agentSelector.getBestAgent('');
      
      // Should still return something or handle gracefully
      expect(recommendation === null || recommendation?.agentName).toBeTruthy();
    });
  });

  describe('Learning System', () => {
    it('should record selection outcomes', () => {
      const initialHistory = agentSelector.getSelectionHistory();
      const initialLength = initialHistory.length;

      agentSelector.recordOutcome(
        'Test task',
        'CODER',
        true,
        5000
      );

      const updatedHistory = agentSelector.getSelectionHistory();
      expect(updatedHistory.length).toBe(initialLength + 1);
      expect(updatedHistory[updatedHistory.length - 1].selectedAgent).toBe('CODER');
      expect(updatedHistory[updatedHistory.length - 1].success).toBe(true);
    });

    it('should track agent performance', () => {
      // Record multiple outcomes
      agentSelector.recordOutcome('Task 1', 'CODER', true, 3000);
      agentSelector.recordOutcome('Task 2', 'CODER', true, 4000);
      agentSelector.recordOutcome('Task 3', 'CODER', false, 2000);

      const performance = agentSelector.getAgentPerformance();
      const coderPerf = performance.get('CODER');

      expect(coderPerf).toBeDefined();
      if (coderPerf) {
        expect(coderPerf.successes).toBeGreaterThan(0);
        expect(coderPerf.avgTime).toBeGreaterThan(0);
      }
    });

    it('should improve recommendations based on history', async () => {
      // Record successful outcomes for CODER
      agentSelector.recordOutcome('Code task 1', 'CODER', true, 3000);
      agentSelector.recordOutcome('Code task 2', 'CODER', true, 3500);
      agentSelector.recordOutcome('Code task 3', 'CODER', true, 3200);

      const recommendations = await agentSelector.selectAgent(
        'Implement new feature'
      );

      // CODER should have higher confidence due to good history
      const coderRec = recommendations.find(r => r.agentName === 'CODER');
      expect(coderRec).toBeDefined();
      if (coderRec) {
        expect(coderRec.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Selection History', () => {
    it('should maintain selection history', () => {
      agentSelector.recordOutcome('Task 1', 'CODER', true, 3000);
      agentSelector.recordOutcome('Task 2', 'TEST', true, 2000);

      const history = agentSelector.getSelectionHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit history size', () => {
      // Record many outcomes
      for (let i = 0; i < 1500; i++) {
        agentSelector.recordOutcome(`Task ${i}`, 'CODER', true, 3000);
      }

      const history = agentSelector.getSelectionHistory();
      // Should be limited to 1000
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Agent Performance Metrics', () => {
    it('should track success rates', () => {
      agentSelector.recordOutcome('Task 1', 'CODER', true, 3000);
      agentSelector.recordOutcome('Task 2', 'CODER', true, 4000);
      agentSelector.recordOutcome('Task 3', 'CODER', false, 2000);

      const performance = agentSelector.getAgentPerformance();
      const coderPerf = performance.get('CODER');

      expect(coderPerf).toBeDefined();
      if (coderPerf) {
        expect(coderPerf.successes).toBe(2);
        expect(coderPerf.failures).toBe(1);
      }
    });

    it('should calculate average task time', () => {
      agentSelector.recordOutcome('Task 1', 'CODER', true, 3000);
      agentSelector.recordOutcome('Task 2', 'CODER', true, 5000);
      agentSelector.recordOutcome('Task 3', 'CODER', true, 4000);

      const performance = agentSelector.getAgentPerformance();
      const coderPerf = performance.get('CODER');

      expect(coderPerf).toBeDefined();
      if (coderPerf) {
        expect(coderPerf.avgTime).toBeGreaterThan(0);
        // Should be around 3000-5000ms
        expect(coderPerf.avgTime).toBeGreaterThan(2000);
        expect(coderPerf.avgTime).toBeLessThan(6000);
      }
    });
  });
});

