"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../orchestrator/handoffs.ts");
(0, vitest_1.describe)('Handoff Configuration Validation', () => {
    let handoffSystem;
    (0, vitest_1.beforeEach)(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
    });
    (0, vitest_1.it)('should validate basic configuration correctly', () => {
        // Valid update
        (0, vitest_1.expect)(() => {
            handoffSystem.updateConfig({ confidenceThreshold: 0.9 });
        }).not.toThrow();
        // Invalid update
        (0, vitest_1.expect)(() => {
            handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
        }).toThrow(handoffs_ts_1.HandoffConfigValidationError);
    });
    (0, vitest_1.it)('should load configuration presets correctly', () => {
        handoffSystem.loadPreset('development');
        const devConfig = handoffSystem.getConfig();
        (0, vitest_1.expect)(devConfig.confidenceThreshold).toBeDefined();
        handoffSystem.loadPreset('production');
        const prodConfig = handoffSystem.getConfig();
        (0, vitest_1.expect)(prodConfig.confidenceThreshold).toBeDefined();
    });
    (0, vitest_1.it)('should load configuration from environment variables', () => {
        // Set some environment variables
        process.env.HANDOFF_CONFIDENCE_THRESHOLD = '0.85';
        process.env.HANDOFF_MAX_HANDOFF_DEPTH = '7';
        handoffSystem.loadConfigFromEnvironment();
        const envConfig = handoffSystem.getConfig();
        (0, vitest_1.expect)(envConfig.confidenceThreshold).toBe(0.85);
        (0, vitest_1.expect)(envConfig.maxHandoffDepth).toBe(7);
        // Clean up
        delete process.env.HANDOFF_CONFIDENCE_THRESHOLD;
        delete process.env.HANDOFF_MAX_HANDOFF_DEPTH;
    });
    (0, vitest_1.it)('should check configuration health', () => {
        const health = handoffSystem.checkConfigHealth();
        (0, vitest_1.expect)(health.isValid).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(health.errors)).toBe(true);
    });
});
//# sourceMappingURL=validate-handoff-config.js.map