import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitWorktreeManager, WorktreeOptions, WorktreeResult } from '../../swarm/worktree.isolation.ts';
import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

// Mock child_process.exec
const mockExec = vi.fn();
vi.mock('child_process', () => ({
  exec: mockExec
}));

// Mock fs functions
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn()
}));

// Promisify mock for exec
const mockExecPromise = (stdout: string = '', stderr: string = '') => {
  return Promise.resolve({ stdout, stderr });
};

describe('GitWorktreeManager', () => {
  let worktreeManager: GitWorktreeManager;

  beforeEach(() => {
    worktreeManager = new GitWorktreeManager('/test/worktrees');
    
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock behaviors
    (existsSync as vi.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    // Clear the worktrees map after each test
    (worktreeManager as any).worktrees.clear();
  });

  describe('constructor', () => {
    it('should create worktree manager with default path', () => {
      (existsSync as vi.Mock).mockReturnValue(false);
      const defaultManager = new GitWorktreeManager();
      
      expect(existsSync).toHaveBeenCalledWith('.lapa/worktrees');
      expect(mkdirSync).toHaveBeenCalledWith('.lapa/worktrees', { recursive: true });
    });

    it('should create worktree manager with custom path', () => {
      (existsSync as vi.Mock).mockReturnValue(false);
      const customManager = new GitWorktreeManager('/custom/path');
      
      expect(existsSync).toHaveBeenCalledWith('/custom/path');
      expect(mkdirSync).toHaveBeenCalledWith('/custom/path', { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      (existsSync as vi.Mock).mockReturnValue(true);
      const manager = new GitWorktreeManager('/existing/path');
      
      expect(existsSync).toHaveBeenCalledWith('/existing/path');
      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('createWorktree', () => {
    it('should successfully create a worktree with default branch', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1');
      
      expect(result.success).toBe(true);
      expect(result.worktreeId).toBeDefined();
      expect(result.path).toContain('/test/worktrees/wt-agent-1-');
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/git worktree add ".*" -b worktree\/wt-agent-1-/),
        expect.any(Function)
      );
    });

    it('should create worktree with specified branch', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const options: WorktreeOptions = { branch: 'feature-branch' };
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1', options);
      
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/git worktree add ".*" feature-branch/),
        expect.any(Function)
      );
    });

    it('should create worktree with specified commit', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const options: WorktreeOptions = { commit: 'abc123' };
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1', options);
      
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/git worktree add ".*" abc123/),
        expect.any(Function)
      );
    });

    it('should create worktree with force option', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const options: WorktreeOptions = { force: true };
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1', options);
      
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/git worktree add ".*" -b worktree\/wt-agent-1-.* --force/),
        expect.any(Function)
      );
    });

    it('should handle git worktree creation failure', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(new Error('Git command failed'), { stdout: '', stderr: 'Permission denied' });
      });
      
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Git command failed');
    });

    it('should handle stderr with preparation message as success', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Worktree created', stderr: 'Preparing worktree' });
      });
      
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1');
      
      expect(result.success).toBe(true);
      expect(result.details).toBe('Worktree created');
    });

    it('should register worktree in internal registry', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const result: WorktreeResult = await worktreeManager.createWorktree('agent-1');
      const worktree = worktreeManager.getWorktree(result.worktreeId!);
      
      expect(worktree).toBeDefined();
      expect(worktree?.id).toBe(result.worktreeId);
      expect(worktree?.agentId).toBe('agent-1');
      expect(worktree?.status).toBe('active');
      expect(worktree?.createdAt).toBeInstanceOf(Date);
      expect(worktree?.lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('getWorktree', () => {
    it('should retrieve worktree by ID', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const worktree = worktreeManager.getWorktree(createResult.worktreeId!);
      
      expect(worktree).toBeDefined();
      expect(worktree?.id).toBe(createResult.worktreeId);
    });

    it('should return undefined for non-existent worktree', () => {
      const worktree = worktreeManager.getWorktree('non-existent-id');
      expect(worktree).toBeUndefined();
    });
  });

  describe('getAgentWorktrees', () => {
    it('should retrieve all worktrees for an agent', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      // Create multiple worktrees for the same agent
      await worktreeManager.createWorktree('agent-1');
      await worktreeManager.createWorktree('agent-1');
      await worktreeManager.createWorktree('agent-2'); // Different agent
      
      const agentWorktrees = worktreeManager.getAgentWorktrees('agent-1');
      
      expect(agentWorktrees).toHaveLength(2);
      expect(agentWorktrees.every(wt => wt.agentId === 'agent-1')).toBe(true);
    });

    it('should return empty array for agent with no worktrees', () => {
      const agentWorktrees = worktreeManager.getAgentWorktrees('agent-3');
      expect(agentWorktrees).toHaveLength(0);
    });
  });

  describe('listAllWorktrees', () => {
    it('should list all worktrees', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      await worktreeManager.createWorktree('agent-1');
      await worktreeManager.createWorktree('agent-2');
      
      const allWorktrees = worktreeManager.listAllWorktrees();
      
      expect(allWorktrees).toHaveLength(2);
      expect(allWorktrees.some(wt => wt.agentId === 'agent-1')).toBe(true);
      expect(allWorktrees.some(wt => wt.agentId === 'agent-2')).toBe(true);
    });

    it('should return empty array when no worktrees exist', () => {
      const allWorktrees = worktreeManager.listAllWorktrees();
      expect(allWorktrees).toHaveLength(0);
    });
  });

  describe('activateWorktree', () => {
    it('should activate an existing worktree', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const result = worktreeManager.activateWorktree(createResult.worktreeId!);
      
      expect(result).toBe(true);
      const worktree = worktreeManager.getWorktree(createResult.worktreeId!);
      expect(worktree?.status).toBe('active');
    });

    it('should fail to activate non-existent worktree', () => {
      const result = worktreeManager.activateWorktree('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('deactivateWorktree', () => {
    it('should deactivate an existing worktree', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Created worktree', stderr: '' });
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const result = worktreeManager.deactivateWorktree(createResult.worktreeId!);
      
      expect(result).toBe(true);
      const worktree = worktreeManager.getWorktree(createResult.worktreeId!);
      expect(worktree?.status).toBe('inactive');
    });

    it('should fail to deactivate non-existent worktree', () => {
      const result = worktreeManager.deactivateWorktree('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('cleanupWorktree', () => {
    it('should successfully cleanup an existing worktree', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree remove')) {
          callback(null, { stdout: 'Removed worktree', stderr: '' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const cleanupResult: WorktreeResult = await worktreeManager.cleanupWorktree(createResult.worktreeId!);
      
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.worktreeId).toBe(createResult.worktreeId);
      expect(worktreeManager.getWorktree(createResult.worktreeId!)).toBeUndefined();
    });

    it('should fail to cleanup non-existent worktree', async () => {
      const cleanupResult: WorktreeResult = await worktreeManager.cleanupWorktree('non-existent-id');
      
      expect(cleanupResult.success).toBe(false);
      expect(cleanupResult.error).toContain('not found');
    });

    it('should handle git worktree removal failure', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree remove')) {
          callback(new Error('Remove failed'), { stdout: '', stderr: 'Permission denied' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const cleanupResult: WorktreeResult = await worktreeManager.cleanupWorktree(createResult.worktreeId!);
      
      expect(cleanupResult.success).toBe(false);
      expect(cleanupResult.error).toContain('Remove failed');
    });
  });

  describe('pruneWorktrees', () => {
    it('should successfully prune worktrees', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: 'Pruned worktrees', stderr: '' });
      });
      
      const result: WorktreeResult = await worktreeManager.pruneWorktrees();
      
      expect(result.success).toBe(true);
      expect(result.details).toBe('Pruned worktrees');
    });

    it('should handle prune failure', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(new Error('Prune failed'), { stdout: '', stderr: 'Command not found' });
      });
      
      const result: WorktreeResult = await worktreeManager.pruneWorktrees();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Prune failed');
    });
  });

  describe('lockWorktree', () => {
    it('should successfully lock an existing worktree', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree lock')) {
          callback(null, { stdout: 'Locked worktree', stderr: '' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const lockResult: WorktreeResult = await worktreeManager.lockWorktree(createResult.worktreeId!, 'Testing lock');
      
      expect(lockResult.success).toBe(true);
      expect(lockResult.worktreeId).toBe(createResult.worktreeId);
    });

    it('should fail to lock non-existent worktree', async () => {
      const lockResult: WorktreeResult = await worktreeManager.lockWorktree('non-existent-id', 'Test reason');
      
      expect(lockResult.success).toBe(false);
      expect(lockResult.error).toContain('not found');
    });

    it('should handle git worktree lock failure', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree lock')) {
          callback(new Error('Lock failed'), { stdout: '', stderr: 'Permission denied' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const lockResult: WorktreeResult = await worktreeManager.lockWorktree(createResult.worktreeId!, 'Testing lock');
      
      expect(lockResult.success).toBe(false);
      expect(lockResult.error).toContain('Lock failed');
    });
  });

  describe('unlockWorktree', () => {
    it('should successfully unlock an existing worktree', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree unlock')) {
          callback(null, { stdout: 'Unlocked worktree', stderr: '' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const unlockResult: WorktreeResult = await worktreeManager.unlockWorktree(createResult.worktreeId!);
      
      expect(unlockResult.success).toBe(true);
      expect(unlockResult.worktreeId).toBe(createResult.worktreeId);
    });

    it('should fail to unlock non-existent worktree', async () => {
      const unlockResult: WorktreeResult = await worktreeManager.unlockWorktree('non-existent-id');
      
      expect(unlockResult.success).toBe(false);
      expect(unlockResult.error).toContain('not found');
    });

    it('should handle git worktree unlock failure', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command.startsWith('git worktree add')) {
          callback(null, { stdout: 'Created worktree', stderr: '' });
        } else if (command.startsWith('git worktree unlock')) {
          callback(new Error('Unlock failed'), { stdout: '', stderr: 'Permission denied' });
        }
      });
      
      const createResult = await worktreeManager.createWorktree('agent-1');
      const unlockResult: WorktreeResult = await worktreeManager.unlockWorktree(createResult.worktreeId!);
      
      expect(unlockResult.success).toBe(false);
      expect(unlockResult.error).toContain('Unlock failed');
    });
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(null, { stdout: '.git', stderr: '' });
      });
      
      const result = await worktreeManager.isGitRepository();
      expect(result).toBe(true);
    });

    it('should return false when not in a git repository', async () => {
      mockExec.mockImplementation((_, callback) => {
        callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
      });
      
      const result = await worktreeManager.isGitRepository();
      expect(result).toBe(false);
    });
  });

  describe('initializeGitRepository', () => {
    it('should skip initialization if already a git repository', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command === 'git rev-parse --git-dir') {
          callback(null, { stdout: '.git', stderr: '' });
        }
      });
      
      const result: WorktreeResult = await worktreeManager.initializeGitRepository();
      
      expect(result.success).toBe(true);
      expect(result.details).toBe('Already a git repository');
    });

    it('should initialize git repository when not present', async () => {
      let isFirstCall = true;
      mockExec.mockImplementation((command, callback) => {
        if (isFirstCall && command === 'git rev-parse --git-dir') {
          isFirstCall = false;
          callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
        } else if (command === 'git init') {
          callback(null, { stdout: 'Initialized empty Git repository', stderr: '' });
        } else if (command === 'git checkout -b main') {
          callback(null, { stdout: '', stderr: '' });
        } else if (command === 'git commit --allow-empty -m "Initial commit"') {
          callback(null, { stdout: '[main (root-commit)] Initial commit', stderr: '' });
        }
      });
      
      const result: WorktreeResult = await worktreeManager.initializeGitRepository();
      
      expect(result.success).toBe(true);
      expect(result.details).toBe('Initialized empty Git repository');
    });

    it('should handle git initialization failure', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (command === 'git rev-parse --git-dir') {
          callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
        } else if (command === 'git init') {
          callback(new Error('Init failed'), { stdout: '', stderr: 'Permission denied' });
        }
      });
      
      const result: WorktreeResult = await worktreeManager.initializeGitRepository();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Init failed');
    });
  });

  describe('private methods', () => {
    it('should generate unique worktree IDs', () => {
      const generateIdMethod = (worktreeManager as any).generateWorktreeId;
      
      const id1 = generateIdMethod.call(worktreeManager, 'agent-1');
      const id2 = generateIdMethod.call(worktreeManager, 'agent-1');
      
      expect(id1).toContain('wt-agent-1-');
      expect(id2).toContain('wt-agent-1-');
      expect(id1).not.toBe(id2); // Should be unique
    });

    it('should sanitize agent ID in worktree ID generation', () => {
      const generateIdMethod = (worktreeManager as any).generateWorktreeId;
      
      const id = generateIdMethod.call(worktreeManager, 'Agent With Spaces & Special Chars!');
      expect(id).toContain('wt-agent-with-spaces-special-chars-');
    });
  });
});