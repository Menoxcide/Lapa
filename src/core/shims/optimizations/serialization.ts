/**
 * Optimized Serialization for Cross-Language Shims in LAPA v1.2 Phase 10
 * 
 * This module implements optimized serialization techniques to reduce overhead
 * in cross-language communication between TypeScript, .NET, and Python components.
 */

import { LAPAEvent, CrossLanguageEvent } from '../../core/types/event-types.ts';
import { performance } from 'perf_hooks';

// Serialization optimization configuration
interface SerializationConfig {
  enableFastPath: boolean;
  enableCompression: boolean;
  compressionThreshold: number; // Bytes
  enableCaching: boolean;
  cacheSize: number;
}

// Default configuration optimized for performance
const DEFAULT_CONFIG: SerializationConfig = {
  enableFastPath: true,
  enableCompression: true,
  compressionThreshold: 1024, // 1KB
  enableCaching: true,
  cacheSize: 100
};

// Simple LRU cache implementation for serialization
class SimpleLRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number, ttl: number = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if entry is still valid
      if (performance.now() - entry.timestamp < this.ttl) {
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
      } else {
        // Expired entry, remove it
        this.cache.delete(key);
      }
    }
    
    return undefined;
  }

  set(key: K, value: V): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: performance.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Fast serializer for common event types
class FastSerializer {
  private cache: SimpleLRUCache<string, CrossLanguageEvent>;

  constructor(private config: SerializationConfig) {
    this.cache = new SimpleLRUCache(config.cacheSize);
  }

  /**
   * Serialize a LAPA event using fast path when possible
   * @param event The event to serialize
   * @returns Serialized cross-language event
   */
  serializeEventForInterop(event: LAPAEvent): CrossLanguageEvent {
    // Try to get from cache if caching is enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(event);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use fast path for simple events if enabled
    if (this.config.enableFastPath && this.canUseFastPath(event)) {
      const serialized = this.fastSerialize(event);
      
      // Cache result if caching is enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(event);
        this.cache.set(cacheKey, serialized);
      }
      
      return serialized;
    }

    // Fall back to standard serialization
    const serialized = this.standardSerialize(event);
    
    // Cache result if caching is enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(event);
      this.cache.set(cacheKey, serialized);
    }
    
    return serialized;
  }

  /**
   * Deserialize a cross-language event using fast path when possible
   * @param interopEvent The serialized cross-language event
   * @returns Deserialized LAPA event
   */
  deserializeEventFromInterop(interopEvent: CrossLanguageEvent): LAPAEvent {
    // Use fast path for simple events if enabled
    if (this.config.enableFastPath && this.canUseFastDeserialize(interopEvent)) {
      return this.fastDeserialize(interopEvent);
    }

    // Fall back to standard deserialization
    return this.standardDeserialize(interopEvent);
  }

  /**
   * Check if fast path can be used for serialization
   * @param event The event to check
   * @returns Boolean indicating if fast path can be used
   */
  private canUseFastPath(event: LAPAEvent): boolean {
    // Fast path is suitable for events with simple payload structures
    // Check if payload is a simple object with primitive values
    if (typeof event.payload !== 'object' || event.payload === null) {
      return true;
    }

    // Check if all values in payload are primitives
    for (const key in event.payload) {
      const value = event.payload[key];
      if (typeof value === 'object' && value !== null) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if fast path can be used for deserialization
   * @param event The cross-language event to check
   * @returns Boolean indicating if fast path can be used
   */
  private canUseFastDeserialize(event: CrossLanguageEvent): boolean {
    // Fast path is suitable for events with simple payload structures
    try {
      const payload = JSON.parse(event.payload);
      
      if (typeof payload !== 'object' || payload === null) {
        return true;
      }

      // Check if all values in payload are primitives
      for (const key in payload) {
        const value = payload[key];
        if (typeof value === 'object' && value !== null) {
          return false;
        }
      }

      return true;
    } catch {
      // If we can't parse the payload, we can't use fast path
      return false;
    }
  }

  /**
   * Fast serialize an event with simple payload
   * @param event The event to serialize
   * @returns Serialized cross-language event
   */
  private fastSerialize(event: LAPAEvent): CrossLanguageEvent {
    // For fast serialization, we directly convert primitives without stringifying
    let payload: string;
    
    if (event.payload === null || event.payload === undefined) {
      payload = 'null';
    } else if (typeof event.payload === 'string') {
      payload = `"${event.payload}"`;
    } else if (typeof event.payload === 'number' || typeof event.payload === 'boolean') {
      payload = String(event.payload);
    } else if (Array.isArray(event.payload)) {
      // For arrays, check if all elements are primitives
      let allPrimitives = true;
      for (const item of event.payload) {
        if (typeof item === 'object' && item !== null) {
          allPrimitives = false;
          break;
        }
      }
      
      if (allPrimitives) {
        payload = JSON.stringify(event.payload);
      } else {
        // Fall back to standard serialization for complex arrays
        return this.standardSerialize(event);
      }
    } else {
      // For objects, check if all values are primitives
      let allPrimitives = true;
      for (const key in event.payload) {
        const value = event.payload[key];
        if (typeof value === 'object' && value !== null) {
          allPrimitives = false;
          break;
        }
      }
      
      if (allPrimitives) {
        payload = JSON.stringify(event.payload);
      } else {
        // Fall back to standard serialization for complex objects
        return this.standardSerialize(event);
      }
    }

    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      target: event.target,
      payload,
      metadata: event.metadata ? Object.fromEntries(
        Object.entries(event.metadata).map(([key, value]) => [key, String(value)])
      ) : undefined
    };
  }

  /**
   * Standard serialize an event
   * @param event The event to serialize
   * @returns Serialized cross-language event
   */
  private standardSerialize(event: LAPAEvent): CrossLanguageEvent {
    // Apply compression if enabled and payload is large enough
    let payload = JSON.stringify(event.payload);
    
    if (this.config.enableCompression && payload.length > this.config.compressionThreshold) {
      payload = this.compressString(payload);
    }

    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      target: event.target,
      payload,
      metadata: event.metadata ? Object.fromEntries(
        Object.entries(event.metadata).map(([key, value]) => [key, String(value)])
      ) : undefined
    };
  }

  /**
   * Fast deserialize a cross-language event with simple payload
   * @param interopEvent The serialized cross-language event
   * @returns Deserialized LAPA event
   */
  private fastDeserialize(interopEvent: CrossLanguageEvent): LAPAEvent {
    // For fast deserialization, we directly convert primitives without parsing
    let payload: any;
    
    if (interopEvent.payload === 'null') {
      payload = null;
    } else if (interopEvent.payload === 'true') {
      payload = true;
    } else if (interopEvent.payload === 'false') {
      payload = false;
    } else if (/^-?\d+(\.\d+)?$/.test(interopEvent.payload)) {
      // Check if it's a number
      payload = Number(interopEvent.payload);
    } else if (
      interopEvent.payload.startsWith('"') && 
      interopEvent.payload.endsWith('"') &&
      interopEvent.payload.length >= 2
    ) {
      // It's a string (remove quotes)
      payload = interopEvent.payload.substring(1, interopEvent.payload.length - 1);
    } else {
      // Try to parse as JSON for arrays and objects
      try {
        payload = JSON.parse(interopEvent.payload);
      } catch {
        // If parsing fails, treat as string
        payload = interopEvent.payload;
      }
    }

    return {
      id: interopEvent.id,
      type: interopEvent.type,
      timestamp: interopEvent.timestamp,
      source: interopEvent.source,
      target: interopEvent.target,
      payload,
      metadata: interopEvent.metadata ? Object.fromEntries(
        Object.entries(interopEvent.metadata).map(([key, value]) => [key, value])
      ) : undefined
    };
  }

  /**
   * Standard deserialize a cross-language event
   * @param interopEvent The serialized cross-language event
   * @returns Deserialized LAPA event
   */
  private standardDeserialize(interopEvent: CrossLanguageEvent): LAPAEvent {
    // Decompress payload if it was compressed
    let payloadStr = interopEvent.payload;
    if (this.isCompressedString(payloadStr)) {
      payloadStr = this.decompressString(payloadStr);
    }

    return {
      id: interopEvent.id,
      type: interopEvent.type,
      timestamp: interopEvent.timestamp,
      source: interopEvent.source,
      target: interopEvent.target,
      payload: JSON.parse(payloadStr),
      metadata: interopEvent.metadata ? Object.fromEntries(
        Object.entries(interopEvent.metadata).map(([key, value]) => [key, value])
      ) : undefined
    };
  }

  /**
   * Generate a cache key for an event
   * @param event The event to generate key for
   * @returns Cache key string
   */
  private generateCacheKey(event: LAPAEvent): string {
    // Create a simple hash of the event for caching
    return `${event.type}:${event.source}:${JSON.stringify(event.payload)}`;
  }

  /**
   * Compress a string using a simple run-length encoding
   * @param str String to compress
   * @returns Compressed string
   */
  private compressString(str: string): string {
    // Simple run-length encoding for demonstration
    // In a real implementation, you might use a more sophisticated algorithm
    let compressed = '';
    let count = 1;
    
    for (let i = 0; i < str.length; i++) {
      if (i + 1 < str.length && str[i] === str[i + 1]) {
        count++;
      } else {
        if (count > 1) {
          compressed += `${count}${str[i]}`;
        } else {
          compressed += str[i];
        }
        count = 1;
      }
    }
    
    // Only use compressed version if it's actually smaller
    return compressed.length < str.length ? compressed : str;
  }

  /**
   * Decompress a string that was compressed with run-length encoding
   * @param str String to decompress
   * @returns Decompressed string
   */
  private decompressString(str: string): string {
    // Simple run-length decoding
    let decompressed = '';
    let i = 0;
    
    while (i < str.length) {
      // Check if current character is a digit
      if (/\d/.test(str[i])) {
        // Parse the count
        let countStr = '';
        while (i < str.length && /\d/.test(str[i])) {
          countStr += str[i];
          i++;
        }
        
        const count = parseInt(countStr, 10);
        
        // Get the character to repeat
        if (i < str.length) {
          const char = str[i];
          decompressed += char.repeat(count);
          i++;
        }
      } else {
        // Regular character
        decompressed += str[i];
        i++;
      }
    }
    
    return decompressed;
  }

  /**
   * Check if a string appears to be compressed
   * @param str String to check
   * @returns Boolean indicating if string is compressed
   */
  private isCompressedString(str: string): boolean {
    // Simple heuristic: compressed strings often contain digits followed by characters
    return /\d[a-zA-Z]/.test(str);
  }

  /**
   * Clear the serialization cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   * @returns Number of items in cache
   */
  getCacheSize(): number {
    return this.cache.size();
  }
}

// Export optimized serialization functions
let fastSerializer: FastSerializer | null = null;

/**
 * Initialize the fast serializer with configuration
 * @param config Serialization configuration
 */
export function initializeFastSerializer(config?: Partial<SerializationConfig>): void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  fastSerializer = new FastSerializer(mergedConfig);
}

/**
 * Serialize a LAPA event for cross-language communication with optimizations
 * @param event The event to serialize
 * @returns Serialized cross-language event
 */
export function serializeEventForInterop(event: LAPAEvent): CrossLanguageEvent {
  // Initialize with default config if not already initialized
  if (!fastSerializer) {
    initializeFastSerializer();
  }
  
  return fastSerializer!.serializeEventForInterop(event);
}

/**
 * Deserialize a cross-language event back to a LAPA event with optimizations
 * @param interopEvent The serialized cross-language event
 * @returns Deserialized LAPA event
 */
export function deserializeEventFromInterop(interopEvent: CrossLanguageEvent): LAPAEvent {
  // Initialize with default config if not already initialized
  if (!fastSerializer) {
    initializeFastSerializer();
  }
  
  return fastSerializer!.deserializeEventFromInterop(interopEvent);
}

/**
 * Validates if an object is a properly formatted cross-language event
 * @param obj The object to validate
 * @returns Boolean indicating if the object is a valid cross-language event
 */
export function isValidCrossLanguageEvent(obj: any): obj is CrossLanguageEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.source === 'string' &&
    typeof obj.payload === 'string' &&
    (obj.metadata === undefined || typeof obj.metadata === 'object')
  );
}

// Initialize with default configuration
initializeFastSerializer();