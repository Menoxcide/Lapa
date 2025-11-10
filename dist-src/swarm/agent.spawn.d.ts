/**
 * Agent Spawn Mechanism for LAPA Swarm Intelligence
 *
 * This module implements the agent spawning mechanism for the LAPA swarm,
 * enabling dynamic creation of agents with summarized context. It includes
 * intelligent summarization to ensure spawned agents have relevant information.
 */
import { Agent, AgentType, Task } from '../agents/moe-router';
export interface SpawnRequest {
    parentId: string;
    agentType: AgentType;
    task: Task;
    context: Record<string, any>;
    maxTokens?: number;
    priority: 'low' | 'medium' | 'high';
}
export interface SpawnResult {
    success: boolean;
    agentId?: string;
    summary?: string;
    error?: string;
    spawnTime: number;
}
export interface AgentTemplate {
    type: AgentType;
    namePattern: string;
    expertise: string[];
    capacity: number;
    description: string;
}
export interface SummaryOptions {
    maxLength?: number;
    focusAreas?: string[];
    preserveSemantic?: boolean;
}
/**
 * LAPA Agent Spawning System
 */
export declare class AgentSpawningSystem {
    private agentTemplates;
    private spawnedAgents;
    private spawnCounter;
    constructor();
    /**
     * Initializes default agent templates
     */
    private initializeAgentTemplates;
    /**
     * Spawns a new agent with summarized context
     * @param request Spawn request details
     * @returns Promise that resolves with the spawn result
     */
    spawnAgent(request: SpawnRequest): Promise<SpawnResult>;
    /**
     * Gets a spawned agent by ID
     * @param agentId ID of the agent
     * @returns Agent or undefined if not found
     */
    getSpawnedAgent(agentId: string): Agent | undefined;
    /**
     * Gets all spawned agents
     * @returns Array of spawned agents
     */
    getAllSpawnedAgents(): Agent[];
    /**
     * Gets spawned agents by type
     * @param agentType Type of agent
     * @returns Array of spawned agents of the specified type
     */
    getSpawnedAgentsByType(agentType: AgentType): Agent[];
    /**
     * Terminates a spawned agent
     * @param agentId ID of the agent to terminate
     * @returns Boolean indicating success
     */
    terminateAgent(agentId: string): boolean;
    /**
     * Gets agent template by type
     * @param agentType Type of agent
     * @returns Agent template or undefined if not found
     */
    getAgentTemplate(agentType: AgentType): AgentTemplate | undefined;
    /**
     * Adds a custom agent template
     * @param template Agent template to add
     */
    addAgentTemplate(template: AgentTemplate): void;
    /**
     * Removes an agent template
     * @param agentType Type of agent template to remove
     * @returns Boolean indicating success
     */
    removeAgentTemplate(agentType: AgentType): boolean;
    /**
     * Summarizes context for efficient agent initialization
     * @param context Context to summarize
     * @param options Summary options
     * @returns Promise that resolves with the summarized context
     */
    private summarizeContext;
    /**
     * Creates a prompt for context summarization
     * @param contextString Context as string
     * @param options Summary options
     * @returns Prompt for summarization
     */
    private createSummaryPrompt;
    /**
     * Fallback summarization method using truncation and key extraction
     * @param contextString Context as string
     * @param maxLength Maximum length
     * @returns Summarized context
     */
    private fallbackSummarize;
    /**
     * Extracts focus areas from task and agent template
     * @param task Task to analyze
     * @param template Agent template
     * @returns Array of focus areas
     */
    private extractFocusAreas;
    /**
     * Generates a unique agent ID
     * @param agentType Type of agent
     * @returns Unique agent ID
     */
    private generateAgentId;
}
export declare const agentSpawningSystem: AgentSpawningSystem;
