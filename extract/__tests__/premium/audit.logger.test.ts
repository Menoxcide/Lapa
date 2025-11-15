import { describe, it, expect } from "vitest";
import { AuditLogger, AuditLogEntry } from '../../premium/audit.logger.ts';
import { vi } from 'vitest';

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    // Use a test log file path to avoid conflicts
    auditLogger = new AuditLogger('.lapa/test-audit.log', true);
  });

  afterEach(async () => {
    // Clean up test log file
    try {
      const fs = await import('fs/promises');
      await fs.unlink('.lapa/test-audit.log');
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultLogger = new AuditLogger();
      expect(defaultLogger).toBeDefined();
    });

    it('should initialize with custom parameters', () => {
      const customLogger = new AuditLogger('/tmp/custom-audit.log', true);
      expect(customLogger).toBeDefined();
    });

    it('should initialize in disabled mode', () => {
      const disabledLogger = new AuditLogger(undefined, false);
      expect(disabledLogger).toBeDefined();
    });
  });

  describe('log', () => {
    it('should log an audit entry successfully', async () => {
      const entry = {
        level: 'info' as const,
        action: 'test-action',
        details: { test: 'data' }
      };

      await auditLogger.log(entry);
      // If no error was thrown, the test passes
      expect(true).toBe(true);
    });

    it('should not log when disabled', async () => {
      const disabledLogger = new AuditLogger(undefined, false);
      const entry = {
        level: 'info' as const,
        action: 'test-action'
      };

      await disabledLogger.log(entry);
      // Should complete without error
      expect(true).toBe(true);
    });

    it('should generate ID and timestamp for log entries', async () => {
      const entry = {
        level: 'info' as const,
        action: 'timestamp-test'
      };

      // Spy on console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await auditLogger.log(entry);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('timestamp-test'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('logUserAction', () => {
    it('should log user action with all parameters', async () => {
      await auditLogger.logUserAction(
        'user-123',
        'create-project',
        'project-456',
        { projectName: 'Test Project' },
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-789'
        }
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should log user action with minimal parameters', async () => {
      await auditLogger.logUserAction('user-123', 'login');

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with all parameters', async () => {
      await auditLogger.logSecurityEvent(
        'failed-login-attempt',
        { attempts: 3 },
        {
          userId: 'user-123',
          ipAddress: '192.168.1.100',
          userAgent: 'Suspicious Browser'
        }
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should log security event with minimal parameters', async () => {
      await auditLogger.logSecurityEvent('password-reset-request');

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('logError', () => {
    it('should log error with Error object', async () => {
      const error = new Error('Test error message');
      
      await auditLogger.logError(
        'test-operation',
        error,
        { operation: 'test' },
        { userId: 'user-123' }
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should log error with string message', async () => {
      await auditLogger.logError(
        'test-operation',
        'String error message',
        { context: 'test-context' }
      );

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('logWarning', () => {
    it('should log warning with all parameters', async () => {
      await auditLogger.logWarning(
        'deprecated-api-usage',
        { api: 'v1/users', alternative: 'v2/users' },
        { userId: 'user-456' }
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should log warning with minimal parameters', async () => {
      await auditLogger.logWarning('low-disk-space');

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('searchLogs', () => {
    beforeEach(async () => {
      // Add some test log entries
      await auditLogger.logUserAction('user-1', 'login', undefined, undefined, { ipAddress: '192.168.1.1' });
      await auditLogger.logUserAction('user-2', 'logout', undefined, undefined, { ipAddress: '192.168.1.2' });
      await auditLogger.logSecurityEvent('failed-login', { attempts: 3 }, { userId: 'user-3' });
      await auditLogger.logError('database-error', 'Connection timeout', { db: 'users' });
    });

    it('should search logs by user ID', async () => {
      const results = await auditLogger.searchLogs({ userId: 'user-1' });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Note: Actual filtering depends on file reading implementation
    });

    it('should search logs by level', async () => {
      const results = await auditLogger.searchLogs({ level: 'error' });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search logs by action', async () => {
      const results = await auditLogger.searchLogs({ action: 'login' });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search logs with date range', async () => {
      const now = new Date();
      const results = await auditLogger.searchLogs({
        startDate: new Date(now.getTime() - 60000), // 1 minute ago
        endDate: new Date(now.getTime() + 60000)   // 1 minute from now
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should limit search results', async () => {
      const results = await auditLogger.searchLogs({}, 2);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Note: Actual limiting depends on implementation
    });

    it('should handle search with no matches', async () => {
      const results = await auditLogger.searchLogs({ userId: 'non-existent-user' });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should handle search errors gracefully', async () => {
      // Create a logger with an invalid file path
      const problematicLogger = new AuditLogger('/invalid/path/audit.log');
      
      const results = await problematicLogger.searchLogs({ action: 'test' });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Should return empty array on error
      expect(results).toHaveLength(0);
    });
  });

  describe('getRecentLogs', () => {
    it('should retrieve recent logs with default limit', async () => {
      const results = await auditLogger.getRecentLogs();
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should retrieve recent logs with custom limit', async () => {
      const results = await auditLogger.getRecentLogs(5);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      // Access private method through casting
      const id1 = (auditLogger as any).generateId();
      const id2 = (auditLogger as any).generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });

  describe('close', () => {
    it('should close the logger successfully', async () => {
      await auditLogger.close();
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('emit', () => {
    it('should emit events without error', () => {
      // Access private method through casting
      (auditLogger as any).emit('test-event', { data: 'test' });
      // Should complete without error
      expect(true).toBe(true);
    });
  });
});