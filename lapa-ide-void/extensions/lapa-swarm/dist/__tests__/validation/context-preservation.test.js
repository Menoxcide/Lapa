"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const context_preservation_ts_1 = require("../../validation/context-preservation.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('ContextPreservationManager', () => {
    let contextPreservationManager;
    let eventBus;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new event_bus_ts_1.LAPAEventBus();
        contextPreservationManager = new context_preservation_ts_1.ContextPreservationManager(eventBus);
    });
    (0, vitest_1.describe)('preserveContext', () => {
        (0, vitest_1.it)('should preserve context successfully', async () => {
            const handoffId = 'handoff-123';
            const context = { data: 'test context', taskId: 'task-456' };
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await contextPreservationManager.preserveContext(handoffId, context);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.preserved',
                payload: vitest_1.expect.objectContaining({
                    handoffId,
                    contextSize: vitest_1.expect.any(Number),
                    checksum: vitest_1.expect.any(String)
                })
            }));
        });
        (0, vitest_1.it)('should fail to preserve context when serialization fails', async () => {
            const handoffId = 'handoff-123';
            // Create an object with circular reference that can't be serialized
            const context = { data: 'test' };
            context.self = context; // Circular reference
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await (0, vitest_1.expect)(contextPreservationManager.preserveContext(handoffId, context))
                .rejects
                .toThrow(/Failed to preserve context for handoff/);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.preservation.failed',
                payload: vitest_1.expect.objectContaining({
                    handoffId,
                    error: vitest_1.expect.stringContaining('Failed to serialize context')
                })
            }));
        });
    });
    (0, vitest_1.describe)('restoreContext', () => {
        (0, vitest_1.it)('should restore context successfully', async () => {
            const handoffId = 'handoff-123';
            const context = { data: 'test context', taskId: 'task-456' };
            // First preserve the context
            await contextPreservationManager.preserveContext(handoffId, context);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            // Then restore it
            const restoredContext = await contextPreservationManager.restoreContext(handoffId);
            (0, vitest_1.expect)(restoredContext).toEqual(context);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.restored',
                payload: vitest_1.expect.objectContaining({
                    handoffId,
                    contextSize: vitest_1.expect.any(Number),
                    restorationTime: vitest_1.expect.any(Number)
                })
            }));
        });
        (0, vitest_1.it)('should fail to restore context when no preserved context exists', async () => {
            const handoffId = 'non-existent-handoff';
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await (0, vitest_1.expect)(contextPreservationManager.restoreContext(handoffId))
                .rejects
                .toThrow(`No preserved context found for handoff ${handoffId}`);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.restoration.failed',
                payload: vitest_1.expect.objectContaining({
                    handoffId,
                    error: `No preserved context found for handoff ${handoffId}`
                })
            }));
        });
        (0, vitest_1.it)('should fail to restore context when checksum validation fails', async () => {
            const handoffId = 'handoff-123';
            const context = { data: 'test context', taskId: 'task-456' };
            // First preserve the context
            await contextPreservationManager.preserveContext(handoffId, context);
            // Manually corrupt the stored context to simulate integrity failure
            // We need to access the private contextStore, so we'll simulate this by
            // preserving again with different data but same handoffId
            const corruptedContext = { data: 'corrupted context', taskId: 'task-456' };
            await contextPreservationManager.preserveContext(handoffId, corruptedContext);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            // Try to restore with original expectation
            await (0, vitest_1.expect)(contextPreservationManager.restoreContext(handoffId))
                .rejects
                .toThrow(/Context integrity check failed/);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.restoration.failed',
                payload: vitest_1.expect.objectContaining({
                    handoffId,
                    error: vitest_1.expect.stringContaining('Context integrity check failed')
                })
            }));
        });
    });
    (0, vitest_1.describe)('rollbackContext', () => {
        (0, vitest_1.it)('should rollback context successfully', async () => {
            const handoffId = 'handoff-123';
            const context = { data: 'test context', taskId: 'task-456' };
            // First preserve the context
            await contextPreservationManager.preserveContext(handoffId, context);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            // Then rollback
            await contextPreservationManager.rollbackContext(handoffId);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.rollback',
                payload: vitest_1.expect.objectContaining({
                    handoffId
                })
            }));
            // Verify context is no longer available
            await (0, vitest_1.expect)(contextPreservationManager.restoreContext(handoffId))
                .rejects
                .toThrow(`No preserved context found for handoff ${handoffId}`);
        });
        (0, vitest_1.it)('should handle rollback when no context exists', async () => {
            const handoffId = 'non-existent-handoff';
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            // Rollback non-existent context should not throw
            await (0, vitest_1.expect)(contextPreservationManager.rollbackContext(handoffId)).resolves.not.toThrow();
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.rollback',
                payload: vitest_1.expect.objectContaining({
                    handoffId
                })
            }));
        });
        (0, vitest_1.it)('should fail to rollback context when operation fails', async () => {
            const handoffId = 'handoff-123';
            // Mock the eventBus publish to throw an error to simulate failure
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish').mockImplementationOnce(() => {
                throw new Error('Publish failed');
            });
            await (0, vitest_1.expect)(contextPreservationManager.rollbackContext(handoffId))
                .rejects
                .toThrow(/Failed to rollback context for handoff/);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'context.rollback',
                payload: vitest_1.expect.objectContaining({
                    handoffId
                })
            }));
        });
    });
    (0, vitest_1.describe)('getStatistics', () => {
        (0, vitest_1.it)('should return correct statistics', async () => {
            // Initially stats should be empty
            let stats = contextPreservationManager.getStatistics();
            (0, vitest_1.expect)(stats.preservedContexts).toBe(0);
            (0, vitest_1.expect)(stats.totalSize).toBe(0);
            // Preserve some contexts
            await contextPreservationManager.preserveContext('handoff-1', { data: 'test1' });
            await contextPreservationManager.preserveContext('handoff-2', { data: 'test2'.repeat(100) }); // Larger context
            stats = contextPreservationManager.getStatistics();
            (0, vitest_1.expect)(stats.preservedContexts).toBe(2);
            (0, vitest_1.expect)(stats.totalSize).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.oldestContextAge).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(stats.newestContextAge).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('serialization', () => {
        (0, vitest_1.it)('should serialize and deserialize complex objects', async () => {
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
            (0, vitest_1.expect)(restoredContext).toEqual({
                string: 'test',
                number: 42,
                boolean: true,
                array: [1, 2, 3],
                object: { nested: 'value' },
                null: null
            });
        });
        (0, vitest_1.it)('should handle serialization errors gracefully', async () => {
            const handoffId = 'handoff-123';
            // Functions cannot be serialized to JSON
            const context = {
                data: 'test',
                func: () => console.log('test') // Function property
            };
            await (0, vitest_1.expect)(contextPreservationManager.preserveContext(handoffId, context))
                .rejects
                .toThrow(/Failed to preserve context for handoff/);
        });
    });
});
//# sourceMappingURL=context-preservation.test.js.map