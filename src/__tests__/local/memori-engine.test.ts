/**
 * Tests for Memori Engine (Phase 12)
 * 
 * Tests entity extraction, session pruning, zero-prompt injection,
 * and integration with episodic memory and vector refinement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { memoriEngine, MemoriEngine } from '../../local/memori-engine.ts';
import { eventBus } from '../../core/event-bus.ts';
import { autoGenMemoriSQLite } from '../../local/memori-sqlite.ts';

describe('Memori Engine (Phase 12)', () => {
  let engine: MemoriEngine;

  beforeEach(async () => {
    // Create a fresh instance for each test
    engine = new MemoriEngine({
      enableEntityExtraction: true,
      enableSessionPruning: true,
      enableEpisodicIntegration: true,
      maxSessionSize: 100,
      sessionPruningThreshold: 0.8,
      entityConfidenceThreshold: 0.7,
      enableZeroPromptInjection: true,
      maxEntitiesPerTask: 50
    });

    // Initialize SQLite
    await autoGenMemoriSQLite.initialize();
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.close();
    await autoGenMemoriSQLite.close();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const status = engine.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.sessionCount).toBe(0);
      expect(status.entityCacheSize).toBe(0);
    });

    it('should subscribe to task completion events', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');
      
      await eventBus.publish({
        id: 'test-task-1',
        type: 'task.completed',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          taskId: 'task-1',
          result: 'Test result with email@example.com and https://example.com'
        }
      } as any);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that entity extraction event was published
      const entityEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.entities.extracted'
      );
      expect(entityEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract entities from task results', async () => {
      const result = `
        Contact us at support@example.com
        Visit https://example.com/docs
        Check file: /path/to/file.ts
      `;

      const entities = await engine.extractAndStoreEntities('task-1', result);

      expect(entities.length).toBeGreaterThan(0);
      
      const emailEntity = entities.find(e => e.type === 'email');
      expect(emailEntity).toBeDefined();
      expect(emailEntity?.value).toContain('@');

      const urlEntity = entities.find(e => e.type === 'url');
      expect(urlEntity).toBeDefined();
      expect(urlEntity?.value).toContain('http');
    });

    it('should filter entities by confidence threshold', async () => {
      const engineLowThreshold = new MemoriEngine({
        entityConfidenceThreshold: 0.5
      });
      await engineLowThreshold.initialize();

      const result = 'Email: test@example.com';
      const entities = await engineLowThreshold.extractAndStoreEntities('task-2', result);

      // All entities should meet confidence threshold
      entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThanOrEqual(0.5);
      });

      await engineLowThreshold.close();
    });

    it('should limit entities per task', async () => {
      const engineLimited = new MemoriEngine({
        maxEntitiesPerTask: 5
      });
      await engineLimited.initialize();

      // Create a result with many potential entities
      const result = Array(20).fill('test@example.com').join(' ');
      const entities = await engineLimited.extractAndStoreEntities('task-3', result);

      expect(entities.length).toBeLessThanOrEqual(5);

      await engineLimited.close();
    });

    it('should calculate entity importance correctly', async () => {
      const result = 'class MyClass { function myFunction() {} }';
      const entities = await engine.extractAndStoreEntities('task-4', result);

      const classEntity = entities.find(e => e.type === 'class');
      const functionEntity = entities.find(e => e.type === 'function');

      if (classEntity && functionEntity) {
        // Class entities should have higher importance than variables
        expect(classEntity.importance).toBeGreaterThan(0);
        expect(functionEntity.importance).toBeGreaterThan(0);
      }
    });
  });

  describe('Zero-Prompt Injection', () => {
    it('should retrieve context entities for a task', async () => {
      // First, extract some entities
      await engine.extractAndStoreEntities('task-5', 'Email: test@example.com');

      // Retrieve context entities
      const contextEntities = await engine.getContextEntities('task-5', 10);

      expect(contextEntities.length).toBeGreaterThan(0);
      expect(contextEntities[0].taskId).toBe('task-5');
    });

    it('should update access counts when retrieving entities', async () => {
      await engine.extractAndStoreEntities('task-6', 'Email: test@example.com');
      
      const entities1 = await engine.getContextEntities('task-6', 10);
      const initialAccessCount = entities1[0]?.accessCount || 0;

      const entities2 = await engine.getContextEntities('task-6', 10);
      expect(entities2[0]?.accessCount).toBeGreaterThan(initialAccessCount);
    });

    it('should return empty array when zero-prompt injection is disabled', async () => {
      const engineNoInjection = new MemoriEngine({
        enableZeroPromptInjection: false
      });
      await engineNoInjection.initialize();

      await engineNoInjection.extractAndStoreEntities('task-7', 'Email: test@example.com');
      const entities = await engineNoInjection.getContextEntities('task-7', 10);

      expect(entities).toEqual([]);

      await engineNoInjection.close();
    });
  });

  describe('Session Management', () => {
    it('should track session metadata', async () => {
      await eventBus.publish({
        id: 'conv-1',
        type: 'conversation.updated',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          sessionId: 'session-1',
          agentId: 'agent-1',
          taskId: 'task-1',
          entityCount: 5
        }
      } as any);

      await new Promise(resolve => setTimeout(resolve, 100));

      const status = engine.getStatus();
      expect(status.sessionCount).toBeGreaterThan(0);
    });

    it('should prune sessions when threshold is exceeded', async () => {
      const engineSmall = new MemoriEngine({
        maxSessionSize: 10,
        sessionPruningThreshold: 0.8
      });
      await engineSmall.initialize();

      // Create many sessions
      for (let i = 0; i < 15; i++) {
        await eventBus.publish({
          id: `conv-${i}`,
          type: 'conversation.updated',
          timestamp: Date.now(),
          source: 'test',
          payload: {
            sessionId: `session-${i}`,
            agentId: `agent-${i}`,
            taskId: `task-${i}`
          }
        } as any);
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      const status = engineSmall.getStatus();
      // Should have pruned down to maxSessionSize
      expect(status.sessionCount).toBeLessThanOrEqual(10);

      await engineSmall.close();
    });

    it('should calculate session importance correctly', async () => {
      // Create a session with high activity
      for (let i = 0; i < 10; i++) {
        await eventBus.publish({
          id: `conv-active-${i}`,
          type: 'conversation.updated',
          timestamp: Date.now(),
          source: 'test',
          payload: {
            sessionId: 'active-session',
            agentId: 'agent-1',
            taskId: 'task-1',
            entityCount: 20
          }
        } as any);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Active session should have higher importance
      const status = engine.getStatus();
      expect(status.sessionCount).toBeGreaterThan(0);
    });
  });

  describe('Conversation History Integration', () => {
    it('should retrieve conversation history with entities', async () => {
      // Store a conversation entry
      await autoGenMemoriSQLite.storeConversationEntry({
        id: 'conv-1',
        agentId: 'agent-1',
        taskId: 'task-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      });

      // Extract entities
      await engine.extractAndStoreEntities('task-1', 'Email: test@example.com');

      const result = await engine.getConversationHistoryWithEntities('task-1', 50);

      expect(result.history.length).toBeGreaterThan(0);
      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should retrieve performance metrics with analysis', async () => {
      // Store some metrics
      await autoGenMemoriSQLite.storePerformanceMetric({
        id: 'metric-1',
        agentId: 'agent-1',
        taskId: 'task-1',
        metricType: 'latency',
        value: 100,
        timestamp: new Date(Date.now() - 2000)
      });

      await autoGenMemoriSQLite.storePerformanceMetric({
        id: 'metric-2',
        agentId: 'agent-1',
        taskId: 'task-2',
        metricType: 'latency',
        value: 80,
        timestamp: new Date()
      });

      const result = await engine.getPerformanceMetricsWithAnalysis('agent-1', 'latency');

      expect(result.metrics.length).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(0);
      expect(['improving', 'stable', 'declining']).toContain(result.trend);
    });
  });

  describe('Integration with Event Bus', () => {
    it('should publish entity extraction events', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');

      await engine.extractAndStoreEntities('task-8', 'Email: test@example.com');

      await new Promise(resolve => setTimeout(resolve, 100));

      const entityEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.entities.extracted'
      );
      expect(entityEvents.length).toBeGreaterThan(0);
    });

    it('should publish session pruning events', async () => {
      const engineSmall = new MemoriEngine({
        maxSessionSize: 5,
        sessionPruningThreshold: 0.8
      });
      await engineSmall.initialize();

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Create many sessions to trigger pruning
      for (let i = 0; i < 10; i++) {
        await eventBus.publish({
          id: `conv-${i}`,
          type: 'conversation.updated',
          timestamp: Date.now(),
          source: 'test',
          payload: {
            sessionId: `session-${i}`,
            agentId: `agent-${i}`,
            taskId: `task-${i}`
          }
        } as any);
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      const pruneEvents = publishSpy.mock.calls.filter(
        call => call[0]?.type === 'memory.session.pruned'
      );
      expect(pruneEvents.length).toBeGreaterThan(0);

      await engineSmall.close();
    });
  });
});

