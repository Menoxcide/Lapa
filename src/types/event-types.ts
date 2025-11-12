/**
 * Typed Event Definitions for LAPA Core Event Bus
 * 
 * This module defines the strongly-typed event system for agent communication
 * within the LAPA swarm. It ensures type safety while maintaining flexibility
 * for cross-language compatibility.
 */

// Base event interface
export interface LAPAEvent {
    id: string;
    type: string;
    timestamp: number;
    source: string;
    target?: string;
    payload: any;
    metadata?: Record<string, any>;
  }
  
  // Handoff events
  export interface HandoffInitiatedEvent extends LAPAEvent {
    type: 'handoff.initiated';
    payload: {
      sourceAgentId: string;
      targetAgentId: string;
      taskId: string;
      context: Record<string, any>;
      priority: 'low' | 'medium' | 'high';
    };
  }
  
  export interface HandoffCompletedEvent extends LAPAEvent {
    type: 'handoff.completed';
    payload: {
      handoffId: string;
      sourceAgentId: string;
      targetAgentId: string;
      taskId: string;
      result: any;
      duration: number;
    };
  }
  
  export interface HandoffFailedEvent extends LAPAEvent {
    type: 'handoff.failed';
    payload: {
      handoffId: string;
      sourceAgentId: string;
      targetAgentId: string;
      taskId: string;
      error: string;
      duration: number;
    };
  }
  
  // Task events
  export interface TaskCreatedEvent extends LAPAEvent {
    type: 'task.created';
    payload: {
      taskId: string;
      description: string;
      type: string;
      priority: number;
      context: Record<string, any>;
    };
  }
  
  export interface TaskUpdatedEvent extends LAPAEvent {
    type: 'task.updated';
    payload: {
      taskId: string;
      updates: Record<string, any>;
    };
  }
  
  export interface TaskCompletedEvent extends LAPAEvent {
    type: 'task.completed';
    payload: {
      taskId: string;
      result: any;
      duration: number;
    };
  }
  
  export interface TaskFailedEvent extends LAPAEvent {
    type: 'task.failed';
    payload: {
      taskId: string;
      error: string;
      duration: number;
    };
  }
  
  // Agent events
  export interface AgentRegisteredEvent extends LAPAEvent {
    type: 'agent.registered';
    payload: {
      agentId: string;
      name: string;
      capabilities: string[];
      isLocal: boolean;
      type: string;
    };
  }
  
  export interface AgentUnregisteredEvent extends LAPAEvent {
    type: 'agent.unregistered';
    payload: {
      agentId: string;
    };
  }
  
  export interface AgentWorkloadUpdatedEvent extends LAPAEvent {
    type: 'agent.workload.updated';
    payload: {
      agentId: string;
      workload: number;
      capacity: number;
    };
  }
  
  // Context events
  export interface ContextCompressedEvent extends LAPAEvent {
    type: 'context.compressed';
    payload: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      algorithm: string;
    };
  }
  
  export interface ContextDecompressedEvent extends LAPAEvent {
    type: 'context.decompressed';
    payload: {
      compressedSize: number;
      decompressedSize: number;
      algorithm: string;
    };
  }
  
  // System events
  export interface SystemInitializedEvent extends LAPAEvent {
    type: 'system.initialized';
    payload: {
      version: string;
      timestamp: number;
    };
  }
  
  export interface SystemShutdownEvent extends LAPAEvent {
    type: 'system.shutdown';
    payload: {
      reason: string;
      timestamp: number;
    };
  }
  
  export interface SystemErrorEvent extends LAPAEvent {
    type: 'system.error';
    payload: {
      error: string;
      stackTrace?: string;
      component: string;
    };
  }
  
  export interface SystemWarningEvent extends LAPAEvent {
    type: 'system.warning';
    payload: {
      warning: string;
      component: string;
    };
  }
  
  // Performance events
  export interface PerformanceMetricEvent extends LAPAEvent {
    type: 'performance.metric';
    payload: {
      metric: string;
      value: number;
      unit: string;
      timestamp: number;
    };
  }
  
  // Mode events
  export interface ModeChangedEvent extends LAPAEvent {
    type: 'mode.changed';
    payload: {
      fromMode: string;
      toMode: string;
      reason?: string;
      context?: Record<string, any>;
    };
  }
  
  export interface ModeChangeRequestEvent extends LAPAEvent {
    type: 'mode.change.request';
    payload: {
      fromMode: string;
      toMode: string;
      reason?: string;
      context?: Record<string, any>;
    };
  }
  
  export interface ModeControllerInitializedEvent extends LAPAEvent {
    type: 'mode.controller.initialized';
    payload: {
      initialMode: string;
    };
  }
  
  // Tool execution events
  export interface ToolExecutionStartedEvent extends LAPAEvent {
    type: 'tool.execution.started';
    payload: {
      toolName: string;
      agentId: string;
      taskId: string;
      timestamp: number;
    };
  }
  
  export interface ToolExecutionCompletedEvent extends LAPAEvent {
    type: 'tool.execution.completed';
    payload: {
      toolName: string;
      agentId: string;
      taskId: string;
      success: boolean;
      executionTime: number;
      timestamp: number;
    };
  }
  
  export interface ToolExecutionFailedEvent extends LAPAEvent {
    type: 'tool.execution.failed';
    payload: {
      toolName: string;
      agentId: string;
      taskId: string;
      error: string;
      executionTime: number;
      timestamp: number;
    };
  }
  
  // Context preservation events
  export interface ContextPreservedEvent extends LAPAEvent {
    type: 'context.preserved';
    payload: {
      contextSize: number;
    };
  }
  
  export interface ContextPreservationFailedEvent extends LAPAEvent {
    type: 'context.preservation.failed';
    payload: {
      handoffId: string;
      error: string;
    };
  }
  
  // Event processing events
  export interface EventProcessedEvent extends LAPAEvent {
    type: 'event.processed';
    payload: {
      taskId: string;
      description: string;
      type: string;
      priority: number;
      context: Record<string, any>;
    };
  }
  
  export interface EventProcessingFailedEvent extends LAPAEvent {
    type: 'event.processing.failed';
    payload: {
      error: string;
      stackTrace?: string;
      component: string;
    };
  }
  
  // Event map for type-safe event handling
  export interface LAPAEventMap {
    'handoff.initiated': HandoffInitiatedEvent;
    'handoff.completed': HandoffCompletedEvent;
    'handoff.failed': HandoffFailedEvent;
    'task.created': TaskCreatedEvent;
    'task.updated': TaskUpdatedEvent;
    'task.completed': TaskCompletedEvent;
    'task.failed': TaskFailedEvent;
    'agent.registered': AgentRegisteredEvent;
    'agent.unregistered': AgentUnregisteredEvent;
    'agent.workload.updated': AgentWorkloadUpdatedEvent;
    'context.compressed': ContextCompressedEvent;
    'context.decompressed': ContextDecompressedEvent;
    'system.initialized': SystemInitializedEvent;
    'system.shutdown': SystemShutdownEvent;
    'system.error': SystemErrorEvent;
    'system.warning': SystemWarningEvent;
    'performance.metric': PerformanceMetricEvent;
    
    // Mode events
    'mode.changed': any; // TODO: Define proper interface
    'mode.change.request': any; // TODO: Define proper interface
    'mode.change.failed': any; // TODO: Define proper interface
    'mode.controller.initialized': any; // TODO: Define proper interface
    
    // Tool execution events
    'tool.execution.started': any; // TODO: Define proper interface
    'tool.execution.completed': any; // TODO: Define proper interface
    'tool.execution.failed': any; // TODO: Define proper interface
    
    // Handoff events
    'handoff.recovered': any; // TODO: Define proper interface
    'handoff.fallback.initiated': any; // TODO: Define proper interface
    'handoff.fallback.succeeded': any; // TODO: Define proper interface
    'handoff.failed.permanently': any; // TODO: Define proper interface
    
    // Context preservation events
    'context.preserved': any; // TODO: Define proper interface
    'context.preservation.failed': any; // TODO: Define proper interface
    'context.restored': any; // TODO: Define proper interface
    'context.restoration.failed': any; // TODO: Define proper interface
    'context.rollback': any; // TODO: Define proper interface
    'context.rollback.failed': any; // TODO: Define proper interface
    
    // Error recovery events
    'tool.execution.recovered': any; // TODO: Define proper interface
    'tool.execution.retry': any; // TODO: Define proper interface
    'tool.execution.failed.permanently': any; // TODO: Define proper interface
    
    // Fallback strategy events
    'fallback.provider.registered': any; // TODO: Define proper interface
    'operation.executed': any; // TODO: Define proper interface
    'operation.fallback.initiated': any; // TODO: Define proper interface
    'operation.fallback.succeeded': any; // TODO: Define proper interface
    'operation.fallback.failed': any; // TODO: Define proper interface
    'operation.failed.permanently': any; // TODO: Define proper interface
    'tool.degraded': any; // TODO: Define proper interface
    'mode.degraded': any; // TODO: Define proper interface
    'fallback.provider.removed': any; // TODO: Define proper interface
    
    // Cross language events
    'cross.language.sent': any; // TODO: Define proper interface
    'cross.language.received': any; // TODO: Define proper interface
    'cross.language.failed': any; // TODO: Define proper interface
    
    // Event processing events
    'event.processed': any; // TODO: Define proper interface
    'event.processing.failed': any; // TODO: Define proper interface
    
  // A2A handshake events
  'a2a.handshake.request': any; // TODO: Define proper interface
  'a2a.handshake.response': any; // TODO: Define proper interface
  'a2a.task.negotiation.request': any; // TODO: Define proper interface
  'a2a.task.negotiation.response': any; // TODO: Define proper interface
  'a2a.state.sync.request': any; // TODO: Define proper interface
  'a2a.state.sync.response': any; // TODO: Define proper interface
  
  // AG-UI events
    'ag-ui.message': any; // TODO: Define proper interface
    'ag-ui.stream.start': any; // TODO: Define proper interface
    'ag-ui.stream.end': any; // TODO: Define proper interface
    
    // Delegate events
    'delegate.task.request': any; // TODO: Define proper interface
    'delegate.task.started': any; // TODO: Define proper interface
    'delegate.task.completed': any; // TODO: Define proper interface
    'delegate.task.failed': any; // TODO: Define proper interface
  }
  
  // Union type of all event types
  export type LAPAEventType = keyof LAPAEventMap;
  
  // Utility type for creating events
  export type LAPAEventOfType<T extends LAPAEventType> = LAPAEventMap[T];
  
  // Cross-language compatibility types
  // These interfaces define the structure that events should conform to
  // when communicated with .NET or Python components
  
  export interface CrossLanguageEvent {
    id: string;
    type: string;
    timestamp: number;
    source: string;
    target?: string;
    payload: string; // Serialized payload for cross-language compatibility
    metadata?: Record<string, string>; // Stringified metadata
  }
  
  // Serialization helper functions for cross-language compatibility
  export function serializeEventForInterop(event: LAPAEvent): CrossLanguageEvent {
    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      target: event.target,
      payload: JSON.stringify(event.payload),
      metadata: event.metadata ? Object.fromEntries(
        Object.entries(event.metadata).map(([key, value]) => [key, String(value)])
      ) : undefined
    };
  }
  
  export function deserializeEventFromInterop(interopEvent: CrossLanguageEvent): LAPAEvent {
    return {
      id: interopEvent.id,
      type: interopEvent.type,
      timestamp: interopEvent.timestamp,
      source: interopEvent.source,
      target: interopEvent.target,
      payload: JSON.parse(interopEvent.payload),
      metadata: interopEvent.metadata ? Object.fromEntries(
        Object.entries(interopEvent.metadata).map(([key, value]) => [key, value])
      ) : undefined
    };
  }