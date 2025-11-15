/**
 * Tests for Code Snippet Library
 * 
 * Comprehensive test coverage for snippet creation, search, update, delete, and list operations.
 * Tests include error handling, permissions, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeSnippetLibrary, CodeSnippet, SnippetSearchOptions } from '../../orchestrator/code-snippet-library.js';
import { MemoriEngine } from '../../local/memori-engine.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';

// Mock Memori Engine
class MockMemoriEngine extends MemoriEngine {
  private entities: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    // Mock initialization
  }

  getStatus() {
    return {
      isInitialized: true,
      sessionCount: 0,
      entityCacheSize: this.entities.size,
      config: {} as any
    };
  }
}

describe('CodeSnippetLibrary', () => {
  let library: CodeSnippetLibrary;
  let memoriEngine: MockMemoriEngine;
  let mockContext: AgentToolExecutionContext;

  beforeEach(() => {
    memoriEngine = new MockMemoriEngine();
    library = new CodeSnippetLibrary(memoriEngine);
    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('createSnippet', () => {
    it('should create a snippet with required fields', async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Test Snippet',
        code: 'console.log("hello");',
        language: 'javascript'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.snippet).toBeDefined();
      expect(result.data?.snippet.title).toBe('Test Snippet');
      expect(result.data?.snippet.code).toBe('console.log("hello");');
      expect(result.data?.snippet.language).toBe('javascript');
      expect(result.data?.snippet.id).toBeDefined();
      expect(result.data?.snippet.authorId).toBe('test-agent-1');
    });

    it('should create snippet with optional fields', async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Test Snippet',
        code: 'def hello(): pass',
        language: 'python',
        description: 'A test function',
        tags: ['test', 'example'],
        category: 'utilities',
        isPublic: true
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippet.description).toBe('A test function');
      expect(result.data?.snippet.tags).toEqual(['test', 'example']);
      expect(result.data?.snippet.category).toBe('utilities');
      expect(result.data?.snippet.isPublic).toBe(true);
    });

    it('should fail when required fields are missing', async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Test Snippet'
        // Missing code and language
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should enforce snippet limit per user', async () => {
      // Create max snippets
      const maxSnippets = 1000;
      for (let i = 0; i < maxSnippets; i++) {
        mockContext.parameters = {
          action: 'create',
          title: `Snippet ${i}`,
          code: `code ${i}`,
          language: 'javascript'
        };
        await library.execute(mockContext);
      }

      // Try to create one more
      mockContext.parameters = {
        action: 'create',
        title: 'Extra Snippet',
        code: 'extra code',
        language: 'javascript'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Snippet limit reached');
    });
  });

  describe('searchSnippets', () => {
    beforeEach(async () => {
      // Create test snippets
      const snippets = [
        {
          action: 'create',
          title: 'React Component',
          code: 'function Component() { return <div>Hello</div>; }',
          language: 'javascript',
          tags: ['react', 'component'],
          description: 'A React component example'
        },
        {
          action: 'create',
          title: 'Python Function',
          code: 'def hello(): print("world")',
          language: 'python',
          tags: ['python', 'function'],
          description: 'A Python function'
        },
        {
          action: 'create',
          title: 'TypeScript Interface',
          code: 'interface User { name: string; }',
          language: 'typescript',
          tags: ['typescript', 'interface'],
          description: 'A TypeScript interface'
        }
      ];

      for (const snippet of snippets) {
        mockContext.parameters = snippet;
        await library.execute(mockContext);
      }
    });

    it('should search snippets by query', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'React'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.results).toBeDefined();
      expect(result.data?.results.length).toBeGreaterThan(0);
      expect(result.data?.results[0].snippet.title).toContain('React');
    });

    it('should filter by language', async () => {
      mockContext.parameters = {
        action: 'search',
        language: 'python'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
      expect(result.data?.results.every(r => r.snippet.language === 'python')).toBe(true);
    });

    it('should filter by tags', async () => {
      mockContext.parameters = {
        action: 'search',
        tags: ['react']
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeGreaterThan(0);
      expect(result.data?.results.every(r => 
        r.snippet.tags.some(tag => tag.toLowerCase() === 'react')
      )).toBe(true);
    });

    it('should sort by relevance', async () => {
      mockContext.parameters = {
        action: 'search',
        query: 'React Component',
        sortBy: 'relevance'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      if (result.data?.results.length > 1) {
        expect(result.data.results[0].relevanceScore).toBeGreaterThanOrEqual(
          result.data.results[1].relevanceScore
        );
      }
    });

    it('should sort by popularity', async () => {
      mockContext.parameters = {
        action: 'search',
        sortBy: 'popularity'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      if (result.data?.results.length > 1) {
        expect(result.data.results[0].snippet.usageCount).toBeGreaterThanOrEqual(
          result.data.results[1].snippet.usageCount
        );
      }
    });

    it('should limit results', async () => {
      mockContext.parameters = {
        action: 'search',
        limit: 2
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getSnippet', () => {
    let snippetId: string;

    beforeEach(async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Test Snippet',
        code: 'test code',
        language: 'javascript'
      };

      const createResult = await library.execute(mockContext);
      snippetId = (createResult.data?.snippet as CodeSnippet).id;
    });

    it('should get snippet by ID', async () => {
      mockContext.parameters = {
        action: 'get',
        snippetId
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippet).toBeDefined();
      expect(result.data?.snippet.id).toBe(snippetId);
      expect(result.data?.snippet.title).toBe('Test Snippet');
    });

    it('should track usage when getting snippet', async () => {
      mockContext.parameters = {
        action: 'get',
        snippetId
      };

      const result1 = await library.execute(mockContext);
      const usageCount1 = (result1.data?.snippet as CodeSnippet).usageCount;

      const result2 = await library.execute(mockContext);
      const usageCount2 = (result2.data?.snippet as CodeSnippet).usageCount;

      expect(usageCount2).toBeGreaterThan(usageCount1);
    });

    it('should fail when snippet not found', async () => {
      mockContext.parameters = {
        action: 'get',
        snippetId: 'non-existent-id'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when snippetId is missing', async () => {
      mockContext.parameters = {
        action: 'get'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter');
    });
  });

  describe('updateSnippet', () => {
    let snippetId: string;

    beforeEach(async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Original Title',
        code: 'original code',
        language: 'javascript'
      };

      const createResult = await library.execute(mockContext);
      snippetId = (createResult.data?.snippet as CodeSnippet).id;
    });

    it('should update snippet', async () => {
      mockContext.parameters = {
        action: 'update',
        snippetId,
        updates: {
          title: 'Updated Title',
          code: 'updated code',
          tags: ['updated']
        }
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippet.title).toBe('Updated Title');
      expect(result.data?.snippet.code).toBe('updated code');
      expect(result.data?.snippet.tags).toEqual(['updated']);
    });

    it('should preserve immutable fields', async () => {
      const originalSnippet = await library.execute({
        ...mockContext,
        parameters: {
          action: 'get',
          snippetId
        }
      });

      const originalId = (originalSnippet.data?.snippet as CodeSnippet).id;
      const originalCreatedAt = (originalSnippet.data?.snippet as CodeSnippet).createdAt;
      const originalAuthorId = (originalSnippet.data?.snippet as CodeSnippet).authorId;

      mockContext.parameters = {
        action: 'update',
        snippetId,
        updates: {
          id: 'new-id',
          createdAt: new Date(),
          authorId: 'new-author'
        }
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippet.id).toBe(originalId);
      expect(result.data?.snippet.createdAt).toEqual(originalCreatedAt);
      expect(result.data?.snippet.authorId).toBe(originalAuthorId);
    });

    it('should fail when snippet not found', async () => {
      mockContext.parameters = {
        action: 'update',
        snippetId: 'non-existent-id',
        updates: { title: 'New Title' }
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when user is not author', async () => {
      // Create snippet with different agent
      const otherContext: AgentToolExecutionContext = {
        taskId: 'other-task',
        agentId: 'other-agent',
        parameters: {
          action: 'create',
          title: 'Other Snippet',
          code: 'other code',
          language: 'javascript'
        }
      };

      const createResult = await library.execute(otherContext);
      const otherSnippetId = (createResult.data?.snippet as CodeSnippet).id;

      // Try to update with different agent
      mockContext.parameters = {
        action: 'update',
        snippetId: otherSnippetId,
        updates: { title: 'Hacked Title' }
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('deleteSnippet', () => {
    let snippetId: string;

    beforeEach(async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'To Delete',
        code: 'delete me',
        language: 'javascript'
      };

      const createResult = await library.execute(mockContext);
      snippetId = (createResult.data?.snippet as CodeSnippet).id;
    });

    it('should delete snippet', async () => {
      mockContext.parameters = {
        action: 'delete',
        snippetId
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('deleted successfully');

      // Verify snippet is deleted
      const getResult = await library.execute({
        ...mockContext,
        parameters: {
          action: 'get',
          snippetId
        }
      });

      expect(getResult.success).toBe(false);
    });

    it('should fail when snippet not found', async () => {
      mockContext.parameters = {
        action: 'delete',
        snippetId: 'non-existent-id'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when user is not author', async () => {
      // Create snippet with different agent
      const otherContext: AgentToolExecutionContext = {
        taskId: 'other-task',
        agentId: 'other-agent',
        parameters: {
          action: 'create',
          title: 'Other Snippet',
          code: 'other code',
          language: 'javascript'
        }
      };

      const createResult = await library.execute(otherContext);
      const otherSnippetId = (createResult.data?.snippet as CodeSnippet).id;

      // Try to delete with different agent
      mockContext.parameters = {
        action: 'delete',
        snippetId: otherSnippetId
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('listSnippets', () => {
    beforeEach(async () => {
      // Create multiple snippets
      const snippets = [
        { title: 'Snippet 1', code: 'code1', language: 'javascript', tags: ['tag1'] },
        { title: 'Snippet 2', code: 'code2', language: 'python', tags: ['tag2'] },
        { title: 'Snippet 3', code: 'code3', language: 'typescript', tags: ['tag1', 'tag2'] }
      ];

      for (const snippet of snippets) {
        mockContext.parameters = {
          action: 'create',
          ...snippet
        };
        await library.execute(mockContext);
      }
    });

    it('should list all snippets', async () => {
      mockContext.parameters = {
        action: 'list'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippets).toBeDefined();
      expect(result.data?.snippets.length).toBeGreaterThan(0);
    });

    it('should filter by language', async () => {
      mockContext.parameters = {
        action: 'list',
        language: 'javascript'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippets.every(s => s.language === 'javascript')).toBe(true);
    });

    it('should filter by tags', async () => {
      mockContext.parameters = {
        action: 'list',
        tags: ['tag1']
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippets.every(s => 
        s.tags.some(tag => tag === 'tag1')
      )).toBe(true);
    });

    it('should sort by recent', async () => {
      mockContext.parameters = {
        action: 'list',
        sortBy: 'recent'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      if (result.data?.snippets.length > 1) {
        const timestamps = result.data.snippets.map(s => s.updatedAt.getTime());
        expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
      }
    });

    it('should limit results', async () => {
      mockContext.parameters = {
        action: 'list',
        limit: 2
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data?.snippets.length).toBeLessThanOrEqual(2);
    });
  });

  describe('validateParameters', () => {
    it('should validate create parameters', () => {
      expect(library.validateParameters({
        action: 'create',
        title: 'Test',
        code: 'code',
        language: 'js'
      })).toBe(true);

      expect(library.validateParameters({
        action: 'create',
        title: 'Test'
        // Missing code and language
      })).toBe(false);
    });

    it('should validate search parameters', () => {
      expect(library.validateParameters({
        action: 'search'
      })).toBe(true);

      expect(library.validateParameters({
        action: 'search',
        query: 'test',
        language: 'js'
      })).toBe(true);
    });

    it('should validate get parameters', () => {
      expect(library.validateParameters({
        action: 'get',
        snippetId: 'test-id'
      })).toBe(true);

      expect(library.validateParameters({
        action: 'get'
        // Missing snippetId
      })).toBe(false);
    });

    it('should validate update parameters', () => {
      expect(library.validateParameters({
        action: 'update',
        snippetId: 'test-id',
        updates: {}
      })).toBe(true);

      expect(library.validateParameters({
        action: 'update'
        // Missing snippetId
      })).toBe(false);
    });

    it('should validate delete parameters', () => {
      expect(library.validateParameters({
        action: 'delete',
        snippetId: 'test-id'
      })).toBe(true);

      expect(library.validateParameters({
        action: 'delete'
        // Missing snippetId
      })).toBe(false);
    });

    it('should validate list parameters', () => {
      expect(library.validateParameters({
        action: 'list'
      })).toBe(true);
    });

    it('should reject unknown actions', () => {
      expect(library.validateParameters({
        action: 'unknown'
      })).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle unknown action', async () => {
      mockContext.parameters = {
        action: 'unknown-action'
      };

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should handle missing action', async () => {
      mockContext.parameters = {};

      const result = await library.execute(mockContext);

      expect(result.success).toBe(false);
    });
  });

  describe('performance', () => {
    it('should execute within reasonable time', async () => {
      mockContext.parameters = {
        action: 'create',
        title: 'Test',
        code: 'test code',
        language: 'javascript'
      };

      const start = Date.now();
      const result = await library.execute(mockContext);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      expect(result.executionTime).toBeDefined();
    });
  });
});

