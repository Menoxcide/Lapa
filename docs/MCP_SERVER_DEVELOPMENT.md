# MCP Server Development Guide for LAPA-VOID

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: ✅ Production Ready

---

## Overview

This guide provides comprehensive instructions for developing MCP (Model Context Protocol) servers for LAPA-VOID. It covers security best practices, testing strategies, and integration patterns.

## Table of Contents

1. [Introduction](#introduction)
2. [MCP Server Architecture](#mcp-server-architecture)
3. [Creating a New MCP Server](#creating-a-new-mcp-server)
4. [Security Best Practices](#security-best-practices)
5. [Testing MCP Servers](#testing-mcp-servers)
6. [Integration with LAPA Systems](#integration-with-lapa-systems)
7. [Available MCP Servers](#available-mcp-servers)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

MCP servers in LAPA-VOID provide standardized interfaces for accessing LAPA's capabilities:
- **Memory Access**: Read and write agent memories
- **Agent Coordination**: Coordinate multi-agent tasks
- **Code Analysis**: Analyze code quality and security
- **Swarm Management**: Manage swarm sessions and agents

### Key Features

- ✅ **Security-First**: RBAC integration, input validation, rate limiting
- ✅ **Comprehensive Testing**: Unit, integration, and security tests
- ✅ **Audit Logging**: All operations logged for security compliance
- ✅ **Error Handling**: Robust error handling with retry logic
- ✅ **Performance Monitoring**: Usage statistics and performance metrics

---

## MCP Server Architecture

### Core Components

1. **MCP Security Manager** (`src/mcp/mcp-security.ts`)
   - RBAC integration
   - Rate limiting
   - Input validation
   - Audit logging

2. **MCP Connector** (`src/mcp/mcp-connector.ts`)
   - JSON-RPC transport (WebSocket/stdio)
   - Tool discovery
   - Request/response handling
   - Error handling

3. **MCP Servers** (`src/mcp/servers/`)
   - Memory MCP Server
   - Agent Coordination MCP Server
   - Code Analysis MCP Server
   - E2B MCP Server

### Security Architecture

```
┌─────────────────┐
│  MCP Connector  │
│  (JSON-RPC)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Manager│
│  - RBAC Check   │
│  - Rate Limit   │
│  - Input Valid  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Server     │
│  - Tool Handler │
│  - Business Logic│
└─────────────────┘
```

---

## Creating a New MCP Server

### Step 1: Create Server File

Create a new file in `src/mcp/servers/`:

```typescript
// src/mcp/servers/my-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { mcpSecurityManager } from '../mcp-security.ts';
import { eventBus } from '../../core/event-bus.ts';

export interface MyMCPServerConfig {
  enableSecurity?: boolean;
  defaultAgentId?: string;
}

export class MyMCPServer {
  private server: Server;
  private config: MyMCPServerConfig;
  private transport: StdioServerTransport | null = null;

  constructor(config: MyMCPServerConfig = {}) {
    this.config = {
      enableSecurity: true,
      ...config
    };

    this.server = new Server(
      {
        name: 'lapa-my-mcp-server',
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

  private setupTools(): void {
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'my_tool') {
        return this.handleMyTool(request.params.arguments as any);
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'my_tool',
            description: 'My tool description',
            inputSchema: zodToJsonSchema(z.object({
              input: z.string().describe('Input parameter'),
              agentId: z.string().optional().describe('Agent ID'),
            })),
          },
        ],
      };
    });
  }

  private async handleMyTool(args: {
    input: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'my.tool',
        args,
        'my-resource'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Tool implementation
      const result = {
        success: true,
        output: `Processed: ${args.input}`,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('My MCP Server error:', error);
      eventBus.publish({
        id: `mcp-my-error-${Date.now()}`,
        type: 'mcp.server.error',
        timestamp: Date.now(),
        source: 'my-mcp-server',
        payload: {
          error: error.message,
          stack: error.stack,
        },
      }).catch(console.error);
    };
  }

  async start(): Promise<void> {
    try {
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      console.log('My MCP Server started');
    } catch (error) {
      console.error('Failed to start My MCP Server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.transport) {
        await this.server.close();
        this.transport = null;
      }
      console.log('My MCP Server stopped');
    } catch (error) {
      console.error('Failed to stop My MCP Server:', error);
      throw error;
    }
  }
}

export function createMyMCPServer(config?: MyMCPServerConfig): MyMCPServer {
  return new MyMCPServer(config);
}
```

### Step 2: Register Security Metadata

Register your tool with the security manager:

```typescript
import { mcpSecurityManager } from '../mcp-security.ts';

// Register tool security metadata
mcpSecurityManager.registerToolSecurity({
  toolName: 'my_tool',
  requiredPermission: 'mcp.tool.invoke',
  resourceType: 'mcp',
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    burstSize: 10
  },
  requiresAudit: true,
  riskLevel: 'medium'
});
```

### Step 3: Add to Index

Export your server in `src/mcp/servers/index.ts`:

```typescript
export { MyMCPServer, createMyMCPServer, type MyMCPServerConfig } from './my-mcp-server.ts';
```

### Step 4: Write Tests

Create comprehensive tests:

```typescript
// src/__tests__/mcp/servers/my-mcp-server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MyMCPServer } from '../../../mcp/servers/my-mcp-server.ts';

describe('MyMCPServer', () => {
  let server: MyMCPServer;

  beforeEach(() => {
    server = new MyMCPServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should start successfully', async () => {
    await server.start();
    expect(server).toBeDefined();
  });

  it('should handle tool calls with security', async () => {
    await server.start();
    // Test tool call with security validation
  });
});
```

---

## Security Best Practices

### 1. Always Use Security Manager

**✅ DO:**
```typescript
const securityCheck = await mcpSecurityManager.validateToolCall(
  agentId,
  toolName,
  arguments_,
  resourceId
);

if (!securityCheck.passed) {
  throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
}
```

**❌ DON'T:**
```typescript
// Never skip security checks
const result = await myTool(arguments_);
```

### 2. Register Tool Security Metadata

**✅ DO:**
```typescript
mcpSecurityManager.registerToolSecurity({
  toolName: 'my_tool',
  requiredPermission: 'mcp.tool.invoke',
  resourceType: 'mcp',
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    burstSize: 10
  },
  requiresAudit: true,
  riskLevel: 'medium'
});
```

### 3. Sanitize Input Data

**✅ DO:**
```typescript
// Validate input with Zod schema
const schema = z.object({
  input: z.string().min(1).max(1000),
  agentId: z.string().optional(),
});

const validatedArgs = schema.parse(args);
```

**❌ DON'T:**
```typescript
// Never trust user input
const result = await dangerousOperation(args.input);
```

### 4. Use Rate Limiting

**✅ DO:**
```typescript
// Rate limiting is automatic when tool is registered
mcpSecurityManager.registerToolSecurity({
  toolName: 'my_tool',
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    burstSize: 10
  }
});
```

### 5. Log Security Events

**✅ DO:**
```typescript
// Security events are automatically logged by security manager
// Additional logging for critical operations:
await eventBus.publish({
  id: `security-event-${Date.now()}`,
  type: 'security.event',
  timestamp: Date.now(),
  source: 'my-mcp-server',
  payload: {
    agentId,
    action: 'tool_call',
    toolName: 'my_tool',
  },
});
```

### 6. Handle Errors Gracefully

**✅ DO:**
```typescript
try {
  const result = await myOperation();
  return result;
} catch (error) {
  // Log error without exposing sensitive information
  console.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

**❌ DON'T:**
```typescript
// Never expose internal implementation details
catch (error) {
  throw error; // May expose sensitive information
}
```

---

## Testing MCP Servers

### Unit Tests

Test individual tool handlers:

```typescript
describe('MyMCPServer Tool Handlers', () => {
  it('should handle tool calls correctly', async () => {
    const server = new MyMCPServer();
    await server.start();
    
    const result = await server.handleMyTool({
      input: 'test',
      agentId: 'test-agent'
    });
    
    expect(result.content[0].text).toContain('Processed: test');
  });
});
```

### Security Tests

Test security validation:

```typescript
describe('MyMCPServer Security', () => {
  it('should reject unauthorized tool calls', async () => {
    const server = new MyMCPServer({ enableSecurity: true });
    await server.start();
    
    await expect(
      server.handleMyTool({
        input: 'test',
        agentId: 'unauthorized-agent'
      })
    ).rejects.toThrow('Security validation failed');
  });
  
  it('should enforce rate limits', async () => {
    // Test rate limiting
  });
});
```

### Integration Tests

Test end-to-end workflows:

```typescript
describe('MyMCPServer Integration', () => {
  it('should integrate with MCP connector', async () => {
    const server = new MyMCPServer();
    await server.start();
    
    const connector = new MCPConnector({
      transportType: 'stdio',
      stdioCommand: ['node', 'server.js'],
    });
    
    await connector.connect();
    const result = await connector.callTool('my_tool', {
      input: 'test',
      agentId: 'test-agent'
    });
    
    expect(result).toBeDefined();
  });
});
```

---

## Integration with LAPA Systems

### Memory System Integration

```typescript
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';

const memoryServer = new MemoryMCPServer({
  memoriEngine: new MemoriEngine(),
  episodicMemory: new EpisodicMemoryStore(),
  enableSecurity: true,
});
```

### Agent Coordination Integration

```typescript
import { a2aMediator } from '../../orchestrator/a2a-mediator.ts';

const coordinationServer = new AgentCoordinationMCPServer({
  enableSecurity: true,
});
```

### Code Analysis Integration

```typescript
import { LLMJudge } from '../../orchestrator/llm-judge.ts';
import { hallucinationCheckSystem } from '../../security/hallucination-check.ts';

const analysisServer = new CodeAnalysisMCPServer({
  llmJudge: new LLMJudge({
    model: 'llama3.1',
    enableFuzzyRules: true,
    temperature: 0.3,
  }),
  enableSecurity: true,
});
```

---

## Available MCP Servers

### 1. Memory MCP Server

**Purpose**: Access and manage agent memories

**Tools**:
- `read_memory`: Read a memory by ID
- `query_episodic_memory`: Query episodic memories
- `store_memory`: Store a new memory
- `search_memories`: Search memories using vector search
- `get_memory_unlock_level`: Get memory unlock level for an agent
- `delete_memory`: Delete a memory by ID

**Usage**:
```typescript
import { createMemoryMCPServer } from './mcp/servers/memory-mcp-server.ts';

const server = createMemoryMCPServer({
  memoriEngine: new MemoriEngine(),
  episodicMemory: new EpisodicMemoryStore(),
  enableSecurity: true,
});

await server.start();
```

### 2. Agent Coordination MCP Server

**Purpose**: Coordinate agent-to-agent handoffs and tasks

**Tools**:
- `initiate_handoff`: Initiate a handoff between agents
- `get_agent_status`: Get the status of an agent
- `get_agent_capabilities`: Get the capabilities of an agent
- `coordinate_task`: Coordinate a multi-agent task
- `vote_on_decision`: Vote on a consensus decision
- `get_consensus_status`: Get the consensus status for a decision

**Usage**:
```typescript
import { createAgentCoordinationMCPServer } from './mcp/servers/agent-coordination-mcp-server.ts';

const server = createAgentCoordinationMCPServer({
  enableSecurity: true,
});

await server.start();
```

### 3. Code Analysis MCP Server

**Purpose**: Analyze code quality and security

**Tools**:
- `analyze_code_quality`: Analyze code quality using LLM-as-Judge
- `check_security_vulnerabilities`: Check code for security vulnerabilities
- `detect_code_smells`: Detect code smells and anti-patterns
- `validate_code_patterns`: Validate code against patterns
- `check_hallucinations`: Check code for hallucinations
- `generate_quality_report`: Generate comprehensive code quality report

**Usage**:
```typescript
import { createCodeAnalysisMCPServer } from './mcp/servers/code-analysis-mcp-server.ts';

const server = createCodeAnalysisMCPServer({
  enableSecurity: true,
});

await server.start();
```

### 4. E2B MCP Server

**Purpose**: Secure code execution in sandboxed environments

**Tools**:
- `executeCode`: Execute code in E2B sandbox
- `createFile`: Create a file in sandbox
- `readFile`: Read a file from sandbox
- `installPackages`: Install packages in sandbox
- `listFiles`: List files in sandbox

**Usage**:
```typescript
import { E2BMCPService } from './sandbox/e2b-mcp.ts';

const server = new E2BMCPService({
  e2bApiKey: process.env.E2B_API_KEY,
  maxConcurrency: 10,
});

const handler = server.getHttpHandler();
```

---

## Troubleshooting

### Common Issues

#### 1. Security Validation Failures

**Problem**: Tool calls are rejected with "Security validation failed"

**Solution**:
- Verify agent has required permissions in RBAC system
- Check rate limits are not exceeded
- Ensure agent is not blocked

#### 2. Connection Issues

**Problem**: MCP server fails to connect

**Solution**:
- Verify transport configuration (stdio/websocket)
- Check server is started before connecting
- Verify network connectivity for WebSocket transport

#### 3. Tool Discovery Failures

**Problem**: Tools are not discovered

**Solution**:
- Verify tools are registered in `tools/list` handler
- Check tool schemas are valid JSON Schema
- Verify MCP protocol version compatibility

#### 4. Performance Issues

**Problem**: Tool calls are slow

**Solution**:
- Check rate limiting configuration
- Verify security checks are not blocking
- Monitor usage statistics for bottlenecks
- Consider caching for expensive operations

---

## Best Practices Summary

1. ✅ **Always use security manager** for tool calls
2. ✅ **Register tool security metadata** with appropriate risk levels
3. ✅ **Validate input data** with Zod schemas
4. ✅ **Use rate limiting** to prevent abuse
5. ✅ **Log security events** for audit compliance
6. ✅ **Handle errors gracefully** without exposing sensitive information
7. ✅ **Write comprehensive tests** for all tools
8. ✅ **Monitor usage statistics** for performance optimization
9. ✅ **Document tool usage** with clear descriptions
10. ✅ **Follow MCP protocol specifications** for compatibility

---

## Additional Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [LAPA Protocol Documentation](PROTOCOLS.md)
- [Security Best Practices](SECURITY.md)
- [Testing Guide](TESTING.md)

---

**End of MCP Server Development Guide**

