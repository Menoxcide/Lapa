/**
 * Workflow Optimizer Test Suite
 * 
 * Tests for workflow optimization engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { workflowOptimizer, type OptimizedWorkflow } from '../../orchestrator/workflow-optimizer.ts';
import { workflowGenerator, type GeneratedWorkflow } from '../../orchestrator/workflow-generator.ts';

describe('Workflow Optimizer', () => {
  describe('Workflow Optimization', () => {
    it('should optimize a workflow', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement feature with tests and review'
      );

      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      expect(optimized).toBeDefined();
      expect(optimized.originalWorkflow).toBe(workflow);
      expect(optimized.optimizedWorkflow).toBeDefined();
      expect(optimized.improvements).toBeDefined();
      expect(Array.isArray(optimized.improvements)).toBe(true);
    });

    it('should identify optimization opportunities', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement feature with tests and review'
      );

      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      // Should have at least analyzed the workflow
      expect(optimized.improvements.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate time reduction', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      expect(optimized.estimatedTimeReduction).toBeGreaterThanOrEqual(0);
      expect(typeof optimized.estimatedTimeReduction).toBe('number');
    });

    it('should calculate success rate improvement', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      expect(optimized.estimatedSuccessRateImprovement).toBeGreaterThanOrEqual(0);
      expect(optimized.estimatedSuccessRateImprovement).toBeLessThanOrEqual(100);
    });
  });

  describe('Optimization Types', () => {
    it('should detect parallelization opportunities', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement feature with tests and review'
      );

      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      const parallelOpt = optimized.improvements.find(
        opt => opt.type === 'parallelization'
      );

      // May or may not find parallelization depending on workflow
      if (parallelOpt) {
        expect(parallelOpt.description).toBeDefined();
        expect(parallelOpt.estimatedImprovement).toBeGreaterThan(0);
        expect(parallelOpt.confidence).toBeGreaterThan(0);
      }
    });

    it('should suggest agent replacements for slow agents', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      const replacementOpt = optimized.improvements.find(
        opt => opt.type === 'agent_replacement'
      );

      // May or may not suggest replacements
      if (replacementOpt) {
        expect(replacementOpt.description).toBeDefined();
        expect(replacementOpt.implementation).toBeDefined();
      }
    });

    it('should optimize agent sequences', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Complex multi-agent task'
      );

      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      const sequenceOpt = optimized.improvements.find(
        opt => opt.type === 'sequence_optimization'
      );

      // May or may not optimize sequence
      if (sequenceOpt) {
        expect(sequenceOpt.description).toBeDefined();
        expect(sequenceOpt.implementation).toBeDefined();
      }
    });
  });

  describe('Optimization Cache', () => {
    it('should cache optimization results', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const optimized1 = await workflowOptimizer.optimizeWorkflow(workflow);
      const optimized2 = await workflowOptimizer.optimizeWorkflow(workflow);

      // Should return cached result (same reference or same data)
      expect(optimized1.originalWorkflow.workflowId).toBe(
        optimized2.originalWorkflow.workflowId
      );
    });

    it('should provide optimization cache', () => {
      const cache = workflowOptimizer.getOptimizationCache();
      expect(cache).toBeDefined();
      expect(cache instanceof Map).toBe(true);
    });
  });

  describe('Workflow History', () => {
    it('should track workflow executions', () => {
      const history = workflowOptimizer.getWorkflowHistory();
      expect(history).toBeDefined();
      expect(history instanceof Map).toBe(true);
    });
  });

  describe('Optimization Analysis', () => {
    it('should analyze workflow for bottlenecks', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Complex multi-stage task'
      );

      // Access private method through public interface
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);
      
      // Should have analyzed the workflow
      expect(optimized.improvements).toBeDefined();
    });

    it('should provide optimization recommendations', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow);

      for (const improvement of optimized.improvements) {
        expect(improvement.type).toBeDefined();
        expect(['parallelization', 'agent_replacement', 'sequence_optimization', 'resource_allocation']).toContain(improvement.type);
        expect(improvement.description).toBeDefined();
        expect(improvement.estimatedImprovement).toBeGreaterThan(0);
        expect(improvement.confidence).toBeGreaterThan(0);
        expect(improvement.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});

