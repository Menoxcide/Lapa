"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_local_ts_1 = require("../../orchestrator/handoffs.local.ts");
const vitest_2 = require("vitest");
// Mock the local inference functions
vitest_2.vi.mock('../../inference/ollama.local', () => {
    return {
        sendOllamaChatRequest: vitest_2.vi.fn(),
        sendOllamaInferenceRequest: vitest_2.vi.fn(),
        isOllamaAvailable: vitest_2.vi.fn()
    };
});
vitest_2.vi.mock('../../inference/nim.local', () => {
    return {
        sendNIMInferenceRequest: vitest_2.vi.fn(),
        isNIMAvailable: vitest_2.vi.fn()
    };
});
// Import the mocked functions
const ollama_local_ts_1 = require("../../inference/ollama.local.ts");
const nim_local_ts_1 = require("../../inference/nim.local.ts");
(0, vitest_1.describe)('AI SDK Integration Tests', () => {
    let handoffSystem;
    let mockOllamaAgent;
    let mockNIMAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_local_ts_1.LocalHandoffSystem();
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
        // All mocks are automatically cleared in vitest
    });
    (0, vitest_1.describe)('Client Creation', () => {
        (0, vitest_1.it)('should create OpenAI client for NIM endpoint', () => {
            const client = (0, handoffs_local_ts_1.createOpenAI)('http://localhost:8000/v1');
            (0, vitest_1.expect)(client).toBeDefined();
            (0, vitest_1.expect)(client.baseURL).toBe('http://localhost:8000/v1');
        });
        (0, vitest_1.it)('should create Ollama client', () => {
            const client = (0, handoffs_local_ts_1.createOllama)('http://localhost:11434/api');
            (0, vitest_1.expect)(client).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Handoff with AI SDK Fallback', () => {
        (0, vitest_1.it)('should use AI SDK for NIM fallback when Ollama fails', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock Ollama as unavailable and NIM as available
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(false);
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response
            nim_local_ts_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback using AI SDK');
            const result = await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'test-task-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'ollama-agent-1');
            (0, vitest_1.expect)(result).toBe('Task completed with NIM fallback using AI SDK');
            (0, vitest_1.expect)(nim_local_ts_1.sendNIMInferenceRequest).toHaveBeenCalled();
        }, 10000);
        (0, vitest_1.it)('should use AI SDK for Ollama fallback when NIM fails', async () => {
            handoffSystem.registerLocalAgent(mockNIMAgent);
            // Mock NIM as unavailable and Ollama as available
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(false);
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(true);
            // Mock Ollama response
            ollama_local_ts_1.sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback using AI SDK');
            const result = await handoffSystem.handoffToLocalAgent(mockNIMAgent, 'test-task-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'nim-agent-1');
            (0, vitest_1.expect)(result).toBe('Task completed with Ollama fallback using AI SDK');
            (0, vitest_1.expect)(ollama_local_ts_1.sendOllamaChatRequest).toHaveBeenCalled();
        }, 10000);
    });
    (0, vitest_1.describe)('Zero-Key Handoff Functionality', () => {
        (0, vitest_1.it)('should execute zero-key handoff successfully', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock a successful response
            ollama_local_ts_1.sendOllamaChatRequest.mockResolvedValue('Zero-key handoff task completed');
            const task = {
                id: 'zero-key-task-123',
                description: 'Test zero-key handoff',
                type: 'test',
                priority: 5 // Medium priority on a scale of 1-10
            };
            const result = await handoffSystem.localHandoff(task, { testData: 'zero-key context' });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.handoffMetrics).toBeDefined();
            (0, vitest_1.expect)(result.handoffMetrics.duration).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.handoffMetrics.providerUsed).toBe('ollama');
        }, 10000);
        (0, vitest_1.it)('should maintain performance targets during zero-key handoff', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock a quick response
            ollama_local_ts_1.sendOllamaChatRequest.mockResolvedValue('Quick zero-key task completed');
            const task = {
                id: 'performance-task-123',
                description: 'Test performance target',
                type: 'test',
                priority: 5 // Medium priority on a scale of 1-10
            };
            const startTime = performance.now();
            const result = await handoffSystem.localHandoff(task, { testData: 'performance context' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete well within the 2s target
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
            (0, vitest_1.expect)(result.handoffMetrics.latencyWithinTarget).toBe(true);
        }, 10000);
    });
});
//# sourceMappingURL=ai-sdk-integration.local.spec.js.map