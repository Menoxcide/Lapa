/**
 * Integration Tests for Skill Manager
 * 
 * Tests skill management integration with:
 * - Agent systems
 * - Marketplace
 * - Event bus
 * - Memory systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillManager, type SkillMetadata } from '../../orchestrator/skill-manager.ts';
import { eventBus } from '../../core/event-bus.ts';
// Note: SkillManager doesn't use SkillRegistry, it manages skills directly

// Mock dependencies
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

// Note: SkillManager manages skills directly, no registry mock needed

describe('Skill Manager Integration', () => {
  let skillManager: SkillManager;

  beforeEach(() => {
    vi.clearAllMocks();
    skillManager = new SkillManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Skill Registration', () => {
    it('should register skills through registry', async () => {
      const skill: SkillMetadata = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test description',
        version: '1.0.0',
        category: 'code',
        inputs: [],
        outputs: []
      };

      skillManager.registerSkill(skill);

      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle duplicate skill registration', async () => {
      const skill: SkillMetadata = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test',
        version: '1.0.0',
        category: 'code',
        inputs: [],
        outputs: []
      };

      skillManager.registerSkill(skill);
      // Second registration overwrites the first
      skillManager.registerSkill(skill);
      expect(skillManager.getSkill('skill-1')).toBeDefined();
    });
  });

  describe('Skill Retrieval', () => {
    it('should retrieve skills from manager', () => {
      const skill: SkillMetadata = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test',
        version: '1.0.0',
        category: 'code',
        inputs: [],
        outputs: []
      };
      skillManager.registerSkill(skill);
      
      const retrieved = skillManager.getSkill('skill-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('skill-1');
    });

    it('should list all available skills', () => {
      const skill: SkillMetadata = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test',
        version: '1.0.0',
        category: 'code',
        inputs: [],
        outputs: []
      };
      skillManager.registerSkill(skill);
      
      const skills = skillManager.getSkills();

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish skill registration events', async () => {
      skillManager.registerSkill({
        id: 'skill-1',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        category: 'code',
        inputs: [],
        outputs: []
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'skill.registered'
        })
      );
    });

    it('should subscribe to skill acquisition events', async () => {
      const events: any[] = [];
      eventBus.subscribe('skill.registered' as any, (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'acquire-1',
        type: 'skill.registered' as any,
        timestamp: Date.now(),
        source: 'agent-1',
        payload: { skillId: 'skill-1', agentId: 'agent-1' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.skillId).toBe('skill-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid skill data', async () => {
      // registerSkill doesn't throw, it validates with zod which throws on invalid input
      expect(() => skillManager.registerSkill(null as any)).toThrow();
      expect(() => skillManager.registerSkill(undefined as any)).toThrow();
    });

    it('should handle missing skill fields', async () => {
      expect(() => skillManager.registerSkill({
        id: 'skill-1'
      } as any)).toThrow();
    });

    it('should handle skill registration errors', () => {
      // Test with invalid skill data
      expect(() => skillManager.registerSkill({
        id: 'skill-1',
        name: 'Test',
        description: 'Test',
        version: '1.0.0'
        // Missing required fields: category, inputs, outputs
      } as any)).toThrow();
    });
  });
});

