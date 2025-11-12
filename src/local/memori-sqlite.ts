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
      const dbRun = promisify(this.db.run.bind(this.db));
      const dbSerialize = promisify(this.db.serialize.bind(this.db));
      
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
      const dbRun = promisify(this.db.run.bind(this.db));
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
      const dbAll = promisify(this.db.all.bind(this.db));
      const rows = await dbAll(
        `SELECT id, type, value, confidence, timestamp, source_agent_id, task_id
         FROM entities
         WHERE type = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        type,
        limit
      );
      
      return rows.map(row => ({
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
      const dbRun = promisify(this.db.run.bind(this.db));
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
      const dbAll = promisify(this.db.all.bind(this.db));
      const rows = await dbAll(
        `SELECT id, agent_id, task_id, role, content, timestamp
         FROM conversation_history
         WHERE task_id = ?
         ORDER BY timestamp ASC
         LIMIT ?`,
        taskId,
        limit
      );
      
      return rows.map(row => ({
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
      const dbRun = promisify(this.db.run.bind(this.db));
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
      const dbAll = promisify(this.db.all.bind(this.db));
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
      
      return rows.map(row => ({
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
      const dbRun = promisify(this.db.run.bind(this.db));
      
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
      const dbClose = promisify(this.db.close.bind(this.db));
      await dbClose();
      this.db = null;
      this.isInitialized = false;
      console.log('Memori SQLite database connection closed');
    }
  }
}

// Default export for convenience
export const autoGenMemoriSQLite = new AutoGenMemoriSQLite();

// Export types for external use
export type { AutoGenMemoriSQLiteConfig, Entity, ConversationEntry, PerformanceMetric };