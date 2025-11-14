"use strict";
/**
 * E2B MCP Tests for Premium Features
 *
 * This file contains tests for the E2B MCP server implementation,
 * including sandbox execution, file operations, and concurrency management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const e2b_mcp_ts_1 = require("../../sandbox/e2b-mcp.ts");
const vitest_2 = require("vitest");
// Mock E2B SDK
vitest_2.vi.mock('@e2b/sdk', () => {
    const mockProcess = {
        wait: vitest_2.vi.fn().mockResolvedValue({
            stdout: 'Mock output',
            stderr: '',
            exitCode: 0
        })
    };
    const mockSandbox = {
        id: 'mock-sandbox-id',
        process: {
            start: vitest_2.vi.fn().mockResolvedValue(mockProcess)
        },
        files: {
            write: vitest_2.vi.fn().mockResolvedValue(undefined),
            read: vitest_2.vi.fn().mockResolvedValue('Mock file content')
        },
        close: vitest_2.vi.fn().mockResolvedValue(undefined)
    };
    return {
        Sandbox: {
            create: vitest_2.vi.fn().mockResolvedValue(mockSandbox)
        }
    };
});
// Mock MCP server
vitest_2.vi.mock('@e2b/mcp-server', () => {
    return {
        McpServer: vitest_2.vi.fn().mockImplementation(() => {
            return {
                tool: vitest_2.vi.fn(),
            };
        }),
        StreamableHttpTransport: vitest_2.vi.fn().mockImplementation(() => {
            return {
                bind: vitest_2.vi.fn().mockReturnValue(vitest_2.vi.fn()),
            };
        }),
    };
});
(0, vitest_1.describe)('E2B MCP Service - Premium Features', () => {
    let e2bService;
    beforeEach(() => {
        // Use mock API key for testing
        e2bService = new e2b_mcp_ts_1.E2BMCPService({ e2bApiKey: 'test-key' });
    });
    afterEach(() => {
        // Clear all mocks
    });
    (0, vitest_1.describe)('Service Initialization', () => {
        (0, vitest_1.it)('should initialize with default configuration', () => {
            const service = new e2b_mcp_ts_1.E2BMCPService({ e2bApiKey: 'test-key' });
            (0, vitest_1.expect)(service).toBeDefined();
        });
        (0, vitest_1.it)('should throw error if API key is missing', () => {
            (0, vitest_1.expect)(() => {
                new e2b_mcp_ts_1.E2BMCPService();
            }).toThrow('E2B API key is required for MCP service');
        });
        (0, vitest_1.it)('should allow custom configuration', () => {
            const config = {
                e2bApiKey: 'test-key',
                defaultTemplate: 'python',
                maxConcurrency: 20,
                timeoutMs: 60000
            };
            const service = new e2b_mcp_ts_1.E2BMCPService(config);
            (0, vitest_1.expect)(service).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Code Execution', () => {
        (0, vitest_1.it)('should execute JavaScript code in sandbox', async () => {
            const code = 'console.log("Hello, World!");';
            const result = await e2bService.executeCodeInSandbox(code, 'javascript');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should execute Python code in sandbox', async () => {
            const code = 'print("Hello, World!")';
            const result = await e2bService.executeCodeInSandbox(code, 'python');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should execute Bash code in sandbox', async () => {
            const code = 'echo "Hello, World!"';
            const result = await e2bService.executeCodeInSandbox(code, 'bash');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should reject unsupported languages', async () => {
            const code = 'print "Hello"';
            await (0, vitest_1.expect)(e2bService.executeCodeInSandbox(code, 'ruby'))
                .rejects
                .toThrow('Unsupported language: ruby');
        });
        (0, vitest_1.it)('should respect execution timeout', async () => {
            const code = 'console.log("Hello, World!");';
            const timeout = 5000;
            const startTime = Date.now();
            const result = await e2bService.executeCodeInSandbox(code, 'javascript', timeout);
            const endTime = Date.now();
            (0, vitest_1.expect)(result.executionTime).toBeLessThanOrEqual(timeout + 1000); // Allow some buffer
        });
    });
    (0, vitest_1.describe)('File Operations', () => {
        (0, vitest_1.it)('should create a file in sandbox', async () => {
            const path = '/test/file.txt';
            const content = 'Test content';
            const result = await e2bService.createFileInSandbox(path, content);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.path).toBe(path);
        });
        (0, vitest_1.it)('should read a file from sandbox', async () => {
            const path = '/test/file.txt';
            const content = await e2bService.readFileFromSandbox(path);
            (0, vitest_1.expect)(content).toBeDefined();
            (0, vitest_1.expect)(typeof content).toBe('string');
        });
        (0, vitest_1.it)('should handle file operation errors', async () => {
            // Mock file read error
            const mockSdk = require('@e2b/sdk');
            mockSdk.Sandbox.create.mockImplementationOnce(() => {
                return {
                    id: 'mock-sandbox-id',
                    files: {
                        read: vitest_2.vi.fn().mockRejectedValue(new Error('File not found'))
                    },
                    close: vitest_2.vi.fn().mockResolvedValue(undefined)
                };
            });
            const serviceWithError = new e2b_mcp_ts_1.E2BMCPService({ e2bApiKey: 'test-key' });
            await (0, vitest_1.expect)(serviceWithError.readFileFromSandbox('/nonexistent/file.txt'))
                .rejects
                .toThrow('Failed to read file /nonexistent/file.txt: File not found');
        });
    });
    (0, vitest_1.describe)('Package Management', () => {
        (0, vitest_1.it)('should install npm packages', async () => {
            const packages = ['lodash', 'express'];
            const result = await e2bService.installPackagesInSandbox(packages, 'npm');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should install pip packages', async () => {
            const packages = ['numpy', 'pandas'];
            const result = await e2bService.installPackagesInSandbox(packages, 'pip');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should install apt packages', async () => {
            const packages = ['curl', 'wget'];
            const result = await e2bService.installPackagesInSandbox(packages, 'apt');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            (0, vitest_1.expect)(typeof result.stderr).toBe('string');
            (0, vitest_1.expect)(typeof result.exitCode).toBe('number');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should reject unsupported package managers', async () => {
            const packages = ['test-package'];
            await (0, vitest_1.expect)(e2bService.installPackagesInSandbox(packages, 'brew'))
                .rejects
                .toThrow('Unsupported package manager: brew');
        });
    });
    (0, vitest_1.describe)('File Listing', () => {
        (0, vitest_1.it)('should list files in sandbox directory', async () => {
            const files = await e2bService.listFilesInSandbox('/');
            (0, vitest_1.expect)(files).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(files)).toBe(true);
            (0, vitest_1.expect)(files.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle file listing errors', async () => {
            // Mock file listing error
            const mockSdk = require('@e2b/sdk');
            mockSdk.Sandbox.create.mockImplementationOnce(() => {
                return {
                    id: 'mock-sandbox-id',
                    files: {
                        read: vitest_2.vi.fn().mockRejectedValue(new Error('Permission denied'))
                    },
                    close: vitest_2.vi.fn().mockResolvedValue(undefined)
                };
            });
            const serviceWithError = new e2b_mcp_ts_1.E2BMCPService({ e2bApiKey: 'test-key' });
            await (0, vitest_1.expect)(serviceWithError.listFilesInSandbox('/restricted'))
                .rejects
                .toThrow('Failed to list files in /restricted: Permission denied');
        });
    });
    (0, vitest_1.describe)('Concurrency Management', () => {
        (0, vitest_1.it)('should track concurrency status', () => {
            const status = e2bService.getConcurrencyStatus();
            (0, vitest_1.expect)(status).toBeDefined();
            (0, vitest_1.expect)(typeof status.current).toBe('number');
            (0, vitest_1.expect)(typeof status.max).toBe('number');
            (0, vitest_1.expect)(typeof status.available).toBe('number');
            (0, vitest_1.expect)(status.current).toBe(0);
            (0, vitest_1.expect)(status.max).toBe(10); // Default value
            (0, vitest_1.expect)(status.available).toBe(10);
        });
        (0, vitest_1.it)('should enforce maximum concurrency limit', async () => {
            // Create service with low concurrency limit
            const lowConcurrencyService = new e2b_mcp_ts_1.E2BMCPService({
                e2bApiKey: 'test-key',
                maxConcurrency: 1
            });
            // Start first execution
            const execPromise1 = lowConcurrencyService.executeCodeInSandbox('console.log("First");', 'javascript');
            // Try to start second execution while first is still running
            await (0, vitest_1.expect)(lowConcurrencyService.executeCodeInSandbox('console.log("Second");', 'javascript')).rejects.toThrow('Maximum concurrency limit reached (1)');
            // Wait for first execution to complete
            await execPromise1;
        });
    });
    (0, vitest_1.describe)('MCP Tool Registration', () => {
        (0, vitest_1.it)('should register executeCode tool', () => {
            const McpServer = require('@e2b/mcp-server').McpServer;
            const mockMcp = McpServer.mock.instances[0];
            (0, vitest_1.expect)(mockMcp.tool).toHaveBeenCalledWith('executeCode', vitest_1.expect.objectContaining({
                description: 'Execute code securely in an E2B sandbox environment'
            }));
        });
        (0, vitest_1.it)('should register createFile tool', () => {
            const McpServer = require('@e2b/mcp-server').McpServer;
            const mockMcp = McpServer.mock.instances[0];
            (0, vitest_1.expect)(mockMcp.tool).toHaveBeenCalledWith('createFile', vitest_1.expect.objectContaining({
                description: 'Create a file in the E2B sandbox'
            }));
        });
        (0, vitest_1.it)('should register readFile tool', () => {
            const McpServer = require('@e2b/mcp-server').McpServer;
            const mockMcp = McpServer.mock.instances[0];
            (0, vitest_1.expect)(mockMcp.tool).toHaveBeenCalledWith('readFile', vitest_1.expect.objectContaining({
                description: 'Read a file from the E2B sandbox'
            }));
        });
        (0, vitest_1.it)('should register installPackages tool', () => {
            const McpServer = require('@e2b/mcp-server').McpServer;
            const mockMcp = McpServer.mock.instances[0];
            (0, vitest_1.expect)(mockMcp.tool).toHaveBeenCalledWith('installPackages', vitest_1.expect.objectContaining({
                description: 'Install packages in the E2B sandbox'
            }));
        });
        (0, vitest_1.it)('should register listFiles tool', () => {
            const McpServer = require('@e2b/mcp-server').McpServer;
            const mockMcp = McpServer.mock.instances[0];
            (0, vitest_1.expect)(mockMcp.tool).toHaveBeenCalledWith('listFiles', vitest_1.expect.objectContaining({
                description: 'List files in the E2B sandbox directory'
            }));
        });
    });
    (0, vitest_1.describe)('HTTP Handler', () => {
        (0, vitest_1.it)('should provide HTTP handler for MCP server', () => {
            const handler = e2bService.getHttpHandler();
            (0, vitest_1.expect)(handler).toBeDefined();
            (0, vitest_1.expect)(typeof handler).toBe('function');
        });
    });
    (0, vitest_1.describe)('Service Shutdown', () => {
        (0, vitest_1.it)('should gracefully shutdown and close all sandboxes', async () => {
            // Create a few sandboxes
            await e2bService.executeCodeInSandbox('console.log("Test 1");', 'javascript');
            await e2bService.executeCodeInSandbox('console.log("Test 2");', 'javascript');
            // Check that we have active sandboxes
            (0, vitest_1.expect)(e2bService.activeSandboxes.size).toBeGreaterThan(0);
            // Shutdown service
            await e2bService.shutdown();
            // Check that all sandboxes are closed
            (0, vitest_1.expect)(e2bService.activeSandboxes.size).toBe(0);
            (0, vitest_1.expect)(e2bService.currentConcurrency).toBe(0);
        });
    });
    (0, vitest_1.describe)('Premium Scaling Requirements', () => {
        (0, vitest_1.it)('should support 10+ concurrent premium sandboxes', async () => {
            // Create service with high concurrency limit
            const highConcurrencyService = new e2b_mcp_ts_1.E2BMCPService({
                e2bApiKey: 'test-key',
                maxConcurrency: 15
            });
            // Start multiple concurrent executions
            const promises = [];
            for (let i = 0; i < 12; i++) {
                promises.push(highConcurrencyService.executeCodeInSandbox(`console.log("Concurrent test ${i}");`, 'javascript'));
            }
            // Wait for all to complete
            const results = await Promise.all(promises);
            (0, vitest_1.expect)(results).toHaveLength(12);
            results.forEach(result => {
                (0, vitest_1.expect)(result).toBeDefined();
                (0, vitest_1.expect)(typeof result.stdout).toBe('string');
            });
        });
        (0, vitest_1.it)('should maintain performance under load', async () => {
            // Measure execution time for multiple concurrent operations
            const startTime = Date.now();
            const promises = [];
            for (let i = 0; i < 8; i++) {
                promises.push(e2bService.executeCodeInSandbox(`console.log("Load test ${i}");`, 'javascript'));
            }
            await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // Should complete within reasonable time (less than 10 seconds for 8 operations)
            (0, vitest_1.expect)(totalTime).toBeLessThan(10000);
        });
    });
});
//# sourceMappingURL=e2b.spec.js.map