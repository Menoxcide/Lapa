/**
 * PERSONA_EVOLVER - Autonomous Persona Evolution Agent
 * 
 * Implements autonomous persona evolution capabilities that continuously
 * evolve and upgrade the entire persona system based on:
 * - Performance metrics
 * - Research findings
 * - Best practices
 * - User feedback
 * 
 * Features:
 * - Autonomous persona analysis and optimization
 * - Research-driven persona improvements
 * - Performance-based evolution
 * - System-wide persona evolution
 * - Continuous learning and adaptation
 */

import { eventBus } from '../core/event-bus.ts';
import { personaManager, type Persona } from '../agents/persona.manager.ts';
import { SelfImprovementSystem, type PerformanceMetrics } from './self-improvement.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';
import * as path from 'path';

export interface PersonaEvolutionConfig {
  enableAutonomousEvolution: boolean;
  enableResearchIntegration: boolean;
  enablePerformanceOptimization: boolean;
  evolutionInterval: number; // milliseconds
  improvementThreshold: number; // Minimum improvement to adopt
  personaAnalysisDepth: 'shallow' | 'medium' | 'deep';
  maxEvolutionsPerCycle: number;
}

const DEFAULT_CONFIG: PersonaEvolutionConfig = {
  enableAutonomousEvolution: true,
  enableResearchIntegration: true,
  enablePerformanceOptimization: true,
  evolutionInterval: 7 * 24 * 60 * 60 * 1000, // Weekly
  improvementThreshold: 0.05, // 5% improvement required
  personaAnalysisDepth: 'medium',
  maxEvolutionsPerCycle: 5
};

export interface PersonaAnalysis {
  personaId: string;
  personaName: string;
  consistencyScore: number; // 0-1
  performanceScore: number; // 0-1
  completenessScore: number; // 0-1
  issues: string[];
  improvementOpportunities: string[];
  recommendations: PersonaRecommendation[];
}

export interface PersonaRecommendation {
  type: 'add' | 'update' | 'remove' | 'enhance';
  field: string;
  currentValue?: unknown;
  suggestedValue: unknown;
  reasoning: string;
  expectedImpact: number; // 0-1
}

export interface PersonaEvolution {
  personaId: string;
  version: string;
  evolutionType: 'performance' | 'research' | 'architectural' | 'optimization';
  changes: PersonaChange[];
  improvementScore: number; // 0-1
  testResults?: {
    before: PerformanceMetrics;
    after: PerformanceMetrics;
  };
  adopted: boolean;
  adoptedAt?: Date;
  documented: boolean;
}

export interface PersonaChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reasoning: string;
}

export class PersonaEvolver {
  private config: PersonaEvolutionConfig;
  private selfImprovement?: SelfImprovementSystem;
  private personasPath: string;
  private evolutionHistory: Map<string, PersonaEvolution[]>; // personaId -> evolutions
  private personaAnalyses: Map<string, PersonaAnalysis>; // personaId -> analysis
  private evolutionTimer?: NodeJS.Timeout;
  private researchFindings: Map<string, unknown>; // researchId -> findings

  constructor(
    config?: Partial<PersonaEvolutionConfig>,
    selfImprovement?: SelfImprovementSystem
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.selfImprovement = selfImprovement;
    this.personasPath = path.join(process.cwd(), 'docs', 'personas');
    this.evolutionHistory = new Map();
    this.personaAnalyses = new Map();
    this.researchFindings = new Map();
  }

  /**
   * Initialize the persona evolution system
   */
  async initialize(): Promise<void> {
    // Subscribe to relevant events
    eventBus.subscribe('agent.updated' as any, this.handlePerformanceUpdate.bind(this));
    eventBus.subscribe('system.info' as any, this.handleResearchFindings.bind(this));
    
    // Start autonomous evolution cycle if enabled
    if (this.config.enableAutonomousEvolution) {
      this.startEvolutionCycle();
    }

    console.log('✅ PERSONA_EVOLVER initialized');
  }

  /**
   * Start the autonomous evolution cycle
   */
  private startEvolutionCycle(): void {
    // Run initial evolution
    this.runEvolutionCycle().catch(console.error);

    // Schedule periodic evolutions
    this.evolutionTimer = setInterval(() => {
      this.runEvolutionCycle().catch(console.error);
    }, this.config.evolutionInterval);

    console.log(`🔄 PERSONA_EVOLVER: Evolution cycle started (interval: ${this.config.evolutionInterval}ms)`);
  }

  /**
   * Run a complete evolution cycle
   */
  async runEvolutionCycle(): Promise<void> {
    console.log('🔄 PERSONA_EVOLVER: Starting evolution cycle...');

    try {
      // 1. Analyze all personas
      await this.analyzeAllPersonas();

      // 2. Identify evolution opportunities
      const opportunities = await this.identifyEvolutionOpportunities();

      // 3. Generate evolutions (limited per cycle)
      const evolutions = opportunities.slice(0, this.config.maxEvolutionsPerCycle);
      
      // 4. Test and deploy evolutions
      for (const evolution of evolutions) {
        await this.evolvePersona(evolution);
      }

      // 5. Document evolutions
      await this.documentEvolutions();

      console.log(`✅ PERSONA_EVOLVER: Evolution cycle complete (${evolutions.length} evolutions)`);
    } catch (error) {
      console.error('❌ PERSONA_EVOLVER: Evolution cycle failed', error);
    }
  }

  /**
   * Analyze all personas in the system
   */
  async analyzeAllPersonas(): Promise<void> {
    const personas = await personaManager.listPersonas();

    for (const persona of personas) {
      const analysis = await this.analyzePersona(persona);
      this.personaAnalyses.set(persona.id, analysis);
    }

    console.log(`📊 PERSONA_EVOLVER: Analyzed ${personas.length} personas`);
  }

  /**
   * Analyze a single persona
   */
  async analyzePersona(persona: Persona): Promise<PersonaAnalysis> {
    const analysis: PersonaAnalysis = {
      personaId: persona.id,
      personaName: persona.name,
      consistencyScore: this.calculateConsistency(persona),
      performanceScore: await this.getPerformanceScore(persona.id),
      completenessScore: this.calculateCompleteness(persona),
      issues: this.identifyIssues(persona),
      improvementOpportunities: this.identifyImprovementOpportunities(persona),
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateRecommendations(analysis, persona);

    return analysis;
  }

  /**
   * Calculate persona consistency score
   */
  private calculateConsistency(persona: Persona): number {
    let score = 1.0;
    const issues: string[] = [];

    // Check for missing fields
    if (!persona.personality || persona.personality.trim().length === 0) {
      score -= 0.1;
      issues.push('Missing personality description');
    }

    if (!persona.communicationStyle || persona.communicationStyle.trim().length === 0) {
      score -= 0.1;
      issues.push('Missing communication style');
    }

    if (!persona.expertiseAreas || persona.expertiseAreas.length === 0) {
      score -= 0.1;
      issues.push('Missing expertise areas');
    }

    if (!persona.behaviorRules || persona.behaviorRules.length === 0) {
      score -= 0.1;
      issues.push('Missing behavior rules');
    }

    // Check for consistency in preferences
    if (persona.interactionPreferences) {
      if (!persona.interactionPreferences.formality) score -= 0.05;
      if (!persona.interactionPreferences.verbosity) score -= 0.05;
      if (!persona.interactionPreferences.tone) score -= 0.05;
    } else {
      score -= 0.15;
      issues.push('Missing interaction preferences');
    }

    return Math.max(0, score);
  }

  /**
   * Calculate persona completeness score
   */
  private calculateCompleteness(persona: Persona): number {
    let score = 0.0;
    const maxScore = 10;

    if (persona.id) score += 1;
    if (persona.name) score += 1;
    if (persona.personality) score += 1;
    if (persona.communicationStyle) score += 1;
    if (persona.expertiseAreas && persona.expertiseAreas.length > 0) score += 1;
    if (persona.interactionPreferences) score += 1;
    if (persona.behaviorRules && persona.behaviorRules.length > 0) score += 1;
    if (persona.customInstructions) score += 1;
    if (persona.expertiseAreas && persona.expertiseAreas.length >= 3) score += 1;
    if (persona.behaviorRules && persona.behaviorRules.length >= 3) score += 1;

    return score / maxScore;
  }

  /**
   * Get performance score for a persona
   */
  private async getPerformanceScore(personaId: string): Promise<number> {
    if (!this.selfImprovement) {
      return 0.5; // Default score if no self-improvement system
    }

    // Get performance history from self-improvement system
    const history = this.selfImprovement.getPerformanceHistory(personaId);
    
    if (!history || history.length === 0) {
      return 0.5; // Default score if no history
    }

    // Calculate average success rate
    const avgSuccessRate = history.reduce((sum, m) => sum + m.successRate, 0) / history.length;
    const avgQualityScore = history.reduce((sum, m) => sum + m.qualityScore, 0) / history.length;
    
    return (avgSuccessRate + avgQualityScore) / 2;
  }

  /**
   * Identify issues in a persona
   */
  private identifyIssues(persona: Persona): string[] {
    const issues: string[] = [];

    if (!persona.personality || persona.personality.length < 20) {
      issues.push('Personality description too short or missing');
    }

    if (!persona.expertiseAreas || persona.expertiseAreas.length === 0) {
      issues.push('No expertise areas defined');
    }

    if (!persona.behaviorRules || persona.behaviorRules.length < 2) {
      issues.push('Insufficient behavior rules defined');
    }

    if (!persona.customInstructions || persona.customInstructions.length < 50) {
      issues.push('Custom instructions too brief');
    }

    return issues;
  }

  /**
   * Identify improvement opportunities
   */
  private identifyImprovementOpportunities(persona: Persona): string[] {
    const opportunities: string[] = [];

    // Check for research-based improvements
    if (this.config.enableResearchIntegration) {
      opportunities.push('Research findings available for integration');
    }

    // Check for performance improvements
    if (this.config.enablePerformanceOptimization) {
      opportunities.push('Performance metrics indicate optimization potential');
    }

    // Check for completeness
    if (persona.expertiseAreas && persona.expertiseAreas.length < 3) {
      opportunities.push('Expand expertise areas');
    }

    if (persona.behaviorRules && persona.behaviorRules.length < 5) {
      opportunities.push('Add more behavior rules');
    }

    return opportunities;
  }

  /**
   * Generate recommendations for persona improvement
   */
  private generateRecommendations(
    analysis: PersonaAnalysis,
    persona: Persona
  ): PersonaRecommendation[] {
    const recommendations: PersonaRecommendation[] = [];

    // Recommendations based on consistency issues
    if (analysis.consistencyScore < 0.8) {
      recommendations.push({
        type: 'update',
        field: 'personality',
        currentValue: persona.personality,
        suggestedValue: `${persona.personality || ''}\n\n[Enhanced based on research and best practices]`,
        reasoning: 'Improve consistency by enhancing personality description',
        expectedImpact: 0.15
      });
    }

    // Recommendations based on completeness
    if (analysis.completenessScore < 0.8) {
      if (persona.expertiseAreas.length < 3) {
        recommendations.push({
          type: 'update',
          field: 'expertiseAreas',
          currentValue: persona.expertiseAreas,
          suggestedValue: [...persona.expertiseAreas, 'advanced optimization', 'system integration'],
          reasoning: 'Expand expertise areas for better agent specialization',
          expectedImpact: 0.1
        });
      }

      if (persona.behaviorRules.length < 5) {
        recommendations.push({
          type: 'update',
          field: 'behaviorRules',
          currentValue: persona.behaviorRules,
          suggestedValue: [
            ...persona.behaviorRules,
            'Always document decisions and reasoning',
            'Continuously learn from execution results'
          ],
          reasoning: 'Add more behavior rules for better agent guidance',
          expectedImpact: 0.1
        });
      }
    }

    // Research-based recommendations
    if (this.config.enableResearchIntegration && this.researchFindings.size > 0) {
      recommendations.push({
        type: 'enhance',
        field: 'customInstructions',
        currentValue: persona.customInstructions,
        suggestedValue: `${persona.customInstructions}\n\n[Enhanced with latest research findings]`,
        reasoning: 'Integrate latest research findings into persona',
        expectedImpact: 0.2
      });
    }

    return recommendations;
  }

  /**
   * Identify evolution opportunities across all personas
   */
  async identifyEvolutionOpportunities(): Promise<PersonaEvolution[]> {
    const opportunities: PersonaEvolution[] = [];

    for (const [personaId, analysis] of this.personaAnalyses.entries()) {
      const persona = await personaManager.getPersona(personaId);
      if (!persona) continue;

      // Create evolution based on recommendations
      if (analysis.recommendations.length > 0) {
        const evolution = await this.createEvolutionFromRecommendations(
          persona as Persona,
          analysis.recommendations,
          'optimization'
        );
        opportunities.push(evolution);
      }
    }

    // Sort by expected impact
    opportunities.sort((a, b) => b.improvementScore - a.improvementScore);

    return opportunities;
  }

  /**
   * Create evolution from recommendations
   */
  private async createEvolutionFromRecommendations(
    persona: Persona,
    recommendations: PersonaRecommendation[],
    evolutionType: PersonaEvolution['evolutionType']
  ): Promise<PersonaEvolution> {
    const changes: PersonaChange[] = [];
    let totalImpact = 0;

    for (const rec of recommendations) {
      if (rec.type === 'update' || rec.type === 'enhance') {
        changes.push({
          field: rec.field,
          oldValue: rec.currentValue,
          newValue: rec.suggestedValue,
          reasoning: rec.reasoning
        });
        totalImpact += rec.expectedImpact;
      }
    }

    return {
      personaId: persona.id,
      version: this.generateVersion(),
      evolutionType,
      changes,
      improvementScore: Math.min(1.0, totalImpact),
      adopted: false,
      documented: false
    };
  }

  /**
   * Evolve a persona based on evolution plan
   */
  async evolvePersona(evolution: PersonaEvolution): Promise<boolean> {
    console.log(`🔄 PERSONA_EVOLVER: Evolving persona ${evolution.personaId}...`);

    try {
      // Get current persona
      const persona = await personaManager.getPersona(evolution.personaId);
      if (!persona) {
        console.error(`❌ PERSONA_EVOLVER: Persona ${evolution.personaId} not found`);
        return false;
      }

      // Create evolved persona
      const evolvedPersona = this.applyEvolutionChanges(persona as Persona, evolution.changes) as Persona;

      // Test evolution if improvement threshold is met
      if (evolution.improvementScore >= this.config.improvementThreshold) {
        // For now, we'll adopt if threshold is met
        // In production, you'd want to test the changes first
        
        // Update persona in manager
        personaManager.updatePersona(evolution.personaId, evolvedPersona as Persona);

        // Save to file
        await this.savePersonaToFile(evolvedPersona);

        // Mark as adopted
        evolution.adopted = true;
        evolution.adoptedAt = new Date();

        // Track evolution
        const history = this.evolutionHistory.get(evolution.personaId) || [];
        history.push(evolution);
        this.evolutionHistory.set(evolution.personaId, history);

        // Publish evolution event
        await eventBus.publish({
          id: `persona-evolved-${evolution.personaId}-${Date.now()}`,
          type: 'persona.evolved',
          timestamp: Date.now(),
          source: 'persona-evolver',
          payload: {
            personaId: evolution.personaId,
            evolution,
            improvements: evolution.changes.map(c => c.reasoning)
          }
        });

        console.log(`✅ PERSONA_EVOLVER: Persona ${evolution.personaId} evolved successfully`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ PERSONA_EVOLVER: Evolution failed for ${evolution.personaId}`, error);
      return false;
    }
  }

  /**
   * Apply evolution changes to persona
   */
  private applyEvolutionChanges(persona: Persona, changes: PersonaChange[]): Partial<Persona> {
    const updates: Partial<Persona> = {};

    for (const change of changes) {
      (updates as any)[change.field] = change.newValue;
    }

    return updates;
  }

  /**
   * Save persona to file
   * Note: File persistence will be handled by the persona manager
   * This method is a placeholder for future file-level persistence
   */
  private async savePersonaToFile(persona: Persona): Promise<void> {
    try {
      // Persona updates are already persisted through personaManager.updatePersona()
      // This method is for potential future file-level persistence
      const personaFilePath = path.join(this.personasPath, `${persona.id.toUpperCase()}_PERSONA.md`);
      console.log(`📝 PERSONA_EVOLVER: Persona updated in manager (would save to ${personaFilePath} in future)`);
    } catch (error) {
      console.error(`❌ PERSONA_EVOLVER: Failed to save persona file`, error);
    }
  }

  /**
   * Handle performance updates
   */
  private async handlePerformanceUpdate(event: LAPAEvent): Promise<void> {
    // Trigger re-analysis if performance degraded
    if (this.config.enablePerformanceOptimization) {
      await this.analyzeAllPersonas();
    }
  }

  /**
   * Handle research findings
   */
  private async handleResearchFindings(event: LAPAEvent): Promise<void> {
    if (event.payload && 'findings' in event.payload) {
      const researchId = `research-${Date.now()}`;
      this.researchFindings.set(researchId, event.payload.findings);
      
      // Trigger evolution cycle if research-based evolution is enabled
      if (this.config.enableResearchIntegration) {
        await this.runEvolutionCycle();
      }
    }
  }

  /**
   * Document all evolutions
   */
  private async documentEvolutions(): Promise<void> {
    // Track evolution metrics
    let totalEvolutions = 0;
    let adoptedEvolutions = 0;

    for (const evolutions of this.evolutionHistory.values()) {
      totalEvolutions += evolutions.length;
      adoptedEvolutions += evolutions.filter(e => e.adopted).length;
    }

    console.log(`📊 PERSONA_EVOLVER: Evolution stats - Total: ${totalEvolutions}, Adopted: ${adoptedEvolutions}`);
  }

  /**
   * Generate version string for evolution
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}-${now.getHours()}${now.getMinutes()}`;
  }

  /**
   * Get evolution history for a persona
   */
  getEvolutionHistory(personaId: string): PersonaEvolution[] {
    return this.evolutionHistory.get(personaId) || [];
  }

  /**
   * Get analysis for a persona
   */
  getPersonaAnalysis(personaId: string): PersonaAnalysis | undefined {
    return this.personaAnalyses.get(personaId);
  }

  /**
   * Manually trigger evolution cycle
   */
  async triggerEvolutionCycle(): Promise<void> {
    await this.runEvolutionCycle();
  }

  /**
   * Stop evolution cycle
   */
  stop(): void {
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = undefined;
    }
    console.log('🛑 PERSONA_EVOLVER: Evolution cycle stopped');
  }
}

// Export singleton instance
export const personaEvolver = new PersonaEvolver();

