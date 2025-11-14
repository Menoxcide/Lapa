"use strict";
/**
 * RAG Pipeline Implementation
 *
 * Main class for orchestrating the Retrieval-Augmented Generation pipeline
 * using NVIDIA NeMo Retriever for document processing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGPipeline = void 0;
const config_ts_1 = require("./config.ts");
const pdf_processor_ts_1 = require("./processors/pdf.processor.ts");
const video_processor_ts_1 = require("./processors/video.processor.ts");
const file_handler_ts_1 = require("./utils/file.handler.ts");
const text_preprocessor_ts_1 = require("./utils/text.preprocessor.ts");
const chroma_refine_ts_1 = require("./chroma-refine.ts");
class RAGPipeline {
    config;
    pdfProcessor;
    videoProcessor;
    fileHandler;
    textPreprocessor;
    chromaInitialized;
    constructor(config) {
        this.config = { ...config_ts_1.DEFAULT_RAG_CONFIG, ...config };
        this.fileHandler = new file_handler_ts_1.FileHandler(this.config.fileHandling);
        this.textPreprocessor = new text_preprocessor_ts_1.TextPreprocessor(this.config.preprocessing);
        this.pdfProcessor = new pdf_processor_ts_1.PDFProcessor(this.config.nemoRetriever);
        this.videoProcessor = new video_processor_ts_1.VideoProcessor(this.config.nemoRetriever);
        this.chromaInitialized = false;
    }
    /**
     * Initializes the RAG pipeline including Chroma integration (Phase 12)
     */
    async initialize() {
        try {
            await chroma_refine_ts_1.chromaRefine.initialize();
            this.chromaInitialized = true;
        }
        catch (error) {
            console.warn('Chroma initialization failed, continuing without vector search:', error);
            this.chromaInitialized = false;
        }
    }
    /**
     * Process a document file using the appropriate processor
     * @param filePath Path to the document file
     * @returns Processed document with extracted text and metadata
     */
    async processDocument(filePath) {
        const startTime = Date.now();
        // Validate file
        const fileInfo = await this.fileHandler.validateFile(filePath);
        // Extract text based on file type
        let text;
        switch (fileInfo.type) {
            case 'pdf':
                if (!this.config.nemoRetriever.pdfProcessing) {
                    throw new Error('PDF processing is disabled in configuration');
                }
                text = await this.pdfProcessor.extractText(filePath);
                break;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'wmv':
            case 'flv':
            case 'webm':
                if (!this.config.nemoRetriever.videoProcessing) {
                    throw new Error('Video processing is disabled in configuration');
                }
                text = await this.videoProcessor.extractText(filePath);
                break;
            default:
                throw new Error(`Unsupported file type: ${fileInfo.type}`);
        }
        // Preprocess text
        const chunks = this.textPreprocessor.splitText(text);
        const processingTime = Date.now() - startTime;
        const processedDoc = {
            filePath,
            text,
            metadata: {
                fileType: fileInfo.type,
                fileSize: fileInfo.size,
                processedAt: new Date(),
                processingTime
            },
            chunks
        };
        // Phase 12: Index document in Chroma for vector search
        if (this.chromaInitialized) {
            try {
                // Index each chunk as a separate document
                for (let i = 0; i < chunks.length; i++) {
                    await chroma_refine_ts_1.chromaRefine.indexDocument({
                        id: `rag_${filePath}_chunk_${i}`,
                        content: chunks[i],
                        metadata: {
                            filePath,
                            fileType: fileInfo.type,
                            chunkIndex: i,
                            timestamp: new Date(),
                            source: 'rag'
                        }
                    });
                }
            }
            catch (error) {
                console.warn('Failed to index document in Chroma:', error);
            }
        }
        return processedDoc;
    }
    /**
     * Process multiple documents concurrently
     * @param filePaths Array of document file paths
     * @returns Array of processed documents
     */
    async processDocuments(filePaths) {
        // Process documents concurrently with a reasonable limit
        const concurrencyLimit = 3;
        const results = [];
        for (let i = 0; i < filePaths.length; i += concurrencyLimit) {
            const batch = filePaths.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(filePath => this.processDocument(filePath));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    /**
     * Searches for similar content using Chroma vector search (Phase 12)
     * @param query Search query
     * @param limit Maximum number of results
     * @returns Array of similar document chunks
     */
    async searchSimilar(query, limit = 10) {
        if (!this.chromaInitialized) {
            return [];
        }
        try {
            const results = await chroma_refine_ts_1.chromaRefine.searchSimilar(query, { limit });
            return results.map(result => ({
                content: result.document.content,
                filePath: result.document.metadata.filePath || '',
                chunkIndex: result.document.metadata.chunkIndex || 0,
                similarity: result.similarity
            }));
        }
        catch (error) {
            console.error('Failed to search similar content:', error);
            return [];
        }
    }
    /**
     * Update configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Update processors with new config if needed
        this.pdfProcessor.updateConfig(this.config.nemoRetriever);
        this.videoProcessor.updateConfig(this.config.nemoRetriever);
    }
}
exports.RAGPipeline = RAGPipeline;
//# sourceMappingURL=pipeline.js.map