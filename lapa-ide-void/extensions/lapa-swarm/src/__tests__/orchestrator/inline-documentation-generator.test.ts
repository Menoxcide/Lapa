/**
 * Tests for Inline Documentation Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InlineDocumentationGenerator, GeneratedDocumentation } from '../../orchestrator/inline-documentation-generator.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';

describe('InlineDocumentationGenerator', () => {
  let generator: InlineDocumentationGenerator;
  let mockContext: AgentToolExecutionContext;

  beforeEach(() => {
    generator = new InlineDocumentationGenerator();
    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('Function Documentation', () => {
    it('should generate JSDoc for simple function', async () => {
      const code = `
        function calculateTotal(price: number, quantity: number): number {
          return price * quantity;
        }
      `;

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      expect(docs.length).toBeGreaterThan(0);
      
      const funcDoc = docs.find(d => d.element.name === 'calculateTotal');
      expect(funcDoc).toBeDefined();
      expect(funcDoc?.documentation).toContain('@param');
      expect(funcDoc?.documentation).toContain('@returns');
    });

    it('should generate TSDoc format', async () => {
      const code = 'function test(param: string): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'tsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.documentation).toContain('@param');
      expect(doc.style).toBe('tsdoc');
    });

    it('should handle arrow functions', async () => {
      const code = 'const processData = (data: string) => data.toUpperCase();';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      expect(docs.length).toBeGreaterThan(0);
    });

    it('should handle async functions', async () => {
      const code = 'async function fetchData(url: string): Promise<Data> {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe('Class Documentation', () => {
    it('should generate class documentation', async () => {
      const code = `
        class UserManager {
          private users: User[];
        }
      `;

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const classDoc = docs.find(d => d.element.type === 'class');
      expect(classDoc).toBeDefined();
      expect(classDoc?.documentation).toContain('@class');
    });

    it('should generate method documentation', async () => {
      const code = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const methodDoc = docs.find(d => d.element.name === 'add');
      expect(methodDoc).toBeDefined();
      expect(methodDoc?.element.type).toBe('method');
    });
  });

  describe('Parameter Handling', () => {
    it('should document multiple parameters', async () => {
      const code = 'function test(a: string, b: number, c: boolean): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.parameters?.length).toBe(3);
    });

    it('should handle optional parameters', async () => {
      const code = 'function test(param?: string): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.parameters?.[0].optional).toBe(true);
    });

    it('should handle default values', async () => {
      const code = 'function test(param: string = "default"): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.parameters?.[0].defaultValue).toBeDefined();
    });
  });

  describe('Return Type Inference', () => {
    it('should infer return type from annotation', async () => {
      const code = 'function test(): number { return 42; }';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.returns).toBeDefined();
    });
  });

  describe('Interface and Type Documentation', () => {
    it('should generate interface documentation', async () => {
      const code = 'interface User { id: string; name: string; }';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const interfaceDoc = docs.find(d => d.element.type === 'interface');
      expect(interfaceDoc).toBeDefined();
    });

    it('should generate type alias documentation', async () => {
      const code = 'type UserId = string;';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const typeDoc = docs.find(d => d.element.type === 'type');
      expect(typeDoc).toBeDefined();
    });

    it('should generate enum documentation', async () => {
      const code = 'enum Status { Active, Inactive }';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const enumDoc = docs.find(d => d.element.type === 'enum');
      expect(enumDoc).toBeDefined();
    });
  });

  describe('Examples Generation', () => {
    it('should include examples when requested', async () => {
      const code = 'function test(param: string): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript',
        includeExamples: true
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.examples).toBeDefined();
      expect(doc.examples?.length).toBeGreaterThan(0);
    });

    it('should exclude examples when not requested', async () => {
      const code = 'function test(param: string): void {}';

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript',
        includeExamples: false
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const docs = result.data?.documentation as GeneratedDocumentation[];
      const doc = docs[0];
      expect(doc.examples).toBeUndefined();
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary statistics', async () => {
      const code = `
        function func1(): void {}
        class MyClass {}
        interface MyInterface {}
      `;

      mockContext.parameters = {
        action: 'generate',
        code,
        style: 'jsdoc',
        language: 'typescript'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(true);
      
      const summary = result.data?.summary;
      expect(summary).toBeDefined();
      expect(summary?.total).toBeGreaterThan(0);
      expect(summary?.byType).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate parameters', () => {
      expect(generator.validateParameters({
        action: 'generate',
        code: 'test'
      })).toBe(true);

      expect(generator.validateParameters({
        action: 'generate'
      })).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing code', async () => {
      mockContext.parameters = {
        action: 'generate',
        style: 'jsdoc'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(false);
    });

    it('should handle unknown action', async () => {
      mockContext.parameters = {
        action: 'unknown',
        code: 'test'
      };

      const result = await generator.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });
});

