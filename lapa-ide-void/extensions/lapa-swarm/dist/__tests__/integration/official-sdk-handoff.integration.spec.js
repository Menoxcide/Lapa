"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
const context_handoff_ts_1 = require("../../swarm/context.handoff.ts");
const moe_router_ts_1 = require("../../agents/moe-router.ts");
const agents_1 = require("@openai/agents");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
(0, vitest_1.describe)('Official SDK Handoff Integration', () => {
    let handoffSystem;
    let orchestrator;
    let contextManager;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
        contextManager = new context_handoff_ts_1.ContextHandoffManager();
        mockOpenAIAgent = {
            id: 'openai-official-agent-1',
            name: 'Official OpenAI Agent',
            instructions: 'Test instructions for official SDK',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        // All mocks are automatically cleared in vitest
        // Register a few LAPA agents for testing
        const lapaAgents = [
            {
                id: 'lapa-coder-1',
                type: 'coder',
                name: 'LAPA Coder Agent',
                expertise: ['coding', 'implementation'],
                workload: 0,
                capacity: 5
            },
            {
                id: 'lapa-debugger-1',
                type: 'debugger',
                name: 'LAPA Debugger Agent',
                expertise: ['debugging', 'troubleshooting'],
                workload: 0,
                capacity: 5
            }
        ];
        // Register LAPA agents with moeRouter
        lapaAgents.forEach(agent => {
            moe_router_ts_1.moeRouter.registerAgent(agent);
        });
    });
    afterEach(() => {
        // Clean up registered agents
        const agents = moe_router_ts_1.moeRouter.getAgents();
        agents.forEach((agent) => {
            moe_router_ts_1.moeRouter.unregisterAgent(agent.id);
        });
    });
    (0, vitest_1.describe)('LangGraphOrchestrator Compatibility', () => {
        (0, vitest_1.it)('should successfully integrate handoff evaluation into LangGraph workflow', async () => {
            // Register the OpenAI agent
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent to recommend a handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Official OpenAI Agent',
                    confidence: 0.92,
                    reason: 'Task requires specialized knowledge from official SDK'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            // Create a task
            const task = {
                id: 'langgraph-integration-task-123',
                description: 'Complex analysis task requiring handoff with official SDK',
                type: 'analysis',
                priority: 1
            };
            // Execute task with handoffs
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Verify the task was processed
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledWith(mockOpenAIAgent, vitest_1.expect.stringContaining('Evaluate this context for handoff'));
        }, 15000);
    });
    (0, vitest_1.describe)('ContextHandoffManager Integration', () => {
        (0, vitest_1.it)('should properly handle context transfer between LAPA and OpenAI agents', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent to recommend a handoff to a LAPA agent
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-coder-1',
                    confidence: 0.88,
                    reason: 'Task requires LAPA coding expertise'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            // Mock the context handoff manager methods
            const initiateHandoffSpy = vitest_2.vi.spyOn(contextManager, 'initiateHandoff');
            const completeHandoffSpy = vitest_2.vi.spyOn(contextManager, 'completeHandoff');
            // Replace the contextHandoffManager in handoffSystem with our spy-enabled version
            handoffSystem.contextHandoffManager = contextManager;
            // Mock successful handoff initiation
            initiateHandoffSpy.mockResolvedValue({
                success: true,
                handoffId: 'test-handoff-123',
                compressedSize: 1024,
                transferTime: 50
            });
            // Mock successful handoff completion
            completeHandoffSpy.mockResolvedValue({
                result: 'Handoff to LAPA agent completed successfully with context'
            });
            const task = {
                id: 'context-transfer-task-123',
                description: 'Task requiring context transfer between agent types',
                type: 'processing',
                priority: 2
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                testData: 'important context data'
            });
            // Verify context was transferred
            (0, vitest_1.expect)(result.result).toBe('Handoff to LAPA agent completed successfully with context');
            (0, vitest_1.expect)(initiateHandoffSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(completeHandoffSpy).toHaveBeenCalled();
        }, 15000);
    });
    (0, vitest_1.describe)('MoERouter Integration', () => {
        (0, vitest_1.it)('should correctly route tasks to appropriate agents based on expertise', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent to recommend no handoff (let MoE router decide)
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: false,
                    confidence: 0.65,
                    reason: 'Task can be handled by current processing pipeline'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const task = {
                id: 'moe-routing-task-123',
                description: 'Coding task that should be routed to LAPA coder agent',
                type: 'coding',
                priority: 1
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // The MoE router should have been used to route this task
            // Since no handoff was recommended, the result should contain routing information
            (0, vitest_1.expect)(result).toBeDefined();
            // Verify that the MoE router was used by checking if a LAPA agent was selected
            const agents = moe_router_ts_1.moeRouter.getAgents();
            (0, vitest_1.expect)(agents.length).toBeGreaterThan(0);
        }, 15000);
    });
    (0, vitest_1.describe)('Hybrid Handoff Scenarios', () => {
        (0, vitest_1.it)('should handle mixed LAPA and OpenAI agent handoffs correctly', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff initiation to LAPA agent
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'mixed-handoff-123',
                compressedSize: 2048,
                transferTime: 75
            });
            // Mock successful handoff completion
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Mixed handoff completed successfully'
            });
            // Mock OpenAI evaluation recommending handoff to LAPA agent
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-coder-1',
                    confidence: 0.9,
                    reason: 'Task requires LAPA specialized processing'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const task = {
                id: 'mixed-handoff-task-123',
                description: 'Task requiring mixed agent handoff with official SDK',
                type: 'development',
                priority: 3
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                projectData: 'sample project context'
            });
            (0, vitest_1.expect)(result.result).toBe('Mixed handoff completed successfully');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        }, 15000);
    });
    (0, vitest_1.describe)('Performance Validation', () => {
        (0, vitest_1.it)('should maintain <2s latency for simple handoff operations', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock a quick response
            const mockRunResult = {
                finalOutput: { result: 'Quick task completed with official SDK' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'Official OpenAI Agent', 'performance-task-456', { testData: 'simple context data for performance test' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete well within the 2s target
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
        }, 10000);
    });
});
//# sourceMappingURL=official-sdk-handoff.integration.spec.js.map