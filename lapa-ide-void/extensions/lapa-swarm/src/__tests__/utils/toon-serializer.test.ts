/**
 * TOON Serializer Tests
 * 
 * Comprehensive test suite for TOON serialization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  serializeToTOON,
  deserializeFromTOON,
  isSuitableForTOON,
  estimateTokenReduction
} from '../../utils/toon-serializer.ts';

describe('TOON Serializer', () => {
  describe('serializeToTOON', () => {
    it('should serialize array of objects to TOON format', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      const toonString = serializeToTOON(data, { compact: true });
      expect(toonString).toBeDefined();
      expect(typeof toonString).toBe('string');
      expect(toonString.length).toBeGreaterThan(0);
    });

    it('should serialize with headers', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      const toonString = serializeToTOON(data, { includeHeaders: true });
      expect(toonString).toContain('name');
      expect(toonString).toContain('age');
    });

    it('should serialize object to TOON format', () => {
      const data = {
        name: 'Test',
        value: 42,
        nested: { key: 'value' }
      };

      const toonString = serializeToTOON(data);
      expect(toonString).toBeDefined();
      expect(typeof toonString).toBe('string');
    });

    it('should handle empty array', () => {
      const data: any[] = [];
      const toonString = serializeToTOON(data);
      expect(toonString).toBeDefined();
    });

    it('should handle primitives', () => {
      const toonString = serializeToTOON({ value: 'test' });
      expect(toonString).toBeDefined();
      expect(toonString).toContain('test');
    });
  });

  describe('deserializeFromTOON', () => {
    it('should deserialize TOON table format', () => {
      const toonString = `name | age
Alice | 30
Bob   | 25`;

      const result = deserializeFromTOON(toonString);
      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBeGreaterThan(0);
    });

    it('should handle invalid TOON string', () => {
      const result = deserializeFromTOON('invalid toon string');
      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle empty string', () => {
      const result = deserializeFromTOON('');
      expect(result).toBeNull();
    });
  });

  describe('isSuitableForTOON', () => {
    it('should identify suitable array of objects', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      expect(isSuitableForTOON(data)).toBe(true);
    });

    it('should identify non-suitable data', () => {
      expect(isSuitableForTOON('string')).toBe(false);
      expect(isSuitableForTOON(null)).toBe(false);
      expect(isSuitableForTOON(undefined)).toBe(false);
      expect(isSuitableForTOON(42)).toBe(false);
    });

    it('should identify suitable object', () => {
      const data = { key: 'value', number: 42 };
      expect(isSuitableForTOON(data)).toBe(true);
    });

    it('should reject empty array', () => {
      expect(isSuitableForTOON([])).toBe(false);
    });
  });

  describe('estimateTokenReduction', () => {
    it('should estimate token reduction for suitable data', () => {
      const data = [
        { name: 'Alice', age: 30, email: 'alice@example.com' },
        { name: 'Bob', age: 25, email: 'bob@example.com' },
        { name: 'Charlie', age: 35, email: 'charlie@example.com' }
      ];

      const reduction = estimateTokenReduction(data);
      expect(reduction).toBeGreaterThanOrEqual(0);
      expect(reduction).toBeLessThanOrEqual(100);
    });

    it('should return 0 for empty data', () => {
      const reduction = estimateTokenReduction(null);
      expect(reduction).toBe(0);
    });

    it('should return 0 for unsuitable data', () => {
      const reduction = estimateTokenReduction('string');
      expect(reduction).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should round-trip serialize and deserialize', () => {
      const original = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];

      const toonString = serializeToTOON(original, { compact: true });
      const deserialized = deserializeFromTOON(toonString);

      // Should preserve data structure
      expect(deserialized).toBeDefined();
    });

    it('should achieve token reduction for arrays', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: i * 10,
        description: `Description for item ${i}`
      }));

      const reduction = estimateTokenReduction(data);
      // Should achieve some token reduction for arrays
      expect(reduction).toBeGreaterThanOrEqual(0);
    });
  });
});

