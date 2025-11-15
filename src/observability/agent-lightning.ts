/**
 * Agent Lightning Integration for LAPA
 * 
 * Integrates Microsoft's Agent Lightning framework for agent training and optimization.
 * Provides zero-code-change agent optimization with RL, prompt optimization, and fine-tuning.
 * 
 * Reference: https://github.com/microsoft/agent-lightning
 */

import type { LAPAEventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

/**
 * Agent Lightning configuration
 */
export interface AgentLightningConfig {
  enabled: boolean;
  apiKey?: string;
  projectName?: string;
  environment?: string;
  enableRLTraining?: boolean;
  enablePromptOptimization?: boolean;
  enableFineTuning?: boolean;
}

/**
 * Agent Lightning span tracking
 */
export interface AgentLightningSpan {
  spanId: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
}

/**
 * Agent Lightning adapter
 * 
 * Provides lightweight tracing hooks compatible with Agent Lightning's `agl.emit_xxx()` pattern
 */
export class AgentLightningAdapter {
  private config: AgentLightningConfig;
  private eventBus: LAPAEventBus;
  private activeSpans: Map<string, AgentLightningSpan> = new Map();
  private spanQueue: AgentLightningSpan[] = [];

  constructor(config: AgentLightningConfig, eventBus: LAPAEventBus) {
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      projectName: config.projectName || 'lapa-v1.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enableRLTraining: config.enableRLTraining ?? true,
      enablePromptOptimization: config.enablePromptOptimization ?? true,
      enableFineTuning: config.enableFineTuning ?? false
    };
    this.eventBus = eventBus;

    if (this.config.enabled) {
      this.setupEventListeners();
    }
  }

  /**
   * Setup event bus listeners for automatic span tracking
   */
  private setupEventListeners(): void {
    // Track agent events
    this.eventBus.subscribe('agent.created' as any, (event: LAPAEvent) => {
      this.emitSpan('agent.created', {
        agentId: (event.payload as any).agentId,
        agentType: (event.payload as any).type,
        capabilities: (event.payload as any).capabilities
      }, event.id);
    });

    // Track task events
    this.eventBus.subscribe('task.created' as any, (event: LAPAEvent) => {
      this.emitSpan('task.created', {
        taskId: (event.payload as any).taskId,
        taskType: (event.payload as any).type,
        priority: (event.payload as any).priority
      }, event.id);
    });

    this.eventBus.subscribe('task.completed' as any, (event: LAPAEvent) => {
      this.endSpan(event.id, 'success', {
        duration: (event.payload as any).duration,
        result: (event.payload as any).result
      });
    });

    this.eventBus.subscribe('task.failed' as any, (event: LAPAEvent) => {
      this.endSpan(event.id, 'error', {
        error: (event.payload as any).error,
        duration: (event.payload as any).duration
      });
    });

    // Track handoff events
    this.eventBus.subscribe('handoff.initiated' as any, (event: LAPAEvent) => {
      this.emitSpan('handoff.initiated', {
        sourceAgentId: (event.payload as any).sourceAgentId,
        targetAgentId: (event.payload as any).targetAgentId,
        taskId: (event.payload as any).taskId
      }, event.id);
    });

    // Track tool execution
    this.eventBus.subscribe('tool.execution.started' as any, (event: LAPAEvent) => {
      this.emitSpan('tool.execution', {
        toolName: (event.payload as any).toolName,
        agentId: (event.payload as any).agentId,
        arguments: (event.payload as any).arguments
      }, event.id);
    });

    this.eventBus.subscribe('tool.execution.completed' as any, (event: LAPAEvent) => {
      this.endSpan(event.id, 'success', {
        result: (event.payload as any).result,
        duration: (event.payload as any).duration
      });
    });
  }

  /**
   * Emit a span (compatible with agl.emit_xxx() pattern)
   */
  public emitSpan(
    name: string,
    attributes: Record<string, any> = {},
    spanId?: string
  ): string {
    if (!this.config.enabled) {
      return spanId || this.generateSpanId();
    }

    const traceId = this.generateTraceId();
    const finalSpanId = spanId || this.generateSpanId();

    const span: AgentLightningSpan = {
      spanId: finalSpanId,
      traceId,
      name,
      startTime: Date.now(),
      attributes,
      events: []
    };

    this.activeSpans.set(finalSpanId, span);

    // Publish span event for LightningStore
    this.eventBus.publish({
      type: 'agentlightning.span.started',
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'agent-lightning-adapter',
      payload: {
        spanId: finalSpanId,
        traceId,
        name,
        attributes,
        timestamp: span.startTime
      }
    } as any);

    return finalSpanId;
  }

  /**
   * End a span
   */
  public endSpan(
    spanId: string,
    status: 'success' | 'error' | 'cancelled',
    attributes: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    span.endTime = Date.now();
    span.attributes = { ...span.attributes, ...attributes, status };

    // Publish span completion event
    this.eventBus.publish({
      type: 'agentlightning.span.completed',
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'agent-lightning-adapter',
      payload: {
        spanId,
        traceId: span.traceId,
        name: span.name,
        duration: span.endTime - span.startTime,
        status,
        attributes: span.attributes
      }
    } as any);

    this.activeSpans.delete(spanId);
    this.spanQueue.push(span);
  }

  /**
   * Emit an event within a span
   */
  public emitEvent(
    spanId: string,
    eventName: string,
    attributes?: Record<string, any>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes
    });
  }

  /**
   * Emit a reward signal (for RL training)
   */
  public emitReward(
    spanId: string,
    reward: number,
    attributes?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.enableRLTraining) {
      return;
    }

    this.eventBus.publish({
      type: 'agentlightning.reward',
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'agent-lightning-adapter',
      payload: {
        spanId,
        reward,
        attributes,
        timestamp: Date.now()
      }
    } as any);
  }

  /**
   * Emit a prompt usage (for prompt optimization)
   */
  public emitPrompt(
    promptId: string,
    promptText: string,
    result: any,
    attributes?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.enablePromptOptimization) {
      return;
    }

    this.eventBus.publish({
      type: 'agentlightning.prompt.used',
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'agent-lightning-adapter',
      payload: {
        promptId,
        promptText,
        result,
        attributes,
        timestamp: Date.now()
      }
    } as any);
  }

  /**
   * Get all active spans
   */
  public getActiveSpans(): AgentLightningSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Get span queue (completed spans)
   */
  public getSpanQueue(): AgentLightningSpan[] {
    return this.spanQueue;
  }

  /**
   * Flush spans to LightningStore
   */
  public async flushSpans(): Promise<void> {
    // This would flush to LightningStore
    // Implementation would depend on LightningStore adapter
    this.spanQueue = [];
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create Agent Lightning adapter instance
 */
export function createAgentLightningAdapter(
  config: AgentLightningConfig,
  eventBus: LAPAEventBus
): AgentLightningAdapter {
  return new AgentLightningAdapter(config, eventBus);
}

