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
import { SkillManager } from '../../orchestrator/skill-manager.ts';
import { eventBus } from '../../core/event-bus.ts';
import { SkillRegistry } from '../../marketplace/registry.ts';

// Mock dependencies
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

vi.mock('../../marketplace/registry.ts', () => ({
  SkillRegistry: vi.fn().mockImplementation(() => ({
    registerSkill: vi.fn().mockResolvedValue(undefined),
    getSkill: vi.fn().mockResolvedValue({
      id: 'skill-1',
      name: 'Test Skill',
      description: 'Test',
      version: '1.0.0'
    }),
    listSkills: vi.fn().mockResolvedValue([])
  }))
}));

describe('Skill Manager Integration', () => {
  let skillManager: SkillManager;
  let skillRegistry: SkillRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    skillRegistry = new SkillRegistry();
    skillManager = new SkillManager({ skillRegistry });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Skill Registration', () => {
    it('should register skills through registry', async () => {
      const skill = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test description',
        version: '1.0.0',
        capabilities: ['test']
      };

      await skillManager.registerSkill(skill);

      expect(skillRegistry.registerSkill).toHaveBeenCalledWith(skill);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle duplicate skill registration', async () => {
      const skill = {
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test',
        version: '1.0.0',
        capabilities: ['test']
      };

      await skillManager.registerSkill(skill);
      await expect(skillManager.registerSkill(skill)).rejects.toThrow();
    });
  });

  describe('Skill Retrieval', () => {
    it('should retrieve skills from registry', async () => {
      const skill = await skillManager.getSkill('skill-1');

      expect(skill).toBeDefined();
      expect(skill.id).toBe('skill-1');
      expect(skillRegistry.getSkill).toHaveBeenCalledWith('skill-1');
    });

    it('should list all available skills', async () => {
      const skills = await skillManager.listSkills();

      expect(Array.isArray(skills)).toBe(true);
      expect(skillRegistry.listSkills).toHaveBeenCalled();
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish skill registration events', async () => {
      await skillManager.registerSkill({
        id: 'skill-1',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        capabilities: ['test']
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'skill.registered'
        })
      );
    });

    it('should subscribe to skill acquisition events', async () => {
      const events: any[] = [];
      eventBus.subscribe('skill.acquired', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'acquire-1',
        type: 'skill.acquired',
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
      await expect(skillManager.registerSkill(null as any)).rejects.toThrow();
      await expect(skillManager.registerSkill(undefined as any)).rejects.toThrow();
    });

    it('should handle missing skill fields', async () => {
      await expect(skillManager.registerSkill({
        id: 'skill-1'
      } as any)).rejects.toThrow();
    });

    it('should handle registry failures', async () => {
      vi.spyOn(skillRegistry, 'registerSkill').mockRejectedValueOnce(
        new Error('Registry error')
      );

      await expect(skillManager.registerSkill({
        id: 'skill-1',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        capabilities: ['test']
      })).rejects.toThrow('Registry error');
    });
  });
});

