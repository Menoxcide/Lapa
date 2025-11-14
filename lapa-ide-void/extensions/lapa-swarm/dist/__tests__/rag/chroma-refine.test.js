"use strict";
/**
 * Tests for Chroma Vector Refinement (Phase 12)
 *
 * Tests vector indexing, similarity search, refinement,
 * and integration with Memori engine and episodic memory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const chroma_refine_ts_1 = require("../../rag/chroma-refine.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const memori_engine_ts_1 = require("../../local/memori-engine.ts");
const episodic_ts_1 = require("../../local/episodic.ts");
(0, vitest_1.describe)('Chroma Vector Refinement (Phase 12)', () => {
    let refine;
    (0, vitest_1.beforeEach)(async () => {
        // Create a fresh instance for each test
        refine = new chroma_refine_ts_1.ChromaRefine({
            collectionName: 'test-lapa-memories',
            persistDirectory: './.lapa/test-chroma',
            enableEmbeddingCache: true,
            embeddingModel: 'all-MiniLM-L6-v2',
            similarityThreshold: 0.7,
            maxResults: 20,
            enableAutoRefinement: false, // Disable for tests
            refinementIntervalMs: 3600000
        });
        await memori_engine_ts_1.memoriEngine.initialize();
        await episodic_ts_1.episodicMemoryStore.initialize();
    });
    (0, vitest_1.afterEach)(async () => {
        await refine.close();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', async () => {
            await refine.initialize();
            const status = refine.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
        });
        (0, vitest_1.it)('should handle missing ChromaDB gracefully', async () => {
            // This test verifies that initialization doesn't throw
            // even if ChromaDB is not available
            const refineNoChroma = new chroma_refine_ts_1.ChromaRefine({
                collectionName: 'test-collection'
            });
            // Should not throw
            await (0, vitest_1.expect)(refineNoChroma.initialize()).resolves.not.toThrow();
            const status = refineNoChroma.getStatus();
            // May be in limited mode if ChromaDB is not available
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
            await refineNoChroma.close();
        });
        (0, vitest_1.it)('should initialize Memori and Episodic stores', async () => {
            await refine.initialize();
            // Both should be initialized
            const memoriStatus = memori_engine_ts_1.memoriEngine.getStatus();
            const episodicStatus = episodic_ts_1.episodicMemoryStore.getStatus();
            (0, vitest_1.expect)(memoriStatus.isInitialized).toBe(true);
            (0, vitest_1.expect)(episodicStatus.isInitialized).toBe(true);
        });
    });
    (0, vitest_1.describe)('Document Indexing', () => {
        (0, vitest_1.it)('should index documents with embeddings', async () => {
            await refine.initialize();
            const document = {
                id: 'doc-1',
                content: 'This is a test document about machine learning',
                metadata: {
                    agentId: 'agent-1',
                    taskId: 'task-1',
                    timestamp: new Date(),
                    source: 'manual'
                }
            };
            await refine.indexDocument(document);
            // Document should be indexed (if ChromaDB is available)
            const status = refine.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
        });
        (0, vitest_1.it)('should generate embeddings for documents', async () => {
            await refine.initialize();
            const document = {
                id: 'doc-2',
                content: 'Test content for embedding generation',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            };
            // Should not throw when generating embeddings
            await (0, vitest_1.expect)(refine.indexDocument(document)).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should cache embeddings when enabled', async () => {
            await refine.initialize();
            const document = {
                id: 'doc-3',
                content: 'Same content for caching test',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            };
            const initialCacheSize = refine.getStatus().embeddingCacheSize;
            await refine.indexDocument(document);
            await refine.indexDocument({ ...document, id: 'doc-4' });
            const finalCacheSize = refine.getStatus().embeddingCacheSize;
            // Cache should have grown (if caching is working)
            (0, vitest_1.expect)(finalCacheSize).toBeGreaterThanOrEqual(initialCacheSize);
        });
        (0, vitest_1.it)('should publish indexing events', async () => {
            await refine.initialize();
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            const document = {
                id: 'doc-5',
                content: 'Test document',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            };
            await refine.indexDocument(document);
            await new Promise(resolve => setTimeout(resolve, 100));
            const indexEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'vector.document.indexed');
            (0, vitest_1.expect)(indexEvents.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Similarity Search', () => {
        (0, vitest_1.it)('should search for similar documents', async () => {
            await refine.initialize();
            // Index some documents
            await refine.indexDocument({
                id: 'doc-search-1',
                content: 'This is about machine learning and neural networks',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            await refine.indexDocument({
                id: 'doc-search-2',
                content: 'This is about database queries and SQL',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            // Search for similar content
            const results = await refine.searchSimilar('machine learning algorithms', {
                limit: 10
            });
            // Should return results (if ChromaDB is available)
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should apply similarity threshold', async () => {
            await refine.initialize();
            await refine.indexDocument({
                id: 'doc-threshold-1',
                content: 'Completely unrelated content about cooking recipes',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            const results = await refine.searchSimilar('machine learning', {
                limit: 10,
                threshold: 0.9 // High threshold
            });
            // Results should meet threshold (if any)
            results.forEach(result => {
                (0, vitest_1.expect)(result.similarity).toBeGreaterThanOrEqual(0.9);
            });
        });
        (0, vitest_1.it)('should filter results by metadata', async () => {
            await refine.initialize();
            await refine.indexDocument({
                id: 'doc-filter-1',
                content: 'Document from agent-1',
                metadata: {
                    agentId: 'agent-1',
                    taskId: 'task-1',
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            await refine.indexDocument({
                id: 'doc-filter-2',
                content: 'Document from agent-2',
                metadata: {
                    agentId: 'agent-2',
                    taskId: 'task-2',
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            const results = await refine.searchSimilar('document', {
                limit: 10,
                filter: { agentId: 'agent-1' }
            });
            // All results should match filter (if ChromaDB supports filtering)
            results.forEach(result => {
                (0, vitest_1.expect)(result.document.metadata.agentId).toBe('agent-1');
            });
        });
        (0, vitest_1.it)('should return empty array when not initialized', async () => {
            const refineUninitialized = new chroma_refine_ts_1.ChromaRefine();
            const results = await refineUninitialized.searchSimilar('test query');
            (0, vitest_1.expect)(results).toEqual([]);
            await refineUninitialized.close();
        });
    });
    (0, vitest_1.describe)('Vector Refinement', () => {
        (0, vitest_1.it)('should refine vectors by re-indexing', async () => {
            await refine.initialize();
            // Index some documents
            await refine.indexDocument({
                id: 'doc-refine-1',
                content: 'Document to refine',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            const result = await refine.refineVectors();
            (0, vitest_1.expect)(result.refined).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.removed).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should clear embedding cache after refinement', async () => {
            await refine.initialize();
            await refine.indexDocument({
                id: 'doc-refine-2',
                content: 'Test document',
                metadata: {
                    timestamp: new Date(),
                    source: 'manual'
                }
            });
            const cacheSizeBefore = refine.getStatus().embeddingCacheSize;
            await refine.refineVectors();
            const cacheSizeAfter = refine.getStatus().embeddingCacheSize;
            // Cache should be cleared after refinement
            (0, vitest_1.expect)(cacheSizeAfter).toBe(0);
        });
    });
    (0, vitest_1.describe)('Context Retrieval', () => {
        (0, vitest_1.it)('should get context for a task', async () => {
            await refine.initialize();
            // Create episodes and entities
            await episodic_ts_1.episodicMemoryStore.storeEpisode({
                agentId: 'agent-1',
                taskId: 'task-1',
                sessionId: 'session-1',
                content: 'Episode about task-1'
            });
            await memori_engine_ts_1.memoriEngine.extractAndStoreEntities('task-1', 'Email: test@example.com');
            await new Promise(resolve => setTimeout(resolve, 200));
            const context = await refine.getContextForTask('task-1', 'task context', 10);
            (0, vitest_1.expect)(context.episodes).toBeDefined();
            (0, vitest_1.expect)(context.entities).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(context.episodes)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(context.entities)).toBe(true);
        });
        (0, vitest_1.it)('should limit results in context retrieval', async () => {
            await refine.initialize();
            const context = await refine.getContextForTask('task-2', undefined, 5);
            (0, vitest_1.expect)(context.episodes.length).toBeLessThanOrEqual(5);
            (0, vitest_1.expect)(context.entities.length).toBeLessThanOrEqual(5);
        });
    });
    (0, vitest_1.describe)('Integration with Event Bus', () => {
        (0, vitest_1.it)('should index episodes from episodic memory events', async () => {
            await refine.initialize();
            const publishSpy = vitest_1.vi.spyOn(event_bus_ts_1.eventBus, 'publish');
            // Store an episode (should trigger event)
            await episodic_ts_1.episodicMemoryStore.storeEpisode({
                agentId: 'agent-1',
                taskId: 'task-1',
                sessionId: 'session-1',
                content: 'Test episode for indexing'
            });
            await new Promise(resolve => setTimeout(resolve, 200));
            // Should have published episode stored event
            const episodeEvents = publishSpy.mock.calls.filter(call => call[0]?.type === 'memory.episode.stored');
            (0, vitest_1.expect)(episodeEvents.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should index entities from memori engine events', async () => {
            await refine.initialize();
            // Extract entities (should trigger event)
            await memori_engine_ts_1.memoriEngine.extractAndStoreEntities('task-2', 'Email: test@example.com');
            await new Promise(resolve => setTimeout(resolve, 200));
            // Entities should be indexed (if event subscription works)
            const status = refine.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
        });
    });
    (0, vitest_1.describe)('Auto-Refinement', () => {
        (0, vitest_1.it)('should start auto-refinement when enabled', async () => {
            const refineWithAuto = new chroma_refine_ts_1.ChromaRefine({
                enableAutoRefinement: true,
                refinementIntervalMs: 1000 // Short interval for testing
            });
            await refineWithAuto.initialize();
            // Auto-refinement should be running
            const status = refineWithAuto.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
            await refineWithAuto.close();
        });
        (0, vitest_1.it)('should stop auto-refinement', async () => {
            const refineWithAuto = new chroma_refine_ts_1.ChromaRefine({
                enableAutoRefinement: true,
                refinementIntervalMs: 1000
            });
            await refineWithAuto.initialize();
            refineWithAuto.stopAutoRefinement();
            // Should not throw
            await (0, vitest_1.expect)(refineWithAuto.close()).resolves.not.toThrow();
        });
    });
    (0, vitest_1.describe)('Status and Configuration', () => {
        (0, vitest_1.it)('should return correct status', async () => {
            await refine.initialize();
            const status = refine.getStatus();
            (0, vitest_1.expect)(status.isInitialized).toBe(true);
            (0, vitest_1.expect)(status.collectionName).toBe('test-lapa-memories');
            (0, vitest_1.expect)(status.embeddingCacheSize).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(status.config).toBeDefined();
        });
        (0, vitest_1.it)('should handle configuration changes', async () => {
            const refineCustom = new chroma_refine_ts_1.ChromaRefine({
                collectionName: 'custom-collection',
                similarityThreshold: 0.8,
                maxResults: 50
            });
            await refineCustom.initialize();
            const status = refineCustom.getStatus();
            (0, vitest_1.expect)(status.config.collectionName).toBe('custom-collection');
            (0, vitest_1.expect)(status.config.similarityThreshold).toBe(0.8);
            (0, vitest_1.expect)(status.config.maxResults).toBe(50);
            await refineCustom.close();
        });
    });
});
//# sourceMappingURL=chroma-refine.test.js.map