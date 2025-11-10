import { SwarmDelegate, delegateTask } from '../../swarm/delegate';
// Mock the local inference functions
jest.mock('../../inference/ollama.local', () => {
    return {
        sendOllamaChatRequest: jest.fn(),
        sendOllamaInferenceRequest: jest.fn(),
        isOllamaAvailable: jest.fn()
    };
});
jest.mock('../../inference/nim.local', () => {
    return {
        sendNIMInferenceRequest: jest.fn(),
        isNIMAvailable: jest.fn()
    };
});
// Import the mocked functions
import { sendOllamaChatRequest } from '../../inference/ollama.local';
describe('Swarm Delegate Local Integration', () => {
    let swarmDelegate;
    let mockLocalAgent;
    let mockRemoteAgent;
    beforeEach(() => {
        swarmDelegate = new SwarmDelegate();
        mockLocalAgent = {
            id: 'local-agent-1',
            name: 'Test Local Agent',
            capabilities: ['text-generation', 'qa'],
            workload: 0,
            isLocal: true,
            type: 'local',
            capacity: 10
        };
        mockRemoteAgent = {
            id: 'remote-agent-1',
            name: 'Test Remote Agent',
            capabilities: ['image-processing', 'data-analysis'],
            workload: 0,
            isLocal: false,
            type: 'remote',
            capacity: 5
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Local Delegation', () => {
        it('should delegate to local agent when available and within latency target', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            // Mock a quick response from local inference
            const mockResult = { response: 'Task completed by local agent' };
            sendOllamaChatRequest.mockResolvedValue(mockResult);
            const task = {
                id: 'test-task-123',
                description: 'Test task for local delegation',
                type: 'test',
                priority: 1,
                context: { input: 'Test input data' }
            };
            const context = { testData: 'simple context data for local delegation' };
            const startTime = performance.now();
            const result = await swarmDelegate.delegateTask(task, context);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            expect(result.delegatedToAgentId).toBeDefined();
            expect(result.result).toBeDefined();
            expect(result.metrics).toBeDefined();
            expect(result.metrics?.duration).toBeCloseTo(duration, 1);
            expect(result.metrics?.latencyWithinTarget).toBe(true);
            // Should complete well within the 2s target
            expect(duration).toBeLessThan(2000);
        }, 10000);
        it('should fall back to consensus delegation when local delegation fails', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            swarmDelegate.registerAgent(mockRemoteAgent);
            // Mock local inference failure
            sendOllamaChatRequest.mockRejectedValue(new Error('Local inference unavailable'));
            const task = {
                id: 'test-task-456',
                description: 'Test task for fallback delegation',
                type: 'test',
                priority: 1,
                context: { input: 'Test input data' }
            };
            const context = { testData: 'context data for fallback delegation' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should still succeed through fallback mechanism
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            expect(result.delegatedToAgentId).toBeDefined();
        }, 10000);
    });
    describe('Consensus Delegation', () => {
        it('should delegate via consensus when no local agents available', async () => {
            swarmDelegate.registerAgent(mockRemoteAgent);
            const task = {
                id: 'test-task-789',
                description: 'Test task for consensus delegation',
                type: 'test',
                priority: 1,
                context: { input: 'Test input data' }
            };
            const context = { testData: 'context data for consensus delegation' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should succeed with consensus delegation
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            expect(result.delegatedToAgentId).toBe(mockRemoteAgent.id);
        }, 10000);
        it('should delegate to most capable agent based on task description', async () => {
            // Register agents with different capabilities
            const qaAgent = {
                id: 'qa-agent-1',
                name: 'QA Specialist Agent',
                capabilities: ['question-answering', 'text-comprehension'],
                workload: 0,
                isLocal: true,
                type: 'local',
                capacity: 8
            };
            const imageAgent = {
                id: 'image-agent-1',
                name: 'Image Processing Agent',
                capabilities: ['image-recognition', 'computer-vision'],
                workload: 0,
                isLocal: false,
                type: 'remote',
                capacity: 6
            };
            swarmDelegate.registerAgent(qaAgent);
            swarmDelegate.registerAgent(imageAgent);
            const task = {
                id: 'test-task-999',
                description: 'Answer questions about a document',
                type: 'qa',
                priority: 2,
                context: { input: 'Document content with questions' }
            };
            const context = { document: 'Sample document content' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should delegate to QA agent based on task description
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            // QA agent should be selected due to "question" in task description
            expect(result.delegatedToAgentId).toBe(qaAgent.id);
        }, 10000);
    });
    describe('Performance Validation', () => {
        it('should maintain <2s latency target for swarm delegation', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            // Mock responses with slight delays to simulate inference latency
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate typical local inference response time
                await new Promise(resolve => setTimeout(resolve, 100));
                return { response: 'Task completed under latency target' };
            });
            const task = {
                id: 'latency-test-task',
                description: 'Latency validation task',
                type: 'test',
                priority: 1,
                context: { input: 'Input data for latency test' }
            };
            const context = { testData: 'latency test context data' };
            const startTime = performance.now();
            const result = await swarmDelegate.delegateTask(task, context);
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should stay under 2s even with inference latency
            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(2000);
            expect(result.metrics?.latencyWithinTarget).toBe(true);
        }, 10000);
        it('should track delegation duration accurately', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            // Mock a response with known delay
            sendOllamaChatRequest.mockImplementation(async () => {
                // Simulate a specific delay
                await new Promise(resolve => setTimeout(resolve, 150));
                return { response: 'Timed task completed' };
            });
            const task = {
                id: 'timing-test-task',
                description: 'Timing validation task',
                type: 'test',
                priority: 0,
                context: { input: 'Input data for timing test' }
            };
            const context = { testData: 'timing test context data' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should have accurate timing metrics
            expect(result.success).toBe(true);
            expect(result.metrics).toBeDefined();
            expect(result.metrics?.duration).toBeGreaterThan(150); // At least the delay time
            expect(result.metrics?.latencyWithinTarget).toBe(true);
        }, 10000);
    });
    describe('Configuration Management', () => {
        it('should allow configuration updates', () => {
            const initialConfig = swarmDelegate.getConfig();
            expect(initialConfig.enableLocalInference).toBe(true);
            expect(initialConfig.latencyTargetMs).toBe(2000);
            // Update configuration
            swarmDelegate.updateConfig({
                enableLocalInference: false,
                latencyTargetMs: 1500
            });
            const updatedConfig = swarmDelegate.getConfig();
            expect(updatedConfig.enableLocalInference).toBe(false);
            expect(updatedConfig.latencyTargetMs).toBe(1500);
        });
        it('should disable local inference when configured', async () => {
            // Disable local inference
            swarmDelegate.updateConfig({ enableLocalInference: false });
            swarmDelegate.registerAgent(mockLocalAgent);
            swarmDelegate.registerAgent(mockRemoteAgent);
            const task = {
                id: 'config-test-task',
                description: 'Configuration test task',
                type: 'test',
                priority: 1,
                context: { input: 'Input data for config test' }
            };
            const context = { testData: 'config test context data' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should delegate via consensus even with local agents available
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            // Should delegate to one of the registered agents via consensus
            expect([mockLocalAgent.id, mockRemoteAgent.id]).toContain(result.delegatedToAgentId);
        }, 10000);
    });
    describe('Edge Cases', () => {
        it('should handle delegation with no registered agents', async () => {
            const task = {
                id: 'no-agents-task',
                description: 'Task with no agents registered',
                type: 'test',
                priority: 1,
                context: { input: 'Input data' }
            };
            const context = { testData: 'no agents context data' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should fail gracefully
            expect(result.success).toBe(false);
            expect(result.taskId).toBe(task.id);
            expect(result.error).toBeDefined();
        }, 10000);
        it('should handle delegation with malformed task data', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            // Mock successful response
            sendOllamaChatRequest.mockResolvedValue({ response: 'Task completed' });
            // Task with minimal data
            const task = {
                id: 'minimal-task',
                type: 'test',
                priority: 1
                // Missing description, context
            };
            const context = { minimal: 'context data' };
            const result = await swarmDelegate.delegateTask(task, context);
            // Should handle gracefully
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
        }, 10000);
    });
    describe('Convenience Function', () => {
        it('should delegate tasks using convenience function', async () => {
            swarmDelegate.registerAgent(mockLocalAgent);
            // Mock successful response
            sendOllamaChatRequest.mockResolvedValue({ response: 'Task completed via convenience function' });
            const task = {
                id: 'convenience-task',
                description: 'Task for convenience function test',
                type: 'test',
                priority: 1,
                context: { input: 'Input data' }
            };
            const context = { testData: 'convenience function context data' };
            const result = await delegateTask(task, context);
            // Should work the same as instance method
            expect(result.success).toBe(true);
            expect(result.taskId).toBe(task.id);
            expect(result.result).toBeDefined();
        }, 10000);
    });
});
//# sourceMappingURL=delegate.local.spec.js.map