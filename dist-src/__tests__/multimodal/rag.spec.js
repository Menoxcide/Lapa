/**
 * Comprehensive test suite for multimodal RAG functionality
 *
 * Tests PDF processing, video processing, text extraction, preprocessing,
 * AI-Q research assistant integration, error handling, and configuration options.
 */
import { RAGPipeline } from '../../rag/pipeline';
import { TextPreprocessor } from '../../rag/utils/text.preprocessor';
import { AIQResearchAssistant } from '../../rag/ai-q';
import { DEFAULT_RAG_CONFIG } from '../../rag/config';
import { Researcher } from '../../agents/researcher';
// Mock implementations for external dependencies
jest.mock('../../inference/nim.local', () => ({
    sendNIMInferenceRequest: jest.fn().mockResolvedValue('Mocked text search result'),
    sendNemotronVisionInferenceRequest: jest.fn().mockResolvedValue('Mocked multimodal search result')
}));
describe('Multimodal RAG Functionality', () => {
    let ragPipeline;
    let aiqResearchAssistant;
    let researcher;
    beforeEach(() => {
        // Initialize components with default configuration
        ragPipeline = new RAGPipeline(DEFAULT_RAG_CONFIG);
        aiqResearchAssistant = new AIQResearchAssistant(DEFAULT_RAG_CONFIG);
        researcher = new Researcher();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('PDF Processing', () => {
        it('should successfully process a PDF file', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            // Mock PDF processor to return sample text
            const mockExtractText = jest.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockResolvedValue('Sample PDF text content for testing.');
            const result = await ragPipeline.processDocument('./example/sample.pdf');
            expect(result).toBeDefined();
            expect(result.filePath).toBe('./example/sample.pdf');
            expect(result.text).toBe('Sample PDF text content for testing.');
            expect(result.metadata.fileType).toBe('pdf');
            expect(result.chunks.length).toBeGreaterThan(0);
            // Verify mocks were called
            expect(mockValidateFile).toHaveBeenCalledWith('./example/sample.pdf');
            expect(mockExtractText).toHaveBeenCalledWith('./example/sample.pdf');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
        it('should throw an error when PDF processing is disabled', async () => {
            // Create a pipeline with PDF processing disabled
            const configWithoutPdf = {
                ...DEFAULT_RAG_CONFIG,
                nemoRetriever: {
                    ...DEFAULT_RAG_CONFIG.nemoRetriever,
                    pdfProcessing: false
                }
            };
            const pipelineWithoutPdf = new RAGPipeline(configWithoutPdf);
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(pipelineWithoutPdf['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            await expect(pipelineWithoutPdf.processDocument('./example/sample.pdf'))
                .rejects
                .toThrow('PDF processing is disabled in configuration');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        it('should handle PDF processing errors gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.pdf',
                name: 'sample',
                type: 'pdf',
                size: 1024,
                stats: {}
            });
            // Mock PDF processor to throw an error
            const mockExtractText = jest.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockRejectedValue(new Error('Network error during PDF processing'));
            await expect(ragPipeline.processDocument('./example/sample.pdf'))
                .rejects
                .toThrow('Failed to extract text from PDF: Network error during PDF processing');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    describe('Video Processing', () => {
        it('should successfully process a video file', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            // Mock video processor to return sample text
            const mockExtractText = jest.spyOn(ragPipeline['videoProcessor'], 'extractText')
                .mockResolvedValue('Sample video text content for testing.');
            const result = await ragPipeline.processDocument('./example/sample.mp4');
            expect(result).toBeDefined();
            expect(result.filePath).toBe('./example/sample.mp4');
            expect(result.text).toBe('Sample video text content for testing.');
            expect(result.metadata.fileType).toBe('mp4');
            expect(result.chunks.length).toBeGreaterThan(0);
            // Verify mocks were called
            expect(mockValidateFile).toHaveBeenCalledWith('./example/sample.mp4');
            expect(mockExtractText).toHaveBeenCalledWith('./example/sample.mp4');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
        it('should throw an error when video processing is disabled', async () => {
            // Create a pipeline with video processing disabled
            const configWithoutVideo = {
                ...DEFAULT_RAG_CONFIG,
                nemoRetriever: {
                    ...DEFAULT_RAG_CONFIG.nemoRetriever,
                    videoProcessing: false
                }
            };
            const pipelineWithoutVideo = new RAGPipeline(configWithoutVideo);
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(pipelineWithoutVideo['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            await expect(pipelineWithoutVideo.processDocument('./example/sample.mp4'))
                .rejects
                .toThrow('Video processing is disabled in configuration');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        it('should handle video processing errors gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.mp4',
                name: 'sample',
                type: 'mp4',
                size: 2048,
                stats: {}
            });
            // Mock video processor to throw an error
            const mockExtractText = jest.spyOn(ragPipeline['videoProcessor'], 'extractText')
                .mockRejectedValue(new Error('Network error during video processing'));
            await expect(ragPipeline.processDocument('./example/sample.mp4'))
                .rejects
                .toThrow('Failed to extract text from video: Network error during video processing');
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    describe('Text Extraction and Preprocessing', () => {
        it('should split text into appropriate chunks', () => {
            const preprocessor = new TextPreprocessor(DEFAULT_RAG_CONFIG.preprocessing);
            const text = 'This is a sample text. It has multiple sentences. We want to test chunking.';
            const chunks = preprocessor.splitText(text);
            expect(chunks.length).toBeGreaterThan(0);
            // Check that chunks are not longer than maxChunkSize
            chunks.forEach(chunk => {
                expect(chunk.length).toBeLessThanOrEqual(DEFAULT_RAG_CONFIG.preprocessing.maxChunkSize);
            });
        });
        it('should filter out low-quality chunks', () => {
            const preprocessor = new TextPreprocessor(DEFAULT_RAG_CONFIG.preprocessing);
            const chunks = [
                'This is a good quality chunk with sufficient content.',
                '   ', // Whitespace only
                '!@#$%^&*()', // Special characters only
                'a', // Too short
                'This is another good quality chunk.'
            ];
            const filteredChunks = preprocessor.filterChunks(chunks);
            expect(filteredChunks.length).toBe(2);
            expect(filteredChunks[0]).toBe('This is a good quality chunk with sufficient content.');
            expect(filteredChunks[1]).toBe('This is another good quality chunk.');
        });
        it('should clean text by removing unnecessary characters', () => {
            const preprocessor = new TextPreprocessor(DEFAULT_RAG_CONFIG.preprocessing);
            const dirtyText = 'This is   dirty  text!!!   \n\n\n  With extra chars: @#$%';
            const cleanedText = preprocessor.cleanText(dirtyText);
            expect(cleanedText).toBe('This is dirty text!!! With extra chars:');
        });
    });
    describe('AI-Q Research Assistant Integration', () => {
        it('should process research query with document analysis', async () => {
            // Mock the RAG pipeline processDocuments method
            const mockProcessDocuments = jest.spyOn(aiqResearchAssistant['ragPipeline'], 'processDocuments')
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
            expect(result).toBeDefined();
            expect(result.query).toBe('What is in this document?');
            expect(result.documents.length).toBe(1);
            expect(result.extractedInformation).toContain('Processed 1 documents (pdf)');
            // Verify mock was called
            expect(mockProcessDocuments).toHaveBeenCalledWith(['./example/sample.pdf']);
            // Restore mock
            mockProcessDocuments.mockRestore();
        });
        it('should handle research query without documents', async () => {
            const researchQuery = {
                query: 'General question without documents'
            };
            const result = await aiqResearchAssistant.processResearchQuery(researchQuery);
            expect(result).toBeDefined();
            expect(result.query).toBe('General question without documents');
            expect(result.documents.length).toBe(0);
            expect(result.extractedInformation).toContain('No documents provided for query');
        });
    });
    describe('Configuration Options', () => {
        it('should update configuration correctly', () => {
            const newConfig = {
                preprocessing: {
                    ...DEFAULT_RAG_CONFIG.preprocessing,
                    maxChunkSize: 2048
                }
            };
            const originalChunkSize = ragPipeline['textPreprocessor']['config'].maxChunkSize;
            expect(originalChunkSize).toBe(DEFAULT_RAG_CONFIG.preprocessing.maxChunkSize);
            ragPipeline.updateConfig(newConfig);
            const updatedChunkSize = ragPipeline['textPreprocessor']['config'].maxChunkSize;
            expect(updatedChunkSize).toBe(2048);
        });
        it('should handle unsupported file types gracefully', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockResolvedValue({
                path: './example/sample.txt',
                name: 'sample',
                type: 'txt', // Unsupported type
                size: 1024,
                stats: {}
            });
            await expect(ragPipeline.processDocument('./example/sample.txt'))
                .rejects
                .toThrow('Unsupported file type: txt');
            // Restore mock
            mockValidateFile.mockRestore();
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle empty query in AI-Q search', async () => {
            await expect(researcher.aiQSearch(''))
                .rejects
                .toThrow('Query cannot be empty');
            await expect(researcher.aiQSearch('   '))
                .rejects
                .toThrow('Query cannot be empty');
        });
        it('should handle file not found errors', async () => {
            // Mock file handler to simulate file not found
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockRejectedValue(new Error('ENOENT: no such file or directory'));
            await expect(ragPipeline.processDocument('./nonexistent/file.pdf'))
                .rejects
                .toThrow('File validation failed: ENOENT: no such file or directory');
            // Restore mock
            mockValidateFile.mockRestore();
        });
        it('should handle concurrent document processing', async () => {
            // Mock file handler to bypass actual file system operations
            const mockValidateFile = jest.spyOn(ragPipeline['fileHandler'], 'validateFile')
                .mockImplementation((filePath) => Promise.resolve({
                path: filePath,
                name: filePath.split('/').pop()?.split('.')[0] || 'unknown',
                type: filePath.split('.').pop() || 'unknown',
                size: 1024,
                stats: {}
            }));
            // Mock PDF processor to return sample text
            const mockExtractText = jest.spyOn(ragPipeline['pdfProcessor'], 'extractText')
                .mockImplementation((filePath) => Promise.resolve(`Content of ${filePath}`));
            const filePaths = [
                './example/doc1.pdf',
                './example/doc2.pdf',
                './example/doc3.pdf',
                './example/doc4.pdf'
            ];
            const results = await ragPipeline.processDocuments(filePaths);
            expect(results.length).toBe(4);
            results.forEach((result, index) => {
                expect(result.filePath).toBe(filePaths[index]);
                expect(result.text).toBe(`Content of ${filePaths[index]}`);
            });
            // Restore mocks
            mockValidateFile.mockRestore();
            mockExtractText.mockRestore();
        });
    });
    describe('Multimodal and Text-only Scenarios', () => {
        it('should perform text-based AI-Q search', async () => {
            const result = await researcher.aiQSearch('What is the capital of France?');
            expect(result).toBeDefined();
            expect(result.query).toBe('What is the capital of France?');
            expect(result.result).toBe('Mocked text search result');
            expect(result.multimodal).toBe(false);
        });
        it('should perform multimodal AI-Q search', async () => {
            const result = await researcher.aiQSearch('What is in this image?', true);
            expect(result).toBeDefined();
            expect(result.query).toBe('What is in this image?');
            expect(result.result).toBe('Mocked multimodal search result');
            expect(result.multimodal).toBe(true);
        });
    });
});
//# sourceMappingURL=rag.spec.js.map