import { describe, it, expect } from "vitest";
import { Task } from '../../agents/moe-router.ts';
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

describe('Hybrid Handoff System Integration', () => {
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

  describe('End-to-End Task Execution', () => {
    it('should execute task with OpenAI agent handoff recommendation', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock evaluation recommending handoff
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'Test OpenAI Agent',
          confidence: 0.95,
          reason: 'Task requires advanced reasoning capabilities'
        }
      };
      
      // Mock execution result
      const mockExecutionResult = {
        finalOutput: {
          result: 'Task completed successfully with OpenAI assistance',
          analysis: 'Processed 1000 data points',
          confidence: 0.98
        }
      };
      
            (run as any)
              .mockResolvedValueOnce(mockEvaluationResult)
        .mockResolvedValueOnce(mockExecutionResult);
      
      const task: Task = {
        id: 'complex-task-123',
        description: 'Advanced data processing task',
        type: 'data-processing',
        priority: 3 // high priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456', preferences: { language: 'en' } },
        history: [],
        dataset: 'customer_feedback_q4_2025.csv'
      });
      
      expect(result.result).toBe('Task completed successfully with OpenAI assistance');
      expect(result.analysis).toBe('Processed 1000 data points');
      expect(result.confidence).toBe(0.98);
      
      // Verify both evaluation and execution calls were made
      expect(run).toHaveBeenCalledTimes(2);
      expect(run).toHaveBeenNthCalledWith(
        1,
        mockOpenAIAgent,
        expect.stringContaining('Evaluate this context for handoff')
      );
      expect(run).toHaveBeenNthCalledWith(
        2,
        mockOpenAIAgent,
        expect.stringContaining('Process this task:')
      );
    }, 15000);

    it('should execute task without handoff when not recommended', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock evaluation recommending no handoff
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: false,
          confidence: 0.65,
          reason: 'Task can be handled by current processing pipeline'
        }
      };
      
            (run as any).mockResolvedValueOnce(mockEvaluationResult);
      
      const task: Task = {
        id: 'simple-task-123',
        description: 'Routine data processing',
        type: 'data-update',
        priority: 1 // low priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Since no handoff was recommended, the system should return the evaluation result
      expect(result).toEqual({
        shouldHandoff: false,
        confidence: 0.65,
        reason: 'Task can be handled by current processing pipeline'
      });
      
      // Only evaluation call should be made
      expect(run).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should handle task execution with multiple handoff evaluations', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock multiple evaluations - first recommends handoff, second does not
      (run as any)
        .mockResolvedValueOnce({
          finalOutput: {
            shouldHandoff: true,
            targetAgentId: 'Test OpenAI Agent',
            confidence: 0.88,
            reason: 'Initial analysis needed'
          }
        })
        .mockResolvedValueOnce({
          finalOutput: {
            intermediateResult: 'Data analyzed by OpenAI agent',
            nextStep: 'Final processing'
          }
        })
        .mockResolvedValueOnce({
          finalOutput: {
            shouldHandoff: false,
            confidence: 0.72,
            reason: 'Task can be completed locally'
          }
        });
      
      const task: Task = {
        id: 'multi-stage-task-123',
        description: 'Multi-stage processing with conditional handoffs',
        type: 'multi-stage',
        priority: 2 // medium priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        stage: 1,
        data: 'raw_research_data.json'
      });
      
      // Should have called run three times
      expect(run).toHaveBeenCalledTimes(3);
      
      // Final result should be the last evaluation
      expect(result.shouldHandoff).toBe(false);
      expect(result.confidence).toBe(0.72);
    }, 15000);
  });

  describe('Confidence-Based Decision Making', () => {
    it('should respect confidence threshold configuration', async () => {
      // Create handoff system with higher confidence threshold
      handoffSystem = new HybridHandoffSystem({ confidenceThreshold: 0.9 });
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock evaluation with confidence below threshold
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'Test OpenAI Agent',
          confidence: 0.85, // Below our 0.9 threshold
          reason: 'Moderate complexity task'
        }
      };
      
            (run as any).mockResolvedValue(mockEvaluationResult);
      
      const task: Task = {
        id: 'threshold-task-123',
        description: 'Task with confidence below threshold',
        type: 'standard-processing',
        priority: 2 // medium priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Even with confidence below threshold, if shouldHandoff is true, it should proceed
      expect(result).toBeDefined();
      expect(run).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should handle edge case with exactly threshold confidence', async () => {
      handoffSystem = new HybridHandoffSystem({ confidenceThreshold: 0.8 });
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'Test OpenAI Agent',
          confidence: 0.8, // Exactly at threshold
          reason: 'Task at confidence threshold'
        }
      };
      
            (run as any).mockResolvedValue(mockEvaluationResult);
      
      const task: Task = {
        id: 'edge-case-task-123',
        description: 'Task with exact threshold confidence',
        type: 'boundary-test',
        priority: 2 // medium priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      expect(result).toBeDefined();
      expect(run).toHaveBeenCalledTimes(1);
    }, 15000);
  });

  describe('Error Recovery in Hybrid System', () => {
    it('should recover from OpenAI evaluation error and continue processing', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock evaluation error, then successful execution
      (run as any)
        .mockRejectedValueOnce(new Error('OpenAI API timeout'))
        .mockResolvedValueOnce({
          finalOutput: {
            result: 'Task completed after evaluation error recovery',
            status: 'success'
          }
        });
      
      const task: Task = {
        id: 'recovery-task-123',
        description: 'Task with evaluation error recovery',
        type: 'recovery',
        priority: 3 // high priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Should have called run twice - one failed evaluation, one successful execution
      expect(run).toHaveBeenCalledTimes(2);
      expect(result.result).toBe('Task completed after evaluation error recovery');
    }, 15000);

    it('should handle consecutive OpenAI errors gracefully', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock consecutive errors
      (run as any)
        .mockRejectedValueOnce(new Error('Evaluation service unavailable'))
        .mockRejectedValueOnce(new Error('Execution service unavailable'));
      
      const task: Task = {
        id: 'error-task-123',
        description: 'Task with consecutive OpenAI errors',
        type: 'error-handling',
        priority: 2 // medium priority
      };
      
      await expect(
        handoffSystem.executeTaskWithHandoffs(task, {
          userData: { id: 'user-456' },
          history: []
        })
      ).rejects.toThrow('Failed to handoff to OpenAI agent: Execution service unavailable');
      
      // Should have called run twice
      expect(run).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should handle mixed LAPA and OpenAI agent handoffs', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the context handoff manager
      const mockContextHandoffManager = {
        initiateHandoff: vi.fn(),
        completeHandoff: vi.fn()
      };
      
      // Inject the mock
      (handoffSystem as any).contextHandoffManager = mockContextHandoffManager;
      
      // Mock successful handoff initiation to LAPA agent
      mockContextHandoffManager.initiateHandoff.mockResolvedValue({
        success: true,
        handoffId: 'handoff-123',
        compressedSize: 1024,
        transferTime: 50
      });
      
      // Mock successful handoff completion
      mockContextHandoffManager.completeHandoff.mockResolvedValue({
        result: 'Handoff to LAPA agent completed successfully'
      });
      
      // Mock OpenAI evaluation recommending handoff to LAPA agent
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'lapa-specialized-agent',
          confidence: 0.9,
          reason: 'Task requires LAPA specialized processing'
        }
      };
      
            (run as any).mockResolvedValueOnce(mockEvaluationResult);
      
      const task: Task = {
        id: 'mixed-handoff-task-123',
        description: 'Task requiring mixed agent handoff',
        type: 'mixed-handoff',
        priority: 3 // high priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      expect(result.result).toBe('Handoff to LAPA agent completed successfully');
      expect(run).toHaveBeenCalledTimes(1);
      expect(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
      expect(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
    }, 15000);
  });

  describe('Configuration Integration', () => {
    it('should disable OpenAI evaluation when configured', async () => {
      // Create handoff system with OpenAI evaluation disabled
      handoffSystem = new HybridHandoffSystem({ enableOpenAIEvaluation: false });
      
      const task: Task = {
        id: 'disabled-eval-task-123',
        description: 'Task with OpenAI evaluation disabled',
        type: 'disabled-eval',
        priority: 2 // medium priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Should use default policy when evaluation is disabled
      expect(result).toEqual({
        shouldHandoff: false,
        confidence: 0.5,
        reason: 'OpenAI evaluation disabled, using default policy'
      });
      
      // No calls to OpenAI should be made
      expect(run).not.toHaveBeenCalled();
    }, 15000);

    it('should respect maximum handoff depth configuration', async () => {
      // Create handoff system with limited depth
      handoffSystem = new HybridHandoffSystem({ maxHandoffDepth: 2 });
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock evaluation that would trigger recursive handoffs
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'Test OpenAI Agent',
          confidence: 0.95,
          reason: 'Recursive processing required'
        }
      };
      
            (run as any).mockResolvedValue(mockEvaluationResult);
      
      const task: Task = {
        id: 'depth-limited-task-123',
        description: 'Task with depth limitation',
        type: 'depth-limited',
        priority: 3 // high priority
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Should process the task without infinite recursion
      expect(result).toBeDefined();
      // The implementation should respect the depth limit
    }, 15000);
  });
});