/**
 * Memori SQLite Integration for AutoGen Core
 *
 * This module provides integration with SQLite for state persistence and entity extraction
 * within the AutoGen Core framework. It enables local storage of agent states, task history,
 * and extracted entities for consciousness-like behavior.
 */

import { Agent, Task } from '../agents/moe-router.ts';
import { Database } from 'sqlite3';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';

// AutoGen-specific Memori SQLite configuration
interface AutoGenMemoriSQLiteConfig {
  dbPath: string;
  enableEntityExtraction: boolean;
  enableConversationHistory: boolean;
  maxHistoryEntries: number;
  enablePerformanceMetrics: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AutoGenMemoriSQLiteConfig = {
  dbPath: './.lapa/memori.db', // Default path to SQLite database
  enableEntityExtraction: true,
  enableConversationHistory: true,
  maxHistoryEntries: 1000,
  enablePerformanceMetrics: true
};

// Entity representation
interface Entity {
  id: string;
  type: string;
  value: string;
  confidence: number;
  timestamp: Date;
  sourceAgentId?: string;
  taskId?: string;
}

// Conversation history entry
interface ConversationEntry {
  id: string;
  agentId: string;
  taskId: string;
  role: string;
  content: string;
  timestamp: Date;
}

// Performance metric
interface PerformanceMetric {
  id: string;
  agentId: string;
  taskId: string;
  metricType: string;
  value: number;
  timestamp: Date;
}

/**
 * LAPA AutoGen Memori SQLite Integration Class
 */
export class AutoGenMemoriSQLite {
  private config: AutoGenMemoriSQLiteConfig;
  private db: Database | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<AutoGenMemoriSQLiteConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initializes the Memori SQLite integration for AutoGen Core
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AutoGen Memori SQLite Integration...');
      
      // Ensure directory exists
      const dbDir = this.config.dbPath.substring(0, this.config.dbPath.lastIndexOf('/'));
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
      
      // Initialize database
      this.db = new Database(this.config.dbPath);
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      const dbSerialize = promisify(this.db.serialize.bind(this.db)) as (callback: () => void) => Promise<void>;
      
      // Create tables
      await dbSerialize(() => {
        // Entities table
        if (this.config.enableEntityExtraction) {
          dbRun(`CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            confidence REAL NOT NULL,
            timestamp DATETIME NOT NULL,
            source_agent_id TEXT,
            task_id TEXT
          )`);
        }
        
        // Conversation history table
        if (this.config.enableConversationHistory) {
          dbRun(`CREATE TABLE IF NOT EXISTS conversation_history (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME NOT NULL
          )`);
        }
        
        // Performance metrics table
        if (this.config.enablePerformanceMetrics) {
          dbRun(`CREATE TABLE IF NOT EXISTS performance_metrics (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            value REAL NOT NULL,
            timestamp DATETIME NOT NULL
          )`);
        }
      });
      
      this.isInitialized = true;
      console.log('AutoGen Memori SQLite Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AutoGen Memori SQLite Integration:', error);
      throw error;
    }
  }

  /**
   * Stores an entity in the database
   * @param entity The entity to store
   * @returns Promise that resolves when the entity is stored
   */
  async storeEntity(entity: Entity): Promise<void> {
    if (!this.isInitialized || !this.db || !this.config.enableEntityExtraction) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO entities (id, type, value, confidence, timestamp, source_agent_id, task_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        entity.id,
        entity.type,
        entity.value,
        entity.confidence,
        entity.timestamp.toISOString(),
        entity.sourceAgentId,
        entity.taskId
      );
      
      console.log(`Stored entity: ${entity.type} = ${entity.value}`);
    } catch (error) {
      console.error('Failed to store entity:', error);
      throw error;
    }
  }

  /**
   * Retrieves entities by type
   * @param type The entity type to retrieve
   * @param limit Maximum number of entities to retrieve
   * @returns Promise that resolves with the retrieved entities
   */
  async getEntitiesByType(type: string, limit: number = 100): Promise<Entity[]> {
    if (!this.isInitialized || !this.db || !this.config.enableEntityExtraction) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT id, type, value, confidence, timestamp, source_agent_id, task_id
         FROM entities
         WHERE type = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        type,
        limit
      );
      
      return rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        value: row.value,
        confidence: row.confidence,
        timestamp: new Date(row.timestamp),
        sourceAgentId: row.source_agent_id,
        taskId: row.task_id
      }));
    } catch (error) {
      console.error('Failed to retrieve entities by type:', error);
      throw error;
    }
  }

  /**
   * Stores a conversation entry in the database
   * @param entry The conversation entry to store
   * @returns Promise that resolves when the entry is stored
   */
  async storeConversationEntry(entry: ConversationEntry): Promise<void> {
    if (!this.isInitialized || !this.db || !this.config.enableConversationHistory) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT INTO conversation_history (id, agent_id, task_id, role, content, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        entry.id,
        entry.agentId,
        entry.taskId,
        entry.role,
        entry.content,
        entry.timestamp.toISOString()
      );
      
      // Clean up old entries if we exceed the maximum
      await this.cleanupOldEntries('conversation_history');
      
      console.log(`Stored conversation entry for agent ${entry.agentId}`);
    } catch (error) {
      console.error('Failed to store conversation entry:', error);
      throw error;
    }
  }

  /**
   * Retrieves conversation history for a task
   * @param taskId The task ID to retrieve history for
   * @param limit Maximum number of entries to retrieve
   * @returns Promise that resolves with the conversation history
   */
  async getConversationHistory(taskId: string, limit: number = 50): Promise<ConversationEntry[]> {
    if (!this.isInitialized || !this.db || !this.config.enableConversationHistory) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT id, agent_id, task_id, role, content, timestamp
         FROM conversation_history
         WHERE task_id = ?
         ORDER BY timestamp ASC
         LIMIT ?`,
        taskId,
        limit
      );
      
      return rows.map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        taskId: row.task_id,
        role: row.role,
        content: row.content,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      console.error('Failed to retrieve conversation history:', error);
      throw error;
    }
  }

  /**
   * Stores a performance metric in the database
   * @param metric The performance metric to store
   * @returns Promise that resolves when the metric is stored
   */
  async storePerformanceMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.isInitialized || !this.db || !this.config.enablePerformanceMetrics) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT INTO performance_metrics (id, agent_id, task_id, metric_type, value, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        metric.id,
        metric.agentId,
        metric.taskId,
        metric.metricType,
        metric.value,
        metric.timestamp.toISOString()
      );
      
      // Clean up old entries if we exceed the maximum
      await this.cleanupOldEntries('performance_metrics');
      
      console.log(`Stored performance metric: ${metric.metricType} = ${metric.value}`);
    } catch (error) {
      console.error('Failed to store performance metric:', error);
      throw error;
    }
  }

  /**
   * Retrieves performance metrics for an agent
   * @param agentId The agent ID to retrieve metrics for
   * @param metricType Optional metric type to filter by
   * @param limit Maximum number of metrics to retrieve
   * @returns Promise that resolves with the performance metrics
   */
  async getPerformanceMetrics(agentId: string, metricType?: string, limit: number = 100): Promise<PerformanceMetric[]> {
    if (!this.isInitialized || !this.db || !this.config.enablePerformanceMetrics) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      let query = `SELECT id, agent_id, task_id, metric_type, value, timestamp
                   FROM performance_metrics
                   WHERE agent_id = ?`;
      const params: any[] = [agentId];
      
      if (metricType) {
        query += ` AND metric_type = ?`;
        params.push(metricType);
      }
      
      query += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(limit);
      
      const rows = await dbAll(query, ...params);
      
      return rows.map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        taskId: row.task_id,
        metricType: row.metric_type,
        value: row.value,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      console.error('Failed to retrieve performance metrics:', error);
      throw error;
    }
  }

  /**
   * Cleans up old entries in a table to maintain size limits
   * @param tableName The table to clean up
   * @returns Promise that resolves when cleanup is complete
   */
  private async cleanupOldEntries(tableName: string): Promise<void> {
    if (!this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      
      // Delete oldest entries if we exceed the maximum
      await dbRun(
        `DELETE FROM ${tableName}
         WHERE id IN (
           SELECT id
           FROM ${tableName}
           ORDER BY timestamp ASC
           LIMIT MAX(0, (SELECT COUNT(*) FROM ${tableName}) - ?)
         )`,
        this.config.maxHistoryEntries
      );
    } catch (error) {
      console.warn(`Failed to cleanup old entries in ${tableName}:`, error);
    }
  }

  /**
   * Performs entity extraction from a task result
   * @param agent The agent that produced the result
   * @param task The task that was processed
   * @param result The task result to extract entities from
   * @returns Promise that resolves with the extracted entities
   */
  async extractEntities(agent: Agent, task: Task, result: string): Promise<Entity[]> {
    if (!this.config.enableEntityExtraction) {
      return [];
    }
    
    // In a real implementation, this would use a more sophisticated entity extraction algorithm
    // For now, we'll implement a simple keyword-based extraction
    
    const entities: Entity[] = [];
    const timestamp = new Date();
    
    // Extract potential entities based on patterns
    // This is a simplified example - a real implementation would be much more sophisticated
    
    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(result)) !== null) {
      entities.push({
        id: `email_${Date.now()}_${Math.random()}`,
        type: 'email',
        value: match[0],
        confidence: 0.9,
        timestamp,
        sourceAgentId: agent.id,
        taskId: task.id
      });
    }
    
    // Extract URLs
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    while ((match = urlRegex.exec(result)) !== null) {
      entities.push({
        id: `url_${Date.now()}_${Math.random()}`,
        type: 'url',
        value: match[0],
        confidence: 0.95,
        timestamp,
        sourceAgentId: agent.id,
        taskId: task.id
      });
    }
    
    // Extract potential file paths (simplified)
    const filePathRegex = /(?:\/[\w.-]+)+\/?|(?:[a-zA-Z]:\\(?:[\w.-]+\\?)*)+/g;
    while ((match = filePathRegex.exec(result)) !== null) {
      entities.push({
        id: `filepath_${Date.now()}_${Math.random()}`,
        type: 'filepath',
        value: match[0],
        confidence: 0.7,
        timestamp,
        sourceAgentId: agent.id,
        taskId: task.id
      });
    }
    
    // Store extracted entities
    for (const entity of entities) {
      await this.storeEntity(entity);
    }
    
    console.log(`Extracted ${entities.length} entities from task ${task.id}`);
    return entities;
  }

  /**
   * Gets the current status of the Memori SQLite integration
   * @returns Current initialization status
   */
  getStatus(): { isInitialized: boolean; dbPath: string } {
    return {
      isInitialized: this.isInitialized,
      dbPath: this.config.dbPath
    };
  }

  /**
   * Closes the database connection
   * @returns Promise that resolves when the connection is closed
   */
  async close(): Promise<void> {
    if (this.db) {
      const dbClose = promisify(this.db.close.bind(this.db)) as () => Promise<void>;
      await dbClose();
      this.db = null;
      this.isInitialized = false;
      console.log('Memori SQLite database connection closed');
    }
  }

  /**
   * Stores a swarm session in the database
   * @param session The swarm session to store
   * @returns Promise that resolves when the session is stored
   */
  async storeSwarmSession(session: PersistedSwarmSession): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO swarm_sessions (session_id, host_user_id, status, created_at, last_activity, config)
         VALUES (?, ?, ?, ?, ?, ?)`,
        session.sessionId,
        session.hostUserId,
        session.status,
        session.createdAt.toISOString(),
        session.lastActivity.toISOString(),
        session.config
      );
      
      console.log(`Stored swarm session: ${session.sessionId}`);
    } catch (error) {
      console.error('Failed to store swarm session:', error);
      throw error;
    }
  }

  /**
   * Retrieves all swarm sessions from the database
   * @returns Promise that resolves with the retrieved sessions
   */
  async getAllSwarmSessions(): Promise<PersistedSwarmSession[]> {
    if (!this.isInitialized || !this.db) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT session_id, host_user_id, status, created_at, last_activity, config
         FROM swarm_sessions
         ORDER BY last_activity DESC`
      );
      
      return rows.map((row: any) => ({
        sessionId: row.session_id,
        hostUserId: row.host_user_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        lastActivity: new Date(row.last_activity),
        config: row.config
      }));
    } catch (error) {
      console.error('Failed to retrieve swarm sessions:', error);
      throw error;
    }
  }

  /**
   * Removes a swarm session from the database
   * @param sessionId The session ID to remove
   * @returns Promise that resolves when the session is removed
   */
  async removeSwarmSession(sessionId: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `DELETE FROM swarm_sessions WHERE session_id = ?`,
        sessionId
      );
      
      // Also remove associated data
      await dbRun(`DELETE FROM swarm_session_participants WHERE session_id = ?`, sessionId);
      await dbRun(`DELETE FROM swarm_session_tasks WHERE session_id = ?`, sessionId);
      await dbRun(`DELETE FROM swarm_session_vetos WHERE session_id = ?`, sessionId);
      await dbRun(`DELETE FROM swarm_session_a2a_handshakes WHERE session_id = ?`, sessionId);
      
      console.log(`Removed swarm session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to remove swarm session:', error);
      throw error;
    }
  }

  /**
   * Stores a swarm session participant in the database
   * @param participant The participant to store
   * @returns Promise that resolves when the participant is stored
   */
  async storeSwarmSessionParticipant(participant: PersistedSessionParticipant): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO swarm_session_participants
         (session_id, user_id, agent_id, display_name, joined_at, is_host, capabilities, connection_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        participant.sessionId,
        participant.userId,
        participant.agentId,
        participant.displayName,
        participant.joinedAt.toISOString(),
        participant.isHost,
        participant.capabilities,
        participant.connectionState
      );
      
      console.log(`Stored participant ${participant.userId} in session ${participant.sessionId}`);
    } catch (error) {
      console.error('Failed to store swarm session participant:', error);
      throw error;
    }
  }

  /**
   * Retrieves all participants for a swarm session
   * @param sessionId The session ID to retrieve participants for
   * @returns Promise that resolves with the retrieved participants
   */
  async getSwarmSessionParticipants(sessionId: string): Promise<PersistedSessionParticipant[]> {
    if (!this.isInitialized || !this.db) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT session_id, user_id, agent_id, display_name, joined_at, is_host, capabilities, connection_state
         FROM swarm_session_participants
         WHERE session_id = ?
         ORDER BY joined_at ASC`,
        sessionId
      );
      
      return rows.map((row: any) => ({
        sessionId: row.session_id,
        userId: row.user_id,
        agentId: row.agent_id,
        displayName: row.display_name,
        joinedAt: new Date(row.joined_at),
        isHost: row.is_host,
        capabilities: row.capabilities,
        connectionState: row.connection_state
      }));
    } catch (error) {
      console.error('Failed to retrieve swarm session participants:', error);
      throw error;
    }
  }

  /**
   * Removes a participant from a swarm session
   * @param sessionId The session ID
   * @param userId The user ID to remove
   * @returns Promise that resolves when the participant is removed
   */
  async removeSwarmSessionParticipant(sessionId: string, userId: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `DELETE FROM swarm_session_participants WHERE session_id = ? AND user_id = ?`,
        sessionId,
        userId
      );
      
      console.log(`Removed participant ${userId} from session ${sessionId}`);
    } catch (error) {
      console.error('Failed to remove swarm session participant:', error);
      throw error;
    }
  }

  /**
   * Stores a task in a swarm session
   * @param task The task to store
   * @returns Promise that resolves when the task is stored
   */
  async storeSwarmSessionTask(task: PersistedSessionTask): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO swarm_session_tasks (session_id, task_id, task_data)
         VALUES (?, ?, ?)`,
        task.sessionId,
        task.taskId,
        task.taskData
      );
      
      console.log(`Stored task ${task.taskId} in session ${task.sessionId}`);
    } catch (error) {
      console.error('Failed to store swarm session task:', error);
      throw error;
    }
  }

  /**
   * Retrieves all tasks for a swarm session
   * @param sessionId The session ID to retrieve tasks for
   * @returns Promise that resolves with the retrieved tasks
   */
  async getSwarmSessionTasks(sessionId: string): Promise<PersistedSessionTask[]> {
    if (!this.isInitialized || !this.db) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT session_id, task_id, task_data
         FROM swarm_session_tasks
         WHERE session_id = ?`,
        sessionId
      );
      
      return rows.map((row: any) => ({
        sessionId: row.session_id,
        taskId: row.task_id,
        taskData: row.task_data
      }));
    } catch (error) {
      console.error('Failed to retrieve swarm session tasks:', error);
      throw error;
    }
  }

  /**
   * Removes a task from a swarm session
   * @param sessionId The session ID
   * @param taskId The task ID to remove
   * @returns Promise that resolves when the task is removed
   */
  async removeSwarmSessionTask(sessionId: string, taskId: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `DELETE FROM swarm_session_tasks WHERE session_id = ? AND task_id = ?`,
        sessionId,
        taskId
      );
      
      console.log(`Removed task ${taskId} from session ${sessionId}`);
    } catch (error) {
      console.error('Failed to remove swarm session task:', error);
      throw error;
    }
  }

  /**
   * Stores a veto mapping for a swarm session
   * @param veto The veto mapping to store
   * @returns Promise that resolves when the veto mapping is stored
   */
  async storeSwarmSessionVeto(veto: PersistedSessionVeto): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO swarm_session_vetos (session_id, task_id, voting_session_id)
         VALUES (?, ?, ?)`,
        veto.sessionId,
        veto.taskId,
        veto.votingSessionId
      );
      
      console.log(`Stored veto for task ${veto.taskId} in session ${veto.sessionId}`);
    } catch (error) {
      console.error('Failed to store swarm session veto:', error);
      throw error;
    }
  }

  /**
   * Retrieves all veto mappings for a swarm session
   * @param sessionId The session ID to retrieve vetos for
   * @returns Promise that resolves with the retrieved veto mappings
   */
  async getSwarmSessionVetos(sessionId: string): Promise<PersistedSessionVeto[]> {
    if (!this.isInitialized || !this.db) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT session_id, task_id, voting_session_id
         FROM swarm_session_vetos
         WHERE session_id = ?`,
        sessionId
      );
      
      return rows.map((row: any) => ({
        sessionId: row.session_id,
        taskId: row.task_id,
        votingSessionId: row.voting_session_id
      }));
    } catch (error) {
      console.error('Failed to retrieve swarm session vetos:', error);
      throw error;
    }
  }

  /**
   * Removes a veto mapping from a swarm session
   * @param sessionId The session ID
   * @param taskId The task ID to remove veto for
   * @returns Promise that resolves when the veto mapping is removed
   */
  async removeSwarmSessionVeto(sessionId: string, taskId: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `DELETE FROM swarm_session_vetos WHERE session_id = ? AND task_id = ?`,
        sessionId,
        taskId
      );
      
      console.log(`Removed veto for task ${taskId} from session ${sessionId}`);
    } catch (error) {
      console.error('Failed to remove swarm session veto:', error);
      throw error;
    }
  }

  /**
   * Stores an A2A handshake mapping for a swarm session
   * @param handshake The handshake mapping to store
   * @returns Promise that resolves when the handshake mapping is stored
   */
  async storeSwarmSessionA2AHandshake(handshake: PersistedSessionA2AHandshake): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `INSERT OR REPLACE INTO swarm_session_a2a_handshakes (session_id, agent_pair, handshake_id)
         VALUES (?, ?, ?)`,
        handshake.sessionId,
        handshake.agentPair,
        handshake.handshakeId
      );
      
      console.log(`Stored A2A handshake for agent pair ${handshake.agentPair} in session ${handshake.sessionId}`);
    } catch (error) {
      console.error('Failed to store swarm session A2A handshake:', error);
      throw error;
    }
  }

  /**
   * Retrieves all A2A handshake mappings for a swarm session
   * @param sessionId The session ID to retrieve handshakes for
   * @returns Promise that resolves with the retrieved handshake mappings
   */
  async getSwarmSessionA2AHandshakes(sessionId: string): Promise<PersistedSessionA2AHandshake[]> {
    if (!this.isInitialized || !this.db) {
      return [];
    }
    
    try {
      const dbAll = promisify(this.db.all.bind(this.db)) as (sql: string, ...params: any[]) => Promise<any[]>;
      const rows = await dbAll(
        `SELECT session_id, agent_pair, handshake_id
         FROM swarm_session_a2a_handshakes
         WHERE session_id = ?`,
        sessionId
      );
      
      return rows.map((row: any) => ({
        sessionId: row.session_id,
        agentPair: row.agent_pair,
        handshakeId: row.handshake_id
      }));
    } catch (error) {
      console.error('Failed to retrieve swarm session A2A handshakes:', error);
      throw error;
    }
  }

  /**
   * Removes an A2A handshake mapping from a swarm session
   * @param sessionId The session ID
   * @param agentPair The agent pair to remove handshake for
   * @returns Promise that resolves when the handshake mapping is removed
   */
  async removeSwarmSessionA2AHandshake(sessionId: string, agentPair: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }
    
    try {
      const dbRun = promisify(this.db.run.bind(this.db)) as (sql: string, ...params: any[]) => Promise<void>;
      await dbRun(
        `DELETE FROM swarm_session_a2a_handshakes WHERE session_id = ? AND agent_pair = ?`,
        sessionId,
        agentPair
      );
      
      console.log(`Removed A2A handshake for agent pair ${agentPair} from session ${sessionId}`);
    } catch (error) {
      console.error('Failed to remove swarm session A2A handshake:', error);
      throw error;
    }
  }
}

// Default export for convenience
export const autoGenMemoriSQLite = new AutoGenMemoriSQLite();

// Export types for external use
// Swarm session interfaces for persistence
export interface PersistedSwarmSession {
  sessionId: string;
  hostUserId: string;
  status: string;
  createdAt: Date;
  lastActivity: Date;
  config: string; // JSON string
}

export interface PersistedSessionParticipant {
  sessionId: string;
  userId: string;
  agentId?: string;
  displayName: string;
  joinedAt: Date;
  isHost: number; // 0 or 1
  capabilities: string; // JSON string
  connectionState: string;
}

export interface PersistedSessionTask {
  sessionId: string;
  taskId: string;
  taskData: string; // JSON string
}

export interface PersistedSessionVeto {
  sessionId: string;
  taskId: string;
  votingSessionId: string;
}

export interface PersistedSessionA2AHandshake {
  sessionId: string;
  agentPair: string;
  handshakeId: string;
}

export type { AutoGenMemoriSQLiteConfig, Entity, ConversationEntry, PerformanceMetric };