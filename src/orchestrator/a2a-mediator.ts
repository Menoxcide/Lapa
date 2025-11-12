/**
 * A2A (Agent-to-Agent) Mediator for LAPA v1.2 Protocol-Resonant Nexus — Phase 10
 * 
 * This module implements the A2A handshake foundation for agent-to-agent communication.
 * It provides handshake, task negotiation, and state synchronization capabilities
 * for seamless agent coordination within the swarm.
 * 
 * Phase 11 will extend this with full MCP + A2A Connectors integration.
 */

import { eventBus } from '../core/event-bus.ts';
import { Task } from '../agents/moe-router.ts';
import { z } from 'zod';

// Zod schema for A2A handshake request validation (protocolVersion is optional)
// Note: We'll validate after ensuring protocolVersion is set
const a2aHandshakeRequestBaseSchema = z.object({
  sourceAgentId: z.string(),
  targetAgentId: z.string(),
  capabilities: z.array(z.string()),
  protocolVersion: z.string(),
  metadata: z.record(z.unknown()).optional(),
  taskId: z.string().optional(),
  taskDescription: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

// Zod schema for A2A handshake response validation
const a2aHandshakeResponseSchema = z.object({
  success: z.boolean(),
  handshakeId: z.string().optional(),
  accepted: z.boolean(),
  capabilities: z.array(z.string()).optional(),
  protocolVersion: z.string().optional(),
  error: z.string().optional(),
  reason: z.string().optional()
});

// A2A handshake request interface
export interface A2AHandshakeRequest {
  sourceAgentId: string;
  targetAgentId: string;
  capabilities: string[];
  protocolVersion?: string; // Optional, will default to mediator's protocol version
  metadata?: Record<string, unknown>;
  // Optional task-related fields for handoff context
  taskId?: string;
  taskDescription?: string;
  context?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high';
}

// A2A handshake response interface
export interface A2AHandshakeResponse {
  success: boolean;
  handshakeId?: string;
  accepted: boolean;
  capabilities?: string[];
  protocolVersion?: string;
  error?: string;
  reason?: string; // Human-readable reason for rejection or acceptance
}

// A2A task negotiation request interface
export interface A2ATaskNegotiationRequest {
  sourceAgentId: string;
  targetAgentId: string;
  task: Task;
  context: Record<string, unknown>;
  handshakeId: string;
  priority?: 'low' | 'medium' | 'high';
}

// A2A task negotiation response interface
export interface A2ATaskNegotiationResponse {
  success: boolean;
  negotiationId?: string;
  accepted: boolean;
  estimatedLatency?: number;
  error?: string;
}

// A2A state synchronization request interface
export interface A2AStateSyncRequest {
  sourceAgentId: string;
  targetAgentId: string;
  state: Record<string, unknown>;
  handshakeId: string;
  syncType: 'full' | 'incremental';
}

// A2A state synchronization response interface
export interface A2AStateSyncResponse {
  success: boolean;
  syncId?: string;
  acknowledged: boolean;
  error?: string;
}

// A2A mediator configuration
export interface A2AMediatorConfig {
  enableHandshake: boolean;
  handshakeTimeoutMs: number;
  enableTaskNegotiation: boolean;
  enableStateSync: boolean;
  protocolVersion: string;
  maxConcurrentHandshakes: number;
}

// Default configuration
const DEFAULT_CONFIG: A2AMediatorConfig = {
  enableHandshake: true,
  handshakeTimeoutMs: 5000,
  enableTaskNegotiation: true,
  enableStateSync: true,
  protocolVersion: '1.0',
  maxConcurrentHandshakes: 10
};

/**
 * A2A Mediator
 * 
 * Manages agent-to-agent handshakes, task negotiation, and state synchronization
 * for seamless agent coordination within the swarm.
 */
export class A2AMediator {
  private config: A2AMediatorConfig;
  private activeHandshakes: Map<string, A2AHandshakeRequest> = new Map();
  private handshakeHistory: Map<string, A2AHandshakeResponse> = new Map();
  private registeredAgents: Map<string, {
    agentId: string;
    capabilities: string[];
    protocolVersion: string;
    lastHandshake: number;
  }> = new Map();

  constructor(config?: Partial<A2AMediatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Subscribe to A2A events
    eventBus.subscribe('a2a.handshake.request', async (event) => {
      const request = event.payload as A2AHandshakeRequest;
      await this.handleHandshakeRequest(request);
    });
    
    eventBus.subscribe('a2a.task.negotiation.request', async (event) => {
      const request = event.payload as A2ATaskNegotiationRequest;
      await this.handleTaskNegotiationRequest(request);
    });
    
    eventBus.subscribe('a2a.state.sync.request', async (event) => {
      const request = event.payload as A2AStateSyncRequest;
      await this.handleStateSyncRequest(request);
    });
  }

  /**
   * Initiates an A2A handshake between two agents
   * @param request Handshake request
   * @returns Promise that resolves with the handshake response
   */
  async initiateHandshake(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
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
      
      // Generate handshake ID
      const handshakeId = this.generateHandshakeId();
      
      // Store active handshake
      this.activeHandshakes.set(handshakeId, validatedRequest);
      
      // Publish handshake request event
      await eventBus.publish({
        id: `a2a-handshake-${handshakeId}`,
        type: 'a2a.handshake.request',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: validatedRequest
      });
      
      // Simulate handshake response (in Phase 11, this will be async with actual agent communication)
      const response: A2AHandshakeResponse = {
        success: true,
        handshakeId,
        accepted: true,
        capabilities: validatedRequest.capabilities,
        protocolVersion: validatedRequest.protocolVersion || this.config.protocolVersion,
        reason: 'Handshake accepted successfully'
      };
      
      // Validate response with Zod schema
      const validatedResponse = a2aHandshakeResponseSchema.parse(response);
      
      // Store handshake history
      this.handshakeHistory.set(handshakeId, validatedResponse);
      
      // Register agent capabilities
      this.registerAgent(validatedRequest.targetAgentId, {
        agentId: validatedRequest.targetAgentId,
        capabilities: validatedRequest.capabilities,
        protocolVersion: validatedRequest.protocolVersion,
        lastHandshake: Date.now()
      });
      
      // Remove from active handshakes
      this.activeHandshakes.delete(handshakeId);
      
      // Publish handshake response event
      await eventBus.publish({
        id: `a2a-handshake-response-${handshakeId}`,
        type: 'a2a.handshake.response',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: validatedResponse
      });
      
      console.log(`A2A handshake completed: ${handshakeId}`);
      
      return validatedResponse;
    } catch (error) {
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
  async negotiateTask(request: A2ATaskNegotiationRequest): Promise<A2ATaskNegotiationResponse> {
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
      if (!this.handshakeHistory.has(request.handshakeId)) {
        return {
          success: false,
          accepted: false,
          error: 'Handshake not found'
        };
      }
      
      // Publish task negotiation request event
      await eventBus.publish({
        id: `a2a-task-negotiation-${Date.now()}`,
        type: 'a2a.task.negotiation.request',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: request
      });
      
      // Simulate task negotiation (in Phase 11, this will be async with actual agent communication)
      const negotiationId = this.generateNegotiationId();
      const estimatedLatency = this.estimateTaskLatency(request.task);
      
      const response: A2ATaskNegotiationResponse = {
        success: true,
        negotiationId,
        accepted: true,
        estimatedLatency
      };
      
      // Publish task negotiation response event
      await eventBus.publish({
        id: `a2a-task-negotiation-response-${negotiationId}`,
        type: 'a2a.task.negotiation.response',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: response
      });
      
      console.log(`Task negotiation completed: ${negotiationId}`);
      
      return response;
    } catch (error) {
      console.error('Task negotiation failed:', error);
      return {
        success: false,
        accepted: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Synchronizes state between two agents
   * @param request State synchronization request
   * @returns Promise that resolves with the synchronization response
   */
  async syncState(request: A2AStateSyncRequest): Promise<A2AStateSyncResponse> {
    try {
      console.log(`Synchronizing state from ${request.sourceAgentId} to ${request.targetAgentId}`);
      
      // Check if state sync is enabled
      if (!this.config.enableStateSync) {
        return {
          success: false,
          acknowledged: false,
          error: 'State synchronization is disabled'
        };
      }
      
      // Verify handshake exists
      if (!this.handshakeHistory.has(request.handshakeId)) {
        return {
          success: false,
          acknowledged: false,
          error: 'Handshake not found'
        };
      }
      
      // Publish state sync request event
      await eventBus.publish({
        id: `a2a-state-sync-${Date.now()}`,
        type: 'a2a.state.sync.request',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: request
      });
      
      // Simulate state synchronization (in Phase 11, this will be async with actual agent communication)
      const syncId = this.generateSyncId();
      
      const response: A2AStateSyncResponse = {
        success: true,
        syncId,
        acknowledged: true
      };
      
      // Publish state sync response event
      await eventBus.publish({
        id: `a2a-state-sync-response-${syncId}`,
        type: 'a2a.state.sync.response',
        timestamp: Date.now(),
        source: 'a2a-mediator',
        payload: response
      });
      
      console.log(`State synchronization completed: ${syncId}`);
      
      return response;
    } catch (error) {
      console.error('State synchronization failed:', error);
      return {
        success: false,
        acknowledged: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handles handshake request event
   * @param request Handshake request
   */
  private async handleHandshakeRequest(request: A2AHandshakeRequest): Promise<void> {
    // In Phase 11, this will handle actual handshake logic
    console.log('Handling handshake request:', request);
  }

  /**
   * Handles task negotiation request event
   * @param request Task negotiation request
   */
  private async handleTaskNegotiationRequest(request: A2ATaskNegotiationRequest): Promise<void> {
    // In Phase 11, this will handle actual task negotiation logic
    console.log('Handling task negotiation request:', request);
  }

  /**
   * Handles state sync request event
   * @param request State sync request
   */
  private async handleStateSyncRequest(request: A2AStateSyncRequest): Promise<void> {
    // In Phase 11, this will handle actual state sync logic
    console.log('Handling state sync request:', request);
  }

  /**
   * Registers an agent with the mediator
   * @param agentId Agent ID
   * @param agentInfo Agent information
   */
  private registerAgent(agentId: string, agentInfo: {
    agentId: string;
    capabilities: string[];
    protocolVersion: string;
    lastHandshake: number;
  }): void {
    this.registeredAgents.set(agentId, agentInfo);
    console.log(`Registered agent: ${agentId} with capabilities: ${agentInfo.capabilities.join(', ')}`);
  }

  /**
   * Gets registered agent information
   * @param agentId Agent ID
   * @returns Agent information or undefined if not found
   */
  getAgentInfo(agentId: string): {
    agentId: string;
    capabilities: string[];
    protocolVersion: string;
    lastHandshake: number;
  } | undefined {
    return this.registeredAgents.get(agentId);
  }

  /**
   * Gets all registered agents
   * @returns Array of registered agent information
   */
  getRegisteredAgents(): Array<{
    agentId: string;
    capabilities: string[];
    protocolVersion: string;
    lastHandshake: number;
  }> {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Gets current configuration
   * @returns Current configuration
   */
  getConfig(): A2AMediatorConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<A2AMediatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('A2A mediator configuration updated:', this.config);
  }

  /**
   * Generates a unique handshake ID
   * @returns Unique handshake ID
   */
  private generateHandshakeId(): string {
    return `handshake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique negotiation ID
   * @returns Unique negotiation ID
   */
  private generateNegotiationId(): string {
    return `negotiation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique sync ID
   * @returns Unique sync ID
   */
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimates task latency based on task characteristics
   * @param task Task to estimate
   * @returns Estimated latency in milliseconds
   */
  private estimateTaskLatency(task: Task): number {
    // Simple heuristic: estimate latency based on task description length
    const baseLatency = 100; // Base latency in ms
    const descriptionLength = task.description.length;
    const estimatedLatency = baseLatency + (descriptionLength * 0.1);
    return Math.min(estimatedLatency, 1000); // Cap at 1s
  }
}

// Export singleton instance
export const a2aMediator = new A2AMediator();

/**
 * Convenience function for initiating an A2A handshake
 * @param request Handshake request
 * @returns Promise that resolves with the handshake response
 */
export async function initiateA2AHandshake(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
  return await a2aMediator.initiateHandshake(request);
}

/**
 * Convenience function for negotiating a task
 * @param request Task negotiation request
 * @returns Promise that resolves with the negotiation response
 */
export async function negotiateA2ATask(request: A2ATaskNegotiationRequest): Promise<A2ATaskNegotiationResponse> {
  return await a2aMediator.negotiateTask(request);
}

/**
 * Convenience function for synchronizing state
 * @param request State synchronization request
 * @returns Promise that resolves with the synchronization response
 */
export async function syncA2AState(request: A2AStateSyncRequest): Promise<A2AStateSyncResponse> {
  return await a2aMediator.syncState(request);
}