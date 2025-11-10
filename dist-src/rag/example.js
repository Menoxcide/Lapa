/**
 * RAG Pipeline Usage Example
 *
 * Example demonstrating how to use the RAG pipeline with NVIDIA NeMo Retriever
 * for PDF and video processing.
 */
import { RAGPipeline } from './pipeline';
import { AIQResearchAssistant } from './ai-q';
async function example() {
    // Create RAG pipeline with default configuration
    const ragPipeline = new RAGPipeline();
    try {
        // Process a PDF document
        console.log('Processing PDF document...');
        const pdfResult = await ragPipeline.processDocument('./example/sample.pdf');
        console.log('PDF Processing Result:', pdfResult);
        // Process a video document
        console.log('Processing video document...');
        const videoResult = await ragPipeline.processDocument('./example/sample.mp4');
        console.log('Video Processing Result:', videoResult);
        // Process multiple documents
        console.log('Processing multiple documents...');
        const multiResults = await ragPipeline.processDocuments([
            './example/sample.pdf',
            './example/sample.mp4'
        ]);
        console.log('Multiple Documents Processing Results:', multiResults);
        // Use AI-Q Research Assistant
        console.log('Using AI-Q Research Assistant...');
        const aiqAssistant = new AIQResearchAssistant();
        const researchResult = await aiqAssistant.processResearchQuery({
            query: 'What are the key findings in these documents?',
            documentPaths: ['./example/sample.pdf', './example/sample.mp4'],
            processDocuments: true
        });
        console.log('Research Result:', researchResult);
    }
    catch (error) {
        console.error('Error processing documents:', error);
    }
}
// Run example if this file is executed directly
if (require.main === module) {
    example();
}
export { example };
//# sourceMappingURL=example.js.map