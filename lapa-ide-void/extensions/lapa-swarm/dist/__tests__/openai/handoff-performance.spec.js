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
(0, vitest_1.describe)('OpenAI Handoff Performance', () => {
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
    (0, vitest_1.describe)('Latency Validation', () => {
        (0, vitest_1.it)('should complete OpenAI handoff within 2s target for simple tasks', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock a quick response
            const mockRunResult = {
                finalOutput: { result: 'Quick task completed by OpenAI' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'simple context data for OpenAI' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete well within the 2s target
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
        }, 10000); // 10 second timeout for the test
        (0, vitest_1.it)('should maintain <2s latency under moderate OpenAI API load', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock responses with slight delays to simulate API latency
            agents_1.run.mockImplementation(async () => {
                // Simulate typical OpenAI API response time
                await new Promise(resolve => setTimeout(resolve, 150));
                return {
                    finalOutput: { result: 'Task completed under moderate OpenAI load' }
                };
            });
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'moderate context data for OpenAI' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should stay under 2s even with API latency
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
        }, 10000);
        (0, vitest_1.it)('should track OpenAI handoff duration accurately', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock a response with known delay
            agents_1.run.mockImplementation(async () => {
                // Simulate a specific delay
                await new Promise(resolve => setTimeout(resolve, 200));
                return {
                    finalOutput: { result: 'OpenAI task completed' }
                };
            });
            // Spy on console.log to capture timing messages
            const consoleLogSpy = vitest_2.vi.spyOn(console, 'log').mockImplementation(() => { });
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'timed context data for OpenAI' });
            // Check that timing information was logged
            (0, vitest_1.expect)(consoleLogSpy).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/Handoff from .* to .* completed in .*ms/));
            // Verify warning when latency target is exceeded
            const consoleWarnSpy = vitest_2.vi.spyOn(console, 'warn').mockImplementation(() => { });
            // Configure a very short latency target for testing
            handoffSystem.updateConfig({ latencyTargetMs: 100 });
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'slow context data for OpenAI' });
            (0, vitest_1.expect)(consoleWarnSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Handoff latency target exceeded'));
            consoleLogSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        }, 10000);
        (0, vitest_1.it)('should meet latency target for batch OpenAI handoffs', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock quick responses for batch processing
            agents_1.run.mockResolvedValue({
                finalOutput: { result: 'Batch task completed by OpenAI' }
            });
            // Test with 3 concurrent handoffs (smaller batch for unit test)
            const handoffPromises = [];
            const handoffCount = 3;
            const startTime = performance.now();
            for (let i = 0; i < handoffCount; i++) {
                handoffPromises.push(handoffSystem.initiateHandoff(`source-agent-${i}`, 'Test OpenAI Agent', `task-${i}`, { testData: `batch context data ${i} for OpenAI` }));
            }
            // Wait for all handoffs to complete
            const results = await Promise.all(handoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            (0, vitest_1.expect)(results).toHaveLength(handoffCount);
            // Should complete within reasonable time
            (0, vitest_1.expect)(totalTime).toBeLessThan(3000); // 3 seconds for 3 concurrent handoffs
            // Verify all calls were made
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(handoffCount);
        }, 15000); // 15 second timeout for concurrent test
    });
    (0, vitest_1.describe)('High-Load Performance', () => {
        (0, vitest_1.it)('should handle burst of OpenAI handoffs without significant latency degradation', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock responses with realistic delays
            agents_1.run.mockImplementation(async () => {
                // Simulate variable API response times
                const delay = 50 + Math.random() * 200;
                await new Promise(resolve => setTimeout(resolve, delay));
                return {
                    finalOutput: { result: 'Burst task completed by OpenAI' }
                };
            });
            // Create burst of handoffs
            const burstSize = 8;
            const handoffPromises = [];
            const startTime = performance.now();
            for (let i = 0; i < burstSize; i++) {
                handoffPromises.push(handoffSystem.initiateHandoff(`source-agent-${i}`, 'Test OpenAI Agent', `burst-task-${i}`, { testData: `burst context data ${i} for OpenAI` }));
            }
            // Wait for all handoffs to complete
            const results = await Promise.all(handoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            (0, vitest_1.expect)(results).toHaveLength(burstSize);
            // Average time per handoff should remain reasonable
            const averageTime = totalTime / burstSize;
            (0, vitest_1.expect)(averageTime).toBeLessThan(500); // Average < 500ms per handoff
            // Total time should be reasonable for burst processing
            (0, vitest_1.expect)(totalTime).toBeLessThan(8000); // 8 seconds for 8 concurrent handoffs
            // Verify all calls were made
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(burstSize);
        }, 20000); // 20 second timeout for burst test
        (0, vitest_1.it)('should maintain consistent performance with varying payload sizes', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock quick responses
            agents_1.run.mockResolvedValue({
                finalOutput: { result: 'Variable payload task completed by OpenAI' }
            });
            // Test with different context sizes
            const testCases = [
                { size: 'small', context: { data: 'small payload' } },
                { size: 'medium', context: { data: 'a'.repeat(1000) } },
                { size: 'large', context: { data: 'b'.repeat(10000) } }
            ];
            for (const testCase of testCases) {
                const startTime = performance.now();
                await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', `payload-test-${testCase.size}`, testCase.context);
                const endTime = performance.now();
                const duration = endTime - startTime;
                // All should complete within 2s regardless of payload size
                (0, vitest_1.expect)(duration).toBeLessThan(2000);
            }
            // Should have made 3 calls total
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3);
        }, 15000);
    });
    (0, vitest_1.describe)('Performance Edge Cases', () => {
        (0, vitest_1.it)('should handle OpenAI handoff with retry delays within acceptable timeframe', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure retry settings for test
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: 100,
                exponentialBackoff: true
            };
            // Mock first attempt failing, second succeeding
            agents_1.run
                .mockRejectedValueOnce(new Error('Temporary OpenAI API error'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed after retry' }
            });
            const startTime = performance.now();
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'retry-task-456', { testData: 'context data with retry' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            (0, vitest_1.expect)(result.result).toBe('Task completed after retry');
            // Should still complete within 2s even with retry delays
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
            // Should have retried once
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(2);
        }, 10000);
        (0, vitest_1.it)('should gracefully handle timeout scenarios while maintaining system stability', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock a slow response that exceeds reasonable limits
            agents_1.run.mockImplementation(async () => {
                // Simulate a slow response (but not so slow that it times out the test)
                await new Promise(resolve => setTimeout(resolve, 300));
                return {
                    finalOutput: { result: 'Slow task completed by OpenAI' }
                };
            });
            // Test multiple slow handoffs concurrently
            const slowHandoffPromises = [];
            const handoffCount = 4;
            const startTime = performance.now();
            for (let i = 0; i < handoffCount; i++) {
                slowHandoffPromises.push(handoffSystem.initiateHandoff(`slow-source-${i}`, 'Test OpenAI Agent', `slow-task-${i}`, { testData: `slow context data ${i} for OpenAI` }));
            }
            // Wait for all slow handoffs to complete
            const results = await Promise.all(slowHandoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            (0, vitest_1.expect)(results).toHaveLength(handoffCount);
            // Total time should be reasonable even for slow concurrent operations
            (0, vitest_1.expect)(totalTime).toBeLessThan(5000); // 5 seconds for 4 concurrent slow handoffs
            // Verify all calls were made
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(handoffCount);
        }, 15000);
    });
});
//# sourceMappingURL=handoff-performance.spec.js.map