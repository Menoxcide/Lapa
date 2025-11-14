"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validation_manager_ts_1 = require("../../validation/validation-manager.ts");
const error_recovery_ts_1 = require("../../validation/error-recovery.ts");
const context_preservation_ts_1 = require("../../validation/context-preservation.ts");
const fidelity_metrics_ts_1 = require("../../validation/fidelity-metrics.ts");
const fallback_strategies_ts_1 = require("../../validation/fallback-strategies.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('Validation Integration', () => {
    let eventBus;
    let validationManager;
    let errorRecoveryManager;
    let contextPreservationManager;
    let fidelityMetricsTracker;
    let fallbackStrategiesManager;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new event_bus_ts_1.LAPAEventBus();
        validationManager = new validation_manager_ts_1.ValidationManager(eventBus);
        errorRecoveryManager = new error_recovery_ts_1.ErrorRecoveryManager(eventBus, 2, 50); // 2 retries, 50ms base delay
        contextPreservationManager = new context_preservation_ts_1.ContextPreservationManager(eventBus);
        fidelityMetricsTracker = new fidelity_metrics_ts_1.FidelityMetricsTracker(eventBus);
        fallbackStrategiesManager = new fallback_strategies_ts_1.FallbackStrategiesManager(eventBus);
    });
    (0, vitest_1.describe)('End-to-End Validation Flow', () => {
        (0, vitest_1.it)('should validate, execute with recovery, preserve context, and track fidelity for a complete operation', async () => {
            // 1. Validate handoff request
            const handoffRequest = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                taskId: 'task-123',
                context: { data: 'test context' }
            };
            const validation = validationManager.validateHandoffRequest(handoffRequest);
            (0, vitest_1.expect)(validation.isValid).toBe(true);
            (0, vitest_1.expect)(validation.errors).toHaveLength(0);
            // 2. Preserve context
            const handoffId = 'handoff-123';
            await contextPreservationManager.preserveContext(handoffId, handoffRequest.context);
            // 3. Simulate tool execution with potential failure and recovery
            const mockTool = {
                name: 'handoff-tool',
                type: 'testing',
                description: 'Tool for handling handoffs',
                version: '1.0.0',
                execute: vitest_1.vi.fn()
                    .mockRejectedValueOnce(new Error('Network error'))
                    .mockResolvedValue({ success: true, result: 'Handoff completed' }),
                validateParameters: vitest_1.vi.fn().mockReturnValue(true)
            };
            const toolResult = await errorRecoveryManager.executeToolWithRetry(mockTool, { handoffId });
            (0, vitest_1.expect)(toolResult).toEqual({ success: true, result: 'Handoff completed' });
            (0, vitest_1.expect)(mockTool.execute).toHaveBeenCalledTimes(2); // First failed, second succeeded
            // 4. Restore context
            const restoredContext = await contextPreservationManager.restoreContext(handoffId);
            (0, vitest_1.expect)(restoredContext).toEqual(handoffRequest.context);
            // 5. Check fidelity metrics
            // Allow time for event processing
            setTimeout(() => {
                const rates = fidelityMetricsTracker.getFidelityRates();
                (0, vitest_1.expect)(rates.agentToolExecution).toBe(1); // Both attempts counted as one operation
                (0, vitest_1.expect)(rates.contextPreservation).toBe(1); // Successful preservation
            }, 10);
        });
        (0, vitest_1.it)('should handle mode transition with validation and fallback', async () => {
            // 1. Validate mode transition request
            const modeTransitionRequest = {
                fromMode: 'ask',
                toMode: 'code',
                reason: 'User requested code generation'
            };
            const validation = validationManager.validateModeTransition(modeTransitionRequest);
            (0, vitest_1.expect)(validation.isValid).toBe(true);
            (0, vitest_1.expect)(validation.errors).toHaveLength(0);
            // 2. Simulate mode transition with potential failure and fallback
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Mode transition failed'));
            // Register a fallback provider for mode switching
            const fallbackProvider = {
                canHandle: (operation) => operation === 'mode-switch',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'Degraded mode switch result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('mode-switch-fallback', fallbackProvider);
            const result = await fallbackStrategiesManager.executeWithFallback('mode-switch', primaryExecutor, modeTransitionRequest);
            (0, vitest_1.expect)(result).toBe('Degraded mode switch result');
            (0, vitest_1.expect)(primaryExecutor).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(fallbackProvider.execute).toHaveBeenCalledWith('mode-switch', modeTransitionRequest);
            // 3. Check fidelity metrics
            // Allow time for event processing
            setTimeout(() => {
                const validationResult = fidelityMetricsTracker.validateFidelity();
                (0, vitest_1.expect)(validationResult.allOperationsMeetThreshold).toBe(true);
            }, 10);
        });
        (0, vitest_1.it)('should handle cross-language communication with validation and error recovery', async () => {
            // 1. Validate cross-language event
            const crossLanguageEvent = {
                id: 'event-1',
                type: 'cross.language.test',
                timestamp: Date.now(),
                source: 'python-agent',
                payload: JSON.stringify({ command: 'process_data', data: [1, 2, 3] })
            };
            const validation = validationManager.validateCrossLanguageEvent(crossLanguageEvent);
            (0, vitest_1.expect)(validation.isValid).toBe(true);
            (0, vitest_1.expect)(validation.errors).toHaveLength(0);
            // 2. Simulate cross-language communication with potential failure and recovery
            const handoffFn = vitest_1.vi.fn()
                .mockRejectedValueOnce(new Error('Communication timeout'))
                .mockResolvedValue('Cross-language communication completed');
            const fallbackFn = vitest_1.vi.fn().mockResolvedValue('Fallback communication completed');
            const result = await errorRecoveryManager.executeHandoffWithFallback(handoffFn, fallbackFn);
            (0, vitest_1.expect)(result).toBe('Cross-language communication completed');
            (0, vitest_1.expect)(handoffFn).toHaveBeenCalledTimes(2); // First failed, second succeeded
            (0, vitest_1.expect)(fallbackFn).not.toHaveBeenCalled(); // Not needed since second attempt succeeded
            // 3. Check fidelity metrics
            // Allow time for event processing
            setTimeout(() => {
                const rates = fidelityMetricsTracker.getFidelityRates();
                // Cross-language communication should have perfect score since we simulated success
                (0, vitest_1.expect)(rates.crossLanguageCommunication).toBe(1);
            }, 10);
        });
    });
    (0, vitest_1.describe)('Fidelity Validation', () => {
        (0, vitest_1.it)('should maintain 99%+ fidelity across all operations', async () => {
            // Simulate a high volume of successful operations
            const operations = 1000;
            let successes = 0;
            for (let i = 0; i < operations; i++) {
                // Simulate mostly successful operations with occasional failures
                if (Math.random() > 0.01) { // 99% success rate
                    successes++;
                    // Randomly publish different types of success events
                    const eventType = Math.floor(Math.random() * 5);
                    switch (eventType) {
                        case 0:
                            eventBus.publish({
                                id: `event-success-${i}`,
                                type: 'event.processed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: {}
                            });
                            break;
                        case 1:
                            eventBus.publish({
                                id: `tool-success-${i}`,
                                type: 'tool.execution.completed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { executionTime: Math.random() * 100 }
                            });
                            break;
                        case 2:
                            eventBus.publish({
                                id: `cross-success-${i}`,
                                type: 'cross.language.received',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: {}
                            });
                            break;
                        case 3:
                            eventBus.publish({
                                id: `mode-success-${i}`,
                                type: 'mode.changed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { transitionTime: Math.random() * 200 }
                            });
                            break;
                        case 4:
                            eventBus.publish({
                                id: `context-success-${i}`,
                                type: 'context.preserved',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { contextSize: Math.random() * 1024 }
                            });
                            break;
                    }
                }
                else {
                    // Simulate occasional failures
                    const failureType = Math.floor(Math.random() * 5);
                    switch (failureType) {
                        case 0:
                            eventBus.publish({
                                id: `event-fail-${i}`,
                                type: 'event.processing.failed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { error: 'Processing failed' }
                            });
                            break;
                        case 1:
                            eventBus.publish({
                                id: `tool-fail-${i}`,
                                type: 'tool.execution.failed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { error: 'Execution failed' }
                            });
                            break;
                        case 2:
                            eventBus.publish({
                                id: `cross-fail-${i}`,
                                type: 'cross.language.failed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { error: 'Communication failed' }
                            });
                            break;
                        case 3:
                            eventBus.publish({
                                id: `mode-fail-${i}`,
                                type: 'mode.change.failed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { error: 'Mode switch failed' }
                            });
                            break;
                        case 4:
                            eventBus.publish({
                                id: `context-fail-${i}`,
                                type: 'context.preservation.failed',
                                timestamp: Date.now(),
                                source: 'test',
                                payload: { error: 'Preservation failed' }
                            });
                            break;
                    }
                }
            }
            // Allow time for event processing
            setTimeout(() => {
                const validation = fidelityMetricsTracker.validateFidelity();
                // With 99% success rate, all operations should meet their thresholds
                (0, vitest_1.expect)(validation.allOperationsMeetThreshold).toBe(true);
                (0, vitest_1.expect)(validation.overallFidelity).toBeGreaterThan(0.99);
                // Check individual operation rates
                const rates = fidelityMetricsTracker.getFidelityRates();
                (0, vitest_1.expect)(rates.eventProcessing).toBeGreaterThan(0.98); // Allow for some variance
                (0, vitest_1.expect)(rates.agentToolExecution).toBeGreaterThan(0.98);
                (0, vitest_1.expect)(rates.crossLanguageCommunication).toBeGreaterThan(0.97); // Slightly lower threshold
                (0, vitest_1.expect)(rates.modeSwitching).toBeGreaterThan(0.98);
                (0, vitest_1.expect)(rates.contextPreservation).toBeGreaterThan(0.98);
            }, 50);
        });
    });
    (0, vitest_1.describe)('Error Recovery with Context Preservation', () => {
        (0, vitest_1.it)('should rollback context when error recovery fails', async () => {
            // 1. Preserve context
            const handoffId = 'handoff-123';
            const context = { data: 'test context', taskId: 'task-456' };
            await contextPreservationManager.preserveContext(handoffId, context);
            // 2. Simulate operation that fails completely
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary operation failed'));
            const fallbackExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Fallback operation failed'));
            // Register a fallback provider that also fails
            const fallbackProvider = {
                canHandle: (operation) => operation === 'critical-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: false, error: 'Fallback provider failed' })
            };
            fallbackStrategiesManager.registerFallbackProvider('critical-fallback', fallbackProvider);
            // 3. Attempt operation with fallback
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('critical-operation', primaryExecutor, { handoffId }))
                .rejects
                .toThrow(/Both primary execution and fallback failed/);
            // 4. Verify context can still be rolled back
            await contextPreservationManager.rollbackContext(handoffId);
            // 5. Verify context is no longer available
            await (0, vitest_1.expect)(contextPreservationManager.restoreContext(handoffId))
                .rejects
                .toThrow(`No preserved context found for handoff ${handoffId}`);
        });
    });
    (0, vitest_1.describe)('Graceful Degradation', () => {
        (0, vitest_1.it)('should gracefully degrade tool execution when recovery fails', async () => {
            // 1. Simulate tool that consistently fails
            const mockTool = {
                name: 'failing-tool',
                type: 'testing',
                description: 'Tool that always fails',
                version: '1.0.0',
                execute: vitest_1.vi.fn().mockRejectedValue(new Error('Tool execution failed')),
                validateParameters: vitest_1.vi.fn().mockReturnValue(true)
            };
            // 2. Attempt execution with recovery (should fail)
            await (0, vitest_1.expect)(errorRecoveryManager.executeToolWithRetry(mockTool, { testParam: 'value' }))
                .rejects
                .toThrow(/Tool execution failed after/);
            // 3. Perform graceful degradation
            const degradedResult = await fallbackStrategiesManager.gracefulDegradationForTool(mockTool, { testParam: 'value' });
            (0, vitest_1.expect)(degradedResult).toEqual({
                success: true,
                result: 'Degraded result for failing-tool',
                degraded: true
            });
        });
        (0, vitest_1.it)('should gracefully degrade mode switching when recovery fails', async () => {
            // 1. Simulate mode transition that consistently fails
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Mode transition failed'));
            // 2. Attempt mode transition with fallback (should fail)
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('mode-switch', primaryExecutor, { fromMode: 'ask', toMode: 'code' }))
                .rejects
                .toThrow(/Operation mode-switch failed and no suitable fallback provider found/);
            // 3. Perform graceful degradation
            const degradedResult = await fallbackStrategiesManager.gracefulDegradationForModeSwitch('ask', 'code');
            (0, vitest_1.expect)(degradedResult).toEqual({
                success: true,
                result: 'Degraded mode switch from ask to code',
                degraded: true
            });
        });
    });
});
//# sourceMappingURL=integration-validation.test.js.map