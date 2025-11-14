"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const worktree_isolation_ts_1 = require("../../swarm/worktree.isolation.ts");
const fs_1 = require("fs");
// Mock child_process.exec
const mockExec = vitest_1.vi.fn();
vitest_1.vi.mock('child_process', () => ({
    exec: mockExec
}));
// Mock fs functions
vitest_1.vi.mock('fs', () => ({
    existsSync: vitest_1.vi.fn(),
    mkdirSync: vitest_1.vi.fn()
}));
// Promisify mock for exec
const mockExecPromise = (stdout = '', stderr = '') => {
    return Promise.resolve({ stdout, stderr });
};
(0, vitest_1.describe)('GitWorktreeManager', () => {
    let worktreeManager;
    (0, vitest_1.beforeEach)(() => {
        worktreeManager = new worktree_isolation_ts_1.GitWorktreeManager('/test/worktrees');
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
        // Setup default mock behaviors
        fs_1.existsSync.mockReturnValue(true);
    });
    (0, vitest_1.afterEach)(() => {
        // Clear the worktrees map after each test
        worktreeManager.worktrees.clear();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should create worktree manager with default path', () => {
            fs_1.existsSync.mockReturnValue(false);
            const defaultManager = new worktree_isolation_ts_1.GitWorktreeManager();
            (0, vitest_1.expect)(fs_1.existsSync).toHaveBeenCalledWith('.lapa/worktrees');
            (0, vitest_1.expect)(fs_1.mkdirSync).toHaveBeenCalledWith('.lapa/worktrees', { recursive: true });
        });
        (0, vitest_1.it)('should create worktree manager with custom path', () => {
            fs_1.existsSync.mockReturnValue(false);
            const customManager = new worktree_isolation_ts_1.GitWorktreeManager('/custom/path');
            (0, vitest_1.expect)(fs_1.existsSync).toHaveBeenCalledWith('/custom/path');
            (0, vitest_1.expect)(fs_1.mkdirSync).toHaveBeenCalledWith('/custom/path', { recursive: true });
        });
        (0, vitest_1.it)('should not create directory if it already exists', () => {
            fs_1.existsSync.mockReturnValue(true);
            const manager = new worktree_isolation_ts_1.GitWorktreeManager('/existing/path');
            (0, vitest_1.expect)(fs_1.existsSync).toHaveBeenCalledWith('/existing/path');
            (0, vitest_1.expect)(fs_1.mkdirSync).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('createWorktree', () => {
        (0, vitest_1.it)('should successfully create a worktree with default branch', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const result = await worktreeManager.createWorktree('agent-1');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.worktreeId).toBeDefined();
            (0, vitest_1.expect)(result.path).toContain('/test/worktrees/wt-agent-1-');
            (0, vitest_1.expect)(mockExec).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/git worktree add ".*" -b worktree\/wt-agent-1-/), vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should create worktree with specified branch', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const options = { branch: 'feature-branch' };
            const result = await worktreeManager.createWorktree('agent-1', options);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockExec).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/git worktree add ".*" feature-branch/), vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should create worktree with specified commit', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const options = { commit: 'abc123' };
            const result = await worktreeManager.createWorktree('agent-1', options);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockExec).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/git worktree add ".*" abc123/), vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should create worktree with force option', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const options = { force: true };
            const result = await worktreeManager.createWorktree('agent-1', options);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(mockExec).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/git worktree add ".*" -b worktree\/wt-agent-1-.* --force/), vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should handle git worktree creation failure', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(new Error('Git command failed'), { stdout: '', stderr: 'Permission denied' });
            });
            const result = await worktreeManager.createWorktree('agent-1');
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Git command failed');
        });
        (0, vitest_1.it)('should handle stderr with preparation message as success', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Worktree created', stderr: 'Preparing worktree' });
            });
            const result = await worktreeManager.createWorktree('agent-1');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.details).toBe('Worktree created');
        });
        (0, vitest_1.it)('should register worktree in internal registry', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const result = await worktreeManager.createWorktree('agent-1');
            const worktree = worktreeManager.getWorktree(result.worktreeId);
            (0, vitest_1.expect)(worktree).toBeDefined();
            (0, vitest_1.expect)(worktree?.id).toBe(result.worktreeId);
            (0, vitest_1.expect)(worktree?.agentId).toBe('agent-1');
            (0, vitest_1.expect)(worktree?.status).toBe('active');
            (0, vitest_1.expect)(worktree?.createdAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(worktree?.lastUsed).toBeInstanceOf(Date);
        });
    });
    (0, vitest_1.describe)('getWorktree', () => {
        (0, vitest_1.it)('should retrieve worktree by ID', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const worktree = worktreeManager.getWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(worktree).toBeDefined();
            (0, vitest_1.expect)(worktree?.id).toBe(createResult.worktreeId);
        });
        (0, vitest_1.it)('should return undefined for non-existent worktree', () => {
            const worktree = worktreeManager.getWorktree('non-existent-id');
            (0, vitest_1.expect)(worktree).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getAgentWorktrees', () => {
        (0, vitest_1.it)('should retrieve all worktrees for an agent', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            // Create multiple worktrees for the same agent
            await worktreeManager.createWorktree('agent-1');
            await worktreeManager.createWorktree('agent-1');
            await worktreeManager.createWorktree('agent-2'); // Different agent
            const agentWorktrees = worktreeManager.getAgentWorktrees('agent-1');
            (0, vitest_1.expect)(agentWorktrees).toHaveLength(2);
            (0, vitest_1.expect)(agentWorktrees.every(wt => wt.agentId === 'agent-1')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array for agent with no worktrees', () => {
            const agentWorktrees = worktreeManager.getAgentWorktrees('agent-3');
            (0, vitest_1.expect)(agentWorktrees).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('listAllWorktrees', () => {
        (0, vitest_1.it)('should list all worktrees', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            await worktreeManager.createWorktree('agent-1');
            await worktreeManager.createWorktree('agent-2');
            const allWorktrees = worktreeManager.listAllWorktrees();
            (0, vitest_1.expect)(allWorktrees).toHaveLength(2);
            (0, vitest_1.expect)(allWorktrees.some(wt => wt.agentId === 'agent-1')).toBe(true);
            (0, vitest_1.expect)(allWorktrees.some(wt => wt.agentId === 'agent-2')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array when no worktrees exist', () => {
            const allWorktrees = worktreeManager.listAllWorktrees();
            (0, vitest_1.expect)(allWorktrees).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('activateWorktree', () => {
        (0, vitest_1.it)('should activate an existing worktree', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const result = worktreeManager.activateWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(result).toBe(true);
            const worktree = worktreeManager.getWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(worktree?.status).toBe('active');
        });
        (0, vitest_1.it)('should fail to activate non-existent worktree', () => {
            const result = worktreeManager.activateWorktree('non-existent-id');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('deactivateWorktree', () => {
        (0, vitest_1.it)('should deactivate an existing worktree', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Created worktree', stderr: '' });
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const result = worktreeManager.deactivateWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(result).toBe(true);
            const worktree = worktreeManager.getWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(worktree?.status).toBe('inactive');
        });
        (0, vitest_1.it)('should fail to deactivate non-existent worktree', () => {
            const result = worktreeManager.deactivateWorktree('non-existent-id');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('cleanupWorktree', () => {
        (0, vitest_1.it)('should successfully cleanup an existing worktree', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree remove')) {
                    callback(null, { stdout: 'Removed worktree', stderr: '' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const cleanupResult = await worktreeManager.cleanupWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(cleanupResult.success).toBe(true);
            (0, vitest_1.expect)(cleanupResult.worktreeId).toBe(createResult.worktreeId);
            (0, vitest_1.expect)(worktreeManager.getWorktree(createResult.worktreeId)).toBeUndefined();
        });
        (0, vitest_1.it)('should fail to cleanup non-existent worktree', async () => {
            const cleanupResult = await worktreeManager.cleanupWorktree('non-existent-id');
            (0, vitest_1.expect)(cleanupResult.success).toBe(false);
            (0, vitest_1.expect)(cleanupResult.error).toContain('not found');
        });
        (0, vitest_1.it)('should handle git worktree removal failure', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree remove')) {
                    callback(new Error('Remove failed'), { stdout: '', stderr: 'Permission denied' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const cleanupResult = await worktreeManager.cleanupWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(cleanupResult.success).toBe(false);
            (0, vitest_1.expect)(cleanupResult.error).toContain('Remove failed');
        });
    });
    (0, vitest_1.describe)('pruneWorktrees', () => {
        (0, vitest_1.it)('should successfully prune worktrees', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: 'Pruned worktrees', stderr: '' });
            });
            const result = await worktreeManager.pruneWorktrees();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.details).toBe('Pruned worktrees');
        });
        (0, vitest_1.it)('should handle prune failure', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(new Error('Prune failed'), { stdout: '', stderr: 'Command not found' });
            });
            const result = await worktreeManager.pruneWorktrees();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Prune failed');
        });
    });
    (0, vitest_1.describe)('lockWorktree', () => {
        (0, vitest_1.it)('should successfully lock an existing worktree', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree lock')) {
                    callback(null, { stdout: 'Locked worktree', stderr: '' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const lockResult = await worktreeManager.lockWorktree(createResult.worktreeId, 'Testing lock');
            (0, vitest_1.expect)(lockResult.success).toBe(true);
            (0, vitest_1.expect)(lockResult.worktreeId).toBe(createResult.worktreeId);
        });
        (0, vitest_1.it)('should fail to lock non-existent worktree', async () => {
            const lockResult = await worktreeManager.lockWorktree('non-existent-id', 'Test reason');
            (0, vitest_1.expect)(lockResult.success).toBe(false);
            (0, vitest_1.expect)(lockResult.error).toContain('not found');
        });
        (0, vitest_1.it)('should handle git worktree lock failure', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree lock')) {
                    callback(new Error('Lock failed'), { stdout: '', stderr: 'Permission denied' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const lockResult = await worktreeManager.lockWorktree(createResult.worktreeId, 'Testing lock');
            (0, vitest_1.expect)(lockResult.success).toBe(false);
            (0, vitest_1.expect)(lockResult.error).toContain('Lock failed');
        });
    });
    (0, vitest_1.describe)('unlockWorktree', () => {
        (0, vitest_1.it)('should successfully unlock an existing worktree', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree unlock')) {
                    callback(null, { stdout: 'Unlocked worktree', stderr: '' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const unlockResult = await worktreeManager.unlockWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(unlockResult.success).toBe(true);
            (0, vitest_1.expect)(unlockResult.worktreeId).toBe(createResult.worktreeId);
        });
        (0, vitest_1.it)('should fail to unlock non-existent worktree', async () => {
            const unlockResult = await worktreeManager.unlockWorktree('non-existent-id');
            (0, vitest_1.expect)(unlockResult.success).toBe(false);
            (0, vitest_1.expect)(unlockResult.error).toContain('not found');
        });
        (0, vitest_1.it)('should handle git worktree unlock failure', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command.startsWith('git worktree add')) {
                    callback(null, { stdout: 'Created worktree', stderr: '' });
                }
                else if (command.startsWith('git worktree unlock')) {
                    callback(new Error('Unlock failed'), { stdout: '', stderr: 'Permission denied' });
                }
            });
            const createResult = await worktreeManager.createWorktree('agent-1');
            const unlockResult = await worktreeManager.unlockWorktree(createResult.worktreeId);
            (0, vitest_1.expect)(unlockResult.success).toBe(false);
            (0, vitest_1.expect)(unlockResult.error).toContain('Unlock failed');
        });
    });
    (0, vitest_1.describe)('isGitRepository', () => {
        (0, vitest_1.it)('should return true when in a git repository', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(null, { stdout: '.git', stderr: '' });
            });
            const result = await worktreeManager.isGitRepository();
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when not in a git repository', async () => {
            mockExec.mockImplementation((_, callback) => {
                callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
            });
            const result = await worktreeManager.isGitRepository();
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('initializeGitRepository', () => {
        (0, vitest_1.it)('should skip initialization if already a git repository', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command === 'git rev-parse --git-dir') {
                    callback(null, { stdout: '.git', stderr: '' });
                }
            });
            const result = await worktreeManager.initializeGitRepository();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.details).toBe('Already a git repository');
        });
        (0, vitest_1.it)('should initialize git repository when not present', async () => {
            let isFirstCall = true;
            mockExec.mockImplementation((command, callback) => {
                if (isFirstCall && command === 'git rev-parse --git-dir') {
                    isFirstCall = false;
                    callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
                }
                else if (command === 'git init') {
                    callback(null, { stdout: 'Initialized empty Git repository', stderr: '' });
                }
                else if (command === 'git checkout -b main') {
                    callback(null, { stdout: '', stderr: '' });
                }
                else if (command === 'git commit --allow-empty -m "Initial commit"') {
                    callback(null, { stdout: '[main (root-commit)] Initial commit', stderr: '' });
                }
            });
            const result = await worktreeManager.initializeGitRepository();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.details).toBe('Initialized empty Git repository');
        });
        (0, vitest_1.it)('should handle git initialization failure', async () => {
            mockExec.mockImplementation((command, callback) => {
                if (command === 'git rev-parse --git-dir') {
                    callback(new Error('Not a git repository'), { stdout: '', stderr: '' });
                }
                else if (command === 'git init') {
                    callback(new Error('Init failed'), { stdout: '', stderr: 'Permission denied' });
                }
            });
            const result = await worktreeManager.initializeGitRepository();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Init failed');
        });
    });
    (0, vitest_1.describe)('private methods', () => {
        (0, vitest_1.it)('should generate unique worktree IDs', () => {
            const generateIdMethod = worktreeManager.generateWorktreeId;
            const id1 = generateIdMethod.call(worktreeManager, 'agent-1');
            const id2 = generateIdMethod.call(worktreeManager, 'agent-1');
            (0, vitest_1.expect)(id1).toContain('wt-agent-1-');
            (0, vitest_1.expect)(id2).toContain('wt-agent-1-');
            (0, vitest_1.expect)(id1).not.toBe(id2); // Should be unique
        });
        (0, vitest_1.it)('should sanitize agent ID in worktree ID generation', () => {
            const generateIdMethod = worktreeManager.generateWorktreeId;
            const id = generateIdMethod.call(worktreeManager, 'Agent With Spaces & Special Chars!');
            (0, vitest_1.expect)(id).toContain('wt-agent-with-spaces-special-chars-');
        });
    });
});
//# sourceMappingURL=worktree.isolation.test.js.map