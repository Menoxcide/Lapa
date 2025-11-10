/**
 * NVIDIA NIM Local Inference Integration for LAPA
 *
 * This module provides integration with NVIDIA NIM running locally via Docker.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and Nemotron-Vision multimodal models with FP8 quantization.
 */
/**
 * Checks if NVIDIA NIM Docker container is running
 * @param containerName Name of the container to check (defaults to standard NIM container)
 * @returns Boolean indicating if NIM is available
 */
export declare function isNIMAvailable(containerName?: string): Promise<boolean>;
/**
 * Checks if Nemotron-Vision NIM Docker container is running
 * @returns Boolean indicating if Nemotron-Vision NIM is available
 */
export declare function isNemotronVisionAvailable(): Promise<boolean>;
/**
 * Starts NVIDIA NIM Docker container
 * @param modelName Optional model name to use (for Nemotron-Vision support)
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
export declare function startNIMContainer(modelName?: string, useFP8?: boolean): Promise<void>;
/**
 * Starts Nemotron-Vision NIM Docker container with FP8 quantization support
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
export declare function startNemotronVisionContainer(useFP8?: boolean): Promise<void>;
/**
 * Stops NVIDIA NIM Docker container
 * @param containerName Name of the container to stop (defaults to standard NIM container)
 * @returns Promise that resolves when container is stopped
 */
export declare function stopNIMContainer(containerName?: string): Promise<void>;
export interface NemotronVisionInferenceRequest {
    model?: string;
    prompt: string;
    image?: string;
    parameters?: Record<string, any>;
}
export interface NemotronVisionInferenceResponse {
    choices: Array<{
        text: string;
        index: number;
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface NIMContainerConfig {
    name: string;
    image: string;
    port: number;
    useFP8?: boolean;
}
/**
 * Stops Nemotron-Vision NIM Docker container
 * @returns Promise that resolves when container is stopped
 */
export declare function stopNemotronVisionContainer(): Promise<void>;
/**
 * Sends inference request to NVIDIA NIM
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @param useNemotronVision Whether to use Nemotron-Vision container (default: false)
 * @returns Model response
 */
export declare function sendNIMInferenceRequest(model: string, prompt: string, parameters?: Record<string, any>, useNemotronVision?: boolean): Promise<string>;
/**
 * Sends multimodal inference request to Nemotron-Vision NIM
 * @param model Model name to use for inference (defaults to nemotron-vision)
 * @param prompt Text prompt for the model
 * @param imageBase64 Base64 encoded image data
 * @param parameters Additional inference parameters
 * @returns Model response
 */
export declare function sendNemotronVisionInferenceRequest(model: string, prompt: string, imageBase64?: string, parameters?: Record<string, any>): Promise<string>;
/**
 * Initializes NVIDIA NIM environment
 * @param includeNemotronVision Whether to also initialize Nemotron-Vision environment (default: false)
 * @returns Promise that resolves when initialization is complete
 */
export declare function initializeNIMEnvironment(includeNemotronVision?: boolean): Promise<void>;
