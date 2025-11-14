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
(0, vitest_1.describe)('OpenAI Handoff Error Handling', () => {
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
    (0, vitest_1.describe)('Retry Logic Validation', () => {
        (0, vitest_1.it)('should retry failed OpenAI handoff with exponential backoff', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure custom retry settings for testing
            handoffSystem.retryConfig = {
                maxRetries: 3,
                retryDelayMs: 50,
                exponentialBackoff: true
            };
            // Fail twice, then succeed
            agents_1.run
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockRejectedValueOnce(new Error('Service unavailable'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed on third attempt' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'retry-task-456', { testData: 'context data with retries' });
            (0, vitest_1.expect)(result.result).toBe('Task completed on third attempt');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3);
        });
        (0, vitest_1.it)('should retry failed OpenAI handoff with linear backoff', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure custom retry settings for testing
            handoffSystem.retryConfig = {
                maxRetries: 3,
                retryDelayMs: 100,
                exponentialBackoff: false // Linear backoff
            };
            // Fail twice, then succeed
            agents_1.run
                .mockRejectedValueOnce(new Error('Rate limit exceeded'))
                .mockRejectedValueOnce(new Error('API quota exceeded'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed with linear backoff' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'linear-retry-task-456', { testData: 'context data with linear retries' });
            (0, vitest_1.expect)(result.result).toBe('Task completed with linear backoff');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(4); // 1 initial attempt + 3 retries = 4 total calls
        });
        (0, vitest_1.it)('should fail after max retries exceeded with OpenAI errors', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure retry settings
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: 50,
                exponentialBackoff: true
            };
            // Always fail
            agents_1.run.mockRejectedValue(new Error('Persistent OpenAI API error'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'fail-task-456', { testData: 'context data that always fails' })).rejects.toThrow('Failed to handoff to OpenAI agent: Persistent OpenAI API error');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3); // 1 initial attempt + 2 retries = 3 total calls
        });
        (0, vitest_1.it)('should respect retry delay configuration', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure custom retry delay
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: 200,
                exponentialBackoff: false
            };
            // Fail once, then succeed
            agents_1.run
                .mockRejectedValueOnce(new Error('Temporary error'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed after delay' }
            });
            const startTime = Date.now();
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'delay-task-456', { testData: 'context data with delay' });
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, vitest_1.expect)(result.result).toBe('Task completed after delay');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3); // 1 initial attempt + 2 retries = 3 total calls
            // Should have waited at least the retry delay
            (0, vitest_1.expect)(duration).toBeGreaterThanOrEqual(200);
        }, 15000);
    });
    (0, vitest_1.describe)('Failure Recovery Scenarios', () => {
        (0, vitest_1.it)('should recover from transient OpenAI API errors', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock transient errors followed by success
            agents_1.run
                .mockRejectedValueOnce(new Error('Connection reset by peer'))
                .mockRejectedValueOnce(new Error('Timeout reading response'))
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Recovered from transient errors',
                    recoveryInfo: 'Successfully processed after 2 retries'
                }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'transient-error-task-456', { testData: 'context data with transient errors' });
            (0, vitest_1.expect)(result.result).toBe('Recovered from transient errors');
            (0, vitest_1.expect)(result.recoveryInfo).toBe('Successfully processed after 2 retries');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(4); // 1 initial attempt + 3 retries = 4 total calls
        });
        (0, vitest_1.it)('should handle different types of OpenAI API errors appropriately', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Test various error types
            const errorTypes = [
                new Error('429 Too Many Requests'),
                new Error('503 Service Unavailable'),
                new Error('500 Internal Server Error'),
                new Error('ETIMEDOUT')
            ];
            let callCount = 0;
            agents_1.run.mockImplementation(() => {
                if (callCount < errorTypes.length) {
                    return Promise.reject(errorTypes[callCount++]);
                }
                return Promise.resolve({
                    finalOutput: { result: 'Successfully recovered from all error types' }
                });
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'multi-error-task-456', { testData: 'context data with multiple error types' });
            (0, vitest_1.expect)(result.result).toBe('Successfully recovered from all error types');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(errorTypes.length + 1); // All error types + 1 success = 5 total calls
        });
        (0, vitest_1.it)('should gracefully handle malformed OpenAI responses', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock malformed responses followed by valid response
            agents_1.run
                .mockResolvedValueOnce({}) // Missing finalOutput
                .mockResolvedValueOnce({ finalOutput: null }) // Null finalOutput
                .mockResolvedValueOnce({ finalOutput: {} }) // Empty finalOutput
                .mockResolvedValueOnce({
                finalOutput: { result: 'Valid response after malformed ones' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'malformed-response-task-456', { testData: 'context data with malformed responses' });
            (0, vitest_1.expect)(result.result).toBe('Valid response after malformed ones');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(5); // 4 malformed responses + 1 valid response = 5 total calls
        });
        (0, vitest_1.it)('should handle OpenAI agent not found errors', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Since we're handing off to a non-existent agent, it will go through the LAPA agent path
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff initiation
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'handoff-123',
                compressedSize: 1024,
                transferTime: 50
            });
            // Mock successful handoff completion
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Handoff completed successfully to non-existent OpenAI agent'
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'NonExistent OpenAI Agent', 'not-found-task-456', { testData: 'context data for non-existent agent' });
            (0, vitest_1.expect)(result.result).toBe('Handoff completed successfully to non-existent OpenAI agent');
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Error Propagation and Logging', () => {
        (0, vitest_1.it)('should propagate OpenAI API errors with context information', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock API error with specific message
            agents_1.run.mockRejectedValue(new Error('Invalid API key provided'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'api-error-task-456', { testData: 'context data with API error' })).rejects.toThrow('Failed to handoff to OpenAI agent: Invalid API key provided');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should log errors appropriately during OpenAI handoff failures', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Spy on console.error
            const consoleErrorSpy = vitest_2.vi.spyOn(console, 'error').mockImplementation(() => { });
            // Mock API error
            agents_1.run.mockRejectedValue(new Error('OpenAI service overloaded'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'logging-error-task-456', { testData: 'context data with logging' })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI service overloaded');
            // Check that error was logged
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith('Handoff to OpenAI agent Test OpenAI Agent failed:', vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
        (0, vitest_1.it)('should handle non-Error objects thrown by OpenAI SDK', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock throwing a string instead of an Error object
            agents_1.run.mockRejectedValue('String error from OpenAI SDK');
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'string-error-task-456', { testData: 'context data with string error' })).rejects.toThrow('Failed to handoff to OpenAI agent: String error from OpenAI SDK');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Edge Case Error Handling', () => {
        (0, vitest_1.it)('should handle retry configuration edge cases', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Test with zero retries
            handoffSystem.retryConfig = {
                maxRetries: 0,
                retryDelayMs: 100,
                exponentialBackoff: false
            };
            agents_1.run.mockRejectedValue(new Error('Immediate failure with zero retries'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'zero-retry-task-456', { testData: 'context data with zero retries' })).rejects.toThrow('Failed to handoff to OpenAI agent: Immediate failure with zero retries');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1); // 1 initial attempt + 0 retries = 1 total call
        });
        (0, vitest_1.it)('should handle negative retry delay configuration', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Test with negative retry delay
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: -100, // Negative delay
                exponentialBackoff: false
            };
            agents_1.run
                .mockRejectedValueOnce(new Error('First failure'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Completed despite negative delay' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'negative-delay-task-456', { testData: 'context data with negative delay' });
            (0, vitest_1.expect)(result.result).toBe('Completed despite negative delay');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3); // 1 initial attempt + 2 retries = 3 total calls
        });
        (0, vitest_1.it)('should handle extremely high retry counts without stack overflow', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Test with high retry count but fail early
            handoffSystem.retryConfig = {
                maxRetries: 100,
                retryDelayMs: 1,
                exponentialBackoff: false
            };
            // Fail first few times then succeed
            let callCount = 0;
            agents_1.run.mockImplementation(() => {
                callCount++;
                if (callCount <= 5) {
                    return Promise.reject(new Error(`Failure ${callCount}`));
                }
                return Promise.resolve({
                    finalOutput: { result: 'Completed after 5 failures' }
                });
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'high-retry-task-456', { testData: 'context data with high retries' });
            (0, vitest_1.expect)(result.result).toBe('Completed after 5 failures');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(6); // 5 failures + 1 success = 6 total calls
        }, 15000); // Longer timeout for high retry test
    });
});
//# sourceMappingURL=error-handling.spec.js.map