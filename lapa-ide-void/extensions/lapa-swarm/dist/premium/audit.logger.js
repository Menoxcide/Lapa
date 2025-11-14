"use strict";
/**
 * Audit Logging System for LAPA Premium
 *
 * This module provides comprehensive audit logging for tracking system events,
 * user actions, and security-related activities in LAPA Core.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = void 0;
// Import necessary modules
const fs_1 = require("fs");
const path_1 = require("path");
const events_1 = require("events");
/**
 * Audit Logger class
 */
class AuditLogger extends events_1.EventEmitter {
    logFilePath;
    logStream;
    enabled;
    buffer;
    bufferSize;
    flushTimeout;
    flushInterval;
    logLevels;
    constructor(logFilePath, enabled = true, logLevels) {
        super();
        this.logFilePath = logFilePath || process.env.AUDIT_LOG_FILE_PATH || (0, path_1.join)('.lapa', 'audit.log');
        this.enabled = enabled;
        this.buffer = [];
        this.bufferSize = 100; // Flush after 100 entries
        this.flushTimeout = null;
        this.flushInterval = 5000; // Flush after 5 seconds
        // Set default log levels or use provided ones
        this.logLevels = new Set(logLevels || ['info', 'warn', 'error', 'security']);
        // Create log stream if enabled
        if (this.enabled) {
            this.initializeLogStream();
        }
    }
    /**
     * Initializes the log stream
     */
    async initializeLogStream() {
        try {
            // Ensure log directory exists
            const logDir = (0, path_1.join)(this.logFilePath, '..');
            await fs_1.promises.mkdir(logDir, { recursive: true });
            // Create write stream
            this.logStream = (0, fs_1.createWriteStream)(this.logFilePath, { flags: 'a' });
        }
        catch (error) {
            console.error('Failed to initialize audit log stream:', error);
        }
    }
    /**
     * Logs an audit entry
     * @param entry Audit log entry
     */
    async log(entry) {
        if (!this.enabled) {
            return;
        }
        // Check if log level is enabled
        if (!this.logLevels.has(entry.level)) {
            return;
        }
        try {
            const logEntry = {
                id: this.generateId(),
                timestamp: new Date(),
                ...entry,
            };
            // Add to buffer instead of writing directly
            this.buffer.push(JSON.stringify(logEntry));
            // Flush buffer if it reaches the size limit
            if (this.buffer.length >= this.bufferSize) {
                await this.flushBuffer();
            }
            else if (!this.flushTimeout) {
                // Schedule a flush if not already scheduled
                this.flushTimeout = setTimeout(() => {
                    this.flushBuffer();
                }, this.flushInterval);
            }
            // Also log to console for immediate visibility
            console.log(`[AUDIT] ${logEntry.level.toUpperCase()} - ${logEntry.action} - ${logEntry.timestamp.toISOString()}`);
            // Emit event for real-time monitoring
            this.emit('auditLogged', logEntry);
        }
        catch (error) {
            console.error('Failed to log audit entry:', error);
        }
    }
    /**
     * Logs a user action
     * @param userId User ID
     * @param action Action performed
     * @param resource Resource affected
     * @param details Additional details
     * @param metadata Request metadata
     */
    async logUserAction(userId, action, resource, details, metadata) {
        await this.log({
            level: 'info',
            userId,
            action,
            resource,
            details,
            ...metadata,
        });
    }
    /**
     * Logs a security event
     * @param action Security action
     * @param details Additional details
     * @param metadata Request metadata
     */
    async logSecurityEvent(action, details, metadata) {
        await this.log({
            level: 'security',
            action,
            details,
            ...metadata,
        });
    }
    /**
     * Logs an error event
     * @param action Error action
     * @param error Error object or message
     * @param details Additional details
     * @param metadata Request metadata
     */
    async logError(action, error, details, metadata) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorStack = typeof error === 'string' ? undefined : error.stack;
        await this.log({
            level: 'error',
            action,
            details: {
                error: errorMessage,
                stack: errorStack,
                ...details,
            },
            ...metadata,
        });
    }
    /**
     * Logs a warning event
     * @param action Warning action
     * @param details Additional details
     * @param metadata Request metadata
     */
    async logWarning(action, details, metadata) {
        await this.log({
            level: 'warn',
            action,
            details,
            ...metadata,
        });
    }
    /**
     * Searches audit logs by criteria
     * @param criteria Search criteria
     * @param limit Maximum number of results
     * @returns Matching audit log entries
     */
    async searchLogs(criteria, limit = 100) {
        try {
            // Read log file
            const logData = await fs_1.promises.readFile(this.logFilePath, 'utf8');
            const logLines = logData.split('\n').filter(line => line.trim() !== '');
            // Parse and filter logs
            const logs = [];
            for (const line of logLines) {
                try {
                    const entry = JSON.parse(line);
                    // Apply filters
                    if (criteria.userId && entry.userId !== criteria.userId)
                        continue;
                    if (criteria.level && entry.level !== criteria.level)
                        continue;
                    if (criteria.action && entry.action !== criteria.action)
                        continue;
                    if (criteria.startDate && entry.timestamp < criteria.startDate)
                        continue;
                    if (criteria.endDate && entry.timestamp > criteria.endDate)
                        continue;
                    logs.push(entry);
                    // Limit results
                    if (logs.length >= limit)
                        break;
                }
                catch (parseError) {
                    // Skip invalid log entries
                    continue;
                }
            }
            // Sort by timestamp descending
            logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return logs;
        }
        catch (error) {
            console.error('Failed to search audit logs:', error);
            return [];
        }
    }
    /**
     * Gets recent audit logs
     * @param limit Number of recent logs to retrieve
     * @returns Recent audit log entries
     */
    async getRecentLogs(limit = 50) {
        return this.searchLogs({}, limit);
    }
    /**
     * Generates a unique ID for log entries
     * @returns Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    /**
     * Flushes the buffer to the log file
     */
    async flushBuffer() {
        if (this.buffer.length === 0)
            return;
        try {
            // Clear the flush timeout
            if (this.flushTimeout) {
                clearTimeout(this.flushTimeout);
                this.flushTimeout = null;
            }
            // Write all buffered entries
            if (this.logStream) {
                const dataToWrite = this.buffer.join('\n') + '\n';
                this.logStream.write(dataToWrite);
            }
            // Clear the buffer
            this.buffer = [];
        }
        catch (error) {
            console.error('Failed to flush audit log buffer:', error);
        }
    }
    /**
     * Ensures all buffered logs are written before closing
     */
    async close() {
        // Flush any remaining buffered entries
        await this.flushBuffer();
        // Clear any pending timeouts
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout);
            this.flushTimeout = null;
        }
        // Close the log stream
        if (this.logStream) {
            this.logStream.end();
        }
    }
}
exports.AuditLogger = AuditLogger;
// Export singleton instance
exports.auditLogger = new AuditLogger();
//# sourceMappingURL=audit.logger.js.map