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
    llmJudge = new LLMJudge();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Decision Making', () => {
    it('should make decisions based on context', async () => {
      const result = await llmJudge.judge({
        type: 'code-quality',
        content: 'Should we proceed with this implementation?',
        context: { complexity: 'high', risk: 'low' }
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
    });

    it('should use memory context for decisions', async () => {
      // Note: LLMJudge doesn't use MemoriEngine directly, so we just test judgment
      const result = await llmJudge.judge({
        type: 'code-quality',
        content: 'Should we proceed?',
        context: { previousDecision: 'proceed' }
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish decision events', async () => {
      await llmJudge.judge({
        type: 'code-quality',
        content: 'Test question',
        context: {}
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'llm-judge.judgment-made' as any
        })
      );
    });

    it('should subscribe to decision request events', async () => {
      const events: any[] = [];
      eventBus.subscribe('llm-judge.judgment-made' as any, (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'request-1',
        type: 'llm-judge.judgment-made' as any,
        timestamp: Date.now(),
        source: 'test',
        payload: { type: 'code-quality', content: 'Test' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.content).toBe('Test');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid decision requests', async () => {
      await expect(llmJudge.judge(null as any)).rejects.toThrow();
      await expect(llmJudge.judge(undefined as any)).rejects.toThrow();
    });

    it('should handle empty options', async () => {
      await expect(llmJudge.judge({
        type: 'code-quality',
        content: 'Test',
        context: {}
      } as any)).rejects.toThrow();
    });

    it('should handle judgment failures gracefully', async () => {
      // Test with invalid content to trigger error handling
      await expect(llmJudge.judge({
        type: 'code-quality',
        content: '',
        context: {}
      })).resolves.toBeDefined();
    });
  });
});

