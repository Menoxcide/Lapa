"use strict";
// Simple test to verify local handoff functionality
Object.defineProperty(exports, "__esModule", { value: true });
var handoffs_local_1 = require("../../orchestrator/handoffs.local");
describe('Simple Local Handoff Test', function () {
    it('should create LocalHandoffSystem instance', function () {
        var handoffSystem = new handoffs_local_1.LocalHandoffSystem();
        expect(handoffSystem).toBeDefined();
    });
    it('should register a local agent', function () {
        var handoffSystem = new handoffs_local_1.LocalHandoffSystem();
        var mockAgent = {
            id: 'test-agent-1',
            name: 'Test Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        handoffSystem.registerLocalAgent(mockAgent);
        // If we get here without error, the test passes
        expect(true).toBe(true);
    });
});
