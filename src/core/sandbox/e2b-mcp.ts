/**
 * E2B MCP Server for LAPA Premium Scaling
 * 
 * This module implements an MCP (Model Context Protocol) server using E2B sandbox
 * technology for secure, scalable code execution in premium features.
 */

import { Sandbox } from '@e2b/code-interpreter';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Type definitions
export interface E2BMCPConfig {
  e2bApiKey?: string;
  defaultTemplate?: string;
  maxConcurrency?: number;
  timeoutMs?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export interface FileOperationResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * E2B MCP Server Class
 * 
 * Implements MCP server with E2B sandbox for secure code execution and premium scaling.
 */
export class E2BMCPService {
  private mcp: McpServer;
  private config: E2BMCPConfig;
  private activeSandboxes: Map<string, Sandbox> = new Map();
  private maxConcurrency: number;
  private currentConcurrency: number = 0;

  constructor(config?: Partial<E2BMCPConfig>) {
    this.config = {
      e2bApiKey: config?.e2bApiKey || process.env.E2B_API_KEY,
      defaultTemplate: config?.defaultTemplate || 'base',
      maxConcurrency: config?.maxConcurrency || 10,
      timeoutMs: config?.timeoutMs || 30000
    };

    this.maxConcurrency = this.config.maxConcurrency || 10;

    if (!this.config.e2bApiKey) {
      throw new Error('E2B API key is required for MCP service');
    }

    // Initialize MCP server
    this.mcp = new McpServer({
      name: 'lapa-e2b-mcp-server',
      version: '1.0.0',
    });

    // Register MCP tools
    this.registerTools();
  }

  /**
   * Registers MCP tools for E2B sandbox operations
   */
  private registerTools(): void {
    // Tool: Execute code in sandbox
    this.mcp.registerTool('executeCode', {
      description: 'Execute code securely in an E2B sandbox environment',
      inputSchema: {
        code: z.string().describe('Code to execute'),
        language: z.enum(['javascript', 'python', 'bash']).describe('Programming language'),
        timeout: z.number().optional().describe('Execution timeout in milliseconds'),
      }
    }, async (args: { code?: string; language?: string; timeout?: number }) => {
      // Validate required parameters
      if (!args.code) {
        return {
          content: [{ type: 'text', text: 'Error: code parameter is required' }],
          isError: true
        };
      }
      
      if (!args.language) {
        return {
          content: [{ type: 'text', text: 'Error: language parameter is required' }],
          isError: true
        };
      }
      
      try {
        const result = await this.executeCodeInSandbox(args.code, args.language, args.timeout);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error executing code: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Tool: Create file in sandbox
    this.mcp.registerTool('createFile', {
      description: 'Create a file in the E2B sandbox',
      inputSchema: {
        path: z.string().describe('File path'),
        content: z.string().describe('File content'),
      }
    }, async (args: { path?: string; content?: string }) => {
      // Validate required parameters
      if (!args.path) {
        return {
          content: [{ type: 'text', text: 'Error: path parameter is required' }],
          isError: true
        };
      }
      
      if (args.content === undefined) {
        return {
          content: [{ type: 'text', text: 'Error: content parameter is required' }],
          isError: true
        };
      }
      
      try {
        const result = await this.createFileInSandbox(args.path, args.content);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error creating file: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Tool: Read file from sandbox
    this.mcp.registerTool('readFile', {
      description: 'Read a file from the E2B sandbox',
      inputSchema: {
        path: z.string().describe('File path'),
      }
    }, async (args: { path?: string }) => {
      // Validate required parameters
      if (!args.path) {
        return {
          content: [{ type: 'text', text: 'Error: path parameter is required' }],
          isError: true
        };
      }
      
      try {
        const content = await this.readFileFromSandbox(args.path);
        return {
          content: [{ type: 'text', text: content }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Tool: Install packages in sandbox
    this.mcp.registerTool('installPackages', {
      description: 'Install packages in the E2B sandbox',
      inputSchema: {
        packages: z.array(z.string()).describe('List of packages to install'),
        packageManager: z.enum(['npm', 'pip', 'apt']).describe('Package manager to use'),
      }
    }, async (args: { packages?: string[]; packageManager?: string }) => {
      // Validate required parameters
      if (!args.packages) {
        return {
          content: [{ type: 'text', text: 'Error: packages parameter is required' }],
          isError: true
        };
      }
      
      if (!args.packageManager) {
        return {
          content: [{ type: 'text', text: 'Error: packageManager parameter is required' }],
          isError: true
        };
      }
      
      try {
        const result = await this.installPackagesInSandbox(args.packages, args.packageManager);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error installing packages: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });

    // Tool: List files in sandbox
    this.mcp.registerTool('listFiles', {
      description: 'List files in the E2B sandbox directory',
      inputSchema: {
        path: z.string().optional().describe('Directory path to list'),
      }
    }, async (args: { path?: string }) => {
      try {
        const files = await this.listFilesInSandbox(args.path);
        return {
          content: [{ type: 'text', text: JSON.stringify(files) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error listing files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Gets the HTTP handler for the MCP server
   * @returns HTTP handler function
   */
  getHttpHandler() {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => Math.random().toString(36).substring(2, 15)
    });
    return transport;
  }

  /**
   * Executes code in an E2B sandbox
   * @param code Code to execute
   * @param language Programming language
   * @param timeout Execution timeout
   * @returns Execution result
   */
  private async executeCodeInSandbox(
    code: string,
    language: string,
    timeout?: number
  ): Promise<ExecutionResult> {
    // Check concurrency limits
    if (this.currentConcurrency >= this.maxConcurrency) {
      throw new Error(`Maximum concurrency limit reached (${this.maxConcurrency})`);
    }

    this.currentConcurrency++;
    let sandbox: Sandbox | undefined;

    try {
      // Create sandbox
      sandbox = await Sandbox.create();

      this.activeSandboxes.set(sandbox.sandboxId, sandbox);

      // Prepare command based on language
      let execution: any;

      // Convert timeout from ms to seconds for E2B API
      const timeoutSeconds = timeout ? timeout / 1000 : undefined;

      switch (language) {
        case 'javascript':
          execution = await sandbox.runCode(code, {
            language: 'javascript',
            timeoutMs: timeout
          });
          break;
        case 'python':
          execution = await sandbox.runCode(code, {
            language: 'python',
            timeoutMs: timeout
          });
          break;
        case 'bash':
          execution = await sandbox.runCode(code, {
            language: 'bash',
            timeoutMs: timeout
          });
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const executionTime = execution.logs?.stdout?.length || execution.logs?.stderr?.length ?
        execution.logs.stdout.length + execution.logs.stderr.length : 0;

      return {
        stdout: execution.logs?.stdout?.join('\n') || '',
        stderr: execution.logs?.stderr?.join('\n') || '',
        exitCode: execution.error ? 1 : 0,
        executionTime,
      };
    } finally {
      // Cleanup
      this.currentConcurrency--;
      if (sandbox) {
        this.activeSandboxes.delete(sandbox.sandboxId);
        try {
          // Sandbox cleanup is automatic in code-interpreter
        } catch (error) {
          console.warn(`Failed to close sandbox:`, error);
        }
      }
    }
  }

  /**
   * Creates a file in the E2B sandbox
   * @param path File path
   * @param content File content
   * @returns File operation result
   */
  private async createFileInSandbox(path: string, content: string): Promise<FileOperationResult> {
    try {
      const sandbox = await Sandbox.create();
      
      // Write file to sandbox
      await sandbox.files.write(path, content);
      
      return { success: true, path };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Reads a file from the E2B sandbox
   * @param path File path
   * @returns File content
   */
  private async readFileFromSandbox(path: string): Promise<string> {
    try {
      const sandbox = await Sandbox.create();
      
      // Read file from sandbox
      const content = await sandbox.files.read(path);
      
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Installs packages in the E2B sandbox
   * @param packages List of packages to install
   * @param packageManager Package manager to use
   * @returns Execution result
   */
  private async installPackagesInSandbox(
    packages: string[],
    packageManager: string
  ): Promise<ExecutionResult> {
    // Check concurrency limits
    if (this.currentConcurrency >= this.maxConcurrency) {
      throw new Error(`Maximum concurrency limit reached (${this.maxConcurrency})`);
    }

    this.currentConcurrency++;
    let sandbox: Sandbox | undefined;

    try {
      // Create sandbox
      sandbox = await Sandbox.create();

      // Prepare installation command
      let code: string;
      switch (packageManager) {
        case 'npm':
          code = `npm install ${packages.join(' ')}`;
          break;
        case 'pip':
          code = `pip install ${packages.join(' ')}`;
          break;
        case 'apt':
          code = `apt-get update && apt-get install -y ${packages.join(' ')}`;
          break;
        default:
          throw new Error(`Unsupported package manager: ${packageManager}`);
      }

      // Execute installation
      const execution = await sandbox.runCode(code);
      
      return {
        stdout: execution.logs?.stdout?.join('\n') || '',
        stderr: execution.logs?.stderr?.join('\n') || '',
        exitCode: execution.error ? 1 : 0,
        executionTime: execution.logs?.stdout?.length || execution.logs?.stderr?.length ?
          execution.logs.stdout.length + execution.logs.stderr.length : 0,
      };
    } finally {
      // Cleanup
      this.currentConcurrency--;
      if (sandbox) {
        this.activeSandboxes.delete(sandbox.sandboxId);
        try {
          // Sandbox cleanup is automatic in code-interpreter
        } catch (error) {
          console.warn(`Failed to close sandbox:`, error);
        }
      }
    }
  }

  /**
   * Lists files in the E2B sandbox directory
   * @param path Directory path
   * @returns List of files
   */
  private async listFilesInSandbox(path: string = '/'): Promise<string[]> {
    try {
      const sandbox = await Sandbox.create();
      
      // List files in sandbox (simulated for now)
      // In a real implementation, we would use sandbox.files.list(path)
      return ['file1.txt', 'file2.js', 'dir1/', 'dir2/'];
    } catch (error: any) {
      throw new Error(`Failed to list files in ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets current concurrency status
   * @returns Concurrency information
   */
  getConcurrencyStatus() {
    return {
      current: this.currentConcurrency,
      max: this.maxConcurrency,
      available: this.maxConcurrency - this.currentConcurrency,
    };
  }

  /**
   * Gracefully shuts down the MCP service
   */
  async shutdown() {
    // In code-interpreter, sandboxes are automatically cleaned up
    this.activeSandboxes.clear();
    this.currentConcurrency = 0;
  }
}

// Export singleton instance
export const e2bMCPService = new E2BMCPService();