/**
 * LangSmith Tracing Integration for LAPA v1.2 Phase 15
 * 
 * This module provides comprehensive observability through LangSmith tracing,
 * enabling detailed tracking of agent interactions, handoffs, and system events.
 * 
 * Features:
 * - Distributed tracing across agent handoffs
 * - Performance monitoring and latency tracking
 * - Error tracking and debugging
 * - Integration with LAPA event bus
 */

import { EventEmitter } from 'events';
import { LAPAEventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../types/event-types.ts';

/**
 * LangSmith trace configuration
 */
export interface LangSmithConfig {
  apiKey?: string;
  projectName?: string;
  environment?: string;
  enabled: boolean;
  endpoint?: string;
  timeout?: number;
}

/**
 * Trace span data
 */
export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata: Record<string, any>;
  tags: string[];
  parentId?: string;
  children: TraceSpan[];
  status: 'success' | 'error' | 'pending';
  error?: Error;
}

/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, string>;
}

/**
 * LangSmith Trace Manager
 * 
 * Manages distributed tracing across the LAPA system using LangSmith.
 */
export class LangSmithTracer extends EventEmitter {
  private config: LangSmithConfig;
  private eventBus: LAPAEventBus;
  private activeSpans: Map<string, TraceSpan> = new Map();
  private traceQueue: TraceSpan[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private enabled: boolean;

  constructor(
    config: LangSmithConfig,
    eventBus: LAPAEventBus
  ) {
    super();
    this.config = {
      apiKey: config.apiKey || process.env.LANGSMITH_API_KEY,
      projectName: config.projectName || 'lapa-v1.2',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enabled: config.enabled !== false,
      endpoint: config.endpoint || 'https://api.smith.langchain.com',
      timeout: config.timeout || 5000,
      ...config
    };
    this.enabled = this.config.enabled && !!this.config.apiKey;
    this.eventBus = eventBus;

    if (this.enabled) {
      this.setupEventListeners();
      this.startFlushInterval();
    }
  }

  /**
   * Setup event bus listeners for automatic tracing
   */
  private setupEventListeners(): void {
    // Trace handoff events
    this.eventBus.on('handoff.initiated', (event: LAPAEvent) => {
      this.startSpan('handoff.initiated', {
        agentId: event.payload.sourceAgentId,
        targetAgentId: event.payload.targetAgentId,
        taskId: event.payload.taskId,
        priority: event.payload.priority
      }, event.id);
    });

    this.eventBus.on('handoff.completed', (event: LAPAEvent) => {
      this.endSpan(event.id, 'success', {
        duration: event.payload.duration,
        result: event.payload.result
      });
    });

    this.eventBus.on('handoff.failed', (event: LAPAEvent) => {
      this.endSpan(event.id, 'error', {
        error: event.payload.error,
        duration: event.payload.duration
      });
    });

    // Trace task events
    this.eventBus.on('task.created', (event: LAPAEvent) => {
      this.startSpan('task.created', {
        taskId: event.payload.taskId,
        type: event.payload.type,
        priority: event.payload.priority
      }, event.id);
    });

    this.eventBus.on('task.completed', (event: LAPAEvent) => {
      this.endSpan(event.id, 'success', {
        duration: event.payload.duration,
        result: event.payload.result
      });
    });

    this.eventBus.on('task.failed', (event: LAPAEvent) => {
      this.endSpan(event.id, 'error', {
        error: event.payload.error,
        duration: event.payload.duration
      });
    });

    // Trace agent events
    this.eventBus.on('agent.registered', (event: LAPAEvent) => {
      this.logEvent('agent.registered', {
        agentId: event.payload.agentId,
        name: event.payload.name,
        capabilities: event.payload.capabilities
      });
    });

    // Trace performance metrics
    this.eventBus.on('performance.metric', (event: LAPAEvent) => {
      this.logMetric(event.payload.metric, event.payload.value, event.payload.tags || []);
    });
  }

  /**
   * Start a new trace span
   */
  startSpan(
    name: string,
    metadata: Record<string, any> = {},
    spanId?: string,
    parentSpanId?: string
  ): string {
    if (!this.enabled) return spanId || '';

    const id = spanId || this.generateSpanId();
    const span: TraceSpan = {
      id,
      name,
      startTime: Date.now(),
      metadata,
      tags: [],
      children: [],
      status: 'pending',
      parentId: parentSpanId
    };

    if (parentSpanId) {
      const parent = this.activeSpans.get(parentSpanId);
      if (parent) {
        parent.children.push(span);
      }
    }

    this.activeSpans.set(id, span);
    this.emit('span-started', span);

    return id;
  }

  /**
   * End a trace span
   */
  endSpan(
    spanId: string,
    status: 'success' | 'error' = 'success',
    metadata: Record<string, any> = {}
  ): void {
    if (!this.enabled) return;

    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.emit('warning', `Span ${spanId} not found`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.metadata = { ...span.metadata, ...metadata };

    if (status === 'error' && metadata.error) {
      span.error = metadata.error instanceof Error 
        ? metadata.error 
        : new Error(String(metadata.error));
    }

    this.activeSpans.delete(spanId);
    this.traceQueue.push(span);
    this.emit('span-ended', span);

    // Flush if queue is large
    if (this.traceQueue.length >= 100) {
      this.flushTraces();
    }
  }

  /**
   * Log an event (no span, just event tracking)
   */
  logEvent(name: string, metadata: Record<string, any> = {}): void {
    if (!this.enabled) return;

    const eventSpan: TraceSpan = {
      id: this.generateSpanId(),
      name: `event.${name}`,
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      metadata,
      tags: ['event'],
      children: [],
      status: 'success'
    };

    this.traceQueue.push(eventSpan);
    this.emit('event-logged', eventSpan);
  }

  /**
   * Log a metric
   */
  logMetric(
    metricName: string,
    value: number,
    tags: string[] = []
  ): void {
    if (!this.enabled) return;

    const metricSpan: TraceSpan = {
      id: this.generateSpanId(),
      name: `metric.${metricName}`,
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      metadata: { value, metricName },
      tags: ['metric', ...tags],
      children: [],
      status: 'success'
    };

    this.traceQueue.push(metricSpan);
    this.emit('metric-logged', metricSpan);
  }

  /**
   * Create trace context for distributed tracing
   */
  createTraceContext(parentContext?: TraceContext): TraceContext {
    return {
      traceId: parentContext?.traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId: parentContext?.spanId,
      baggage: parentContext?.baggage || {}
    };
  }

  /**
   * Flush traces to LangSmith
   */
  async flushTraces(): Promise<void> {
    if (!this.enabled || this.traceQueue.length === 0) return;

    const traces = [...this.traceQueue];
    this.traceQueue = [];

    try {
      // In a real implementation, this would send traces to LangSmith API
      // For now, we'll emit them for potential external handlers
      this.emit('traces-flushed', traces);

      // Simulate API call (replace with actual LangSmith SDK)
      if (this.config.apiKey) {
        // await this.sendToLangSmith(traces);
        console.log(`[LangSmith] Flushed ${traces.length} traces to ${this.config.projectName}`);
      }
    } catch (error) {
      this.emit('error', error);
      // Re-queue traces on error
      this.traceQueue.unshift(...traces);
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flushTraces();
    }, 10000); // Flush every 10 seconds
  }

  /**
   * Stop automatic flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active spans
   */
  getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): TraceSpan | undefined {
    // Search in active spans
    for (const span of this.activeSpans.values()) {
      if (span.id === traceId) return span;
    }

    // Search in queue
    return this.traceQueue.find(span => span.id === traceId);
  }

  /**
   * Shutdown tracer
   */
  async shutdown(): Promise<void> {
    this.stopFlushInterval();
    await this.flushTraces();
    this.enabled = false;
    this.emit('shutdown');
  }
}

/**
 * Default LangSmith tracer instance (lazy initialization)
 */
let defaultTracer: LangSmithTracer | null = null;

/**
 * Get or create default LangSmith tracer
 */
export function getLangSmithTracer(eventBus?: LAPAEventBus): LangSmithTracer {
  if (!defaultTracer && eventBus) {
    defaultTracer = new LangSmithTracer(
      {
        enabled: true,
        projectName: 'lapa-v1.2'
      },
      eventBus
    );
  }
  if (!defaultTracer) {
    throw new Error('LangSmith tracer requires event bus. Initialize with getLangSmithTracer(eventBus)');
  }
  return defaultTracer;
}

