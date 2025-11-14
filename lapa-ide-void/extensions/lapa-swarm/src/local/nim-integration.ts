/**
 * NIM Integration Layer for AutoGen Core
 *
 * This module provides a specialized integration layer for NVIDIA NIM
 * within the AutoGen Core framework. It extends the existing NIM local
 * implementation with AutoGen-specific functionality and optimizations.
 */

import { sendNIMInferenceRequest, isNIMAvailable, startNIMContainer, stopNIMContainer } from '../inference/nim.local.ts';
import { Agent, Task } from '../agents/moe-router.ts';

// AutoGen-specific NIM configuration
interface AutoGenNIMConfig {
  defaultModel: string;
  maxRetries: number;
  timeoutMs: number;
  enableHealthChecks: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AutoGenNIMConfig = {
  defaultModel: 'meta/llama3-8b-instruct',
  maxRetries: 3,
  timeoutMs: 30000,
  enableHealthChecks: true
};

// NIM integration status
interface NIMIntegrationStatus {
  isAvailable: boolean;
  isContainerRunning: boolean;
  lastHealthCheck: Date | null;
  activeRequests: number;
}

/**
 * LAPA AutoGen NIM Integration Class
 */
export class AutoGenNIMIntegration {
  private config: AutoGenNIMConfig;
  private status: NIMIntegrationStatus;

  constructor(config?: Partial<AutoGenNIMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = {
      isAvailable: false,
      isContainerRunning: false,
      lastHealthCheck: null,
      activeRequests: 0
    };
  }

  /**
   * Initializes the NIM integration for AutoGen Core
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AutoGen NIM Integration...');
      
      // Check if NIM is available
      this.status.isAvailable = await isNIMAvailable();
      
      if (!this.status.isAvailable) {
        console.log('NIM container not found, attempting to start...');
        await startNIMContainer();
        this.status.isContainerRunning = true;
        this.status.isAvailable = await isNIMAvailable();
      } else {
        this.status.isContainerRunning = true;
        console.log('NIM container is already running');
      }
      
      if (this.status.isAvailable) {
        console.log('AutoGen NIM Integration initialized successfully');
        this.status.lastHealthCheck = new Date();
      } else {
        throw new Error('Failed to initialize NIM integration');
      }
    } catch (error) {
      console.error('Failed to initialize AutoGen NIM Integration:', error);
      throw error;
    }
  }

  /**
   * Sends an inference request through NIM for AutoGen agents
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
   * Sends a request with retry logic
   * @param model Model name
   * @param prompt Input prompt
   * @param parameters Request parameters
   * @returns Promise that resolves with the model response
   */
  private async sendWithRetry(
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
            throw new Error('NIM health check failed');
          }
        }
        
        return await sendNIMInferenceRequest(model, prompt, parameters);
      } catch (error) {
        lastError = error as Error;
        console.warn(`NIM inference attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`NIM inference failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Performs a health check on the NIM service
   * @returns Promise that resolves with the health status
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      const isAvailable = await isNIMAvailable();
      this.status.isAvailable = isAvailable;
      this.status.lastHealthCheck = new Date();
      return isAvailable;
    } catch (error) {
      console.error('NIM health check failed:', error);
      this.status.isAvailable = false;
      return false;
    }
  }

  /**
   * Gets the current status of the NIM integration
   * @returns Current integration status
   */
  getStatus(): NIMIntegrationStatus {
    return { ...this.status };
  }

  /**
   * Shuts down the NIM integration
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    try {
      if (this.status.isContainerRunning) {
        console.log('Stopping NIM container...');
        await stopNIMContainer();
        this.status.isContainerRunning = false;
        this.status.isAvailable = false;
        console.log('NIM container stopped');
      }
    } catch (error) {
      console.error('Error shutting down NIM integration:', error);
      throw error;
    }
  }
}

// Default export for convenience
export const autoGenNIMIntegration = new AutoGenNIMIntegration();

// Export types for external use
export type { AutoGenNIMConfig, NIMIntegrationStatus };