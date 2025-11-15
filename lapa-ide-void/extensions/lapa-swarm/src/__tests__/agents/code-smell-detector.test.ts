/**
 * Tests for Code Smell Detector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeSmellDetector, CodeSmell, CodeSmellType } from '../../agents/code-smell-detector.js';
import { AgentToolExecutionContext } from '../../core/agent-tool.js';
import { MemoriEngine } from '../../local/memori-engine.js';

describe('CodeSmellDetector', () => {
  let detector: CodeSmellDetector;
  let mockContext: AgentToolExecutionContext;
  let mockMemoriEngine: MemoriEngine;

  beforeEach(() => {
    mockMemoriEngine = {
      store: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      initialize: vi.fn().mockResolvedValue(undefined)
    } as unknown as MemoriEngine;

    detector = new CodeSmellDetector(mockMemoriEngine);
    mockContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent-1',
      parameters: {}
    };
  });

  describe('Long Method Detection', () => {
    it('should detect long methods', async () => {
      const longMethod = Array(60).fill('  const x = 1;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code: longMethod,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const longMethodSmell = smells.find(s => s.type === 'long-method');
      expect(longMethodSmell).toBeDefined();
      expect(longMethodSmell?.severity).toBe('medium');
    });
  });

  describe('Long Parameter List Detection', () => {
    it('should detect functions with too many parameters', async () => {
      const code = 'function test(a, b, c, d, e, f, g) { return a + b; }';
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const paramSmell = smells.find(s => s.type === 'long-parameter-list');
      expect(paramSmell).toBeDefined();
    });
  });

  describe('Magic Numbers Detection', () => {
    it('should detect magic numbers', async () => {
      const code = `
        if (status === 2) { }
        if (count > 5) { }
        if (value === 10) { }
        if (limit === 20) { }
      `;
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const magicSmell = smells.find(s => s.type === 'magic-numbers');
      expect(magicSmell).toBeDefined();
    });
  });

  describe('Duplicate Code Detection', () => {
    it('should detect duplicate code blocks', async () => {
      const duplicateBlock = `
        function processA() {
          const x = 1;
          const y = 2;
          return x + y;
        }
        function processB() {
          const x = 1;
          const y = 2;
          return x + y;
        }
        function processC() {
          const x = 1;
          const y = 2;
          return x + y;
        }
      `;
      
      mockContext.parameters = {
        action: 'detect',
        code: duplicateBlock,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const duplicateSmell = smells.find(s => s.type === 'duplicate-code');
      expect(duplicateSmell).toBeDefined();
    });
  });

  describe('God Class Detection', () => {
    it('should detect god classes', async () => {
      const godClass = Array(600).fill('  private field: string;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code: godClass,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const godClassSmell = smells.find(s => s.type === 'god-class');
      expect(godClassSmell).toBeDefined();
    });
  });

  describe('Switch Statements Detection', () => {
    it('should detect large switch statements', async () => {
      const code = `
        switch(type) {
          case 1: break;
          case 2: break;
          case 3: break;
          case 4: break;
          case 5: break;
          case 6: break;
          case 7: break;
        }
      `;
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      const switchSmell = smells.find(s => s.type === 'switch-statements');
      expect(switchSmell).toBeDefined();
    });
  });

  describe('Severity Filtering', () => {
    it('should filter by severity threshold', async () => {
      const code = Array(60).fill('  const x = 1;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript',
        severityThreshold: 'high'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      // Should only include high/critical severity
      smells.forEach(smell => {
        expect(['high', 'critical']).toContain(smell.severity);
      });
    });
  });

  describe('Type Filtering', () => {
    it('should filter by smell type', async () => {
      const code = Array(60).fill('  const x = 1;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript',
        types: ['long-method']
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const smells = result.data?.smells as CodeSmell[];
      smells.forEach(smell => {
        expect(smell.type).toBe('long-method');
      });
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary statistics', async () => {
      const code = Array(60).fill('  const x = 1;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(true);
      
      const summary = result.data?.summary;
      expect(summary).toBeDefined();
      expect(summary?.total).toBeGreaterThan(0);
      expect(summary?.bySeverity).toBeDefined();
      expect(summary?.byType).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate parameters', () => {
      expect(detector.validateParameters({
        action: 'detect',
        code: 'test'
      })).toBe(true);

      expect(detector.validateParameters({
        action: 'detect',
        filePath: '/path/to/file'
      })).toBe(true);

      expect(detector.validateParameters({
        action: 'detect'
      })).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing code and filePath', async () => {
      mockContext.parameters = {
        action: 'detect',
        language: 'typescript'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('code or filePath');
    });

    it('should handle unknown action', async () => {
      mockContext.parameters = {
        action: 'unknown',
        code: 'test'
      };

      const result = await detector.execute(mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('Memory Integration', () => {
    it('should store detections in memory', async () => {
      const code = Array(60).fill('  const x = 1;').join('\n');
      
      mockContext.parameters = {
        action: 'detect',
        code,
        language: 'typescript',
        filePath: '/test/file.ts'
      };

      await detector.execute(mockContext);
      
      // Should have called store for detected smells
      expect(mockMemoriEngine.store).toHaveBeenCalled();
    });
  });
});

