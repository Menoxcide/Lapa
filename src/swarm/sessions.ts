/**
 * WebRTC-powered Swarm Sessions for LAPA v1.3.0 SwarmOS Edition — Phase 19
 * 
 * This module implements collaborative swarm sessions with WebRTC for multi-user
 * agent coordination, enabling real-time cross-user vetoes and A2A integration.
 * 
 * Features:
 * - WebRTC peer-to-peer connections for low-latency agent communication
 * - Cross-user veto mechanism integrated with consensus voting
 * - A2A mediator integration for agent handoffs
 * - Session state synchronization across participants
 * - Real-time event broadcasting
 * 
 * Phase 19: Collaborative Swarm Sessions - IN PROGRESS
 */

import { eventBus } from '../core/event-bus.ts';
import { a2aMediator, A2AHandshakeRequest, A2AHandshakeResponse } from '../orchestrator/a2a-mediator.ts';
import { ConsensusVotingSystem, VoteOption, ConsensusResult } from './consensus.voting.ts';
import { Task } from '../agents/moe-router.ts';
import { z } from 'zod';

// Zod schema for session configuration validation
const sessionConfigSchema = z.object({
  sessionId: z.string(),
  hostUserId: z.string(),
  maxParticipants: z.number().min(2).max(50),
  enableVetoes: z.boolean(),
  enableA2A: z.boolean(),
  webrtcConfig: z.object({
    iceServers: z.array(z.object({
      urls: z.union([z.string(), z.array(z.string())]),
      username: z.string().optional(),
      credential: z.string().optional()
    })).optional(),
    iceTransportPolicy: z.enum(['all', 'relay']).optional(),
    iceCandidatePoolSize: z.number().optional()
  }).optional()
});

// Session participant interface
export interface SessionParticipant {
  userId: string;
  agentId?: string;
  displayName: string;
  joinedAt: Date;
  isHost: boolean;
  capabilities: string[];
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  peerConnection?: RTCPeerConnection; // WebRTC peer connection
  dataChannel?: RTCDataChannel; // WebRTC data channel for messaging
}

// Session state interface
export interface SwarmSession {
  sessionId: string;
  hostUserId: string;
  participants: Map<string, SessionParticipant>;
  status: 'initializing' | 'active' | 'paused' | 'closed';
  createdAt: Date;
  lastActivity: Date;
  config: SessionConfig;
  activeTasks: Map<string, Task>;
  vetoSessions: Map<string, string>; // taskId -> votingSessionId
  a2aHandshakes: Map<string, string>; // agentPair -> handshakeId
}

// Session configuration interface
export interface SessionConfig {
  sessionId: string;
  hostUserId: string;
  maxParticipants: number;
  enableVetoes: boolean;
  enableA2A: boolean;
  webrtcConfig?: RTCConfiguration;
}

// Veto request interface
export interface VetoRequest {
  vetoId: string;
  sessionId: string;
  taskId: string;
  requestedBy: string;
  reason: string;
  timestamp: Date;
}

// Veto response interface
export interface VetoResponse {
  vetoId: string;
  accepted: boolean;
  votingSessionId?: string;
  consensusResult?: ConsensusResult;
  reason?: string;
}

// Session message interface for WebRTC data channel
export interface SessionMessage {
  type: 'task' | 'veto' | 'a2a' | 'state' | 'handoff' | 'heartbeat';
  sessionId: string;
  from: string;
  to?: string; // Optional target participant
  payload: unknown;
  timestamp: number;
}

// WebRTC connection manager
class WebRTCConnectionManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private iceServers: RTCIceServer[];

  constructor(iceServers?: RTCIceServer[]) {
    // Default STUN/TURN servers for WebRTC
    this.iceServers = iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  /**
   * Creates a new WebRTC peer connection
   */
  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection {
    const pcConfig: RTCConfiguration = {
      iceServers: this.iceServers,
      ...config
    };

    const pc = new RTCPeerConnection(pcConfig);
    
    // Set up ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // ICE candidate will be sent via signaling (event bus)
        eventBus.publish({
          id: `ice-candidate-${Date.now()}`,
          type: 'webrtc.ice-candidate',
          timestamp: Date.now(),
          source: 'webrtc-manager',
          payload: {
            candidate: event.candidate,
            connectionId: this.getConnectionId(pc)
          }
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      eventBus.publish({
        id: `connection-state-${Date.now()}`,
        type: 'webrtc.connection-state',
        timestamp: Date.now(),
        source: 'webrtc-manager',
        payload: {
          connectionId: this.getConnectionId(pc),
          state
        }
      });
    };

    return pc;
  }

  /**
   * Creates a data channel for messaging
   */
  createDataChannel(pc: RTCPeerConnection, label: string): RTCDataChannel {
    const dc = pc.createDataChannel(label, {
      ordered: true
    });

    dc.onopen = () => {
      console.log(`Data channel ${label} opened`);
      this.dataChannels.set(label, dc);
    };

    dc.onclose = () => {
      console.log(`Data channel ${label} closed`);
      this.dataChannels.delete(label);
    };

    dc.onerror = (error) => {
      console.error(`Data channel ${label} error:`, error);
    };

    return dc;
  }

  /**
   * Gets connection ID from peer connection
   */
  private getConnectionId(pc: RTCPeerConnection): string {
    for (const [id, conn] of this.connections.entries()) {
      if (conn === pc) {
        return id;
      }
    }
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stores a connection
   */
  storeConnection(id: string, pc: RTCPeerConnection): void {
    this.connections.set(id, pc);
  }

  /**
   * Gets a connection by ID
   */
  getConnection(id: string): RTCPeerConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Closes and removes a connection
   */
  closeConnection(id: string): void {
    const pc = this.connections.get(id);
    if (pc) {
      pc.close();
      this.connections.delete(id);
    }
    const dc = this.dataChannels.get(id);
    if (dc) {
      dc.close();
      this.dataChannels.delete(id);
    }
  }

  /**
   * Closes all connections
   */
  closeAll(): void {
    this.connections.forEach((pc, id) => {
      this.closeConnection(id);
    });
  }
}

/**
 * LAPA Swarm Session Manager
 * 
 * Manages collaborative swarm sessions with WebRTC for multi-user agent coordination.
 */
export class SwarmSessionManager {
  private sessions: Map<string, SwarmSession> = new Map();
  private webrtcManager: WebRTCConnectionManager;
  private consensusVoting: ConsensusVotingSystem;
  private participantSessions: Map<string, string> = new Map(); // userId -> sessionId

  constructor(iceServers?: RTCIceServer[]) {
    this.webrtcManager = new WebRTCConnectionManager(iceServers);
    this.consensusVoting = new ConsensusVotingSystem();

    // Subscribe to WebRTC events
    eventBus.subscribe('webrtc.ice-candidate', async (event) => {
      await this.handleICECandidate(event.payload as { candidate: RTCIceCandidate; connectionId: string });
    });

    eventBus.subscribe('webrtc.connection-state', async (event) => {
      await this.handleConnectionStateChange(event.payload as { connectionId: string; state: string });
    });

    // Subscribe to A2A events for integration
    eventBus.subscribe('a2a.handshake.response', async (event) => {
      await this.handleA2AHandshakeResponse(event.payload as A2AHandshakeResponse);
    });
  }

  /**
   * Creates a new swarm session
   */
  async createSession(config: SessionConfig): Promise<string> {
    try {
      // Validate config with Zod
      const validatedConfig = sessionConfigSchema.parse(config);

      const session: SwarmSession = {
        sessionId: validatedConfig.sessionId,
        hostUserId: validatedConfig.hostUserId,
        participants: new Map(),
        status: 'initializing',
        createdAt: new Date(),
        lastActivity: new Date(),
        config: validatedConfig,
        activeTasks: new Map(),
        vetoSessions: new Map(),
        a2aHandshakes: new Map()
      };

      // Add host as first participant
      const hostParticipant: SessionParticipant = {
        userId: validatedConfig.hostUserId,
        displayName: `Host-${validatedConfig.hostUserId}`,
        joinedAt: new Date(),
        isHost: true,
        capabilities: [],
        connectionState: 'connected'
      };

      session.participants.set(validatedConfig.hostUserId, hostParticipant);
      this.participantSessions.set(validatedConfig.hostUserId, validatedConfig.sessionId);
      this.sessions.set(validatedConfig.sessionId, session);

      // Publish session created event
      await eventBus.publish({
        id: `session-created-${validatedConfig.sessionId}`,
        type: 'swarm.session.created',
        timestamp: Date.now(),
        source: 'swarm-session-manager',
        payload: {
          sessionId: validatedConfig.sessionId,
          hostUserId: validatedConfig.hostUserId
        }
      });

      session.status = 'active';
      console.log(`Created swarm session: ${validatedConfig.sessionId}`);

      return validatedConfig.sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Joins an existing session
   */
  async joinSession(sessionId: string, userId: string, displayName: string, agentId?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session ${sessionId} is not active`);
    }

    if (session.participants.size >= session.config.maxParticipants) {
      throw new Error(`Session ${sessionId} is full`);
    }

    // Check if user is already in session
    if (session.participants.has(userId)) {
      console.log(`User ${userId} is already in session ${sessionId}`);
      return true;
    }

    // Create WebRTC peer connection for this participant
    const pc = this.webrtcManager.createPeerConnection(session.config.webrtcConfig);
    const connectionId = `conn-${sessionId}-${userId}`;
    this.webrtcManager.storeConnection(connectionId, pc);

    // Create data channel for messaging
    const dataChannel = this.webrtcManager.createDataChannel(pc, `session-${sessionId}`);

    // Set up data channel message handler
    dataChannel.onmessage = (event) => {
      try {
        const message: SessionMessage = JSON.parse(event.data);
        this.handleSessionMessage(sessionId, message);
      } catch (error) {
        console.error('Error handling data channel message:', error);
      }
    };

    // Create participant
    const participant: SessionParticipant = {
      userId,
      agentId,
      displayName,
      joinedAt: new Date(),
      isHost: false,
      capabilities: agentId ? await this.getAgentCapabilities(agentId) : [],
      connectionState: 'connecting',
      peerConnection: pc,
      dataChannel
    };

    session.participants.set(userId, participant);
    this.participantSessions.set(userId, sessionId);
    session.lastActivity = new Date();

    // Establish WebRTC connection with other participants
    await this.establishWebRTCConnections(session, participant);

    // Publish join event
    await eventBus.publish({
      id: `session-join-${sessionId}-${userId}`,
      type: 'swarm.session.participant.joined',
      timestamp: Date.now(),
      source: 'swarm-session-manager',
      payload: {
        sessionId,
        userId,
        agentId,
        displayName
      }
    });

    console.log(`User ${userId} joined session ${sessionId}`);
    return true;
  }

  /**
   * Leaves a session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const participant = session.participants.get(userId);
    if (!participant) {
      return; // Already left
    }

    // Close WebRTC connections
    if (participant.peerConnection) {
      const connectionId = `conn-${sessionId}-${userId}`;
      this.webrtcManager.closeConnection(connectionId);
    }

    // Remove participant
    session.participants.delete(userId);
    this.participantSessions.delete(userId);
    session.lastActivity = new Date();

    // If host left, transfer host or close session
    if (participant.isHost && session.participants.size > 0) {
      // Transfer host to first remaining participant
      const newHost = Array.from(session.participants.values())[0];
      newHost.isHost = true;
      session.hostUserId = newHost.userId;
    } else if (session.participants.size === 0) {
      // Close session if empty
      await this.closeSession(sessionId);
      return;
    }

    // Publish leave event
    await eventBus.publish({
      id: `session-leave-${sessionId}-${userId}`,
      type: 'swarm.session.participant.left',
      timestamp: Date.now(),
      source: 'swarm-session-manager',
      payload: {
        sessionId,
        userId
      }
    });

    console.log(`User ${userId} left session ${sessionId}`);
  }

  /**
   * Requests a veto on a task
   */
  async requestVeto(sessionId: string, taskId: string, requestedBy: string, reason: string): Promise<VetoResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.config.enableVetoes) {
      return {
        vetoId: `veto-${Date.now()}`,
        accepted: false,
        reason: 'Vetoes are disabled for this session'
      };
    }

    const task = session.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in session`);
    }

    const vetoId = `veto-${sessionId}-${taskId}-${Date.now()}`;
    const vetoRequest: VetoRequest = {
      vetoId,
      sessionId,
      taskId,
      requestedBy,
      reason,
      timestamp: new Date()
    };

    // Create voting session for veto consensus
    const voteOptions: VoteOption[] = [
      { id: 'accept-veto', label: 'Accept Veto', value: true },
      { id: 'reject-veto', label: 'Reject Veto', value: false }
    ];

    const votingSessionId = this.consensusVoting.createVotingSession(
      `Veto request for task ${taskId}: ${reason}`,
      voteOptions,
      Math.ceil(session.participants.size / 2) // Quorum: majority
    );

    session.vetoSessions.set(taskId, votingSessionId);

    // Broadcast veto request to all participants
    await this.broadcastMessage(session, {
      type: 'veto',
      sessionId,
      from: requestedBy,
      payload: vetoRequest,
      timestamp: Date.now()
    });

    // Collect votes from all participants (except requester)
    const participants = Array.from(session.participants.values());
    for (const participant of participants) {
      if (participant.userId !== requestedBy && participant.agentId) {
        // Auto-vote based on agent decision (in real implementation, this would be async)
        // For now, we'll simulate voting
        const voteOption = Math.random() > 0.3 ? 'accept-veto' : 'reject-veto';
        this.consensusVoting.castVote(votingSessionId, participant.agentId, voteOption, `Agent decision for veto ${vetoId}`);
      }
    }

    // Close voting session and get result
    const consensusResult = this.consensusVoting.closeVotingSession(votingSessionId, 'simple-majority');

    const accepted = consensusResult.consensusReached && 
                    consensusResult.winningOption?.id === 'accept-veto';

    // If veto accepted, pause/cancel the task
    if (accepted) {
      // Remove task from active tasks
      session.activeTasks.delete(taskId);
      
      // Publish task vetoed event
      await eventBus.publish({
        id: `task-vetoed-${taskId}`,
        type: 'swarm.task.vetoed',
        timestamp: Date.now(),
        source: 'swarm-session-manager',
        payload: {
          sessionId,
          taskId,
          vetoId,
          requestedBy,
          reason
        }
      });
    }

    return {
      vetoId,
      accepted,
      votingSessionId,
      consensusResult,
      reason: accepted ? 'Veto accepted by consensus' : 'Veto rejected by consensus'
    };
  }

  /**
   * Initiates A2A handshake between agents in session
   */
  async initiateA2AHandshake(
    sessionId: string,
    sourceAgentId: string,
    targetAgentId: string,
    task: Task
  ): Promise<A2AHandshakeResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.config.enableA2A) {
      return {
        success: false,
        accepted: false,
        error: 'A2A is disabled for this session'
      };
    }

    // Find participants with these agent IDs
    const sourceParticipant = Array.from(session.participants.values())
      .find(p => p.agentId === sourceAgentId);
    const targetParticipant = Array.from(session.participants.values())
      .find(p => p.agentId === targetAgentId);

    if (!sourceParticipant || !targetParticipant) {
      return {
        success: false,
        accepted: false,
        error: 'Source or target agent not found in session'
      };
    }

    // Create A2A handshake request
    const handshakeRequest: A2AHandshakeRequest = {
      sourceAgentId,
      targetAgentId,
      capabilities: sourceParticipant.capabilities,
      protocolVersion: '1.0',
      taskId: task.id,
      taskDescription: task.description,
      context: {
        sessionId,
        task
      },
      priority: 'medium'
    };

    // Initiate handshake via A2A mediator
    const handshakeResponse = await a2aMediator.initiateHandshake(handshakeRequest);

    // Store handshake ID
    if (handshakeResponse.handshakeId) {
      const agentPair = `${sourceAgentId}-${targetAgentId}`;
      session.a2aHandshakes.set(agentPair, handshakeResponse.handshakeId);
    }

    // Broadcast A2A handshake event to session
    await this.broadcastMessage(session, {
      type: 'a2a',
      sessionId,
      from: sourceAgentId,
      to: targetAgentId,
      payload: {
        handshakeRequest,
        handshakeResponse
      },
      timestamp: Date.now()
    });

    return handshakeResponse;
  }

  /**
   * Adds a task to the session
   */
  async addTask(sessionId: string, task: Task): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.activeTasks.set(task.id, task);
    session.lastActivity = new Date();

    // Broadcast task addition
    await this.broadcastMessage(session, {
      type: 'task',
      sessionId,
      from: 'system',
      payload: {
        action: 'added',
        task
      },
      timestamp: Date.now()
    });

    console.log(`Task ${task.id} added to session ${sessionId}`);
  }

  /**
   * Gets session information
   */
  getSession(sessionId: string): SwarmSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets all active sessions
   */
  getAllSessions(): SwarmSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Closes a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Close all WebRTC connections
    for (const participant of session.participants.values()) {
      if (participant.peerConnection) {
        const connectionId = `conn-${sessionId}-${participant.userId}`;
        this.webrtcManager.closeConnection(connectionId);
      }
    }

    // Remove participant session mappings
    for (const userId of session.participants.keys()) {
      this.participantSessions.delete(userId);
    }

    session.status = 'closed';
    this.sessions.delete(sessionId);

    // Publish session closed event
    await eventBus.publish({
      id: `session-closed-${sessionId}`,
      type: 'swarm.session.closed',
      timestamp: Date.now(),
      source: 'swarm-session-manager',
      payload: {
        sessionId
      }
    });

    console.log(`Session ${sessionId} closed`);
  }

  /**
   * Establishes WebRTC connections with other participants
   */
  private async establishWebRTCConnections(
    session: SwarmSession,
    newParticipant: SessionParticipant
  ): Promise<void> {
    // In a full implementation, this would:
    // 1. Create offer/answer SDP
    // 2. Exchange ICE candidates
    // 3. Establish peer-to-peer connections with all other participants
    
    // For now, we'll mark as connected after a brief delay
    setTimeout(() => {
      newParticipant.connectionState = 'connected';
    }, 100);
  }

  /**
   * Handles session messages from WebRTC data channel
   */
  private async handleSessionMessage(sessionId: string, message: SessionMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    switch (message.type) {
      case 'task':
        // Handle task-related messages
        await this.handleTaskMessage(session, message);
        break;
      case 'veto':
        // Handle veto messages
        await this.handleVetoMessage(session, message);
        break;
      case 'a2a':
        // Handle A2A messages
        await this.handleA2AMessage(session, message);
        break;
      case 'state':
        // Handle state synchronization
        await this.handleStateMessage(session, message);
        break;
      case 'handoff':
        // Handle handoff messages
        await this.handleHandoffMessage(session, message);
        break;
      case 'heartbeat':
        // Update last activity
        session.lastActivity = new Date();
        break;
    }
  }

  /**
   * Broadcasts a message to all participants
   */
  private async broadcastMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    for (const participant of session.participants.values()) {
      if (participant.dataChannel && participant.dataChannel.readyState === 'open') {
        try {
          participant.dataChannel.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error sending message to ${participant.userId}:`, error);
        }
      }
    }
  }

  /**
   * Handles ICE candidate events
   */
  private async handleICECandidate(payload: { candidate: RTCIceCandidate; connectionId: string }): Promise<void> {
    // In full implementation, forward ICE candidate to remote peer
    console.log(`ICE candidate received for connection ${payload.connectionId}`);
  }

  /**
   * Handles connection state changes
   */
  private async handleConnectionStateChange(payload: { connectionId: string; state: string }): Promise<void> {
    // Update participant connection state
    console.log(`Connection ${payload.connectionId} state: ${payload.state}`);
  }

  /**
   * Handles A2A handshake response
   */
  private async handleA2AHandshakeResponse(response: A2AHandshakeResponse): Promise<void> {
    // Update session A2A handshake state
    console.log(`A2A handshake response: ${response.handshakeId}, accepted: ${response.accepted}`);
  }

  /**
   * Gets agent capabilities
   */
  private async getAgentCapabilities(agentId: string): Promise<string[]> {
    // In full implementation, query agent registry for capabilities
    return ['general', 'coding', 'testing'];
  }

  /**
   * Handles task messages
   */
  private async handleTaskMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle task-related operations
    console.log(`Task message in session ${session.sessionId}:`, message.payload);
  }

  /**
   * Handles veto messages
   */
  private async handleVetoMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle veto operations
    console.log(`Veto message in session ${session.sessionId}:`, message.payload);
  }

  /**
   * Handles A2A messages
   */
  private async handleA2AMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle A2A operations
    console.log(`A2A message in session ${session.sessionId}:`, message.payload);
  }

  /**
   * Handles state messages
   */
  private async handleStateMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle state synchronization
    console.log(`State message in session ${session.sessionId}:`, message.payload);
  }

  /**
   * Handles handoff messages
   */
  private async handleHandoffMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle handoff operations
    console.log(`Handoff message in session ${session.sessionId}:`, message.payload);
  }
}

// Export singleton instance
export const swarmSessionManager = new SwarmSessionManager();

/**
 * Convenience function for creating a session
 */
export async function createSwarmSession(config: SessionConfig): Promise<string> {
  return await swarmSessionManager.createSession(config);
}

/**
 * Convenience function for joining a session
 */
export async function joinSwarmSession(
  sessionId: string,
  userId: string,
  displayName: string,
  agentId?: string
): Promise<boolean> {
  return await swarmSessionManager.joinSession(sessionId, userId, displayName, agentId);
}

/**
 * Convenience function for requesting a veto
 */
export async function requestVeto(
  sessionId: string,
  taskId: string,
  requestedBy: string,
  reason: string
): Promise<VetoResponse> {
  return await swarmSessionManager.requestVeto(sessionId, taskId, requestedBy, reason);
}

/**
 * Convenience function for initiating A2A handshake in session
 */
export async function initiateSessionA2AHandshake(
  sessionId: string,
  sourceAgentId: string,
  targetAgentId: string,
  task: Task
): Promise<A2AHandshakeResponse> {
  return await swarmSessionManager.initiateA2AHandshake(sessionId, sourceAgentId, targetAgentId, task);
}

