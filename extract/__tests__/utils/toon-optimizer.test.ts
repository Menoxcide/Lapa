/**
 * TOON Optimizer Tests
 * 
 * Comprehensive test suite for TOON optimizer utilities
 */

import { describe, it, expect } from 'vitest';
import {
  optimizeForTOON,
  optimizeContextForLLM,
  optimizeChunksForLLM,
  optimizeSearchResultsForLLM,
  shouldOptimizeForTOON
} from '../../utils/toon-optimizer.ts';

describe('TOON Optimizer', () => {
  describe('optimizeForTOON', () => {
    it('should optimize array of objects', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      const result = optimizeForTOON(data);
      expect(result).toBeDefined();
      expect(result.format).toBeDefined();
      expect(['toon', 'json']).toContain(result.format);
    });

    it('should return JSON format if not suitable', () => {
      const data = 'not suitable';
      const result = optimizeForTOON(data);
      expect(result.format).toBe('json');
      expect(result.optimized).toBe(data);
    });

    it('should respect minTokenReduction threshold', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      const result = optimizeForTOON(data, { minTokenReduction: 50 });
      // If token reduction < 50%, should return JSON
      expect(result).toBeDefined();
    });
  });

  describe('optimizeContextForLLM', () => {
    it('should optimize context with arrays', () => {
      const context = {
        name: 'Test',
        items: [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' }
        ],
        count: 42
      };

      const optimized = optimizeContextForLLM(context);
      expect(optimized).toBeDefined();
      expect(optimized.name).toBe('Test');
      expect(optimized.count).toBe(42);
    });

    it('should handle context without arrays', () => {
      const context = {
        name: 'Test',
        value: 42
      };

      const optimized = optimizeContextForLLM(context);
      expect(optimized).toEqual(context);
    });

    it('should recursively optimize nested objects', () => {
      const context = {
        level1: {
          level2: {
            items: [
              { id: 1, value: 'a' },
              { id: 2, value: 'b' }
            ]
          }
        }
      };

      const optimized = optimizeContextForLLM(context);
      expect(optimized).toBeDefined();
    });
  });

  describe('optimizeChunksForLLM', () => {
    it('should optimize chunks array', () => {
      const chunks = [
        'First chunk of text',
        'Second chunk of text',
        'Third chunk of text'
      ];

      const result = optimizeChunksForLLM(chunks);
      expect(result).toBeDefined();
      expect(result.format).toBeDefined();
    });

    it('should return JSON for empty chunks', () => {
      const chunks: string[] = [];
      const result = optimizeChunksForLLM(chunks);
      expect(result.format).toBe('json');
    });

    it('should optimize large chunks array', () => {
      const chunks = Array.from({ length: 20 }, (_, i) => `Chunk ${i}`);
      const result = optimizeChunksForLLM(chunks);
      expect(result).toBeDefined();
    });
  });

  describe('optimizeSearchResultsForLLM', () => {
    it('should optimize search results', () => {
      const results = [
        {
          document: {
            id: '1',
            content: 'Test content',
            metadata: { source: 'test' }
          },
          similarity: 0.95,
          distance: 0.05
        },
        {
          document: {
            id: '2',
            content: 'Another content',
            metadata: { source: 'test' }
          },
          similarity: 0.90,
          distance: 0.10
        }
      ];

      const result = optimizeSearchResultsForLLM(results);
      expect(result).toBeDefined();
      expect(result.format).toBeDefined();
    });

    it('should return JSON for empty results', () => {
      const results: any[] = [];
      const result = optimizeSearchResultsForLLM(results);
      expect(result.format).toBe('json');
    });
  });

  describe('shouldOptimizeForTOON', () => {
    it('should return true for large arrays', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      expect(shouldOptimizeForTOON(data, 5)).toBe(true);
    });

    it('should return false for small arrays', () => {
      const data = [{ id: 1 }, { id: 2 }];
      expect(shouldOptimizeForTOON(data, 5)).toBe(false);
    });

    it('should return true for large objects', () => {
      const data: Record<string, any> = {};
      for (let i = 0; i < 10; i++) {
        data[`key${i}`] = `value${i}`;
      }
      expect(shouldOptimizeForTOON(data, 5)).toBe(true);
    });

    it('should return false for small objects', () => {
      const data = { key1: 'value1', key2: 'value2' };
      expect(shouldOptimizeForTOON(data, 5)).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should optimize complete workflow', () => {
      const context = {
        taskId: 'task-1',
        items: Array.from({ length: 15 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: i * 10
        })),
        metadata: {
          timestamp: Date.now(),
          source: 'test'
        }
      };

      const optimized = optimizeContextForLLM(context);
      expect(optimized).toBeDefined();
      expect(optimized.taskId).toBe('task-1');
    });
  });
});

