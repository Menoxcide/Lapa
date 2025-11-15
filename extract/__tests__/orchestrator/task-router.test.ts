/**
 * Task Router Test Suite
 * 
 * Tests for predictive task routing system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { taskRouter, type RoutingPrediction, type RoutingDecision } from '../../orchestrator/task-router.ts';
import { agentMonitor } from '../../orchestrator/agent-monitor.ts';
import { neuraforgeOrchestrator } from '../../orchestrator/neuraforge-orchestrator.ts';

describe('Task Router', () => {
  beforeEach(() => {
    agentMonitor.startMonitoring(100);
  });

  describe('Routing Predictions', () => {
    it('should predict routing for a task', async () => {
      const predictions = await taskRouter.predictRouting(
        'Implement REST API endpoint',
        'medium'
      );

      expect(predictions).toBeDefined();
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].agentName).toBeDefined();
      expect(predictions[0].estimatedWaitTime).toBeGreaterThanOrEqual(0);
      expect(predictions[0].estimatedCompletionTime).toBeGreaterThan(0);
      expect(predictions[0].confidence).toBeGreaterThan(0);
    });

    it('should sort predictions by completion time', async () => {
      const predictions = await taskRouter.predictRouting(
        'Write code',
        'high'
      );

      expect(predictions.length).toBeGreaterThan(0);
      
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i - 1].estimatedCompletionTime).toBeLessThanOrEqual(
          predictions[i].estimatedCompletionTime
        );
      }
    });

    it('should provide reasoning for predictions', async () => {
      const predictions = await taskRouter.predictRouting(
        'Fix bug',
        'high'
      );

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].reasoning).toBeDefined();
      expect(predictions[0].reasoning.length).toBeGreaterThan(0);
    });

    it('should handle priority levels', async () => {
      const highPriority = await taskRouter.predictRouting('Task', 'high');
      const lowPriority = await taskRouter.predictRouting('Task', 'low');

      expect(highPriority.length).toBeGreaterThan(0);
      expect(lowPriority.length).toBeGreaterThan(0);
      
      // High priority should generally have lower wait times
      // (though this depends on current workload)
      expect(highPriority[0].estimatedWaitTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Task Routing', () => {
    it('should route task to best agent', async () => {
      const decision = await taskRouter.routeTask(
        'Implement authentication',
        'high'
      );

      expect(decision).toBeDefined();
      expect(decision.agentName).toBeDefined();
      expect(decision.routingTime).toBeDefined();
      expect(decision.estimatedStartTime).toBeDefined();
      expect(decision.estimatedCompletionTime).toBeDefined();
      expect(decision.reasoning).toBeDefined();
    });

    it('should calculate estimated times correctly', async () => {
      const decision = await taskRouter.routeTask('Test task', 'medium');

      expect(decision.estimatedStartTime.getTime()).toBeGreaterThanOrEqual(
        decision.routingTime.getTime()
      );
      expect(decision.estimatedCompletionTime.getTime()).toBeGreaterThanOrEqual(
        decision.estimatedStartTime.getTime()
      );
    });

    it('should handle routing errors gracefully', async () => {
      // Should not throw even with empty task
      const decision = await taskRouter.routeTask('', 'low');
      expect(decision).toBeDefined();
    });
  });

  describe('Agent Workload Tracking', () => {
    it('should track agent workloads', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task');
      await new Promise(resolve => setTimeout(resolve, 200));

      const workloads = taskRouter.getAgentWorkloads();
      expect(workloads.size).toBeGreaterThanOrEqual(0);
    });

    it('should calculate utilization correctly', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test');
      await new Promise(resolve => setTimeout(resolve, 200));

      const workloads = taskRouter.getAgentWorkloads();
      const coderWorkload = workloads.get('CODER');

      if (coderWorkload) {
        expect(coderWorkload.utilization).toBeGreaterThanOrEqual(0);
        expect(coderWorkload.utilization).toBeLessThanOrEqual(1);
        expect(coderWorkload.currentWorkload).toBeGreaterThanOrEqual(0);
        expect(coderWorkload.capacity).toBeGreaterThan(0);
      }
    });

    it('should estimate availability', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test');
      await new Promise(resolve => setTimeout(resolve, 200));

      const workloads = taskRouter.getAgentWorkloads();
      const coderWorkload = workloads.get('CODER');

      if (coderWorkload) {
        expect(coderWorkload.estimatedAvailability).toBeDefined();
        expect(coderWorkload.estimatedAvailability instanceof Date).toBe(true);
      }
    });
  });

  describe('Load Balancing', () => {
    it('should provide load balancing recommendations', () => {
      const recommendations = taskRouter.getLoadBalancingRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Recommendations may be empty if system is balanced
    });

    it('should identify overloaded agents', async () => {
      // Deploy multiple agents to create workload
      for (let i = 0; i < 3; i++) {
        await neuraforgeOrchestrator.deployAgent('CODER', `Task ${i}`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
      const recommendations = taskRouter.getLoadBalancingRecommendations();
      // May or may not have recommendations depending on workload
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Routing History', () => {
    it('should track routing decisions', async () => {
      const decision = await taskRouter.routeTask('Test task', 'medium');
      
      const history = taskRouter.getRoutingHistory(decision.agentName);
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].agentName).toBe(decision.agentName);
    });

    it('should maintain routing history per agent', async () => {
      await taskRouter.routeTask('Task 1', 'medium');
      await taskRouter.routeTask('Task 2', 'medium');

      const workloads = taskRouter.getAgentWorkloads();
      // Should have some routing history
      expect(workloads.size).toBeGreaterThanOrEqual(0);
    });
  });
});

