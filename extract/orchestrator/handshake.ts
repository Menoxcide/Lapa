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

import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import type { A2AHandshakeRequest, A2AHandshakeResponse } from './a2a-mediator.ts';

// Handshake protocol version
export const A2A_HANDSHAKE_PROTOCOL_VERSION = '1.0';

// Handshake states
export enum HandshakeState {
  INITIAL = 'initial',
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Handshake configuration
export interface HandshakeConfig {
  protocolVersion: string;
  timeoutMs: number;
  maxRetries: number;
  retryIntervalMs: number;
  enableAuthentication: boolean;
  enableCapabilityExchange: boolean;
  enableSessionEstablishment: boolean;
}

// Default configuration
const DEFAULT_CONFIG: HandshakeConfig = {
  protocolVersion: A2A_HANDSHAKE_PROTOCOL_VERSION,
  timeoutMs: 5000,
  maxRetries: 3,
  retryIntervalMs: 1000,
  enableAuthentication: true,
  enableCapabilityExchange: true,
  enableSessionEstablishment: true
};

// Handshake request schema
const handshakeRequestSchema = z.object({
  sourceAgentId: z.string(),
  targetAgentId: z.string(),
  capabilities: z.array(z.string()),
  protocolVersion: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  taskId: z.string().optional(),
  taskDescription: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  timestamp: z.number().optional()
});

// Handshake response schema
const handshakeResponseSchema = z.object({
  success: z.boolean(),
  handshakeId: z.string().optional(),
  accepted: z.boolean(),
  capabilities: z.array(z.string()).optional(),
  protocolVersion: z.string().optional(),
  error: z.string().optional(),
  reason: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.number().optional()
});

// Handshake session
export interface HandshakeSession {
  handshakeId: string;
  sourceAgentId: string;
  targetAgentId: string;
  state: HandshakeState;
  protocolVersion: string;
  capabilities: string[];
  sessionId?: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

/**
 * A2A Handshake Protocol
 * 
 * Manages the handshake process between agents, including:
 * - Protocol version negotiation
 * - Capability exchange
 * - Authentication
 * - Session establishment
 */
export class A2AHandshakeProtocol {
  private config: HandshakeConfig;
  private activeHandshakes: Map<string, HandshakeSession> = new Map();
  private handshakeHistory: Map<string, HandshakeSession> = new Map();

  constructor(config?: Partial<HandshakeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Subscribe to handshake events
    eventBus.subscribe('a2a.handshake.request', async (event) => {
      const request = event.payload as A2AHandshakeRequest;
      await this.handleHandshakeRequest(request);
    });

    eventBus.subscribe('a2a.handshake.response', async (event) => {
      const response = event.payload as A2AHandshakeResponse;
      await this.handleHandshakeResponse(response);
    });
  }

  /**
   * Initiates a handshake with another agent
   * @param request Handshake request
   * @returns Promise that resolves with the handshake response
   */
  async initiateHandshake(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
    try {
      // Validate request
      const validatedRequest = handshakeRequestSchema.parse({
        ...request,
        timestamp: Date.now()
      });

      // Generate handshake ID
      const handshakeId = this.generateHandshakeId();

      // Create handshake session
      const session: HandshakeSession = {
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
      await eventBus.publish({
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
      await eventBus.publish({
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
    } catch (error) {
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
  async handleHandshakeRequest(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
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
      let exchangedCapabilities: string[] = [];
      if (this.config.enableCapabilityExchange) {
        exchangedCapabilities = await this.exchangeCapabilities(validatedRequest);
      }

      // Establish session if enabled
      let sessionId: string | undefined;
      if (this.config.enableSessionEstablishment) {
        sessionId = await this.establishSession(validatedRequest);
      }

      // Generate handshake ID
      const handshakeId = this.generateHandshakeId();

      // Create handshake session
      const session: HandshakeSession = {
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
      const response: A2AHandshakeResponse = {
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
      await eventBus.publish({
        id: `handshake-response-${handshakeId}`,
        type: 'a2a.handshake.response',
        timestamp: Date.now(),
        source: 'a2a-handshake-protocol',
        payload: validatedResponse
      });

      return validatedResponse;
    } catch (error) {
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
  private async handleHandshakeResponse(response: A2AHandshakeResponse): Promise<void> {
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
  private async waitForHandshakeResponse(handshakeId: string): Promise<A2AHandshakeResponse> {
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
      const subscriptionId = eventBus.subscribe('a2a.handshake.response', async (event) => {
        const response = event.payload as A2AHandshakeResponse;
        if (response.handshakeId === handshakeId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(subscriptionId);
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
  private isProtocolVersionCompatible(version: string): boolean {
    // Simple version check - can be enhanced with semantic versioning
    return version === this.config.protocolVersion || version.startsWith(this.config.protocolVersion.split('.')[0]);
  }

  /**
   * Authenticates a handshake request
   * @param request Handshake request
   * @returns Promise that resolves with authentication result
   */
  private async authenticate(request: A2AHandshakeRequest): Promise<{ success: boolean; reason?: string }> {
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
  private async exchangeCapabilities(request: A2AHandshakeRequest): Promise<string[]> {
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
  private async establishSession(request: A2AHandshakeRequest): Promise<string> {
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
  private generateHandshakeId(): string {
    return `handshake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique session ID
   * @returns Session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets a handshake session
   * @param handshakeId Handshake ID
   * @returns Handshake session or undefined if not found
   */
  getHandshakeSession(handshakeId: string): HandshakeSession | undefined {
    return this.activeHandshakes.get(handshakeId) || this.handshakeHistory.get(handshakeId);
  }

  /**
   * Gets all active handshakes
   * @returns Array of handshake sessions
   */
  getActiveHandshakes(): HandshakeSession[] {
    return Array.from(this.activeHandshakes.values());
  }

  /**
   * Gets handshake history
   * @returns Array of handshake sessions
   */
  getHandshakeHistory(): HandshakeSession[] {
    return Array.from(this.handshakeHistory.values());
  }

  /**
   * Gets current configuration
   * @returns Current configuration
   */
  getConfig(): HandshakeConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<HandshakeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const a2aHandshakeProtocol = new A2AHandshakeProtocol();

/**
 * Convenience function for initiating a handshake
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
export async function initiateHandshake(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
  return await a2aHandshakeProtocol.initiateHandshake(request);
}

/**
 * Convenience function for handling a handshake request
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
export async function handleHandshakeRequest(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
  return await a2aHandshakeProtocol.handleHandshakeRequest(request);
}

