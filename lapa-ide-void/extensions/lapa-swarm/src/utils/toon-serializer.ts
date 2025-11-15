/**
 * TOON (Token-Oriented Object Notation) Serializer
 * 
 * Provides efficient serialization for LLMs with reduced token usage.
 * TOON combines YAML's indentation-based structure with CSV's tabular format.
 * 
 * Reference: https://github.com/toon-format/toon
 * 
 * TOON is particularly effective for uniform arrays of objects.
 */

/**
 * TOON serialization options
 */
export interface ToonSerializeOptions {
  indent?: number;
  compact?: boolean;
  includeHeaders?: boolean;
}

/**
 * TOON deserialization options
 */
export interface ToonDeserializeOptions {
  strict?: boolean;
}

/**
 * Serialize data to TOON format
 * 
 * @param data - Data to serialize (array of objects or object)
 * @param options - Serialization options
 * @returns TOON-formatted string
 */
export function serializeToTOON(
  data: any[] | Record<string, any>,
  options: ToonSerializeOptions = {}
): string {
  const { indent = 2, compact = false, includeHeaders = true } = options;

  // Handle array of objects (TOON's strength)
  if (Array.isArray(data) && data.length > 0) {
    return serializeArrayToTOON(data, { indent, compact, includeHeaders });
  }

  // Handle single object
  if (typeof data === 'object' && data !== null) {
    return serializeObjectToTOON(data, { indent, compact });
  }

  // Handle primitives
  return String(data);
}

/**
 * Serialize array of objects to TOON format
 */
function serializeArrayToTOON(
  items: Record<string, any>[],
  options: ToonSerializeOptions
): string {
  const { indent = 2, compact = false, includeHeaders = true } = options;

  if (items.length === 0) {
    return '[]';
  }

  // Extract all keys from all objects (union of keys)
  const allKeys = new Set<string>();
  items.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const keys = Array.from(allKeys);

  // Build TOON string
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  // Header row (keys)
  if (includeHeaders) {
    lines.push(keys.join(compact ? ',' : ' | '));
    if (!compact) {
      lines.push(keys.map(() => '-'.repeat(10)).join('|'));
    }
  }

  // Data rows
  items.forEach(item => {
    const values = keys.map(key => {
      const value = item[key];
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });

    lines.push(indentStr + values.join(compact ? ',' : ' | '));
  });

  return lines.join('\n');
}

/**
 * Serialize object to TOON format (YAML-like)
 */
function serializeObjectToTOON(
  obj: Record<string, any>,
  options: ToonSerializeOptions
): string {
  const { indent = 2, compact = false } = options;
  const lines: string[] = [];

  function serializeValue(value: any, currentIndent: number): string[] {
    const valueLines: string[] = [];
    const indentStr = ' '.repeat(currentIndent);

    if (Array.isArray(value)) {
      if (value.length === 0) {
        valueLines.push('[]');
      } else if (value.every(v => typeof v !== 'object' || v === null)) {
        // Simple array
        valueLines.push(`[${value.map(v => JSON.stringify(v)).join(', ')}]`);
      } else {
        // Array of objects
        valueLines.push('[');
        value.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            const itemLines = serializeValue(item, currentIndent + indent);
            valueLines.push(...itemLines);
          } else {
            valueLines.push(`${indentStr}${JSON.stringify(item)}`);
          }
        });
        valueLines.push(']');
      }
    } else if (typeof value === 'object' && value !== null) {
      valueLines.push('{');
      Object.entries(value).forEach(([key, val]) => {
        const valLines = serializeValue(val, currentIndent + indent);
        valueLines.push(`${indentStr}${key}:`, ...valLines);
      });
      valueLines.push('}');
    } else {
      valueLines.push(JSON.stringify(value));
    }

    return valueLines;
  }

  Object.entries(obj).forEach(([key, value]) => {
    const valueLines = serializeValue(value, indent);
    lines.push(`${key}:`, ...valueLines);
  });

  return lines.join('\n');
}

/**
 * Deserialize TOON format to JavaScript objects
 * 
 * @param toonString - TOON-formatted string
 * @param options - Deserialization options
 * @returns Parsed JavaScript object or array
 */
export function deserializeFromTOON(
  toonString: string,
  options: ToonDeserializeOptions = {}
): any {
  const { strict = false } = options;

  try {
    // Handle empty string
    if (!toonString || toonString.trim().length === 0) {
      return null;
    }

    // Detect format (array/table vs object)
    const lines = toonString.trim().split('\n');

    if (lines.length === 0) {
      return null;
    }

    // Check if it's a table format (array of objects)
    const firstLine = lines[0].trim();
    if (firstLine.includes('|') || firstLine.includes(',')) {
      return deserializeTableFromTOON(lines, { strict });
    }

    // Otherwise, parse as YAML-like object
    return deserializeObjectFromTOON(toonString, { strict });
  } catch (error) {
    if (strict) {
      throw new Error(`Failed to deserialize TOON: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }
}

/**
 * Deserialize table format (array of objects)
 */
function deserializeTableFromTOON(
  lines: string[],
  options: ToonDeserializeOptions
): Record<string, any>[] {
  const { strict = false } = options;
  const result: Record<string, any>[] = [];

  if (lines.length === 0) {
    return result;
  }

  // First line is header
  const headerLine = lines[0].trim();
  const separator = headerLine.includes('|') ? '|' : ',';
  const headers = headerLine.split(separator).map(h => h.trim());

  // Skip separator line if present (line with dashes)
  let dataStartIndex = 1;
  if (lines.length > 1 && lines[1].trim().match(/^[-|,]+$/)) {
    dataStartIndex = 2;
  }

  // Parse data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(separator).map(v => v.trim());
    const obj: Record<string, any> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      if (value) {
        try {
          // Try to parse as JSON first
          obj[header] = JSON.parse(value);
        } catch {
          // Otherwise, keep as string
          obj[header] = value;
        }
      } else {
        obj[header] = undefined;
      }
    });

    result.push(obj);
  }

  return result;
}

/**
 * Deserialize YAML-like object format
 */
function deserializeObjectFromTOON(
  toonString: string,
  options: ToonDeserializeOptions
): Record<string, any> {
  // For now, use a simple parser
  // In production, this would use a proper TOON parser
  // This is a simplified implementation

  try {
    // Try JSON first
    return JSON.parse(toonString);
  } catch {
    // Otherwise, use simple key-value parsing
    const result: Record<string, any> = {};
    const lines = toonString.split('\n');

    let currentKey: string | null = null;
    let currentValue: any = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        // New key
        if (currentKey) {
          result[currentKey] = currentValue;
        }
        currentKey = trimmed.substring(0, colonIndex).trim();
        currentValue = trimmed.substring(colonIndex + 1).trim();
      } else if (currentKey) {
        // Continuation of current value
        if (typeof currentValue === 'string') {
          currentValue += '\n' + trimmed;
        }
      }
    });

    if (currentKey) {
      result[currentKey] = currentValue;
    }

    return result;
  }
}

/**
 * Estimate token reduction when using TOON vs JSON
 * 
 * @param data - Original data
 * @param toonString - TOON-formatted string (optional, will generate if not provided)
 * @returns Estimated token reduction percentage
 */
export function estimateTokenReduction(data: any, toonString?: string): number {
  // Return 0 for unsuitable data types
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' || data === null || data === undefined) {
    return 0;
  }

  const jsonString = JSON.stringify(data);
  const jsonTokens = jsonString.length / 4; // Rough estimate: 4 chars per token
  
  if (jsonTokens === 0) {
    return 0;
  }

  // Check if suitable for TOON
  if (!isSuitableForTOON(data)) {
    return 0;
  }

  const finalToonString = toonString || serializeToTOON(data, { compact: true });
  const toonTokens = finalToonString.length / 4;

  const reduction = ((jsonTokens - toonTokens) / jsonTokens) * 100;
  return Math.max(0, Math.min(100, reduction)); // Clamp between 0-100%
}

/**
 * Check if data is suitable for TOON serialization
 * 
 * TOON is most effective for:
 * - Arrays of objects with uniform structure
 * - Simple key-value pairs
 * 
 * @param data - Data to check
 * @returns True if data is suitable for TOON
 */
export function isSuitableForTOON(data: any): boolean {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return false;
    }
    // Check if all items are objects with similar structure
    const firstKeys = Object.keys(data[0] || {});
    return data.every(item => 
      typeof item === 'object' && 
      item !== null &&
      Object.keys(item).length > 0
    );
  }

  if (typeof data === 'object' && data !== null) {
    // Suitable for simple objects
    return true;
  }

  return false;
}

