/**
 * Tests for Git Commit Message Generator
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GitCommitMessageGenerator, generateCommitMessage, type CommitMessageOptions } from '../git-commit-generator.js';
import type { AgentToolExecutionContext } from '../../core/agent-tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mock exec to avoid actual git commands in tests
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

describe('GitCommitMessageGenerator', () => {
  let generator: GitCommitMessageGenerator;
  let mockExec: any;

  beforeEach(() => {
    generator = new GitCommitMessageGenerator();
    mockExec = vi.mocked(exec);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      expect(generator.validateParameters({})).toBe(true);
      expect(generator.validateParameters({ format: 'conventional' })).toBe(true);
      expect(generator.validateParameters({ format: 'descriptive' })).toBe(true);
      expect(generator.validateParameters({ maxLength: 100 })).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(generator.validateParameters({ format: 'invalid' })).toBe(false);
    });

    it('should reject invalid maxLength', () => {
      expect(generator.validateParameters({ maxLength: 5 })).toBe(false);
      expect(generator.validateParameters({ maxLength: 'not-a-number' })).toBe(false);
    });
  });

  describe('execute', () => {
    const mockContext: AgentToolExecutionContext = {
      taskId: 'test-task-1',
      agentId: 'test-agent',
      parameters: {}
    };

    it('should return error when no git changes detected', async () => {
      // Mock empty git diff
      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: '', stderr: '' });
        } else if (cmd.includes('git diff')) {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      const result = await generator.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No changes detected');
    });

    it('should generate commit message for feature changes', async () => {
      const mockDiff = `diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,3 +1,5 @@
+export function authenticateUser(username: string, password: string) {
+  // Authentication logic
+}`;

      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiff, stderr: '' });
        }
      });

      const result = await generator.execute({
        ...mockContext,
        parameters: { format: 'conventional', useConventionalCommits: true }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.commitMessage).toBeDefined();
      expect(result.data?.subject).toBeDefined();
      expect(result.data?.subject).toMatch(/^(feat|fix|refactor|test|docs|style|perf)(\(.+\))?:/);
    });

    it('should handle git repository errors gracefully', async () => {
      mockExec.mockImplementation((cmd: string, callback: any) => {
        callback(new Error('not a git repository'), { stdout: '', stderr: 'fatal: not a git repository' });
      });

      const result = await generator.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get git diff');
    });

    it('should generate descriptive format when requested', async () => {
      const mockDiff = `diff --git a/src/utils.ts b/src/utils.ts
index 1234567..abcdefg 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,3 +1,5 @@
+export function formatDate(date: Date): string {
+  return date.toISOString();
+}`;

      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiff, stderr: '' });
        }
      });

      const result = await generator.execute({
        ...mockContext,
        parameters: { format: 'descriptive', useConventionalCommits: false }
      });

      expect(result.success).toBe(true);
      expect(result.data?.commitMessage).toBeDefined();
      expect(result.data?.subject).not.toMatch(/^(feat|fix|refactor):/);
    });

    it('should include body when includeBody is true', async () => {
      const mockDiff = `diff --git a/src/test.ts b/src/test.ts
index 1234567..abcdefg 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,5 @@
+describe('test suite', () => {
+  it('should pass', () => {});
+});`;

      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiff, stderr: '' });
        }
      });

      const result = await generator.execute({
        ...mockContext,
        parameters: { includeBody: true }
      });

      expect(result.success).toBe(true);
      expect(result.data?.body).toBeDefined();
      expect(result.data?.fullMessage).toContain('\n\n');
    });

    it('should respect maxLength parameter', async () => {
      const mockDiff = `diff --git a/src/file.ts b/src/file.ts
index 1234567..abcdefg 100644
--- a/src/file.ts
+++ b/src/file.ts
@@ -1,3 +1,5 @@
+export function veryLongFunctionNameThatExceedsMaximumLength() {
+  return true;
+}`;

      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiff, stderr: '' });
        }
      });

      const result = await generator.execute({
        ...mockContext,
        parameters: { maxLength: 20 }
      });

      expect(result.success).toBe(true);
      expect(result.data?.subject.length).toBeLessThanOrEqual(20);
    });
  });

  describe('standalone generateCommitMessage', () => {
    it('should generate commit message without agent context', async () => {
      const mockDiff = `diff --git a/src/index.ts b/src/index.ts
index 1234567..abcdefg 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,5 @@
+export const VERSION = '1.0.0';`;

      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiff, stderr: '' });
        }
      });

      const result = await generateCommitMessage({ format: 'conventional' });

      expect(result.subject).toBeDefined();
      expect(result.fullMessage).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});

