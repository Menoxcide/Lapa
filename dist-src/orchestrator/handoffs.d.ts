/**
 * Handoffs System for LAPA Swarm Intelligence
 *
 * This module implements the hybrid handoff system combining LangGraph workflow orchestration
 * with OpenAI Agent intelligent decision-making for task delegation between agents.
 */
import { Task } from '../agents/moe-router';
import { Agent as OpenAIAgent } from '@openai/agents';
type OpenAIAgentSDK = OpenAIAgent;
interface RetryConfig {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
}
interface HandoffLifecycleHooks {
    onHandoffStart?: (sourceAgentId: string, targetAgentId: string, taskId: string) => void;
    onHandoffComplete?: (sourceAgentId: string, targetAgentId: string, taskId: string, duration: number) => void;
    onHandoffError?: (sourceAgentId: string, targetAgentId: string, taskId: string, error: Error) => void;
}
interface HandoffConfig {
    enableOpenAIEvaluation: boolean;
    enableLAPAMoERouter: boolean;
    enableContextCompression: boolean;
    confidenceThreshold: number;
    minimumConfidenceForHandoff: number;
    maxHandoffDepth: number;
    maxConcurrentHandoffs: number;
    latencyTargetMs: number;
    maxLatencyThresholdMs: number;
    throughputTargetOpsPerSec: number;
    maxRetryAttempts: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    circuitBreakerEnabled: boolean;
    circuitBreakerFailureThreshold: number;
    circuitBreakerTimeoutMs: number;
    loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted';
    agentSelectionAlgorithm: 'confidence-based' | 'workload-based' | 'hybrid';
    enableFallbackMechanisms: boolean;
    fallbackToMoERouterOnOpenAIError: boolean;
    fallbackToLAPAAgentsOnMoERouterError: boolean;
    enableDetailedLogging: boolean;
    logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
    enableMetricsCollection: boolean;
    metricsCollectionIntervalMs: number;
    enableSecurityValidation: boolean;
    sanitizeContextData: boolean;
    maxContextSizeBytes: number;
    maxMemoryUsagePercentage: number;
    enableResourceThrottling: boolean;
    resourceThrottlingThresholdPercentage: number;
}
export declare class HandoffConfigValidationError extends Error {
    constructor(message: string);
}
export declare const HANDOFF_CONFIG_PRESETS: {
    development: HandoffConfig;
    production: HandoffConfig;
    highPerformance: HandoffConfig;
};
interface HandoffMetrics {
    totalHandoffs: number;
    successfulHandoffs: number;
    failedHandoffs: number;
    averageLatency: number;
    latencyHistory: number[];
}
/**
 * LAPA Hybrid Handoff System
 */
export declare class HybridHandoffSystem {
    private langGraphOrchestrator;
    private contextHandoffManager;
    private openAIAgents;
    private config;
    private thresholdManager;
    private hooks;
    private retryConfig;
    private metrics;
    constructor(config?: Partial<HandoffConfig>, hooks?: HandoffLifecycleHooks, retryConfig?: Partial<RetryConfig>);
    /**
     * Registers an OpenAI Agent for potential handoffs
     * @param agent OpenAI Agent instance
     */
    registerOpenAIAgent(agent: OpenAIAgentSDK): void;
    /**
     * Executes a task with hybrid handoff capabilities
     * @param task Initial task to execute
     * @param context Initial context
     * @returns Promise that resolves with the final result
     */
    executeTaskWithHandoffs(task: Task, context: Record<string, any>): Promise<any>;
    /**
     * Executes workflow with context and handoff capabilities
     * @param initialContext Initial workflow context
     * @returns Promise that resolves with the orchestration result
     */
    private executeWorkflowWithContext;
    /**
     * Executes optimized workflow with intelligent handoff decisions
     * @param initialContext Initial workflow context
     * @returns Promise that resolves with the orchestration result
     */
    private executeOptimizedWorkflow;
    /**
     * Processes a node with handoff optimizations
     * @param node The node to process
     * @param context Current context
     * @returns Promise that resolves with the processing result
     */
    private processNodeWithHandoffOptimizations;
    /**
     * Processes an agent node with handoff considerations
     * @param node The agent node
     * @param context Current context
     * @returns Promise that resolves with the agent's output
     */
    private processAgentNodeWithHandoff;
    /**
     * Evaluates whether a handoff should occur using OpenAI Agent or LAPA MoE Router
     * @param context Current context
     * @param task Current task
     * @returns Promise that resolves with the handoff evaluation
     */
    private evaluateHandoff;
    /**
     * Evaluates handoff using LAPA MoE Router for capability-based delegation
     * @param task Current task
     * @returns Handoff evaluation result
     */
    private evaluateHandoffWithMoERouter;
    /**
     * Balances workload among available agents
     * @returns Agent with the lowest workload
     */
    private selectAgentWithLowestWorkload;
    /**
     * Initiates a context handoff between agents
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @returns Promise that resolves with the handoff response
     */
    private initiateHandoff;
    /**
     * Handles handoff to an OpenAI agent
     * @param targetAgent Target OpenAI agent
     * @param taskId Task ID
     * @param context Context to handoff
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @returns Promise that resolves with the handoff result
     */
    private handoffToOpenAIAgent;
    /**
     * Handles handoff to a LAPA agent
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @returns Promise that resolves with the handoff result
     */
    private handoffToLAPAAgent;
    /**
     * Executes an operation with retry logic
     * @param operation The operation to execute
     * @param operationName Name of the operation for logging
     * @returns Promise that resolves with the operation result
     */
    private runWithRetry;
    /**
     * Updates handoff configuration
     * @param newConfig Partial configuration to update
     * @throws HandoffConfigValidationError if validation fails
     */
    updateConfig(newConfig: Partial<HandoffConfig>): void;
    /**
     * Loads a configuration preset
     * @param preset Preset name (development, production, highPerformance)
     * @throws Error if preset is not found
     */
    loadPreset(preset: keyof typeof HANDOFF_CONFIG_PRESETS): void;
    /**
     * Loads configuration from environment variables
     * @throws HandoffConfigValidationError if validation fails
     */
    loadConfigFromEnvironment(): void;
    /**
     * Gets current handoff configuration
     * @returns Current configuration
     */
    getConfig(): HandoffConfig;
    /**
     * Validates current configuration and returns health status
     * @returns Object with validation result and any errors
     */
    checkConfigHealth(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Gets current handoff metrics
     * @returns Current metrics
     */
    getMetrics(): HandoffMetrics;
    /**
     * Updates latency metrics with new measurement
     * @param latency Latency in milliseconds
     */
    private updateLatencyMetrics;
    /**
     * Handles handoff failure with fallback mechanisms
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @param error Error that caused the failure
     * @returns Promise that resolves with a fallback result
     */
    private handleHandoffFailure;
}
export declare const hybridHandoffSystem: HybridHandoffSystem;
export {};
