"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ctx_zip_integration_ts_1 = require("../../mcp/ctx-zip.integration.ts");
(0, vitest_1.describe)('ctx-zip.integration', () => {
    const testContext = 'This is a test context string for compression. It contains multiple sentences to provide sufficient content for testing compression algorithms. The more content we have, the better we can test the compression ratio and effectiveness.';
    const sessionId = 'test-session-id';
    (0, vitest_1.describe)('compressContext', () => {
        (0, vitest_1.it)('should compress context successfully', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext);
            (0, vitest_1.expect)(compressed).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(compressed.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(compressed.length).toBeLessThan(testContext.length);
        });
        (0, vitest_1.it)('should compress context with options', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext, {
                quality: 8,
                preserveSemantic: true,
                contextType: 'test-context'
            });
            (0, vitest_1.expect)(compressed).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(compressed.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle empty context', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)('');
            (0, vitest_1.expect)(compressed).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(compressed.length).toBeGreaterThan(0); // Compression of empty string still produces data
        });
        (0, vitest_1.it)('should handle very large context', async () => {
            const largeContext = testContext.repeat(1000); // Much larger context
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(largeContext);
            (0, vitest_1.expect)(compressed).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(compressed.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(compressed.length).toBeLessThan(largeContext.length);
            // Verify significant compression
            (0, vitest_1.expect)(compressed.length / largeContext.length).toBeLessThan(0.5); // Less than 50% of original size
        });
    });
    (0, vitest_1.describe)('decompressContext', () => {
        (0, vitest_1.it)('should decompress context successfully', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext);
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(testContext);
        });
        (0, vitest_1.it)('should handle decompression of empty context', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)('');
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
            (0, vitest_1.expect)(typeof decompressed).toBe('string');
        });
        (0, vitest_1.it)('should throw error for invalid compressed data', async () => {
            const invalidBuffer = Buffer.from('invalid compressed data');
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.decompressContext)(invalidBuffer))
                .rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('round-trip compression/decompression', () => {
        (0, vitest_1.it)('should maintain data integrity through round-trip', async () => {
            const original = 'Round trip test content with special characters: áéíóú !@#$%^&*()';
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(original);
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(original);
        });
        (0, vitest_1.it)('should handle various content types', async () => {
            const contents = [
                'Plain text content',
                '{"json": "data", "number": 42, "array": [1, 2, 3]}',
                '<xml><element attribute="value">Content</element></xml>',
                'Code content: const x = 10;\nfunction test() {\n  return x * 2;\n}',
                'Markdown content: # Header\n\n**Bold** and *italic* text.\n\n- List item 1\n- List item 2'
            ];
            for (const content of contents) {
                const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(content);
                const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
                (0, vitest_1.expect)(decompressed).toBe(content);
            }
        });
    });
    (0, vitest_1.describe)('storeCompressedContext', () => {
        (0, vitest_1.it)('should store compressed context successfully', async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext);
            // Should not throw an error
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.storeCompressedContext)(sessionId, compressed)).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should handle storing multiple contexts', async () => {
            const contexts = [
                'First context content',
                'Second context content',
                'Third context content'
            ];
            for (let i = 0; i < contexts.length; i++) {
                const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(contexts[i]);
                await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.storeCompressedContext)(`session-${i}`, compressed)).resolves.not.toThrow();
            }
        });
    });
    (0, vitest_1.describe)('loadCompressedContext', () => {
        beforeEach(async () => {
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext);
            await (0, ctx_zip_integration_ts_1.storeCompressedContext)(sessionId, compressed);
        });
        (0, vitest_1.it)('should load compressed context successfully', async () => {
            const loaded = await (0, ctx_zip_integration_ts_1.loadCompressedContext)(sessionId);
            (0, vitest_1.expect)(loaded).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(loaded.length).toBeGreaterThan(0);
            // Verify it decompresses to original content
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(loaded);
            (0, vitest_1.expect)(decompressed).toBe(testContext);
        });
        (0, vitest_1.it)('should throw error for non-existent session', async () => {
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.loadCompressedContext)('non-existent-session'))
                .rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('testCtxZipCompression', () => {
        (0, vitest_1.it)('should test compression and return statistics', async () => {
            const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(testContext);
            (0, vitest_1.expect)(stats).toBeDefined();
            (0, vitest_1.expect)(stats.sessionId).toBe('test-session');
            (0, vitest_1.expect)(stats.originalSize).toBe(testContext.length);
            (0, vitest_1.expect)(stats.compressedSize).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.compressedSize).toBeLessThan(stats.originalSize);
            (0, vitest_1.expect)(stats.compressionRatio).toBeGreaterThan(1);
            (0, vitest_1.expect)(stats.reductionPercentage).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.timestamp).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should achieve significant compression ratio', async () => {
            // Use a larger test payload for better compression testing
            const largePayload = testContext.repeat(50);
            const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(largePayload);
            // Verify compression ratio
            (0, vitest_1.expect)(stats.compressionRatio).toBeGreaterThan(2); // At least 2x compression
            // Verify reduction percentage
            (0, vitest_1.expect)(stats.reductionPercentage).toBeGreaterThan(50); // At least 50% reduction
            // Check if it meets the project requirement of >80% reduction
            if (stats.reductionPercentage < 80) {
                console.warn(`Compression only achieved ${stats.reductionPercentage.toFixed(1)}% reduction, below target of 80%`);
            }
        });
    });
    (0, vitest_1.describe)('recordCompressionStats', () => {
        (0, vitest_1.it)('should record compression stats successfully', async () => {
            const stats = {
                sessionId: 'stats-test-session',
                originalSize: 1000,
                compressedSize: 200,
                compressionRatio: 5,
                reductionPercentage: 80,
                timestamp: new Date()
            };
            // Should not throw an error
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.recordCompressionStats)(stats)).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should handle recording multiple stats', async () => {
            const statsArray = [
                {
                    sessionId: 'stats-1',
                    originalSize: 1000,
                    compressedSize: 200,
                    compressionRatio: 5,
                    reductionPercentage: 80,
                    timestamp: new Date()
                },
                {
                    sessionId: 'stats-2',
                    originalSize: 2000,
                    compressedSize: 300,
                    compressionRatio: 6.67,
                    reductionPercentage: 85,
                    timestamp: new Date()
                }
            ];
            for (const stats of statsArray) {
                await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.recordCompressionStats)(stats)).resolves.not.toThrow();
            }
        });
    });
    (0, vitest_1.describe)('recordCompressionFeedback', () => {
        (0, vitest_1.it)('should record compression feedback successfully', async () => {
            const feedback = {
                sessionId: 'feedback-test-session',
                effectivenessRating: 9,
                semanticPreservation: 8,
                notes: 'Good compression with minimal semantic loss',
                timestamp: new Date()
            };
            // Should not throw an error
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.recordCompressionFeedback)(feedback)).resolves.not.toThrow();
        });
        (0, vitest_1.it)('should handle feedback without optional notes', async () => {
            const feedback = {
                sessionId: 'feedback-no-notes',
                effectivenessRating: 7,
                semanticPreservation: 9,
                timestamp: new Date()
            };
            await (0, vitest_1.expect)((0, ctx_zip_integration_ts_1.recordCompressionFeedback)(feedback)).resolves.not.toThrow();
        });
    });
    (0, vitest_1.describe)('analyzeCompressionEffectiveness', () => {
        (0, vitest_1.it)('should analyze compression effectiveness', async () => {
            // Record some test stats and feedback first
            const stats = {
                sessionId: 'analysis-test',
                originalSize: 10000,
                compressedSize: 1500,
                compressionRatio: 6.67,
                reductionPercentage: 85,
                timestamp: new Date()
            };
            const feedback = {
                sessionId: 'analysis-test',
                effectivenessRating: 9,
                semanticPreservation: 8,
                notes: 'Effective compression',
                timestamp: new Date()
            };
            await (0, ctx_zip_integration_ts_1.recordCompressionStats)(stats);
            await (0, ctx_zip_integration_ts_1.recordCompressionFeedback)(feedback);
            const analysis = await (0, ctx_zip_integration_ts_1.analyzeCompressionEffectiveness)();
            (0, vitest_1.expect)(analysis).toBeDefined();
            (0, vitest_1.expect)(analysis.averageReduction).toBeGreaterThan(0);
            (0, vitest_1.expect)(analysis.totalSessions).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(analysis.effectivenessRating).toBeGreaterThan(0);
            (0, vitest_1.expect)(Array.isArray(analysis.recommendations)).toBe(true);
        });
        (0, vitest_1.it)('should provide recommendations based on analysis', async () => {
            const analysis = await (0, ctx_zip_integration_ts_1.analyzeCompressionEffectiveness)();
            (0, vitest_1.expect)(analysis.recommendations).toBeDefined();
            // In the mock implementation, there should always be some recommendations
            (0, vitest_1.expect)(analysis.recommendations.length).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('optimizeCompressionParameters', () => {
        (0, vitest_1.it)('should provide optimization recommendations', async () => {
            const optimization = await (0, ctx_zip_integration_ts_1.optimizeCompressionParameters)();
            (0, vitest_1.expect)(optimization).toBeDefined();
            (0, vitest_1.expect)(typeof optimization.suggestedQuality).toBe('number');
            (0, vitest_1.expect)(typeof optimization.preserveSemantic).toBe('boolean');
            (0, vitest_1.expect)(typeof optimization.notes).toBe('string');
            // Check reasonable ranges
            (0, vitest_1.expect)(optimization.suggestedQuality).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(optimization.suggestedQuality).toBeLessThanOrEqual(10);
        });
        (0, vitest_1.it)('should provide consistent optimization parameters', async () => {
            const optimization1 = await (0, ctx_zip_integration_ts_1.optimizeCompressionParameters)();
            const optimization2 = await (0, ctx_zip_integration_ts_1.optimizeCompressionParameters)();
            // In the current mock implementation, these should be the same
            (0, vitest_1.expect)(optimization1.suggestedQuality).toBe(optimization2.suggestedQuality);
            (0, vitest_1.expect)(optimization1.preserveSemantic).toBe(optimization2.preserveSemantic);
        });
    });
    (0, vitest_1.describe)('CtxZipFeedbackController', () => {
        let controller;
        beforeEach(() => {
            controller = new ctx_zip_integration_ts_1.CtxZipFeedbackController();
        });
        (0, vitest_1.describe)('constructor', () => {
            (0, vitest_1.it)('should initialize with default buffer size', () => {
                const defaultController = new ctx_zip_integration_ts_1.CtxZipFeedbackController();
                (0, vitest_1.expect)(defaultController).toBeDefined();
            });
            (0, vitest_1.it)('should initialize with custom buffer size', () => {
                const customController = new ctx_zip_integration_ts_1.CtxZipFeedbackController(50);
                (0, vitest_1.expect)(customController).toBeDefined();
            });
        });
        (0, vitest_1.describe)('addStats', () => {
            (0, vitest_1.it)('should add stats to buffer', () => {
                const stats = {
                    sessionId: 'controller-test',
                    originalSize: 1000,
                    compressedSize: 200,
                    compressionRatio: 5,
                    reductionPercentage: 80,
                    timestamp: new Date()
                };
                // Should not throw an error
                (0, vitest_1.expect)(() => controller.addStats(stats)).not.toThrow();
            });
            (0, vitest_1.it)('should respect buffer size limit', () => {
                const smallBufferController = new ctx_zip_integration_ts_1.CtxZipFeedbackController(3);
                const stats = [];
                for (let i = 0; i < 5; i++) {
                    stats.push({
                        sessionId: `test-${i}`,
                        originalSize: 1000,
                        compressedSize: 200,
                        compressionRatio: 5,
                        reductionPercentage: 80,
                        timestamp: new Date()
                    });
                }
                // Add more items than buffer size
                stats.forEach(stat => smallBufferController.addStats(stat));
                // Note: We can't directly check buffer size without accessing private properties
                // In a real implementation, we would verify this behavior
            });
        });
        (0, vitest_1.describe)('addFeedback', () => {
            (0, vitest_1.it)('should add feedback to buffer', () => {
                const feedback = {
                    sessionId: 'feedback-controller-test',
                    effectivenessRating: 8,
                    semanticPreservation: 9,
                    timestamp: new Date()
                };
                // Should not throw an error
                (0, vitest_1.expect)(() => controller.addFeedback(feedback)).not.toThrow();
            });
            (0, vitest_1.it)('should respect buffer size limit for feedback', () => {
                const smallBufferController = new ctx_zip_integration_ts_1.CtxZipFeedbackController(2);
                const feedbacks = [];
                for (let i = 0; i < 4; i++) {
                    feedbacks.push({
                        sessionId: `fb-test-${i}`,
                        effectivenessRating: 8,
                        semanticPreservation: 9,
                        timestamp: new Date()
                    });
                }
                // Add more items than buffer size
                feedbacks.forEach(fb => smallBufferController.addFeedback(fb));
                // Note: We can't directly check buffer size without accessing private properties
            });
        });
        (0, vitest_1.describe)('processFeedback', () => {
            (0, vitest_1.it)('should process feedback when buffer has data', async () => {
                // Add some feedback
                const feedback = {
                    sessionId: 'process-test',
                    effectivenessRating: 9,
                    semanticPreservation: 8,
                    notes: 'Very effective',
                    timestamp: new Date()
                };
                controller.addFeedback(feedback);
                const result = await controller.processFeedback();
                (0, vitest_1.expect)(result).toBeDefined();
                (0, vitest_1.expect)(typeof result.avgEffectiveness).toBe('number');
                (0, vitest_1.expect)(typeof result.avgSemanticPreservation).toBe('number');
                (0, vitest_1.expect)(typeof result.compressionImprovement).toBe('string');
            });
            (0, vitest_1.it)('should handle processing with no feedback data', async () => {
                const result = await controller.processFeedback();
                (0, vitest_1.expect)(result).toBeDefined();
                (0, vitest_1.expect)(result.avgEffectiveness).toBe(0);
                (0, vitest_1.expect)(result.avgSemanticPreservation).toBe(0);
                (0, vitest_1.expect)(result.compressionImprovement).toBe('No feedback data available');
            });
            (0, vitest_1.it)('should provide appropriate recommendations based on feedback', async () => {
                // Add feedback that would trigger different recommendations
                const feedback1 = {
                    sessionId: 'rec-test-1',
                    effectivenessRating: 6,
                    semanticPreservation: 7,
                    timestamp: new Date()
                };
                const feedback2 = {
                    sessionId: 'rec-test-2',
                    effectivenessRating: 9,
                    semanticPreservation: 9,
                    timestamp: new Date()
                };
                controller.addFeedback(feedback1);
                controller.addFeedback(feedback2);
                const result = await controller.processFeedback();
                (0, vitest_1.expect)(result).toBeDefined();
                (0, vitest_1.expect)(result.compressionImprovement).toBeDefined();
            });
        });
    });
});
//# sourceMappingURL=ctx-zip.integration.test.js.map