/**
 * Cloud NVIDIA NIM Integration for LAPA Premium
 * 
 * This module provides integration with NVIDIA NIM running in cloud environments.
 * It handles model loading, inference requests, and connection management for
 * cloud-based NVIDIA NIM services.
 */

// Import necessary modules
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// Cloud NIM configuration
const CLOUD_NIM_API_BASE = process.env.CLOUD_NIM_API_BASE || 'https://api.nim.cloud';
const CLOUD_NIM_API_KEY = process.env.CLOUD_NIM_API_KEY || '';
const CLOUD_NIM_DEFAULT_MODEL = process.env.CLOUD_NIM_DEFAULT_MODEL || 'llama3-70b';

/**
 * Cloud NIM Integration class
 */
export class CloudNIMIntegration {
    private apiKey: string;
    private apiBase: string;
    private defaultModel: string;
    
    constructor(apiKey?: string, apiBase?: string, defaultModel?: string) {
        this.apiKey = apiKey || CLOUD_NIM_API_KEY;
        this.apiBase = apiBase || CLOUD_NIM_API_BASE;
        this.defaultModel = defaultModel || CLOUD_NIM_DEFAULT_MODEL;
        
        if (!this.apiKey) {
            throw new Error('Cloud NIM API key is required');
        }
    }
    
    /**
     * Sends inference request to Cloud NVIDIA NIM
     * @param model Model name to use for inference
     * @param prompt Input prompt for the model
     * @param parameters Additional inference parameters
     * @returns Model response
     */
    async sendInferenceRequest(
        prompt: string,
        model: string = this.defaultModel,
        parameters: Record<string, any> = {}
    ): Promise<string> {
        try {
            const requestBody = {
                model,
                prompt,
                ...parameters
            };
            
            const response = await fetch(`${this.apiBase}/v1/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Cloud NIM inference request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].text;
        } catch (error) {
            console.error('Failed to send Cloud NIM inference request:', error);
            throw error;
        }
    }
    
    /**
     * Lists available models in Cloud NVIDIA NIM
     * @returns Array of available models
     */
    async listModels(): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiBase}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Failed to list Cloud NIM models:', error);
            throw error;
        }
    }
    
    /**
     * Gets model information from Cloud NVIDIA NIM
     * @param model Model name
     * @returns Model information
     */
    async getModelInfo(model: string): Promise<any> {
        try {
            const response = await fetch(`${this.apiBase}/v1/models/${model}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get model info: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get Cloud NIM model info:', error);
            throw error;
        }
    }
    
    /**
     * Checks Cloud NIM service health
     * @returns Health status
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiBase}/health`, {
                method: 'GET'
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to check Cloud NIM health:', error);
            return false;
        }
    }
}

// Export singleton instance
export const cloudNIMIntegration = new CloudNIMIntegration();