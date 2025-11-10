import { describe, it, expect } from "vitest";
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { LangGraphOrchestrator } from '../../swarm/langgraph.orchestrator.js';
import { Agent as OpenAIAgent } from '@openai/agents';
import { vi } from 'vitest';

// Mock the OpenAI agents SDK
vi.mock('@openai/agents', () => {
  return {
    run: vi.fn()
  };
});

// Import the mocked run function
import { run } from '@openai/agents';

describe('OpenAI Handoff Error Handling', () => {
  let handoffSystem: HybridHandoffSystem;
  let orchestrator: LangGraphOrchestrator;
  let mockOpenAIAgent: OpenAIAgent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    orchestrator = new LangGraphOrchestrator('start');
    mockOpenAIAgent = {
      id: 'openai-agent-1',
      name: 'Test OpenAI Agent',
      instructions: 'Test instructions',
      tools: [],
      model: 'gpt-4'
    } as unknown as OpenAIAgent;
    
    // Clear all mocks before each test
    // All mocks are automatically cleared in vitest
  });

  describe('Retry Logic Validation', () => {
    it('should retry failed OpenAI handoff with exponential backoff', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure custom retry settings for testing
      (handoffSystem as any).retryConfig = {
        maxRetries: 3,
        retryDelayMs: 50,
        exponentialBackoff: true
      };
      
      // Fail twice, then succeed
      (run as any)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed on third attempt' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'retry-task-456',
        { testData: 'context data with retries' }
      );
      
      expect(result.result).toBe('Task completed on third attempt');
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('should retry failed OpenAI handoff with linear backoff', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure custom retry settings for testing
      (handoffSystem as any).retryConfig = {
        maxRetries: 3,
        retryDelayMs: 100,
        exponentialBackoff: false // Linear backoff
      };
      
      // Fail twice, then succeed
      (run as any)
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockRejectedValueOnce(new Error('API quota exceeded'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed with linear backoff' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'linear-retry-task-456',
        { testData: 'context data with linear retries' }
      );
      
      expect(result.result).toBe('Task completed with linear backoff');
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded with OpenAI errors', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure retry settings
      (handoffSystem as any).retryConfig = {
        maxRetries: 2,
        retryDelayMs: 50,
        exponentialBackoff: true
      };
      
      // Always fail
      (run as any).mockRejectedValue(new Error('Persistent OpenAI API error'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'fail-task-456',
          { testData: 'context data that always fails' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Persistent OpenAI API error');
      
      expect(run).toHaveBeenCalledTimes(2); // Max retries
    });

    it('should respect retry delay configuration', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure custom retry delay
      (handoffSystem as any).retryConfig = {
        maxRetries: 2,
        retryDelayMs: 200,
        exponentialBackoff: false
      };
      
      // Fail once, then succeed
      (run as any)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed after delay' }
        });
      
      const startTime = Date.now();
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'delay-task-456',
        { testData: 'context data with delay' }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.result).toBe('Task completed after delay');
      expect(run).toHaveBeenCalledTimes(2);
      
      // Should have waited at least the retry delay
      expect(duration).toBeGreaterThanOrEqual(200);
    }, 10000);
  });

  describe('Failure Recovery Scenarios', () => {
    it('should recover from transient OpenAI API errors', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock transient errors followed by success
      (run as any)
        .mockRejectedValueOnce(new Error('Connection reset by peer'))
        .mockRejectedValueOnce(new Error('Timeout reading response'))
        .mockResolvedValueOnce({
          finalOutput: {
            result: 'Recovered from transient errors',
            recoveryInfo: 'Successfully processed after 2 retries'
          }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'transient-error-task-456',
        { testData: 'context data with transient errors' }
      );
      
      expect(result.result).toBe('Recovered from transient errors');
      expect(result.recoveryInfo).toBe('Successfully processed after 2 retries');
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('should handle different types of OpenAI API errors appropriately', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Test various error types
      const errorTypes = [
        new Error('429 Too Many Requests'),
        new Error('503 Service Unavailable'),
        new Error('500 Internal Server Error'),
        new Error('ETIMEDOUT')
      ];
      
      let callCount = 0;
      (run as any).mockImplementation(() => {
        if (callCount < errorTypes.length) {
          return Promise.reject(errorTypes[callCount++]);
        }
        return Promise.resolve({
          finalOutput: { result: 'Successfully recovered from all error types' }
        });
      });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'multi-error-task-456',
        { testData: 'context data with multiple error types' }
      );
      
      expect(result.result).toBe('Successfully recovered from all error types');
      expect(run).toHaveBeenCalledTimes(errorTypes.length + 1);
    });

    it('should gracefully handle malformed OpenAI responses', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock malformed responses followed by valid response
      (run as any)
        .mockResolvedValueOnce({}) // Missing finalOutput
        .mockResolvedValueOnce({ finalOutput: null }) // Null finalOutput
        .mockResolvedValueOnce({ finalOutput: {} }) // Empty finalOutput
        .mockResolvedValueOnce({
          finalOutput: { result: 'Valid response after malformed ones' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'malformed-response-task-456',
        { testData: 'context data with malformed responses' }
      );
      
      expect(result.result).toBe('Valid response after malformed ones');
      expect(run).toHaveBeenCalledTimes(4);
    });

    it('should handle OpenAI agent not found errors', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'NonExistent OpenAI Agent',
          'not-found-task-456',
          { testData: 'context data for non-existent agent' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI agent NonExistent OpenAI Agent not found');
    });
  });

  describe('Error Propagation and Logging', () => {
    it('should propagate OpenAI API errors with context information', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock API error with specific message
      (run as any).mockRejectedValue(new Error('Invalid API key provided'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'api-error-task-456',
          { testData: 'context data with API error' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Invalid API key provided');
      
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('should log errors appropriately during OpenAI handoff failures', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock API error
      (run as any).mockRejectedValue(new Error('OpenAI service overloaded'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'logging-error-task-456',
          { testData: 'context data with logging' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI service overloaded');
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Handoff to OpenAI agent Test OpenAI Agent failed:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error objects thrown by OpenAI SDK', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock throwing a string instead of an Error object
      (run as any).mockRejectedValue('String error from OpenAI SDK');
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'string-error-task-456',
          { testData: 'context data with string error' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: String error from OpenAI SDK');
      
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle retry configuration edge cases', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Test with zero retries
      (handoffSystem as any).retryConfig = {
        maxRetries: 0,
        retryDelayMs: 100,
        exponentialBackoff: false
      };
      
            (run as any).mockRejectedValue(new Error('Immediate failure with zero retries'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'zero-retry-task-456',
          { testData: 'context data with zero retries' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Immediate failure with zero retries');
      
      expect(run).toHaveBeenCalledTimes(1); // No retries
    });

    it('should handle negative retry delay configuration', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Test with negative retry delay
      (handoffSystem as any).retryConfig = {
        maxRetries: 2,
        retryDelayMs: -100, // Negative delay
        exponentialBackoff: false
      };
      
            (run as any)
              .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Completed despite negative delay' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'negative-delay-task-456',
        { testData: 'context data with negative delay' }
      );
      
      expect(result.result).toBe('Completed despite negative delay');
      expect(run).toHaveBeenCalledTimes(2);
    });

    it('should handle extremely high retry counts without stack overflow', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Test with high retry count but fail early
      (handoffSystem as any).retryConfig = {
        maxRetries: 100,
        retryDelayMs: 1,
        exponentialBackoff: false
      };
      
      // Fail first few times then succeed
      let callCount = 0;
      (run as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 5) {
          return Promise.reject(new Error(`Failure ${callCount}`));
        }
        return Promise.resolve({
          finalOutput: { result: 'Completed after 5 failures' }
        });
      });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'high-retry-task-456',
        { testData: 'context data with high retries' }
      );
      
      expect(result.result).toBe('Completed after 5 failures');
      expect(run).toHaveBeenCalledTimes(5);
    }, 15000); // Longer timeout for high retry test
  });
});