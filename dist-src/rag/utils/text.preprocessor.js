/**
 * Text Preprocessor Utility
 *
 * Utility functions for text preprocessing in the RAG pipeline.
 */
export class TextPreprocessor {
    constructor(config) {
        this.config = config;
    }
    /**
     * Split text into chunks
     * @param text Input text to split
     * @returns Array of text chunks
     */
    splitText(text) {
        // Check if text is too short
        if (text.length < this.config.minTextLength) {
            return [text];
        }
        // Normalize whitespace
        const normalizedText = this.normalizeWhitespace(text);
        // Split into chunks
        const chunks = [];
        const { maxChunkSize, chunkOverlap } = this.config;
        // Simple chunking algorithm
        let position = 0;
        while (position < normalizedText.length) {
            // Calculate chunk end position
            let endPosition = Math.min(position + maxChunkSize, normalizedText.length);
            // If not at the end of text, try to find a sentence boundary
            if (endPosition < normalizedText.length) {
                const lastPeriod = normalizedText.lastIndexOf('.', endPosition);
                const lastQuestion = normalizedText.lastIndexOf('?', endPosition);
                const lastExclamation = normalizedText.lastIndexOf('!', endPosition);
                // Find the last sentence boundary
                const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
                // If we found a boundary within a reasonable distance from the chunk end, use it
                if (lastBoundary > position + maxChunkSize / 2) {
                    endPosition = lastBoundary + 1;
                }
            }
            // Extract chunk
            const chunk = normalizedText.substring(position, endPosition).trim();
            // Only add non-empty chunks
            if (chunk.length > 0) {
                chunks.push(chunk);
            }
            // Move position forward, accounting for overlap
            position = endPosition - chunkOverlap;
            // Ensure we don't get stuck in an infinite loop
            if (position <= 0) {
                position = endPosition;
            }
        }
        return chunks;
    }
    /**
     * Normalize whitespace in text
     * @param text Input text
     * @returns Text with normalized whitespace
     */
    normalizeWhitespace(text) {
        // Replace multiple whitespace characters with single space
        return text.replace(/\s+/g, ' ');
    }
    /**
     * Clean text by removing unnecessary characters
     * @param text Input text
     * @returns Cleaned text
     */
    cleanText(text) {
        // Remove extra whitespace
        let cleaned = text.trim();
        // Remove excessive newlines
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        // Remove special characters that might interfere with processing
        // but preserve common punctuation
        cleaned = cleaned.replace(/[^\w\s.,!?;:()\-"'[\]/\\]+/g, '');
        return cleaned;
    }
    /**
     * Filter out low-quality chunks
     * @param chunks Array of text chunks
     * @returns Filtered array of text chunks
     */
    filterChunks(chunks) {
        return chunks.filter(chunk => {
            // Remove chunks that are too short
            if (chunk.length < this.config.minTextLength) {
                return false;
            }
            // Remove chunks that are mostly whitespace
            const whitespaceRatio = (chunk.match(/\s/g) || []).length / chunk.length;
            if (whitespaceRatio > 0.5) {
                return false;
            }
            // Remove chunks with too little alphanumeric content
            const alphanumericCount = (chunk.match(/[a-zA-Z0-9]/g) || []).length;
            const alphanumericRatio = alphanumericCount / chunk.length;
            if (alphanumericRatio < 0.1) {
                return false;
            }
            return true;
        });
    }
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
//# sourceMappingURL=text.preprocessor.js.map