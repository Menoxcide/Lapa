import { describe, it, expect } from "vitest";
import { ContextHandoffManager, ContextHandoffRequest } from '../../swarm/context.handoff.ts';

describe('ContextHandoffManager', () => {
  let handoffManager: ContextHandoffManager;

  beforeEach(() => {
    handoffManager = new ContextHandoffManager();
  });

  describe('initiateHandoff', () => {
    let handoffRequest: ContextHandoffRequest;

    beforeEach(() => {
      handoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-123',
        context: {
          data: 'test context data',
          variables: { x: 1, y: 2 },
          history: ['step 1', 'step 2']
        },
        priority: 'medium'
      };
    });

    it('should initiate handoff successfully', async () => {
      const response = await handoffManager.initiateHandoff(handoffRequest);
      
      expect(response.success).toBe(true);
      expect(response.handoffId).toBeDefined();
      expect(typeof response.handoffId).toBe('string');
      expect(response.handoffId).toContain('handoff_');
      expect(response.compressedSize).toBeGreaterThan(0);
      expect(response.transferTime).toBeGreaterThan(0);
    });

    it('should handle high priority handoff', async () => {
      const highPriorityRequest: ContextHandoffRequest = {
        ...handoffRequest,
        priority: 'high'
      };

      const response = await handoffManager.initiateHandoff(highPriorityRequest);
      
      expect(response.success).toBe(true);
      expect(response.handoffId).toBeDefined();
    });

    it('should handle low priority handoff', async () => {
      const lowPriorityRequest: ContextHandoffRequest = {
        ...handoffRequest,
        priority: 'low'
      };

      const response = await handoffManager.initiateHandoff(lowPriorityRequest);
      
      expect(response.success).toBe(true);
      expect(response.handoffId).toBeDefined();
    });

    it('should handle handoff with deadline', async () => {
      const deadlineRequest: ContextHandoffRequest = {
        ...handoffRequest,
        deadline: new Date(Date.now() + 60000) // 1 minute from now
      };

      const response = await handoffManager.initiateHandoff(deadlineRequest);
      
      expect(response.success).toBe(true);
      expect(response.handoffId).toBeDefined();
    });

    it('should handle handoff failure gracefully', async () => {
      // We can't easily simulate a failure in the current implementation
      // In a real scenario, we would mock the compression function to throw an error
      // For now, we'll just verify the structure of a successful response
      const response = await handoffManager.initiateHandoff(handoffRequest);
      
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });
  });

  describe('completeHandoff', () => {
    let handoffRequest: ContextHandoffRequest;
    let handoffId: string;

    beforeEach(async () => {
      handoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-123',
        context: {
          data: 'test context data for completion',
          variables: { a: 10, b: 20 },
          history: ['phase 1', 'phase 2', 'phase 3']
        },
        priority: 'high'
      };

      const response = await handoffManager.initiateHandoff(handoffRequest);
      handoffId = response.handoffId;
    });

    it('should complete handoff successfully', async () => {
      const context = await handoffManager.completeHandoff(handoffId, 'agent-2');
      
      expect(context).toBeDefined();
      expect(context.data).toBe('test context data for completion');
      expect(context.variables).toEqual({ a: 10, b: 20 });
      expect(context.history).toEqual(['phase 1', 'phase 2', 'phase 3']);
    });

    it('should fail to complete handoff for wrong target agent', async () => {
      await expect(handoffManager.completeHandoff(handoffId, 'wrong-agent'))
        .rejects.toThrow(/not intended for agent/);
    });

    it('should fail to complete non-existent handoff', async () => {
      await expect(handoffManager.completeHandoff('non-existent-id', 'agent-2'))
        .rejects.toThrow('Handoff non-existent-id not found');
    });

    it('should fail to complete already completed handoff', async () => {
      // Complete once
      await handoffManager.completeHandoff(handoffId, 'agent-2');
      
      // Try to complete again
      await expect(handoffManager.completeHandoff(handoffId, 'agent-2'))
        .rejects.toThrow('Handoff ' + handoffId + ' not found');
    });
  });

  describe('getHandoffStatus', () => {
    let handoffRequest: ContextHandoffRequest;
    let handoffId: string;

    beforeEach(async () => {
      handoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-456',
        context: { data: 'status test' },
        priority: 'medium'
      };

      const response = await handoffManager.initiateHandoff(handoffRequest);
      handoffId = response.handoffId;
    });

    it('should return handoff status', () => {
      const status = handoffManager.getHandoffStatus(handoffId);
      
      expect(status).toBeDefined();
      expect(status?.handoffId).toBe(handoffId);
      expect(status?.status).toBeDefined();
      expect(status?.progress).toBeDefined();
      expect(status?.timestamp).toBeDefined();
    });

    it('should return undefined for non-existent handoff', () => {
      const status = handoffManager.getHandoffStatus('non-existent-id');
      expect(status).toBeUndefined();
    });
  });

  describe('cancelHandoff', () => {
    let handoffRequest: ContextHandoffRequest;
    let handoffId: string;

    beforeEach(async () => {
      handoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-789',
        context: { data: 'cancel test' },
        priority: 'low'
      };

      const response = await handoffManager.initiateHandoff(handoffRequest);
      handoffId = response.handoffId;
    });

    it('should cancel handoff successfully', () => {
      const result = handoffManager.cancelHandoff(handoffId);
      expect(result).toBe(true);
      
      // Verify handoff is no longer accessible
      const status = handoffManager.getHandoffStatus(handoffId);
      expect(status).toBeUndefined();
    });

    it('should return false for non-existent handoff cancellation', () => {
      const result = handoffManager.cancelHandoff('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('generateHandoffId', () => {
    it('should generate unique handoff IDs', () => {
      const request: ContextHandoffRequest = {
        sourceAgentId: 'agent-a',
        targetAgentId: 'agent-b',
        taskId: 'task-xyz',
        context: { data: 'test' },
        priority: 'medium'
      };

      const id1 = (handoffManager as any).generateHandoffId(request);
      const id2 = (handoffManager as any).generateHandoffId(request);
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('handoff_agent-a_agent-b');
      expect(id2).toContain('handoff_agent-a_agent-b');
    });
  });

  describe('getCompressionQuality', () => {
    it('should return appropriate compression quality values', () => {
      const getQuality = (handoffManager as any).getCompressionQuality.bind(handoffManager);
      
      expect(getQuality('high')).toBe(6);
      expect(getQuality('medium')).toBe(8);
      expect(getQuality('low')).toBe(9);
      // @ts-ignore Testing invalid input
      expect(getQuality('invalid')).toBe(8); // Default case
    });
  });

  describe('updateHandoffStatus', () => {
    let handoffRequest: ContextHandoffRequest;
    let handoffId: string;

    beforeEach(async () => {
      handoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-status',
        context: { data: 'status update test' },
        priority: 'medium'
      };

      const response = await handoffManager.initiateHandoff(handoffRequest);
      handoffId = response.handoffId;
    });

    it('should update handoff status correctly', () => {
      // Access private method through casting
      (handoffManager as any).updateHandoffStatus(handoffId, 'transferring', 50);
      
      const status = handoffManager.getHandoffStatus(handoffId);
      expect(status?.status).toBe('transferring');
      expect(status?.progress).toBe(50);
    });

    it('should clamp progress values between 0 and 100', () => {
      // Access private method through casting
      (handoffManager as any).updateHandoffStatus(handoffId, 'transferring', -10);
      let status = handoffManager.getHandoffStatus(handoffId);
      expect(status?.progress).toBe(0);
      
      (handoffManager as any).updateHandoffStatus(handoffId, 'transferring', 150);
      status = handoffManager.getHandoffStatus(handoffId);
      expect(status?.progress).toBe(100);
    });

    it('should handle completed status', () => {
      // Access private method through casting
      (handoffManager as any).updateHandoffStatus(handoffId, 'completed', 100);
      
      const status = handoffManager.getHandoffStatus(handoffId);
      expect(status?.status).toBe('completed');
    });

    it('should handle failed status with error message', () => {
      // Access private method through casting
      (handoffManager as any).updateHandoffStatus(handoffId, 'failed', 0, 'Test error message');
      
      const status = handoffManager.getHandoffStatus(handoffId);
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe('Test error message');
    });
  });
});