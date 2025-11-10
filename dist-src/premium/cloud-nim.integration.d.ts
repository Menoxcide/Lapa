/**
 * Cloud NVIDIA NIM Integration for LAPA Premium
 *
 * This module provides integration with NVIDIA NIM running in cloud environments.
 * It handles model loading, inference requests, and connection management for
 * cloud-based NVIDIA NIM services.
 */
/**
 * Cloud NIM Integration class
 */
export declare class CloudNIMIntegration {
    private apiKey;
    private apiBase;
    private defaultModel;
    constructor(apiKey?: string, apiBase?: string, defaultModel?: string);
    /**
     * Sends inference request to Cloud NVIDIA NIM
     * @param model Model name to use for inference
     * @param prompt Input prompt for the model
     * @param parameters Additional inference parameters
     * @returns Model response
     */
    sendInferenceRequest(prompt: string, model?: string, parameters?: Record<string, any>): Promise<string>;
    /**
     * Lists available models in Cloud NVIDIA NIM
     * @returns Array of available models
     */
    listModels(): Promise<any[]>;
    /**
     * Gets model information from Cloud NVIDIA NIM
     * @param model Model name
     * @returns Model information
     */
    getModelInfo(model: string): Promise<any>;
    /**
     * Checks Cloud NIM service health
     * @returns Health status
     */
    checkHealth(): Promise<boolean>;
}
export declare const cloudNIMIntegration: CloudNIMIntegration;
