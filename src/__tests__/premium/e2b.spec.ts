/**
 * E2B MCP Tests for Premium Features
 * 
 * This file contains tests for the E2B MCP server implementation,
 * including sandbox execution, file operations, and concurrency management.
 */

import { describe, it, expect } from "vitest";
import { E2BMCPService, ExecutionResult, FileOperationResult } from '../../sandbox/e2b-mcp.ts';
import { vi } from 'vitest';

// Mock E2B SDK
vi.mock('@e2b/sdk', () => {
  const mockProcess = {
    wait: vi.fn().mockResolvedValue({
      stdout: 'Mock output',
      stderr: '',
      exitCode: 0
    })
  };

  const mockSandbox = {
    id: 'mock-sandbox-id',
    process: {
      start: vi.fn().mockResolvedValue(mockProcess)
    },
    files: {
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue('Mock file content')
    },
    close: vi.fn().mockResolvedValue(undefined)
  };

  return {
    Sandbox: {
      create: vi.fn().mockResolvedValue(mockSandbox)
    }
  };
});

// Mock MCP server
vi.mock('@e2b/mcp-server', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => {
      return {
        tool: vi.fn(),
      };
    }),
    StreamableHttpTransport: vi.fn().mockImplementation(() => {
      return {
        bind: vi.fn().mockReturnValue(vi.fn()),
      };
    }),
  };
});

describe('E2B MCP Service - Premium Features', () => {
  let e2bService: E2BMCPService;

  beforeEach(() => {
    // Use mock API key for testing
    e2bService = new E2BMCPService({ e2bApiKey: 'test-key' });
  });

  afterEach(() => {
    // Clear all mocks
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new E2BMCPService({ e2bApiKey: 'test-key' });
      
      expect(service).toBeDefined();
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new E2BMCPService();
      }).toThrow('E2B API key is required for MCP service');
    });

    it('should allow custom configuration', () => {
      const config = {
        e2bApiKey: 'test-key',
        defaultTemplate: 'python',
        maxConcurrency: 20,
        timeoutMs: 60000
      };
      
      const service = new E2BMCPService(config);
      
      expect(service).toBeDefined();
    });
  });

  describe('Code Execution', () => {
    it('should execute JavaScript code in sandbox', async () => {
      const code = 'console.log("Hello, World!");';
      const result: ExecutionResult = await (e2bService as any).executeCodeInSandbox(code, 'javascript');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute Python code in sandbox', async () => {
      const code = 'print("Hello, World!")';
      const result: ExecutionResult = await (e2bService as any).executeCodeInSandbox(code, 'python');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute Bash code in sandbox', async () => {
      const code = 'echo "Hello, World!"';
      const result: ExecutionResult = await (e2bService as any).executeCodeInSandbox(code, 'bash');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should reject unsupported languages', async () => {
      const code = 'print "Hello"';
      
      await expect((e2bService as any).executeCodeInSandbox(code, 'ruby'))
        .rejects
        .toThrow('Unsupported language: ruby');
    });

    it('should respect execution timeout', async () => {
      const code = 'console.log("Hello, World!");';
      const timeout = 5000;
      
      const startTime = Date.now();
      const result: ExecutionResult = await (e2bService as any).executeCodeInSandbox(code, 'javascript', timeout);
      const endTime = Date.now();
      
      expect(result.executionTime).toBeLessThanOrEqual(timeout + 1000); // Allow some buffer
    });
  });

  describe('File Operations', () => {
    it('should create a file in sandbox', async () => {
      const path = '/test/file.txt';
      const content = 'Test content';
      
      const result: FileOperationResult = await (e2bService as any).createFileInSandbox(path, content);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.path).toBe(path);
    });

    it('should read a file from sandbox', async () => {
      const path = '/test/file.txt';
      
      const content = await (e2bService as any).readFileFromSandbox(path);
      
      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
    });

    it('should handle file operation errors', async () => {
      // Mock file read error
      const mockSdk = require('@e2b/sdk');
      mockSdk.Sandbox.create.mockImplementationOnce(() => {
        return {
          id: 'mock-sandbox-id',
          files: {
            read: vi.fn().mockRejectedValue(new Error('File not found'))
          },
          close: vi.fn().mockResolvedValue(undefined)
        };
      });
      
      const serviceWithError = new E2BMCPService({ e2bApiKey: 'test-key' });
      
      await expect((serviceWithError as any).readFileFromSandbox('/nonexistent/file.txt'))
        .rejects
        .toThrow('Failed to read file /nonexistent/file.txt: File not found');
    });
  });

  describe('Package Management', () => {
    it('should install npm packages', async () => {
      const packages = ['lodash', 'express'];
      
      const result: ExecutionResult = await (e2bService as any).installPackagesInSandbox(packages, 'npm');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should install pip packages', async () => {
      const packages = ['numpy', 'pandas'];
      
      const result: ExecutionResult = await (e2bService as any).installPackagesInSandbox(packages, 'pip');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should install apt packages', async () => {
      const packages = ['curl', 'wget'];
      
      const result: ExecutionResult = await (e2bService as any).installPackagesInSandbox(packages, 'apt');
      
      expect(result).toBeDefined();
      expect(typeof result.stdout).toBe('string');
      expect(typeof result.stderr).toBe('string');
      expect(typeof result.exitCode).toBe('number');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should reject unsupported package managers', async () => {
      const packages = ['test-package'];
      
      await expect((e2bService as any).installPackagesInSandbox(packages, 'brew'))
        .rejects
        .toThrow('Unsupported package manager: brew');
    });
  });

  describe('File Listing', () => {
    it('should list files in sandbox directory', async () => {
      const files = await (e2bService as any).listFilesInSandbox('/');
      
      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should handle file listing errors', async () => {
      // Mock file listing error
      const mockSdk = require('@e2b/sdk');
      mockSdk.Sandbox.create.mockImplementationOnce(() => {
        return {
          id: 'mock-sandbox-id',
          files: {
            read: vi.fn().mockRejectedValue(new Error('Permission denied'))
          },
          close: vi.fn().mockResolvedValue(undefined)
        };
      });
      
      const serviceWithError = new E2BMCPService({ e2bApiKey: 'test-key' });
      
      await expect((serviceWithError as any).listFilesInSandbox('/restricted'))
        .rejects
        .toThrow('Failed to list files in /restricted: Permission denied');
    });
  });

  describe('Concurrency Management', () => {
    it('should track concurrency status', () => {
      const status = e2bService.getConcurrencyStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.current).toBe('number');
      expect(typeof status.max).toBe('number');
      expect(typeof status.available).toBe('number');
      expect(status.current).toBe(0);
      expect(status.max).toBe(10); // Default value
      expect(status.available).toBe(10);
    });

    it('should enforce maximum concurrency limit', async () => {
      // Create service with low concurrency limit
      const lowConcurrencyService = new E2BMCPService({ 
        e2bApiKey: 'test-key',
        maxConcurrency: 1
      });
      
      // Start first execution
      const execPromise1 = (lowConcurrencyService as any).executeCodeInSandbox(
        'console.log("First");', 
        'javascript'
      );
      
      // Try to start second execution while first is still running
      await expect((lowConcurrencyService as any).executeCodeInSandbox(
        'console.log("Second");', 
        'javascript'
      )).rejects.toThrow('Maximum concurrency limit reached (1)');
      
      // Wait for first execution to complete
      await execPromise1;
    });
  });

  describe('MCP Tool Registration', () => {
    it('should register executeCode tool', () => {
      const McpServer = require('@e2b/mcp-server').McpServer;
      const mockMcp = McpServer.mock.instances[0];
      
      expect(mockMcp.tool).toHaveBeenCalledWith(
        'executeCode',
        expect.objectContaining({
          description: 'Execute code securely in an E2B sandbox environment'
        })
      );
    });

    it('should register createFile tool', () => {
      const McpServer = require('@e2b/mcp-server').McpServer;
      const mockMcp = McpServer.mock.instances[0];
      
      expect(mockMcp.tool).toHaveBeenCalledWith(
        'createFile',
        expect.objectContaining({
          description: 'Create a file in the E2B sandbox'
        })
      );
    });

    it('should register readFile tool', () => {
      const McpServer = require('@e2b/mcp-server').McpServer;
      const mockMcp = McpServer.mock.instances[0];
      
      expect(mockMcp.tool).toHaveBeenCalledWith(
        'readFile',
        expect.objectContaining({
          description: 'Read a file from the E2B sandbox'
        })
      );
    });

    it('should register installPackages tool', () => {
      const McpServer = require('@e2b/mcp-server').McpServer;
      const mockMcp = McpServer.mock.instances[0];
      
      expect(mockMcp.tool).toHaveBeenCalledWith(
        'installPackages',
        expect.objectContaining({
          description: 'Install packages in the E2B sandbox'
        })
      );
    });

    it('should register listFiles tool', () => {
      const McpServer = require('@e2b/mcp-server').McpServer;
      const mockMcp = McpServer.mock.instances[0];
      
      expect(mockMcp.tool).toHaveBeenCalledWith(
        'listFiles',
        expect.objectContaining({
          description: 'List files in the E2B sandbox directory'
        })
      );
    });
  });

  describe('HTTP Handler', () => {
    it('should provide HTTP handler for MCP server', () => {
      const handler = e2bService.getHttpHandler();
      
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });
  });

  describe('Service Shutdown', () => {
    it('should gracefully shutdown and close all sandboxes', async () => {
      // Create a few sandboxes
      await (e2bService as any).executeCodeInSandbox('console.log("Test 1");', 'javascript');
      await (e2bService as any).executeCodeInSandbox('console.log("Test 2");', 'javascript');
      
      // Check that we have active sandboxes
      expect((e2bService as any).activeSandboxes.size).toBeGreaterThan(0);
      
      // Shutdown service
      await e2bService.shutdown();
      
      // Check that all sandboxes are closed
      expect((e2bService as any).activeSandboxes.size).toBe(0);
      expect((e2bService as any).currentConcurrency).toBe(0);
    });
  });

  describe('Premium Scaling Requirements', () => {
    it('should support 10+ concurrent premium sandboxes', async () => {
      // Create service with high concurrency limit
      const highConcurrencyService = new E2BMCPService({ 
        e2bApiKey: 'test-key',
        maxConcurrency: 15
      });
      
      // Start multiple concurrent executions
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          (highConcurrencyService as any).executeCodeInSandbox(
            `console.log("Concurrent test ${i}");`, 
            'javascript'
          )
        );
      }
      
      // Wait for all to complete
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(12);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.stdout).toBe('string');
      });
    });

    it('should maintain performance under load', async () => {
      // Measure execution time for multiple concurrent operations
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 8; i++) {
        promises.push(
          (e2bService as any).executeCodeInSandbox(
            `console.log("Load test ${i}");`, 
            'javascript'
          )
        );
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 10 seconds for 8 operations)
      expect(totalTime).toBeLessThan(10000);
    });
  });
});