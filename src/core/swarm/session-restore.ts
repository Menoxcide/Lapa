/**
 * Session Restoration for LAPA v1.0
 * 
 * Handles restoration of swarm sessions on IDE startup
 */

import { SwarmSessionManager } from './sessions.js';
import { SessionPersistenceManager, PersistedSessionState } from './session-persistence.js';
import { eventBus } from '../core/event-bus.js';

// Session restoration result
export interface SessionRestoreResult {
  success: boolean;
  sessionId?: string;
  restored: boolean;
  error?: string;
  details?: {
    participants: number;
    tasks: number;
    contextRestored: boolean;
  };
}

/**
 * Session Restore Manager
 * 
 * Manages session restoration on IDE startup
 */
export class SessionRestoreManager {
  private persistenceManager: SessionPersistenceManager;
  private sessionManager: SwarmSessionManager;

  constructor(
    persistenceManager: SessionPersistenceManager,
    sessionManager: SwarmSessionManager
  ) {
    this.persistenceManager = persistenceManager;
    this.sessionManager = sessionManager;
  }

  /**
   * Restores all active sessions on startup
   */
  async restoreActiveSessions(): Promise<SessionRestoreResult[]> {
    const results: SessionRestoreResult[] = [];
    
    try {
      const savedSessions = await this.persistenceManager.listSavedSessions();
      
      // Filter to only active/paused sessions
      const activeSessions = savedSessions.filter(s => 
        s.status === 'active' || s.status === 'paused'
      );

      for (const savedSession of activeSessions) {
        const result = await this.restoreSession(savedSession.sessionId);
        results.push(result);
      }

      console.log(`Restored ${results.filter(r => r.restored).length} sessions on startup`);
    } catch (error) {
      console.error('Failed to restore active sessions:', error);
    }

    return results;
  }

  /**
   * Restores a specific session
   */
  async restoreSession(sessionId: string): Promise<SessionRestoreResult> {
    try {
      const persistedState = await this.persistenceManager.restoreSession(sessionId);
      
      if (!persistedState) {
        return {
          success: false,
          restored: false,
          error: `Session ${sessionId} not found`
        };
      }

      // Convert to SwarmSession format
      const sessionData = this.persistenceManager.convertToSwarmSession(persistedState);

      // Recreate session in manager
      // Note: This requires access to SwarmSessionManager's internal methods
      // We'll need to extend SwarmSessionManager to support restoration
      const restored = await this.recreateSession(sessionData, persistedState);

      if (restored) {
        // Publish restoration event
        await eventBus.publish({
          id: `session-restored-${sessionId}`,
          type: 'swarm.session.restored',
          timestamp: Date.now(),
          source: 'session-restore-manager',
          payload: {
            sessionId,
            participants: persistedState.participants.length,
            tasks: persistedState.activeTasks.length
          }
        });

        return {
          success: true,
          sessionId,
          restored: true,
          details: {
            participants: persistedState.participants.length,
            tasks: persistedState.activeTasks.length,
            contextRestored: true
          }
        };
      } else {
        return {
          success: false,
          sessionId,
          restored: false,
          error: 'Failed to recreate session'
        };
      }
    } catch (error) {
      return {
        success: false,
        restored: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Recreates a session from persisted state
   */
  private async recreateSession(
    sessionData: Partial<any>,
    persistedState: PersistedSessionState
  ): Promise<boolean> {
    try {
      // Use SwarmSessionManager to recreate session
      // This is a simplified version - full implementation would need
      // access to SwarmSessionManager's internal session map
      
      // For now, we'll publish an event that SwarmSessionManager can listen to
      await eventBus.publish({
        id: `recreate-session-${persistedState.sessionId}`,
        type: 'swarm.session.recreate',
        timestamp: Date.now(),
        source: 'session-restore-manager',
        payload: {
          sessionData,
          persistedState
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to recreate session:', error);
      return false;
    }
  }

  /**
   * Gets restoration status for a session
   */
  async getRestorationStatus(sessionId: string): Promise<{
    canRestore: boolean;
    lastActivity: Date | null;
    status: string | null;
    participants: number;
    tasks: number;
  }> {
    const persistedState = await this.persistenceManager.restoreSession(sessionId);
    
    if (!persistedState) {
      return {
        canRestore: false,
        lastActivity: null,
        status: null,
        participants: 0,
        tasks: 0
      };
    }

    return {
      canRestore: persistedState.status === 'active' || persistedState.status === 'paused',
      lastActivity: new Date(persistedState.lastActivity),
      status: persistedState.status,
      participants: persistedState.participants.length,
      tasks: persistedState.activeTasks.length
    };
  }
}

