import { LocalHandoffSystem } from '../../src/orchestrator/handoffs.local';
import { Task } from '../../src/agents/moe-router';

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
    jest.clearAllMocks();
  });

  describe('Ollama to NIM Fallback', () => {
    it('should fallback to NIM when Ollama is unavailable', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable initially, then NIM as available
      (isOllamaAvailable as jest.Mock)
        .mockResolvedValueOnce(false)  // First check - Ollama unavailable
        .mockResolvedValueOnce(true);   // Second check - Ollama available
      
      (isNIMAvailable as jest.Mock).mockResolvedValue(true);
      
      // Mock NIM response
      (sendNIMInferenceRequest as jest.Mock).mockResolvedValue('Task completed with NIM fallback');
      
      // Mock Ollama failure then success (for retry)
      (sendOllamaChatRequest as jest.Mock)
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
      expect(result).toBe('Task completed with NIM fallback');
    }, 15000);

    it('should recover to Ollama after temporary NIM failure', async () => {
      handoffSystem.registerLocalAgent(mockNIMAgent);
      
      // Mock NIM as unavailable initially, then Ollama as available
      (isNIMAvailable as jest.Mock)
        .mockResolvedValueOnce(false)  // First check - NIM unavailable
        .mockResolvedValueOnce(true);   // Second check - NIM available
      
      (isOllamaAvailable as jest.Mock).mockResolvedValue(true);
      
      // Mock Ollama response
      (sendOllamaChatRequest as jest.Mock).mockResolvedValue('Task completed with Ollama fallback');
      
      // Mock NIM failure then success (for retry)
      (sendNIMInferenceRequest as jest.Mock)
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
      expect(result).toBe('Task completed with Ollama fallback');
    }, 15000);
  });

  describe('Multiple Fallback Attempts', () => {
    it('should handle multiple fallback attempts with different providers', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock both providers as temporarily unavailable, then available
      (isOllamaAvailable as jest.Mock).mockResolvedValue(true);
      (isNIMAvailable as jest.Mock).mockResolvedValue(true);
      
      // Mock failures on first attempts, success on retry
      (sendOllamaChatRequest as jest.Mock)
        .mockRejectedValueOnce(new Error('Ollama connection error'))
        .mockRejectedValueOnce(new Error('Ollama timeout'))
        .mockResolvedValueOnce('Task completed after multiple fallbacks');
      
      (sendNIMInferenceRequest as jest.Mock)
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
      expect(sendOllamaChatRequest).toHaveBeenCalledTimes(3);
      expect(sendNIMInferenceRequest).toHaveBeenCalledTimes(2);
      expect(result).toBe('Task completed after multiple fallbacks');
    }, 20000);

    it('should gracefully handle when all fallbacks fail', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock both providers as unavailable
      (isOllamaAvailable as jest.Mock).mockResolvedValue(false);
      (isNIMAvailable as jest.Mock).mockResolvedValue(false);
      
      // Mock all attempts to fail
      (sendOllamaChatRequest as jest.Mock).mockRejectedValue(new Error('All Ollama attempts failed'));
      (sendNIMInferenceRequest as jest.Mock).mockRejectedValue(new Error('All NIM attempts failed'));
      
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
      (isOllamaAvailable as jest.Mock).mockResolvedValue(false);
      (isNIMAvailable as jest.Mock).mockResolvedValue(true);
      
      // Mock NIM response with slight delay to simulate fallback overhead
      (sendNIMInferenceRequest as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
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
      expect(duration).toBeLessThan(2000); // 2 seconds target
    }, 10000);

    it('should log appropriate warnings when fallback occurs', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable and NIM as available
      (isOllamaAvailable as jest.Mock).mockResolvedValue(false);
      (isNIMAvailable as jest.Mock).mockResolvedValue(true);
      
      // Mock NIM response
      (sendNIMInferenceRequest as jest.Mock).mockResolvedValue('Task completed with fallback');
      
      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
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