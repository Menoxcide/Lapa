import { HybridHandoffSystem, HandoffConfigValidationError, HANDOFF_CONFIG_PRESETS } from '../../src/orchestrator/handoffs';
describe('Handoff Configuration Enhancements', () => {
    let handoffSystem;
    beforeEach(() => {
        handoffSystem = new HybridHandoffSystem();
    });
    describe('Configuration Validation', () => {
        it('should validate confidence thresholds correctly', () => {
            // Valid confidence thresholds
            expect(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 0.8 });
            }).not.toThrow();
            expect(() => {
                handoffSystem.updateConfig({ minimumConfidenceForHandoff: 0.5 });
            }).not.toThrow();
            // Invalid confidence thresholds
            expect(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
            }).toThrow(HandoffConfigValidationError);
            expect(() => {
                handoffSystem.updateConfig({ minimumConfidenceForHandoff: -0.1 });
            }).toThrow(HandoffConfigValidationError);
            // Invalid relationship between thresholds
            expect(() => {
                handoffSystem.updateConfig({
                    confidenceThreshold: 0.6,
                    minimumConfidenceForHandoff: 0.8
                });
            }).toThrow(HandoffConfigValidationError);
        });
        it('should validate numeric thresholds correctly', () => {
            // Valid numeric thresholds
            expect(() => {
                handoffSystem.updateConfig({ maxHandoffDepth: 5 });
            }).not.toThrow();
            expect(() => {
                handoffSystem.updateConfig({ maxConcurrentHandoffs: 10 });
            }).not.toThrow();
            // Invalid numeric thresholds
            expect(() => {
                handoffSystem.updateConfig({ maxHandoffDepth: -1 });
            }).toThrow(HandoffConfigValidationError);
            expect(() => {
                handoffSystem.updateConfig({ maxConcurrentHandoffs: 0 });
            }).toThrow(HandoffConfigValidationError);
        });
        it('should validate latency thresholds correctly', () => {
            // Valid latency thresholds
            expect(() => {
                handoffSystem.updateConfig({
                    latencyTargetMs: 2000,
                    maxLatencyThresholdMs: 5000
                });
            }).not.toThrow();
            // Invalid relationship between latency thresholds
            expect(() => {
                handoffSystem.updateConfig({
                    latencyTargetMs: 5000,
                    maxLatencyThresholdMs: 2000
                });
            }).toThrow(HandoffConfigValidationError);
        });
        it('should validate enum values correctly', () => {
            // Valid enum values
            expect(() => {
                handoffSystem.updateConfig({ loadBalancingStrategy: 'round-robin' });
            }).not.toThrow();
            expect(() => {
                handoffSystem.updateConfig({ agentSelectionAlgorithm: 'confidence-based' });
            }).not.toThrow();
            expect(() => {
                handoffSystem.updateConfig({ logLevel: 'debug' });
            }).not.toThrow();
            // Invalid enum values
            expect(() => {
                handoffSystem.updateConfig({ loadBalancingStrategy: 'invalid-strategy' });
            }).toThrow(HandoffConfigValidationError);
            expect(() => {
                handoffSystem.updateConfig({ agentSelectionAlgorithm: 'invalid-algorithm' });
            }).toThrow(HandoffConfigValidationError);
            expect(() => {
                handoffSystem.updateConfig({ logLevel: 'invalid-level' });
            }).toThrow(HandoffConfigValidationError);
        });
    });
    describe('Configuration Presets', () => {
        it('should load development preset correctly', () => {
            handoffSystem.loadPreset('development');
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(HANDOFF_CONFIG_PRESETS.development.confidenceThreshold);
            expect(config.logLevel).toBe('debug');
            expect(config.maxConcurrentHandoffs).toBe(20);
        });
        it('should load production preset correctly', () => {
            handoffSystem.loadPreset('production');
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(HANDOFF_CONFIG_PRESETS.production.confidenceThreshold);
            expect(config.logLevel).toBe('info');
            expect(config.maxConcurrentHandoffs).toBe(50);
        });
        it('should load highPerformance preset correctly', () => {
            handoffSystem.loadPreset('highPerformance');
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(HANDOFF_CONFIG_PRESETS.highPerformance.confidenceThreshold);
            expect(config.logLevel).toBe('warn');
            expect(config.maxConcurrentHandoffs).toBe(100);
        });
        it('should throw error for invalid preset', () => {
            expect(() => {
                handoffSystem.loadPreset('invalid-preset');
            }).toThrow('Handoff configuration preset \'invalid-preset\' not found');
        });
    });
    describe('Environment-based Configuration', () => {
        beforeEach(() => {
            // Clear environment variables
            for (const key in process.env) {
                if (key.startsWith('HANDOFF_')) {
                    delete process.env[key];
                }
            }
        });
        it('should load configuration from environment variables', () => {
            // Set environment variables
            process.env.HANDOFF_CONFIDENCE_THRESHOLD = '0.9';
            process.env.HANDOFF_MAX_HANDOFF_DEPTH = '5';
            process.env.HANDOFF_ENABLE_DETAILED_LOGGING = 'true';
            process.env.HANDOFF_LOG_LEVEL = 'debug';
            handoffSystem.loadConfigFromEnvironment();
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(0.9);
            expect(config.maxHandoffDepth).toBe(5);
            expect(config.enableDetailedLogging).toBe(true);
            expect(config.logLevel).toBe('debug');
        });
        it('should handle invalid environment variable values gracefully', () => {
            // Set invalid environment variables
            process.env.HANDOFF_CONFIDENCE_THRESHOLD = 'invalid';
            process.env.HANDOFF_MAX_HANDOFF_DEPTH = 'not-a-number';
            // Should not throw error for invalid values, just ignore them
            expect(() => {
                handoffSystem.loadConfigFromEnvironment();
            }).not.toThrow();
            // Values should remain at defaults
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(0.8); // Default value
            expect(config.maxHandoffDepth).toBe(3); // Default value
        });
    });
    describe('Configuration Health Check', () => {
        it('should report healthy configuration as valid', () => {
            const health = handoffSystem.checkConfigHealth();
            expect(health.isValid).toBe(true);
            expect(health.errors).toHaveLength(0);
        });
        it('should report unhealthy configuration with errors', () => {
            // Create an invalid configuration
            expect(() => {
                handoffSystem.updateConfig({
                    confidenceThreshold: 0.6,
                    minimumConfidenceForHandoff: 0.8
                });
            }).toThrow(); // This should throw during update
            // But we can check health of current config
            const health = handoffSystem.checkConfigHealth();
            // Since update threw, config should still be valid
            expect(health.isValid).toBe(true);
        });
        it('should detect configuration issues during health check', () => {
            // Manually set an invalid configuration to test health check
            // This simulates a case where config was set without validation
            handoffSystem.config.confidenceThreshold = 1.5;
            const health = handoffSystem.checkConfigHealth();
            expect(health.isValid).toBe(false);
            expect(health.errors).toContain('confidenceThreshold must be between 0 and 1');
        });
    });
    describe('Runtime Configuration Updates', () => {
        it('should update configuration with validation', () => {
            const initialConfig = handoffSystem.getConfig();
            handoffSystem.updateConfig({
                confidenceThreshold: 0.9,
                maxHandoffDepth: 5,
                enableDetailedLogging: false
            });
            const updatedConfig = handoffSystem.getConfig();
            expect(updatedConfig.confidenceThreshold).toBe(0.9);
            expect(updatedConfig.maxHandoffDepth).toBe(5);
            expect(updatedConfig.enableDetailedLogging).toBe(false);
            // Other values should remain unchanged
            expect(updatedConfig.latencyTargetMs).toBe(initialConfig.latencyTargetMs);
        });
        it('should reject invalid configuration updates', () => {
            expect(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
            }).toThrow(HandoffConfigValidationError);
            // Configuration should remain unchanged
            const config = handoffSystem.getConfig();
            expect(config.confidenceThreshold).toBe(0.8); // Default value
        });
        it('should update retry configuration when related settings change', () => {
            handoffSystem.updateConfig({
                maxRetryAttempts: 5,
                retryDelayMs: 2000,
                exponentialBackoff: false
            });
            // Access private retryConfig for testing
            const retryConfig = handoffSystem.retryConfig;
            expect(retryConfig.maxRetries).toBe(5);
            expect(retryConfig.retryDelayMs).toBe(2000);
            expect(retryConfig.exponentialBackoff).toBe(false);
        });
    });
});
//# sourceMappingURL=handoff-config-enhancements.spec.js.map