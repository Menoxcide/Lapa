"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_local_ts_1 = require("../../orchestrator/handoffs.local.ts");
const vitest_2 = require("vitest");
// Mock the local inference functions
vitest_2.vi.mock('../../inference/ollama.local.ts', () => {
    return {
        sendOllamaChatRequest: vitest_2.vi.fn(),
        sendOllamaInferenceRequest: vitest_2.vi.fn(),
        isOllamaAvailable: vitest_2.vi.fn()
    };
});
vitest_2.vi.mock('../../inference/nim.local.ts', () => {
    return {
        sendNIMInferenceRequest: vitest_2.vi.fn(),
        isNIMAvailable: vitest_2.vi.fn()
    };
});
// Import the mocked functions
const ollama_local_ts_1 = require("../../inference/ollama.local.ts");
const nim_local_ts_1 = require("../../inference/nim.local.ts");
(0, vitest_1.describe)('Fallback Mechanisms Tests', () => {
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
        vitest_2.vi.clearAllMocks();
        vitest_2.vi.useFakeTimers();
    });
    afterEach(() => {
        vitest_2.vi.useRealTimers();
    });
    (0, vitest_1.describe)('Ollama to NIM Fallback', () => {
        (0, vitest_1.it)('should fallback to NIM when Ollama is unavailable', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock Ollama as unavailable initially, then NIM as available
            ollama_local_ts_1.isOllamaAvailable
                .mockResolvedValueOnce(false) // First check - Ollama unavailable
                .mockResolvedValueOnce(true); // Second check - Ollama available
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response
            nim_local_ts_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback');
            // Mock Ollama failure then success (for retry)
            ollama_local_ts_1.sendOllamaChatRequest
                .mockRejectedValueOnce(new Error('Ollama temporarily unavailable'))
                .mockResolvedValueOnce('Task completed after Ollama recovery');
            const result = await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'fallback-test-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'ollama-agent-1');
            // Should have tried NIM fallback first
            (0, vitest_1.expect)(nim_local_ts_1.sendNIMInferenceRequest).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toContain('Task completed with NIM fallback');
        }, 15000);
        (0, vitest_1.it)('should recover to Ollama after temporary NIM failure', async () => {
            handoffSystem.registerLocalAgent(mockNIMAgent);
            // Mock NIM as unavailable initially, then Ollama as available
            nim_local_ts_1.isNIMAvailable
                .mockResolvedValueOnce(false) // First check - NIM unavailable
                .mockResolvedValueOnce(true); // Second check - NIM available
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(true);
            // Mock Ollama response
            ollama_local_ts_1.sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback');
            // Mock NIM failure then success (for retry)
            nim_local_ts_1.sendNIMInferenceRequest
                .mockRejectedValueOnce(new Error('NIM temporarily unavailable'))
                .mockResolvedValueOnce('Task completed after NIM recovery');
            const result = await handoffSystem.handoffToLocalAgent(mockNIMAgent, 'fallback-test-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'nim-agent-1');
            // Should have tried Ollama fallback first
            (0, vitest_1.expect)(ollama_local_ts_1.sendOllamaChatRequest).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toContain('Task completed with Ollama fallback');
        }, 15000);
    });
    (0, vitest_1.describe)('Multiple Fallback Attempts', () => {
        (0, vitest_1.it)('should handle multiple fallback attempts with different providers', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock both providers as temporarily unavailable, then available
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(true);
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(true);
            // Mock failures on first attempts, success on retry
            ollama_local_ts_1.sendOllamaChatRequest
                .mockRejectedValueOnce(new Error('Ollama connection error'))
                .mockRejectedValueOnce(new Error('Ollama timeout'))
                .mockResolvedValueOnce('Task completed after multiple fallbacks');
            nim_local_ts_1.sendNIMInferenceRequest
                .mockRejectedValueOnce(new Error('NIM model loading'))
                .mockResolvedValueOnce('Task completed with NIM on second attempt');
            const result = await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'multi-fallback-test-123', { testData: 'context data for multi-fallback test' }, 'source-agent-123', 'ollama-agent-1');
            // Should have tried multiple fallbacks
            (0, vitest_1.expect)(ollama_local_ts_1.sendOllamaChatRequest).toHaveBeenCalledTimes(4); // 3 failures + 1 success = 4 total calls
            (0, vitest_1.expect)(nim_local_ts_1.sendNIMInferenceRequest).toHaveBeenCalledTimes(3); // 2 failures + 1 success = 3 total calls
            (0, vitest_1.expect)(result).toContain('Task completed after multiple fallbacks');
        }, 20000);
        (0, vitest_1.it)('should gracefully handle when all fallbacks fail', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock both providers as unavailable
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(false);
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(false);
            // Mock all attempts to fail
            ollama_local_ts_1.sendOllamaChatRequest.mockRejectedValue(new Error('All Ollama attempts failed'));
            nim_local_ts_1.sendNIMInferenceRequest.mockRejectedValue(new Error('All NIM attempts failed'));
            await (0, vitest_1.expect)(handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'all-fail-test-123', { testData: 'context data for all fail test' }, 'source-agent-123', 'ollama-agent-1')).rejects.toThrow('Failed to handoff to local agent');
        }, 10000);
    });
    (0, vitest_1.describe)('Performance During Fallback', () => {
        (0, vitest_1.it)('should maintain latency targets during fallback operations', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock Ollama as unavailable and NIM as available with slight delay
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(false);
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response with slight delay to simulate fallback overhead
            nim_local_ts_1.sendNIMInferenceRequest.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'Task completed with fallback';
            });
            const startTime = performance.now();
            await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'perf-fallback-test-123', { testData: 'context data for perf fallback test' }, 'source-agent-123', 'ollama-agent-1');
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should still complete within reasonable time despite fallback
            (0, vitest_1.expect)(duration).toBeLessThan(3000); // Increased target to account for fallback overhead
        }, 10000);
        (0, vitest_1.it)('should log appropriate warnings when fallback occurs', async () => {
            handoffSystem.registerLocalAgent(mockOllamaAgent);
            // Mock Ollama as unavailable and NIM as available
            ollama_local_ts_1.isOllamaAvailable.mockResolvedValue(false);
            nim_local_ts_1.isNIMAvailable.mockResolvedValue(true);
            // Mock NIM response
            nim_local_ts_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with fallback');
            // Spy on console.warn
            const consoleWarnSpy = vitest_2.vi.spyOn(console, 'warn').mockImplementation(() => { });
            await handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'warning-test-123', { testData: 'context data for warning test' }, 'source-agent-123', 'ollama-agent-1');
            // Should log warning about fallback
            (0, vitest_1.expect)(consoleWarnSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Falling back to NIM'));
            consoleWarnSpy.mockRestore();
        }, 10000);
    });
});
//# sourceMappingURL=fallback-mechanisms.local.spec.js.map