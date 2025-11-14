"use strict";
/**
 * Agent Spawn Mechanism for LAPA Swarm Intelligence
 *
 * This module implements the agent spawning mechanism for the LAPA swarm,
 * enabling dynamic creation of agents with summarized context. It includes
 * intelligent summarization to ensure spawned agents have relevant information.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentSpawningSystem = exports.AgentSpawningSystem = void 0;
const nim_local_ts_1 = require("../inference/nim.local.ts");
/**
 * LAPA Agent Spawning System
 */
class AgentSpawningSystem {
    agentTemplates = new Map();
    spawnedAgents = new Map();
    spawnCounter = new Map();
    constructor() {
        this.initializeAgentTemplates();
    }
    /**
     * Initializes default agent templates
     */
    initializeAgentTemplates() {
        const templates = [
            {
                type: 'planner',
                namePattern: 'Planner-Agent-{id}',
                expertise: ['task-planning', 'decomposition', 'scheduling'],
                capacity: 5,
                description: 'Specialized in high-level task planning and decomposition'
            },
            {
                type: 'coder',
                namePattern: 'Coder-Agent-{id}',
                expertise: ['code-generation', 'implementation', 'algorithms'],
                capacity: 10,
                description: 'Specialized in code generation and implementation'
            },
            {
                type: 'reviewer',
                namePattern: 'Reviewer-Agent-{id}',
                expertise: ['code-review', 'quality-assurance', 'best-practices'],
                capacity: 8,
                description: 'Specialized in code review and quality assurance'
            },
            {
                type: 'debugger',
                namePattern: 'Debugger-Agent-{id}',
                expertise: ['bug-detection', 'troubleshooting', 'fixing'],
                capacity: 7,
                description: 'Specialized in bug detection and fixing'
            },
            {
                type: 'optimizer',
                namePattern: 'Optimizer-Agent-{id}',
                expertise: ['performance', 'optimization', 'efficiency'],
                capacity: 6,
                description: 'Specialized in performance optimization'
            },
            {
                type: 'tester',
                namePattern: 'Tester-Agent-{id}',
                expertise: ['testing', 'test-creation', 'validation'],
                capacity: 8,
                description: 'Specialized in test creation and execution'
            }
        ];
        templates.forEach(template => {
            this.agentTemplates.set(template.type, template);
        });
        console.log('Initialized agent templates');
    }
    /**
     * Spawns a new agent with summarized context
     * @param request Spawn request details
     * @returns Promise that resolves with the spawn result
     */
    async spawnAgent(request) {
        const startTime = Date.now();
        try {
            console.log(`Spawning new ${request.agentType} agent for task: ${request.task.id}`);
            // Get agent template
            const template = this.agentTemplates.get(request.agentType);
            if (!template) {
                throw new Error(`No template found for agent type: ${request.agentType}`);
            }
            // Generate agent ID
            const agentId = this.generateAgentId(request.agentType);
            // Create agent instance
            const agent = {
                id: agentId,
                type: request.agentType,
                name: template.namePattern.replace('{id}', agentId.split('-')[2]),
                expertise: [...template.expertise],
                workload: 0,
                capacity: template.capacity
            };
            // Summarize context if needed
            let summary;
            if (Object.keys(request.context).length > 0) {
                summary = await this.summarizeContext(request.context, {
                    maxLength: request.maxTokens || 1000,
                    focusAreas: this.extractFocusAreas(request.task, template),
                    preserveSemantic: true
                });
            }
            // Register spawned agent
            this.spawnedAgents.set(agentId, agent);
            // Update spawn counter
            const currentCount = this.spawnCounter.get(request.agentType) || 0;
            this.spawnCounter.set(request.agentType, currentCount + 1);
            const spawnTime = Date.now() - startTime;
            console.log(`Agent spawned successfully: ${agentId} in ${spawnTime}ms`);
            return {
                success: true,
                agentId,
                summary,
                spawnTime
            };
        }
        catch (error) {
            console.error(`Failed to spawn agent:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                spawnTime: Date.now() - startTime
            };
        }
    }
    /**
     * Gets a spawned agent by ID
     * @param agentId ID of the agent
     * @returns Agent or undefined if not found
     */
    getSpawnedAgent(agentId) {
        return this.spawnedAgents.get(agentId);
    }
    /**
     * Gets all spawned agents
     * @returns Array of spawned agents
     */
    getAllSpawnedAgents() {
        return Array.from(this.spawnedAgents.values());
    }
    /**
     * Gets spawned agents by type
     * @param agentType Type of agent
     * @returns Array of spawned agents of the specified type
     */
    getSpawnedAgentsByType(agentType) {
        return Array.from(this.spawnedAgents.values()).filter(agent => agent.type === agentType);
    }
    /**
     * Terminates a spawned agent
     * @param agentId ID of the agent to terminate
     * @returns Boolean indicating success
     */
    terminateAgent(agentId) {
        const agent = this.spawnedAgents.get(agentId);
        if (!agent) {
            console.error(`Agent ${agentId} not found`);
            return false;
        }
        this.spawnedAgents.delete(agentId);
        console.log(`Terminated agent: ${agentId}`);
        return true;
    }
    /**
     * Gets agent template by type
     * @param agentType Type of agent
     * @returns Agent template or undefined if not found
     */
    getAgentTemplate(agentType) {
        return this.agentTemplates.get(agentType);
    }
    /**
     * Adds a custom agent template
     * @param template Agent template to add
     */
    addAgentTemplate(template) {
        this.agentTemplates.set(template.type, template);
        console.log(`Added agent template for type: ${template.type}`);
    }
    /**
     * Removes an agent template
     * @param agentType Type of agent template to remove
     * @returns Boolean indicating success
     */
    removeAgentTemplate(agentType) {
        const result = this.agentTemplates.delete(agentType);
        if (result) {
            console.log(`Removed agent template for type: ${agentType}`);
        }
        return result;
    }
    /**
     * Summarizes context for efficient agent initialization
     * @param context Context to summarize
     * @param options Summary options
     * @returns Promise that resolves with the summarized context
     */
    async summarizeContext(context, options) {
        try {
            // Convert context to string
            const contextString = JSON.stringify(context, null, 2);
            // If context is small enough, return as is
            if (contextString.length <= (options.maxLength || 1000)) {
                return contextString;
            }
            // For larger contexts, use NIM to generate a summary
            const prompt = this.createSummaryPrompt(contextString, options);
            // Try to get summary from NIM
            try {
                const summary = await (0, nim_local_ts_1.sendNIMInferenceRequest)('llama3.1', // Using llama3.1 as default model
                prompt, {
                    max_tokens: options.maxLength || 1000,
                    temperature: 0.3
                });
                return summary;
            }
            catch (nimError) {
                // Fallback to simple truncation if NIM fails
                console.warn('NIM summarization failed, using fallback method:', nimError);
                return this.fallbackSummarize(contextString, options.maxLength || 1000);
            }
        }
        catch (error) {
            console.error('Failed to summarize context:', error);
            // Return truncated context as last resort
            return JSON.stringify(context).substring(0, options.maxLength || 1000);
        }
    }
    /**
     * Creates a prompt for context summarization
     * @param contextString Context as string
     * @param options Summary options
     * @returns Prompt for summarization
     */
    createSummaryPrompt(contextString, options) {
        const focusInstruction = options.focusAreas && options.focusAreas.length > 0
            ? `Focus on these areas: ${options.focusAreas.join(', ')}`
            : 'Provide a general summary';
        return `
Summarize the following context for an AI agent initialization.
${focusInstruction}
Preserve key information needed for the agent to understand its task.
Limit your response to ${options.maxLength || 1000} characters.

Context:
${contextString.substring(0, 10000)}

Summary:
`.trim();
    }
    /**
     * Fallback summarization method using truncation and key extraction
     * @param contextString Context as string
     * @param maxLength Maximum length
     * @returns Summarized context
     */
    fallbackSummarize(contextString, maxLength) {
        // Extract key information by looking for common patterns
        const lines = contextString.split('\n');
        const keyLines = [];
        const maxLines = Math.min(lines.length, 50); // Limit to first 50 lines
        for (let i = 0; i < maxLines; i++) {
            const line = lines[i];
            // Look for lines that seem important (contain key-value pairs, headings, etc.)
            if (line.includes(':') || line.startsWith('#') || line.startsWith('*') || line.length > 20) {
                keyLines.push(line);
            }
        }
        // Join key lines and truncate if necessary
        let summary = keyLines.join('\n');
        if (summary.length > maxLength) {
            summary = summary.substring(0, maxLength - 100) + '... [truncated]';
        }
        return summary;
    }
    /**
     * Extracts focus areas from task and agent template
     * @param task Task to analyze
     * @param template Agent template
     * @returns Array of focus areas
     */
    extractFocusAreas(task, template) {
        const focusAreas = [...template.expertise];
        // Add task-specific focus areas
        const taskDescription = task.description.toLowerCase();
        if (taskDescription.includes('code') || taskDescription.includes('implement')) {
            focusAreas.push('code-quality', 'best-practices');
        }
        if (taskDescription.includes('bug') || taskDescription.includes('fix')) {
            focusAreas.push('debugging', 'troubleshooting');
        }
        if (taskDescription.includes('optimize') || taskDescription.includes('performance')) {
            focusAreas.push('optimization', 'efficiency');
        }
        if (taskDescription.includes('test')) {
            focusAreas.push('testing', 'validation');
        }
        return [...new Set(focusAreas)]; // Remove duplicates
    }
    /**
     * Generates a unique agent ID
     * @param agentType Type of agent
     * @returns Unique agent ID
     */
    generateAgentId(agentType) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const typeSlug = agentType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const counter = this.spawnCounter.get(agentType) || 0;
        return `agent-${typeSlug}-${counter}-${timestamp}-${random}`;
    }
}
exports.AgentSpawningSystem = AgentSpawningSystem;
// Export singleton instance
exports.agentSpawningSystem = new AgentSpawningSystem();
//# sourceMappingURL=agent.spawn.js.map