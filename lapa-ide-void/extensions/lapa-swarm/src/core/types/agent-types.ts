/**
 * Agent Types and Interfaces for LAPA Core
 * 
 * This module defines the standardized types and interfaces for agent tools
 * and execution within the LAPA framework. It provides a consistent abstraction
 * layer for different agent types and tool execution patterns.
 */

// Base types for agent tools
export type AgentToolType = 
  | 'code-generation'
  | 'code-review'
  | 'testing'
  | 'debugging'
  | 'research'
  | 'planning'
  | 'optimization'
  | 'documentation';

// Execution context for agent tools
export interface AgentToolExecutionContext {
  taskId: string;
  agentId: string;
  toolName: string;
  parameters: Record<string, any>;
  context: Record<string, any>;
  metadata?: Record<string, any>;
}

// Result of agent tool execution
export interface AgentToolExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

// Agent tool interface
export interface AgentTool {
  name: string;
  type: AgentToolType;
  description: string;
  version: string;
  execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>;
  validateParameters(params: Record<string, any>): boolean;
}

// Agent tool factory interface
export interface AgentToolFactory {
  createTool(toolName: string, config?: Record<string, any>): AgentTool;
  getSupportedTools(): string[];
  getToolMetadata(toolName: string): Record<string, any>;
}

// Agent interface
export interface Agent {
  id: string;
  type: string;
  name: string;
  capabilities: string[];
  workload: number;
  capacity: number;
  tools: AgentTool[];
  executeTool(toolName: string, context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>;
}

// Agent factory interface
export interface AgentFactory {
  createAgent(agentType: string, config?: Record<string, any>): Agent;
  getSupportedAgentTypes(): string[];
  getAgentMetadata(agentType: string): Record<string, any>;
}

// Helix team agent types (12-agent helix pattern)
export type HelixAgentType = 
  | 'architect'
  | 'researcher'
  | 'coder'
  | 'tester'
  | 'reviewer'
  | 'debugger'
  | 'optimizer'
  | 'planner'
  | 'documenter'
  | 'validator'
  | 'integrator'
  | 'deployer';

// Helix team configuration
export interface HelixTeamConfig {
  agents: Record<HelixAgentType, Agent>;
  collaborationRules: Record<string, string[]>;
  communicationProtocol: 'event-bus' | 'direct' | 'hybrid';
}