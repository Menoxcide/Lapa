/**
 * Agent Lightning Trainer for LAPA
 * 
 * Orchestrates training workflows for agents using Agent Lightning framework.
 * Provides RL training, prompt optimization, and supervised fine-tuning workflows.
 * 
 * Reference: https://github.com/microsoft/agent-lightning
 */

import { eventBus } from '../core/event-bus.ts';
import { AgentLightningAdapter, type AgentLightningConfig } from '../observability/agent-lightning.ts';
import { LightningStoreAdapter } from '../observability/lightning-store.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

/**
 * Training algorithm configuration
 */
export interface TrainingAlgorithmConfig {
  type: 'reinforcement_learning' | 'prompt_optimization' | 'supervised_finetuning';
  parameters: Record<string, any>;
  enabled: boolean;
}

/**
 * Training workflow configuration
 */
export interface TrainingWorkflowConfig {
  agentLightning: AgentLightningConfig;
  algorithms: TrainingAlgorithmConfig[];
  enableRLTraining: boolean;
  enablePromptOptimization: boolean;
  enableFineTuning: boolean;
  trainingIntervalMs: number;
  minSpansForTraining: number;
}

/**
 * Agent Lightning Trainer
 * 
 * Orchestrates training workflows for agents
 */
export class AgentLightningTrainer {
  private adapter: AgentLightningAdapter;
  private store: LightningStoreAdapter;
  private config: TrainingWorkflowConfig;
  private trainingInterval: NodeJS.Timeout | null = null;
  private isTraining: boolean = false;

  constructor(config: TrainingWorkflowConfig) {
    this.config = config;
    this.adapter = new AgentLightningAdapter(config.agentLightning, eventBus);
    this.store = new LightningStoreAdapter(eventBus);

    if (config.enableRLTraining || config.enablePromptOptimization) {
      this.setupEventListeners();
      this.startTrainingLoop();
    }
  }

  /**
   * Setup event listeners for training
   */
  private setupEventListeners(): void {
    // Listen for task completion events
    eventBus.subscribe('task.completed' as any, (event: LAPAEvent) => {
      this.handleTaskCompletion(event);
    });

    // Listen for reward signals
    eventBus.subscribe('agentlightning.reward' as any, (event: LAPAEvent) => {
      this.handleReward(event);
    });

    // Listen for prompt usage
    eventBus.subscribe('agentlightning.prompt.used' as any, (event: LAPAEvent) => {
      this.handlePromptUsage(event);
    });

    // Listen for span completion
    eventBus.subscribe('agentlightning.span.completed' as any, (event: LAPAEvent) => {
      this.handleSpanCompletion(event);
    });
  }

  /**
   * Handle task completion for RL training
   */
  private async handleTaskCompletion(event: LAPAEvent): Promise<void> {
    if (!this.config.enableRLTraining) {
      return;
    }

    const payload = event.payload as any;
    const taskId = payload.taskId;
    const success = payload.result !== undefined && payload.result !== null;

    // Calculate reward based on task success
    const reward = success ? 1.0 : -0.5;
    const agentId = event.source || 'unknown';

    // Emit reward signal
    const spanId = payload.spanId || event.id;
    if (spanId) {
      this.adapter.emitReward(spanId, reward, {
        taskId,
        agentId,
        success,
        timestamp: event.timestamp
      });
    }
  }

  /**
   * Handle reward signals for RL training
   */
  private async handleReward(event: LAPAEvent): Promise<void> {
    if (!this.config.enableRLTraining) {
      return;
    }

    const payload = event.payload as any;
    // Store reward for RL training algorithm
    // This would be processed by the training algorithm
    console.log('[AgentLightningTrainer] Reward received:', payload);
  }

  /**
   * Handle prompt usage for prompt optimization
   */
  private async handlePromptUsage(event: LAPAEvent): Promise<void> {
    if (!this.config.enablePromptOptimization) {
      return;
    }

    const payload = event.payload as any;
    // Store prompt usage for optimization
    this.store.addPromptUsage(
      payload.promptId,
      payload.promptText,
      payload.result,
      payload.attributes
    );
  }

  /**
   * Handle span completion for training data collection
   */
  private async handleSpanCompletion(event: LAPAEvent): Promise<void> {
    const payload = event.payload as any;
    // Span data is already stored in LightningStore via adapter
    // Check if we have enough data for training
    if (this.shouldStartTraining()) {
      await this.triggerTraining();
    }
  }

  /**
   * Start training loop
   */
  private startTrainingLoop(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
    }

    this.trainingInterval = setInterval(async () => {
      if (this.shouldStartTraining() && !this.isTraining) {
        await this.triggerTraining();
      }
    }, this.config.trainingIntervalMs);
  }

  /**
   * Check if we should start training
   */
  private shouldStartTraining(): boolean {
    const traces = this.store.getAllTraces();
    const spansCount = traces.reduce((count, trace) => count + trace.spans.length, 0);
    return spansCount >= this.config.minSpansForTraining;
  }

  /**
   * Trigger training workflow
   */
  private async triggerTraining(): Promise<void> {
    if (this.isTraining) {
      return;
    }

    this.isTraining = true;

    try {
      // Collect training data
      const tasks = this.store.getAllTasks();
      const traces = this.store.getAllTraces();
      const resources = this.store.getAllResources();

      console.log('[AgentLightningTrainer] Starting training workflow...');
      console.log(`[AgentLightningTrainer] Tasks: ${tasks.length}, Traces: ${traces.length}, Resources: ${resources.length}`);

      // Run each enabled training algorithm
      for (const algorithm of this.config.algorithms) {
        if (!algorithm.enabled) {
          continue;
        }

        await this.runTrainingAlgorithm(algorithm, { tasks, traces, resources });
      }

      // Publish training completed event
      await eventBus.publish({
        type: 'agentlightning.training.completed',
        id: `training-${Date.now()}`,
        timestamp: Date.now(),
        source: 'agent-lightning-trainer',
        payload: {
          tasksCount: tasks.length,
          tracesCount: traces.length,
          resourcesCount: resources.length,
          timestamp: Date.now()
        }
      } as any);

      console.log('[AgentLightningTrainer] Training workflow completed');
    } catch (error) {
      console.error('[AgentLightningTrainer] Training workflow failed:', error);

      // Publish training failed event
      await eventBus.publish({
        type: 'agentlightning.training.failed',
        id: `training-failed-${Date.now()}`,
        timestamp: Date.now(),
        source: 'agent-lightning-trainer',
        payload: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        }
      } as any);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Run a training algorithm
   */
  private async runTrainingAlgorithm(
    algorithm: TrainingAlgorithmConfig,
    data: { tasks: any[]; traces: any[]; resources: any[] }
  ): Promise<void> {
    console.log(`[AgentLightningTrainer] Running ${algorithm.type} algorithm...`);

    switch (algorithm.type) {
      case 'reinforcement_learning':
        await this.runRLTraining(algorithm, data);
        break;
      case 'prompt_optimization':
        await this.runPromptOptimization(algorithm, data);
        break;
      case 'supervised_finetuning':
        await this.runSupervisedFineTuning(algorithm, data);
        break;
      default:
        console.warn(`[AgentLightningTrainer] Unknown algorithm type: ${algorithm.type}`);
    }
  }

  /**
   * Run reinforcement learning training
   */
  private async runRLTraining(
    algorithm: TrainingAlgorithmConfig,
    data: { tasks: any[]; traces: any[]; resources: any[] }
  ): Promise<void> {
    // This would integrate with RL training algorithm
    // For now, we collect and store the data
    console.log('[AgentLightningTrainer] RL training data collected:', {
      tasks: data.tasks.length,
      traces: data.traces.length,
      rewards: data.traces.filter(t => t.metadata?.reward).length
    });

    // In a real implementation, this would:
    // 1. Extract features from spans and traces
    // 2. Calculate rewards from task outcomes
    // 3. Train policy network
    // 4. Update agent behavior
  }

  /**
   * Run prompt optimization
   */
  private async runPromptOptimization(
    algorithm: TrainingAlgorithmConfig,
    data: { tasks: any[]; traces: any[]; resources: any[] }
  ): Promise<void> {
    // This would optimize prompts based on usage data
    const promptResources = data.resources.filter(r => r.type === 'prompt');

    console.log('[AgentLightningTrainer] Prompt optimization data collected:', {
      prompts: promptResources.length,
      usageData: promptResources.map(r => r.metadata?.usageCount || 0)
    });

    // In a real implementation, this would:
    // 1. Analyze prompt usage patterns
    // 2. Identify successful vs unsuccessful prompts
    // 3. Generate optimized prompt variations
    // 4. Update prompt resources
  }

  /**
   * Run supervised fine-tuning
   */
  private async runSupervisedFineTuning(
    algorithm: TrainingAlgorithmConfig,
    data: { tasks: any[]; traces: any[]; resources: any[] }
  ): Promise<void> {
    // This would fine-tune models on collected data
    console.log('[AgentLightningTrainer] Supervised fine-tuning data collected:', {
      tasks: data.tasks.length,
      traces: data.traces.length
    });

    // In a real implementation, this would:
    // 1. Prepare training dataset from traces
    // 2. Fine-tune model on successful patterns
    // 3. Update model weights
    // 4. Deploy updated model
  }

  /**
   * Get training metrics
   */
  public getTrainingMetrics(): {
    tasks: number;
    traces: number;
    resources: number;
    spans: number;
    isTraining: boolean;
  } {
    const tasks = this.store.getAllTasks();
    const traces = this.store.getAllTraces();
    const resources = this.store.getAllResources();
    const spans = traces.reduce((count, trace) => count + trace.spans.length, 0);

    return {
      tasks: tasks.length,
      traces: traces.length,
      resources: resources.length,
      spans,
      isTraining: this.isTraining
    };
  }

  /**
   * Manually trigger training
   */
  public async triggerManualTraining(): Promise<void> {
    await this.triggerTraining();
  }

  /**
   * Stop training loop
   */
  public stop(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }
  }
}

/**
 * Create Agent Lightning trainer instance
 */
export function createAgentLightningTrainer(
  config: TrainingWorkflowConfig
): AgentLightningTrainer {
  return new AgentLightningTrainer(config);
}

