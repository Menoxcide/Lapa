/**
 * Hybrid Persona Generator for LAPA Agents
 * 
 * Generates hybrid personas by intelligently merging multiple personas.
 * Uses TOON optimization for minimal token usage in persona data structures.
 * 
 * Features:
 * - Intelligent persona merging
 * - TOON-optimized persona storage
 * - Self-generation triggers
 * - Token-efficient persona representation
 */

import type { Persona, EnhancedPersona } from './persona.manager.ts';
import { PersonaManager } from './persona.manager.ts';
import { 
  optimizeForTOON, 
  optimizeContextForLLM,
  shouldOptimizeForTOON,
  type TOONOptimizationConfig 
} from '../utils/toon-optimizer.ts';
import { serializeToTOON, deserializeFromTOON } from '../utils/toon-serializer.ts';

/**
 * Hybrid persona generation configuration
 */
export interface HybridPersonaConfig {
  /** Base personas to merge */
  basePersonas: string[];
  /** Weight for each persona (0-1, defaults to equal) */
  weights?: number[];
  /** Target expertise areas for the hybrid */
  targetExpertise?: string[];
  /** Optimization level for token usage */
  tokenOptimization?: 'minimal' | 'balanced' | 'maximum';
  /** Enable TOON optimization */
  enableTOON?: boolean;
  /** Custom merge strategy */
  mergeStrategy?: 'weighted' | 'selective' | 'intelligent';
}

/**
 * Hybrid persona generation result
 */
export interface HybridPersonaResult {
  /** Generated hybrid persona */
  persona: EnhancedPersona;
  /** Token reduction achieved (if TOON used) */
  tokenReduction?: number;
  /** Format used for optimization */
  format: 'toon' | 'json';
  /** Generation metadata */
  metadata: {
    basePersonas: string[];
    weights: number[];
    mergeStrategy: string;
    generatedAt: Date;
    tokenCount?: number;
    optimizedTokenCount?: number;
  };
}

/**
 * Hybrid Persona Generator
 * 
 * Generates hybrid personas by merging multiple personas intelligently.
 * Optimizes for minimal token usage using TOON format.
 */
export class HybridPersonaGenerator {
  private personaManager: PersonaManager;
  private toonConfig: TOONOptimizationConfig;

  constructor(personaManager?: PersonaManager, toonConfig?: Partial<TOONOptimizationConfig>) {
    this.personaManager = personaManager || new PersonaManager();
    this.toonConfig = {
      enableTOON: true,
      minTokenReduction: 20,
      optimizeArrays: true,
      optimizeNestedObjects: true,
      ...toonConfig
    };
  }

  /**
   * Generate a hybrid persona from multiple base personas
   */
  async generateHybridPersona(config: HybridPersonaConfig): Promise<HybridPersonaResult> {
    // Load base personas
    const basePersonas = await this.loadBasePersonas(config.basePersonas);
    
    if (basePersonas.length === 0) {
      throw new Error('No valid base personas found');
    }

    // Normalize weights
    const weights = this.normalizeWeights(config.weights || [], basePersonas.length);

    // Generate hybrid persona based on strategy
    let hybridPersona: EnhancedPersona;
    switch (config.mergeStrategy || 'intelligent') {
      case 'weighted':
        hybridPersona = this.mergeWeighted(basePersonas, weights, config);
        break;
      case 'selective':
        hybridPersona = this.mergeSelective(basePersonas, config);
        break;
      case 'intelligent':
      default:
        hybridPersona = this.mergeIntelligent(basePersonas, weights, config);
        break;
    }

    // Optimize persona for token usage
    const optimizationResult = await this.optimizePersonaForTokens(hybridPersona, config);

    return {
      persona: optimizationResult.persona,
      tokenReduction: optimizationResult.tokenReduction,
      format: optimizationResult.format,
      metadata: {
        basePersonas: config.basePersonas,
        weights,
        mergeStrategy: config.mergeStrategy || 'intelligent',
        generatedAt: new Date(),
        tokenCount: optimizationResult.originalTokenCount,
        optimizedTokenCount: optimizationResult.optimizedTokenCount
      }
    };
  }

  /**
   * Self-generate hybrid persona based on task requirements
   */
  async selfGenerateHybridPersona(
    taskDescription: string,
    requiredExpertise: string[]
  ): Promise<HybridPersonaResult> {
    // Find best matching personas
    const matchingPersonas = await this.findMatchingPersonas(requiredExpertise);
    
    if (matchingPersonas.length === 0) {
      throw new Error('No matching personas found for required expertise');
    }

    // Generate hybrid with intelligent merge
    return this.generateHybridPersona({
      basePersonas: matchingPersonas.map(p => p.id),
      targetExpertise: requiredExpertise,
      mergeStrategy: 'intelligent',
      tokenOptimization: 'maximum',
      enableTOON: true
    });
  }

  /**
   * Load base personas from IDs
   */
  private async loadBasePersonas(personaIds: string[]): Promise<EnhancedPersona[]> {
    await this.personaManager.waitForInitialization();
    
    const personas: EnhancedPersona[] = [];
    for (const id of personaIds) {
      const enhancedPersona = await this.personaManager.getEnhancedPersona(id);
      const persona = enhancedPersona || await this.personaManager.getPersona(id);
      if (persona) {
        // Convert to EnhancedPersona if needed
        const enhanced = 'sections' in persona 
          ? (persona as unknown as EnhancedPersona)
          : { ...persona, sections: {}, metadata: {} } as EnhancedPersona;
        personas.push(enhanced);
      }
    }
    return personas;
  }

  /**
   * Normalize weights array
   */
  private normalizeWeights(weights: number[], count: number): number[] {
    if (weights.length === 0) {
      // Equal weights
      return new Array(count).fill(1 / count);
    }
    
    // Pad or truncate to match count
    const normalized = [...weights];
    while (normalized.length < count) {
      normalized.push(1 / count);
    }
    normalized.splice(count);

    // Normalize to sum to 1
    const sum = normalized.reduce((a, b) => a + b, 0);
    return normalized.map(w => w / sum);
  }

  /**
   * Intelligent merge strategy - combines best aspects of each persona
   */
  private mergeIntelligent(
    personas: EnhancedPersona[],
    weights: number[],
    config: HybridPersonaConfig
  ): EnhancedPersona {
    const hybridId = `hybrid-${personas.map(p => (p.id || 'unknown').split('-')[0]).join('-')}-${Date.now()}`;
    const hybridName = this.generateHybridName(personas);

    // Merge expertise areas (weighted by importance)
    const expertiseAreas = this.mergeExpertiseAreas(personas, weights, config.targetExpertise);

    // Merge personality (weighted average of descriptions)
    const personality = this.mergePersonality(personas, weights);

    // Merge communication style (most common or weighted)
    const communicationStyle = this.mergeCommunicationStyle(personas, weights) || 'Technical and comprehensive';

    // Merge interaction preferences (weighted)
    const interactionPreferences = this.mergeInteractionPreferences(personas, weights);

    // Merge behavior rules (consolidate unique rules)
    const behaviorRules = this.mergeBehaviorRules(personas);

    // Merge custom instructions (combine intelligently)
    const customInstructions = this.mergeCustomInstructions(personas, weights);

    // Merge sections if available
    const sections = this.mergeSections(personas, weights);

    return {
      id: hybridId,
      name: hybridName,
      personality,
      communicationStyle,
      expertiseAreas,
      interactionPreferences,
      behaviorRules,
      customInstructions,
      sections,
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        status: 'ACTIVE',
        project: 'LAPA-VOID',
        role: 'Hybrid Agent'
      }
    };
  }

  /**
   * Weighted merge strategy
   */
  private mergeWeighted(
    personas: EnhancedPersona[],
    weights: number[],
    config: HybridPersonaConfig
  ): EnhancedPersona {
    // Similar to intelligent but with strict weighting
    return this.mergeIntelligent(personas, weights, config);
  }

  /**
   * Selective merge strategy - picks best aspects
   */
  private mergeSelective(
    personas: EnhancedPersona[],
    config: HybridPersonaConfig
  ): EnhancedPersona {
    // Select best persona as base, enhance with others
    const primaryPersona = personas[0];
    const hybridId = `hybrid-selective-${primaryPersona.id}-${Date.now()}`;

    // Enhance with selective aspects from others
    const enhancedExpertise = this.selectBestExpertise(personas, config.targetExpertise);
    const enhancedRules = this.selectBestRules(personas);

    return {
      ...primaryPersona,
      id: hybridId,
      name: `Enhanced ${primaryPersona.name}`,
      expertiseAreas: enhancedExpertise,
      behaviorRules: enhancedRules,
      metadata: {
        ...primaryPersona.metadata,
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Merge expertise areas intelligently
   */
  private mergeExpertiseAreas(
    personas: EnhancedPersona[],
    weights: number[],
    targetExpertise?: string[]
  ): string[] {
    const expertiseMap = new Map<string, number>();

    // Collect expertise with weights
    personas.forEach((persona, index) => {
      const areas = persona.expertiseAreas || [];
      areas.forEach(area => {
        if (area) {
          const current = expertiseMap.get(area) || 0;
          expertiseMap.set(area, current + weights[index]);
        }
      });
    });

    // Sort by weight
    const sorted = Array.from(expertiseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area);

    // Prioritize target expertise if provided
    if (targetExpertise && targetExpertise.length > 0) {
      const targetSet = new Set(targetExpertise.map(e => e.toLowerCase()));
      const prioritized = sorted.filter(e => targetSet.has(e.toLowerCase()));
      const others = sorted.filter(e => !targetSet.has(e.toLowerCase()));
      return [...prioritized, ...others].slice(0, 15); // Limit to top 15
    }

    return sorted.slice(0, 15);
  }

  /**
   * Merge personality descriptions
   */
  private mergePersonality(personas: EnhancedPersona[], weights: number[]): string {
    const personalities = personas.map(p => p.personality || 'Professional').filter(Boolean);
    if (personalities.length === 0) {
      return 'Hybrid professional personality';
    }
    // For now, combine with weights (could use NLP for better merging)
    return `Hybrid personality combining: ${personalities
      .map((p, i) => `${p} (${Math.round(weights[i] * 100)}%)`)
      .join(', ')}`;
  }

  /**
   * Merge communication styles
   */
  private mergeCommunicationStyle(
    personas: EnhancedPersona[],
    weights: number[]
  ): string {
    // Use most weighted style, or combine
    const styles = personas.map(p => p.communicationStyle || 'Technical and professional').filter(Boolean);
    if (styles.length === 0) {
      return 'Technical and comprehensive';
    }
    const maxWeightIndex = weights.indexOf(Math.max(...weights));
    return styles[maxWeightIndex] || styles[0];
  }

  /**
   * Merge interaction preferences
   */
  private mergeInteractionPreferences(
    personas: EnhancedPersona[],
    weights: number[]
  ): Persona['interactionPreferences'] {
    // Weighted selection for each preference
    const formalityVotes: Record<string, number> = {};
    const verbosityVotes: Record<string, number> = {};
    const toneVotes: Record<string, number> = {};

    personas.forEach((persona, index) => {
      const weight = weights[index];
      const prefs = persona.interactionPreferences || {
        formality: 'technical',
        verbosity: 'moderate',
        tone: 'neutral'
      };

      const formality = prefs.formality || 'technical';
      const verbosity = prefs.verbosity || 'moderate';
      const tone = prefs.tone || 'neutral';

      formalityVotes[formality] = (formalityVotes[formality] || 0) + weight;
      verbosityVotes[verbosity] = (verbosityVotes[verbosity] || 0) + weight;
      toneVotes[tone] = (toneVotes[tone] || 0) + weight;
    });

    return {
      formality: this.selectMaxVote(formalityVotes) as any,
      verbosity: this.selectMaxVote(verbosityVotes) as any,
      tone: this.selectMaxVote(toneVotes) as any
    };
  }

  /**
   * Merge behavior rules (consolidate unique)
   */
  private mergeBehaviorRules(personas: EnhancedPersona[]): string[] {
    const rulesSet = new Set<string>();
    personas.forEach(persona => {
      const rules = persona.behaviorRules || [];
      rules.forEach(rule => {
        if (rule) {
          rulesSet.add(rule);
        }
      });
    });
    return Array.from(rulesSet).slice(0, 20); // Limit to top 20
  }

  /**
   * Merge custom instructions
   */
  private mergeCustomInstructions(
    personas: EnhancedPersona[],
    weights: number[]
  ): string {
    const instructions = personas.map(p => p.customInstructions || 'Follow best practices').filter(Boolean);
    if (instructions.length === 0) {
      return 'Follow best practices and maintain high quality standards.';
    }
    // Combine with priority to higher weights
    return instructions
      .map((inst, i) => `[${Math.round(weights[i] * 100)}%] ${inst}`)
      .join('\n\n');
  }

  /**
   * Merge sections from enhanced personas
   */
  private mergeSections(
    personas: EnhancedPersona[],
    weights: number[]
  ): EnhancedPersona['sections'] {
    const sections: EnhancedPersona['sections'] = {};

    // Merge identity
    const identities = personas
      .map(p => p.sections?.identity)
      .filter(Boolean) as Array<NonNullable<EnhancedPersona['sections']>['identity']>;
    
    if (identities.length > 0) {
      sections.identity = {
        name: this.generateHybridName(personas),
        role: identities.map(i => i?.role || '').join(' / '),
        mission: identities.map(i => i?.mission || '').join(' | '),
        coreResponsibilities: this.mergeArrays(
          identities.map(i => (i?.coreResponsibilities || [])),
          weights
        )
      };
    }

    // Merge critical rules
    const allRules = personas
      .map(p => p.sections?.criticalRules || [])
      .flat();
    if (allRules.length > 0) {
      sections.criticalRules = Array.from(new Set(allRules));
    }

    return sections;
  }

  /**
   * Optimize persona for minimal token usage
   */
  private async optimizePersonaForTokens(
    persona: EnhancedPersona,
    config: HybridPersonaConfig
  ): Promise<{
    persona: EnhancedPersona;
    tokenReduction?: number;
    format: 'toon' | 'json';
    originalTokenCount?: number;
    optimizedTokenCount?: number;
  }> {
    if (!config.enableTOON && config.enableTOON !== false) {
      // Default to enabled
      config.enableTOON = true;
    }

    if (!config.enableTOON) {
      return { persona, format: 'json' };
    }

    // Optimize persona data structure
    const personaData = {
      expertiseAreas: persona.expertiseAreas,
      behaviorRules: persona.behaviorRules,
      sections: persona.sections
    };

    // Check if TOON optimization is beneficial
    if (shouldOptimizeForTOON(personaData, 5)) {
      const optimization = optimizeForTOON(personaData, {
        ...this.toonConfig,
        minTokenReduction: config.tokenOptimization === 'maximum' ? 10 : 
                          config.tokenOptimization === 'minimal' ? 30 : 20
      });

      if (optimization.format === 'toon' && optimization.tokenReduction) {
        // Store TOON-optimized data in persona
        const optimizedPersona: EnhancedPersona = {
          ...persona,
          metadata: {
            ...persona.metadata,
            _toonOptimized: true as any,
            _toonTokenReduction: optimization.tokenReduction as any
          } as any
        };

        // Estimate token counts
        const originalJson = JSON.stringify(personaData);
        const originalTokens = Math.ceil(originalJson.length / 4);
        const optimizedTokens = Math.ceil(
          (optimization.optimized as any)._data?.length / 4 || originalTokens
        );

        return {
          persona: optimizedPersona,
          tokenReduction: optimization.tokenReduction,
          format: 'toon',
          originalTokenCount: originalTokens,
          optimizedTokenCount: optimizedTokens
        };
      }
    }

    return { persona, format: 'json' };
  }

  /**
   * Find matching personas for required expertise
   */
  private async findMatchingPersonas(requiredExpertise: string[]): Promise<Persona[]> {
    const allPersonas = await this.personaManager.listPersonas();
    const expertiseSet = new Set(requiredExpertise.map((e: string) => e.toLowerCase()));

    // Score each persona
    const scored = allPersonas.map((persona: Persona) => {
      const matches = persona.expertiseAreas.filter((area: string) =>
        Array.from(expertiseSet).some((req: string) => 
          area.toLowerCase().includes(req) || req.includes(area.toLowerCase())
        )
      ).length;
      return { persona, score: matches };
    });

    // Return top matches
    return scored
      .filter((s: { persona: Persona; score: number }) => s.score > 0)
      .sort((a: { persona: Persona; score: number }, b: { persona: Persona; score: number }) => b.score - a.score)
      .slice(0, 5)
      .map((s: { persona: Persona; score: number }) => s.persona);
  }

  /**
   * Generate hybrid name from base personas
   */
  private generateHybridName(personas: EnhancedPersona[]): string {
    const names = personas.map(p => {
      // Extract core name (remove "Agent", "Expert", etc.)
      const name = p.name || p.id || 'Unknown';
      return name
        .replace(/\s+(Agent|Expert|Specialist|Wizard|Guardian|Hunter|Architect|Coder|Reviewer|Tester|Debugger|Optimizer|Planner|Validator|Integrator|Deployer)$/i, '')
        .trim();
    });
    return `${names.join('-')} Hybrid`;
  }

  /**
   * Select best expertise areas
   */
  private selectBestExpertise(
    personas: EnhancedPersona[],
    targetExpertise?: string[]
  ): string[] {
    return this.mergeExpertiseAreas(personas, new Array(personas.length).fill(1 / personas.length), targetExpertise);
  }

  /**
   * Select best behavior rules
   */
  private selectBestRules(personas: EnhancedPersona[]): string[] {
    return this.mergeBehaviorRules(personas);
  }

  /**
   * Select max vote from votes map
   */
  private selectMaxVote(votes: Record<string, number>): string {
    return Object.entries(votes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  /**
   * Merge arrays with weights
   */
  private mergeArrays(arrays: string[][], weights: number[]): string[] {
    const map = new Map<string, number>();
    arrays.forEach((arr, index) => {
      arr.forEach(item => {
        map.set(item, (map.get(item) || 0) + weights[index]);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
  }
}

// Export singleton instance
export const hybridPersonaGenerator = new HybridPersonaGenerator();

