/**
 * Persona TOON Optimizer
 * 
 * Provides TOON optimization for all persona-related data structures.
 * Optimizes arrays, lists, and structured data for minimal token usage.
 * 
 * Usage:
 * - Automatically optimizes persona data when loading/storing
 * - Optimizes persona lists when returning multiple personas
 * - Optimizes persona sections (arrays) for transmission
 */

import type { Persona, EnhancedPersona } from './persona.manager.ts';
import {
  optimizeForTOON,
  optimizeContextForLLM,
  shouldOptimizeForTOON,
  type TOONOptimizationConfig
} from '../utils/toon-optimizer.ts';
import { serializeToTOON, deserializeFromTOON } from '../utils/toon-serializer.ts';

/**
 * TOON-optimized persona data structure
 */
export interface TOONOptimizedPersona extends Omit<Persona, 'expertiseAreas' | 'behaviorRules'> {
  /** TOON-optimized expertise areas */
  expertiseAreas: any; // May be TOON string or array
  /** TOON-optimized behavior rules */
  behaviorRules: any; // May be TOON string or array
  /** Format indicators */
  _toon?: {
    expertiseAreas?: 'toon' | 'json';
    behaviorRules?: 'toon' | 'json';
    tokenReduction?: number;
  };
}

/**
 * TOON-optimized enhanced persona
 */
export interface TOONOptimizedEnhancedPersona extends TOONOptimizedPersona, Omit<EnhancedPersona, 'expertiseAreas' | 'behaviorRules'> {
  sections?: {
    identity?: {
      name: string;
      role: string;
      mission: string;
      coreResponsibilities: any; // May be TOON
    };
    criticalRules?: any; // May be TOON
    workflowPatterns?: any; // May be TOON
    [key: string]: any;
  };
}

/**
 * Persona TOON optimization configuration
 */
export interface PersonaTOONConfig extends TOONOptimizationConfig {
  /** Optimize expertise areas */
  optimizeExpertiseAreas: boolean;
  /** Optimize behavior rules */
  optimizeBehaviorRules: boolean;
  /** Optimize sections */
  optimizeSections: boolean;
  /** Optimize persona lists */
  optimizeLists: boolean;
}

/**
 * Default persona TOON configuration
 */
const DEFAULT_PERSONA_TOON_CONFIG: PersonaTOONConfig = {
  enableTOON: true,
  minTokenReduction: 20,
  optimizeArrays: true,
  optimizeNestedObjects: true,
  optimizeExpertiseAreas: true,
  optimizeBehaviorRules: true,
  optimizeSections: true,
  optimizeLists: true
};

/**
 * Persona TOON Optimizer
 * 
 * Optimizes persona data structures for minimal token usage.
 */
export class PersonaTOONOptimizer {
  private config: PersonaTOONConfig;

  constructor(config?: Partial<PersonaTOONConfig>) {
    this.config = { ...DEFAULT_PERSONA_TOON_CONFIG, ...config };
  }

  /**
   * Optimize a single persona for TOON
   */
  optimizePersona(persona: Persona | EnhancedPersona): TOONOptimizedPersona | TOONOptimizedEnhancedPersona {
    if (!this.config.enableTOON) {
      return persona as any;
    }

    const optimized: any = {
      ...persona,
      _toon: {}
    };

    // Optimize expertise areas
    if (this.config.optimizeExpertiseAreas && shouldOptimizeForTOON(persona.expertiseAreas, 5)) {
      const result = optimizeForTOON(persona.expertiseAreas, {
        minTokenReduction: this.config.minTokenReduction
      });
      if (result.format === 'toon') {
        optimized.expertiseAreas = result.optimized;
        optimized._toon.expertiseAreas = 'toon';
        if (result.tokenReduction) {
          optimized._toon.tokenReduction = (optimized._toon.tokenReduction || 0) + result.tokenReduction;
        }
      } else {
        optimized.expertiseAreas = persona.expertiseAreas;
        optimized._toon.expertiseAreas = 'json';
      }
    } else {
      optimized.expertiseAreas = persona.expertiseAreas;
      optimized._toon.expertiseAreas = 'json';
    }

    // Optimize behavior rules
    if (this.config.optimizeBehaviorRules && shouldOptimizeForTOON(persona.behaviorRules, 5)) {
      const result = optimizeForTOON(persona.behaviorRules, {
        minTokenReduction: this.config.minTokenReduction
      });
      if (result.format === 'toon') {
        optimized.behaviorRules = result.optimized;
        optimized._toon.behaviorRules = 'toon';
        if (result.tokenReduction) {
          optimized._toon.tokenReduction = (optimized._toon.tokenReduction || 0) + result.tokenReduction;
        }
      } else {
        optimized.behaviorRules = persona.behaviorRules;
        optimized._toon.behaviorRules = 'json';
      }
    } else {
      optimized.behaviorRules = persona.behaviorRules;
      optimized._toon.behaviorRules = 'json';
    }

    // Optimize sections if enhanced persona
    if ('sections' in persona && persona.sections && this.config.optimizeSections) {
      optimized.sections = this.optimizeSections(persona.sections);
    }

    return optimized;
  }

  /**
   * Optimize persona sections
   */
  private optimizeSections(sections: EnhancedPersona['sections']): any {
    if (!sections) {
      return sections;
    }

    const optimized: any = {};

    // Optimize identity core responsibilities
    if (sections.identity?.coreResponsibilities) {
      if (shouldOptimizeForTOON(sections.identity.coreResponsibilities, 5)) {
        const result = optimizeForTOON(sections.identity.coreResponsibilities, {
          minTokenReduction: this.config.minTokenReduction
        });
        if (result.format === 'toon') {
          optimized.identity = {
            ...sections.identity,
            coreResponsibilities: result.optimized
          };
        } else {
          optimized.identity = sections.identity;
        }
      } else {
        optimized.identity = sections.identity;
      }
    } else {
      optimized.identity = sections.identity;
    }

    // Optimize critical rules
    if (sections.criticalRules) {
      if (shouldOptimizeForTOON(sections.criticalRules, 5)) {
        const result = optimizeForTOON(sections.criticalRules, {
          minTokenReduction: this.config.minTokenReduction
        });
        if (result.format === 'toon') {
          optimized.criticalRules = result.optimized;
        } else {
          optimized.criticalRules = sections.criticalRules;
        }
      } else {
        optimized.criticalRules = sections.criticalRules;
      }
    }

    // Optimize workflow patterns
    if (sections.workflowPatterns) {
      if (shouldOptimizeForTOON(sections.workflowPatterns, 5)) {
        const result = optimizeForTOON(sections.workflowPatterns, {
          minTokenReduction: this.config.minTokenReduction
        });
        if (result.format === 'toon') {
          optimized.workflowPatterns = result.optimized;
        } else {
          optimized.workflowPatterns = sections.workflowPatterns;
        }
      } else {
        optimized.workflowPatterns = sections.workflowPatterns;
      }
    }

    // Copy other sections as-is
    Object.keys(sections).forEach(key => {
      if (!['identity', 'criticalRules', 'workflowPatterns'].includes(key)) {
        optimized[key] = (sections as any)[key];
      }
    });

    return optimized;
  }

  /**
   * Optimize array of personas
   */
  optimizePersonaList(personas: (Persona | EnhancedPersona)[]): {
    optimized: any[];
    format: 'toon' | 'json';
    tokenReduction?: number;
  } {
    if (!this.config.enableTOON || !this.config.optimizeLists) {
      return { optimized: personas as any[], format: 'json' };
    }

    if (personas.length < 3) {
      // Not enough items for TOON optimization
      return { optimized: personas as any[], format: 'json' };
    }

    // Extract persona data for optimization
    const personaData = personas.map(p => ({
      id: p.id,
      name: p.name,
      expertiseAreas: p.expertiseAreas,
      behaviorRules: p.behaviorRules
    }));

    if (shouldOptimizeForTOON(personaData, 3)) {
      const result = optimizeForTOON(personaData, {
        minTokenReduction: this.config.minTokenReduction
      });

      if (result.format === 'toon' && result.tokenReduction) {
        return {
          optimized: [
            {
              _format: 'toon',
              _data: result.optimized,
              _personas: personas.map(p => p.id) // Keep IDs for reference
            } as any
          ],
          format: 'toon',
          tokenReduction: result.tokenReduction
        };
      }
    }

    return { optimized: personas as any[], format: 'json' };
  }

  /**
   * Deoptimize TOON-optimized persona back to normal persona
   */
  deoptimizePersona(optimized: TOONOptimizedPersona | TOONOptimizedEnhancedPersona): Persona | EnhancedPersona {
    const persona: any = { ...optimized };
    delete persona._toon;

    // Deoptimize expertise areas
    if (optimized._toon?.expertiseAreas === 'toon' && typeof optimized.expertiseAreas === 'object') {
      try {
        persona.expertiseAreas = deserializeFromTOON((optimized.expertiseAreas as any)._data);
      } catch (error) {
        console.warn('Failed to deoptimize expertise areas:', error);
        persona.expertiseAreas = optimized.expertiseAreas;
      }
    } else {
      persona.expertiseAreas = optimized.expertiseAreas;
    }

    // Deoptimize behavior rules
    if (optimized._toon?.behaviorRules === 'toon' && typeof optimized.behaviorRules === 'object') {
      try {
        persona.behaviorRules = deserializeFromTOON((optimized.behaviorRules as any)._data);
      } catch (error) {
        console.warn('Failed to deoptimize behavior rules:', error);
        persona.behaviorRules = optimized.behaviorRules;
      }
    } else {
      persona.behaviorRules = optimized.behaviorRules;
    }

    // Deoptimize sections if present
    if ('sections' in optimized && optimized.sections) {
      persona.sections = this.deoptimizeSections(optimized.sections);
    }

    return persona;
  }

  /**
   * Deoptimize sections
   */
  private deoptimizeSections(sections: any): EnhancedPersona['sections'] {
    const deoptimized: any = { ...sections };

    // Deoptimize core responsibilities
    if (sections.identity?.coreResponsibilities && typeof sections.identity.coreResponsibilities === 'object' && '_format' in sections.identity.coreResponsibilities) {
      try {
        deoptimized.identity = {
          ...sections.identity,
          coreResponsibilities: deserializeFromTOON((sections.identity.coreResponsibilities as any)._data)
        };
      } catch (error) {
        console.warn('Failed to deoptimize core responsibilities:', error);
      }
    }

    // Deoptimize critical rules
    if (sections.criticalRules && typeof sections.criticalRules === 'object' && '_format' in sections.criticalRules) {
      try {
        deoptimized.criticalRules = deserializeFromTOON((sections.criticalRules as any)._data);
      } catch (error) {
        console.warn('Failed to deoptimize critical rules:', error);
      }
    }

    // Deoptimize workflow patterns
    if (sections.workflowPatterns && typeof sections.workflowPatterns === 'object' && '_format' in sections.workflowPatterns) {
      try {
        deoptimized.workflowPatterns = deserializeFromTOON((sections.workflowPatterns as any)._data);
      } catch (error) {
        console.warn('Failed to deoptimize workflow patterns:', error);
      }
    }

    return deoptimized;
  }

  /**
   * Optimize persona for LLM transmission
   */
  optimizeForLLM(persona: Persona | EnhancedPersona): Record<string, any> {
    const optimized = this.optimizePersona(persona);
    return optimizeContextForLLM(optimized as any, {
      minTokenReduction: this.config.minTokenReduction,
      optimizeArrays: this.config.optimizeArrays,
      optimizeNestedObjects: this.config.optimizeNestedObjects
    });
  }

  /**
   * Get token savings statistics
   */
  getTokenSavings(original: Persona | EnhancedPersona, optimized: TOONOptimizedPersona | TOONOptimizedEnhancedPersona): {
    originalTokens: number;
    optimizedTokens: number;
    savings: number;
    savingsPercent: number;
  } {
    const originalJson = JSON.stringify(original);
    const optimizedJson = JSON.stringify(optimized);
    
    const originalTokens = Math.ceil(originalJson.length / 4);
    const optimizedTokens = Math.ceil(optimizedJson.length / 4);
    const savings = originalTokens - optimizedTokens;
    const savingsPercent = originalTokens > 0 ? (savings / originalTokens) * 100 : 0;

    return {
      originalTokens,
      optimizedTokens,
      savings,
      savingsPercent
    };
  }
}

// Export singleton instance
export const personaTOONOptimizer = new PersonaTOONOptimizer();

