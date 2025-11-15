/**
 * Tests for Agent Diversity Lab
 * Phase 5 I9: AgentDivLab
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AgentDiversityLab,
  type AgentDiversityConfig,
  type AgentCapability,
  type AgentProfile
} from '../../orchestrator/agent-diversity.ts';
import { eventBus } from '../../core/event-bus.ts';

describe('AgentDiversityLab', () => {
  let diversityLab: AgentDiversityLab;

  beforeEach(() => {
    diversityLab = new AgentDiversityLab();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await diversityLab.initialize();
      expect(diversityLab).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config: Partial<AgentDiversityConfig> = {
        minDiversityScore: 0.8,
        maxSubAgents: 5
      };
      const lab = new AgentDiversityLab(config);
      expect(lab).toBeDefined();
    });
  });

  describe('Agent Registration', () => {
    it('should register an agent profile', () => {
      const capabilities: AgentCapability[] = [
        {
          capabilityId: 'code-gen',
          capabilityName: 'Code Generation',
          proficiency: 0.9,
          usageCount: 10,
          successRate: 0.95
        }
      ];

      diversityLab.registerAgent('agent-1', 'coder', capabilities);
      const profile = diversityLab.getAgentProfile('agent-1');

      expect(profile).toBeDefined();
      expect(profile?.role).toBe('coder');
      expect(profile?.capabilities).toHaveLength(1);
    });

    it('should register multiple agents', () => {
      diversityLab.registerAgent('agent-1', 'coder', []);
      diversityLab.registerAgent('agent-2', 'reviewer', []);
      diversityLab.registerAgent('agent-3', 'tester', []);

      const metrics = diversityLab.getDiversityMetrics();
      expect(metrics.roleDiversity).toBeGreaterThan(0);
    });
  });

  describe('Sub-Agent Coordination', () => {
    it('should create sub-agent relationship', () => {
      const parentCapabilities: AgentCapability[] = [
        {
          capabilityId: 'planning',
          capabilityName: 'Planning',
          proficiency: 0.9,
          usageCount: 5,
          successRate: 0.9
        }
      ];

      const subCapabilities: AgentCapability[] = [
        {
          capabilityId: 'code-gen',
          capabilityName: 'Code Generation',
          proficiency: 0.8,
          usageCount: 10,
          successRate: 0.85
        }
      ];

      diversityLab.registerAgent('parent-1', 'architect', parentCapabilities);
      diversityLab.registerAgent('sub-1', 'coder', subCapabilities);

      diversityLab.createSubAgent('parent-1', 'sub-1');

      const parent = diversityLab.getAgentProfile('parent-1');
      const sub = diversityLab.getAgentProfile('sub-1');

      expect(parent?.subAgents).toContain('sub-1');
      expect(sub?.parentAgent).toBe('parent-1');
    });

    it('should enforce max sub-agents limit', () => {
      diversityLab = new AgentDiversityLab({ maxSubAgents: 2 });

      diversityLab.registerAgent('parent-1', 'architect', []);
      diversityLab.registerAgent('sub-1', 'coder', []);
      diversityLab.registerAgent('sub-2', 'reviewer', []);
      diversityLab.registerAgent('sub-3', 'tester', []);

      diversityLab.createSubAgent('parent-1', 'sub-1');
      diversityLab.createSubAgent('parent-1', 'sub-2');

      expect(() => {
        diversityLab.createSubAgent('parent-1', 'sub-3');
      }).toThrow();
    });
  });

  describe('Diversity Testing', () => {
    it('should calculate diversity score for diverse agents', async () => {
      diversityLab.registerAgent('agent-1', 'coder', [
        { capabilityId: 'code-gen', capabilityName: 'Code Generation', proficiency: 0.9, usageCount: 10, successRate: 0.9 }
      ]);
      diversityLab.registerAgent('agent-2', 'reviewer', [
        { capabilityId: 'code-review', capabilityName: 'Code Review', proficiency: 0.8, usageCount: 8, successRate: 0.85 }
      ]);
      diversityLab.registerAgent('agent-3', 'tester', [
        { capabilityId: 'testing', capabilityName: 'Testing', proficiency: 0.85, usageCount: 12, successRate: 0.9 }
      ]);

      const result = await diversityLab.testDiversity(['agent-1', 'agent-2', 'agent-3']);

      expect(result.diversityScore).toBeGreaterThan(0.5);
      expect(result.recommendations).toBeDefined();
    });

    it('should detect low diversity', async () => {
      diversityLab.registerAgent('agent-1', 'coder', [
        { capabilityId: 'code-gen', capabilityName: 'Code Generation', proficiency: 0.9, usageCount: 10, successRate: 0.9 }
      ]);
      diversityLab.registerAgent('agent-2', 'coder', [
        { capabilityId: 'code-gen', capabilityName: 'Code Generation', proficiency: 0.8, usageCount: 8, successRate: 0.85 }
      ]);

      const result = await diversityLab.testDiversity(['agent-1', 'agent-2']);

      expect(result.diversityScore).toBeLessThan(1.0);
      if (result.diversityScore < 0.7) {
        expect(result.passed).toBe(false);
      }
    });
  });

  describe('Sub-Agent Coordination Testing', () => {
    it('should test sub-agent coordination', async () => {
      const parentCapabilities: AgentCapability[] = [
        {
          capabilityId: 'planning',
          capabilityName: 'Planning',
          proficiency: 0.9,
          usageCount: 5,
          successRate: 0.9
        }
      ];

      const subCapabilities1: AgentCapability[] = [
        {
          capabilityId: 'code-gen',
          capabilityName: 'Code Generation',
          proficiency: 0.9,
          usageCount: 10,
          successRate: 0.95
        }
      ];

      const subCapabilities2: AgentCapability[] = [
        {
          capabilityId: 'testing',
          capabilityName: 'Testing',
          proficiency: 0.85,
          usageCount: 8,
          successRate: 0.9
        }
      ];

      diversityLab.registerAgent('parent-1', 'architect', parentCapabilities);
      diversityLab.registerAgent('sub-1', 'coder', subCapabilities1);
      diversityLab.registerAgent('sub-2', 'tester', subCapabilities2);

      diversityLab.createSubAgent('parent-1', 'sub-1');
      diversityLab.createSubAgent('parent-1', 'sub-2');

      const result = await diversityLab.testSubAgentCoordination('parent-1', 'task-1');

      expect(result.coordinationScore).toBeGreaterThan(0);
      expect(result.subAgentPerformance.size).toBe(2);
    });

    it('should fail coordination test for agent without sub-agents', async () => {
      diversityLab.registerAgent('agent-1', 'coder', []);

      const result = await diversityLab.testSubAgentCoordination('agent-1', 'task-1');

      expect(result.passed).toBe(false);
      expect(result.coordinationScore).toBe(0);
    });
  });

  describe('Diversity Metrics', () => {
    it('should calculate overall diversity metrics', () => {
      diversityLab.registerAgent('agent-1', 'coder', [
        { capabilityId: 'code-gen', capabilityName: 'Code Generation', proficiency: 0.9, usageCount: 10, successRate: 0.9 }
      ]);
      diversityLab.registerAgent('agent-2', 'reviewer', [
        { capabilityId: 'code-review', capabilityName: 'Code Review', proficiency: 0.8, usageCount: 8, successRate: 0.85 }
      ]);
      diversityLab.registerAgent('agent-3', 'tester', [
        { capabilityId: 'testing', capabilityName: 'Testing', proficiency: 0.85, usageCount: 12, successRate: 0.9 }
      ]);

      const metrics = diversityLab.getDiversityMetrics();

      expect(metrics.overallDiversity).toBeGreaterThan(0);
      expect(metrics.capabilityDiversity).toBeGreaterThan(0);
      expect(metrics.roleDiversity).toBeGreaterThan(0);
    });

    it('should track sub-agent distribution', () => {
      diversityLab.registerAgent('parent-1', 'architect', []);
      diversityLab.registerAgent('sub-1', 'coder', []);
      diversityLab.registerAgent('sub-2', 'reviewer', []);

      diversityLab.createSubAgent('parent-1', 'sub-1');
      diversityLab.createSubAgent('parent-1', 'sub-2');

      const metrics = diversityLab.getDiversityMetrics();
      expect(metrics.subAgentDistribution.size).toBeGreaterThan(0);
    });
  });

  describe('Coordination History', () => {
    it('should track coordination history', async () => {
      diversityLab.registerAgent('parent-1', 'architect', []);
      diversityLab.registerAgent('sub-1', 'coder', [
        { capabilityId: 'code-gen', capabilityName: 'Code Generation', proficiency: 0.9, usageCount: 10, successRate: 0.9 }
      ]);

      diversityLab.createSubAgent('parent-1', 'sub-1');

      await diversityLab.testSubAgentCoordination('parent-1', 'task-1');
      await diversityLab.testSubAgentCoordination('parent-1', 'task-2');

      const history = diversityLab.getCoordinationHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });
});

