/**
 * Flow Guard Validation Utilities
 * 
 * Provides validation harness for flow guard configurations.
 */

import { z } from 'zod';
import { FlowGuard, FlowGuardsConfig, FlowGuardSchema, FlowGuardsConfigSchema } from '../orchestrator/flow-guards.ts';

// Validation error types
export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a single flow guard configuration
 * @param guard The flow guard to validate
 * @returns Validation result with errors and warnings
 */
export function validateFlowGuard(guard: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Validate against schema
    const parsed = FlowGuardSchema.safeParse(guard);
    if (!parsed.success) {
      result.isValid = false;
      result.errors = parsed.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.received
      }));
      return result;
    }
    
    // Additional custom validations
    if (typeof guard.condition === 'string') {
      const conditionErrors = validateStringCondition(guard.condition);
      if (conditionErrors.length > 0) {
        result.errors.push(...conditionErrors.map(err => ({
          path: 'condition',
          message: err,
          value: guard.condition
        })));
      }
    }
    
    if (typeof guard.action === 'string') {
      const actionErrors = validateStringAction(guard.action);
      if (actionErrors.length > 0) {
        result.errors.push(...actionErrors.map(err => ({
          path: 'action',
          message: err,
          value: guard.action
        })));
      }
    }
    
    // Check for potential conflicts
    if (guard.blocking && guard.priority === 'low') {
      result.warnings.push({
        path: 'priority',
        message: 'Blocking guard with low priority may not behave as expected',
        value: guard.priority
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.isValid = false;
      result.errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.received
      }));
    } else {
      result.isValid = false;
      result.errors.push({
        path: '',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        value: guard
      });
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Validates a complete flow guards configuration
 * @param config The flow guards configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateFlowGuardsConfig(config: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Validate against schema
    const parsed = FlowGuardsConfigSchema.safeParse(config);
    if (!parsed.success) {
      result.isValid = false;
      result.errors = parsed.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.received
      }));
      return result;
    }
    
    // Validate each guard
    if (Array.isArray(config.guards)) {
      const guardNames = new Set<string>();
      
      for (let i = 0; i < config.guards.length; i++) {
        const guard = config.guards[i];
        const guardResult = validateFlowGuard(guard);
        
        if (!guardResult.isValid) {
          result.isValid = false;
          guardResult.errors.forEach(err => {
            result.errors.push({
              path: `guards[${i}].${err.path}`,
              message: err.message,
              value: err.value
            });
          });
        }
        
        guardResult.warnings.forEach(warn => {
          result.warnings.push({
            path: `guards[${i}].${warn.path}`,
            message: warn.message,
            value: warn.value
          });
        });
        
        // Check for duplicate names
        if (guard.name && guardNames.has(guard.name)) {
          result.errors.push({
            path: `guards[${i}].name`,
            message: `Duplicate guard name: ${guard.name}`,
            value: guard.name
          });
          result.isValid = false;
        } else if (guard.name) {
          guardNames.add(guard.name);
        }
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.isValid = false;
      result.errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        value: err.received
      }));
    } else {
      result.isValid = false;
      result.errors.push({
        path: '',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        value: config
      });
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Validates string condition format
 * @param condition The condition string to validate
 * @returns Array of error messages
 */
function validateStringCondition(condition: string): string[] {
  const errors: string[] = [];
  
  if (!condition || typeof condition !== 'string') {
    errors.push('Condition must be a non-empty string');
    return errors;
  }
  
  // Basic format: "path.operator value"
  const parts = condition.trim().split(/\s+/);
  if (parts.length !== 3) {
    errors.push('Condition must follow format: "path operator value" (e.g., "system.temperature > 78")');
    return errors;
  }
  
  const [path, operator, valueStr] = parts;
  
  // Validate path format
  if (!/^([a-zA-Z]+)\.([a-zA-Z]+)$/.test(path)) {
    errors.push('Path must follow format: "category.metric" (e.g., "system.temperature")');
  }
  
  // Validate operator
  const validOperators = ['>', '<', '>=', '<=', '==', '!='];
  if (!validOperators.includes(operator)) {
    errors.push(`Operator must be one of: ${validOperators.join(', ')}`);
  }
  
  // Validate value is a number
  const value = parseFloat(valueStr);
  if (isNaN(value)) {
    errors.push('Value must be a valid number');
  }
  
  return errors;
}

/**
 * Validates string action format
 * @param action The action string to validate
 * @returns Array of error messages
 */
function validateStringAction(action: string): string[] {
  const errors: string[] = [];
  
  if (!action || typeof action !== 'string') {
    errors.push('Action must be a non-empty string');
    return errors;
  }
  
  // List of known valid string actions
  const validActions = [
    'route-to-eco',
    'route-to-optimizer',
    'throttle-inference',
    'require-veto'
  ];
  
  if (!validActions.includes(action)) {
    errors.push(`Unknown action: ${action}. Valid actions: ${validActions.join(', ')}`);
  }
  
  return errors;
}

/**
 * Validates guard context values
 * @param context The context to validate
 * @returns Validation result
 */
export function validateGuardContext(context: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate system metrics if present
  if (context.system) {
    const system = context.system;
    if (system.temperature !== undefined && (typeof system.temperature !== 'number' || system.temperature < 0)) {
      result.errors.push({
        path: 'system.temperature',
        message: 'Temperature must be a non-negative number',
        value: system.temperature
      });
    }
    
    if (system.vram !== undefined && (typeof system.vram !== 'number' || system.vram < 0 || system.vram > 100)) {
      result.errors.push({
        path: 'system.vram',
        message: 'VRAM must be a percentage between 0 and 100',
        value: system.vram
      });
    }
    
    if (system.ram !== undefined && (typeof system.ram !== 'number' || system.ram < 0 || system.ram > 100)) {
      result.errors.push({
        path: 'system.ram',
        message: 'RAM must be a percentage between 0 and 100',
        value: system.ram
      });
    }
    
    if (system.cpu !== undefined && (typeof system.cpu !== 'number' || system.cpu < 0 || system.cpu > 100)) {
      result.errors.push({
        path: 'system.cpu',
        message: 'CPU must be a percentage between 0 and 100',
        value: system.cpu
      });
    }
  }
  
  // Validate task metrics if present
  if (context.task) {
    const task = context.task;
    if (task.confidence !== undefined && (typeof task.confidence !== 'number' || task.confidence < 0 || task.confidence > 1)) {
      result.errors.push({
        path: 'task.confidence',
        message: 'Confidence must be a value between 0 and 1',
        value: task.confidence
      });
    }
    
    if (task.latency !== undefined && (typeof task.latency !== 'number' || task.latency < 0)) {
      result.errors.push({
        path: 'task.latency',
        message: 'Latency must be a non-negative number',
        value: task.latency
      });
    }
    
    if (task.errorCount !== undefined && (typeof task.errorCount !== 'number' || task.errorCount < 0)) {
      result.errors.push({
        path: 'task.errorCount',
        message: 'Error count must be a non-negative number',
        value: task.errorCount
      });
    }
  }
  
  // Validate handoff metrics if present
  if (context.handoff) {
    const handoff = context.handoff;
    if (handoff.latency !== undefined && (typeof handoff.latency !== 'number' || handoff.latency < 0)) {
      result.errors.push({
        path: 'handoff.latency',
        message: 'Latency must be a non-negative number',
        value: handoff.latency
      });
    }
    
    if (handoff.errorCount !== undefined && (typeof handoff.errorCount !== 'number' || handoff.errorCount < 0)) {
      result.errors.push({
        path: 'handoff.errorCount',
        message: 'Error count must be a non-negative number',
        value: handoff.errorCount
      });
    }
    
    if (handoff.successRate !== undefined && (typeof handoff.successRate !== 'number' || handoff.successRate < 0 || handoff.successRate > 1)) {
      result.errors.push({
        path: 'handoff.successRate',
        message: 'Success rate must be a value between 0 and 1',
        value: handoff.successRate
      });
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}

// Export validation schemas for reuse
export { FlowGuardSchema, FlowGuardsConfigSchema };