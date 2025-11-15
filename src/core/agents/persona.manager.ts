/**
 * Persona Manager for LAPA Agents
 * 
 * This module manages agent personas, including their personalities, behaviors,
 * and communication styles. It allows for dynamic persona configuration and
 * customization of agent interactions.
 * 
 * Now supports loading personas from markdown files in docs/personas/
 * 
 * TOON optimization enabled for minimal token usage.
 */

// Define persona characteristics
export interface Persona {
  id: string;
  name: string;
  personality: string;
  communicationStyle: string;
  expertiseAreas: string[];
  interactionPreferences: {
    formality: 'formal' | 'casual' | 'technical';
    verbosity: 'concise' | 'detailed' | 'moderate';
    tone: 'neutral' | 'enthusiastic' | 'analytical' | 'friendly';
  };
  behaviorRules: string[];
  customInstructions: string;
}

// Enhanced persona with markdown content (extends base Persona)
export interface EnhancedPersona extends Persona {
  markdownContent?: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    status?: 'ACTIVE' | 'DEPRECATED' | 'DRAFT';
    project?: string;
    role?: string;
  };
  sections?: {
    identity?: {
      name: string;
      role: string;
      mission: string;
      coreResponsibilities: string[];
    };
    criticalRules?: string[];
    coreDirectives?: string;
    metricsDashboard?: string;
    workflowPatterns?: string[];
    decisionFrameworks?: string;
    codePatterns?: string;
  };
}

// Persona configuration options
export interface PersonaConfig {
  defaultPersonas?: Record<string, Persona>;
  enableDynamicPersonas?: boolean;
  personaStoragePath?: string;
  enableMarkdownLoading?: boolean;
  markdownPersonasPath?: string;
}

/**
 * LAPA Persona Manager
 * 
 * Now supports loading personas from markdown files in addition to default personas.
 */
export class PersonaManager {
  private personas: Map<string, Persona> = new Map();
  private defaultPersonas: Record<string, Persona>;
  private enableDynamicPersonas: boolean;
  private personaStoragePath: string;
  private enableMarkdownLoading: boolean;
  private markdownPersonasPath: string;
  private initialized: boolean = false;
  private enableTOONOptimization: boolean = true;
  
  constructor(config: PersonaConfig = {}) {
    this.defaultPersonas = config.defaultPersonas || this.getDefaultPersonas();
    this.enableDynamicPersonas = config.enableDynamicPersonas ?? true;
    this.personaStoragePath = config.personaStoragePath || '.lapa/personas';
    this.enableMarkdownLoading = config.enableMarkdownLoading ?? true;
    this.markdownPersonasPath = config.markdownPersonasPath || 'docs/personas';
    
    // Initialize with default personas (synchronous)
    this.initializeDefaultPersonas();
    
    // Load markdown personas asynchronously if enabled
    if (this.enableMarkdownLoading) {
      this.loadMarkdownPersonas().catch(error => {
        console.error('Failed to load markdown personas:', error);
        // Continue with default personas only
      });
    }
  }
  
  /**
   * Initializes the manager with default personas
   */
  private initializeDefaultPersonas(): void {
    for (const [id, persona] of Object.entries(this.defaultPersonas)) {
      this.personas.set(id, persona);
    }
    console.log(`Initialized with ${this.personas.size} default personas`);
  }
  
  /**
   * Load personas from markdown files
   */
  private async loadMarkdownPersonas(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const personaParserModule = await import('./persona-markdown-parser.ts');
      const { PersonaMarkdownParser, personaMarkdownParser } = personaParserModule;
      
      // Create parser with custom path if provided
      const parser = this.markdownPersonasPath !== 'docs/personas' 
        ? new PersonaMarkdownParser(this.markdownPersonasPath)
        : personaMarkdownParser;
      
      const parsedPersonas = await parser.loadAllPersonas();
      
      // Merge markdown personas (they take precedence over defaults)
      let loadedCount = 0;
      for (const parsedPersona of parsedPersonas) {
        // Convert ParsedPersona to Persona (base interface)
        const persona: Persona = {
          id: parsedPersona.id,
          name: parsedPersona.name,
          personality: parsedPersona.personality,
          communicationStyle: parsedPersona.communicationStyle,
          expertiseAreas: parsedPersona.expertiseAreas,
          interactionPreferences: parsedPersona.interactionPreferences,
          behaviorRules: parsedPersona.behaviorRules,
          customInstructions: parsedPersona.customInstructions
        };
        
        // Store as EnhancedPersona if sections exist
        const enhancedPersona = persona as EnhancedPersona;
        if (parsedPersona.sections || parsedPersona.metadata) {
          enhancedPersona.markdownContent = parsedPersona.markdownContent;
          enhancedPersona.metadata = parsedPersona.metadata;
          enhancedPersona.sections = parsedPersona.sections;
        }
        
        this.personas.set(persona.id, enhancedPersona);
        loadedCount++;
      }
      
      console.log(`✅ Loaded ${loadedCount} personas from markdown files`);
      this.initialized = true;
    } catch (error) {
      console.warn('Markdown persona loading failed, using defaults only:', error);
      this.initialized = true; // Mark as initialized even if loading failed
    }
  }
  
  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Poll until initialized (with timeout)
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (!this.initialized && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.initialized) {
      console.warn('PersonaManager initialization timeout, proceeding with defaults');
      this.initialized = true;
    }
  }
  
  /**
   * Gets a persona by ID
   * Optimized version with lazy TOON optimization loading
   * @param id Persona ID
   * @param optimizeForTOON Whether to return TOON-optimized persona
   * @returns The persona or undefined if not found
   */
  async getPersona(id: string, optimizeForTOON: boolean = false): Promise<Persona | undefined | any> {
    // Fast path: return immediately if no TOON optimization needed
    if (!optimizeForTOON || !this.enableTOONOptimization) {
      return this.personas.get(id);
    }

    const persona = this.personas.get(id);
    if (!persona) {
      return undefined;
    }

    // Lazy load TOON optimizer only when needed
    try {
      const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
      return personaTOONOptimizer.optimizePersona(persona);
    } catch (error) {
      console.warn('TOON optimization failed, returning original persona:', error);
      return persona;
    }
  }
  
  /**
   * Gets an enhanced persona by ID (with markdown content)
   * @param id Persona ID
   * @param optimizeForTOON Whether to return TOON-optimized persona
   * @returns The enhanced persona or undefined if not found
   */
  async getEnhancedPersona(id: string, optimizeForTOON: boolean = false): Promise<EnhancedPersona | undefined | any> {
    const persona = this.personas.get(id);
    if (!persona) {
      return undefined;
    }

    const enhanced = 'sections' in persona 
      ? persona as EnhancedPersona
      : { ...persona, sections: {}, metadata: {} } as EnhancedPersona;

    if (optimizeForTOON && this.enableTOONOptimization) {
      try {
        const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
        return personaTOONOptimizer.optimizePersona(enhanced);
      } catch (error) {
        console.warn('TOON optimization failed, returning original persona:', error);
        return enhanced;
      }
    }

    return enhanced;
  }
  
  /**
   * Reload personas from markdown files
   */
  async reloadMarkdownPersonas(): Promise<void> {
    if (!this.enableMarkdownLoading) {
      throw new Error('Markdown persona loading is disabled');
    }
    
    this.initialized = false;
    await this.loadMarkdownPersonas();
  }
  
  /**
   * Creates a new persona
   * @param persona The persona to create
   * @returns The created persona
   */
  /**
   * Validates a persona object
   * @param persona Persona to validate
   * @throws Error if validation fails
   */
  private validatePersona(persona: Persona): void {
    if (!persona.id || typeof persona.id !== 'string' || persona.id.trim().length === 0) {
      throw new Error('Valid persona id is required');
    }
    
    if (!persona.name || typeof persona.name !== 'string' || persona.name.trim().length === 0) {
      throw new Error('Valid persona name is required');
    }
    
    if (!persona.personality || typeof persona.personality !== 'string' || persona.personality.trim().length === 0) {
      throw new Error('Valid persona personality is required');
    }
    
    if (!persona.communicationStyle || typeof persona.communicationStyle !== 'string' || persona.communicationStyle.trim().length === 0) {
      throw new Error('Valid persona communicationStyle is required');
    }
    
    if (!Array.isArray(persona.expertiseAreas)) {
      throw new Error('Persona expertiseAreas must be an array');
    }
    
    if (!persona.interactionPreferences || typeof persona.interactionPreferences !== 'object') {
      throw new Error('Valid persona interactionPreferences is required');
    }
    
    if (!Array.isArray(persona.behaviorRules)) {
      throw new Error('Persona behaviorRules must be an array');
    }
    
    if (typeof persona.customInstructions !== 'string') {
      throw new Error('Valid persona customInstructions is required');
    }
  }
  
  createPersona(persona: Persona): Persona {
    if (!this.enableDynamicPersonas) {
      throw new Error('Dynamic persona creation is disabled');
    }
    
    // Validate persona before creating
    this.validatePersona(persona);
    
    this.personas.set(persona.id, persona);
    console.log(`Created new persona: ${persona.name} (${persona.id})`);
    return persona;
  }
  
  /**
   * Updates an existing persona
   * @param id Persona ID
   * @param updates Partial persona updates
   * @returns The updated persona
   */
  updatePersona(id: string, updates: Partial<Persona>): Persona | undefined {
    if (!this.enableDynamicPersonas) {
      throw new Error('Dynamic persona updates are disabled');
    }
    
    const existing = this.personas.get(id);
    if (!existing) {
      return undefined;
    }
    
    // Create updated persona object for validation
    const updated = { ...existing, ...updates };
    
    // Validate updated persona
    try {
      this.validatePersona(updated);
    } catch (error) {
      console.error('Persona validation failed:', error);
      throw error;
    }
    
    this.personas.set(id, updated);
    console.log(`Updated persona: ${existing.name} (${id})`);
    return updated;
  }
  
  /**
   * Deletes a persona
   * @param id Persona ID
   * @returns Boolean indicating success
   */
  deletePersona(id: string): boolean {
    if (!this.enableDynamicPersonas) {
      throw new Error('Dynamic persona deletion is disabled');
    }
    
    const result = this.personas.delete(id);
    if (result) {
      console.log(`Deleted persona with ID: ${id}`);
    }
    return result;
  }
  
  /**
   * Lists all personas
   * Optimized version with efficient array handling
   * @param optimizeForTOON Whether to return TOON-optimized personas
   * @returns Array of all personas (optionally TOON-optimized)
   */
  async listPersonas(optimizeForTOON: boolean = false): Promise<Persona[] | any[]> {
    // Fast path: return immediately if no TOON optimization needed
    if (!optimizeForTOON || !this.enableTOONOptimization) {
      return Array.from(this.personas.values());
    }

    const personas = Array.from(this.personas.values());
    
    // Only optimize if we have enough personas (TOON is more efficient for 3+)
    if (personas.length < 3) {
      return personas;
    }

    try {
      const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
      const result = personaTOONOptimizer.optimizePersonaList(personas);
      return result.optimized;
    } catch (error) {
      console.warn('TOON optimization failed, returning original personas:', error);
      return personas;
    }
  }
  
  /**
   * Gets personas by expertise area
   * Optimized version with efficient filtering and TOON optimization
   * @param expertiseArea Expertise area to filter by
   * @param optimizeForTOON Whether to return TOON-optimized personas
   * @returns Array of matching personas (optionally TOON-optimized)
   */
  async getPersonasByExpertise(expertiseArea: string, optimizeForTOON: boolean = false): Promise<Persona[] | any[]> {
    // Optimized: use lowercase search term once
    const searchTerm = expertiseArea.toLowerCase();
    
    // Optimized: filter with early exit
    const matching = Array.from(this.personas.values()).filter(persona =>
      persona.expertiseAreas.some(area => 
        area.toLowerCase().includes(searchTerm)
      )
    );

    // Fast path: return immediately if no TOON optimization needed or not enough results
    if (!optimizeForTOON || !this.enableTOONOptimization || matching.length === 0 || matching.length < 3) {
      return matching;
    }

    try {
      const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
      const result = personaTOONOptimizer.optimizePersonaList(matching);
      return result.optimized;
    } catch (error) {
      console.warn('TOON optimization failed, returning original personas:', error);
      return matching;
    }
  }

  /**
   * Creates a hybrid persona from multiple base personas
   * @param basePersonaIds Array of persona IDs to merge
   * @param options Optional configuration for hybrid generation
   * @returns The created hybrid persona
   */
  async createHybridPersona(
    basePersonaIds: string[],
    options?: {
      weights?: number[];
      targetExpertise?: string[];
      tokenOptimization?: 'minimal' | 'balanced' | 'maximum';
    }
  ): Promise<EnhancedPersona> {
    // Dynamic import to avoid circular dependencies
    const { hybridPersonaGenerator } = await import('./hybrid-persona-generator.ts');
    
    const result = await hybridPersonaGenerator.generateHybridPersona({
      basePersonas: basePersonaIds,
      weights: options?.weights,
      targetExpertise: options?.targetExpertise,
      tokenOptimization: options?.tokenOptimization || 'balanced',
      enableTOON: true,
      mergeStrategy: 'intelligent'
    });

    // Store the hybrid persona
    this.personas.set(result.persona.id, result.persona);
    console.log(`✅ Created hybrid persona: ${result.persona.name} (${result.persona.id})`);
    if (result.tokenReduction) {
      console.log(`   Token reduction: ${result.tokenReduction.toFixed(1)}%`);
    }

    return result.persona;
  }

  /**
   * Self-generate hybrid persona based on task requirements
   * @param taskDescription Description of the task
   * @param requiredExpertise Required expertise areas
   * @returns The generated hybrid persona
   */
  async selfGenerateHybridPersona(
    taskDescription: string,
    requiredExpertise: string[]
  ): Promise<EnhancedPersona> {
    // Dynamic import to avoid circular dependencies
    const { hybridPersonaGenerator } = await import('./hybrid-persona-generator.ts');
    
    const result = await hybridPersonaGenerator.selfGenerateHybridPersona(
      taskDescription,
      requiredExpertise
    );

    // Store the hybrid persona
    this.personas.set(result.persona.id, result.persona);
    console.log(`✅ Self-generated hybrid persona: ${result.persona.name} (${result.persona.id})`);
    if (result.tokenReduction) {
      console.log(`   Token reduction: ${result.tokenReduction.toFixed(1)}%`);
    }

    return result.persona;
  }
  
  /**
   * Gets persona optimized for LLM transmission
   * @param personaId Persona ID
   * @returns TOON-optimized persona data for LLM
   */
  async getPersonaForLLM(personaId: string): Promise<Record<string, any> | undefined> {
    const persona = this.personas.get(personaId);
    if (!persona) {
      return undefined;
    }

    if (this.enableTOONOptimization) {
      try {
        const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
        return personaTOONOptimizer.optimizeForLLM(persona);
      } catch (error) {
        console.warn('TOON optimization failed, returning original persona:', error);
        return persona as any;
      }
    }

    return persona as any;
  }

  /**
   * Applies a persona to an agent interaction
   * @param personaId Persona ID
   * @param content Content to apply persona to
   * @returns Persona-adjusted content
   */
  applyPersonaToContent(personaId: string, content: string): string {
    const persona = this.personas.get(personaId);
    if (!persona) {
      console.warn(`Persona with ID ${personaId} not found, returning original content`);
      return content;
    }
    
    // Apply communication style adjustments
    let adjustedContent = content;
    
    // Adjust verbosity
    switch (persona.interactionPreferences.verbosity) {
      case 'concise':
        // Simplified implementation - in reality this would use NLP processing
        adjustedContent = content.split('. ').slice(0, Math.max(1, Math.floor(content.split('. ').length / 2))).join('. ') + '.';
        break;
      case 'detailed':
        // Add more detail (simplified implementation)
        adjustedContent = content.replace(/(\. )/g, '. Additionally, ');
        break;
      // 'moderate' is default, no adjustment needed
    }
    
    // Apply tone adjustments
    switch (persona.interactionPreferences.tone) {
      case 'enthusiastic':
        adjustedContent = adjustedContent.replace(/\./g, '!').replace(/,/g, ', wow,');
        break;
      case 'analytical':
        adjustedContent = `After analyzing the situation, ${adjustedContent.toLowerCase()}`;
        break;
      case 'friendly':
        adjustedContent = `Hey there! ${adjustedContent} Hope that helps!`;
        break;
      // 'neutral' is default, no adjustment needed
    }
    
    return adjustedContent;
  }
  
  /**
   * Gets default personas for LAPA agents
   * @returns Record of default personas
   */
  private getDefaultPersonas(): Record<string, Persona> {
    return {
      'planner-default': {
        id: 'planner-default',
        name: 'Strategic Planner',
        personality: 'Analytical, methodical, and detail-oriented',
        communicationStyle: 'Structured and comprehensive',
        expertiseAreas: ['project planning', 'task decomposition', 'requirement analysis'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'detailed',
          tone: 'analytical'
        },
        behaviorRules: [
          'Always break down complex tasks into smaller subtasks',
          'Identify dependencies between tasks',
          'Consider multiple approaches before recommending one'
        ],
        customInstructions: 'Focus on creating clear, actionable plans with well-defined milestones.'
      },
      'coder-default': {
        id: 'coder-default',
        name: 'Expert Coder',
        personality: 'Precise, logical, and efficient',
        communicationStyle: 'Technical and concise',
        expertiseAreas: ['software development', 'coding best practices', 'algorithm design'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'concise',
          tone: 'neutral'
        },
        behaviorRules: [
          'Write clean, readable, and well-documented code',
          'Follow established coding standards and conventions',
          'Optimize for performance and maintainability'
        ],
        customInstructions: 'Prioritize code quality, readability, and adherence to best practices.'
      },
      'reviewer-default': {
        id: 'reviewer-default',
        name: 'Quality Guardian',
        personality: 'Critical, thorough, and constructive',
        communicationStyle: 'Detailed and educational',
        expertiseAreas: ['code review', 'quality assurance', 'best practices'],
        interactionPreferences: {
          formality: 'formal',
          verbosity: 'detailed',
          tone: 'analytical'
        },
        behaviorRules: [
          'Identify potential issues and improvement opportunities',
          'Provide constructive feedback with explanations',
          'Ensure adherence to coding standards'
        ],
        customInstructions: 'Focus on improving code quality through detailed, actionable feedback.'
      },
      'debugger-default': {
        id: 'debugger-default',
        name: 'Bug Hunter',
        personality: 'Investigative, patient, and systematic',
        communicationStyle: 'Methodical and precise',
        expertiseAreas: ['debugging', 'troubleshooting', 'root cause analysis'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'moderate',
          tone: 'analytical'
        },
        behaviorRules: [
          'Reproduce issues systematically',
          'Isolate root causes through elimination',
          'Provide clear steps for resolution'
        ],
        customInstructions: 'Focus on systematic debugging and clear, actionable solutions.'
      },
      'optimizer-default': {
        id: 'optimizer-default',
        name: 'Performance Wizard',
        personality: 'Efficiency-focused, innovative, and data-driven',
        communicationStyle: 'Technical and metrics-oriented',
        expertiseAreas: ['performance optimization', 'resource management', 'efficiency'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'concise',
          tone: 'enthusiastic'
        },
        behaviorRules: [
          'Measure performance before and after optimizations',
          'Focus on impactful improvements',
          'Consider trade-offs between performance and maintainability'
        ],
        customInstructions: 'Prioritize measurable performance improvements with clear metrics.'
      },
      'tester-default': {
        id: 'tester-default',
        name: 'Test Architect',
        personality: 'Thorough, systematic, and quality-focused',
        communicationStyle: 'Structured and comprehensive',
        expertiseAreas: ['testing', 'test automation', 'quality assurance'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'detailed',
          tone: 'neutral'
        },
        behaviorRules: [
          'Design comprehensive test coverage',
          'Automate repetitive testing tasks',
          'Report issues with clear reproduction steps'
        ],
        customInstructions: 'Ensure comprehensive test coverage and clear issue reporting.'
      }
    };
  }
}

// Export singleton instance
export const personaManager = new PersonaManager();