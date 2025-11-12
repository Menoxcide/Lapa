/**
 * Chroma Vector Refinement for LAPA v1.2 Phase 12
 * 
 * Integrates Chroma vector database for semantic search and vector refinement.
 * Provides enhanced RAG capabilities with vector embeddings and similarity search.
 * 
 * Features:
 * - Vector embedding generation and storage
 * - Semantic similarity search
 * - Vector refinement and re-indexing
 * - Integration with RAG pipeline
 * - Integration with Memori engine and episodic memory
 * 
 * Note: Requires chromadb package to be installed:
 *   npm install chromadb
 *   or
 *   pnpm add chromadb
 */

import { memoriEngine } from '../local/memori-engine.ts';
import { episodicMemoryStore } from '../local/episodic.ts';
import { eventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

// Chroma configuration
export interface ChromaRefineConfig {
  collectionName: string;
  persistDirectory?: string; // Directory for persistent storage
  enableEmbeddingCache: boolean;
  embeddingModel: string; // Model name for embeddings (e.g., 'all-MiniLM-L6-v2')
  similarityThreshold: number; // 0-1, minimum similarity for results
  maxResults: number;
  enableAutoRefinement: boolean;
  refinementIntervalMs: number;
}

// Default configuration
const DEFAULT_CONFIG: ChromaRefineConfig = {
  collectionName: 'lapa-memories',
  persistDirectory: './.lapa/chroma',
  enableEmbeddingCache: true,
  embeddingModel: 'all-MiniLM-L6-v2', // Default lightweight model
  similarityThreshold: 0.7,
  maxResults: 20,
  enableAutoRefinement: true,
  refinementIntervalMs: 3600000 // 1 hour
};

// Vector document representation
export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    agentId?: string;
    taskId?: string;
    sessionId?: string;
    timestamp: Date;
    source: 'episodic' | 'memori' | 'rag' | 'manual';
    tags?: string[];
    [key: string]: any;
  };
  embedding?: number[];
}

// Search result
export interface VectorSearchResult {
  document: VectorDocument;
  similarity: number;
  distance: number;
}

// Chroma client type (will be dynamically imported)
type ChromaClient = any;
type Collection = any;

/**
 * Chroma Vector Refinement Engine
 */
export class ChromaRefine {
  private config: ChromaRefineConfig;
  private client: ChromaClient | null;
  private collection: Collection | null;
  private isInitialized: boolean;
  private embeddingCache: Map<string, number[]>;
  private refinementTimer: NodeJS.Timeout | null;

  constructor(config?: Partial<ChromaRefineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = null;
    this.collection = null;
    this.isInitialized = false;
    this.embeddingCache = new Map();
    this.refinementTimer = null;
  }

  /**
   * Initializes Chroma client and collection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Try to import ChromaDB
      let ChromaClient: any;
      try {
        // Dynamic import to handle optional dependency
        const chromadb = await import('chromadb');
        ChromaClient = chromadb.ChromaClient;
      } catch (error) {
        console.warn(
          'ChromaDB not found. Install it with: npm install chromadb or pnpm add chromadb\n' +
          'ChromaRefine will operate in limited mode without vector search.'
        );
        this.isInitialized = true; // Mark as initialized but in limited mode
        return;
      }

      // Initialize Chroma client
      this.client = new ChromaClient({
        path: this.config.persistDirectory
      });

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.config.collectionName
        });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.config.collectionName,
          metadata: {
            embeddingModel: this.config.embeddingModel
          }
        });
      }

      // Initialize other components
      await memoriEngine.initialize();
      await episodicMemoryStore.initialize();

      // Setup event subscriptions
      this.setupEventSubscriptions();

      // Start auto-refinement if enabled
      if (this.config.enableAutoRefinement) {
        this.startAutoRefinement();
      }

      this.isInitialized = true;
      console.log('Chroma Refine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chroma Refine:', error);
      // Don't throw - allow limited operation
      this.isInitialized = true;
    }
  }

  /**
   * Sets up event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Subscribe to episode storage events
    eventBus.subscribe('memory.episode.stored', async (event) => {
      if (event.payload?.episodeId) {
        // Get episode from episodic store
        const episodes = await episodicMemoryStore.getEpisodesByTask(
          event.payload.taskId || 'unknown',
          1
        );
        if (episodes.length > 0) {
          await this.indexDocument({
            id: episodes[0].id,
            content: episodes[0].content,
            metadata: {
              agentId: episodes[0].agentId,
              taskId: episodes[0].taskId,
              sessionId: episodes[0].sessionId,
              timestamp: episodes[0].timestamp,
              source: 'episodic',
              tags: episodes[0].tags
            }
          });
        }
      }
    });

    // Subscribe to entity extraction events
    eventBus.subscribe('memory.entities.extracted', async (event) => {
      if (event.payload?.entities && this.collection) {
        // Index entities as documents
        for (const entity of event.payload.entities) {
          await this.indexDocument({
            id: `entity_${entity.id}`,
            content: `${entity.type}: ${entity.value}`,
            metadata: {
              taskId: event.payload.taskId,
              timestamp: new Date(),
              source: 'memori',
              entityType: entity.type
            }
          });
        }
      }
    });
  }

  /**
   * Generates embedding for text (placeholder - requires actual embedding model)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.config.enableEmbeddingCache && this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    // TODO: Implement actual embedding generation
    // For now, return a placeholder vector
    // In production, this would use:
    // - OpenAI embeddings API
    // - Local embedding model (e.g., sentence-transformers)
    // - Or Chroma's built-in embedding function

    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(val => val / magnitude);

    // Cache if enabled
    if (this.config.enableEmbeddingCache) {
      this.embeddingCache.set(text, normalized);
    }

    return normalized;
  }

  /**
   * Indexes a document in Chroma
   */
  async indexDocument(document: VectorDocument): Promise<void> {
    if (!this.collection || !this.isInitialized) {
      console.warn('Chroma not initialized, skipping document indexing');
      return;
    }

    try {
      // Generate embedding if not provided
      if (!document.embedding) {
        document.embedding = await this.generateEmbedding(document.content);
      }

      // Add to collection
      await this.collection.add({
        ids: [document.id],
        embeddings: [document.embedding],
        metadatas: [{
          ...document.metadata,
          timestamp: document.metadata.timestamp.toISOString()
        }],
        documents: [document.content]
      });

      // Publish indexing event
      await eventBus.publish({
        id: `vector_indexed_${Date.now()}`,
        type: 'vector.document.indexed',
        timestamp: Date.now(),
        source: 'chroma-refine',
        payload: {
          documentId: document.id,
          source: document.metadata.source
        }
      } as LAPAEvent);
    } catch (error) {
      console.error('Failed to index document:', error);
    }
  }

  /**
   * Searches for similar documents
   */
  async searchSimilar(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      filter?: Record<string, any>;
    }
  ): Promise<VectorSearchResult[]> {
    if (!this.collection || !this.isInitialized) {
      console.warn('Chroma not initialized, returning empty results');
      return [];
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Build filter if provided
      const where: any = {};
      if (options?.filter) {
        Object.assign(where, options.filter);
      }

      // Search collection
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: options?.limit || this.config.maxResults,
        where
      });

      // Transform results
      const searchResults: VectorSearchResult[] = [];
      const ids = results.ids[0] || [];
      const distances = results.distances[0] || [];
      const documents = results.documents[0] || [];
      const metadatas = results.metadatas[0] || [];

      for (let i = 0; i < ids.length; i++) {
        const distance = distances[i];
        const similarity = 1 - distance; // Convert distance to similarity

        // Apply threshold
        const threshold = options?.threshold || this.config.similarityThreshold;
        if (similarity < threshold) {
          continue;
        }

        searchResults.push({
          document: {
            id: ids[i],
            content: documents[i],
            metadata: {
              ...metadatas[i],
              timestamp: new Date(metadatas[i].timestamp || Date.now())
            }
          },
          similarity,
          distance
        });
      }

      return searchResults;
    } catch (error) {
      console.error('Failed to search similar documents:', error);
      return [];
    }
  }

  /**
   * Refines vectors by re-indexing with updated embeddings
   */
  async refineVectors(): Promise<{
    refined: number;
    removed: number;
  } {
    if (!this.collection || !this.isInitialized) {
      return { refined: 0, removed: 0 };
    }

    try {
      // Get all documents from collection
      const allDocs = await this.collection.get();

      let refined = 0;
      let removed = 0;

      // Re-index each document with fresh embedding
      for (let i = 0; i < allDocs.ids.length; i++) {
        const id = allDocs.ids[i];
        const content = allDocs.documents[i];
        const metadata = allDocs.metadatas[i];

        // Generate fresh embedding
        const newEmbedding = await this.generateEmbedding(content);

        // Update in collection
        await this.collection.update({
          ids: [id],
          embeddings: [newEmbedding],
          metadatas: [metadata],
          documents: [content]
        });

        refined++;
      }

      // Clear embedding cache to force regeneration
      this.embeddingCache.clear();

      console.log(`Refined ${refined} vectors`);

      return { refined, removed };
    } catch (error) {
      console.error('Failed to refine vectors:', error);
      return { refined: 0, removed: 0 };
    }
  }

  /**
   * Starts auto-refinement timer
   */
  private startAutoRefinement(): void {
    if (this.refinementTimer) {
      clearInterval(this.refinementTimer);
    }

    this.refinementTimer = setInterval(async () => {
      await this.refineVectors();
    }, this.config.refinementIntervalMs);
  }

  /**
   * Stops auto-refinement
   */
  stopAutoRefinement(): void {
    if (this.refinementTimer) {
      clearInterval(this.refinementTimer);
      this.refinementTimer = null;
    }
  }

  /**
   * Gets context for a task by searching similar episodes and entities
   */
  async getContextForTask(
    taskId: string,
    query?: string,
    limit: number = 10
  ): Promise<{
    episodes: VectorSearchResult[];
    entities: VectorSearchResult[];
  }> {
    const searchQuery = query || `task ${taskId}`;

    // Search for episodes
    const episodeResults = await this.searchSimilar(searchQuery, {
      limit: Math.floor(limit / 2),
      filter: { source: 'episodic', taskId }
    });

    // Search for entities
    const entityResults = await this.searchSimilar(searchQuery, {
      limit: Math.floor(limit / 2),
      filter: { source: 'memori', taskId }
    });

    return {
      episodes: episodeResults,
      entities: entityResults
    };
  }

  /**
   * Gets status of Chroma refine
   */
  getStatus(): {
    isInitialized: boolean;
    hasChromaClient: boolean;
    collectionName: string;
    embeddingCacheSize: number;
    config: ChromaRefineConfig;
  } {
    return {
      isInitialized: this.isInitialized,
      hasChromaClient: this.client !== null && this.collection !== null,
      collectionName: this.config.collectionName,
      embeddingCacheSize: this.embeddingCache.size,
      config: this.config
    };
  }

  /**
   * Closes Chroma refine
   */
  async close(): Promise<void> {
    this.stopAutoRefinement();
    this.embeddingCache.clear();
    
    // Close Chroma client if available
    if (this.client && typeof this.client.close === 'function') {
      await this.client.close();
    }

    this.client = null;
    this.collection = null;
    this.isInitialized = false;
    console.log('Chroma Refine closed');
  }
}

// Export singleton instance
export const chromaRefine = new ChromaRefine();

// Export types
export type { ChromaRefineConfig, VectorDocument, VectorSearchResult };

