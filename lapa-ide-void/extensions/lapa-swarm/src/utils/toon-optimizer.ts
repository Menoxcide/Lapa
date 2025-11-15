/**
 * TOON Optimizer Utilities
 * 
 * Provides helper functions for optimizing data structures with TOON format
 * before sending to LLMs or serializing for communication.
 * 
 * Usage:
 * ```typescript
 * import { optimizeForTOON, optimizeContextForLLM } from '../utils/toon-optimizer.ts';
 * 
 * // Optimize context before sending to LLM
 * const optimizedContext = optimizeContextForLLM(context);
 * 
 * // Optimize data structure
 * const optimized = optimizeForTOON(data);
 * ```
 */

import { serializeToTOON, isSuitableForTOON, estimateTokenReduction } from './toon-serializer.ts';

/**
 * TOON optimization configuration
 */
export interface TOONOptimizationConfig {
  enableTOON: boolean;
  minTokenReduction: number; // Minimum token reduction percentage to use TOON (default: 20%)
  optimizeArrays: boolean;
  optimizeNestedObjects: boolean;
}

/**
 * Default TOON optimization configuration
 */
const DEFAULT_CONFIG: TOONOptimizationConfig = {
  enableTOON: true,
  minTokenReduction: 20, // Use TOON if we get at least 20% token reduction
  optimizeArrays: true,
  optimizeNestedObjects: true
};

/**
 * Optimize data structure for TOON serialization
 * 
 * @param data - Data to optimize
 * @param config - Optimization configuration
 * @returns Optimized data (with TOON string if applicable) or original data
 */
export function optimizeForTOON(
  data: any,
  config: Partial<TOONOptimizationConfig> = {}
): { optimized: any; format: 'toon' | 'json'; tokenReduction?: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Early return if TOON disabled
  if (!finalConfig.enableTOON) {
    return { optimized: data, format: 'json' };
  }

  // Fast check if data is suitable for TOON (optimized)
  if (!isSuitableForTOON(data)) {
    return { optimized: data, format: 'json' };
  }

  // Quick size estimation before full serialization
  const jsonString = JSON.stringify(data);
  const jsonSize = jsonString.length;
  
  // Skip TOON if data is too small (won't benefit)
  if (jsonSize < 100) {
    return { optimized: data, format: 'json' };
  }

  // Serialize to TOON (only if we pass size check)
  const toonString = serializeToTOON(data, { compact: true });
  const toonSize = toonString.length;
  
  // Quick token reduction calculation (avoid full estimation if clearly not beneficial)
  const sizeReduction = ((jsonSize - toonSize) / jsonSize) * 100;
  
  // Early return if size reduction doesn't meet threshold
  if (sizeReduction < finalConfig.minTokenReduction) {
    return { optimized: data, format: 'json' };
  }

  // Full token reduction estimation (only if size check passes)
  const tokenReduction = estimateTokenReduction(data, toonString);

  // Use TOON if token reduction meets threshold
  if (tokenReduction >= finalConfig.minTokenReduction) {
    return {
      optimized: { _format: 'toon', _data: toonString },
      format: 'toon',
      tokenReduction
    };
  }

  // Otherwise use JSON
  return { optimized: data, format: 'json' };
}

/**
 * Optimize context data for LLM consumption
 * 
 * Recursively optimizes arrays and nested objects in context data
 * 
 * @param context - Context data to optimize
 * @param config - Optimization configuration
 * @returns Optimized context data
 */
export function optimizeContextForLLM(
  context: Record<string, any>,
  config: Partial<TOONOptimizationConfig> = {}
): Record<string, any> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const optimized: Record<string, any> = {};
  
  // Pre-allocate if we know the size (small optimization)
  const keys = Object.keys(context);
  if (keys.length === 0) {
    return optimized;
  }

  for (const key of keys) {
    const value = context[key];
    
    // Fast path for primitives (most common case)
    if (value === null || value === undefined || 
        typeof value === 'string' || typeof value === 'number' || 
        typeof value === 'boolean') {
      optimized[key] = value;
      continue;
    }

    // Optimize arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        optimized[key] = value;
        continue;
      }
      
      if (finalConfig.optimizeArrays && isSuitableForTOON(value)) {
        const result = optimizeForTOON(value, config);
        if (result.format === 'toon' && result.tokenReduction && 
            result.tokenReduction >= finalConfig.minTokenReduction) {
          optimized[key] = result.optimized;
          optimized[`${key}_format`] = 'toon';
          optimized[`${key}_token_reduction`] = result.tokenReduction;
        } else {
          optimized[key] = value;
        }
      } else {
        optimized[key] = value;
      }
      continue;
    }

    // Recursively optimize nested objects
    if (typeof value === 'object') {
      if (finalConfig.optimizeNestedObjects) {
        optimized[key] = optimizeContextForLLM(value, config);
      } else {
        optimized[key] = value;
      }
      continue;
    }

    // Fallback (shouldn't happen, but safe)
    optimized[key] = value;
  }

  return optimized;
}

/**
 * Optimize chunks array for LLM context
 * 
 * Specifically optimized for RAG pipeline chunks
 * 
 * @param chunks - Array of text chunks
 * @param config - Optimization configuration
 * @returns Optimized chunks (TOON format if beneficial)
 */
export function optimizeChunksForLLM(
  chunks: string[],
  config: Partial<TOONOptimizationConfig> = {}
): { optimized: any; format: 'toon' | 'json'; tokenReduction?: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enableTOON || chunks.length === 0) {
    return { optimized: chunks, format: 'json' };
  }

  // Convert chunks to array of objects for TOON optimization
  const chunksData = chunks.map((chunk, index) => ({
    index,
    text: chunk,
    length: chunk.length
  }));

  if (isSuitableForTOON(chunksData)) {
    const result = optimizeForTOON(chunksData, config);
    if (result.format === 'toon' && result.tokenReduction && result.tokenReduction >= finalConfig.minTokenReduction) {
      return {
        optimized: { _format: 'toon', _data: result.optimized._data },
        format: 'toon',
        tokenReduction: result.tokenReduction
      };
    }
  }

  // Fallback to JSON
  return { optimized: chunks, format: 'json' };
}

/**
 * Optimize search results array for LLM context
 * 
 * Specifically optimized for vector search results
 * 
 * @param results - Array of search results
 * @param config - Optimization configuration
 * @returns Optimized results (TOON format if beneficial)
 */
export function optimizeSearchResultsForLLM(
  results: Array<{ document: any; similarity: number; distance: number }>,
  config: Partial<TOONOptimizationConfig> = {}
): { optimized: any; format: 'toon' | 'json'; tokenReduction?: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enableTOON || results.length === 0) {
    return { optimized: results, format: 'json' };
  }

  // Extract relevant data for LLM (remove embeddings)
  const resultsData = results.map(result => ({
    id: result.document.id,
    content: result.document.content,
    similarity: result.similarity,
    distance: result.distance,
    metadata: result.document.metadata
  }));

  if (isSuitableForTOON(resultsData)) {
    const result = optimizeForTOON(resultsData, config);
    if (result.format === 'toon' && result.tokenReduction && result.tokenReduction >= finalConfig.minTokenReduction) {
      return {
        optimized: { _format: 'toon', _data: result.optimized._data },
        format: 'toon',
        tokenReduction: result.tokenReduction
      };
    }
  }

  // Fallback to JSON
  return { optimized: results, format: 'json' };
}

/**
 * Check if optimization should be applied
 * 
 * Optimized version with early returns and size estimation
 * 
 * @param data - Data to check
 * @param minSize - Minimum size threshold (number of items or bytes)
 * @returns True if optimization should be applied
 */
export function shouldOptimizeForTOON(data: any, minSize: number = 5): boolean {
  // Early return for null/undefined
  if (!data) {
    return false;
  }

  // Fast path for arrays
  if (Array.isArray(data)) {
    // Early return if empty
    if (data.length === 0) {
      return false;
    }
    // For arrays, check length and estimate token savings
    if (data.length < minSize) {
      return false;
    }
    // Quick check: if first item is object, likely suitable
    return typeof data[0] === 'object' && data[0] !== null;
  }

  // Fast path for objects
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    // Early return if too few keys
    if (keys.length < minSize) {
      return false;
    }
    // Quick estimation: if object has nested arrays/objects, likely suitable
    return keys.some(key => {
      const value = data[key];
      return Array.isArray(value) || (typeof value === 'object' && value !== null);
    });
  }

  return false;
}

