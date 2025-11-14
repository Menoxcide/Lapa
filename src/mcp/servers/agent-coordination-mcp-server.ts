/**
 * Agent Coordination MCP Server for LAPA v1.0.0
 * 
 * This MCP server provides tools for agent-to-agent coordination:
 * - Initiate handoffs between agents
 * - Query agent status and capabilities
 * - Coordinate multi-agent tasks
 * - Manage agent consensus and voting
 * - Track agent performance metrics
 * 
 * Phase: MCP Server Creation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { a2aMediator } from '../../orchestrator/a2a-mediator.ts';
import { mcpSecurityManager } from '../mcp-security.ts';
import { eventBus } from '../../core/event-bus.ts';

// Agent Coordination MCP Server configuration
export interface AgentCoordinationMCPServerConfig {
  enableSecurity?: boolean;
  defaultAgentId?: string;
}

/**
 * Agent Coordination MCP Server
 * 
 * Provides MCP tools for agent coordination and handoffs.
 */
export class AgentCoordinationMCPServer {
  private server: Server;
  private config: AgentCoordinationMCPServerConfig;
  private transport: StdioServerTransport | null = null;

  constructor(config: AgentCoordinationMCPServerConfig = {}) {
    this.config = {
      enableSecurity: true,
      ...config
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'lapa-agent-coordination-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  /**
   * Sets up MCP tools
   */
  private setupTools(): void {
    // Tool: Initiate handoff
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'initiate_handoff') {
        return this.handleInitiateHandoff(request.params.arguments as any);
      }
      if (request.params.name === 'get_agent_status') {
        return this.handleGetAgentStatus(request.params.arguments as any);
      }
      if (request.params.name === 'get_agent_capabilities') {
        return this.handleGetAgentCapabilities(request.params.arguments as any);
      }
      if (request.params.name === 'coordinate_task') {
        return this.handleCoordinateTask(request.params.arguments as any);
      }
      if (request.params.name === 'vote_on_decision') {
        return this.handleVoteOnDecision(request.params.arguments as any);
      }
      if (request.params.name === 'get_consensus_status') {
        return this.handleGetConsensusStatus(request.params.arguments as any);
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Tool: List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'initiate_handoff',
            description: 'Initiate a handoff between two agents',
            inputSchema: zodToJsonSchema(z.object({
              sourceAgentId: z.string().describe('Source agent ID'),
              targetAgentId: z.string().describe('Target agent ID'),
              taskId: z.string().describe('Task ID'),
              taskDescription: z.string().describe('Task description'),
              context: z.record(z.unknown()).optional().describe('Handoff context'),
            })),
          },
          {
            name: 'get_agent_status',
            description: 'Get the status of an agent',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().describe('Agent ID'),
            })),
          },
          {
            name: 'get_agent_capabilities',
            description: 'Get the capabilities of an agent',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().describe('Agent ID'),
            })),
          },
          {
            name: 'coordinate_task',
            description: 'Coordinate a multi-agent task',
            inputSchema: zodToJsonSchema(z.object({
              taskId: z.string().describe('Task ID'),
              agentIds: z.array(z.string()).describe('Agent IDs to coordinate'),
              taskDescription: z.string().describe('Task description'),
            })),
          },
          {
            name: 'vote_on_decision',
            description: 'Vote on a consensus decision',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().describe('Agent ID'),
              decisionId: z.string().describe('Decision ID'),
              vote: z.enum(['approve', 'reject', 'veto']).describe('Vote value'),
              reason: z.string().optional().describe('Vote reason'),
            })),
          },
          {
            name: 'get_consensus_status',
            description: 'Get the consensus status for a decision',
            inputSchema: zodToJsonSchema(z.object({
              decisionId: z.string().describe('Decision ID'),
            })),
          },
        ],
      };
    });
  }

  /**
   * Handles initiate_handoff tool call
   */
  private async handleInitiateHandoff(args: {
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    taskDescription: string;
    context?: Record<string, unknown>;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.sourceAgentId,
        'handoff.initiate',
        args,
        args.taskId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Initiate handoff using A2A mediator
      const handshakeRequest = {
        sourceAgentId: args.sourceAgentId,
        targetAgentId: args.targetAgentId,
        taskId: args.taskId,
        taskDescription: args.taskDescription,
        capabilities: [],
        context: args.context,
      };

      const response = await a2aMediator.initiateHandshake(handshakeRequest);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: response.accepted,
              handoffId: response.handoffId,
              message: response.accepted ? 'Handoff initiated successfully' : 'Handoff rejected',
              reason: response.reason,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to initiate handoff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles get_agent_status tool call
   */
  private async handleGetAgentStatus(args: {
    agentId: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.agentId,
        'agent.read',
        args,
        args.agentId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Get agent status
      // Note: This is a placeholder - actual implementation depends on agent system
      const status = {
        agentId: args.agentId,
        status: 'active',
        currentTask: null,
        queueLength: 0,
        lastActivity: Date.now(),
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get agent status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles get_agent_capabilities tool call
   */
  private async handleGetAgentCapabilities(args: {
    agentId: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.agentId,
        'agent.read',
        args,
        args.agentId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Get agent capabilities
      // Note: This is a placeholder - actual implementation depends on agent system
      const capabilities = {
        agentId: args.agentId,
        capabilities: ['code-generation', 'code-review', 'testing'],
        skills: [],
        tools: [],
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(capabilities, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get agent capabilities: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles coordinate_task tool call
   */
  private async handleCoordinateTask(args: {
    taskId: string;
    agentIds: string[];
    taskDescription: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check for all agents
    if (this.config.enableSecurity) {
      for (const agentId of args.agentIds) {
        const securityCheck = await mcpSecurityManager.validateToolCall(
          agentId,
          'task.execute',
          args,
          args.taskId
        );
        
        if (!securityCheck.passed) {
          throw new Error(`Security validation failed for agent ${agentId}: ${securityCheck.checks.rbac?.reason}`);
        }
      }
    }

    try {
      // Coordinate multi-agent task
      // Note: This is a placeholder - actual implementation depends on orchestrator
      const coordination = {
        taskId: args.taskId,
        agentIds: args.agentIds,
        status: 'coordinating',
        assignedTasks: {},
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(coordination, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to coordinate task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles vote_on_decision tool call
   */
  private async handleVoteOnDecision(args: {
    agentId: string;
    decisionId: string;
    vote: 'approve' | 'reject' | 'veto';
    reason?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.agentId,
        'consensus.vote',
        args,
        args.decisionId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Vote on decision
      // Note: This is a placeholder - actual implementation depends on consensus system
      const vote = {
        agentId: args.agentId,
        decisionId: args.decisionId,
        vote: args.vote,
        reason: args.reason,
        timestamp: Date.now(),
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              vote,
              message: 'Vote recorded successfully',
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to vote on decision: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles get_consensus_status tool call
   */
  private async handleGetConsensusStatus(args: {
    decisionId: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      // Get consensus status
      // Note: This is a placeholder - actual implementation depends on consensus system
      const status = {
        decisionId: args.decisionId,
        status: 'pending',
        votes: {
          approve: 0,
          reject: 0,
          veto: 0,
        },
        threshold: 0.83,
        reached: false,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get consensus status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sets up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('Agent Coordination MCP Server error:', error);
      eventBus.publish({
        id: `mcp-agent-coordination-error-${Date.now()}`,
        type: 'mcp.server.error',
        timestamp: Date.now(),
        source: 'agent-coordination-mcp-server',
        payload: {
          error: error.message,
          stack: error.stack,
        },
      }).catch(console.error);
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * Starts the MCP server
   */
  async start(): Promise<void> {
    try {
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      console.log('Agent Coordination MCP Server started');
      
      eventBus.publish({
        id: `mcp-agent-coordination-started-${Date.now()}`,
        type: 'mcp.server.started',
        timestamp: Date.now(),
        source: 'agent-coordination-mcp-server',
        payload: {
          serverName: 'lapa-agent-coordination-mcp-server',
          version: '1.0.0',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to start Agent Coordination MCP Server:', error);
      throw error;
    }
  }

  /**
   * Stops the MCP server
   */
  async stop(): Promise<void> {
    try {
      if (this.transport) {
        await this.server.close();
        this.transport = null;
      }
      console.log('Agent Coordination MCP Server stopped');
      
      eventBus.publish({
        id: `mcp-agent-coordination-stopped-${Date.now()}`,
        type: 'mcp.server.stopped',
        timestamp: Date.now(),
        source: 'agent-coordination-mcp-server',
        payload: {
          serverName: 'lapa-agent-coordination-mcp-server',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to stop Agent Coordination MCP Server:', error);
      throw error;
    }
  }
}

// Export factory function
export function createAgentCoordinationMCPServer(config?: AgentCoordinationMCPServerConfig): AgentCoordinationMCPServer {
  return new AgentCoordinationMCPServer(config);
}

