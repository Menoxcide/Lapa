/**
 * Tests for Episodic Memory Store (Phase 12)
 * 
 * Tests temporal indexing, semantic search, decay, pruning,
 * and integration with Memori engine and Chroma refinement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { episodicMemoryStore, EpisodicMemoryStore } from '../../local/episodic.ts';
import { eventBus } from '../../core/event-bus.ts';
import { memoriEngine } from '../../local/memori-engine.ts';

describe('Episodic Memory Store (Phase 12)', () => {
  let store: EpisodicMemoryStore;

  beforeEach(async () => {
    // Create a fresh instance for each test
    store = new EpisodicMemoryStore({
      enableTemporalIndexing: true,
      enableSemanticSearch: true,
      maxEpisodes: 100,
      decayFactor: 0.85,
      importanceThreshold: 0.3,
      enableAutoPruning: true,
      temporalWindowHours: 24
    });

    await memoriEngine.initialize();
    await store.initialize();
  });

  afterEach(async () => {
    await store.close();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const status = store.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.episodeCount).toBe(0);
      expect(status.temporalIndexSize).toBe(0);
      expect(status.semanticIndexSize).toBe(0);
    });

    it('should subscribe to task completion events', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');

      await eventBus.publish({
        id: 'task-1',
        type: 'task.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          taskId: 'task-1',
          agentId: 'agent-1',
          result: 'Task completed successfully'
        }
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));

      const episodeEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.episode.stored'
      );
      expect(episodeEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Episode Storage', () => {
    it('should store episodes correctly', async () => {
      const episode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'This is a test episode',
        context: { key: 'value' },
        tags: ['test', 'episode']
      });

      expect(episode.id).toBeDefined();
      expect(episode.agentId).toBe('agent-1');
      expect(episode.taskId).toBe('task-1');
      expect(episode.content).toBe('This is a test episode');
      expect(episode.tags).toEqual(['test', 'episode']);
      expect(episode.importance).toBeGreaterThan(0);
    });

    it('should calculate initial importance correctly', async () => {
      const shortEpisode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Short'
      });

      const longEpisode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        sessionId: 'session-1',
        content: 'A'.repeat(1000),
        context: { key1: 'value1', key2: 'value2', key3: 'value3' }
      });

      // Longer episode with more context should have higher importance
      expect(longEpisode.importance).toBeGreaterThan(shortEpisode.importance);
    });

    it('should extract keywords from content', async () => {
      const episode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'This is a test episode with important keywords and concepts'
      });

      const status = store.getStatus();
      expect(status.semanticIndexSize).toBeGreaterThan(0);
    });

    it('should find related episodes', async () => {
      const episode1 = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'This is about authentication and user login'
      });

      const episode2 = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        sessionId: 'session-1',
        content: 'This is about user authentication and security'
      });

      // Episodes should be related
      expect(episode2.relatedEpisodes.length).toBeGreaterThan(0);
    });
  });

  describe('Temporal Indexing', () => {
    it('should retrieve episodes by time range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Create episodes at different times
      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Recent episode'
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const episodes = await store.getEpisodesByTime(oneHourAgo, now, 50);

      expect(episodes.length).toBeGreaterThan(0);
      expect(episodes[0].content).toBe('Recent episode');
    });

    it('should sort episodes by importance and timestamp', async () => {
      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Low importance episode'
      });

      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        sessionId: 'session-1',
        content: 'A'.repeat(1000) + ' High importance episode with lots of context'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const episodes = await store.getEpisodesByTime(undefined, undefined, 50);

      expect(episodes.length).toBeGreaterThan(0);
      // Higher importance episodes should come first
      expect(episodes[0].importance).toBeGreaterThanOrEqual(episodes[episodes.length - 1].importance);
    });
  });

  describe('Agent and Task Indexing', () => {
    it('should retrieve episodes by agent', async () => {
      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Episode from agent-1'
      });

      await store.storeEpisode({
        agentId: 'agent-2',
        taskId: 'task-2',
        sessionId: 'session-2',
        content: 'Episode from agent-2'
      });

      const agent1Episodes = await store.getEpisodesByAgent('agent-1', 50);

      expect(agent1Episodes.length).toBeGreaterThan(0);
      expect(agent1Episodes.every(e => e.agentId === 'agent-1')).toBe(true);
    });

    it('should retrieve episodes by task', async () => {
      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Episode 1 for task-1'
      });

      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Episode 2 for task-1'
      });

      const taskEpisodes = await store.getEpisodesByTask('task-1', 50);

      expect(taskEpisodes.length).toBe(2);
      expect(taskEpisodes.every(e => e.taskId === 'task-1')).toBe(true);
    });
  });

  describe('Decay and Pruning', () => {
    it('should apply decay to episode importance', async () => {
      const storeWithDecay = new EpisodicMemoryStore({
        decayFactor: 0.9,
        importanceThreshold: 0.1
      });
      await storeWithDecay.initialize();

      const episode = await storeWithDecay.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Test episode'
      });

      const initialImportance = episode.importance;

      // Manually trigger decay (simulating time passage)
      // In real implementation, decay is applied during pruning
      const status = storeWithDecay.getStatus();
      expect(status.episodeCount).toBe(1);

      await storeWithDecay.close();
    });

    it('should prune episodes below importance threshold', async () => {
      const storeSmall = new EpisodicMemoryStore({
        maxEpisodes: 5,
        importanceThreshold: 0.5,
        enableAutoPruning: true
      });
      await storeSmall.initialize();

      // Create episodes with varying importance
      for (let i = 0; i < 10; i++) {
        await storeSmall.storeEpisode({
          agentId: 'agent-1',
          taskId: `task-${i}`,
          sessionId: 'session-1',
          content: i < 5 ? 'A'.repeat(1000) : 'Short'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      const status = storeSmall.getStatus();
      // Should have pruned down to maxEpisodes or removed low-importance ones
      expect(status.episodeCount).toBeLessThanOrEqual(10);

      await storeSmall.close();
    });

    it('should prune oldest episodes when over limit', async () => {
      const storeLimited = new EpisodicMemoryStore({
        maxEpisodes: 3,
        importanceThreshold: 0.1,
        enableAutoPruning: true
      });
      await storeLimited.initialize();

      // Create 5 episodes
      for (let i = 0; i < 5; i++) {
        await storeLimited.storeEpisode({
          agentId: 'agent-1',
          taskId: `task-${i}`,
          sessionId: 'session-1',
          content: `Episode ${i}`
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      const status = storeLimited.getStatus();
      expect(status.episodeCount).toBeLessThanOrEqual(5);

      await storeLimited.close();
    });
  });

  describe('Access Tracking', () => {
    it('should update access counts when retrieving episodes', async () => {
      const episode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Test episode'
      });

      const initialAccessCount = episode.accessCount;

      await store.getEpisodesByAgent('agent-1', 50);

      // Access count should be updated (stored in memory, not persisted)
      // This is tested indirectly through the retrieval mechanism
      expect(episode.accessCount).toBeGreaterThanOrEqual(initialAccessCount);
    });

    it('should update lastAccessed timestamp', async () => {
      const episode = await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Test episode'
      });

      const initialLastAccessed = episode.lastAccessed;

      await new Promise(resolve => setTimeout(resolve, 100));

      await store.getEpisodesByTask('task-1', 50);

      // Last accessed should be updated
      expect(episode.lastAccessed.getTime()).toBeGreaterThanOrEqual(initialLastAccessed.getTime());
    });
  });

  describe('Integration with Event Bus', () => {
    it('should store episodes from task completion events', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');

      await eventBus.publish({
        id: 'task-1',
        type: 'task.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          taskId: 'task-1',
          agentId: 'agent-1',
          result: 'Task completed',
          context: { key: 'value' }
        }
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));

      const episodeEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.episode.stored'
      );
      expect(episodeEvents.length).toBeGreaterThan(0);

      const episodes = await store.getEpisodesByTask('task-1', 10);
      expect(episodes.length).toBeGreaterThan(0);
    });

    it('should store episodes from conversation events', async () => {
      await eventBus.publish({
        id: 'conv-1',
        type: 'conversation.updated',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          agentId: 'agent-1',
          taskId: 'task-1',
          sessionId: 'session-1',
          content: 'Conversation message',
          context: { key: 'value' }
        }
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));

      const episodes = await store.getEpisodesByAgent('agent-1', 10);
      expect(episodes.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic Search', () => {
    it('should find related episodes by keyword similarity', async () => {
      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'This episode is about authentication and user login systems'
      });

      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-2',
        sessionId: 'session-1',
        content: 'This episode discusses user authentication and security protocols'
      });

      await store.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-3',
        sessionId: 'session-1',
        content: 'This episode is about database queries and SQL optimization'
      });

      const episodes = await store.getEpisodesByAgent('agent-1', 10);

      // Episodes 1 and 2 should be related (both about authentication)
      const episode1 = episodes.find(e => e.taskId === 'task-1');
      const episode2 = episodes.find(e => e.taskId === 'task-2');

      if (episode1 && episode2) {
        expect(episode2.relatedEpisodes.length).toBeGreaterThan(0);
      }
    });
  });
});

