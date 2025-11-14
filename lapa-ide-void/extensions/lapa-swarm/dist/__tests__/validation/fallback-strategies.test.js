"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fallback_strategies_ts_1 = require("../../validation/fallback-strategies.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('FallbackStrategiesManager', () => {
    let fallbackStrategiesManager;
    let eventBus;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new event_bus_ts_1.LAPAEventBus();
        fallbackStrategiesManager = new fallback_strategies_ts_1.FallbackStrategiesManager(eventBus);
    });
    (0, vitest_1.describe)('registerFallbackProvider', () => {
        (0, vitest_1.it)('should register a fallback provider', () => {
            const provider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: async (operation, params) => ({ success: true, result: 'test result' })
            };
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'fallback.provider.registered',
                payload: vitest_1.expect.objectContaining({
                    name: 'test-provider'
                })
            }));
            // Verify provider is registered by checking if it can handle operations
            const providers = fallbackStrategiesManager.getRegisteredProviders();
            (0, vitest_1.expect)(providers).toContain('test-provider');
        });
    });
    (0, vitest_1.describe)('executeWithFallback', () => {
        (0, vitest_1.it)('should execute primary operation successfully', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockResolvedValue('primary result');
            const params = { testParam: 'value' };
            const result = await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
            (0, vitest_1.expect)(result).toBe('primary result');
            (0, vitest_1.expect)(primaryExecutor).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should execute fallback when primary operation fails', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that can handle the operation
            const fallbackProvider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            const result = await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
            (0, vitest_1.expect)(result).toBe('fallback result');
            (0, vitest_1.expect)(primaryExecutor).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(fallbackProvider.execute).toHaveBeenCalledWith('test-operation', params);
        });
        (0, vitest_1.it)('should fail when both primary and fallback fail', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that also fails
            const fallbackProvider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: false, error: 'Fallback failed' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
                .rejects
                .toThrow(/Both primary execution and fallback failed/);
            (0, vitest_1.expect)(primaryExecutor).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(fallbackProvider.execute).toHaveBeenCalledWith('test-operation', params);
        });
        (0, vitest_1.it)('should fail when no suitable fallback provider is found', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that cannot handle the operation
            const fallbackProvider = {
                canHandle: (operation) => operation === 'different-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
                .rejects
                .toThrow(/Operation test-operation failed and no suitable fallback provider found/);
            (0, vitest_1.expect)(primaryExecutor).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(fallbackProvider.execute).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should publish events for successful primary execution', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockResolvedValue('primary result');
            const params = { testParam: 'value' };
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'operation.executed',
                payload: vitest_1.expect.objectContaining({
                    operation: 'test-operation',
                    strategy: 'primary',
                    result: 'primary result'
                })
            }));
        });
        (0, vitest_1.it)('should publish events for fallback initiation and success', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that can handle the operation
            const fallbackProvider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'operation.fallback.initiated',
                payload: vitest_1.expect.objectContaining({
                    operation: 'test-operation',
                    provider: 'test-fallback',
                    primaryError: 'Primary failed'
                })
            }));
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'operation.fallback.succeeded',
                payload: vitest_1.expect.objectContaining({
                    operation: 'test-operation',
                    provider: 'test-fallback',
                    result: 'fallback result'
                })
            }));
        });
        (0, vitest_1.it)('should publish events for fallback failure', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that also fails
            const fallbackProvider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: false, error: 'Fallback failed' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
                .rejects
                .toThrow();
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'operation.fallback.failed',
                payload: vitest_1.expect.objectContaining({
                    operation: 'test-operation',
                    provider: 'test-fallback',
                    primaryError: 'Primary failed',
                    fallbackError: 'Fallback failed'
                })
            }));
        });
        (0, vitest_1.it)('should publish events for permanent failure when no fallback available', async () => {
            const primaryExecutor = vitest_1.vi.fn().mockRejectedValue(new Error('Primary failed'));
            const params = { testParam: 'value' };
            // Register a fallback provider that cannot handle the operation
            const fallbackProvider = {
                canHandle: (operation) => operation === 'different-operation',
                execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            await (0, vitest_1.expect)(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
                .rejects
                .toThrow();
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'operation.failed.permanently',
                payload: vitest_1.expect.objectContaining({
                    operation: 'test-operation',
                    error: 'Primary failed'
                })
            }));
        });
    });
    (0, vitest_1.describe)('gracefulDegradationForTool', () => {
        (0, vitest_1.it)('should perform graceful degradation for tool execution', async () => {
            const mockTool = {
                name: 'test-tool',
                type: 'testing',
                description: 'Test tool',
                version: '1.0.0',
                execute: vitest_1.vi.fn(),
                validateParameters: vitest_1.vi.fn()
            };
            const context = { testParam: 'value' };
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            const result = await fallbackStrategiesManager.gracefulDegradationForTool(mockTool, context);
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                result: 'Degraded result for test-tool',
                degraded: true
            });
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'tool.degraded',
                payload: vitest_1.expect.objectContaining({
                    toolName: 'test-tool',
                    contextKeys: ['testParam']
                })
            }));
        });
    });
    (0, vitest_1.describe)('gracefulDegradationForModeSwitch', () => {
        (0, vitest_1.it)('should perform graceful degradation for mode switching', async () => {
            const fromMode = 'ask';
            const toMode = 'code';
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            const result = await fallbackStrategiesManager.gracefulDegradationForModeSwitch(fromMode, toMode);
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                result: 'Degraded mode switch from ask to code',
                degraded: true
            });
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'mode.degraded',
                payload: vitest_1.expect.objectContaining({
                    fromMode: 'ask',
                    toMode: 'code'
                })
            }));
        });
    });
    (0, vitest_1.describe)('removeFallbackProvider', () => {
        (0, vitest_1.it)('should remove a fallback provider', () => {
            const provider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: async (operation, params) => ({ success: true, result: 'test result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
            // Verify provider is registered
            let providers = fallbackStrategiesManager.getRegisteredProviders();
            (0, vitest_1.expect)(providers).toContain('test-provider');
            const publishSpy = vitest_1.vi.spyOn(eventBus, 'publish');
            fallbackStrategiesManager.removeFallbackProvider('test-provider');
            (0, vitest_1.expect)(publishSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'fallback.provider.removed',
                payload: vitest_1.expect.objectContaining({
                    name: 'test-provider'
                })
            }));
            // Verify provider is removed
            providers = fallbackStrategiesManager.getRegisteredProviders();
            (0, vitest_1.expect)(providers).not.toContain('test-provider');
        });
    });
    (0, vitest_1.describe)('getRegisteredProviders', () => {
        (0, vitest_1.it)('should return list of registered fallback providers', () => {
            // Initially should have default providers
            let providers = fallbackStrategiesManager.getRegisteredProviders();
            (0, vitest_1.expect)(providers).toContain('agent-tool-local');
            (0, vitest_1.expect)(providers).toContain('handoff-simplified');
            (0, vitest_1.expect)(providers).toContain('mode-switch-cache');
            // Register additional provider
            const provider = {
                canHandle: (operation) => operation === 'test-operation',
                execute: async (operation, params) => ({ success: true, result: 'test result' })
            };
            fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
            providers = fallbackStrategiesManager.getRegisteredProviders();
            (0, vitest_1.expect)(providers).toContain('test-provider');
        });
    });
});
//# sourceMappingURL=fallback-strategies.test.js.map