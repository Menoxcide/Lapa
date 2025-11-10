/**
 * RAG Pipeline Configuration
 *
 * Configuration options for the RAG pipeline using NVIDIA NeMo Retriever
 */
/**
 * Default RAG configuration
 */
export const DEFAULT_RAG_CONFIG = {
    nemoRetriever: {
        baseUrl: 'http://localhost:8000', // Default NeMo Retriever endpoint
        timeout: 30000, // 30 seconds
        pdfProcessing: true,
        videoProcessing: true
    },
    preprocessing: {
        maxChunkSize: 1024,
        chunkOverlap: 150,
        minTextLength: 10
    },
    fileHandling: {
        supportedTypes: ['pdf', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        tempDir: './.lapa/temp/rag'
    }
};
//# sourceMappingURL=config.js.map