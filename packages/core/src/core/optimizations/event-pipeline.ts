/**
 * Optimized Event Processing Pipeline for LAPA v1.2 Phase 10
 * 
 * This module implements optimizations for the event processing pipeline to achieve
 * <100ms per event performance target. It includes batching, prioritization, and
 * microtask scheduling optimizations.
 */

import { LAPAEventBus } from '../event-bus.ts';
import { LAPAEvent, LAPAEventMap } from '../types/event-types.ts';
import { performance } from 'perf_hooks';

// Event processing optimization configuration
interface EventPipelineConfig {
  batchSize: number;
  maxBatchDelay: number;
  enableMicrotaskScheduling: boolean;
  enablePriorityProcessing: boolean;
  highPriorityTypes: string[];
}

// Default configuration optimized for <100ms per event
const DEFAULT_CONFIG: EventPipelineConfig = {
  batchSize: 10,
  maxBatchDelay: 5, // ms
  enableMicrotaskScheduling: true,
  enablePriorityProcessing: true,
  highPriorityTypes: [
    'system.error',
    'handoff.initiated',
    'handoff.completed',
    'task.created'
  ]
};

// Event with priority information
interface PriorityEvent<T extends keyof LAPAEventMap> {
  event: LAPAEventMap[T];
  priority: number;
  timestamp: number;
}

/**
 * Optimized Event Pipeline
 * Implements high-performance event processing with batching and prioritization
 */
export class OptimizedEventPipeline {
  private config: EventPipelineConfig;
  private eventBus: LAPAEventBus;
  private eventQueue: PriorityEvent<keyof LAPAEventMap>[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  constructor(eventBus: LAPAEventBus, config?: Partial<EventPipelineConfig>) {
    this.eventBus = eventBus;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Publish an event with priority optimization
   * @param event The event to publish
   * @returns Promise that resolves when the event is queued for processing
   */
  async publish<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): Promise<void> {
    // Determine event priority
    const priority = this.config.enablePriorityProcessing 
      ? this.calculateEventPriority(event) 
      : 0;

    // Add event to queue
    this.eventQueue.push({
      event,
      priority,
      timestamp: performance.now()
    });

    // Trigger batch processing
    this.scheduleBatchProcessing();
  }

  /**
   * Calculate priority for an event
   * @param event The event to calculate priority for
   * @returns Priority value (higher number = higher priority)
   */
  private calculateEventPriority<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): number {
    // High priority for system errors and handoff events
    if (this.config.highPriorityTypes.includes(event.type)) {
      return 100;
    }

    // Medium priority for task events
    if (event.type.startsWith('task.')) {
      return 50;
    }

    // Low priority for everything else
    return 10;
  }

  /**
   * Schedule batch processing of events
   */
  private scheduleBatchProcessing(): void {
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process immediately if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.processBatch();
      return;
    }

    // Schedule processing with max delay
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.maxBatchDelay);
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Sort events by priority if enabled
      if (this.config.enablePriorityProcessing) {
        this.eventQueue.sort((a, b) => b.priority - a.priority);
      }

      // Take a batch of events
      const batch = this.eventQueue.splice(0, this.config.batchSize);

      // Process events with microtask scheduling if enabled
      if (this.config.enableMicrotaskScheduling) {
        await this.processWithMicrotaskScheduling(batch);
      } else {
        // Process events synchronously
        for (const { event } of batch) {
          await this.eventBus.publish(event);
        }
      }
    } finally {
      this.isProcessing = false;

      // Schedule next batch if there are more events
      if (this.eventQueue.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * Process events with microtask scheduling for better responsiveness
   * @param events Events to process
   */
  private async processWithMicrotaskScheduling(events: PriorityEvent<keyof LAPAEventMap>[]): Promise<void> {
    for (const { event } of events) {
      // Publish event
      await this.eventBus.publish(event);

      // Yield to event loop periodically
      if (Math.random() < 0.3) { // 30% chance to yield
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  }

  /**
   * Update pipeline configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<EventPipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): EventPipelineConfig {
    return { ...this.config };
  }

  /**
   * Get current queue size
   * @returns Number of events in queue
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Clear the event queue
   */
  clearQueue(): void {
    this.eventQueue.length = 0;
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// Export optimized event bus with pipeline integration
export class OptimizedEventBus extends LAPAEventBus {
  private pipeline: OptimizedEventPipeline;

  constructor(config?: Partial<EventPipelineConfig>) {
    super();
    this.pipeline = new OptimizedEventPipeline(this, config);
  }

  /**
   * Publish an event through the optimized pipeline
   * @param event The event to publish
   * @returns Promise that resolves when the event is published
   */
  async publish<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): Promise<void> {
    return this.pipeline.publish(event);
  }

  /**
   * Update pipeline configuration
   * @param config Partial configuration to update
   */
  updatePipelineConfig(config: Partial<EventPipelineConfig>): void {
    this.pipeline.updateConfig(config);
  }

  /**
   * Get pipeline configuration
   * @returns Current pipeline configuration
   */
  getPipelineConfig(): EventPipelineConfig {
    return this.pipeline.getConfig();
  }

  /**
   * Get current queue size
   * @returns Number of events in queue
   */
  getQueueSize(): number {
    return this.pipeline.getQueueSize();
  }
}

// Export singleton instance
export const optimizedEventBus = new OptimizedEventBus();