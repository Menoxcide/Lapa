/**
 * MoE Router for LAPA Core Agents
 *
 * This module implements the Mixture of Experts (MoE) routing logic for distributing
 * tasks among specialized agents in the LAPA swarm. It analyzes incoming tasks
 * and routes them to the most appropriate agent based on expertise and workload.
 */
export type AgentType = 'planner' | 'coder' | 'reviewer' | 'debugger' | 'optimizer' | 'tester';
export interface Task {
    id: string;
    description: string;
    type: string;
    priority: number;
    context?: any;
}
export interface Agent {
    id: string;
    type: AgentType;
    name: string;
    expertise: string[];
    workload: number;
    capacity: number;
}
export interface RoutingResult {
    agent: Agent;
    confidence: number;
    reasoning: string;
}
/**
 * LAPA MoE Router class
 */
export declare class MoERouter {
    private agents;
    private maxMemoryEntries;
    private routingMemory;
    /**
     * Registers an agent with the router
     * @param agent The agent to register
     */
    constructor(maxMemoryEntries?: number);
    registerAgent(agent: Agent): void;
    /**
     * Unregisters an agent from the router
     * @param agentId The ID of the agent to unregister
     */
    unregisterAgent(agentId: string): void;
    /**
     * Updates an agent's workload
     * @param agentId The ID of the agent
     * @param workload The new workload value
     */
    updateAgentWorkload(agentId: string, workload: number): void;
    /**
     * Routes a task to the most appropriate agent
     * @param task The task to route
     * @returns Routing result with selected agent and confidence
     */
    routeTask(task: Task): RoutingResult;
    /**
     * Calculates expertise match between task and agent
     * @param task The task to evaluate
     * @param agent The agent to evaluate
     * @returns Match score between 0 and 1
     */
    private calculateExpertiseMatch;
    /**
     * Gets all registered agents
     * @returns Array of registered agents
     */
    getAgents(): Agent[];
    /**
     * Gets agent by ID
     * @param agentId The ID of the agent
     * @returns The agent or undefined if not found
     */
    getAgentById(agentId: string): Agent | undefined;
    /**
     * Records a routing decision for memory
     * @param taskId Task ID
     * @param agentId Agent ID
     */
    private recordRoutingDecision;
    /**
     * Gets recent routing decision for a task
     * @param taskId Task ID
     * @returns Routing decision or undefined if not found
     */
    private getRecentRouting;
}
export declare const moeRouter: MoERouter;
