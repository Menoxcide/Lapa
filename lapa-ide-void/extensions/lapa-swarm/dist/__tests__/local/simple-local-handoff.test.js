"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Simple test to verify local handoff functionality
// Use the dist-local directory for imports
const handoffs_local_ts_1 = require("../../orchestrator/handoffs.local.ts");
(0, vitest_1.describe)('Simple Local Handoff Test', () => {
    (0, vitest_1.it)('should create LocalHandoffSystem instance', () => {
        const handoffSystem = new handoffs_local_ts_1.LocalHandoffSystem();
        (0, vitest_1.expect)(handoffSystem).toBeDefined();
    });
    (0, vitest_1.it)('should register a local agent', () => {
        const handoffSystem = new handoffs_local_ts_1.LocalHandoffSystem();
        const mockAgent = {
            id: 'test-agent-1',
            name: 'Test Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        handoffSystem.registerLocalAgent(mockAgent);
        // If we get here without error, the test passes
        (0, vitest_1.expect)(true).toBe(true);
    });
});
//# sourceMappingURL=simple-local-handoff.test.js.map