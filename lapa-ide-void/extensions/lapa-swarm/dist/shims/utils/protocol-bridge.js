"use strict";
/**
 * Protocol Bridging Logic for Cross-Language Communication in LAPA v1.2 Phase 10
 *
 * This module implements the protocol bridging logic for bidirectional communication
 * between TypeScript and external .NET/Python AutoGen Core components.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolBridge = void 0;
const event_bus_ts_1 = require("../../core/event-bus.ts");
const serialization_ts_1 = require("../types/serialization.ts");
/**
 * Abstract base class for protocol bridges
 */
class ProtocolBridge {
    eventBus;
    isInitialized = false;
    constructor() {
        this.eventBus = event_bus_ts_1.eventBus;
    }
    /**
     * Handle an incoming event from the external system
     * @param event The incoming cross-language event
     */
    async handleIncomingEvent(event) {
        if (!(0, serialization_ts_1.isValidCrossLanguageEvent)(event)) {
            console.warn('Received invalid cross-language event:', event);
            return;
        }
        try {
            const deserializedEvent = (0, serialization_ts_1.deserializeEventFromInterop)(event);
            await this.eventBus.publish(deserializedEvent);
        }
        catch (error) {
            console.error('Error handling incoming cross-language event:', error);
        }
    }
    /**
     * Subscribe to events from the event bus for forwarding to external systems
     * @param eventType The type of event to subscribe to
     */
    subscribeToEvents(eventType) {
        this.eventBus.subscribe(eventType, async (event) => {
            if (this.isInitialized) {
                try {
                    const serializedEvent = (0, serialization_ts_1.serializeEventForInterop)(event);
                    await this.sendEvent(serializedEvent);
                }
                catch (error) {
                    console.error(`Error sending event of type ${String(eventType)} to external system:`, error);
                }
            }
        });
    }
}
exports.ProtocolBridge = ProtocolBridge;
//# sourceMappingURL=protocol-bridge.js.map