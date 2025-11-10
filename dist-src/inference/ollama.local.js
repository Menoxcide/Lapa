/**
 * Ollama Local Inference Integration for LAPA
 *
 * This module provides integration with Ollama running locally.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and multimodal models.
 */
import { Ollama } from 'ollama';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
const exec = promisify(execCallback);
// Ollama configuration
const OLLAMA_HOST = 'http://localhost:11434';
const OLLAMA_CONTAINER_NAME = 'ollama';
/**
 * Checks if Ollama is running
 * @returns Boolean indicating if Ollama is available
 */
export async function isOllamaAvailable() {
    try {
        const ollama = new Ollama({ host: OLLAMA_HOST });
        await ollama.list();
        return true;
    }
    catch (error) {
        console.error('Failed to check Ollama availability:', error);
        return false;
    }
}
/**
 * Starts Ollama Docker container
 * @returns Promise that resolves when container is ready
 */
export async function startOllamaContainer() {
    try {
        console.log('Starting Ollama container...');
        // Check if container already exists
        try {
            await exec(`docker inspect ${OLLAMA_CONTAINER_NAME}`);
            // Container exists, start it
            await exec(`docker start ${OLLAMA_CONTAINER_NAME}`);
        }
        catch (error) {
            // Container doesn't exist, create it
            await exec(`docker run -d --name ${OLLAMA_CONTAINER_NAME} -p 11434:11434 ollama/ollama:latest`);
        }
        // Wait for container to be ready
        await waitForOllamaReady();
        console.log('Ollama container started successfully');
    }
    catch (error) {
        console.error('Failed to start Ollama container:', error);
        throw error;
    }
}
/**
 * Waits for Ollama service to be ready
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when service is ready
 */
async function waitForOllamaReady(timeout = 30000) {
    const startTime = Date.now();
    const ollama = new Ollama({ host: OLLAMA_HOST });
    while (Date.now() - startTime < timeout) {
        try {
            // Simple health check - try to list models
            await ollama.list();
            return;
        }
        catch (error) {
            // Service not ready yet, continue waiting
        }
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Ollama service failed to start within timeout period');
}
/**
 * Stops Ollama Docker container
 * @returns Promise that resolves when container is stopped
 */
export async function stopOllamaContainer() {
    try {
        await exec(`docker stop ${OLLAMA_CONTAINER_NAME}`);
        console.log('Ollama container stopped');
    }
    catch (error) {
        console.error('Failed to stop Ollama container:', error);
        throw error;
    }
}
/**
 * Sends inference request to Ollama
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @returns Model response
 */
export async function sendOllamaInferenceRequest(model, prompt, parameters = {}) {
    try {
        const ollama = new Ollama({ host: OLLAMA_HOST });
        const requestBody = {
            model,
            prompt,
            ...parameters
        };
        const response = await ollama.generate(requestBody);
        return response.response;
    }
    catch (error) {
        console.error('Failed to send Ollama inference request:', error);
        throw error;
    }
}
/**
 * Sends chat request to Ollama
 * @param model Model name to use for chat
 * @param messages Array of messages in the conversation
 * @param parameters Additional chat parameters
 * @returns Model response
 */
export async function sendOllamaChatRequest(model, messages, parameters = {}) {
    try {
        const ollama = new Ollama({ host: OLLAMA_HOST });
        const requestBody = {
            model,
            messages,
            ...parameters
        };
        const response = await ollama.chat(requestBody);
        return response.message.content;
    }
    catch (error) {
        console.error('Failed to send Ollama chat request:', error);
        throw error;
    }
}
/**
 * Pulls a model from Ollama registry
 * @param model Model name to pull
 * @returns Promise that resolves when model is pulled
 */
export async function pullOllamaModel(model) {
    try {
        const ollama = new Ollama({ host: OLLAMA_HOST });
        console.log(`Pulling model ${model}...`);
        await ollama.pull({ model, stream: false });
        console.log(`Model ${model} pulled successfully`);
    }
    catch (error) {
        console.error(`Failed to pull model ${model}:`, error);
        throw error;
    }
}
/**
 * Lists available models in Ollama
 * @returns Array of model names
 */
export async function listOllamaModels() {
    try {
        const ollama = new Ollama({ host: OLLAMA_HOST });
        const response = await ollama.list();
        return response.models.map(m => m.name);
    }
    catch (error) {
        console.error('Failed to list Ollama models:', error);
        throw error;
    }
}
/**
 * Initializes Ollama environment
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeOllamaEnvironment() {
    try {
        // Ensure Docker is available
        await exec('docker --version');
        // Pull Ollama image if not present
        try {
            await exec('docker image inspect ollama/ollama:latest');
        }
        catch (error) {
            console.log('Pulling Ollama Docker image...');
            await exec('docker pull ollama/ollama:latest');
        }
        console.log('Ollama environment initialized');
    }
    catch (error) {
        console.error('Failed to initialize Ollama environment:', error);
        throw error;
    }
}
//# sourceMappingURL=ollama.local.js.map