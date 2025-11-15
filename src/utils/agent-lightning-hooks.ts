/**
 * Agent Lightning Hooks for LAPA Agents
 * 
 * Provides convenient hooks for agents to integrate with Agent Lightning.
 * These hooks follow the `agl.emit_xxx()` pattern and integrate with LAPA's event bus.
 * 
 * Usage in agents:
 * ```typescript
 * import { agl } from '../utils/agent-lightning-hooks.ts';
 * 
 * const spanId = agl.emitSpan('agent.task.execute', { taskId, agentId });
 * // ... do work ...
 * agl.emitReward(spanId, 1.0, { success: true });
 * agl.endSpan(spanId, 'success');
 * ```
 * 
 * Reference: https://github.com/microsoft/agent-lightning
 */

import { AgentLightningAdapter, createAgentLightningAdapter, type AgentLightningConfig } from '../observability/agent-lightning.ts';
import { eventBus } from '../core/event-bus.ts';

// Default Agent Lightning configuration
const DEFAULT_CONFIG: AgentLightningConfig = {
  enabled: true,
  projectName: 'lapa-v1.0',
  environment: process.env.NODE_ENV || 'development',
  enableRLTraining: true,
  enablePromptOptimization: true,
  enableFineTuning: false
};

// Singleton Agent Lightning adapter instance
let adapterInstance: AgentLightningAdapter | null = null;

/**
 * Get or create Agent Lightning adapter instance
 */
function getAdapter(): AgentLightningAdapter {
  if (!adapterInstance) {
    adapterInstance = createAgentLightningAdapter(DEFAULT_CONFIG, eventBus);
  }
  return adapterInstance;
}

/**
 * Agent Lightning hooks (agl) - Compatible with Agent Lightning's `agl.emit_xxx()` pattern
 */
export const agl = {
  /**
   * Emit a span (compatible with agl.emitSpan pattern)
   * 
   * @param name - Span name
   * @param attributes - Span attributes
   * @param spanId - Optional span ID
   * @returns Span ID
   */
  emitSpan: (name: string, attributes: Record<string, any> = {}, spanId?: string): string => {
    return getAdapter().emitSpan(name, attributes, spanId);
  },

  /**
   * End a span
   * 
   * @param spanId - Span ID
   * @param status - Span status
   * @param attributes - Additional attributes
   */
  endSpan: (spanId: string, status: 'success' | 'error' | 'cancelled', attributes: Record<string, any> = {}): void => {
    getAdapter().endSpan(spanId, status, attributes);
  },

  /**
   * Emit an event within a span
   * 
   * @param spanId - Span ID
   * @param eventName - Event name
   * @param attributes - Event attributes
   */
  emitEvent: (spanId: string, eventName: string, attributes?: Record<string, any>): void => {
    getAdapter().emitEvent(spanId, eventName, attributes);
  },

  /**
   * Emit a reward signal (for RL training)
   * 
   * @param spanId - Span ID
   * @param reward - Reward value
   * @param attributes - Reward attributes
   */
  emitReward: (spanId: string, reward: number, attributes?: Record<string, any>): void => {
    getAdapter().emitReward(spanId, reward, attributes);
  },

  /**
   * Emit a prompt usage (for prompt optimization)
   * 
   * @param promptId - Prompt ID
   * @param promptText - Prompt text
   * @param result - Prompt result
   * @param attributes - Additional attributes
   */
  emitPrompt: (promptId: string, promptText: string, result: any, attributes?: Record<string, any>): void => {
    getAdapter().emitPrompt(promptId, promptText, result, attributes);
  },

  /**
   * Get active spans
   * 
   * @returns Array of active spans
   */
  getActiveSpans: () => {
    return getAdapter().getActiveSpans();
  },

  /**
   * Flush spans to LightningStore
   */
  flushSpans: async () => {
    await getAdapter().flushSpans();
  }
};

/**
 * Initialize Agent Lightning hooks with custom configuration
 */
export function initializeAgentLightning(config?: Partial<AgentLightningConfig>): void {
  const mergedConfig: AgentLightningConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  adapterInstance = createAgentLightningAdapter(mergedConfig, eventBus);
}

/**
 * Example usage helper for agents
 */
export function withAgentLightningSpan<T>(
  name: string,
  attributes: Record<string, any>,
  fn: (spanId: string) => Promise<T>
): Promise<T> {
  const spanId = agl.emitSpan(name, attributes);
  
  return fn(spanId)
    .then(result => {
      agl.endSpan(spanId, 'success', { result: typeof result === 'object' ? JSON.stringify(result) : result });
      return result;
    })
    .catch(error => {
      agl.endSpan(spanId, 'error', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    });
}

