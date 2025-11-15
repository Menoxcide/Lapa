/**
 * RAG Pipeline Implementation
 * 
 * Main class for orchestrating the Retrieval-Augmented Generation pipeline
 * using NVIDIA NeMo Retriever for document processing.
 */

import { RAGConfig, DEFAULT_RAG_CONFIG } from './config.ts';
import { PDFProcessor } from './processors/pdf.processor.ts';
import { VideoProcessor } from './processors/video.processor.ts';
import { FileHandler } from './utils/file.handler.ts';
import { TextPreprocessor } from './utils/text.preprocessor.ts';
import { chromaRefine } from './chroma-refine.ts';
import { refragEngine, type REFRAGResult } from './refrag.ts';

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

export class RAGPipeline {
  private config: RAGConfig;
  private pdfProcessor: PDFProcessor;
  private videoProcessor: VideoProcessor;
  private fileHandler: FileHandler;
  private textPreprocessor: TextPreprocessor;
  private chromaInitialized: boolean;
  private refragEnabled: boolean;
  
  constructor(config?: Partial<RAGConfig>) {
    this.config = { ...DEFAULT_RAG_CONFIG, ...config };
    this.fileHandler = new FileHandler(this.config.fileHandling);
    this.textPreprocessor = new TextPreprocessor(this.config.preprocessing);
    this.pdfProcessor = new PDFProcessor(this.config.nemoRetriever);
    this.videoProcessor = new VideoProcessor(this.config.nemoRetriever);
    this.chromaInitialized = false;
    this.refragEnabled = false;
  }

  /**
   * Initializes the RAG pipeline including Chroma integration (Phase 12) and REFRAG (Phase 13)
   */
  async initialize(): Promise<void> {
    try {
      await chromaRefine.initialize();
      this.chromaInitialized = true;
    } catch (error) {
      console.warn('Chroma initialization failed, continuing without vector search:', error);
      this.chromaInitialized = false;
    }

    // Initialize REFRAG engine for efficient decoding
    try {
      await refragEngine.initialize();
      this.refragEnabled = true;
      console.log('[RAGPipeline] REFRAG engine initialized for efficient decoding');
    } catch (error) {
      console.warn('REFRAG initialization failed, continuing without REFRAG optimization:', error);
      this.refragEnabled = false;
    }
  }
  
  /**
   * Process a document file using the appropriate processor
   * @param filePath Path to the document file
   * @returns Processed document with extracted text and metadata
   */
  async processDocument(filePath: string): Promise<ProcessedDocument> {
    const startTime = Date.now();
    
    // Validate file
    const fileInfo = await this.fileHandler.validateFile(filePath);
    
    // Extract text based on file type
    let text: string;
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
          await chromaRefine.indexDocument({
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
      } catch (error) {
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
  async processDocuments(filePaths: string[]): Promise<ProcessedDocument[]> {
    // Process documents concurrently with a reasonable limit
    const concurrencyLimit = 3;
    const results: ProcessedDocument[] = [];
    
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
   * Optionally uses REFRAG for efficient decoding (Phase 13)
   * @param query Search query
   * @param limit Maximum number of results
   * @param useREFRAG Whether to use REFRAG for efficient decoding (default: true)
   * @returns Array of similar document chunks (expanded chunks if REFRAG enabled)
   */
  async searchSimilar(
    query: string, 
    limit: number = 10,
    useREFRAG: boolean = true
  ): Promise<Array<{
    content: string;
    filePath: string;
    chunkIndex: number;
    similarity: number;
  }>> {
    if (!this.chromaInitialized) {
      return [];
    }

    try {
      const results = await chromaRefine.searchSimilar(query, { limit });
      const chunks = results.map(result => ({
        id: result.document.id,
        content: result.document.content,
        filePath: result.document.metadata.filePath || '',
        chunkIndex: result.document.metadata.chunkIndex || 0,
        similarity: result.similarity,
        metadata: result.document.metadata
      }));

      // Apply REFRAG if enabled
      if (this.refragEnabled && useREFRAG) {
        const refragResult = await refragEngine.processChunks(
          chunks.map(c => ({
            id: c.id,
            content: c.content,
            metadata: {
              ...c.metadata,
              filePath: c.filePath,
              chunkIndex: c.chunkIndex
            },
            similarity: c.similarity
          })),
          query
        );

        // Return expanded chunks (full content) for backward compatibility
        return refragResult.expandedChunks.map(chunk => ({
          content: chunk.originalContent,
          filePath: chunk.metadata.filePath || '',
          chunkIndex: chunk.metadata.chunkIndex || 0,
          similarity: chunk.relevanceScore || 0
        }));
      }

      // Return standard results without REFRAG
      return chunks.map(c => ({
        content: c.content,
        filePath: c.filePath,
        chunkIndex: c.chunkIndex,
        similarity: c.similarity
      }));
    } catch (error) {
      console.error('Failed to search similar content:', error);
      return [];
    }
  }

  /**
   * Advanced search with REFRAG processing
   * Returns full REFRAG result including metrics
   * @param query Search query
   * @param limit Maximum number of results
   * @returns REFRAG processing result
   */
  async searchSimilarWithREFRAG(
    query: string,
    limit: number = 10
  ): Promise<REFRAGResult | null> {
    if (!this.chromaInitialized || !this.refragEnabled) {
      return null;
    }

    try {
      const results = await chromaRefine.searchSimilar(query, { limit });
      const chunks = results.map(result => ({
        id: result.document.id,
        content: result.document.content,
        metadata: {
          ...result.document.metadata,
          filePath: result.document.metadata.filePath || '',
          chunkIndex: result.document.metadata.chunkIndex || 0
        },
        similarity: result.similarity
      }));

      return await refragEngine.processChunks(chunks, query);
    } catch (error) {
      console.error('Failed to search with REFRAG:', error);
      return null;
    }
  }

  /**
   * Update configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Update processors with new config if needed
    this.pdfProcessor.updateConfig(this.config.nemoRetriever);
    this.videoProcessor.updateConfig(this.config.nemoRetriever);
  }
}