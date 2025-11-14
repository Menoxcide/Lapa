"use strict";
/**
 * Episodic Memory Store for LAPA v1.2 Phase 12
 *
 * Implements episodic memory for storing and retrieving past interactions
 * with temporal indexing and semantic search capabilities.
 *
 * Features:
 * - Temporal indexing of interactions
 * - Semantic similarity search
 * - Integration with Memori engine
 * - Session-based organization
 * - Decay-based importance scoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.episodicMemoryStore = exports.EpisodicMemoryStore = void 0;
const memori_engine_ts_1 = require("./memori-engine.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
// Default configuration
const DEFAULT_CONFIG = {
    enableTemporalIndexing: true,
    enableSemanticSearch: true,
    maxEpisodes: 5000,
    decayFactor: 0.85, // Matches resonance-core decay
    importanceThreshold: 0.3,
    enableAutoPruning: true,
    temporalWindowHours: 24
};
/**
 * Episodic Memory Store
 */
class EpisodicMemoryStore {
    config;
    episodes;
    temporalIndex;
    semanticIndex;
    agentEpisodes; // agentId -> episodeIds
    taskEpisodes; // taskId -> episodeIds
    isInitialized;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.episodes = new Map();
        this.temporalIndex = [];
        this.semanticIndex = new Map();
        this.agentEpisodes = new Map();
        this.taskEpisodes = new Map();
        this.isInitialized = false;
    }
    /**
     * Initializes the episodic memory store
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Ensure Memori engine is initialized
            await memori_engine_ts_1.memoriEngine.initialize();
            // Setup event subscriptions
            this.setupEventSubscriptions();
            this.isInitialized = true;
            console.log('Episodic Memory Store initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Episodic Memory Store:', error);
            throw error;
        }
    }
    /**
     * Sets up event subscriptions
     */
    setupEventSubscriptions() {
        // Subscribe to task completion events
        event_bus_ts_1.eventBus.subscribe('task.completed', async (event) => {
            const payload = event.payload;
            if (payload?.taskId && payload?.result) {
                await this.storeEpisode({
                    agentId: payload.agentId || 'system',
                    taskId: payload.taskId,
                    sessionId: payload.sessionId || `session_${payload.taskId}`,
                    content: typeof payload.result === 'string'
                        ? payload.result
                        : JSON.stringify(payload.result),
                    context: payload.context || {}
                });
            }
        });
        // Subscribe to conversation events
        event_bus_ts_1.eventBus.subscribe('conversation.updated', async (event) => {
            const payload = event.payload;
            if (payload?.content) {
                await this.storeEpisode({
                    agentId: payload.agentId || 'system',
                    taskId: payload.taskId || 'unknown',
                    sessionId: payload.sessionId || 'unknown',
                    content: payload.content,
                    context: payload.context || {}
                });
            }
        });
    }
    /**
     * Stores an episode
     */
    async storeEpisode(data) {
        const episodeId = `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date();
        // Calculate initial importance
        const importance = this.calculateInitialImportance(data);
        // Extract keywords for semantic indexing
        const keywords = this.extractKeywords(data.content);
        const episode = {
            id: episodeId,
            agentId: data.agentId,
            taskId: data.taskId,
            sessionId: data.sessionId,
            timestamp,
            content: data.content,
            context: data.context || {},
            importance,
            tags: data.tags || [],
            relatedEpisodes: [],
            accessCount: 0,
            lastAccessed: timestamp
        };
        // Store episode
        this.episodes.set(episodeId, episode);
        // Update indexes
        this.updateTemporalIndex(episode);
        this.updateSemanticIndex(episode, keywords);
        this.updateAgentIndex(episode);
        this.updateTaskIndex(episode);
        // Find related episodes
        episode.relatedEpisodes = await this.findRelatedEpisodes(episode);
        // Publish episode stored event
        await event_bus_ts_1.eventBus.publish({
            id: `episode_stored_${Date.now()}`,
            type: 'memory.episode.stored',
            timestamp: Date.now(),
            source: 'episodic-memory',
            payload: {
                episodeId,
                agentId: data.agentId,
                taskId: data.taskId
            }
        });
        // Check if pruning is needed
        if (this.config.enableAutoPruning) {
            await this.checkAndPrune();
        }
        return episode;
    }
    /**
     * Calculates initial importance for an episode
     */
    calculateInitialImportance(data) {
        let importance = 0.5; // Base importance
        // Boost based on content length (longer = more important)
        const lengthScore = Math.min(1.0, data.content.length / 1000);
        importance += lengthScore * 0.2;
        // Boost based on context richness
        if (data.context) {
            const contextKeys = Object.keys(data.context).length;
            const contextScore = Math.min(1.0, contextKeys / 10);
            importance += contextScore * 0.2;
        }
        // Boost for certain keywords (task completion, errors, etc.)
        const importantKeywords = ['error', 'complete', 'success', 'fail', 'critical', 'important'];
        const keywordCount = importantKeywords.filter(kw => data.content.toLowerCase().includes(kw)).length;
        importance += (keywordCount / importantKeywords.length) * 0.1;
        return Math.min(1.0, importance);
    }
    /**
     * Extracts keywords from content
     */
    extractKeywords(content) {
        // Simple keyword extraction (can be enhanced with NLP)
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
        // Count word frequencies
        const wordFreq = new Map();
        for (const word of words) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
        // Get top keywords
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }
    /**
     * Updates temporal index
     */
    updateTemporalIndex(episode) {
        if (!this.config.enableTemporalIndexing) {
            return;
        }
        this.temporalIndex.push({
            episodeId: episode.id,
            timestamp: episode.timestamp,
            importance: episode.importance
        });
        // Sort by timestamp (newest first)
        this.temporalIndex.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Updates semantic index
     */
    updateSemanticIndex(episode, keywords) {
        if (!this.config.enableSemanticSearch) {
            return;
        }
        this.semanticIndex.set(episode.id, {
            episodeId: episode.id,
            keywords
        });
    }
    /**
     * Updates agent index
     */
    updateAgentIndex(episode) {
        if (!this.agentEpisodes.has(episode.agentId)) {
            this.agentEpisodes.set(episode.agentId, []);
        }
        this.agentEpisodes.get(episode.agentId).push(episode.id);
    }
    /**
     * Updates task index
     */
    updateTaskIndex(episode) {
        if (!this.taskEpisodes.has(episode.taskId)) {
            this.taskEpisodes.set(episode.taskId, []);
        }
        this.taskEpisodes.get(episode.taskId).push(episode.id);
    }
    /**
     * Finds related episodes
     */
    async findRelatedEpisodes(episode, limit = 5) {
        const related = [];
        // Find episodes from same agent
        const agentEpisodes = this.agentEpisodes.get(episode.agentId) || [];
        for (const episodeId of agentEpisodes) {
            if (episodeId === episode.id)
                continue;
            const otherEpisode = this.episodes.get(episodeId);
            if (!otherEpisode)
                continue;
            // Calculate similarity score
            const score = this.calculateSimilarity(episode, otherEpisode);
            if (score > 0.3) {
                related.push({ id: episodeId, score });
            }
        }
        // Sort by score and return top N
        return related
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => r.id);
    }
    /**
     * Calculates similarity between episodes
     */
    calculateSimilarity(ep1, ep2) {
        let similarity = 0;
        // Same agent boost
        if (ep1.agentId === ep2.agentId) {
            similarity += 0.2;
        }
        // Same task boost
        if (ep1.taskId === ep2.taskId) {
            similarity += 0.3;
        }
        // Keyword overlap
        const keywords1 = this.semanticIndex.get(ep1.id)?.keywords || [];
        const keywords2 = this.semanticIndex.get(ep2.id)?.keywords || [];
        const overlap = keywords1.filter(k => keywords2.includes(k)).length;
        const maxKeywords = Math.max(keywords1.length, keywords2.length);
        if (maxKeywords > 0) {
            similarity += (overlap / maxKeywords) * 0.5;
        }
        return Math.min(1.0, similarity);
    }
    /**
     * Retrieves episodes by temporal query
     */
    async getEpisodesByTime(startTime, endTime, limit = 50) {
        if (!this.config.enableTemporalIndexing) {
            return [];
        }
        const now = new Date();
        const defaultStart = new Date(now.getTime() - this.config.temporalWindowHours * 60 * 60 * 1000);
        const defaultEnd = now;
        const start = startTime || defaultStart;
        const end = endTime || defaultEnd;
        const matching = this.temporalIndex
            .filter(entry => {
            const time = entry.timestamp.getTime();
            return time >= start.getTime() && time <= end.getTime();
        })
            .sort((a, b) => {
            // Sort by importance first, then timestamp
            if (Math.abs(a.importance - b.importance) > 0.01) {
                return b.importance - a.importance;
            }
            return b.timestamp.getTime() - a.timestamp.getTime();
        })
            .slice(0, limit)
            .map(entry => this.episodes.get(entry.episodeId))
            .filter((ep) => ep !== undefined);
        // Update access counts
        for (const episode of matching) {
            episode.lastAccessed = new Date();
            episode.accessCount++;
            this.episodes.set(episode.id, episode);
        }
        return matching;
    }
    /**
     * Retrieves episodes by agent
     */
    async getEpisodesByAgent(agentId, limit = 50) {
        const episodeIds = this.agentEpisodes.get(agentId) || [];
        return episodeIds
            .slice(0, limit)
            .map(id => this.episodes.get(id))
            .filter((ep) => ep !== undefined)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Retrieves episodes by task
     */
    async getEpisodesByTask(taskId, limit = 50) {
        const episodeIds = this.taskEpisodes.get(taskId) || [];
        return episodeIds
            .slice(0, limit)
            .map(id => this.episodes.get(id))
            .filter((ep) => ep !== undefined)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Applies decay to episode importance
     */
    applyDecay(episode) {
        const ageHours = (Date.now() - episode.timestamp.getTime()) / (1000 * 60 * 60);
        const decaySteps = Math.floor(ageHours / 24); // Decay per day
        episode.importance = episode.importance * Math.pow(this.config.decayFactor, decaySteps);
    }
    /**
     * Checks and prunes episodes
     */
    async checkAndPrune() {
        if (this.episodes.size <= this.config.maxEpisodes) {
            return;
        }
        // Apply decay to all episodes
        for (const episode of this.episodes.values()) {
            this.applyDecay(episode);
        }
        // Sort by importance (ascending)
        const sorted = Array.from(this.episodes.entries())
            .sort((a, b) => a[1].importance - b[1].importance);
        // Remove episodes below threshold
        const toRemove = [];
        for (const [id, episode] of sorted) {
            if (episode.importance < this.config.importanceThreshold) {
                toRemove.push(id);
            }
        }
        // Also remove oldest if still over limit
        while (this.episodes.size - toRemove.length > this.config.maxEpisodes) {
            const oldest = sorted.find(([id]) => !toRemove.includes(id));
            if (oldest) {
                toRemove.push(oldest[0]);
            }
            else {
                break;
            }
        }
        // Remove episodes
        for (const id of toRemove) {
            this.removeEpisode(id);
        }
        if (toRemove.length > 0) {
            console.log(`Pruned ${toRemove.length} episodes (${this.episodes.size + toRemove.length} -> ${this.episodes.size})`);
        }
    }
    /**
     * Removes an episode
     */
    removeEpisode(episodeId) {
        const episode = this.episodes.get(episodeId);
        if (!episode)
            return;
        // Remove from indexes
        this.temporalIndex = this.temporalIndex.filter(e => e.episodeId !== episodeId);
        this.semanticIndex.delete(episodeId);
        const agentEpisodes = this.agentEpisodes.get(episode.agentId);
        if (agentEpisodes) {
            const index = agentEpisodes.indexOf(episodeId);
            if (index > -1)
                agentEpisodes.splice(index, 1);
        }
        const taskEpisodes = this.taskEpisodes.get(episode.taskId);
        if (taskEpisodes) {
            const index = taskEpisodes.indexOf(episodeId);
            if (index > -1)
                taskEpisodes.splice(index, 1);
        }
        this.episodes.delete(episodeId);
    }
    /**
     * Gets status of the episodic memory store
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            episodeCount: this.episodes.size,
            temporalIndexSize: this.temporalIndex.length,
            semanticIndexSize: this.semanticIndex.size,
            config: this.config
        };
    }
    /**
     * Closes the episodic memory store
     */
    async close() {
        this.episodes.clear();
        this.temporalIndex = [];
        this.semanticIndex.clear();
        this.agentEpisodes.clear();
        this.taskEpisodes.clear();
        this.isInitialized = false;
        console.log('Episodic Memory Store closed');
    }
}
exports.EpisodicMemoryStore = EpisodicMemoryStore;
// Export singleton instance
exports.episodicMemoryStore = new EpisodicMemoryStore();
// Export types
//# sourceMappingURL=episodic.js.map