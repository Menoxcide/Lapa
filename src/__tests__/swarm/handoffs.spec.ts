import { HybridHandoffSystem } from '../../src/orchestrator/handoffs';
import { Agent } from '@openai/agents';

// Mock the OpenAI agents SDK
jest.mock('@openai/agents', () => {
  return {
    run: jest.fn()
  };
});

// Import the mocked run function
import { run } from '@openai/agents';

describe('HybridHandoffSystem', () => {
  let handoffSystem: HybridHandoffSystem;
  let mockOpenAIAgent: Agent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    mockOpenAIAgent = {
      id: 'test-agent',
      name: 'Test OpenAI Agent',
      instructions: 'Test instructions',
      tools: [],
      model: 'gpt-4'
    } as Agent;
    
    // Clear all mocks before each test
    jest.clearAllMocks();
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
      
      (run as jest.Mock).mockResolvedValue(mockEvaluationResult);
      
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
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(true);
      expect(evaluation.targetAgentId).toBe('target-agent-123');
      expect(evaluation.confidence).toBe(0.95);
      expect(evaluation.reason).toBe('High complexity task detected');
      expect(run).toHaveBeenCalledWith(
        mockOpenAIAgent,
        expect.stringContaining('Evaluate this context for handoff')
      );
    });

    it('should use default policy when OpenAI evaluation is disabled', async () => {
      // Create handoff system with OpenAI evaluation disabled
      handoffSystem = new HybridHandoffSystem({ enableOpenAIEvaluation: false });
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0.5);
      expect(evaluation.reason).toBe('OpenAI evaluation disabled, using default policy');
    });

    it('should use default policy when no OpenAI agents are registered', async () => {
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0.5);
      expect(evaluation.reason).toBe('No evaluator agent available');
    });

    it('should handle evaluation errors gracefully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock an error response from the OpenAI agent
      (run as jest.Mock).mockRejectedValue(new Error('API timeout'));
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0);
      expect(evaluation.reason).toContain('Evaluation error: API timeout');
    });
  });

  describe('Handoff Initiation with OpenAI Agents', () => {
    it('should initiate handoff to OpenAI agent successfully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed successfully' }
      };
      
      (run as jest.Mock).mockResolvedValue(mockRunResult);
      
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
      (run as jest.Mock)
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
      expect(run).toHaveBeenCalledTimes(3);
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
      (run as jest.Mock).mockRejectedValue(new Error('Persistent error'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'task-456',
          { testData: 'sample context data' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Persistent error');
      
      expect(run).toHaveBeenCalledTimes(2); // Max retries
    });

    it('should initiate handoff to regular LAPA agent when target is not an OpenAI agent', async () => {
      // Mock the context handoff manager
      const mockContextHandoffManager = {
        initiateHandoff: jest.fn(),
        completeHandoff: jest.fn()
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
        onHandoffStart: jest.fn(),
        onHandoffComplete: jest.fn(),
        onHandoffError: jest.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockRunResult = {
        finalOutput: { result: 'Task completed' }
      };
      
      (run as jest.Mock).mockResolvedValue(mockRunResult);
      
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
      
      expect(hooks.onHandoffError).not.toHaveBeenCalled();
    });

    it('should call error hook when handoff fails', async () => {
      const hooks = {
        onHandoffStart: jest.fn(),
        onHandoffComplete: jest.fn(),
        onHandoffError: jest.fn()
      };
      
      handoffSystem = new HybridHandoffSystem({}, hooks);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock an error
      (run as jest.Mock).mockRejectedValue(new Error('Handoff failed'));
      
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
      (run as jest.Mock).mockImplementation(async () => {
        // Simulate a delay longer than the target
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockRunResult;
      });
      
      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
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
      (run as jest.Mock).mockResolvedValue(mockRunResult);
      
      // Spy on console.warn to ensure it's not called
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
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