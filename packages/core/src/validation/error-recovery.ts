import { LAPAEventBus } from '../core/event-bus.ts';
import { AgentTool } from '../core/types/agent-types.ts';
import { HandoffRequest } from '../orchestrator/handoffs.js';

/**
 * Error Recovery Manager for LAPA v1.2 Phase 10
 * Implements error recovery mechanisms with retry strategies and fallback paths
 */
export class ErrorRecoveryManager {
  private eventBus: LAPAEventBus;
  private maxRetries: number;
  private baseDelay: number;

  constructor(eventBus: LAPAEventBus, maxRetries: number = 3, baseDelay: number = 1000) {
    this.eventBus = eventBus;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  /**
   * Execute a tool with retry mechanism
   * @param tool Agent tool to execute
   * @param context Execution context
   * @returns Promise that resolves with the tool execution result
   */
  async executeToolWithRetry(
    tool: AgentTool,
    context: any
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Attempt to execute the tool
        const result = await tool.execute(context);
        
        // If successful, publish success event and return result
        await this.eventBus.publish({
          id: `tool-success-${Date.now()}`,
          type: 'tool.execution.recovered',
          timestamp: Date.now(),
          source: 'error-recovery-manager',
          payload: {
            toolName: tool.name,
            attempt,
            result
          }
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log the error
        console.warn(`Tool execution attempt ${attempt} failed for tool ${tool.name}:`, lastError.message);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.calculateExponentialBackoff(attempt);
          console.log(`Retrying tool ${tool.name} in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          
          // Publish retry event
          await this.eventBus.publish({
            id: `tool-retry-${Date.now()}`,
            type: 'tool.execution.retry',
            timestamp: Date.now(),
            source: 'error-recovery-manager',
            payload: {
              toolName: tool.name,
              attempt: attempt + 1,
              maxAttempts: this.maxRetries,
              delay,
              error: lastError.message
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, publish failure event and throw error
    await this.eventBus.publish({
      id: `tool-failure-${Date.now()}`,
      type: 'tool.execution.failed.permanently',
      timestamp: Date.now(),
      source: 'error-recovery-manager',
      payload: {
        toolName: tool.name,
        attempts: this.maxRetries,
        error: lastError?.message || 'Unknown error'
      }
    });

    throw new Error(`Tool execution failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Execute a handoff with retry and fallback mechanism
   * @param handoffFn Function to execute handoff (will be retried on failure)
   * @param fallbackFn Fallback function if handoff fails after retries
   * @returns Promise that resolves with the handoff result
   */
  async executeHandoffWithFallback<T>(
    handoffFn: () => Promise<T>,
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    // First, try handoff with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Attempt primary handoff
        const result = await handoffFn();
        
        // Publish success event
        await this.eventBus.publish({
          id: `handoff-success-${Date.now()}`,
          type: 'handoff.recovered',
          timestamp: Date.now(),
          source: 'error-recovery-manager',
          payload: {
            strategy: 'primary',
            attempt,
            result
          }
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.calculateExponentialBackoff(attempt);
          console.log(`Retrying handoff in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          
          // Publish retry event
          await this.eventBus.publish({
            id: `handoff-retry-${Date.now()}`,
            type: 'handoff.retry',
            timestamp: Date.now(),
            source: 'error-recovery-manager',
            payload: {
              attempt: attempt + 1,
              maxAttempts: this.maxRetries,
              delay,
              error: lastError.message
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all retries failed, try fallback
    console.warn('Primary handoff failed after retries, attempting fallback:', lastError);
    
    // Publish fallback initiation event
    await this.eventBus.publish({
      id: `handoff-fallback-init-${Date.now()}`,
      type: 'handoff.fallback.initiated',
      timestamp: Date.now(),
      source: 'error-recovery-manager',
      payload: {
        primaryError: lastError instanceof Error ? lastError.message : String(lastError),
        retriesAttempted: this.maxRetries
      }
    });
    
    try {
      // Attempt fallback
      const result = await fallbackFn();
      
      // Publish fallback success event
      await this.eventBus.publish({
        id: `handoff-fallback-success-${Date.now()}`,
        type: 'handoff.fallback.succeeded',
        timestamp: Date.now(),
        source: 'error-recovery-manager',
        payload: {
          result
        }
      });
      
      return result;
    } catch (fallbackError) {
      // Publish permanent failure event
      await this.eventBus.publish({
        id: `handoff-failure-${Date.now()}`,
        type: 'handoff.failed.permanently',
        timestamp: Date.now(),
        source: 'error-recovery-manager',
        payload: {
          primaryError: lastError instanceof Error ? lastError.message : String(lastError),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        }
      });
      
      throw new Error(`Both primary handoff (after ${this.maxRetries} retries) and fallback failed. Primary: ${lastError instanceof Error ? lastError.message : String(lastError)}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt Attempt number (1-indexed)
   * @returns Delay in milliseconds
   */
  private calculateExponentialBackoff(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.5 * this.baseDelay; // Up to 50% of base delay
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Reset retry counter for a specific operation
   * @param operationId Identifier for the operation
   */
  resetRetryCounter(operationId: string): void {
    // In a more complex implementation, we might track retry counters per operation
    // For now, this is a placeholder
    console.log(`Resetting retry counter for operation: ${operationId}`);
  }
}