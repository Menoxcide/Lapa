"use strict";
/**
 * Local Memory and Storage Module for LAPA
 *
 * This module exports local-first memory and storage components including:
 * - Memori SQLite integration
 * - Enhanced Memori Engine (Phase 12)
 * - Episodic Memory Store (Phase 12)
 * - Local inference adapters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = exports.LlamaCppAdapter = exports.NIMIntegration = exports.OllamaCompatibility = exports.generateRecallReport = exports.validateRecallTarget = exports.measureCombinedRecall = exports.measureChromaRecall = exports.measureEpisodicRecall = exports.measureMemoriRecall = exports.EpisodicMemoryStore = exports.episodicMemoryStore = exports.MemoriEngine = exports.memoriEngine = exports.AutoGenMemoriSQLite = exports.autoGenMemoriSQLite = void 0;
// Memori SQLite (Phase 9)
var memori_sqlite_ts_1 = require("./memori-sqlite.ts");
Object.defineProperty(exports, "autoGenMemoriSQLite", { enumerable: true, get: function () { return memori_sqlite_ts_1.autoGenMemoriSQLite; } });
Object.defineProperty(exports, "AutoGenMemoriSQLite", { enumerable: true, get: function () { return memori_sqlite_ts_1.AutoGenMemoriSQLite; } });
// Phase 12: Enhanced Memori Engine
var memori_engine_ts_1 = require("./memori-engine.ts");
Object.defineProperty(exports, "memoriEngine", { enumerable: true, get: function () { return memori_engine_ts_1.memoriEngine; } });
Object.defineProperty(exports, "MemoriEngine", { enumerable: true, get: function () { return memori_engine_ts_1.MemoriEngine; } });
// Phase 12: Episodic Memory Store
var episodic_ts_1 = require("./episodic.ts");
Object.defineProperty(exports, "episodicMemoryStore", { enumerable: true, get: function () { return episodic_ts_1.episodicMemoryStore; } });
Object.defineProperty(exports, "EpisodicMemoryStore", { enumerable: true, get: function () { return episodic_ts_1.EpisodicMemoryStore; } });
// Phase 12: Recall Metrics
var recall_metrics_ts_1 = require("./recall-metrics.ts");
Object.defineProperty(exports, "measureMemoriRecall", { enumerable: true, get: function () { return recall_metrics_ts_1.measureMemoriRecall; } });
Object.defineProperty(exports, "measureEpisodicRecall", { enumerable: true, get: function () { return recall_metrics_ts_1.measureEpisodicRecall; } });
Object.defineProperty(exports, "measureChromaRecall", { enumerable: true, get: function () { return recall_metrics_ts_1.measureChromaRecall; } });
Object.defineProperty(exports, "measureCombinedRecall", { enumerable: true, get: function () { return recall_metrics_ts_1.measureCombinedRecall; } });
Object.defineProperty(exports, "validateRecallTarget", { enumerable: true, get: function () { return recall_metrics_ts_1.validateRecallTarget; } });
Object.defineProperty(exports, "generateRecallReport", { enumerable: true, get: function () { return recall_metrics_ts_1.generateRecallReport; } });
// Local inference adapters
var ollama_compatibility_ts_1 = require("./ollama-compatibility.ts");
Object.defineProperty(exports, "OllamaCompatibility", { enumerable: true, get: function () { return ollama_compatibility_ts_1.AutoGenOllamaIntegration; } });
var nim_integration_ts_1 = require("./nim-integration.ts");
Object.defineProperty(exports, "NIMIntegration", { enumerable: true, get: function () { return nim_integration_ts_1.AutoGenNIMIntegration; } });
var llama_cpp_adapter_ts_1 = require("./llama-cpp-adapter.ts");
Object.defineProperty(exports, "LlamaCppAdapter", { enumerable: true, get: function () { return llama_cpp_adapter_ts_1.AutoGenLlamaCppAdapter; } });
var resource_manager_ts_1 = require("./resource-manager.ts");
Object.defineProperty(exports, "ResourceManager", { enumerable: true, get: function () { return resource_manager_ts_1.AutoGenResourceManager; } });
//# sourceMappingURL=index.js.map