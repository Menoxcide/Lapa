/**
 * Bounded Collections Utility
 * 
 * Provides bounded Map and Set implementations with automatic eviction
 * to prevent unbounded memory growth. Uses LRU (Least Recently Used) eviction policy.
 */

/**
 * Bounded Map with LRU eviction
 * Automatically removes oldest entries when size limit is reached
 */
export class BoundedMap<K, V> extends Map<K, V> {
  private readonly maxSize: number;
  private readonly accessOrder: K[] = []; // Track access order for LRU

  constructor(maxSize: number, entries?: readonly (readonly [K, V])[] | null) {
    super();
    if (maxSize <= 0) {
      throw new Error('BoundedMap maxSize must be greater than 0');
    }
    this.maxSize = maxSize;
    
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  /**
   * Set a key-value pair, evicting oldest entry if at capacity
   */
  set(key: K, value: V): this {
    // If key already exists, update access order
    if (this.has(key)) {
      this.updateAccessOrder(key);
      return super.set(key, value);
    }

    // If at capacity, remove oldest entry (LRU)
    if (this.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey !== undefined) {
        super.delete(oldestKey);
      }
    }

    // Add new entry
    this.accessOrder.push(key);
    return super.set(key, value);
  }

  /**
   * Get a value, updating access order (LRU)
   */
  get(key: K): V | undefined {
    const value = super.get(key);
    if (value !== undefined) {
      this.updateAccessOrder(key);
    }
    return value;
  }

  /**
   * Delete a key, removing from access order
   */
  delete(key: K): boolean {
    if (super.delete(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.accessOrder.length = 0;
    super.clear();
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      // Move to end (most recently used)
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Get the maximum size limit
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Check if map is at capacity
   */
  isFull(): boolean {
    return this.size >= this.maxSize;
  }
}

/**
 * Bounded Set with LRU eviction
 * Automatically removes oldest entries when size limit is reached
 */
export class BoundedSet<T> extends Set<T> {
  private readonly maxSize: number;
  private readonly accessOrder: T[] = []; // Track access order for LRU

  constructor(maxSize: number, values?: readonly T[] | null) {
    super();
    if (maxSize <= 0) {
      throw new Error('BoundedSet maxSize must be greater than 0');
    }
    this.maxSize = maxSize;
    
    if (values) {
      for (const value of values) {
        this.add(value);
      }
    }
  }

  /**
   * Add a value, evicting oldest entry if at capacity
   */
  add(value: T): this {
    // If value already exists, update access order
    if (this.has(value)) {
      this.updateAccessOrder(value);
      return this;
    }

    // If at capacity, remove oldest entry (LRU)
    if (this.size >= this.maxSize) {
      const oldestValue = this.accessOrder.shift();
      if (oldestValue !== undefined) {
        super.delete(oldestValue);
      }
    }

    // Add new entry
    this.accessOrder.push(value);
    return super.add(value);
  }

  /**
   * Check if value exists, updating access order (LRU)
   */
  has(value: T): boolean {
    const exists = super.has(value);
    if (exists) {
      this.updateAccessOrder(value);
    }
    return exists;
  }

  /**
   * Delete a value, removing from access order
   */
  delete(value: T): boolean {
    if (super.delete(value)) {
      const index = this.accessOrder.indexOf(value);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.accessOrder.length = 0;
    super.clear();
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(value: T): void {
    const index = this.accessOrder.indexOf(value);
    if (index > -1) {
      // Move to end (most recently used)
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(value);
  }

  /**
   * Get the maximum size limit
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Check if set is at capacity
   */
  isFull(): boolean {
    return this.size >= this.maxSize;
  }
}

/**
 * Create a bounded Map with specified size limit
 */
export function createBoundedMap<K, V>(maxSize: number): BoundedMap<K, V> {
  return new BoundedMap<K, V>(maxSize);
}

/**
 * Create a bounded Set with specified size limit
 */
export function createBoundedSet<T>(maxSize: number): BoundedSet<T> {
  return new BoundedSet<T>(maxSize);
}

