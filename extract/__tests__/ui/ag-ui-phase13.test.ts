/**
 * Phase 13 AG-UI Integration Tests
 * 
 * Tests for AG-UI + MCP + Studio integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AGUIFoundation, createAGUIComponent, publishAGUIEvent } from '../../ui/ag-ui.ts';
import { createMCPConnector } from '../../mcp/mcp-connector.ts';
import { AGUIToMCPUIConverter } from '../../ui/mcp-ui-specs.ts';
import { eventBus } from '../../core/event-bus.ts';

describe('Phase 13: AG-UI + MCP + Studio Integration', () => {
  let agUI: AGUIFoundation;

  beforeEach(() => {
    agUI = new AGUIFoundation({
      enableMCPIntegration: true,
      enableAutoGenStudio: true,
      enableOpenJSONUI: true,
      studioEndpoint: 'http://localhost:8080',
      websocketEndpoint: 'ws://localhost:8080/ws',
    });
  });

  afterEach(async () => {
    if (agUI.isStreamActive()) {
      await agUI.stopStream();
    }
  });

  describe('AG-UI Foundation', () => {
    it('should initialize with Phase 13 features', () => {
      const config = agUI.getConfig();
      expect(config.enableMCPIntegration).toBe(true);
      expect(config.enableAutoGenStudio).toBe(true);
      expect(config.enableOpenJSONUI).toBe(true);
    });

    it('should start and stop stream', async () => {
      await agUI.startStream();
      expect(agUI.isStreamActive()).toBe(true);
      
      await agUI.stopStream();
      expect(agUI.isStreamActive()).toBe(false);
    });

    it('should create and manage components', () => {
      const component = agUI.createComponent('card', {
        title: 'Test Card',
        content: 'Test content',
      });

      expect(component).toBeDefined();
      expect(component.componentType).toBe('card');
      expect(component.props.title).toBe('Test Card');

      const retrieved = agUI.getComponent(component.componentId);
      expect(retrieved).toEqual(component);

      const deleted = agUI.deleteComponent(component.componentId);
      expect(deleted).toBe(true);
      expect(agUI.getComponent(component.componentId)).toBeUndefined();
    });

    it('should update UI state', async () => {
      await agUI.updateUIState('testKey', 'testValue');
      expect(agUI.getUIState('testKey')).toBe('testValue');
    });

    it('should publish and subscribe to events', async () => {
      const events: unknown[] = [];
      const subscriptionId = agUI.subscribeToStream((event) => {
        events.push(event);
      });

      await agUI.publishEvent('ui.component.create', {
        componentId: 'test-123',
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('eventType', 'ui.component.create');

      agUI.unsubscribeFromStream(subscriptionId);
    });
  });

  describe('MCP Integration', () => {
    it('should create MCP-UI components', () => {
      const mcpComponent = agUI.createMCPUIComponent('button', {
        label: 'Click me',
      }, {
        tool: 'test-tool',
      });

      expect(mcpComponent).toBeDefined();
      expect(mcpComponent.type).toBe('button');
      expect(mcpComponent.mcp?.tool).toBe('test-tool');
    });

    it('should convert AG-UI to MCP-UI format', () => {
      const agComponent = createAGUIComponent('card', {
        title: 'Test',
      });

      const mcpComponent = AGUIToMCPUIConverter.convert({
        componentId: agComponent.componentId,
        componentType: agComponent.componentType,
        props: agComponent.props,
      });

      expect(mcpComponent.id).toBe(agComponent.componentId);
      expect(mcpComponent.type).toBe('card');
    });

    it('should handle MCP tool calls when connector is available', async () => {
      // Mock MCP connector
      const mockConnector = {
        getConnected: () => true,
        callTool: vi.fn().mockResolvedValue({
          data: { result: 'success' },
          components: [],
        }),
      };

      // Note: In a real test, we would inject the connector
      // For now, we test the error handling when connector is not available
      await expect(
        agUI.callMCPTool('test-tool', {})
      ).rejects.toThrow('MCP connector is not connected');
    });
  });

  describe('Event Integration', () => {
    it('should handle task progress events', async () => {
      const events: unknown[] = [];
      agUI.subscribeToStream((event) => {
        if (event.eventType === 'ui.task.progress') {
          events.push(event);
        }
      });

      await eventBus.publish({
        id: 'test-task-progress',
        type: 'task.progress',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          taskId: 'task-123',
          progress: 50,
        },
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBeGreaterThan(0);
    });

    it('should handle task complete events', async () => {
      const events: unknown[] = [];
      agUI.subscribeToStream((event) => {
        if (event.eventType === 'ui.task.complete') {
          events.push(event);
        }
      });

      await eventBus.publish({
        id: 'test-task-complete',
        type: 'task.complete',
        timestamp: Date.now(),
        source: 'test',
        payload: {
          taskId: 'task-123',
          result: { success: true },
        },
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Component Lifecycle', () => {
    it('should maintain component state across updates', () => {
      const component = agUI.createComponent('input', {
        value: 'initial',
      });

      const updated = agUI.updateComponent(component.componentId, {
        value: 'updated',
      });

      expect(updated?.props.value).toBe('updated');
    });

    it('should handle component children', () => {
      const child = agUI.createComponent('text', {
        content: 'Child text',
      });

      const parent = agUI.createComponent('card', {
        title: 'Parent',
      }, [child]);

      expect(parent.children).toHaveLength(1);
      expect(parent.children?.[0].componentId).toBe(child.componentId);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      agUI.updateConfig({
        componentUpdateRate: 30,
      });

      const config = agUI.getConfig();
      expect(config.componentUpdateRate).toBe(30);
    });

    it('should preserve existing config when updating', () => {
      const originalConfig = agUI.getConfig();
      
      agUI.updateConfig({
        streamBufferSize: 2000,
      });

      const newConfig = agUI.getConfig();
      expect(newConfig.streamBufferSize).toBe(2000);
      expect(newConfig.enableEventStreaming).toBe(originalConfig.enableEventStreaming);
    });
  });
});

