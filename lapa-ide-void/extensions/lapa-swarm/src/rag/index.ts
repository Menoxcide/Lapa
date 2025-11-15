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
 * - Chroma vector refinement (Phase 12)
 */

export { RAGPipeline } from './pipeline.ts';
export { PDFProcessor } from './processors/pdf.processor.ts';
export { VideoProcessor } from './processors/video.processor.ts';
export { FileHandler } from './utils/file.handler.ts';
export { TextPreprocessor } from './utils/text.preprocessor.ts';
export { RAGConfig } from './config.ts';

// Phase 12: Chroma Vector Refinement
export { ChromaRefine, chromaRefine } from './chroma-refine.ts';
export type { ChromaRefineConfig, VectorDocument, VectorSearchResult } from './chroma-refine.ts';

// Phase 13: REFRAG Efficient Decoding Framework
export { REFRAGEngine, refragEngine, getREFRAGEngine } from './refrag.ts';
export type { REFRAGConfig, CompressedChunk, REFRAGResult } from './refrag.ts';