/**
 * Protocol Bridging Logic for Cross-Language Communication in LAPA v1.2 Phase 10
 * 
 * This module implements the protocol bridging logic for bidirectional communication
 * between TypeScript and external .NET/Python AutoGen Core components.
 */

import { LAPAEventBus, eventBus } from '../../core/event-bus.ts';
import { LAPAEvent, CrossLanguageEvent } from '../../core/types/event-types.ts';
import { serializeEventForInterop, deserializeEventFromInterop, isValidCrossLanguageEvent } from '../types/serialization.ts';

/**
 * Abstract base class for protocol bridges
 */
export abstract class ProtocolBridge {
  protected eventBus: LAPAEventBus;
  protected isInitialized: boolean = false;

  constructor() {
    this.eventBus = eventBus;
  }

  /**
   * Initialize the bridge
   */
  abstract initialize(): Promise<void>;

  /**
   * Send an event to the external system
   * @param event The event to send
   */
  protected abstract sendEvent(event: CrossLanguageEvent): Promise<void>;

  /**
   * Handle an incoming event from the external system
   * @param event The incoming cross-language event
   */
  protected async handleIncomingEvent(event: CrossLanguageEvent): Promise<void> {
    if (!isValidCrossLanguageEvent(event)) {
      console.warn('Received invalid cross-language event:', event);
      return;
    }

    try {
      const deserializedEvent = deserializeEventFromInterop(event);
      await this.eventBus.publish(deserializedEvent);
    } catch (error) {
      console.error('Error handling incoming cross-language event:', error);
    }
  }

  /**
   * Subscribe to events from the event bus for forwarding to external systems
   * @param eventType The type of event to subscribe to
   */
  protected subscribeToEvents(eventType: string): void {
    this.eventBus.subscribe(eventType, async (event: LAPAEvent) => {
      if (this.isInitialized) {
        try {
          const serializedEvent = serializeEventForInterop(event);
          await this.sendEvent(serializedEvent);
        } catch (error) {
          console.error(`Error sending event of type ${eventType} to external system:`, error);
        }
      }
    });
  }

  /**
   * Shutdown the bridge
   */
  abstract shutdown(): Promise<void>;
}