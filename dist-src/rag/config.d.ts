/**
 * RAG Pipeline Configuration
 *
 * Configuration options for the RAG pipeline using NVIDIA NeMo Retriever
 */
export interface RAGConfig {
    /**
     * NeMo Retriever settings
     */
    nemoRetriever: {
        /**
         * Base URL for NeMo Retriever service
         */
        baseUrl: string;
        /**
         * API key for NeMo Retriever service (if required)
         */
        apiKey?: string;
        /**
         * Timeout for NeMo Retriever requests (in milliseconds)
         */
        timeout: number;
        /**
         * Enable/disable PDF processing
         */
        pdfProcessing: boolean;
        /**
         * Enable/disable video processing
         */
        videoProcessing: boolean;
    };
    /**
     * Text preprocessing settings
     */
    preprocessing: {
        /**
         * Maximum chunk size for text splitting
         */
        maxChunkSize: number;
        /**
         * Overlap between chunks
         */
        chunkOverlap: number;
        /**
         * Minimum text length to process
         */
        minTextLength: number;
    };
    /**
     * File handling settings
     */
    fileHandling: {
        /**
         * Supported file types for processing
         */
        supportedTypes: string[];
        /**
         * Maximum file size (in bytes)
         */
        maxFileSize: number;
        /**
         * Temporary directory for file processing
         */
        tempDir: string;
    };
}
/**
 * Default RAG configuration
 */
export declare const DEFAULT_RAG_CONFIG: RAGConfig;
