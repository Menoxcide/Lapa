/**
 * Git Worktree Isolation for LAPA Swarm Intelligence
 * 
 * This module implements git worktree isolation for the LAPA swarm,
 * enabling agents to work in isolated filesystem environments while
 * sharing the same repository. This prevents conflicts and allows
 * parallel development.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';

const execAsync = promisify(exec);

// Worktree status
export type WorktreeStatus = 'active' | 'inactive' | 'error';

// Worktree information
export interface WorktreeInfo {
  id: string;
  path: string;
  branch: string;
  status: WorktreeStatus;
  createdAt: Date;
  lastUsed: Date;
  agentId?: string;
}

// Worktree creation options
export interface WorktreeOptions {
  branch?: string;
  commit?: string;
  force?: boolean;
}

// Worktree operation result
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
export class GitWorktreeManager {
  private worktrees: Map<string, WorktreeInfo> = new Map();
  private basePath: string;
  
  constructor(basePath: string = '.lapa/worktrees') {
    this.basePath = basePath;
    this.ensureBasePathExists();
  }
  
  /**
   * Ensures the base path for worktrees exists
   */
  private ensureBasePathExists(): void {
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }
  
  /**
   * Creates a new git worktree for an agent
   * @param agentId ID of the agent requesting the worktree
   * @param options Worktree creation options
   * @returns Promise that resolves with the worktree result
   */
  async createWorktree(agentId: string, options: WorktreeOptions = {}): Promise<WorktreeResult> {
    try {
      // Generate unique worktree ID
      const worktreeId = this.generateWorktreeId(agentId);
      const worktreePath = join(this.basePath, worktreeId);
      
      console.log(`Creating worktree for agent ${agentId}: ${worktreeId}`);
      
      // Construct git worktree command
      let command = `git worktree add "${worktreePath}"`;
      
      if (options.branch) {
        command += ` ${options.branch}`;
      } else if (options.commit) {
        command += ` ${options.commit}`;
      } else {
        // Create new branch with worktree ID
        command += ` -b worktree/${worktreeId}`;
      }
      
      if (options.force) {
        command += ' --force';
      }
      
      // Execute git worktree command
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Preparing')) {
        throw new Error(`Git worktree creation failed: ${stderr}`);
      }
      
      // Register worktree
      const worktreeInfo: WorktreeInfo = {
        id: worktreeId,
        path: worktreePath,
        branch: options.branch || `worktree/${worktreeId}`,
        status: 'active',
        createdAt: new Date(),
        lastUsed: new Date(),
        agentId
      };
      
      this.worktrees.set(worktreeId, worktreeInfo);
      
      console.log(`Worktree created successfully: ${worktreeId}`);
      
      return {
        success: true,
        worktreeId,
        path: worktreePath,
        details: stdout
      };
    } catch (error) {
      console.error(`Failed to create worktree for agent ${agentId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Gets information about a worktree
   * @param worktreeId ID of the worktree
   * @returns Worktree information or undefined if not found
   */
  getWorktree(worktreeId: string): WorktreeInfo | undefined {
    return this.worktrees.get(worktreeId);
  }
  
  /**
   * Gets all worktrees for an agent
   * @param agentId ID of the agent
   * @returns Array of worktree information
   */
  getAgentWorktrees(agentId: string): WorktreeInfo[] {
    return Array.from(this.worktrees.values()).filter(wt => wt.agentId === agentId);
  }
  
  /**
   * Lists all worktrees
   * @returns Array of all worktree information
   */
  listAllWorktrees(): WorktreeInfo[] {
    return Array.from(this.worktrees.values());
  }
  
  /**
   * Activates a worktree (marks as in use)
   * @param worktreeId ID of the worktree
   * @returns Boolean indicating success
   */
  activateWorktree(worktreeId: string): boolean {
    const worktree = this.worktrees.get(worktreeId);
    if (!worktree) {
      console.error(`Worktree ${worktreeId} not found`);
      return false;
    }
    
    worktree.status = 'active';
    worktree.lastUsed = new Date();
    console.log(`Activated worktree: ${worktreeId}`);
    return true;
  }
  
  /**
   * Deactivates a worktree (marks as not in use)
   * @param worktreeId ID of the worktree
   * @returns Boolean indicating success
   */
  deactivateWorktree(worktreeId: string): boolean {
    const worktree = this.worktrees.get(worktreeId);
    if (!worktree) {
      console.error(`Worktree ${worktreeId} not found`);
      return false;
    }
    
    worktree.status = 'inactive';
    console.log(`Deactivated worktree: ${worktreeId}`);
    return true;
  }
  
  /**
   * Cleans up a worktree (removes from filesystem and registry)
   * @param worktreeId ID of the worktree
   * @returns Promise that resolves with the operation result
   */
  async cleanupWorktree(worktreeId: string): Promise<WorktreeResult> {
    try {
      const worktree = this.worktrees.get(worktreeId);
      if (!worktree) {
        return {
          success: false,
          error: `Worktree ${worktreeId} not found`
        };
      }
      
      console.log(`Cleaning up worktree: ${worktreeId}`);
      
      // Remove worktree from git
      const command = `git worktree remove "${worktree.path}" --force`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Removing')) {
        throw new Error(`Git worktree removal failed: ${stderr}`);
      }
      
      // Remove from registry
      this.worktrees.delete(worktreeId);
      
      console.log(`Worktree cleaned up successfully: ${worktreeId}`);
      
      return {
        success: true,
        worktreeId,
        details: stdout
      };
    } catch (error) {
      console.error(`Failed to cleanup worktree ${worktreeId}:`, error);
      
      return {
        success: false,
        worktreeId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Prunes stale worktrees
   * @returns Promise that resolves with the prune result
   */
  async pruneWorktrees(): Promise<WorktreeResult> {
    try {
      console.log('Pruning stale worktrees');
      
      // Prune git worktrees
      const command = 'git worktree prune';
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Git worktree prune failed: ${stderr}`);
      }
      
      // Clean up registry entries for pruned worktrees
      // This is a simplified approach - in reality, we'd need to check
      // which worktrees actually exist on disk
      console.log('Pruned stale worktrees');
      
      return {
        success: true,
        details: stdout
      };
    } catch (error) {
      console.error('Failed to prune worktrees:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Locks a worktree to prevent changes
   * @param worktreeId ID of the worktree
   * @param reason Reason for locking
   * @returns Promise that resolves with the operation result
   */
  async lockWorktree(worktreeId: string, reason: string): Promise<WorktreeResult> {
    try {
      const worktree = this.worktrees.get(worktreeId);
      if (!worktree) {
        return {
          success: false,
          error: `Worktree ${worktreeId} not found`
        };
      }
      
      console.log(`Locking worktree ${worktreeId}: ${reason}`);
      
      // Lock git worktree
      const command = `git worktree lock "${worktree.path}" "${reason}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Git worktree lock failed: ${stderr}`);
      }
      
      console.log(`Worktree locked successfully: ${worktreeId}`);
      
      return {
        success: true,
        worktreeId,
        details: stdout
      };
    } catch (error) {
      console.error(`Failed to lock worktree ${worktreeId}:`, error);
      
      return {
        success: false,
        worktreeId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Unlocks a worktree
   * @param worktreeId ID of the worktree
   * @returns Promise that resolves with the operation result
   */
  async unlockWorktree(worktreeId: string): Promise<WorktreeResult> {
    try {
      const worktree = this.worktrees.get(worktreeId);
      if (!worktree) {
        return {
          success: false,
          error: `Worktree ${worktreeId} not found`
        };
      }
      
      console.log(`Unlocking worktree: ${worktreeId}`);
      
      // Unlock git worktree
      const command = `git worktree unlock "${worktree.path}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Git worktree unlock failed: ${stderr}`);
      }
      
      console.log(`Worktree unlocked successfully: ${worktreeId}`);
      
      return {
        success: true,
        worktreeId,
        details: stdout
      };
    } catch (error) {
      console.error(`Failed to unlock worktree ${worktreeId}:`, error);
      
      return {
        success: false,
        worktreeId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Checks if the current directory is a git repository
   * @returns Promise that resolves with boolean indicating if git repo
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Initializes git repository if needed
   * @returns Promise that resolves with initialization result
   */
  async initializeGitRepository(): Promise<WorktreeResult> {
    try {
      if (await this.isGitRepository()) {
        return {
          success: true,
          details: 'Already a git repository'
        };
      }
      
      console.log('Initializing git repository');
      
      const { stdout, stderr } = await execAsync('git init');
      
      if (stderr) {
        throw new Error(`Git init failed: ${stderr}`);
      }
      
      // Create initial commit
      await execAsync('git checkout -b main');
      await execAsync('git commit --allow-empty -m "Initial commit"');
      
      console.log('Git repository initialized');
      
      return {
        success: true,
        details: stdout
      };
    } catch (error) {
      console.error('Failed to initialize git repository:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Generates a unique worktree ID
   * @param agentId ID of the agent
   * @returns Unique worktree ID
   */
  private generateWorktreeId(agentId: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const agentSlug = agentId.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 10);
    return `wt-${agentSlug}-${timestamp}-${random}`;
  }
}

// Export singleton instance
export const gitWorktreeManager = new GitWorktreeManager();