/**
 * Dynamic Refinement Mechanism
 * 
 * Adds detail when needed for accurate simulation
 * Part of IRM4MLS methodology for maintaining accuracy
 */

import { 
  IRM4MLSModel, 
  AgentLevel, 
  AgentRepresentation, 
  RepresentationType,
  RefinementRule,
  RefinementContext,
  RefinementResult,
  ResourceUsage
} from './irm4mls-meta-model.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Dynamic Refinement Engine
 */
export class DynamicRefinementEngine {
  private model: IRM4MLSModel;
  private refinementRules: RefinementRule[];
  
  constructor(model: IRM4MLSModel) {
    this.model = model;
    this.refinementRules = model.refinementRules
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Applies dynamic refinement to model
   */
  async applyRefinement(context: RefinementContext): Promise<RefinementResult> {
    const spanId = agl.emitSpan('refinement.apply', {
      level: context.level.abstractionLevel,
      trigger: context.trigger
    });

    try {
      const results: RefinementResult[] = [];
      
      // Evaluate refinement rules
      for (const rule of this.refinementRules) {
        const conditionMet = await rule.condition.evaluator(context);
        
        if (conditionMet) {
          // Execute refinement action
          const result = await rule.action.executor(context);
          results.push(result);
          
          // Update model representation
          await this.updateModelRepresentation(result);
          
          // Check if we should continue
          if (result.accuracyGained >= 0.95) {
            break; // Sufficient accuracy achieved
          }
        }
      }
      
      const totalCost = this.calculateTotalCost(results);
      const avgAccuracyGain = this.calculateAverageAccuracyGain(results);

      agl.emitMetric('refinement.applied', {
        level: context.level.abstractionLevel,
        rulesApplied: results.length,
        accuracyGain: avgAccuracyGain
      });

      agl.endSpan(spanId, 'success', {
        rulesApplied: results.length,
        accuracyGain: avgAccuracyGain
      });

      return {
        success: true,
        refinementsApplied: results.length,
        resourceCost: totalCost,
        accuracyGained: avgAccuracyGain
      };
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  private async updateModelRepresentation(result: RefinementResult): Promise<void> {
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
    const detailedCount = Array.from(level.agents.values())
      .filter(a => a.representationType === RepresentationType.DETAILED).length;
    
    const detailedRatio = detailedCount / agentCount;
    
    if (detailedRatio > 0.8) return RepresentationType.DETAILED;
    if (detailedRatio > 0.5) return RepresentationType.AGGREGATED;
    if (detailedRatio > 0.2) return RepresentationType.ABSTRACT;
    return RepresentationType.MINIMAL;
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

  private calculateTotalCost(results: RefinementResult[]): ResourceUsage {
    return results.reduce((total, result) => ({
      memory: total.memory + (result.resourceCost?.memory || 0),
      cpu: total.cpu + (result.resourceCost?.cpu || 0),
      network: total.network + (result.resourceCost?.network || 0),
      timestamp: Date.now()
    }), { memory: 0, cpu: 0, network: 0, timestamp: Date.now() });
  }

  private calculateAverageAccuracyGain(results: RefinementResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + (r.accuracyGained || 0), 0) / results.length;
  }
}

