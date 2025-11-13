/**
 * Flow Guards for LAPA v1.3 - Phase 22
 * 
 * Extends Resonance Core with YAML-defined guards for veto routing.
 * Inspired by CrewAI's event-driven Flows with routers and guards.
 * 
 * Features:
 * - YAML-defined guard conditions
 * - Conditional veto routing
 * - Thermal/performance guards
 * - Quality gates
 */

import { z } from 'zod';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { eventBus } from '../core/event-bus.ts';
import { ConsensusVotingSystem } from '../swarm/consensus.voting.ts';
import { rbacSystem } from '../security/rbac.ts';
import yaml from 'js-yaml';
import { validateFlowGuardsConfig, validateGuardContext, validateFlowGuard } from '../validation/index.ts';

// Flow guard condition types
export type GuardCondition = 
  | { type: 'system'; metric: 'temperature' | 'vram' | 'ram' | 'cpu'; operator: '>' | '<' | '>=' | '<='; value: number }
  | { type: 'task'; metric: 'confidence' | 'latency' | 'errorCount'; operator: '>' | '<' | '>=' | '<='; value: number }
  | { type: 'handoff'; metric: 'latency' | 'errorCount' | 'successRate'; operator: '>' | '<' | '>=' | '<='; value: number }
  | { type: 'custom'; expression: string };

// Flow guard action types
export type GuardAction = 
  | { type: 'route'; targetAgent: string }
  | { type: 'require-veto'; requiredAgents: string[] }
  | { type: 'throttle'; factor: number }
  | { type: 'fallback'; provider: 'ollama' | 'nim' | 'openrouter' }
  | { type: 'block'; reason: string }
  | { type: 'custom'; handler: string };

// Flow guard configuration
const FlowGuardSchema = z.object({
  name: z.string(),
  condition: z.union([
    z.string(), // Simple string condition (e.g., "system.temperature > 78")
    z.object({
      type: z.enum(['system', 'task', 'handoff', 'custom']),
      metric: z.string().optional(),
      operator: z.enum(['>', '<', '>=', '<=']).optional(),
      value: z.number().optional(),
      expression: z.string().optional(),
    }),
  ]),
  action: z.union([
    z.string(), // Simple action (e.g., "route-to-eco")
    z.object({
      type: z.enum(['route', 'require-veto', 'throttle', 'fallback', 'block', 'custom']),
      targetAgent: z.string().optional(),
      requiredAgents: z.array(z.string()).optional(),
      factor: z.number().optional(),
      provider: z.enum(['ollama', 'nim', 'openrouter']).optional(),
      reason: z.string().optional(),
      handler: z.string().optional(),
    }),
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  blocking: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

const FlowGuardsConfigSchema = z.object({
  version: z.string().optional(),
  guards: z.array(FlowGuardSchema),
  globalSettings: z.object({
    enableGuards: z.boolean().default(true),
    defaultPriority: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
});

export type FlowGuard = z.infer<typeof FlowGuardSchema>;
export type FlowGuardsConfig = z.infer<typeof FlowGuardsConfigSchema>;

// System metrics interface
export interface SystemMetrics {
  temperature?: number;
  vram?: number; // Percentage
  ram?: number; // Percentage
  cpu?: number; // Percentage
}

// Task metrics interface
export interface TaskMetrics {
  confidence?: number;
  latency?: number;
  errorCount?: number;
}

// Handoff metrics interface
export interface HandoffMetrics {
  latency?: number;
  errorCount?: number;
  successRate?: number;
}

// Guard evaluation context
export interface GuardContext {
  system?: SystemMetrics;
  task?: TaskMetrics;
  handoff?: HandoffMetrics;
  custom?: Record<string, any>;
}

/**
 * Flow Guards Manager
 * 
 * Manages YAML-defined flow guards for veto routing and conditional actions.
 */
export class FlowGuardsManager {
  private config: FlowGuardsConfig;
  private configPath: string;
  private consensusVoting: ConsensusVotingSystem;
  private guards: Map<string, FlowGuard> = new Map();

  constructor(configPath?: string) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    this.configPath = configPath || join(homeDir, '.lapa', 'flow-guards.yaml');
    this.config = {
      guards: [],
      globalSettings: {
        enableGuards: true,
        defaultPriority: 'medium',
      },
    };
    this.consensusVoting = new ConsensusVotingSystem();
  }

  /**
   * Initializes the flow guards manager and loads configuration
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      this.registerGuards();
    } catch (error) {
      console.error('[FlowGuardsManager] Failed to initialize:', error);
    }
  }

  /**
   * Loads configuration from YAML file
   */
  private async loadConfig(): Promise<void> {
    try {
      if (existsSync(this.configPath)) {
        const content = await readFile(this.configPath, 'utf-8');
        const parsed = this.parseYAML(content);
        
        // Validate the configuration
        // Temporarily disable validation due to import issues
        // const validationResult = validateFlowGuardsConfig(parsed);
        // if (!validationResult.isValid) {
        //   console.warn('[FlowGuardsManager] Configuration validation warnings:', validationResult.errors);
        //   // Still try to use the config but log warnings
        // }
        
        this.config = FlowGuardsConfigSchema.parse(parsed);
      } else {
        // Create default config with common guards
        this.config = this.createDefaultConfig();
        await this.saveConfig();
      }
    } catch (error) {
      console.error('[FlowGuardsManager] Failed to load config:', error);
      this.config = this.createDefaultConfig();
    }
  }

  /**
   * Creates default flow guards configuration
   */
  private createDefaultConfig(): FlowGuardsConfig {
    return {
      version: '1.0',
      guards: [
        {
          name: 'thermal-guard',
          condition: 'system.temperature > 78',
          action: { type: 'route', targetAgent: 'optimizer' },
          priority: 'high',
          blocking: false,
          enabled: true,
        },
        {
          name: 'vram-guard',
          condition: 'system.vram > 85',
          action: { type: 'fallback', provider: 'openrouter' },
          priority: 'high',
          blocking: false,
          enabled: true,
        },
        {
          name: 'quality-gate',
          condition: 'task.confidence < 0.8',
          action: { type: 'require-veto', requiredAgents: ['reviewer', 'tester'] },
          priority: 'critical',
          blocking: true,
          enabled: true,
        },
        {
          name: 'error-resilience',
          condition: 'handoff.errorCount > 3',
          action: { type: 'route', targetAgent: 'debugger' },
          priority: 'high',
          blocking: false,
          enabled: true,
        },
        {
          name: 'performance-optimization',
          condition: 'handoff.latency > 1000',
          action: { type: 'route', targetAgent: 'optimizer' },
          priority: 'medium',
          blocking: false,
          enabled: true,
        },
      ],
      globalSettings: {
        enableGuards: true,
        defaultPriority: 'medium',
      },
    };
  }

  /**
   * Saves configuration to YAML file
   */
  private async saveConfig(): Promise<void> {
    try {
      // Convert config to YAML format
      const yamlContent = yaml.dump(this.config, {
        indent: 2,
        noRefs: true,
        lineWidth: -1,
      });
      
      // Write to file
      await writeFile(this.configPath, yamlContent, 'utf-8');
    } catch (error) {
      console.error('[FlowGuardsManager] Failed to save config:', error);
      throw new Error(`Failed to save flow guards configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parses YAML/JSON content
   */
  private parseYAML(content: string): any {
    try {
      // Try parsing as JSON first
      return JSON.parse(content);
    } catch (jsonError) {
      try {
        // If JSON parsing fails, try YAML
        return yaml.load(content);
      } catch (yamlError) {
        console.error('[FlowGuardsManager] Failed to parse config as JSON or YAML:', jsonError, yamlError);
        throw new Error('Invalid configuration format. Expected valid JSON or YAML.');
      }
    }
  }

  /**
   * Registers all guards from configuration
   */
  private registerGuards(): void {
    this.guards.clear();
    for (const guard of this.config.guards) {
      if (guard.enabled) {
        this.guards.set(guard.name, guard);
      }
    }
  }

  /**
   * Evaluates a guard condition
   */
  private evaluateCondition(guard: FlowGuard, context: GuardContext): boolean {
    // Default to true if globalSettings is undefined or enableGuards is not set
    const guardsEnabled = this.config.globalSettings?.enableGuards ?? true;
    if (!guardsEnabled) {
      return false;
    }

    const condition = guard.condition;

    // Handle string conditions
    if (typeof condition === 'string') {
      return this.evaluateStringCondition(condition, context);
    }

    // Handle object conditions
    if (typeof condition === 'object') {
      return this.evaluateObjectCondition(condition, context);
    }

    return false;
  }

  /**
   * Evaluates a string condition (e.g., "system.temperature > 78")
   */
  private evaluateStringCondition(condition: string, context: GuardContext): boolean {
    try {
      // Parse simple conditions like "system.temperature > 78"
      const parts = condition.split(/\s+/);
      if (parts.length !== 3) {
        return false;
      }

      const [path, operator, valueStr] = parts;
      const value = parseFloat(valueStr);

      // Extract metric value from context
      let metricValue: number | undefined;
      if (path.startsWith('system.')) {
        const metric = path.split('.')[1];
        metricValue = context.system?.[metric as keyof SystemMetrics] as number | undefined;
      } else if (path.startsWith('task.')) {
        const metric = path.split('.')[1];
        metricValue = context.task?.[metric as keyof TaskMetrics] as number | undefined;
      } else if (path.startsWith('handoff.')) {
        const metric = path.split('.')[1];
        metricValue = context.handoff?.[metric as keyof HandoffMetrics] as number | undefined;
      }

      if (metricValue === undefined) {
        return false;
      }

      // Evaluate operator
      switch (operator) {
        case '>':
          return metricValue > value;
        case '<':
          return metricValue < value;
        case '>=':
          return metricValue >= value;
        case '<=':
          return metricValue <= value;
        default:
          return false;
      }
    } catch (error) {
      console.error('[FlowGuardsManager] Failed to evaluate string condition:', error);
      return false;
    }
  }

  /**
   * Evaluates an object condition
   */
  private evaluateObjectCondition(condition: any, context: GuardContext): boolean {
    // In production, implement full object condition evaluation
    return false;
  }

  /**
   * Executes a guard action
   */
  private async executeAction(guard: FlowGuard, context: GuardContext): Promise<{ success: boolean; result?: any }> {
    const action = guard.action;

    // Handle string actions (e.g., "route-to-eco")
    if (typeof action === 'string') {
      return this.executeStringAction(action, guard, context);
    }

    // Handle object actions
    if (typeof action === 'object') {
      return this.executeObjectAction(action, guard, context);
    }

    return { success: false };
  }

  /**
   * Executes a string action
   */
  private async executeStringAction(action: string, guard: FlowGuard, context: GuardContext): Promise<{ success: boolean; result?: any }> {
    // Handle common string actions
    if (action === 'route-to-eco' || action === 'route-to-optimizer') {
      return {
        success: true,
        result: { type: 'route', targetAgent: 'optimizer' },
      };
    }

    if (action === 'throttle-inference') {
      return {
        success: true,
        result: { type: 'throttle', factor: 0.5 },
      };
    }

    if (action === 'require-veto') {
      return {
        success: true,
        result: { type: 'require-veto', requiredAgents: ['reviewer', 'tester'] },
      };
    }

    return { success: false };
  }

  /**
   * Executes an object action
   */
  private async executeObjectAction(action: any, guard: FlowGuard, context: GuardContext): Promise<{ success: boolean; result?: any }> {
    switch (action.type) {
      case 'route':
        if (action.targetAgent) {
          await eventBus.publish({
            id: `flow-guard-route-${Date.now()}`,
            type: 'flow-guard.route',
            timestamp: Date.now(),
            source: 'flow-guards',
            payload: {
              guard: guard.name,
              targetAgent: action.targetAgent,
              context,
            },
          } as any);
          return { success: true, result: { type: 'route', targetAgent: action.targetAgent } };
        }
        break;

      case 'require-veto':
        if (action.requiredAgents && action.requiredAgents.length > 0) {
          // Create voting session for veto
          const voteOptions = [
            { id: 'accept', label: 'Accept', value: true },
            { id: 'reject', label: 'Reject', value: false },
          ];

          const sessionId = this.consensusVoting.createVotingSession(
            `Flow guard veto: ${guard.name}`,
            voteOptions,
            action.requiredAgents.length
          );

          await eventBus.publish({
            id: `flow-guard-veto-${Date.now()}`,
            type: 'flow-guard.veto',
            timestamp: Date.now(),
            source: 'flow-guards',
            payload: {
              guard: guard.name,
              sessionId,
              requiredAgents: action.requiredAgents,
              context,
            },
          } as any);

          return { success: true, result: { type: 'require-veto', sessionId } };
        }
        break;

      case 'fallback':
        if (action.provider) {
          await eventBus.publish({
            id: `flow-guard-fallback-${Date.now()}`,
            type: 'flow-guard.fallback',
            timestamp: Date.now(),
            source: 'flow-guards',
            payload: {
              guard: guard.name,
              provider: action.provider,
              context,
            },
          } as any);
          return { success: true, result: { type: 'fallback', provider: action.provider } };
        }
        break;

      case 'block':
        await eventBus.publish({
          id: `flow-guard-block-${Date.now()}`,
          type: 'flow-guard.block',
          timestamp: Date.now(),
          source: 'flow-guards',
          payload: {
            guard: guard.name,
            reason: action.reason || 'Flow guard blocked',
            context,
          },
        } as any);
        return { success: true, result: { type: 'block', reason: action.reason } };

      default:
        return { success: false };
    }

    return { success: false };
  }

  /**
   * Evaluates all guards for a given context
   */
  async evaluateGuards(context: GuardContext): Promise<Array<{ guard: FlowGuard; action: any }>> {
    // Validate the context
    // Temporarily disable validation due to import issues
    // const contextValidation = validateGuardContext(context);
    // if (!contextValidation.isValid) {
    //   console.warn('[FlowGuardsManager] Context validation errors:', contextValidation.errors);
    // }
    
    const triggeredGuards: Array<{ guard: FlowGuard; action: any }> = [];

    // Sort guards by priority
    const sortedGuards = Array.from(this.guards.values()).sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const guard of sortedGuards) {
      if (this.evaluateCondition(guard, context)) {
        const actionResult = await this.executeAction(guard, context);
        if (actionResult.success) {
          triggeredGuards.push({ guard, action: actionResult.result });

          // If blocking, stop evaluation
          if (guard.blocking) {
            break;
          }
        }
      }
    }

    return triggeredGuards;
  }

  /**
   * Gets all registered guards
   */
  getGuards(): FlowGuard[] {
    return Array.from(this.guards.values());
  }

  /**
   * Adds a new guard
   */
  async addGuard(guard: FlowGuard): Promise<void> {
    // Validate the guard before adding
    // Temporarily disable validation due to import issues
    // const validationResult = validateFlowGuard(guard);
    // if (!validationResult.isValid) {
    //   throw new Error(`Invalid flow guard: ${validationResult.errors.map(e => `${e.path}: ${e.message}`).join('; ')}`);
    // }
    
    const validated = FlowGuardSchema.parse(guard);
    this.guards.set(validated.name, validated);
    this.config.guards.push(validated);
    await this.saveConfig();
  }

  /**
   * Removes a guard
   */
  async removeGuard(guardName: string): Promise<void> {
    this.guards.delete(guardName);
    this.config.guards = this.config.guards.filter(g => g.name !== guardName);
    await this.saveConfig();
  }
}

// Export singleton instance
export const flowGuardsManager = new FlowGuardsManager();

