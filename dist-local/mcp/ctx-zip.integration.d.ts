/**
 * ctx-zip Integration for LAPA
 *
 * This module integrates ctx-zip for context compression in the MCP sandbox environment.
 * It provides utilities for compressing and decompressing context payloads to reduce
 * token usage by 80%+ while maintaining semantic meaning.
 */
export interface CompressionStats {
    sessionId: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    reductionPercentage: number;
    timestamp: Date;
    contextType?: string;
}
export interface CompressionFeedback {
    sessionId: string;
    effectivenessRating: number;
    semanticPreservation: number;
    notes?: string;
    timestamp: Date;
}
export interface CompressionOptions {
    quality?: number;
    preserveSemantic?: boolean;
    contextType?: string;
}
/**
 * Compresses a context payload using ctx-zip
 * @param context The raw context string to compress
 * @param options Compression options
 * @returns Compressed context buffer
 */
export declare function compressContext(context: string, _options?: CompressionOptions): Promise<Buffer>;
/**
 * Decompresses a context payload using ctx-zip
 * @param compressedContext The compressed context buffer
 * @returns Decompressed context string
 */
export declare function decompressContext(compressedContext: Buffer): Promise<string>;
/**
 * Stores compressed context to local filesystem
 * @param sessionId Unique session identifier
 * @param compressedContext Compressed context buffer
 */
export declare function storeCompressedContext(sessionId: string, compressedContext: Buffer): Promise<void>;
/**
 * Loads compressed context from local filesystem
 * @param sessionId Unique session identifier
 * @returns Compressed context buffer
 */
export declare function loadCompressedContext(sessionId: string): Promise<Buffer>;
/**
 * Tests ctx-zip compression effectiveness
 * @param testPayload Test context payload
 * @returns Compression statistics
 */
export declare function testCtxZipCompression(testPayload: string): Promise<CompressionStats>;
/**
 * Records compression statistics for feedback analysis
 * @param stats Compression statistics to record
 */
export declare function recordCompressionStats(stats: CompressionStats): Promise<void>;
/**
 * Records user feedback on compression effectiveness
 * @param feedback Feedback data to record
 */
export declare function recordCompressionFeedback(feedback: CompressionFeedback): Promise<void>;
/**
 * Analyzes compression effectiveness based on recorded stats and feedback
 * @returns Analysis report
 */
export declare function analyzeCompressionEffectiveness(): Promise<{
    averageReduction: number;
    totalSessions: number;
    effectivenessRating: number;
    recommendations: string[];
}>;
/**
 * Optimizes compression parameters based on feedback
 * @returns Optimization recommendations
 */
export declare function optimizeCompressionParameters(): Promise<{
    suggestedQuality: number;
    preserveSemantic: boolean;
    notes: string;
}>;
/**
 * ctx-zip Feedback Loop Controller
 */
export declare class CtxZipFeedbackController {
    private statsBuffer;
    private feedbackBuffer;
    private bufferSize;
    constructor(bufferSize?: number);
    /**
     * Adds compression stats to the buffer
     * @param stats Compression statistics
     */
    addStats(stats: CompressionStats): void;
    /**
     * Adds feedback to the buffer
     * @param feedback Compression feedback
     */
    addFeedback(feedback: CompressionFeedback): void;
    /**
     * Processes buffered data and provides optimization suggestions
     * @returns Optimization suggestions
     */
    processFeedback(): Promise<{
        avgEffectiveness: number;
        avgSemanticPreservation: number;
        compressionImprovement: string;
    }>;
}
export declare const ctxZipFeedbackController: CtxZipFeedbackController;
