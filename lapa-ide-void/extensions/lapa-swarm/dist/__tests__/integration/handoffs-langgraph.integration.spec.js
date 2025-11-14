"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const langgraph_orchestrator_js_1 = require("../../swarm/langgraph.orchestrator.js");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
// Import the mocked run function
const agents_1 = require("@openai/agents");
(0, vitest_1.describe)('Handoffs with LangGraph Integration', () => {
    let handoffSystem;
    let orchestrator;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        orchestrator = new langgraph_orchestrator_js_1.LangGraphOrchestrator('start');
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        vitest_2.vi.clearAllMocks();
        // Reset the run mock specifically
        agents_1.run.mockReset();
    });
    (0, vitest_1.describe)('Workflow Integration', () => {
        (0, vitest_1.it)('should integrate handoff evaluation into LangGraph workflow', async () => {
            // Register the OpenAI agent
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent to recommend a handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.92,
                    reason: 'Task requires specialized knowledge'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            // Create a task
            const task = {
                id: 'integration-task-123',
                description: 'Complex analysis task requiring handoff',
                type: 'analysis',
                priority: 3
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
        (0, vitest_1.it)('should handle workflow with multiple potential handoff points', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock alternating responses - first recommends handoff, second does not
            agents_1.run
                .mockResolvedValueOnce({
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.88,
                    reason: 'Initial analysis needed'
                }
            })
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Final processing completed by OpenAI agent'
                }
            });
            const task = {
                id: 'multi-stage-task-123',
                description: 'Multi-stage task with multiple handoff opportunities',
                type: 'processing',
                priority: 2
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                stage: 1,
                data: 'initial data'
            });
            // Should have called run twice - once for evaluation, once for execution
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(result).toBeDefined();
        }, 15000);
        (0, vitest_1.it)('should gracefully handle workflow when no handoff is recommended', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock response indicating no handoff needed
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: false,
                    confidence: 0.75,
                    reason: 'Task can be handled by current agent'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'no-handoff-task-123',
                description: 'Simple task that should not require handoff',
                type: 'simple',
                priority: 1
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should only call run once for evaluation
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(result).toBeDefined();
        }, 15000);
    });
    (0, vitest_1.describe)('Error Recovery in Workflow', () => {
        (0, vitest_1.it)('should recover from handoff evaluation errors', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock an error on the first call (evaluation), success on second (execution)
            agents_1.run
                .mockRejectedValueOnce(new Error('Evaluation service unavailable'))
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Task completed after evaluation error'
                }
            });
            const task = {
                id: 'error-recovery-task-123',
                description: 'Task that experiences evaluation error',
                type: 'error-recovery',
                priority: 2
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should have called run twice - once that failed, once that succeeded
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(result).toBeDefined();
        }, 15000);
        (0, vitest_1.it)('should handle OpenAI agent execution failures', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation recommending handoff, then execution failure
            agents_1.run
                .mockResolvedValueOnce({
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.9,
                    reason: 'Specialized processing required'
                }
            })
                .mockRejectedValueOnce(new Error('OpenAI service timeout'));
            const task = {
                id: 'execution-failure-task-123',
                description: 'Task that fails during OpenAI execution',
                type: 'execution-failure',
                priority: 3
            };
            await (0, vitest_1.expect)(handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI service timeout');
            // Should have called run twice - once for evaluation, once for execution
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2);
        }, 15000);
    });
    (0, vitest_1.describe)('Configuration Integration', () => {
        (0, vitest_1.it)('should respect confidence threshold in workflow decisions', async () => {
            // Create handoff system with higher confidence threshold
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ confidenceThreshold: 0.95 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation with confidence below threshold
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.90, // Below our 0.95 threshold
                    reason: 'Moderate complexity task'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'threshold-task-123',
                description: 'Task with confidence below threshold',
                type: 'threshold-check',
                priority: 2
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // The system should still process the task even with confidence below threshold
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1); // Only evaluation call
        }, 15000);
        (0, vitest_1.it)('should respect maximum handoff depth', async () => {
            // Create handoff system with limited depth
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ maxHandoffDepth: 1 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation that would trigger another handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.95,
                    reason: 'Recursive handoff scenario'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'depth-limit-task-123',
                description: 'Task that might trigger deep handoff recursion',
                type: 'depth-limit',
                priority: 3
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should process the task without infinite recursion
            (0, vitest_1.expect)(result).toBeDefined();
            // Verify that the system respects the depth limit (implementation dependent)
        }, 15000);
    });
});
//# sourceMappingURL=handoffs-langgraph.integration.spec.js.map