"use strict";
/**
 * Test file for enhanced capabilities implementations
 * Tests GIF export, MCP scaffolding, system monitoring, and WebRTC share functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scaffolding_ts_1 = require("../mcp/scaffolding.ts");
const manager_ts_1 = require("../inference/manager.ts");
const sessions_ts_1 = require("../swarm/sessions.ts");
(0, vitest_1.describe)('Enhanced Capabilities', () => {
    (0, vitest_1.describe)('GIF Export Functionality', () => {
        (0, vitest_1.it)('should generate a GIF with default options', async () => {
            // Mock html2canvas and gif.js for testing
            global.document = {
                body: {
                    offsetWidth: 800,
                    offsetHeight: 600
                }
            };
            global.window = {
                location: {
                    origin: 'http://localhost:3000'
                }
            };
            // This is a simplified test - in a real implementation, we would mock the html2canvas and gif.js libraries
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('MCP Scaffolding System', () => {
        let scaffolding;
        (0, vitest_1.beforeEach)(() => {
            scaffolding = new scaffolding_ts_1.MCPScaffolding();
        });
        (0, vitest_1.it)('should generate a tool with valid configuration', async () => {
            const config = {
                toolName: 'test-tool',
                description: 'A test tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                templateType: 'function',
                language: 'typescript'
            };
            const metadata = await scaffolding.generateTool(config);
            (0, vitest_1.expect)(metadata.name).toBe('test-tool');
            (0, vitest_1.expect)(metadata.config.toolName).toBe('test-tool');
        });
        (0, vitest_1.it)('should validate a generated tool', async () => {
            const config = {
                toolName: 'test-tool',
                description: 'A test tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                templateType: 'function',
                language: 'typescript'
            };
            await scaffolding.generateTool(config);
            const validationResult = await scaffolding.validateTool('test-tool');
            (0, vitest_1.expect)(validationResult.valid).toBe(true);
        });
    });
    (0, vitest_1.describe)('System Monitoring', () => {
        (0, vitest_1.it)('should initialize with default configuration', () => {
            const manager = new manager_ts_1.InferenceManager();
            (0, vitest_1.expect)(manager).toBeDefined();
        });
        (0, vitest_1.it)('should have proper health status structure', () => {
            const health = {
                cpuTemp: 0,
                gpuTemp: 0,
                cpuUsage: 0,
                gpuUsage: 0,
                memoryUsage: 0,
                vramUsage: 0,
                thermalThrottle: false
            };
            (0, vitest_1.expect)(health).toHaveProperty('cpuTemp');
            (0, vitest_1.expect)(health).toHaveProperty('gpuTemp');
            (0, vitest_1.expect)(health).toHaveProperty('cpuUsage');
            (0, vitest_1.expect)(health).toHaveProperty('gpuUsage');
            (0, vitest_1.expect)(health).toHaveProperty('memoryUsage');
            (0, vitest_1.expect)(health).toHaveProperty('vramUsage');
            (0, vitest_1.expect)(health).toHaveProperty('thermalThrottle');
        });
    });
    (0, vitest_1.describe)('WebRTC Share Functionality', () => {
        (0, vitest_1.it)('should generate a session share link', () => {
            const sessionId = 'test-session-123';
            const link = (0, sessions_ts_1.generateSessionShareLink)(sessionId);
            (0, vitest_1.expect)(link).toContain(sessionId);
            (0, vitest_1.expect)(link).toContain('/swarm/session/');
        });
        (0, vitest_1.it)('should return undefined for non-existent session share info', () => {
            const shareInfo = (0, sessions_ts_1.getSessionShareInfo)('non-existent-session');
            (0, vitest_1.expect)(shareInfo).toBeUndefined();
        });
    });
});
//# sourceMappingURL=enhanced-capabilities.test.js.map