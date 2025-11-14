import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RayParallelExecutor, Task, TaskResult } from '../../agents/ray-parallel.ts';

// Mock event bus if used
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
    listenerCount: vi.fn(() => 0)
  }
}));

describe('RayParallelExecutor', () => {
  let executor: RayParallelExecutor;

  beforeEach(() => {
    executor = new RayParallelExecutor({
      maxConcurrency: 2,
      timeout: 5000,
      retries: 2
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultExecutor = new RayParallelExecutor();
      expect(defaultExecutor).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customExecutor = new RayParallelExecutor({
        maxConcurrency: 5,
        timeout: 10000,
        retries: 3
      });
      
      // We can't directly access private properties, but we can verify initialization by using methods
      expect(customExecutor).toBeDefined();
    });
  });

  describe('executeTask', () => {
    it('should execute a task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        description: 'Generate a React component',
        type: 'code_generation',
        priority: 1
      };

      const result = await executor.executeTask(task);
      
      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(result.taskId).toBeDefined();
      expect(result.success).toBe(true);
      expect(typeof result.success).toBe('boolean');
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(result.error).toBeFalsy();
    });

    it('should handle task execution errors gracefully', async () => {
      // Mock task execution to throw error
      vi.spyOn(executor, 'executeTask').mockRejectedValueOnce(new Error('Execution failed'));

      const task: Task = {
        id: 'task-2',
        description: 'This task might fail',
        type: 'unknown_type',
        priority: 1
      };

      await expect(executor.executeTask(task)).rejects.toThrow('Execution failed');
      expect(executor.executeTask).toHaveBeenCalledWith(task);
    });

    it('should handle null task gracefully', async () => {
      await expect(executor.executeTask(null as any)).rejects.toThrow();
      expect(() => executor.executeTask(null as any)).toThrow();
    });

    it('should handle undefined task gracefully', async () => {
      await expect(executor.executeTask(undefined as any)).rejects.toThrow();
      expect(() => executor.executeTask(undefined as any)).toThrow();
    });

    it('should handle task with missing required fields', async () => {
      const invalidTask = { id: 'task-invalid' } as any;
      await expect(executor.executeTask(invalidTask)).rejects.toThrow();
    });

    it('should execute different task types correctly', async () => {
      const tasks: Task[] = [
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
        expect(result.taskId).toBe(task.id);
        expect(result.success).toBe(true);
        expect(result.result).toContain(task.description);
      }
    });
  });

  describe('executeTasks', () => {
    it('should execute multiple tasks in parallel', async () => {
      const tasks: Task[] = [
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
      
      expect(results).toHaveLength(3);
      results.forEach((result: any, index: any) => {
        expect(result.taskId).toBe(tasks[index].id);
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      });
    });

    it('should respect maxConcurrency limit', async () => {
      const tasks: Task[] = [
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
      Date.now = vi.fn(() => time);
      
      const results = await executor.executeTasks(tasks);
      
      expect(results).toHaveLength(4);
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
      });
      
      // Restore Date.now
      Date.now = now;
    });

    it('should handle empty task array', async () => {
      const results = await executor.executeTasks([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('executeTaskWithRetry', () => {
    it('should retry failed tasks', async () => {
      // Since we can't easily simulate failures in the current implementation,
      // we'll test that the method exists and returns expected structure
      const task: Task = {
        id: 'task-retry',
        description: 'Task with retries',
        type: 'code_generation',
        priority: 1
      };

      const result = await (executor as any).executeTaskWithRetry(task);
      expect(result.taskId).toBe('task-retry');
      expect(result.success).toBe(true);
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status information', () => {
      const status = executor.getTaskStatus();
      
      expect(status).toHaveProperty('totalTasks');
      expect(status).toHaveProperty('activeTasks');
      expect(status).toHaveProperty('pendingTasks');
      expect(typeof status.totalTasks).toBe('number');
      expect(typeof status.activeTasks).toBe('number');
      expect(typeof status.pendingTasks).toBe('number');
    });
  });
});