"use strict";
/**
 * Swarm Delegate for LAPA v1.2 Protocol-Resonant Nexus — Phase 10
 *
 * This module implements the swarm delegate with AutoGen Core integration and Roo Mode support.
 * It enables swarm-level handoff functionality using local inference with <1s latency target
 * while maintaining compatibility with existing swarm consensus and voting mechanisms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.swarmDelegate = exports.SwarmDelegate = void 0;
exports.delegateTask = delegateTask;
const handoffs_local_ts_1 = require("../orchestrator/handoffs.local.ts");
const consensus_voting_ts_1 = require("./consensus.voting.ts");
const context_handoff_ts_1 = require("./context.handoff.ts");
const modes_ts_1 = require("../modes/modes.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
const a2a_mediator_ts_1 = require("../orchestrator/a2a-mediator.ts");
const zod_1 = require("zod");
const perf_hooks_1 = require("perf_hooks");
// Zod schema for SwarmDelegateConfig validation
const swarmDelegateConfigSchema = zod_1.z.object({
    enableLocalInference: zod_1.z.boolean(),
    latencyTargetMs: zod_1.z.number().min(0),
    maxConcurrentDelegations: zod_1.z.number().min(1),
    enableConsensusVoting: zod_1.z.boolean(),
    enableAutoGenCore: zod_1.z.boolean(),
    enableRooModeIntegration: zod_1.z.boolean(),
    enableFastPath: zod_1.z.boolean() // Fast path for <1s delegate
});
// Zod schema for DelegationResult validation
const delegationResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    taskId: zod_1.z.string(),
    delegatedToAgentId: zod_1.z.string().optional(),
    result: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
    metrics: zod_1.z.object({
        duration: zod_1.z.number(),
        latencyWithinTarget: zod_1.z.boolean()
    }).optional()
});
// Zod schema for SwarmAgent validation
const swarmAgentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    workload: zod_1.z.number(),
    isLocal: zod_1.z.boolean(),
    type: zod_1.z.string(),
    capacity: zod_1.z.number()
});
/**
 * LAPA Swarm Delegate with AutoGen Core + Roo Mode Integration
 *
 * Manages delegation of tasks within the swarm using local inference when available,
 * integrating with AutoGen Core, Roo Modes, and consensus mechanisms for collective decision-making.
 * Optimized for <1s handoff latency.
 */
class SwarmDelegate {
    localHandoffSystem;
    consensusVotingSystem;
    contextHandoffManager;
    rooModeController;
    eventBus;
    config;
    registeredAgents = new Map();
    autogenCoreAgents = new Map();
    fastPathCache = new Map();
    FAST_PATH_TTL = 5000; // 5 seconds cache TTL
    constructor(config, eventBusInstance, modeController) {
        this.localHandoffSystem = new handoffs_local_ts_1.LocalHandoffSystem();
        this.consensusVotingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
        this.contextHandoffManager = new context_handoff_ts_1.ContextHandoffManager();
        this.eventBus = eventBusInstance || event_bus_ts_1.eventBus;
        this.rooModeController = modeController || modes_ts_1.rooModeController;
        // Validate config with Zod schema
        const validatedConfig = swarmDelegateConfigSchema.parse({
            enableLocalInference: true,
            latencyTargetMs: 1000, // <1s target for Phase 10
            maxConcurrentDelegations: 10,
            enableConsensusVoting: true,
            enableAutoGenCore: true,
            enableRooModeIntegration: true,
            enableFastPath: true,
            ...config
        });
        this.config = validatedConfig;
        // Subscribe to mode change events for Roo mode integration
        if (this.config.enableRooModeIntegration) {
            this.eventBus.subscribe('mode.changed', async (event) => {
                // Clear fast path cache on mode change
                this.fastPathCache.clear();
                console.log('Fast path cache cleared due to mode change');
            });
        }
    }
    /**
     * Registers a swarm agent for potential delegation
     * @param agent Swarm agent instance
     */
    registerAgent(agent) {
        // Validate agent with Zod schema
        const validatedAgent = swarmAgentSchema.parse(agent);
        this.registeredAgents.set(validatedAgent.id, validatedAgent);
        this.consensusVotingSystem.registerAgent({
            id: validatedAgent.id,
            name: validatedAgent.name,
            expertise: validatedAgent.capabilities,
            workload: validatedAgent.workload,
            type: validatedAgent.type,
            capacity: validatedAgent.capacity
        });
        console.log(`Registered swarm agent: ${validatedAgent.name} (${validatedAgent.id})`);
    }
    /**
     * Delegates a task to the most appropriate agent using AutoGen Core + Roo Mode integration
     * Optimized for <1s handoff latency with fast path caching
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    async delegateTask(task, context) {
        const startTime = perf_hooks_1.performance.now();
        try {
            console.log(`Delegating task: ${task.id} using swarm delegate (AutoGen Core + Roo Mode)`);
            // Fast path: Check cache for recent similar task delegations (<1s optimization)
            if (this.config.enableFastPath) {
                const cached = this.getFastPathAgent(task);
                if (cached) {
                    console.log(`Using fast path cache for task: ${task.id}`);
                    const fastResult = await this.delegateToCachedAgent(task, context, cached.agentId);
                    if (fastResult.success) {
                        const endTime = perf_hooks_1.performance.now();
                        const duration = endTime - startTime;
                        const result = {
                            ...fastResult,
                            metrics: {
                                duration,
                                latencyWithinTarget: duration <= this.config.latencyTargetMs
                            }
                        };
                        return delegationResultSchema.parse(result);
                    }
                }
            }
            // Get current Roo mode for mode-aware delegation
            const currentMode = this.config.enableRooModeIntegration
                ? this.rooModeController.getCurrentMode()
                : null;
            // AutoGen Core integration: Try AutoGen agents first if enabled
            if (this.config.enableAutoGenCore && this.hasAutoGenAgents()) {
                const autogenResult = await this.delegateToAutoGenAgent(task, context, currentMode);
                if (autogenResult.success) {
                    const endTime = perf_hooks_1.performance.now();
                    const duration = endTime - startTime;
                    // Cache successful delegation for fast path
                    if (this.config.enableFastPath && autogenResult.delegatedToAgentId) {
                        this.setFastPathAgent(task, autogenResult.delegatedToAgentId);
                    }
                    const result = {
                        ...autogenResult,
                        metrics: {
                            duration,
                            latencyWithinTarget: duration <= this.config.latencyTargetMs
                        }
                    };
                    return delegationResultSchema.parse(result);
                }
            }
            // If local inference is enabled and we have local agents, try local delegation
            if (this.config.enableLocalInference && this.hasLocalAgents()) {
                const localResult = await this.delegateToLocalAgent(task, context);
                if (localResult.success) {
                    const endTime = perf_hooks_1.performance.now();
                    const duration = endTime - startTime;
                    // Cache successful delegation for fast path
                    if (this.config.enableFastPath && localResult.delegatedToAgentId) {
                        this.setFastPathAgent(task, localResult.delegatedToAgentId);
                    }
                    const result = {
                        ...localResult,
                        metrics: {
                            duration,
                            latencyWithinTarget: duration <= this.config.latencyTargetMs
                        }
                    };
                    return delegationResultSchema.parse(result);
                }
            }
            // Fall back to consensus-based delegation if other methods failed or are disabled
            const consensusResult = await this.delegateViaConsensus(task, context);
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - startTime;
            // Cache successful delegation for fast path
            if (this.config.enableFastPath && consensusResult.delegatedToAgentId) {
                this.setFastPathAgent(task, consensusResult.delegatedToAgentId);
            }
            const result = {
                ...consensusResult,
                metrics: {
                    duration,
                    latencyWithinTarget: duration <= this.config.latencyTargetMs
                }
            };
            return delegationResultSchema.parse(result);
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - startTime;
            console.error(`Task delegation failed for ${task.id}:`, error);
            const result = {
                success: false,
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error),
                metrics: {
                    duration,
                    latencyWithinTarget: duration <= this.config.latencyTargetMs
                }
            };
            return delegationResultSchema.parse(result);
        }
    }
    /**
     * Delegates a task to a local agent using local inference with mandatory A2A handshake
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    async delegateToLocalAgent(task, context) {
        // For local delegation, we need to determine the target agent first
        // Let's use the local handoff system to get information about the target
        try {
            console.log(`Attempting local delegation for task: ${task.id}`);
            // Use the localHandoff function for zero-key handoff to get target info
            const localResult = await (0, handoffs_local_ts_1.localHandoff)(task, context);
            // Extract the target agent from the result if available
            const targetAgentId = localResult.handoffMetrics?.providerUsed || 'unknown-local-agent';
            // MANDATORY A2A handshake before local agent delegation (Phase 10 requirement)
            try {
                // Find the target agent in our registered agents
                const targetAgent = Array.from(this.registeredAgents.values()).find(agent => agent.id === targetAgentId || agent.name === targetAgentId) || {
                    id: targetAgentId,
                    name: targetAgentId,
                    capabilities: ['local-inference'],
                    workload: 0,
                    isLocal: true,
                    type: 'local',
                    capacity: 10
                };
                const handshakeRequest = {
                    sourceAgentId: 'swarm-delegate',
                    targetAgentId: targetAgentId,
                    taskId: task.id,
                    taskDescription: task.description,
                    capabilities: targetAgent.capabilities,
                    context,
                    priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                        ? task.priority.toString()
                        : 'medium'
                };
                console.log(`Initiating MANDATORY A2A handshake for local agent delegation: ${task.id}`);
                const handshakeResponse = await a2a_mediator_ts_1.a2aMediator.initiateHandshake(handshakeRequest);
                if (!handshakeResponse.accepted) {
                    throw new Error(`A2A handshake rejected: ${handshakeResponse.reason || 'Unknown reason'}`);
                }
                console.log(`A2A handshake accepted for local agent delegation ${task.id}`);
            }
            catch (error) {
                console.error(`MANDATORY A2A handshake failed for local agent delegation, aborting:`, error);
                // ABORT delegation if handshake fails - this is now mandatory
                return {
                    success: false,
                    taskId: task.id,
                    error: `Local delegation aborted due to failed A2A handshake: ${error instanceof Error ? error.message : String(error)}`
                };
            }
            // Now perform the actual local delegation
            const result = await (0, handoffs_local_ts_1.localHandoff)(task, context);
            console.log(`Local delegation successful for task: ${task.id}`);
            return {
                success: true,
                taskId: task.id,
                delegatedToAgentId: targetAgentId,
                result
            };
        }
        catch (error) {
            console.error(`Local delegation failed for task ${task.id}:`, error);
            return {
                success: false,
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Delegates a task via consensus voting among swarm agents with mandatory A2A handshake
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    async delegateViaConsensus(task, context) {
        if (!this.config.enableConsensusVoting) {
            return {
                success: false,
                taskId: task.id,
                error: 'Consensus voting is disabled'
            };
        }
        try {
            console.log(`Initiating consensus-based delegation for task: ${task.id}`);
            // Create voting options based on registered agents
            const agentOptions = Array.from(this.registeredAgents.values()).map(agent => ({
                id: agent.id,
                label: agent.name,
                value: agent
            }));
            if (agentOptions.length === 0) {
                throw new Error('No agents registered for consensus voting');
            }
            // Create voting session
            const sessionId = this.consensusVotingSystem.createVotingSession(`Task delegation: ${task.description}`, agentOptions);
            // Simulate agents casting votes (in a real implementation, agents would evaluate the task)
            const agents = Array.from(this.registeredAgents.values());
            for (let i = 0; i < agents.length; i++) {
                const agent = agents[i];
                // Simple heuristic: agents with relevant capabilities get higher votes
                const hasRelevantCapability = agent.capabilities.some(cap => task.description.toLowerCase().includes(cap.toLowerCase()));
                // Cast vote with rationale
                this.consensusVotingSystem.castVote(sessionId, agent.id, agent.id, hasRelevantCapability ? `Agent has relevant capability for task` : `General purpose agent`);
            }
            // Close voting and get result
            const consensusResult = this.consensusVotingSystem.closeVotingSession('weighted-majority');
            if (!consensusResult.consensusReached || !consensusResult.winningOption) {
                throw new Error('Failed to reach consensus on task delegation');
            }
            const winningAgentId = consensusResult.winningOption.id;
            const winningAgent = this.registeredAgents.get(winningAgentId);
            if (!winningAgent) {
                throw new Error(`Winning agent ${winningAgentId} not found`);
            }
            console.log(`Consensus reached: delegating task ${task.id} to agent ${winningAgent.name}`);
            // MANDATORY A2A handshake before consensus-based delegation (Phase 10 requirement)
            try {
                const handshakeRequest = {
                    sourceAgentId: 'swarm-delegate',
                    targetAgentId: winningAgentId,
                    taskId: task.id,
                    taskDescription: task.description,
                    capabilities: winningAgent.capabilities,
                    context,
                    priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                        ? task.priority.toString()
                        : 'medium'
                };
                console.log(`Initiating MANDATORY A2A handshake for consensus-based delegation: ${task.id}`);
                const handshakeResponse = await a2a_mediator_ts_1.a2aMediator.initiateHandshake(handshakeRequest);
                if (!handshakeResponse.accepted) {
                    throw new Error(`A2A handshake rejected: ${handshakeResponse.reason || 'Unknown reason'}`);
                }
                console.log(`A2A handshake accepted for consensus-based delegation ${task.id}`);
            }
            catch (error) {
                console.error(`MANDATORY A2A handshake failed for consensus-based delegation, aborting:`, error);
                // ABORT delegation if handshake fails - this is now mandatory
                return {
                    success: false,
                    taskId: task.id,
                    error: `Consensus delegation aborted due to failed A2A handshake: ${error instanceof Error ? error.message : String(error)}`
                };
            }
            // Perform context handoff to the winning agent
            const handoffRequest = {
                sourceAgentId: 'swarm-delegate',
                targetAgentId: winningAgentId,
                taskId: task.id,
                context,
                priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                    ? task.priority.toString()
                    : 'medium'
            };
            const handoffResponse = await this.contextHandoffManager.initiateHandoff(handoffRequest);
            if (!handoffResponse.success) {
                throw new Error(`Failed to initiate context handoff: ${handoffResponse.error}`);
            }
            // Complete handoff on target agent
            const handoffResult = await this.contextHandoffManager.completeHandoff(handoffResponse.handoffId, winningAgentId);
            return {
                success: true,
                taskId: task.id,
                delegatedToAgentId: winningAgentId,
                result: handoffResult
            };
        }
        catch (error) {
            console.error(`Consensus-based delegation failed for task ${task.id}:`, error);
            return {
                success: false,
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Checks if there are any local agents registered
     * @returns Boolean indicating if local agents exist
     */
    hasLocalAgents() {
        const agents = Array.from(this.registeredAgents.values());
        for (let i = 0; i < agents.length; i++) {
            if (agents[i].isLocal) {
                return true;
            }
        }
        return false;
    }
    /**
     * Gets current swarm delegate configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Updates swarm delegate configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Swarm delegate configuration updated:', this.config);
    }
    /**
     * Gets registered agents
     * @returns Array of registered agents
     */
    getRegisteredAgents() {
        return Array.from(this.registeredAgents.values());
    }
    /**
     * Registers an AutoGen Core agent
     * @param agent AutoGen Core agent instance
     */
    registerAutoGenAgent(agent) {
        const validatedAgent = swarmAgentSchema.parse(agent);
        this.autogenCoreAgents.set(validatedAgent.id, validatedAgent);
        this.registeredAgents.set(validatedAgent.id, validatedAgent);
        console.log(`Registered AutoGen Core agent: ${validatedAgent.name} (${validatedAgent.id})`);
    }
    /**
     * Delegates a task to an AutoGen Core agent with Roo mode awareness and mandatory A2A handshake
     * @param task Task to delegate
     * @param context Context for the task
     * @param currentMode Current Roo mode (if available)
     * @returns Promise that resolves with the delegation result
     */
    async delegateToAutoGenAgent(task, context, currentMode) {
        try {
            console.log(`Attempting AutoGen Core delegation for task: ${task.id}${currentMode ? ` (mode: ${currentMode})` : ''}`);
            // Select best AutoGen agent based on task and current mode
            const selectedAgent = this.selectAutoGenAgent(task, currentMode);
            if (!selectedAgent) {
                return {
                    success: false,
                    taskId: task.id,
                    error: 'No suitable AutoGen Core agent found'
                };
            }
            // MANDATORY A2A handshake before AutoGen agent delegation (Phase 10 requirement)
            try {
                const handshakeRequest = {
                    sourceAgentId: 'swarm-delegate',
                    targetAgentId: selectedAgent.id,
                    taskId: task.id,
                    taskDescription: task.description,
                    capabilities: selectedAgent.capabilities,
                    context,
                    priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                        ? task.priority.toString()
                        : 'medium'
                };
                console.log(`Initiating MANDATORY A2A handshake for AutoGen agent delegation: ${task.id}`);
                const handshakeResponse = await a2a_mediator_ts_1.a2aMediator.initiateHandshake(handshakeRequest);
                if (!handshakeResponse.accepted) {
                    throw new Error(`A2A handshake rejected: ${handshakeResponse.reason || 'Unknown reason'}`);
                }
                console.log(`A2A handshake accepted for AutoGen agent delegation ${task.id}`);
            }
            catch (error) {
                console.error(`MANDATORY A2A handshake failed for AutoGen agent delegation, aborting:`, error);
                // ABORT delegation if handshake fails - this is now mandatory
                return {
                    success: false,
                    taskId: task.id,
                    error: `AutoGen delegation aborted due to failed A2A handshake: ${error instanceof Error ? error.message : String(error)}`
                };
            }
            // Enhance context with mode information if available
            const enhancedContext = currentMode
                ? { ...context, rooMode: currentMode, modeCapabilities: this.rooModeController.getModeConfig(currentMode)?.capabilities }
                : context;
            // Use local handoff system with AutoGen Core integration
            const result = await (0, handoffs_local_ts_1.localHandoff)(task, enhancedContext);
            const targetAgentId = result.handoffMetrics?.providerUsed || selectedAgent.id;
            console.log(`AutoGen Core delegation successful for task: ${task.id}`);
            return {
                success: true,
                taskId: task.id,
                delegatedToAgentId: targetAgentId,
                result
            };
        }
        catch (error) {
            console.error(`AutoGen Core delegation failed for task ${task.id}:`, error);
            return {
                success: false,
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Selects the best AutoGen Core agent for a task based on capabilities and current mode
     * @param task Task to delegate
     * @param currentMode Current Roo mode (if available)
     * @returns Selected agent or undefined
     */
    selectAutoGenAgent(task, currentMode) {
        const agents = Array.from(this.autogenCoreAgents.values());
        if (agents.length === 0) {
            return undefined;
        }
        // If mode is available, filter agents by mode capabilities
        if (currentMode) {
            const modeConfig = this.rooModeController.getModeConfig(currentMode);
            const modeCapabilities = modeConfig?.capabilities || [];
            // Find agents with matching capabilities
            const matchingAgents = agents.filter(agent => modeCapabilities.some(cap => agent.capabilities.includes(cap)));
            if (matchingAgents.length > 0) {
                // Select agent with lowest workload
                return matchingAgents.reduce((best, current) => current.workload < best.workload ? current : best);
            }
        }
        // Fallback: Select agent with matching task capabilities or lowest workload
        const taskKeywords = task.description.toLowerCase().split(/\s+/);
        const matchingAgents = agents.filter(agent => agent.capabilities.some(cap => taskKeywords.some(keyword => cap.toLowerCase().includes(keyword))));
        if (matchingAgents.length > 0) {
            return matchingAgents.reduce((best, current) => current.workload < best.workload ? current : best);
        }
        // Final fallback: Lowest workload agent
        return agents.reduce((best, current) => current.workload < best.workload ? current : best);
    }
    /**
     * Checks if there are any AutoGen Core agents registered
     * @returns Boolean indicating if AutoGen agents exist
     */
    hasAutoGenAgents() {
        return this.autogenCoreAgents.size > 0;
    }
    /**
     * Fast path: Get cached agent for similar task
     * @param task Task to delegate
     * @returns Cached agent info or undefined
     */
    getFastPathAgent(task) {
        const cacheKey = this.getTaskCacheKey(task);
        const cached = this.fastPathCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.FAST_PATH_TTL) {
            return cached;
        }
        // Remove expired cache entry
        if (cached) {
            this.fastPathCache.delete(cacheKey);
        }
        return undefined;
    }
    /**
     * Fast path: Cache agent for similar task
     * @param task Task that was delegated
     * @param agentId Agent ID that handled the task
     */
    setFastPathAgent(task, agentId) {
        const cacheKey = this.getTaskCacheKey(task);
        this.fastPathCache.set(cacheKey, {
            agentId,
            timestamp: Date.now()
        });
    }
    /**
     * Delegates to a cached agent (fast path) with mandatory A2A handshake
     * @param task Task to delegate
     * @param context Context for the task
     * @param agentId Cached agent ID
     * @returns Promise that resolves with the delegation result
     */
    async delegateToCachedAgent(task, context, agentId) {
        const agent = this.registeredAgents.get(agentId);
        if (!agent) {
            return {
                success: false,
                taskId: task.id,
                error: `Cached agent ${agentId} not found`
            };
        }
        // MANDATORY A2A handshake before cached agent delegation (Phase 10 requirement)
        try {
            const handshakeRequest = {
                sourceAgentId: 'swarm-delegate',
                targetAgentId: agentId,
                taskId: task.id,
                taskDescription: task.description,
                capabilities: agent.capabilities,
                context,
                priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                    ? task.priority.toString()
                    : 'medium'
            };
            console.log(`Initiating MANDATORY A2A handshake for cached agent delegation: ${task.id}`);
            const handshakeResponse = await a2a_mediator_ts_1.a2aMediator.initiateHandshake(handshakeRequest);
            if (!handshakeResponse.accepted) {
                throw new Error(`A2A handshake rejected: ${handshakeResponse.reason || 'Unknown reason'}`);
            }
            console.log(`A2A handshake accepted for cached agent delegation ${task.id}`);
        }
        catch (error) {
            console.error(`MANDATORY A2A handshake failed for cached agent delegation, aborting:`, error);
            // ABORT delegation if handshake fails - this is now mandatory
            return {
                success: false,
                taskId: task.id,
                error: `Delegation aborted due to failed A2A handshake: ${error instanceof Error ? error.message : String(error)}`
            };
        }
        try {
            const handoffRequest = {
                sourceAgentId: 'swarm-delegate',
                targetAgentId: agentId,
                taskId: task.id,
                context,
                priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                    ? task.priority.toString()
                    : 'medium'
            };
            const handoffResponse = await this.contextHandoffManager.initiateHandoff(handoffRequest);
            if (!handoffResponse.success) {
                throw new Error(`Failed to initiate handoff: ${handoffResponse.error}`);
            }
            const handoffResult = await this.contextHandoffManager.completeHandoff(handoffResponse.handoffId, agentId);
            return {
                success: true,
                taskId: task.id,
                delegatedToAgentId: agentId,
                result: handoffResult
            };
        }
        catch (error) {
            return {
                success: false,
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Generates a cache key for a task based on its characteristics
     * @param task Task to generate key for
     * @returns Cache key string
     */
    getTaskCacheKey(task) {
        // Use task description keywords and current mode for cache key
        const mode = this.config.enableRooModeIntegration
            ? this.rooModeController.getCurrentMode()
            : 'default';
        const keywords = task.description.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5)
            .join('-');
        return `${mode}-${keywords}`;
    }
}
exports.SwarmDelegate = SwarmDelegate;
// Export singleton instance
exports.swarmDelegate = new SwarmDelegate();
/**
 * Convenience function for delegating tasks using the swarm delegate
 * @param task Task to delegate
 * @param context Context for the task
 * @returns Promise that resolves with the delegation result
 */
async function delegateTask(task, context) {
    return await exports.swarmDelegate.delegateTask(task, context);
}
//# sourceMappingURL=delegate.js.map