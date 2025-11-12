/**
 * MCP-UI and Open-JSON-UI Specifications for LAPA v1.2 Protocol-Resonant Nexus — Phase 13
 * 
 * This module defines the specifications for MCP-UI and Open-JSON-UI formats
 * for dynamic, generative UI components that can be streamed from agents.
 * 
 * Based on Model Context Protocol (MCP) UI extension and Open-JSON-UI standard.
 */

import { z } from 'zod';

/**
 * MCP-UI Component Types
 * Based on MCP UI extension specification
 */
export type MCPUIComponentType =
  | 'text'
  | 'button'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'progress'
  | 'card'
  | 'list'
  | 'table'
  | 'form'
  | 'modal'
  | 'tabs'
  | 'accordion'
  | 'chart'
  | 'graph'
  | 'code'
  | 'markdown'
  | 'image'
  | 'video'
  | 'iframe';

/**
 * Open-JSON-UI Component Schema
 * Based on Open-JSON-UI standard for declarative UI generation
 */
export const openJSONUIComponentSchema = z.object({
  type: z.string(),
  id: z.string().optional(),
  props: z.record(z.unknown()).optional(),
  children: z.array(z.lazy(() => openJSONUIComponentSchema)).optional(),
  events: z.record(z.string()).optional(),
  style: z.record(z.unknown()).optional(),
  className: z.string().optional(),
  visible: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

export type OpenJSONUIComponent = z.infer<typeof openJSONUIComponentSchema>;

/**
 * MCP-UI Component Schema
 * Extends Open-JSON-UI with MCP-specific features
 */
export const mcpUIComponentSchema = openJSONUIComponentSchema.extend({
  type: z.enum([
    'text',
    'button',
    'input',
    'select',
    'textarea',
    'checkbox',
    'radio',
    'slider',
    'progress',
    'card',
    'list',
    'table',
    'form',
    'modal',
    'tabs',
    'accordion',
    'chart',
    'graph',
    'code',
    'markdown',
    'image',
    'video',
    'iframe',
  ]),
  mcp: z.object({
    tool: z.string().optional(),
    resource: z.string().optional(),
    prompt: z.string().optional(),
    callback: z.string().optional(),
  }).optional(),
  streaming: z.object({
    enabled: z.boolean(),
    format: z.enum(['sse', 'websocket', 'polling']).optional(),
    interval: z.number().optional(),
  }).optional(),
});

export type MCPUIComponent = z.infer<typeof mcpUIComponentSchema>;

/**
 * MCP-UI Event Schema
 * Events that can be triggered by MCP-UI components
 */
export const mcpUIEventSchema = z.object({
  eventId: z.string(),
  componentId: z.string(),
  eventType: z.enum([
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
  timestamp: z.number(),
  payload: z.record(z.unknown()).optional(),
  mcp: z.object({
    tool: z.string().optional(),
    resource: z.string().optional(),
    prompt: z.string().optional(),
  }).optional(),
});

export type MCPUIEvent = z.infer<typeof mcpUIEventSchema>;

/**
 * MCP-UI Response Schema
 * Response format for MCP-UI tool calls
 */
export const mcpUIResponseSchema = z.object({
  success: z.boolean(),
  componentId: z.string().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  components: z.array(mcpUIComponentSchema).optional(),
  stream: z.object({
    id: z.string(),
    format: z.enum(['sse', 'websocket', 'polling']),
    url: z.string().optional(),
  }).optional(),
});

export type MCPUIResponse = z.infer<typeof mcpUIResponseSchema>;

/**
 * AG-UI to MCP-UI Converter
 * Converts AG-UI components to MCP-UI format
 */
export class AGUIToMCPUIConverter {
  /**
   * Converts an AG-UI component to MCP-UI format
   * @param agUIComponent AG-UI component
   * @returns MCP-UI component
   */
  static convert(agUIComponent: {
    componentId: string;
    componentType: string;
    props: Record<string, unknown>;
    children?: Array<{
      componentId: string;
      componentType: string;
      props: Record<string, unknown>;
      children?: unknown[];
    }>;
  }): MCPUIComponent {
    const mcpComponent: MCPUIComponent = {
      type: this.mapComponentType(agUIComponent.componentType),
      id: agUIComponent.componentId,
      props: agUIComponent.props,
      children: agUIComponent.children?.map((child) =>
        this.convert(child as {
          componentId: string;
          componentType: string;
          props: Record<string, unknown>;
          children?: unknown[];
        })
      ),
    };

    return mcpUIComponentSchema.parse(mcpComponent);
  }

  /**
   * Maps AG-UI component types to MCP-UI component types
   * @param agUIType AG-UI component type
   * @returns MCP-UI component type
   */
  private static mapComponentType(agUIType: string): MCPUIComponentType {
    const typeMap: Record<string, MCPUIComponentType> = {
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

/**
 * MCP-UI to Open-JSON-UI Converter
 * Converts MCP-UI components to Open-JSON-UI format
 */
export class MCPUIToOpenJSONUIConverter {
  /**
   * Converts an MCP-UI component to Open-JSON-UI format
   * @param mcpUIComponent MCP-UI component
   * @returns Open-JSON-UI component
   */
  static convert(mcpUIComponent: MCPUIComponent): OpenJSONUIComponent {
    const openJSONComponent: OpenJSONUIComponent = {
      type: mcpUIComponent.type,
      id: mcpUIComponent.id,
      props: mcpUIComponent.props,
      children: mcpUIComponent.children?.map((child) =>
        this.convert(child as MCPUIComponent)
      ),
      events: mcpUIComponent.events,
      style: mcpUIComponent.style,
      className: mcpUIComponent.className,
      visible: mcpUIComponent.visible,
      disabled: mcpUIComponent.disabled,
    };

    return openJSONUIComponentSchema.parse(openJSONComponent);
  }
}

/**
 * MCP-UI Event Handler
 * Handles events from MCP-UI components and triggers MCP tool calls
 */
export class MCPUIEventHandler {
  private eventHandlers: Map<string, (event: MCPUIEvent) => Promise<void>> = new Map();

  /**
   * Registers an event handler for a component
   * @param componentId Component ID
   * @param handler Event handler function
   */
  registerHandler(componentId: string, handler: (event: MCPUIEvent) => Promise<void>): void {
    this.eventHandlers.set(componentId, handler);
  }

  /**
   * Handles an MCP-UI event
   * @param event MCP-UI event
   * @returns Promise that resolves when event is handled
   */
  async handleEvent(event: MCPUIEvent): Promise<void> {
    const handler = this.eventHandlers.get(event.componentId);
    if (handler) {
      await handler(event);
    } else {
      console.warn(`No handler registered for component ${event.componentId}`);
    }
  }

  /**
   * Unregisters an event handler for a component
   * @param componentId Component ID
   */
  unregisterHandler(componentId: string): void {
    this.eventHandlers.delete(componentId);
  }
}

// Export singleton instance
export const mcpUIEventHandler = new MCPUIEventHandler();

/**
 * Validates an MCP-UI component
 * @param component Component to validate
 * @returns Validation result
 */
export function validateMCPUIComponent(component: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  try {
    mcpUIComponentSchema.parse(component);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
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
export function validateOpenJSONUIComponent(component: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  try {
    openJSONUIComponentSchema.parse(component);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}

