/**
 * Trust System Tests
 * 
 * Comprehensive test suite for trust-aware orchestration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  TrustSystem, 
  AgentTrust, 
  TrustEvaluation,
  OrchestrationContext,
  TaskResult
} from '../../orchestrator/trust-system.ts';
import { Agent, Task } from '../../agents/moe-router.ts';
import { RAGPipeline } from '../../rag/pipeline.ts';

describe('TrustSystem', () => {
  let trustSystem: TrustSystem;
  let mockRAGPipeline: Partial<RAGPipeline>;
  let testAgent: Agent;
  let testTask: Task;

  beforeEach(() => {
    mockRAGPipeline = {
      searchSimilar: jest.fn().mockResolvedValue([])
    };

    trustSystem = new TrustSystem(mockRAGPipeline as RAGPipeline);

    testAgent = {
      id: 'agent-1',
      type: 'coder',
      name: 'Test Agent',
      expertise: ['typescript', 'react'],
      workload: 0,
      capacity: 10
    };

    testTask = {
      id: 'task-1',
      description: 'Implement React component',
      type: 'code',
      priority: 1
    };

    trustSystem.registerAgent(testAgent);
  });

  describe('Agent Registration', () => {
    it('should register agent and initialize trust', () => {
      const trust = trustSystem.getAgentTrust('agent-1');
      expect(trust).toBeDefined();
      expect(trust?.agentId).toBe('agent-1');
      expect(trust?.trustScore).toBe(0.5); // Initial neutral trust
    });

    it('should unregister agent', () => {
      trustSystem.unregisterAgent('agent-1');
      const trust = trustSystem.getAgentTrust('agent-1');
      expect(trust).toBeUndefined();
    });
  });

  describe('Trust Evaluation', () => {
    it('should evaluate trust for agent', async () => {
      const context: OrchestrationContext = {
        task: testTask,
        systemState: {},
        similarTasks: []
      };

      const evaluation = await trustSystem.evaluateTrust('agent-1', context);
      
      expect(evaluation).toBeDefined();
      expect(evaluation.agentId).toBe('agent-1');
      expect(evaluation.trustScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.trustScore).toBeLessThanOrEqual(1);
      expect(evaluation.confidence).toBeGreaterThanOrEqual(0);
      expect(evaluation.confidence).toBeLessThanOrEqual(1);
      expect(['trust', 'distrust', 'cautious']).toContain(evaluation.recommendation);
    });

    it('should include trust factors in evaluation', async () => {
      const context: OrchestrationContext = {
        task: testTask,
        systemState: {},
        similarTasks: []
      };

      const evaluation = await trustSystem.evaluateTrust('agent-1', context);
      
      expect(evaluation.factors).toBeDefined();
      expect(evaluation.factors.length).toBeGreaterThan(0);
      expect(evaluation.factors.some(f => f.type === 'capability')).toBe(true);
    });
  });

  describe('Trust Updates', () => {
    it('should update trust based on task performance', async () => {
      const initialTrust = trustSystem.getAgentTrust('agent-1');
      
      const taskResult: TaskResult = {
        taskId: 'task-1',
        success: true,
        performanceScore: 0.9
      };

      await trustSystem.updateTrust('agent-1', taskResult);
      
      const updatedTrust = trustSystem.getAgentTrust('agent-1');
      expect(updatedTrust).toBeDefined();
      expect(updatedTrust?.trustScore).toBeGreaterThan(initialTrust?.trustScore || 0);
      expect(updatedTrust?.history.length).toBe(1);
    });

    it('should decrease trust on failure', async () => {
      const initialTrust = trustSystem.getAgentTrust('agent-1');
      
      const taskResult: TaskResult = {
        taskId: 'task-1',
        success: false,
        performanceScore: 0.2
      };

      await trustSystem.updateTrust('agent-1', taskResult);
      
      const updatedTrust = trustSystem.getAgentTrust('agent-1');
      expect(updatedTrust?.trustScore).toBeLessThan(initialTrust?.trustScore || 1);
    });
  });

  describe('Agent Ranking', () => {
    it('should rank agents by trust', async () => {
      const agent2: Agent = {
        id: 'agent-2',
        type: 'reviewer',
        name: 'Review Agent',
        expertise: ['code-review'],
        workload: 0,
        capacity: 10
      };

      trustSystem.registerAgent(agent2);

      // Update trust for agent-1
      await trustSystem.updateTrust('agent-1', {
        taskId: 'task-1',
        success: true,
        performanceScore: 0.9
      });

      const ranking = await trustSystem.rankAgentsByTrust(
        [testAgent, agent2],
        testTask
      );

      expect(ranking.agents).toBeDefined();
      expect(ranking.agents.length).toBe(2);
      expect(ranking.agents[0].totalScore).toBeGreaterThanOrEqual(
        ranking.agents[1].totalScore
      );
    });
  });
});

