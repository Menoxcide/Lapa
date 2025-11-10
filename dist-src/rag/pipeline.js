/**
 * RAG Pipeline Implementation
 *
 * Main class for orchestrating the Retrieval-Augmented Generation pipeline
 * using NVIDIA NeMo Retriever for document processing.
 */
import { DEFAULT_RAG_CONFIG } from './config';
import { PDFProcessor } from './processors/pdf.processor';
import { VideoProcessor } from './processors/video.processor';
import { FileHandler } from './utils/file.handler';
import { TextPreprocessor } from './utils/text.preprocessor';
export class RAGPipeline {
    constructor(config) {
        this.config = { ...DEFAULT_RAG_CONFIG, ...config };
        this.fileHandler = new FileHandler(this.config.fileHandling);
        this.textPreprocessor = new TextPreprocessor(this.config.preprocessing);
        this.pdfProcessor = new PDFProcessor(this.config.nemoRetriever);
        this.videoProcessor = new VideoProcessor(this.config.nemoRetriever);
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
        return {
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
//# sourceMappingURL=pipeline.js.map