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

describe('OpenAI Handoff Lifecycle Hooks', () => {
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
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Hook Registration and Execution', () => {
    it('should execute onHandoffStart hook when OpenAI handoff begins', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-test-task-456',
        { testData: 'context data for hook test' }
      );
      
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-test-task-456'
      );
      
      // Complete hook should also be called
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-test-task-456',
        expect.any(Number) // Duration
      );
      
      // Error hook should not be called
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
    });

    it('should execute onHandoffComplete hook with accurate timing information', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
            (run as any).mockImplementation(async () => {
              // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockRunResult;
      });
      
      const startTime = performance.now();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'timing-test-task-456',
        { testData: 'context data for timing test' }
      );
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'timing-test-task-456',
        expect.closeTo(actualDuration, 100) // Allow 100ms tolerance for test environments
      );
      
      // Wait for any asynchronous operations
      await vi.waitFor(() => expect(hooks.onHandoffComplete).toHaveBeenCalled());
    });

    it('should execute onHandoffError hook when OpenAI handoff fails', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const errorMessage = 'OpenAI API authentication failed';
      (run as any).mockRejectedValue(new Error(errorMessage));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'error-hook-test-task-456',
          { testData: 'context data for error hook test' }
        )
      ).rejects.toThrow(`Failed to handoff to OpenAI agent: ${errorMessage}`);
      
      // Start hook should be called
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'error-hook-test-task-456'
      );
      
      // Error hook should be called with proper error
      expect(hooks.onHandoffError).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'error-hook-test-task-456',
        expect.any(Error)
      );
      
            const errorArg = (hooks.onHandoffError as any).mock.calls[0][3];
      expect(errorArg.message).toBe(`Failed to handoff to OpenAI agent: ${errorMessage}`);
      
      // Complete hook should not be called
      expect(hooks.onHandoffComplete).not.toHaveBeenCalled();
    });
  });

  describe('Hook Error Handling', () => {
    it('should continue OpenAI handoff execution even if onHandoffStart hook throws', async () => {
      const hooks = {
        onHandoffStart: vi.fn(() => {
          throw new Error('Hook start error');
        }),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Spy on console.error to verify hook error is logged
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed despite hook error' }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-error-test-task-456',
        { testData: 'context data for hook error test' }
      );
      
      expect(result.result).toBe('Task completed despite hook error');
      
      // Hook should have been called
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-error-test-task-456'
      );
      
      // Complete hook should still be called
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'hook-error-test-task-456',
        expect.any(Number)
      );
      
      // Error hook should not be called for hook errors
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
      
      // Hook error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in onHandoffStart hook:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should continue OpenAI handoff execution even if onHandoffComplete hook throws', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(() => {
          throw new Error('Hook complete error');
        }),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Spy on console.error to verify hook error is logged
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed despite complete hook error' }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'complete-hook-error-test-task-456',
        { testData: 'context data for complete hook error test' }
      );
      
      expect(result.result).toBe('Task completed despite complete hook error');
      
      // Start hook should be called
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'complete-hook-error-test-task-456'
      );
      
      // Complete hook should have been called
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'complete-hook-error-test-task-456',
        expect.any(Number)
      );
      
      // Error hook should not be called for hook errors
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
      
      // Hook error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in onHandoffComplete hook:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in onHandoffError hook without affecting error reporting', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn(() => {
          throw new Error('Hook error handler error');
        })
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Spy on console.error to verify hook error is logged
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const errorMessage = 'OpenAI service unavailable';
      (run as any).mockRejectedValue(new Error(errorMessage));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'error-handler-error-test-task-456',
          { testData: 'context data for error handler error test' }
        )
      ).rejects.toThrow(`Failed to handoff to OpenAI agent: ${errorMessage}`);
      
      // Start hook should be called
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'error-handler-error-test-task-456'
      );
      
      // Error hook should have been called
      expect(hooks.onHandoffError).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'error-handler-error-test-task-456',
        expect.any(Error)
      );
      
      // Complete hook should not be called
      expect(hooks.onHandoffComplete).not.toHaveBeenCalled();
      
      // Hook error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in onHandoffError hook:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Hook Timing and Order', () => {
    it('should execute hooks in correct order during successful OpenAI handoff', async () => {
      const executionOrder: string[] = [];
      
      const hooks = {
        onHandoffStart: vi.fn(() => {
          executionOrder.push('start');
        }),
        onHandoffComplete: vi.fn(() => {
          executionOrder.push('complete');
        }),
        onHandoffError: vi.fn(() => {
          executionOrder.push('error');
        })
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'order-test-task-456',
        { testData: 'context data for order test' }
      );
      
      // Should execute start then complete, not error
      expect(executionOrder).toEqual(['start', 'complete']);
    });

    it('should execute hooks in correct order during failed OpenAI handoff', async () => {
      const executionOrder: string[] = [];
      
      const hooks = {
        onHandoffStart: vi.fn(() => {
          executionOrder.push('start');
        }),
        onHandoffComplete: vi.fn(() => {
          executionOrder.push('complete');
        }),
        onHandoffError: vi.fn(() => {
          executionOrder.push('error');
        })
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
            (run as any).mockRejectedValue(new Error('OpenAI API error'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'error-order-test-task-456',
          { testData: 'context data for error order test' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI API error');
      
      // Should execute start then error, not complete
      expect(executionOrder).toEqual(['start', 'error']);
    });

    it('should execute hooks with correct parameters for complex handoff scenarios', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: {
          result: 'Complex task completed',
          metadata: {
            taskId: 'complex-task-789',
            agentChain: ['agent-1', 'Test OpenAI Agent', 'agent-3'],
            processingSteps: 5
          }
        }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      const complexContext = {
        userData: { id: 'user-456', preferences: { theme: 'dark' } },
        taskData: {
          id: 'complex-task-789',
          description: 'Multi-step processing task',
          priority: 'high',
          dependencies: ['task-123', 'task-456']
        },
        processingHistory: [
          { agent: 'agent-1', timestamp: Date.now() - 1000, result: 'data-collected' }
        ]
      };
      
      await (handoffSystem as any).initiateHandoff(
        'agent-1',
        'Test OpenAI Agent',
        'complex-task-789',
        complexContext
      );
      
      // Verify start hook parameters
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'agent-1',
        'Test OpenAI Agent',
        'complex-task-789'
      );
      
      // Verify complete hook parameters
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'agent-1',
        'Test OpenAI Agent',
        'complex-task-789',
        expect.any(Number) // Duration
      );
      
      // Error hook should not be called
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
    });
  });

  describe('Hook Integration with Retry Logic', () => {
    it('should execute hooks appropriately during OpenAI handoff retries', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure retry settings
      (handoffSystem as any).retryConfig = {
        maxRetries: 3,
        retryDelayMs: 50,
        exponentialBackoff: false
      };
      
      // Fail twice, then succeed
      (run as any)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed on third attempt' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'retry-hook-test-task-456',
        { testData: 'context data for retry hook test' }
      );
      
      expect(result.result).toBe('Task completed on third attempt');
      
      // Start hook should be called once
      expect(hooks.onHandoffStart).toHaveBeenCalledTimes(1);
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'retry-hook-test-task-456'
      );
      
      // Error hook should be called for each failure attempt
      expect(hooks.onHandoffError).toHaveBeenCalledTimes(2);
      
      // Complete hook should be called once (for final success)
      expect(hooks.onHandoffComplete).toHaveBeenCalledTimes(1);
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'retry-hook-test-task-456',
        expect.any(Number)
      );
    });

    it('should execute error hook for each failed OpenAI attempt', async () => {
      const errorHookCalls: any[] = [];
      
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn((source, target, taskId, error) => {
          errorHookCalls.push({ source, target, taskId, error: error.message });
        })
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure retry settings
      (handoffSystem as any).retryConfig = {
        maxRetries: 3,
        retryDelayMs: 25,
        exponentialBackoff: true
      };
      
      // Fail all attempts
      (run as any)
        .mockRejectedValueOnce(new Error('Attempt 1: Network error'))
        .mockRejectedValueOnce(new Error('Attempt 2: Timeout'))
        .mockRejectedValueOnce(new Error('Attempt 3: Service unavailable'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'all-fail-hook-test-task-456',
          { testData: 'context data for all fail hook test' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Attempt 3: Service unavailable');
      
      // Start hook should be called once
      expect(hooks.onHandoffStart).toHaveBeenCalledTimes(1);
      
      // Error hook should be called for each failure
      expect(hooks.onHandoffError).toHaveBeenCalledTimes(3);
      
      // Verify error hook calls have correct information
      expect(errorHookCalls).toEqual([
        {
          source: 'source-agent-123',
          target: 'Test OpenAI Agent',
          taskId: 'all-fail-hook-test-task-456',
          error: 'Failed to handoff to OpenAI agent: Attempt 1: Network error'
        },
        {
          source: 'source-agent-123',
          target: 'Test OpenAI Agent',
          taskId: 'all-fail-hook-test-task-456',
          error: 'Failed to handoff to OpenAI agent: Attempt 2: Timeout'
        },
        {
          source: 'source-agent-123',
          target: 'Test OpenAI Agent',
          taskId: 'all-fail-hook-test-task-456',
          error: 'Failed to handoff to OpenAI agent: Attempt 3: Service unavailable'
        }
      ]);
      
      // Complete hook should not be called
      expect(hooks.onHandoffComplete).not.toHaveBeenCalled();
    });
  });
});