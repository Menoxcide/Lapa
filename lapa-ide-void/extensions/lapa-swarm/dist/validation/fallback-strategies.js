"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackStrategiesManager = void 0;
/**
 * Fallback Strategies Manager for LAPA v1.2 Phase 10
 * Implements automated fallback mechanisms for failed operations
 */
class FallbackStrategiesManager {
    eventBus;
    fallbackProviders;
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.fallbackProviders = new Map();
        // Register default fallback providers
        this.registerDefaultFallbackProviders();
    }
    /**
     * Register default fallback providers
     */
    registerDefaultFallbackProviders() {
        // Register local fallback provider for agent tools
        this.registerFallbackProvider('agent-tool-local', {
            canHandle: (operation) => operation.startsWith('agent-tool'),
            execute: async (operation, params) => {
                // In a real implementation, this would execute the tool locally
                console.log(`Executing ${operation} locally as fallback`);
                return { success: true, result: 'Local execution result' };
            }
        });
        // Register simplified fallback provider for handoffs
        this.registerFallbackProvider('handoff-simplified', {
            canHandle: (operation) => operation === 'handoff',
            execute: async (operation, params) => {
                // In a real implementation, this would execute a simplified handoff
                console.log('Executing simplified handoff as fallback');
                return { success: true, result: 'Simplified handoff result' };
            }
        });
        // Register cached fallback provider for mode switching
        this.registerFallbackProvider('mode-switch-cache', {
            canHandle: (operation) => operation === 'mode-switch',
            execute: async (operation, params) => {
                // In a real implementation, this would use cached mode configurations
                console.log('Using cached mode configuration as fallback');
                return { success: true, result: 'Cached mode switch result' };
            }
        });
    }
    /**
     * Register a fallback provider
     * @param name Name of the fallback provider
     * @param provider Fallback provider implementation
     */
    registerFallbackProvider(name, provider) {
        this.fallbackProviders.set(name, provider);
        // Publish registration event
        this.eventBus.publish({
            id: `fallback-provider-registered-${name}`,
            type: 'fallback.provider.registered',
            timestamp: Date.now(),
            source: 'fallback-strategies-manager',
            payload: {
                name
            }
        });
    }
    /**
     * Execute operation with fallback strategy
     * @param operation Name of the operation
     * @param primaryExecutor Function to execute primary operation
     * @param params Parameters for the operation
     * @returns Promise that resolves with the operation result
     */
    async executeWithFallback(operation, primaryExecutor, params = {}) {
        try {
            // Attempt primary execution
            const result = await primaryExecutor();
            // Publish success event
            await this.eventBus.publish({
                id: `operation-success-${Date.now()}`,
                type: 'operation.executed',
                timestamp: Date.now(),
                source: 'fallback-strategies-manager',
                payload: {
                    operation,
                    strategy: 'primary',
                    result
                }
            });
            return result;
        }
        catch (primaryError) {
            console.warn(`Primary execution failed for operation ${operation}:`, primaryError);
            // Try to find a suitable fallback provider
            const fallbackProvider = this.findSuitableFallbackProvider(operation);
            if (fallbackProvider) {
                try {
                    // Publish fallback initiation event
                    await this.eventBus.publish({
                        id: `fallback-init-${Date.now()}`,
                        type: 'operation.fallback.initiated',
                        timestamp: Date.now(),
                        source: 'fallback-strategies-manager',
                        payload: {
                            operation,
                            provider: this.getProviderName(fallbackProvider),
                            primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError)
                        }
                    });
                    // Execute fallback
                    const fallbackResult = await fallbackProvider.execute(operation, params);
                    if (fallbackResult.success) {
                        // Publish fallback success event
                        await this.eventBus.publish({
                            id: `fallback-success-${Date.now()}`,
                            type: 'operation.fallback.succeeded',
                            timestamp: Date.now(),
                            source: 'fallback-strategies-manager',
                            payload: {
                                operation,
                                provider: this.getProviderName(fallbackProvider),
                                result: fallbackResult.result
                            }
                        });
                        return fallbackResult.result;
                    }
                    else {
                        throw new Error(fallbackResult.error || 'Fallback execution failed');
                    }
                }
                catch (fallbackError) {
                    // Publish fallback failure event
                    await this.eventBus.publish({
                        id: `fallback-failure-${Date.now()}`,
                        type: 'operation.fallback.failed',
                        timestamp: Date.now(),
                        source: 'fallback-strategies-manager',
                        payload: {
                            operation,
                            provider: this.getProviderName(fallbackProvider),
                            primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError),
                            fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
                        }
                    });
                    throw new Error(`Both primary execution and fallback failed for operation ${operation}. Primary: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                }
            }
            else {
                // Publish failure event when no fallback available
                await this.eventBus.publish({
                    id: `operation-failure-${Date.now()}`,
                    type: 'operation.failed.permanently',
                    timestamp: Date.now(),
                    source: 'fallback-strategies-manager',
                    payload: {
                        operation,
                        error: primaryError instanceof Error ? primaryError.message : String(primaryError)
                    }
                });
                throw new Error(`Operation ${operation} failed and no suitable fallback provider found: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`);
            }
        }
    }
    /**
     * Find a suitable fallback provider for an operation
     * @param operation Name of the operation
     * @returns Suitable fallback provider or null if none found
     */
    findSuitableFallbackProvider(operation) {
        for (const [, provider] of this.fallbackProviders) {
            if (provider.canHandle(operation)) {
                return provider;
            }
        }
        return null;
    }
    /**
     * Get the name of a fallback provider
     * @param provider Fallback provider
     * @returns Name of the provider
     */
    getProviderName(provider) {
        for (const [name, p] of this.fallbackProviders) {
            if (p === provider) {
                return name;
            }
        }
        return 'unknown';
    }
    /**
     * Graceful degradation for agent tool execution
     * @param tool Agent tool to execute
     * @param context Execution context
     * @returns Promise that resolves with degraded execution result
     */
    async gracefulDegradationForTool(tool, context) {
        // Simplified execution with reduced functionality
        console.log(`Performing graceful degradation for tool ${tool.name}`);
        // In a real implementation, this would execute a simplified version of the tool
        // or return cached results if available
        // Publish degradation event
        await this.eventBus.publish({
            id: `tool-degradation-${tool.name}-${Date.now()}`,
            type: 'tool.degraded',
            timestamp: Date.now(),
            source: 'fallback-strategies-manager',
            payload: {
                toolName: tool.name,
                contextKeys: Object.keys(context)
            }
        });
        return {
            success: true,
            result: `Degraded result for ${tool.name}`,
            degraded: true
        };
    }
    /**
     * Graceful degradation for mode switching
     * @param fromMode Source mode
     * @param toMode Target mode
     * @returns Promise that resolves with degraded mode switch result
     */
    async gracefulDegradationForModeSwitch(fromMode, toMode) {
        // Switch to a safe intermediate mode if direct switch fails
        console.log(`Performing graceful degradation for mode switch from ${fromMode} to ${toMode}`);
        // In a real implementation, this would switch to a safe intermediate mode
        // or use cached configurations
        // Publish degradation event
        await this.eventBus.publish({
            id: `mode-degradation-${fromMode}-${toMode}-${Date.now()}`,
            type: 'mode.degraded',
            timestamp: Date.now(),
            source: 'fallback-strategies-manager',
            payload: {
                fromMode,
                toMode
            }
        });
        return {
            success: true,
            result: `Degraded mode switch from ${fromMode} to ${toMode}`,
            degraded: true
        };
    }
    /**
     * Get registered fallback providers
     * @returns List of registered fallback provider names
     */
    getRegisteredProviders() {
        return Array.from(this.fallbackProviders.keys());
    }
    /**
     * Remove a fallback provider
     * @param name Name of the fallback provider to remove
     */
    removeFallbackProvider(name) {
        this.fallbackProviders.delete(name);
        // Publish removal event
        this.eventBus.publish({
            id: `fallback-provider-removed-${name}`,
            type: 'fallback.provider.removed',
            timestamp: Date.now(),
            source: 'fallback-strategies-manager',
            payload: {
                name
            }
        });
    }
}
exports.FallbackStrategiesManager = FallbackStrategiesManager;
//# sourceMappingURL=fallback-strategies.js.map