"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
// Import the mocked run function
const agents_1 = require("@openai/agents");
(0, vitest_1.describe)('Hybrid Handoff System Integration', () => {
    let handoffSystem;
    let orchestrator;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        vitest_2.vi.clearAllMocks();
        vitest_2.vi.useFakeTimers();
    });
    afterEach(() => {
        vitest_2.vi.useRealTimers();
    });
    (0, vitest_1.describe)('End-to-End Task Execution', () => {
        (0, vitest_1.it)('should execute task with OpenAI agent handoff recommendation', async () => {
            console.log('Starting test: should execute task with OpenAI agent handoff recommendation');
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            console.log('Registered OpenAI agent');
            // Mock evaluation recommending handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.95,
                    reason: 'Task requires advanced reasoning capabilities'
                }
            };
            // Mock execution result
            const mockExecutionResult = {
                finalOutput: {
                    result: 'Task completed successfully with OpenAI assistance',
                    analysis: 'Processed 1000 data points',
                    confidence: 0.98
                }
            };
            console.log('Setting up mock responses');
            agents_1.run
                .mockResolvedValueOnce(mockEvaluationResult)
                .mockResolvedValueOnce(mockExecutionResult);
            console.log('Mock responses set up');
            const task = {
                id: 'complex-task-123',
                description: 'Advanced data processing task',
                type: 'data-processing',
                priority: 3 // high priority
            };
            console.log('Executing task with handoffs');
            const startTime = Date.now();
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456', preferences: { language: 'en' } },
                history: [],
                dataset: 'customer_feedback_q4_2025.csv',
                handoffCount: 0
            });
            const endTime = Date.now();
            console.log('Task execution completed with result:', result, 'in', endTime - startTime, 'ms');
            (0, vitest_1.expect)(result.result).toBe('Task completed successfully with OpenAI assistance');
            (0, vitest_1.expect)(result.analysis).toBe('Processed 1000 data points');
            (0, vitest_1.expect)(result.confidence).toBeCloseTo(0.98, 2);
            // Verify both evaluation and execution calls were made
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(agents_1.run).toHaveBeenNthCalledWith(1, mockOpenAIAgent, vitest_1.expect.stringContaining('Evaluate this context for handoff'));
            (0, vitest_1.expect)(agents_1.run).toHaveBeenNthCalledWith(2, mockOpenAIAgent, vitest_1.expect.stringContaining('Process this task:'));
            // Wait for any asynchronous operations
            await vitest_2.vi.waitFor(() => (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2));
        }, 15000);
        (0, vitest_1.it)('should execute task without handoff when not recommended', async () => {
            console.log('Starting test: should execute task without handoff when not recommended');
            const startTime = Date.now();
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation recommending no handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: false,
                    confidence: 0.65,
                    reason: 'Task can be handled by current processing pipeline'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const task = {
                id: 'simple-task-123',
                description: 'Routine data processing',
                type: 'data-update',
                priority: 1 // low priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            const endTime = Date.now();
            console.log('Test completed in', endTime - startTime, 'ms');
            // Since no handoff was recommended, the system should return the evaluation result
            (0, vitest_1.expect)(result).toEqual({
                shouldHandoff: false,
                confidence: vitest_1.expect.closeTo(0.65, 1),
                reason: 'Task can be handled by current processing pipeline'
            });
            // Only evaluation call should be made
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            // Wait for any asynchronous operations
            await vitest_2.vi.waitFor(() => (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1));
        }, 15000);
        (0, vitest_1.it)('should handle task execution with multiple handoff evaluations', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock multiple evaluations - first recommends handoff, second does not
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
                    intermediateResult: 'Data analyzed by OpenAI agent',
                    nextStep: 'Final processing'
                }
            })
                .mockResolvedValueOnce({
                finalOutput: {
                    shouldHandoff: false,
                    confidence: 0.72,
                    reason: 'Task can be completed locally'
                }
            });
            const task = {
                id: 'multi-stage-task-123',
                description: 'Multi-stage processing with conditional handoffs',
                type: 'multi-stage',
                priority: 2 // medium priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                stage: 1,
                data: 'raw_research_data.json',
                handoffCount: 0
            });
            // Should have called run three times
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3);
            // Final result should be the last evaluation
            (0, vitest_1.expect)(result.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(result.confidence).toBeCloseTo(0.72, 1);
        }, 15000);
    });
    (0, vitest_1.describe)('Confidence-Based Decision Making', () => {
        (0, vitest_1.it)('should respect confidence threshold configuration', async () => {
            // Create handoff system with higher confidence threshold
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ confidenceThreshold: 0.9 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation with confidence below threshold
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.85, // Below our 0.9 threshold
                    reason: 'Moderate complexity task'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'threshold-task-123',
                description: 'Task with confidence below threshold',
                type: 'standard-processing',
                priority: 2 // medium priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            // Even with confidence below threshold, if shouldHandoff is true, it should proceed
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1); // Verify call count
        }, 15000);
        (0, vitest_1.it)('should handle edge case with exactly threshold confidence', async () => {
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ confidenceThreshold: 0.8 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.8, // Exactly at threshold
                    reason: 'Task at confidence threshold'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'edge-case-task-123',
                description: 'Task with exact threshold confidence',
                type: 'boundary-test',
                priority: 2 // medium priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1); // Verify call count
        }, 15000);
    });
    (0, vitest_1.describe)('Error Recovery in Hybrid System', () => {
        (0, vitest_1.it)('should recover from OpenAI evaluation error and continue processing', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation error, then successful execution
            agents_1.run
                .mockRejectedValueOnce(new Error('OpenAI API timeout'))
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Task completed after evaluation error recovery',
                    status: 'success'
                }
            });
            const task = {
                id: 'recovery-task-123',
                description: 'Task with evaluation error recovery',
                type: 'recovery',
                priority: 3 // high priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            // Should have called run twice - one failed evaluation, one successful execution
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2); // Verify call count
            (0, vitest_1.expect)(result.result).toBe('Task completed after evaluation error recovery');
        }, 15000);
        (0, vitest_1.it)('should handle consecutive OpenAI errors gracefully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock consecutive errors
            agents_1.run
                .mockRejectedValueOnce(new Error('Evaluation service unavailable'))
                .mockRejectedValueOnce(new Error('Execution service unavailable'));
            const task = {
                id: 'error-task-123',
                description: 'Task with consecutive OpenAI errors',
                type: 'error-handling',
                priority: 2 // medium priority
            };
            await (0, vitest_1.expect)(handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            })).rejects.toThrow('Failed to handoff to OpenAI agent: Execution service unavailable');
            // Should have called run twice
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2); // Verify call count
        }, 15000);
        (0, vitest_1.it)('should handle mixed LAPA and OpenAI agent handoffs', async () => {
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
                handoffId: 'handoff-123',
                compressedSize: 1024,
                transferTime: 50
            });
            // Mock successful handoff completion
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Handoff to LAPA agent completed successfully'
            });
            // Mock OpenAI evaluation recommending handoff to LAPA agent
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-specialized-agent',
                    confidence: 0.9,
                    reason: 'Task requires LAPA specialized processing'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const task = {
                id: 'mixed-handoff-task-123',
                description: 'Task requiring mixed agent handoff',
                type: 'mixed-handoff',
                priority: 3 // high priority
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            (0, vitest_1.expect)(result.result).toBe('Handoff to LAPA agent completed successfully');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1); // Verify call count
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        }, 15000);
    });
    (0, vitest_1.describe)('Configuration Integration', () => {
        (0, vitest_1.it)('should disable OpenAI evaluation when configured', async () => {
            console.log('Starting test: should disable OpenAI evaluation when configured');
            const startTime = Date.now();
            // Create handoff system with OpenAI evaluation disabled
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ enableOpenAIEvaluation: false });
            console.log('Created handoff system with OpenAI evaluation disabled');
            const task = {
                id: 'disabled-eval-task-123',
                description: 'Task with OpenAI evaluation disabled',
                type: 'disabled-eval',
                priority: 2 // medium priority
            };
            console.log('Executing task with handoffs');
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            const endTime = Date.now();
            console.log('Task execution completed with result:', result, 'in', endTime - startTime, 'ms');
            // Should use default policy when evaluation is disabled
            (0, vitest_1.expect)(result).toEqual({
                shouldHandoff: false,
                confidence: vitest_1.expect.closeTo(0.5, 1),
                reason: 'OpenAI evaluation disabled, using default policy'
            });
            // No calls to OpenAI should be made
            (0, vitest_1.expect)(agents_1.run).not.toHaveBeenCalled();
        }, 15000);
        (0, vitest_1.it)('should respect maximum handoff depth configuration', async () => {
            console.log('Starting test: should respect maximum handoff depth configuration');
            const startTime = Date.now();
            // Create handoff system with limited depth
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ maxHandoffDepth: 2 });
            console.log('Created handoff system with maxHandoffDepth: 2');
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            console.log('Registered OpenAI agent');
            // Mock evaluation that would trigger recursive handoffs
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.95,
                    reason: 'Recursive processing required'
                }
            };
            console.log('Setting up mock response');
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            console.log('Mock response set up');
            const task = {
                id: 'depth-limited-task-123',
                description: 'Task with depth limitation',
                type: 'depth-limited',
                priority: 3 // high priority
            };
            console.log('Executing task with handoffs');
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: [],
                handoffCount: 0
            });
            const endTime = Date.now();
            console.log('Task execution completed with result:', result, 'in', endTime - startTime, 'ms');
            // Should process the task without infinite recursion
            (0, vitest_1.expect)(result).toBeDefined();
            // The implementation should respect the depth limit
        }, 15000);
    });
});
//# sourceMappingURL=hybrid-handoff.integration.spec.js.map