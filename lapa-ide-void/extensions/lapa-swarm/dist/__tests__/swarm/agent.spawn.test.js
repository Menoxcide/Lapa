"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const agent_spawn_ts_1 = require("../../swarm/agent.spawn.ts");
const nim_local_ts_1 = require("../../inference/nim.local.ts");
// Mock the NIM inference module
vitest_1.vi.mock('../../inference/nim.local.ts', () => ({
    sendNIMInferenceRequest: vitest_1.vi.fn()
}));
(0, vitest_1.describe)('AgentSpawningSystem', () => {
    let spawningSystem;
    let mockTask;
    let mockContext;
    (0, vitest_1.beforeEach)(() => {
        spawningSystem = new agent_spawn_ts_1.AgentSpawningSystem();
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
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default agent templates', () => {
            const templates = [
                'planner', 'coder', 'reviewer', 'debugger', 'optimizer', 'tester'
            ];
            templates.forEach(templateType => {
                const template = spawningSystem.getAgentTemplate(templateType);
                (0, vitest_1.expect)(template).toBeDefined();
                (0, vitest_1.expect)(template?.type).toBe(templateType);
            });
        });
    });
    (0, vitest_1.describe)('spawnAgent', () => {
        (0, vitest_1.it)('should successfully spawn an agent with valid request', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBeDefined();
            (0, vitest_1.expect)(result.summary).toBeDefined();
            (0, vitest_1.expect)(result.spawnTime).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.error).toBeUndefined();
        });
        (0, vitest_1.it)('should spawn agent without context when context is empty', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: {},
                priority: 'medium'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBeDefined();
            (0, vitest_1.expect)(result.summary).toBeUndefined(); // No summary when no context
        });
        (0, vitest_1.it)('should fail to spawn agent with invalid agent type', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'invalid-type',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.agentId).toBeUndefined();
            (0, vitest_1.expect)(result.error).toContain('No template found for agent type');
            (0, vitest_1.expect)(result.spawnTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should use custom maxTokens for context summarization', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                maxTokens: 500,
                priority: 'medium'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBeDefined();
        });
        (0, vitest_1.it)('should handle NIM summarization failure gracefully', async () => {
            // Mock NIM failure
            nim_local_ts_1.sendNIMInferenceRequest.mockRejectedValue(new Error('NIM unavailable'));
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBeDefined();
            (0, vitest_1.expect)(result.summary).toBeDefined(); // Should fall back to simple summarization
        });
        (0, vitest_1.it)('should extract focus areas from task description', async () => {
            const codeTask = {
                id: 'task-2',
                description: 'Fix bug in authentication code',
                type: 'bug_fix',
                priority: 2
            };
            const request = {
                parentId: 'parent-1',
                agentType: 'debugger',
                task: codeTask,
                context: mockContext,
                priority: 'high'
            };
            const result = await spawningSystem.spawnAgent(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getSpawnedAgent', () => {
        (0, vitest_1.it)('should retrieve a spawned agent by ID', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const spawnResult = await spawningSystem.spawnAgent(request);
            const agent = spawningSystem.getSpawnedAgent(spawnResult.agentId);
            (0, vitest_1.expect)(agent).toBeDefined();
            (0, vitest_1.expect)(agent?.id).toBe(spawnResult.agentId);
            (0, vitest_1.expect)(agent?.type).toBe('coder');
        });
        (0, vitest_1.it)('should return undefined for non-existent agent ID', () => {
            const agent = spawningSystem.getSpawnedAgent('non-existent-id');
            (0, vitest_1.expect)(agent).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getAllSpawnedAgents', () => {
        (0, vitest_1.it)('should return all spawned agents', async () => {
            // Spawn multiple agents
            const request1 = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const request2 = {
                parentId: 'parent-2',
                agentType: 'reviewer',
                task: mockTask,
                context: mockContext,
                priority: 'low'
            };
            await spawningSystem.spawnAgent(request1);
            await spawningSystem.spawnAgent(request2);
            const agents = spawningSystem.getAllSpawnedAgents();
            (0, vitest_1.expect)(agents).toHaveLength(2);
            (0, vitest_1.expect)(agents.some(a => a.type === 'coder')).toBe(true);
            (0, vitest_1.expect)(agents.some(a => a.type === 'reviewer')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array when no agents spawned', () => {
            const agents = spawningSystem.getAllSpawnedAgents();
            (0, vitest_1.expect)(agents).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('getSpawnedAgentsByType', () => {
        (0, vitest_1.it)('should return spawned agents of specific type', async () => {
            // Spawn multiple agents of different types
            const coderRequest = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const reviewerRequest = {
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
            (0, vitest_1.expect)(coders).toHaveLength(2);
            (0, vitest_1.expect)(reviewers).toHaveLength(1);
            (0, vitest_1.expect)(coders.every(c => c.type === 'coder')).toBe(true);
            (0, vitest_1.expect)(reviewers.every(r => r.type === 'reviewer')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array for type with no spawned agents', () => {
            const planners = spawningSystem.getSpawnedAgentsByType('planner');
            (0, vitest_1.expect)(planners).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('terminateAgent', () => {
        (0, vitest_1.it)('should successfully terminate a spawned agent', async () => {
            const request = {
                parentId: 'parent-1',
                agentType: 'coder',
                task: mockTask,
                context: mockContext,
                priority: 'medium'
            };
            const spawnResult = await spawningSystem.spawnAgent(request);
            const result = spawningSystem.terminateAgent(spawnResult.agentId);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(spawningSystem.getSpawnedAgent(spawnResult.agentId)).toBeUndefined();
        });
        (0, vitest_1.it)('should fail to terminate non-existent agent', () => {
            const result = spawningSystem.terminateAgent('non-existent-id');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('getAgentTemplate', () => {
        (0, vitest_1.it)('should return agent template by type', () => {
            const template = spawningSystem.getAgentTemplate('coder');
            (0, vitest_1.expect)(template).toBeDefined();
            (0, vitest_1.expect)(template?.type).toBe('coder');
            (0, vitest_1.expect)(template?.namePattern).toBe('Coder-Agent-{id}');
            (0, vitest_1.expect)(template?.expertise).toContain('code-generation');
            (0, vitest_1.expect)(template?.capacity).toBe(10);
        });
        (0, vitest_1.it)('should return undefined for non-existent template', () => {
            const template = spawningSystem.getAgentTemplate('non-existent');
            (0, vitest_1.expect)(template).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('addAgentTemplate', () => {
        (0, vitest_1.it)('should add a new agent template', () => {
            const newTemplate = {
                type: 'custom',
                namePattern: 'Custom-Agent-{id}',
                expertise: ['specialized-knowledge'],
                capacity: 3,
                description: 'Custom agent for specialized tasks'
            };
            spawningSystem.addAgentTemplate(newTemplate);
            const retrieved = spawningSystem.getAgentTemplate('custom');
            (0, vitest_1.expect)(retrieved).toEqual(newTemplate);
        });
    });
    (0, vitest_1.describe)('removeAgentTemplate', () => {
        (0, vitest_1.it)('should remove an existing agent template', () => {
            // First add a template to remove
            const newTemplate = {
                type: 'removable',
                namePattern: 'Removable-Agent-{id}',
                expertise: ['temporary'],
                capacity: 1,
                description: 'Temporary agent template'
            };
            spawningSystem.addAgentTemplate(newTemplate);
            (0, vitest_1.expect)(spawningSystem.getAgentTemplate('removable')).toBeDefined();
            const result = spawningSystem.removeAgentTemplate('removable');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(spawningSystem.getAgentTemplate('removable')).toBeUndefined();
        });
        (0, vitest_1.it)('should return false when removing non-existent template', () => {
            const result = spawningSystem.removeAgentTemplate('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('private methods', () => {
        (0, vitest_1.it)('should generate unique agent IDs', () => {
            const generateIdMethod = spawningSystem.generateAgentId;
            const id1 = generateIdMethod.call(spawningSystem, 'coder');
            const id2 = generateIdMethod.call(spawningSystem, 'coder');
            (0, vitest_1.expect)(id1).toContain('agent-coder');
            (0, vitest_1.expect)(id2).toContain('agent-coder');
            (0, vitest_1.expect)(id1).not.toBe(id2); // Should be unique
        });
        (0, vitest_1.it)('should extract focus areas from task and template', () => {
            const extractMethod = spawningSystem.extractFocusAreas;
            const task = {
                id: 'task-1',
                description: 'Fix bug in authentication code and optimize performance',
                type: 'bug_fix',
                priority: 1
            };
            const template = {
                type: 'debugger',
                namePattern: 'Debugger-Agent-{id}',
                expertise: ['bug-detection', 'troubleshooting'],
                capacity: 5,
                description: 'Debugging agent'
            };
            const focusAreas = extractMethod.call(spawningSystem, task, template);
            (0, vitest_1.expect)(focusAreas).toContain('bug-detection');
            (0, vitest_1.expect)(focusAreas).toContain('troubleshooting');
            (0, vitest_1.expect)(focusAreas).toContain('debugging');
            (0, vitest_1.expect)(focusAreas).toContain('optimization');
        });
        (0, vitest_1.it)('should create summary prompt with focus areas', () => {
            const createPromptMethod = spawningSystem.createSummaryPrompt;
            const context = '{"key": "value"}';
            const options = {
                maxLength: 500,
                focusAreas: ['code-quality', 'performance']
            };
            const prompt = createPromptMethod.call(spawningSystem, context, options);
            (0, vitest_1.expect)(prompt).toContain('Summarize the following context');
            (0, vitest_1.expect)(prompt).toContain('Focus on these areas: code-quality, performance');
            (0, vitest_1.expect)(prompt).toContain('Limit your response to 500 characters');
            (0, vitest_1.expect)(prompt).toContain('{"key": "value"}');
        });
        (0, vitest_1.it)('should create summary prompt without focus areas', () => {
            const createPromptMethod = spawningSystem.createSummaryPrompt;
            const context = '{"key": "value"}';
            const options = {
                maxLength: 500
            };
            const prompt = createPromptMethod.call(spawningSystem, context, options);
            (0, vitest_1.expect)(prompt).toContain('Summarize the following context');
            (0, vitest_1.expect)(prompt).toContain('Provide a general summary');
            (0, vitest_1.expect)(prompt).toContain('Limit your response to 500 characters');
        });
        (0, vitest_1.it)('should perform fallback summarization', () => {
            const fallbackMethod = spawningSystem.fallbackSummarize;
            const context = `{
  "project": "Test Project",
  "requirements": "Implement authentication",
  "technology": "React",
  "deadline": "2023-12-31"
}`;
            const summary = fallbackMethod.call(spawningSystem, context, 100);
            (0, vitest_1.expect)(summary).toContain('Test Project');
            (0, vitest_1.expect)(summary).toContain('authentication');
            (0, vitest_1.expect)(summary).toContain('React');
        });
    });
});
//# sourceMappingURL=agent.spawn.test.js.map