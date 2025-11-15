import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { AgentSpawningSystem, SpawnRequest, SpawnResult, AgentTemplate } from '../../swarm/agent.spawn.ts';
import { AgentType, Task } from '../../agents/moe-router.ts';
import { sendNIMInferenceRequest } from '../../inference/nim.local.ts';

// Mock the NIM inference module
vi.mock('../../inference/nim.local.ts', () => ({
  sendNIMInferenceRequest: vi.fn()
}));

describe('AgentSpawningSystem', () => {
  let spawningSystem: AgentSpawningSystem;
  let mockTask: Task;
  let mockContext: Record<string, any>;

  beforeEach(() => {
    spawningSystem = new AgentSpawningSystem();
    
    mockTask = {
      id: 'task-1',
      description: 'Implement a new feature',
      type: 'feature_creation',
      priority: 1
    };
    
    mockContext = {
      projectId: 'project-123',
      requirements: 'Create a user authentication system',
      technology: 'React with TypeScript',
      deadline: '2023-12-31'
    };

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default agent templates', () => {
      const templates = [
        'planner', 'coder', 'reviewer', 'debugger', 'optimizer', 'tester'
      ] as AgentType[];
      
      templates.forEach(templateType => {
        const template = spawningSystem.getAgentTemplate(templateType);
        expect(template).toBeDefined();
        expect(template?.type).toBe(templateType);
      });
    });
  });

  describe('spawnAgent', () => {
    it('should successfully spawn an agent with valid request', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.spawnTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should spawn agent without context when context is empty', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: {},
        priority: 'medium'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.summary).toBeUndefined(); // No summary when no context
    });

    it('should fail to spawn agent with invalid agent type', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'invalid-type' as AgentType,
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(false);
      expect(result.agentId).toBeUndefined();
      expect(result.error).toContain('No template found for agent type');
      expect(result.spawnTime).toBeGreaterThan(0);
    });

    it('should use custom maxTokens for context summarization', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        maxTokens: 500,
        priority: 'medium'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
    });

    it('should handle NIM summarization failure gracefully', async () => {
      // Mock NIM failure
      (sendNIMInferenceRequest as Mock).mockRejectedValue(new Error('NIM unavailable'));
      
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.summary).toBeDefined(); // Should fall back to simple summarization
    });

    it('should extract focus areas from task description', async () => {
      const codeTask: Task = {
        id: 'task-2',
        description: 'Fix bug in authentication code',
        type: 'bug_fix',
        priority: 2
      };
      
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'debugger',
        task: codeTask,
        context: mockContext,
        priority: 'high'
      };
      
      const result: SpawnResult = await spawningSystem.spawnAgent(request);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
    });
  });

  describe('getSpawnedAgent', () => {
    it('should retrieve a spawned agent by ID', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const spawnResult: SpawnResult = await spawningSystem.spawnAgent(request);
      const agent = spawningSystem.getSpawnedAgent(spawnResult.agentId!);
      
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(spawnResult.agentId);
      expect(agent?.type).toBe('coder');
    });

    it('should return undefined for non-existent agent ID', () => {
      const agent = spawningSystem.getSpawnedAgent('non-existent-id');
      expect(agent).toBeUndefined();
    });
  });

  describe('getAllSpawnedAgents', () => {
    it('should return all spawned agents', async () => {
      // Spawn multiple agents
      const request1: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const request2: SpawnRequest = {
        parentId: 'parent-2',
        agentType: 'reviewer',
        task: mockTask,
        context: mockContext,
        priority: 'low'
      };
      
      await spawningSystem.spawnAgent(request1);
      await spawningSystem.spawnAgent(request2);
      
      const agents = spawningSystem.getAllSpawnedAgents();
      expect(agents).toHaveLength(2);
      expect(agents.some(a => a.type === 'coder')).toBe(true);
      expect(agents.some(a => a.type === 'reviewer')).toBe(true);
    });

    it('should return empty array when no agents spawned', () => {
      const agents = spawningSystem.getAllSpawnedAgents();
      expect(agents).toHaveLength(0);
    });
  });

  describe('getSpawnedAgentsByType', () => {
    it('should return spawned agents of specific type', async () => {
      // Spawn multiple agents of different types
      const coderRequest: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const reviewerRequest: SpawnRequest = {
        parentId: 'parent-2',
        agentType: 'reviewer',
        task: mockTask,
        context: mockContext,
        priority: 'low'
      };
      
      await spawningSystem.spawnAgent(coderRequest);
      await spawningSystem.spawnAgent(reviewerRequest);
      await spawningSystem.spawnAgent(coderRequest); // Spawn another coder
      
      const coders = spawningSystem.getSpawnedAgentsByType('coder');
      const reviewers = spawningSystem.getSpawnedAgentsByType('reviewer');
      
      expect(coders).toHaveLength(2);
      expect(reviewers).toHaveLength(1);
      expect(coders.every(c => c.type === 'coder')).toBe(true);
      expect(reviewers.every(r => r.type === 'reviewer')).toBe(true);
    });

    it('should return empty array for type with no spawned agents', () => {
      const planners = spawningSystem.getSpawnedAgentsByType('planner');
      expect(planners).toHaveLength(0);
    });
  });

  describe('terminateAgent', () => {
    it('should successfully terminate a spawned agent', async () => {
      const request: SpawnRequest = {
        parentId: 'parent-1',
        agentType: 'coder',
        task: mockTask,
        context: mockContext,
        priority: 'medium'
      };
      
      const spawnResult: SpawnResult = await spawningSystem.spawnAgent(request);
      const result = spawningSystem.terminateAgent(spawnResult.agentId!);
      
      expect(result).toBe(true);
      expect(spawningSystem.getSpawnedAgent(spawnResult.agentId!)).toBeUndefined();
    });

    it('should fail to terminate non-existent agent', () => {
      const result = spawningSystem.terminateAgent('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getAgentTemplate', () => {
    it('should return agent template by type', () => {
      const template = spawningSystem.getAgentTemplate('coder');
      expect(template).toBeDefined();
      expect(template?.type).toBe('coder');
      expect(template?.namePattern).toBe('Coder-Agent-{id}');
      expect(template?.expertise).toContain('code-generation');
      expect(template?.capacity).toBe(10);
    });

    it('should return undefined for non-existent template', () => {
      const template = spawningSystem.getAgentTemplate('non-existent' as AgentType);
      expect(template).toBeUndefined();
    });
  });

  describe('addAgentTemplate', () => {
    it('should add a new agent template', () => {
      const newTemplate: AgentTemplate = {
        type: 'custom',
        namePattern: 'Custom-Agent-{id}',
        expertise: ['specialized-knowledge'],
        capacity: 3,
        description: 'Custom agent for specialized tasks'
      };
      
      spawningSystem.addAgentTemplate(newTemplate);
      const retrieved = spawningSystem.getAgentTemplate('custom');
      
      expect(retrieved).toEqual(newTemplate);
    });
  });

  describe('removeAgentTemplate', () => {
    it('should remove an existing agent template', () => {
      // First add a template to remove
      const newTemplate: AgentTemplate = {
        type: 'removable',
        namePattern: 'Removable-Agent-{id}',
        expertise: ['temporary'],
        capacity: 1,
        description: 'Temporary agent template'
      };
      
      spawningSystem.addAgentTemplate(newTemplate);
      expect(spawningSystem.getAgentTemplate('removable')).toBeDefined();
      
      const result = spawningSystem.removeAgentTemplate('removable');
      expect(result).toBe(true);
      expect(spawningSystem.getAgentTemplate('removable')).toBeUndefined();
    });

    it('should return false when removing non-existent template', () => {
      const result = spawningSystem.removeAgentTemplate('non-existent' as AgentType);
      expect(result).toBe(false);
    });
  });

  describe('private methods', () => {
    it('should generate unique agent IDs', () => {
      const generateIdMethod = (spawningSystem as any).generateAgentId;
      
      const id1 = generateIdMethod.call(spawningSystem, 'coder');
      const id2 = generateIdMethod.call(spawningSystem, 'coder');
      
      expect(id1).toContain('agent-coder');
      expect(id2).toContain('agent-coder');
      expect(id1).not.toBe(id2); // Should be unique
    });

    it('should extract focus areas from task and template', () => {
      const extractMethod = (spawningSystem as any).extractFocusAreas;
      
      const task: Task = {
        id: 'task-1',
        description: 'Fix bug in authentication code and optimize performance',
        type: 'bug_fix',
        priority: 1
      };
      
      const template: AgentTemplate = {
        type: 'debugger',
        namePattern: 'Debugger-Agent-{id}',
        expertise: ['bug-detection', 'troubleshooting'],
        capacity: 5,
        description: 'Debugging agent'
      };
      
      const focusAreas = extractMethod.call(spawningSystem, task, template);
      
      expect(focusAreas).toContain('bug-detection');
      expect(focusAreas).toContain('troubleshooting');
      expect(focusAreas).toContain('debugging');
      expect(focusAreas).toContain('optimization');
    });

    it('should create summary prompt with focus areas', () => {
      const createPromptMethod = (spawningSystem as any).createSummaryPrompt;
      
      const context = '{"key": "value"}';
      const options = {
        maxLength: 500,
        focusAreas: ['code-quality', 'performance']
      };
      
      const prompt = createPromptMethod.call(spawningSystem, context, options);
      
      expect(prompt).toContain('Summarize the following context');
      expect(prompt).toContain('Focus on these areas: code-quality, performance');
      expect(prompt).toContain('Limit your response to 500 characters');
      expect(prompt).toContain('{"key": "value"}');
    });

    it('should create summary prompt without focus areas', () => {
      const createPromptMethod = (spawningSystem as any).createSummaryPrompt;
      
      const context = '{"key": "value"}';
      const options = {
        maxLength: 500
      };
      
      const prompt = createPromptMethod.call(spawningSystem, context, options);
      
      expect(prompt).toContain('Summarize the following context');
      expect(prompt).toContain('Provide a general summary');
      expect(prompt).toContain('Limit your response to 500 characters');
    });

    it('should perform fallback summarization', () => {
      const fallbackMethod = (spawningSystem as any).fallbackSummarize;
      
      const context = `{
  "project": "Test Project",
  "requirements": "Implement authentication",
  "technology": "React",
  "deadline": "2023-12-31"
}`;
      
      const summary = fallbackMethod.call(spawningSystem, context, 100);
      
      expect(summary).toContain('Test Project');
      expect(summary).toContain('authentication');
      expect(summary).toContain('React');
    });
  });
});