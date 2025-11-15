/**
 * Autonomous Persona Auto-Generator
 * 
 * Automatically generates hybrid personas when tasks require multiple expertise areas.
 * Implements self-generation triggers for optimal persona selection.
 * 
 * Features:
 * - Task complexity analysis
 * - Automatic hybrid generation
 * - TOON optimization
 * - Performance tracking
 */

import type { Persona, EnhancedPersona } from './persona.manager.ts';
import { PersonaManager } from './persona.manager.ts';
import { hybridPersonaGenerator } from './hybrid-persona-generator.ts';
import { BoundedMap } from '../utils/bounded-collections.js';
import { cachedStringify } from '../utils/serialization-cache.js';

/**
 * Task analysis result
 */
export interface TaskAnalysis {
  /** Required expertise areas */
  requiredExpertise: string[];
  /** Complexity score (0-1) */
  complexity: number;
  /** Whether hybrid persona is needed */
  needsHybrid: boolean;
  /** Matching base personas */
  matchingPersonas: Persona[];
  /** Recommended persona IDs */
  recommendedPersonaIds: string[];
}

/**
 * Auto-generation configuration
 */
export interface AutoGenerationConfig {
  /** Minimum complexity to trigger hybrid generation */
  minComplexityThreshold: number;
  /** Minimum expertise areas to trigger hybrid */
  minExpertiseAreas: number;
  /** Enable TOON optimization */
  enableTOON: boolean;
  /** Token optimization level */
  tokenOptimization: 'minimal' | 'balanced' | 'maximum';
  /** Cache generated personas */
  enableCaching: boolean;
}

/**
 * Default auto-generation configuration
 */
const DEFAULT_CONFIG: AutoGenerationConfig = {
  minComplexityThreshold: 0.6,
  minExpertiseAreas: 2,
  enableTOON: true,
  tokenOptimization: 'balanced',
  enableCaching: true
};

/**
 * Autonomous Persona Auto-Generator
 * 
 * Automatically generates hybrid personas based on task requirements.
 */
export class PersonaAutoGenerator {
  private personaManager: PersonaManager;
  private config: AutoGenerationConfig;
  // Optimized: Use bounded map to prevent unbounded cache growth
  private generatedCache: BoundedMap<string, EnhancedPersona>;

  constructor(
    personaManager?: PersonaManager,
    config?: Partial<AutoGenerationConfig>
  ) {
    this.personaManager = personaManager || new PersonaManager();
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Initialize bounded cache (500 entries max)
    this.generatedCache = new BoundedMap<string, EnhancedPersona>(500);
  }

  /**
   * Analyze task and determine if hybrid persona is needed
   */
  async analyzeTask(
    taskDescription: string,
    context?: Record<string, any>
  ): Promise<TaskAnalysis> {
    // Extract required expertise from task description
    const requiredExpertise = this.extractExpertiseFromTask(taskDescription, context);
    
    // Calculate complexity
    const complexity = this.calculateComplexity(taskDescription, requiredExpertise);
    
    // Find matching personas
    const matchingPersonas = await this.findMatchingPersonas(requiredExpertise);
    
    // Determine if hybrid is needed
    const needsHybrid = this.shouldGenerateHybrid(
      complexity,
      requiredExpertise.length,
      matchingPersonas.length
    );
    
    // Get recommended persona IDs
    const recommendedPersonaIds = needsHybrid
      ? matchingPersonas.map(p => p.id).slice(0, 5)
      : matchingPersonas.length > 0
        ? [matchingPersonas[0].id]
        : [];

    return {
      requiredExpertise,
      complexity,
      needsHybrid,
      matchingPersonas,
      recommendedPersonaIds
    };
  }

  /**
   * Auto-generate persona for task
   */
  async autoGenerateForTask(
    taskDescription: string,
    context?: Record<string, any>
  ): Promise<EnhancedPersona> {
    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(taskDescription, context);
      const cached = this.generatedCache.get(cacheKey);
      if (cached) {
        console.log(`✅ Using cached hybrid persona: ${cached.name}`);
        return cached;
      }
    }

    // Analyze task
    const analysis = await this.analyzeTask(taskDescription, context);

    // Generate persona
    let persona: EnhancedPersona;

    if (analysis.needsHybrid && analysis.recommendedPersonaIds.length > 1) {
      // Generate hybrid persona
      console.log(`🔄 Auto-generating hybrid persona for task...`);
      const result = await hybridPersonaGenerator.generateHybridPersona({
        basePersonas: analysis.recommendedPersonaIds,
        targetExpertise: analysis.requiredExpertise,
        tokenOptimization: this.config.tokenOptimization,
        enableTOON: this.config.enableTOON,
        mergeStrategy: 'intelligent'
      });

      persona = result.persona;
      
      if (result.tokenReduction) {
        console.log(`   Token reduction: ${result.tokenReduction.toFixed(1)}%`);
      }
    } else if (analysis.matchingPersonas.length > 0) {
      // Use best matching persona
      const bestMatch = analysis.matchingPersonas[0];
      const enhanced = await this.personaManager.getEnhancedPersona(bestMatch.id);
      persona = enhanced || { ...bestMatch, sections: {}, metadata: {} } as EnhancedPersona;
      console.log(`✅ Using existing persona: ${bestMatch.name}`);
    } else {
      // Fallback: generate minimal hybrid from all personas
      console.log(`⚠️ No matching personas found, generating fallback hybrid...`);
      const allPersonas: Persona[] = await this.personaManager.listPersonas();
      const result = await hybridPersonaGenerator.generateHybridPersona({
        basePersonas: allPersonas.slice(0, 3).map((p: Persona) => p.id),
        targetExpertise: analysis.requiredExpertise,
        tokenOptimization: this.config.tokenOptimization,
        enableTOON: this.config.enableTOON,
        mergeStrategy: 'intelligent'
      });
      persona = result.persona;
    }

    // Cache if enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(taskDescription, context);
      this.generatedCache.set(cacheKey, persona);
    }

    // Store in persona manager
    this.personaManager.createPersona(persona);

    return persona;
  }

  /**
   * Extract expertise areas from task description
   */
  private extractExpertiseFromTask(
    taskDescription: string,
    context?: Record<string, any>
  ): string[] {
    const expertise: string[] = [];
    const description = taskDescription.toLowerCase();

    // Common expertise keywords
    const expertiseMap: Record<string, string[]> = {
      'architecture': ['system architecture', 'architecture design', 'system design'],
      'coding': ['software development', 'coding', 'programming', 'code implementation'],
      'testing': ['testing', 'test automation', 'quality assurance', 'qa'],
      'debugging': ['debugging', 'troubleshooting', 'bug fixing', 'error resolution'],
      'optimization': ['performance optimization', 'optimization', 'efficiency', 'performance'],
      'review': ['code review', 'review', 'code quality', 'best practices'],
      'planning': ['planning', 'project planning', 'task decomposition', 'requirements'],
      'deployment': ['deployment', 'release management', 'devops', 'ci/cd'],
      'documentation': ['documentation', 'technical writing', 'docs'],
      'research': ['research', 'ai research', 'knowledge harvesting', 'learning'],
      'integration': ['integration', 'system integration', 'api integration'],
      'monitoring': ['monitoring', 'observability', 'logging', 'metrics'],
      'security': ['security', 'cybersecurity', 'vulnerability', 'authentication'],
      'database': ['database', 'sql', 'nosql', 'data modeling'],
      'api': ['api', 'rest api', 'graphql', 'web services'],
      'frontend': ['frontend', 'ui', 'ux', 'react', 'vue', 'angular'],
      'backend': ['backend', 'server', 'microservices', 'api server'],
      'distributed': ['distributed systems', 'microservices', 'scalability', 'distributed'],
      'real-time': ['real-time', 'websockets', 'streaming', 'live data']
    };

    // Match keywords
    for (const [keyword, areas] of Object.entries(expertiseMap)) {
      if (description.includes(keyword)) {
        expertise.push(...areas);
      }
    }

    // Extract from context if provided
    if (context) {
      if (context.expertise && Array.isArray(context.expertise)) {
        expertise.push(...context.expertise);
      }
      if (context.requiredSkills && Array.isArray(context.requiredSkills)) {
        expertise.push(...context.requiredSkills);
      }
    }

    // Remove duplicates and normalize
    const unique = Array.from(new Set(expertise.map(e => e.toLowerCase())));
    return unique.slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate task complexity (0-1)
   */
  private calculateComplexity(
    taskDescription: string,
    requiredExpertise: string[]
  ): number {
    let complexity = 0;

    // Base complexity from expertise count
    complexity += Math.min(requiredExpertise.length / 5, 0.4);

    // Complexity from description length
    const descriptionLength = taskDescription.length;
    complexity += Math.min(descriptionLength / 1000, 0.3);

    // Complexity from keywords
    const complexKeywords = [
      'distributed', 'scalable', 'high-performance', 'real-time',
      'microservices', 'complex', 'advanced', 'enterprise', 'production'
    ];
    const keywordCount = complexKeywords.filter(kw => 
      taskDescription.toLowerCase().includes(kw)
    ).length;
    complexity += Math.min(keywordCount / 5, 0.3);

    return Math.min(complexity, 1.0);
  }

  /**
   * Find matching personas for expertise
   */
  private async findMatchingPersonas(requiredExpertise: string[]): Promise<Persona[]> {
    const allPersonas: Persona[] = await this.personaManager.listPersonas();
    const expertiseSet = new Set(requiredExpertise.map((e: string) => e.toLowerCase()));

    // Score each persona
    const scored = allPersonas.map((persona: Persona) => {
      const matches = persona.expertiseAreas.filter((area: string) =>
        Array.from(expertiseSet).some((req: string) => 
          area.toLowerCase().includes(req) || 
          req.includes(area.toLowerCase()) ||
          this.fuzzyMatch(area.toLowerCase(), req)
        )
      ).length;
      
      const matchRatio = matches / Math.max(requiredExpertise.length, 1);
      return { persona, score: matches, matchRatio };
    });

    // Return top matches
    return scored
      .filter((s: { persona: Persona; score: number; matchRatio: number }) => s.score > 0)
      .sort((a: { persona: Persona; score: number; matchRatio: number }, b: { persona: Persona; score: number; matchRatio: number }) => {
        // Sort by match ratio first, then by score
        if (Math.abs(a.matchRatio - b.matchRatio) > 0.1) {
          return b.matchRatio - a.matchRatio;
        }
        return b.score - a.score;
      })
      .slice(0, 5)
      .map((s: { persona: Persona; score: number; matchRatio: number }) => s.persona);
  }

  /**
   * Determine if hybrid generation is needed
   */
  private shouldGenerateHybrid(
    complexity: number,
    expertiseCount: number,
    matchingPersonasCount: number
  ): boolean {
    // Generate hybrid if:
    // 1. Complexity is high
    if (complexity >= this.config.minComplexityThreshold) {
      return true;
    }

    // 2. Multiple expertise areas required
    if (expertiseCount >= this.config.minExpertiseAreas) {
      return true;
    }

    // 3. No single persona matches well
    if (matchingPersonasCount === 0) {
      return true;
    }

    return false;
  }

  /**
   * Generate cache key from task description
   * Optimized: Use cached serialization for context
   */
  private generateCacheKey(
    taskDescription: string,
    context?: Record<string, any>
  ): string {
    // Optimized: Use cached serialization for context
    const contextStr = context ? cachedStringify(context) : '{}';
    const key = `${taskDescription.substring(0, 100)}_${contextStr}`;
    // Simple hash (in production, use proper hashing)
    return Buffer.from(key).toString('base64').substring(0, 50);
  }

  /**
   * Fuzzy match two strings
   */
  private fuzzyMatch(str1: string, str2: string): boolean {
    // Simple fuzzy matching - check if one contains the other or shares significant words
    if (str1.includes(str2) || str2.includes(str1)) {
      return true;
    }

    // Check for shared significant words (length > 4)
    const words1 = str1.split(/\s+/).filter(w => w.length > 4);
    const words2 = str2.split(/\s+/).filter(w => w.length > 4);
    const sharedWords = words1.filter(w => words2.includes(w));
    
    return sharedWords.length > 0;
  }

  /**
   * Clear generation cache
   */
  clearCache(): void {
    this.generatedCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.generatedCache.size,
      keys: Array.from(this.generatedCache.keys())
    };
  }
}

// Export singleton instance
export const personaAutoGenerator = new PersonaAutoGenerator();

