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
import { a2aMediator, A2AHandshakeRequest, A2AHandshakeResponse, A2ATaskNegotiationRequest, A2ATaskNegotiationResponse } from '../orchestrator/a2a-mediator.ts';
import { rbacSystem } from '../security/rbac.ts';
import { ConsensusVotingSystem, VoteOption, ConsensusResult } from './consensus.voting.ts';
import { Task } from '../agents/moe-router.ts';
import { ContextHandoffRequest } from './context.handoff.ts';
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
  }).optional(),
  signalingConfig: z.object({
    serverUrl: z.string().optional(),
    enableSignaling: z.boolean().optional(),
    fallbackToDirect: z.boolean().optional()
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
  isAuthenticated?: boolean; // Authentication status for the participant
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
  signalingConfig?: {
    serverUrl?: string;
    enableSignaling?: boolean;
    fallbackToDirect?: boolean;
  };
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

// Signaling client for WebRTC signaling server
class SignalingClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private participantId: string;
  private sessionId: string;
  private signalingServerUrl: string;

  constructor(signalingServerUrl: string, participantId: string, sessionId: string) {
    this.signalingServerUrl = signalingServerUrl;
    this.participantId = participantId;
    this.sessionId = sessionId;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${this.signalingServerUrl}?participantId=${this.participantId}&sessionId=${this.sessionId}`);
        
        this.socket.onopen = () => {
          console.log(`Signaling client connected to ${this.signalingServerUrl}`);
          this.isConnected = true;
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing signaling message:', error);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('Signaling client error:', error);
          reject(error);
        };
        
        this.socket.onclose = () => {
          console.log('Signaling client disconnected');
          this.isConnected = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.isConnected = false;
    }
  }

  sendMessage(type: string, to: string, payload?: any): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Signaling client not connected');
    }
    
    const message = {
      type,
      from: this.participantId,
      to,
      sessionId: this.sessionId,
      payload,
      timestamp: Date.now()
    };
    
    this.socket.send(JSON.stringify(message));
  }

  onMessage(type: string, handler: (message: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  private handleMessage(message: any): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// WebRTC connection manager
class WebRTCConnectionManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private iceServers: RTCIceServer[];
  private signalingClient: SignalingClient | null = null;
  private useSignalingServer = false;
  private signalingServerUrl = '';
  private participantId = '';
  private sessionId = '';

  constructor(iceServers?: RTCIceServer[], signalingServerUrl?: string) {
    // Default STUN/TURN servers for WebRTC
    this.iceServers = iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    
    // Set up signaling server if provided
    if (signalingServerUrl) {
      this.useSignalingServer = true;
      this.signalingServerUrl = signalingServerUrl;
    }
  }

  /**
   * Creates a new WebRTC peer connection
   */
  createPeerConnection(config?: RTCConfiguration, sessionId?: string, fromUserId?: string, toUserId?: string): RTCPeerConnection {
    const pcConfig: RTCConfiguration = {
      iceServers: this.iceServers,
      ...config
    };

    const pc = new RTCPeerConnection(pcConfig);
    
    // Set up ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (this.useSignalingServer && this.signalingClient && this.signalingClient.getIsConnected()) {
          // Send ICE candidate via signaling server
          this.signalingClient.sendMessage('ice-candidate', toUserId || '', {
            candidate: event.candidate,
            connectionId: this.getConnectionId(pc),
            sessionId,
            fromUserId,
            toUserId
          });
        } else {
          // Fallback to event bus
          eventBus.publish({
            id: `ice-candidate-${Date.now()}`,
            type: 'webrtc.ice-candidate',
            timestamp: Date.now(),
            source: 'webrtc-manager',
            payload: {
              candidate: event.candidate,
              connectionId: this.getConnectionId(pc),
              sessionId,
              fromUserId,
              toUserId
            }
          });
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (this.useSignalingServer && this.signalingClient && this.signalingClient.getIsConnected()) {
        // Send connection state via signaling server
        this.signalingClient.sendMessage('connection-state', toUserId || '', {
          connectionId: this.getConnectionId(pc),
          state,
          sessionId,
          userId: fromUserId || toUserId
        });
      } else {
        // Fallback to event bus
        eventBus.publish({
          id: `connection-state-${Date.now()}`,
          type: 'webrtc.connection-state',
          timestamp: Date.now(),
          source: 'webrtc-manager',
          payload: {
            connectionId: this.getConnectionId(pc),
            state,
            sessionId,
            userId: fromUserId || toUserId
          }
        });
      }
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
    
    // Disconnect signaling client if connected
    if (this.signalingClient) {
      this.signalingClient.disconnect();
    }
  }
  
  /**
   * Initializes signaling client
   */
  async initializeSignaling(participantId: string, sessionId: string): Promise<void> {
    if (!this.useSignalingServer) {
      return;
    }
    
    this.participantId = participantId;
    this.sessionId = sessionId;
    
    this.signalingClient = new SignalingClient(this.signalingServerUrl, participantId, sessionId);
    
    try {
      await this.signalingClient.connect();
      
      // Set up signaling message handlers
      this.signalingClient.onMessage('sdp-offer', (message) => {
        this.handleSDPOfferViaSignaling(message);
      });
      
      this.signalingClient.onMessage('sdp-answer', (message) => {
        this.handleSDPAnswerViaSignaling(message);
      });
      
      this.signalingClient.onMessage('ice-candidate', (message) => {
        this.handleICECandidateViaSignaling(message);
      });
      
      console.log('Signaling client initialized');
    } catch (error) {
      console.error('Failed to initialize signaling client:', error);
      // Fall back to direct event bus communication
      this.useSignalingServer = false;
    }
  }
  
  /**
   * Handles SDP offer via signaling server
   */
  private async handleSDPOfferViaSignaling(message: any): Promise<void> {
    // This will be called by the SwarmSessionManager when it receives an SDP offer
    // via the signaling server instead of the event bus
    await eventBus.publish({
      id: `sdp-offer-${message.payload.connectionId}`,
      type: 'webrtc.sdp-offer',
      timestamp: Date.now(),
      source: 'webrtc-manager-signaling',
      payload: message.payload
    });
  }
  
  /**
   * Handles SDP answer via signaling server
   */
  private async handleSDPAnswerViaSignaling(message: any): Promise<void> {
    // This will be called by the SwarmSessionManager when it receives an SDP answer
    // via the signaling server instead of the event bus
    await eventBus.publish({
      id: `sdp-answer-${message.payload.connectionId}`,
      type: 'webrtc.sdp-answer',
      timestamp: Date.now(),
      source: 'webrtc-manager-signaling',
      payload: message.payload
    });
  }
  
  /**
   * Handles ICE candidate via signaling server
   */
  private async handleICECandidateViaSignaling(message: any): Promise<void> {
    // This will be called by the SwarmSessionManager when it receives an ICE candidate
    // via the signaling server instead of the event bus
    await eventBus.publish({
      id: `ice-candidate-${Date.now()}`,
      type: 'webrtc.ice-candidate',
      timestamp: Date.now(),
      source: 'webrtc-manager-signaling',
      payload: message.payload
    });
  }
  
  /**
   * Sends SDP offer via signaling server
   */
  async sendSDPOfferViaSignaling(toUserId: string, connectionId: string, offer: RTCSessionDescriptionInit, sessionId: string): Promise<void> {
    if (this.useSignalingServer && this.signalingClient && this.signalingClient.getIsConnected()) {
      this.signalingClient.sendMessage('sdp-offer', toUserId, {
        connectionId,
        offer,
        fromUserId: this.participantId,
        toUserId,
        sessionId
      });
    } else {
      // Fallback to event bus
      await eventBus.publish({
        id: `sdp-offer-${connectionId}`,
        type: 'webrtc.sdp-offer',
        timestamp: Date.now(),
        source: 'webrtc-manager',
        payload: {
          connectionId,
          offer,
          fromUserId: this.participantId,
          toUserId,
          sessionId
        }
      });
    }
  }
  
  /**
   * Sends SDP answer via signaling server
   */
  async sendSDPAnswerViaSignaling(toUserId: string, connectionId: string, answer: RTCSessionDescriptionInit, sessionId: string): Promise<void> {
    if (this.useSignalingServer && this.signalingClient && this.signalingClient.getIsConnected()) {
      this.signalingClient.sendMessage('sdp-answer', toUserId, {
        connectionId,
        answer,
        fromUserId: this.participantId,
        toUserId,
        sessionId
      });
    } else {
      // Fallback to event bus
      await eventBus.publish({
        id: `sdp-answer-${connectionId}`,
        type: 'webrtc.sdp-answer',
        timestamp: Date.now(),
        source: 'webrtc-manager',
        payload: {
          connectionId,
          answer,
          fromUserId: this.participantId,
          toUserId,
          sessionId
        }
      });
    }
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
  private signalingServerUrl: string | null = null;

  constructor(iceServers?: RTCIceServer[], signalingServerUrl?: string) {
    this.signalingServerUrl = signalingServerUrl || null;
    this.webrtcManager = new WebRTCConnectionManager(iceServers, signalingServerUrl);
    this.consensusVoting = new ConsensusVotingSystem();

    // Subscribe to WebRTC events
    eventBus.subscribe('webrtc.ice-candidate', async (event) => {
      await this.handleICECandidate(event.payload as {
        candidate: RTCIceCandidate;
        connectionId: string;
        fromUserId?: string;
        toUserId?: string;
        sessionId?: string;
      });
    });

    eventBus.subscribe('webrtc.connection-state', async (event) => {
      await this.handleConnectionStateChange(event.payload as {
        connectionId: string;
        state: string;
        sessionId?: string;
        userId?: string;
      });
    });

    // Subscribe to A2A events for integration
    eventBus.subscribe('a2a.handshake.response', async (event) => {
      await this.handleA2AHandshakeResponse(event.payload as A2AHandshakeResponse);
    });

    // Subscribe to WebRTC SDP events
    eventBus.subscribe('webrtc.sdp-offer', async (event) => {
      await this.handleSDPOffer(event.payload as {
        connectionId: string;
        offer: RTCSessionDescriptionInit;
        fromUserId: string;
        toUserId: string;
        sessionId: string;
      });
    });

    eventBus.subscribe('webrtc.sdp-answer', async (event) => {
      await this.handleSDPAnswer(event.payload as {
        connectionId: string;
        answer: RTCSessionDescriptionInit;
        fromUserId: string;
        toUserId: string;
        sessionId: string;
      });
    });
    
    // No need to subscribe to a special signaling event type
    // The WebRTCConnectionManager will route signaling server messages
    // to the existing event types ('webrtc.sdp-offer', 'webrtc.sdp-answer', 'webrtc.ice-candidate')
  }

  /**
   * Creates a new swarm session
   */
  async createSession(config: SessionConfig, userId: string): Promise<string> {
    try {
      // Validate config with Zod
      const validatedConfig = sessionConfigSchema.parse(config);

      // Check RBAC permission for session creation
      const accessCheck = await rbacSystem.checkAccess(
        userId,
        validatedConfig.sessionId,
        'session',
        'session.create'
      );

      if (!accessCheck.allowed) {
        throw new Error(`User ${userId} does not have permission to create session: ${accessCheck.reason}`);
      }

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

    // Check RBAC permission for joining session
    const accessCheck = await rbacSystem.checkAccess(
      userId,
      sessionId,
      'session',
      'session.join'
    );

    if (!accessCheck.allowed) {
      throw new Error(`User ${userId} does not have permission to join session: ${accessCheck.reason}`);
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
    
    // Initialize signaling client if signaling server is configured
    if (session.config.signalingConfig?.enableSignaling && session.config.signalingConfig?.serverUrl) {
      try {
        await this.webrtcManager.initializeSignaling(userId, sessionId);
      } catch (error) {
        console.error(`Failed to initialize signaling client for user ${userId}:`, error);
        // Continue without signaling - will fall back to direct communication
        // unless fallback is disabled
        if (!session.config.signalingConfig?.fallbackToDirect) {
          throw new Error(`Failed to initialize signaling client and fallback is disabled: ${error}`);
        }
      }
    }
    
    // Create WebRTC peer connection for this participant
    const pc = this.webrtcManager.createPeerConnection(session.config.webrtcConfig, sessionId, undefined, userId);
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
      dataChannel,
      isAuthenticated: true // Assuming authenticated through RBAC check
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

    // Check RBAC permission for leaving session
    const accessCheck = await rbacSystem.checkAccess(
      userId,
      sessionId,
      'session',
      'session.leave'
    );

    if (!accessCheck.allowed) {
      throw new Error(`User ${userId} does not have permission to leave session: ${accessCheck.reason}`);
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

    // Check RBAC permission for requesting veto
    const accessCheck = await rbacSystem.checkAccess(
      requestedBy,
      taskId,
      'task',
      'consensus.veto'
    );

    if (!accessCheck.allowed) {
      return {
        vetoId: `veto-${Date.now()}`,
        accepted: false,
        reason: `User ${requestedBy} does not have permission to request veto: ${accessCheck.reason}`
      };
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
   * Recovers persisted sessions from the memori engine
   */
  private async recoverPersistedSessions(): Promise<void> {
    try {
      // Import memoriEngine dynamically to avoid circular dependency issues
      const { memoriEngine } = await import('../local/memori-engine.ts');
      
      // Recover swarm sessions from persistence
      await memoriEngine.recoverSwarmSessions();
      
      console.log('Attempted to recover persisted swarm sessions');
    } catch (error) {
      console.error('Failed to recover persisted swarm sessions:', error);
    }
  }

  /**
   * Establishes WebRTC connections with other participants
   */
  private async establishWebRTCConnections(
    session: SwarmSession,
    newParticipant: SessionParticipant
  ): Promise<void> {
    // Create offers to all existing participants
    for (const [userId, participant] of session.participants.entries()) {
      // Skip the new participant and any participants without peer connections
      if (userId === newParticipant.userId || !participant.peerConnection) {
        continue;
      }
      
      // Create bidirectional connections
      // 1. Existing participant -> New participant
      try {
        const offer = await participant.peerConnection.createOffer();
        await participant.peerConnection.setLocalDescription(offer);
        
        // Send offer through signaling server or event bus
        const connectionId = `conn-${session.sessionId}-${participant.userId}-${newParticipant.userId}`;
        await this.webrtcManager.sendSDPOfferViaSignaling(
          newParticipant.userId,
          connectionId,
          offer,
          session.sessionId
        );
        
        console.log(`SDP offer sent from ${participant.userId} to ${newParticipant.userId}`);
      } catch (error) {
        console.error(`Error creating SDP offer from ${participant.userId} to ${newParticipant.userId}:`, error);
      }
      
      // 2. New participant -> Existing participant
      if (newParticipant.peerConnection) {
        try {
          // Create peer connection for reverse direction
          const reversePC = this.webrtcManager.createPeerConnection(
            session.config.webrtcConfig,
            session.sessionId,
            newParticipant.userId,
            participant.userId
          );
          const reverseConnectionId = `conn-${session.sessionId}-${newParticipant.userId}-${participant.userId}`;
          this.webrtcManager.storeConnection(reverseConnectionId, reversePC);
          
          const offer = await reversePC.createOffer();
          await reversePC.setLocalDescription(offer);
          
          // Send offer through signaling server or event bus
          await this.webrtcManager.sendSDPOfferViaSignaling(
            participant.userId,
            reverseConnectionId,
            offer,
            session.sessionId
          );
          
          console.log(`SDP offer sent from ${newParticipant.userId} to ${participant.userId}`);
        } catch (error) {
          console.error(`Error creating SDP offer from ${newParticipant.userId} to ${participant.userId}:`, error);
        }
      }
    }
    
    // Update connection state
    newParticipant.connectionState = 'connecting';
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
  private async handleICECandidate(payload: {
    candidate: RTCIceCandidate;
    connectionId: string;
    fromUserId?: string;
    toUserId?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      // If we have session and user information, forward to specific peer
      if (payload.sessionId && payload.fromUserId && payload.toUserId) {
        const session = this.sessions.get(payload.sessionId);
        if (!session) {
          console.error(`Session ${payload.sessionId} not found for ICE candidate`);
          return;
        }

        const participant = session.participants.get(payload.toUserId);
        if (!participant || !participant.peerConnection) {
          console.error(`Participant ${payload.toUserId} not found or has no peer connection for ICE candidate`);
          return;
        }

        // Forward ICE candidate to remote peer
        await participant.peerConnection.addIceCandidate(payload.candidate);
        console.log(`ICE candidate forwarded from ${payload.fromUserId} to ${payload.toUserId}`);
      } else {
        // Legacy handling for candidates without session/user info
        console.log(`ICE candidate received for connection ${payload.connectionId}`);
      }
    } catch (error) {
      console.error(`Error handling ICE candidate for connection ${payload.connectionId}:`, error);
    }
  }

  /**
   * Handles connection state changes
   */
  private async handleConnectionStateChange(payload: {
    connectionId: string;
    state: string;
    sessionId?: string;
    userId?: string;
  }): Promise<void> {
    try {
      // If we have session and user information, update participant connection state
      if (payload.sessionId && payload.userId) {
        const session = this.sessions.get(payload.sessionId);
        if (!session) {
          console.error(`Session ${payload.sessionId} not found for connection state change`);
          return;
        }

        const participant = session.participants.get(payload.userId);
        if (!participant) {
          console.error(`Participant ${payload.userId} not found for connection state change`);
          return;
        }

        // Update participant connection state
        participant.connectionState = payload.state as 'connecting' | 'connected' | 'disconnected' | 'failed';
        console.log(`Connection state for ${payload.userId} in session ${payload.sessionId}: ${payload.state}`);
      } else {
        // Legacy handling for state changes without session/user info
        console.log(`Connection ${payload.connectionId} state: ${payload.state}`);
      }
    } catch (error) {
      console.error(`Error handling connection state change for connection ${payload.connectionId}:`, error);
    }
  }

  /**
   * Handles A2A handshake response
   */
  private async handleA2AHandshakeResponse(response: A2AHandshakeResponse): Promise<void> {
    // Update session A2A handshake state
    console.log(`A2A handshake response: ${response.handshakeId}, accepted: ${response.accepted}`);
  }

  /**
   * Handles SDP offer from remote peer
   */
  private async handleSDPOffer(payload: {
    connectionId: string;
    offer: RTCSessionDescriptionInit;
    fromUserId: string;
    toUserId: string;
    sessionId: string;
  }): Promise<void> {
    try {
      const session = this.sessions.get(payload.sessionId);
      if (!session) {
        console.error(`Session ${payload.sessionId} not found for SDP offer`);
        return;
      }
      
      const participant = session.participants.get(payload.toUserId);
      if (!participant || !participant.peerConnection) {
        console.error(`Participant ${payload.toUserId} not found or has no peer connection for SDP offer`);
        return;
      }
      
      // Set remote description
      await participant.peerConnection.setRemoteDescription(payload.offer);
      
      // Create answer
      const answer = await participant.peerConnection.createAnswer();
      await participant.peerConnection.setLocalDescription(answer);
      
      // Send answer through signaling server or event bus
      await this.webrtcManager.sendSDPAnswerViaSignaling(
        payload.fromUserId,
        payload.connectionId,
        answer,
        payload.sessionId
      );
      
      console.log(`SDP answer sent from ${payload.toUserId} to ${payload.fromUserId}`);
    } catch (error) {
      console.error(`Error handling SDP offer for connection ${payload.connectionId}:`, error);
    }
  }

  /**
   * Handles SDP answer from remote peer
   */
  private async handleSDPAnswer(payload: {
    connectionId: string;
    answer: RTCSessionDescriptionInit;
    fromUserId: string;
    toUserId: string;
    sessionId: string;
  }): Promise<void> {
    try {
      const session = this.sessions.get(payload.sessionId);
      if (!session) {
        console.error(`Session ${payload.sessionId} not found for SDP answer`);
        return;
      }

      const participant = session.participants.get(payload.toUserId);
      if (!participant || !participant.peerConnection) {
        console.error(`Participant ${payload.toUserId} not found or has no peer connection for SDP answer`);
        return;
      }

      // Set remote description
      await participant.peerConnection.setRemoteDescription(payload.answer);

      console.log(`SDP answer received from ${payload.fromUserId} by ${payload.toUserId}`);
    } catch (error) {
      console.error(`Error handling SDP answer for connection ${payload.connectionId}:`, error);
    }
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
    const payload = message.payload as { action: string; task: Task };
    
    switch (payload.action) {
      case 'added':
        // Add task to session
        session.activeTasks.set(payload.task.id, payload.task);
        session.lastActivity = new Date();
        console.log(`Task ${payload.task.id} added to session ${session.sessionId}`);
        break;
        
      case 'updated':
        // Update existing task
        if (session.activeTasks.has(payload.task.id)) {
          session.activeTasks.set(payload.task.id, payload.task);
          session.lastActivity = new Date();
          console.log(`Task ${payload.task.id} updated in session ${session.sessionId}`);
        }
        break;
        
      case 'removed':
        // Remove task from session
        session.activeTasks.delete(payload.task.id);
        session.lastActivity = new Date();
        console.log(`Task ${payload.task.id} removed from session ${session.sessionId}`);
        break;
        
      case 'completed':
        // Mark task as completed
        const task = session.activeTasks.get(payload.task.id);
        if (task) {
          // In a real implementation, we might want to move completed tasks to a separate collection
          session.activeTasks.delete(payload.task.id);
          session.lastActivity = new Date();
          
          // Publish task completion event
          await eventBus.publish({
            id: `task-completed-${payload.task.id}`,
            type: 'swarm.task.completed',
            timestamp: Date.now(),
            source: 'swarm-session-manager',
            payload: {
              sessionId: session.sessionId,
              taskId: payload.task.id,
              task: payload.task
            }
          });
          
          console.log(`Task ${payload.task.id} completed in session ${session.sessionId}`);
        }
        break;
        
      default:
        console.warn(`Unknown task action: ${payload.action} in session ${session.sessionId}`);
    }
  }

  /**
   * Handles veto messages
   */
  private async handleVetoMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle veto operations
    const payload = message.payload as VetoRequest;
    
    // Check if vetoes are enabled for this session
    if (!session.config.enableVetoes) {
      console.log(`Vetoes are disabled for session ${session.sessionId}`);
      return;
    }
    
    // Validate task exists
    const task = session.activeTasks.get(payload.taskId);
    if (!task) {
      console.warn(`Task ${payload.taskId} not found for veto in session ${session.sessionId}`);
      return;
    }
    
    // Check if a veto session already exists for this task
    const existingVotingSessionId = session.vetoSessions.get(payload.taskId);
    if (existingVotingSessionId) {
      console.log(`Veto already in progress for task ${payload.taskId} in session ${session.sessionId}`);
      return;
    }
    
    // Create voting session for veto consensus
    const voteOptions: VoteOption[] = [
      { id: 'accept-veto', label: 'Accept Veto', value: true },
      { id: 'reject-veto', label: 'Reject Veto', value: false }
    ];
    
    const votingSessionId = this.consensusVoting.createVotingSession(
      `Veto request for task ${payload.taskId}: ${payload.reason}`,
      voteOptions,
      Math.ceil(session.participants.size / 2) // Quorum: majority
    );
    
    session.vetoSessions.set(payload.taskId, votingSessionId);
    
    // Collect votes from all participants (except requester)
    const participants = Array.from(session.participants.values());
    for (const participant of participants) {
      if (participant.userId !== payload.requestedBy && participant.agentId) {
        // In a real implementation, this would be asynchronous with actual agent decisions
        // For now, we'll simulate voting with a random decision
        const voteOption = Math.random() > 0.3 ? 'accept-veto' : 'reject-veto';
        this.consensusVoting.castVote(votingSessionId, participant.agentId, voteOption, `Agent decision for veto ${payload.vetoId}`);
      }
    }
    
    // Close voting session and get result
    const consensusResult = this.consensusVoting.closeVotingSession(votingSessionId, 'simple-majority');
    
    const accepted = consensusResult.consensusReached &&
                    consensusResult.winningOption?.id === 'accept-veto';
    
    // If veto accepted, pause/cancel the task
    if (accepted) {
      // Remove task from active tasks
      session.activeTasks.delete(payload.taskId);
      
      // Publish task vetoed event
      await eventBus.publish({
        id: `task-vetoed-${payload.taskId}`,
        type: 'swarm.task.vetoed',
        timestamp: Date.now(),
        source: 'swarm-session-manager',
        payload: {
          sessionId: session.sessionId,
          taskId: payload.taskId,
          vetoId: payload.vetoId,
          requestedBy: payload.requestedBy,
          reason: payload.reason
        }
      });
      
      console.log(`Veto accepted for task ${payload.taskId} in session ${session.sessionId}`);
    } else {
      console.log(`Veto rejected for task ${payload.taskId} in session ${session.sessionId}`);
    }
    
    // Clean up veto session
    session.vetoSessions.delete(payload.taskId);
  }

  /**
   * Handles A2A messages
   */
  private async handleA2AMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle A2A operations
    const payload = message.payload as {
      handshakeRequest?: A2AHandshakeRequest;
      handshakeResponse?: A2AHandshakeResponse;
      taskNegotiationRequest?: A2ATaskNegotiationRequest;
      taskNegotiationResponse?: A2ATaskNegotiationResponse;
    };
    
    // Check if A2A is enabled for this session
    if (!session.config.enableA2A) {
      console.log(`A2A is disabled for session ${session.sessionId}`);
      return;
    }
    
    // Handle different A2A message types
    if (payload.handshakeRequest) {
      // Process incoming handshake request
      console.log(`Processing A2A handshake request in session ${session.sessionId}`);
      
      // In a real implementation, we would validate the request and potentially
      // prompt the user or automatically respond based on configuration
      
      // For now, we'll simulate accepting the handshake
      const response: A2AHandshakeResponse = {
        success: true,
        accepted: true,
        handshakeId: payload.handshakeRequest.sourceAgentId + '-' + payload.handshakeRequest.targetAgentId + '-' + Date.now(),
        capabilities: ['general', 'coding', 'testing'], // Simulated capabilities
        protocolVersion: '1.0'
      };
      
      // Send response back through the session
      await this.broadcastMessage(session, {
        type: 'a2a',
        sessionId: session.sessionId,
        from: payload.handshakeRequest.targetAgentId,
        to: payload.handshakeRequest.sourceAgentId,
        payload: {
          handshakeResponse: response
        },
        timestamp: Date.now()
      });
    } else if (payload.handshakeResponse) {
      // Process incoming handshake response
      console.log(`Processing A2A handshake response in session ${session.sessionId}`);
      
      // Store handshake result in session
      if (payload.handshakeResponse.handshakeId) {
        const agentPair = `${payload.handshakeResponse.handshakeId.split('-')[1]}-${payload.handshakeResponse.handshakeId.split('-')[0]}`;
        session.a2aHandshakes.set(agentPair, payload.handshakeResponse.handshakeId);
      }
      
      // Handle handshake acceptance/rejection
      if (payload.handshakeResponse.accepted) {
        console.log(`A2A handshake accepted in session ${session.sessionId}`);
        // In a real implementation, we might update agent capabilities or connection status
      } else {
        console.log(`A2A handshake rejected in session ${session.sessionId}: ${payload.handshakeResponse.reason}`);
      }
    } else if (payload.taskNegotiationRequest) {
      // Process incoming task negotiation request
      console.log(`Processing A2A task negotiation request in session ${session.sessionId}`);
      
      // In a real implementation, we would evaluate the task and respond accordingly
      // For now, we'll simulate accepting the task
      const response: A2ATaskNegotiationResponse = {
        success: true,
        negotiationId: payload.taskNegotiationRequest.handshakeId + '-negotiation-' + Date.now(),
        accepted: true,
        estimatedLatency: 100 // Simulated latency
      };
      
      // Send response back through the session
      await this.broadcastMessage(session, {
        type: 'a2a',
        sessionId: session.sessionId,
        from: payload.taskNegotiationRequest.targetAgentId,
        to: payload.taskNegotiationRequest.sourceAgentId,
        payload: {
          taskNegotiationResponse: response
        },
        timestamp: Date.now()
      });
    } else if (payload.taskNegotiationResponse) {
      // Process incoming task negotiation response
      console.log(`Processing A2A task negotiation response in session ${session.sessionId}`);
      
      // Handle task negotiation acceptance/rejection
      if (payload.taskNegotiationResponse.accepted) {
        console.log(`A2A task negotiation accepted in session ${session.sessionId}`);
        // In a real implementation, we might proceed with task delegation
      } else {
        console.log(`A2A task negotiation rejected in session ${session.sessionId}`);
      }
    } else {
      console.warn(`Unknown A2A message type in session ${session.sessionId}`);
    }
  }

  /**
   * Handles state messages
   */
  private async handleStateMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle state synchronization
    const payload = message.payload as {
      type: 'full' | 'incremental';
      state: Partial<SwarmSession>;
      sender: string;
    };
    
    console.log(`Processing state message in session ${session.sessionId} from ${payload.sender}`);
    
    // Handle different state message types
    if (payload.type === 'full') {
      // Full state synchronization - update entire session state
      // Note: In a real implementation, we would be more selective about what state to synchronize
      // and would need to handle conflicts appropriately
      
      // Update session properties that are safe to synchronize
      if (payload.state.status) {
        session.status = payload.state.status;
      }
      
      if (payload.state.lastActivity) {
        session.lastActivity = payload.state.lastActivity;
      }
      
      console.log(`Full state synchronized for session ${session.sessionId}`);
    } else if (payload.type === 'incremental') {
      // Incremental state synchronization - update specific parts of state
      if (payload.state.lastActivity) {
        session.lastActivity = payload.state.lastActivity;
      }
      
      // Handle incremental updates to tasks
      if (payload.state.activeTasks) {
        for (const [taskId, task] of payload.state.activeTasks) {
          // In a real implementation, we would need to handle task conflicts and merging
          session.activeTasks.set(taskId, task);
        }
      }
      
      console.log(`Incremental state synchronized for session ${session.sessionId}`);
    } else {
      console.warn(`Unknown state message type: ${payload.type} in session ${session.sessionId}`);
    }
    
    // Update last activity timestamp
    session.lastActivity = new Date();
  }

  /**
   * Handles handoff messages
   */
  private async handleHandoffMessage(session: SwarmSession, message: SessionMessage): Promise<void> {
    // Handle handoff operations
    const payload = message.payload as {
      type: 'initiate' | 'complete' | 'cancel';
      handoffId?: string;
      request?: ContextHandoffRequest;
      targetAgentId?: string;
    };
    
    switch (payload.type) {
      case 'initiate':
        // Handle handoff initiation request
        if (payload.request) {
          console.log(`Initiating handoff in session ${session.sessionId}`);
          
          // In a real implementation, we would use the contextHandoffManager to initiate the handoff
          // For now, we'll just log the request and simulate a response
          
          const handoffId = `handoff-${payload.request.sourceAgentId}-${payload.request.targetAgentId}-${Date.now()}`;
          
          // Send acknowledgment back through the session
          await this.broadcastMessage(session, {
            type: 'handoff',
            sessionId: session.sessionId,
            from: 'system',
            to: payload.request.sourceAgentId,
            payload: {
              type: 'acknowledge',
              handoffId: handoffId
            },
            timestamp: Date.now()
          });
          
          console.log(`Handoff initiated: ${handoffId} in session ${session.sessionId}`);
        }
        break;
        
      case 'complete':
        // Handle handoff completion request
        if (payload.handoffId && payload.targetAgentId) {
          console.log(`Completing handoff ${payload.handoffId} in session ${session.sessionId}`);
          
          // In a real implementation, we would use the contextHandoffManager to complete the handoff
          // For now, we'll just log and simulate completion
          
          // Send completion notification back through the session
          await this.broadcastMessage(session, {
            type: 'handoff',
            sessionId: session.sessionId,
            from: 'system',
            to: payload.targetAgentId,
            payload: {
              type: 'completed',
              handoffId: payload.handoffId
            },
            timestamp: Date.now()
          });
          
          console.log(`Handoff completed: ${payload.handoffId} in session ${session.sessionId}`);
        }
        break;
        
      case 'cancel':
        // Handle handoff cancellation request
        if (payload.handoffId) {
          console.log(`Cancelling handoff ${payload.handoffId} in session ${session.sessionId}`);
          
          // In a real implementation, we would use the contextHandoffManager to cancel the handoff
          // For now, we'll just log the cancellation
          
          console.log(`Handoff cancelled: ${payload.handoffId} in session ${session.sessionId}`);
        }
        break;
        
      default:
        console.warn(`Unknown handoff message type: ${payload.type} in session ${session.sessionId}`);
    }
  }
}

// Export singleton instance
export const swarmSessionManager = new SwarmSessionManager();

/**
 * Convenience function for creating a session
 */
export async function createSwarmSession(config: SessionConfig, userId: string): Promise<string> {
  // If signaling is enabled in the config, use the signaling server URL from the config
  if (config.signalingConfig?.enableSignaling && config.signalingConfig?.serverUrl) {
    const sessionManagerWithSignaling = new SwarmSessionManager(undefined, config.signalingConfig.serverUrl);
    return await sessionManagerWithSignaling.createSession(config, userId);
  }
  
  return await swarmSessionManager.createSession(config, userId);
}

/**
 * Generates a shareable link for a session
 * @param sessionId The session ID to share
 * @param baseUrl Optional base URL for the link
 * @returns A shareable link for the session
 */
export function generateSessionShareLink(sessionId: string, baseUrl?: string): string {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${url}/swarm/session/${sessionId}`;
}

/**
 * Gets session information for sharing
 * @param sessionId The session ID
 * @returns Session information for sharing
 */
export function getSessionShareInfo(sessionId: string): {
  sessionId: string;
  shareLink: string;
  createdAt: Date;
  participantCount: number;
} | undefined {
  const session = swarmSessionManager.getSession(sessionId);
  if (!session) {
    return undefined;
  }
  
  return {
    sessionId: session.sessionId,
    shareLink: generateSessionShareLink(session.sessionId),
    createdAt: session.createdAt,
    participantCount: session.participants.size
  };
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
  // For joining a session, we'll use the existing singleton instance
  // The signaling configuration will be handled within the joinSession method
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

