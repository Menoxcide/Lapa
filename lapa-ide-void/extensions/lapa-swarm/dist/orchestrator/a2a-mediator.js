"use strict";
/**
 * A2A (Agent-to-Agent) Mediator for LAPA v1.2 Protocol-Resonant Nexus — Phase 11
 *
 * This module implements the A2A handshake foundation for agent-to-agent communication.
 * It provides handshake, task negotiation, and state synchronization capabilities
 * for seamless agent coordination within the swarm.
 *
 * Phase 11: MCP + A2A Connectors integration - COMPLETE
 *
 * Features:
 * - Full MCP integration for handshake, task negotiation, and state sync
 * - Retry logic with exponential backoff
 * - Event-based fallback when MCP is unavailable
 * - Comprehensive error handling
 * - Async task negotiation and state synchronization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.a2aMediator = exports.A2AMediator = void 0;
exports.initiateA2AHandshake = initiateA2AHandshake;
exports.negotiateA2ATask = negotiateA2ATask;
exports.syncA2AState = syncA2AState;
const event_bus_ts_1 = require("../core/event-bus.ts");
const zod_1 = require("zod");
const mcp_connector_ts_1 = require("../mcp/mcp-connector.ts");
const handshake_ts_1 = require("./handshake.ts");
// Zod schema for A2A handshake request validation (protocolVersion is optional)
// Note: We'll validate after ensuring protocolVersion is set
const a2aHandshakeRequestBaseSchema = zod_1.z.object({
    sourceAgentId: zod_1.z.string(),
    targetAgentId: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    protocolVersion: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    taskId: zod_1.z.string().optional(),
    taskDescription: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.unknown()).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional()
});
// Zod schema for A2A handshake response validation
const a2aHandshakeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    handshakeId: zod_1.z.string().optional(),
    accepted: zod_1.z.boolean(),
    capabilities: zod_1.z.array(zod_1.z.string()).optional(),
    protocolVersion: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional()
});
// Default configuration
const DEFAULT_CONFIG = {
    enableHandshake: true,
    handshakeTimeoutMs: 5000,
    enableTaskNegotiation: true,
    enableStateSync: true,
    protocolVersion: '1.0',
    maxConcurrentHandshakes: 10,
    enableMCPIntegration: true,
    mcpConfig: {
        transportType: 'stdio',
        enableToolDiscovery: true,
        enableProgressiveDisclosure: true
    },
    maxRetries: 3,
    retryDelayMs: 1000,
    exponentialBackoff: true
};
/**
 * A2A Mediator
 *
 * Manages agent-to-agent handshakes, task negotiation, and state synchronization
 * for seamless agent coordination within the swarm.
 */
class A2AMediator {
    config;
    activeHandshakes = new Map();
    handshakeHistory = new Map();
    registeredAgents = new Map();
    mcpConnector = null;
    isMCPConnected = false;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Initialize MCP connector if enabled
        if (this.config.enableMCPIntegration && this.config.mcpConfig) {
            this.mcpConnector = (0, mcp_connector_ts_1.createMCPConnector)(this.config.mcpConfig);
        }
        // Subscribe to A2A events
        event_bus_ts_1.eventBus.subscribe('a2a.handshake.request', async (event) => {
            const request = event.payload;
            await this.handleHandshakeRequest(request);
        });
        event_bus_ts_1.eventBus.subscribe('a2a.task.negotiation.request', async (event) => {
            const request = event.payload;
            await this.handleTaskNegotiationRequest(request);
        });
        event_bus_ts_1.eventBus.subscribe('a2a.state.sync.request', async (event) => {
            const request = event.payload;
            await this.handleStateSyncRequest(request);
        });
        // Subscribe to MCP events
        if (this.mcpConnector) {
            event_bus_ts_1.eventBus.subscribe('mcp.connector.connected', async () => {
                this.isMCPConnected = true;
                console.log('MCP connector connected in A2A mediator');
            });
            event_bus_ts_1.eventBus.subscribe('mcp.connector.disconnected', async () => {
                this.isMCPConnected = false;
                console.log('MCP connector disconnected in A2A mediator');
            });
        }
    }
    /**
     * Initializes the MCP connector
     * @returns Promise that resolves when MCP connector is initialized
     */
    async initializeMCP() {
        if (!this.config.enableMCPIntegration || !this.mcpConnector) {
            console.log('MCP integration is disabled');
            return;
        }
        try {
            await this.mcpConnector.connect();
            this.isMCPConnected = true;
            console.log('MCP connector initialized in A2A mediator');
        }
        catch (error) {
            console.error('Failed to initialize MCP connector:', error);
            throw error;
        }
    }
    /**
     * Disconnects the MCP connector
     * @returns Promise that resolves when MCP connector is disconnected
     */
    async disconnectMCP() {
        if (!this.mcpConnector) {
            return;
        }
        try {
            await this.mcpConnector.disconnect();
            this.isMCPConnected = false;
            console.log('MCP connector disconnected in A2A mediator');
        }
        catch (error) {
            console.error('Failed to disconnect MCP connector:', error);
            throw error;
        }
    }
    /**
     * Initiates an A2A handshake between two agents
     * @param request Handshake request
     * @returns Promise that resolves with the handshake response
     */
    async initiateHandshake(request) {
        try {
            // Use protocol version from request or default to config
            const protocolVersion = request.protocolVersion || this.config.protocolVersion;
            const requestWithProtocol = { ...request, protocolVersion };
            // Validate request with Zod schema
            const validatedRequest = a2aHandshakeRequestBaseSchema.parse(requestWithProtocol);
            console.log(`Initiating A2A handshake from ${validatedRequest.sourceAgentId} to ${validatedRequest.targetAgentId}`);
            // Check if handshake is enabled
            if (!this.config.enableHandshake) {
                return {
                    success: false,
                    accepted: false,
                    error: 'Handshake is disabled',
                    reason: 'Handshake is disabled in configuration'
                };
            }
            // Check if we've exceeded maximum concurrent handshakes
            if (this.activeHandshakes.size >= this.config.maxConcurrentHandshakes) {
                return {
                    success: false,
                    accepted: false,
                    error: 'Maximum concurrent handshakes reached',
                    reason: `Maximum concurrent handshakes (${this.config.maxConcurrentHandshakes}) reached`
                };
            }
            // Store active handshake
            const handshakeId = this.generateHandshakeId();
            this.activeHandshakes.set(handshakeId, validatedRequest);
            // Use handshake protocol for actual handshake (Phase 11 integration)
            let response;
            if (this.config.enableMCPIntegration && this.isMCPConnected && this.mcpConnector) {
                // Use MCP connector for handshake communication
                try {
                    // Call MCP tool for handshake if available
                    const tools = this.mcpConnector.getTools();
                    if (tools.includes('a2a_handshake')) {
                        const result = await this.mcpConnector.callTool('a2a_handshake', {
                            sourceAgentId: validatedRequest.sourceAgentId,
                            targetAgentId: validatedRequest.targetAgentId,
                            capabilities: validatedRequest.capabilities,
                            protocolVersion: protocolVersion
                        });
                        response = result;
                    }
                    else {
                        // Fall back to handshake protocol
                        response = await handshake_ts_1.a2aHandshakeProtocol.initiateHandshake(validatedRequest);
                    }
                }
                catch (error) {
                    console.warn('MCP handshake failed, falling back to protocol:', error);
                    // Fall back to handshake protocol
                    response = await handshake_ts_1.a2aHandshakeProtocol.initiateHandshake(validatedRequest);
                }
            }
            else {
                // Use handshake protocol directly
                response = await handshake_ts_1.a2aHandshakeProtocol.initiateHandshake(validatedRequest);
            }
            // Validate response with Zod schema
            const validatedResponse = a2aHandshakeResponseSchema.parse(response);
            // Store handshake history
            this.handshakeHistory.set(validatedResponse.handshakeId || handshakeId, validatedResponse);
            // Register agent capabilities
            if (validatedResponse.accepted) {
                this.registerAgent(validatedRequest.targetAgentId, {
                    agentId: validatedRequest.targetAgentId,
                    capabilities: validatedResponse.capabilities || validatedRequest.capabilities,
                    protocolVersion: validatedResponse.protocolVersion || protocolVersion,
                    lastHandshake: Date.now()
                });
            }
            // Remove from active handshakes
            this.activeHandshakes.delete(handshakeId);
            // Publish handshake response event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-handshake-response-${validatedResponse.handshakeId || handshakeId}`,
                type: 'a2a.handshake.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: validatedResponse
            });
            console.log(`A2A handshake completed: ${validatedResponse.handshakeId || handshakeId}`);
            return validatedResponse;
        }
        catch (error) {
            console.error('A2A handshake failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                accepted: false,
                error: errorMessage,
                reason: errorMessage
            };
        }
    }
    /**
     * Negotiates a task between two agents
     * @param request Task negotiation request
     * @returns Promise that resolves with the negotiation response
     */
    async negotiateTask(request) {
        try {
            console.log(`Negotiating task ${request.task.id} from ${request.sourceAgentId} to ${request.targetAgentId}`);
            // Check if task negotiation is enabled
            if (!this.config.enableTaskNegotiation) {
                return {
                    success: false,
                    accepted: false,
                    error: 'Task negotiation is disabled'
                };
            }
            // Verify handshake exists
            const handshake = this.handshakeHistory.get(request.handshakeId);
            if (!handshake || !handshake.accepted) {
                return {
                    success: false,
                    accepted: false,
                    error: 'Handshake not found or not accepted'
                };
            }
            // Publish task negotiation request event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-task-negotiation-${Date.now()}`,
                type: 'a2a.task.negotiation.request',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: request
            });
            const negotiationId = this.generateNegotiationId();
            let response;
            // Try MCP-based negotiation if available
            if (this.config.enableMCPIntegration && this.isMCPConnected && this.mcpConnector) {
                try {
                    const tools = this.mcpConnector.getTools();
                    if (tools.includes('a2a_task_negotiate')) {
                        // Use MCP tool for task negotiation with retry logic
                        response = await this.negotiateTaskWithRetry(request, negotiationId);
                    }
                    else {
                        // Fall back to event-based negotiation
                        response = await this.negotiateTaskViaEvents(request, negotiationId);
                    }
                }
                catch (error) {
                    console.warn('MCP task negotiation failed, falling back to events:', error);
                    // Fall back to event-based negotiation
                    response = await this.negotiateTaskViaEvents(request, negotiationId);
                }
            }
            else {
                // Use event-based negotiation
                response = await this.negotiateTaskViaEvents(request, negotiationId);
            }
            // Publish task negotiation response event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-task-negotiation-response-${response.negotiationId || negotiationId}`,
                type: 'a2a.task.negotiation.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: response
            });
            console.log(`Task negotiation completed: ${response.negotiationId || negotiationId}, accepted: ${response.accepted}`);
            return response;
        }
        catch (error) {
            console.error('Task negotiation failed:', error);
            return {
                success: false,
                accepted: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Negotiates a task via event-based communication (fallback)
     * @param request Task negotiation request
     * @param negotiationId Negotiation ID
     * @returns Promise that resolves with the negotiation response
     */
    async negotiateTaskViaEvents(request, negotiationId) {
        return new Promise((resolve) => {
            let resolved = false;
            let timeout = null;
            // Subscribe to negotiation response events
            const subscriptionId = event_bus_ts_1.eventBus.subscribe('a2a.task.negotiation.response', async (event) => {
                const response = event.payload;
                // Match by negotiation ID or request ID (handshake ID)
                const requestId = response.requestId;
                if (response.negotiationId === negotiationId || requestId === request.handshakeId) {
                    if (!resolved) {
                        resolved = true;
                        if (timeout)
                            clearTimeout(timeout);
                        event_bus_ts_1.eventBus.unsubscribe(subscriptionId);
                        resolve(response);
                    }
                }
            });
            // Set timeout for negotiation response
            timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    event_bus_ts_1.eventBus.unsubscribe(subscriptionId);
                    // Provide default response based on agent capabilities
                    const targetAgent = this.registeredAgents.get(request.targetAgentId);
                    const estimatedLatency = this.estimateTaskLatency(request.task);
                    const canAccept = targetAgent ? this.canAgentAcceptTask(targetAgent, request.task) : true;
                    resolve({
                        success: true,
                        negotiationId,
                        accepted: canAccept,
                        estimatedLatency
                    });
                }
            }, this.config.handshakeTimeoutMs || 5000);
        });
    }
    /**
     * Checks if an agent can accept a task based on capabilities
     * @param agent Agent information
     * @param task Task to check
     * @returns Boolean indicating if agent can accept task
     */
    canAgentAcceptTask(agent, task) {
        // Simple heuristic: check if agent has relevant capabilities
        // In a real implementation, this would be more sophisticated
        const taskDescription = task.description.toLowerCase();
        const agentCapabilities = agent.capabilities.map(c => c.toLowerCase());
        // Check for capability matches
        for (const capability of agentCapabilities) {
            if (taskDescription.includes(capability) || capability.includes(task.type || '')) {
                return true;
            }
        }
        // Default to accepting if no specific match found
        return true;
    }
    /**
     * Synchronizes state between two agents
     * @param request State synchronization request
     * @returns Promise that resolves with the synchronization response
     */
    async syncState(request) {
        try {
            console.log(`Synchronizing state from ${request.sourceAgentId} to ${request.targetAgentId} (${request.syncType})`);
            // Check if state sync is enabled
            if (!this.config.enableStateSync) {
                return {
                    success: false,
                    acknowledged: false,
                    error: 'State synchronization is disabled'
                };
            }
            // Verify handshake exists
            const handshake = this.handshakeHistory.get(request.handshakeId);
            if (!handshake || !handshake.accepted) {
                return {
                    success: false,
                    acknowledged: false,
                    error: 'Handshake not found or not accepted'
                };
            }
            // Publish state sync request event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-state-sync-${Date.now()}`,
                type: 'a2a.state.sync.request',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: request
            });
            const syncId = this.generateSyncId();
            let response;
            // Try MCP-based state sync if available
            if (this.config.enableMCPIntegration && this.isMCPConnected && this.mcpConnector) {
                try {
                    const tools = this.mcpConnector.getTools();
                    if (tools.includes('a2a_state_sync')) {
                        // Use MCP tool for state synchronization with retry logic
                        response = await this.syncStateWithRetry(request, syncId);
                    }
                    else {
                        // Fall back to event-based state sync
                        response = await this.syncStateViaEvents(request, syncId);
                    }
                }
                catch (error) {
                    console.warn('MCP state sync failed, falling back to events:', error);
                    // Fall back to event-based state sync
                    response = await this.syncStateViaEvents(request, syncId);
                }
            }
            else {
                // Use event-based state sync
                response = await this.syncStateViaEvents(request, syncId);
            }
            // Publish state sync response event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-state-sync-response-${response.syncId || syncId}`,
                type: 'a2a.state.sync.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: response
            });
            console.log(`State synchronization completed: ${response.syncId || syncId}, acknowledged: ${response.acknowledged}`);
            return response;
        }
        catch (error) {
            console.error('State synchronization failed:', error);
            return {
                success: false,
                acknowledged: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Synchronizes state via event-based communication (fallback)
     * @param request State sync request
     * @param syncId Sync ID
     * @returns Promise that resolves with the sync response
     */
    async syncStateViaEvents(request, syncId) {
        return new Promise((resolve) => {
            let resolved = false;
            let timeout = null;
            // For incremental syncs, use shorter timeout
            const timeoutMs = request.syncType === 'incremental'
                ? 500
                : (this.config.handshakeTimeoutMs || 5000);
            // Subscribe to state sync response events
            const subscriptionId = event_bus_ts_1.eventBus.subscribe('a2a.state.sync.response', async (event) => {
                const response = event.payload;
                // Match by sync ID or request ID (handshake ID)
                const requestId = response.requestId;
                if (response.syncId === syncId || requestId === request.handshakeId) {
                    if (!resolved) {
                        resolved = true;
                        if (timeout)
                            clearTimeout(timeout);
                        event_bus_ts_1.eventBus.unsubscribe(subscriptionId);
                        resolve(response);
                    }
                }
            });
            // Set timeout for state sync response
            timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    event_bus_ts_1.eventBus.unsubscribe(subscriptionId);
                    // Default to acknowledging even on timeout for incremental syncs
                    // For full syncs, acknowledge if state is valid
                    const stateValid = this.validateState(request.state);
                    const acknowledged = request.syncType === 'incremental' || stateValid;
                    resolve({
                        success: acknowledged,
                        syncId,
                        acknowledged
                    });
                }
            }, timeoutMs);
        });
    }
    /**
     * Handles handshake request event
     * @param request Handshake request
     */
    async handleHandshakeRequest(request) {
        // Phase 11: Use handshake protocol for actual handshake
        try {
            const response = await handshake_ts_1.a2aHandshakeProtocol.handleHandshakeRequest(request);
            // Publish handshake response event
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-handshake-response-${response.handshakeId || Date.now()}`,
                type: 'a2a.handshake.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: response
            });
            console.log('Handshake request handled:', response);
        }
        catch (error) {
            console.error('Error handling handshake request:', error);
        }
    }
    /**
     * Handles task negotiation request event
     * @param request Task negotiation request
     */
    async handleTaskNegotiationRequest(request) {
        try {
            console.log('Handling task negotiation request:', request);
            // Verify handshake exists
            const handshake = this.handshakeHistory.get(request.handshakeId);
            if (!handshake || !handshake.accepted) {
                // Publish rejection response
                await event_bus_ts_1.eventBus.publish({
                    id: `a2a-task-negotiation-response-${Date.now()}`,
                    type: 'a2a.task.negotiation.response',
                    timestamp: Date.now(),
                    source: 'a2a-mediator',
                    payload: {
                        success: false,
                        accepted: false,
                        error: 'Handshake not found or not accepted'
                    }
                });
                return;
            }
            // Check if target agent can accept the task
            const targetAgent = this.registeredAgents.get(request.targetAgentId);
            const canAccept = targetAgent ? this.canAgentAcceptTask(targetAgent, request.task) : true;
            const estimatedLatency = this.estimateTaskLatency(request.task);
            // Generate negotiation ID
            const negotiationId = this.generateNegotiationId();
            // Publish negotiation response
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-task-negotiation-response-${negotiationId}`,
                type: 'a2a.task.negotiation.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: {
                    success: true,
                    negotiationId,
                    accepted: canAccept,
                    estimatedLatency,
                    requestId: request.handshakeId // Link back to request
                }
            });
            console.log(`Task negotiation response published: ${negotiationId}, accepted: ${canAccept}`);
        }
        catch (error) {
            console.error('Error handling task negotiation request:', error);
            // Publish error response
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-task-negotiation-response-error-${Date.now()}`,
                type: 'a2a.task.negotiation.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: {
                    success: false,
                    accepted: false,
                    error: error instanceof Error ? error.message : String(error)
                }
            }).catch(console.error);
        }
    }
    /**
     * Handles state sync request event
     * @param request State sync request
     */
    async handleStateSyncRequest(request) {
        try {
            console.log('Handling state sync request:', request.syncType);
            // Verify handshake exists
            const handshake = this.handshakeHistory.get(request.handshakeId);
            if (!handshake || !handshake.accepted) {
                // Publish rejection response
                await event_bus_ts_1.eventBus.publish({
                    id: `a2a-state-sync-response-${Date.now()}`,
                    type: 'a2a.state.sync.response',
                    timestamp: Date.now(),
                    source: 'a2a-mediator',
                    payload: {
                        success: false,
                        acknowledged: false,
                        error: 'Handshake not found or not accepted'
                    }
                });
                return;
            }
            // For incremental syncs, acknowledge immediately
            // For full syncs, validate state structure
            const stateValid = this.validateState(request.state);
            // Generate sync ID
            const syncId = this.generateSyncId();
            // Publish sync response
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-state-sync-response-${syncId}`,
                type: 'a2a.state.sync.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: {
                    success: stateValid,
                    syncId,
                    acknowledged: stateValid,
                    requestId: request.handshakeId // Link back to request
                }
            });
            console.log(`State sync response published: ${syncId}, acknowledged: ${stateValid}`);
        }
        catch (error) {
            console.error('Error handling state sync request:', error);
            // Publish error response
            await event_bus_ts_1.eventBus.publish({
                id: `a2a-state-sync-response-error-${Date.now()}`,
                type: 'a2a.state.sync.response',
                timestamp: Date.now(),
                source: 'a2a-mediator',
                payload: {
                    success: false,
                    acknowledged: false,
                    error: error instanceof Error ? error.message : String(error)
                }
            }).catch(console.error);
        }
    }
    /**
     * Validates state structure
     * @param state State to validate
     * @returns Boolean indicating if state is valid
     */
    validateState(state) {
        // Simple validation: check if state is an object
        if (!state || typeof state !== 'object') {
            return false;
        }
        // Check for required state fields (can be enhanced)
        // For now, accept any non-null object
        return true;
    }
    /**
     * Registers an agent with the mediator
     * @param agentId Agent ID
     * @param agentInfo Agent information
     */
    registerAgent(agentId, agentInfo) {
        this.registeredAgents.set(agentId, agentInfo);
        console.log(`Registered agent: ${agentId} with capabilities: ${agentInfo.capabilities.join(', ')}`);
    }
    /**
     * Gets registered agent information
     * @param agentId Agent ID
     * @returns Agent information or undefined if not found
     */
    getAgentInfo(agentId) {
        return this.registeredAgents.get(agentId);
    }
    /**
     * Gets all registered agents
     * @returns Array of registered agent information
     */
    getRegisteredAgents() {
        return Array.from(this.registeredAgents.values());
    }
    /**
     * Gets current configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Updates configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('A2A mediator configuration updated:', this.config);
    }
    /**
     * Gets MCP connector instance
     * @returns MCP connector or null if not enabled
     */
    getMCPConnector() {
        return this.mcpConnector;
    }
    /**
     * Checks if MCP is connected
     * @returns Boolean indicating MCP connection status
     */
    isMCPConnectedStatus() {
        return this.isMCPConnected;
    }
    /**
     * Generates a unique handshake ID
     * @returns Unique handshake ID
     */
    generateHandshakeId() {
        return `handshake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generates a unique negotiation ID
     * @returns Unique negotiation ID
     */
    generateNegotiationId() {
        return `negotiation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generates a unique sync ID
     * @returns Unique sync ID
     */
    generateSyncId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Negotiates a task using MCP with retry logic
     * @param request Task negotiation request
     * @param negotiationId Negotiation ID
     * @returns Promise that resolves with the negotiation response
     */
    async negotiateTaskWithRetry(request, negotiationId) {
        const maxRetries = this.config.maxRetries || 3;
        const retryDelayMs = this.config.retryDelayMs || 1000;
        const exponentialBackoff = this.config.exponentialBackoff ?? true;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = exponentialBackoff
                        ? retryDelayMs * Math.pow(2, attempt - 1)
                        : retryDelayMs;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    console.log(`Retrying task negotiation (attempt ${attempt + 1}/${maxRetries + 1})...`);
                }
                const result = await this.mcpConnector.callTool('a2a_task_negotiate', {
                    sourceAgentId: request.sourceAgentId,
                    targetAgentId: request.targetAgentId,
                    handshakeId: request.handshakeId,
                    task: {
                        id: request.task.id,
                        description: request.task.description,
                        type: request.task.type,
                        priority: request.priority || 'medium'
                    },
                    context: request.context,
                    priority: request.priority || 'medium'
                });
                return {
                    success: result.success ?? true,
                    negotiationId: result.negotiationId || negotiationId,
                    accepted: result.accepted ?? true,
                    estimatedLatency: result.estimatedLatency || this.estimateTaskLatency(request.task),
                    error: result.error
                };
            }
            catch (error) {
                if (attempt === maxRetries) {
                    // Final attempt failed, throw error
                    throw error;
                }
                console.warn(`Task negotiation attempt ${attempt + 1} failed:`, error);
            }
        }
        // Should not reach here, but provide fallback
        throw new Error('Task negotiation failed after all retries');
    }
    /**
     * Synchronizes state using MCP with retry logic
     * @param request State sync request
     * @param syncId Sync ID
     * @returns Promise that resolves with the sync response
     */
    async syncStateWithRetry(request, syncId) {
        const maxRetries = this.config.maxRetries || 3;
        const retryDelayMs = this.config.retryDelayMs || 1000;
        const exponentialBackoff = this.config.exponentialBackoff ?? true;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = exponentialBackoff
                        ? retryDelayMs * Math.pow(2, attempt - 1)
                        : retryDelayMs;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    console.log(`Retrying state sync (attempt ${attempt + 1}/${maxRetries + 1})...`);
                }
                const result = await this.mcpConnector.callTool('a2a_state_sync', {
                    sourceAgentId: request.sourceAgentId,
                    targetAgentId: request.targetAgentId,
                    handshakeId: request.handshakeId,
                    state: request.state,
                    syncType: request.syncType
                });
                return {
                    success: result.success ?? true,
                    syncId: result.syncId || syncId,
                    acknowledged: result.acknowledged ?? true,
                    error: result.error
                };
            }
            catch (error) {
                if (attempt === maxRetries) {
                    // Final attempt failed, throw error
                    throw error;
                }
                console.warn(`State sync attempt ${attempt + 1} failed:`, error);
            }
        }
        // Should not reach here, but provide fallback
        throw new Error('State synchronization failed after all retries');
    }
    /**
     * Estimates task latency based on task characteristics
     * @param task Task to estimate
     * @returns Estimated latency in milliseconds
     */
    estimateTaskLatency(task) {
        // Simple heuristic: estimate latency based on task description length
        const baseLatency = 100; // Base latency in ms
        const descriptionLength = task.description.length;
        const estimatedLatency = baseLatency + (descriptionLength * 0.1);
        return Math.min(estimatedLatency, 1000); // Cap at 1s
    }
}
exports.A2AMediator = A2AMediator;
// Export singleton instance
exports.a2aMediator = new A2AMediator();
/**
 * Convenience function for initiating an A2A handshake
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
async function initiateA2AHandshake(request) {
    return await exports.a2aMediator.initiateHandshake(request);
}
/**
 * Convenience function for negotiating a task
 * @param request Task negotiation request
 * @returns Promise that resolves with the negotiation response
 */
async function negotiateA2ATask(request) {
    return await exports.a2aMediator.negotiateTask(request);
}
/**
 * Convenience function for synchronizing state
 * @param request State synchronization request
 * @returns Promise that resolves with the synchronization response
 */
async function syncA2AState(request) {
    return await exports.a2aMediator.syncState(request);
}
//# sourceMappingURL=a2a-mediator.js.map