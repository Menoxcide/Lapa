"use strict";
/**
 * Typed Event Definitions for LAPA Core Event Bus
 *
 * This module defines the strongly-typed event system for agent communication
 * within the LAPA swarm. It ensures type safety while maintaining flexibility
 * for cross-language compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeEventForInterop = serializeEventForInterop;
exports.deserializeEventFromInterop = deserializeEventFromInterop;
// Serialization helper functions for cross-language compatibility
function serializeEventForInterop(event) {
    return {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        source: event.source,
        target: event.target,
        payload: JSON.stringify(event.payload),
        metadata: event.metadata ? Object.fromEntries(Object.entries(event.metadata).map(([key, value]) => [key, String(value)])) : undefined
    };
}
function deserializeEventFromInterop(interopEvent) {
    return {
        id: interopEvent.id,
        type: interopEvent.type,
        timestamp: interopEvent.timestamp,
        source: interopEvent.source,
        target: interopEvent.target,
        payload: JSON.parse(interopEvent.payload),
        metadata: interopEvent.metadata ? Object.fromEntries(Object.entries(interopEvent.metadata).map(([key, value]) => [key, value])) : undefined
    };
}
//# sourceMappingURL=event-types.js.map