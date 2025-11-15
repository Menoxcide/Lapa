/**
 * Serialization Cache Utility
 * 
 * Caches JSON serialization/deserialization results to reduce CPU overhead
 * for frequently accessed data structures.
 */

import { CacheManager } from '../core/optimizations/caching.ts';

interface SerializationCacheEntry {
  serialized: string;
  timestamp: number;
}

/**
 * Serialization cache for JSON operations
 * Reduces CPU overhead by caching frequently serialized objects
 */
class SerializationCache {
  private cache: CacheManager<SerializationCacheEntry>;
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  constructor() {
    this.cache = new CacheManager<SerializationCacheEntry>({
      maxSize: 500, // Cache up to 500 serialized objects
      ttl: this.DEFAULT_TTL,
      enableMetrics: true
    });
  }

  /**
   * Generate cache key from object
   * Uses a simple hash of object structure for key generation
   */
  private generateKey(obj: any): string {
    // Fast path: use JSON.stringify for key generation (only for key, not value)
    // For better performance, could use a hash function
    try {
      // Create a stable key from object structure
      const keyObj = this.extractKeyStructure(obj);
      return `serialize:${JSON.stringify(keyObj)}`;
    } catch {
      // Fallback: use object reference
      return `serialize:${Object.prototype.toString.call(obj)}`;
    }
  }

  /**
   * Extract key structure from object (for stable hashing)
   */
  private extractKeyStructure(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return typeof obj;
    }
    
    if (Array.isArray(obj)) {
      return ['array', obj.length];
    }
    
    // Extract keys and types for object
    const keys = Object.keys(obj).sort();
    return {
      keys,
      types: keys.map(k => typeof obj[k])
    };
  }

  /**
   * Serialize object with caching
   * @param obj Object to serialize
   * @returns Serialized JSON string
   */
  serialize(obj: any): string {
    const key = this.generateKey(obj);
    const cached = this.cache.get(key);
    
    if (cached) {
      return cached.serialized;
    }
    
    // Serialize and cache
    const serialized = JSON.stringify(obj);
    this.cache.set(key, {
      serialized,
      timestamp: Date.now()
    });
    
    return serialized;
  }

  /**
   * Deserialize JSON string with caching
   * Note: Deserialization caching is less useful, but included for completeness
   * @param json JSON string to deserialize
   * @returns Deserialized object
   */
  deserialize<T = any>(json: string): T {
    // For deserialization, we can cache based on the JSON string itself
    const key = `deserialize:${json.substring(0, 100)}`; // Use first 100 chars as key
    const cached = this.cache.get(key);
    
    if (cached) {
      // Parse the cached serialized version (should match)
      return JSON.parse(cached.serialized) as T;
    }
    
    // Deserialize and cache
    const deserialized = JSON.parse(json) as T;
    this.cache.set(key, {
      serialized: json,
      timestamp: Date.now()
    });
    
    return deserialized;
  }

  /**
   * Clear the serialization cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): ReturnType<typeof this.cache.getMetrics> {
    return this.cache.getMetrics();
  }
}

// Export singleton instance
export const serializationCache = new SerializationCache();

/**
 * Optimized JSON.stringify with caching
 */
export function cachedStringify(obj: any): string {
  return serializationCache.serialize(obj);
}

/**
 * Optimized JSON.parse with caching
 */
export function cachedParse<T = any>(json: string): T {
  return serializationCache.deserialize<T>(json);
}

