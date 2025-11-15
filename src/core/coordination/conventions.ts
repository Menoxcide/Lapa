/**
 * Convention System for Multi-Agent Cooperation
 * 
 * Implements convention-based coordination for improved agent cooperation
 * Based on: "Augmenting the action space with conventions to improve multi-agent cooperation in Hanabi"
 * 
 * Features:
 * - Convention-based coordination
 * - Action space augmentation
 * - Partial observability handling
 * - Limited communication optimization
 */

import { Agent } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Convention for agent coordination
 */
export interface Convention {
  id: string;
  name: string;
  type: 'signaling' | 'coordination' | 'task' | 'handoff';
  description: string;
  actionSpace: ConventionAction[];
  conditions: ConventionCondition[];
  effects: ConventionEffect[];
  priority: number;
}

/**
 * Convention action
 */
export interface ConventionAction {
  id: string;
  name: string;
  conventionId: string;
  parameters: Record<string, unknown>;
  execution: (context: ConventionContext) => Promise<ConventionResult>;
}

/**
 * Convention condition
 */
export interface ConventionCondition {
  type: 'state' | 'task' | 'agent' | 'resource' | 'custom';
  evaluator: (context: ConventionContext) => Promise<boolean>;
}

/**
 * Convention effect
 */
export interface ConventionEffect {
  type: 'signal' | 'coordinate' | 'assign' | 'resolve';
  target: string;
  parameters: Record<string, unknown>;
}

/**
 * Convention context
 */
export interface ConventionContext {
  agentId: string;
  taskId?: string;
  systemState: Partial<SystemState>;
  otherAgents: AgentInfo[];
  communicationConstraints: CommunicationConstraints;
  partialObservability: PartialObservability;
}

/**
 * Convention result
 */
export interface ConventionResult {
  success: boolean;
  action: string;
  coordination: CoordinationSignal;
  communicationReduction: number; // 0-1
  cooperationImprovement: number; // 0-1
  error?: string;
}

/**
 * System state
 */
export interface SystemState {
  agents: Map<string, AgentState>;
  tasks: Map<string, TaskState>;
  resources: ResourceState;
  timestamp: number;
}

/**
 * Agent state
 */
export interface AgentState {
  agentId: string;
  status: 'idle' | 'working' | 'coordinating';
  currentTask?: string;
  capabilities: string[];
  workload: number;
}

/**
 * Task state
 */
export interface TaskState {
  taskId: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedAgent?: string;
  requirements: string[];
}

/**
 * Resource state
 */
export interface ResourceState {
  available: number;
  allocated: number;
  total: number;
}

/**
 * Agent info
 */
export interface AgentInfo {
  agentId: string;
  type: string;
  capabilities: string[];
  status: string;
}

/**
 * Communication constraints
 */
export interface CommunicationConstraints {
  bandwidth: number;
  latency: number;
  frequency: number;
}

/**
 * Partial observability
 */
export interface PartialObservability {
  visibleAgents: string[];
  visibleTasks: string[];
  informationQuality: number; // 0-1
}

/**
 * Coordination signal
 */
export interface CoordinationSignal {
  type: 'task_available' | 'capability_announce' | 'status_update' | 'coordination_request';
  sender: string;
  receivers: string[];
  content: Record<string, unknown>;
}

/**
 * Convention experience for learning
 */
export interface ConventionExperience {
  conventionId: string;
  context: ConventionContext;
  result: ConventionResult;
  reward: number;
  timestamp: number;
}

/**
 * Augmented action space
 */
export interface AugmentedActionSpace {
  baseActions: AgentAction[];
  conventionActions: ConventionAction[];
  totalActions: AgentAction[];
}

/**
 * Agent action
 */
export interface AgentAction {
  id: string;
  name: string;
  type: 'base' | 'convention';
  parameters: Record<string, unknown>;
}

/**
 * Convention System
 */
export class ConventionSystem {
  private conventions: Map<string, Convention> = new Map();
  private experiences: ConventionExperience[] = [];
  
  /**
   * Registers a convention
   */
  async registerConvention(convention: Convention): Promise<void> {
    this.conventions.set(convention.id, convention);
    agl.emitMetric('conventions.registered', {
      conventionId: convention.id,
      type: convention.type
    });
  }
  
  /**
   * Executes a convention action
   */
  async executeConvention(
    conventionId: string,
    actionId: string,
    context: ConventionContext
  ): Promise<ConventionResult> {
    const spanId = agl.emitSpan('conventions.execute', {
      conventionId,
      actionId,
      agentId: context.agentId
    });

    try {
      const convention = this.conventions.get(conventionId);
      if (!convention) {
        throw new Error(`Convention ${conventionId} not found`);
      }

      // Check conditions
      const conditionsMet = await this.evaluateConditions(
        convention.conditions,
        context
      );

      if (!conditionsMet) {
        return {
          success: false,
          action: actionId,
          coordination: {
            type: 'status_update',
            sender: context.agentId,
            receivers: [],
            content: { error: 'Conditions not met' }
          },
          communicationReduction: 0,
          cooperationImprovement: 0,
          error: 'Convention conditions not met'
        };
      }

      // Find action
      const action = convention.actionSpace.find(a => a.id === actionId);
      if (!action) {
        throw new Error(`Action ${actionId} not found in convention ${conventionId}`);
      }

      // Execute action
      const result = await action.execution(context);

      // Apply effects
      await this.applyEffects(convention.effects, context, result);

      // Record experience
      this.recordExperience(conventionId, context, result);

      agl.endSpan(spanId, 'success', {
        success: result.success,
        communicationReduction: result.communicationReduction
      });

      return result;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Learns conventions from experience
   */
  async learnConventions(
    experiences: ConventionExperience[]
  ): Promise<Convention[]> {
    const spanId = agl.emitSpan('conventions.learn');

    try {
      this.experiences.push(...experiences);
      
      // Analyze experiences to discover patterns
      const learnedConventions = this.analyzeExperiences(experiences);
      
      // Register learned conventions
      for (const convention of learnedConventions) {
        await this.registerConvention(convention);
      }

      agl.endSpan(spanId, 'success', {
        learnedCount: learnedConventions.length
      });

      return learnedConventions;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Augments agent action space with conventions
   */
  augmentActionSpace(
    baseActions: AgentAction[],
    conventions: Convention[]
  ): AugmentedActionSpace {
    const conventionActions: ConventionAction[] = [];
    
    for (const convention of conventions) {
      for (const action of convention.actionSpace) {
        conventionActions.push(action);
      }
    }
    
    const totalActions: AgentAction[] = [
      ...baseActions,
      ...conventionActions.map(ca => ({
        id: `conv_${ca.id}`,
        name: ca.name,
        type: 'convention' as const,
        parameters: ca.parameters
      }))
    ];
    
    return {
      baseActions,
      conventionActions,
      totalActions
    };
  }

  private async evaluateConditions(
    conditions: ConventionCondition[],
    context: ConventionContext
  ): Promise<boolean> {
    for (const condition of conditions) {
      const met = await condition.evaluator(context);
      if (!met) {
        return false;
      }
    }
    return true;
  }

  private async applyEffects(
    effects: ConventionEffect[],
    context: ConventionContext,
    result: ConventionResult
  ): Promise<void> {
    for (const effect of effects) {
      // Apply effect based on type
      switch (effect.type) {
        case 'signal':
          // Emit coordination signal
          break;
        case 'coordinate':
          // Coordinate with other agents
          break;
        case 'assign':
          // Assign task
          break;
        case 'resolve':
          // Resolve conflict
          break;
      }
    }
  }

  private recordExperience(
    conventionId: string,
    context: ConventionContext,
    result: ConventionResult
  ): void {
    const experience: ConventionExperience = {
      conventionId,
      context,
      result,
      reward: this.calculateReward(result),
      timestamp: Date.now()
    };
    
    this.experiences.push(experience);
    
    // Keep only recent experiences
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-1000);
    }
  }

  private calculateReward(result: ConventionResult): number {
    return (
      (result.success ? 1.0 : 0.0) * 0.4 +
      result.communicationReduction * 0.3 +
      result.cooperationImprovement * 0.3
    );
  }

  private analyzeExperiences(
    experiences: ConventionExperience[]
  ): Convention[] {
    // Simplified convention learning
    // Real implementation would use more sophisticated pattern recognition
    const learnedConventions: Convention[] = [];
    
    // Group experiences by context patterns
    const patterns = this.identifyPatterns(experiences);
    
    // Create conventions from patterns
    for (const pattern of patterns) {
      if (pattern.frequency > 10 && pattern.successRate > 0.7) {
        learnedConventions.push(this.createConventionFromPattern(pattern));
      }
    }
    
    return learnedConventions;
  }

  private identifyPatterns(
    experiences: ConventionExperience[]
  ): Array<{ frequency: number; successRate: number; context: Partial<ConventionContext> }> {
    // Simplified pattern identification
    // Real implementation would use clustering or other ML techniques
    return [];
  }

  private createConventionFromPattern(
    pattern: { frequency: number; successRate: number; context: Partial<ConventionContext> }
  ): Convention {
    return {
      id: `learned_${Date.now()}`,
      name: 'Learned Convention',
      type: 'coordination',
      description: 'Learned from experience',
      actionSpace: [],
      conditions: [],
      effects: [],
      priority: pattern.successRate
    };
  }
}

