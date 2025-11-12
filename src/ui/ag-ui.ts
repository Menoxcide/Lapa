/**
 * AG-UI (Agent-to-UI) Foundation for LAPA v1.2 Protocol-Resonant Nexus — Phase 10
 * 
 * This module implements the AG-UI foundation for generative, real-time interfaces.
 * It provides event streaming, dynamic component generation, and UI state management
 * for seamless agent-to-UI communication.
 * 
 * Phase 13 will extend this with full AG-UI + Dynamic Studio integration.
 */

import { eventBus } from '../core/event-bus.ts';
import { Task } from '../agents/moe-router.ts';
import { z } from 'zod';

// Zod schema for AG-UI event validation
const agUIEventSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  timestamp: z.number(),
  payload: z.record(z.unknown())
});

// Zod schema for AG-UI component validation
const agUIComponentSchema = z.object({
  componentId: z.string(),
  componentType: z.string(),
  props: z.record(z.unknown()),
  children: z.array(z.unknown()).optional()
});

// AG-UI event interface
export interface AGUIEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// AG-UI component interface
export interface AGUIComponent {
  componentId: string;
  componentType: string;
  props: Record<string, unknown>;
  children?: AGUIComponent[];
}

// AG-UI stream configuration
export interface AGUIStreamConfig {
  enableEventStreaming: boolean;
  enableDynamicComponents: boolean;
  enableUIStateManagement: boolean;
  streamBufferSize: number;
  componentUpdateRate: number; // Updates per second
}

// Default configuration
const DEFAULT_CONFIG: AGUIStreamConfig = {
  enableEventStreaming: true,
  enableDynamicComponents: true,
  enableUIStateManagement: true,
  streamBufferSize: 1000,
  componentUpdateRate: 60
};

// AG-UI event types
export type AGUIEventType =
  | 'ui.component.update'
  | 'ui.component.create'
  | 'ui.component.delete'
  | 'ui.state.update'
  | 'ui.task.progress'
  | 'ui.task.complete'
  | 'ui.error'
  | 'ui.stream.start'
  | 'ui.stream.stop';

/**
 * AG-UI Foundation
 * 
 * Manages agent-to-UI communication with event streaming, dynamic component generation,
 * and UI state management for seamless agent-to-UI interaction.
 */
export class AGUIFoundation {
  private config: AGUIStreamConfig;
  private eventStream: AGUIEvent[] = [];
  private uiComponents: Map<string, AGUIComponent> = new Map();
  private uiState: Record<string, unknown> = {};
  private streamSubscriptions: Map<string, (event: AGUIEvent) => void> = new Map();
  private isStreaming: boolean = false;

  constructor(config?: Partial<AGUIStreamConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Subscribe to agent events for UI updates
    eventBus.subscribe('task.progress', async (event) => {
      await this.handleTaskProgress(event.payload as { taskId: string; progress: number });
    });
    
    eventBus.subscribe('task.complete', async (event) => {
      await this.handleTaskComplete(event.payload as { taskId: string; result: unknown });
    });
    
    eventBus.subscribe('agent.error', async (event) => {
      await this.handleAgentError(event.payload as { agentId: string; error: string });
    });
  }

  /**
   * Starts the AG-UI event stream
   * @returns Promise that resolves when streaming starts
   */
  async startStream(): Promise<void> {
    if (this.isStreaming) {
      console.warn('AG-UI stream is already running');
      return;
    }
    
    this.isStreaming = true;
    console.log('Starting AG-UI event stream');
    
    // Publish stream start event
    await eventBus.publish({
      id: `ag-ui-stream-start-${Date.now()}`,
      type: 'ui.stream.start',
      timestamp: Date.now(),
      source: 'ag-ui',
      payload: {
        streamId: `stream_${Date.now()}`,
        config: this.config
      }
    });
  }

  /**
   * Stops the AG-UI event stream
   * @returns Promise that resolves when streaming stops
   */
  async stopStream(): Promise<void> {
    if (!this.isStreaming) {
      console.warn('AG-UI stream is not running');
      return;
    }
    
    this.isStreaming = false;
    console.log('Stopping AG-UI event stream');
    
    // Publish stream stop event
    await eventBus.publish({
      id: `ag-ui-stream-stop-${Date.now()}`,
      type: 'ui.stream.stop',
      timestamp: Date.now(),
      source: 'ag-ui',
      payload: {
        streamId: `stream_${Date.now()}`
      }
    });
  }

  /**
   * Publishes an AG-UI event
   * @param eventType Event type
   * @param payload Event payload
   * @returns Promise that resolves when event is published
   */
  async publishEvent(eventType: AGUIEventType, payload: Record<string, unknown>): Promise<void> {
    if (!this.config.enableEventStreaming) {
      return;
    }
    
    const event: AGUIEvent = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: Date.now(),
      payload
    };
    
    // Validate event with Zod schema
    const validatedEvent = agUIEventSchema.parse(event);
    
    // Add to event stream
    this.eventStream.push(validatedEvent);
    
    // Maintain stream buffer size
    if (this.eventStream.length > this.config.streamBufferSize) {
      this.eventStream = this.eventStream.slice(-this.config.streamBufferSize);
    }
    
    // Publish event to event bus
    await eventBus.publish({
      id: validatedEvent.eventId,
      type: eventType,
      timestamp: validatedEvent.timestamp,
      source: 'ag-ui',
      payload: validatedEvent.payload
    });
    
    // Notify stream subscribers
    for (const [subscriptionId, callback] of this.streamSubscriptions) {
      try {
        callback(validatedEvent);
      } catch (error) {
        console.error(`Error in stream subscription ${subscriptionId}:`, error);
      }
    }
  }

  /**
   * Creates a dynamic UI component
   * @param componentType Component type
   * @param props Component props
   * @param children Component children
   * @returns Created component
   */
  createComponent(
    componentType: string,
    props: Record<string, unknown>,
    children?: AGUIComponent[]
  ): AGUIComponent {
    if (!this.config.enableDynamicComponents) {
      throw new Error('Dynamic components are disabled');
    }
    
    const component: AGUIComponent = {
      componentId: this.generateComponentId(),
      componentType,
      props,
      children
    };
    
    // Validate component with Zod schema
    const validatedComponent = agUIComponentSchema.parse(component);
    
    // Store component
    this.uiComponents.set(validatedComponent.componentId, validatedComponent);
    
    // Publish component creation event
    this.publishEvent('ui.component.create', {
      componentId: validatedComponent.componentId,
      componentType: validatedComponent.componentType,
      props: validatedComponent.props
    }).catch(console.error);
    
    console.log(`Created AG-UI component: ${validatedComponent.componentId} (${validatedComponent.componentType})`);
    
    return validatedComponent;
  }

  /**
   * Updates a UI component
   * @param componentId Component ID
   * @param props Updated props
   * @returns Updated component or undefined if not found
   */
  updateComponent(componentId: string, props: Record<string, unknown>): AGUIComponent | undefined {
    const component = this.uiComponents.get(componentId);
    if (!component) {
      console.warn(`Component ${componentId} not found`);
      return undefined;
    }
    
    // Update component props
    component.props = { ...component.props, ...props };
    
    // Publish component update event
    this.publishEvent('ui.component.update', {
      componentId: component.componentId,
      componentType: component.componentType,
      props: component.props
    }).catch(console.error);
    
    console.log(`Updated AG-UI component: ${componentId}`);
    
    return component;
  }

  /**
   * Deletes a UI component
   * @param componentId Component ID
   * @returns Boolean indicating if component was deleted
   */
  deleteComponent(componentId: string): boolean {
    const component = this.uiComponents.get(componentId);
    if (!component) {
      console.warn(`Component ${componentId} not found`);
      return false;
    }
    
    // Remove component
    this.uiComponents.delete(componentId);
    
    // Publish component deletion event
    this.publishEvent('ui.component.delete', {
      componentId: component.componentId,
      componentType: component.componentType
    }).catch(console.error);
    
    console.log(`Deleted AG-UI component: ${componentId}`);
    
    return true;
  }

  /**
   * Updates UI state
   * @param key State key
   * @param value State value
   * @returns Promise that resolves when state is updated
   */
  async updateUIState(key: string, value: unknown): Promise<void> {
    if (!this.config.enableUIStateManagement) {
      return;
    }
    
    // Update state
    this.uiState[key] = value;
    
    // Publish state update event
    await this.publishEvent('ui.state.update', {
      key,
      value,
      state: this.uiState
    });
    
    console.log(`Updated UI state: ${key}`);
  }

  /**
   * Gets UI state
   * @param key State key (optional)
   * @returns State value or entire state object
   */
  getUIState(key?: string): unknown {
    if (key) {
      return this.uiState[key];
    }
    return { ...this.uiState };
  }

  /**
   * Subscribes to AG-UI event stream
   * @param callback Callback function
   * @returns Subscription ID
   */
  subscribeToStream(callback: (event: AGUIEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    this.streamSubscriptions.set(subscriptionId, callback);
    console.log(`Subscribed to AG-UI stream: ${subscriptionId}`);
    return subscriptionId;
  }

  /**
   * Unsubscribes from AG-UI event stream
   * @param subscriptionId Subscription ID
   * @returns Boolean indicating if subscription was removed
   */
  unsubscribeFromStream(subscriptionId: string): boolean {
    const removed = this.streamSubscriptions.delete(subscriptionId);
    if (removed) {
      console.log(`Unsubscribed from AG-UI stream: ${subscriptionId}`);
    }
    return removed;
  }

  /**
   * Handles task progress event
   * @param payload Task progress payload
   */
  private async handleTaskProgress(payload: { taskId: string; progress: number }): Promise<void> {
    await this.publishEvent('ui.task.progress', {
      taskId: payload.taskId,
      progress: payload.progress
    });
  }

  /**
   * Handles task complete event
   * @param payload Task complete payload
   */
  private async handleTaskComplete(payload: { taskId: string; result: unknown }): Promise<void> {
    await this.publishEvent('ui.task.complete', {
      taskId: payload.taskId,
      result: payload.result
    });
  }

  /**
   * Handles agent error event
   * @param payload Agent error payload
   */
  private async handleAgentError(payload: { agentId: string; error: string }): Promise<void> {
    await this.publishEvent('ui.error', {
      agentId: payload.agentId,
      error: payload.error
    });
  }

  /**
   * Gets current configuration
   * @returns Current configuration
   */
  getConfig(): AGUIStreamConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<AGUIStreamConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('AG-UI configuration updated:', this.config);
  }

  /**
   * Gets event stream
   * @returns Event stream array
   */
  getEventStream(): AGUIEvent[] {
    return [...this.eventStream];
  }

  /**
   * Gets UI components
   * @returns UI components map
   */
  getUIComponents(): Map<string, AGUIComponent> {
    return new Map(this.uiComponents);
  }

  /**
   * Gets component by ID
   * @param componentId Component ID
   * @returns Component or undefined if not found
   */
  getComponent(componentId: string): AGUIComponent | undefined {
    return this.uiComponents.get(componentId);
  }

  /**
   * Checks if streaming is active
   * @returns Boolean indicating if streaming is active
   */
  isStreamActive(): boolean {
    return this.isStreaming;
  }

  /**
   * Generates a unique event ID
   * @returns Unique event ID
   */
  private generateEventId(): string {
    return `ag-ui-event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique component ID
   * @returns Unique component ID
   */
  private generateComponentId(): string {
    return `ag-ui-component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique subscription ID
   * @returns Unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `ag-ui-subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const agUIFoundation = new AGUIFoundation();

/**
 * Convenience function for publishing an AG-UI event
 * @param eventType Event type
 * @param payload Event payload
 * @returns Promise that resolves when event is published
 */
export async function publishAGUIEvent(
  eventType: AGUIEventType,
  payload: Record<string, unknown>
): Promise<void> {
  return await agUIFoundation.publishEvent(eventType, payload);
}

/**
 * Convenience function for creating an AG-UI component
 * @param componentType Component type
 * @param props Component props
 * @param children Component children
 * @returns Created component
 */
export function createAGUIComponent(
  componentType: string,
  props: Record<string, unknown>,
  children?: AGUIComponent[]
): AGUIComponent {
  return agUIFoundation.createComponent(componentType, props, children);
}
