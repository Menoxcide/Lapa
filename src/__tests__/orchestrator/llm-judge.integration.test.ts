/**
 * Integration Tests for LLM Judge System
 * 
 * Tests LLM judge integration with:
 * - Agent systems
 * - Event bus
 * - Memory systems
 * - Decision making
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LLMJudge } from '../../orchestrator/llm-judge.ts';
import { eventBus } from '../../core/event-bus.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';

// Mock dependencies
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

vi.mock('../../local/memori-engine.ts', () => ({
  MemoriEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getRecentMemories: vi.fn().mockResolvedValue([])
  }))
}));

describe('LLM Judge Integration', () => {
  let llmJudge: LLMJudge;
  let memoriEngine: MemoriEngine;

  beforeEach(async () => {
    vi.clearAllMocks();
    memoriEngine = new MemoriEngine();
    await memoriEngine.initialize();
    llmJudge = new LLMJudge({ memoriEngine });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Decision Making', () => {
    it('should make decisions based on context', async () => {
      const decision = await llmJudge.makeDecision({
        question: 'Should we proceed with this implementation?',
        context: { complexity: 'high', risk: 'low' },
        options: ['proceed', 'reject', 'modify']
      });

      expect(decision).toBeDefined();
      expect(decision.choice).toBeDefined();
      expect(['proceed', 'reject', 'modify']).toContain(decision.choice);
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision.reasoning).toBeDefined();
    });

    it('should use memory context for decisions', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockResolvedValueOnce([
        {
          id: 'memory-1',
          agentId: 'system',
          content: 'Previous similar decision: proceed',
          importance: 0.9,
          timestamp: new Date()
        }
      ]);

      const decision = await llmJudge.makeDecision({
        question: 'Should we proceed?',
        context: {},
        options: ['proceed', 'reject']
      });

      expect(decision).toBeDefined();
      expect(memoriEngine.getRecentMemories).toHaveBeenCalled();
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish decision events', async () => {
      await llmJudge.makeDecision({
        question: 'Test question',
        context: {},
        options: ['option1', 'option2']
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'llm.judge.decision'
        })
      );
    });

    it('should subscribe to decision request events', async () => {
      const events: any[] = [];
      eventBus.subscribe('llm.judge.request', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'request-1',
        type: 'llm.judge.request',
        timestamp: Date.now(),
        source: 'test',
        payload: { question: 'Test', options: ['a', 'b'] }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.question).toBe('Test');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid decision requests', async () => {
      await expect(llmJudge.makeDecision(null as any)).rejects.toThrow();
      await expect(llmJudge.makeDecision(undefined as any)).rejects.toThrow();
    });

    it('should handle empty options', async () => {
      await expect(llmJudge.makeDecision({
        question: 'Test',
        context: {},
        options: []
      })).rejects.toThrow();
    });

    it('should handle memory retrieval failures', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockRejectedValueOnce(
        new Error('Memory unavailable')
      );

      await expect(llmJudge.makeDecision({
        question: 'Test',
        context: {},
        options: ['option1']
      })).rejects.toThrow('Memory unavailable');
    });
  });
});

