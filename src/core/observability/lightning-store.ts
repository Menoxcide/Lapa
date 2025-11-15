/**
 * LightningStore Adapter for LAPA
 * 
 * Adapts LAPA's event bus system to Agent Lightning's LightningStore format.
 * Central hub for tasks, resources, and traces compatible with Agent Lightning.
 * 
 * Reference: https://github.com/microsoft/agent-lightning
 */

import type { LAPAEventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

/**
 * LightningStore task
 */
export interface LightningTask {
  taskId: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * LightningStore resource
 */
export interface LightningResource {
  resourceId: string;
  type: 'prompt' | 'model' | 'tool' | 'agent' | 'other';
  content: any;
  version?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * LightningStore trace
 */
export interface LightningTrace {
  traceId: string;
  taskId?: string;
  spans: Array<{
    spanId: string;
    name: string;
    startTime: number;
    endTime?: number;
    attributes: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
  createdAt: number;
}

/**
 * LightningStore adapter
 */
export class LightningStoreAdapter {
  private eventBus: LAPAEventBus;
  private tasks: Map<string, LightningTask> = new Map();
  private resources: Map<string, LightningResource> = new Map();
  private traces: Map<string, LightningTrace> = new Map();

  constructor(eventBus: LAPAEventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  /**
   * Setup event bus listeners
   */
  private setupEventListeners(): void {
    // Listen for span events from Agent Lightning adapter
    this.eventBus.subscribe('agentlightning.span.started' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.addSpan(payload.traceId, {
        spanId: payload.spanId,
        name: payload.name,
        startTime: payload.timestamp,
        attributes: payload.attributes
      });
    });

    this.eventBus.subscribe('agentlightning.span.completed' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.updateSpan(payload.traceId, payload.spanId, {
        endTime: payload.timestamp,
        attributes: { ...payload.attributes, status: payload.status }
      });
    });

    // Listen for reward events (RL training)
    this.eventBus.subscribe('agentlightning.reward' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.addReward(payload.spanId, payload.reward, payload.attributes);
    });

    // Listen for prompt usage (prompt optimization)
    this.eventBus.subscribe('agentlightning.prompt.used' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.addPromptUsage(payload.promptId, payload.promptText, payload.result, payload.attributes);
    });

    // Listen for task events
    this.eventBus.subscribe('task.created' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.createTask({
        taskId: payload.taskId,
        name: payload.type || 'task',
        description: payload.description,
        status: 'pending',
        metadata: payload
      });
    });

    this.eventBus.subscribe('task.completed' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.updateTask(payload.taskId, { status: 'completed', metadata: payload });
    });

    this.eventBus.subscribe('task.failed' as any, (event: LAPAEvent) => {
      const payload = event.payload as any;
      this.updateTask(payload.taskId, { status: 'failed', metadata: payload });
    });
  }

  /**
   * Create a task
   */
  public createTask(task: Omit<LightningTask, 'createdAt' | 'updatedAt'>): LightningTask {
    const now = Date.now();
    const lightningTask: LightningTask = {
      ...task,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.taskId, lightningTask);
    return lightningTask;
  }

  /**
   * Update a task
   */
  public updateTask(taskId: string, updates: Partial<LightningTask>): LightningTask | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const updatedTask: LightningTask = {
      ...task,
      ...updates,
      updatedAt: Date.now()
    };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  /**
   * Get a task
   */
  public getTask(taskId: string): LightningTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Create a resource
   */
  public createResource(
    resource: Omit<LightningResource, 'createdAt' | 'updatedAt'>
  ): LightningResource {
    const now = Date.now();
    const lightningResource: LightningResource = {
      ...resource,
      createdAt: now,
      updatedAt: now
    };
    this.resources.set(resource.resourceId, lightningResource);
    return lightningResource;
  }

  /**
   * Update a resource
   */
  public updateResource(
    resourceId: string,
    updates: Partial<LightningResource>
  ): LightningResource | null {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return null;
    }

    const updatedResource: LightningResource = {
      ...resource,
      ...updates,
      updatedAt: Date.now()
    };
    this.resources.set(resourceId, updatedResource);
    return updatedResource;
  }

  /**
   * Get a resource
   */
  public getResource(resourceId: string): LightningResource | null {
    return this.resources.get(resourceId) || null;
  }

  /**
   * Add a span to a trace
   */
  public addSpan(traceId: string, span: LightningTrace['spans'][0]): void {
    let trace = this.traces.get(traceId);
    if (!trace) {
      trace = {
        traceId,
        spans: [],
        createdAt: Date.now()
      };
      this.traces.set(traceId, trace);
    }

    trace.spans.push(span);
  }

  /**
   * Update a span in a trace
   */
  public updateSpan(
    traceId: string,
    spanId: string,
    updates: Partial<LightningTrace['spans'][0]>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) {
      return;
    }

    Object.assign(span, updates);
  }

  /**
   * Get a trace
   */
  public getTrace(traceId: string): LightningTrace | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Add reward signal (for RL training)
   */
  public addReward(spanId: string, reward: number, attributes?: Record<string, any>): void {
    // Store reward for RL training algorithm
    // This would integrate with RL training system
    this.eventBus.publish({
      type: 'lightningstore.reward.added',
      id: this.generateEventId(),
      timestamp: Date.now(),
      source: 'lightning-store-adapter',
      payload: {
        spanId,
        reward,
        attributes,
        timestamp: Date.now()
      }
    } as any);
  }

  /**
   * Add prompt usage (for prompt optimization)
   */
  public addPromptUsage(
    promptId: string,
    promptText: string,
    result: any,
    attributes?: Record<string, any>
  ): void {
    // Store prompt usage for optimization
    const resourceId = `prompt-${promptId}`;
    let resource = this.resources.get(resourceId);

    if (!resource) {
      resource = this.createResource({
        resourceId,
        type: 'prompt',
        content: { promptText, promptId },
        metadata: { usageCount: 0, results: [] }
      });
    }

    // Update prompt usage
    const metadata = resource.metadata || {};
    metadata.usageCount = (metadata.usageCount || 0) + 1;
    metadata.results = [...(metadata.results || []), { result, attributes, timestamp: Date.now() }];

    this.updateResource(resourceId, { metadata });
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): LightningTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get all resources
   */
  public getAllResources(): LightningResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get all traces
   */
  public getAllTraces(): LightningTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create LightningStore adapter instance
 */
export function createLightningStoreAdapter(eventBus: LAPAEventBus): LightningStoreAdapter {
  return new LightningStoreAdapter(eventBus);
}

