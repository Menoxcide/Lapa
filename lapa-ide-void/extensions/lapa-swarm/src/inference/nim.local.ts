/**
 * NVIDIA NIM Local Inference Integration for LAPA
 *
 * This module provides integration with NVIDIA NIM running locally via Docker.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and Nemotron-Vision multimodal models with FP8 quantization.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// NIM Docker configuration
const NIM_DOCKER_IMAGE = 'nvcr.io/nim:latest';
const NIM_CONTAINER_NAME = 'lapa-nim';
const NIM_PORT = 8000;

// Nemotron-Vision specific configuration
const NEMOTRON_VISION_DOCKER_IMAGE = 'nvcr.io/nim/nemotron-vision:latest';
const NEMOTRON_VISION_CONTAINER_NAME = 'lapa-nim-nemotron-vision';
const NEMOTRON_VISION_PORT = 8001;

/**
 * Checks if NVIDIA NIM Docker container is running
 * @param containerName Name of the container to check (defaults to standard NIM container)
 * @returns Boolean indicating if NIM is available
 */
export async function isNIMAvailable(containerName: string = NIM_CONTAINER_NAME): Promise<boolean> {
    try {
        const { stdout } = await exec(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
        return stdout.trim() === containerName;
    } catch (error) {
        console.error('Failed to check NIM availability:', error);
        return false;
    }
}

/**
 * Checks if Nemotron-Vision NIM Docker container is running
 * @returns Boolean indicating if Nemotron-Vision NIM is available
 */
export async function isNemotronVisionAvailable(): Promise<boolean> {
    return isNIMAvailable(NEMOTRON_VISION_CONTAINER_NAME);
}

/**
 * Starts NVIDIA NIM Docker container
 * @param modelName Optional model name to use (for Nemotron-Vision support)
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
export async function startNIMContainer(modelName?: string, useFP8: boolean = false): Promise<void> {
    // Determine if we're starting Nemotron-Vision based on model name
    const isNemotronVision = modelName?.toLowerCase().includes('nemotron-vision') || modelName?.toLowerCase().includes('nemotron');
    
    if (isNemotronVision) {
        return startNemotronVisionContainer(useFP8);
    }
    
    try {
        console.log('Starting NVIDIA NIM container...');
        
        // Check if container already exists
        try {
            await exec(`docker inspect ${NIM_CONTAINER_NAME}`);
            // Container exists, start it
            await exec(`docker start ${NIM_CONTAINER_NAME}`);
        } catch (error) {
            // Container doesn't exist, create it
            await exec(`docker run -d --name ${NIM_CONTAINER_NAME} -p ${NIM_PORT}:${NIM_PORT} ${NIM_DOCKER_IMAGE}`);
        }
        
        // Wait for container to be ready
        await waitForNIMReady();
        console.log('NVIDIA NIM container started successfully');
    } catch (error) {
        console.error('Failed to start NIM container:', error);
        throw error;
    }
}

/**
 * Starts Nemotron-Vision NIM Docker container with FP8 quantization support
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
export async function startNemotronVisionContainer(useFP8: boolean = false): Promise<void> {
    try {
        console.log('Starting Nemotron-Vision NIM container...');
        
        // Environment variables for FP8 quantization
        const envVars = useFP8 ? '-e NIM_MODEL_PROFILE=fp8' : '';
        
        // Check if container already exists
        try {
            await exec(`docker inspect ${NEMOTRON_VISION_CONTAINER_NAME}`);
            // Container exists, start it
            await exec(`docker start ${NEMOTRON_VISION_CONTAINER_NAME}`);
        } catch (error) {
            // Container doesn't exist, create it with FP8 support
            await exec(`docker run -d --name ${NEMOTRON_VISION_CONTAINER_NAME} -p ${NEMOTRON_VISION_PORT}:${NEMOTRON_VISION_PORT} ${envVars} ${NEMOTRON_VISION_DOCKER_IMAGE}`);
        }
        
        // Wait for container to be ready
        await waitForNIMReady(NEMOTRON_VISION_PORT);
        console.log('Nemotron-Vision NIM container started successfully');
    } catch (error) {
        console.error('Failed to start Nemotron-Vision NIM container:', error);
        throw error;
    }
}

/**
 * Waits for NVIDIA NIM service to be ready
 * @param port Port to check for readiness (defaults to standard NIM port)
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when service is ready
 */
async function waitForNIMReady(port: number = NIM_PORT, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            // Simple health check - try to connect to NIM service
            const response = await fetch(`http://localhost:${port}/health`);
            if (response.ok) {
                return;
            }
        } catch (error) {
            // Service not ready yet, continue waiting
        }
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('NIM service failed to start within timeout period');
}

/**
 * Stops NVIDIA NIM Docker container
 * @param containerName Name of the container to stop (defaults to standard NIM container)
 * @returns Promise that resolves when container is stopped
 */
export async function stopNIMContainer(containerName: string = NIM_CONTAINER_NAME): Promise<void> {
    try {
        await exec(`docker stop ${containerName}`);
        console.log(`NVIDIA NIM container (${containerName}) stopped`);
    } catch (error) {
        console.error('Failed to stop NIM container:', error);
        throw error;
    }
}

// Type definitions for Nemotron-Vision support
export interface NemotronVisionInferenceRequest {
    model?: string;
    prompt: string;
    image?: string; // Base64 encoded image
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
export async function stopNemotronVisionContainer(): Promise<void> {
    return stopNIMContainer(NEMOTRON_VISION_CONTAINER_NAME);
}

/**
 * Sends inference request to NVIDIA NIM
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @param useNemotronVision Whether to use Nemotron-Vision container (default: false)
 * @returns Model response
 */
export async function sendNIMInferenceRequest(
    model: string,
    prompt: string,
    parameters: Record<string, any> = {},
    useNemotronVision: boolean = false
): Promise<string> {
    // Determine which port to use based on model type
    const isNemotronVision = useNemotronVision || model.toLowerCase().includes('nemotron-vision') || model.toLowerCase().includes('nemotron');
    const port = isNemotronVision ? NEMOTRON_VISION_PORT : NIM_PORT;
    
    try {
        const requestBody = {
            model,
            prompt,
            ...parameters
        };
        
        const response = await fetch(`http://localhost:${port}/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`NIM inference request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].text;
    } catch (error) {
        console.error('Failed to send NIM inference request:', error);
        throw error;
    }
}

/**
 * Sends multimodal inference request to Nemotron-Vision NIM
 * @param model Model name to use for inference (defaults to nemotron-vision)
 * @param prompt Text prompt for the model
 * @param imageBase64 Base64 encoded image data
 * @param parameters Additional inference parameters
 * @returns Model response
 */
export async function sendNemotronVisionInferenceRequest(
    model: string = 'nemotron-vision',
    prompt: string,
    imageBase64?: string,
    parameters: Record<string, any> = {}
): Promise<string> {
    try {
        // Prepare request body with multimodal support
        const requestBody: any = {
            model,
            prompt,
            ...parameters
        };
        
        // Add image data if provided
        if (imageBase64) {
            requestBody.image = imageBase64;
        }
        
        const response = await fetch(`http://localhost:${NEMOTRON_VISION_PORT}/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Nemotron-Vision inference request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].text;
    } catch (error) {
        console.error('Failed to send Nemotron-Vision inference request:', error);
        throw error;
    }
}

/**
 * Initializes NVIDIA NIM environment
 * @param includeNemotronVision Whether to also initialize Nemotron-Vision environment (default: false)
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeNIMEnvironment(includeNemotronVision: boolean = false): Promise<void> {
    try {
        // Ensure Docker is available
        await exec('docker --version');
        
        // Pull NIM image if not present
        try {
            await exec(`docker image inspect ${NIM_DOCKER_IMAGE}`);
        } catch (error) {
            console.log('Pulling NVIDIA NIM Docker image...');
            await exec(`docker pull ${NIM_DOCKER_IMAGE}`);
        }
        
        // Pull Nemotron-Vision image if requested and not present
        if (includeNemotronVision) {
            try {
                await exec(`docker image inspect ${NEMOTRON_VISION_DOCKER_IMAGE}`);
            } catch (error) {
                console.log('Pulling Nemotron-Vision NIM Docker image...');
                await exec(`docker pull ${NEMOTRON_VISION_DOCKER_IMAGE}`);
            }
        }
        
        console.log('NIM environment initialized');
    } catch (error) {
        console.error('Failed to initialize NIM environment:', error);
        throw error;
    }
}