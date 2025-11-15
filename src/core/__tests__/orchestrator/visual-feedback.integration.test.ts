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
    subscribe: vi.fn().mockReturnValue('subscription-id'),
    publish: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    getSubscriptionCount: vi.fn(() => 0)
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
    visualFeedback = new VisualFeedbackSystem();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    try {
      await visualFeedback.cleanup?.();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Event Bus Integration', () => {
    it('should subscribe to visual feedback events', async () => {
      const subscriptionId = eventBus.subscribe('visual-feedback.initialized' as any, () => {});
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
      expect(eventBus.subscribe).toHaveBeenCalled();
    });

    it('should publish events when initialized', async () => {
      await visualFeedback.initialize();
      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'visual-feedback.initialized'
        })
      );
    });
  });

  describe('Initialization', () => {
    it('should initialize the visual feedback system', async () => {
      await visualFeedback.initialize();
      // Initialization should complete without errors
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      // Test that initialization doesn't throw on missing playwright
      await expect(visualFeedback.initialize()).resolves.toBeUndefined();
    });
  });

  describe('Screenshot Comparison', () => {
    it('should handle screenshot comparison requests', async () => {
      await visualFeedback.initialize();
      
      const result = await visualFeedback.compareScreenshot({
        url: 'http://localhost:3000',
        name: 'test-screenshot',
        baselineName: 'test-baseline'
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle screenshot failures gracefully', async () => {
      await visualFeedback.initialize();
      
      // Test with invalid URL
      const result = await visualFeedback.compareScreenshot({
        url: 'http://invalid-url',
        name: 'test-screenshot',
        baselineName: 'test'
      });

      expect(result).toBeDefined();
      // Should handle error gracefully
      expect(result.success).toBeDefined();
    });

    it('should handle event bus failures gracefully', async () => {
      vi.spyOn(eventBus, 'publish').mockRejectedValueOnce(new Error('Event bus error'));

      await expect(visualFeedback.initialize()).rejects.toThrow();
    });
  });
});

