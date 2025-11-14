"use strict";
/**
 * LAPA Core Module Exports
 *
 * This module exports all core functionality for the LAPA event bus system,
 * including the event bus implementation, typed event definitions, and
 * utility functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoRulesManager = exports.RepoRulesManager = exports.deserializeEventFromInterop = exports.serializeEventForInterop = exports.setupDefaultLAPARoutes = exports.routeEvent = exports.eventRouter = exports.EventRouter = exports.eventBus = exports.LAPAEventBus = void 0;
// Export the main event bus implementation
var event_bus_ts_1 = require("./event-bus.ts");
Object.defineProperty(exports, "LAPAEventBus", { enumerable: true, get: function () { return event_bus_ts_1.LAPAEventBus; } });
Object.defineProperty(exports, "eventBus", { enumerable: true, get: function () { return event_bus_ts_1.eventBus; } });
// Export event routing utilities
var event_router_ts_1 = require("./utils/event-router.ts");
Object.defineProperty(exports, "EventRouter", { enumerable: true, get: function () { return event_router_ts_1.EventRouter; } });
Object.defineProperty(exports, "eventRouter", { enumerable: true, get: function () { return event_router_ts_1.eventRouter; } });
Object.defineProperty(exports, "routeEvent", { enumerable: true, get: function () { return event_router_ts_1.routeEvent; } });
Object.defineProperty(exports, "setupDefaultLAPARoutes", { enumerable: true, get: function () { return event_router_ts_1.setupDefaultLAPARoutes; } });
// Export cross-language compatibility functions
var event_types_ts_1 = require("./types/event-types.ts");
Object.defineProperty(exports, "serializeEventForInterop", { enumerable: true, get: function () { return event_types_ts_1.serializeEventForInterop; } });
Object.defineProperty(exports, "deserializeEventFromInterop", { enumerable: true, get: function () { return event_types_ts_1.deserializeEventFromInterop; } });
// Export repository rules manager (Phase 15)
var repo_rules_ts_1 = require("./repo-rules.ts");
Object.defineProperty(exports, "RepoRulesManager", { enumerable: true, get: function () { return repo_rules_ts_1.RepoRulesManager; } });
Object.defineProperty(exports, "repoRulesManager", { enumerable: true, get: function () { return repo_rules_ts_1.repoRulesManager; } });
//# sourceMappingURL=index.js.map