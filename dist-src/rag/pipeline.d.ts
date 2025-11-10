/**
 * RAG Pipeline Implementation
 *
 * Main class for orchestrating the Retrieval-Augmented Generation pipeline
 * using NVIDIA NeMo Retriever for document processing.
 */
import { RAGConfig } from './config';
export interface ProcessedDocument {
    /**
     * Original file path
     */
    filePath: string;
    /**
     * Extracted text content
     */
    text: string;
    /**
     * Metadata about the document
     */
    metadata: {
        /**
         * File type (pdf, mp4, etc.)
         */
        fileType: string;
        /**
         * File size in bytes
         */
        fileSize: number;
        /**
         * Processing timestamp
         */
        processedAt: Date;
        /**
         * Processing duration in milliseconds
         */
        processingTime: number;
    };
    /**
     * Preprocessed text chunks
     */
    chunks: string[];
}
export declare class RAGPipeline {
    private config;
    private pdfProcessor;
    private videoProcessor;
    private fileHandler;
    private textPreprocessor;
    constructor(config?: Partial<RAGConfig>);
    /**
     * Process a document file using the appropriate processor
     * @param filePath Path to the document file
     * @returns Processed document with extracted text and metadata
     */
    processDocument(filePath: string): Promise<ProcessedDocument>;
    /**
     * Process multiple documents concurrently
     * @param filePaths Array of document file paths
     * @returns Array of processed documents
     */
    processDocuments(filePaths: string[]): Promise<ProcessedDocument[]>;
    /**
     * Update configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig: Partial<RAGConfig>): void;
}
