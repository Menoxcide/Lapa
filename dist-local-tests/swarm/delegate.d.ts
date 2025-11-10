/**
 * Swarm Delegate for LAPA v1.1 Local-First Implementation
 *
 * This module implements the swarm delegate that integrates local client functionality
 * into swarm operations. It enables swarm-level handoff functionality using local inference
 * while maintaining compatibility with existing swarm consensus and voting mechanisms.
 */
import { Task } from '../agents/moe-router';
export interface SwarmDelegateConfig {
    enableLocalInference: boolean;
    latencyTargetMs: number;
    maxConcurrentDelegations: number;
    enableConsensusVoting: boolean;
}
export interface DelegationResult {
    success: boolean;
    taskId: string;
    delegatedToAgentId?: string;
    result?: any;
    error?: string;
    metrics?: {
        duration: number;
        latencyWithinTarget: boolean;
    };
}
export interface SwarmAgent {
    id: string;
    name: string;
    capabilities: string[];
    workload: number;
    isLocal: boolean;
    type: string;
    capacity: number;
}
/**
 * LAPA Swarm Delegate
 *
 * Manages delegation of tasks within the swarm using local inference when available,
 * integrating with consensus mechanisms for collective decision-making.
 */
export declare class SwarmDelegate {
    private localHandoffSystem;
    private consensusVotingSystem;
    private contextHandoffManager;
    private config;
    private registeredAgents;
    constructor(config?: Partial<SwarmDelegateConfig>);
    /**
     * Registers a swarm agent for potential delegation
     * @param agent Swarm agent instance
     */
    registerAgent(agent: SwarmAgent): void;
    /**
     * Delegates a task to the most appropriate agent using local inference when possible
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    delegateTask(task: Task, context: Record<string, any>): Promise<DelegationResult>;
    /**
     * Delegates a task to a local agent using local inference
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    private delegateToLocalAgent;
    /**
     * Delegates a task via consensus voting among swarm agents
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    private delegateViaConsensus;
    /**
     * Checks if there are any local agents registered
     * @returns Boolean indicating if local agents exist
     */
    private hasLocalAgents;
    /**
     * Gets current swarm delegate configuration
     * @returns Current configuration
     */
    getConfig(): SwarmDelegateConfig;
    /**
     * Updates swarm delegate configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig: Partial<SwarmDelegateConfig>): void;
    /**
     * Gets registered agents
     * @returns Array of registered agents
     */
    getRegisteredAgents(): SwarmAgent[];
}
export declare const swarmDelegate: SwarmDelegate;
/**
 * Convenience function for delegating tasks using the swarm delegate
 * @param task Task to delegate
 * @param context Context for the task
 * @returns Promise that resolves with the delegation result
 */
export declare function delegateTask(task: Task, context: Record<string, any>): Promise<DelegationResult>;
