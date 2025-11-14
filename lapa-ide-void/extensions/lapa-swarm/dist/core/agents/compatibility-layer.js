"use strict";
/**
 * Compatibility Layer for LAPA Agent Infrastructure
 *
 * This module provides backward compatibility between the new AgentTool framework
 * and existing agent infrastructure in v1.1 Phase 9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compatibleMoERouter = exports.CompatibleToolExecutor = exports.CompatibleMoERouter = exports.NewAgentAdapter = exports.LegacyAgentAdapter = void 0;
const moe_router_ts_1 = require("../../agents/moe-router.ts");
const agent_tool_ts_1 = require("../agent-tool.ts");
/**
 * Adapter class to convert legacy agents to new agent format
 */
class LegacyAgentAdapter extends agent_tool_ts_1.HelixTeamAgentWrapper {
    legacyAgent;
    constructor(legacyAgent, registry = agent_tool_ts_1.agentToolRegistry) {
        super(legacyAgent.id, legacyAgent.type, // Type assertion for compatibility
        legacyAgent.name, legacyAgent.expertise, legacyAgent.workload, legacyAgent.capacity, registry);
        this.legacyAgent = legacyAgent;
    }
    /**
     * Get the underlying legacy agent
     * @returns The legacy agent
     */
    getLegacyAgent() {
        return this.legacyAgent;
    }
}
exports.LegacyAgentAdapter = LegacyAgentAdapter;
/**
 * Adapter class to convert new agents to legacy format
 */
class NewAgentAdapter {
    newAgent;
    constructor(newAgent) {
        this.newAgent = newAgent;
    }
    get id() {
        return this.newAgent.id;
    }
    get type() {
        return this.newAgent.type;
    }
    get name() {
        return this.newAgent.name;
    }
    get expertise() {
        return this.newAgent.capabilities;
    }
    get workload() {
        return this.newAgent.workload;
    }
    get capacity() {
        return this.newAgent.capacity;
    }
    /**
     * Get the underlying new agent
     * @returns The new agent
     */
    getNewAgent() {
        return this.newAgent;
    }
}
exports.NewAgentAdapter = NewAgentAdapter;
/**
 * Compatibility wrapper for MoE Router
 *
 * This class wraps the existing MoE Router to work with both legacy and new agents
 */
class CompatibleMoERouter {
    legacyRouter;
    constructor(legacyRouter = new moe_router_ts_1.MoERouter()) {
        this.legacyRouter = legacyRouter;
    }
    /**
     * Register an agent (works with both legacy and new agents)
     * @param agent Agent to register
     */
    registerAgent(agent) {
        // If it's a new agent, adapt it to legacy format
        if (this.isNewAgent(agent)) {
            const adapter = new NewAgentAdapter(agent);
            this.legacyRouter.registerAgent(adapter);
        }
        else {
            // It's already a legacy agent
            this.legacyRouter.registerAgent(agent);
        }
    }
    /**
     * Unregister an agent
     * @param agentId ID of the agent to unregister
     */
    unregisterAgent(agentId) {
        this.legacyRouter.unregisterAgent(agentId);
    }
    /**
     * Route a task (works with both legacy and new task formats)
     * @param task Task to route
     * @returns Routing result
     */
    routeTask(task) {
        const result = this.legacyRouter.routeTask(task);
        // If the agent is an adapter, return the underlying new agent
        if (result.agent instanceof NewAgentAdapter) {
            return {
                agent: result.agent.getNewAgent(),
                confidence: result.confidence,
                reasoning: result.reasoning
            };
        }
        // Check if the agent is a legacy adapter and return the underlying legacy agent
        // This would require checking if the agent is an instance of LegacyAgentAdapter
        // For now, we'll just return the agent as is
        return result; // Type assertion to maintain compatibility
    }
    /**
     * Update agent workload
     * @param agentId ID of the agent
     * @param workload New workload value
     */
    updateAgentWorkload(agentId, workload) {
        this.legacyRouter.updateAgentWorkload(agentId, workload);
    }
    /**
     * Get all registered agents
     * @returns Array of registered agents
     */
    getAgents() {
        const legacyAgents = this.legacyRouter.getAgents();
        // Convert adapters back to new agents if needed
        return legacyAgents.map(agent => {
            if (agent instanceof NewAgentAdapter) {
                return agent.getNewAgent();
            }
            return agent;
        });
    }
    /**
     * Get agent by ID
     * @param agentId ID of the agent
     * @returns The agent or undefined if not found
     */
    getAgentById(agentId) {
        const agent = this.legacyRouter.getAgentById(agentId);
        if (!agent) {
            return undefined;
        }
        // If the agent is an adapter, return the underlying new agent
        if (agent instanceof NewAgentAdapter) {
            return agent.getNewAgent();
        }
        return agent;
    }
    /**
     * Check if an agent is a new agent
     * @param agent Agent to check
     * @returns Boolean indicating if agent is a new agent
     */
    isNewAgent(agent) {
        // Check if the agent has the properties of a new agent
        return 'tools' in agent && Array.isArray(agent.tools);
    }
}
exports.CompatibleMoERouter = CompatibleMoERouter;
/**
 * Compatibility layer for tool execution
 *
 * This class provides a bridge between legacy tool execution and new tool execution
 */
class CompatibleToolExecutor {
    /**
     * Execute a tool on a legacy agent
     * @param agent Legacy agent
     * @param toolName Name of the tool to execute
     * @param parameters Tool parameters
     * @returns Execution result
     */
    static async executeToolOnLegacyAgent(agent, toolName, parameters) {
        // In v1.1, agents didn't have a standardized tool execution interface
        // This is a placeholder for backward compatibility
        console.warn(`Tool execution on legacy agent ${agent.id} is not supported`);
        return {
            success: false,
            error: 'Tool execution not supported on legacy agents'
        };
    }
    /**
     * Execute a tool on a new agent
     * @param agent New agent
     * @param toolName Name of the tool to execute
     * @param context Execution context
     * @returns Execution result
     */
    static async executeToolOnNewAgent(agent, toolName, context) {
        // Delegate to the agent's tool execution method
        return agent.executeTool(toolName, context);
    }
    /**
     * Unified tool execution method
     * @param agent Agent to execute tool on
     * @param toolName Name of the tool to execute
     * @param context Execution context
     * @returns Execution result
     */
    static async executeTool(agent, toolName, context) {
        // Check if agent is a new agent
        if ('tools' in agent && Array.isArray(agent.tools)) {
            return this.executeToolOnNewAgent(agent, toolName, context);
        }
        else {
            // Assume it's a legacy agent
            return this.executeToolOnLegacyAgent(agent, toolName, context);
        }
    }
}
exports.CompatibleToolExecutor = CompatibleToolExecutor;
// Export singleton instance for convenience
exports.compatibleMoERouter = new CompatibleMoERouter();
//# sourceMappingURL=compatibility-layer.js.map