/**
 * Ollama Compatibility Layer for AutoGen Core
 *
 * This module provides a specialized compatibility layer for Ollama
 * within the AutoGen Core framework. It extends the existing Ollama local
 * implementation with AutoGen-specific functionality and optimizations.
 */

import { sendOllamaChatRequest, sendOllamaInferenceRequest, isOllamaAvailable, startOllamaContainer, stopOllamaContainer, pullOllamaModel } from '../inference/ollama.local.ts';
import { Agent, Task } from '../agents/moe-router.ts';

// AutoGen-specific Ollama configuration
interface AutoGenOllamaConfig {
  defaultModel: string;
  maxRetries: number;
  timeoutMs: number;
  enableHealthChecks: boolean;
  autoPullModels: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AutoGenOllamaConfig = {
  defaultModel: 'llama3.1',
  maxRetries: 3,
  timeoutMs: 30000,
  enableHealthChecks: true,
  autoPullModels: true
};

// Ollama integration status
interface OllamaIntegrationStatus {
  isAvailable: boolean;
  isContainerRunning: boolean;
  lastHealthCheck: Date | null;
  activeRequests: number;
  availableModels: string[];
}

/**
 * LAPA AutoGen Ollama Integration Class
 */
export class AutoGenOllamaIntegration {
  private config: AutoGenOllamaConfig;
  private status: OllamaIntegrationStatus;

  constructor(config?: Partial<AutoGenOllamaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = {
      isAvailable: false,
      isContainerRunning: false,
      lastHealthCheck: null,
      activeRequests: 0,
      availableModels: []
    };
  }

  /**
   * Initializes the Ollama integration for AutoGen Core
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AutoGen Ollama Integration...');
      
      // Check if Ollama is available
      this.status.isAvailable = await isOllamaAvailable();
      
      if (!this.status.isAvailable) {
        console.log('Ollama container not found, attempting to start...');
        await startOllamaContainer();
        this.status.isContainerRunning = true;
        this.status.isAvailable = await isOllamaAvailable();
      } else {
        this.status.isContainerRunning = true;
        console.log('Ollama container is already running');
      }
      
      if (this.status.isAvailable) {
        // Get available models
        try {
          this.status.availableModels = []; // In a real implementation, this would call listOllamaModels()
        } catch (error) {
          console.warn('Failed to retrieve available Ollama models:', error);
        }
        
        console.log('AutoGen Ollama Integration initialized successfully');
        this.status.lastHealthCheck = new Date();
      } else {
        throw new Error('Failed to initialize Ollama integration');
      }
    } catch (error) {
      console.error('Failed to initialize AutoGen Ollama Integration:', error);
      throw error;
    }
  }

  /**
   * Ensures a model is available, pulling it if necessary
   * @param model Model name to ensure availability
   * @returns Promise that resolves when model is available
   */
  async ensureModelAvailability(model: string): Promise<void> {
    if (!this.config.autoPullModels) {
      return;
    }
    
    if (!this.status.availableModels.includes(model)) {
      console.log(`Model ${model} not found, pulling...`);
      await pullOllamaModel(model);
      this.status.availableModels.push(model);
      console.log(`Model ${model} pulled successfully`);
    }
  }

  /**
   * Sends a chat request through Ollama for AutoGen agents
   * @param agent The agent making the request
   * @param task The task to process
   * @param messages The conversation messages
   * @param parameters Additional parameters for the request
   * @returns Promise that resolves with the model response
   */
  async sendChatRequest(
    agent: Agent,
    task: Task,
    messages: Array<{role: string, content: string}>,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    // Increment active requests counter
    this.status.activeRequests++;
    
    try {
      console.log(`Agent ${agent.name} sending chat request for task ${task.id}`);
      
      // Ensure model is available
      await this.ensureModelAvailability(this.config.defaultModel);
      
      // Add AutoGen-specific metadata to parameters
      const enhancedParameters = {
        ...parameters,
        agent_id: agent.id,
        task_id: task.id,
        agent_type: agent.type,
        timestamp: new Date().toISOString()
      };
      
      // Send request with retry logic
      const result = await this.sendWithRetry(
        this.config.defaultModel,
        messages,
        enhancedParameters
      );
      
      console.log(`Chat request completed for agent ${agent.name}, task ${task.id}`);
      return result;
    } finally {
      // Decrement active requests counter
      this.status.activeRequests--;
    }
  }

  /**
   * Sends an inference request through Ollama for AutoGen agents
   * @param agent The agent making the request
   * @param task The task to process
   * @param prompt The prompt to send to the model
   * @param parameters Additional parameters for the request
   * @returns Promise that resolves with the model response
   */
  async sendInferenceRequest(
    agent: Agent,
    task: Task,
    prompt: string,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    // Increment active requests counter
    this.status.activeRequests++;
    
    try {
      console.log(`Agent ${agent.name} sending inference request for task ${task.id}`);
      
      // Ensure model is available
      await this.ensureModelAvailability(this.config.defaultModel);
      
      // Add AutoGen-specific metadata to parameters
      const enhancedParameters = {
        ...parameters,
        agent_id: agent.id,
        task_id: task.id,
        agent_type: agent.type,
        timestamp: new Date().toISOString()
      };
      
      // Send request with retry logic
      const result = await this.sendInferenceWithRetry(
        this.config.defaultModel,
        prompt,
        enhancedParameters
      );
      
      console.log(`Inference request completed for agent ${agent.name}, task ${task.id}`);
      return result;
    } finally {
      // Decrement active requests counter
      this.status.activeRequests--;
    }
  }

  /**
   * Sends a chat request with retry logic
   * @param model Model name
   * @param messages Conversation messages
   * @param parameters Request parameters
   * @returns Promise that resolves with the model response
   */
  private async sendWithRetry(
    model: string,
    messages: Array<{role: string, content: string}>,
    parameters: Record<string, any>
  ): Promise<string> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check health before request if enabled
        if (this.config.enableHealthChecks && attempt > 1) {
          const isHealthy = await this.performHealthCheck();
          if (!isHealthy) {
            throw new Error('Ollama health check failed');
          }
        }
        
        return await sendOllamaChatRequest(model, messages, parameters);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Ollama chat attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Ollama chat failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Sends an inference request with retry logic
   * @param model Model name
   * @param prompt Input prompt
   * @param parameters Request parameters
   * @returns Promise that resolves with the model response
   */
  private async sendInferenceWithRetry(
    model: string,
    prompt: string,
    parameters: Record<string, any>
  ): Promise<string> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check health before request if enabled
        if (this.config.enableHealthChecks && attempt > 1) {
          const isHealthy = await this.performHealthCheck();
          if (!isHealthy) {
            throw new Error('Ollama health check failed');
          }
        }
        
        return await sendOllamaInferenceRequest(model, prompt, parameters);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Ollama inference attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Ollama inference failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Performs a health check on the Ollama service
   * @returns Promise that resolves with the health status
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      const isAvailable = await isOllamaAvailable();
      this.status.isAvailable = isAvailable;
      this.status.lastHealthCheck = new Date();
      return isAvailable;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      this.status.isAvailable = false;
      return false;
    }
  }

  /**
   * Gets the current status of the Ollama integration
   * @returns Current integration status
   */
  getStatus(): OllamaIntegrationStatus {
    return { ...this.status };
  }

  /**
   * Shuts down the Ollama integration
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    try {
      if (this.status.isContainerRunning) {
        console.log('Stopping Ollama container...');
        await stopOllamaContainer();
        this.status.isContainerRunning = false;
        this.status.isAvailable = false;
        console.log('Ollama container stopped');
      }
    } catch (error) {
      console.error('Error shutting down Ollama integration:', error);
      throw error;
    }
  }
}

// Default export for convenience
export const autoGenOllamaIntegration = new AutoGenOllamaIntegration();

// Export types for external use
export type { AutoGenOllamaConfig, OllamaIntegrationStatus };