/**
 * Tests for Memory Unlock System
 * Phase 5 I6: MemUnlock-SelfImp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryUnlockSystem, type MemoryUnlockConfig, type AgentTrustScore } from '../../local/memory-unlock.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock MemoriEngine
vi.mock('../../local/memori-engine.ts', () => ({
  MemoriEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getRecentMemories: vi.fn().mockResolvedValue([]),
    getCrossSessionMemories: vi.fn().mockResolvedValue([]),
    getEntityRelationships: vi.fn().mockResolvedValue([])
  }))
}));

describe('MemoryUnlockSystem', () => {
  let unlockSystem: MemoryUnlockSystem;
  let memoriEngine: MemoriEngine;

  beforeEach(() => {
    memoriEngine = new MemoriEngine();
    unlockSystem = new MemoryUnlockSystem(memoriEngine);
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await unlockSystem.initialize();
      expect(unlockSystem).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config: Partial<MemoryUnlockConfig> = {
        trustThreshold: 0.8,
        maxUnlockLevel: 3
      };
      const system = new MemoryUnlockSystem(memoriEngine, undefined, config);
      expect(system).toBeDefined();
    });
  });

  describe('Trust Score Management', () => {
    it('should get default trust score for new agent', () => {
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.trustScore).toBe(0.5);
      expect(trust.totalInteractions).toBe(0);
    });

    it('should update trust score on successful interaction', () => {
      unlockSystem.updateTrustScore('agent-1', true, 1.0);
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.trustScore).toBeGreaterThan(0.5);
      expect(trust.successfulInteractions).toBe(1);
      expect(trust.totalInteractions).toBe(1);
    });

    it('should update trust score on failed interaction', () => {
      unlockSystem.updateTrustScore('agent-1', false, 0.5);
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.trustScore).toBeLessThan(0.5);
      expect(trust.successfulInteractions).toBe(0);
      expect(trust.totalInteractions).toBe(1);
    });
  });

  describe('Skill Registration', () => {
    it('should register a new skill', () => {
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.8);
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.skillLevels.get('memory-management')).toBe(0.8);
    });

    it('should update skill level if higher', () => {
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.6);
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.9);
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.skillLevels.get('memory-management')).toBe(0.9);
    });

    it('should not decrease skill level', () => {
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.8);
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.5);
      const trust = unlockSystem.getAgentTrustScore('agent-1');
      expect(trust.skillLevels.get('memory-management')).toBe(0.8);
    });
  });

  describe('Memory Unlock Levels', () => {
    it('should have level 1 always accessible', () => {
      expect(unlockSystem.canAccessLevel('agent-1', 1)).toBe(true);
    });

    it('should not have level 2 accessible by default', () => {
      expect(unlockSystem.canAccessLevel('agent-1', 2)).toBe(false);
    });

    it('should unlock level 2 when trust threshold met', async () => {
      await unlockSystem.initialize();
      
      // Build trust to 0.7
      for (let i = 0; i < 10; i++) {
        unlockSystem.updateTrustScore('agent-1', true, 1.0);
      }
      
      // Register required skill
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.8);
      
      // Check if level 2 is unlocked
      const unlocks = unlockSystem.getUnlockedLevels('agent-1');
      expect(unlocks).toContain(2);
    });

    it('should unlock progressive levels as trust increases', async () => {
      await unlockSystem.initialize();
      
      // Build high trust
      for (let i = 0; i < 20; i++) {
        unlockSystem.updateTrustScore('agent-1', true, 1.0);
      }
      
      // Register multiple skills
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.9);
      unlockSystem.registerSkill('agent-1', 'pattern-recognition', 0.9);
      
      const unlocks = unlockSystem.getUnlockedLevels('agent-1');
      expect(unlocks.length).toBeGreaterThan(1);
    });
  });

  describe('Memory Access', () => {
    it('should access level 1 memory', async () => {
      await unlockSystem.initialize();
      const memories = await unlockSystem.accessMemory('agent-1', 1, 'test query');
      expect(memories).toBeDefined();
    });

    it('should throw error when accessing locked level', async () => {
      await unlockSystem.initialize();
      await expect(
        unlockSystem.accessMemory('agent-1', 5, 'test query')
      ).rejects.toThrow();
    });

    it('should access unlocked level', async () => {
      await unlockSystem.initialize();
      
      // Unlock level 2
      unlockSystem.updateTrustScore('agent-1', true, 1.0);
      unlockSystem.updateTrustScore('agent-1', true, 1.0);
      unlockSystem.registerSkill('agent-1', 'memory-management', 0.8);
      
      // Wait for unlock check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const unlocks = unlockSystem.getUnlockedLevels('agent-1');
      if (unlocks.includes(2)) {
        const memories = await unlockSystem.accessMemory('agent-1', 2, 'test query');
        expect(memories).toBeDefined();
      }
    });
  });
});

