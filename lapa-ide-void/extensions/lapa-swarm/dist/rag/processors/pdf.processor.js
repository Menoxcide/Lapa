"use strict";
/**
 * PDF Processor using NVIDIA NeMo Retriever
 *
 * This module handles PDF document processing using NVIDIA NeMo Retriever
 * for high-quality text extraction.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFProcessor = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
class PDFProcessor {
    httpClient;
    config;
    constructor(config) {
        this.config = config;
        this.httpClient = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
            }
        });
    }
    /**
     * Extract text from a PDF file using NVIDIA NeMo Retriever
     * @param filePath Path to the PDF file
     * @returns Extracted text content
     */
    async extractText(filePath) {
        if (!this.config.pdfProcessing) {
            throw new Error('PDF processing is disabled in configuration');
        }
        try {
            // Check if file exists
            await fs_1.promises.access(filePath);
            // For demonstration purposes, we're simulating the NeMo Retriever API call
            // In a real implementation, this would call the actual NeMo Retriever service
            // which might involve:
            // 1. Uploading the file to the NeMo Retriever service
            // 2. Initiating the extraction process
            // 3. Polling for results or waiting for a callback
            // 4. Returning the extracted text
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            // In a real implementation, we would make an actual API call to NeMo Retriever
            // For now, we'll simulate the response
            const extractedText = await this.simulateNeMoExtraction(filePath);
            return extractedText;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to extract text from PDF: ${error.message}`);
            }
            throw new Error('Failed to extract text from PDF: Unknown error');
        }
    }
    /**
     * Simulate NeMo Retriever extraction (for demonstration purposes)
     * @param filePath Path to the PDF file
     * @returns Simulated extracted text
     */
    async simulateNeMoExtraction(filePath) {
        // In a real implementation, this would:
        // 1. Upload the file to NeMo Retriever
        // 2. Call the extraction API
        // 3. Wait for processing to complete
        // 4. Retrieve the extracted text
        // For demonstration, we'll return sample text
        return `Extracted text from PDF file: ${filePath}
    
This is simulated text extraction using NVIDIA NeMo Retriever.
NeMo Retriever provides 15x faster multimodal PDF extraction
and 35x better storage efficiency compared to traditional methods.

The extracted content would include all text, tables, charts, and images
from the PDF document, properly structured and formatted.`;
    }
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Update HTTP client if base URL or API key changed
        if (newConfig.baseUrl !== this.config.baseUrl || newConfig.apiKey !== this.config.apiKey) {
            this.httpClient = axios_1.default.create({
                baseURL: newConfig.baseUrl,
                timeout: newConfig.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    ...(newConfig.apiKey ? { 'Authorization': `Bearer ${newConfig.apiKey}` } : {})
                }
            });
        }
    }
}
exports.PDFProcessor = PDFProcessor;
//# sourceMappingURL=pdf.processor.js.map