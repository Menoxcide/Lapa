import { describe, it, expect } from "vitest";
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { LangGraphOrchestrator } from '../../swarm/langgraph.orchestrator.ts';
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

describe('HybridHandoffSystem', () => {
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

  describe('Handoff Evaluation', () => {
    it('should evaluate handoff with OpenAI agent when enabled', async () => {
      // Register the mock agent
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the OpenAI agent response
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'target-agent-123',
          confidence: 0.95,
          reason: 'High complexity task detected'
        }
      };
      
            (run as any).mockResolvedValue(mockEvaluationResult);
      
      // Create a test context
      const testContext = {
        task: {
          id: 'task-123',
          description: 'Complex data analysis task',
          input: 'Analyze sales data for Q4',
          priority: 'high'
        },
        context: {
          userData: { id: 'user-456', preferences: {} },
          history: []
        }
      };
      
      // Private method access through casting
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext, testContext.task);
      
      expect(evaluation.shouldHandoff).toBe(true);
      expect(evaluation.targetAgentId).toBe('target-agent-123');
      expect(evaluation.confidence).toBeCloseTo(0.95);
      expect(evaluation.reason).toBe('High complexity task detected');
      expect(run).toHaveBeenCalledWith(
        mockOpenAIAgent,
        expect.stringContaining('Evaluate this context and task for handoff')
      );
    });

    it('should use default policy when OpenAI evaluation is disabled', async () => {
      // Create handoff system with OpenAI evaluation disabled
      handoffSystem = new HybridHandoffSystem({ enableOpenAIEvaluation: false });
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext, testContext.task);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBeCloseTo(0); // No confidence when no agents
      expect(evaluation.reason).toBe('No evaluator agent available');
    });

    it('should use default policy when no OpenAI agents are registered', async () => {
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext, testContext.task);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBeCloseTo(0.5, 1); // Default confidence when evaluation is disabled
      expect(evaluation.reason).toBe('No evaluator agent available');
    });

    it('should handle evaluation errors gracefully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock an error response from the OpenAI agent
      (run as any).mockRejectedValue(new Error('API timeout'));
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext, testContext.task);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBeCloseTo(0); // No confidence when error occurs
      expect(evaluation.reason).toContain('Evaluation error: API timeout');
    });
  });

  describe('Handoff Initiation with OpenAI Agents', () => {
    it('should initiate handoff to OpenAI agent successfully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed successfully' }
      };
      
            (run as any).mockResolvedValue(mockRunResult);
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent', // Using the agent name
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(result.result).toBe('Task completed successfully');
      expect(run).toHaveBeenCalled();
    });

    it('should retry failed handoff to OpenAI agent', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the retry configuration for faster testing
      (handoffSystem as any).retryConfig = {
        maxRetries: 3,
        retryDelayMs: 10,
        exponentialBackoff: false
      };
      
      // Fail twice, then succeed
      (run as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed on third attempt' }
        });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(result.result).toBe('Task completed on third attempt');
      expect(run).toHaveBeenCalledTimes(3); // Verify call count
    });

    it('should fail handoff after max retries exceeded', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the retry configuration for faster testing
      (handoffSystem as any).retryConfig = {
        maxRetries: 2,
        retryDelayMs: 10,
        exponentialBackoff: false
      };
      
      // Always fail
      (run as any).mockRejectedValue(new Error('Persistent error'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'task-456',
          { testData: 'sample context data' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Persistent error');
      
      expect(run).toHaveBeenCalledTimes(3); // Verify call count
    });

    it('should initiate handoff to regular LAPA agent when target is not an OpenAI agent', async () => {
      // Mock the context handoff manager
      const mockContextHandoffManager = {
        initiateHandoff: vi.fn(),
        completeHandoff: vi.fn()
      };
      
      // Inject the mock
      (handoffSystem as any).contextHandoffManager = mockContextHandoffManager;
      
      // Mock successful handoff initiation
      mockContextHandoffManager.initiateHandoff.mockResolvedValue({
        success: true,
        handoffId: 'handoff-123',
        compressedSize: 1024,
        transferTime: 50
      });
      
      // Mock successful handoff completion
      mockContextHandoffManager.completeHandoff.mockResolvedValue({
        result: 'Handoff completed successfully'
      });
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'regular-lapa-agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(result.result).toBe('Handoff completed successfully');
      expect(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
      expect(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call lifecycle hooks during handoff process', async () => {
      // Create handoff system with hooks
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
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456'
      );
      
      expect(hooks.onHandoffComplete).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        expect.any(Number) // Duration
      );
      
      // Wait for any asynchronous operations
      await vi.waitFor(() => expect(hooks.onHandoffComplete).toHaveBeenCalled());
      
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
    });

    it('should call error hook when handoff fails', async () => {
      const hooks = {
        onHandoffStart: vi.fn(),
        onHandoffComplete: vi.fn(),
        onHandoffError: vi.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock an error
      (run as any).mockRejectedValue(new Error('Handoff failed'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'task-456',
          { testData: 'sample context data' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Handoff failed');
      
      expect(hooks.onHandoffStart).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456'
      );
      
      expect(hooks.onHandoffError).toHaveBeenCalledWith(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        expect.any(Error)
      );
      
      expect(hooks.onHandoffComplete).not.toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should warn when handoff latency exceeds target', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure a very short latency target for testing
      handoffSystem.updateConfig({ latencyTargetMs: 1 });
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
      // Mock a slow response
      (run as any).mockImplementation(async () => {
        // Simulate a delay longer than the target
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockRunResult;
      });
      
      // Spy on console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handoff latency target exceeded')
      );
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should meet latency target for fast handoffs', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure a reasonable latency target
      handoffSystem.updateConfig({ latencyTargetMs: 1000 });
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
      // Mock a fast response
      (run as any).mockResolvedValue(mockRunResult);
      
      // Spy on console.warn to ensure it's not called
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Handoff latency target exceeded')
      );
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should complete handoff in under 2 seconds', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
      // Mock a response
      (run as any).mockResolvedValue(mockRunResult);
      
      // Measure execution time
      const startTime = Date.now();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const initialConfig = handoffSystem.getConfig();
      expect(initialConfig.enableOpenAIEvaluation).toBe(true);
      expect(initialConfig.confidenceThreshold).toBe(0.8);
      expect(initialConfig.latencyTargetMs).toBe(2000);
      
      handoffSystem.updateConfig({
        enableOpenAIEvaluation: false,
        confidenceThreshold: 0.9,
        latencyTargetMs: 1500,
        maxHandoffDepth: 5
      });
      
      const updatedConfig = handoffSystem.getConfig();
      expect(updatedConfig.enableOpenAIEvaluation).toBe(false);
      expect(updatedConfig.confidenceThreshold).toBe(0.9);
      expect(updatedConfig.latencyTargetMs).toBe(1500);
    });
  });
});