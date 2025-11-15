/**
 * Tests for Handoff Recorder
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandoffRecorder, HandoffRecord, HandoffAnalysis } from '../../orchestrator/handoff-recorder.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';
import { MemoriEngine } from '../../local/memori-engine.js';
import { eventBus } from '../../core/event-bus.js';

describe('HandoffRecorder', () => {
  let recorder: HandoffRecorder;
  let mockContext: AgentToolExecutionContext;
  let mockMemoriEngine: MemoriEngine;

  beforeEach(() => {
    mockMemoriEngine = {
      store: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      initialize: vi.fn().mockResolvedValue(undefined)
    } as unknown as MemoriEngine;

    recorder = new HandoffRecorder(mockMemoriEngine, {
      enabled: true,
      maxRecords: 100,
      recordContext: true
    });

    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('Recording', () => {
    it('should record a handoff', async () => {
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: { data: 'test' },
        handoffRequest: { priority: 'high' },
        handoffResponse: { success: true, duration: 100 }
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.recordId).toBeDefined();
      expect(result.data?.record).toBeDefined();
    });

    it('should store record in memory', async () => {
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: {},
        handoffRequest: {},
        handoffResponse: { success: true }
      };

      await recorder.execute(mockContext);
      const recordId = (await recorder.execute(mockContext)).data?.recordId as string;

      mockContext.parameters = {
        action: 'get',
        recordId
      };

      const getResult = await recorder.execute(mockContext);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.record).toBeDefined();
    });

    it('should record failed handoffs', async () => {
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: {},
        handoffRequest: {},
        handoffResponse: { success: false, error: 'Handoff failed' }
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const record = result.data?.record as HandoffRecord;
      expect(record.success).toBe(false);
      expect(record.error).toBe('Handoff failed');
    });

    it('should enforce max records limit', async () => {
      const limitedRecorder = new HandoffRecorder(undefined, {
        enabled: true,
        maxRecords: 5
      });

      // Record 10 handoffs
      for (let i = 0; i < 10; i++) {
        const context: AgentToolExecutionContext = {
          taskId: `task-${i}`,
          agentId: 'agent-1',
          parameters: {
            action: 'record',
            sourceAgentId: 'agent-1',
            targetAgentId: 'agent-2',
            taskId: `task-${i}`,
            context: {},
            handoffRequest: {},
            handoffResponse: { success: true }
          }
        };
        await limitedRecorder.execute(context);
      }

      const listResult = await limitedRecorder.execute({
        taskId: 'list',
        agentId: 'agent-1',
        parameters: { action: 'list' }
      });

      expect(listResult.success).toBe(true);
      expect(listResult.data?.total).toBeLessThanOrEqual(5);
    });
  });

  describe('Replay', () => {
    it('should replay a recorded handoff', async () => {
      // First record a handoff
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: { data: 'original' },
        handoffRequest: {},
        handoffResponse: { success: true }
      };

      const recordResult = await recorder.execute(mockContext);
      const recordId = recordResult.data?.recordId as string;

      // Replay it
      mockContext.parameters = {
        action: 'replay',
        recordId
      };

      const replayResult = await recorder.execute(mockContext);
      expect(replayResult.success).toBe(true);
      expect(replayResult.data?.originalRecord).toBeDefined();
      expect(replayResult.data?.replayContext).toBeDefined();
    });

    it('should allow context modification during replay', async () => {
      // Record a handoff
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: { data: 'original' },
        handoffRequest: {},
        handoffResponse: { success: true }
      };

      const recordResult = await recorder.execute(mockContext);
      const recordId = recordResult.data?.recordId as string;

      // Replay with modification
      mockContext.parameters = {
        action: 'replay',
        recordId,
        modifyContext: (ctx: Record<string, any>) => ({ ...ctx, data: 'modified' })
      };

      const replayResult = await recorder.execute(mockContext);
      expect(replayResult.success).toBe(true);
      expect(replayResult.data?.replayContext.data).toBe('modified');
    });

    it('should handle missing record for replay', async () => {
      mockContext.parameters = {
        action: 'replay',
        recordId: 'nonexistent-id'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Analysis', () => {
    beforeEach(async () => {
      // Create test records
      for (let i = 0; i < 5; i++) {
        const context: AgentToolExecutionContext = {
          taskId: `task-${i}`,
          agentId: 'agent-1',
          parameters: {
            action: 'record',
            sourceAgentId: `agent-${i % 2}`,
            targetAgentId: `agent-${(i % 2) + 2}`,
            taskId: `task-${i}`,
            context: {},
            handoffRequest: {},
            handoffResponse: { 
              success: i < 4, 
              error: i === 4 ? 'Test error' : undefined,
              duration: 100 + i * 10
            }
          }
        };
        await recorder.execute(context);
      }
    });

    it('should analyze all handoffs', async () => {
      mockContext.parameters = {
        action: 'analyze'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const analysis = result.data as HandoffAnalysis;
      expect(analysis.summary.totalHandoffs).toBe(5);
      expect(analysis.summary.successfulHandoffs).toBe(4);
      expect(analysis.summary.failedHandoffs).toBe(1);
      expect(analysis.summary.averageDuration).toBeGreaterThan(0);
    });

    it('should filter analysis by taskId', async () => {
      mockContext.parameters = {
        action: 'analyze',
        taskId: 'task-0'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const analysis = result.data as HandoffAnalysis;
      expect(analysis.summary.totalHandoffs).toBe(1);
    });

    it('should filter analysis by sourceAgentId', async () => {
      mockContext.parameters = {
        action: 'analyze',
        sourceAgentId: 'agent-0'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const analysis = result.data as HandoffAnalysis;
      expect(analysis.summary.totalHandoffs).toBeGreaterThan(0);
    });

    it('should identify common patterns', async () => {
      mockContext.parameters = {
        action: 'analyze'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const analysis = result.data as HandoffAnalysis;
      expect(analysis.patterns.commonSourceAgents.length).toBeGreaterThan(0);
      expect(analysis.patterns.commonTargetAgents.length).toBeGreaterThan(0);
      expect(analysis.patterns.failureReasons.length).toBeGreaterThan(0);
    });

    it('should generate timeline', async () => {
      mockContext.parameters = {
        action: 'analyze'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      
      const analysis = result.data as HandoffAnalysis;
      expect(analysis.timeline.length).toBe(5);
      expect(analysis.timeline[0].timestamp).toBeLessThanOrEqual(analysis.timeline[4].timestamp);
    });
  });

  describe('Listing', () => {
    beforeEach(async () => {
      // Create test records
      for (let i = 0; i < 10; i++) {
        const context: AgentToolExecutionContext = {
          taskId: `task-${i}`,
          agentId: 'agent-1',
          parameters: {
            action: 'record',
            sourceAgentId: 'agent-1',
            targetAgentId: 'agent-2',
            taskId: `task-${i}`,
            context: {},
            handoffRequest: {},
            handoffResponse: { success: true }
          }
        };
        await recorder.execute(context);
      }
    });

    it('should list all handoffs', async () => {
      mockContext.parameters = {
        action: 'list'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.records.length).toBeGreaterThan(0);
      expect(result.data?.total).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      mockContext.parameters = {
        action: 'list',
        limit: 5,
        offset: 0
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.records.length).toBeLessThanOrEqual(5);
      expect(result.data?.limit).toBe(5);
      expect(result.data?.offset).toBe(0);
    });

    it('should filter by taskId', async () => {
      mockContext.parameters = {
        action: 'list',
        taskId: 'task-0'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.records.every((r: HandoffRecord) => r.taskId === 'task-0')).toBe(true);
    });
  });

  describe('Retrieval', () => {
    it('should get a specific handoff record', async () => {
      // Record a handoff
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: { data: 'test' },
        handoffRequest: {},
        handoffResponse: { success: true }
      };

      const recordResult = await recorder.execute(mockContext);
      const recordId = recordResult.data?.recordId as string;

      // Get it
      mockContext.parameters = {
        action: 'get',
        recordId
      };

      const getResult = await recorder.execute(mockContext);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.record.id).toBe(recordId);
    });

    it('should handle missing record', async () => {
      mockContext.parameters = {
        action: 'get',
        recordId: 'nonexistent-id'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Validation', () => {
    it('should validate parameters', () => {
      expect(recorder.validateParameters({
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: {},
        handoffRequest: {},
        handoffResponse: {}
      })).toBe(true);

      expect(recorder.validateParameters({
        action: 'analyze'
      })).toBe(true);

      expect(recorder.validateParameters({
        action: 'unknown'
      })).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      mockContext.parameters = {
        action: 'unknown'
      };

      const result = await recorder.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('Memory Integration', () => {
    it('should store records in memory engine', async () => {
      mockContext.parameters = {
        action: 'record',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-1',
        context: {},
        handoffRequest: {},
        handoffResponse: { success: true }
      };

      await recorder.execute(mockContext);
      
      // Should have called store
      expect(mockMemoriEngine.store).toHaveBeenCalled();
    });
  });
});

