"use strict";
/**
 * A2A Handshake Protocol for LAPA v1.2 Phase 11
 *
 * This module implements the A2A (Agent-to-Agent) handshake protocol
 * for secure and standardized agent communication initialization.
 *
 * Features:
 * - Protocol version negotiation
 * - Capability exchange
 * - Authentication and authorization
 * - Session establishment
 * - Error handling and retry logic
 *
 * Phase 11: MCP + A2A Connectors integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.a2aHandshakeProtocol = exports.A2AHandshakeProtocol = exports.HandshakeState = exports.A2A_HANDSHAKE_PROTOCOL_VERSION = void 0;
exports.initiateHandshake = initiateHandshake;
exports.handleHandshakeRequest = handleHandshakeRequest;
const event_bus_ts_1 = require("../core/event-bus.ts");
const zod_1 = require("zod");
// Handshake protocol version
exports.A2A_HANDSHAKE_PROTOCOL_VERSION = '1.0';
// Handshake states
var HandshakeState;
(function (HandshakeState) {
    HandshakeState["INITIAL"] = "initial";
    HandshakeState["REQUESTED"] = "requested";
    HandshakeState["ACCEPTED"] = "accepted";
    HandshakeState["REJECTED"] = "rejected";
    HandshakeState["COMPLETED"] = "completed";
    HandshakeState["FAILED"] = "failed";
})(HandshakeState || (exports.HandshakeState = HandshakeState = {}));
// Default configuration
const DEFAULT_CONFIG = {
    protocolVersion: exports.A2A_HANDSHAKE_PROTOCOL_VERSION,
    timeoutMs: 5000,
    maxRetries: 3,
    retryIntervalMs: 1000,
    enableAuthentication: true,
    enableCapabilityExchange: true,
    enableSessionEstablishment: true
};
// Handshake request schema
const handshakeRequestSchema = zod_1.z.object({
    sourceAgentId: zod_1.z.string(),
    targetAgentId: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    protocolVersion: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    taskId: zod_1.z.string().optional(),
    taskDescription: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.unknown()).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    timestamp: zod_1.z.number().optional()
});
// Handshake response schema
const handshakeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    handshakeId: zod_1.z.string().optional(),
    accepted: zod_1.z.boolean(),
    capabilities: zod_1.z.array(zod_1.z.string()).optional(),
    protocolVersion: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    timestamp: zod_1.z.number().optional()
});
/**
 * A2A Handshake Protocol
 *
 * Manages the handshake process between agents, including:
 * - Protocol version negotiation
 * - Capability exchange
 * - Authentication
 * - Session establishment
 */
class A2AHandshakeProtocol {
    config;
    activeHandshakes = new Map();
    handshakeHistory = new Map();
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Subscribe to handshake events
        event_bus_ts_1.eventBus.subscribe('a2a.handshake.request', async (event) => {
            const request = event.payload;
            await this.handleHandshakeRequest(request);
        });
        event_bus_ts_1.eventBus.subscribe('a2a.handshake.response', async (event) => {
            const response = event.payload;
            await this.handleHandshakeResponse(response);
        });
    }
    /**
     * Initiates a handshake with another agent
     * @param request Handshake request
     * @returns Promise that resolves with the handshake response
     */
    async initiateHandshake(request) {
        try {
            // Validate request
            const validatedRequest = handshakeRequestSchema.parse({
                ...request,
                timestamp: Date.now()
            });
            // Generate handshake ID
            const handshakeId = this.generateHandshakeId();
            // Create handshake session
            const session = {
                handshakeId,
                sourceAgentId: validatedRequest.sourceAgentId,
                targetAgentId: validatedRequest.targetAgentId,
                state: HandshakeState.REQUESTED,
                protocolVersion: validatedRequest.protocolVersion || this.config.protocolVersion,
                capabilities: validatedRequest.capabilities,
                createdAt: Date.now()
            };
            // Store active handshake
            this.activeHandshakes.set(handshakeId, session);
            // Publish handshake request event
            await event_bus_ts_1.eventBus.publish({
                id: `handshake-request-${handshakeId}`,
                type: 'a2a.handshake.request',
                timestamp: Date.now(),
                source: 'a2a-handshake-protocol',
                payload: validatedRequest
            });
            // Wait for response with timeout
            const response = await this.waitForHandshakeResponse(handshakeId);
            // Update session
            session.state = response.accepted ? HandshakeState.ACCEPTED : HandshakeState.REJECTED;
            session.completedAt = Date.now();
            if (response.sessionId) {
                session.sessionId = response.sessionId;
            }
            if (response.error) {
                session.error = response.error;
            }
            // Move to history
            this.activeHandshakes.delete(handshakeId);
            this.handshakeHistory.set(handshakeId, session);
            // Publish handshake completed event
            await event_bus_ts_1.eventBus.publish({
                id: `handshake-completed-${handshakeId}`,
                type: 'a2a.handshake.completed',
                timestamp: Date.now(),
                source: 'a2a-handshake-protocol',
                payload: {
                    handshakeId,
                    accepted: response.accepted,
                    sessionId: session.sessionId
                }
            });
            return response;
        }
        catch (error) {
            console.error('Handshake initiation failed:', error);
            return {
                success: false,
                accepted: false,
                error: error instanceof Error ? error.message : String(error),
                reason: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Handles an incoming handshake request
     * @param request Handshake request
     * @returns Promise that resolves with the handshake response
     */
    async handleHandshakeRequest(request) {
        try {
            // Validate request
            const validatedRequest = handshakeRequestSchema.parse(request);
            // Check protocol version compatibility
            const protocolVersion = validatedRequest.protocolVersion || this.config.protocolVersion;
            if (!this.isProtocolVersionCompatible(protocolVersion)) {
                return {
                    success: false,
                    accepted: false,
                    error: 'Protocol version mismatch',
                    reason: `Required protocol version: ${this.config.protocolVersion}, received: ${protocolVersion}`
                };
            }
            // Perform authentication if enabled
            if (this.config.enableAuthentication) {
                const authResult = await this.authenticate(validatedRequest);
                if (!authResult.success) {
                    return {
                        success: false,
                        accepted: false,
                        error: 'Authentication failed',
                        reason: authResult.reason
                    };
                }
            }
            // Exchange capabilities if enabled
            let exchangedCapabilities = [];
            if (this.config.enableCapabilityExchange) {
                exchangedCapabilities = await this.exchangeCapabilities(validatedRequest);
            }
            // Establish session if enabled
            let sessionId;
            if (this.config.enableSessionEstablishment) {
                sessionId = await this.establishSession(validatedRequest);
            }
            // Generate handshake ID
            const handshakeId = this.generateHandshakeId();
            // Create handshake session
            const session = {
                handshakeId,
                sourceAgentId: validatedRequest.sourceAgentId,
                targetAgentId: validatedRequest.targetAgentId,
                state: HandshakeState.ACCEPTED,
                protocolVersion,
                capabilities: exchangedCapabilities.length > 0 ? exchangedCapabilities : validatedRequest.capabilities,
                sessionId,
                createdAt: Date.now(),
                completedAt: Date.now()
            };
            // Store handshake
            this.handshakeHistory.set(handshakeId, session);
            // Create response
            const response = {
                success: true,
                handshakeId,
                accepted: true,
                capabilities: session.capabilities,
                protocolVersion,
                sessionId,
                reason: 'Handshake accepted successfully'
            };
            // Validate response
            const validatedResponse = handshakeResponseSchema.parse({
                ...response,
                timestamp: Date.now()
            });
            // Publish handshake response event
            await event_bus_ts_1.eventBus.publish({
                id: `handshake-response-${handshakeId}`,
                type: 'a2a.handshake.response',
                timestamp: Date.now(),
                source: 'a2a-handshake-protocol',
                payload: validatedResponse
            });
            return validatedResponse;
        }
        catch (error) {
            console.error('Handshake request handling failed:', error);
            return {
                success: false,
                accepted: false,
                error: error instanceof Error ? error.message : String(error),
                reason: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Handles an incoming handshake response
     * @param response Handshake response
     */
    async handleHandshakeResponse(response) {
        if (response.handshakeId) {
            const session = this.activeHandshakes.get(response.handshakeId);
            if (session) {
                session.state = response.accepted ? HandshakeState.ACCEPTED : HandshakeState.REJECTED;
                session.completedAt = Date.now();
                if (response.sessionId) {
                    session.sessionId = response.sessionId;
                }
                if (response.error) {
                    session.error = response.error;
                }
            }
        }
    }
    /**
     * Waits for a handshake response
     * @param handshakeId Handshake ID
     * @returns Promise that resolves with the handshake response
     */
    async waitForHandshakeResponse(handshakeId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const session = this.activeHandshakes.get(handshakeId);
                if (session) {
                    session.state = HandshakeState.FAILED;
                    session.error = 'Handshake timeout';
                    this.activeHandshakes.delete(handshakeId);
                    this.handshakeHistory.set(handshakeId, session);
                }
                reject(new Error('Handshake timeout'));
            }, this.config.timeoutMs);
            // Subscribe to handshake response events
            const subscriptionId = event_bus_ts_1.eventBus.subscribe('a2a.handshake.response', async (event) => {
                const response = event.payload;
                if (response.handshakeId === handshakeId) {
                    clearTimeout(timeout);
                    event_bus_ts_1.eventBus.unsubscribe(subscriptionId);
                    resolve(response);
                }
            });
        });
    }
    /**
     * Checks if a protocol version is compatible
     * @param version Protocol version to check
     * @returns Boolean indicating compatibility
     */
    isProtocolVersionCompatible(version) {
        // Simple version check - can be enhanced with semantic versioning
        return version === this.config.protocolVersion || version.startsWith(this.config.protocolVersion.split('.')[0]);
    }
    /**
     * Authenticates a handshake request
     * @param request Handshake request
     * @returns Promise that resolves with authentication result
     */
    async authenticate(request) {
        // Simple authentication - can be enhanced with actual authentication logic
        // For now, we'll accept all requests
        // In a real implementation, you would:
        // 1. Check agent credentials
        // 2. Verify agent identity
        // 3. Check authorization permissions
        // 4. Validate request signatures
        return { success: true };
    }
    /**
     * Exchanges capabilities between agents
     * @param request Handshake request
     * @returns Promise that resolves with exchanged capabilities
     */
    async exchangeCapabilities(request) {
        // Return common capabilities
        // In a real implementation, you would:
        // 1. Get local agent capabilities
        // 2. Compare with requested capabilities
        // 3. Return intersection of capabilities
        // 4. Negotiate capability versions
        return request.capabilities;
    }
    /**
     * Establishes a session between agents
     * @param request Handshake request
     * @returns Promise that resolves with session ID
     */
    async establishSession(request) {
        // Generate session ID
        const sessionId = this.generateSessionId();
        // Store session information
        // In a real implementation, you would:
        // 1. Create session record
        // 2. Store session metadata
        // 3. Set session expiration
        // 4. Initialize session state
        return sessionId;
    }
    /**
     * Generates a unique handshake ID
     * @returns Handshake ID
     */
    generateHandshakeId() {
        return `handshake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generates a unique session ID
     * @returns Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Gets a handshake session
     * @param handshakeId Handshake ID
     * @returns Handshake session or undefined if not found
     */
    getHandshakeSession(handshakeId) {
        return this.activeHandshakes.get(handshakeId) || this.handshakeHistory.get(handshakeId);
    }
    /**
     * Gets all active handshakes
     * @returns Array of handshake sessions
     */
    getActiveHandshakes() {
        return Array.from(this.activeHandshakes.values());
    }
    /**
     * Gets handshake history
     * @returns Array of handshake sessions
     */
    getHandshakeHistory() {
        return Array.from(this.handshakeHistory.values());
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
    }
}
exports.A2AHandshakeProtocol = A2AHandshakeProtocol;
// Export singleton instance
exports.a2aHandshakeProtocol = new A2AHandshakeProtocol();
/**
 * Convenience function for initiating a handshake
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
async function initiateHandshake(request) {
    return await exports.a2aHandshakeProtocol.initiateHandshake(request);
}
/**
 * Convenience function for handling a handshake request
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
async function handleHandshakeRequest(request) {
    return await exports.a2aHandshakeProtocol.handleHandshakeRequest(request);
}
//# sourceMappingURL=handshake.js.map