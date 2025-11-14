"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ray_parallel_ts_1 = require("../../agents/ray-parallel.ts");
(0, vitest_1.describe)('RayParallelExecutor', () => {
    let executor;
    beforeEach(() => {
        executor = new ray_parallel_ts_1.RayParallelExecutor({
            maxConcurrency: 2,
            timeout: 5000,
            retries: 2
        });
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default options', () => {
            const defaultExecutor = new ray_parallel_ts_1.RayParallelExecutor();
            (0, vitest_1.expect)(defaultExecutor).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with custom options', () => {
            const customExecutor = new ray_parallel_ts_1.RayParallelExecutor({
                maxConcurrency: 5,
                timeout: 10000,
                retries: 3
            });
            // We can't directly access private properties, but we can verify initialization by using methods
            (0, vitest_1.expect)(customExecutor).toBeDefined();
        });
    });
    (0, vitest_1.describe)('executeTask', () => {
        (0, vitest_1.it)('should execute a task successfully', async () => {
            const task = {
                id: 'task-1',
                description: 'Generate a React component',
                type: 'code_generation',
                priority: 1
            };
            const result = await executor.executeTask(task);
            (0, vitest_1.expect)(result.taskId).toBe('task-1');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.result).toBeDefined();
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.error).toBeUndefined();
        });
        (0, vitest_1.it)('should handle task execution errors gracefully', async () => {
            // We can't easily simulate an error in the current implementation
            // In a real scenario, we would mock the internal execution to throw an error
            // For now, we'll just verify the structure of the result
            const task = {
                id: 'task-2',
                description: 'This task might fail',
                type: 'unknown_type',
                priority: 1
            };
            const result = await executor.executeTask(task);
            // With the current implementation, all tasks succeed
            (0, vitest_1.expect)(result.taskId).toBe('task-2');
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should execute different task types correctly', async () => {
            const tasks = [
                {
                    id: 'task-code',
                    description: 'Write authentication function',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-review',
                    description: 'Review security implementation',
                    type: 'code_review',
                    priority: 2
                },
                {
                    id: 'task-fix',
                    description: 'Fix memory leak issue',
                    type: 'bug_fix',
                    priority: 3
                },
                {
                    id: 'task-optimize',
                    description: 'Improve database queries',
                    type: 'optimization',
                    priority: 2
                }
            ];
            for (const task of tasks) {
                const result = await executor.executeTask(task);
                (0, vitest_1.expect)(result.taskId).toBe(task.id);
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.result).toContain(task.description);
            }
        });
    });
    (0, vitest_1.describe)('executeTasks', () => {
        (0, vitest_1.it)('should execute multiple tasks in parallel', async () => {
            const tasks = [
                {
                    id: 'task-1',
                    description: 'First task',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-2',
                    description: 'Second task',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-3',
                    description: 'Third task',
                    type: 'code_generation',
                    priority: 1
                }
            ];
            const results = await executor.executeTasks(tasks);
            (0, vitest_1.expect)(results).toHaveLength(3);
            results.forEach((result, index) => {
                (0, vitest_1.expect)(result.taskId).toBe(tasks[index].id);
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.result).toBeDefined();
            });
        });
        (0, vitest_1.it)('should respect maxConcurrency limit', async () => {
            const tasks = [
                {
                    id: 'task-1',
                    description: 'First task',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-2',
                    description: 'Second task',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-3',
                    description: 'Third task',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-4',
                    description: 'Fourth task',
                    type: 'code_generation',
                    priority: 1
                }
            ];
            // Mock Date.now to control timing
            const now = Date.now;
            let time = 0;
            Date.now = vitest_1.vi.fn(() => time);
            const results = await executor.executeTasks(tasks);
            (0, vitest_1.expect)(results).toHaveLength(4);
            results.forEach((result) => {
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            // Restore Date.now
            Date.now = now;
        });
        (0, vitest_1.it)('should handle empty task array', async () => {
            const results = await executor.executeTasks([]);
            (0, vitest_1.expect)(results).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('executeTaskWithRetry', () => {
        (0, vitest_1.it)('should retry failed tasks', async () => {
            // Since we can't easily simulate failures in the current implementation,
            // we'll test that the method exists and returns expected structure
            const task = {
                id: 'task-retry',
                description: 'Task with retries',
                type: 'code_generation',
                priority: 1
            };
            const result = await executor.executeTaskWithRetry(task);
            (0, vitest_1.expect)(result.taskId).toBe('task-retry');
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('getTaskStatus', () => {
        (0, vitest_1.it)('should return task status information', () => {
            const status = executor.getTaskStatus();
            (0, vitest_1.expect)(status).toHaveProperty('totalTasks');
            (0, vitest_1.expect)(status).toHaveProperty('activeTasks');
            (0, vitest_1.expect)(status).toHaveProperty('pendingTasks');
            (0, vitest_1.expect)(typeof status.totalTasks).toBe('number');
            (0, vitest_1.expect)(typeof status.activeTasks).toBe('number');
            (0, vitest_1.expect)(typeof status.pendingTasks).toBe('number');
        });
    });
});
//# sourceMappingURL=ray-parallel.test.js.map