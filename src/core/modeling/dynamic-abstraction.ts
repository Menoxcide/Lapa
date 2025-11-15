/**
 * Dynamic Abstraction Mechanism
 * 
 * Simplifies representation when detail is not needed
 * Part of IRM4MLS methodology for resource optimization
 */

import { 
  IRM4MLSModel, 
  AgentLevel, 
  AgentRepresentation, 
  RepresentationType,
  AbstractionRule,
  AbstractionContext,
  AbstractionResult,
  ResourceUsage
} from './irm4mls-meta-model.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Dynamic Abstraction Engine
 */
export class DynamicAbstractionEngine {
  private model: IRM4MLSModel;
  private abstractionRules: AbstractionRule[];
  
  constructor(model: IRM4MLSModel) {
    this.model = model;
    this.abstractionRules = model.abstractionRules
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Applies dynamic abstraction to model
   */
  async applyAbstraction(context: AbstractionContext): Promise<AbstractionResult> {
    const spanId = agl.emitSpan('abstraction.apply', {
      level: context.level.abstractionLevel
    });

    try {
      const results: AbstractionResult[] = [];
      
      // Evaluate abstraction rules
      for (const rule of this.abstractionRules) {
        const conditionMet = await rule.condition.evaluator(context);
        
        if (conditionMet) {
          // Execute abstraction action
          const result = await rule.action.executor(context);
          results.push(result);
          
          // Update model representation
          await this.updateModelRepresentation(result);
          
          // Check if we should continue
          if (!result.informationPreserved) {
            break; // Stop if information would be lost
          }
        }
      }
      
      const totalSavings = this.calculateTotalSavings(results);
      const allPreserved = results.every(r => r.informationPreserved);

      agl.emitMetric('abstraction.applied', {
        level: context.level.abstractionLevel,
        rulesApplied: results.length,
        resourceSavings: totalSavings.memory
      });

      agl.endSpan(spanId, 'success', {
        rulesApplied: results.length,
        resourceSavings: totalSavings.memory
      });

      return {
        success: true,
        abstractionsApplied: results.length,
        resourceSavings: totalSavings,
        informationPreserved: allPreserved
      };
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  private async updateModelRepresentation(result: AbstractionResult): Promise<void> {
    const level = this.model.levels.get(result.targetLevel || 0);
    if (!level) return;

    // Update agent representations
    if (result.newRepresentation) {
      level.agents.set(
        result.newRepresentation.agentId,
        result.newRepresentation
      );
    }

    // Update level representation type
    level.representation = this.determineLevelRepresentation(level);
    
    // Update resource usage
    level.resourceUsage = this.calculateResourceUsage(level);
  }

  private determineLevelRepresentation(level: AgentLevel): RepresentationType {
    const agentCount = level.agents.size;
    const abstractedCount = Array.from(level.agents.values())
      .filter(a => a.representationType !== RepresentationType.DETAILED).length;
    
    const abstractedRatio = abstractedCount / agentCount;
    
    if (abstractedRatio > 0.8) return RepresentationType.MINIMAL;
    if (abstractedRatio > 0.5) return RepresentationType.ABSTRACT;
    if (abstractedRatio > 0.2) return RepresentationType.AGGREGATED;
    return RepresentationType.DETAILED;
  }

  private calculateResourceUsage(level: AgentLevel): ResourceUsage {
    let totalMemory = 0;
    let totalCpu = 0;
    let totalNetwork = 0;

    for (const agent of level.agents.values()) {
      totalMemory += agent.resourceUsage.memory;
      totalCpu += agent.resourceUsage.cpu;
      totalNetwork += agent.resourceUsage.network;
    }

    return {
      memory: totalMemory,
      cpu: totalCpu,
      network: totalNetwork,
      timestamp: Date.now()
    };
  }

  private calculateTotalSavings(results: AbstractionResult[]): ResourceUsage {
    return results.reduce((total, result) => ({
      memory: total.memory + (result.resourceSavings?.memory || 0),
      cpu: total.cpu + (result.resourceSavings?.cpu || 0),
      network: total.network + (result.resourceSavings?.network || 0),
      timestamp: Date.now()
    }), { memory: 0, cpu: 0, network: 0, timestamp: Date.now() });
  }
}

