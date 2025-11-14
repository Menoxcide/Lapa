"use strict";
/**
 * Local Resource Manager for AutoGen Core
 *
 * This module provides resource monitoring and management capabilities for the AutoGen Core framework.
 * It tracks system resources like CPU, memory, and disk usage, and provides mechanisms to optimize
 * resource allocation for local inference engines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoGenResourceManager = exports.AutoGenResourceManager = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const exec = (0, util_1.promisify)(child_process_1.exec);
// Default configuration
const DEFAULT_CONFIG = {
    monitoringIntervalMs: 5000, // 5 seconds
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 90,
    enableAdaptiveScaling: true,
    enableResourceThrottling: true,
    resourceThrottlingThreshold: 75
};
/**
 * LAPA AutoGen Resource Manager Class
 */
class AutoGenResourceManager {
    config;
    isMonitoring = false;
    monitoringInterval = null;
    currentUsage = null;
    constraintLevel = 'none';
    resourceAlerts = [];
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Initializes the resource manager
     * @returns Promise that resolves when initialization is complete
     */
    async initialize() {
        try {
            console.log('Initializing AutoGen Resource Manager...');
            // Perform initial resource check
            await this.updateResourceUsage();
            // Start monitoring if enabled
            if (this.config.monitoringIntervalMs > 0) {
                this.startMonitoring();
            }
            console.log('AutoGen Resource Manager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize AutoGen Resource Manager:', error);
            throw error;
        }
    }
    /**
     * Starts resource monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.updateResourceUsage().catch(error => {
                console.error('Error during resource monitoring:', error);
            });
        }, this.config.monitoringIntervalMs);
        console.log('Resource monitoring started');
    }
    /**
     * Stops resource monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('Resource monitoring stopped');
    }
    /**
     * Updates current resource usage information
     * @returns Promise that resolves when update is complete
     */
    async updateResourceUsage() {
        try {
            const timestamp = new Date();
            // Get CPU usage
            const cpuUsage = await this.getCPUUsage();
            // Get memory usage
            const memoryUsage = await this.getMemoryUsage();
            // Get disk usage
            const diskUsage = await this.getDiskUsage();
            // Update current usage
            this.currentUsage = {
                cpu: cpuUsage,
                memory: memoryUsage,
                disk: diskUsage,
                timestamp
            };
            // Update constraint level based on resource usage
            this.updateConstraintLevel();
            // Check for resource alerts
            this.checkResourceAlerts();
            // Apply adaptive scaling if enabled
            if (this.config.enableAdaptiveScaling) {
                this.applyAdaptiveScaling();
            }
        }
        catch (error) {
            console.error('Failed to update resource usage:', error);
            throw error;
        }
    }
    /**
     * Gets CPU usage information
     * @returns Promise that resolves with CPU usage information
     */
    async getCPUUsage() {
        // On Windows, we'll use wmic to get CPU information
        // On Unix-like systems, we'll use os module or other methods
        try {
            // Try to get CPU info using wmic (Windows)
            const { stdout } = await exec('wmic cpu get loadpercentage /value');
            const lines = stdout.trim().split('\n');
            let loadPercentage = 0;
            for (const line of lines) {
                if (line.startsWith('LoadPercentage=')) {
                    loadPercentage = parseInt(line.split('=')[1], 10);
                    break;
                }
            }
            // Get number of cores
            const cores = require('os').cpus().length;
            // Get load average (Unix-like systems only)
            const loadAverage = require('os').loadavg();
            return {
                usagePercent: loadPercentage,
                cores,
                loadAverage
            };
        }
        catch (error) {
            // Fallback for systems where wmic is not available
            const cores = require('os').cpus().length;
            const loadAverage = require('os').loadavg();
            // Estimate CPU usage based on load average
            const estimatedUsage = Math.min(100, Math.round((loadAverage[0] / cores) * 100));
            return {
                usagePercent: estimatedUsage,
                cores,
                loadAverage
            };
        }
    }
    /**
     * Gets memory usage information
     * @returns Promise that resolves with memory usage information
     */
    async getMemoryUsage() {
        const os = require('os');
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const usagePercent = Math.round((used / total) * 100);
        return {
            total,
            used,
            free,
            usagePercent
        };
    }
    /**
     * Gets disk usage information
     * @returns Promise that resolves with disk usage information
     */
    async getDiskUsage() {
        try {
            // Try to get disk info using fs.statfs (Node.js 19+)
            const fs = require('fs');
            if (fs.statfs) {
                const statfs = (0, util_1.promisify)(fs.statfs);
                const stats = await statfs('.');
                const total = stats.blocks * stats.bsize;
                const free = stats.bfree * stats.bsize;
                const used = total - free;
                const usagePercent = Math.round((used / total) * 100);
                return {
                    total,
                    used,
                    free,
                    usagePercent
                };
            }
            else {
                // Fallback for older Node.js versions
                // On Windows, we'll use a simple estimation
                // On Unix-like systems, we could use df command
                // Simple estimation based on OS memory
                const os = require('os');
                const total = os.totalmem() * 10; // Rough estimate: 10x memory as disk space
                const free = os.freemem() * 5; // Rough estimate: 5x free memory as free disk space
                const used = total - free;
                const usagePercent = Math.round((used / total) * 100);
                return {
                    total,
                    used,
                    free,
                    usagePercent
                };
            }
        }
        catch (error) {
            // Final fallback
            const os = require('os');
            const total = os.totalmem() * 10;
            const free = os.freemem() * 5;
            const used = total - free;
            const usagePercent = Math.round((used / total) * 100);
            return {
                total,
                used,
                free,
                usagePercent
            };
        }
    }
    /**
     * Updates the constraint level based on current resource usage
     */
    updateConstraintLevel() {
        if (!this.currentUsage) {
            this.constraintLevel = 'none';
            return;
        }
        const { cpu, memory, disk } = this.currentUsage;
        // Determine the highest resource usage percentage
        const maxUsage = Math.max(cpu.usagePercent, memory.usagePercent, disk.usagePercent);
        if (maxUsage >= this.config.diskThreshold) {
            this.constraintLevel = 'high';
        }
        else if (maxUsage >= this.config.memoryThreshold) {
            this.constraintLevel = 'medium';
        }
        else if (maxUsage >= this.config.cpuThreshold) {
            this.constraintLevel = 'low';
        }
        else {
            this.constraintLevel = 'none';
        }
    }
    /**
     * Checks for resource alerts based on thresholds
     */
    checkResourceAlerts() {
        if (!this.currentUsage) {
            return;
        }
        const { cpu, memory, disk } = this.currentUsage;
        const timestamp = this.currentUsage.timestamp.toISOString();
        const newAlerts = [];
        if (cpu.usagePercent >= this.config.cpuThreshold) {
            newAlerts.push(`[${timestamp}] CPU usage high: ${cpu.usagePercent}%`);
        }
        if (memory.usagePercent >= this.config.memoryThreshold) {
            newAlerts.push(`[${timestamp}] Memory usage high: ${memory.usagePercent}%`);
        }
        if (disk.usagePercent >= this.config.diskThreshold) {
            newAlerts.push(`[${timestamp}] Disk usage high: ${disk.usagePercent}%`);
        }
        // Add new alerts to the list
        this.resourceAlerts.push(...newAlerts);
        // Keep only the last 100 alerts
        if (this.resourceAlerts.length > 100) {
            this.resourceAlerts = this.resourceAlerts.slice(-100);
        }
        // Log alerts
        if (newAlerts.length > 0) {
            console.warn('Resource alerts:', newAlerts);
        }
    }
    /**
     * Applies adaptive scaling based on resource constraints
     */
    applyAdaptiveScaling() {
        switch (this.constraintLevel) {
            case 'high':
                console.log('Applying high constraint adaptive scaling');
                // Reduce concurrency, lower model quality, etc.
                break;
            case 'medium':
                console.log('Applying medium constraint adaptive scaling');
                // Moderate adjustments to resource usage
                break;
            case 'low':
                console.log('Applying low constraint adaptive scaling');
                // Minor adjustments to resource usage
                break;
            default:
                // No constraints, normal operation
                break;
        }
    }
    /**
     * Gets current resource usage
     * @returns Current resource usage or null if not available
     */
    getCurrentUsage() {
        return this.currentUsage ? { ...this.currentUsage } : null;
    }
    /**
     * Gets current constraint level
     * @returns Current constraint level
     */
    getConstraintLevel() {
        return this.constraintLevel;
    }
    /**
     * Gets recent resource alerts
     * @param limit Maximum number of alerts to return
     * @returns Array of recent resource alerts
     */
    getResourceAlerts(limit = 10) {
        return this.resourceAlerts.slice(-limit);
    }
    /**
     * Checks if resource throttling should be applied
     * @returns Boolean indicating if throttling should be applied
     */
    shouldApplyThrottling() {
        if (!this.config.enableResourceThrottling) {
            return false;
        }
        if (!this.currentUsage) {
            return false;
        }
        const { cpu, memory, disk } = this.currentUsage;
        const maxUsage = Math.max(cpu.usagePercent, memory.usagePercent, disk.usagePercent);
        return maxUsage >= this.config.resourceThrottlingThreshold;
    }
    /**
     * Gets recommended resource allocation adjustments
     * @returns Object with recommended adjustments
     */
    getRecommendedAdjustments() {
        const baseConcurrency = 10; // Base concurrency level
        const baseBatchSize = 1; // Base batch size
        switch (this.constraintLevel) {
            case 'high':
                return {
                    maxConcurrency: Math.max(1, Math.floor(baseConcurrency * 0.25)),
                    modelQuality: 'low',
                    batchSize: 1
                };
            case 'medium':
                return {
                    maxConcurrency: Math.max(1, Math.floor(baseConcurrency * 0.5)),
                    modelQuality: 'medium',
                    batchSize: Math.max(1, Math.floor(baseBatchSize * 0.75))
                };
            case 'low':
                return {
                    maxConcurrency: Math.max(1, Math.floor(baseConcurrency * 0.75)),
                    modelQuality: 'high',
                    batchSize: Math.max(1, Math.floor(baseBatchSize * 0.9))
                };
            default:
                return {
                    maxConcurrency: baseConcurrency,
                    modelQuality: 'high',
                    batchSize: baseBatchSize
                };
        }
    }
    /**
     * Cleans up resources when shutting down
     */
    async shutdown() {
        try {
            this.stopMonitoring();
            console.log('AutoGen Resource Manager shut down successfully');
        }
        catch (error) {
            console.error('Error during resource manager shutdown:', error);
            throw error;
        }
    }
}
exports.AutoGenResourceManager = AutoGenResourceManager;
// Default export for convenience
exports.autoGenResourceManager = new AutoGenResourceManager();
//# sourceMappingURL=resource-manager.js.map