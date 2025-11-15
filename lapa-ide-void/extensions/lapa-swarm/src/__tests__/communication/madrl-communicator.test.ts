/**
 * MADRL Communicator Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MADRLCommunicator,
  CommunicationMessage,
  CommunicationConstraints
} from '../../communication/madrl-communicator.ts';

describe('MADRLCommunicator', () => {
  let communicator: MADRLCommunicator;
  let testMessage: CommunicationMessage;

  beforeEach(() => {
    communicator = new MADRLCommunicator({
      bandwidth: 1024 * 1024,
      latency: 100,
      frequency: 10,
      messageSize: 1024
    });

    testMessage = {
      id: 'msg-1',
      type: 'observation',
      senderId: 'agent-1',
      receiverIds: 'broadcast',
      content: {
        observation: {
          state: {},
          relevantAgents: [],
          context: {}
        }
      },
      priority: 'medium',
      timestamp: Date.now()
    };
  });

  it('should broadcast message', async () => {
    const result = await communicator.broadcast(testMessage);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-1');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('should send targeted message', async () => {
    testMessage.receiverIds = ['agent-2', 'agent-3'];
    
    const result = await communicator.sendTargeted(testMessage, ['agent-2', 'agent-3']);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.deliveredTo.length).toBe(2);
  });

  it('should optimize communication', async () => {
    const messages: CommunicationMessage[] = [
      { ...testMessage, id: 'msg-1', priority: 'high' },
      { ...testMessage, id: 'msg-2', priority: 'low' },
      { ...testMessage, id: 'msg-3', priority: 'medium' }
    ];

    const optimized = await communicator.optimizeCommunication(messages);

    expect(optimized).toBeDefined();
    expect(optimized.length).toBeLessThanOrEqual(messages.length);
    // High priority should be first
    if (optimized.length > 0) {
      expect(optimized[0].priority).toBe('high');
    }
  });

  it('should respect bandwidth constraints', async () => {
    const largeMessage: CommunicationMessage = {
      ...testMessage,
      content: {
        observation: {
          state: { large: 'x'.repeat(2000) },
          relevantAgents: [],
          context: {}
        }
      }
    };

    // Should fail or be filtered due to size
    await expect(communicator.broadcast(largeMessage)).rejects.toThrow();
  });
});

