/**
 * Tests for PERSONA_EVOLVER - Autonomous Persona Evolution Agent
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersonaEvolver, personaEvolver } from '../../orchestrator/persona-evolver.ts';
import { personaManager } from '../../agents/persona.manager.ts';
import { SelfImprovementSystem } from '../../orchestrator/self-improvement.ts';
import type { Persona } from '../../agents/persona.manager.ts';

describe('PersonaEvolver', () => {
  let evolver: PersonaEvolver;
  let selfImprovement: SelfImprovementSystem;

  beforeEach(() => {
    selfImprovement = new SelfImprovementSystem();
    evolver = new PersonaEvolver(
      {
        enableAutonomousEvolution: false, // Disable for testing
        evolutionInterval: 1000
      },
      selfImprovement
    );
  });

  afterEach(() => {
    evolver.stop();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(evolver.initialize()).resolves.not.toThrow();
    });

    it('should create singleton instance', () => {
      expect(personaEvolver).toBeInstanceOf(PersonaEvolver);
    });
  });

  describe('Persona Analysis', () => {
    it('should analyze personas', async () => {
      await evolver.initialize();
      await evolver.analyzeAllPersonas();

      const personas = await personaManager.listPersonas();
      expect(personas.length).toBeGreaterThan(0);

      for (const persona of personas) {
        const analysis = evolver.getPersonaAnalysis(persona.id);
        expect(analysis).toBeDefined();
        expect(analysis?.personaId).toBe(persona.id);
      }
    });

    it('should calculate consistency scores', async () => {
      await evolver.initialize();
      
      const testPersona: Persona = {
        id: 'test-persona',
        name: 'Test Persona',
        personality: 'Test personality',
        communicationStyle: 'Test style',
        expertiseAreas: ['test'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'moderate',
          tone: 'neutral'
        },
        behaviorRules: ['rule1', 'rule2'],
        customInstructions: 'Test instructions'
      };

      personaManager.createPersona(testPersona);
      await evolver.analyzeAllPersonas();

      const analysis = evolver.getPersonaAnalysis('test-persona');
      expect(analysis).toBeDefined();
      expect(analysis?.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(analysis?.consistencyScore).toBeLessThanOrEqual(1);
    });

    it('should calculate completeness scores', async () => {
      await evolver.initialize();
      
      const testPersona: Persona = {
        id: 'test-persona-complete',
        name: 'Complete Persona',
        personality: 'Test personality',
        communicationStyle: 'Test style',
        expertiseAreas: ['test1', 'test2', 'test3'],
        interactionPreferences: {
          formality: 'technical',
          verbosity: 'moderate',
          tone: 'neutral'
        },
        behaviorRules: ['rule1', 'rule2', 'rule3', 'rule4'],
        customInstructions: 'Test instructions with sufficient length for completeness'
      };

      personaManager.createPersona(testPersona);
      await evolver.analyzeAllPersonas();

      const analysis = evolver.getPersonaAnalysis('test-persona-complete');
      expect(analysis).toBeDefined();
      expect(analysis?.completenessScore).toBeGreaterThan(0.5);
      expect(analysis?.completenessScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Evolution Cycle', () => {
    it('should run evolution cycle', async () => {
      await evolver.initialize();
      await evolver.analyzeAllPersonas();
      
      await expect(evolver.runEvolutionCycle()).resolves.not.toThrow();
    });

    it('should identify evolution opportunities', async () => {
      await evolver.initialize();
      await evolver.analyzeAllPersonas();

      const opportunities = await (evolver as any).identifyEvolutionOpportunities();
      expect(Array.isArray(opportunities)).toBe(true);
    });

    it('should trigger evolution cycle manually', async () => {
      await evolver.initialize();
      
      await expect(evolver.triggerEvolutionCycle()).resolves.not.toThrow();
    });
  });

  describe('Evolution History', () => {
    it('should track evolution history', async () => {
      await evolver.initialize();
      await evolver.analyzeAllPersonas();
      
      const personas = await personaManager.listPersonas();
      if (personas.length > 0) {
        const personaId = personas[0].id;
        const history = evolver.getEvolutionHistory(personaId);
        expect(Array.isArray(history)).toBe(true);
      }
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultEvolver = new PersonaEvolver();
      expect(defaultEvolver).toBeInstanceOf(PersonaEvolver);
    });

    it('should accept custom configuration', () => {
      const customEvolver = new PersonaEvolver({
        enableAutonomousEvolution: false,
        improvementThreshold: 0.1
      });
      expect(customEvolver).toBeInstanceOf(PersonaEvolver);
    });
  });
});

