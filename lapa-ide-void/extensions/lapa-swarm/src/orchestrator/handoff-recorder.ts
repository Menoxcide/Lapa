/**
 * Swarm Handoff Recording System for LAPA v1.0
 * 
 * Records, analyzes, and replays agent handoffs for debugging and learning.
 * Captures complete handoff context, timing, and outcomes.
 * 
 * Features:
 * - Complete handoff recording
 * - Handoff replay for debugging
 * - Handoff analysis and metrics
 * - Storage and retrieval
 * - Performance tracking
 */

import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { performance } from 'perf_hooks';

// Handoff record
export interface HandoffRecord {
  id: string;
  timestamp: number;
  sourceAgentId: string;
  targetAgentId: string;
  taskId: string;
  context: Record<string, any>;
  handoffRequest: any;
  handoffResponse: any;
  duration: number;
  success: boolean;
  error?: string;
  metadata: {
    priority: string;
    contextSize: number;
    compressionRatio?: number;
    handshakeAccepted: boolean;
  };
}

// Handoff replay options
export interface HandoffReplayOptions {
  recordId: string;
  modifyContext?: (context: Record<string, any>) => Record<string, any>;
  skipHandshake?: boolean;
}

// Handoff analysis result
export interface HandoffAnalysis {
  recordId: string;
  summary: {
    totalHandoffs: number;
    successfulHandoffs: number;
    failedHandoffs: number;
    averageDuration: number;
    totalDuration: number;
  };
  patterns: {
    commonSourceAgents: Array<{ agentId: string; count: number }>;
    commonTargetAgents: Array<{ agentId: string; count: number }>;
    failureReasons: Array<{ reason: string; count: number }>;
  };
  timeline: Array<{
    timestamp: number;
    sourceAgentId: string;
    targetAgentId: string;
    duration: number;
    success: boolean;
  }>;
}

// Recording options
export interface RecordingOptions {
  enabled: boolean;
  maxRecords?: number;
  recordContext?: boolean;
  recordFullContext?: boolean;
  compressionEnabled?: boolean;
}

/**
 * Swarm Handoff Recorder Tool
 */
export class HandoffRecorder extends BaseAgentTool {
  private records: Map<string, HandoffRecord> = new Map();
  private memoriEngine?: MemoriEngine;
  private options: RecordingOptions;

  constructor(memoriEngine?: MemoriEngine, options: RecordingOptions = { enabled: true }) {
    super(
      'handoff-recorder',
      'debugging',
      'Records, analyzes, and replays swarm handoffs',
      '1.0.0'
    );
    this.memoriEngine = memoriEngine;
    this.options = {
      enabled: true,
      maxRecords: 1000,
      recordContext: true,
      recordFullContext: false,
      compressionEnabled: true,
      ...options
    };
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for handoff events
   */
  private setupEventListeners(): void {
    if (!this.options.enabled) return;

    // Listen for handoff events
    eventBus.on('handoff.initiated', async (data: any) => {
      await this.recordHandoffStart(data);
    });

    eventBus.on('handoff.completed', async (data: any) => {
      await this.recordHandoffComplete(data);
    });

    eventBus.on('handoff.failed', async (data: any) => {
      await this.recordHandoffFailure(data);
    });
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    const action = params.action;
    if (!action || typeof action !== 'string') {
      return false;
    }

    if (action === 'record' || action === 'replay' || action === 'analyze' || action === 'list' || action === 'get') {
      return true;
    }

    return false;
  }

  /**
   * Executes handoff recorder operation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();

    try {
      const action = context.parameters.action as string;

      switch (action) {
        case 'record':
          return await this.recordHandoff(context, startTime);
        case 'replay':
          return await this.replayHandoff(context, startTime);
        case 'analyze':
          return await this.analyzeHandoffs(context, startTime);
        case 'list':
          return await this.listHandoffs(context, startTime);
        case 'get':
          return await this.getHandoff(context, startTime);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Supported: record, replay, analyze, list, get`,
            executionTime: performance.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime
      };
    }
  }

  /**
   * Records a handoff manually
   */
  private async recordHandoff(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const sourceAgentId = context.parameters.sourceAgentId as string;
    const targetAgentId = context.parameters.targetAgentId as string;
    const taskId = context.parameters.taskId as string;
    const handoffContext = context.parameters.context as Record<string, any>;
    const handoffRequest = context.parameters.handoffRequest as any;
    const handoffResponse = context.parameters.handoffResponse as any;

    const record: HandoffRecord = {
      id: this.generateRecordId(),
      timestamp: Date.now(),
      sourceAgentId,
      targetAgentId,
      taskId,
      context: this.options.recordContext ? handoffContext : {},
      handoffRequest,
      handoffResponse,
      duration: handoffResponse?.duration || 0,
      success: handoffResponse?.success !== false,
      error: handoffResponse?.error,
      metadata: {
        priority: handoffRequest?.priority || 'medium',
        contextSize: JSON.stringify(handoffContext || {}).length,
        compressionRatio: handoffResponse?.compressionRatio,
        handshakeAccepted: handoffResponse?.handshakeAccepted !== false
      }
    };

    this.storeRecord(record);

    return {
      success: true,
      data: { recordId: record.id, record },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Replays a recorded handoff
   */
  private async replayHandoff(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const recordId = context.parameters.recordId as string;
    const modifyContext = context.parameters.modifyContext as ((ctx: Record<string, any>) => Record<string, any>) | undefined;
    const skipHandshake = context.parameters.skipHandshake === true;

    const record = this.records.get(recordId);
    if (!record) {
      return {
        success: false,
        error: `Handoff record not found: ${recordId}`,
        executionTime: performance.now() - startTime
      };
    }

    // Prepare context for replay
    let replayContext = { ...record.context };
    if (modifyContext) {
      replayContext = modifyContext(replayContext);
    }

    // Publish replay event (actual handoff would be initiated by handoff system)
    await this.publishEvent('handoff.replay', {
      recordId,
      originalRecord: record,
      replayContext,
      skipHandshake,
      taskId: context.taskId
    });

    return {
      success: true,
      data: {
        recordId,
        replayContext,
        originalRecord: record
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Analyzes handoff records
   */
  private async analyzeHandoffs(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const taskId = context.parameters.taskId as string | undefined;
    const sourceAgentId = context.parameters.sourceAgentId as string | undefined;
    const targetAgentId = context.parameters.targetAgentId as string | undefined;

    // Filter records
    let filteredRecords = Array.from(this.records.values());
    if (taskId) {
      filteredRecords = filteredRecords.filter(r => r.taskId === taskId);
    }
    if (sourceAgentId) {
      filteredRecords = filteredRecords.filter(r => r.sourceAgentId === sourceAgentId);
    }
    if (targetAgentId) {
      filteredRecords = filteredRecords.filter(r => r.targetAgentId === targetAgentId);
    }

    if (filteredRecords.length === 0) {
      return {
        success: true,
        data: {
          summary: {
            totalHandoffs: 0,
            successfulHandoffs: 0,
            failedHandoffs: 0,
            averageDuration: 0,
            totalDuration: 0
          },
          patterns: {
            commonSourceAgents: [],
            commonTargetAgents: [],
            failureReasons: []
          },
          timeline: []
        },
        executionTime: performance.now() - startTime
      };
    }

    // Calculate summary
    const successfulHandoffs = filteredRecords.filter(r => r.success).length;
    const failedHandoffs = filteredRecords.filter(r => !r.success).length;
    const totalDuration = filteredRecords.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / filteredRecords.length;

    // Analyze patterns
    const sourceAgentCounts = new Map<string, number>();
    const targetAgentCounts = new Map<string, number>();
    const failureReasons = new Map<string, number>();

    for (const record of filteredRecords) {
      sourceAgentCounts.set(record.sourceAgentId, (sourceAgentCounts.get(record.sourceAgentId) || 0) + 1);
      targetAgentCounts.set(record.targetAgentId, (targetAgentCounts.get(record.targetAgentId) || 0) + 1);
      if (!record.success && record.error) {
        failureReasons.set(record.error, (failureReasons.get(record.error) || 0) + 1);
      }
    }

    const analysis: HandoffAnalysis = {
      recordId: filteredRecords[0]?.id || '',
      summary: {
        totalHandoffs: filteredRecords.length,
        successfulHandoffs,
        failedHandoffs,
        averageDuration,
        totalDuration
      },
      patterns: {
        commonSourceAgents: Array.from(sourceAgentCounts.entries())
          .map(([agentId, count]) => ({ agentId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        commonTargetAgents: Array.from(targetAgentCounts.entries())
          .map(([agentId, count]) => ({ agentId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        failureReasons: Array.from(failureReasons.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },
      timeline: filteredRecords
        .map(r => ({
          timestamp: r.timestamp,
          sourceAgentId: r.sourceAgentId,
          targetAgentId: r.targetAgentId,
          duration: r.duration,
          success: r.success
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
    };

    return {
      success: true,
      data: analysis,
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Lists handoff records
   */
  private async listHandoffs(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const limit = context.parameters.limit ? Number(context.parameters.limit) : 50;
    const offset = context.parameters.offset ? Number(context.parameters.offset) : 0;
    const taskId = context.parameters.taskId as string | undefined;

    let records = Array.from(this.records.values());
    
    if (taskId) {
      records = records.filter(r => r.taskId === taskId);
    }

    // Sort by timestamp (newest first)
    records.sort((a, b) => b.timestamp - a.timestamp);

    const paginated = records.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        records: paginated,
        total: records.length,
        limit,
        offset
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Gets a specific handoff record
   */
  private async getHandoff(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const recordId = context.parameters.recordId as string;

    const record = this.records.get(recordId);
    if (!record) {
      return {
        success: false,
        error: `Handoff record not found: ${recordId}`,
        executionTime: performance.now() - startTime
      };
    }

    return {
      success: true,
      data: { record },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Records handoff start (called by event listener)
   */
  private async recordHandoffStart(data: any): Promise<void> {
    // Handoff start will be completed when handoff.completed or handoff.failed fires
    // For now, we'll create a partial record
  }

  /**
   * Records handoff completion (called by event listener)
   */
  private async recordHandoffComplete(data: any): Promise<void> {
    const record: HandoffRecord = {
      id: this.generateRecordId(),
      timestamp: Date.now(),
      sourceAgentId: data.sourceAgentId || 'unknown',
      targetAgentId: data.targetAgentId || 'unknown',
      taskId: data.taskId || 'unknown',
      context: this.options.recordContext ? (data.context || {}) : {},
      handoffRequest: data.request || {},
      handoffResponse: data.response || {},
      duration: data.duration || 0,
      success: true,
      metadata: {
        priority: data.priority || 'medium',
        contextSize: JSON.stringify(data.context || {}).length,
        compressionRatio: data.compressionRatio,
        handshakeAccepted: data.handshakeAccepted !== false
      }
    };

    this.storeRecord(record);
  }

  /**
   * Records handoff failure (called by event listener)
   */
  private async recordHandoffFailure(data: any): Promise<void> {
    const record: HandoffRecord = {
      id: this.generateRecordId(),
      timestamp: Date.now(),
      sourceAgentId: data.sourceAgentId || 'unknown',
      targetAgentId: data.targetAgentId || 'unknown',
      taskId: data.taskId || 'unknown',
      context: this.options.recordContext ? (data.context || {}) : {},
      handoffRequest: data.request || {},
      handoffResponse: data.response || {},
      duration: data.duration || 0,
      success: false,
      error: data.error || 'Unknown error',
      metadata: {
        priority: data.priority || 'medium',
        contextSize: JSON.stringify(data.context || {}).length,
        compressionRatio: data.compressionRatio,
        handshakeAccepted: false
      }
    };

    this.storeRecord(record);
  }

  /**
   * Stores a handoff record
   */
  private storeRecord(record: HandoffRecord): void {
    // Store in memory
    this.records.set(record.id, record);

    // Enforce max records limit
    if (this.options.maxRecords && this.records.size > this.options.maxRecords) {
      // Remove oldest records
      const sorted = Array.from(this.records.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sorted.slice(0, this.records.size - this.options.maxRecords);
      for (const [id] of toRemove) {
        this.records.delete(id);
      }
    }

    // Store in memory engine if available
    if (this.memoriEngine) {
      this.memoriEngine.store({
        id: record.id,
        type: 'handoff-record',
        content: JSON.stringify(record),
        metadata: {
          sourceAgentId: record.sourceAgentId,
          targetAgentId: record.targetAgentId,
          taskId: record.taskId,
          timestamp: record.timestamp,
          success: record.success
        },
        timestamp: record.timestamp
      }).catch(err => console.warn('Failed to store handoff record:', err));
    }
  }

  /**
   * Generates a unique record ID
   */
  private generateRecordId(): string {
    return `handoff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Standalone function to record a handoff
 */
export async function recordHandoff(
  sourceAgentId: string,
  targetAgentId: string,
  taskId: string,
  context: Record<string, any>,
  handoffRequest: any,
  handoffResponse: any
): Promise<string> {
  const recorder = new HandoffRecorder();
  const context_exec: AgentToolExecutionContext = {
    taskId: `record-${Date.now()}`,
    agentId: 'handoff-recorder',
    parameters: {
      action: 'record',
      sourceAgentId,
      targetAgentId,
      taskId,
      context,
      handoffRequest,
      handoffResponse
    }
  };

  const result = await recorder.execute(context_exec);
  if (!result.success) {
    throw new Error(result.error || 'Failed to record handoff');
  }

  return result.data?.recordId as string;
}

/**
 * Standalone function to replay a handoff
 */
export async function replayHandoff(
  recordId: string,
  modifyContext?: (context: Record<string, any>) => Record<string, any>
): Promise<HandoffRecord> {
  const recorder = new HandoffRecorder();
  const context: AgentToolExecutionContext = {
    taskId: `replay-${Date.now()}`,
    agentId: 'handoff-recorder',
    parameters: {
      action: 'replay',
      recordId,
      modifyContext
    }
  };

  const result = await recorder.execute(context);
  if (!result.success) {
    throw new Error(result.error || 'Failed to replay handoff');
  }

  return result.data?.originalRecord as HandoffRecord;
}

