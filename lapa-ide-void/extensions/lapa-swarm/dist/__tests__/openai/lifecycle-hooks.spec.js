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
(0, vitest_1.describe)('OpenAI Handoff Lifecycle Hooks', () => {
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
        vitest_2.vi.useFakeTimers();
    });
    afterEach(() => {
        vitest_2.vi.useRealTimers();
    });
    (0, vitest_1.describe)('Hook Registration and Execution', () => {
        (0, vitest_1.it)('should execute onHandoffStart hook when OpenAI handoff begins', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'hook-test-task-456', { testData: 'context data for hook test' });
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'hook-test-task-456');
            // Complete hook should also be called
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'hook-test-task-456', vitest_1.expect.any(Number) // Duration
            );
            // Error hook should not be called
            (0, vitest_1.expect)(hooks.onHandoffError).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should execute onHandoffComplete hook with accurate timing information', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            agents_1.run.mockImplementation(async () => {
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 100));
                return mockRunResult;
            });
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'timing-test-task-456', { testData: 'context data for timing test' });
            const endTime = performance.now();
            const actualDuration = endTime - startTime;
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'timing-test-task-456', vitest_1.expect.closeTo(actualDuration, 100) // Allow 100ms tolerance for test environments
            );
            // Wait for any asynchronous operations
            await vitest_2.vi.waitFor(() => (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalled());
        });
        (0, vitest_1.it)('should execute onHandoffError hook when OpenAI handoff fails', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const errorMessage = 'OpenAI API authentication failed';
            agents_1.run.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'error-hook-test-task-456', { testData: 'context data for error hook test' })).rejects.toThrow(`Failed to handoff to OpenAI agent: ${errorMessage}`);
            // Start hook should be called
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'error-hook-test-task-456');
            // Error hook should be called with proper error
            (0, vitest_1.expect)(hooks.onHandoffError).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'error-hook-test-task-456', vitest_1.expect.any(Error));
            const errorArg = hooks.onHandoffError.mock.calls[0][3];
            (0, vitest_1.expect)(errorArg.message).toBe(`Failed to handoff to OpenAI agent: ${errorMessage}`);
            // Complete hook should not be called
            (0, vitest_1.expect)(hooks.onHandoffComplete).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Hook Error Handling', () => {
        (0, vitest_1.it)('should continue OpenAI handoff execution even if onHandoffStart hook throws', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(() => {
                    throw new Error('Hook start error');
                }),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Spy on console.error to verify hook error is logged
            const consoleErrorSpy = vitest_2.vi.spyOn(console, 'error').mockImplementation(() => { });
            const mockRunResult = {
                finalOutput: { result: 'Task completed despite hook error' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'hook-error-test-task-456', { testData: 'context data for hook error test' });
            (0, vitest_1.expect)(result.result).toBe('Task completed despite hook error');
            // Hook should have been called
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'hook-error-test-task-456');
            // Complete hook should still be called
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'hook-error-test-task-456', vitest_1.expect.any(Number));
            // Error hook should not be called for hook errors
            (0, vitest_1.expect)(hooks.onHandoffError).not.toHaveBeenCalled();
            // Hook error should be logged
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith('Error in onHandoffStart hook:', vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
        (0, vitest_1.it)('should continue OpenAI handoff execution even if onHandoffComplete hook throws', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(() => {
                    throw new Error('Hook complete error');
                }),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Spy on console.error to verify hook error is logged
            const consoleErrorSpy = vitest_2.vi.spyOn(console, 'error').mockImplementation(() => { });
            const mockRunResult = {
                finalOutput: { result: 'Task completed despite complete hook error' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'complete-hook-error-test-task-456', { testData: 'context data for complete hook error test' });
            (0, vitest_1.expect)(result.result).toBe('Task completed despite complete hook error');
            // Start hook should be called
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'complete-hook-error-test-task-456');
            // Complete hook should have been called
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'complete-hook-error-test-task-456', vitest_1.expect.any(Number));
            // Error hook should not be called for hook errors
            (0, vitest_1.expect)(hooks.onHandoffError).not.toHaveBeenCalled();
            // Hook error should be logged
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith('Error in onHandoffComplete hook:', vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
        (0, vitest_1.it)('should handle errors in onHandoffError hook without affecting error reporting', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn(() => {
                    throw new Error('Hook error handler error');
                })
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Spy on console.error to verify hook error is logged
            const consoleErrorSpy = vitest_2.vi.spyOn(console, 'error').mockImplementation(() => { });
            const errorMessage = 'OpenAI service unavailable';
            agents_1.run.mockRejectedValue(new Error(errorMessage));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'error-handler-error-test-task-456', { testData: 'context data for error handler error test' })).rejects.toThrow(`Failed to handoff to OpenAI agent: ${errorMessage}`);
            // Start hook should be called
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'error-handler-error-test-task-456');
            // Error hook should have been called
            (0, vitest_1.expect)(hooks.onHandoffError).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'error-handler-error-test-task-456', vitest_1.expect.any(Error));
            // Complete hook should not be called
            (0, vitest_1.expect)(hooks.onHandoffComplete).not.toHaveBeenCalled();
            // Hook error should be logged
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith('Error in onHandoffError hook:', vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('Hook Timing and Order', () => {
        (0, vitest_1.it)('should execute hooks in correct order during successful OpenAI handoff', async () => {
            const executionOrder = [];
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(() => {
                    executionOrder.push('start');
                }),
                onHandoffComplete: vitest_2.vi.fn(() => {
                    executionOrder.push('complete');
                }),
                onHandoffError: vitest_2.vi.fn(() => {
                    executionOrder.push('error');
                })
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'order-test-task-456', { testData: 'context data for order test' });
            // Should execute start then complete, not error
            (0, vitest_1.expect)(executionOrder).toEqual(['start', 'complete']);
        });
        (0, vitest_1.it)('should execute hooks in correct order during failed OpenAI handoff', async () => {
            const executionOrder = [];
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(() => {
                    executionOrder.push('start');
                }),
                onHandoffComplete: vitest_2.vi.fn(() => {
                    executionOrder.push('complete');
                }),
                onHandoffError: vitest_2.vi.fn(() => {
                    executionOrder.push('error');
                })
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            agents_1.run.mockRejectedValue(new Error('OpenAI API error'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'error-order-test-task-456', { testData: 'context data for error order test' })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI API error');
            // Should execute start then error, not complete
            (0, vitest_1.expect)(executionOrder).toEqual(['start', 'error']);
        });
        (0, vitest_1.it)('should execute hooks with correct parameters for complex handoff scenarios', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: {
                    result: 'Complex task completed',
                    metadata: {
                        taskId: 'complex-task-789',
                        agentChain: ['agent-1', 'Test OpenAI Agent', 'agent-3'],
                        processingSteps: 5
                    }
                }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const complexContext = {
                userData: { id: 'user-456', preferences: { theme: 'dark' } },
                taskData: {
                    id: 'complex-task-789',
                    description: 'Multi-step processing task',
                    priority: 'high',
                    dependencies: ['task-123', 'task-456']
                },
                processingHistory: [
                    { agent: 'agent-1', timestamp: Date.now() - 1000, result: 'data-collected' }
                ]
            };
            await handoffSystem.initiateHandoff('agent-1', 'Test OpenAI Agent', 'complex-task-789', complexContext);
            // Verify start hook parameters
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('agent-1', 'Test OpenAI Agent', 'complex-task-789');
            // Verify complete hook parameters
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('agent-1', 'Test OpenAI Agent', 'complex-task-789', vitest_1.expect.any(Number) // Duration
            );
            // Error hook should not be called
            (0, vitest_1.expect)(hooks.onHandoffError).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Hook Integration with Retry Logic', () => {
        (0, vitest_1.it)('should execute hooks appropriately during OpenAI handoff retries', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure retry settings
            handoffSystem.retryConfig = {
                maxRetries: 3,
                retryDelayMs: 50,
                exponentialBackoff: false
            };
            // Fail twice, then succeed
            agents_1.run
                .mockRejectedValueOnce(new Error('First attempt failed'))
                .mockRejectedValueOnce(new Error('Second attempt failed'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed on third attempt' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'retry-hook-test-task-456', { testData: 'context data for retry hook test' });
            (0, vitest_1.expect)(result.result).toBe('Task completed on third attempt');
            // Start hook should be called once
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'retry-hook-test-task-456');
            // Error hook should be called for each failure attempt
            (0, vitest_1.expect)(hooks.onHandoffError).toHaveBeenCalledTimes(2);
            // Complete hook should be called once (for final success)
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'retry-hook-test-task-456', vitest_1.expect.any(Number));
        });
        (0, vitest_1.it)('should execute error hook for each failed OpenAI attempt', async () => {
            const errorHookCalls = [];
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn((source, target, taskId, error) => {
                    errorHookCalls.push({ source, target, taskId, error: error.message });
                })
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure retry settings
            handoffSystem.retryConfig = {
                maxRetries: 3,
                retryDelayMs: 25,
                exponentialBackoff: true
            };
            // Fail all attempts
            agents_1.run
                .mockRejectedValueOnce(new Error('Attempt 1: Network error'))
                .mockRejectedValueOnce(new Error('Attempt 2: Timeout'))
                .mockRejectedValueOnce(new Error('Attempt 3: Service unavailable'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'all-fail-hook-test-task-456', { testData: 'context data for all fail hook test' })).rejects.toThrow('Failed to handoff to OpenAI agent: Attempt 3: Service unavailable');
            // Start hook should be called once
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledTimes(1);
            // Error hook should be called for each failure
            (0, vitest_1.expect)(hooks.onHandoffError).toHaveBeenCalledTimes(3);
            // Verify error hook calls have correct information
            (0, vitest_1.expect)(errorHookCalls).toEqual([
                {
                    source: 'source-agent-123',
                    target: 'Test OpenAI Agent',
                    taskId: 'all-fail-hook-test-task-456',
                    error: 'Failed to handoff to OpenAI agent: Attempt 1: Network error'
                },
                {
                    source: 'source-agent-123',
                    target: 'Test OpenAI Agent',
                    taskId: 'all-fail-hook-test-task-456',
                    error: 'Failed to handoff to OpenAI agent: Attempt 2: Timeout'
                },
                {
                    source: 'source-agent-123',
                    target: 'Test OpenAI Agent',
                    taskId: 'all-fail-hook-test-task-456',
                    error: 'Failed to handoff to OpenAI agent: Attempt 3: Service unavailable'
                }
            ]);
            // Complete hook should not be called
            (0, vitest_1.expect)(hooks.onHandoffComplete).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=lifecycle-hooks.spec.js.map