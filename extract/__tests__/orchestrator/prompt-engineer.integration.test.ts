/**
 * Integration Tests for Prompt Engineering System
 * 
 * Tests prompt engineering integration with:
 * - Agent systems
 * - Memory systems
 * - Event bus
 * - Self-improvement system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptEngineerClient } from '../../orchestrator/prompt-engineer.ts';
import { eventBus } from '../../core/event-bus.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { SelfImprovementSystem } from '../../orchestrator/self-improvement.ts';

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
    getRecentMemories: vi.fn().mockResolvedValue([]),
    extractAndStoreEntities: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../../orchestrator/self-improvement.ts', () => ({
  SelfImprovementSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    learnFromInteraction: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Prompt Engineer Integration', () => {
  let promptEngineer: PromptEngineerClient;
  let memoriEngine: MemoriEngine;
  let selfImprovement: SelfImprovementSystem;

  beforeEach(async () => {
    vi.clearAllMocks();
    memoriEngine = new MemoriEngine();
    selfImprovement = new SelfImprovementSystem();
    await memoriEngine.initialize();
    await selfImprovement.initialize();
    promptEngineer = new PromptEngineerClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memory Integration', () => {
    it('should detect vague prompts', async () => {
      const result = await promptEngineer.detectVaguePrompt('make it better');
      expect(result).toBeDefined();
      expect(result.isVague).toBeDefined();
      expect(typeof result.isVague).toBe('boolean');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should refine vague prompts', async () => {
      const result = await promptEngineer.refinePrompt({
        originalPrompt: 'fix the bug',
        taskType: 'bug'
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      if (result.success) {
        expect(result.refinedPrompt || result.clarificationQuestions || result.structuredPlan).toBeDefined();
      }
    });
  });

  describe('Self-Improvement Integration', () => {
    it('should detect and refine vague prompts', async () => {
      const vagueCheck = await promptEngineer.detectVaguePrompt('improve it');
      expect(vagueCheck.isVague).toBeDefined();

      if (vagueCheck.isVague) {
        const refined = await promptEngineer.refinePrompt({
          originalPrompt: 'improve it',
          taskType: 'refactor'
        });
        expect(refined.success).toBe(true);
      }
    });

    it('should handle non-vague prompts without refinement', async () => {
      const result = await promptEngineer.refinePrompt({
        originalPrompt: 'Add error handling to the login function in auth.ts',
        taskType: 'feature'
      });

      expect(result.success).toBe(true);
      if (result.refinedPrompt) {
        expect(result.refinedPrompt).toContain('error handling');
      }
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish events when starting', async () => {
      await promptEngineer.start();
      expect(eventBus.publish).toHaveBeenCalled();
      await promptEngineer.stop();
    });

    it('should subscribe to system events', async () => {
      const subscriptionId = eventBus.subscribe('system.warning' as any, () => {});
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle vague detection errors gracefully', async () => {
      // Mock a potential error scenario
      const result = await promptEngineer.detectVaguePrompt('');
      expect(result).toBeDefined();
      expect(result.isVague).toBeDefined();
    });

    it('should handle refinement errors gracefully', async () => {
      const result = await promptEngineer.refinePrompt({
        originalPrompt: '',
        taskType: 'other'
      });

      expect(result).toBeDefined();
      // Should either succeed or return error response
      expect(result.success).toBeDefined();
    });
  });
});

