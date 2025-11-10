/**
 * AGENT.md Auto-Generator for LAPA
 *
 * This module automatically generates AGENT.md documentation files for LAPA agents.
 * It creates comprehensive documentation including agent capabilities, usage patterns,
 * and integration details.
 */
import { Agent } from './moe-router';
export interface GenerationOptions {
    outputPath?: string;
    includeTimestamp?: boolean;
    includeVersion?: string;
}
/**
 * LAPA Agent Documentation Generator
 */
export declare class AgentDocumentationGenerator {
    private outputPath;
    constructor(options?: GenerationOptions);
    /**
     * Generates documentation for a single agent
     * @param agent The agent to document
     * @param options Generation options
     * @returns Generated documentation content
     */
    generateAgentDocumentation(agent: Agent, options?: GenerationOptions): string;
    /**
     * Generates documentation for multiple agents
     * @param agents Array of agents to document
     * @param options Generation options
     * @returns Generated documentation content
     */
    generateAgentsDocumentation(agents: Agent[], options?: GenerationOptions): string;
    /**
     * Saves agent documentation to a file
     * @param agent The agent to document
     * @param filename Output filename
     * @param options Generation options
     */
    saveAgentDocumentation(agent: Agent, filename: string, options?: GenerationOptions): Promise<void>;
    /**
     * Saves documentation for multiple agents to a file
     * @param agents Array of agents to document
     * @param filename Output filename
     * @param options Generation options
     */
    saveAgentsDocumentation(agents: Agent[], filename: string, options?: GenerationOptions): Promise<void>;
    /**
     * Creates structured documentation for an agent
     * @param agent The agent to document
     * @returns Structured documentation object
     */
    private createAgentDocumentation;
    /**
     * Formats documentation as Markdown
     * @param doc Documentation object
     * @param options Generation options
     * @returns Formatted Markdown content
     */
    private formatDocumentation;
    /**
     * Formats single agent documentation as Markdown
     * @param doc Documentation object
     * @param options Generation options
     * @returns Formatted Markdown content
     */
    private formatSingleAgentDocumentation;
    /**
     * Gets agent description based on type
     * @param type Agent type
     * @returns Agent description
     */
    private getAgentDescription;
    /**
     * Gets agent usage instructions based on type
     * @param type Agent type
     * @returns Agent usage instructions
     */
    private getAgentUsage;
    /**
     * Gets agent integration details based on type
     * @param type Agent type
     * @returns Agent integration details
     */
    private getAgentIntegration;
}
export declare const agentDocumentationGenerator: AgentDocumentationGenerator;
