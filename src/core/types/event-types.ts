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

export interface AgentInteractionEvent extends LAPAEvent {
  type: 'agent.interaction';
  payload: {
    agentId: string;
    interactionType: string;
    targetId?: string;
    context?: Record<string, any>;
  };
}

export interface AgentSkillAcquiredEvent extends LAPAEvent {
  type: 'agent.skill.acquired';
  payload: {
    agentId: string;
    skillName: string;
    skillLevel: number;
    source: 'marketplace' | 'custom' | 'builtin';
  };
}

export interface AgentCreatedEvent extends LAPAEvent {
  type: 'agent.created';
  payload: {
    agentId: string;
    name: string;
    type: string;
    capabilities: string[];
  };
}

export interface AgentCoordinationEvent extends LAPAEvent {
  type: 'agent.coordination';
  payload: {
    agentId: string;
    coordinationType: string;
    participants: string[];
    context?: Record<string, any>;
  };
}

export interface AgentPromptUsedEvent extends LAPAEvent {
  type: 'agent.prompt.used';
  payload: {
    agentId: string;
    promptId: string;
    promptType: string;
    result: 'success' | 'failure';
    metrics?: Record<string, any>;
  };
}

export interface SkillMarketplaceAvailableEvent extends LAPAEvent {
  type: 'skill.marketplace.available';
  payload: {
    skillName: string;
    skillId: string;
    version: string;
    description: string;
    category: string;
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

export interface ModeChangeFailedEvent extends LAPAEvent {
  type: 'mode.change.failed';
  payload: {
    fromMode: string;
    toMode: string;
    reason?: string;
    error: string;
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

// Handoff events
export interface HandoffRecoveredEvent extends LAPAEvent {
  type: 'handoff.recovered';
  payload: {
    handoffId: string;
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    result: any;
    duration: number;
  };
}

export interface HandoffFallbackInitiatedEvent extends LAPAEvent {
  type: 'handoff.fallback.initiated';
  payload: {
    handoffId: string;
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    fallbackStrategy: string;
  };
}

export interface HandoffFallbackSucceededEvent extends LAPAEvent {
  type: 'handoff.fallback.succeeded';
  payload: {
    handoffId: string;
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    result: any;
    duration: number;
  };
}

export interface HandoffFailedPermanentlyEvent extends LAPAEvent {
  type: 'handoff.failed.permanently';
  payload: {
    handoffId: string;
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    error: string;
    duration: number;
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

export interface ContextRestoredEvent extends LAPAEvent {
  type: 'context.restored';
  payload: {
    handoffId: string;
    contextSize: number;
  };
}

export interface ContextRestorationFailedEvent extends LAPAEvent {
  type: 'context.restoration.failed';
  payload: {
    handoffId: string;
    error: string;
  };
}

export interface ContextRollbackEvent extends LAPAEvent {
  type: 'context.rollback';
  payload: {
    handoffId: string;
    contextSize: number;
  };
}

export interface ContextRollbackFailedEvent extends LAPAEvent {
  type: 'context.rollback.failed';
  payload: {
    handoffId: string;
    error: string;
  };
}

// Error recovery events
export interface ToolExecutionRecoveredEvent extends LAPAEvent {
  type: 'tool.execution.recovered';
  payload: {
    toolName: string;
    agentId: string;
    taskId: string;
    result: any;
    recoveryTime: number;
  };
}

export interface ToolExecutionRetryEvent extends LAPAEvent {
  type: 'tool.execution.retry';
  payload: {
    toolName: string;
    agentId: string;
    taskId: string;
    retryCount: number;
    timestamp: number;
  };
}

export interface ToolExecutionFailedPermanentlyEvent extends LAPAEvent {
  type: 'tool.execution.failed.permanently';
  payload: {
    toolName: string;
    agentId: string;
    taskId: string;
    error: string;
    executionTime: number;
    retryCount: number;
  };
}

// Fallback strategy events
export interface FallbackProviderRegisteredEvent extends LAPAEvent {
  type: 'fallback.provider.registered';
  payload: {
    providerName: string;
    providerType: string;
    timestamp: number;
  };
}

export interface OperationExecutedEvent extends LAPAEvent {
  type: 'operation.executed';
  payload: {
    operationId: string;
    providerName: string;
    success: boolean;
    executionTime: number;
  };
}

export interface OperationFallbackInitiatedEvent extends LAPAEvent {
  type: 'operation.fallback.initiated';
  payload: {
    operationId: string;
    primaryProvider: string;
    fallbackProvider: string;
    reason: string;
  };
}

export interface OperationFallbackSucceededEvent extends LAPAEvent {
  type: 'operation.fallback.succeeded';
  payload: {
    operationId: string;
    fallbackProvider: string;
    result: any;
    executionTime: number;
  };
}

export interface OperationFallbackFailedEvent extends LAPAEvent {
  type: 'operation.fallback.failed';
  payload: {
    operationId: string;
    fallbackProvider: string;
    error: string;
    executionTime: number;
  };
}

export interface OperationFailedPermanentlyEvent extends LAPAEvent {
  type: 'operation.failed.permanently';
  payload: {
    operationId: string;
    providersAttempted: string[];
    error: string;
    totalTime: number;
  };
}

export interface ToolDegradedEvent extends LAPAEvent {
  type: 'tool.degraded';
  payload: {
    toolName: string;
    agentId: string;
    degradationLevel: 'minor' | 'moderate' | 'severe';
    metrics: Record<string, number>;
  };
}

export interface ModeDegradedEvent extends LAPAEvent {
  type: 'mode.degraded';
  payload: {
    fromMode: string;
    toMode: string;
    degradationLevel: 'minor' | 'moderate' | 'severe';
    reason: string;
  };
}

export interface FallbackProviderRemovedEvent extends LAPAEvent {
  type: 'fallback.provider.removed';
  payload: {
    providerName: string;
    reason: string;
    timestamp: number;
  };
}

// Cross language events
export interface CrossLanguageSentEvent extends LAPAEvent {
  type: 'cross.language.sent';
  payload: {
    targetLanguage: string;
    eventId: string;
    serializedPayload: string;
  };
}

export interface CrossLanguageReceivedEvent extends LAPAEvent {
  type: 'cross.language.received';
  payload: {
    sourceLanguage: string;
    eventId: string;
    deserializedPayload: any;
  };
}

export interface CrossLanguageFailedEvent extends LAPAEvent {
  type: 'cross.language.failed';
  payload: {
    targetLanguage: string;
    eventId: string;
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

// A2A handshake events
export interface A2AHandshakeRequestEvent extends LAPAEvent {
  type: 'a2a.handshake.request';
  payload: {
    sourceAgentId: string;
    targetAgentId: string;
    capabilities: string[];
    protocolVersion?: string;
    metadata?: Record<string, unknown>;
    taskId?: string;
    taskDescription?: string;
    context?: Record<string, unknown>;
    priority?: 'low' | 'medium' | 'high';
    timestamp?: number;
  };
}

export interface A2AHandshakeResponseEvent extends LAPAEvent {
  type: 'a2a.handshake.response';
  payload: {
    success: boolean;
    accepted: boolean;
    error?: string;
    timestamp?: number;
    protocolVersion?: string;
    capabilities?: string[];
    sessionId?: string;
    reason?: string;
    handshakeId?: string;
  };
}

export interface A2ATaskNegotiationRequestEvent extends LAPAEvent {
  type: 'a2a.task.negotiation.request';
  payload: {
    sourceAgentId: string;
    targetAgentId: string;
    task: any; // This should be the Task type from moe-router.ts
    context: Record<string, unknown>;
    handshakeId: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface A2ATaskNegotiationResponseEvent extends LAPAEvent {
  type: 'a2a.task.negotiation.response';
  payload: {
    success: boolean;
    negotiationId?: string;
    accepted: boolean;
    estimatedLatency?: number;
    error?: string;
  };
}

export interface A2AStateSyncRequestEvent extends LAPAEvent {
  type: 'a2a.state.sync.request';
  payload: {
    sourceAgentId: string;
    targetAgentId: string;
    state: Record<string, unknown>;
    handshakeId: string;
    syncType: 'full' | 'incremental';
  };
}

export interface A2AStateSyncResponseEvent extends LAPAEvent {
  type: 'a2a.state.sync.response';
  payload: {
    success: boolean;
    syncId?: string;
    acknowledged: boolean;
    error?: string;
  };
}

// WebRTC events
export interface WebRTCIceCandidateEvent extends LAPAEvent {
  type: 'webrtc.ice-candidate';
  payload: {
    connectionId: string;
    candidate: string;
    sdpMLineIndex: number;
    sdpMid: string;
  };
}

export interface WebRTCConnectionStateEvent extends LAPAEvent {
  type: 'webrtc.connection-state';
  payload: {
    connectionId: string;
    state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  };
}

export interface WebRTCSdpOfferEvent extends LAPAEvent {
  type: 'webrtc.sdp-offer';
  payload: {
    connectionId: string;
    offer: string;
    senderId: string;
  };
}

export interface WebRTCSdpAnswerEvent extends LAPAEvent {
  type: 'webrtc.sdp-answer';
  payload: {
    connectionId: string;
    answer: string;
    senderId: string;
  };
}

// AG-UI events
export interface AGUIMessageEvent extends LAPAEvent {
  type: 'ag-ui.message';
  payload: {
    message: string;
    messageType: 'info' | 'warning' | 'error' | 'success';
    timestamp: number;
  };
}

export interface AGUIStreamStartEvent extends LAPAEvent {
  type: 'ag-ui.stream.start';
  payload: {
    streamId: string;
    config: Record<string, any>;
    timestamp: number;
  };
}

export interface AGUIStreamEndEvent extends LAPAEvent {
  type: 'ag-ui.stream.end';
  payload: {
    streamId: string;
    timestamp: number;
  };
}

// Delegate events
export interface DelegateTaskRequestEvent extends LAPAEvent {
  type: 'delegate.task.request';
  payload: {
    taskId: string;
    sourceAgentId: string;
    targetAgentId: string;
    taskData: Record<string, any>;
  };
}

export interface DelegateTaskStartedEvent extends LAPAEvent {
  type: 'delegate.task.started';
  payload: {
    taskId: string;
    targetAgentId: string;
    startTime: number;
  };
}

export interface DelegateTaskCompletedEvent extends LAPAEvent {
  type: 'delegate.task.completed';
  payload: {
    taskId: string;
    targetAgentId: string;
    result: any;
    duration: number;
  };
}

export interface DelegateTaskFailedEvent extends LAPAEvent {
  type: 'delegate.task.failed';
  payload: {
    taskId: string;
    targetAgentId: string;
    error: string;
    duration: number;
  };
}

// Multimodal events
export interface MultimodalModalitySwitchedEvent extends LAPAEvent {
  type: 'multimodal.modality.switched';
  payload: {
    fromModality: string;
    toModality: string;
    reason: string;
    timestamp: number;
  };
}

export interface MultimodalModalityPriorityUpdatedEvent extends LAPAEvent {
  type: 'multimodal.modality.priority.updated';
  payload: {
    modality: string;
    oldPriority: number;
    newPriority: number;
    timestamp: number;
  };
}

export interface MultimodalContextPreservedEvent extends LAPAEvent {
  type: 'multimodal.context.preserved';
  payload: {
    contextId: string;
    preservedData: Record<string, any>;
    timestamp: number;
  };
}

export interface MultimodalContextUpdatedEvent extends LAPAEvent {
  type: 'multimodal.context.updated';
  payload: {
    contextId: string;
    updatedFields: string[];
    timestamp: number;
  };
}

export interface MultimodalProcessingStartedEvent extends LAPAEvent {
  type: 'multimodal.processing.started';
  payload: {
    processId: string;
    modalities: string[];
    inputData: Record<string, any>;
    timestamp: number;
  };
}

export interface MultimodalProcessingCompletedEvent extends LAPAEvent {
  type: 'multimodal.processing.completed';
  payload: {
    processId: string;
    modalities: string[];
    result: any;
    processingTime: number;
  };
}

export interface MultimodalProcessingErrorEvent extends LAPAEvent {
  type: 'multimodal.processing.error';
  payload: {
    processId: string;
    modality: string;
    error: string;
    timestamp: number;
  };
}

export interface MultimodalVisionProcessingErrorEvent extends LAPAEvent {
  type: 'multimodal.vision.processing.error';
  payload: {
    processId: string;
    error: string;
    imageInfo?: {
      size: number;
      format: string;
    };
    timestamp: number;
  };
}

export interface MultimodalVoiceProcessingErrorEvent extends LAPAEvent {
  type: 'multimodal.voice.processing.error';
  payload: {
    processId: string;
    error: string;
    audioInfo?: {
      length: number;
      format: string;
    };
    timestamp: number;
  };
}

export interface MultimodalProcessingFallbackEvent extends LAPAEvent {
  type: 'multimodal.processing.fallback';
  payload: {
    processId: string;
    fromModality: string;
    toModality: string;
    reason: string;
    timestamp: number;
  };
}

// Voice events
export interface VoiceAudioProcessingEvent extends LAPAEvent {
  type: 'voice.audio.processing';
  payload: {
    audioLength: number;
    format?: string;
    processingStart: number;
  };
}

export interface VoiceAudioProcessedEvent extends LAPAEvent {
  type: 'voice.audio.processed';
  payload: {
    textLength: number;
    processingTime: number;
    processingEnd: number;
  };
}

export interface VoiceAudioGeneratingEvent extends LAPAEvent {
  type: 'voice.audio.generating';
  payload: {
    textLength: number;
    generationStart: number;
  };
}

export interface VoiceAudioGeneratedEvent extends LAPAEvent {
  type: 'voice.audio.generated';
  payload: {
    audioLength: number;
    duration?: number;
    processingTime: number;
    generationEnd: number;
  };
}

export interface VoiceAudioErrorEvent extends LAPAEvent {
  type: 'voice.audio.error';
  payload: {
    error: string;
    audioLength?: number;
    textLength?: number;
  };
}

export interface VoiceQuestionAskingEvent extends LAPAEvent {
  type: 'voice.question.asking';
  payload: {
    question: string;
    context?: string;
    processingStart: number;
  };
}

export interface VoiceQuestionAnsweredEvent extends LAPAEvent {
  type: 'voice.question.answered';
  payload: {
    question: string;
    answer: string;
    processingTime: number;
    processingEnd: number;
  };
}

export interface VoiceQuestionErrorEvent extends LAPAEvent {
  type: 'voice.question.error';
  payload: {
    error: string;
    question: string;
  };
}

export interface VoiceCommandExecutingEvent extends LAPAEvent {
  type: 'voice.command.executing';
  payload: {
    command: string;
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
    executionStart: number;
  };
}

export interface VoiceCommandExecutedEvent extends LAPAEvent {
  type: 'voice.command.executed';
  payload: {
    command: string;
    intent?: string;
    entities?: Record<string, any>;
    result: any;
    confidence?: number;
    processingTime: number;
    executionEnd: number;
  };
}

export interface VoiceCommandEvent extends LAPAEvent {
  type: 'voice.command.error';
  payload: {
    error: string;
    command: string;
  };
}

export interface VoiceDictationStartedEvent extends LAPAEvent {
  type: 'voice.dictation.started';
  payload: {
    startTime: number;
  };
}

export interface VoiceDictationCompletedEvent extends LAPAEvent {
  type: 'voice.dictation.completed';
  payload: {
    text: string;
    duration: number;
    audioLength: number;
  };
}

export interface VoiceDictationErrorEvent extends LAPAEvent {
  type: 'voice.dictation.error';
  payload: {
    error: string;
    duration: number;
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

// Vision events
export interface VisionImageProcessedEvent extends LAPAEvent {
  type: 'vision.image.processed';
  payload: {
    imageSize: number;
    resultLength: number;
    processingTime?: number;
  };
}

export interface VisionImageGeneratedEvent extends LAPAEvent {
  type: 'vision.image.generated';
  payload: {
    description: string;
    imageSize: number;
    processingTime?: number;
  };
}

export interface VisionScreenshotAnalyzedEvent extends LAPAEvent {
  type: 'vision.screenshot.analyzed';
  payload: {
    screenshotSize: number;
    analysisKeys: string[];
    processingTime?: number;
  };
}

export interface VisionUIElementsRecognizedEvent extends LAPAEvent {
  type: 'vision.ui.elements.recognized';
  payload: {
    imageSize: number;
    elementCount: number;
    processingTime?: number;
  };
}

export interface VisionCodeGeneratedEvent extends LAPAEvent {
  type: 'vision.code.generated';
  payload: {
    imageSize: number;
    framework: string;
    codeLength: number;
    processingTime?: number;
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
  'mode.changed': ModeChangedEvent;
  'mode.change.request': ModeChangeRequestEvent;
  'mode.change.failed': ModeChangeFailedEvent;
  'mode.controller.initialized': ModeControllerInitializedEvent;
  
  // Tool execution events
  'tool.execution.started': ToolExecutionStartedEvent;
  'tool.execution.completed': ToolExecutionCompletedEvent;
  'tool.execution.failed': ToolExecutionFailedEvent;
  
  // Handoff events
  'handoff.recovered': HandoffRecoveredEvent;
  'handoff.fallback.initiated': HandoffFallbackInitiatedEvent;
  'handoff.fallback.succeeded': HandoffFallbackSucceededEvent;
  'handoff.failed.permanently': HandoffFailedPermanentlyEvent;
  
  // Context preservation events
  'context.preserved': ContextPreservedEvent;
  'context.preservation.failed': ContextPreservationFailedEvent;
  'context.restored': ContextRestoredEvent;
  'context.restoration.failed': ContextRestorationFailedEvent;
  'context.rollback': ContextRollbackEvent;
  'context.rollback.failed': ContextRollbackFailedEvent;
  
  // Error recovery events
  'tool.execution.recovered': ToolExecutionRecoveredEvent;
  'tool.execution.retry': ToolExecutionRetryEvent;
  'tool.execution.failed.permanently': ToolExecutionFailedPermanentlyEvent;
  
  // Fallback strategy events
  'fallback.provider.registered': FallbackProviderRegisteredEvent;
  'operation.executed': OperationExecutedEvent;
  'operation.fallback.initiated': OperationFallbackInitiatedEvent;
  'operation.fallback.succeeded': OperationFallbackSucceededEvent;


  'operation.fallback.failed': OperationFallbackFailedEvent;
  'operation.failed.permanently': OperationFailedPermanentlyEvent;
  'tool.degraded': ToolDegradedEvent;
  'mode.degraded': ModeDegradedEvent;
  'fallback.provider.removed': FallbackProviderRemovedEvent;
  
  // Cross language events
  'cross.language.sent': CrossLanguageSentEvent;
  'cross.language.received': CrossLanguageReceivedEvent;
  'cross.language.failed': CrossLanguageFailedEvent;
  
  // Event processing events
  'event.processed': EventProcessedEvent;
  'event.processing.failed': EventProcessingFailedEvent;
  
  // A2A handshake events
  'a2a.handshake.request': A2AHandshakeRequestEvent;
  'a2a.handshake.response': A2AHandshakeResponseEvent;
  'a2a.task.negotiation.request': A2ATaskNegotiationRequestEvent;
  'a2a.task.negotiation.response': A2ATaskNegotiationResponseEvent;
  'a2a.state.sync.request': A2AStateSyncRequestEvent;
  'a2a.state.sync.response': A2AStateSyncResponseEvent;
  
  // WebRTC events
  'webrtc.ice-candidate': WebRTCIceCandidateEvent;
  'webrtc.connection-state': WebRTCConnectionStateEvent;
  'webrtc.sdp-offer': WebRTCSdpOfferEvent;
  'webrtc.sdp-answer': WebRTCSdpAnswerEvent;
  
  // AG-UI events
  'ag-ui.message': AGUIMessageEvent;
  'ag-ui.stream.start': AGUIStreamStartEvent;
  'ag-ui.stream.end': AGUIStreamEndEvent;
  
  // Delegate events
  'delegate.task.request': DelegateTaskRequestEvent;
  'delegate.task.started': DelegateTaskStartedEvent;
  'delegate.task.completed': DelegateTaskCompletedEvent;
  'delegate.task.failed': DelegateTaskFailedEvent;
  
  // Multimodal events
  'vision.image.processed': VisionImageProcessedEvent;
  'vision.image.generated': VisionImageGeneratedEvent;
  'vision.screenshot.analyzed': VisionScreenshotAnalyzedEvent;
  'vision.ui.elements.recognized': VisionUIElementsRecognizedEvent;
  'vision.code.generated': VisionCodeGeneratedEvent;
  'voice.audio.processing': VoiceAudioProcessingEvent;
  'voice.audio.processed': VoiceAudioProcessedEvent;
  'voice.audio.generating': VoiceAudioGeneratingEvent;
  'voice.audio.generated': VoiceAudioGeneratedEvent;
  'voice.audio.error': VoiceAudioErrorEvent;
  'voice.question.asking': VoiceQuestionAskingEvent;
  'voice.question.answered': VoiceQuestionAnsweredEvent;
  'voice.question.error': VoiceQuestionErrorEvent;
  'voice.command.executing': VoiceCommandExecutingEvent;
  'voice.command.executed': VoiceCommandExecutedEvent;
  'voice.command.error': VoiceCommandEvent;
  'voice.dictation.started': VoiceDictationStartedEvent;
  'voice.dictation.completed': VoiceDictationCompletedEvent;
  'voice.dictation.error': VoiceDictationErrorEvent;
  // Multimodal coordination events
  'multimodal.modality.switched': MultimodalModalitySwitchedEvent;
  'multimodal.modality.priority.updated': MultimodalModalityPriorityUpdatedEvent;
  'multimodal.context.preserved': MultimodalContextPreservedEvent;
  'multimodal.context.updated': MultimodalContextUpdatedEvent;
  'multimodal.processing.started': MultimodalProcessingStartedEvent;
  'multimodal.processing.completed': MultimodalProcessingCompletedEvent;
  'multimodal.processing.error': MultimodalProcessingErrorEvent;
  'multimodal.vision.processing.error': MultimodalVisionProcessingErrorEvent;
  'multimodal.voice.processing.error': MultimodalVoiceProcessingErrorEvent;
  'multimodal.processing.fallback': MultimodalProcessingFallbackEvent;
  
  // Additional event types
  'benchmark.completed': BenchmarkCompletedEvent;
  'test.event': TestEvent;
  'memory.episode.stored': MemoryEpisodeStoredEvent;
  'marketplace.initialized': MarketplaceInitializedEvent;
  'marketplace.skill.registered': MarketplaceSkillRegisteredEvent;
  'marketplace.skill.submitted': MarketplaceSkillSubmittedEvent;
  'marketplace.skill.installed': MarketplaceSkillInstalledEvent;
  'marketplace.skill.uninstalled': MarketplaceSkillUninstalledEvent;
  'mcp.scaffolding.generated': MCPScaffoldingGeneratedEvent;
  'mcp.scaffolding.registered': MCPScaffoldingRegisteredEvent;
  'mcp.scaffolding.tests.completed': MCPScaffoldingTestsCompletedEvent;
  'inference.initialized': InferenceInitializedEvent;
  'inference.health.updated': InferenceHealthUpdatedEvent;
  'inference.alerts.triggered': InferenceAlertsTriggeredEvent;
  'inference.thermal.throttle': InferenceThermalThrottleEvent;
  'inference.backend.switched': InferenceBackendSwitchedEvent;
  'inference.perf-mode.changed': InferencePerfModeChangedEvent;
  'roi.updated': ROiUpdatedEvent;
  'memory.entities.extracted': MemoryEntitiesExtractedEvent;
  'memory.session.pruned': MemorySessionPrunedEvent;
  'visual-feedback.initialized': VisualFeedbackInitializedEvent;
  'visual-feedback.screenshot-compared': VisualFeedbackScreenshotComparedEvent;
  'visual-feedback.regression-detected': VisualFeedbackRegressionDetectedEvent;
  'visual-feedback.ui-monitored': VisualFeedbackUiMonitoredEvent;
  'vector.document.indexed': VectorDocumentIndexedEvent;
  'skill-manager.initialized': SkillManagerInitializedEvent;
  'skill.executed': SkillExecutedEvent;
  'skill.execution-failed': SkillExecutionFailedEvent;
  'skill.registered': SkillRegisteredEvent;
  'skill.unregistered': SkillUnregisteredEvent;
  'phase.report.generated': PhaseReportGeneratedEvent;
  'swarm.session.created': SwarmSessionCreatedEvent;
  'swarm.session.participant.joined': SwarmSessionParticipantJoinedEvent;
  'swarm.session.participant.left': SwarmSessionParticipantLeftEvent;
  'swarm.session.closed': SwarmSessionClosedEvent;
  'swarm.task.completed': SwarmTaskCompletedEvent;
  'swarm.task.vetoed': SwarmTaskVetoedEvent;
  'session.exported': SessionExportedEvent;
  'phase22.initialized': Phase22InitializedEvent;
  'phase21.initialized': Phase21InitializedEvent;
  'a2a.handshake.completed': A2AHandshakeCompletedEvent;
  'llm-judge.judgment-made': LLMJudgeJudgmentMadeEvent;
  'prompt-engineer.connected': PromptEngineerConnectedEvent;
  'prompt-engineer.disconnected': PromptEngineerDisconnectedEvent;
  'phase18.initialized': Phase18InitializedEvent;
  'benchmark.failed': BenchmarkFailedEvent;
  'phase18.cleanup': Phase18CleanupEvent;
  
  // Research events
  'research.findings.available': ResearchFindingsAvailableEvent;
  
  // Agent interaction events
  'agent.interaction': AgentInteractionEvent;
  'agent.skill.acquired': AgentSkillAcquiredEvent;
  'agent.created': AgentCreatedEvent;
  'agent.coordination': AgentCoordinationEvent;
  'agent.prompt.used': AgentPromptUsedEvent;
  'skill.marketplace.available': SkillMarketplaceAvailableEvent;
  
  // MCP connector events
  'mcp.connector.connected': any;
  'mcp.connector.disconnected': any;
  'mcp.connector.error': any;
  'mcp.connector.close': any;
  'mcp.tool.called': any;
  'mcp.request.retry': any;
  'mcp.connector.reconnect.failed': any;
  'mcp.benchmark.completed': MCPBenchmarkCompletedEvent;
  'mcp.tool.deprecated': MCPToolDeprecatedEvent;
  'mcp.tool.migrated': MCPToolMigratedEvent;
  
  // Additional event types used in the codebase but not previously defined
  'task.progress': any;
  'task.complete': any;
  'agent.error': any;
  'conversation.updated': any;
  'phase.completed': any;
}

// Additional event types not previously defined
export interface BenchmarkCompletedEvent extends LAPAEvent {
  type: 'benchmark.completed';
  payload: {
    results: any[];
    timestamp: number;
  };
}

export interface TestEvent extends LAPAEvent {
  type: 'test.event';
  payload: {
    iteration?: number;
    [key: string]: any;
  };
}

export interface MemoryEpisodeStoredEvent extends LAPAEvent {
  type: 'memory.episode.stored';
  payload: {
    episodeId: string;
    agentId: string;
    taskId: string;
    sessionId: string;
    timestamp: number;
  };
}

export interface MarketplaceInitializedEvent extends LAPAEvent {
  type: 'marketplace.initialized';
  payload: {
    timestamp: number;
  };
}

export interface MarketplaceSkillRegisteredEvent extends LAPAEvent {
  type: 'marketplace.skill.registered';
  payload: {
    skillId: string;
    name: string;
    version: string;
    timestamp: number;
  };
}

export interface MarketplaceSkillSubmittedEvent extends LAPAEvent {
  type: 'marketplace.skill.submitted';
  payload: {
    skillId: string;
    name: string;
    version: string;
    timestamp: number;
  };
}

export interface MarketplaceSkillInstalledEvent extends LAPAEvent {
  type: 'marketplace.skill.installed';
  payload: {
    skillId: string;
    timestamp: number;
  };
}

export interface MarketplaceSkillUninstalledEvent extends LAPAEvent {
  type: 'marketplace.skill.uninstalled';
  payload: {
    skillId: string;
    timestamp: number;
  };
}

export interface MCPScaffoldingGeneratedEvent extends LAPAEvent {
  type: 'mcp.scaffolding.generated';
  payload: {
    toolName: string;
    language: string;
    timestamp: number;
  };
}

export interface MCPScaffoldingRegisteredEvent extends LAPAEvent {
  type: 'mcp.scaffolding.registered';
  payload: {
    toolName: string;
    timestamp: number;
  };
}

export interface MCPScaffoldingTestsCompletedEvent extends LAPAEvent {
  type: 'mcp.scaffolding.tests.completed';
  payload: {
    toolName: string;
    results: any[];
    timestamp: number;
  };
}

// MCP Benchmark events
export interface MCPBenchmarkCompletedEvent extends LAPAEvent {
  type: 'mcp.benchmark.completed';
  payload: {
    serverName: string;
    toolName: string;
    timestamp: number;
    latency: {
      min: number;
      max: number;
      mean: number;
      median: number;
      p50: number;
      p95: number;
      p99: number;
      stdDev: number;
    };
    throughput: {
      requestsPerSecond: number;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
    };
    memory?: {
      baseline: number;
      peak: number;
      average: number;
      leak: number;
    };
    errors: {
      count: number;
      rate: number;
      types: Record<string, number>;
    };
    metadata: {
      warmupIterations: number;
      benchmarkIterations: number;
      concurrency: number;
      duration: number;
    };
  };
}

// MCP Tool Versioning events
export interface MCPToolDeprecatedEvent extends LAPAEvent {
  type: 'mcp.tool.deprecated';
  payload: {
    serverName: string;
    toolName: string;
    version: string;
    reason?: string;
    replacement?: string;
    migrationGuide?: string;
  };
}

export interface MCPToolMigratedEvent extends LAPAEvent {
  type: 'mcp.tool.migrated';
  payload: {
    serverName: string;
    toolName: string;
    fromVersion: string;
    toVersion: string;
    success: boolean;
    warnings?: string[];
    errors?: string[];
  };
}

export interface InferenceInitializedEvent extends LAPAEvent {
  type: 'inference.initialized';
  payload: {
    backend: string;
    timestamp: number;
  };
}

export interface InferenceHealthUpdatedEvent extends LAPAEvent {
  type: 'inference.health.updated';
  payload: {
    health: any;
    timestamp: number;
  };
}

export interface InferenceAlertsTriggeredEvent extends LAPAEvent {
  type: 'inference.alerts.triggered';
  payload: {
    alerts: any[];
    timestamp: number;
  };
}

export interface InferenceThermalThrottleEvent extends LAPAEvent {
  type: 'inference.thermal.throttle';
  payload: {
    temperature: number;
    timestamp: number;
  };
}

export interface InferenceBackendSwitchedEvent extends LAPAEvent {
  type: 'inference.backend.switched';
  payload: {
    backend: string;
    timestamp: number;
  };
}

export interface InferencePerfModeChangedEvent extends LAPAEvent {
  type: 'inference.perf-mode.changed';
  payload: {
    perfMode: number;
    timestamp: number;
  };
}

export interface ROiUpdatedEvent extends LAPAEvent {
  type: 'roi.updated';
  payload: {
    metrics: any;
    timestamp: number;
  };
}

export interface MemoryEntitiesExtractedEvent extends LAPAEvent {
  type: 'memory.entities.extracted';
  payload: {
    entities: any[];
    sessionId: string;
    timestamp: number;
  };
}

export interface MemorySessionPrunedEvent extends LAPAEvent {
  type: 'memory.session.pruned';
  payload: {
    sessionId: string;
    timestamp: number;
  };
}

export interface VisualFeedbackInitializedEvent extends LAPAEvent {
  type: 'visual-feedback.initialized';
  payload: {
    timestamp: number;
  };
}

export interface VisualFeedbackScreenshotComparedEvent extends LAPAEvent {
  type: 'visual-feedback.screenshot-compared';
  payload: {
    comparisonId: string;
    similarity: number;
    timestamp: number;
  };
}

export interface VisualFeedbackRegressionDetectedEvent extends LAPAEvent {
  type: 'visual-feedback.regression-detected';
  payload: {
    regressionId: string;
    details: any;
    timestamp: number;
  };
}

export interface VisualFeedbackUiMonitoredEvent extends LAPAEvent {
  type: 'visual-feedback.ui-monitored';
  payload: {
    elementId: string;
    state: any;
    timestamp: number;
  };
}

export interface VectorDocumentIndexedEvent extends LAPAEvent {
  type: 'vector.document.indexed';
  payload: {
    documentId: string;
    indexId: string;
    timestamp: number;
  };
}

export interface SkillManagerInitializedEvent extends LAPAEvent {
  type: 'skill-manager.initialized';
  payload: {
    timestamp: number;
  };
}

export interface SkillExecutedEvent extends LAPAEvent {
  type: 'skill.executed';
  payload: {
    skillId: string;
    result: any;
    executionTime: number;
    timestamp: number;
  };
}

export interface SkillExecutionFailedEvent extends LAPAEvent {
  type: 'skill.execution-failed';
  payload: {
    skillId: string;
    error: string;
    executionTime: number;
    timestamp: number;
  };
}

export interface SkillRegisteredEvent extends LAPAEvent {
  type: 'skill.registered';
  payload: {
    skillId: string;
    name: string;
    version: string;
    timestamp: number;
  };
}

export interface SkillUnregisteredEvent extends LAPAEvent {
  type: 'skill.unregistered';
  payload: {
    skillId: string;
    timestamp: number;
  };
}

export interface PhaseReportGeneratedEvent extends LAPAEvent {
  type: 'phase.report.generated';
  payload: {
    phase: number;
    report: any;
    timestamp: number;
  };
}

export interface SwarmSessionCreatedEvent extends LAPAEvent {
  type: 'swarm.session.created';
  payload: {
    sessionId: string;
    config: any;
    timestamp: number;
  };
}

export interface SwarmSessionParticipantJoinedEvent extends LAPAEvent {
  type: 'swarm.session.participant.joined';
  payload: {
    sessionId: string;
    participantId: string;
    timestamp: number;
  };
}

export interface SwarmSessionParticipantLeftEvent extends LAPAEvent {
  type: 'swarm.session.participant.left';
  payload: {
    sessionId: string;
    participantId: string;
    timestamp: number;
  };
}

export interface SwarmSessionClosedEvent extends LAPAEvent {
  type: 'swarm.session.closed';
  payload: {
    sessionId: string;
    timestamp: number;
  };
}

export interface SwarmTaskCompletedEvent extends LAPAEvent {
  type: 'swarm.task.completed';
  payload: {
    taskId: string;
    sessionId: string;
    result: any;
    executionTime: number;
    timestamp: number;
  };
}

export interface SwarmTaskVetoedEvent extends LAPAEvent {
  type: 'swarm.task.vetoed';
  payload: {
    taskId: string;
    sessionId: string;
    reason: string;
    timestamp: number;
  };
}

export interface SessionExportedEvent extends LAPAEvent {
  type: 'session.exported';
  payload: {
    sessionId: string;
    exportPath: string;
    timestamp: number;
  };
}

export interface Phase22InitializedEvent extends LAPAEvent {
  type: 'phase22.initialized';
  payload: {
    timestamp: number;
  };
}

export interface Phase21InitializedEvent extends LAPAEvent {
  type: 'phase21.initialized';
  payload: {
    timestamp: number;
  };
}

export interface A2AHandshakeCompletedEvent extends LAPAEvent {
  type: 'a2a.handshake.completed';
  payload: {
    handshakeId: string;
    accepted: boolean;
    sessionId?: string;
  };
}

export interface LLMJudgeJudgmentMadeEvent extends LAPAEvent {
  type: 'llm-judge.judgment-made';
  payload: {
    judgmentId: string;
    request: any;
    result: any;
    timestamp: number;
  };
}

export interface PromptEngineerConnectedEvent extends LAPAEvent {
  type: 'prompt-engineer.connected';
  payload: {
    timestamp: number;
  };
}

export interface PromptEngineerDisconnectedEvent extends LAPAEvent {
  type: 'prompt-engineer.disconnected';
  payload: {
    timestamp: number;
  };
}

export interface Phase18InitializedEvent extends LAPAEvent {
  type: 'phase18.initialized';
  payload: {
    timestamp: number;
  };
}

export interface BenchmarkFailedEvent extends LAPAEvent {
  type: 'benchmark.failed';
  payload: {
    error: string;
    timestamp: number;
  };
}

export interface Phase18CleanupEvent extends LAPAEvent {
  type: 'phase18.cleanup';
  payload: {
    timestamp: number;
  };
}

// Research events
export interface ResearchFindingsAvailableEvent extends LAPAEvent {
  type: 'research.findings.available';
  payload: {
    findingId: string;
    source: string;
    category: string;
    title: string;
    description: string;
    data: Record<string, unknown>;
    valuePotential: number;
    implementationSuggestion?: string;
    url?: string;
    tags: string[];
    timestamp: string;
    findings: Array<{
      findingId: string;
      source: string;
      category: string;
      title: string;
      description: string;
      data: Record<string, unknown>;
      valuePotential: number;
      implementationSuggestion?: string;
      url?: string;
      tags: string[];
      timestamp: Date;
    }>;
  };
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