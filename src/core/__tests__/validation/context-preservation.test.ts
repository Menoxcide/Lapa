import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextPreservationManager } from '../../validation/context-preservation.ts';
import { LAPAEventBus } from '../../core/event-bus.ts';

describe('ContextPreservationManager', () => {
  let contextPreservationManager: ContextPreservationManager;
  let eventBus: LAPAEventBus;

  beforeEach(() => {
    eventBus = new LAPAEventBus();
    contextPreservationManager = new ContextPreservationManager(eventBus);
  });

  describe('preserveContext', () => {
    it('should preserve context successfully', async () => {
      const handoffId = 'handoff-123';
      const context = { data: 'test context', taskId: 'task-456' };

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await contextPreservationManager.preserveContext(handoffId, context);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.preserved',
        payload: expect.objectContaining({
          handoffId,
          contextSize: expect.any(Number),
          checksum: expect.any(String)
        })
      }));
    });

    it('should fail to preserve context when serialization fails', async () => {
      const handoffId = 'handoff-123';
      // Create an object with circular reference that can't be serialized
      const context: any = { data: 'test' };
      context.self = context; // Circular reference

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await expect(contextPreservationManager.preserveContext(handoffId, context))
        .rejects
        .toThrow(/Failed to preserve context for handoff/);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.preservation.failed',
        payload: expect.objectContaining({
          handoffId,
          error: expect.stringContaining('Failed to serialize context')
        })
      }));
    });
  });

  describe('restoreContext', () => {
    it('should restore context successfully', async () => {
      const handoffId = 'handoff-123';
      const context = { data: 'test context', taskId: 'task-456' };

      // First preserve the context
      await contextPreservationManager.preserveContext(handoffId, context);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Then restore it
      const restoredContext = await contextPreservationManager.restoreContext(handoffId);
      
      expect(restoredContext).toEqual(context);
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.restored',
        payload: expect.objectContaining({
          handoffId,
          contextSize: expect.any(Number),
          restorationTime: expect.any(Number)
        })
      }));
    });

    it('should fail to restore context when no preserved context exists', async () => {
      const handoffId = 'non-existent-handoff';

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await expect(contextPreservationManager.restoreContext(handoffId))
        .rejects
        .toThrow(`No preserved context found for handoff ${handoffId}`);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.restoration.failed',
        payload: expect.objectContaining({
          handoffId,
          error: `No preserved context found for handoff ${handoffId}`
        })
      }));
    });

    it('should fail to restore context when checksum validation fails', async () => {
      const handoffId = 'handoff-123';
      const context = { data: 'test context', taskId: 'task-456' };

      // First preserve the context
      await contextPreservationManager.preserveContext(handoffId, context);

      // Corrupt the checksum using test helper method
      contextPreservationManager._testCorruptChecksum(handoffId);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Try to restore - should fail with checksum validation error
      await expect(contextPreservationManager.restoreContext(handoffId))
        .rejects
        .toThrow(/Context integrity check failed/);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.restoration.failed',
        payload: expect.objectContaining({
          handoffId,
          error: expect.stringContaining('Context integrity check failed')
        })
      }));
    });
  });

  describe('rollbackContext', () => {
    it('should rollback context successfully', async () => {
      const handoffId = 'handoff-123';
      const context = { data: 'test context', taskId: 'task-456' };

      // First preserve the context
      await contextPreservationManager.preserveContext(handoffId, context);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Then rollback
      await contextPreservationManager.rollbackContext(handoffId);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.rollback',
        payload: expect.objectContaining({
          handoffId
        })
      }));

      // Verify context is no longer available
      await expect(contextPreservationManager.restoreContext(handoffId))
        .rejects
        .toThrow(`No preserved context found for handoff ${handoffId}`);
    });

    it('should handle rollback when no context exists', async () => {
      const handoffId = 'non-existent-handoff';

      const publishSpy = vi.spyOn(eventBus, 'publish');

      // Rollback non-existent context should not throw
      await expect(contextPreservationManager.rollbackContext(handoffId)).resolves.not.toThrow();
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.rollback',
        payload: expect.objectContaining({
          handoffId
        })
      }));
    });

    it('should fail to rollback context when operation fails', async () => {
      const handoffId = 'handoff-123';
      
      // Mock the eventBus publish to throw an error to simulate failure
      const publishSpy = vi.spyOn(eventBus, 'publish').mockImplementationOnce(() => {
        throw new Error('Publish failed');
      });

      await expect(contextPreservationManager.rollbackContext(handoffId))
        .rejects
        .toThrow(/Failed to rollback context for handoff/);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'context.rollback',
        payload: expect.objectContaining({
          handoffId
        })
      }));
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      // Use unique handoff IDs to avoid conflicts with other tests
      const uniqueId1 = `handoff-stats-1-${Date.now()}`;
      const uniqueId2 = `handoff-stats-2-${Date.now()}`;

      // Get initial stats (may have contexts from other tests)
      const initialStats = contextPreservationManager.getStatistics();
      const initialCount = initialStats.preservedContexts;

      // Preserve some contexts with unique IDs
      await contextPreservationManager.preserveContext(uniqueId1, { data: 'test1' });
      await contextPreservationManager.preserveContext(uniqueId2, { data: 'test2'.repeat(100) }); // Larger context

      // Verify stats after preserving
      const stats = contextPreservationManager.getStatistics();
      expect(stats.preservedContexts).toBe(initialCount + 2);
      expect(stats.totalSize).toBeGreaterThan(initialStats.totalSize);
      expect(stats.oldestContextAge).toBeGreaterThanOrEqual(0);
      expect(stats.newestContextAge).toBeGreaterThanOrEqual(0);

      // Clean up
      await contextPreservationManager.rollbackContext(uniqueId1);
      await contextPreservationManager.rollbackContext(uniqueId2);

      // Verify stats after cleanup
      const finalStats = contextPreservationManager.getStatistics();
      expect(finalStats.preservedContexts).toBe(initialCount);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize complex objects', async () => {
      const handoffId = 'handoff-123';
      const context = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
        undefined: undefined // This will be omitted in JSON
      };

      await contextPreservationManager.preserveContext(handoffId, context);
      const restoredContext = await contextPreservationManager.restoreContext(handoffId);
      
      // undefined values are omitted in JSON serialization
      expect(restoredContext).toEqual({
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null
      });
    });

    it('should handle serialization errors gracefully', async () => {
      const handoffId = 'handoff-123';
      // JSON.stringify omits functions silently, so we need to create a truly non-serializable object
      // Use circular reference instead which will cause JSON.stringify to fail
      const context: any = {
        data: 'test'
      };
      context.self = context; // Circular reference that will cause serialization to fail

      await expect(contextPreservationManager.preserveContext(handoffId, context))
        .rejects
        .toThrow(/Failed to preserve context for handoff/);
    });
  });
});