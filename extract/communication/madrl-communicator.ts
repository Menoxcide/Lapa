/**
 * MADRL Communication Framework
 * 
 * Implements advanced communication mechanisms from MADRL survey
 * for enhanced agent coordination and learning.
 * Based on: "A Survey of Multi-Agent Deep Reinforcement Learning with Communication"
 * 
 * Features:
 * - Multiple communication types (broadcast, targeted, conditioned)
 * - Various message types (observation, action, value, policy, coordination)
 * - Communication constraints handling
 * - Adaptive communication strategies
 */

import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Communication message
 */
export interface CommunicationMessage {
  id: string;
  type: 'observation' | 'action' | 'value' | 'policy' | 'coordination';
  senderId: string;
  receiverIds: string[] | 'broadcast' | 'group';
  content: MessageContent;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  constraints?: CommunicationConstraints;
}

/**
 * Message content
 */
export interface MessageContent {
  observation?: EnvironmentObservation;
  action?: AgentAction;
  value?: ValueEstimate;
  policy?: PolicyInfo;
  coordination?: CoordinationSignal;
}

/**
 * Environment observation
 */
export interface EnvironmentObservation {
  state: Record<string, unknown>;
  relevantAgents: string[];
  context: Record<string, unknown>;
}

/**
 * Agent action
 */
export interface AgentAction {
  actionId: string;
  actionType: string;
  parameters: Record<string, unknown>;
}

/**
 * Value estimate
 */
export interface ValueEstimate {
  state: Record<string, unknown>;
  value: number;
  confidence: number;
}

/**
 * Policy information
 */
export interface PolicyInfo {
  policyId: string;
  actions: string[];
  probabilities?: number[];
}

/**
 * Coordination signal
 */
export interface CoordinationSignal {
  signalType: string;
  content: Record<string, unknown>;
  targetAgents?: string[];
}

/**
 * Communication constraints
 */
export interface CommunicationConstraints {
  bandwidth: number; // bytes per second
  latency: number; // milliseconds
  frequency: number; // messages per second
  messageSize: number; // bytes
}

/**
 * Communication result
 */
export interface CommunicationResult {
  success: boolean;
  messageId: string;
  deliveredTo: string[];
  failedTo: string[];
  latency: number;
  bandwidthUsed: number;
  error?: string;
}

/**
 * Communication strategy
 */
export interface CommunicationStrategy {
  type: 'broadcast' | 'targeted' | 'conditioned';
  conditions?: (message: CommunicationMessage) => boolean;
  targetSelector?: (message: CommunicationMessage, agents: string[]) => string[];
}

/**
 * MADRL Communicator
 */
export class MADRLCommunicator {
  private messageQueue: CommunicationMessage[] = [];
  private messageHistory: Map<string, CommunicationMessage> = new Map();
  private constraints: CommunicationConstraints;
  private strategies: Map<string, CommunicationStrategy> = new Map();
  
  constructor(constraints?: Partial<CommunicationConstraints>) {
    this.constraints = {
      bandwidth: 1024 * 1024, // 1MB/s default
      latency: 100, // 100ms default
      frequency: 10, // 10 msg/s default
      messageSize: 1024, // 1KB default
      ...constraints
    };
    
    // Initialize default strategies
    this.initializeStrategies();
  }
  
  /**
   * Broadcasts message to all agents
   */
  async broadcast(message: CommunicationMessage): Promise<CommunicationResult> {
    const spanId = agl.emitSpan('madrl.broadcast', {
      messageId: message.id,
      messageType: message.type
    });

    try {
      // Check constraints
      if (!this.checkConstraints(message)) {
        throw new Error('Message violates communication constraints');
      }

      // Add to queue
      this.messageQueue.push(message);
      this.messageHistory.set(message.id, message);

      // Process broadcast
      const result: CommunicationResult = {
        success: true,
        messageId: message.id,
        deliveredTo: message.receiverIds === 'broadcast' ? ['all'] : 
                     Array.isArray(message.receiverIds) ? message.receiverIds : [],
        failedTo: [],
        latency: this.constraints.latency,
        bandwidthUsed: this.estimateBandwidth(message)
      };

      agl.emitMetric('madrl.message_sent', {
        type: message.type,
        strategy: 'broadcast',
        bandwidthUsed: result.bandwidthUsed
      });

      agl.endSpan(spanId, 'success', {
        deliveredTo: result.deliveredTo.length
      });

      return result;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Sends targeted message to specific agents
   */
  async sendTargeted(
    message: CommunicationMessage,
    targetAgents: string[]
  ): Promise<CommunicationResult> {
    const spanId = agl.emitSpan('madrl.send_targeted', {
      messageId: message.id,
      targetCount: targetAgents.length
    });

    try {
      message.receiverIds = targetAgents;
      
      if (!this.checkConstraints(message)) {
        throw new Error('Message violates communication constraints');
      }

      this.messageQueue.push(message);
      this.messageHistory.set(message.id, message);

      const result: CommunicationResult = {
        success: true,
        messageId: message.id,
        deliveredTo: targetAgents,
        failedTo: [],
        latency: this.constraints.latency,
        bandwidthUsed: this.estimateBandwidth(message) * targetAgents.length
      };

      agl.emitMetric('madrl.message_sent', {
        type: message.type,
        strategy: 'targeted',
        targetCount: targetAgents.length,
        bandwidthUsed: result.bandwidthUsed
      });

      agl.endSpan(spanId, 'success', {
        deliveredTo: result.deliveredTo.length
      });

      return result;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Sends conditioned message based on constraints
   */
  async sendConditioned(
    message: CommunicationMessage,
    condition: (message: CommunicationMessage, agents: string[]) => string[]
  ): Promise<CommunicationResult> {
    const spanId = agl.emitSpan('madrl.send_conditioned', {
      messageId: message.id
    });

    try {
      // Select targets based on condition
      const allAgents: string[] = []; // Would come from agent registry
      const targetAgents = condition(message, allAgents);
      
      return await this.sendTargeted(message, targetAgents);
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Optimizes communication based on constraints
   */
  async optimizeCommunication(
    messages: CommunicationMessage[]
  ): Promise<CommunicationMessage[]> {
    const spanId = agl.emitSpan('madrl.optimize');

    try {
      // Filter messages by priority
      const prioritized = messages.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Apply bandwidth constraints
      let bandwidthUsed = 0;
      const optimized: CommunicationMessage[] = [];
      
      for (const message of prioritized) {
        const messageBandwidth = this.estimateBandwidth(message);
        if (bandwidthUsed + messageBandwidth <= this.constraints.bandwidth) {
          optimized.push(message);
          bandwidthUsed += messageBandwidth;
        } else {
          break; // Can't fit more messages
        }
      }

      agl.endSpan(spanId, 'success', {
        originalCount: messages.length,
        optimizedCount: optimized.length
      });

      return optimized;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private checkConstraints(message: CommunicationMessage): boolean {
    const messageSize = this.estimateBandwidth(message);
    
    return (
      messageSize <= this.constraints.messageSize &&
      this.messageQueue.length < this.constraints.frequency * 10 // Buffer
    );
  }

  private estimateBandwidth(message: CommunicationMessage): number {
    // Estimate message size in bytes
    const contentSize = JSON.stringify(message.content).length;
    const overhead = 100; // Protocol overhead
    return contentSize + overhead;
  }

  private initializeStrategies(): void {
    // Broadcast strategy
    this.strategies.set('broadcast', {
      type: 'broadcast',
      conditions: () => true
    });

    // Targeted strategy
    this.strategies.set('targeted', {
      type: 'targeted',
      targetSelector: (message, agents) => {
        if (Array.isArray(message.receiverIds)) {
          return message.receiverIds;
        }
        return agents;
      }
    });

    // Conditioned strategy
    this.strategies.set('conditioned', {
      type: 'conditioned',
      conditions: (message) => message.priority === 'high'
    });
  }
}

