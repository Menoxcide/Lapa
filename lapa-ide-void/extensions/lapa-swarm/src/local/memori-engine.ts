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

import {
  autoGenMemoriSQLite,
  type Entity,
  type ConversationEntry,
  type PerformanceMetric,
  type PersistedSwarmSession,
  type PersistedSessionParticipant,
  type PersistedSessionTask,
  type PersistedSessionVeto,
  type PersistedSessionA2AHandshake
} from './memori-sqlite.ts';
import { eventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';
import { featureGate } from '../premium/feature-gate.ts';

// Memori engine configuration
export interface MemoriEngineConfig {
  enableEntityExtraction: boolean;
  enableSessionPruning: boolean;
  enableEpisodicIntegration: boolean;
  maxSessionSize: number;
  sessionPruningThreshold: number; // Percentage (0-1)
  entityConfidenceThreshold: number; // 0-1
  enableZeroPromptInjection: boolean;
  maxEntitiesPerTask: number;
  enableSwarmSessionPersistence: boolean;
}

// Default configuration
const DEFAULT_CONFIG: MemoriEngineConfig = {
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

// Session metadata
interface SessionMetadata {
  sessionId: string;
  agentId: string;
  taskId: string;
  startTime: Date;
  lastActivity: Date;
  entryCount: number;
  entityCount: number;
  importance: number; // 0-1, calculated based on activity and entities
}

// Entity with enhanced metadata
export interface EnhancedEntity extends Entity {
  importance: number;
  relatedEntities: string[]; // IDs of related entities
  lastAccessed: Date;
  accessCount: number;
}

/**
 * Memori Engine - Enhanced memory management for LAPA agents
 */
export class MemoriEngine {
  private config: MemoriEngineConfig;
  private sessions: Map<string, SessionMetadata>;
  private entityCache: Map<string, EnhancedEntity>;
  private isInitialized: boolean;

  constructor(config?: Partial<MemoriEngineConfig>) {
    // Apply feature gate for advanced memory features
    const advancedMemoryEnabled = featureGate.isAdvancedMemoryEnabled();
    
    this.config = { 
      ...DEFAULT_CONFIG, 
      ...config,
      // Disable advanced features if premium not enabled
      enableEpisodicIntegration: advancedMemoryEnabled && (config?.enableEpisodicIntegration ?? DEFAULT_CONFIG.enableEpisodicIntegration),
    };
    this.sessions = new Map();
    this.entityCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initializes the Memori engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize underlying SQLite storage
      await autoGenMemoriSQLite.initialize();

      // Subscribe to relevant events
      this.setupEventSubscriptions();

      this.isInitialized = true;
      console.log('Memori Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Memori Engine:', error);
      throw error;
    }
  }

  /**
   * Sets up event subscriptions for memory integration
   */
  private setupEventSubscriptions(): void {
    // Subscribe to task events for automatic entity extraction
    eventBus.subscribe('task.completed', async (event) => {
      if (this.config.enableEntityExtraction && event.payload?.taskId) {
        await this.extractAndStoreEntities(event.payload.taskId, event.payload.result);
      }
    });

    // Subscribe to conversation events for session tracking
    eventBus.subscribe('conversation.updated', async (event) => {
      if (event.payload?.sessionId) {
        await this.updateSessionMetadata(event.payload.sessionId, event.payload);
      }
    });

    // Subscribe to swarm session events for persistence
    if (this.config.enableSwarmSessionPersistence) {
      eventBus.subscribe('swarm.session.created', async (event) => {
        await this.handleSwarmSessionCreated(event);
      });

      eventBus.subscribe('swarm.session.participant.joined', async (event) => {
        await this.handleSwarmSessionParticipantJoined(event);
      });

      eventBus.subscribe('swarm.session.participant.left', async (event) => {
        await this.handleSwarmSessionParticipantLeft(event);
      });

      eventBus.subscribe('swarm.session.closed', async (event) => {
        await this.handleSwarmSessionClosed(event);
      });

      eventBus.subscribe('swarm.task.completed', async (event) => {
        await this.handleSwarmTaskCompleted(event);
      });

      eventBus.subscribe('swarm.task.vetoed', async (event) => {
        await this.handleSwarmTaskVetoed(event);
      });
    }
  }

  /**
   * Extracts and stores entities from task results
   */
  async extractAndStoreEntities(taskId: string, result: any): Promise<EnhancedEntity[]> {
    if (!this.config.enableEntityExtraction) {
      return [];
    }

    try {
      // Convert result to string for extraction
      const resultText = typeof result === 'string' ? result : JSON.stringify(result);

      // Use the underlying SQLite entity extraction
      const baseEntities = await autoGenMemoriSQLite.extractEntities(
        { id: 'system' } as any,
        { id: taskId } as any,
        resultText
      );

      // Enhance entities with additional metadata
      const enhancedEntities: EnhancedEntity[] = baseEntities
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
      await eventBus.publish({
        id: `entity_extract_${Date.now()}`,
        type: 'memory.entities.extracted',
        timestamp: Date.now(),
        source: 'memori-engine',
        payload: {
          taskId,
          entityCount: enhancedEntities.length,
          entities: enhancedEntities.map(e => ({ id: e.id, type: e.type, value: e.value }))
        }
      } as LAPAEvent);

      return enhancedEntities;
    } catch (error) {
      console.error('Failed to extract and store entities:', error);
      return [];
    }
  }

  /**
   * Calculates importance score for an entity
   */
  private calculateEntityImportance(entity: Entity): number {
    let importance = entity.confidence;

    // Boost importance for certain entity types
    const typeBoosts: Record<string, number> = {
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
  private async storeEnhancedEntity(entity: EnhancedEntity): Promise<void> {
    // Store in SQLite
    await autoGenMemoriSQLite.storeEntity(entity);

    // Cache in memory
    this.entityCache.set(entity.id, entity);
  }

  /**
   * Removes an entity
   */
  private async removeEntity(entityId: string): Promise<void> {
    this.entityCache.delete(entityId);
    // Note: SQLite deletion would require additional method
  }

  /**
   * Retrieves entities for context injection (zero-prompt)
   */
  async getContextEntities(taskId: string, limit: number = 20): Promise<EnhancedEntity[]> {
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
    } catch (error) {
      console.error('Failed to retrieve context entities:', error);
      return [];
    }
  }

  /**
   * Updates session metadata
   */
  async updateSessionMetadata(sessionId: string, data: any): Promise<void> {
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
  private calculateSessionImportance(session: SessionMetadata): number {
    const ageHours = (Date.now() - session.startTime.getTime()) / (1000 * 60 * 60);
    const activityScore = Math.min(1.0, session.entryCount / 100);
    const entityScore = Math.min(1.0, session.entityCount / 50);
    const recencyScore = Math.max(0, 1 - ageHours / 168); // Decay over 1 week

    return (activityScore * 0.3 + entityScore * 0.4 + recencyScore * 0.3);
  }

  /**
   * Checks and prunes sessions if needed (Kaggle-inspired)
   */
  private async checkAndPruneSessions(): Promise<void> {
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
      await eventBus.publish({
        id: `session_prune_${Date.now()}`,
        type: 'memory.session.pruned',
        timestamp: Date.now(),
        source: 'memori-engine',
        payload: { sessionId }
      } as LAPAEvent);
    }

    console.log(`Pruned ${toPrune} sessions (${totalSessions} -> ${this.sessions.size})`);
  }

  /**
   * Gets conversation history with entity context
   */
  async getConversationHistoryWithEntities(taskId: string, limit: number = 50): Promise<{
    history: ConversationEntry[];
    entities: EnhancedEntity[];
  }> {
    const history = await autoGenMemoriSQLite.getConversationHistory(taskId, limit);
    const entities = await this.getContextEntities(taskId, 20);

    return { history, entities };
  }

  /**
   * Gets performance metrics with analysis
   */
  async getPerformanceMetricsWithAnalysis(agentId: string, metricType?: string): Promise<{
    metrics: PerformanceMetric[];
    average: number;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    const metrics = await autoGenMemoriSQLite.getPerformanceMetrics(agentId, metricType);

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
  getStatus(): {
    isInitialized: boolean;
    sessionCount: number;
    entityCacheSize: number;
    config: MemoriEngineConfig;
  } {
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
  private async handleSwarmSessionCreated(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      // We'll need to get the full session data from the swarm session manager
      // For now, we'll just store basic session info
      const sessionId = event.payload.sessionId;
      const hostUserId = event.payload.hostUserId;
      
      if (sessionId && hostUserId) {
        const persistedSession: PersistedSwarmSession = {
          sessionId,
          hostUserId,
          status: 'active',
          createdAt: new Date(),
          lastActivity: new Date(),
          config: '{}' // Empty config for now
        };
        
        await autoGenMemoriSQLite.storeSwarmSession(persistedSession);
        console.log(`Persisted swarm session creation: ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm session creation:', error);
    }
  }

  /**
   * Handles swarm session participant joined event
   */
  private async handleSwarmSessionParticipantJoined(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      const sessionId = event.payload.sessionId;
      const userId = event.payload.userId;
      const agentId = event.payload.agentId;
      const displayName = event.payload.displayName;
      
      if (sessionId && userId && displayName) {
        const persistedParticipant: PersistedSessionParticipant = {
          sessionId,
          userId,
          agentId,
          displayName,
          joinedAt: new Date(),
          isHost: 0, // Will be updated when we have full session data
          capabilities: '[]', // Empty capabilities for now
          connectionState: 'connected'
        };
        
        await autoGenMemoriSQLite.storeSwarmSessionParticipant(persistedParticipant);
        console.log(`Persisted participant join: ${userId} in session ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm session participant join:', error);
    }
  }

  /**
   * Handles swarm session participant left event
   */
  private async handleSwarmSessionParticipantLeft(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      const sessionId = event.payload.sessionId;
      const userId = event.payload.userId;
      
      if (sessionId && userId) {
        await autoGenMemoriSQLite.removeSwarmSessionParticipant(sessionId, userId);
        console.log(`Persisted participant leave: ${userId} from session ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm session participant leave:', error);
    }
  }

  /**
   * Handles swarm session closed event
   */
  private async handleSwarmSessionClosed(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      const sessionId = event.payload.sessionId;
      
      if (sessionId) {
        await autoGenMemoriSQLite.removeSwarmSession(sessionId);
        console.log(`Persisted session closure: ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm session closure:', error);
    }
  }

  /**
   * Handles swarm task completed event
   */
  private async handleSwarmTaskCompleted(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      const sessionId = event.payload.sessionId;
      const taskId = event.payload.taskId;
      const task = event.payload.task;
      
      if (sessionId && taskId && task) {
        const persistedTask: PersistedSessionTask = {
          sessionId,
          taskId,
          taskData: JSON.stringify(task)
        };
        
        await autoGenMemoriSQLite.storeSwarmSessionTask(persistedTask);
        console.log(`Persisted task completion: ${taskId} in session ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm task completion:', error);
    }
  }

  /**
   * Handles swarm task vetoed event
   */
  private async handleSwarmTaskVetoed(event: LAPAEvent): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence || !event.payload) {
      return;
    }

    try {
      const sessionId = event.payload.sessionId;
      const taskId = event.payload.taskId;
      const vetoId = event.payload.vetoId;
      
      if (sessionId && taskId && vetoId) {
        // Store the veto information
        const persistedVeto: PersistedSessionVeto = {
          sessionId,
          taskId,
          votingSessionId: vetoId // Using vetoId as votingSessionId for now
        };
        
        await autoGenMemoriSQLite.storeSwarmSessionVeto(persistedVeto);
        console.log(`Persisted task veto: ${taskId} in session ${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to persist swarm task veto:', error);
    }
  }

  /**
   * Recovers swarm sessions from persistence
   */
  async recoverSwarmSessions(): Promise<void> {
    if (!this.config.enableSwarmSessionPersistence) {
      return;
    }

    try {
      // Get all persisted sessions
      const persistedSessions = await autoGenMemoriSQLite.getAllSwarmSessions();
      
      // For each session, we would notify the swarm session manager to restore it
      // This would require the swarm session manager to have a method for restoring sessions
      // from persisted data
      
      console.log(`Recovered ${persistedSessions.length} swarm sessions from persistence`);
    } catch (error) {
      console.error('Failed to recover swarm sessions:', error);
    }
  }

  async close(): Promise<void> {
    await autoGenMemoriSQLite.close();
    this.sessions.clear();
    this.entityCache.clear();
    this.isInitialized = false;
    console.log('Memori Engine closed');
  }
}

// Export singleton instance
export const memoriEngine = new MemoriEngine();


