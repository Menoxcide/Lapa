import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExtensionContext } from 'vscode';
import * as extension from '../extension';

describe('Extension', () => {
  let mockContext: ExtensionContext;

  beforeEach(() => {
    // Mock the extension context
    mockContext = {
      subscriptions: [],
      workspaceState: {
        get: vi.fn(),
        update: vi.fn()
      },
      globalState: {
        get: vi.fn(),
        update: vi.fn()
      },
      extensionPath: '/test/path',
      asAbsolutePath: vi.fn().mockImplementation((relativePath) => `/test/path/${relativePath}`),
      storagePath: '/test/storage',
      globalStoragePath: '/test/globalStorage',
      logPath: '/test/logs'
    } as unknown as ExtensionContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should activate extension', () => {
    // Mock console.log to verify activation message
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Activate the extension
    extension.activate(mockContext);

    // Verify the activation message was logged
    expect(consoleSpy).toHaveBeenCalledWith('LAPA Swarm extension is now active!');

    // Clean up
    consoleSpy.mockRestore();
  });

  it('should deactivate extension', () => {
    // Mock console.log to verify deactivation message
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Deactivate the extension
    extension.deactivate();

    // Verify the deactivation message was logged
    expect(consoleSpy).toHaveBeenCalledWith('LAPA Swarm extension is now deactivated!');

    // Clean up
    consoleSpy.mockRestore();
  });
});