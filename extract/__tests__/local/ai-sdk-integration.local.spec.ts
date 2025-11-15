import { describe, it, expect } from "vitest";
import { LocalHandoffSystem, createOpenAI, createOllama } from '../../orchestrator/handoffs.local.ts';
import { Task } from '../../agents/moe-router.ts';
import { vi } from 'vitest';

// Mock the local inference functions
vi.mock('../../inference/ollama.local', () => {
  return {
    sendOllamaChatRequest: vi.fn(),
    sendOllamaInferenceRequest: vi.fn(),
    isOllamaAvailable: vi.fn()
  };
});

vi.mock('../../inference/nim.local', () => {
  return {
    sendNIMInferenceRequest: vi.fn(),
    isNIMAvailable: vi.fn()
  };
});

// Import the mocked functions
import { sendOllamaChatRequest, isOllamaAvailable } from '../../inference/ollama.local.ts';
import { sendNIMInferenceRequest, isNIMAvailable } from '../../inference/nim.local.ts';

describe('AI SDK Integration Tests', () => {
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
    // All mocks are automatically cleared in vitest
  });

  describe('Client Creation', () => {
    it('should create OpenAI client for NIM endpoint', () => {
      const client = createOpenAI('http://localhost:8000/v1');
      
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('http://localhost:8000/v1');
    });

    it('should create Ollama client', () => {
      const client = createOllama('http://localhost:11434/api');
      
      expect(client).toBeDefined();
    });
  });

  describe('Handoff with AI SDK Fallback', () => {
    it('should use AI SDK for NIM fallback when Ollama fails', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock Ollama as unavailable and NIM as available
      (isOllamaAvailable as any).mockResolvedValue(false);
      (isNIMAvailable as any).mockResolvedValue(true);
      
      // Mock NIM response
      (sendNIMInferenceRequest as any).mockResolvedValue('Task completed with NIM fallback using AI SDK');
      
      const result = await (handoffSystem as any).handoffToLocalAgent(
        mockOllamaAgent,
        'test-task-123',
        { testData: 'context data for fallback test' },
        'source-agent-123',
        'ollama-agent-1'
      );
      
      expect(result).toBe('Task completed with NIM fallback using AI SDK');
      expect(sendNIMInferenceRequest).toHaveBeenCalled();
    }, 10000);

    it('should use AI SDK for Ollama fallback when NIM fails', async () => {
      handoffSystem.registerLocalAgent(mockNIMAgent);
      
      // Mock NIM as unavailable and Ollama as available
      (isNIMAvailable as any).mockResolvedValue(false);
      (isOllamaAvailable as any).mockResolvedValue(true);
      
      // Mock Ollama response
      (sendOllamaChatRequest as any).mockResolvedValue('Task completed with Ollama fallback using AI SDK');
      
      const result = await (handoffSystem as any).handoffToLocalAgent(
        mockNIMAgent,
        'test-task-123',
        { testData: 'context data for fallback test' },
        'source-agent-123',
        'nim-agent-1'
      );
      
      expect(result).toBe('Task completed with Ollama fallback using AI SDK');
      expect(sendOllamaChatRequest).toHaveBeenCalled();
    }, 10000);
  });

  describe('Zero-Key Handoff Functionality', () => {
    it('should execute zero-key handoff successfully', async () => {
      handoffSystem.registerLocalAgent(mockOllamaAgent);
      
      // Mock a successful response
      (sendOllamaChatRequest as any).mockResolvedValue('Zero-key handoff task completed');
      
      const task: Task = {
        id: 'zero-key-task-123',
        description: 'Test zero-key handoff',
        type: 'test',
        priority: 5 // Medium priority on a scale of 1-10
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
      (sendOllamaChatRequest as any).mockResolvedValue('Quick zero-key task completed');
      
      const task: Task = {
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
      expect(duration).toBeLessThan(2000);
      expect(result.handoffMetrics.latencyWithinTarget).toBe(true);
    }, 10000);
  });
});
