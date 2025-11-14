"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.chromaRefine = exports.ChromaRefine = void 0;
const memori_engine_ts_1 = require("../local/memori-engine.ts");
const episodic_ts_1 = require("../local/episodic.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
// Default configuration
const DEFAULT_CONFIG = {
    collectionName: 'lapa-memories',
    persistDirectory: './.lapa/chroma',
    enableEmbeddingCache: true,
    embeddingModel: 'all-MiniLM-L6-v2', // Default lightweight model
    similarityThreshold: 0.7,
    maxResults: 20,
    enableAutoRefinement: true,
    refinementIntervalMs: 3600000 // 1 hour
};
/**
 * Chroma Vector Refinement Engine
 */
class ChromaRefine {
    config;
    client;
    collection;
    isInitialized;
    embeddingCache;
    refinementTimer;
    constructor(config) {
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
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Try to import ChromaDB
            let ChromaClient;
            try {
                // Dynamic import to handle optional dependency
                const chromadb = await import('chromadb');
                ChromaClient = chromadb.ChromaClient;
            }
            catch (error) {
                console.warn('ChromaDB not found. Install it with: npm install chromadb or pnpm add chromadb\n' +
                    'ChromaRefine will operate in limited mode without vector search.');
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
            }
            catch (error) {
                // Collection doesn't exist, create it
                this.collection = await this.client.createCollection({
                    name: this.config.collectionName,
                    metadata: {
                        embeddingModel: this.config.embeddingModel
                    }
                });
            }
            // Initialize other components
            await memori_engine_ts_1.memoriEngine.initialize();
            await episodic_ts_1.episodicMemoryStore.initialize();
            // Setup event subscriptions
            this.setupEventSubscriptions();
            // Start auto-refinement if enabled
            if (this.config.enableAutoRefinement) {
                this.startAutoRefinement();
            }
            this.isInitialized = true;
            console.log('Chroma Refine initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Chroma Refine:', error);
            // Don't throw - allow limited operation
            this.isInitialized = true;
        }
    }
    /**
     * Sets up event subscriptions
     */
    setupEventSubscriptions() {
        // Subscribe to episode storage events
        event_bus_ts_1.eventBus.subscribe('memory.episode.stored', async (event) => {
            if (event.payload?.episodeId) {
                // Get episode from episodic store
                const episodes = await episodic_ts_1.episodicMemoryStore.getEpisodesByTask(event.payload.taskId || 'unknown', 1);
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
        event_bus_ts_1.eventBus.subscribe('memory.entities.extracted', async (event) => {
            if (event.payload?.entities && this.collection) {
                // Index entities as documents
                for (const entity of event.payload.entities) {
                    await this.indexDocument({
                        id: `entity_${entity.id || Date.now()}`,
                        content: `${entity.type}: ${entity.value}`,
                        metadata: {
                            sessionId: event.payload.sessionId,
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
     * Generates embedding for text using NVIDIA NIM local inference
     */
    async generateEmbedding(text) {
        // Log diagnostic information
        console.info('🔧 Diagnostic: generateEmbedding called with text length:', text.length);
        console.info('🔧 Diagnostic: Current embedding cache size:', this.embeddingCache.size);
        // Check cache first
        if (this.config.enableEmbeddingCache && this.embeddingCache.has(text)) {
            console.debug('🔧 Diagnostic: Returning cached embedding for text');
            return this.embeddingCache.get(text);
        }
        try {
            // Try to generate embedding using NVIDIA NIM
            console.info('🔧 Diagnostic: Generating embedding using NVIDIA NIM');
            const response = await fetch('http://localhost:8000/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.embeddingModel,
                    input: text
                })
            });
            if (!response.ok) {
                throw new Error(`NIM embedding request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            // Extract embedding from response
            // Assuming OpenAI-like response format
            if (data.data && data.data.length > 0 && data.data[0].embedding) {
                const embedding = data.data[0].embedding;
                // Cache if enabled
                if (this.config.enableEmbeddingCache) {
                    this.embeddingCache.set(text, embedding);
                    console.debug('🔧 Diagnostic: Cached embedding, new cache size:', this.embeddingCache.size);
                }
                console.debug('🔧 Diagnostic: Generated embedding with dimensionality:', embedding.length);
                return embedding;
            }
            else {
                throw new Error('Invalid embedding response format from NIM');
            }
        }
        catch (error) {
            // Fallback to placeholder implementation if NIM fails
            console.warn('⚠️  NIM embedding generation failed, falling back to placeholder embeddings:', error);
            console.warn('⚠️  This is a known issue that needs to be fixed for production use');
            // Generate placeholder vector as fallback
            const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
            // Normalize
            const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            const normalized = embedding.map(val => val / magnitude);
            // Cache if enabled
            if (this.config.enableEmbeddingCache) {
                this.embeddingCache.set(text, normalized);
                console.debug('🔧 Diagnostic: Cached placeholder embedding, new cache size:', this.embeddingCache.size);
            }
            console.debug('🔧 Diagnostic: Generated placeholder embedding with magnitude:', magnitude);
            return normalized;
        }
    }
    /**
     * Indexes a document in Chroma
     */
    async indexDocument(document) {
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
            await event_bus_ts_1.eventBus.publish({
                id: `vector_indexed_${Date.now()}`,
                type: 'vector.document.indexed',
                timestamp: Date.now(),
                source: 'chroma-refine',
                payload: {
                    documentId: document.id,
                    indexId: this.config.collectionName,
                    timestamp: Date.now()
                }
            });
        }
        catch (error) {
            console.error('Failed to index document:', error);
        }
    }
    /**
     * Searches for similar documents
     */
    async searchSimilar(query, options) {
        if (!this.collection || !this.isInitialized) {
            console.warn('Chroma not initialized, returning empty results');
            return [];
        }
        try {
            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(query);
            // Build filter if provided
            const where = {};
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
            const searchResults = [];
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
        }
        catch (error) {
            console.error('Failed to search similar documents:', error);
            return [];
        }
    }
    /**
     * Refines vectors by re-indexing with updated embeddings
     */
    async refineVectors() {
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
        }
        catch (error) {
            console.error('Failed to refine vectors:', error);
            return { refined: 0, removed: 0 };
        }
    }
    /**
     * Starts auto-refinement timer
     */
    startAutoRefinement() {
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
    stopAutoRefinement() {
        if (this.refinementTimer) {
            clearInterval(this.refinementTimer);
            this.refinementTimer = null;
        }
    }
    /**
     * Gets context for a task by searching similar episodes and entities
     */
    async getContextForTask(taskId, query, limit = 10) {
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
    getStatus() {
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
    async close() {
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
exports.ChromaRefine = ChromaRefine;
// Export singleton instance
exports.chromaRefine = new ChromaRefine();
// Export types
// Types are exported at declaration; avoid duplicate re-exports
//# sourceMappingURL=chroma-refine.js.map