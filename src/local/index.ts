/**
 * Local Memory and Storage Module for LAPA
 * 
 * This module exports local-first memory and storage components including:
 * - Memori SQLite integration
 * - Enhanced Memori Engine (Phase 12)
 * - Episodic Memory Store (Phase 12)
 * - Local inference adapters
 */

// Memori SQLite (Phase 9)
export { autoGenMemoriSQLite, AutoGenMemoriSQLite } from './memori-sqlite.ts';
export type { 
  AutoGenMemoriSQLiteConfig, 
  Entity, 
  ConversationEntry, 
  PerformanceMetric 
} from './memori-sqlite.ts';

// Phase 12: Enhanced Memori Engine
export { memoriEngine, MemoriEngine } from './memori-engine.ts';
export type { 
  MemoriEngineConfig, 
  EnhancedEntity, 
  SessionMetadata 
} from './memori-engine.ts';

// Phase 12: Episodic Memory Store
export { episodicMemoryStore, EpisodicMemoryStore } from './episodic.ts';
export type { 
  EpisodicMemoryConfig, 
  Episode 
} from './episodic.ts';

// Phase 12: Recall Metrics
export {
  measureMemoriRecall,
  measureEpisodicRecall,
  measureChromaRecall,
  measureCombinedRecall,
  validateRecallTarget,
  generateRecallReport
} from './recall-metrics.ts';
export type {
  RecallMetrics,
  RecallTestResult
} from './recall-metrics.ts';

// Local inference adapters
export { OllamaCompatibility } from './ollama-compatibility.ts';
export { NIMIntegration } from './nim-integration.ts';
export { LlamaCppAdapter } from './llama-cpp-adapter.ts';
export { ResourceManager } from './resource-manager.ts';

