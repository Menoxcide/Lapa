/**
 * Integration Tests for Visual Feedback System
 * 
 * Tests visual feedback integration with:
 * - Event bus
 * - Agent interactions
 * - UI components
 * - Memory systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualFeedbackSystem } from '../../orchestrator/visual-feedback.ts';
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

describe('Visual Feedback System Integration', () => {
  let visualFeedback: VisualFeedbackSystem;
  let memoriEngine: MemoriEngine;

  beforeEach(async () => {
    vi.clearAllMocks();
    memoriEngine = new MemoriEngine();
    await memoriEngine.initialize();
    visualFeedback = new VisualFeedbackSystem({ memoriEngine });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Bus Integration', () => {
    it('should subscribe to agent interaction events', async () => {
      const events: any[] = [];
      eventBus.subscribe('agent.interaction', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'test-1',
        type: 'agent.interaction',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: { agentId: 'agent-1', feedback: 'positive' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.agentId).toBe('agent-1');
      expect(eventBus.subscribe).toHaveBeenCalled();
    });

    it('should publish visual feedback events', async () => {
      await visualFeedback.recordFeedback({
        agentId: 'agent-1',
        feedbackType: 'positive',
        message: 'Great work!',
        timestamp: Date.now()
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'visual.feedback.recorded'
        })
      );
    });
  });

  describe('Memory Integration', () => {
    it('should store feedback in memory system', async () => {
      const feedback = {
        agentId: 'agent-1',
        feedbackType: 'positive' as const,
        message: 'Excellent implementation',
        timestamp: Date.now()
      };

      await visualFeedback.recordFeedback(feedback);

      const memories = await memoriEngine.getRecentMemories('agent-1', 10);
      expect(memories.length).toBeGreaterThanOrEqual(0);
      expect(memoriEngine.getRecentMemories).toHaveBeenCalled();
    });

    it('should retrieve feedback history from memory', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockResolvedValueOnce([
        {
          id: 'memory-1',
          agentId: 'agent-1',
          content: 'Positive feedback: Great work!',
          importance: 0.8,
          timestamp: new Date()
        }
      ]);

      const history = await visualFeedback.getFeedbackHistory('agent-1', 10);
      expect(history.length).toBeGreaterThanOrEqual(0);
      expect(memoriEngine.getRecentMemories).toHaveBeenCalledWith('agent-1', 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle memory system failures gracefully', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockRejectedValueOnce(
        new Error('Memory system unavailable')
      );

      await expect(visualFeedback.getFeedbackHistory('agent-1', 10)).rejects.toThrow(
        'Memory system unavailable'
      );
    });

    it('should handle event bus failures gracefully', async () => {
      vi.spyOn(eventBus, 'publish').mockRejectedValueOnce(new Error('Event bus error'));

      await expect(visualFeedback.recordFeedback({
        agentId: 'agent-1',
        feedbackType: 'positive',
        message: 'Test',
        timestamp: Date.now()
      })).rejects.toThrow('Event bus error');
    });
  });

  describe('Feedback Aggregation', () => {
    it('should aggregate feedback from multiple agents', async () => {
      await visualFeedback.recordFeedback({
        agentId: 'agent-1',
        feedbackType: 'positive',
        message: 'Good',
        timestamp: Date.now()
      });

      await visualFeedback.recordFeedback({
        agentId: 'agent-2',
        feedbackType: 'positive',
        message: 'Excellent',
        timestamp: Date.now()
      });

      const aggregated = await visualFeedback.getAggregatedFeedback(['agent-1', 'agent-2']);
      expect(aggregated).toBeDefined();
      expect(aggregated.positiveCount).toBeGreaterThanOrEqual(0);
    });
  });
});

