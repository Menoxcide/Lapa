/**
 * Audit Logging System for LAPA Premium
 *
 * This module provides comprehensive audit logging for tracking system events,
 * user actions, and security-related activities in LAPA Core.
 */
import { EventEmitter } from 'events';
/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'security';
    userId?: string;
    action: string;
    resource?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}
/**
 * Audit Logger class
 */
export declare class AuditLogger extends EventEmitter {
    private logFilePath;
    private logStream;
    private enabled;
    private buffer;
    private bufferSize;
    private flushTimeout;
    private flushInterval;
    private logLevels;
    constructor(logFilePath?: string, enabled?: boolean, logLevels?: string[]);
    /**
     * Initializes the log stream
     */
    private initializeLogStream;
    /**
     * Logs an audit entry
     * @param entry Audit log entry
     */
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Logs a user action
     * @param userId User ID
     * @param action Action performed
     * @param resource Resource affected
     * @param details Additional details
     * @param metadata Request metadata
     */
    logUserAction(userId: string, action: string, resource?: string, details?: Record<string, any>, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    /**
     * Logs a security event
     * @param action Security action
     * @param details Additional details
     * @param metadata Request metadata
     */
    logSecurityEvent(action: string, details?: Record<string, any>, metadata?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    /**
     * Logs an error event
     * @param action Error action
     * @param error Error object or message
     * @param details Additional details
     * @param metadata Request metadata
     */
    logError(action: string, error: Error | string, details?: Record<string, any>, metadata?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    /**
     * Logs a warning event
     * @param action Warning action
     * @param details Additional details
     * @param metadata Request metadata
     */
    logWarning(action: string, details?: Record<string, any>, metadata?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    /**
     * Searches audit logs by criteria
     * @param criteria Search criteria
     * @param limit Maximum number of results
     * @returns Matching audit log entries
     */
    searchLogs(criteria: {
        userId?: string;
        level?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Gets recent audit logs
     * @param limit Number of recent logs to retrieve
     * @returns Recent audit log entries
     */
    getRecentLogs(limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Generates a unique ID for log entries
     * @returns Unique ID
     */
    private generateId;
    /**
     * Flushes the buffer to the log file
     */
    private flushBuffer;
    /**
     * Ensures all buffered logs are written before closing
     */
    close(): Promise<void>;
    /**
     * Emits an event (simplified implementation)
     * @param event Event name
     * @param data Event data
     */
    private emit;
}
export declare const auditLogger: AuditLogger;
