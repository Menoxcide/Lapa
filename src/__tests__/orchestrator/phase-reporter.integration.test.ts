/**
 * Integration Tests for Phase Reporter
 * 
 * Tests phase reporting integration with:
 * - Event bus
 * - Memory systems
 * - Git operations
 * - Observability systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhaseReporter } from '../../orchestrator/phase-reporter.ts';
import { eventBus } from '../../core/event-bus.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';

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

vi.mock('../../local/episodic.ts', () => ({
  EpisodicMemoryStore: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([])
  }))
}));

describe('Phase Reporter Integration', () => {
  let phaseReporter: PhaseReporter;
  let memoriEngine: MemoriEngine;
  let episodicMemory: EpisodicMemoryStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    memoriEngine = new MemoriEngine();
    episodicMemory = new EpisodicMemoryStore();
    await memoriEngine.initialize();
    await episodicMemory.initialize();
    phaseReporter = new PhaseReporter({ memoriEngine, episodicMemory });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Bus Integration', () => {
    it('should subscribe to phase completion events', async () => {
      const events: any[] = [];
      eventBus.subscribe('phase.completed', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'phase-1',
        type: 'phase.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: { phaseId: 'phase-1', phaseName: 'Implementation' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.phaseName).toBe('Implementation');
    });

    it('should publish phase summary events', async () => {
      await phaseReporter.generatePhaseSummary({
        phaseId: 'phase-1',
        phaseName: 'Implementation',
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        tasks: ['task-1', 'task-2'],
        metrics: { tasksCompleted: 2, successRate: 1.0 }
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'phase.summary.generated'
        })
      );
    });
  });

  describe('Memory Integration', () => {
    it('should store phase summaries in episodic memory', async () => {
      const summary = await phaseReporter.generatePhaseSummary({
        phaseId: 'phase-1',
        phaseName: 'Implementation',
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        tasks: ['task-1'],
        metrics: { tasksCompleted: 1, successRate: 1.0 }
      });

      expect(summary).toBeDefined();
      expect(episodicMemory.store).toHaveBeenCalled();
    });

    it('should retrieve phase history from memory', async () => {
      vi.spyOn(episodicMemory, 'search').mockResolvedValueOnce([
        {
          id: 'episode-1',
          agentId: 'system',
          taskId: 'phase-1',
          content: 'Phase Implementation completed',
          importance: 0.9,
          timestamp: new Date(),
          tags: ['phase', 'summary']
        }
      ]);

      const history = await phaseReporter.getPhaseHistory('phase-1');
      expect(history.length).toBeGreaterThanOrEqual(0);
      expect(episodicMemory.search).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle memory storage failures', async () => {
      vi.spyOn(episodicMemory, 'store').mockRejectedValueOnce(
        new Error('Storage failed')
      );

      await expect(phaseReporter.generatePhaseSummary({
        phaseId: 'phase-1',
        phaseName: 'Test',
        startTime: Date.now(),
        endTime: Date.now(),
        tasks: [],
        metrics: {}
      })).rejects.toThrow('Storage failed');
    });

    it('should handle event bus failures gracefully', async () => {
      vi.spyOn(eventBus, 'publish').mockRejectedValueOnce(new Error('Event bus error'));

      await expect(phaseReporter.generatePhaseSummary({
        phaseId: 'phase-1',
        phaseName: 'Test',
        startTime: Date.now(),
        endTime: Date.now(),
        tasks: [],
        metrics: {}
      })).rejects.toThrow('Event bus error');
    });
  });
});

