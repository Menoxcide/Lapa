"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const moe_router_ts_1 = require("../../agents/moe-router.ts");
(0, vitest_1.describe)('MoERouter', () => {
    let router;
    let mockAgents;
    beforeEach(() => {
        router = new moe_router_ts_1.MoERouter();
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
    (0, vitest_1.describe)('registerAgent', () => {
        (0, vitest_1.it)('should register an agent successfully', () => {
            const newAgent = {
                id: 'agent-4',
                type: 'planner',
                name: 'Task Planner',
                expertise: ['planning', 'decomposition'],
                workload: 0,
                capacity: 2
            };
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(3);
            router.registerAgent(newAgent);
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(4);
            (0, vitest_1.expect)(router.getAgentById('agent-4')).toEqual(newAgent);
        });
    });
    (0, vitest_1.describe)('unregisterAgent', () => {
        (0, vitest_1.it)('should unregister an agent successfully', () => {
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(3);
            router.unregisterAgent('agent-1');
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(2);
            (0, vitest_1.expect)(router.getAgentById('agent-1')).toBeUndefined();
        });
        (0, vitest_1.it)('should handle unregistering non-existent agent gracefully', () => {
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(3);
            router.unregisterAgent('non-existent-agent');
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(3);
        });
    });
    (0, vitest_1.describe)('updateAgentWorkload', () => {
        (0, vitest_1.it)('should update agent workload correctly', () => {
            const agent = router.getAgentById('agent-1');
            (0, vitest_1.expect)(agent?.workload).toBe(0);
            router.updateAgentWorkload('agent-1', 3);
            const updatedAgent = router.getAgentById('agent-1');
            (0, vitest_1.expect)(updatedAgent?.workload).toBe(3);
        });
        (0, vitest_1.it)('should not update workload for non-existent agent', () => {
            router.updateAgentWorkload('non-existent-agent', 5);
            // No exception should be thrown
        });
    });
    (0, vitest_1.describe)('routeTask', () => {
        (0, vitest_1.it)('should route task to the most appropriate agent based on expertise', () => {
            const task = {
                id: 'task-1',
                description: 'Fix a bug in the React component',
                type: 'bug_fix',
                priority: 1
            };
            const result = router.routeTask(task);
            (0, vitest_1.expect)(result.agent).toBeDefined();
            (0, vitest_1.expect)(result.confidence).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.confidence).toBeLessThanOrEqual(1);
            (0, vitest_1.expect)(result.reasoning).toBeDefined();
        });
        (0, vitest_1.it)('should route task to least loaded agent when all agents are at capacity', () => {
            // Set all agents to full capacity
            router.updateAgentWorkload('agent-1', 5); // Full capacity
            router.updateAgentWorkload('agent-2', 3); // Full capacity
            router.updateAgentWorkload('agent-3', 4); // Full capacity
            const task = {
                id: 'task-2',
                description: 'Create a new feature',
                type: 'feature_creation',
                priority: 1
            };
            const result = router.routeTask(task);
            (0, vitest_1.expect)(result.agent).toBeDefined();
            (0, vitest_1.expect)(result.confidence).toBe(0.3); // Confidence for overloaded agents
            (0, vitest_1.expect)(result.reasoning).toContain('least loaded agent');
        });
        (0, vitest_1.it)('should throw error when no agents are registered', () => {
            // Create a new router with no agents
            const emptyRouter = new moe_router_ts_1.MoERouter();
            const task = {
                id: 'task-3',
                description: 'Some task',
                type: 'general',
                priority: 1
            };
            (0, vitest_1.expect)(() => emptyRouter.routeTask(task)).toThrow('No agents registered with the router');
        });
        (0, vitest_1.it)('should calculate expertise match correctly', () => {
            const task = {
                id: 'task-4',
                description: 'Review javascript code for security vulnerabilities',
                type: 'code_review',
                priority: 2
            };
            const result = router.routeTask(task);
            (0, vitest_1.expect)(result.agent).toBeDefined();
            // The reviewer agent should be selected due to security expertise
            (0, vitest_1.expect)(result.agent.type).toBe('reviewer');
        });
    });
    (0, vitest_1.describe)('getAgents', () => {
        (0, vitest_1.it)('should return all registered agents', () => {
            const agents = router.getAgents();
            (0, vitest_1.expect)(agents).toHaveLength(3);
            (0, vitest_1.expect)(agents).toEqual(vitest_1.expect.arrayContaining(mockAgents));
        });
        (0, vitest_1.it)('should return a copy of agents array to prevent external modification', () => {
            const agents = router.getAgents();
            agents.pop(); // Modify the returned array
            // Original agents should remain unchanged
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(3);
        });
    });
    (0, vitest_1.describe)('getAgentById', () => {
        (0, vitest_1.it)('should return the correct agent by ID', () => {
            const agent = router.getAgentById('agent-2');
            (0, vitest_1.expect)(agent).toEqual(mockAgents[1]);
        });
        (0, vitest_1.it)('should return undefined for non-existent agent ID', () => {
            const agent = router.getAgentById('non-existent-id');
            (0, vitest_1.expect)(agent).toBeUndefined();
        });
    });
});
//# sourceMappingURL=moe-router.test.js.map