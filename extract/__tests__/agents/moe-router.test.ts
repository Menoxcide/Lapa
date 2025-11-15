import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MoERouter, Agent, Task } from '../../agents/moe-router.ts';

// Mock event bus if used
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

describe('MoERouter', () => {
  let router: MoERouter;
  let mockAgents: Agent[];

  beforeEach(() => {
    router = new MoERouter();
    mockAgents = [
      {
        id: 'agent-1',
        type: 'coder',
        name: 'Code Generator',
        expertise: ['javascript', 'typescript', 'react'],
        workload: 0,
        capacity: 5
      },
      {
        id: 'agent-2',
        type: 'reviewer',
        name: 'Code Reviewer',
        expertise: ['code-review', 'best-practices', 'security'],
        workload: 0,
        capacity: 3
      },
      {
        id: 'agent-3',
        type: 'debugger',
        name: 'Bug Fixer',
        expertise: ['debugging', 'troubleshooting', 'error-analysis'],
        workload: 0,
        capacity: 4
      }
    ];

    // Register mock agents
    mockAgents.forEach(agent => router.registerAgent(agent));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('should register an agent successfully', async () => {
      const newAgent: Agent = {
        id: 'agent-4',
        type: 'planner',
        name: 'Task Planner',
        expertise: ['planning', 'decomposition'],
        workload: 0,
        capacity: 2
      };

      expect(router.getAgents()).toHaveLength(3);
      expect(router.getAgents().length).toBeGreaterThan(0);
      expect(router.getAgents().length).toBeLessThan(10);

      router.registerAgent(newAgent);
      
      expect(router.getAgents()).toHaveLength(4);
      expect(router.getAgents().length).toBeGreaterThan(3);
      expect(router.getAgentById('agent-4')).toEqual(newAgent);
      expect(router.getAgentById('agent-4')?.id).toBe('agent-4');
      expect(router.getAgentById('agent-4')?.type).toBe('planner');
    });

    it('should handle duplicate agent registration', async () => {
      const duplicateAgent: Agent = {
        id: 'agent-1', // Already exists
        type: 'coder',
        name: 'Duplicate',
        expertise: ['javascript'],
        workload: 0,
        capacity: 5
      };

      const initialCount = router.getAgents().length;
      router.registerAgent(duplicateAgent);
      expect(router.getAgents().length).toBeGreaterThanOrEqual(initialCount);
      expect(router.getAgentById('agent-1')).toBeDefined();
    });

    it('should handle invalid agent data', async () => {
      const invalidAgent = null as any;
      expect(() => router.registerAgent(invalidAgent)).toThrow();
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister an agent successfully', () => {
      expect(router.getAgents()).toHaveLength(3);
      router.unregisterAgent('agent-1');
      expect(router.getAgents()).toHaveLength(2);
      expect(router.getAgentById('agent-1')).toBeUndefined();
    });

    it('should handle unregistering non-existent agent gracefully', () => {
      expect(router.getAgents()).toHaveLength(3);
      router.unregisterAgent('non-existent-agent');
      expect(router.getAgents()).toHaveLength(3);
    });
  });

  describe('updateAgentWorkload', () => {
    it('should update agent workload correctly', () => {
      const agent = router.getAgentById('agent-1');
      expect(agent?.workload).toBe(0);

      router.updateAgentWorkload('agent-1', 3);
      const updatedAgent = router.getAgentById('agent-1');
      expect(updatedAgent?.workload).toBe(3);
    });

    it('should not update workload for non-existent agent', () => {
      router.updateAgentWorkload('non-existent-agent', 5);
      // No exception should be thrown
    });
  });

  describe('routeTask', () => {
    it('should route task to the most appropriate agent based on expertise', async () => {
      const task: Task = {
        id: 'task-1',
        description: 'Fix a bug in the React component',
        type: 'bug_fix',
        priority: 1
      };

      const result = await Promise.resolve(router.routeTask(task));
      
      expect(result).toBeDefined();
      expect(result.agent).toBeDefined();
      expect(result.agent.id).toBeDefined();
      expect(result.agent.type).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should route task to least loaded agent when all agents are at capacity', () => {
      // Set all agents to full capacity
      router.updateAgentWorkload('agent-1', 5); // Full capacity
      router.updateAgentWorkload('agent-2', 3); // Full capacity
      router.updateAgentWorkload('agent-3', 4); // Full capacity

      const task: Task = {
        id: 'task-2',
        description: 'Create a new feature',
        type: 'feature_creation',
        priority: 1
      };

      const result = router.routeTask(task);
      expect(result.agent).toBeDefined();
      expect(result.confidence).toBe(0.3); // Confidence for overloaded agents
      expect(result.reasoning).toContain('least loaded agent');
    });

    it('should throw error when no agents are registered', async () => {
      // Create a new router with no agents
      const emptyRouter = new MoERouter();
      
      const task: Task = {
        id: 'task-3',
        description: 'Some task',
        type: 'general',
        priority: 1
      };

      await expect(Promise.resolve(emptyRouter.routeTask(task))).rejects.toThrow('No agents registered with the router');
      expect(() => emptyRouter.routeTask(task)).toThrow();
      expect(() => emptyRouter.routeTask(task)).toThrow('No agents registered');
    });

    it('should handle null task gracefully', async () => {
      await expect(Promise.resolve(router.routeTask(null as any))).rejects.toThrow();
      expect(() => router.routeTask(null as any)).toThrow();
    });

    it('should handle undefined task gracefully', async () => {
      await expect(Promise.resolve(router.routeTask(undefined as any))).rejects.toThrow();
      expect(() => router.routeTask(undefined as any)).toThrow();
    });

    it('should handle task with missing fields', async () => {
      const invalidTask = { id: 'task-invalid' } as any;
      await expect(Promise.resolve(router.routeTask(invalidTask))).rejects.toThrow();
    });

    it('should calculate expertise match correctly', () => {
      const task: Task = {
        id: 'task-4',
        description: 'Review javascript code for security vulnerabilities',
        type: 'code_review',
        priority: 2
      };

      const result = router.routeTask(task);
      expect(result.agent).toBeDefined();
      // The reviewer agent should be selected due to security expertise
      expect(result.agent.type).toBe('reviewer');
    });
  });

  describe('getAgents', () => {
    it('should return all registered agents', () => {
      const agents = router.getAgents();
      expect(agents).toHaveLength(3);
      expect(agents).toEqual(expect.arrayContaining(mockAgents));
    });

    it('should return a copy of agents array to prevent external modification', () => {
      const agents = router.getAgents();
      agents.pop(); // Modify the returned array
      
      // Original agents should remain unchanged
      expect(router.getAgents()).toHaveLength(3);
    });
  });

  describe('getAgentById', () => {
    it('should return the correct agent by ID', () => {
      const agent = router.getAgentById('agent-2');
      expect(agent).toEqual(mockAgents[1]);
    });

    it('should return undefined for non-existent agent ID', () => {
      const agent = router.getAgentById('non-existent-id');
      expect(agent).toBeUndefined();
    });
  });
});