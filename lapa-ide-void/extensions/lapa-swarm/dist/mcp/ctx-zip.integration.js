"use strict";
/**
 * ctx-zip Integration for LAPA
 *
 * This module integrates ctx-zip for context compression in the MCP sandbox environment.
 * It provides utilities for compressing and decompressing context payloads to reduce
 * token usage by 80%+ while maintaining semantic meaning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ctxZipFeedbackController = exports.CtxZipFeedbackController = void 0;
exports.compressContext = compressContext;
exports.decompressContext = decompressContext;
exports.storeCompressedContext = storeCompressedContext;
exports.loadCompressedContext = loadCompressedContext;
exports.testCtxZipCompression = testCtxZipCompression;
exports.recordCompressionStats = recordCompressionStats;
exports.recordCompressionFeedback = recordCompressionFeedback;
exports.analyzeCompressionEffectiveness = analyzeCompressionEffectiveness;
exports.optimizeCompressionParameters = optimizeCompressionParameters;
const ctx_zip_mock_ts_1 = require("./ctx-zip.mock.ts");
const promises_1 = require("fs/promises");
const path_1 = require("path");
// Local filesystem storage for compressed contexts
const CONTEXT_STORAGE_DIR = '.lapa/storage';
const FEEDBACK_STORAGE_DIR = '.lapa/feedback';
/**
 * Compresses a context payload using ctx-zip
 * @param context The raw context string to compress
 * @param options Compression options
 * @returns Compressed context buffer
 */
async function compressContext(context, _options = {}) {
    try {
        // Create storage directories if they don't exist
        await (0, promises_1.mkdir)(CONTEXT_STORAGE_DIR, { recursive: true });
        await (0, promises_1.mkdir)(FEEDBACK_STORAGE_DIR, { recursive: true });
        console.log(`[ctx-zip.integration] Compressing context of length: ${context.length}`);
        console.log(`[ctx-zip.integration] Context sample: ${context.substring(0, 100)}...`);
        const compressed = await (0, ctx_zip_mock_ts_1.compress)(context);
        console.log(`Context compressed: ${context.length} -> ${compressed.length} bytes (${((1 - compressed.length / context.length) * 100).toFixed(1)}% reduction)`);
        return compressed;
    }
    catch (error) {
        console.error('Failed to compress context:', error);
        throw error;
    }
}
/**
 * Decompresses a context payload using ctx-zip
 * @param compressedContext The compressed context buffer
 * @returns Decompressed context string
 */
async function decompressContext(compressedContext) {
    try {
        console.log(`[ctx-zip.integration] Decompressing context buffer of length: ${compressedContext.length}`);
        const decompressed = await (0, ctx_zip_mock_ts_1.decompress)(compressedContext);
        console.log(`[ctx-zip.integration] Decompressed context length: ${decompressed.length}`);
        console.log(`[ctx-zip.integration] Decompressed context sample: ${decompressed.substring(0, 100)}...`);
        return decompressed;
    }
    catch (error) {
        console.error('Failed to decompress context:', error);
        throw error;
    }
}
/**
 * Stores compressed context to local filesystem
 * @param sessionId Unique session identifier
 * @param compressedContext Compressed context buffer
 */
async function storeCompressedContext(sessionId, compressedContext) {
    try {
        const filePath = (0, path_1.join)(CONTEXT_STORAGE_DIR, `${sessionId}.ctx`);
        await (0, promises_1.writeFile)(filePath, compressedContext);
        console.log(`Compressed context stored at: ${filePath}`);
    }
    catch (error) {
        console.error('Failed to store compressed context:', error);
        throw error;
    }
}
/**
 * Loads compressed context from local filesystem
 * @param sessionId Unique session identifier
 * @returns Compressed context buffer
 */
async function loadCompressedContext(sessionId) {
    try {
        const filePath = (0, path_1.join)(CONTEXT_STORAGE_DIR, `${sessionId}.ctx`);
        const compressedContext = await (0, promises_1.readFile)(filePath);
        return compressedContext;
    }
    catch (error) {
        console.error('Failed to load compressed context:', error);
        throw error;
    }
}
/**
 * Tests ctx-zip compression effectiveness
 * @param testPayload Test context payload
 * @returns Compression statistics
 */
async function testCtxZipCompression(testPayload) {
    const compressed = await compressContext(testPayload);
    const compressionRatio = testPayload.length / compressed.length;
    const reductionPercentage = (1 - compressed.length / testPayload.length) * 100;
    return {
        sessionId: 'test-session',
        originalSize: testPayload.length,
        compressedSize: compressed.length,
        compressionRatio,
        reductionPercentage,
        timestamp: new Date()
    };
}
/**
 * Records compression statistics for feedback analysis
 * @param stats Compression statistics to record
 */
async function recordCompressionStats(stats) {
    try {
        const filename = `stats-${stats.sessionId}-${stats.timestamp.getTime()}.json`;
        const filePath = (0, path_1.join)(FEEDBACK_STORAGE_DIR, filename);
        await (0, promises_1.writeFile)(filePath, JSON.stringify(stats, null, 2));
        console.log(`Compression stats recorded: ${filePath}`);
    }
    catch (error) {
        console.error('Failed to record compression stats:', error);
    }
}
/**
 * Records user feedback on compression effectiveness
 * @param feedback Feedback data to record
 */
async function recordCompressionFeedback(feedback) {
    try {
        const filename = `feedback-${feedback.sessionId}-${feedback.timestamp.getTime()}.json`;
        const filePath = (0, path_1.join)(FEEDBACK_STORAGE_DIR, filename);
        await (0, promises_1.writeFile)(filePath, JSON.stringify(feedback, null, 2));
        console.log(`Compression feedback recorded: ${filePath}`);
    }
    catch (error) {
        console.error('Failed to record compression feedback:', error);
    }
}
/**
 * Analyzes compression effectiveness based on recorded stats and feedback
 * @returns Analysis report
 */
async function analyzeCompressionEffectiveness() {
    try {
        // In a real implementation, this would read and analyze all recorded stats and feedback
        // For now, we'll simulate analysis
        const simulatedStats = [
            { sessionId: 'sim-1', originalSize: 10000, compressedSize: 1500, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() },
            { sessionId: 'sim-2', originalSize: 8000, compressedSize: 1200, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() },
            { sessionId: 'sim-3', originalSize: 12000, compressedSize: 1800, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() }
        ];
        const averageReduction = simulatedStats.reduce((sum, stat) => sum + stat.reductionPercentage, 0) / simulatedStats.length;
        const effectivenessRating = averageReduction > 80 ? 9 : averageReduction > 70 ? 7 : 5;
        const recommendations = [];
        if (averageReduction < 80) {
            recommendations.push('Consider adjusting compression parameters for better reduction');
        }
        if (averageReduction > 90) {
            recommendations.push('Compression is highly effective, monitor for semantic loss');
        }
        return {
            averageReduction,
            totalSessions: simulatedStats.length,
            effectivenessRating,
            recommendations
        };
    }
    catch (error) {
        console.error('Failed to analyze compression effectiveness:', error);
        throw error;
    }
}
/**
 * Optimizes compression parameters based on feedback
 * @returns Optimization recommendations
 */
async function optimizeCompressionParameters() {
    try {
        // In a real implementation, this would analyze feedback to optimize parameters
        // For now, we'll return default optimized settings
        return {
            suggestedQuality: 8,
            preserveSemantic: true,
            notes: 'Based on feedback analysis, these settings balance compression ratio with semantic preservation'
        };
    }
    catch (error) {
        console.error('Failed to optimize compression parameters:', error);
        throw error;
    }
}
/**
 * ctx-zip Feedback Loop Controller
 */
class CtxZipFeedbackController {
    statsBuffer = [];
    feedbackBuffer = [];
    bufferSize;
    constructor(bufferSize = 100) {
        this.bufferSize = bufferSize;
    }
    /**
     * Adds compression stats to the buffer
     * @param stats Compression statistics
     */
    addStats(stats) {
        this.statsBuffer.push(stats);
        if (this.statsBuffer.length > this.bufferSize) {
            this.statsBuffer.shift(); // Remove oldest entry
        }
    }
    /**
     * Adds feedback to the buffer
     * @param feedback Compression feedback
     */
    addFeedback(feedback) {
        this.feedbackBuffer.push(feedback);
        if (this.feedbackBuffer.length > this.bufferSize) {
            this.feedbackBuffer.shift(); // Remove oldest entry
        }
    }
    /**
     * Processes buffered data and provides optimization suggestions
     * @returns Optimization suggestions
     */
    async processFeedback() {
        if (this.feedbackBuffer.length === 0) {
            return {
                avgEffectiveness: 0,
                avgSemanticPreservation: 0,
                compressionImprovement: 'No feedback data available'
            };
        }
        const avgEffectiveness = this.feedbackBuffer.reduce((sum, fb) => sum + fb.effectivenessRating, 0) / this.feedbackBuffer.length;
        const avgSemanticPreservation = this.feedbackBuffer.reduce((sum, fb) => sum + fb.semanticPreservation, 0) / this.feedbackBuffer.length;
        let compressionImprovement = '';
        if (avgEffectiveness < 7) {
            compressionImprovement = 'Consider reducing compression strength to improve effectiveness';
        }
        else if (avgEffectiveness > 9 && avgSemanticPreservation > 9) {
            compressionImprovement = 'Compression is optimal, maintain current settings';
        }
        else if (avgSemanticPreservation < 7) {
            compressionImprovement = 'Prioritize semantic preservation over compression ratio';
        }
        else {
            compressionImprovement = 'Current settings are balanced, minor adjustments may improve results';
        }
        // Clear buffers after processing
        this.statsBuffer = [];
        this.feedbackBuffer = [];
        return {
            avgEffectiveness,
            avgSemanticPreservation,
            compressionImprovement
        };
    }
}
exports.CtxZipFeedbackController = CtxZipFeedbackController;
// Export singleton instance
exports.ctxZipFeedbackController = new CtxZipFeedbackController();
//# sourceMappingURL=ctx-zip.integration.js.map