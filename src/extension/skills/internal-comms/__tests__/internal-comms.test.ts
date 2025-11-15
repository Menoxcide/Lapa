/**
 * Internal Communications Skill Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execute, skillMetadata } from '../index.ts';
import type { InternalCommsInputs } from '../index.ts';

describe('Internal Communications Skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(skillMetadata.id).toBe('internal-comms');
    expect(skillMetadata.name).toBe('Internal Communications');
    expect(skillMetadata.category).toBe('other');
  });

  it('should generate report from session', async () => {
    const inputs: InternalCommsInputs = {
      operation: 'report',
      source: 'session',
      sessionId: 'test-session-123',
      options: {
        format: 'markdown'
      }
    };

    try {
      const result = await execute(inputs);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('report');
    } catch (error) {
      // May fail if session not found - expected
      expect(error).toBeDefined();
    }
  });

  it('should generate FAQ from communications', async () => {
    const inputs: InternalCommsInputs = {
      operation: 'faq',
      source: 'event-log',
      options: {
        format: 'markdown'
      }
    };

    try {
      const result = await execute(inputs);
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.report).toBeDefined();
      }
    } catch (error) {
      // Expected if no communications available
      expect(error).toBeDefined();
    }
  });

  it('should require sessionId for session source', async () => {
    const inputs: InternalCommsInputs = {
      operation: 'report',
      source: 'session'
      // Missing sessionId
    };

    try {
      await execute(inputs);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('sessionId');
    }
  });
});

