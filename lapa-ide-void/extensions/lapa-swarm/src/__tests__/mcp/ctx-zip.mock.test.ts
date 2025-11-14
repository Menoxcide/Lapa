import { describe, it, expect, vi, beforeEach } from "vitest";
import { compress, decompress } from '../../mcp/ctx-zip.mock.ts';
import { Buffer } from 'buffer';

describe('ctx-zip.mock', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock console.log to reduce noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('compress', () => {
    it('should compress small text data', async () => {
      const testData = 'Hello World';
      const result = await compress(testData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should compress medium text data with whitespace reduction', async () => {
      const testData = 'This is a test string with   multiple    spaces    and    tabs\t\t\tbetween words.';
      const result = await compress(testData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should compress large text data with significant reduction', async () => {
      // Create a large string (over 1000 characters)
      const largeData = 'A'.repeat(1500);
      const result = await compress(largeData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      // The mock should significantly reduce the size
      expect(result.length).toBeLessThan(largeData.length);
    });

    it('should compress JSON data', async () => {
      const testData = JSON.stringify({
        name: 'Test Object',
        value: 42,
        nested: {
          array: [1, 2, 3],
          boolean: true
        }
      });
      
      const result = await compress(testData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce different results for different inputs', async () => {
      const testData1 = 'First test string';
      const testData2 = 'Second test string';
      
      const result1 = await compress(testData1);
      const result2 = await compress(testData2);
      
      expect(result1).not.toEqual(result2);
    });

    it('should handle empty string', async () => {
      const testData = '';
      const result = await compress(testData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0); // Will contain metadata even for empty string
    });

    it('should handle special characters', async () => {
      const testData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"';
      const result = await compress(testData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decompress', () => {
    it('should decompress previously compressed data', async () => {
      const originalData = 'Hello World';
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should decompress medium text data correctly', async () => {
      const originalData = 'This is a test string with   multiple    spaces    and    tabs\t\t\tbetween words.';
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should decompress large text data correctly', async () => {
      const originalData = 'A'.repeat(1500);
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should decompress JSON data correctly', async () => {
      const originalData = JSON.stringify({
        name: 'Test Object',
        value: 42,
        nested: {
          array: [1, 2, 3],
          boolean: true
        }
      });
      
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should handle decompression of empty string', async () => {
      const originalData = '';
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should handle decompression of special characters', async () => {
      const originalData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"';
      const compressed = await compress(originalData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    });

    it('should throw error for invalid compressed data', async () => {
      // Create an invalid buffer that doesn't match our format
      const invalidBuffer = Buffer.from('invalid-data-format');
      
      await expect(decompress(invalidBuffer)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
    });

    it('should throw error for expired compressed data', async () => {
      const originalData = 'Test data';
      const compressed = await compress(originalData);
      
      // Decompress once (this should remove it from the map)
      await decompress(compressed);
      
      // Try to decompress again - should fail
      await expect(decompress(compressed)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
    });
  });

  describe('compression effectiveness', () => {
    it('should achieve significant compression for large payloads', async () => {
      const largeData = 'A'.repeat(2000);
      const compressed = await compress(largeData);
      
      // Calculate compression ratio
      const ratio = compressed.length / largeData.length;
      
      // Should achieve >80% compression (ratio < 0.2)
      expect(ratio).toBeLessThan(0.2);
    });

    it('should achieve moderate compression for medium payloads', async () => {
      const mediumData = 'A'.repeat(200);
      const compressed = await compress(mediumData);
      
      // Calculate compression ratio
      const ratio = compressed.length / mediumData.length;
      
      // Should achieve >50% compression (ratio < 0.5)
      expect(ratio).toBeLessThan(0.5);
    });
  });

  describe('safeTruncate function', () => {
    it('should handle strings that end with backslashes', async () => {
      // This test indirectly verifies safeTruncate behavior by using data that triggers it
      const testData = '{"path": "C:\\\\Users\\\\Test\\\\Documents\\\\' + 'A'.repeat(1000) + '"}';
      const compressed = await compress(testData);
      const decompressed = await decompress(compressed);
      
      // Should not throw errors during compression/decompression
      expect(decompressed).toBeDefined();
    });

    it('should handle strings with unbalanced quotes', async () => {
      // Create data that when truncated might have unbalanced quotes
      const testData = '{"message": "' + 'A'.repeat(1000) + '"}';
      const compressed = await compress(testData);
      const decompressed = await decompress(compressed);
      
      // Should not throw errors during compression/decompression
      expect(decompressed).toBeDefined();
    });

    it('should handle strings with unbalanced braces', async () => {
      // Create data that when truncated might have unbalanced braces
      const testData = '{"level1": {"level2": {"data": "' + 'A'.repeat(1000) + '"}}}';
      const compressed = await compress(testData);
      const decompressed = await decompress(compressed);
      
      // Should not throw errors during compression/decompression
      expect(decompressed).toBeDefined();
    });

    it('should handle strings with unbalanced brackets', async () => {
      // Create data that when truncated might have unbalanced brackets
      const testData = '{"array": [' + '"item1", '.repeat(200) + '"finalItem"]}';
      const compressed = await compress(testData);
      const decompressed = await decompress(compressed);
      
      // Should not throw errors during compression/decompression
      expect(decompressed).toBeDefined();
    });
  });

  describe('memory management', () => {
    it('should remove entries from compression map after decompression', async () => {
      const originalData = 'Test data for memory test';
      const compressed = await compress(originalData);
      
      // Access the internal compressionMap to check it exists
      // Note: This is a bit of a hack to test internal state, but necessary for this mock
      const mapSizeBefore = (global as any).compressionMap?.size || 0;
      
      await decompress(compressed);
      
      // After decompression, the entry should be removed
      // Since we can't directly access the internal map, we test by trying to decompress again
      await expect(decompress(compressed)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
    });

    it('should not leak memory with multiple compress/decompress cycles', async () => {
      // Perform multiple compression/decompression cycles
      for (let i = 0; i < 10; i++) {
        const testData = `Test data iteration ${i}`;
        const compressed = await compress(testData);
        await decompress(compressed);
      }
      
      // All entries should be cleaned up (we can't directly test the map size in this mock)
      // But we can verify that new compressions still work
      const testData = 'Final test data';
      const compressed = await compress(testData);
      const decompressed = await decompress(compressed);
      
      expect(decompressed).toBe(testData);
    });
  });
});