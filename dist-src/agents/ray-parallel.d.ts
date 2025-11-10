/**
 * Ray Parallel Execution Integration for LAPA
 *
 * This module provides integration with Ray-like parallel execution capabilities
 * for distributing tasks across multiple agents in the LAPA swarm. It manages
 * task distribution, execution, and result collection in parallel.
 */
import { Task } from './moe-router';
export interface TaskResult {
    taskId: string;
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
}
export interface ParallelExecutionOptions {
    maxConcurrency?: number;
    timeout?: number;
    retries?: number;
}
/**
 * LAPA Ray Parallel Executor
 */
export declare class RayParallelExecutor {
    private maxConcurrency;
    private timeout;
    private retries;
    private activeTasks;
    constructor(options?: ParallelExecutionOptions);
    /**
     * Executes a single task asynchronously
     * @param task The task to execute
     * @returns Promise that resolves with the task result
     */
    executeTask(task: Task): Promise<TaskResult>;
    /**
     * Executes multiple tasks in parallel
     * @param tasks Array of tasks to execute
     * @returns Promise that resolves with all task results
     */
    executeTasks(tasks: Task[]): Promise<TaskResult[]>;
    /**
     * Executes a task with retry logic
     * @param task The task to execute
     * @returns Promise that resolves with the task result
     */
    private executeTaskWithRetry;
    /**
     * Gets the current status of all active tasks
     * @returns Object with task status information
     */
    getTaskStatus(): {
        totalTasks: number;
        activeTasks: number;
        pendingTasks: number;
    };
}
export declare const rayParallelExecutor: RayParallelExecutor;
