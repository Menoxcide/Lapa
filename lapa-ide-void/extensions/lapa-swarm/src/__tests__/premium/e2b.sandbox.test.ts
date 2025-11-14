import { describe, it, expect, vi, beforeEach } from "vitest";
import { E2BSandboxIntegration } from '../../premium/e2b.sandbox.ts';

// Mock the E2B Sandbox module
const mockSandbox = {
  commands: {
    run: vi.fn()
  },
  files: {
    write: vi.fn(),
    read: vi.fn()
  },
  kill: vi.fn()
};

const mockSandboxCreate = vi.fn();

vi.mock('@e2b/code-interpreter', () => ({
  Sandbox: {
    create: mockSandboxCreate
  }
}));

describe('E2BSandboxIntegration', () => {
  let e2bIntegration: E2BSandboxIntegration;
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock behaviors
    mockSandboxCreate.mockResolvedValue(mockSandbox);
    mockSandbox.commands.run.mockResolvedValue({
      stdout: 'command output',
      stderr: '',
      exitCode: 0
    });
    mockSandbox.files.read.mockResolvedValue('file content');
    
    // Mock process.env for testing
    (global as any).process = {
      env: {
        E2B_API_KEY: 'test-api-key'
      }
    };
  });

  describe('constructor', () => {
    it('should initialize with API key from parameter', () => {
      const integration = new E2BSandboxIntegration('provided-key');
      expect((integration as any).apiKey).toBe('provided-key');
    });

    it('should initialize with API key from environment variable', () => {
      const integration = new E2BSandboxIntegration();
      expect((integration as any).apiKey).toBe('test-api-key');
    });

    it('should initialize with default template', () => {
      const integration = new E2BSandboxIntegration('test-key');
      expect((integration as any).defaultTemplate).toBe('base');
    });

    it('should initialize with custom template', () => {
      const integration = new E2BSandboxIntegration('test-key', 'custom-template');
      expect((integration as any).defaultTemplate).toBe('custom-template');
    });

    it('should throw error when no API key is provided', () => {
      // Remove the environment variable
      (global as any).process = { env: {} };
      
      expect(() => new E2BSandboxIntegration()).toThrow('E2B API key is required');
    });
  });

  describe('createSandbox', () => {
    it('should create sandbox with default template', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      expect(sandbox).toBe(mockSandbox);
      expect(mockSandboxCreate).toHaveBeenCalledWith({
        template: 'base',
        apiKey: 'test-key'
      });
    });

    it('should create sandbox with custom template', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox('custom-template');
      
      expect(sandbox).toBe(mockSandbox);
      expect(mockSandboxCreate).toHaveBeenCalledWith({
        template: 'custom-template',
        apiKey: 'test-key'
      });
    });

    it('should create sandbox with additional options', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const customOptions = { timeout: 30000, memory: 1024 };
      const sandbox = await integration.createSandbox('base', customOptions);
      
      expect(sandbox).toBe(mockSandbox);
      expect(mockSandboxCreate).toHaveBeenCalledWith({
        template: 'base',
        apiKey: 'test-key',
        timeout: 30000,
        memory: 1024
      });
    });

    it('should handle sandbox creation failure', async () => {
      const errorMessage = 'Failed to create sandbox';
      mockSandboxCreate.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      
      await expect(integration.createSandbox()).rejects.toThrow(errorMessage);
    });
  });

  describe('executeCommand', () => {
    it('should execute command successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      const result = await integration.executeCommand(sandbox, 'echo "hello world"');
      
      expect(result).toEqual({
        stdout: 'command output',
        stderr: '',
        exitCode: 0
      });
      expect(mockSandbox.commands.run).toHaveBeenCalledWith('echo "hello world"');
    });

    it('should handle command execution failure', async () => {
      const errorMessage = 'Command failed';
      mockSandbox.commands.run.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.executeCommand(sandbox, 'invalid-command')).rejects.toThrow(errorMessage);
    });
  });

  describe('uploadFile', () => {
    it('should upload string data successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await integration.uploadFile(sandbox, '/test/file.txt', 'file content');
      
      expect(mockSandbox.files.write).toHaveBeenCalledWith('/test/file.txt', 'file content');
    });

    it('should upload buffer data successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      const bufferData = Buffer.from('binary content');
      
      await integration.uploadFile(sandbox, '/test/file.bin', bufferData);
      
      expect(mockSandbox.files.write).toHaveBeenCalledWith('/test/file.bin', 'binary content');
    });

    it('should handle file upload failure', async () => {
      const errorMessage = 'Upload failed';
      mockSandbox.files.write.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.uploadFile(sandbox, '/test/file.txt', 'content')).rejects.toThrow(errorMessage);
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      const content = await integration.downloadFile(sandbox, '/test/file.txt');
      
      expect(content).toBe('file content');
      expect(mockSandbox.files.read).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should handle file download failure', async () => {
      const errorMessage = 'Download failed';
      mockSandbox.files.read.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.downloadFile(sandbox, '/test/file.txt')).rejects.toThrow(errorMessage);
    });
  });

  describe('installPackages', () => {
    it('should install npm packages successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      const result = await integration.installPackages(sandbox, ['lodash', 'axios']);
      
      expect(result).toEqual({
        stdout: 'command output',
        stderr: '',
        exitCode: 0
      });
      expect(mockSandbox.commands.run).toHaveBeenCalledWith('npm install lodash axios');
    });

    it('should install pip packages successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      const result = await integration.installPackages(sandbox, ['numpy', 'pandas'], 'pip');
      
      expect(result).toEqual({
        stdout: 'command output',
        stderr: '',
        exitCode: 0
      });
      expect(mockSandbox.commands.run).toHaveBeenCalledWith('pip install numpy pandas');
    });

    it('should install apt packages successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      const result = await integration.installPackages(sandbox, ['curl', 'wget'], 'apt');
      
      expect(result).toEqual({
        stdout: 'command output',
        stderr: '',
        exitCode: 0
      });
      expect(mockSandbox.commands.run).toHaveBeenCalledWith('apt-get update && apt-get install -y curl wget');
    });

    it('should handle unsupported package manager', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.installPackages(sandbox, ['package'], 'unsupported' as any))
        .rejects.toThrow('Unsupported package manager: unsupported');
    });

    it('should handle package installation failure', async () => {
      const errorMessage = 'Installation failed';
      mockSandbox.commands.run.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.installPackages(sandbox, ['lodash'])).rejects.toThrow(errorMessage);
    });
  });

  describe('closeSandbox', () => {
    it('should close sandbox successfully', async () => {
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await integration.closeSandbox(sandbox);
      
      expect(mockSandbox.kill).toHaveBeenCalled();
    });

    it('should handle sandbox closing failure', async () => {
      const errorMessage = 'Close failed';
      mockSandbox.kill.mockRejectedValue(new Error(errorMessage));
      
      const integration = new E2BSandboxIntegration('test-key');
      const sandbox = await integration.createSandbox();
      
      await expect(integration.closeSandbox(sandbox)).rejects.toThrow(errorMessage);
    });
  });
});