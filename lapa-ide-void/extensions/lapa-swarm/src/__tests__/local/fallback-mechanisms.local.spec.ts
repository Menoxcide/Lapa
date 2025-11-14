import { describe, it, expect } from "vitest";
import { LocalHandoffSystem } from '../../orchestrator/handoffs.local.ts';
import { Task } from '../../agents/moe-router.ts';
import { vi } from 'vitest';

// Mock the local inference functions
vi.mock('../../inference/ollama.local.ts', () => {
  return {
    sendOllamaChatRequest: vi.fn(),
    sendOllamaInferenceRequest: vi.fn(),
    isOllamaAvailable: vi.fn()
  };
});

vi.mock('../../inference/nim.local.ts', () => {
  return {
    sendNIMInferenceRequest: vi.fn(),
    isNIMAvailable: vi.fn()
  };
});

// Import the mocked functions
import { sendOllamaChatRequest, isOllamaAvailable } from '../../inference/ollama.local.ts';
import { sendNIMInferenceRequest, isNIMAvailable } from '../../inference/nim.local.ts';

describe('Fallback Mechanisms Tests', () => {
  let handoffSystem: LocalHandoffSystem;
  let mockOllamaAgent: any;
  let mockNIMAgent: any;

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
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Ollama to NIM Fallback', () => {
    it('should fallback to NIM when Ollama is unavailable', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable initially, then NIM as available
      (isOllamaAvailable as any)
        .mockResolvedValueOnce(false)  // First check - Ollama unavailable
        .mockResolvedValueOnce(true);   // Second check - Ollama available
      
            (isNIMAvailable as any).mockResolvedValue(true);
      
      // Mock NIM response
      (sendNIMInferenceRequest as any).mockResolvedValue('Task completed with NIM fallback');
      
      // Mock Ollama failure then success (for retry)
      (sendOllamaChatRequest as any)
        .mockRejectedValueOnce(new Error('Ollama temporarily unavailable'))
        .mockResolvedValueOnce('Task completed after Ollama recovery');
      
      const result = await (handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'fallback-test-123',
        { testData: 'context data for fallback test' },
        'source-agent-123',
        'ollama-agent-1'
      );
      
      // Should have tried NIM fallback first
      expect(sendNIMInferenceRequest).toHaveBeenCalled();
      expect(result).toContain('Task completed with NIM fallback');
    }, 15000);

    it('should recover to Ollama after temporary NIM failure', async () => {
      handoffSystem.registerLocalAgent(mockNIMAgent);
      
      // Mock NIM as unavailable initially, then Ollama as available
      (isNIMAvailable as any)
        .mockResolvedValueOnce(false)  // First check - NIM unavailable
        .mockResolvedValueOnce(true);   // Second check - NIM available
      
            (isOllamaAvailable as any).mockResolvedValue(true);
      
      // Mock Ollama response
      (sendOllamaChatRequest as any).mockResolvedValue('Task completed with Ollama fallback');
      
      // Mock NIM failure then success (for retry)
      (sendNIMInferenceRequest as any)
        .mockRejectedValueOnce(new Error('NIM temporarily unavailable'))
        .mockResolvedValueOnce('Task completed after NIM recovery');
      
      const result = await (handoffSystem as any).handoffToLocalAgent(
        mockNIMAgent,
        'fallback-test-123',
        { testData: 'context data for fallback test' },
        'source-agent-123',
        'nim-agent-1'
      );
      
      // Should have tried Ollama fallback first
      expect(sendOllamaChatRequest).toHaveBeenCalled();
      expect(result).toContain('Task completed with Ollama fallback');
    }, 15000);
  });

  describe('Multiple Fallback Attempts', () => {
    it('should handle multiple fallback attempts with different providers', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock both providers as temporarily unavailable, then available
      (isOllamaAvailable as any).mockResolvedValue(true);
      (isNIMAvailable as any).mockResolvedValue(true);
      
      // Mock failures on first attempts, success on retry
      (sendOllamaChatRequest as any)
        .mockRejectedValueOnce(new Error('Ollama connection error'))
        .mockRejectedValueOnce(new Error('Ollama timeout'))
        .mockResolvedValueOnce('Task completed after multiple fallbacks');
      
            (sendNIMInferenceRequest as any)
              .mockRejectedValueOnce(new Error('NIM model loading'))
        .mockResolvedValueOnce('Task completed with NIM on second attempt');
      
      const result = await (handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'multi-fallback-test-123',
        { testData: 'context data for multi-fallback test' },
        'source-agent-123',
        'ollama-agent-1'
      );
      
      // Should have tried multiple fallbacks
      expect(sendOllamaChatRequest).toHaveBeenCalledTimes(4); // 3 failures + 1 success = 4 total calls
      expect(sendNIMInferenceRequest).toHaveBeenCalledTimes(3); // 2 failures + 1 success = 3 total calls
      expect(result).toContain('Task completed after multiple fallbacks');
    }, 20000);

    it('should gracefully handle when all fallbacks fail', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock both providers as unavailable
      (isOllamaAvailable as any).mockResolvedValue(false);
      (isNIMAvailable as any).mockResolvedValue(false);
      
      // Mock all attempts to fail
      (sendOllamaChatRequest as any).mockRejectedValue(new Error('All Ollama attempts failed'));
      (sendNIMInferenceRequest as any).mockRejectedValue(new Error('All NIM attempts failed'));
      
      await expect((handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'all-fail-test-123',
        { testData: 'context data for all fail test' },
        'source-agent-123',
        'ollama-agent-1'
      )).rejects.toThrow('Failed to handoff to local agent');
    }, 10000);
  });

  describe('Performance During Fallback', () => {
    it('should maintain latency targets during fallback operations', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable and NIM as available with slight delay
      (isOllamaAvailable as any).mockResolvedValue(false);
      (isNIMAvailable as any).mockResolvedValue(true);
      
      // Mock NIM response with slight delay to simulate fallback overhead
      (sendNIMInferenceRequest as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'Task completed with fallback';
      });
      
      const startTime = performance.now();
      
      await (handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'perf-fallback-test-123',
        { testData: 'context data for perf fallback test' },
        'source-agent-123',
        'ollama-agent-1'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should still complete within reasonable time despite fallback
      expect(duration).toBeLessThan(3000); // Increased target to account for fallback overhead
    }, 10000);

    it('should log appropriate warnings when fallback occurs', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable and NIM as available
      (isOllamaAvailable as any).mockResolvedValue(false);
      (isNIMAvailable as any).mockResolvedValue(true);
      
      // Mock NIM response
      (sendNIMInferenceRequest as any).mockResolvedValue('Task completed with fallback');
      
      // Spy on console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await (handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'warning-test-123',
        { testData: 'context data for warning test' },
        'source-agent-123',
        'ollama-agent-1'
      );
      
      // Should log warning about fallback
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Falling back to NIM'));
      
      consoleWarnSpy.mockRestore();
    }, 10000);
  });
});
