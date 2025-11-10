/**
 * Text Preprocessor Utility
 *
 * Utility functions for text preprocessing in the RAG pipeline.
 */
interface PreprocessingConfig {
    maxChunkSize: number;
    chunkOverlap: number;
    minTextLength: number;
}
export declare class TextPreprocessor {
    private config;
    constructor(config: PreprocessingConfig);
    /**
     * Split text into chunks
     * @param text Input text to split
     * @returns Array of text chunks
     */
    splitText(text: string): string[];
    /**
     * Normalize whitespace in text
     * @param text Input text
     * @returns Text with normalized whitespace
     */
    private normalizeWhitespace;
    /**
     * Clean text by removing unnecessary characters
     * @param text Input text
     * @returns Cleaned text
     */
    cleanText(text: string): string;
    /**
     * Filter out low-quality chunks
     * @param chunks Array of text chunks
     * @returns Filtered array of text chunks
     */
    filterChunks(chunks: string[]): string[];
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig: Partial<PreprocessingConfig>): void;
}
export {};
