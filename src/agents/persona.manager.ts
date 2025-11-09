/**
 * Persona Manager for LAPA Agents
 * 
 * This module manages agent personas, including their personalities, behaviors,
 * and communication styles. It allows for dynamic persona configuration and
 * customization of agent interactions.
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

// Persona configuration options
export interface PersonaConfig {
  defaultPersonas?: Record<string, Persona>;
  enableDynamicPersonas?: boolean;
  personaStoragePath?: string;
}

/**
 * LAPA Persona Manager
 */
export class PersonaManager {
  private personas: Map<string, Persona> = new Map();
  private defaultPersonas: Record<string, Persona>;
  private enableDynamicPersonas: boolean;
  private personaStoragePath: string;
  
  constructor(config: PersonaConfig = {}) {
    this.defaultPersonas = config.defaultPersonas || this.getDefaultPersonas();
    this.enableDynamicPersonas = config.enableDynamicPersonas ?? true;
    this.personaStoragePath = config.personaStoragePath || '.lapa/personas';
    
    // Initialize with default personas
    this.initializeDefaultPersonas();
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
   * Gets a persona by ID
   * @param id Persona ID
   * @returns The persona or undefined if not found
   */
  getPersona(id: string): Persona | undefined {
    return this.personas.get(id);
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
   * @returns Array of all personas
   */
  listPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }
  
  /**
   * Gets personas by expertise area
   * @param expertiseArea Expertise area to filter by
   * @returns Array of matching personas
   */
  getPersonasByExpertise(expertiseArea: string): Persona[] {
    return Array.from(this.personas.values()).filter(persona =>
      persona.expertiseAreas.some(area => 
        area.toLowerCase().includes(expertiseArea.toLowerCase())
      )
    );
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