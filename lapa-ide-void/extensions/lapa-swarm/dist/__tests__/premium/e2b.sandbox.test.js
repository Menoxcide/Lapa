"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const e2b_sandbox_ts_1 = require("../../premium/e2b.sandbox.ts");
// Mock the E2B Sandbox module
const mockSandbox = {
    commands: {
        run: vitest_1.vi.fn()
    },
    files: {
        write: vitest_1.vi.fn(),
        read: vitest_1.vi.fn()
    },
    kill: vitest_1.vi.fn()
};
const mockSandboxCreate = vitest_1.vi.fn();
vitest_1.vi.mock('@e2b/code-interpreter', () => ({
    Sandbox: {
        create: mockSandboxCreate
    }
}));
(0, vitest_1.describe)('E2BSandboxIntegration', () => {
    let e2bIntegration;
    (0, vitest_1.beforeEach)(() => {
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
        // Setup default mock behaviors
        mockSandboxCreate.mockResolvedValue(mockSandbox);
        mockSandbox.commands.run.mockResolvedValue({
            stdout: 'command output',
            stderr: '',
            exitCode: 0
        });
        mockSandbox.files.read.mockResolvedValue('file content');
        // Mock process.env for testing
        global.process = {
            env: {
                E2B_API_KEY: 'test-api-key'
            }
        };
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with API key from parameter', () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('provided-key');
            (0, vitest_1.expect)(integration.apiKey).toBe('provided-key');
        });
        (0, vitest_1.it)('should initialize with API key from environment variable', () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration();
            (0, vitest_1.expect)(integration.apiKey).toBe('test-api-key');
        });
        (0, vitest_1.it)('should initialize with default template', () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            (0, vitest_1.expect)(integration.defaultTemplate).toBe('base');
        });
        (0, vitest_1.it)('should initialize with custom template', () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key', 'custom-template');
            (0, vitest_1.expect)(integration.defaultTemplate).toBe('custom-template');
        });
        (0, vitest_1.it)('should throw error when no API key is provided', () => {
            // Remove the environment variable
            global.process = { env: {} };
            (0, vitest_1.expect)(() => new e2b_sandbox_ts_1.E2BSandboxIntegration()).toThrow('E2B API key is required');
        });
    });
    (0, vitest_1.describe)('createSandbox', () => {
        (0, vitest_1.it)('should create sandbox with default template', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            (0, vitest_1.expect)(sandbox).toBe(mockSandbox);
            (0, vitest_1.expect)(mockSandboxCreate).toHaveBeenCalledWith({
                template: 'base',
                apiKey: 'test-key'
            });
        });
        (0, vitest_1.it)('should create sandbox with custom template', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox('custom-template');
            (0, vitest_1.expect)(sandbox).toBe(mockSandbox);
            (0, vitest_1.expect)(mockSandboxCreate).toHaveBeenCalledWith({
                template: 'custom-template',
                apiKey: 'test-key'
            });
        });
        (0, vitest_1.it)('should create sandbox with additional options', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const customOptions = { timeout: 30000, memory: 1024 };
            const sandbox = await integration.createSandbox('base', customOptions);
            (0, vitest_1.expect)(sandbox).toBe(mockSandbox);
            (0, vitest_1.expect)(mockSandboxCreate).toHaveBeenCalledWith({
                template: 'base',
                apiKey: 'test-key',
                timeout: 30000,
                memory: 1024
            });
        });
        (0, vitest_1.it)('should handle sandbox creation failure', async () => {
            const errorMessage = 'Failed to create sandbox';
            mockSandboxCreate.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            await (0, vitest_1.expect)(integration.createSandbox()).rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('executeCommand', () => {
        (0, vitest_1.it)('should execute command successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const result = await integration.executeCommand(sandbox, 'echo "hello world"');
            (0, vitest_1.expect)(result).toEqual({
                stdout: 'command output',
                stderr: '',
                exitCode: 0
            });
            (0, vitest_1.expect)(mockSandbox.commands.run).toHaveBeenCalledWith('echo "hello world"');
        });
        (0, vitest_1.it)('should handle command execution failure', async () => {
            const errorMessage = 'Command failed';
            mockSandbox.commands.run.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.executeCommand(sandbox, 'invalid-command')).rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('uploadFile', () => {
        (0, vitest_1.it)('should upload string data successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await integration.uploadFile(sandbox, '/test/file.txt', 'file content');
            (0, vitest_1.expect)(mockSandbox.files.write).toHaveBeenCalledWith('/test/file.txt', 'file content');
        });
        (0, vitest_1.it)('should upload buffer data successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const bufferData = Buffer.from('binary content');
            await integration.uploadFile(sandbox, '/test/file.bin', bufferData);
            (0, vitest_1.expect)(mockSandbox.files.write).toHaveBeenCalledWith('/test/file.bin', 'binary content');
        });
        (0, vitest_1.it)('should handle file upload failure', async () => {
            const errorMessage = 'Upload failed';
            mockSandbox.files.write.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.uploadFile(sandbox, '/test/file.txt', 'content')).rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('downloadFile', () => {
        (0, vitest_1.it)('should download file successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const content = await integration.downloadFile(sandbox, '/test/file.txt');
            (0, vitest_1.expect)(content).toBe('file content');
            (0, vitest_1.expect)(mockSandbox.files.read).toHaveBeenCalledWith('/test/file.txt');
        });
        (0, vitest_1.it)('should handle file download failure', async () => {
            const errorMessage = 'Download failed';
            mockSandbox.files.read.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.downloadFile(sandbox, '/test/file.txt')).rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('installPackages', () => {
        (0, vitest_1.it)('should install npm packages successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const result = await integration.installPackages(sandbox, ['lodash', 'axios']);
            (0, vitest_1.expect)(result).toEqual({
                stdout: 'command output',
                stderr: '',
                exitCode: 0
            });
            (0, vitest_1.expect)(mockSandbox.commands.run).toHaveBeenCalledWith('npm install lodash axios');
        });
        (0, vitest_1.it)('should install pip packages successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const result = await integration.installPackages(sandbox, ['numpy', 'pandas'], 'pip');
            (0, vitest_1.expect)(result).toEqual({
                stdout: 'command output',
                stderr: '',
                exitCode: 0
            });
            (0, vitest_1.expect)(mockSandbox.commands.run).toHaveBeenCalledWith('pip install numpy pandas');
        });
        (0, vitest_1.it)('should install apt packages successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            const result = await integration.installPackages(sandbox, ['curl', 'wget'], 'apt');
            (0, vitest_1.expect)(result).toEqual({
                stdout: 'command output',
                stderr: '',
                exitCode: 0
            });
            (0, vitest_1.expect)(mockSandbox.commands.run).toHaveBeenCalledWith('apt-get update && apt-get install -y curl wget');
        });
        (0, vitest_1.it)('should handle unsupported package manager', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.installPackages(sandbox, ['package'], 'unsupported'))
                .rejects.toThrow('Unsupported package manager: unsupported');
        });
        (0, vitest_1.it)('should handle package installation failure', async () => {
            const errorMessage = 'Installation failed';
            mockSandbox.commands.run.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.installPackages(sandbox, ['lodash'])).rejects.toThrow(errorMessage);
        });
    });
    (0, vitest_1.describe)('closeSandbox', () => {
        (0, vitest_1.it)('should close sandbox successfully', async () => {
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await integration.closeSandbox(sandbox);
            (0, vitest_1.expect)(mockSandbox.kill).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle sandbox closing failure', async () => {
            const errorMessage = 'Close failed';
            mockSandbox.kill.mockRejectedValue(new Error(errorMessage));
            const integration = new e2b_sandbox_ts_1.E2BSandboxIntegration('test-key');
            const sandbox = await integration.createSandbox();
            await (0, vitest_1.expect)(integration.closeSandbox(sandbox)).rejects.toThrow(errorMessage);
        });
    });
});
//# sourceMappingURL=e2b.sandbox.test.js.map