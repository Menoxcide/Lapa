/**
 * MCP Servers Index for LAPA v1.0.0
 * 
 * This file exports all LAPA-specific MCP servers for easy import.
 * 
 * Phase: MCP Server Creation
 */

export { MemoryMCPServer, createMemoryMCPServer, type MemoryMCPServerConfig } from './memory-mcp-server.ts';
export { AgentCoordinationMCPServer, createAgentCoordinationMCPServer, type AgentCoordinationMCPServerConfig } from './agent-coordination-mcp-server.ts';
export { CodeAnalysisMCPServer, createCodeAnalysisMCPServer, type CodeAnalysisMCPServerConfig } from './code-analysis-mcp-server.ts';

// Re-export E2B MCP Server (commented out - module not found)
// export { E2BMCPService, type E2BMCPConfig, type ExecutionResult, type FileOperationResult } from '../sandbox/e2b-mcp.ts';

/**
 * MCP Server Registry
 * 
 * Provides a registry for all available MCP servers.
 */
export class MCPServerRegistry {
  private servers: Map<string, any> = new Map();

  /**
   * Registers an MCP server
   */
  register(name: string, server: any): void {
    this.servers.set(name, server);
  }

  /**
   * Gets an MCP server by name
   */
  get(name: string): any {
    return this.servers.get(name);
  }

  /**
   * Gets all registered servers
   */
  getAll(): Map<string, any> {
    return new Map(this.servers);
  }

  /**
   * Unregisters an MCP server
   */
  unregister(name: string): void {
    this.servers.delete(name);
  }
}

// Export singleton instance
export const mcpServerRegistry = new MCPServerRegistry();

