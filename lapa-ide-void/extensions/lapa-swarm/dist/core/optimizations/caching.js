"use strict";
/**
 * Caching Mechanisms for LAPA v1.2 Phase 10
 *
 * This module implements optimized caching mechanisms for frequent operations
 * to reduce computation overhead and improve performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lapaCacheManager = exports.LAPACacheManager = exports.EventRouteCache = exports.ToolExecutionCache = exports.CacheManager = void 0;
const lru_cache_1 = require("lru-cache");
const perf_hooks_1 = require("perf_hooks");
// Default cache configuration
const DEFAULT_CACHE_CONFIG = {
    maxSize: 1000,
    ttl: 60000, // 1 minute
    enableMetrics: true
};
/**
 * Generic Cache Manager with LRU eviction policy
 */
class CacheManager {
    cache;
    config;
    metrics;
    constructor(config) {
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.cache = new lru_cache_1.LRUCache({
            max: this.config.maxSize,
            ttl: this.config.ttl,
            dispose: () => {
                if (this.config.enableMetrics) {
                    this.metrics.evictions++;
                }
            }
        });
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0
        };
    }
    /**
     * Get a value from cache
     * @param key Cache key
     * @returns Cached value or undefined if not found
     */
    get(key) {
        const entry = this.cache.get(key);
        if (entry) {
            // Check if entry is still valid
            if (perf_hooks_1.performance.now() - entry.timestamp < this.config.ttl) {
                if (this.config.enableMetrics) {
                    this.metrics.hits++;
                    this.updateHitRate();
                }
                return entry.value;
            }
            else {
                // Expired entry, remove it
                this.cache.delete(key);
            }
        }
        if (this.config.enableMetrics) {
            this.metrics.misses++;
            this.updateHitRate();
        }
        return undefined;
    }
    /**
     * Set a value in cache
     * @param key Cache key
     * @param value Value to cache
     */
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: perf_hooks_1.performance.now()
        });
    }
    /**
     * Delete a value from cache
     * @param key Cache key
     * @returns Boolean indicating if key existed
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Check if a key exists in cache
     * @param key Cache key
     * @returns Boolean indicating if key exists
     */
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Clear all cached values
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get current cache size
     * @returns Number of items in cache
     */
    size() {
        return this.cache.size;
    }
    /**
     * Update hit rate calculation
     */
    updateHitRate() {
        const total = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    }
    /**
     * Get cache metrics
     * @returns Current cache metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset cache metrics
     */
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0
        };
    }
}
exports.CacheManager = CacheManager;
class ToolExecutionCache {
    cache;
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.cache = new CacheManager(this.config);
    }
    /**
     * Generate cache key for tool execution
     * @param toolName Name of the tool
     * @param parameters Tool parameters
     * @returns Generated cache key
     */
    generateKey(toolName, parameters) {
        // Create a deterministic key from tool name and parameters
        const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
        return `tool:${toolName}:${paramStr}`;
    }
    /**
     * Get cached tool execution result
     * @param toolName Name of the tool
     * @param parameters Tool parameters
     * @returns Cached result or undefined if not found
     */
    getCachedResult(toolName, parameters) {
        const key = this.generateKey(toolName, parameters);
        return this.cache.get(key);
    }
    /**
     * Cache tool execution result
     * @param toolName Name of the tool
     * @param parameters Tool parameters
     * @param result Execution result
     * @param executionTime Execution time in milliseconds
     */
    cacheResult(toolName, parameters, result, executionTime) {
        const key = this.generateKey(toolName, parameters);
        this.cache.set(key, {
            result,
            executionTime,
            timestamp: perf_hooks_1.performance.now()
        });
    }
    /**
     * Invalidate cached result for a tool
     * @param toolName Name of the tool
     * @param parameters Tool parameters
     */
    invalidate(toolName, parameters) {
        const key = this.generateKey(toolName, parameters);
        this.cache.delete(key);
    }
    /**
     * Get cache metrics
     * @returns Current cache metrics
     */
    getMetrics() {
        return this.cache.getMetrics();
    }
}
exports.ToolExecutionCache = ToolExecutionCache;
class EventRouteCache {
    cache;
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.cache = new CacheManager({
            ...this.config,
            ttl: 30000 // 30 seconds for route cache
        });
    }
    /**
     * Generate cache key for event routing
     * @param eventType Type of event
     * @param eventSource Source of event
     * @returns Generated cache key
     */
    generateKey(eventType, eventSource) {
        return `route:${eventType}:${eventSource}`;
    }
    /**
     * Get cached routing decision
     * @param eventType Type of event
     * @param eventSource Source of event
     * @returns Cached routing decision or undefined if not found
     */
    getCachedRoute(eventType, eventSource) {
        const key = this.generateKey(eventType, eventSource);
        return this.cache.get(key);
    }
    /**
     * Cache routing decision
     * @param eventType Type of event
     * @param eventSource Source of event
     * @param target Target for routing
     */
    cacheRoute(eventType, eventSource, target) {
        const key = this.generateKey(eventType, eventSource);
        this.cache.set(key, {
            target,
            timestamp: perf_hooks_1.performance.now()
        });
    }
    /**
     * Get cache metrics
     * @returns Current cache metrics
     */
    getMetrics() {
        return this.cache.getMetrics();
    }
}
exports.EventRouteCache = EventRouteCache;
/**
 * Composite cache manager for LAPA system
 */
class LAPACacheManager {
    toolExecutionCache;
    eventRouteCache;
    constructor(config) {
        const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.toolExecutionCache = new ToolExecutionCache(cacheConfig);
        this.eventRouteCache = new EventRouteCache(cacheConfig);
    }
    /**
     * Clear all caches
     */
    clearAll() {
        this.toolExecutionCache['cache'].clear();
        this.eventRouteCache['cache'].clear();
    }
    /**
     * Get metrics for all caches
     * @returns Object containing metrics for all caches
     */
    getAllMetrics() {
        return {
            toolExecution: this.toolExecutionCache.getMetrics(),
            eventRoute: this.eventRouteCache.getMetrics()
        };
    }
}
exports.LAPACacheManager = LAPACacheManager;
// Export singleton instance
exports.lapaCacheManager = new LAPACacheManager();
//# sourceMappingURL=caching.js.map