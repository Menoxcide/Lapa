"use strict";
/**
 * Researcher Agent Wrapper for LAPA Core
 *
 * This module implements a specialized wrapper for the Researcher agent
 * that integrates with the AgentTool framework and event bus system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearcherAgentWrapper = void 0;
const agent_tool_ts_1 = require("../agent-tool.ts");
const agent_tool_ts_2 = require("../agent-tool.ts");
const vision_agent_tool_ts_1 = require("../../multimodal/vision-agent-tool.ts");
/**
 * Research Tool for AI-Q search capabilities
 */
class ResearchTool extends agent_tool_ts_2.BaseAgentTool {
    constructor() {
        super('aiq-search', 'research', 'Performs AI-Q search using either text-based or multimodal approaches', '1.0.0');
    }
    /**
     * Execute the research tool
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async execute(context) {
        // In a real implementation, this would interface with the AI-Q RAG system
        // For now, we'll simulate a search result
        try {
            // Extract parameters
            const { query, multimodal = false } = context.parameters;
            // Validate parameters
            if (!this.validateParameters(context.parameters)) {
                return {
                    success: false,
                    error: 'Invalid parameters: query is required',
                    executionTime: 0
                };
            }
            // Simulate search execution time
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            // Simulate search result
            const result = {
                query,
                result: `Research results for "${query}" would appear here.`,
                multimodal,
                timestamp: new Date()
            };
            // Publish research completed event
            await this.publishEvent('research.completed', {
                query,
                multimodal,
                agentId: context.agentId,
                taskId: context.taskId
            }).catch(console.error);
            return {
                success: true,
                output: result,
                executionTime: 0 // Will be filled in by the executor
            };
        }
        catch (error) {
            // Publish research failed event
            await this.publishEvent('research.failed', {
                error: error instanceof Error ? error.message : String(error),
                agentId: context.agentId,
                taskId: context.taskId
            }).catch(console.error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: 0 // Will be filled in by the executor
            };
        }
    }
    /**
     * Validate tool parameters
     * @param params Parameters to validate
     * @returns Boolean indicating if parameters are valid
     */
    validateParameters(params) {
        return !!params.query && typeof params.query === 'string' && params.query.trim().length > 0;
    }
}
/**
 * Researcher Agent Wrapper
 *
 * Specialized wrapper for the Researcher agent in the helix team pattern
 */
class ResearcherAgentWrapper extends agent_tool_ts_1.HelixTeamAgentWrapper {
    constructor(id, name, registry, multimodalConfig) {
        // Initialize with researcher-specific capabilities
        super(id, 'researcher', name, ['research', 'aiq-search', 'multimodal-search', 'information-retrieval'], 0, // Initial workload
        5, // Capacity
        registry);
        // Register researcher-specific tools
        this.registerResearchTools(registry, multimodalConfig);
    }
    /**
     * Register researcher-specific tools
     * @param registry Tool registry
     */
    registerResearchTools(registry, multimodalConfig) {
        const researchTool = new ResearchTool();
        registry.registerTool(researchTool);
        this.addTool(researchTool);
        // Register multimodal tools if config is provided
        if (multimodalConfig) {
            const visionTool = new vision_agent_tool_ts_1.VisionAgentTool(multimodalConfig);
            registry.registerTool(visionTool);
            this.addTool(visionTool);
        }
    }
}
exports.ResearcherAgentWrapper = ResearcherAgentWrapper;
//# sourceMappingURL=researcher-wrapper.js.map