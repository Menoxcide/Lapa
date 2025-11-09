/**
 * NVIDIA NIM Local Inference Integration for LAPA
 * 
 * This module provides integration with NVIDIA NIM running locally via Docker.
 * It handles model loading, inference requests, and connection management.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// NIM Docker configuration
const NIM_DOCKER_IMAGE = 'nvcr.io/nim:latest';
const NIM_CONTAINER_NAME = 'lapa-nim';
const NIM_PORT = 8000;

/**
 * Checks if NVIDIA NIM Docker container is running
 * @returns Boolean indicating if NIM is available
 */
export async function isNIMAvailable(): Promise<boolean> {
    try {
        const { stdout } = await exec(`docker ps --filter "name=${NIM_CONTAINER_NAME}" --format "{{.Names}}"`);
        return stdout.trim() === NIM_CONTAINER_NAME;
    } catch (error) {
        console.error('Failed to check NIM availability:', error);
        return false;
    }
}

/**
 * Starts NVIDIA NIM Docker container
 * @returns Promise that resolves when container is ready
 */
export async function startNIMContainer(): Promise<void> {
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
 * Waits for NVIDIA NIM service to be ready
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when service is ready
 */
async function waitForNIMReady(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            // Simple health check - try to connect to NIM service
            const response = await fetch(`http://localhost:${NIM_PORT}/health`);
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
 * @returns Promise that resolves when container is stopped
 */
export async function stopNIMContainer(): Promise<void> {
    try {
        await exec(`docker stop ${NIM_CONTAINER_NAME}`);
        console.log('NVIDIA NIM container stopped');
    } catch (error) {
        console.error('Failed to stop NIM container:', error);
        throw error;
    }
}

/**
 * Sends inference request to NVIDIA NIM
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @returns Model response
 */
export async function sendNIMInferenceRequest(
    model: string,
    prompt: string,
    parameters: Record<string, any> = {}
): Promise<string> {
    try {
        const requestBody = {
            model,
            prompt,
            ...parameters
        };
        
        const response = await fetch(`http://localhost:${NIM_PORT}/v1/completions`, {
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
 * Initializes NVIDIA NIM environment
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeNIMEnvironment(): Promise<void> {
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
        
        console.log('NIM environment initialized');
    } catch (error) {
        console.error('Failed to initialize NIM environment:', error);
        throw error;
    }
}