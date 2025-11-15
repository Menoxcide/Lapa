/**
 * LAPA Core Module Exports
 * 
 * This module exports all core functionality for the LAPA event bus system,
 * including the event bus implementation, typed event definitions, and
 * utility functions.
 */

// Export the main event bus implementation
export { LAPAEventBus, eventBus } from './event-bus.ts';

// Export typed event definitions
export type { 
  LAPAEvent, 
  LAPAEventMap, 
  LAPAEventType, 
  LAPAEventOfType,
  HandoffInitiatedEvent,
  HandoffCompletedEvent,
  HandoffFailedEvent,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  AgentRegisteredEvent,
  AgentUnregisteredEvent,
  AgentWorkloadUpdatedEvent,
  ContextCompressedEvent,
  ContextDecompressedEvent,
  SystemInitializedEvent,
  SystemShutdownEvent,
  SystemErrorEvent,
  SystemWarningEvent,
  PerformanceMetricEvent,
  CrossLanguageEvent
} from './types/event-types.ts';

// Export event routing utilities
export { 
  EventRouter, 
  eventRouter, 
  routeEvent,
  setupDefaultLAPARoutes
} from './utils/event-router.ts';

// Export cross-language compatibility functions
export { 
  serializeEventForInterop, 
  deserializeEventFromInterop 
} from './types/event-types.ts';

// Export repository rules manager (Phase 15)
export { RepoRulesManager, repoRulesManager } from './repo-rules.ts';
export type {
  RepoRule,
  DirectoryRule,
  LayerDependencyRule,
  CodeGenRuleResult,
  RepoRuleViolation
} from './repo-rules.ts';