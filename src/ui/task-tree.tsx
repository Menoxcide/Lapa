/**
 * Task Tree Orchestrator for LAPA v1.2.2 — Phase 16
 * 
 * This module implements hierarchical task decomposition with git-safe execution.
 * It provides Cursor-like task breakdown with LLM-driven decomposition and
 * safety checks for git operations.
 * 
 * Features:
 * - LLM-driven task breakdown into hierarchical tree structure
 * - JSON tree generation for task visualization
 * - Git operations safety checks (prevent destructive operations)
 * - Integration with Cursor extension
 * - Standalone mode support
 */

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { eventBus } from '../core/event-bus.ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);

export interface TaskNode {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  children?: TaskNode[];
  estimatedTime?: number;
  actualTime?: number;
  dependencies?: string[];
  gitSafe?: boolean;
  gitOperations?: string[];
  metadata?: Record<string, unknown>;
}

const taskNodeSchema: z.ZodType<TaskNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'blocked']),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    children: z.array(taskNodeSchema).optional(),
    estimatedTime: z.number().optional(),
    actualTime: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    gitSafe: z.boolean().optional(),
    gitOperations: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional()
  })
);

// Task tree structure
export interface TaskTree {
  root: TaskNode;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// Task tree configuration
export interface TaskTreeConfig {
  enableGitSafety: boolean;
  enableLLMDecomposition: boolean;
  maxDepth: number;
  maxChildren: number;
  llmProvider?: 'openai' | 'ollama' | 'anthropic';
  llmModel?: string;
}

// Git safety check result
export interface GitSafetyCheck {
  safe: boolean;
  warnings: string[];
  errors: string[];
  blockedOperations: string[];
}

/**
 * Task Tree Orchestrator Component
 */
export const TaskTreeOrchestrator: React.FC<{
  initialTask?: string;
  config?: Partial<TaskTreeConfig>;
  onTaskComplete?: (taskId: string) => void;
  onTaskUpdate?: (task: TaskNode) => void;
}> = ({ initialTask, config, onTaskComplete, onTaskUpdate }: {
  initialTask?: string;
  config?: Partial<TaskTreeConfig>;
  onTaskComplete?: (taskId: string) => void;
  onTaskUpdate?: (task: TaskNode) => void;
}) => {
  const [taskTree, setTaskTree] = useState<TaskTree | null>(null);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const defaultConfig: TaskTreeConfig = {
    enableGitSafety: true,
    enableLLMDecomposition: true,
    maxDepth: 5,
    maxChildren: 10,
    llmProvider: 'openai',
    llmModel: 'gpt-4',
    ...config
  };

  /**
   * Checks if git operations are safe to execute
   */
  const checkGitSafety = useCallback(async (operations: string[]): Promise<GitSafetyCheck> => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const blockedOperations: string[] = [];

    // Dangerous git operations that should be blocked
    const dangerousOps = [
      'git push --force',
      'git push -f',
      'git reset --hard',
      'git clean -fd',
      'git branch -D',
      'git tag -d'
    ];

    for (const op of operations) {
      const normalizedOp = op.toLowerCase().trim();
      
      // Check for dangerous operations
      if (dangerousOps.some(dangerous => normalizedOp.includes(dangerous))) {
        blockedOperations.push(op);
        errors.push(`Blocked dangerous operation: ${op}`);
        continue;
      }

      // Check for uncommitted changes before destructive operations
      if (normalizedOp.includes('checkout') || normalizedOp.includes('merge')) {
        try {
          const { stdout } = await execAsync('git status --porcelain');
          if (stdout.trim()) {
            warnings.push(`Uncommitted changes detected before: ${op}`);
          }
        } catch (error) {
          warnings.push(`Could not check git status: ${error}`);
        }
      }

      // Check for remote operations
      if (normalizedOp.includes('push') || normalizedOp.includes('pull')) {
        try {
          const { stdout } = await execAsync('git remote -v');
          if (!stdout.trim()) {
            warnings.push(`No remote configured for: ${op}`);
          }
        } catch (error) {
          warnings.push(`Could not check git remotes: ${error}`);
        }
      }
    }

    return {
      safe: errors.length === 0,
      warnings,
      errors,
      blockedOperations
    };
  }, []);

  /**
   * Decomposes a task into a hierarchical tree using LLM
   */
  const decomposeTask = useCallback(async (task: string): Promise<TaskTree> => {
    setIsDecomposing(true);
    setError(null);

    try {
      // For now, create a simple tree structure
      // In production, this would call an LLM to decompose the task
      const rootNode: TaskNode = {
        id: 'root',
        title: task,
        description: `Main task: ${task}`,
        status: 'pending',
        priority: 'medium',
        children: [],
        gitSafe: true,
        gitOperations: []
      };

      // Publish task decomposition event
      await eventBus.publish({
        id: `task-tree-${Date.now()}`,
        type: 'task.tree.created',
        timestamp: Date.now(),
        source: 'task-tree-orchestrator',
        payload: {
          taskTree: {
            root: rootNode,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1
          }
        }
      });

      const tree: TaskTree = {
        root: rootNode,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      setTaskTree(tree);
      return tree;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to decompose task';
      setError(errorMsg);
      throw err;
    } finally {
      setIsDecomposing(false);
    }
  }, []);

  /**
   * Updates a task node in the tree
   */
  const updateTaskNode = useCallback((nodeId: string, updates: Partial<TaskNode>) => {
    if (!taskTree) return;

    const updateNode = (node: TaskNode): TaskNode => {
      if (node.id === nodeId) {
        const updated = { ...node, ...updates };
        if (onTaskUpdate) {
          onTaskUpdate(updated);
        }
        return updated;
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode)
        };
      }
      return node;
    };

    const updatedRoot = updateNode(taskTree.root);
    const updatedTree: TaskTree = {
      ...taskTree,
      root: updatedRoot,
      updatedAt: new Date(),
      version: taskTree.version + 1
    };

    setTaskTree(updatedTree);

    // Publish update event
    eventBus.publish({
      id: `task-tree-update-${Date.now()}`,
      type: 'task.tree.updated',
      timestamp: Date.now(),
      source: 'task-tree-orchestrator',
      payload: {
        nodeId,
        updates,
        tree: updatedTree
      }
    });
  }, [taskTree, onTaskUpdate]);

  /**
   * Executes a task node with git safety checks
   */
  const executeTaskNode = useCallback(async (nodeId: string) => {
    if (!taskTree) return;

    const findNode = (node: TaskNode): TaskNode | null => {
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(taskTree.root);
    if (!node) {
      setError(`Task node ${nodeId} not found`);
      return;
    }

    // Check git safety if enabled
    if (defaultConfig.enableGitSafety && node.gitOperations) {
      const safetyCheck = await checkGitSafety(node.gitOperations);
      if (!safetyCheck.safe) {
        setError(`Git safety check failed: ${safetyCheck.errors.join(', ')}`);
        updateTaskNode(nodeId, { status: 'blocked' });
        return;
      }
    }

    // Update status to in_progress
    updateTaskNode(nodeId, { status: 'in_progress' });

    // Publish execution event
    await eventBus.publish({
      id: `task-execute-${Date.now()}`,
      type: 'task.execution.started',
      timestamp: Date.now(),
      source: 'task-tree-orchestrator',
      payload: {
        nodeId,
        task: node
      }
    });

    // In production, this would execute the actual task
    // For now, simulate completion
    setTimeout(() => {
      updateTaskNode(nodeId, { status: 'completed' });
      if (onTaskComplete) {
        onTaskComplete(nodeId);
      }
    }, 1000);
  }, [taskTree, defaultConfig.enableGitSafety, checkGitSafety, updateTaskNode, onTaskComplete]);

  // Initialize task decomposition on mount if initialTask is provided
  useEffect(() => {
    if (initialTask && !taskTree) {
      decomposeTask(initialTask).catch(console.error);
    }
  }, [initialTask, taskTree, decomposeTask]);

  // Render task tree node
  const renderNode = (node: TaskNode, depth: number = 0) => {
    if (depth > defaultConfig.maxDepth) return null;

    const isSelected = selectedNode === node.id;
    const statusColors: Record<TaskNode['status'], string> = {
      pending: 'gray',
      in_progress: 'blue',
      completed: 'green',
      failed: 'red',
      blocked: 'orange'
    };

    return (
      <div
        key={String(node.id)}
        style={{
          marginLeft: `${depth * 20}px`,
          padding: '8px',
          border: isSelected ? '2px solid blue' : '1px solid #ccc',
          borderRadius: '4px',
          marginBottom: '4px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#f0f0f0' : 'white'
        }}
        onClick={() => setSelectedNode(node.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: statusColors[node.status] }}>
            [{node.status.toUpperCase()}]
          </span>
          <strong>{node.title}</strong>
          {node.priority && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              ({node.priority})
            </span>
          )}
        </div>
        {node.description && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {node.description}
          </div>
        )}
        {node.gitSafe !== undefined && (
          <div style={{ fontSize: '11px', color: node.gitSafe ? 'green' : 'red' }}>
            Git Safe: {node.gitSafe ? 'Yes' : 'No'}
          </div>
        )}
        {node.status === 'pending' && (
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              executeTaskNode(String(node.id));
            }}
            style={{ marginTop: '4px', padding: '4px 8px' }}
          >
            Execute
          </button>
        )}
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <>{node.children.map(child => renderNode(child, depth + 1))}</>
          </div>
        )}
      </div>
    );
  };

  if (isDecomposing) {
    return <div>Decomposing task...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!taskTree) {
    return <div>No task tree loaded. Provide an initial task to begin.</div>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>Task Tree Orchestrator</h2>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => {
            const task = prompt('Enter task description:');
            if (task) {
              decomposeTask(task).catch(console.error);
            }
          }}
        >
          Create New Task Tree
        </button>
      </div>
      <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '4px' }}>
        {renderNode(taskTree.root)}
      </div>
    </div>
  );
};

export default TaskTreeOrchestrator;

