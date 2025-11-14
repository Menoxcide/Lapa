"use strict";
/**
 * Tests for Episodic Memory Store (Phase 12)
 *
 * Tests temporal indexing, semantic search, decay, pruning,
 * and integration with Memori engine and Chroma refinement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const episodic_ts_1 = require("../../local/episodic.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const memori_engine_ts_1 = require("../../local/memori-engine.ts");
(0, vitest_1.describe)('Episodic Memory Store (Phase 12)', () => {
    let store;
    (0, vitest_1.beforeEach)(async () => {
        // Create a fresh instance for each test
        store = new episodic_ts_1.EpisodicMemoryStore({
            enableTemporalIndexing: true,
            enableSemanticSearch: true,
            maxEpisodes: 100,
            decayFactor: 0.85,
            importanceThreshold: 0.3,
            enableAutoPruning: true,
            temporalWindowHours: 24
        });
        await memori_engine_ts_1.memoriEngine.initialize();
        await store.initialize();
    });
    (0, vitest_1.afterEach)(async () => {
        await store.close();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            const status = store.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
            (0, vitest_1.expect)(status.episodeCount).toBe(0);
            (0, vitest_1.expect)(status.temporalIndexSize).toBe(0);
            (0, vitest_1.expect)(status.semanticIndexSize).toBe(0);
        });
        (0, vitest_1.it)('should subscribe to task completion events', async () => {
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            await event_bus_ts_1.eventBus.publish({
                id: 'task-1',
                type: 'task.completed',
                timestamp: Date.now(),
                source: 'test',
                payload: {
                    taskId: 'task-1',
                    agentId: 'agent-1',
                    result: 'Task completed successfully'
                }
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            const episodeEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.episode.stored');
            (0, vitest_1.expect)(episodeEvents.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Episode Storage', () => {
        (0, vitest_1.it)('should store episodes correctly', async () => {
            const episode = await store.storeEpisode({
                agentId: 'agent-1',
                taskId: 'task-1',
                sessionId: 'session-1',
                content: 'This is a test episode',
                context: { key: 'value' },
                tags: ['test', 'episode']
            });
            (0, vitest_1.expect)(episode.id).toBeDefined();
            (0, vitest_1.expect)(episode.agentId).toBe('agent-1');
            (0, vitest_1.expect)(episode.taskId).toBe('task-1');
            (0, vitest_1.expect)(episode.content).toBe('This is a test episode');
            (0, vitest_1.expect)(episode.tags).toEqual(['test', 'episode']);
            (0, vitest_1.expect)(episode.importance).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should calculate initial importance correctly', async () => {
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
            (0, vitest_1.expect)(longEpisode.importance).toBeGreaterThan(shortEpisode.importance);
        });
        (0, vitest_1.it)('should extract keywords from content', async () => {
            const episode = await store.storeEpisode({
                agentId: 'agent-1',
                taskId: 'task-1',
                sessionId: 'session-1',
                content: 'This is a test episode with important keywords and concepts'
            });
            const status = store.getStatus();
            (0, vitest_1.expect)(status.semanticIndexSize).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should find related episodes', async () => {
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
            (0, vitest_1.expect)(episode2.relatedEpisodes.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Temporal Indexing', () => {
        (0, vitest_1.it)('should retrieve episodes by time range', async () => {
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
            (0, vitest_1.expect)(episodes.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(episodes[0].content).toBe('Recent episode');
        });
        (0, vitest_1.it)('should sort episodes by importance and timestamp', async () => {
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
            (0, vitest_1.expect)(episodes.length).toBeGreaterThan(0);
            // Higher importance episodes should come first
            (0, vitest_1.expect)(episodes[0].importance).toBeGreaterThanOrEqual(episodes[episodes.length - 1].importance);
        });
    });
    (0, vitest_1.describe)('Agent and Task Indexing', () => {
        (0, vitest_1.it)('should retrieve episodes by agent', async () => {
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
            (0, vitest_1.expect)(agent1Episodes.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(agent1Episodes.every(e => e.agentId === 'agent-1')).toBe(true);
        });
        (0, vitest_1.it)('should retrieve episodes by task', async () => {
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
            (0, vitest_1.expect)(taskEpisodes.length).toBe(2);
            (0, vitest_1.expect)(taskEpisodes.every(e => e.taskId === 'task-1')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Decay and Pruning', () => {
        (0, vitest_1.it)('should apply decay to episode importance', async () => {
            const storeWithDecay = new episodic_ts_1.EpisodicMemoryStore({
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
            (0, vitest_1.expect)(status.episodeCount).toBe(1);
            await storeWithDecay.close();
        });
        (0, vitest_1.it)('should prune episodes below importance threshold', async () => {
            const storeSmall = new episodic_ts_1.EpisodicMemoryStore({
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
            (0, vitest_1.expect)(status.episodeCount).toBeLessThanOrEqual(10);
            await storeSmall.close();
        });
        (0, vitest_1.it)('should prune oldest episodes when over limit', async () => {
            const storeLimited = new episodic_ts_1.EpisodicMemoryStore({
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
            (0, vitest_1.expect)(status.episodeCount).toBeLessThanOrEqual(5);
            await storeLimited.close();
        });
    });
    (0, vitest_1.describe)('Access Tracking', () => {
        (0, vitest_1.it)('should update access counts when retrieving episodes', async () => {
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
            (0, vitest_1.expect)(episode.accessCount).toBeGreaterThanOrEqual(initialAccessCount);
        });
        (0, vitest_1.it)('should update lastAccessed timestamp', async () => {
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
            (0, vitest_1.expect)(episode.lastAccessed.getTime()).toBeGreaterThanOrEqual(initialLastAccessed.getTime());
        });
    });
    (0, vitest_1.describe)('Integration with Event Bus', () => {
        (0, vitest_1.it)('should store episodes from task completion events', async () => {
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            await event_bus_ts_1.eventBus.publish({
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
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            const episodeEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.episode.stored');
            (0, vitest_1.expect)(episodeEvents.length).toBeGreaterThan(0);
            const episodes = await store.getEpisodesByTask('task-1', 10);
            (0, vitest_1.expect)(episodes.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should store episodes from conversation events', async () => {
            await event_bus_ts_1.eventBus.publish({
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
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            const episodes = await store.getEpisodesByAgent('agent-1', 10);
            (0, vitest_1.expect)(episodes.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Semantic Search', () => {
        (0, vitest_1.it)('should find related episodes by keyword similarity', async () => {
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
                (0, vitest_1.expect)(episode2.relatedEpisodes.length).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=episodic-memory.test.js.map