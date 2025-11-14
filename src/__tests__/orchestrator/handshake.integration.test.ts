/**
 * Integration Tests for Handshake System
 * 
 * Tests handshake integration with:
 * - A2A Mediator
 * - Event Bus
 * - Agent systems
 * - Security systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HandshakeSystem } from '../../orchestrator/handshake.ts';
import { A2AMediator } from '../../swarm/a2a-mediator.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock dependencies
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

vi.mock('../../swarm/a2a-mediator.ts', () => ({
  A2AMediator: vi.fn().mockImplementation(() => ({
    initiateHandshake: vi.fn().mockResolvedValue({
      success: true,
      handshakeId: 'handshake-123'
    })
  }))
}));

describe('Handshake System Integration', () => {
  let handshakeSystem: HandshakeSystem;
  let a2aMediator: A2AMediator;

  beforeEach(() => {
    vi.clearAllMocks();
    a2aMediator = new A2AMediator();
    handshakeSystem = new HandshakeSystem({ a2aMediator });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('A2A Mediator Integration', () => {
    it('should initiate handshake through A2A mediator', async () => {
      const result = await handshakeSystem.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding']
      });

      expect(result.success).toBe(true);
      expect(result.handshakeId).toBeDefined();
      expect(a2aMediator.initiateHandshake).toHaveBeenCalled();
    });

    it('should handle handshake failures gracefully', async () => {
      vi.spyOn(a2aMediator, 'initiateHandshake').mockRejectedValueOnce(
        new Error('Handshake failed')
      );

      await expect(handshakeSystem.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding']
      })).rejects.toThrow('Handshake failed');
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish handshake events', async () => {
      await handshakeSystem.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding']
      });

      expect(eventBus.publish).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'handshake.initiated'
        })
      );
    });

    it('should subscribe to handshake completion events', async () => {
      const events: any[] = [];
      eventBus.subscribe('handshake.completed', (event) => {
        events.push(event);
      });

      await eventBus.publish({
        id: 'handshake-1',
        type: 'handshake.completed',
        timestamp: Date.now(),
        source: 'handshake-system',
        payload: { handshakeId: 'handshake-123' }
      });

      expect(events.length).toBe(1);
      expect(events[0].payload.handshakeId).toBe('handshake-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid handshake requests', async () => {
      await expect(handshakeSystem.initiateHandshake(null as any)).rejects.toThrow();
      await expect(handshakeSystem.initiateHandshake(undefined as any)).rejects.toThrow();
    });

    it('should handle missing capabilities', async () => {
      await expect(handshakeSystem.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: []
      })).rejects.toThrow();
    });
  });
});

