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
(0, vitest_1.describe)('OpenAI Agent Integration', () => {
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
        // All mocks are automatically cleared in vitest
    });
    (0, vitest_1.describe)('OpenAI Agent Registration', () => {
        (0, vitest_1.it)('should register OpenAI agent successfully', () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Access private property through casting to verify registration
            const registeredAgents = handoffSystem.openAIAgents;
            (0, vitest_1.expect)(registeredAgents.size).toBe(1);
            (0, vitest_1.expect)(registeredAgents.get('Test OpenAI Agent')).toBe(mockOpenAIAgent);
        });
        (0, vitest_1.it)('should register multiple OpenAI agents', () => {
            const mockOpenAIAgent2 = {
                id: 'openai-agent-2',
                name: 'Test OpenAI Agent 2',
                instructions: 'Test instructions 2',
                tools: [],
                model: 'gpt-4'
            };
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent2);
            const registeredAgents = handoffSystem.openAIAgents;
            (0, vitest_1.expect)(registeredAgents.size).toBe(2);
            (0, vitest_1.expect)(registeredAgents.get('Test OpenAI Agent')).toBe(mockOpenAIAgent);
            (0, vitest_1.expect)(registeredAgents.get('Test OpenAI Agent 2')).toBe(mockOpenAIAgent2);
        });
        (0, vitest_1.it)('should overwrite existing agent when registering with same name', () => {
            const updatedMockAgent = {
                id: 'openai-agent-1-updated',
                name: 'Test OpenAI Agent',
                instructions: 'Updated instructions',
                tools: [],
                model: 'gpt-4-turbo'
            };
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            handoffSystem.registerOpenAIAgent(updatedMockAgent);
            const registeredAgents = handoffSystem.openAIAgents;
            (0, vitest_1.expect)(registeredAgents.size).toBe(1);
            (0, vitest_1.expect)(registeredAgents.get('Test OpenAI Agent')).toBe(updatedMockAgent);
        });
    });
    (0, vitest_1.describe)('OpenAI Agent Evaluation', () => {
        (0, vitest_1.it)('should evaluate handoff using registered OpenAI agent', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'specialized-agent-789',
                    confidence: 0.92,
                    reason: 'Task requires specialized knowledge in data analysis'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const testContext = {
                task: {
                    id: 'analysis-task-123',
                    description: 'Complex data analysis task',
                    input: 'Analyze quarterly sales data',
                    priority: 'high'
                },
                context: {
                    userData: { id: 'user-456', preferences: { timezone: 'EST' } },
                    history: [{ taskId: 'prev-task-789', result: 'data collected' }]
                }
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(true);
            (0, vitest_1.expect)(evaluation.targetAgentId).toBe('specialized-agent-789');
            (0, vitest_1.expect)(evaluation.confidence).toBe(0.92);
            (0, vitest_1.expect)(evaluation.reason).toBe('Task requires specialized knowledge in data analysis');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledWith(mockOpenAIAgent, vitest_1.expect.stringContaining('Evaluate this context for handoff'));
        });
        (0, vitest_1.it)('should handle evaluation with minimal response from OpenAI agent', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: false
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const testContext = {
                task: {
                    id: 'simple-task-123',
                    description: 'Simple task',
                    input: 'Basic processing',
                    priority: 'low'
                },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBe(0); // Default when not provided
            (0, vitest_1.expect)(evaluation.reason).toBe('No specific reason provided'); // Default when not provided
        });
        (0, vitest_1.it)('should handle malformed response from OpenAI agent gracefully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockEvaluationResult = {
                finalOutput: null // Malformed response
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const testContext = {
                task: {
                    id: 'task-123',
                    description: 'Test task',
                    input: 'Test input',
                    priority: 'medium'
                },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBe(0);
            (0, vitest_1.expect)(evaluation.reason).toBe('No specific reason provided');
        });
    });
    (0, vitest_1.describe)('OpenAI Agent Execution', () => {
        (0, vitest_1.it)('should execute task on OpenAI agent successfully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockExecutionResult = {
                finalOutput: {
                    result: 'Analysis completed successfully',
                    insights: ['Revenue increased by 15%', 'Customer satisfaction improved'],
                    nextSteps: 'Review quarterly report'
                }
            };
            agents_1.run.mockResolvedValue(mockExecutionResult);
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'analysis-task-456', {
                taskData: 'Quarterly sales data',
                parameters: { quarter: 'Q4', year: 2025 }
            });
            (0, vitest_1.expect)(result.result).toBe('Analysis completed successfully');
            (0, vitest_1.expect)(result.insights).toEqual(['Revenue increased by 15%', 'Customer satisfaction improved']);
            (0, vitest_1.expect)(result.nextSteps).toBe('Review quarterly report');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledWith(mockOpenAIAgent, vitest_1.expect.stringContaining('Process this task:'));
        });
        (0, vitest_1.it)('should handle execution with empty response from OpenAI agent', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockExecutionResult = {
                finalOutput: {} // Empty response
            };
            agents_1.run.mockResolvedValue(mockExecutionResult);
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(result).toEqual({});
        });
        (0, vitest_1.it)('should reject when OpenAI agent execution throws error', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            agents_1.run.mockRejectedValue(new Error('OpenAI API rate limit exceeded'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI API rate limit exceeded');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Edge Cases and Error Handling', () => {
        (0, vitest_1.it)('should handle evaluation when no OpenAI agents are registered', async () => {
            // Not registering any agents
            const testContext = {
                task: { id: 'task-123', description: 'Test task' },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBe(0.5);
            (0, vitest_1.expect)(evaluation.reason).toBe('No evaluator agent available');
        });
        (0, vitest_1.it)('should handle execution when target OpenAI agent is not found', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockExecutionResult = {
                finalOutput: { result: 'Task completed' }
            };
            agents_1.run.mockResolvedValue(mockExecutionResult);
            // Try to handoff to non-existent agent
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'NonExistent OpenAI Agent', 'task-456', { testData: 'sample context data' })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI agent NonExistent OpenAI Agent not found');
        });
        (0, vitest_1.it)('should handle evaluation when OpenAI agent throws error', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            agents_1.run.mockRejectedValue(new Error('Network connectivity issue'));
            const testContext = {
                task: { id: 'task-123', description: 'Test task' },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBe(0);
            (0, vitest_1.expect)(evaluation.reason).toBe('Evaluation error: Network connectivity issue');
        });
    });
});
//# sourceMappingURL=openai-agent.integration.spec.js.map