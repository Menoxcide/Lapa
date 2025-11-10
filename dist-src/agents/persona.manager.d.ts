/**
 * Persona Manager for LAPA Agents
 *
 * This module manages agent personas, including their personalities, behaviors,
 * and communication styles. It allows for dynamic persona configuration and
 * customization of agent interactions.
 */
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
export interface PersonaConfig {
    defaultPersonas?: Record<string, Persona>;
    enableDynamicPersonas?: boolean;
    personaStoragePath?: string;
}
/**
 * LAPA Persona Manager
 */
export declare class PersonaManager {
    private personas;
    private defaultPersonas;
    private enableDynamicPersonas;
    private personaStoragePath;
    constructor(config?: PersonaConfig);
    /**
     * Initializes the manager with default personas
     */
    private initializeDefaultPersonas;
    /**
     * Gets a persona by ID
     * @param id Persona ID
     * @returns The persona or undefined if not found
     */
    getPersona(id: string): Persona | undefined;
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
    private validatePersona;
    createPersona(persona: Persona): Persona;
    /**
     * Updates an existing persona
     * @param id Persona ID
     * @param updates Partial persona updates
     * @returns The updated persona
     */
    updatePersona(id: string, updates: Partial<Persona>): Persona | undefined;
    /**
     * Deletes a persona
     * @param id Persona ID
     * @returns Boolean indicating success
     */
    deletePersona(id: string): boolean;
    /**
     * Lists all personas
     * @returns Array of all personas
     */
    listPersonas(): Persona[];
    /**
     * Gets personas by expertise area
     * @param expertiseArea Expertise area to filter by
     * @returns Array of matching personas
     */
    getPersonasByExpertise(expertiseArea: string): Persona[];
    /**
     * Applies a persona to an agent interaction
     * @param personaId Persona ID
     * @param content Content to apply persona to
     * @returns Persona-adjusted content
     */
    applyPersonaToContent(personaId: string, content: string): string;
    /**
     * Gets default personas for LAPA agents
     * @returns Record of default personas
     */
    private getDefaultPersonas;
}
export declare const personaManager: PersonaManager;
