"use strict";
/**
 * Comprehensive test suite for multimodal RAG functionality
 *
 * Tests PDF processing, video processing, text extraction, preprocessing,
 * AI-Q research assistant integration, error handling, and configuration options.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pipeline_ts_1 = require("../../rag/pipeline.ts");
const text_preprocessor_ts_1 = require("../../rag/utils/text.preprocessor.ts");
const index_ts_1 = require("../../rag/ai-q/index.ts");
const config_ts_1 = require("../../rag/config.ts");
const researcher_ts_1 = require("../../agents/researcher.ts");
const vitest_2 = require("vitest");
// Mock implementations for external dependencies
vitest_2.vi.mock('../../inference/nim.local', () => ({
    sendNIMInferenceRequest: vitest_2.vi.fn().mockResolvedValue('Mocked text search result'),
    sendNemotronVisionInferenceRequest: vitest_2.vi.fn().mockResolvedValue('Mocked multimodal search result')
}));
(0, vitest_1.describe)('Multimodal RAG Functionality', () => {
    let ragPipeline;
    let aiqResearchAssistant;
    let researcher;
    beforeEach(() => {
        // Initialize components with default configuration
        ragPipeline = new pipeline_ts_1.RAGPipeline(config_ts_1.DEFAULT_RAG_CONFIG);
        aiqResearchAssistant = new index_ts_1.AIQResearchAssistant(config_ts_1.DEFAULT_RAG_CONFIG);
        researcher = new researcher_ts_1.Researcher();
    });
    afterEach(() => {
        // Clear all mocks
    });
    (0, vitest_1.describe)('PDF Processing', () => {
        (0, vitest_1.it)('should successfully process a PDF file', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            // Mock PDF processor to return sample text
            const mockExtractText = vitest_2.vi.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockResolvedValue('Sample PDF text content for testing.');
            const result = await ragPipeline.processDocument('./example/sample.pdf');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.filePath).toBe('./example/sample.pdf');
            (0, vitest_1.expect)(result.text).toBe('Sample PDF text content for testing.');
            (0, vitest_1.expect)(result.metadata.fileType).toBe('pdf');
            (0, vitest_1.expect)(result.chunks.length).toBeGreaterThan(0);
            // Verify mocks were called
            (0, vitest_1.expect)(mockValidateFile).toHaveBeenCalledWith('./example/sample.pdf');
            (0, vitest_1.expect)(mockExtractText).toHaveBeenCalledWith('./example/sample.pdf');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
        (0, vitest_1.it)('should throw an error when PDF processing is disabled', async () => {
            // Create a pipeline with PDF processing disabled
            const configWithoutPdf = {
                ...config_ts_1.DEFAULT_RAG_CONFIG,
                nemoRetriever: {
                    ...config_ts_1.DEFAULT_RAG_CONFIG.nemoRetriever,
                    pdfProcessing: false
                }
            };
            const pipelineWithoutPdf = new pipeline_ts_1.RAGPipeline(configWithoutPdf);
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(pipelineWithoutPdf['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            await (0, vitest_1.expect)(pipelineWithoutPdf.processDocument('./example/sample.pdf'))
                .rejects
                .toThrow('PDF processing is disabled in configuration');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        (0, vitest_1.it)('should handle PDF processing errors gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            // Mock PDF processor to throw an error
            const mockExtractText = vitest_2.vi.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockRejectedValue(new Error('Network error during PDF processing'));
            await (0, vitest_1.expect)(ragPipeline.processDocument('./example/sample.pdf'))
                .rejects
                .toThrow('Failed to extract text from PDF: Network error during PDF processing');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    (0, vitest_1.describe)('Video Processing', () => {
        (0, vitest_1.it)('should successfully process a video file', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            // Mock video processor to return sample text
            const mockExtractText = vitest_2.vi.spyOn(ragPipeline['videoProcessor'], 'extractText')
                .mockResolvedValue('Sample video text content for testing.');
            const result = await ragPipeline.processDocument('./example/sample.mp4');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.filePath).toBe('./example/sample.mp4');
            (0, vitest_1.expect)(result.text).toBe('Sample video text content for testing.');
            (0, vitest_1.expect)(result.metadata.fileType).toBe('mp4');
            (0, vitest_1.expect)(result.chunks.length).toBeGreaterThan(0);
            // Verify mocks were called
            (0, vitest_1.expect)(mockValidateFile).toHaveBeenCalledWith('./example/sample.mp4');
            (0, vitest_1.expect)(mockExtractText).toHaveBeenCalledWith('./example/sample.mp4');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
        (0, vitest_1.it)('should throw an error when video processing is disabled', async () => {
            // Create a pipeline with video processing disabled
            const configWithoutVideo = {
                ...config_ts_1.DEFAULT_RAG_CONFIG,
                nemoRetriever: {
                    ...config_ts_1.DEFAULT_RAG_CONFIG.nemoRetriever,
                    videoProcessing: false
                }
            };
            const pipelineWithoutVideo = new pipeline_ts_1.RAGPipeline(configWithoutVideo);
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(pipelineWithoutVideo['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            await (0, vitest_1.expect)(pipelineWithoutVideo.processDocument('./example/sample.mp4'))
                .rejects
                .toThrow('Video processing is disabled in configuration');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        (0, vitest_1.it)('should handle video processing errors gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            // Mock video processor to throw an error
            const mockExtractText = vitest_2.vi.spyOn(ragPipeline['videoProcessor'], 'extractText')
                .mockRejectedValue(new Error('Network error during video processing'));
            await (0, vitest_1.expect)(ragPipeline.processDocument('./example/sample.mp4'))
                .rejects
                .toThrow('Failed to extract text from video: Network error during video processing');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    (0, vitest_1.describe)('Text Extraction and Preprocessing', () => {
        (0, vitest_1.it)('should split text into appropriate chunks', () => {
            const preprocessor = new text_preprocessor_ts_1.TextPreprocessor(config_ts_1.DEFAULT_RAG_CONFIG.preprocessing);
            const text = 'This is a sample text. It has multiple sentences. We want to test chunking.';
            const chunks = preprocessor.splitText(text);
            (0, vitest_1.expect)(chunks.length).toBeGreaterThan(0);
            // Check that chunks are not longer than maxChunkSize
            chunks.forEach(chunk => {
                (0, vitest_1.expect)(chunk.length).toBeLessThanOrEqual(config_ts_1.DEFAULT_RAG_CONFIG.preprocessing.maxChunkSize);
            });
        });
        (0, vitest_1.it)('should filter out low-quality chunks', () => {
            const preprocessor = new text_preprocessor_ts_1.TextPreprocessor(config_ts_1.DEFAULT_RAG_CONFIG.preprocessing);
            const chunks = [
                'This is a good quality chunk with sufficient content.',
                '   ', // Whitespace only
                '!@#$%^&*()', // Special characters only
                'a', // Too short
                'This is another good quality chunk.'
            ];
            const filteredChunks = preprocessor.filterChunks(chunks);
            (0, vitest_1.expect)(filteredChunks.length).toBe(2);
            (0, vitest_1.expect)(filteredChunks[0]).toBe('This is a good quality chunk with sufficient content.');
            (0, vitest_1.expect)(filteredChunks[1]).toBe('This is another good quality chunk.');
        });
        (0, vitest_1.it)('should clean text by removing unnecessary characters', () => {
            const preprocessor = new text_preprocessor_ts_1.TextPreprocessor(config_ts_1.DEFAULT_RAG_CONFIG.preprocessing);
            const dirtyText = 'This is   dirty  text!!!   \n\n\n  With extra chars: @#$%';
            const cleanedText = preprocessor.cleanText(dirtyText);
            (0, vitest_1.expect)(cleanedText).toBe('This is dirty text!!! With extra chars:');
        });
    });
    (0, vitest_1.describe)('AI-Q Research Assistant Integration', () => {
        (0, vitest_1.it)('should process research query with document analysis', async () => {
            // Mock the RAG pipeline processDocuments method
            const mockProcessDocuments = vitest_2.vi.spyOn(aiqResearchAssistant['ragPipeline'], 'processDocuments')
                .mockResolvedValue([
                {
                    filePath: './example/sample.pdf',
                    text: 'Sample PDF content',
                    metadata: {
                        fileType: 'pdf',
                        fileSize: 1024,
                        processedAt: new Date(),
                        processingTime: 100
                    },
                    chunks: ['Sample PDF content']
                }
            ]);
            const researchQuery = {
                query: 'What is in this document?',
                documentPaths: ['./example/sample.pdf'],
                processDocuments: true
            };
            const result = await aiqResearchAssistant.processResearchQuery(researchQuery);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.query).toBe('What is in this document?');
            (0, vitest_1.expect)(result.documents.length).toBe(1);
            (0, vitest_1.expect)(result.extractedInformation).toContain('Processed 1 documents (pdf)');
            // Verify mock was called
            (0, vitest_1.expect)(mockProcessDocuments).toHaveBeenCalledWith(['./example/sample.pdf']);
            // Restore mock
            mockProcessDocuments.mockRestore();
        });
        (0, vitest_1.it)('should handle research query without documents', async () => {
            const researchQuery = {
                query: 'General question without documents'
            };
            const result = await aiqResearchAssistant.processResearchQuery(researchQuery);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.query).toBe('General question without documents');
            (0, vitest_1.expect)(result.documents.length).toBe(0);
            (0, vitest_1.expect)(result.extractedInformation).toContain('No documents provided for query');
        });
    });
    (0, vitest_1.describe)('Configuration Options', () => {
        (0, vitest_1.it)('should update configuration correctly', () => {
            const newConfig = {
                preprocessing: {
                    ...config_ts_1.DEFAULT_RAG_CONFIG.preprocessing,
                    maxChunkSize: 2048
                }
            };
            const originalChunkSize = ragPipeline['textPreprocessor']['config'].maxChunkSize;
            (0, vitest_1.expect)(originalChunkSize).toBe(config_ts_1.DEFAULT_RAG_CONFIG.preprocessing.maxChunkSize);
            ragPipeline.updateConfig(newConfig);
            const updatedChunkSize = ragPipeline['textPreprocessor']['config'].maxChunkSize;
            (0, vitest_1.expect)(updatedChunkSize).toBe(2048);
        });
        (0, vitest_1.it)('should handle unsupported file types gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.txt',
                name: 'sample',
                type: 'txt', // Unsupported type
                size: 1024,
                stats: {}
            });
            await (0, vitest_1.expect)(ragPipeline.processDocument('./example/sample.txt'))
                .rejects
                .toThrow('Unsupported file type: txt');
            // Restore mock
            mockValidateFile.mockRestore();
        });
    });
    (0, vitest_1.describe)('Error Handling and Edge Cases', () => {
        (0, vitest_1.it)('should handle empty query in AI-Q search', async () => {
            await (0, vitest_1.expect)(researcher.aiQSearch(''))
                .rejects
                .toThrow('Query cannot be empty');
            await (0, vitest_1.expect)(researcher.aiQSearch('   '))
                .rejects
                .toThrow('Query cannot be empty');
        });
        (0, vitest_1.it)('should handle file not found errors', async () => {
            // Mock file handler to simulate file not found
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockRejectedValue(new Error('ENOENT: no such file or directory'));
            await (0, vitest_1.expect)(ragPipeline.processDocument('./nonexistent/file.pdf'))
                .rejects
                .toThrow('File validation failed: ENOENT: no such file or directory');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        (0, vitest_1.it)('should handle concurrent document processing', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = vitest_2.vi.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockImplementation((filePath) => Promise.resolve({
                path: filePath,
                name: filePath.split('/').pop()?.split('.')[0] || 'unknown',
                type: filePath.split('.').pop() || 'unknown',
                size: 1024,
                stats: {}
            }));
            // Mock PDF processor to return sample text
            const mockExtractText = vitest_2.vi.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockImplementation((filePath) => Promise.resolve(`Content of ${filePath}`));
            const filePaths = [
                './example/doc1.pdf',
                './example/doc2.pdf',
                './example/doc3.pdf',
                './example/doc4.pdf'
            ];
            const results = await ragPipeline.processDocuments(filePaths);
            (0, vitest_1.expect)(results.length).toBe(4);
            results.forEach((result, index) => {
                (0, vitest_1.expect)(result.filePath).toBe(filePaths[index]);
                (0, vitest_1.expect)(result.text).toBe(`Content of ${filePaths[index]}`);
            });
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    (0, vitest_1.describe)('Multimodal and Text-only Scenarios', () => {
        (0, vitest_1.it)('should perform text-based AI-Q search', async () => {
            const result = await researcher.aiQSearch('What is the capital of France?');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.query).toBe('What is the capital of France?');
            (0, vitest_1.expect)(result.result).toBe('Mocked text search result');
            (0, vitest_1.expect)(result.multimodal).toBe(false);
        });
        (0, vitest_1.it)('should perform multimodal AI-Q search', async () => {
            const result = await researcher.aiQSearch('What is in this image?', true);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.query).toBe('What is in this image?');
            (0, vitest_1.expect)(result.result).toBe('Mocked multimodal search result');
            (0, vitest_1.expect)(result.multimodal).toBe(true);
        });
    });
});
//# sourceMappingURL=rag.spec.js.map