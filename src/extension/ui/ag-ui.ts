/**
 * AG-UI (Agent-to-UI) Foundation for LAPA v1.2 Protocol-Resonant Nexus — Phase 13
 * 
 * This module implements the AG-UI foundation for generative, real-time interfaces.
 * It provides event streaming, dynamic component generation, and UI state management
 * for seamless agent-to-UI communication.
 * 
 * Phase 13: Extended with MCP integration, AutoGen Studio support, and dynamic UI generation.
 */

import { eventBus } from '@lapa/core/event-bus.js';
import { Task } from '@lapa/core/agents/moe-router.js';
import { z } from 'zod';
import type { WebSocket } from 'ws';
import {
  type MCPUIComponent,
  type MCPUIEvent,
  type MCPUIResponse,
  AGUIToMCPUIConverter,
} from './mcp-ui-specs.js';
import { createMCPConnector, type MCPConnector, type MCPConnectorConfig } from '../mcp/mcp-connector.ts';

// Zod schema for AG-UI event validation
const agUIEventSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  timestamp: z.number(),
  payload: z.record(z.unknown())
});

const agUIComponentSchema: z.ZodType<AGUIComponent> = z.object({
  componentId: z.string(),
  componentType: z.string(),
  props: z.record(z.unknown()),
  children: z.array(z.lazy(() => agUIComponentSchema)).optional()
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
  enableMCPIntegration: boolean;
  enableAutoGenStudio: boolean;
  enableOpenJSONUI: boolean;
  studioEndpoint?: string;
  websocketEndpoint?: string;
  mcpConfig?: Partial<MCPConnectorConfig>;
}

// Default configuration
const DEFAULT_CONFIG: AGUIStreamConfig = {
  enableEventStreaming: true,
  enableDynamicComponents: true,
  enableUIStateManagement: true,
  streamBufferSize: 1000,
  componentUpdateRate: 60,
  enableMCPIntegration: true,
  enableAutoGenStudio: true,
  enableOpenJSONUI: true,
  studioEndpoint: 'http://localhost:8080',
  websocketEndpoint: 'ws://localhost:8080/ws',
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
  | 'ui.stream.stop'
  | 'ui.mcp.tool.call'
  | 'ui.mcp.tool.response'
  | 'ui.studio.update'
  | 'ui.studio.stream'
  | 'ui.openjson.render'
  | 'ui.openjson.update';

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
  private websocket: WebSocket | null = null;
  private mcpComponents: Map<string, MCPUIComponent> = new Map();
  private studioConnected: boolean = false;
  private mcpConnector: MCPConnector | null = null;

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
    
    // Initialize MCP connector if enabled
    if (this.config.enableMCPIntegration && this.config.mcpConfig) {
      this.mcpConnector = createMCPConnector(this.config.mcpConfig);
      try {
        await this.mcpConnector.connect();
        console.log('MCP connector initialized for AG-UI');
      } catch (error) {
        console.error('Failed to connect MCP connector:', error);
      }
    }
    
    // Connect to WebSocket if enabled
    if (this.config.enableMCPIntegration && this.config.websocketEndpoint) {
      await this.connectWebSocket();
    }
    
    // Connect to AutoGen Studio if enabled
    if (this.config.enableAutoGenStudio && this.config.studioEndpoint) {
      await this.connectStudio();
    }
    
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
    
    // Disconnect MCP connector
    if (this.mcpConnector) {
      try {
        await this.mcpConnector.disconnect();
        this.mcpConnector = null;
      } catch (error) {
        console.error('Error disconnecting MCP connector:', error);
      }
    }
    
    // Disconnect WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    // Disconnect from Studio
    if (this.studioConnected) {
      await this.disconnectStudio();
    }
    
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
   * Connects to WebSocket for MCP integration
   * @returns Promise that resolves when connected
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.config.websocketEndpoint) {
      return;
    }
    
    try {
      // Dynamically import ws library to avoid Node.js only dependency
      const { WebSocket } = await import('ws');
      this.websocket = new WebSocket(this.config.websocketEndpoint);
      
      this.websocket.on('open', () => {
        console.log('AG-UI WebSocket connected');
      });
      
      this.websocket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.websocket.on('error', (error: Error) => {
        console.error('AG-UI WebSocket error:', error);
      });
      
      this.websocket.on('close', () => {
        console.log('AG-UI WebSocket disconnected');
        this.websocket = null;
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }
  
  /**
   * Handles WebSocket messages
   * @param data Message data
   */
  private async handleWebSocketMessage(data: unknown): Promise<void> {
    // Handle MCP-UI events
    if (this.config.enableMCPIntegration && data && typeof data === 'object' && 'type' in data) {
      await this.publishEvent('ui.mcp.tool.response', data as Record<string, unknown>);
    }
  }
  
  /**
   * Connects to AutoGen Studio
   * @returns Promise that resolves when connected
   */
  private async connectStudio(): Promise<void> {
    if (!this.config.studioEndpoint) {
      return;
    }
    
    try {
      // TODO: Implement AutoGen Studio connection
      // This would typically involve establishing a connection to the Studio API
      // and setting up event listeners for UI updates
      this.studioConnected = true;
      console.log('Connected to AutoGen Studio');
    } catch (error) {
      console.error('Error connecting to AutoGen Studio:', error);
    }
  }
  
  /**
   * Disconnects from AutoGen Studio
   * @returns Promise that resolves when disconnected
   */
  private async disconnectStudio(): Promise<void> {
    this.studioConnected = false;
    console.log('Disconnected from AutoGen Studio');
  }
  
  /**
   * Sends component to Studio
   * @param component Component to send
   * @returns Promise that resolves when sent
   */
  async sendToStudio(component: AGUIComponent): Promise<void> {
    if (!this.config.enableAutoGenStudio || !this.studioConnected) {
      return;
    }
    
    try {
      // Convert AG-UI component to MCP-UI format
      const mcpComponent = AGUIToMCPUIConverter.convert({
        componentId: component.componentId,
        componentType: component.componentType,
        props: component.props,
        children: component.children,
      });
      
      // Send to Studio via WebSocket or HTTP
      if (this.websocket && this.websocket.readyState === 1) { // WebSocket.OPEN = 1
        this.websocket.send(JSON.stringify({
          type: 'ui.studio.update',
          component: mcpComponent,
        }));
      }
      
      await this.publishEvent('ui.studio.update', {
        componentId: component.componentId,
        component: mcpComponent,
      });
    } catch (error) {
      console.error('Error sending component to Studio:', error);
    }
  }
  
  /**
   * Creates an MCP-UI component
   * @param componentType Component type
   * @param props Component props
   * @param mcpConfig MCP configuration
   * @returns MCP-UI component
   */
  createMCPUIComponent(
    componentType: MCPUIComponent['type'],
    props: Record<string, unknown>,
    mcpConfig?: {
      tool?: string;
      resource?: string;
      prompt?: string;
      callback?: string;
    }
  ): MCPUIComponent {
    if (!componentType) {
      throw new Error('Component type is required');
    }
    
    const componentId = this.generateComponentId();
    const component: MCPUIComponent = {
      type: componentType,
      id: componentId,
      props,
      mcp: mcpConfig,
    };
    
    this.mcpComponents.set(componentId, component);
    
    // Convert to AG-UI component and create it
    // componentType is required parameter, so it's always defined
    if (componentType) {
      const agUIComponent = this.createComponent(componentType, props);
      
      // Send to Studio if enabled
      if (this.config.enableAutoGenStudio) {
        this.sendToStudio(agUIComponent).catch(console.error);
      }
    }
    
    return component;
  }
  
  /**
   * Calls an MCP tool and renders UI component
   * @param toolName Tool name
   * @param args Tool arguments
   * @returns Promise that resolves with MCP-UI response
   */
  async callMCPTool(toolName: string, args: Record<string, unknown>): Promise<MCPUIResponse> {
    if (!this.config.enableMCPIntegration) {
      throw new Error('MCP integration is disabled');
    }
    
    if (!this.mcpConnector || !this.mcpConnector.getConnected()) {
      throw new Error('MCP connector is not connected');
    }
    
    try {
      await this.publishEvent('ui.mcp.tool.call', {
        tool: toolName,
        args,
      });
      
      // Call the MCP tool via connector
      const result = await this.mcpConnector.callTool(toolName, args);
      
      // Parse result and extract UI components if present
      let components: MCPUIComponent[] = [];
      let data: unknown = result;
      
      if (result && typeof result === 'object' && 'components' in result) {
        components = (result as { components?: unknown[] }).components as MCPUIComponent[] || [];
        if ('data' in result) {
          data = (result as { data: unknown }).data;
        }
      }
      
      const response: MCPUIResponse = {
        success: true,
        data,
        components,
      };
      
      await this.publishEvent('ui.mcp.tool.response', {
        tool: toolName,
        response,
      });
      
      return response;
    } catch (error) {
      const errorResponse: MCPUIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      await this.publishEvent('ui.mcp.tool.response', {
        tool: toolName,
        response: errorResponse,
      });
      
      throw error;
    }
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
    const validatedComponent = agUIComponentSchema.parse(component) as AGUIComponent;
    
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
