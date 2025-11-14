"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
(0, vitest_1.describe)('Handoff Configuration Enhancements', () => {
    let handoffSystem;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
    });
    (0, vitest_1.describe)('Configuration Validation', () => {
        (0, vitest_1.it)('should validate confidence thresholds correctly', () => {
            // Valid confidence thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 0.8 });
            }).not.toThrow();
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ minimumConfidenceForHandoff: 0.5 });
            }).not.toThrow();
            // Invalid confidence thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ minimumConfidenceForHandoff: -0.1 });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            // Invalid relationship between thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({
                    confidenceThreshold: 0.6,
                    minimumConfidenceForHandoff: 0.8
                });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
        });
        (0, vitest_1.it)('should validate numeric thresholds correctly', () => {
            // Valid numeric thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ maxHandoffDepth: 5 });
            }).not.toThrow();
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ maxConcurrentHandoffs: 10 });
            }).not.toThrow();
            // Invalid numeric thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ maxHandoffDepth: -1 });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ maxConcurrentHandoffs: 0 });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
        });
        (0, vitest_1.it)('should validate latency thresholds correctly', () => {
            // Valid latency thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({
                    latencyTargetMs: 2000,
                    maxLatencyThresholdMs: 5000
                });
            }).not.toThrow();
            // Invalid relationship between latency thresholds
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({
                    latencyTargetMs: 5000,
                    maxLatencyThresholdMs: 2000
                });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
        });
        (0, vitest_1.it)('should validate enum values correctly', () => {
            // Valid enum values
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ loadBalancingStrategy: 'round-robin' });
            }).not.toThrow();
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ agentSelectionAlgorithm: 'confidence-based' });
            }).not.toThrow();
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ logLevel: 'debug' });
            }).not.toThrow();
            // Invalid enum values
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ loadBalancingStrategy: 'invalid-strategy' });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ agentSelectionAlgorithm: 'invalid-algorithm' });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ logLevel: 'invalid-level' });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
        });
    });
    (0, vitest_1.describe)('Configuration Presets', () => {
        (0, vitest_1.it)('should load development preset correctly', () => {
            handoffSystem.loadPreset('development');
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(handoffs_ts_1.HANDOFF_CONFIG_PRESETS.development.confidenceThreshold);
            (0, vitest_1.expect)(config.logLevel).toBe('debug');
            (0, vitest_1.expect)(config.maxConcurrentHandoffs).toBe(20);
        });
        (0, vitest_1.it)('should load production preset correctly', () => {
            handoffSystem.loadPreset('production');
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(handoffs_ts_1.HANDOFF_CONFIG_PRESETS.production.confidenceThreshold);
            (0, vitest_1.expect)(config.logLevel).toBe('info');
            (0, vitest_1.expect)(config.maxConcurrentHandoffs).toBe(50);
        });
        (0, vitest_1.it)('should load highPerformance preset correctly', () => {
            handoffSystem.loadPreset('highPerformance');
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(handoffs_ts_1.HANDOFF_CONFIG_PRESETS.highPerformance.confidenceThreshold);
            (0, vitest_1.expect)(config.logLevel).toBe('warn');
            (0, vitest_1.expect)(config.maxConcurrentHandoffs).toBe(100);
        });
        (0, vitest_1.it)('should throw error for invalid preset', () => {
            (0, vitest_1.expect)(() => {
                handoffSystem.loadPreset('invalid-preset');
            }).toThrow('Handoff configuration preset \'invalid-preset\' not found');
        });
    });
    (0, vitest_1.describe)('Environment-based Configuration', () => {
        beforeEach(() => {
            // Clear environment variables
            for (const key in process.env) {
                if (key.startsWith('HANDOFF_')) {
                    delete process.env[key];
                }
            }
        });
        (0, vitest_1.it)('should load configuration from environment variables', () => {
            // Set environment variables
            process.env.HANDOFF_CONFIDENCE_THRESHOLD = '0.9';
            process.env.HANDOFF_MAX_HANDOFF_DEPTH = '5';
            process.env.HANDOFF_ENABLE_DETAILED_LOGGING = 'true';
            process.env.HANDOFF_LOG_LEVEL = 'debug';
            handoffSystem.loadConfigFromEnvironment();
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(0.9);
            (0, vitest_1.expect)(config.maxHandoffDepth).toBe(5);
            (0, vitest_1.expect)(config.enableDetailedLogging).toBe(true);
            (0, vitest_1.expect)(config.logLevel).toBe('debug');
        });
        (0, vitest_1.it)('should handle invalid environment variable values gracefully', () => {
            // Set invalid environment variables
            process.env.HANDOFF_CONFIDENCE_THRESHOLD = 'invalid';
            process.env.HANDOFF_MAX_HANDOFF_DEPTH = 'not-a-number';
            // Should not throw error for invalid values, just ignore them
            (0, vitest_1.expect)(() => {
                handoffSystem.loadConfigFromEnvironment();
            }).not.toThrow();
            // Values should remain at defaults
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(0.8); // Default value
            (0, vitest_1.expect)(config.maxHandoffDepth).toBe(3); // Default value
        });
    });
    (0, vitest_1.describe)('Configuration Health Check', () => {
        (0, vitest_1.it)('should report healthy configuration as valid', () => {
            const health = handoffSystem.checkConfigHealth();
            (0, vitest_1.expect)(health.isValid).toBe(true);
            (0, vitest_1.expect)(health.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should report unhealthy configuration with errors', () => {
            // Create an invalid configuration
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({
                    confidenceThreshold: 0.6,
                    minimumConfidenceForHandoff: 0.8
                });
            }).toThrow(); // This should throw during update
            // But we can check health of current config
            const health = handoffSystem.checkConfigHealth();
            // Since update threw, config should still be valid
            (0, vitest_1.expect)(health.isValid).toBe(true);
        });
        (0, vitest_1.it)('should detect configuration issues during health check', () => {
            // Manually set an invalid configuration to test health check
            // This simulates a case where config was set without validation
            handoffSystem.config.confidenceThreshold = 1.5;
            const health = handoffSystem.checkConfigHealth();
            (0, vitest_1.expect)(health.isValid).toBe(false);
            (0, vitest_1.expect)(health.errors).toContain('confidenceThreshold must be between 0 and 1');
        });
    });
    (0, vitest_1.describe)('Runtime Configuration Updates', () => {
        (0, vitest_1.it)('should update configuration with validation', () => {
            const initialConfig = handoffSystem.getConfig();
            handoffSystem.updateConfig({
                confidenceThreshold: 0.9,
                maxHandoffDepth: 5,
                enableDetailedLogging: false
            });
            const updatedConfig = handoffSystem.getConfig();
            (0, vitest_1.expect)(updatedConfig.confidenceThreshold).toBe(0.9);
            (0, vitest_1.expect)(updatedConfig.maxHandoffDepth).toBe(5);
            (0, vitest_1.expect)(updatedConfig.enableDetailedLogging).toBe(false);
            // Other values should remain unchanged
            (0, vitest_1.expect)(updatedConfig.latencyTargetMs).toBe(initialConfig.latencyTargetMs);
        });
        (0, vitest_1.it)('should reject invalid configuration updates', () => {
            (0, vitest_1.expect)(() => {
                handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
            }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
            // Configuration should remain unchanged
            const config = handoffSystem.getConfig();
            (0, vitest_1.expect)(config.confidenceThreshold).toBe(0.8); // Default value
        });
        (0, vitest_1.it)('should update retry configuration when related settings change', () => {
            handoffSystem.updateConfig({
                maxRetryAttempts: 5,
                retryDelayMs: 2000,
                exponentialBackoff: false
            });
            // Access private retryConfig for testing
            const retryConfig = handoffSystem.retryConfig;
            (0, vitest_1.expect)(retryConfig.maxRetries).toBe(5);
            (0, vitest_1.expect)(retryConfig.retryDelayMs).toBe(2000);
            (0, vitest_1.expect)(retryConfig.exponentialBackoff).toBe(false);
        });
    });
});
//# sourceMappingURL=handoff-config-enhancements.spec.js.map