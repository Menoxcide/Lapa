import { MoERouter } from '../../src/agents/moe-router';
describe('MoERouter', () => {
    let router;
    let mockAgents;
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
    describe('registerAgent', () => {
        it('should register an agent successfully', () => {
            const newAgent = {
                id: 'agent-4',
                type: 'planner',
                name: 'Task Planner',
                expertise: ['planning', 'decomposition'],
                workload: 0,
                capacity: 2
            };
            expect(router.getAgents()).toHaveLength(3);
            router.registerAgent(newAgent);
            expect(router.getAgents()).toHaveLength(4);
            expect(router.getAgentById('agent-4')).toEqual(newAgent);
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
        it('should route task to the most appropriate agent based on expertise', () => {
            const task = {
                id: 'task-1',
                description: 'Fix a bug in the React component',
                type: 'bug_fix',
                priority: 1
            };
            const result = router.routeTask(task);
            expect(result.agent).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(result.reasoning).toBeDefined();
        });
        it('should route task to least loaded agent when all agents are at capacity', () => {
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
            expect(result.agent).toBeDefined();
            expect(result.confidence).toBe(0.3); // Confidence for overloaded agents
            expect(result.reasoning).toContain('least loaded agent');
        });
        it('should throw error when no agents are registered', () => {
            // Create a new router with no agents
            const emptyRouter = new MoERouter();
            const task = {
                id: 'task-3',
                description: 'Some task',
                type: 'general',
                priority: 1
            };
            expect(() => emptyRouter.routeTask(task)).toThrow('No agents registered with the router');
        });
        it('should calculate expertise match correctly', () => {
            const task = {
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
//# sourceMappingURL=moe-router.test.js.map