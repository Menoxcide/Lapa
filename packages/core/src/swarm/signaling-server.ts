/**
 * WebRTC Signaling Server for LAPA v1.3.0 SwarmOS Edition — Phase 19
 *
 * This module implements a WebSocket-based signaling server to facilitate
 * WebRTC connection establishment between peers behind NAT/firewalls.
 *
 * Features:
 * - WebSocket-based signaling for SDP offers/answers and ICE candidates
 * - Session management for swarm participants
 * - Peer-to-peer message routing
 * - Connection state tracking
 * - RBAC authentication and authorization for secure session access
 *
 * Phase 19: Collaborative Swarm Sessions - IN PROGRESS
 */

import { WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { URL } from 'url';
import { rbacSystem } from '../security/rbac.ts';

// Signaling message types
export type SignalingMessageType = 
  | 'join'
  | 'leave'
  | 'sdp-offer'
  | 'sdp-answer'
  | 'ice-candidate'
  | 'heartbeat'
  | 'error';

// Signaling message interface
export interface SignalingMessage {
  type: SignalingMessageType;
  from?: string;
  to?: string;
  sessionId?: string;
  payload?: any;
  timestamp: number;
  error?: string;
}

// Participant information
export interface SignalingParticipant {
  id: string;
  sessionId: string;
  socket: WebSocket;
  joinedAt: Date;
  isAuthenticated: boolean; // Authentication status
  userId?: string; // Associated user ID for RBAC
}

// Session information
export interface SignalingSession {
  id: string;
  participants: Map<string, SignalingParticipant>;
  createdAt: Date;
  lastActivity: Date;
}

// Signaling server configuration
export interface SignalingServerConfig {
  port: number;
  host: string;
  path: string;
  maxParticipantsPerSession: number;
  heartbeatInterval: number; // milliseconds
}

// Default configuration
const DEFAULT_CONFIG: SignalingServerConfig = {
  port: 8080,
  host: 'localhost',
  path: '/signaling',
  maxParticipantsPerSession: 50,
  heartbeatInterval: 30000 // 30 seconds
};

/**
 * LAPA WebRTC Signaling Server
 * 
 * Implements a WebSocket-based signaling server for WebRTC peer connection establishment.
 */
export class WebRTCSignalingServer {
  private server: Server;
  private wss: any; // WebSocket.Server - avoiding import issues
  private sessions: Map<string, SignalingSession> = new Map();
  private participants: Map<string, SignalingParticipant> = new Map();
  private config: SignalingServerConfig;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private authTokenSecret: string; // Secret for token validation

  constructor(config?: Partial<SignalingServerConfig>, authTokenSecret?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.authTokenSecret = authTokenSecret || 'default-secret-key'; // In production, use a secure secret
    
    // Create HTTP server
    this.server = createServer();
    
    // Import ws dynamically to avoid issues
    try {
      const wsModule = require('ws');
      this.wss = new wsModule.Server({
        server: this.server,
        path: this.config.path
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
    
    // Set up WebSocket connection handling
    this.wss.on('connection', (socket: WebSocket, request: any) => {
      this.handleConnection(socket, request);
    });
    
    // Set up heartbeat
    this.setupHeartbeat();
  }

  /**
   * Starts the signaling server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`WebRTC Signaling Server listening on ${this.config.host}:${this.config.port}${this.config.path}`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        console.error('Signaling server error:', error);
        reject(error);
      });
    });
  }

  /**
   * Stops the signaling server
   */
  async stop(): Promise<void> {
    // Clear heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // Close all WebSocket connections
    if (this.wss) {
      this.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1001, 'Server shutting down');
        }
      });
    }
    
    // Close HTTP server
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('WebRTC Signaling Server stopped');
        resolve();
      });
    });
  }

  /**
   * Handles new WebSocket connections
   */
  private handleConnection(socket: WebSocket, request: any): void {
    console.log('New WebSocket connection established');
    
    // Set up message handling
    socket.on('message', (data: Buffer) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());
        this.handleMessage(socket, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        this.sendError(socket, 'Invalid message format');
      }
    });
    
    // Set up close handling
    socket.on('close', () => {
      this.handleDisconnect(socket);
    });
    
    // Set up error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handles incoming messages
   */
  private handleMessage(socket: WebSocket, message: SignalingMessage): void {
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    
    switch (message.type) {
      case 'join':
        this.handleJoin(socket, message);
        break;
        
      case 'leave':
        this.handleLeave(socket, message);
        break;
        
      case 'sdp-offer':
      case 'sdp-answer':
      case 'ice-candidate':
        this.handleSignalingMessage(socket, message);
        break;
        
      case 'heartbeat':
        // Respond to heartbeat
        this.sendMessage(socket, {
          type: 'heartbeat',
          timestamp: Date.now()
        });
        break;
        
      default:
        console.warn(`Unknown message type: ${(message as any).type}`);
        this.sendError(socket, `Unknown message type: ${(message as any).type}`);
    }
  }

  /**
   * Handles participant joining a session with RBAC authentication
   */
  private async handleJoin(socket: WebSocket, message: SignalingMessage): Promise<void> {
    if (!message.sessionId || !message.from) {
      this.sendError(socket, 'Missing sessionId or participantId');
      return;
    }
    
    // Extract authentication token from message payload
    const authToken = message.payload?.authToken;
    if (!authToken) {
      this.sendError(socket, 'Authentication token required');
      return;
    }
    
    // Validate authentication token (simplified for this example)
    // In a real implementation, this would verify a JWT or similar token
    const userId = this.validateAuthToken(authToken);
    if (!userId) {
      this.sendError(socket, 'Invalid authentication token');
      return;
    }
    
    // Check RBAC permission for joining session
    const accessCheck = await rbacSystem.checkAccess(
      userId,
      message.sessionId,
      'session',
      'session.join'
    );
    
    if (!accessCheck.allowed) {
      this.sendError(socket, `Access denied: ${accessCheck.reason}`);
      return;
    }
    
    // Check if participant is already connected
    if (this.participants.has(message.from)) {
      this.sendError(socket, 'Participant already connected');
      return;
    }
    
    // Get or create session
    let session = this.sessions.get(message.sessionId);
    if (!session) {
      // Check RBAC permission for creating session
      const createAccessCheck = await rbacSystem.checkAccess(
        userId,
        message.sessionId,
        'session',
        'session.create'
      );
      
      if (!createAccessCheck.allowed) {
        this.sendError(socket, `Cannot create session: ${createAccessCheck.reason}`);
        return;
      }
      
      session = {
        id: message.sessionId,
        participants: new Map(),
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.sessions.set(message.sessionId, session);
    }
    
    // Check session capacity
    if (session.participants.size >= this.config.maxParticipantsPerSession) {
      this.sendError(socket, 'Session is full');
      return;
    }
    
    // Create participant with authentication info
    const participant: SignalingParticipant = {
      id: message.from,
      sessionId: message.sessionId,
      socket,
      joinedAt: new Date(),
      isAuthenticated: true,
      userId
    };
    
    // Add participant to session
    session.participants.set(participant.id, participant);
    this.participants.set(participant.id, participant);
    session.lastActivity = new Date();
    
    // Notify participant of successful join
    this.sendMessage(socket, {
      type: 'join',
      sessionId: message.sessionId,
      from: 'server',
      payload: {
      success: true,
      participantId: participant.id,
      sessionId: session.id
    },
    timestamp: Date.now()
  });
  
  // Notify other participants in session
  this.broadcastToSession(session.id, {
    type: 'join',
    sessionId: session.id,
    from: participant.id,
    payload: {
      participantId: participant.id
    },
    timestamp: Date.now()
  }, participant.id);
  
  console.log(`Participant ${participant.id} joined session ${session.id}`);
}

  /**
   * Handles participant leaving a session with RBAC check
   */
  private async handleLeave(socket: WebSocket, message: SignalingMessage): Promise<void> {
    const participant = this.findParticipantBySocket(socket);
    if (!participant) {
      this.sendError(socket, 'Participant not found');
      return;
    }
    
    // Check RBAC permission for leaving session
    if (participant.userId) {
      const accessCheck = await rbacSystem.checkAccess(
        participant.userId,
        participant.sessionId,
        'session',
        'session.leave'
      );
      
      if (!accessCheck.allowed) {
        this.sendError(socket, `Cannot leave session: ${accessCheck.reason}`);
        return;
      }
    }
    
    const session = this.sessions.get(participant.sessionId);
    if (!session) {
      this.sendError(socket, 'Session not found');
      return;
    }
    
    // Remove participant from session
    session.participants.delete(participant.id);
    this.participants.delete(participant.id);
    
    // Notify other participants
    this.broadcastToSession(session.id, {
      type: 'leave',
      sessionId: session.id,
      from: participant.id,
      payload: {
        participantId: participant.id
      },
      timestamp: Date.now()
    }, participant.id);
    
    // Clean up empty session
    if (session.participants.size === 0) {
      this.sessions.delete(session.id);
      console.log(`Session ${session.id} removed (empty)`);
    }
    
    
    console.log(`Participant ${participant.id} left session ${session.id}`);
  }
  /**
   * Handles signaling messages with RBAC validation
   */
  private async handleSignalingMessage(socket: WebSocket, message: SignalingMessage): Promise<void> {
    const participant = this.findParticipantBySocket(socket);
    if (!participant) {
      this.sendError(socket, 'Participant not found');
      return;
    }
    
    // Verify participant is authenticated
    if (!participant.isAuthenticated) {
      this.sendError(socket, 'Participant not authenticated');
      return;
    }
    
    if (!message.to) {
      this.sendError(socket, 'Missing recipient');
      return;
    }
    
    const targetParticipant = this.participants.get(message.to);
    if (!targetParticipant) {
      this.sendError(socket, 'Target participant not found');
      return;
    }
    
    if (targetParticipant.socket.readyState !== WebSocket.OPEN) {
      this.sendError(socket, 'Target participant not connected');
      return;
    }
    
    // Forward message to target participant
    this.sendMessage(targetParticipant.socket, {
      type: message.type,
      from: participant.id,
      to: message.to,
      sessionId: message.sessionId,
      payload: message.payload,
      timestamp: Date.now()
    });
    
    
    console.log(`Forwarded ${message.type} from ${participant.id} to ${message.to}`);
  }
  /**
   * Handles participant disconnection
   */
  private handleDisconnect(socket: WebSocket): void {
    const participant = this.findParticipantBySocket(socket);
    if (!participant) {
      return;
    }
    
    const session = this.sessions.get(participant.sessionId);
    if (session) {
      // Remove participant from session
      session.participants.delete(participant.id);
      
      // Notify other participants
      this.broadcastToSession(session.id, {
        type: 'leave',
        sessionId: session.id,
        from: participant.id,
        payload: {
          participantId: participant.id
        },
        timestamp: Date.now()
      }, participant.id);
      
      // Clean up empty session
      if (session.participants.size === 0) {
        this.sessions.delete(session.id);
        console.log(`Session ${session.id} removed (empty)`);
      }
    }
    
    // Remove participant
    this.participants.delete(participant.id);
    
    console.log(`Participant ${participant.id} disconnected`);
  }

  /**
   * Sends a message to a specific socket
   */
  private sendMessage(socket: WebSocket, message: SignalingMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  /**
   * Broadcasts a message to all participants in a session
   */
  private broadcastToSession(sessionId: string, message: SignalingMessage, excludeId?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    
    for (const [participantId, participant] of session.participants) {
      // Skip excluded participant if specified
      if (excludeId && participantId === excludeId) {
        continue;
      }
      
      this.sendMessage(participant.socket, message);
    }
  }

  /**
   * Sends an error message to a socket
   */
  private sendError(socket: WebSocket, error: string): void {
    this.sendMessage(socket, {
      type: 'error',
      from: 'server',
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Finds a participant by socket
   */
  private findParticipantBySocket(socket: WebSocket): SignalingParticipant | undefined {
    for (const participant of this.participants.values()) {
      if (participant.socket === socket) {
        return participant;
      }
    }
    return undefined;
  }

  /**
   * Sets up heartbeat mechanism
   */
  private setupHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      
      // Ping all connected clients
      this.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          this.sendMessage(client, {
            type: 'heartbeat',
            from: 'server',
            timestamp: now
          });
        }
      });
      
      // Update session activity
      for (const session of this.sessions.values()) {
        session.lastActivity = new Date();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Validates authentication token (simplified implementation)
   * In a real implementation, this would verify a JWT or similar token
   */
  private validateAuthToken(token: string): string | null {
    // This is a simplified implementation for demonstration purposes
    // In a real system, you would verify a JWT or other secure token
    try {
      // Simple token format: "user-{userId}"
      if (token.startsWith('user-')) {
        return token.substring(5); // Extract userId
      }
      return null;
    } catch (error) {
      console.error('Error validating auth token:', error);
      return null;
    }
  }

  /**
   * Gets session information
   */
  getSessionInfo(sessionId: string): SignalingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets all active sessions
   */
  getAllSessions(): SignalingSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Gets participant count
   */
  getParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Gets session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Export singleton instance
export const signalingServer = new WebRTCSignalingServer();

export default WebRTCSignalingServer;