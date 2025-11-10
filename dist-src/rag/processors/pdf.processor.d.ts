/**
 * PDF Processor using NVIDIA NeMo Retriever
 *
 * This module handles PDF document processing using NVIDIA NeMo Retriever
 * for high-quality text extraction.
 */
interface NeMoRetrieverConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    pdfProcessing: boolean;
    videoProcessing: boolean;
}
export declare class PDFProcessor {
    private httpClient;
    private config;
    constructor(config: NeMoRetrieverConfig);
    /**
     * Extract text from a PDF file using NVIDIA NeMo Retriever
     * @param filePath Path to the PDF file
     * @returns Extracted text content
     */
    extractText(filePath: string): Promise<string>;
    /**
     * Simulate NeMo Retriever extraction (for demonstration purposes)
     * @param filePath Path to the PDF file
     * @returns Simulated extracted text
     */
    private simulateNeMoExtraction;
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig: NeMoRetrieverConfig): void;
}
export {};
