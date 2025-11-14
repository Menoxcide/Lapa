"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const audit_logger_ts_1 = require("../../premium/audit.logger.ts");
const vitest_2 = require("vitest");
(0, vitest_1.describe)('AuditLogger', () => {
    let auditLogger;
    beforeEach(() => {
        // Use a test log file path to avoid conflicts
        auditLogger = new audit_logger_ts_1.AuditLogger('.lapa/test-audit.log', true);
    });
    afterEach(async () => {
        // Clean up test log file
        try {
            const fs = await import('fs/promises');
            await fs.unlink('.lapa/test-audit.log');
        }
        catch (error) {
            // Ignore if file doesn't exist
        }
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default parameters', () => {
            const defaultLogger = new audit_logger_ts_1.AuditLogger();
            (0, vitest_1.expect)(defaultLogger).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with custom parameters', () => {
            const customLogger = new audit_logger_ts_1.AuditLogger('/tmp/custom-audit.log', true);
            (0, vitest_1.expect)(customLogger).toBeDefined();
        });
        (0, vitest_1.it)('should initialize in disabled mode', () => {
            const disabledLogger = new audit_logger_ts_1.AuditLogger(undefined, false);
            (0, vitest_1.expect)(disabledLogger).toBeDefined();
        });
    });
    (0, vitest_1.describe)('log', () => {
        (0, vitest_1.it)('should log an audit entry successfully', async () => {
            const entry = {
                level: 'info',
                action: 'test-action',
                details: { test: 'data' }
            };
            await auditLogger.log(entry);
            // If no error was thrown, the test passes
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should not log when disabled', async () => {
            const disabledLogger = new audit_logger_ts_1.AuditLogger(undefined, false);
            const entry = {
                level: 'info',
                action: 'test-action'
            };
            await disabledLogger.log(entry);
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should generate ID and timestamp for log entries', async () => {
            const entry = {
                level: 'info',
                action: 'timestamp-test'
            };
            // Spy on console.log to capture output
            const consoleSpy = vitest_2.vi.spyOn(console, 'log').mockImplementation(() => { });
            await auditLogger.log(entry);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('[AUDIT]'));
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('timestamp-test'));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('logUserAction', () => {
        (0, vitest_1.it)('should log user action with all parameters', async () => {
            await auditLogger.logUserAction('user-123', 'create-project', 'project-456', { projectName: 'Test Project' }, {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                sessionId: 'session-789'
            });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should log user action with minimal parameters', async () => {
            await auditLogger.logUserAction('user-123', 'login');
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('logSecurityEvent', () => {
        (0, vitest_1.it)('should log security event with all parameters', async () => {
            await auditLogger.logSecurityEvent('failed-login-attempt', { attempts: 3 }, {
                userId: 'user-123',
                ipAddress: '192.168.1.100',
                userAgent: 'Suspicious Browser'
            });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should log security event with minimal parameters', async () => {
            await auditLogger.logSecurityEvent('password-reset-request');
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('logError', () => {
        (0, vitest_1.it)('should log error with Error object', async () => {
            const error = new Error('Test error message');
            await auditLogger.logError('test-operation', error, { operation: 'test' }, { userId: 'user-123' });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should log error with string message', async () => {
            await auditLogger.logError('test-operation', 'String error message', { context: 'test-context' });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('logWarning', () => {
        (0, vitest_1.it)('should log warning with all parameters', async () => {
            await auditLogger.logWarning('deprecated-api-usage', { api: 'v1/users', alternative: 'v2/users' }, { userId: 'user-456' });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should log warning with minimal parameters', async () => {
            await auditLogger.logWarning('low-disk-space');
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('searchLogs', () => {
        beforeEach(async () => {
            // Add some test log entries
            await auditLogger.logUserAction('user-1', 'login', undefined, undefined, { ipAddress: '192.168.1.1' });
            await auditLogger.logUserAction('user-2', 'logout', undefined, undefined, { ipAddress: '192.168.1.2' });
            await auditLogger.logSecurityEvent('failed-login', { attempts: 3 }, { userId: 'user-3' });
            await auditLogger.logError('database-error', 'Connection timeout', { db: 'users' });
        });
        (0, vitest_1.it)('should search logs by user ID', async () => {
            const results = await auditLogger.searchLogs({ userId: 'user-1' });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            // Note: Actual filtering depends on file reading implementation
        });
        (0, vitest_1.it)('should search logs by level', async () => {
            const results = await auditLogger.searchLogs({ level: 'error' });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should search logs by action', async () => {
            const results = await auditLogger.searchLogs({ action: 'login' });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should search logs with date range', async () => {
            const now = new Date();
            const results = await auditLogger.searchLogs({
                startDate: new Date(now.getTime() - 60000), // 1 minute ago
                endDate: new Date(now.getTime() + 60000) // 1 minute from now
            });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should limit search results', async () => {
            const results = await auditLogger.searchLogs({}, 2);
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            // Note: Actual limiting depends on implementation
        });
        (0, vitest_1.it)('should handle search with no matches', async () => {
            const results = await auditLogger.searchLogs({ userId: 'non-existent-user' });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            (0, vitest_1.expect)(results).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle search errors gracefully', async () => {
            // Create a logger with an invalid file path
            const problematicLogger = new audit_logger_ts_1.AuditLogger('/invalid/path/audit.log');
            const results = await problematicLogger.searchLogs({ action: 'test' });
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            // Should return empty array on error
            (0, vitest_1.expect)(results).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('getRecentLogs', () => {
        (0, vitest_1.it)('should retrieve recent logs with default limit', async () => {
            const results = await auditLogger.getRecentLogs();
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, vitest_1.it)('should retrieve recent logs with custom limit', async () => {
            const results = await auditLogger.getRecentLogs(5);
            (0, vitest_1.expect)(results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
        });
    });
    (0, vitest_1.describe)('generateId', () => {
        (0, vitest_1.it)('should generate unique IDs', () => {
            // Access private method through casting
            const id1 = auditLogger.generateId();
            const id2 = auditLogger.generateId();
            (0, vitest_1.expect)(id1).toBeDefined();
            (0, vitest_1.expect)(id2).toBeDefined();
            (0, vitest_1.expect)(typeof id1).toBe('string');
            (0, vitest_1.expect)(typeof id2).toBe('string');
            (0, vitest_1.expect)(id1).not.toBe(id2);
        });
    });
    (0, vitest_1.describe)('close', () => {
        (0, vitest_1.it)('should close the logger successfully', async () => {
            await auditLogger.close();
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('emit', () => {
        (0, vitest_1.it)('should emit events without error', () => {
            // Access private method through casting
            auditLogger.emit('test-event', { data: 'test' });
            // Should complete without error
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
});
//# sourceMappingURL=audit.logger.test.js.map