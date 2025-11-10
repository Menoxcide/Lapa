/**
 * Video Processor using NVIDIA NeMo Retriever
 *
 * This module handles video processing using NVIDIA NeMo Retriever
 * for text extraction from video content.
 */
interface NeMoRetrieverConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    pdfProcessing: boolean;
    videoProcessing: boolean;
}
export declare class VideoProcessor {
    private httpClient;
    private config;
    constructor(config: NeMoRetrieverConfig);
    /**
     * Extract text from a video file using NVIDIA NeMo Retriever
     * @param filePath Path to the video file
     * @returns Extracted text content
     */
    extractText(filePath: string): Promise<string>;
    /**
     * Simulate NeMo Retriever extraction (for demonstration purposes)
     * @param filePath Path to the video file
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
