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

describe('OpenAI Agent Integration', () => {
  let handoffSystem: HybridHandoffSystem;
  let mockOpenAIAgent: Agent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    mockOpenAIAgent = {
      id: 'openai-agent-1',
      name: 'Test OpenAI Agent',
      instructions: 'Test instructions',
      tools: [],
      model: 'gpt-4'
    } as Agent;
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('OpenAI Agent Registration', () => {
    it('should register OpenAI agent successfully', () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Access private property through casting to verify registration
      const registeredAgents = (handoffSystem as any).openAIAgents;
      expect(registeredAgents.size).toBe(1);
      expect(registeredAgents.get('Test OpenAI Agent')).toBe(mockOpenAIAgent);
    });

    it('should register multiple OpenAI agents', () => {
      const mockOpenAIAgent2 = {
        id: 'openai-agent-2',
        name: 'Test OpenAI Agent 2',
        instructions: 'Test instructions 2',
        tools: [],
        model: 'gpt-4'
      } as Agent;
      
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent2);
      
      const registeredAgents = (handoffSystem as any).openAIAgents;
      expect(registeredAgents.size).toBe(2);
      expect(registeredAgents.get('Test OpenAI Agent')).toBe(mockOpenAIAgent);
      expect(registeredAgents.get('Test OpenAI Agent 2')).toBe(mockOpenAIAgent2);
    });

    it('should overwrite existing agent when registering with same name', () => {
      const updatedMockAgent = {
        id: 'openai-agent-1-updated',
        name: 'Test OpenAI Agent',
        instructions: 'Updated instructions',
        tools: [],
        model: 'gpt-4-turbo'
      } as Agent;
      
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      handoffSystem.registerOpenAIAgent(updatedMockAgent);
      
      const registeredAgents = (handoffSystem as any).openAIAgents;
      expect(registeredAgents.size).toBe(1);
      expect(registeredAgents.get('Test OpenAI Agent')).toBe(updatedMockAgent);
    });
  });

  describe('OpenAI Agent Evaluation', () => {
    it('should evaluate handoff using registered OpenAI agent', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'specialized-agent-789',
          confidence: 0.92,
          reason: 'Task requires specialized knowledge in data analysis'
        }
      };
      
      (run as jest.Mock).mockResolvedValue(mockEvaluationResult);
      
      const testContext = {
        task: {
          id: 'analysis-task-123',
          description: 'Complex data analysis task',
          input: 'Analyze quarterly sales data',
          priority: 'high'
        },
        context: {
          userData: { id: 'user-456', preferences: { timezone: 'EST' } },
          history: [{ taskId: 'prev-task-789', result: 'data collected' }]
        }
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(true);
      expect(evaluation.targetAgentId).toBe('specialized-agent-789');
      expect(evaluation.confidence).toBe(0.92);
      expect(evaluation.reason).toBe('Task requires specialized knowledge in data analysis');
      expect(run).toHaveBeenCalledWith(
        mockOpenAIAgent,
        expect.stringContaining('Evaluate this context for handoff')
      );
    });

    it('should handle evaluation with minimal response from OpenAI agent', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: false
        }
      };
      
      (run as jest.Mock).mockResolvedValue(mockEvaluationResult);
      
      const testContext = {
        task: {
          id: 'simple-task-123',
          description: 'Simple task',
          input: 'Basic processing',
          priority: 'low'
        },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0); // Default when not provided
      expect(evaluation.reason).toBe('No specific reason provided'); // Default when not provided
    });

    it('should handle malformed response from OpenAI agent gracefully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockEvaluationResult = {
        finalOutput: null // Malformed response
      };
      
      (run as jest.Mock).mockResolvedValue(mockEvaluationResult);
      
      const testContext = {
        task: {
          id: 'task-123',
          description: 'Test task',
          input: 'Test input',
          priority: 'medium'
        },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0);
      expect(evaluation.reason).toBe('No specific reason provided');
    });
  });

  describe('OpenAI Agent Execution', () => {
    it('should execute task on OpenAI agent successfully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockExecutionResult = {
        finalOutput: {
          result: 'Analysis completed successfully',
          insights: ['Revenue increased by 15%', 'Customer satisfaction improved'],
          nextSteps: 'Review quarterly report'
        }
      };
      
      (run as jest.Mock).mockResolvedValue(mockExecutionResult);
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'analysis-task-456',
        { 
          taskData: 'Quarterly sales data', 
          parameters: { quarter: 'Q4', year: 2025 } 
        }
      );
      
      expect(result.result).toBe('Analysis completed successfully');
      expect(result.insights).toEqual(['Revenue increased by 15%', 'Customer satisfaction improved']);
      expect(result.nextSteps).toBe('Review quarterly report');
      expect(run).toHaveBeenCalledWith(
        mockOpenAIAgent,
        expect.stringContaining('Process this task:')
      );
    });

    it('should handle execution with empty response from OpenAI agent', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockExecutionResult = {
        finalOutput: {} // Empty response
      };
      
      (run as jest.Mock).mockResolvedValue(mockExecutionResult);
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'sample context data' }
      );
      
      expect(result).toEqual({});
    });

    it('should reject when OpenAI agent execution throws error', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      (run as jest.Mock).mockRejectedValue(new Error('OpenAI API rate limit exceeded'));
      
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          'task-456',
          { testData: 'sample context data' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI API rate limit exceeded');
      
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle evaluation when no OpenAI agents are registered', async () => {
      // Not registering any agents
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0.5);
      expect(evaluation.reason).toBe('No evaluator agent available');
    });

    it('should handle execution when target OpenAI agent is not found', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockExecutionResult = {
        finalOutput: { result: 'Task completed' }
      };
      
      (run as jest.Mock).mockResolvedValue(mockExecutionResult);
      
      // Try to handoff to non-existent agent
      await expect(
        (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'NonExistent OpenAI Agent',
          'task-456',
          { testData: 'sample context data' }
        )
      ).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI agent NonExistent OpenAI Agent not found');
    });

    it('should handle evaluation when OpenAI agent throws error', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      (run as jest.Mock).mockRejectedValue(new Error('Network connectivity issue'));
      
      const testContext = {
        task: { id: 'task-123', description: 'Test task' },
        context: {}
      };
      
      const evaluation = await (handoffSystem as any).evaluateHandoff(testContext);
      
      expect(evaluation.shouldHandoff).toBe(false);
      expect(evaluation.confidence).toBe(0);
      expect(evaluation.reason).toBe('Evaluation error: Network connectivity issue');
    });
  });
});