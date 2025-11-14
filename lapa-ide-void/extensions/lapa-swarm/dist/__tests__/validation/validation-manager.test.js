"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validation_manager_ts_1 = require("../../validation/validation-manager.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('ValidationManager', () => {
    let validationManager;
    let eventBus;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new event_bus_ts_1.LAPAEventBus();
        validationManager = new validation_manager_ts_1.ValidationManager(eventBus);
    });
    (0, vitest_1.describe)('validateToolExecution', () => {
        (0, vitest_1.it)('should validate tool with valid parameters', () => {
            const mockTool = {
                name: 'test-tool',
                type: 'testing',
                description: 'Test tool',
                version: '1.0.0',
                execute: vitest_1.vi.fn(),
                validateParameters: (params) => {
                    return !!params && typeof params === 'object' && params.testParam;
                }
            };
            const result = validationManager.validateToolExecution(mockTool, { testParam: 'value' });
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should invalidate tool with invalid parameters', () => {
            const mockTool = {
                name: 'test-tool',
                type: 'testing',
                description: 'Test tool',
                version: '1.0.0',
                execute: vitest_1.vi.fn(),
                validateParameters: (params) => {
                    return !!params && typeof params === 'object' && params.testParam;
                }
            };
            const result = validationManager.validateToolExecution(mockTool, { invalidParam: 'value' });
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Tool test-tool reported invalid parameters');
        });
        (0, vitest_1.it)('should handle tool validation that throws an error', () => {
            const mockTool = {
                name: 'test-tool',
                type: 'testing',
                description: 'Test tool',
                version: '1.0.0',
                execute: vitest_1.vi.fn(),
                validateParameters: (params) => {
                    throw new Error('Validation failed');
                }
            };
            const result = validationManager.validateToolExecution(mockTool, { testParam: 'value' });
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Tool test-tool validation threw error: Validation failed');
        });
        (0, vitest_1.it)('should invalidate when parameters object is missing', () => {
            const mockTool = {
                name: 'test-tool',
                type: 'testing',
                description: 'Test tool',
                version: '1.0.0',
                execute: vitest_1.vi.fn(),
                validateParameters: vitest_1.vi.fn()
            };
            const result = validationManager.validateToolExecution(mockTool, null);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Parameters object is required');
        });
    });
    (0, vitest_1.describe)('validateHandoffRequest', () => {
        (0, vitest_1.it)('should validate handoff request with all required fields', () => {
            const request = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                taskId: 'task-123',
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should invalidate handoff request with missing sourceAgentId', () => {
            const request = {
                targetAgentId: 'agent-2',
                taskId: 'task-123',
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('sourceAgentId is required');
        });
        (0, vitest_1.it)('should invalidate handoff request with missing targetAgentId', () => {
            const request = {
                sourceAgentId: 'agent-1',
                taskId: 'task-123',
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('targetAgentId is required');
        });
        (0, vitest_1.it)('should invalidate handoff request with missing taskId', () => {
            const request = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('taskId is required');
        });
        (0, vitest_1.it)('should invalidate handoff request with missing context', () => {
            const request = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                taskId: 'task-123'
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('context is required');
        });
        (0, vitest_1.it)('should invalidate handoff request with invalid agent ID format', () => {
            const request = {
                sourceAgentId: '', // Invalid empty string
                targetAgentId: 'agent-2',
                taskId: 'task-123',
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('sourceAgentId has invalid format');
        });
        (0, vitest_1.it)('should invalidate handoff request with invalid task ID format', () => {
            const request = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                taskId: '', // Invalid empty string
                context: { data: 'test' }
            };
            const result = validationManager.validateHandoffRequest(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('taskId has invalid format');
        });
    });
    (0, vitest_1.describe)('validateModeTransition', () => {
        (0, vitest_1.it)('should validate mode transition request with valid modes', () => {
            const request = {
                fromMode: 'ask',
                toMode: 'code',
                reason: 'User requested code generation'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should invalidate mode transition request with missing fromMode', () => {
            const request = {
                toMode: 'code',
                reason: 'User requested code generation'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('fromMode is required');
        });
        (0, vitest_1.it)('should invalidate mode transition request with missing toMode', () => {
            const request = {
                fromMode: 'ask',
                reason: 'User requested code generation'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('toMode is required');
        });
        (0, vitest_1.it)('should invalidate mode transition request with invalid fromMode', () => {
            const request = {
                fromMode: 'invalid-mode',
                toMode: 'code',
                reason: 'User requested code generation'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('fromMode "invalid-mode" is not a valid mode');
        });
        (0, vitest_1.it)('should invalidate mode transition request with invalid toMode', () => {
            const request = {
                fromMode: 'ask',
                toMode: 'invalid-mode',
                reason: 'User requested code generation'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('toMode "invalid-mode" is not a valid mode');
        });
        (0, vitest_1.it)('should invalidate mode transition request with same fromMode and toMode', () => {
            const request = {
                fromMode: 'code',
                toMode: 'code',
                reason: 'User requested code mode again'
            };
            const result = validationManager.validateModeTransition(request);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('fromMode and toMode must be different');
        });
    });
    (0, vitest_1.describe)('validateCrossLanguageEvent', () => {
        (0, vitest_1.it)('should validate cross-language event with all required fields', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                timestamp: Date.now(),
                source: 'test-source',
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should invalidate cross-language event with missing id', () => {
            const event = {
                type: 'test.event',
                timestamp: Date.now(),
                source: 'test-source',
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('id is required');
        });
        (0, vitest_1.it)('should invalidate cross-language event with missing type', () => {
            const event = {
                id: 'event-1',
                timestamp: Date.now(),
                source: 'test-source',
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('type is required');
        });
        (0, vitest_1.it)('should invalidate cross-language event with missing timestamp', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                source: 'test-source',
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('timestamp is required');
        });
        (0, vitest_1.it)('should invalidate cross-language event with missing source', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                timestamp: Date.now(),
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('source is required');
        });
        (0, vitest_1.it)('should invalidate cross-language event with missing payload', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                timestamp: Date.now(),
                source: 'test-source'
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('payload is required');
        });
        (0, vitest_1.it)('should invalidate cross-language event with non-number timestamp', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                timestamp: 'invalid-timestamp',
                source: 'test-source',
                payload: JSON.stringify({ data: 'test' })
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('timestamp must be a number');
        });
        (0, vitest_1.it)('should invalidate cross-language event with non-string payload', () => {
            const event = {
                id: 'event-1',
                type: 'test.event',
                timestamp: Date.now(),
                source: 'test-source',
                payload: { data: 'test' }
            };
            const result = validationManager.validateCrossLanguageEvent(event);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('payload must be a string');
        });
    });
});
//# sourceMappingURL=validation-manager.test.js.map