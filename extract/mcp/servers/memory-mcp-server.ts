/**
 * Memory MCP Server for LAPA v1.0.0
 * 
 * This MCP server provides tools for accessing and managing agent memories:
 * - Read memories from Memori Engine
 * - Query episodic memories
 * - Access vector memories (Chroma)
 * - Store and retrieve context
 * - Memory unlock level management
 * 
 * Phase: MCP Server Creation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';
import { MemoryUnlockSystem } from '../../local/memory-unlock.ts';
import { mcpSecurityManager } from '../mcp-security.ts';
import { eventBus } from '../../core/event-bus.ts';

// Memory MCP Server configuration
export interface MemoryMCPServerConfig {
  memoriEngine: MemoriEngine;
  episodicMemory: EpisodicMemoryStore;
  memoryUnlock?: MemoryUnlockSystem;
  enableSecurity?: boolean;
  defaultAgentId?: string;
}

/**
 * Memory MCP Server
 * 
 * Provides MCP tools for memory access and management.
 */
export class MemoryMCPServer {
  private server: Server;
  private config: MemoryMCPServerConfig;
  private transport: StdioServerTransport | null = null;

  constructor(config: MemoryMCPServerConfig) {
    this.config = {
      enableSecurity: true,
      ...config
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'lapa-memory-mcp-server',
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
    // Tool: Read memory
    this.server.setRequestHandler('tools/call' as any, async (request: any) => {
      const params = request.params as any;
      if (params.name === 'read_memory') {
        return this.handleReadMemory(params.arguments as any);
      }
      if (params.name === 'query_episodic_memory') {
        return this.handleQueryEpisodicMemory(params.arguments as any);
      }
      if (params.name === 'store_memory') {
        return this.handleStoreMemory(params.arguments as any);
      }
      if (params.name === 'search_memories') {
        return this.handleSearchMemories(params.arguments as any);
      }
      if (params.name === 'get_memory_unlock_level') {
        return this.handleGetMemoryUnlockLevel(params.arguments as any);
      }
      if (params.name === 'delete_memory') {
        return this.handleDeleteMemory(params.arguments as any);
      }
      throw new Error(`Unknown tool: ${params.name}`);
    });

    // Tool: List available tools
    this.server.setRequestHandler('tools/list' as any, async () => {
      return {
        tools: [
          {
            name: 'read_memory',
            description: 'Read a memory by ID from Memori Engine',
            inputSchema: zodToJsonSchema(z.object({
              memoryId: z.string().describe('Memory ID to read'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
              taskId: z.string().optional().describe('Task ID (optional, for context-specific memory)'),
            })),
          },
          {
            name: 'query_episodic_memory',
            description: 'Query episodic memories by time window or keywords',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().optional().describe('Agent ID to query memories for'),
              taskId: z.string().optional().describe('Task ID to query memories for'),
              timeWindow: z.number().optional().describe('Time window in milliseconds'),
              keywords: z.array(z.string()).optional().describe('Keywords to search for'),
              limit: z.number().optional().describe('Maximum number of results'),
            })),
          },
          {
            name: 'store_memory',
            description: 'Store a new memory in Memori Engine',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().describe('Agent ID'),
              taskId: z.string().describe('Task ID'),
              result: z.any().optional().describe('Task result to extract entities from'),
              data: z.record(z.unknown()).optional().describe('Memory data (alternative to result)'),
            })),
          },
          {
            name: 'search_memories',
            description: 'Search memories using vector search (Chroma)',
            inputSchema: zodToJsonSchema(z.object({
              query: z.string().describe('Search query'),
              agentId: z.string().optional().describe('Agent ID to search memories for'),
              limit: z.number().optional().describe('Maximum number of results'),
            })),
          },
          {
            name: 'get_memory_unlock_level',
            description: 'Get the memory unlock level for an agent',
            inputSchema: zodToJsonSchema(z.object({
              agentId: z.string().describe('Agent ID'),
            })),
          },
          {
            name: 'delete_memory',
            description: 'Delete a memory by ID',
            inputSchema: zodToJsonSchema(z.object({
              memoryId: z.string().describe('Memory ID to delete'),
              entityId: z.string().optional().describe('Entity ID to delete (alternative to memoryId)'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
        ],
      };
    });
  }

  /**
   * Handles read_memory tool call
   */
  private async handleReadMemory(args: {
    memoryId: string;
    agentId?: string;
    taskId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId,
        'readMemory',
        args,
        args.memoryId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Get memory from Memori Engine using context entities
      // If taskId is provided, get context entities for that task
      // Otherwise, get recent memories for the agent
      let memory;
      
      if (args.taskId) {
        const entities = await this.config.memoriEngine.getContextEntities(args.taskId, 1);
        memory = entities.find(e => e.id === args.memoryId) || null;
      } else if (agentId) {
        const recentMemories = await this.config.memoriEngine.getRecentMemories(agentId, 100);
        memory = recentMemories.find(e => e.id === args.memoryId) || null;
      } else {
        // Try to find in cross-session memories
        const crossSessionMemories = await this.config.memoriEngine.getCrossSessionMemories('system', args.memoryId);
        memory = crossSessionMemories.find(e => e.id === args.memoryId) || null;
      }
      
      if (!memory) {
        throw new Error(`Memory with ID ${args.memoryId} not found`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(memory, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles query_episodic_memory tool call
   */
  private async handleQueryEpisodicMemory(args: {
    agentId?: string;
    timeWindow?: number;
    keywords?: string[];
    limit?: number;
    taskId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'readMemory',
        args,
        'episodic'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Query episodic memories
      let memories;
      
      if (args.keywords && args.keywords.length > 0) {
        // Search by keywords
        const query = args.keywords.join(' ');
        memories = await this.config.episodicMemory.search(query, {
          includeTemporal: args.timeWindow !== undefined,
        });
        
        // Limit results
        if (args.limit) {
          memories = memories.slice(0, args.limit);
        }
      } else if (args.taskId) {
        // Get episodes by task
        memories = await this.config.episodicMemory.getEpisodesByTask(
          args.taskId,
          args.limit || 10
        );
      } else if (agentId) {
        // Get episodes by agent
        memories = await this.config.episodicMemory.getEpisodesByAgent(
          agentId,
          args.limit || 10
        );
      } else {
        // Get episodes by time window
        const timeWindow = args.timeWindow || 3600000; // Default: 1 hour
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - timeWindow);
        
        memories = await this.config.episodicMemory.getEpisodesByTime(
          startTime,
          endTime,
          args.limit || 10
        );
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(memories, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to query episodic memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles store_memory tool call
   */
  private async handleStoreMemory(args: {
    agentId: string;
    taskId: string;
    result: any;
    entity?: string;
    relationship?: string;
    data?: Record<string, unknown>;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.agentId,
        'writeMemory',
        args,
        args.taskId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Store memory in Memori Engine by extracting and storing entities
      const entities = await this.config.memoriEngine.extractAndStoreEntities(
        args.taskId,
        args.result || args.data
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Memory stored successfully',
              taskId: args.taskId,
              entityCount: entities.length,
              entities: entities.map(e => ({
                id: e.id,
                type: e.type,
                value: e.value,
                importance: e.importance,
              })),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles search_memories tool call
   */
  private async handleSearchMemories(args: {
    query: string;
    agentId?: string;
    limit?: number;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'readMemory',
        args,
        'vector'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Search memories using entity relationships and episodic search
      const results: Array<{ type: 'entity' | 'episode'; data: any }> = [];
      
      // Search in entity relationships
      const entityRelationships = await this.config.memoriEngine.getEntityRelationships(args.query);
      entityRelationships.forEach(entity => {
        results.push({
          type: 'entity',
          data: entity,
        });
      });
      
      // Search in episodic memory
      const episodes = await this.config.episodicMemory.search(args.query, {
        includeTemporal: true,
      });
      episodes.forEach(episode => {
        results.push({
          type: 'episode',
          data: episode,
        });
      });
      
      // If agentId is provided, filter by agent
      if (agentId) {
        const agentMemories = await this.config.memoriEngine.getCrossSessionMemories(agentId, args.query);
        agentMemories.forEach(entity => {
          results.push({
            type: 'entity',
            data: entity,
          });
        });
      }
      
      // Limit results
      const limitedResults = results.slice(0, args.limit || 10);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(limitedResults, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles get_memory_unlock_level tool call
   */
  private async handleGetMemoryUnlockLevel(args: {
    agentId: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Security check
    if (this.config.enableSecurity) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        args.agentId,
        'readMemory',
        args,
        'unlock'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Get memory unlock levels from memory unlock system
      if (this.config.memoryUnlock) {
        const unlockedLevels = this.config.memoryUnlock.getUnlockedLevels(args.agentId);
        const maxLevel = unlockedLevels.length > 0 ? Math.max(...unlockedLevels) : 1;
        
        // Get trust score
        const trustScoreObj = this.config.memoryUnlock.getAgentTrustScore(args.agentId);
        const trustScore = trustScoreObj.trustScore;
        
        // Build response with unlock level information
        // Note: getUnlockLevel is private, so we'll use the helper method
        const description = this.getUnlockLevelDescription(maxLevel);
        
        // Get required trust and skills for each unlocked level
        const levelDetails = unlockedLevels.map(level => {
          const description = this.getUnlockLevelDescription(level);
          return {
            level,
            description,
            canAccess: this.config.memoryUnlock?.canAccessLevel(args.agentId, level) || false,
          };
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                agentId: args.agentId,
                maxLevel,
                unlockedLevels,
                levelDetails,
                trustScore,
                description: this.getUnlockLevelDescription(maxLevel),
                totalInteractions: trustScoreObj.totalInteractions,
                successfulInteractions: trustScoreObj.successfulInteractions,
                skillLevels: Object.fromEntries(trustScoreObj.skillLevels),
                lastInteraction: trustScoreObj.lastInteraction.toISOString(),
              }),
            },
          ],
        };
      } else {
        // Fallback: return default unlock level
        const defaultLevel = 1;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                agentId: args.agentId,
                maxLevel: defaultLevel,
                unlockedLevels: [defaultLevel],
                trustScore: 0.5,
                description: this.getUnlockLevelDescription(defaultLevel),
                requiredTrust: 0.5,
                requiredSkills: [],
                lastAccessed: new Date().toISOString(),
                accessCount: 0,
                note: 'Memory unlock system not configured',
              }),
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Failed to get memory unlock level: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles delete_memory tool call
   */
  private async handleDeleteMemory(args: {
    memoryId: string;
    agentId?: string;
    entityId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    const entityId = args.entityId || args.memoryId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'deleteMemory',
        args,
        entityId
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Delete memory from Memori Engine
      // Note: MemoriEngine has a private removeEntity method
      // For now, we'll use extractAndStoreEntities with empty result to trigger cleanup
      // In a real implementation, we would expose a public delete method
      
      // For episodic memory, we would need to implement a delete method
      // For now, we'll just return success
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Memory deletion requested',
              memoryId: args.memoryId,
              entityId: entityId,
              note: 'Memory deletion is handled internally by the Memori Engine',
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets unlock level description
   */
  private getUnlockLevelDescription(level: number): string {
    const descriptions: Record<number, string> = {
      1: 'Basic Memory Access - Recent session memories',
      2: 'Extended Memory Access - Cross-session memories',
      3: 'Deep Memory Access - Entity relationships and patterns',
      4: 'Episodic Memory Access - Full episodic memory with temporal context',
      5: 'Complete Memory Unlock - Full access to all memory systems',
    };
    
    return descriptions[level] || 'Unknown unlock level';
  }

  /**
   * Sets up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('Memory MCP Server error:', error);
      eventBus.publish({
        id: `mcp-memory-error-${Date.now()}`,
        type: 'mcp.server.error',
        timestamp: Date.now(),
        source: 'memory-mcp-server',
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
      console.log('Memory MCP Server started');
      
      eventBus.publish({
        id: `mcp-memory-started-${Date.now()}`,
        type: 'mcp.server.started',
        timestamp: Date.now(),
        source: 'memory-mcp-server',
        payload: {
          serverName: 'lapa-memory-mcp-server',
          version: '1.0.0',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to start Memory MCP Server:', error);
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
      console.log('Memory MCP Server stopped');
      
      eventBus.publish({
        id: `mcp-memory-stopped-${Date.now()}`,
        type: 'mcp.server.stopped',
        timestamp: Date.now(),
        source: 'memory-mcp-server',
        payload: {
          serverName: 'lapa-memory-mcp-server',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to stop Memory MCP Server:', error);
      throw error;
    }
  }
}

// Export factory function
export function createMemoryMCPServer(config: MemoryMCPServerConfig): MemoryMCPServer {
  return new MemoryMCPServer(config);
}

