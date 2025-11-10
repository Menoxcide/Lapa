/**
 * Git Worktree Isolation for LAPA Swarm Intelligence
 *
 * This module implements git worktree isolation for the LAPA swarm,
 * enabling agents to work in isolated filesystem environments while
 * sharing the same repository. This prevents conflicts and allows
 * parallel development.
 */
export type WorktreeStatus = 'active' | 'inactive' | 'error';
export interface WorktreeInfo {
    id: string;
    path: string;
    branch: string;
    status: WorktreeStatus;
    createdAt: Date;
    lastUsed: Date;
    agentId?: string;
}
export interface WorktreeOptions {
    branch?: string;
    commit?: string;
    force?: boolean;
}
export interface WorktreeResult {
    success: boolean;
    worktreeId?: string;
    path?: string;
    error?: string;
    details?: string;
}
/**
 * LAPA Git Worktree Manager
 */
export declare class GitWorktreeManager {
    private worktrees;
    private basePath;
    constructor(basePath?: string);
    /**
     * Ensures the base path for worktrees exists
     */
    private ensureBasePathExists;
    /**
     * Creates a new git worktree for an agent
     * @param agentId ID of the agent requesting the worktree
     * @param options Worktree creation options
     * @returns Promise that resolves with the worktree result
     */
    createWorktree(agentId: string, options?: WorktreeOptions): Promise<WorktreeResult>;
    /**
     * Gets information about a worktree
     * @param worktreeId ID of the worktree
     * @returns Worktree information or undefined if not found
     */
    getWorktree(worktreeId: string): WorktreeInfo | undefined;
    /**
     * Gets all worktrees for an agent
     * @param agentId ID of the agent
     * @returns Array of worktree information
     */
    getAgentWorktrees(agentId: string): WorktreeInfo[];
    /**
     * Lists all worktrees
     * @returns Array of all worktree information
     */
    listAllWorktrees(): WorktreeInfo[];
    /**
     * Activates a worktree (marks as in use)
     * @param worktreeId ID of the worktree
     * @returns Boolean indicating success
     */
    activateWorktree(worktreeId: string): boolean;
    /**
     * Deactivates a worktree (marks as not in use)
     * @param worktreeId ID of the worktree
     * @returns Boolean indicating success
     */
    deactivateWorktree(worktreeId: string): boolean;
    /**
     * Cleans up a worktree (removes from filesystem and registry)
     * @param worktreeId ID of the worktree
     * @returns Promise that resolves with the operation result
     */
    cleanupWorktree(worktreeId: string): Promise<WorktreeResult>;
    /**
     * Prunes stale worktrees
     * @returns Promise that resolves with the prune result
     */
    pruneWorktrees(): Promise<WorktreeResult>;
    /**
     * Locks a worktree to prevent changes
     * @param worktreeId ID of the worktree
     * @param reason Reason for locking
     * @returns Promise that resolves with the operation result
     */
    lockWorktree(worktreeId: string, reason: string): Promise<WorktreeResult>;
    /**
     * Unlocks a worktree
     * @param worktreeId ID of the worktree
     * @returns Promise that resolves with the operation result
     */
    unlockWorktree(worktreeId: string): Promise<WorktreeResult>;
    /**
     * Checks if the current directory is a git repository
     * @returns Promise that resolves with boolean indicating if git repo
     */
    isGitRepository(): Promise<boolean>;
    /**
     * Initializes git repository if needed
     * @returns Promise that resolves with initialization result
     */
    initializeGitRepository(): Promise<WorktreeResult>;
    /**
     * Generates a unique worktree ID
     * @param agentId ID of the agent
     * @returns Unique worktree ID
     */
    private generateWorktreeId;
}
export declare const gitWorktreeManager: GitWorktreeManager;
