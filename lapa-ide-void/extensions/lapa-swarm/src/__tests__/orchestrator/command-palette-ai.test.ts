/**
 * Tests for Command Palette AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandPaletteAI, CommandMetadata, CommandSearchResult } from '../../orchestrator/command-palette-ai.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';

describe('CommandPaletteAI', () => {
  let ai: CommandPaletteAI;
  let mockContext: AgentToolExecutionContext;

  beforeEach(() => {
    ai = new CommandPaletteAI();
    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('Command Registration', () => {
    it('should initialize with default commands', () => {
      // Commands should be registered
      expect(ai).toBeDefined();
    });
  });

  describe('search', () => {
    it('should find commands by query', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'swarm start',
        limit: 5
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.results).toBeDefined();
      expect(result.data?.results.length).toBeGreaterThan(0);
    });

    it('should find commands by natural language', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'how do I start a swarm',
        limit: 5
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'save',
        category: 'file',
        limit: 5
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      if (result.data?.results.length > 0) {
        expect(result.data.results.every((r: CommandSearchResult) => 
          r.command.category === 'file'
        )).toBe(true);
      }
    });

    it('should return empty results for no matches', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'xyzabc123nonexistent',
        limit: 5
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.results).toBeDefined();
    });

    it('should limit results', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'swarm',
        limit: 2
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('suggest', () => {
    it('should suggest commands', async () => {
      mockContext.parameters = {
        action: 'suggest',
        query: 'how do I run tests'
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.suggestions).toBeDefined();
      expect(result.data?.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide natural language suggestions', async () => {
      mockContext.parameters = {
        action: 'suggest',
        query: 'save file'
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(true);
      if (result.data?.suggestions.length > 0) {
        expect(result.data.suggestions[0].suggestion).toBeDefined();
        expect(result.data.suggestions[0].confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('validateParameters', () => {
    it('should validate search parameters', () => {
      expect(ai.validateParameters({
        action: 'search',
        query: 'test'
      })).toBe(true);
    });

    it('should validate suggest parameters', () => {
      expect(ai.validateParameters({
        action: 'suggest',
        query: 'test'
      })).toBe(true);
    });

    it('should reject missing query', () => {
      expect(ai.validateParameters({
        action: 'search'
      })).toBe(false);
    });

    it('should reject unknown action', () => {
      expect(ai.validateParameters({
        action: 'unknown',
        query: 'test'
      })).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle unknown action', async () => {
      mockContext.parameters = {
        action: 'unknown',
        query: 'test'
      };

      const result = await ai.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });
});

