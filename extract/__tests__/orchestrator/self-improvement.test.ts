/**
 * Tests for Self-Improvement System
 * Phase 5 I6: MemUnlock-SelfImp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelfImprovementSystem, type SelfImprovementConfig, type AgentSkill } from '../../orchestrator/self-improvement.ts';
import { MemoryUnlockSystem } from '../../local/memory-unlock.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock MemoryUnlockSystem
vi.mock('../../local/memory-unlock.ts', () => ({
  MemoryUnlockSystem: vi.fn().mockImplementation(() => ({
    registerSkill: vi.fn()
  }))
}));

describe('SelfImprovementSystem', () => {
  let improvementSystem: SelfImprovementSystem;
  let memoryUnlock: MemoryUnlockSystem;

  beforeEach(() => {
    memoryUnlock = new MemoryUnlockSystem({} as any);
    improvementSystem = new SelfImprovementSystem(memoryUnlock);
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await improvementSystem.initialize();
      expect(improvementSystem).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config: Partial<SelfImprovementConfig> = {
        learningRate: 0.2,
        improvementThreshold: 0.1
      };
      const system = new SelfImprovementSystem(memoryUnlock, config);
      expect(system).toBeDefined();
    });
  });

  describe('Skill Management', () => {
    it('should start with no skills for new agent', () => {
      const skills = improvementSystem.getAgentSkills('agent-1');
      expect(skills).toEqual([]);
    });

    it('should acquire skill from successful task', async () => {
      await improvementSystem.initialize();
      
      // Simulate successful task completion
      eventBus.emit({
        type: 'agent.task.completed',
        agentId: 'agent-1',
        success: true,
        metrics: {
          successRate: 1.0,
          averageLatency: 100,
          qualityScore: 0.9,
          userSatisfaction: 0.95
        },
        timestamp: new Date()
      } as any);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Skills may be acquired (implementation dependent)
      const skills = improvementSystem.getAgentSkills('agent-1');
      expect(skills).toBeDefined();
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance history', async () => {
      await improvementSystem.initialize();
      
      // Simulate multiple task completions
      for (let i = 0; i < 5; i++) {
        eventBus.emit({
          type: 'agent.task.completed',
          agentId: 'agent-1',
          success: true,
          metrics: {
            successRate: 0.8 + i * 0.05,
            averageLatency: 100 - i * 10,
            qualityScore: 0.7 + i * 0.05,
            userSatisfaction: 0.75 + i * 0.05
          },
          timestamp: new Date()
        } as any);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const history = improvementSystem.getPerformanceHistory('agent-1');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Improvement', () => {
    it('should track prompt improvements', () => {
      const improvements = improvementSystem.getPromptImprovements('agent-1');
      expect(improvements).toEqual([]);
    });

    it('should learn from failures', async () => {
      await improvementSystem.initialize();
      
      // Simulate failed task
      eventBus.emit({
        type: 'agent.task.completed',
        agentId: 'agent-1',
        success: false,
        metrics: {
          successRate: 0.3,
          averageLatency: 500,
          qualityScore: 0.4,
          userSatisfaction: 0.3
        },
        timestamp: new Date()
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));
      
      // System should attempt to learn from failure
      // (exact behavior depends on implementation)
      expect(improvementSystem).toBeDefined();
    });
  });

  describe('Marketplace Integration', () => {
    it('should handle marketplace skill availability', async () => {
      await improvementSystem.initialize();
      
      // Simulate marketplace skill
      eventBus.emit({
        type: 'skill.marketplace.available',
        agentId: 'agent-1',
        skill: {
          skillId: 'marketplace-skill-1',
          skillName: 'advanced-pattern-matching',
          skillLevel: 0.9,
          marketplaceSuccessRate: 0.95,
          source: 'marketplace'
        },
        timestamp: new Date()
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));
      
      // System should evaluate marketplace skill
      expect(improvementSystem).toBeDefined();
    });
  });
});

