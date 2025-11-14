"use strict";
/**
 * MCP-UI and Open-JSON-UI Specifications for LAPA v1.2 Protocol-Resonant Nexus — Phase 13
 *
 * This module defines the specifications for MCP-UI and Open-JSON-UI formats
 * for dynamic, generative UI components that can be streamed from agents.
 *
 * Based on Model Context Protocol (MCP) UI extension and Open-JSON-UI standard.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpUIEventHandler = exports.MCPUIEventHandler = exports.MCPUIToOpenJSONUIConverter = exports.AGUIToMCPUIConverter = exports.mcpUIResponseSchema = exports.mcpUIEventSchema = exports.MCPUIComponentType = void 0;
exports.validateMCPUIComponent = validateMCPUIComponent;
exports.validateOpenJSONUIComponent = validateOpenJSONUIComponent;
const zod_1 = require("zod");
/**
 * MCP-UI Component Types
 * Based on MCP UI extension specification
 */
exports.MCPUIComponentType = ['text', 'button', 'input', 'select', 'textarea', 'checkbox', 'radio', 'slider', 'progress', 'card', 'list', 'table', 'form', 'modal', 'tabs', 'accordion', 'chart', 'graph', 'code', 'markdown', 'image', 'video', 'iframe'];
let openJSONUIComponentSchema = zod_1.z.object({
    type: zod_1.z.string(),
    id: zod_1.z.string().optional(),
    props: zod_1.z.record(zod_1.z.unknown()).optional(),
    events: zod_1.z.record(zod_1.z.string()).optional(),
    style: zod_1.z.record(zod_1.z.unknown()).optional(),
    className: zod_1.z.string().optional(),
    visible: zod_1.z.boolean().optional(),
    disabled: zod_1.z.boolean().optional(),
    children: zod_1.z.lazy(() => zod_1.z.array(openJSONUIComponentSchema)).optional(),
});
let mcpUIComponentSchema = zod_1.z.object({
    type: zod_1.z.enum(exports.MCPUIComponentType),
    id: zod_1.z.string().optional(),
    props: zod_1.z.record(zod_1.z.unknown()).optional(),
    events: zod_1.z.record(zod_1.z.string()).optional(),
    style: zod_1.z.record(zod_1.z.unknown()).optional(),
    className: zod_1.z.string().optional(),
    visible: zod_1.z.boolean().optional(),
    disabled: zod_1.z.boolean().optional(),
    mcp: zod_1.z.object({
        tool: zod_1.z.string().optional(),
        resource: zod_1.z.string().optional(),
        prompt: zod_1.z.string().optional(),
        callback: zod_1.z.string().optional(),
    }).optional(),
    streaming: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        format: zod_1.z.enum(['sse', 'websocket', 'polling']).optional(),
        interval: zod_1.z.number().optional(),
    }).optional(),
    children: zod_1.z.lazy(() => zod_1.z.array(mcpUIComponentSchema)),
});
/**
 * MCP-UI Event Schema
 * Events that can be triggered by MCP-UI components
 */
exports.mcpUIEventSchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    componentId: zod_1.z.string(),
    eventType: zod_1.z.enum([
        'click',
        'change',
        'input',
        'submit',
        'cancel',
        'close',
        'open',
        'select',
        'hover',
        'focus',
        'blur',
        'load',
        'error',
        'stream.start',
        'stream.end',
        'stream.data',
    ]),
    timestamp: zod_1.z.number(),
    payload: zod_1.z.record(zod_1.z.unknown()).optional(),
    mcp: zod_1.z.object({
        tool: zod_1.z.string().optional(),
        resource: zod_1.z.string().optional(),
        prompt: zod_1.z.string().optional(),
    }).optional(),
});
/**
 * MCP-UI Response Schema
 * Response format for MCP-UI tool calls
 */
exports.mcpUIResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    componentId: zod_1.z.string().optional(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
    components: zod_1.z.array(mcpUIComponentSchema).optional(),
    stream: zod_1.z.object({
        id: zod_1.z.string(),
        format: zod_1.z.enum(['sse', 'websocket', 'polling']),
        url: zod_1.z.string().optional(),
    }).optional(),
});
/**
 * AG-UI to MCP-UI Converter
 * Converts AG-UI components to MCP-UI format
 */
class AGUIToMCPUIConverter {
    /**
     * Converts an AG-UI component to MCP-UI format
     * @param agUIComponent AG-UI component
     * @returns MCP-UI component
     */
    static convert(agUIComponent) {
        const mcpComponent = {
            type: this.mapComponentType(agUIComponent.componentType),
            id: agUIComponent.componentId,
            props: agUIComponent.props,
            children: agUIComponent.children?.map((child) => ({
                ...child,
                type: child.type
            })),
        };
        return mcpUIComponentSchema.parse(mcpComponent);
    }
    /**
     * Maps AG-UI component types to MCP-UI component types
     * @param agUIType AG-UI component type
     * @returns MCP-UI component type
     */
    static mapComponentType(agUIType) {
        const typeMap = {
            'text': 'text',
            'button': 'button',
            'input': 'input',
            'select': 'select',
            'textarea': 'textarea',
            'checkbox': 'checkbox',
            'radio': 'radio',
            'slider': 'slider',
            'progress': 'progress',
            'card': 'card',
            'list': 'list',
            'table': 'table',
            'form': 'form',
            'modal': 'modal',
            'tabs': 'tabs',
            'accordion': 'accordion',
            'chart': 'chart',
            'graph': 'graph',
            'code': 'code',
            'markdown': 'markdown',
            'image': 'image',
            'video': 'video',
            'iframe': 'iframe',
        };
        return typeMap[agUIType.toLowerCase()] || 'card';
    }
}
exports.AGUIToMCPUIConverter = AGUIToMCPUIConverter;
/**
 * MCP-UI to Open-JSON-UI Converter
 * Converts MCP-UI components to Open-JSON-UI format
 */
class MCPUIToOpenJSONUIConverter {
    /**
     * Converts an MCP-UI component to Open-JSON-UI format
     * @param mcpUIComponent MCP-UI component
     * @returns Open-JSON-UI component
     */
    static convert(mcpUIComponent) {
        const openJSONComponent = {
            type: mcpUIComponent.type,
            id: mcpUIComponent.id,
            props: mcpUIComponent.props,
            children: mcpUIComponent.children?.map((child) => this.convert(child)),
            events: mcpUIComponent.events,
            style: mcpUIComponent.style,
            className: mcpUIComponent.className,
            visible: mcpUIComponent.visible,
            disabled: mcpUIComponent.disabled,
        };
        return openJSONUIComponentSchema.parse(openJSONComponent);
    }
}
exports.MCPUIToOpenJSONUIConverter = MCPUIToOpenJSONUIConverter;
/**
 * MCP-UI Event Handler
 * Handles events from MCP-UI components and triggers MCP tool calls
 */
class MCPUIEventHandler {
    eventHandlers = new Map();
    /**
     * Registers an event handler for a component
     * @param componentId Component ID
     * @param handler Event handler function
     */
    registerHandler(componentId, handler) {
        this.eventHandlers.set(componentId, handler);
    }
    /**
     * Handles an MCP-UI event
     * @param event MCP-UI event
     * @returns Promise that resolves when event is handled
     */
    async handleEvent(event) {
        const handler = this.eventHandlers.get(event.componentId);
        if (handler) {
            await handler(event);
        }
        else {
            console.warn(`No handler registered for component ${event.componentId}`);
        }
    }
    /**
     * Unregisters an event handler for a component
     * @param componentId Component ID
     */
    unregisterHandler(componentId) {
        this.eventHandlers.delete(componentId);
    }
}
exports.MCPUIEventHandler = MCPUIEventHandler;
// Export singleton instance
exports.mcpUIEventHandler = new MCPUIEventHandler();
/**
 * Validates an MCP-UI component
 * @param component Component to validate
 * @returns Validation result
 */
function validateMCPUIComponent(component) {
    try {
        mcpUIComponentSchema.parse(component);
        return { valid: true };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { valid: false, errors: error };
        }
        throw error;
    }
}
/**
 * Validates an Open-JSON-UI component
 * @param component Component to validate
 * @returns Validation result
 */
function validateOpenJSONUIComponent(component) {
    try {
        openJSONUIComponentSchema.parse(component);
        return { valid: true };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { valid: false, errors: error };
        }
        throw error;
    }
}
//# sourceMappingURL=mcp-ui-specs.js.map