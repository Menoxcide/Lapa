"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const persona_manager_ts_1 = require("../../agents/persona.manager.ts");
(0, vitest_1.describe)('PersonaManager', () => {
    let personaManager;
    beforeEach(() => {
        personaManager = new persona_manager_ts_1.PersonaManager();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default personas', () => {
            const personas = personaManager.listPersonas();
            (0, vitest_1.expect)(personas.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should accept custom configuration', () => {
            const customPersonas = {
                'custom-1': {
                    id: 'custom-1',
                    name: 'Custom Persona',
                    personality: 'Friendly and helpful',
                    communicationStyle: 'Casual',
                    expertiseAreas: ['general'],
                    interactionPreferences: {
                        formality: 'casual',
                        verbosity: 'moderate',
                        tone: 'friendly'
                    },
                    behaviorRules: ['Be helpful', 'Be respectful'],
                    customInstructions: 'Always be friendly'
                }
            };
            const customManager = new persona_manager_ts_1.PersonaManager({
                defaultPersonas: customPersonas,
                enableDynamicPersonas: true
            });
            const personas = customManager.listPersonas();
            (0, vitest_1.expect)(personas).toHaveLength(1);
            (0, vitest_1.expect)(personas[0].id).toBe('custom-1');
        });
    });
    (0, vitest_1.describe)('getPersona', () => {
        (0, vitest_1.it)('should return a persona by ID', () => {
            const persona = personaManager.getPersona('coder-default');
            (0, vitest_1.expect)(persona).toBeDefined();
            (0, vitest_1.expect)(persona?.id).toBe('coder-default');
            (0, vitest_1.expect)(persona?.name).toBe('Expert Coder');
        });
        (0, vitest_1.it)('should return undefined for non-existent persona', () => {
            const persona = personaManager.getPersona('non-existent');
            (0, vitest_1.expect)(persona).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('createPersona', () => {
        (0, vitest_1.it)('should create a new persona when dynamic personas are enabled', () => {
            const newPersona = {
                id: 'new-persona',
                name: 'New Persona',
                personality: 'Innovative and creative',
                communicationStyle: 'Technical',
                expertiseAreas: ['innovation'],
                interactionPreferences: {
                    formality: 'technical',
                    verbosity: 'concise',
                    tone: 'enthusiastic'
                },
                behaviorRules: ['Think outside the box'],
                customInstructions: 'Focus on innovation'
            };
            const created = personaManager.createPersona(newPersona);
            (0, vitest_1.expect)(created).toEqual(newPersona);
            const retrieved = personaManager.getPersona('new-persona');
            (0, vitest_1.expect)(retrieved).toEqual(newPersona);
        });
        (0, vitest_1.it)('should throw error when creating persona with dynamic personas disabled', () => {
            const restrictedManager = new persona_manager_ts_1.PersonaManager({
                enableDynamicPersonas: false
            });
            const newPersona = {
                id: 'restricted-persona',
                name: 'Restricted Persona',
                personality: 'Limited',
                communicationStyle: 'Basic',
                expertiseAreas: ['general'],
                interactionPreferences: {
                    formality: 'casual',
                    verbosity: 'moderate',
                    tone: 'neutral'
                },
                behaviorRules: ['Follow rules'],
                customInstructions: 'Stay within limits'
            };
            (0, vitest_1.expect)(() => restrictedManager.createPersona(newPersona))
                .toThrow('Dynamic persona creation is disabled');
        });
    });
    (0, vitest_1.describe)('updatePersona', () => {
        (0, vitest_1.it)('should update an existing persona', () => {
            const updates = {
                name: 'Updated Coder',
                personality: 'Enhanced precision'
            };
            const updated = personaManager.updatePersona('coder-default', updates);
            (0, vitest_1.expect)(updated).toBeDefined();
            (0, vitest_1.expect)(updated?.name).toBe('Updated Coder');
            (0, vitest_1.expect)(updated?.personality).toBe('Enhanced precision');
        });
        (0, vitest_1.it)('should return undefined when updating non-existent persona', () => {
            const updated = personaManager.updatePersona('non-existent', { name: 'New Name' });
            (0, vitest_1.expect)(updated).toBeUndefined();
        });
        (0, vitest_1.it)('should throw error when updating persona with dynamic personas disabled', () => {
            const restrictedManager = new persona_manager_ts_1.PersonaManager({
                enableDynamicPersonas: false
            });
            (0, vitest_1.expect)(() => restrictedManager.updatePersona('coder-default', { name: 'New Name' }))
                .toThrow('Dynamic persona updates are disabled');
        });
    });
    (0, vitest_1.describe)('deletePersona', () => {
        (0, vitest_1.it)('should delete an existing persona', () => {
            // First create a persona to delete
            const personaToDelete = {
                id: 'delete-me',
                name: 'Temporary Persona',
                personality: 'Short-lived',
                communicationStyle: 'Brief',
                expertiseAreas: ['temporary'],
                interactionPreferences: {
                    formality: 'casual',
                    verbosity: 'concise',
                    tone: 'neutral'
                },
                behaviorRules: ['Exist temporarily'],
                customInstructions: 'Delete after use'
            };
            personaManager.createPersona(personaToDelete);
            (0, vitest_1.expect)(personaManager.getPersona('delete-me')).toBeDefined();
            const result = personaManager.deletePersona('delete-me');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(personaManager.getPersona('delete-me')).toBeUndefined();
        });
        (0, vitest_1.it)('should return false when deleting non-existent persona', () => {
            const result = personaManager.deletePersona('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should throw error when deleting persona with dynamic personas disabled', () => {
            const restrictedManager = new persona_manager_ts_1.PersonaManager({
                enableDynamicPersonas: false
            });
            (0, vitest_1.expect)(() => restrictedManager.deletePersona('coder-default'))
                .toThrow('Dynamic persona deletion is disabled');
        });
    });
    (0, vitest_1.describe)('listPersonas', () => {
        (0, vitest_1.it)('should return all personas', () => {
            const personas = personaManager.listPersonas();
            (0, vitest_1.expect)(personas.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(personas.some(p => p.id === 'coder-default')).toBe(true);
            (0, vitest_1.expect)(personas.some(p => p.id === 'reviewer-default')).toBe(true);
        });
    });
    (0, vitest_1.describe)('getPersonasByExpertise', () => {
        (0, vitest_1.it)('should return personas matching expertise area', () => {
            const coderPersonas = personaManager.getPersonasByExpertise('coding');
            (0, vitest_1.expect)(coderPersonas.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(coderPersonas.some(p => p.id === 'coder-default')).toBe(true);
        });
        (0, vitest_1.it)('should handle case insensitive matching', () => {
            const personas = personaManager.getPersonasByExpertise('CODING');
            (0, vitest_1.expect)(personas.some(p => p.id === 'coder-default')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array for non-matching expertise', () => {
            const personas = personaManager.getPersonasByExpertise('non-existent-expertise');
            (0, vitest_1.expect)(personas).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('applyPersonaToContent', () => {
        (0, vitest_1.it)('should apply persona adjustments to content', () => {
            const content = 'This is a test message.';
            // Test with concise verbosity
            const conciseContent = personaManager.applyPersonaToContent('coder-default', content);
            (0, vitest_1.expect)(conciseContent).toBeDefined();
            // Test with enthusiastic tone
            const enthusiasticContent = personaManager.applyPersonaToContent('optimizer-default', content);
            (0, vitest_1.expect)(enthusiasticContent).toContain('!');
            // Test with analytical tone
            const analyticalContent = personaManager.applyPersonaToContent('planner-default', content);
            (0, vitest_1.expect)(analyticalContent).toMatch(/^After analyzing the situation/i);
        });
        (0, vitest_1.it)('should return original content for non-existent persona', () => {
            const content = 'This is a test message.';
            const result = personaManager.applyPersonaToContent('non-existent', content);
            (0, vitest_1.expect)(result).toBe(content);
        });
    });
    (0, vitest_1.describe)('getDefaultPersonas', () => {
        (0, vitest_1.it)('should provide all default personas', () => {
            // Access private method through casting
            const defaultPersonas = personaManager.getDefaultPersonas();
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('planner-default');
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('coder-default');
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('reviewer-default');
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('debugger-default');
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('optimizer-default');
            (0, vitest_1.expect)(defaultPersonas).toHaveProperty('tester-default');
            // Check that each has required properties
            Object.values(defaultPersonas).forEach(persona => {
                (0, vitest_1.expect)(persona).toHaveProperty('id');
                (0, vitest_1.expect)(persona).toHaveProperty('name');
                (0, vitest_1.expect)(persona).toHaveProperty('personality');
                (0, vitest_1.expect)(persona).toHaveProperty('communicationStyle');
                (0, vitest_1.expect)(persona).toHaveProperty('expertiseAreas');
                (0, vitest_1.expect)(persona).toHaveProperty('interactionPreferences');
                (0, vitest_1.expect)(persona).toHaveProperty('behaviorRules');
                (0, vitest_1.expect)(persona).toHaveProperty('customInstructions');
            });
        });
    });
});
//# sourceMappingURL=persona.manager.test.js.map