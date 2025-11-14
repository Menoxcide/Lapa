"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.chromaRefine = exports.ChromaRefine = exports.TextPreprocessor = exports.FileHandler = exports.VideoProcessor = exports.PDFProcessor = exports.RAGPipeline = void 0;
var pipeline_ts_1 = require("./pipeline.ts");
Object.defineProperty(exports, "RAGPipeline", { enumerable: true, get: function () { return pipeline_ts_1.RAGPipeline; } });
var pdf_processor_ts_1 = require("./processors/pdf.processor.ts");
Object.defineProperty(exports, "PDFProcessor", { enumerable: true, get: function () { return pdf_processor_ts_1.PDFProcessor; } });
var video_processor_ts_1 = require("./processors/video.processor.ts");
Object.defineProperty(exports, "VideoProcessor", { enumerable: true, get: function () { return video_processor_ts_1.VideoProcessor; } });
var file_handler_ts_1 = require("./utils/file.handler.ts");
Object.defineProperty(exports, "FileHandler", { enumerable: true, get: function () { return file_handler_ts_1.FileHandler; } });
var text_preprocessor_ts_1 = require("./utils/text.preprocessor.ts");
Object.defineProperty(exports, "TextPreprocessor", { enumerable: true, get: function () { return text_preprocessor_ts_1.TextPreprocessor; } });
// Phase 12: Chroma Vector Refinement
var chroma_refine_ts_1 = require("./chroma-refine.ts");
Object.defineProperty(exports, "ChromaRefine", { enumerable: true, get: function () { return chroma_refine_ts_1.ChromaRefine; } });
Object.defineProperty(exports, "chromaRefine", { enumerable: true, get: function () { return chroma_refine_ts_1.chromaRefine; } });
//# sourceMappingURL=index.js.map