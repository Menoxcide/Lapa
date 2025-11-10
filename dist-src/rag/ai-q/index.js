/**
 * AI-Q Research Assistant Integration
 *
 * Integration module for the AI-Q research assistant to use the RAG pipeline
 * for processing PDF and video documents.
 */
import { RAGPipeline } from '../pipeline';
export class AIQResearchAssistant {
    constructor(config) {
        this.ragPipeline = new RAGPipeline(config);
    }
    /**
     * Process research query with document analysis
     * @param researchQuery Research query with optional documents
     * @returns Research result with extracted information
     */
    async processResearchQuery(researchQuery) {
        const documents = [];
        // Process documents if provided
        if (researchQuery.documentPaths && researchQuery.documentPaths.length > 0) {
            documents.push(...await this.ragPipeline.processDocuments(researchQuery.documentPaths));
        }
        // Extract relevant information based on the query
        // In a real implementation, this would use the NeMo Retriever models
        // to find relevant information in the processed documents
        const extractedInformation = this.extractInformation(documents, researchQuery.query);
        return {
            query: researchQuery.query,
            documents,
            extractedInformation,
            processedAt: new Date()
        };
    }
    /**
     * Extract information from processed documents based on query
     * @param documents Processed documents
     * @param query Research query
     * @returns Extracted information
     */
    extractInformation(documents, query) {
        // In a real implementation, this would use NeMo Retriever's embedding and search capabilities
        // to find relevant information in the documents based on the query
        // For demonstration, we'll return a summary
        if (documents.length === 0) {
            return `No documents provided for query: "${query}"`;
        }
        const docTypes = [...new Set(documents.map(d => d.metadata.fileType))];
        const totalSize = documents.reduce((sum, doc) => sum + doc.metadata.fileSize, 0);
        const totalProcessingTime = documents.reduce((sum, doc) => sum + doc.metadata.processingTime, 0);
        return `Processed ${documents.length} documents (${docTypes.join(', ')}) with total size of ${totalSize} bytes in ${totalProcessingTime}ms. Relevant information for query "${query}" would be extracted using NeMo Retriever's semantic search capabilities.`;
    }
    /**
     * Update RAG pipeline configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig) {
        this.ragPipeline.updateConfig(newConfig);
    }
}
//# sourceMappingURL=index.js.map