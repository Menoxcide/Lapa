/**
 * Flow Guard Authoring Utilities
 * 
 * Provides utilities to simplify the creation and management of flow guards.
 */

import { FlowGuard, FlowGuardsConfig } from './flow-guards.ts';
// Import validation functions dynamically to avoid circular dependencies

// Types for authoring utilities
export type MetricCategory = 'system' | 'task' | 'handoff';
export type SystemMetric = 'temperature' | 'vram' | 'ram' | 'cpu';
export type TaskMetric = 'confidence' | 'latency' | 'errorCount';
export type HandoffMetric = 'latency' | 'errorCount' | 'successRate';
export type Operator = '>' | '<' | '>=' | '<=' | '==' | '!=';

export type ActionType = 
  | 'route' 
  | 'require-veto' 
  | 'throttle' 
  | 'fallback' 
  | 'block' 
  | 'custom';

// Builder pattern for creating flow guards
export class FlowGuardBuilder {
  private guard: Partial<FlowGuard> = {};

  constructor(name: string) {
    this.guard.name = name;
    this.guard.enabled = true;
    this.guard.blocking = false;
    this.guard.priority = 'medium';
  }

  /**
   * Sets the condition for the guard using a simple string format
   * @param category Metric category (system, task, handoff)
   * @param metric Specific metric name
   * @param operator Comparison operator
   * @param value Threshold value
   */
  condition(category: MetricCategory, metric: string, operator: Operator, value: number): FlowGuardBuilder {
    this.guard.condition = `${category}.${metric} ${operator} ${value}`;
    return this;
  }

  /**
   * Sets a custom condition expression
   * @param expression Custom condition expression
   */
  customCondition(expression: string): FlowGuardBuilder {
    this.guard.condition = { type: 'custom', expression };
    return this;
  }

  /**
   * Sets a simple string action
   * @param action Predefined action string
   */
  actionString(action: string): FlowGuardBuilder {
    this.guard.action = action;
    return this;
  }

  /**
   * Sets a route action
   * @param targetAgent Agent to route to
   */
  routeTo(targetAgent: string): FlowGuardBuilder {
    this.guard.action = { type: 'route', targetAgent };
    return this;
  }

  /**
   * Sets a require-veto action
   * @param requiredAgents Agents required to vote
   */
  requireVeto(requiredAgents: string[]): FlowGuardBuilder {
    this.guard.action = { type: 'require-veto', requiredAgents };
    return this;
  }

  /**
   * Sets a throttle action
   * @param factor Throttling factor (0.0-1.0)
   */
  throttle(factor: number): FlowGuardBuilder {
    this.guard.action = { type: 'throttle', factor };
    return this;
  }

  /**
   * Sets a fallback action
   * @param provider Provider to fallback to
   */
  fallbackTo(provider: 'ollama' | 'nim' | 'openrouter'): FlowGuardBuilder {
    this.guard.action = { type: 'fallback', provider };
    return this;
  }

  /**
   * Sets a block action
   * @param reason Reason for blocking
   */
  block(reason: string): FlowGuardBuilder {
    this.guard.action = { type: 'block', reason };
    return this;
  }

  /**
   * Sets a custom action
   * @param handler Custom handler function name
   */
  customAction(handler: string): FlowGuardBuilder {
    this.guard.action = { type: 'custom', handler };
    return this;
  }

  /**
   * Sets the guard priority
   * @param priority Priority level
   */
  priority(priority: 'low' | 'medium' | 'high' | 'critical'): FlowGuardBuilder {
    this.guard.priority = priority;
    return this;
  }

  /**
   * Sets whether the guard is blocking
   * @param blocking Whether the guard blocks execution
   */
  blocking(blocking: boolean): FlowGuardBuilder {
    this.guard.blocking = blocking;
    return this;
  }

  /**
   * Sets whether the guard is enabled
   * @param enabled Whether the guard is enabled
   */
  enabled(enabled: boolean): FlowGuardBuilder {
    this.guard.enabled = enabled;
    return this;
  }

  /**
   * Builds the flow guard
   * @returns The constructed flow guard
   */
  build(): FlowGuard {
    // Return the guard without validation to avoid circular dependencies
    // Validation will happen when the guard is added to the manager
    return this.guard as FlowGuard;
  }
}

// Utility class for managing flow guard configurations
export class FlowGuardAuthoring {
  /**
   * Creates a new flow guard using the builder pattern
   * @param name Name of the guard
   * @returns FlowGuardBuilder instance
   */
  static createGuard(name: string): FlowGuardBuilder {
    return new FlowGuardBuilder(name);
  }

  /**
   * Creates a thermal guard for system temperature monitoring
   * @param threshold Temperature threshold in Celsius
   * @param targetAgent Agent to route to when threshold exceeded
   * @returns FlowGuard for thermal protection
   */
  static createThermalGuard(threshold: number, targetAgent: string = 'optimizer'): FlowGuard {
    return new FlowGuardBuilder('thermal-guard')
      .condition('system', 'temperature', '>', threshold)
      .routeTo(targetAgent)
      .priority('high')
      .build();
  }

  /**
   * Creates a VRAM guard for memory usage monitoring
   * @param threshold VRAM usage threshold percentage
   * @param fallbackProvider Provider to fallback to
   * @returns FlowGuard for VRAM protection
   */
  static createVramGuard(threshold: number, fallbackProvider: 'ollama' | 'nim' | 'openrouter' = 'openrouter'): FlowGuard {
    return new FlowGuardBuilder('vram-guard')
      .condition('system', 'vram', '>', threshold)
      .fallbackTo(fallbackProvider)
      .priority('high')
      .build();
  }

  /**
   * Creates a quality gate for confidence checking
   * @param threshold Confidence threshold (0.0-1.0)
   * @param requiredAgents Agents required for veto
   * @returns FlowGuard for quality assurance
   */
  static createQualityGate(threshold: number, requiredAgents: string[] = ['reviewer', 'tester']): FlowGuard {
    return new FlowGuardBuilder('quality-gate')
      .condition('task', 'confidence', '<', threshold)
      .requireVeto(requiredAgents)
      .priority('critical')
      .blocking(true)
      .build();
  }

  /**
   * Creates an error resilience guard
   * @param threshold Error count threshold
   * @param targetAgent Agent to route to for debugging
   * @returns FlowGuard for error resilience
   */
  static createErrorResilienceGuard(threshold: number, targetAgent: string = 'debugger'): FlowGuard {
    return new FlowGuardBuilder('error-resilience')
      .condition('handoff', 'errorCount', '>', threshold)
      .routeTo(targetAgent)
      .priority('high')
      .build();
  }

  /**
   * Creates a performance optimization guard
   * @param threshold Latency threshold in milliseconds
   * @param targetAgent Agent to route to for optimization
   * @returns FlowGuard for performance optimization
   */
  static createPerformanceGuard(threshold: number, targetAgent: string = 'optimizer'): FlowGuard {
    return new FlowGuardBuilder('performance-optimization')
      .condition('handoff', 'latency', '>', threshold)
      .routeTo(targetAgent)
      .priority('medium')
      .build();
  }

  /**
   * Validates a flow guard configuration
   * @param config Flow guards configuration to validate
   * @returns Validation result
   */
  static validateConfig(config: any): ReturnType<typeof validateFlowGuardsConfig> {
    return validateFlowGuardsConfig(config);
  }

  /**
   * Validates a single flow guard
   * @param guard Flow guard to validate
   * @returns Validation result
   */
  static validateGuard(guard: any): ReturnType<typeof validateFlowGuard> {
    return validateFlowGuard(guard);
  }

  /**
   * Creates a sample configuration with common guards
   * @returns Sample flow guards configuration
   */
  static createSampleConfig(): FlowGuardsConfig {
    return {
      version: '1.0',
      guards: [
        FlowGuardAuthoring.createThermalGuard(78),
        FlowGuardAuthoring.createVramGuard(85),
        FlowGuardAuthoring.createQualityGate(0.8),
        FlowGuardAuthoring.createErrorResilienceGuard(3),
        FlowGuardAuthoring.createPerformanceGuard(1000)
      ],
      globalSettings: {
        enableGuards: true,
        defaultPriority: 'medium'
      }
    };
  }

  /**
   * Converts a flow guard to a YAML string representation
   * @param guard Flow guard to convert
   * @returns YAML string representation
   */
  static guardToYaml(guard: FlowGuard): string {
    // Import yaml here to avoid issues with circular dependencies
    const yaml = require('js-yaml');
    return yaml.dump(guard, { indent: 2, noRefs: true });
  }

  /**
   * Converts a flow guards configuration to a YAML string representation
   * @param config Flow guards configuration to convert
   * @returns YAML string representation
   */
  static configToYaml(config: FlowGuardsConfig): string {
    // Import yaml here to avoid issues with circular dependencies
    const yaml = require('js-yaml');
    return yaml.dump(config, { indent: 2, noRefs: true });
  }
}