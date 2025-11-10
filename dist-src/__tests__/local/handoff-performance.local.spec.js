import { LocalHandoffSystem } from '../../src/orchestrator/handoffs.local';
// Mock the local inference functions
jest.mock('../../src/inference/ollama.local', () => {
    return {
        sendOllamaChatRequest: jest.fn(),
        sendOllamaInferenceRequest: jest.fn(),
        isOllamaAvailable: jest.fn()
    };
});
jest.mock('../../src/inference/nim.local', () => {
    return {
        sendNIMInferenceRequest: jest.fn(),
        isNIMAvailable: jest.fn()
    };
});
// Import the mocked functions
import { sendOllamaChatRequest, isOllamaAvailable } from '../../src/inference/ollama.local';
import { sendNIMInferenceRequest, isNIMAvailable } from '../../src/inference/nim.local';
describe('Local Handoff Performance', () => {
    let handoffSystem;
    let mockLocalAgent;
    beforeEach(() => {
        handoffSystem = new LocalHandoffSystem();
        mockLocalAgent = {
            id: 'local-agent-1',
            name: 'Test Local Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Latency Validation', () => {
        it('should complete local handoff within 2s target for simple tasks', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock a quick response
            const mockRunResult = 'Quick task completed by local agent';
            sendOllamaChatRequest.mockResolvedValue(mockRunResult);
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'simple context data for local' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete well within the 2s target
            expect(duration).toBeLessThan(2000);
        }, 10000); // 10 second timeout for the test
        it('should maintain <2s latency under moderate local inference load', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock responses with slight delays to simulate inference latency
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate typical local inference response time
                await new Promise(resolve => setTimeout(resolve, 100));
                return 'Task completed under moderate local load';
            });
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'moderate context data for local' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should stay under 2s even with inference latency
            expect(duration).toBeLessThan(2000);
        }, 10000);
        it('should track local handoff duration accurately', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock a response with known delay
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate a specific delay
                await new Promise(resolve => setTimeout(resolve, 150));
                return 'Local task completed';
            });
            // Spy on console.log to capture timing messages
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'timed context data for local' });
            // Check that timing information was logged
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Handoff from .* to .* completed in .*ms/));
            // Verify warning when latency target is exceeded
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            // Configure a very short latency target for testing
            handoffSystem.updateConfig({ latencyTargetMs: 100 });
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'slow context data for local' });
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Handoff latency target exceeded'));
            consoleLogSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        }, 10000);
        it('should meet latency target for batch local handoffs', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock quick responses for batch processing
            sendOllamaChatRequest.mockResolvedValue('Batch task completed by local');
            // Test with 3 concurrent handoffs (smaller batch for unit test)
            const handoffPromises = [];
            const handoffCount = 3;
            const startTime = performance.now();
            for (let i = 0; i < handoffCount; i++) {
                handoffPromises.push(handoffSystem.initiateHandoff(`source-agent-${i}`, 'local-agent-1', `task-${i}`, { testData: `batch context data ${i} for local` }));
            }
            // Wait for all handoffs to complete
            const results = await Promise.all(handoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            expect(results).toHaveLength(handoffCount);
            // Should complete within reasonable time
            expect(totalTime).toBeLessThan(3000); // 3 seconds for 3 concurrent handoffs
            // Verify all calls were made
            expect(sendOllamaChatRequest).toHaveBeenCalledTimes(handoffCount);
        }, 15000); // 15 second timeout for concurrent test
    });
    describe('High-Load Performance', () => {
        it('should handle burst of local handoffs without significant latency degradation', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock responses with realistic delays
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate variable inference response times
                const delay = 30 + Math.random() * 150;
                await new Promise(resolve => setTimeout(resolve, delay));
                return 'Burst task completed by local';
            });
            // Create burst of handoffs
            const burstSize = 8;
            const handoffPromises = [];
            const startTime = performance.now();
            for (let i = 0; i < burstSize; i++) {
                handoffPromises.push(handoffSystem.initiateHandoff(`source-agent-${i}`, 'local-agent-1', `burst-task-${i}`, { testData: `burst context data ${i} for local` }));
            }
            // Wait for all handoffs to complete
            const results = await Promise.all(handoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            expect(results).toHaveLength(burstSize);
            // Average time per handoff should remain reasonable
            const averageTime = totalTime / burstSize;
            expect(averageTime).toBeLessThan(300); // Average < 300ms per handoff
            // Total time should be reasonable for burst processing
            expect(totalTime).toBeLessThan(5000); // 5 seconds for 8 concurrent handoffs
            // Verify all calls were made
            expect(sendOllamaChatRequest).toHaveBeenCalledTimes(burstSize);
        }, 20000); // 20 second timeout for burst test
        it('should maintain consistent performance with varying payload sizes', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock quick responses
            sendOllamaChatRequest.mockResolvedValue('Variable payload task completed by local');
            // Test with different context sizes
            const testCases = [
                { size: 'small', context: { data: 'small payload' } },
                { size: 'medium', context: { data: 'a'.repeat(1000) } },
                { size: 'large', context: { data: 'b'.repeat(10000) } }
            ];
            for (const testCase of testCases) {
                const startTime = performance.now();
                await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', `payload-test-${testCase.size}`, testCase.context);
                const endTime = performance.now();
                const duration = endTime - startTime;
                // All should complete within 2s regardless of payload size
                expect(duration).toBeLessThan(2000);
            }
            // Should have made 3 calls total
            expect(sendOllamaChatRequest).toHaveBeenCalledTimes(3);
        }, 15000);
    });
    describe('Performance Edge Cases', () => {
        it('should handle local handoff with retry delays within acceptable timeframe', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Configure retry settings for test
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: 50,
                exponentialBackoff: true
            };
            // Mock first attempt failing, second succeeding
            sendOllamaChatRequest
                .mockRejectedValueOnce(new Error('Temporary local inference error'))
                .mockResolvedValueOnce('Task completed after retry');
            const startTime = performance.now();
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'retry-task-456', { testData: 'context data with retry' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(result).toBe('Task completed after retry');
            // Should still complete within 2s even with retry delays
            expect(duration).toBeLessThan(2000);
            // Should have retried once
            expect(sendOllamaChatRequest).toHaveBeenCalledTimes(2);
        }, 10000);
        it('should gracefully handle timeout scenarios while maintaining system stability', async () => {
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock a slow response that exceeds reasonable limits
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate a slow response (but not so slow that it times out the test)
                await new Promise(resolve => setTimeout(resolve, 200));
                return 'Slow task completed by local';
            });
            // Test multiple slow handoffs concurrently
            const slowHandoffPromises = [];
            const handoffCount = 4;
            const startTime = performance.now();
            for (let i = 0; i < handoffCount; i++) {
                slowHandoffPromises.push(handoffSystem.initiateHandoff(`slow-source-${i}`, 'local-agent-1', `slow-task-${i}`, { testData: `slow context data ${i} for local` }));
            }
            // Wait for all slow handoffs to complete
            const results = await Promise.all(slowHandoffPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            // Verify all handoffs completed
            expect(results).toHaveLength(handoffCount);
            // Total time should be reasonable even for slow concurrent operations
            expect(totalTime).toBeLessThan(3000); // 3 seconds for 4 concurrent slow handoffs
            // Verify all calls were made
            expect(sendOllamaChatRequest).toHaveBeenCalledTimes(handoffCount);
        }, 15000);
    });
    describe('Fallback Performance', () => {
        it('should maintain performance when falling back from Ollama to NIM', async () => {
            // Register agent with Ollama type but simulate Ollama unavailability
            mockLocalAgent.type = 'ollama';
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock Ollama as unavailable and NIM as available
            isOllamaAvailable.mockResolvedValue(false);
            isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response
            sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback');
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'fallback-task-456', { testData: 'context data with fallback' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete within 2s even with fallback
            expect(duration).toBeLessThan(2000);
            // Should have called NIM
            expect(sendNIMInferenceRequest).toHaveBeenCalled();
        }, 10000);
        it('should maintain performance when falling back from NIM to Ollama', async () => {
            // Register agent with NIM type but simulate NIM unavailability
            mockLocalAgent.type = 'nim';
            handoffSystem.registerLocalAgent(mockLocalAgent);
            // Mock NIM as unavailable and Ollama as available
            isNIMAvailable.mockResolvedValue(false);
            isOllamaAvailable.mockResolvedValue(true);
            // Mock Ollama response
            sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback');
            const startTime = performance.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'fallback-task-456', { testData: 'context data with fallback' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete within 2s even with fallback
            expect(duration).toBeLessThan(2000);
            // Should have called Ollama
            expect(sendOllamaChatRequest).toHaveBeenCalled();
        }, 10000);
    });
});
//# sourceMappingURL=handoff-performance.local.spec.js.map