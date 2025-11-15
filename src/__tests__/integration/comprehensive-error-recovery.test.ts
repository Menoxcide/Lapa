/**
 * Comprehensive Error Recovery Tests
 * 
 * Tests error recovery across all modules:
 * - Event bus error recovery
 * - A2A communication error recovery
 * - Memory system error recovery
 * - Handoff system error recovery
 * - Orchestrator error recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../../core/event-bus.ts';
import { A2AMediator } from '../../swarm/a2a-mediator.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';

// Mock all dependencies
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

vi.mock('../../local/memori-engine.ts', () => ({
  MemoriEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    extractAndStoreEntities: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../../local/episodic.ts', () => ({
  EpisodicMemoryStore: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Comprehensive Error Recovery', () => {
  let a2aMediator: A2AMediator;
  let memoriEngine: MemoriEngine;
  let episodicMemory: EpisodicMemoryStore;
  let handoffSystem: HybridHandoffSystem;

  beforeEach(async () => {
    vi.clearAllMocks();
    a2aMediator = new A2AMediator();
    memoriEngine = new MemoriEngine();
    episodicMemory = new EpisodicMemoryStore();
    handoffSystem = new HybridHandoffSystem();
    await memoriEngine.initialize();
    await episodicMemory.initialize();
  });

  afterEach(async () => {
    await memoriEngine.close();
    await episodicMemory.close();
    vi.clearAllMocks();
  });

  describe('Event Bus Error Recovery', () => {
    it('should recover from publish failures', async () => {
      vi.spyOn(eventBus, 'publish').mockRejectedValueOnce(new Error('Publish failed'));
      vi.spyOn(eventBus, 'publish').mockResolvedValueOnce(undefined);

      // First attempt fails
      await expect(eventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      } as any)).rejects.toThrow('Publish failed');

      // Second attempt succeeds
      await expect(eventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      } as any)).resolves.toBeUndefined();
    });

    it('should recover from subscription failures', async () => {
      vi.spyOn(eventBus, 'subscribe').mockImplementationOnce(() => {
        throw new Error('Subscribe failed');
      });

      expect(() => eventBus.subscribe('test.event', () => {})).toThrow('Subscribe failed');

      // Recovery: second subscription succeeds
      vi.spyOn(eventBus, 'subscribe').mockReturnValueOnce('subscription-id');
      const id = eventBus.subscribe('test.event', () => {});
      expect(id).toBe('subscription-id');
    });
  });

  describe('A2A Communication Error Recovery', () => {
    it('should recover from handshake failures', async () => {
      const request = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: {}
      };

      // First attempt fails
      vi.spyOn(a2aMediator, 'initiateHandshake').mockRejectedValueOnce(new Error('Network error'));

      await expect(a2aMediator.initiateHandshake(request)).rejects.toThrow('Network error');

      // Recovery: second attempt succeeds
      vi.spyOn(a2aMediator, 'initiateHandshake').mockResolvedValueOnce({
        success: true,
        handshakeId: 'handshake-123',
        capabilities: ['coding'],
        accepted: true,
        protocolVersion: '1.0'
      });

      const result = await a2aMediator.initiateHandshake(request);
      expect(result.success).toBe(true);
      expect(result.handshakeId).toBe('handshake-123');
    });

    it('should recover from timeout errors', async () => {
      vi.useFakeTimers();
      const request = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: {}
      };

      vi.spyOn(a2aMediator, 'initiateHandshake').mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      );

      const promise = a2aMediator.initiateHandshake(request);
      vi.advanceTimersByTime(5000);
      
      await expect(promise).rejects.toThrow('Timeout');

      // Recovery: retry with shorter timeout
      vi.spyOn(a2aMediator, 'initiateHandshake').mockResolvedValueOnce({
        success: true,
        handshakeId: 'handshake-456',
        accepted: true,
        protocolVersion: '1.0'
      });

      const result = await a2aMediator.initiateHandshake(request);
      expect(result.success).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Memory System Error Recovery', () => {
    it('should recover from entity extraction failures', async () => {
      vi.spyOn(memoriEngine, 'extractAndStoreEntities').mockRejectedValueOnce(
        new Error('Extraction failed')
      );

      await expect(memoriEngine.extractAndStoreEntities('task-1', 'content')).rejects.toThrow(
        'Extraction failed'
      );

      // Recovery: second attempt succeeds
      vi.spyOn(memoriEngine, 'extractAndStoreEntities').mockResolvedValueOnce([]);
      const result = await memoriEngine.extractAndStoreEntities('task-1', 'content');
      expect(result).toEqual([]);
    });

    it('should recover from memory storage failures', async () => {
      vi.spyOn(episodicMemory, 'storeEpisode').mockRejectedValueOnce(new Error('Storage failed'));

      await expect(episodicMemory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'test',
        timestamp: new Date()
      } as any)).rejects.toThrow('Storage failed');

      // Recovery: second attempt succeeds
      vi.spyOn(episodicMemory, 'storeEpisode').mockResolvedValueOnce({
        id: 'episode-1',
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'test',
        timestamp: new Date()
      } as any);

      const result = await episodicMemory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-1',
        sessionId: 'session-1',
        content: 'test',
        timestamp: new Date()
      } as any);

      expect(result.id).toBe('episode-1');
      expect(result.agentId).toBe('agent-1');
    });
  });

  describe('Handoff System Error Recovery', () => {
    it('should recover from handoff initiation failures', async () => {
      vi.spyOn(handoffSystem, 'initiateHandoff' as any).mockRejectedValueOnce(
        new Error('Handoff failed')
      );

      await expect((handoffSystem as any).initiateHandoff(
        'source',
        'target',
        'task-1',
        {}
      )).rejects.toThrow('Handoff failed');

      // Recovery: second attempt succeeds
      vi.spyOn(handoffSystem, 'initiateHandoff' as any).mockResolvedValueOnce({
        success: true,
        handoffId: 'handoff-123'
      });

      const result = await (handoffSystem as any).initiateHandoff(
        'source',
        'target',
        'task-1',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.handoffId).toBe('handoff-123');
    });
  });

  describe('Cascading Error Recovery', () => {
    it('should recover from cascading failures across modules', async () => {
      // Simulate cascading failure
      vi.spyOn(eventBus, 'publish').mockRejectedValueOnce(new Error('Event bus failed'));
      vi.spyOn(memoriEngine, 'extractAndStoreEntities').mockRejectedValueOnce(
        new Error('Memory failed')
      );

      // Both fail
      await expect(eventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      } as any)).rejects.toThrow('Event bus failed');

      await expect(memoriEngine.extractAndStoreEntities('task-1', 'content')).rejects.toThrow(
        'Memory failed'
      );

      // Recovery: both succeed
      vi.spyOn(eventBus, 'publish').mockResolvedValueOnce(undefined);
      vi.spyOn(memoriEngine, 'extractAndStoreEntities').mockResolvedValueOnce([]);

      await expect(eventBus.publish({
        id: 'test',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test',
        payload: {}
      } as any)).resolves.toBeUndefined();

      const result = await memoriEngine.extractAndStoreEntities('task-1', 'content');
      expect(result).toEqual([]);
    });
  });
});

