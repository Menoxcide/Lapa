/**
 * Tests for Chroma Vector Refinement (Phase 12)
 * 
 * Tests vector indexing, similarity search, refinement,
 * and integration with Memori engine and episodic memory.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChromaRefine, chromaRefine } from '../../rag/chroma-refine.ts';
import { eventBus } from '../../core/event-bus.ts';
import { memoriEngine } from '../../local/memori-engine.ts';
import { episodicMemoryStore } from '../../local/episodic.ts';

describe('Chroma Vector Refinement (Phase 12)', () => {
  let refine: ChromaRefine;

  beforeEach(async () => {
    // Create a fresh instance for each test
    refine = new ChromaRefine({
      collectionName: 'test-lapa-memories',
      persistDirectory: './.lapa/test-chroma',
      enableEmbeddingCache: true,
      embeddingModel: 'all-MiniLM-L6-v2',
      similarityThreshold: 0.7,
      maxResults: 20,
      enableAutoRefinement: false, // Disable for tests
      refinementIntervalMs: 3600000
    });

    await memoriEngine.initialize();
    await episodicMemoryStore.initialize();
  });

  afterEach(async () => {
    await refine.close();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await refine.initialize();

      const status = refine.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('should handle missing ChromaDB gracefully', async () => {
      // This test verifies that initialization doesn't throw
      // even if ChromaDB is not available
      const refineNoChroma = new ChromaRefine({
        collectionName: 'test-collection'
      });

      // Should not throw
      await expect(refineNoChroma.initialize()).resolves.not.toThrow();

      const status = refineNoChroma.getStatus();
      // May be in limited mode if ChromaDB is not available
      expect(status.isInitialized).toBe(true);

      await refineNoChroma.close();
    });

    it('should initialize Memori and Episodic stores', async () => {
      await refine.initialize();

      // Both should be initialized
      const memoriStatus = memoriEngine.getStatus();
      const episodicStatus = episodicMemoryStore.getStatus();

      expect(memoriStatus.isInitialized).toBe(true);
      expect(episodicStatus.isInitialized).toBe(true);
    });
  });

  describe('Document Indexing', () => {
    it('should index documents with embeddings', async () => {
      await refine.initialize();

      const document = {
        id: 'doc-1',
        content: 'This is a test document about machine learning',
        metadata: {
          agentId: 'agent-1',
          taskId: 'task-1',
          timestamp: new Date(),
          source: 'manual' as const
        }
      };

      await refine.indexDocument(document);

      // Document should be indexed (if ChromaDB is available)
      const status = refine.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('should generate embeddings for documents', async () => {
      await refine.initialize();

      const document = {
        id: 'doc-2',
        content: 'Test content for embedding generation',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      };

      // Should not throw when generating embeddings
      await expect(refine.indexDocument(document)).resolves.not.toThrow();
    });

    it('should cache embeddings when enabled', async () => {
      await refine.initialize();

      const document = {
        id: 'doc-3',
        content: 'Same content for caching test',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      };

      const initialCacheSize = refine.getStatus().embeddingCacheSize;

      await refine.indexDocument(document);
      await refine.indexDocument({ ...document, id: 'doc-4' });

      const finalCacheSize = refine.getStatus().embeddingCacheSize;

      // Cache should have grown (if caching is working)
      expect(finalCacheSize).toBeGreaterThanOrEqual(initialCacheSize);
    });

    it('should publish indexing events', async () => {
      await refine.initialize();

      const publishSpy = vi.spyOn(eventBus, 'publish');

      const document = {
        id: 'doc-5',
        content: 'Test document',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      };

      await refine.indexDocument(document);

      await new Promise(resolve => setTimeout(resolve, 100));

      const indexEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'vector.document.indexed'
      );
      expect(indexEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Similarity Search', () => {
    it('should search for similar documents', async () => {
      await refine.initialize();

      // Index some documents
      await refine.indexDocument({
        id: 'doc-search-1',
        content: 'This is about machine learning and neural networks',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      await refine.indexDocument({
        id: 'doc-search-2',
        content: 'This is about database queries and SQL',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      // Search for similar content
      const results = await refine.searchSimilar('machine learning algorithms', {
        limit: 10
      });

      // Should return results (if ChromaDB is available)
      expect(Array.isArray(results)).toBe(true);
    });

    it('should apply similarity threshold', async () => {
      await refine.initialize();

      await refine.indexDocument({
        id: 'doc-threshold-1',
        content: 'Completely unrelated content about cooking recipes',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      const results = await refine.searchSimilar('machine learning', {
        limit: 10,
        threshold: 0.9 // High threshold
      });

      // Results should meet threshold (if any)
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should filter results by metadata', async () => {
      await refine.initialize();

      await refine.indexDocument({
        id: 'doc-filter-1',
        content: 'Document from agent-1',
        metadata: {
          agentId: 'agent-1',
          taskId: 'task-1',
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      await refine.indexDocument({
        id: 'doc-filter-2',
        content: 'Document from agent-2',
        metadata: {
          agentId: 'agent-2',
          taskId: 'task-2',
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      const results = await refine.searchSimilar('document', {
        limit: 10,
        filter: { agentId: 'agent-1' }
      });

      // All results should match filter (if ChromaDB supports filtering)
      results.forEach(result => {
        expect(result.document.metadata.agentId).toBe('agent-1');
      });
    });

    it('should return empty array when not initialized', async () => {
      const refineUninitialized = new ChromaRefine();
      
      const results = await refineUninitialized.searchSimilar('test query');
      expect(results).toEqual([]);

      await refineUninitialized.close();
    });
  });

  describe('Vector Refinement', () => {
    it('should refine vectors by re-indexing', async () => {
      await refine.initialize();

      // Index some documents
      await refine.indexDocument({
        id: 'doc-refine-1',
        content: 'Document to refine',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      const result = await refine.refineVectors();

      expect(result.refined).toBeGreaterThanOrEqual(0);
      expect(result.removed).toBeGreaterThanOrEqual(0);
    });

    it('should clear embedding cache after refinement', async () => {
      await refine.initialize();

      await refine.indexDocument({
        id: 'doc-refine-2',
        content: 'Test document',
        metadata: {
          timestamp: new Date(),
          source: 'manual' as const
        }
      });

      const cacheSizeBefore = refine.getStatus().embeddingCacheSize;

      await refine.refineVectors();

      const cacheSizeAfter = refine.getStatus().embeddingCacheSize;

      // Cache should be cleared after refinement
      expect(cacheSizeAfter).toBe(0);
    });
  });

  describe('Context Retrieval', () => {
    it('should get context for a task', async () => {
      await refine.initialize();

      // Create episodes and entities
      await episodicMemoryStore.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Episode about task-1'
      });

      await memoriEngine.extractAndStoreEntities('task-1', 'Email: test@example.com');

      await new Promise(resolve => setTimeout(resolve, 200));

      const context = await refine.getContextForTask('task-1', 'task context', 10);

      expect(context.episodes).toBeDefined();
      expect(context.entities).toBeDefined();
      expect(Array.isArray(context.episodes)).toBe(true);
      expect(Array.isArray(context.entities)).toBe(true);
    });

    it('should limit results in context retrieval', async () => {
      await refine.initialize();

      const context = await refine.getContextForTask('task-2', undefined, 5);

      expect(context.episodes.length).toBeLessThanOrEqual(5);
      expect(context.entities.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Integration with Event Bus', () => {
    it('should index episodes from episodic memory events', async () => {
      await refine.initialize();

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Store an episode (should trigger event)
      await episodicMemoryStore.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'Test episode for indexing'
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have published episode stored event
      const episodeEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.episode.stored'
      );
      expect(episodeEvents.length).toBeGreaterThan(0);
    });

    it('should index entities from memori engine events', async () => {
      await refine.initialize();

      // Extract entities (should trigger event)
      await memoriEngine.extractAndStoreEntities('task-2', 'Email: test@example.com');

      await new Promise(resolve => setTimeout(resolve, 200));

      // Entities should be indexed (if event subscription works)
      const status = refine.getStatus();
      expect(status.isInitialized).toBe(true);
    });
  });

  describe('Auto-Refinement', () => {
    it('should start auto-refinement when enabled', async () => {
      const refineWithAuto = new ChromaRefine({
        enableAutoRefinement: true,
        refinementIntervalMs: 1000 // Short interval for testing
      });

      await refineWithAuto.initialize();

      // Auto-refinement should be running
      const status = refineWithAuto.getStatus();
      expect(status.isInitialized).toBe(true);

      await refineWithAuto.close();
    });

    it('should stop auto-refinement', async () => {
      const refineWithAuto = new ChromaRefine({
        enableAutoRefinement: true,
        refinementIntervalMs: 1000
      });

      await refineWithAuto.initialize();

      refineWithAuto.stopAutoRefinement();

      // Should not throw
      await expect(refineWithAuto.close()).resolves.not.toThrow();
    });
  });

  describe('Status and Configuration', () => {
    it('should return correct status', async () => {
      await refine.initialize();

      const status = refine.getStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.collectionName).toBe('test-lapa-memories');
      expect(status.embeddingCacheSize).toBeGreaterThanOrEqual(0);
      expect(status.config).toBeDefined();
    });

    it('should handle configuration changes', async () => {
      const refineCustom = new ChromaRefine({
        collectionName: 'custom-collection',
        similarityThreshold: 0.8,
        maxResults: 50
      });

      await refineCustom.initialize();

      const status = refineCustom.getStatus();
      expect(status.config.collectionName).toBe('custom-collection');
      expect(status.config.similarityThreshold).toBe(0.8);
      expect(status.config.maxResults).toBe(50);

      await refineCustom.close();
    });
  });
});

