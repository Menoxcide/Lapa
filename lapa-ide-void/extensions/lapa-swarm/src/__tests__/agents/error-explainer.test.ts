/**
 * Tests for Error Explanation Agent (DebugSage)
 * 
 * Comprehensive test coverage for error explanation, categorization,
 * fix suggestions, and integration with memory engine.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorExplainerAgent,
  ErrorExplanationTool,
  ErrorContext,
  ErrorExplanation,
  ErrorCategory
} from '../../agents/error-explainer.js';
import { MemoriEngine } from '../../local/memori-engine.js';
import { Task } from '../../agents/moe-router.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';

// Mock Memori Engine
class MockMemoriEngine extends MemoriEngine {
  async initialize(): Promise<void> {
    // Mock initialization
  }

  async extractAndStoreEntities(sourceAgentId: string, task: any, text: string): Promise<any[]> {
    // Mock entity extraction
    return [];
  }

  getStatus() {
    return {
      isInitialized: true,
      sessionCount: 0,
      entityCacheSize: 0,
      config: {} as any
    };
  }
}

describe('ErrorExplainerAgent', () => {
  let agent: ErrorExplainerAgent;
  let memoriEngine: MockMemoriEngine;

  beforeEach(() => {
    memoriEngine = new MockMemoriEngine();
    agent = new ErrorExplainerAgent(memoriEngine);
  });

  describe('Agent Properties', () => {
    it('should have correct agent properties', () => {
      expect(agent.type).toBe('error-explainer');
      expect(agent.name).toBe('DebugSage');
      expect(agent.expertise).toContain('error-analysis');
      expect(agent.expertise).toContain('debugging');
      expect(agent.capacity).toBe(10);
    });

    it('should have unique ID', () => {
      const agent2 = new ErrorExplainerAgent(memoriEngine);
      expect(agent.id).not.toBe(agent2.id);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize syntax errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'SyntaxError: Unexpected token',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-1',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('syntax');
    });

    it('should categorize type errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'Type error: Type \'string\' is not assignable to type \'number\'',
        language: 'typescript'
      };

      const task: Task = {
        id: 'task-2',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('type');
    });

    it('should categorize runtime errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-3',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('runtime');
    });

    it('should categorize import errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'Error: Cannot find module \'./utils\'',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-4',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('import');
    });

    it('should categorize permission errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'EACCES: permission denied, open \'/path/to/file\'',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-5',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('permission');
    });

    it('should categorize network errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'NetworkError: Failed to fetch',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-6',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('network');
    });

    it('should categorize unknown errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'Some obscure error message',
        language: 'unknown'
      };

      const task: Task = {
        id: 'task-7',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.category).toBe('unknown');
    });
  });

  describe('Error Explanation', () => {
    it('should generate plain language explanation', async () => {
      const context: ErrorContext = {
        errorMessage: 'SyntaxError: Unexpected token',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-8',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.plainLanguageExplanation).toBeDefined();
      expect(explanation.plainLanguageExplanation.length).toBeGreaterThan(0);
      expect(explanation.plainLanguageExplanation).toContain('syntax error');
    });

    it('should identify root cause', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-9',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.rootCause).toBeDefined();
      expect(explanation.rootCause.length).toBeGreaterThan(0);
    });

    it('should provide fix suggestions', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript',
        codeSnippet: 'const user = getUser();\nconsole.log(user.name);'
      };

      const task: Task = {
        id: 'task-10',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.fixSuggestions).toBeDefined();
      expect(explanation.fixSuggestions.length).toBeGreaterThan(0);
      expect(explanation.fixSuggestions[0].title).toBeDefined();
      expect(explanation.fixSuggestions[0].steps).toBeDefined();
      expect(explanation.fixSuggestions[0].steps.length).toBeGreaterThan(0);
    });

    it('should provide code examples for runtime errors', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-11',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.codeExamples).toBeDefined();
      if (explanation.codeExamples && explanation.codeExamples.length > 0) {
        expect(explanation.codeExamples[0].before).toBeDefined();
        expect(explanation.codeExamples[0].after).toBeDefined();
        expect(explanation.codeExamples[0].explanation).toBeDefined();
      }
    });
  });

  describe('Severity Assessment', () => {
    it('should assess syntax errors as critical', async () => {
      const context: ErrorContext = {
        errorMessage: 'SyntaxError: Unexpected token',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-12',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.severity).toBe('critical');
    });

    it('should assess runtime errors as high', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-13',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.severity).toBe('high');
    });

    it('should assess network errors as medium', async () => {
      const context: ErrorContext = {
        errorMessage: 'NetworkError: Failed to fetch',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-14',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.severity).toBe('medium');
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate confidence with minimal context', async () => {
      const context: ErrorContext = {
        errorMessage: 'Some error',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-15',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.confidence).toBeGreaterThanOrEqual(0);
      expect(explanation.confidence).toBeLessThanOrEqual(1);
    });

    it('should increase confidence with more context', async () => {
      const context: ErrorContext = {
        errorMessage: 'TypeError: Cannot read property',
        stackTrace: 'at Object.function (file.js:10:5)',
        filePath: 'file.js',
        lineNumber: 10,
        codeSnippet: 'const user = getUser();\nconsole.log(user.name);',
        language: 'javascript'
      };

      const task: Task = {
        id: 'task-16',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(true);
      const explanation = result.result as ErrorExplanation;
      expect(explanation.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing error message', async () => {
      const task: Task = {
        id: 'task-17',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context: {}
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing error context');
    });

    it('should handle missing context', async () => {
      const task: Task = {
        id: 'task-18',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1
      };

      const result = await agent.execute(task);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Workload Management', () => {
    it('should track workload', async () => {
      expect(agent.workload).toBe(0);

      const task: Task = {
        id: 'task-19',
        description: 'Explain error',
        type: 'error-explanation',
        priority: 1,
        context: {
          errorMessage: 'Test error',
          language: 'javascript'
        }
      };

      const promise = agent.execute(task);
      // Workload should increase during execution
      expect(agent.workload).toBeGreaterThan(0);

      await promise;
      // Workload should decrease after execution
      expect(agent.workload).toBe(0);
    });
  });
});

describe('ErrorExplanationTool', () => {
  let tool: ErrorExplanationTool;
  let memoriEngine: MockMemoriEngine;
  let mockContext: AgentToolExecutionContext;

  beforeEach(() => {
    memoriEngine = new MockMemoriEngine();
    tool = new ErrorExplanationTool(memoriEngine);
    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      expect(tool.validateParameters({
        errorMessage: 'Test error'
      })).toBe(true);
    });

    it('should reject missing errorMessage', () => {
      expect(tool.validateParameters({})).toBe(false);
    });

    it('should reject non-string errorMessage', () => {
      expect(tool.validateParameters({
        errorMessage: 123
      })).toBe(false);
    });
  });

  describe('execute', () => {
    it('should explain error successfully', async () => {
      mockContext.parameters = {
        errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
        language: 'javascript',
        codeSnippet: 'const user = getUser();\nconsole.log(user.name);'
      };

      const result = await tool.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.category).toBe('runtime');
      expect(result.data?.plainLanguageExplanation).toBeDefined();
      expect(result.data?.fixSuggestions).toBeDefined();
      expect(result.executionTime).toBeDefined();
    });

    it('should handle optional parameters', async () => {
      mockContext.parameters = {
        errorMessage: 'SyntaxError: Unexpected token',
        stackTrace: 'at file.js:10:5',
        filePath: 'file.js',
        lineNumber: 10,
        codeSnippet: 'function test() {',
        language: 'javascript',
        projectType: 'node'
      };

      const result = await tool.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fail with missing errorMessage', async () => {
      mockContext.parameters = {};

      const result = await tool.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should execute within reasonable time', async () => {
      mockContext.parameters = {
        errorMessage: 'Test error',
        language: 'javascript'
      };

      const start = Date.now();
      const result = await tool.execute(mockContext);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      expect(result.executionTime).toBeDefined();
    });
  });
});

