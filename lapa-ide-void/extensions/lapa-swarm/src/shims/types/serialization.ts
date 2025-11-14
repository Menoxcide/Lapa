/**
 * Cross-Language Serialization Utilities for LAPA v1.2 Phase 10
 * 
 * This module provides utilities for serializing and deserializing events
 * for cross-language communication between TypeScript, .NET, and Python.
 */

import { LAPAEvent, CrossLanguageEvent } from '../../core/types/event-types.ts';

/**
 * Serializes a LAPA event for cross-language communication
 * @param event The event to serialize
 * @returns Serialized cross-language event
 */
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

/**
 * Deserializes a cross-language event back to a LAPA event
 * @param interopEvent The serialized cross-language event
 * @returns Deserialized LAPA event
 */
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

/**
 * Validates if an object is a properly formatted cross-language event
 * @param obj The object to validate
 * @returns Boolean indicating if the object is a valid cross-language event
 */
export function isValidCrossLanguageEvent(obj: any): obj is CrossLanguageEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.source === 'string' &&
    typeof obj.payload === 'string' &&
    (obj.metadata === undefined || typeof obj.metadata === 'object')
  );
}