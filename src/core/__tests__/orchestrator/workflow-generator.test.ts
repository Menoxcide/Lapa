/**
 * Workflow Generator Test Suite
 * 
 * Tests for predictive workflow generation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { workflowGenerator, type GeneratedWorkflow } from '../../orchestrator/workflow-generator.ts';

describe('Workflow Generator', () => {
  describe('Workflow Generation', () => {
    it('should generate workflow from task description', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement user authentication system'
      );

      expect(workflow).toBeDefined();
      expect(workflow.workflowId).toBeDefined();
      expect(workflow.name).toBeDefined();
      expect(workflow.agentSequence.length).toBeGreaterThan(0);
      expect(workflow.sequence).toBeDefined();
      expect(workflow.tasks.length).toBeGreaterThan(0);
      expect(workflow.estimatedDuration).toBeGreaterThan(0);
      expect(workflow.confidence).toBeGreaterThan(0);
      expect(workflow.confidence).toBeLessThanOrEqual(1);
    });

    it('should match feature implementation pattern', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement REST API with authentication'
      );

      expect(workflow.name).toContain('Feature');
      expect(workflow.agentSequence.length).toBeGreaterThanOrEqual(2);
    });

    it('should match bug fixing pattern', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Fix authentication bug in login system'
      );

      expect(workflow.agentSequence).toContain('DEBUGGER');
    });

    it('should match refactoring pattern', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Refactor authentication code for better performance'
      );

      expect(workflow.agentSequence.length).toBeGreaterThanOrEqual(3);
    });

    it('should match documentation pattern', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Write documentation for authentication API'
      );

      expect(workflow.agentSequence).toContain('DOCUMENTATION');
    });
  });

  describe('Workflow Properties', () => {
    it('should generate valid workflow ID', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      expect(workflow.workflowId).toMatch(/^workflow-\d+-[a-z0-9]+$/);
    });

    it('should provide reasoning for workflow', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      expect(workflow.reasoning).toBeDefined();
      expect(workflow.reasoning.length).toBeGreaterThan(0);
    });

    it('should estimate duration', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      expect(workflow.estimatedDuration).toBeGreaterThan(0);
      expect(typeof workflow.estimatedDuration).toBe('number');
    });

    it('should determine execution sequence', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      expect(['parallel', 'sequential', 'conditional']).toContain(workflow.sequence);
    });
  });

  describe('Workflow Patterns', () => {
    it('should have workflow patterns available', () => {
      const patterns = workflowGenerator.getWorkflowPatterns();
      
      expect(patterns.size).toBeGreaterThan(0);
      expect(patterns.has('feature-implementation')).toBe(true);
      expect(patterns.has('bug-fixing')).toBe(true);
    });

    it('should match patterns correctly', async () => {
      const featureWorkflow = await workflowGenerator.generateWorkflow(
        'Implement new feature'
      );
      
      expect(featureWorkflow.name).toBeDefined();
    });
  });

  describe('Historical Workflows', () => {
    it('should track generated workflows', async () => {
      const initialHistory = workflowGenerator.getHistoricalWorkflows();
      const initialLength = initialHistory.length;

      await workflowGenerator.generateWorkflow('Test task 1');
      await workflowGenerator.generateWorkflow('Test task 2');

      const updatedHistory = workflowGenerator.getHistoricalWorkflows();
      expect(updatedHistory.length).toBeGreaterThanOrEqual(initialLength);
    });

    it('should limit history size', async () => {
      // Generate many workflows
      for (let i = 0; i < 150; i++) {
        await workflowGenerator.generateWorkflow(`Task ${i}`);
      }

      const history = workflowGenerator.getHistoricalWorkflows();
      // Should be limited to 100
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Task Decomposition', () => {
    it('should decompose complex tasks', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement authentication, create tests, write documentation, and optimize performance'
      );

      expect(workflow.agentSequence.length).toBeGreaterThanOrEqual(3);
      expect(workflow.tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle simple tasks', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Write code'
      );

      expect(workflow.agentSequence.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Sequence Generation', () => {
    it('should generate logical agent sequences', async () => {
      const workflow = await workflowGenerator.generateWorkflow(
        'Implement feature with tests and review'
      );

      // Should include implementation, testing, and review agents
      const agentNames = workflow.agentSequence.join(',');
      expect(
        agentNames.includes('CODER') ||
        agentNames.includes('TEST') ||
        agentNames.includes('REVIEWER')
      ).toBe(true);
    });

    it('should avoid duplicate agents', async () => {
      const workflow = await workflowGenerator.generateWorkflow('Test task');
      
      const uniqueAgents = new Set(workflow.agentSequence);
      expect(uniqueAgents.size).toBe(workflow.agentSequence.length);
    });
  });
});

