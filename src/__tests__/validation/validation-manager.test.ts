import { ValidationManager } from '../../validation/validation-manager.ts';
import { LAPAEventBus } from '../../core/event-bus.ts';
import { AgentTool } from '../../core/types/agent-types.ts';
import { HandoffRequest } from '../../orchestrator/handoffs.js';
import { ModeTransitionRequest } from '../../modes/types/mode-types.ts';

describe('ValidationManager', () => {
  let validationManager: ValidationManager;
  let eventBus: LAPAEventBus;

  beforeEach(() => {
    eventBus = new LAPAEventBus();
    validationManager = new ValidationManager(eventBus);
  });

  describe('validateToolExecution', () => {
    it('should validate tool with valid parameters', () => {
      const mockTool: AgentTool = {
        name: 'test-tool',
        type: 'testing',
        description: 'Test tool',
        version: '1.0.0',
        execute: jest.fn(),
        validateParameters: (params: Record<string, any>) => {
          return !!params && typeof params === 'object' && params.testParam;
        }
      };

      const result = validationManager.validateToolExecution(mockTool, { testParam: 'value' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate tool with invalid parameters', () => {
      const mockTool: AgentTool = {
        name: 'test-tool',
        type: 'testing',
        description: 'Test tool',
        version: '1.0.0',
        execute: jest.fn(),
        validateParameters: (params: Record<string, any>) => {
          return !!params && typeof params === 'object' && params.testParam;
        }
      };

      const result = validationManager.validateToolExecution(mockTool, { invalidParam: 'value' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tool test-tool reported invalid parameters');
    });

    it('should handle tool validation that throws an error', () => {
      const mockTool: AgentTool = {
        name: 'test-tool',
        type: 'testing',
        description: 'Test tool',
        version: '1.0.0',
        execute: jest.fn(),
        validateParameters: (params: Record<string, any>) => {
          throw new Error('Validation failed');
        }
      };

      const result = validationManager.validateToolExecution(mockTool, { testParam: 'value' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tool test-tool validation threw error: Validation failed');
    });

    it('should invalidate when parameters object is missing', () => {
      const mockTool: AgentTool = {
        name: 'test-tool',
        type: 'testing',
        description: 'Test tool',
        version: '1.0.0',
        execute: jest.fn(),
        validateParameters: jest.fn()
      };

      const result = validationManager.validateToolExecution(mockTool, null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameters object is required');
    });
  });

  describe('validateHandoffRequest', () => {
    it('should validate handoff request with all required fields', () => {
      const request: HandoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-123',
        context: { data: 'test' }
      };

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate handoff request with missing sourceAgentId', () => {
      const request: HandoffRequest = {
        targetAgentId: 'agent-2',
        taskId: 'task-123',
        context: { data: 'test' }
      } as any;

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('sourceAgentId is required');
    });

    it('should invalidate handoff request with missing targetAgentId', () => {
      const request: HandoffRequest = {
        sourceAgentId: 'agent-1',
        taskId: 'task-123',
        context: { data: 'test' }
      } as any;

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('targetAgentId is required');
    });

    it('should invalidate handoff request with missing taskId', () => {
      const request: HandoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        context: { data: 'test' }
      } as any;

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('taskId is required');
    });

    it('should invalidate handoff request with missing context', () => {
      const request: HandoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: 'task-123'
      } as any;

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('context is required');
    });

    it('should invalidate handoff request with invalid agent ID format', () => {
      const request: HandoffRequest = {
        sourceAgentId: '', // Invalid empty string
        targetAgentId: 'agent-2',
        taskId: 'task-123',
        context: { data: 'test' }
      };

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('sourceAgentId has invalid format');
    });

    it('should invalidate handoff request with invalid task ID format', () => {
      const request: HandoffRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        taskId: '', // Invalid empty string
        context: { data: 'test' }
      };

      const result = validationManager.validateHandoffRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('taskId has invalid format');
    });
  });

  describe('validateModeTransition', () => {
    it('should validate mode transition request with valid modes', () => {
      const request: ModeTransitionRequest = {
        fromMode: 'ask',
        toMode: 'code',
        reason: 'User requested code generation'
      };

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate mode transition request with missing fromMode', () => {
      const request: ModeTransitionRequest = {
        toMode: 'code',
        reason: 'User requested code generation'
      } as any;

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('fromMode is required');
    });

    it('should invalidate mode transition request with missing toMode', () => {
      const request: ModeTransitionRequest = {
        fromMode: 'ask',
        reason: 'User requested code generation'
      } as any;

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('toMode is required');
    });

    it('should invalidate mode transition request with invalid fromMode', () => {
      const request: ModeTransitionRequest = {
        fromMode: 'invalid-mode' as any,
        toMode: 'code',
        reason: 'User requested code generation'
      };

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('fromMode "invalid-mode" is not a valid mode');
    });

    it('should invalidate mode transition request with invalid toMode', () => {
      const request: ModeTransitionRequest = {
        fromMode: 'ask',
        toMode: 'invalid-mode' as any,
        reason: 'User requested code generation'
      };

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('toMode "invalid-mode" is not a valid mode');
    });

    it('should invalidate mode transition request with same fromMode and toMode', () => {
      const request: ModeTransitionRequest = {
        fromMode: 'code',
        toMode: 'code',
        reason: 'User requested code mode again'
      };

      const result = validationManager.validateModeTransition(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('fromMode and toMode must be different');
    });
  });

  describe('validateCrossLanguageEvent', () => {
    it('should validate cross-language event with all required fields', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test-source',
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate cross-language event with missing id', () => {
      const event = {
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test-source',
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('id is required');
    });

    it('should invalidate cross-language event with missing type', () => {
      const event = {
        id: 'event-1',
        timestamp: Date.now(),
        source: 'test-source',
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('type is required');
    });

    it('should invalidate cross-language event with missing timestamp', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        source: 'test-source',
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timestamp is required');
    });

    it('should invalidate cross-language event with missing source', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: Date.now(),
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('source is required');
    });

    it('should invalidate cross-language event with missing payload', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test-source'
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('payload is required');
    });

    it('should invalidate cross-language event with non-number timestamp', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: 'invalid-timestamp',
        source: 'test-source',
        payload: JSON.stringify({ data: 'test' })
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timestamp must be a number');
    });

    it('should invalidate cross-language event with non-string payload', () => {
      const event = {
        id: 'event-1',
        type: 'test.event',
        timestamp: Date.now(),
        source: 'test-source',
        payload: { data: 'test' }
      };

      const result = validationManager.validateCrossLanguageEvent(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('payload must be a string');
    });
  });
});