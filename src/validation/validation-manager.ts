import { LAPAEventBus } from '../core/event-bus.ts';
import { AgentTool } from '../core/types/agent-types.ts';
import { HandoffRequest, HandoffResponse } from '../orchestrator/handoffs.ts';
import { ModeTransitionRequest, RooMode } from '../modes/types/mode-types.ts';

/**
 * Validation Manager for LAPA v1.2 Phase 10
 * Implements comprehensive validation checks for all critical operations
 */
export class ValidationManager {
  private eventBus: LAPAEventBus;

  constructor(eventBus: LAPAEventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Validate agent tool execution parameters
   * @param tool Agent tool to validate
   * @param parameters Parameters to validate
   * @returns Validation result with any errors
   */
  validateToolExecution(tool: AgentTool, parameters: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    // Check if tool has validation method
    if (tool.validateParameters) {
      try {
        const isValid = tool.validateParameters(parameters);
        if (!isValid) {
          errors.push(`Tool ${tool.name} reported invalid parameters`);
        }
      } catch (error) {
        errors.push(`Tool ${tool.name} validation threw error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Check for required parameters
    if (!parameters) {
      errors.push('Parameters object is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate handoff request
   * @param request Handoff request to validate
   * @returns Validation result with any errors
   */
  validateHandoffRequest(request: HandoffRequest): ValidationResult {
    const errors: string[] = [];

    // Validate required fields (check for undefined/null, but empty strings are handled by format validation)
    if (request.sourceAgentId === undefined || request.sourceAgentId === null) {
      errors.push('sourceAgentId is required');
    }

    if (request.targetAgentId === undefined || request.targetAgentId === null) {
      errors.push('targetAgentId is required');
    }

    if (request.taskId === undefined || request.taskId === null) {
      errors.push('taskId is required');
    }

    if (!request.context) {
      errors.push('context is required');
    }

    // Validate agent IDs format (including empty strings)
    if (request.sourceAgentId !== undefined && request.sourceAgentId !== null && !this.isValidAgentId(request.sourceAgentId)) {
      errors.push('sourceAgentId has invalid format');
    }

    if (request.targetAgentId !== undefined && request.targetAgentId !== null && !this.isValidAgentId(request.targetAgentId)) {
      errors.push('targetAgentId has invalid format');
    }

    // Validate task ID format (including empty strings)
    if (request.taskId !== undefined && request.taskId !== null && !this.isValidTaskId(request.taskId)) {
      errors.push('taskId has invalid format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate mode transition request
   * @param request Mode transition request to validate
   * @returns Validation result with any errors
   */
  validateModeTransition(request: ModeTransitionRequest): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!request.fromMode) {
      errors.push('fromMode is required');
    }

    if (!request.toMode) {
      errors.push('toMode is required');
    }

    // Validate mode types
    if (request.fromMode && !this.isValidMode(request.fromMode)) {
      errors.push(`fromMode "${request.fromMode}" is not a valid mode`);
    }

    if (request.toMode && !this.isValidMode(request.toMode)) {
      errors.push(`toMode "${request.toMode}" is not a valid mode`);
    }

    // Validate that fromMode and toMode are different
    if (request.fromMode && request.toMode && request.fromMode === request.toMode) {
      errors.push('fromMode and toMode must be different');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate cross-language event
   * @param event Cross-language event to validate
   * @returns Validation result with any errors
   */
  validateCrossLanguageEvent(event: any): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!event.id) {
      errors.push('id is required');
    }

    if (!event.type) {
      errors.push('type is required');
    }

    if (!event.timestamp) {
      errors.push('timestamp is required');
    }

    if (!event.source) {
      errors.push('source is required');
    }

    if (!event.payload) {
      errors.push('payload is required');
    }

    // Validate timestamp is a number
    if (event.timestamp && typeof event.timestamp !== 'number') {
      errors.push('timestamp must be a number');
    }

    // Validate payload is a string
    if (event.payload && typeof event.payload !== 'string') {
      errors.push('payload must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper method to validate agent ID format
   * @param agentId Agent ID to validate
   * @returns Boolean indicating if agent ID is valid
   */
  private isValidAgentId(agentId: string): boolean {
    // Agent IDs should be non-empty strings with reasonable length
    return typeof agentId === 'string' && agentId.length > 0 && agentId.length <= 100;
  }

  /**
   * Helper method to validate task ID format
   * @param taskId Task ID to validate
   * @returns Boolean indicating if task ID is valid
   */
  private isValidTaskId(taskId: string): boolean {
    // Task IDs should be non-empty strings with reasonable length
    return typeof taskId === 'string' && taskId.length > 0 && taskId.length <= 100;
  }

  /**
   * Helper method to validate mode
   * @param mode Mode to validate
   * @returns Boolean indicating if mode is valid
   */
  private isValidMode(mode: RooMode): boolean {
    // Define valid modes
    const validModes: RooMode[] = [
      'ask', 'code', 'architect', 'debug', 'test-engineer', 
      'docs-specialist', 'code-reviewer', 'orchestrator'
    ];
    
    return validModes.includes(mode);
  }
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}