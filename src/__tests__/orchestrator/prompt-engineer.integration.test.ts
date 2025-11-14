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
import { PromptEngineer } from '../../orchestrator/prompt-engineer.ts';
import { eventBus } from '../../core/event-bus.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { SelfImprovementSystem } from '../../orchestrator/self-improvement.ts';

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
  let promptEngineer: PromptEngineer;
  let memoriEngine: MemoriEngine;
  let selfImprovement: SelfImprovementSystem;

  beforeEach(async () => {
    vi.clearAllMocks();
    memoriEngine = new MemoriEngine();
    selfImprovement = new SelfImprovementSystem();
    await memoriEngine.initialize();
    await selfImprovement.initialize();
    promptEngineer = new PromptEngineer({ memoriEngine, selfImprovement });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memory Integration', () => {
    it('should retrieve context from memory for prompt generation', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockResolvedValueOnce([
        {
          id: 'memory-1',
          agentId: 'agent-1',
          content: 'Previous successful prompt pattern',
          importance: 0.9,
          timestamp: new Date()
        }
      ]);

      const prompt = await promptEngineer.generatePrompt({
        task: 'Generate code',
        context: { agentId: 'agent-1' }
      });

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(memoriEngine.getRecentMemories).toHaveBeenCalled();
    });

    it('should store successful prompts in memory', async () => {
      const prompt = await promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      });

      await promptEngineer.recordPromptSuccess({
        prompt,
        task: 'Test task',
        result: 'success',
        agentId: 'agent-1'
      });

      expect(memoriEngine.extractAndStoreEntities).toHaveBeenCalled();
    });
  });

  describe('Self-Improvement Integration', () => {
    it('should learn from prompt interactions', async () => {
      const prompt = await promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      });

      await promptEngineer.recordPromptSuccess({
        prompt,
        task: 'Test task',
        result: 'success',
        agentId: 'agent-1'
      });

      expect(selfImprovement.learnFromInteraction).toHaveBeenCalled();
    });

    it('should improve prompts based on feedback', async () => {
      const initialPrompt = await promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      });

      await promptEngineer.recordPromptFailure({
        prompt: initialPrompt,
        task: 'Test task',
        error: 'Insufficient context',
        agentId: 'agent-1'
      });

      const improvedPrompt = await promptEngineer.generatePrompt({
        task: 'Test task',
        context: { improved: true }
      });

      expect(improvedPrompt).toBeDefined();
      expect(improvedPrompt).not.toBe(initialPrompt);
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish prompt generation events', async () => {
      await promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prompt.generated'
        })
      );
    });

    it('should subscribe to prompt feedback events', async () => {
      const events: any[] = [];
      eventBus.subscribe('prompt.feedback', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'feedback-1',
        type: 'prompt.feedback',
        timestamp: Date.now(),
        source: 'agent-1',
        payload: { promptId: 'prompt-1', feedback: 'positive' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.feedback).toBe('positive');
    });
  });

  describe('Error Handling', () => {
    it('should handle memory retrieval failures', async () => {
      vi.spyOn(memoriEngine, 'getRecentMemories').mockRejectedValueOnce(
        new Error('Memory unavailable')
      );

      await expect(promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      })).rejects.toThrow('Memory unavailable');
    });

    it('should handle self-improvement failures gracefully', async () => {
      vi.spyOn(selfImprovement, 'learnFromInteraction').mockRejectedValueOnce(
        new Error('Learning failed')
      );

      const prompt = await promptEngineer.generatePrompt({
        task: 'Test task',
        context: {}
      });

      // Should still record success even if learning fails
      await expect(promptEngineer.recordPromptSuccess({
        prompt,
        task: 'Test task',
        result: 'success',
        agentId: 'agent-1'
      })).resolves.toBeUndefined();
    });
  });
});

