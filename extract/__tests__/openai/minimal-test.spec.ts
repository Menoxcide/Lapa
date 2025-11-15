import { describe, it, expect } from "vitest";
import { Task } from '../../agents/moe-router.ts';
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
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

describe('Minimal Hybrid Handoff Test', () => {
  let handoffSystem: HybridHandoffSystem;
  let mockOpenAIAgent: OpenAIAgent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    mockOpenAIAgent = {
      id: 'openai-agent-1',
      name: 'Test OpenAI Agent',
      instructions: 'Test instructions',
      tools: [],
      model: 'gpt-4'
    } as unknown as OpenAIAgent;
  });

  it('should execute task with handoff count tracking', async () => {
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
        result: 'Task completed successfully',
        confidence: 0.98
      }
    };
    
    (run as any)
      .mockResolvedValueOnce(mockEvaluationResult)
      .mockResolvedValueOnce(mockExecutionResult);
    
    const task: Task = {
      id: 'test-task-123',
      description: 'Test task',
      type: 'test',
      priority: 1
    };
    
    const result = await handoffSystem.executeTaskWithHandoffs(task, {
      userData: { id: 'user-456' },
      history: [],
      handoffCount: 0
    });
    
    expect(result.result).toBe('Task completed successfully');
    expect(result.confidence).toBe(0.98);
  }, 10000);
});