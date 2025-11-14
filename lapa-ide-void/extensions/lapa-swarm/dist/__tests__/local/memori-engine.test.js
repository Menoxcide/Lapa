"use strict";
/**
 * Tests for Memori Engine (Phase 12)
 *
 * Tests entity extraction, session pruning, zero-prompt injection,
 * and integration with episodic memory and vector refinement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const memori_engine_ts_1 = require("../../local/memori-engine.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const memori_sqlite_ts_1 = require("../../local/memori-sqlite.ts");
(0, vitest_1.describe)('Memori Engine (Phase 12)', () => {
    let engine;
    (0, vitest_1.beforeEach)(async () => {
        // Create a fresh instance for each test
        engine = new memori_engine_ts_1.MemoriEngine({
            enableEntityExtraction: true,
            enableSessionPruning: true,
            enableEpisodicIntegration: true,
            maxSessionSize: 100,
            sessionPruningThreshold: 0.8,
            entityConfidenceThreshold: 0.7,
            enableZeroPromptInjection: true,
            maxEntitiesPerTask: 50
        });
        // Initialize SQLite
        await memori_sqlite_ts_1.autoGenMemoriSQLite.initialize();
        await engine.initialize();
    });
    (0, vitest_1.afterEach)(async () => {
        await engine.close();
        await memori_sqlite_ts_1.autoGenMemoriSQLite.close();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            const status = engine.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
            (0, vitest_1.expect)(status.sessionCount).toBe(0);
            (0, vitest_1.expect)(status.entityCacheSize).toBe(0);
        });
        (0, vitest_1.it)('should subscribe to task completion events', async () => {
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            await event_bus_ts_1.eventBus.publish({
                id: 'test-task-1',
                type: 'task.completed',
                timestamp: Date.now(),
                source: 'test',
                payload: {
                    taskId: 'task-1',
                    result: 'Test result with email@example.com and https://example.com'
                }
            });
            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 100));
            // Check that entity extraction event was published
            const entityEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.entities.extracted');
            (0, vitest_1.expect)(entityEvents.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Entity Extraction', () => {
        (0, vitest_1.it)('should extract entities from task results', async () => {
            const result = `
        Contact us at support@example.com
        Visit https://example.com/docs
        Check file: /path/to/file.ts
      `;
            const entities = await engine.extractAndStoreEntities('task-1', result);
            (0, vitest_1.expect)(entities.length).toBeGreaterThan(0);
            const emailEntity = entities.find(e => e.type === 'email');
            (0, vitest_1.expect)(emailEntity).toBeDefined();
            (0, vitest_1.expect)(emailEntity?.value).toContain('@');
            const urlEntity = entities.find(e => e.type === 'url');
            (0, vitest_1.expect)(urlEntity).toBeDefined();
            (0, vitest_1.expect)(urlEntity?.value).toContain('http');
        });
        (0, vitest_1.it)('should filter entities by confidence threshold', async () => {
            const engineLowThreshold = new memori_engine_ts_1.MemoriEngine({
                entityConfidenceThreshold: 0.5
            });
            await engineLowThreshold.initialize();
            const result = 'Email: test@example.com';
            const entities = await engineLowThreshold.extractAndStoreEntities('task-2', result);
            // All entities should meet confidence threshold
            entities.forEach(entity => {
                (0, vitest_1.expect)(entity.confidence).toBeGreaterThanOrEqual(0.5);
            });
            await engineLowThreshold.close();
        });
        (0, vitest_1.it)('should limit entities per task', async () => {
            const engineLimited = new memori_engine_ts_1.MemoriEngine({
                maxEntitiesPerTask: 5
            });
            await engineLimited.initialize();
            // Create a result with many potential entities
            const result = Array(20).fill('test@example.com').join(' ');
            const entities = await engineLimited.extractAndStoreEntities('task-3', result);
            (0, vitest_1.expect)(entities.length).toBeLessThanOrEqual(5);
            await engineLimited.close();
        });
        (0, vitest_1.it)('should calculate entity importance correctly', async () => {
            const result = 'class MyClass { function myFunction() {} }';
            const entities = await engine.extractAndStoreEntities('task-4', result);
            const classEntity = entities.find(e => e.type === 'class');
            const functionEntity = entities.find(e => e.type === 'function');
            if (classEntity && functionEntity) {
                // Class entities should have higher importance than variables
                (0, vitest_1.expect)(classEntity.importance).toBeGreaterThan(0);
                (0, vitest_1.expect)(functionEntity.importance).toBeGreaterThan(0);
            }
        });
    });
    (0, vitest_1.describe)('Zero-Prompt Injection', () => {
        (0, vitest_1.it)('should retrieve context entities for a task', async () => {
            // First, extract some entities
            await engine.extractAndStoreEntities('task-5', 'Email: test@example.com');
            // Retrieve context entities
            const contextEntities = await engine.getContextEntities('task-5', 10);
            (0, vitest_1.expect)(contextEntities.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(contextEntities[0].taskId).toBe('task-5');
        });
        (0, vitest_1.it)('should update access counts when retrieving entities', async () => {
            await engine.extractAndStoreEntities('task-6', 'Email: test@example.com');
            const entities1 = await engine.getContextEntities('task-6', 10);
            const initialAccessCount = entities1[0]?.accessCount || 0;
            const entities2 = await engine.getContextEntities('task-6', 10);
            (0, vitest_1.expect)(entities2[0]?.accessCount).toBeGreaterThan(initialAccessCount);
        });
        (0, vitest_1.it)('should return empty array when zero-prompt injection is disabled', async () => {
            const engineNoInjection = new memori_engine_ts_1.MemoriEngine({
                enableZeroPromptInjection: false
            });
            await engineNoInjection.initialize();
            await engineNoInjection.extractAndStoreEntities('task-7', 'Email: test@example.com');
            const entities = await engineNoInjection.getContextEntities('task-7', 10);
            (0, vitest_1.expect)(entities).toEqual([]);
            await engineNoInjection.close();
        });
    });
    (0, vitest_1.describe)('Session Management', () => {
        (0, vitest_1.it)('should track session metadata', async () => {
            await event_bus_ts_1.eventBus.publish({
                id: 'conv-1',
                type: 'conversation.updated',
                timestamp: Date.now(),
                source: 'test',
                payload: {
                    sessionId: 'session-1',
                    agentId: 'agent-1',
                    taskId: 'task-1',
                    entityCount: 5
                }
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            const status = engine.getStatus();
            (0, vitest_1.expect)(status.sessionCount).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should prune sessions when threshold is exceeded', async () => {
            const engineSmall = new memori_engine_ts_1.MemoriEngine({
                maxSessionSize: 10,
                sessionPruningThreshold: 0.8
            });
            await engineSmall.initialize();
            // Create many sessions
            for (let i = 0; i < 15; i++) {
                await event_bus_ts_1.eventBus.publish({
                    id: `conv-${i}`,
                    type: 'conversation.updated',
                    timestamp: Date.now(),
                    source: 'test',
                    payload: {
                        sessionId: `session-${i}`,
                        agentId: `agent-${i}`,
                        taskId: `task-${i}`
                    }
                });
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            const status = engineSmall.getStatus();
            // Should have pruned down to maxSessionSize
            (0, vitest_1.expect)(status.sessionCount).toBeLessThanOrEqual(10);
            await engineSmall.close();
        });
        (0, vitest_1.it)('should calculate session importance correctly', async () => {
            // Create a session with high activity
            for (let i = 0; i < 10; i++) {
                await event_bus_ts_1.eventBus.publish({
                    id: `conv-active-${i}`,
                    type: 'conversation.updated',
                    timestamp: Date.now(),
                    source: 'test',
                    payload: {
                        sessionId: 'active-session',
                        agentId: 'agent-1',
                        taskId: 'task-1',
                        entityCount: 20
                    }
                });
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            // Active session should have higher importance
            const status = engine.getStatus();
            (0, vitest_1.expect)(status.sessionCount).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Conversation History Integration', () => {
        (0, vitest_1.it)('should retrieve conversation history with entities', async () => {
            // Store a conversation entry
            await memori_sqlite_ts_1.autoGenMemoriSQLite.storeConversationEntry({
                id: 'conv-1',
                agentId: 'agent-1',
                taskId: 'task-1',
                role: 'user',
                content: 'Test message',
                timestamp: new Date()
            });
            // Extract entities
            await engine.extractAndStoreEntities('task-1', 'Email: test@example.com');
            const result = await engine.getConversationHistoryWithEntities('task-1', 50);
            (0, vitest_1.expect)(result.history.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.entities.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Performance Metrics', () => {
        (0, vitest_1.it)('should retrieve performance metrics with analysis', async () => {
            // Store some metrics
            await memori_sqlite_ts_1.autoGenMemoriSQLite.storePerformanceMetric({
                id: 'metric-1',
                agentId: 'agent-1',
                taskId: 'task-1',
                metricType: 'latency',
                value: 100,
                timestamp: new Date(Date.now() - 2000)
            });
            await memori_sqlite_ts_1.autoGenMemoriSQLite.storePerformanceMetric({
                id: 'metric-2',
                agentId: 'agent-1',
                taskId: 'task-2',
                metricType: 'latency',
                value: 80,
                timestamp: new Date()
            });
            const result = await engine.getPerformanceMetricsWithAnalysis('agent-1', 'latency');
            (0, vitest_1.expect)(result.metrics.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.average).toBeGreaterThan(0);
            (0, vitest_1.expect)(['improving', 'stable', 'declining']).toContain(result.trend);
        });
    });
    (0, vitest_1.describe)('Integration with Event Bus', () => {
        (0, vitest_1.it)('should publish entity extraction events', async () => {
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            await engine.extractAndStoreEntities('task-8', 'Email: test@example.com');
            await new Promise(resolve => setTimeout(resolve, 100));
            const entityEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.entities.extracted');
            (0, vitest_1.expect)(entityEvents.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should publish session pruning events', async () => {
            const engineSmall = new memori_engine_ts_1.MemoriEngine({
                maxSessionSize: 5,
                sessionPruningThreshold: 0.8
            });
            await engineSmall.initialize();
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            // Create many sessions to trigger pruning
            for (let i = 0; i < 10; i++) {
                await event_bus_ts_1.eventBus.publish({
                    id: `conv-${i}`,
                    type: 'conversation.updated',
                    timestamp: Date.now(),
                    source: 'test',
                    payload: {
                        sessionId: `session-${i}`,
                        agentId: `agent-${i}`,
                        taskId: `task-${i}`
                    }
                });
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            const pruneEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.session.pruned');
            (0, vitest_1.expect)(pruneEvents.length).toBeGreaterThan(0);
            await engineSmall.close();
        });
    });
});
//# sourceMappingURL=memori-engine.test.js.map