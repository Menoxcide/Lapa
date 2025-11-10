import { describe, it, expect } from "vitest";
import { PersonaManager, Persona } from '../../agents/persona.manager.ts';

describe('PersonaManager', () => {
  let personaManager: PersonaManager;

  beforeEach(() => {
    personaManager = new PersonaManager();
  });

  describe('constructor', () => {
    it('should initialize with default personas', () => {
      const personas = personaManager.listPersonas();
      expect(personas.length).toBeGreaterThan(0);
    });

    it('should accept custom configuration', () => {
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
        } as Persona
      };

      const customManager = new PersonaManager({
        defaultPersonas: customPersonas,
        enableDynamicPersonas: true
      });

      const personas = customManager.listPersonas();
      expect(personas).toHaveLength(1);
      expect(personas[0].id).toBe('custom-1');
    });
  });

  describe('getPersona', () => {
    it('should return a persona by ID', () => {
      const persona = personaManager.getPersona('coder-default');
      expect(persona).toBeDefined();
      expect(persona?.id).toBe('coder-default');
      expect(persona?.name).toBe('Expert Coder');
    });

    it('should return undefined for non-existent persona', () => {
      const persona = personaManager.getPersona('non-existent');
      expect(persona).toBeUndefined();
    });
  });

  describe('createPersona', () => {
    it('should create a new persona when dynamic personas are enabled', () => {
      const newPersona: Persona = {
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
      expect(created).toEqual(newPersona);
      
      const retrieved = personaManager.getPersona('new-persona');
      expect(retrieved).toEqual(newPersona);
    });

    it('should throw error when creating persona with dynamic personas disabled', () => {
      const restrictedManager = new PersonaManager({
        enableDynamicPersonas: false
      });

      const newPersona: Persona = {
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

      expect(() => restrictedManager.createPersona(newPersona))
        .toThrow('Dynamic persona creation is disabled');
    });
  });

  describe('updatePersona', () => {
    it('should update an existing persona', () => {
      const updates = {
        name: 'Updated Coder',
        personality: 'Enhanced precision'
      };

      const updated = personaManager.updatePersona('coder-default', updates);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Coder');
      expect(updated?.personality).toBe('Enhanced precision');
    });

    it('should return undefined when updating non-existent persona', () => {
      const updated = personaManager.updatePersona('non-existent', { name: 'New Name' });
      expect(updated).toBeUndefined();
    });

    it('should throw error when updating persona with dynamic personas disabled', () => {
      const restrictedManager = new PersonaManager({
        enableDynamicPersonas: false
      });

      expect(() => restrictedManager.updatePersona('coder-default', { name: 'New Name' }))
        .toThrow('Dynamic persona updates are disabled');
    });
  });

  describe('deletePersona', () => {
    it('should delete an existing persona', () => {
      // First create a persona to delete
      const personaToDelete: Persona = {
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
      expect(personaManager.getPersona('delete-me')).toBeDefined();

      const result = personaManager.deletePersona('delete-me');
      expect(result).toBe(true);
      expect(personaManager.getPersona('delete-me')).toBeUndefined();
    });

    it('should return false when deleting non-existent persona', () => {
      const result = personaManager.deletePersona('non-existent');
      expect(result).toBe(false);
    });

    it('should throw error when deleting persona with dynamic personas disabled', () => {
      const restrictedManager = new PersonaManager({
        enableDynamicPersonas: false
      });

      expect(() => restrictedManager.deletePersona('coder-default'))
        .toThrow('Dynamic persona deletion is disabled');
    });
  });

  describe('listPersonas', () => {
    it('should return all personas', () => {
      const personas = personaManager.listPersonas();
      expect(personas.length).toBeGreaterThan(0);
      expect(personas.some(p => p.id === 'coder-default')).toBe(true);
      expect(personas.some(p => p.id === 'reviewer-default')).toBe(true);
    });
  });

  describe('getPersonasByExpertise', () => {
    it('should return personas matching expertise area', () => {
      const coderPersonas = personaManager.getPersonasByExpertise('coding');
      expect(coderPersonas.length).toBeGreaterThan(0);
      expect(coderPersonas.some(p => p.id === 'coder-default')).toBe(true);
    });

    it('should handle case insensitive matching', () => {
      const personas = personaManager.getPersonasByExpertise('CODING');
      expect(personas.some(p => p.id === 'coder-default')).toBe(true);
    });

    it('should return empty array for non-matching expertise', () => {
      const personas = personaManager.getPersonasByExpertise('non-existent-expertise');
      expect(personas).toHaveLength(0);
    });
  });

  describe('applyPersonaToContent', () => {
    it('should apply persona adjustments to content', () => {
      const content = 'This is a test message.';
      
      // Test with concise verbosity
      const conciseContent = personaManager.applyPersonaToContent('coder-default', content);
      expect(conciseContent).toBeDefined();
      
      // Test with enthusiastic tone
      const enthusiasticContent = personaManager.applyPersonaToContent('optimizer-default', content);
      expect(enthusiasticContent).toContain('!');
      
      // Test with analytical tone
      const analyticalContent = personaManager.applyPersonaToContent('planner-default', content);
      expect(analyticalContent).toMatch(/^After analyzing the situation/i);
    });

    it('should return original content for non-existent persona', () => {
      const content = 'This is a test message.';
      const result = personaManager.applyPersonaToContent('non-existent', content);
      expect(result).toBe(content);
    });
  });

  describe('getDefaultPersonas', () => {
    it('should provide all default personas', () => {
      // Access private method through casting
      const defaultPersonas = (personaManager as any).getDefaultPersonas();
      
      expect(defaultPersonas).toHaveProperty('planner-default');
      expect(defaultPersonas).toHaveProperty('coder-default');
      expect(defaultPersonas).toHaveProperty('reviewer-default');
      expect(defaultPersonas).toHaveProperty('debugger-default');
      expect(defaultPersonas).toHaveProperty('optimizer-default');
      expect(defaultPersonas).toHaveProperty('tester-default');
      
      // Check that each has required properties
      Object.values(defaultPersonas).forEach(persona => {
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('personality');
        expect(persona).toHaveProperty('communicationStyle');
        expect(persona).toHaveProperty('expertiseAreas');
        expect(persona).toHaveProperty('interactionPreferences');
        expect(persona).toHaveProperty('behaviorRules');
        expect(persona).toHaveProperty('customInstructions');
      });
    });
  });
});