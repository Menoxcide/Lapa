"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ctx_zip_mock_ts_1 = require("../../mcp/ctx-zip.mock.ts");
const buffer_1 = require("buffer");
(0, vitest_1.describe)('ctx-zip.mock', () => {
    (0, vitest_1.beforeEach)(() => {
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
        // Mock console.log to reduce noise in test output
        vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
    });
    (0, vitest_1.describe)('compress', () => {
        (0, vitest_1.it)('should compress small text data', async () => {
            const testData = 'Hello World';
            const result = await (0, ctx_zip_mock_ts_1.compress)(testData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should compress medium text data with whitespace reduction', async () => {
            const testData = 'This is a test string with   multiple    spaces    and    tabs\t\t\tbetween words.';
            const result = await (0, ctx_zip_mock_ts_1.compress)(testData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should compress large text data with significant reduction', async () => {
            // Create a large string (over 1000 characters)
            const largeData = 'A'.repeat(1500);
            const result = await (0, ctx_zip_mock_ts_1.compress)(largeData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
            // The mock should significantly reduce the size
            (0, vitest_1.expect)(result.length).toBeLessThan(largeData.length);
        });
        (0, vitest_1.it)('should compress JSON data', async () => {
            const testData = JSON.stringify({
                name: 'Test Object',
                value: 42,
                nested: {
                    array: [1, 2, 3],
                    boolean: true
                }
            });
            const result = await (0, ctx_zip_mock_ts_1.compress)(testData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should produce different results for different inputs', async () => {
            const testData1 = 'First test string';
            const testData2 = 'Second test string';
            const result1 = await (0, ctx_zip_mock_ts_1.compress)(testData1);
            const result2 = await (0, ctx_zip_mock_ts_1.compress)(testData2);
            (0, vitest_1.expect)(result1).not.toEqual(result2);
        });
        (0, vitest_1.it)('should handle empty string', async () => {
            const testData = '';
            const result = await (0, ctx_zip_mock_ts_1.compress)(testData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0); // Will contain metadata even for empty string
        });
        (0, vitest_1.it)('should handle special characters', async () => {
            const testData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"';
            const result = await (0, ctx_zip_mock_ts_1.compress)(testData);
            (0, vitest_1.expect)(result).toBeInstanceOf(buffer_1.Buffer);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('decompress', () => {
        (0, vitest_1.it)('should decompress previously compressed data', async () => {
            const originalData = 'Hello World';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should decompress medium text data correctly', async () => {
            const originalData = 'This is a test string with   multiple    spaces    and    tabs\t\t\tbetween words.';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should decompress large text data correctly', async () => {
            const originalData = 'A'.repeat(1500);
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should decompress JSON data correctly', async () => {
            const originalData = JSON.stringify({
                name: 'Test Object',
                value: 42,
                nested: {
                    array: [1, 2, 3],
                    boolean: true
                }
            });
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should handle decompression of empty string', async () => {
            const originalData = '';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should handle decompression of special characters', async () => {
            const originalData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(originalData);
        });
        (0, vitest_1.it)('should throw error for invalid compressed data', async () => {
            // Create an invalid buffer that doesn't match our format
            const invalidBuffer = buffer_1.Buffer.from('invalid-data-format');
            await (0, vitest_1.expect)((0, ctx_zip_mock_ts_1.decompress)(invalidBuffer)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
        });
        (0, vitest_1.it)('should throw error for expired compressed data', async () => {
            const originalData = 'Test data';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            // Decompress once (this should remove it from the map)
            await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // Try to decompress again - should fail
            await (0, vitest_1.expect)((0, ctx_zip_mock_ts_1.decompress)(compressed)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
        });
    });
    (0, vitest_1.describe)('compression effectiveness', () => {
        (0, vitest_1.it)('should achieve significant compression for large payloads', async () => {
            const largeData = 'A'.repeat(2000);
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(largeData);
            // Calculate compression ratio
            const ratio = compressed.length / largeData.length;
            // Should achieve >80% compression (ratio < 0.2)
            (0, vitest_1.expect)(ratio).toBeLessThan(0.2);
        });
        (0, vitest_1.it)('should achieve moderate compression for medium payloads', async () => {
            const mediumData = 'A'.repeat(200);
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(mediumData);
            // Calculate compression ratio
            const ratio = compressed.length / mediumData.length;
            // Should achieve >50% compression (ratio < 0.5)
            (0, vitest_1.expect)(ratio).toBeLessThan(0.5);
        });
    });
    (0, vitest_1.describe)('safeTruncate function', () => {
        (0, vitest_1.it)('should handle strings that end with backslashes', async () => {
            // This test indirectly verifies safeTruncate behavior by using data that triggers it
            const testData = '{"path": "C:\\\\Users\\\\Test\\\\Documents\\\\' + 'A'.repeat(1000) + '"}';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // Should not throw errors during compression/decompression
            (0, vitest_1.expect)(decompressed).toBeDefined();
        });
        (0, vitest_1.it)('should handle strings with unbalanced quotes', async () => {
            // Create data that when truncated might have unbalanced quotes
            const testData = '{"message": "' + 'A'.repeat(1000) + '"}';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // Should not throw errors during compression/decompression
            (0, vitest_1.expect)(decompressed).toBeDefined();
        });
        (0, vitest_1.it)('should handle strings with unbalanced braces', async () => {
            // Create data that when truncated might have unbalanced braces
            const testData = '{"level1": {"level2": {"data": "' + 'A'.repeat(1000) + '"}}}';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // Should not throw errors during compression/decompression
            (0, vitest_1.expect)(decompressed).toBeDefined();
        });
        (0, vitest_1.it)('should handle strings with unbalanced brackets', async () => {
            // Create data that when truncated might have unbalanced brackets
            const testData = '{"array": [' + '"item1", '.repeat(200) + '"finalItem"]}';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // Should not throw errors during compression/decompression
            (0, vitest_1.expect)(decompressed).toBeDefined();
        });
    });
    (0, vitest_1.describe)('memory management', () => {
        (0, vitest_1.it)('should remove entries from compression map after decompression', async () => {
            const originalData = 'Test data for memory test';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(originalData);
            // Access the internal compressionMap to check it exists
            // Note: This is a bit of a hack to test internal state, but necessary for this mock
            const mapSizeBefore = global.compressionMap?.size || 0;
            await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            // After decompression, the entry should be removed
            // Since we can't directly access the internal map, we test by trying to decompress again
            await (0, vitest_1.expect)((0, ctx_zip_mock_ts_1.decompress)(compressed)).rejects.toThrow('Decompression failed: Invalid or expired compressed data');
        });
        (0, vitest_1.it)('should not leak memory with multiple compress/decompress cycles', async () => {
            // Perform multiple compression/decompression cycles
            for (let i = 0; i < 10; i++) {
                const testData = `Test data iteration ${i}`;
                const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
                await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            }
            // All entries should be cleaned up (we can't directly test the map size in this mock)
            // But we can verify that new compressions still work
            const testData = 'Final test data';
            const compressed = await (0, ctx_zip_mock_ts_1.compress)(testData);
            const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(testData);
        });
    });
});
//# sourceMappingURL=ctx-zip.mock.test.js.map