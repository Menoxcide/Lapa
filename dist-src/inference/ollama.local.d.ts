/**
 * Ollama Local Inference Integration for LAPA
 *
 * This module provides integration with Ollama running locally.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and multimodal models.
 */
/**
 * Checks if Ollama is running
 * @returns Boolean indicating if Ollama is available
 */
export declare function isOllamaAvailable(): Promise<boolean>;
/**
 * Starts Ollama Docker container
 * @returns Promise that resolves when container is ready
 */
export declare function startOllamaContainer(): Promise<void>;
/**
 * Stops Ollama Docker container
 * @returns Promise that resolves when container is stopped
 */
export declare function stopOllamaContainer(): Promise<void>;
/**
 * Sends inference request to Ollama
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @returns Model response
 */
export declare function sendOllamaInferenceRequest(model: string, prompt: string, parameters?: Record<string, any>): Promise<string>;
/**
 * Sends chat request to Ollama
 * @param model Model name to use for chat
 * @param messages Array of messages in the conversation
 * @param parameters Additional chat parameters
 * @returns Model response
 */
export declare function sendOllamaChatRequest(model: string, messages: Array<{
    role: string;
    content: string;
}>, parameters?: Record<string, any>): Promise<string>;
/**
 * Pulls a model from Ollama registry
 * @param model Model name to pull
 * @returns Promise that resolves when model is pulled
 */
export declare function pullOllamaModel(model: string): Promise<void>;
/**
 * Lists available models in Ollama
 * @returns Array of model names
 */
export declare function listOllamaModels(): Promise<string[]>;
/**
 * Initializes Ollama environment
 * @returns Promise that resolves when initialization is complete
 */
export declare function initializeOllamaEnvironment(): Promise<void>;
