"use strict";
/**
 * Memori Engine for LAPA v1.2 Phase 12
 *
 * Enhanced Memori engine that provides entity extraction, session pruning,
 * and integration with episodic memory and vector refinement.
 *
 * Features:
 * - Entity extraction and persistence
 * - Session pruning (Kaggle-inspired)
 * - Integration with episodic memory
 * - Performance metrics tracking
 * - Zero-prompt memory injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoriEngine = exports.MemoriEngine = void 0;
const memori_sqlite_ts_1 = require("./memori-sqlite.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
// Default configuration
const DEFAULT_CONFIG = {
    enableEntityExtraction: true,
    enableSessionPruning: true,
    enableEpisodicIntegration: true,
    maxSessionSize: 1000,
    sessionPruningThreshold: 0.8, // Prune when 80% full
    entityConfidenceThreshold: 0.7,
    enableZeroPromptInjection: true,
    maxEntitiesPerTask: 50,
    enableSwarmSessionPersistence: true
};
/**
 * Memori Engine - Enhanced memory management for LAPA agents
 */
class MemoriEngine {
    config;
    sessions;
    entityCache;
    isInitialized;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessions = new Map();
        this.entityCache = new Map();
        this.isInitialized = false;
    }
    /**
     * Initializes the Memori engine
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Initialize underlying SQLite storage
            await memori_sqlite_ts_1.autoGenMemoriSQLite.initialize();
            // Subscribe to relevant events
            this.setupEventSubscriptions();
            this.isInitialized = true;
            console.log('Memori Engine initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Memori Engine:', error);
            throw error;
        }
    }
    /**
     * Sets up event subscriptions for memory integration
     */
    setupEventSubscriptions() {
        // Subscribe to task events for automatic entity extraction
        event_bus_ts_1.eventBus.subscribe('task.completed', async (event) => {
            if (this.config.enableEntityExtraction && event.payload?.taskId) {
                await this.extractAndStoreEntities(event.payload.taskId, event.payload.result);
            }
        });
        // Subscribe to conversation events for session tracking
        event_bus_ts_1.eventBus.subscribe('conversation.updated', async (event) => {
            if (event.payload?.sessionId) {
                await this.updateSessionMetadata(event.payload.sessionId, event.payload);
            }
        });
        // Subscribe to swarm session events for persistence
        if (this.config.enableSwarmSessionPersistence) {
            event_bus_ts_1.eventBus.subscribe('swarm.session.created', async (event) => {
                await this.handleSwarmSessionCreated(event);
            });
            event_bus_ts_1.eventBus.subscribe('swarm.session.participant.joined', async (event) => {
                await this.handleSwarmSessionParticipantJoined(event);
            });
            event_bus_ts_1.eventBus.subscribe('swarm.session.participant.left', async (event) => {
                await this.handleSwarmSessionParticipantLeft(event);
            });
            event_bus_ts_1.eventBus.subscribe('swarm.session.closed', async (event) => {
                await this.handleSwarmSessionClosed(event);
            });
            event_bus_ts_1.eventBus.subscribe('swarm.task.completed', async (event) => {
                await this.handleSwarmTaskCompleted(event);
            });
            event_bus_ts_1.eventBus.subscribe('swarm.task.vetoed', async (event) => {
                await this.handleSwarmTaskVetoed(event);
            });
        }
    }
    /**
     * Extracts and stores entities from task results
     */
    async extractAndStoreEntities(taskId, result) {
        if (!this.config.enableEntityExtraction) {
            return [];
        }
        try {
            // Convert result to string for extraction
            const resultText = typeof result === 'string' ? result : JSON.stringify(result);
            // Use the underlying SQLite entity extraction
            const baseEntities = await memori_sqlite_ts_1.autoGenMemoriSQLite.extractEntities({ id: 'system' }, { id: taskId }, resultText);
            // Enhance entities with additional metadata
            const enhancedEntities = baseEntities
                .filter(e => e.confidence >= this.config.entityConfidenceThreshold)
                .map(entity => ({
                ...entity,
                importance: this.calculateEntityImportance(entity),
                relatedEntities: [],
                lastAccessed: new Date(),
                accessCount: 1
            }));
            // Store enhanced entities
            for (const entity of enhancedEntities) {
                await this.storeEnhancedEntity(entity);
            }
            // Limit entities per task
            if (enhancedEntities.length > this.config.maxEntitiesPerTask) {
                // Keep only the most important entities
                enhancedEntities.sort((a, b) => b.importance - a.importance);
                const toKeep = enhancedEntities.slice(0, this.config.maxEntitiesPerTask);
                const toRemove = enhancedEntities.slice(this.config.maxEntitiesPerTask);
                for (const entity of toRemove) {
                    await this.removeEntity(entity.id);
                }
            }
            // Publish entity extraction event
            await event_bus_ts_1.eventBus.publish({
                id: `entity_extract_${Date.now()}`,
                type: 'memory.entities.extracted',
                timestamp: Date.now(),
                source: 'memori-engine',
                payload: {
                    taskId,
                    entityCount: enhancedEntities.length,
                    entities: enhancedEntities.map(e => ({ id: e.id, type: e.type, value: e.value }))
                }
            });
            return enhancedEntities;
        }
        catch (error) {
            console.error('Failed to extract and store entities:', error);
            return [];
        }
    }
    /**
     * Calculates importance score for an entity
     */
    calculateEntityImportance(entity) {
        let importance = entity.confidence;
        // Boost importance for certain entity types
        const typeBoosts = {
            'email': 0.1,
            'url': 0.15,
            'filepath': 0.2,
            'function': 0.25,
            'class': 0.3,
            'variable': 0.1
        };
        importance += typeBoosts[entity.type] || 0;
        // Cap at 1.0
        return Math.min(1.0, importance);
    }
    /**
     * Stores an enhanced entity
     */
    async storeEnhancedEntity(entity) {
        // Store in SQLite
        await memori_sqlite_ts_1.autoGenMemoriSQLite.storeEntity(entity);
        // Cache in memory
        this.entityCache.set(entity.id, entity);
    }
    /**
     * Removes an entity
     */
    async removeEntity(entityId) {
        this.entityCache.delete(entityId);
        // Note: SQLite deletion would require additional method
    }
    /**
     * Retrieves entities for context injection (zero-prompt)
     */
    async getContextEntities(taskId, limit = 20) {
        if (!this.config.enableZeroPromptInjection) {
            return [];
        }
        try {
            // Get entities related to the task
            const taskEntities = Array.from(this.entityCache.values())
                .filter(e => e.taskId === taskId)
                .sort((a, b) => b.importance - a.importance)
                .slice(0, limit);
            // Update access counts
            for (const entity of taskEntities) {
                entity.lastAccessed = new Date();
                entity.accessCount++;
                this.entityCache.set(entity.id, entity);
            }
            return taskEntities;
        }
        catch (error) {
            console.error('Failed to retrieve context entities:', error);
            return [];
        }
    }
    /**
     * Updates session metadata
     */
    async updateSessionMetadata(sessionId, data) {
        const session = this.sessions.get(sessionId) || {
            sessionId,
            agentId: data.agentId || 'unknown',
            taskId: data.taskId || 'unknown',
            startTime: new Date(),
            lastActivity: new Date(),
            entryCount: 0,
            entityCount: 0,
            importance: 0.5
        };
        session.lastActivity = new Date();
        session.entryCount++;
        if (data.entityCount) {
            session.entityCount = data.entityCount;
        }
        // Calculate session importance
        session.importance = this.calculateSessionImportance(session);
        this.sessions.set(sessionId, session);
        // Check if pruning is needed
        if (this.config.enableSessionPruning) {
            await this.checkAndPruneSessions();
        }
    }
    /**
     * Calculates session importance
     */
    calculateSessionImportance(session) {
        const ageHours = (Date.now() - session.startTime.getTime()) / (1000 * 60 * 60);
        const activityScore = Math.min(1.0, session.entryCount / 100);
        const entityScore = Math.min(1.0, session.entityCount / 50);
        const recencyScore = Math.max(0, 1 - ageHours / 168); // Decay over 1 week
        return (activityScore * 0.3 + entityScore * 0.4 + recencyScore * 0.3);
    }
    /**
     * Checks and prunes sessions if needed (Kaggle-inspired)
     */
    async checkAndPruneSessions() {
        const totalSessions = this.sessions.size;
        const threshold = this.config.maxSessionSize * this.config.sessionPruningThreshold;
        if (totalSessions <= threshold) {
            return; // No pruning needed
        }
        // Sort sessions by importance (ascending)
        const sortedSessions = Array.from(this.sessions.entries())
            .sort((a, b) => a[1].importance - b[1].importance);
        // Calculate how many to prune
        const toPrune = totalSessions - this.config.maxSessionSize;
        // Remove least important sessions
        for (let i = 0; i < toPrune && i < sortedSessions.length; i++) {
            const [sessionId] = sortedSessions[i];
            this.sessions.delete(sessionId);
            // Publish pruning event
            await event_bus_ts_1.eventBus.publish({
                id: `session_prune_${Date.now()}`,
                type: 'memory.session.pruned',
                timestamp: Date.now(),
                source: 'memori-engine',
                payload: { sessionId }
            });
        }
        console.log(`Pruned ${toPrune} sessions (${totalSessions} -> ${this.sessions.size})`);
    }
    /**
     * Gets conversation history with entity context
     */
    async getConversationHistoryWithEntities(taskId, limit = 50) {
        const history = await memori_sqlite_ts_1.autoGenMemoriSQLite.getConversationHistory(taskId, limit);
        const entities = await this.getContextEntities(taskId, 20);
        return { history, entities };
    }
    /**
     * Gets performance metrics with analysis
     */
    async getPerformanceMetricsWithAnalysis(agentId, metricType) {
        const metrics = await memori_sqlite_ts_1.autoGenMemoriSQLite.getPerformanceMetrics(agentId, metricType);
        if (metrics.length === 0) {
            return { metrics: [], average: 0, trend: 'stable' };
        }
        const average = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        // Calculate trend (comparing recent vs older metrics)
        const recent = metrics.slice(0, Math.floor(metrics.length / 2));
        const older = metrics.slice(Math.floor(metrics.length / 2));
        const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
        const diff = recentAvg - olderAvg;
        const trend = diff > 0.05 ? 'improving' : diff < -0.05 ? 'declining' : 'stable';
        return { metrics, average, trend };
    }
    /**
     * Gets status of the Memori engine
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            sessionCount: this.sessions.size,
            entityCacheSize: this.entityCache.size,
            config: this.config
        };
    }
    /**
     * Closes the Memori engine
     */
    /**
     * Handles swarm session created event
     */
    async handleSwarmSessionCreated(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            // We'll need to get the full session data from the swarm session manager
            // For now, we'll just store basic session info
            const sessionId = event.payload.sessionId;
            const hostUserId = event.payload.hostUserId;
            if (sessionId && hostUserId) {
                const persistedSession = {
                    sessionId,
                    hostUserId,
                    status: 'active',
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    config: '{}' // Empty config for now
                };
                await memori_sqlite_ts_1.autoGenMemoriSQLite.storeSwarmSession(persistedSession);
                console.log(`Persisted swarm session creation: ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm session creation:', error);
        }
    }
    /**
     * Handles swarm session participant joined event
     */
    async handleSwarmSessionParticipantJoined(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            const sessionId = event.payload.sessionId;
            const userId = event.payload.userId;
            const agentId = event.payload.agentId;
            const displayName = event.payload.displayName;
            if (sessionId && userId && displayName) {
                const persistedParticipant = {
                    sessionId,
                    userId,
                    agentId,
                    displayName,
                    joinedAt: new Date(),
                    isHost: 0, // Will be updated when we have full session data
                    capabilities: '[]', // Empty capabilities for now
                    connectionState: 'connected'
                };
                await memori_sqlite_ts_1.autoGenMemoriSQLite.storeSwarmSessionParticipant(persistedParticipant);
                console.log(`Persisted participant join: ${userId} in session ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm session participant join:', error);
        }
    }
    /**
     * Handles swarm session participant left event
     */
    async handleSwarmSessionParticipantLeft(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            const sessionId = event.payload.sessionId;
            const userId = event.payload.userId;
            if (sessionId && userId) {
                await memori_sqlite_ts_1.autoGenMemoriSQLite.removeSwarmSessionParticipant(sessionId, userId);
                console.log(`Persisted participant leave: ${userId} from session ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm session participant leave:', error);
        }
    }
    /**
     * Handles swarm session closed event
     */
    async handleSwarmSessionClosed(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            const sessionId = event.payload.sessionId;
            if (sessionId) {
                await memori_sqlite_ts_1.autoGenMemoriSQLite.removeSwarmSession(sessionId);
                console.log(`Persisted session closure: ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm session closure:', error);
        }
    }
    /**
     * Handles swarm task completed event
     */
    async handleSwarmTaskCompleted(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            const sessionId = event.payload.sessionId;
            const taskId = event.payload.taskId;
            const task = event.payload.task;
            if (sessionId && taskId && task) {
                const persistedTask = {
                    sessionId,
                    taskId,
                    taskData: JSON.stringify(task)
                };
                await memori_sqlite_ts_1.autoGenMemoriSQLite.storeSwarmSessionTask(persistedTask);
                console.log(`Persisted task completion: ${taskId} in session ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm task completion:', error);
        }
    }
    /**
     * Handles swarm task vetoed event
     */
    async handleSwarmTaskVetoed(event) {
        if (!this.config.enableSwarmSessionPersistence || !event.payload) {
            return;
        }
        try {
            const sessionId = event.payload.sessionId;
            const taskId = event.payload.taskId;
            const vetoId = event.payload.vetoId;
            if (sessionId && taskId && vetoId) {
                // Store the veto information
                const persistedVeto = {
                    sessionId,
                    taskId,
                    votingSessionId: vetoId // Using vetoId as votingSessionId for now
                };
                await memori_sqlite_ts_1.autoGenMemoriSQLite.storeSwarmSessionVeto(persistedVeto);
                console.log(`Persisted task veto: ${taskId} in session ${sessionId}`);
            }
        }
        catch (error) {
            console.error('Failed to persist swarm task veto:', error);
        }
    }
    /**
     * Recovers swarm sessions from persistence
     */
    async recoverSwarmSessions() {
        if (!this.config.enableSwarmSessionPersistence) {
            return;
        }
        try {
            // Get all persisted sessions
            const persistedSessions = await memori_sqlite_ts_1.autoGenMemoriSQLite.getAllSwarmSessions();
            // For each session, we would notify the swarm session manager to restore it
            // This would require the swarm session manager to have a method for restoring sessions
            // from persisted data
            console.log(`Recovered ${persistedSessions.length} swarm sessions from persistence`);
        }
        catch (error) {
            console.error('Failed to recover swarm sessions:', error);
        }
    }
    async close() {
        await memori_sqlite_ts_1.autoGenMemoriSQLite.close();
        this.sessions.clear();
        this.entityCache.clear();
        this.isInitialized = false;
        console.log('Memori Engine closed');
    }
}
exports.MemoriEngine = MemoriEngine;
// Export singleton instance
exports.memoriEngine = new MemoriEngine();
//# sourceMappingURL=memori-engine.js.map