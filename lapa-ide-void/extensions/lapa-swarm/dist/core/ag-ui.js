"use strict";
/**
 * AG-UI (Agent-to-UI) Foundation for LAPA v1.2 Protocol-Resonant Nexus — Phase 13
 *
 * This module implements the AG-UI foundation for generative, real-time interfaces.
 * It provides event streaming, dynamic component generation, and UI state management
 * for seamless agent-to-UI communication.
 *
 * Phase 13: Extended with MCP integration, AutoGen Studio support, and dynamic UI generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agUIFoundation = exports.AGUIFoundation = void 0;
exports.publishAGUIEvent = publishAGUIEvent;
exports.createAGUIComponent = createAGUIComponent;
const event_bus_js_1 = require("../core/event-bus.js");
const zod_1 = require("zod");
const mcp_ui_specs_js_1 = require("../ui/mcp-ui-specs.js");
// Zod schema for AG-UI event validation
const agUIEventSchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    eventType: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    payload: zod_1.z.record(zod_1.z.unknown())
});
const agUIComponentSchema = zod_1.z.object({
    componentId: zod_1.z.string(),
    componentType: zod_1.z.string(),
    props: zod_1.z.record(zod_1.z.unknown()),
    children: zod_1.z.array(zod_1.z.lazy(() => agUIComponentSchema)).optional()
});
// Default configuration
const DEFAULT_CONFIG = {
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
/**
 * AG-UI Foundation
 *
 * Manages agent-to-UI communication with event streaming, dynamic component generation,
 * and UI state management for seamless agent-to-UI interaction.
 */
class AGUIFoundation {
    config;
    eventStream = [];
    uiComponents = new Map();
    uiState = {};
    streamSubscriptions = new Map();
    isStreaming = false;
    websocket = null;
    mcpComponents = new Map();
    studioConnected = false;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Subscribe to agent events for UI updates
        event_bus_js_1.eventBus.subscribe('task.progress', async (event) => {
            await this.handleTaskProgress(event.payload);
        });
        event_bus_js_1.eventBus.subscribe('task.complete', async (event) => {
            await this.handleTaskComplete(event.payload);
        });
        event_bus_js_1.eventBus.subscribe('agent.error', async (event) => {
            await this.handleAgentError(event.payload);
        });
    }
    /**
     * Starts the AG-UI event stream
     * @returns Promise that resolves when streaming starts
     */
    async startStream() {
        if (this.isStreaming) {
            console.warn('AG-UI stream is already running');
            return;
        }
        this.isStreaming = true;
        console.log('Starting AG-UI event stream');
        // Connect to WebSocket if enabled
        if (this.config.enableMCPIntegration && this.config.websocketEndpoint) {
            await this.connectWebSocket();
        }
        // Connect to AutoGen Studio if enabled
        if (this.config.enableAutoGenStudio && this.config.studioEndpoint) {
            await this.connectStudio();
        }
        // Publish stream start event
        await event_bus_js_1.eventBus.publish({
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
    async stopStream() {
        if (!this.isStreaming) {
            console.warn('AG-UI stream is not running');
            return;
        }
        this.isStreaming = false;
        console.log('Stopping AG-UI event stream');
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
        await event_bus_js_1.eventBus.publish({
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
    async connectWebSocket() {
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
            this.websocket.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWebSocketMessage(message);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            this.websocket.on('error', (error) => {
                console.error('AG-UI WebSocket error:', error);
            });
            this.websocket.on('close', () => {
                console.log('AG-UI WebSocket disconnected');
                this.websocket = null;
            });
        }
        catch (error) {
            console.error('Error connecting to WebSocket:', error);
        }
    }
    /**
     * Handles WebSocket messages
     * @param data Message data
     */
    async handleWebSocketMessage(data) {
        // Handle MCP-UI events
        if (this.config.enableMCPIntegration && data && typeof data === 'object' && 'type' in data) {
            await this.publishEvent('ui.mcp.tool.response', data);
        }
    }
    /**
     * Connects to AutoGen Studio
     * @returns Promise that resolves when connected
     */
    async connectStudio() {
        if (!this.config.studioEndpoint) {
            return;
        }
        try {
            // TODO: Implement AutoGen Studio connection
            // This would typically involve establishing a connection to the Studio API
            // and setting up event listeners for UI updates
            this.studioConnected = true;
            console.log('Connected to AutoGen Studio');
        }
        catch (error) {
            console.error('Error connecting to AutoGen Studio:', error);
        }
    }
    /**
     * Disconnects from AutoGen Studio
     * @returns Promise that resolves when disconnected
     */
    async disconnectStudio() {
        this.studioConnected = false;
        console.log('Disconnected from AutoGen Studio');
    }
    /**
     * Sends component to Studio
     * @param component Component to send
     * @returns Promise that resolves when sent
     */
    async sendToStudio(component) {
        if (!this.config.enableAutoGenStudio || !this.studioConnected) {
            return;
        }
        try {
            // Convert AG-UI component to MCP-UI format
            const mcpComponent = mcp_ui_specs_js_1.AGUIToMCPUIConverter.convert({
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
        }
        catch (error) {
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
    createMCPUIComponent(componentType, props, mcpConfig) {
        const id = this.generateComponentId();
        const component = {
            type: componentType,
            id,
            props,
            mcp: mcpConfig || {},
        };
        this.mcpComponents.set(id, component);
        // Convert to AG-UI component and create it
        const agUIComponent = this.createComponent(componentType, props);
        // Send to Studio if enabled
        if (this.config.enableAutoGenStudio) {
            this.sendToStudio(agUIComponent).catch(console.error);
        }
        return component;
    }
    /**
     * Calls an MCP tool and renders UI component
     * @param toolName Tool name
     * @param args Tool arguments
     * @returns Promise that resolves with MCP-UI response
     */
    // @ts-ignore - Type mismatch in payload for event bus
    async callMCPTool(toolName, args) {
        if (!this.config.enableMCPIntegration) {
            throw new Error('MCP integration is disabled');
        }
        // @ts-ignore - Bypass type checking for event payload
        try {
            await this.publishEvent('ui.mcp.tool.call', {
                tool: toolName ?? 'unknown',
                args: args ?? {},
            });
            // TODO: Implement actual MCP tool call
            // This would typically involve calling the MCP connector
            // and receiving a response with UI components
            const response = {
                success: true,
                data: {},
                components: [],
            };
            // @ts-ignore - Bypass type checking for event payload
            await this.publishEvent('ui.mcp.tool.response', {
                tool: toolName ?? 'unknown',
                response,
            });
            return response;
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            // @ts-ignore - Bypass type checking for event payload
            await this.publishEvent('ui.mcp.tool.response', {
                tool: toolName ?? 'unknown',
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
    async publishEvent(eventType, payload) {
        if (!this.config.enableEventStreaming) {
            return;
        }
        const event = {
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
        await event_bus_js_1.eventBus.publish({
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
            }
            catch (error) {
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
    createComponent(componentType, props, children) {
        if (!this.config.enableDynamicComponents) {
            throw new Error('Dynamic components are disabled');
        }
        const component = {
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
    updateComponent(componentId, props) {
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
    deleteComponent(componentId) {
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
    async updateUIState(key, value) {
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
    getUIState(key) {
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
    subscribeToStream(callback) {
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
    unsubscribeFromStream(subscriptionId) {
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
    async handleTaskProgress(payload) {
        await this.publishEvent('ui.task.progress', {
            taskId: payload.taskId,
            progress: payload.progress
        });
    }
    /**
     * Handles task complete event
     * @param payload Task complete payload
     */
    async handleTaskComplete(payload) {
        await this.publishEvent('ui.task.complete', {
            taskId: payload.taskId,
            result: payload.result
        });
    }
    /**
     * Handles agent error event
     * @param payload Agent error payload
     */
    async handleAgentError(payload) {
        await this.publishEvent('ui.error', {
            agentId: payload.agentId,
            error: payload.error
        });
    }
    /**
     * Gets current configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Updates configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('AG-UI configuration updated:', this.config);
    }
    /**
     * Gets event stream
     * @returns Event stream array
     */
    getEventStream() {
        return [...this.eventStream];
    }
    /**
     * Gets UI components
     * @returns UI components map
     */
    getUIComponents() {
        return new Map(this.uiComponents);
    }
    /**
     * Gets component by ID
     * @param componentId Component ID
     * @returns Component or undefined if not found
     */
    getComponent(componentId) {
        return this.uiComponents.get(componentId);
    }
    /**
     * Checks if streaming is active
     * @returns Boolean indicating if streaming is active
     */
    isStreamActive() {
        return this.isStreaming;
    }
    /**
     * Generates a unique event ID
     * @returns Unique event ID
     */
    generateEventId() {
        return `ag-ui-event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generates a unique component ID
     * @returns Unique component ID
     */
    generateComponentId() {
        return `ag-ui-component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generates a unique subscription ID
     * @returns Unique subscription ID
     */
    generateSubscriptionId() {
        return `ag-ui-subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AGUIFoundation = AGUIFoundation;
// Export singleton instance
exports.agUIFoundation = new AGUIFoundation();
/**
 * Convenience function for publishing an AG-UI event
 * @param eventType Event type
 * @param payload Event payload
 * @returns Promise that resolves when event is published
 */
async function publishAGUIEvent(eventType, payload) {
    return await exports.agUIFoundation.publishEvent(eventType, payload);
}
/**
 * Convenience function for creating an AG-UI component
 * @param componentType Component type
 * @param props Component props
 * @param children Component children
 * @returns Created component
 */
function createAGUIComponent(componentType, props, children) {
    return exports.agUIFoundation.createComponent(componentType, props, children);
}
//# sourceMappingURL=ag-ui.js.map