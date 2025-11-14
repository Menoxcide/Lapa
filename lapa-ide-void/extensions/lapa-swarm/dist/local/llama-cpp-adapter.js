"use strict";
/**
 * llama.cpp Adapter for AutoGen Core
 *
 * This module provides an adapter for integrating llama.cpp with the AutoGen Core framework.
 * It enables local inference using llama.cpp models with AutoGen-specific functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoGenLlamaCppAdapter = exports.AutoGenLlamaCppAdapter = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const child_process_2 = require("child_process");
const fs_1 = require("fs");
const exec = (0, util_1.promisify)(child_process_2.exec);
// Default configuration
const DEFAULT_CONFIG = {
    executablePath: './llama.cpp/main', // Default path to llama.cpp executable
    defaultModelPath: './models/llama3.gguf', // Default path to model file
    maxRetries: 3,
    timeoutMs: 30000,
    enableHealthChecks: true,
    defaultParameters: {
        'temp': 0.7,
        'top_k': 40,
        'top_p': 0.95,
        'repeat_penalty': 1.1,
        'n_predict': 512
    }
};
/**
 * LAPA AutoGen llama.cpp Adapter Class
 */
class AutoGenLlamaCppAdapter {
    config;
    status;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.status = {
            isAvailable: false,
            isExecutableFound: false,
            isModelFound: false,
            lastHealthCheck: null,
            activeRequests: 0
        };
    }
    /**
     * Initializes the llama.cpp adapter for AutoGen Core
     * @returns Promise that resolves when initialization is complete
     */
    async initialize() {
        try {
            console.log('Initializing AutoGen llama.cpp Adapter...');
            // Check if llama.cpp executable exists
            this.status.isExecutableFound = (0, fs_1.existsSync)(this.config.executablePath);
            if (!this.status.isExecutableFound) {
                throw new Error(`llama.cpp executable not found at ${this.config.executablePath}`);
            }
            // Check if model file exists
            this.status.isModelFound = (0, fs_1.existsSync)(this.config.defaultModelPath);
            if (!this.status.isModelFound) {
                throw new Error(`Model file not found at ${this.config.defaultModelPath}`);
            }
            // Perform health check
            const isHealthy = await this.performHealthCheck();
            this.status.isAvailable = isHealthy;
            if (this.status.isAvailable) {
                console.log('AutoGen llama.cpp Adapter initialized successfully');
                this.status.lastHealthCheck = new Date();
            }
            else {
                throw new Error('Failed to initialize llama.cpp adapter');
            }
        }
        catch (error) {
            console.error('Failed to initialize AutoGen llama.cpp Adapter:', error);
            throw error;
        }
    }
    /**
     * Sends an inference request through llama.cpp for AutoGen agents
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
            console.log(`Agent ${agent.name} sending inference request through llama.cpp for task ${task.id}`);
            // Merge default parameters with provided parameters
            const mergedParameters = { ...this.config.defaultParameters, ...parameters };
            // Add AutoGen-specific metadata to parameters
            const enhancedParameters = {
                ...mergedParameters,
                agent_id: agent.id,
                task_id: task.id,
                agent_type: agent.type,
                timestamp: new Date().toISOString()
            };
            // Send request with retry logic
            const result = await this.sendWithRetry(prompt, enhancedParameters);
            console.log(`llama.cpp inference request completed for agent ${agent.name}, task ${task.id}`);
            return result;
        }
        finally {
            // Decrement active requests counter
            this.status.activeRequests--;
        }
    }
    /**
     * Sends a request with retry logic
     * @param prompt Input prompt
     * @param parameters Request parameters
     * @returns Promise that resolves with the model response
     */
    async sendWithRetry(prompt, parameters) {
        let lastError;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                // Check health before request if enabled
                if (this.config.enableHealthChecks && attempt > 1) {
                    const isHealthy = await this.performHealthCheck();
                    if (!isHealthy) {
                        throw new Error('llama.cpp health check failed');
                    }
                }
                return await this.executeLlamaCpp(prompt, parameters);
            }
            catch (error) {
                lastError = error;
                console.warn(`llama.cpp inference attempt ${attempt} failed:`, error);
                if (attempt < this.config.maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw new Error(`llama.cpp inference failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Executes llama.cpp with the given prompt and parameters
     * @param prompt Input prompt
     * @param parameters Request parameters
     * @returns Promise that resolves with the model response
     */
    async executeLlamaCpp(prompt, parameters) {
        return new Promise((resolve, reject) => {
            // Build command arguments
            const args = [
                '-m', this.config.defaultModelPath,
                '--prompt', prompt,
                '--n-predict', parameters.n_predict || this.config.defaultParameters.n_predict
            ];
            // Add other parameters
            if (parameters.temp !== undefined)
                args.push('--temp', parameters.temp.toString());
            if (parameters.top_k !== undefined)
                args.push('--top-k', parameters.top_k.toString());
            if (parameters.top_p !== undefined)
                args.push('--top-p', parameters.top_p.toString());
            if (parameters.repeat_penalty !== undefined)
                args.push('--repeat-penalty', parameters.repeat_penalty.toString());
            // Add AutoGen-specific parameters as prompt suffix
            const autogenInfo = `\n\n[AutoGen Info: Agent=${parameters.agent_id}, Task=${parameters.task_id}, Type=${parameters.agent_type}]`;
            args.push('--prompt', prompt + autogenInfo);
            console.log(`Executing llama.cpp with args: ${args.join(' ')}`);
            // Spawn llama.cpp process
            const child = (0, child_process_1.spawn)(this.config.executablePath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
            let output = '';
            let errorOutput = '';
            // Set timeout
            const timeout = setTimeout(() => {
                child.kill();
                reject(new Error(`llama.cpp execution timed out after ${this.config.timeoutMs}ms`));
            }, this.config.timeoutMs);
            // Collect output
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            // Collect errors
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            // Handle process exit
            child.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    // Extract the response part (everything after the prompt)
                    const promptIndex = output.indexOf(prompt);
                    if (promptIndex !== -1) {
                        const response = output.substring(promptIndex + prompt.length).trim();
                        resolve(response);
                    }
                    else {
                        resolve(output.trim());
                    }
                }
                else {
                    reject(new Error(`llama.cpp process exited with code ${code}. Error: ${errorOutput}`));
                }
            });
            // Handle process error
            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to start llama.cpp process: ${error.message}`));
            });
        });
    }
    /**
     * Performs a health check on the llama.cpp setup
     * @returns Promise that resolves with the health status
     */
    async performHealthCheck() {
        try {
            // Check if executable exists
            this.status.isExecutableFound = (0, fs_1.existsSync)(this.config.executablePath);
            if (!this.status.isExecutableFound) {
                this.status.isAvailable = false;
                return false;
            }
            // Check if model exists
            this.status.isModelFound = (0, fs_1.existsSync)(this.config.defaultModelPath);
            if (!this.status.isModelFound) {
                this.status.isAvailable = false;
                return false;
            }
            // Test basic execution with a simple prompt
            const testPrompt = "Test prompt for health check";
            const testParameters = { n_predict: 10 }; // Limit output for quick test
            await this.executeLlamaCpp(testPrompt, testParameters);
            this.status.isAvailable = true;
            this.status.lastHealthCheck = new Date();
            return true;
        }
        catch (error) {
            console.error('llama.cpp health check failed:', error);
            this.status.isAvailable = false;
            return false;
        }
    }
    /**
     * Gets the current status of the llama.cpp integration
     * @returns Current integration status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Updates the configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('llama.cpp adapter configuration updated');
    }
}
exports.AutoGenLlamaCppAdapter = AutoGenLlamaCppAdapter;
// Default export for convenience
exports.autoGenLlamaCppAdapter = new AutoGenLlamaCppAdapter();
//# sourceMappingURL=llama-cpp-adapter.js.map