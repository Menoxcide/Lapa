"use strict";
/**
 * NIM Integration Layer for AutoGen Core
 *
 * This module provides a specialized integration layer for NVIDIA NIM
 * within the AutoGen Core framework. It extends the existing NIM local
 * implementation with AutoGen-specific functionality and optimizations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoGenNIMIntegration = exports.AutoGenNIMIntegration = void 0;
const nim_local_ts_1 = require("../inference/nim.local.ts");
// Default configuration
const DEFAULT_CONFIG = {
    defaultModel: 'meta/llama3-8b-instruct',
    maxRetries: 3,
    timeoutMs: 30000,
    enableHealthChecks: true
};
/**
 * LAPA AutoGen NIM Integration Class
 */
class AutoGenNIMIntegration {
    config;
    status;
    constructor(config) {
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
    async initialize() {
        try {
            console.log('Initializing AutoGen NIM Integration...');
            // Check if NIM is available
            this.status.isAvailable = await (0, nim_local_ts_1.isNIMAvailable)();
            if (!this.status.isAvailable) {
                console.log('NIM container not found, attempting to start...');
                await (0, nim_local_ts_1.startNIMContainer)();
                this.status.isContainerRunning = true;
                this.status.isAvailable = await (0, nim_local_ts_1.isNIMAvailable)();
            }
            else {
                this.status.isContainerRunning = true;
                console.log('NIM container is already running');
            }
            if (this.status.isAvailable) {
                console.log('AutoGen NIM Integration initialized successfully');
                this.status.lastHealthCheck = new Date();
            }
            else {
                throw new Error('Failed to initialize NIM integration');
            }
        }
        catch (error) {
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
    async sendInferenceRequest(agent, task, prompt, parameters = {}) {
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
            const result = await this.sendWithRetry(this.config.defaultModel, prompt, enhancedParameters);
            console.log(`Inference request completed for agent ${agent.name}, task ${task.id}`);
            return result;
        }
        finally {
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
    async sendWithRetry(model, prompt, parameters) {
        let lastError;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                // Check health before request if enabled
                if (this.config.enableHealthChecks && attempt > 1) {
                    const isHealthy = await this.performHealthCheck();
                    if (!isHealthy) {
                        throw new Error('NIM health check failed');
                    }
                }
                return await (0, nim_local_ts_1.sendNIMInferenceRequest)(model, prompt, parameters);
            }
            catch (error) {
                lastError = error;
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
    async performHealthCheck() {
        try {
            const isAvailable = await (0, nim_local_ts_1.isNIMAvailable)();
            this.status.isAvailable = isAvailable;
            this.status.lastHealthCheck = new Date();
            return isAvailable;
        }
        catch (error) {
            console.error('NIM health check failed:', error);
            this.status.isAvailable = false;
            return false;
        }
    }
    /**
     * Gets the current status of the NIM integration
     * @returns Current integration status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Shuts down the NIM integration
     * @returns Promise that resolves when shutdown is complete
     */
    async shutdown() {
        try {
            if (this.status.isContainerRunning) {
                console.log('Stopping NIM container...');
                await (0, nim_local_ts_1.stopNIMContainer)();
                this.status.isContainerRunning = false;
                this.status.isAvailable = false;
                console.log('NIM container stopped');
            }
        }
        catch (error) {
            console.error('Error shutting down NIM integration:', error);
            throw error;
        }
    }
}
exports.AutoGenNIMIntegration = AutoGenNIMIntegration;
// Default export for convenience
exports.autoGenNIMIntegration = new AutoGenNIMIntegration();
//# sourceMappingURL=nim-integration.js.map