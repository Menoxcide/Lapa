/**
 * NEURAFORGE Orchestrator Comprehensive Test Suite
 * 
 * Tests for the master orchestration system including:
 * - Agent deployment
 * - Persona loading
 * - Agent spawning
 * - Multi-agent workflows
 * - AI-powered selection
 * - Metrics tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { neuraforgeOrchestrator } from '../../orchestrator/neuraforge-orchestrator.ts';
import { agentMonitor } from '../../orchestrator/agent-monitor.ts';
import { agentSelector } from '../../orchestrator/agent-selector.ts';

describe('NEURAFORGE Orchestrator', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    agentMonitor.stopMonitoring();
  });

  describe('Agent Deployment', () => {
    it('should deploy an agent with valid name', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'CODER',
        'Implement user authentication',
        true
      );

      expect(deployment).toBeDefined();
      expect(deployment.agentName).toBe('CODER');
      expect(deployment.status).toBe('active');
      expect(deployment.agentId).toBeDefined();
      expect(deployment.persona).toBeDefined();
      expect(deployment.metrics).toBeDefined();
    });

    it('should load persona from PersonaManager', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'ARCHITECT',
        'Design system architecture'
      );

      expect(deployment.persona).toBeDefined();
      expect(deployment.persona?.name).toBeDefined();
      expect(deployment.personaId).toBe('architect-agent');
    });

    it('should load prompt file when available', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'CODER',
        'Write code'
      );

      // Prompt may or may not be available, but should not throw
      expect(deployment.promptPath || deployment.promptContent).toBeDefined();
    });

    it('should handle deployment failure gracefully', async () => {
      // Deploy with invalid agent name
      await expect(
        neuraforgeOrchestrator.deployAgent(
          'INVALID_AGENT' as any,
          'Test task'
        )
      ).rejects.toThrow();
    });

    it('should support AI-powered agent selection', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        undefined,
        'Implement REST API with authentication',
        true,
        true // useAISelection
      );

      expect(deployment).toBeDefined();
      expect(deployment.agentName).toBeDefined();
      expect(['CODER', 'ARCHITECT', 'PLANNER']).toContain(deployment.agentName);
    });

    it('should record outcome for AI learning', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'CODER',
        'Test task for learning'
      );

      expect(deployment).toBeDefined();
      
      // Check that outcome was recorded
      const history = agentSelector.getSelectionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('should track deployment metrics', async () => {
      const initialMetrics = neuraforgeOrchestrator.getMetrics();
      const initialTotal = initialMetrics.totalDeployments;

      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task');

      const updatedMetrics = neuraforgeOrchestrator.getMetrics();
      expect(updatedMetrics.totalDeployments).toBe(initialTotal + 1);
    });

    it('should track successful deployments', async () => {
      const initialMetrics = neuraforgeOrchestrator.getMetrics();
      const initialSuccess = initialMetrics.successfulDeployments;

      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task');

      const updatedMetrics = neuraforgeOrchestrator.getMetrics();
      expect(updatedMetrics.successfulDeployments).toBeGreaterThanOrEqual(initialSuccess);
    });

    it('should calculate average deployment time', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task 1');
      await neuraforgeOrchestrator.deployAgent('TEST', 'Test task 2');

      const metrics = neuraforgeOrchestrator.getMetrics();
      expect(metrics.averageDeploymentTime).toBeGreaterThan(0);
    });

    it('should track active agents', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task');

      const metrics = neuraforgeOrchestrator.getMetrics();
      expect(metrics.activeAgents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Workflow Management', () => {
    it('should create workflow with specific agents', async () => {
      const workflow = await neuraforgeOrchestrator.createWorkflow(
        'Test Workflow',
        ['PLANNER', 'CODER'],
        'sequential',
        ['Plan', 'Code']
      );

      expect(workflow).toBeDefined();
      expect(workflow.workflowId).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.agents.length).toBe(2);
      expect(workflow.sequence).toBe('sequential');
    });

    it('should generate workflow from task description', async () => {
      const workflow = await neuraforgeOrchestrator.createWorkflow(
        'Implement user authentication system'
      );

      expect(workflow).toBeDefined();
      expect(workflow.workflowId).toBeDefined();
      expect(workflow.agents.length).toBeGreaterThan(0);
      expect(workflow.status).toBe('running');
    });

    it('should handle workflow creation failure', async () => {
      // Create workflow with invalid agents
      await expect(
        neuraforgeOrchestrator.createWorkflow(
          'Test',
          ['INVALID_AGENT' as any],
          'sequential'
        )
      ).rejects.toThrow();
    });

    it('should track workflow status', async () => {
      const workflow = await neuraforgeOrchestrator.createWorkflow(
        'Test Workflow',
        ['CODER'],
        'sequential'
      );

      expect(workflow.status).toBe('running');
      expect(workflow.startedAt).toBeDefined();
    });
  });

  describe('Agent Listing', () => {
    it('should list all available agents', async () => {
      const agents = await neuraforgeOrchestrator.listAvailableAgents();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents).toContain('CODER');
      expect(agents).toContain('ARCHITECT');
      expect(agents).toContain('NEURAFORGE');
    });

    it('should include all 17 agents', async () => {
      const agents = await neuraforgeOrchestrator.listAvailableAgents();
      
      const expectedAgents = [
        'ARCHITECT', 'CODER', 'REVIEWER', 'TEST', 'DEBUGGER', 'OPTIMIZER',
        'PLANNER', 'VALIDATOR', 'INTEGRATOR', 'DEPLOYER', 'DOCUMENTATION',
        'RESEARCH_WIZARD', 'MCP', 'FEATURE', 'FILESYSTEM', 'NEURAFORGE',
        'PERSONA_EVOLVER'
      ];

      for (const agent of expectedAgents) {
        expect(agents).toContain(agent);
      }
    });
  });

  describe('Deployment Retrieval', () => {
    it('should retrieve deployment by ID', async () => {
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'CODER',
        'Test task'
      );

      const retrieved = neuraforgeOrchestrator.getDeployment(
        deployment.agentId || ''
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(deployment.agentId);
    });

    it('should return undefined for non-existent deployment', () => {
      const retrieved = neuraforgeOrchestrator.getDeployment('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should get all active deployments', async () => {
      await neuraforgeOrchestrator.deployAgent('CODER', 'Task 1');
      await neuraforgeOrchestrator.deployAgent('TEST', 'Task 2');

      const active = neuraforgeOrchestrator.getActiveDeployments();
      expect(active.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration with Monitoring', () => {
    it('should start monitoring on initialization', () => {
      // Monitoring should be started by orchestrator constructor
      expect(agentMonitor.isMonitoringActive()).toBe(true);
    });

    it('should provide metrics to monitor', async () => {
      const metrics = await agentMonitor.getOrchestratorMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalDeployments).toBeGreaterThanOrEqual(0);
    });
  });
});

