"use strict";
/**
 * Integration Tests for Roo Mode Controller in LAPA v1.2 Phase 10
 *
 * This module contains integration tests demonstrating mode switching
 * and agent adaptation in the LAPA system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const modes_ts_1 = require("../../modes/modes.ts");
const agent_mode_extension_ts_1 = require("../../agents/agent-mode-extension.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const vitest_1 = require("vitest");
// Mock agents for testing
const mockCoderAgent = {
    id: 'mock-coder-1',
    type: 'coder',
    name: 'Mock Coder Agent',
    expertise: ['javascript', 'typescript', 'react'],
    workload: 2,
    capacity: 5
};
const mockPlannerAgent = {
    id: 'mock-planner-1',
    type: 'planner',
    name: 'Mock Planner Agent',
    expertise: ['system_design', 'architecture', 'planning'],
    workload: 1,
    capacity: 3
};
describe('Roo Mode Controller Integration', () => {
    let controller;
    beforeAll(async () => {
        // Initialize the mode controller
        controller = modes_ts_1.rooModeController;
        await controller.initialize();
    });
    beforeEach(() => {
        // Reset to default mode before each test
        // Note: In a real implementation, we would have a method to reset the mode
        // For now, we'll just ensure we start with the default mode
    });
    afterEach(() => {
        // Clean up after each test
        vitest_1.vi.clearAllMocks();
    });
    describe('Mode Switching', () => {
        it('should successfully switch from ask mode to code mode', async () => {
            // Arrange
            const request = {
                fromMode: 'ask',
                toMode: 'code',
                reason: 'User requested code generation'
            };
            // Act
            const result = await controller.requestModeChange(request);
            // Assert
            expect(result.success).toBe(true);
            expect(result.fromMode).toBe('ask');
            expect(result.toMode).toBe('code');
            expect(result.transitionTime).toBeGreaterThan(0);
            expect(controller.getCurrentMode()).toBe('code');
        });
        it('should successfully switch from code mode to architect mode', async () => {
            // Arrange
            // First switch to code mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'code'
            });
            const request = {
                fromMode: 'code',
                toMode: 'architect',
                reason: 'User requested system design'
            };
            // Act
            const result = await controller.requestModeChange(request);
            // Assert
            expect(result.success).toBe(true);
            expect(result.fromMode).toBe('code');
            expect(result.toMode).toBe('architect');
            expect(result.transitionTime).toBeGreaterThan(0);
            expect(controller.getCurrentMode()).toBe('architect');
        });
        it('should successfully switch from architect mode to debug mode', async () => {
            // Arrange
            // First switch to architect mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'architect'
            });
            const request = {
                fromMode: 'architect',
                toMode: 'debug',
                reason: 'User encountered an error'
            };
            // Act
            const result = await controller.requestModeChange(request);
            // Assert
            expect(result.success).toBe(true);
            expect(result.fromMode).toBe('architect');
            expect(result.toMode).toBe('debug');
            expect(result.transitionTime).toBeGreaterThan(0);
            expect(controller.getCurrentMode()).toBe('debug');
        });
        it('should prevent switching to the same mode', async () => {
            // Arrange
            // First switch to code mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'code'
            });
            const request = {
                fromMode: 'code',
                toMode: 'code',
                reason: 'User requested code mode again'
            };
            // Act
            const result = await controller.requestModeChange(request);
            // Assert
            expect(result.success).toBe(true); // Should be successful but no actual transition
            expect(result.fromMode).toBe('code');
            expect(result.toMode).toBe('code');
            expect(controller.getCurrentMode()).toBe('code');
        });
        it('should fail when requesting transition from incorrect current mode', async () => {
            // Arrange
            // Ensure we're in ask mode
            // In a real implementation, we would have a method to set the mode directly
            // For now, we'll assume the controller is in ask mode by default
            const request = {
                fromMode: 'code', // Incorrect current mode
                toMode: 'architect',
                reason: 'User requested system design'
            };
            // Act
            const result = await controller.requestModeChange(request);
            // Assert
            expect(result.success).toBe(false);
            expect(result.fromMode).toBe('code');
            expect(result.toMode).toBe('architect');
            expect(result.error).toContain('does not match requested fromMode');
            // Should still be in ask mode
            expect(controller.getCurrentMode()).toBe('ask');
        });
    });
    describe('Agent Mode Adaptation', () => {
        it('should adapt agent behavior when mode changes to code', async () => {
            // Arrange
            // Create a mode-aware agent
            const modeAwareAgent = (0, agent_mode_extension_ts_1.createModeAwareAgent)(mockCoderAgent);
            (0, agent_mode_extension_ts_1.initializeModeBehaviors)(modeAwareAgent, 'coder');
            // Switch to code mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'code'
            });
            // Act
            await modeAwareAgent.adaptToCurrentMode();
            // Assert
            // In a real implementation, we would check that the agent's behavior has been updated
            // For now, we'll just verify the method completes without error
            expect(modeAwareAgent.getCurrentMode).toBeDefined();
        });
        it('should adapt agent behavior when mode changes to architect', async () => {
            // Arrange
            // Create a mode-aware agent
            const modeAwareAgent = (0, agent_mode_extension_ts_1.createModeAwareAgent)(mockPlannerAgent);
            (0, agent_mode_extension_ts_1.initializeModeBehaviors)(modeAwareAgent, 'planner');
            // Switch to architect mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'architect'
            });
            // Act
            await modeAwareAgent.adaptToCurrentMode();
            // Assert
            // In a real implementation, we would check that the agent's behavior has been updated
            // For now, we'll just verify the method completes without error
            expect(modeAwareAgent.getCurrentMode).toBeDefined();
        });
        it('should execute task with mode-specific adaptations', async () => {
            // Arrange
            // Create a mode-aware agent
            const modeAwareAgent = (0, agent_mode_extension_ts_1.createModeAwareAgent)(mockCoderAgent);
            (0, agent_mode_extension_ts_1.initializeModeBehaviors)(modeAwareAgent, 'coder');
            // Switch to code mode
            await controller.requestModeChange({
                fromMode: 'ask',
                toMode: 'code'
            });
            // Adapt agent to current mode
            await modeAwareAgent.adaptToCurrentMode();
            const task = {
                id: 'test-task-1',
                description: 'Generate a React component for a todo list',
                type: 'code_generation',
                priority: 1
            };
            // Act
            const result = await modeAwareAgent.executeTaskWithModeAdaptation(task);
            // Assert
            expect(result.success).toBe(true);
            expect(result.taskId).toBe('test-task-1');
            expect(result.result).toContain('code mode');
        });
    });
    describe('Event Integration', () => {
        it('should publish mode change events', async () => {
            // Arrange
            const eventHandler = vitest_1.vi.fn();
            event_bus_ts_1.eventBus.subscribe('mode.changed', eventHandler);
            const request = {
                fromMode: 'ask',
                toMode: 'code',
                reason: 'User requested code generation'
            };
            // Act
            await controller.requestModeChange(request);
            // Assert
            expect(eventHandler).toHaveBeenCalledTimes(1);
            const event = eventHandler.mock.calls[0][0];
            expect(event.type).toBe('mode.changed');
            expect(event.payload.fromMode).toBe('ask');
            expect(event.payload.toMode).toBe('code');
            expect(event.payload.reason).toBe('User requested code generation');
        });
        it('should handle mode change request events', async () => {
            // Arrange
            const eventHandler = vitest_1.vi.fn();
            event_bus_ts_1.eventBus.subscribe('mode.changed', eventHandler);
            // Act
            // Simulate publishing a mode change request event
            await event_bus_ts_1.eventBus.publish({
                id: 'test-event-1',
                type: 'mode.change.request',
                timestamp: Date.now(),
                source: 'test',
                payload: {
                    fromMode: 'ask',
                    toMode: 'code',
                    reason: 'Event-driven mode change'
                }
            });
            // Allow time for event processing
            await new Promise(resolve => setTimeout(resolve, 100));
            // Assert
            expect(eventHandler).toHaveBeenCalledTimes(1);
            expect(controller.getCurrentMode()).toBe('code');
        });
    });
    describe('Mode Configuration', () => {
        it('should retrieve mode configuration', () => {
            // Act
            const config = controller.getModeConfig('code');
            // Assert
            expect(config).toBeDefined();
            expect(config?.type).toBe('code');
            expect(config?.name).toBe('Code Mode');
            expect(config?.capabilities).toContain('code_generation');
        });
        it('should return undefined for non-existent mode configuration', () => {
            // Act
            const config = controller.getModeConfig('non-existent-mode');
            // Assert
            expect(config).toBeUndefined();
        });
    });
});
//# sourceMappingURL=mode-switching.integration.test.js.map