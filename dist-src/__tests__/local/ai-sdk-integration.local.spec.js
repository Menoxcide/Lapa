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
describe('AI SDK Integration Tests', () => {
    let handoffSystem;
    let mockOllamaAgent;
    let mockNIMAgent;
    beforeEach(() => {
        handoffSystem = new LocalHandoffSystem();
        mockOllamaAgent = {
            id: 'ollama-agent-1',
            name: 'Test Ollama Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        mockNIMAgent = {
            id: 'nim-agent-1',
            name: 'Test NIM Agent',
            model: 'meta/llama3-8b-instruct',
            type: 'nim'
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Client Creation', () => {
        it('should create OpenAI client for NIM endpoint', () => {
            const { createOpenAI } = require('../../src/orchestrator/handoffs.local');
            const client = createOpenAI('http://localhost:8000/v1');
            expect(client).toBeDefined();
            expect(client.baseURL).toBe('http://localhost:8000/v1');
        });
        it('should create Ollama client', () => {
            const { createOllama } = require('../../src/orchestrator/handoffs.local');
            const client = createOllama('http://localhost:11434/api');
            expect(client).toBeDefined();
        });
    });
    describe('Handoff with AI SDK Fallback', () => {
        it('should use AI SDK for NIM fallback when Ollama fails', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock Ollama as unavailable and NIM as available
            isOllamaAvailable.mockResolvedValue(false);
            isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response
            sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback using AI SDK');
            const result = await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'test-task-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'ollama-agent-1');
            expect(result).toBe('Task completed with NIM fallback using AI SDK');
            expect(sendNIMInferenceRequest).toHaveBeenCalled();
        }, 10000);
        it('should use AI SDK for Ollama fallback when NIM fails', async () => {
            handoffSystem.registerLocalAgent(mockNIMAgent);
            // Mock NIM as unavailable and Ollama as available
            isNIMAvailable.mockResolvedValue(false);
            isOllamaAvailable.mockResolvedValue(true);
            // Mock Ollama response
            sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback using AI SDK');
            const result = await handoffSystem.handoffToLocalAgent(mockNIMAgent, 'test-task-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'nim-agent-1');
            expect(result).toBe('Task completed with Ollama fallback using AI SDK');
            expect(sendOllamaChatRequest).toHaveBeenCalled();
        }, 10000);
    });
    describe('Zero-Key Handoff Functionality', () => {
        it('should execute zero-key handoff successfully', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock a successful response
            sendOllamaChatRequest.mockResolvedValue('Zero-key handoff task completed');
            const task = {
                id: 'zero-key-task-123',
                description: 'Test zero-key handoff',
                input: 'Test input data',
                priority: 'medium'
            };
            const result = await handoffSystem.localHandoff(task, { testData: 'zero-key context' });
            expect(result).toBeDefined();
            expect(result.handoffMetrics).toBeDefined();
            expect(result.handoffMetrics.duration).toBeGreaterThan(0);
            expect(result.handoffMetrics.providerUsed).toBe('ollama');
        }, 10000);
        it('should maintain performance targets during zero-key handoff', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock a quick response
            sendOllamaChatRequest.mockResolvedValue('Quick zero-key task completed');
            const task = {
                id: 'performance-task-123',
                description: 'Test performance target',
                input: 'Test input data',
                priority: 'medium'
            };
            const startTime = performance.now();
            const result = await handoffSystem.localHandoff(task, { testData: 'performance context' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete well within the 2s target
            expect(duration).toBeLessThan(2000);
            expect(result.handoffMetrics.latencyWithinTarget).toBe(true);
        }, 10000);
    });
});
//# sourceMappingURL=ai-sdk-integration.local.spec.js.map