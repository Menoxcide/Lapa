/**
 * Caching Mechanisms for LAPA v1.2 Phase 10
 * 
 * This module implements optimized caching mechanisms for frequent operations
 * to reduce computation overhead and improve performance.
 */

// @ts-ignore - lru-cache types not available, using dynamic import
import { LRUCache } from 'lru-cache';
import { performance } from 'perf_hooks';

// Cache configuration interface
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enableMetrics: boolean;
}

// Cache entry with pre-calculated expiry
interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Pre-calculated expiry timestamp (Date.now() + ttl)
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 60000, // 1 minute
  enableMetrics: true
};

// Cache metrics interface
interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

/**
 * Generic Cache Manager with LRU eviction policy
 * Optimized with pre-calculated expiry timestamps for faster TTL checks
 */
export class CacheManager<T> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private config: CacheConfig;
  private metrics: CacheMetrics;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cache = new LRUCache({
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
   * Optimized version with pre-calculated expiry for faster TTL check
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Fast path: simple timestamp comparison (Date.now() is faster than performance.now() for this)
      if (Date.now() < entry.expiresAt) {
        if (this.config.enableMetrics) {
          this.metrics.hits++;
          this.updateHitRate();
        }
        return entry.value;
      } else {
        // Expired entry, remove immediately (no async delay for memory cleanup)
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
   * Pre-calculates expiry timestamp for faster TTL checks
   * @param key Cache key
   * @param value Value to cache
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.ttl // Pre-calculate expiry for fast comparison
    });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   * @returns Boolean indicating if key existed
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns Boolean indicating if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   * @returns Number of items in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Get cache metrics
   * @returns Current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0
    };
  }
}

/**
 * Specialized cache for agent tool execution results
 */
interface ToolExecutionCacheEntry {
  result: any;
  executionTime: number;
  timestamp: number;
}

export class ToolExecutionCache {
  private cache: CacheManager<ToolExecutionCacheEntry>;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cache = new CacheManager<ToolExecutionCacheEntry>(this.config);
  }

  /**
   * Generate cache key for tool execution
   * Optimized version with faster key generation
   * @param toolName Name of the tool
   * @param parameters Tool parameters
   * @returns Generated cache key
   */
  private generateKey(toolName: string, parameters: Record<string, any>): string {
    // Fast path: if parameters are empty, use simple key
    const paramKeys = Object.keys(parameters);
    if (paramKeys.length === 0) {
      return `tool:${toolName}:{}`;
    }
    
    // Optimized: only sort if multiple keys (most common case is single key)
    if (paramKeys.length === 1) {
      const key = paramKeys[0];
      return `tool:${toolName}:${key}=${JSON.stringify(parameters[key])}`;
    }
    
    // Create a deterministic key from tool name and parameters (only for multiple keys)
    const paramStr = JSON.stringify(parameters, paramKeys.sort());
    return `tool:${toolName}:${paramStr}`;
  }

  /**
   * Get cached tool execution result
   * @param toolName Name of the tool
   * @param parameters Tool parameters
   * @returns Cached result or undefined if not found
   */
  getCachedResult(toolName: string, parameters: Record<string, any>): ToolExecutionCacheEntry | undefined {
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
  cacheResult(
    toolName: string, 
    parameters: Record<string, any>, 
    result: any, 
    executionTime: number
  ): void {
    const key = this.generateKey(toolName, parameters);
    this.cache.set(key, {
      result,
      executionTime,
      timestamp: performance.now()
    });
  }

  /**
   * Invalidate cached result for a tool
   * @param toolName Name of the tool
   * @param parameters Tool parameters
   */
  invalidate(toolName: string, parameters: Record<string, any>): void {
    const key = this.generateKey(toolName, parameters);
    this.cache.delete(key);
  }

  /**
   * Get cache metrics
   * @returns Current cache metrics
   */
  getMetrics(): CacheMetrics {
    return this.cache.getMetrics();
  }
}

/**
 * Specialized cache for event routing decisions
 */
interface RouteCacheEntry {
  target: string;
  timestamp: number;
}

export class EventRouteCache {
  private cache: CacheManager<RouteCacheEntry>;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cache = new CacheManager<RouteCacheEntry>({
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
  private generateKey(eventType: string, eventSource: string): string {
    return `route:${eventType}:${eventSource}`;
  }

  /**
   * Get cached routing decision
   * @param eventType Type of event
   * @param eventSource Source of event
   * @returns Cached routing decision or undefined if not found
   */
  getCachedRoute(eventType: string, eventSource: string): RouteCacheEntry | undefined {
    const key = this.generateKey(eventType, eventSource);
    return this.cache.get(key);
  }

  /**
   * Cache routing decision
   * @param eventType Type of event
   * @param eventSource Source of event
   * @param target Target for routing
   */
  cacheRoute(eventType: string, eventSource: string, target: string): void {
    const key = this.generateKey(eventType, eventSource);
    this.cache.set(key, {
      target,
      timestamp: performance.now()
    });
  }

  /**
   * Get cache metrics
   * @returns Current cache metrics
   */
  getMetrics(): CacheMetrics {
    return this.cache.getMetrics();
  }
}

/**
 * Composite cache manager for LAPA system
 */
export class LAPACacheManager {
  public toolExecutionCache: ToolExecutionCache;
  public eventRouteCache: EventRouteCache;
  
  constructor(config?: Partial<CacheConfig>) {
    const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    this.toolExecutionCache = new ToolExecutionCache(cacheConfig);
    this.eventRouteCache = new EventRouteCache(cacheConfig);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.toolExecutionCache['cache'].clear();
    this.eventRouteCache['cache'].clear();
  }

  /**
   * Get metrics for all caches
   * @returns Object containing metrics for all caches
   */
  getAllMetrics(): Record<string, CacheMetrics> {
    return {
      toolExecution: this.toolExecutionCache.getMetrics(),
      eventRoute: this.eventRouteCache.getMetrics()
    };
  }
}

// Export singleton instance
export const lapaCacheManager = new LAPACacheManager();