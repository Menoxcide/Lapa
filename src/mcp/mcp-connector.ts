/**
 * MCP (Model Context Protocol) Connector for LAPA v1.2 Phase 11
 * 
 * This module implements a comprehensive MCP connector with support for:
 * - JSON-RPC over WebSocket transport
 * - JSON-RPC over stdio transport
 * - Dynamic tool discovery
 * - Progressive disclosure
 * - Local connectors (SQLite, Git, FS)
 * 
 * Phase 11: MCP + A2A Connectors integration
 */

import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import type { WebSocket } from 'ws';

// MCP Protocol version
export const MCP_PROTOCOL_VERSION = '2024-11-05';

// MCP transport types
export type MCPTransportType = 'websocket' | 'stdio';

// MCP connector configuration
export interface MCPConnectorConfig {
  transportType: MCPTransportType;
  websocketUrl?: string;
  stdioCommand?: string[];
  stdioArgs?: string[];
  timeoutMs?: number;
  enableToolDiscovery?: boolean;
  enableProgressiveDisclosure?: boolean;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<Omit<MCPConnectorConfig, 'websocketUrl' | 'stdioCommand' | 'stdioArgs'>> = {
  transportType: 'stdio',
  timeoutMs: 30000,
  enableToolDiscovery: true,
  enableProgressiveDisclosure: true,
  reconnectIntervalMs: 5000,
  maxReconnectAttempts: 5
};

// JSON-RPC request/response types
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP tool definition
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}

// MCP resource definition
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// MCP prompt template
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * MCP Connector
 * 
 * Manages MCP connections with support for WebSocket and stdio transports.
 * Provides tool discovery, progressive disclosure, and local connector integration.
 */
export class MCPConnector {
  private config: MCPConnectorConfig;
  private transport: MCPTransport | null = null;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();
  private pendingRequests: Map<string | number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private requestIdCounter: number = 0;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor(config: Partial<MCPConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connects to the MCP server
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    try {
      console.log(`Connecting to MCP server via ${this.config.transportType}...`);

      // Create transport based on type
      if (this.config.transportType === 'websocket') {
        if (!this.config.websocketUrl) {
          throw new Error('WebSocket URL is required for WebSocket transport');
        }
        this.transport = new WebSocketTransport(this.config.websocketUrl, {
          timeoutMs: this.config.timeoutMs,
          reconnectIntervalMs: this.config.reconnectIntervalMs,
          maxReconnectAttempts: this.config.maxReconnectAttempts
        });
      } else {
        if (!this.config.stdioCommand) {
          throw new Error('stdioCommand is required for stdio transport');
        }
        this.transport = new StdioTransport(this.config.stdioCommand, this.config.stdioArgs || [], {
          timeoutMs: this.config.timeoutMs
        });
      }

      // Set up transport event handlers
      this.transport.on('message', (message: JSONRPCResponse | JSONRPCRequest) => {
        this.handleMessage(message);
      });

      this.transport.on('error', (error: Error) => {
        console.error('MCP transport error:', error);
        this.handleTransportError(error);
      });

      this.transport.on('close', () => {
        console.log('MCP transport closed');
        this.isConnected = false;
        this.handleTransportClose();
      });

      // Connect transport
      await this.transport.connect();

      // Initialize MCP protocol
      await this.initializeProtocol();

      // Discover tools and resources
      if (this.config.enableToolDiscovery) {
        await this.discoverTools();
        await this.discoverResources();
        await this.discoverPrompts();
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('MCP connector connected successfully');

      // Publish connection event
      await eventBus.publish({
        id: `mcp-connector-connected-${Date.now()}`,
        type: 'mcp.connector.connected',
        timestamp: Date.now(),
        source: 'mcp-connector',
        payload: {
          transportType: this.config.transportType,
          toolsCount: this.tools.size,
          resourcesCount: this.resources.size,
          promptsCount: this.prompts.size
        }
      });
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnects from the MCP server
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.disconnect();
      }

      // Clear pending requests
      for (const [id, request] of this.pendingRequests) {
        clearTimeout(request.timeout);
        request.reject(new Error('Connection closed'));
      }
      this.pendingRequests.clear();

      this.isConnected = false;
      this.transport = null;

      console.log('MCP connector disconnected');

      // Publish disconnection event
      await eventBus.publish({
        id: `mcp-connector-disconnected-${Date.now()}`,
        type: 'mcp.connector.disconnected',
        timestamp: Date.now(),
        source: 'mcp-connector',
        payload: {}
      });
    } catch (error) {
      console.error('Error disconnecting from MCP server:', error);
      throw error;
    }
  }

  /**
   * Initializes the MCP protocol
   */
  private async initializeProtocol(): Promise<void> {
    // Send initialize request
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        clientInfo: {
          name: 'lapa-core',
          version: '1.2.0'
        }
      }
    });

    if (response.error) {
      throw new Error(`MCP initialization failed: ${response.error.message}`);
    }

    // Send initialized notification
    await this.sendNotification({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });

    console.log('MCP protocol initialized');
  }

  /**
   * Discovers available tools
   */
  private async discoverTools(): Promise<void> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        method: 'tools/list'
      });

      if (response.error) {
        console.warn('Failed to discover tools:', response.error.message);
        return;
      }

      const tools = (response.result as { tools?: Array<{
        name: string;
        description: string;
        inputSchema: any;
      }> })?.tools || [];

      for (const tool of tools) {
        // Parse input schema from JSON schema to Zod schema
        const zodSchema = this.jsonSchemaToZod(tool.inputSchema);
        this.tools.set(tool.name, {
          name: tool.name,
          description: tool.description,
          inputSchema: zodSchema
        });
      }

      console.log(`Discovered ${this.tools.size} tools`);
    } catch (error) {
      console.error('Error discovering tools:', error);
    }
  }

  /**
   * Discovers available resources
   */
  private async discoverResources(): Promise<void> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        method: 'resources/list'
      });

      if (response.error) {
        console.warn('Failed to discover resources:', response.error.message);
        return;
      }

      const resources = (response.result as { resources?: MCPResource[] })?.resources || [];

      for (const resource of resources) {
        this.resources.set(resource.uri, resource);
      }

      console.log(`Discovered ${this.resources.size} resources`);
    } catch (error) {
      console.error('Error discovering resources:', error);
    }
  }

  /**
   * Discovers available prompts
   */
  private async discoverPrompts(): Promise<void> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: this.generateRequestId(),
        method: 'prompts/list'
      });

      if (response.error) {
        console.warn('Failed to discover prompts:', response.error.message);
        return;
      }

      const prompts = (response.result as { prompts?: MCPPrompt[] })?.prompts || [];

      for (const prompt of prompts) {
        this.prompts.set(prompt.name, prompt);
      }

      console.log(`Discovered ${this.prompts.size} prompts`);
    } catch (error) {
      console.error('Error discovering prompts:', error);
    }
  }

  /**
   * Calls an MCP tool
   * @param toolName Tool name
   * @param arguments_ Tool arguments
   * @returns Promise that resolves with the tool result
   */
  async callTool(toolName: string, arguments_: Record<string, unknown>): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('MCP connector is not connected');
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    // Validate arguments with Zod schema
    try {
      tool.inputSchema.parse(arguments_);
    } catch (error) {
      throw new Error(`Invalid tool arguments: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Send tool call request
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      }
    });

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    // Publish tool call event
    await eventBus.publish({
      id: `mcp-tool-call-${Date.now()}`,
      type: 'mcp.tool.called',
      timestamp: Date.now(),
      source: 'mcp-connector',
      payload: {
        toolName,
        arguments: arguments_,
        result: response.result
      }
    });

    return response.result;
  }

  /**
   * Reads an MCP resource
   * @param uri Resource URI
   * @returns Promise that resolves with the resource content
   */
  async readResource(uri: string): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('MCP connector is not connected');
    }

    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`);
    }

    // Send resource read request
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'resources/read',
      params: {
        uri
      }
    });

    if (response.error) {
      throw new Error(`Resource read failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Gets a prompt template
   * @param promptName Prompt name
   * @param arguments_ Prompt arguments
   * @returns Promise that resolves with the prompt result
   */
  async getPrompt(promptName: string, arguments_?: Record<string, unknown>): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('MCP connector is not connected');
    }

    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt '${promptName}' not found`);
    }

    // Send prompt request
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'prompts/get',
      params: {
        name: promptName,
        arguments: arguments_ || {}
      }
    });

    if (response.error) {
      throw new Error(`Prompt request failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Sends a JSON-RPC request
   * @param request Request to send
   * @returns Promise that resolves with the response
   */
  private async sendRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.transport) {
      throw new Error('Transport is not initialized');
    }

    return new Promise((resolve, reject) => {
      const requestId = request.id || this.generateRequestId();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${request.method}`));
      }, this.config.timeoutMs || 30000);

      this.pendingRequests.set(requestId, {
        resolve: (value: unknown) => {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          resolve(value as JSONRPCResponse);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          reject(error);
        },
        timeout
      });

      this.transport!.send({ ...request, id: requestId }).catch(reject);
    });
  }

  /**
   * Sends a JSON-RPC notification
   * @param notification Notification to send
   */
  private async sendNotification(notification: Omit<JSONRPCRequest, 'id'>): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport is not initialized');
    }

    await this.transport.send(notification as JSONRPCRequest);
  }

  /**
   * Handles incoming messages
   * @param message Message to handle
   */
  private handleMessage(message: JSONRPCResponse | JSONRPCRequest): void {
    // Check if it's a response
    if ('result' in message || 'error' in message) {
      const response = message as JSONRPCResponse;
      const request = this.pendingRequests.get(response.id);
      if (request) {
        if (response.error) {
          request.reject(new Error(response.error.message));
        } else {
          request.resolve(response);
        }
      }
    }
    // Handle notifications (requests without id)
    else if ('method' in message && message.id === null) {
      this.handleNotification(message as JSONRPCRequest);
    }
  }

  /**
   * Handles incoming notifications
   * @param notification Notification to handle
   */
  private handleNotification(notification: JSONRPCRequest): void {
    // Handle different notification types
    switch (notification.method) {
      case 'tools/list_changed':
        // Re-discover tools
        this.discoverTools().catch(console.error);
        break;
      case 'resources/list_changed':
        // Re-discover resources
        this.discoverResources().catch(console.error);
        break;
      case 'prompts/list_changed':
        // Re-discover prompts
        this.discoverPrompts().catch(console.error);
        break;
      default:
        console.log('Unhandled notification:', notification.method);
    }
  }

  /**
   * Handles transport errors
   * @param error Error to handle
   */
  private handleTransportError(error: Error): void {
    // Publish error event
    eventBus.publish({
      id: `mcp-connector-error-${Date.now()}`,
      type: 'mcp.connector.error',
      timestamp: Date.now(),
      source: 'mcp-connector',
      payload: {
        error: error.message
      }
    }).catch(console.error);

    // Attempt reconnection if configured
    if (this.config.reconnectIntervalMs && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, this.config.reconnectIntervalMs);
    }
  }

  /**
   * Handles transport close
   */
  private handleTransportClose(): void {
    this.isConnected = false;

    // Publish close event
    eventBus.publish({
      id: `mcp-connector-close-${Date.now()}`,
      type: 'mcp.connector.close',
      timestamp: Date.now(),
      source: 'mcp-connector',
      payload: {}
    }).catch(console.error);
  }

  /**
   * Generates a unique request ID
   * @returns Request ID
   */
  private generateRequestId(): number {
    return ++this.requestIdCounter;
  }

  /**
   * Converts JSON Schema to Zod schema (simplified version)
   * @param schema JSON Schema
   * @returns Zod schema
   */
  private jsonSchemaToZod(schema: any): z.ZodType<any> {
    // This is a simplified implementation
    // In a real implementation, you would need a full JSON Schema to Zod converter
    if (schema.type === 'object') {
      const shape: Record<string, z.ZodType<any>> = {};
      if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
          shape[key] = this.jsonSchemaToZod(value);
        }
      }
      return z.object(shape);
    } else if (schema.type === 'string') {
      return z.string();
    } else if (schema.type === 'number') {
      return z.number();
    } else if (schema.type === 'boolean') {
      return z.boolean();
    } else if (schema.type === 'array') {
      return z.array(this.jsonSchemaToZod(schema.items));
    }
    return z.any();
  }

  /**
   * Gets all available tools
   * @returns Array of tool names
   */
  getTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Gets all available resources
   * @returns Array of resource URIs
   */
  getResources(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * Gets all available prompts
   * @returns Array of prompt names
   */
  getPrompts(): string[] {
    return Array.from(this.prompts.keys());
  }

  /**
   * Checks if the connector is connected
   * @returns Boolean indicating connection status
   */
  getConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * MCP Transport Interface
 */
interface MCPTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: JSONRPCRequest | JSONRPCResponse): Promise<void>;
  on(event: 'message', handler: (message: JSONRPCResponse | JSONRPCRequest) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: () => void): void;
}

/**
 * WebSocket Transport Implementation
 */
class WebSocketTransport implements MCPTransport {
  private url: string;
  private ws: WebSocket | null = null;
  private config: {
    timeoutMs: number;
    reconnectIntervalMs: number;
    maxReconnectAttempts: number;
  };
  private messageHandlers: Array<(message: JSONRPCResponse | JSONRPCRequest) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private closeHandlers: Array<() => void> = [];

  constructor(url: string, config: {
    timeoutMs: number;
    reconnectIntervalMs: number;
    maxReconnectAttempts: number;
  }) {
    this.url = url;
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamic import of ws module
        import('ws').then(({ WebSocket: WS }) => {
          this.ws = new WS(this.url);

          this.ws.on('open', () => {
            console.log('WebSocket connection opened');
            resolve();
          });

          this.ws.on('message', (data: Buffer) => {
            try {
              const message = JSON.parse(data.toString()) as JSONRPCResponse | JSONRPCRequest;
              this.messageHandlers.forEach(handler => handler(message));
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          });

          this.ws.on('error', (error: Error) => {
            this.errorHandlers.forEach(handler => handler(error));
          });

          this.ws.on('close', () => {
            this.closeHandlers.forEach(handler => handler());
          });
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async send(message: JSONRPCRequest | JSONRPCResponse): Promise<void> {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  on(event: 'message', handler: (message: JSONRPCResponse | JSONRPCRequest) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: () => void): void;
  on(event: string, handler: any): void {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    } else if (event === 'error') {
      this.errorHandlers.push(handler);
    } else if (event === 'close') {
      this.closeHandlers.push(handler);
    }
  }
}

/**
 * Stdio Transport Implementation
 */
class StdioTransport implements MCPTransport {
  private command: string[];
  private args: string[];
  private config: { timeoutMs: number };
  private process: any = null;
  private messageHandlers: Array<(message: JSONRPCResponse | JSONRPCRequest) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private closeHandlers: Array<() => void> = [];
  private messageBuffer: string = '';

  constructor(command: string[], args: string[], config: { timeoutMs: number }) {
    this.command = command;
    this.args = args;
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        import('child_process').then(({ spawn }) => {
          this.process = spawn(this.command[0], [...this.command.slice(1), ...this.args], {
            stdio: ['pipe', 'pipe', 'pipe']
          });

          this.process.stdout.on('data', (data: Buffer) => {
            this.messageBuffer += data.toString();
            this.processMessageBuffer();
          });

          this.process.stderr.on('data', (data: Buffer) => {
            console.error('MCP stdio stderr:', data.toString());
          });

          this.process.on('error', (error: Error) => {
            this.errorHandlers.forEach(handler => handler(error));
            reject(error);
          });

          this.process.on('close', (code: number) => {
            console.log(`MCP stdio process closed with code ${code}`);
            this.closeHandlers.forEach(handler => handler());
          });

          // Wait a bit for process to start
          setTimeout(resolve, 100);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async send(message: JSONRPCRequest | JSONRPCResponse): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Stdio process is not connected');
    }

    const messageStr = JSON.stringify(message) + '\n';
    this.process.stdin.write(messageStr);
  }

  private processMessageBuffer(): void {
    // Process complete JSON-RPC messages (separated by newlines)
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as JSONRPCResponse | JSONRPCRequest;
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing stdio message:', error);
        }
      }
    }
  }

  on(event: 'message', handler: (message: JSONRPCResponse | JSONRPCRequest) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: () => void): void;
  on(event: string, handler: any): void {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    } else if (event === 'error') {
      this.errorHandlers.push(handler);
    } else if (event === 'close') {
      this.closeHandlers.push(handler);
    }
  }
}

// Export singleton instance factory
export function createMCPConnector(config?: Partial<MCPConnectorConfig>): MCPConnector {
  return new MCPConnector(config);
}

