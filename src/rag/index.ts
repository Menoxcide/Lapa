/**
 * RAG Pipeline Module for LAPA
 * 
 * This module implements a Retrieval-Augmented Generation (RAG) pipeline
 * using NVIDIA NeMo Retriever for PDF and video processing.
 * 
 * Features:
 * - PDF text extraction using NeMo Retriever
 * - Video text extraction using NeMo Retriever
 * - File handling utilities
 * - Text preprocessing pipelines
 * - Configuration management
 * - Integration with AI-Q research assistant
 */

export { RAGPipeline } from './pipeline.ts';
export { PDFProcessor } from './processors/pdf.processor.ts';
export { VideoProcessor } from './processors/video.processor.ts';
export { FileHandler } from './utils/file.handler.ts';
export { TextPreprocessor } from './utils/text.preprocessor.ts';
export { RAGConfig } from './config.ts';