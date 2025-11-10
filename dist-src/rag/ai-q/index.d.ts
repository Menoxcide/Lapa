/**
 * AI-Q Research Assistant Integration
 *
 * Integration module for the AI-Q research assistant to use the RAG pipeline
 * for processing PDF and video documents.
 */
import { ProcessedDocument } from '../pipeline';
import { RAGConfig } from '../config';
export interface ResearchQuery {
    /**
     * Query text
     */
    query: string;
    /**
     * Document paths to process
     */
    documentPaths?: string[];
    /**
     * Whether to process documents before querying
     */
    processDocuments?: boolean;
}
export interface ResearchResult {
    /**
     * Query that was processed
     */
    query: string;
    /**
     * Processed documents
     */
    documents: ProcessedDocument[];
    /**
     * Extracted information relevant to the query
     */
    extractedInformation: string;
    /**
     * Processing timestamp
     */
    processedAt: Date;
}
export declare class AIQResearchAssistant {
    private ragPipeline;
    constructor(config?: Partial<RAGConfig>);
    /**
     * Process research query with document analysis
     * @param researchQuery Research query with optional documents
     * @returns Research result with extracted information
     */
    processResearchQuery(researchQuery: ResearchQuery): Promise<ResearchResult>;
    /**
     * Extract information from processed documents based on query
     * @param documents Processed documents
     * @param query Research query
     * @returns Extracted information
     */
    private extractInformation;
    /**
     * Update RAG pipeline configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig: Partial<RAGConfig>): void;
}
