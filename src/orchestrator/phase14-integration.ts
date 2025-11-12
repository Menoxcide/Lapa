/**
 * Phase 14 Integration for LAPA v1.2.2
 * 
 * This module integrates all Phase 14 components:
 * - PromptEngineer MCP (prompt-engineer.ts)
 * - ClaudeKit Skill Manager (skill-manager.ts)
 * - Visual Feedback System (visual-feedback.ts)
 * - LLM-as-Judge (llm-judge.ts)
 * 
 * It provides a unified interface for Phase 14 features and integrates
 * them with the orchestrator and event bus.
 */

import { promptEngineer, PromptRefinementRequest, PromptRefinementResponse } from './prompt-engineer.ts';
import { skillManager, SkillExecutionRequest, SkillExecutionResponse } from './skill-manager.ts';
import { visualFeedback, ScreenshotComparisonRequest, ScreenshotComparisonResult } from './visual-feedback.ts';
import { llmJudge, JudgmentRequest, JudgmentResult } from './llm-judge.ts';
import { eventBus } from '../core/event-bus.ts';
import { a2aMediator } from './a2a-mediator.ts';

// Phase 14 integration configuration
export interface Phase14Config {
  enablePromptEngineer: boolean;
  enableSkillManager: boolean;
  enableVisualFeedback: boolean;
  enableLLMJudge: boolean;
  autoInitialize: boolean;
}

/**
 * Phase 14 Integration Manager
 * 
 * Manages initialization and coordination of all Phase 14 components.
 */
export class Phase14Integration {
  private config: Phase14Config;
  private initialized: boolean = false;

  constructor(config?: Partial<Phase14Config>) {
    this.config = {
      enablePromptEngineer: config?.enablePromptEngineer ?? true,
      enableSkillManager: config?.enableSkillManager ?? true,
      enableVisualFeedback: config?.enableVisualFeedback ?? true,
      enableLLMJudge: config?.enableLLMJudge ?? true,
      autoInitialize: config?.autoInitialize ?? false
    };

    if (this.config.autoInitialize) {
      this.initialize().catch(console.error);
    }
  }

  /**
   * Initializes all Phase 14 components
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('[Phase14] Initializing Phase 14 components...');

      // Initialize PromptEngineer
      if (this.config.enablePromptEngineer) {
        try {
          await promptEngineer.start();
          console.log('[Phase14] PromptEngineer initialized');
        } catch (error) {
          console.warn('[Phase14] PromptEngineer initialization failed:', error);
        }
      }

      // Initialize Skill Manager
      if (this.config.enableSkillManager) {
        try {
          await skillManager.initialize();
          console.log('[Phase14] Skill Manager initialized');
        } catch (error) {
          console.warn('[Phase14] Skill Manager initialization failed:', error);
        }
      }

      // Initialize Visual Feedback
      if (this.config.enableVisualFeedback) {
        try {
          await visualFeedback.initialize();
          console.log('[Phase14] Visual Feedback initialized');
        } catch (error) {
          console.warn('[Phase14] Visual Feedback initialization failed:', error);
        }
      }

      // LLM Judge doesn't need explicit initialization
      if (this.config.enableLLMJudge) {
        console.log('[Phase14] LLM Judge ready');
      }

      // Setup event listeners for cross-component communication
      this.setupEventListeners();

      this.initialized = true;

      eventBus.emit('phase14.initialized', {
        timestamp: Date.now(),
        source: 'phase14-integration',
        payload: {
          components: {
            promptEngineer: this.config.enablePromptEngineer,
            skillManager: this.config.enableSkillManager,
            visualFeedback: this.config.enableVisualFeedback,
            llmJudge: this.config.enableLLMJudge
          }
        }
      });

      console.log('[Phase14] All components initialized successfully');
    } catch (error) {
      console.error('[Phase14] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sets up event listeners for cross-component communication
   */
  private setupEventListeners(): void {
    // Listen for vague prompts that need refinement
    eventBus.on('agent.prompt-detected', async (event: any) => {
      if (this.config.enablePromptEngineer && event.payload?.prompt) {
        const vagueCheck = await promptEngineer.detectVaguePrompt(event.payload.prompt);
        if (vagueCheck.isVague) {
          eventBus.emit('prompt-engineer.vague-detected', {
            timestamp: Date.now(),
            source: 'phase14-integration',
            payload: {
              prompt: event.payload.prompt,
              confidence: vagueCheck.confidence,
              reasons: vagueCheck.reasons
            }
          });
        }
      }
    });

    // Listen for code that needs judgment
    eventBus.on('agent.code-generated', async (event: any) => {
      if (this.config.enableLLMJudge && event.payload?.code) {
        const judgment = await llmJudge.judge({
          type: 'code-quality',
          content: event.payload.code,
          context: event.payload.context
        });

        if (judgment.verdict === 'fail' || judgment.verdict === 'partial') {
          eventBus.emit('llm-judge.quality-issue', {
            timestamp: Date.now(),
            source: 'phase14-integration',
            payload: {
              code: event.payload.code,
              judgment
            }
          });
        }
      }
    });

    // Listen for UI changes that need visual feedback
    eventBus.on('ui.state-changed', async (event: any) => {
      if (this.config.enableVisualFeedback && event.payload?.url) {
        // Optionally trigger visual regression check
        // This would be done on-demand rather than automatically
      }
    });
  }

  /**
   * Refines a vague prompt using PromptEngineer
   */
  async refinePrompt(request: PromptRefinementRequest): Promise<PromptRefinementResponse> {
    if (!this.config.enablePromptEngineer) {
      throw new Error('PromptEngineer is not enabled');
    }

    return await promptEngineer.refinePrompt(request);
  }

  /**
   * Executes a skill using Skill Manager
   */
  async executeSkill(request: SkillExecutionRequest): Promise<SkillExecutionResponse> {
    if (!this.config.enableSkillManager) {
      throw new Error('Skill Manager is not enabled');
    }

    return await skillManager.executeSkill(request);
  }

  /**
   * Compares a screenshot using Visual Feedback
   */
  async compareScreenshot(request: ScreenshotComparisonRequest): Promise<ScreenshotComparisonResult> {
    if (!this.config.enableVisualFeedback) {
      throw new Error('Visual Feedback is not enabled');
    }

    return await visualFeedback.compareScreenshot(request);
  }

  /**
   * Makes a judgment using LLM Judge
   */
  async judge(request: JudgmentRequest): Promise<JudgmentResult> {
    if (!this.config.enableLLMJudge) {
      throw new Error('LLM Judge is not enabled');
    }

    return await llmJudge.judge(request);
  }

  /**
   * Comprehensive workflow: Refine prompt → Execute skill → Judge result → Visual feedback
   */
  async executeFullWorkflow(
    originalPrompt: string,
    skillId?: string,
    screenshotUrl?: string
  ): Promise<{
    refinedPrompt?: string;
    skillResult?: SkillExecutionResponse;
    judgment?: JudgmentResult;
    visualFeedback?: ScreenshotComparisonResult;
  }> {
    const results: any = {};

    try {
      // Step 1: Refine prompt if vague
      if (this.config.enablePromptEngineer) {
        const vagueCheck = await promptEngineer.detectVaguePrompt(originalPrompt);
        if (vagueCheck.isVague) {
          const refinement = await promptEngineer.refinePrompt({
            originalPrompt,
            taskType: 'other'
          });
          if (refinement.refinedPrompt) {
            results.refinedPrompt = refinement.refinedPrompt;
          }
        }
      }

      // Step 2: Execute skill if provided
      if (skillId && this.config.enableSkillManager) {
        const skillResult = await skillManager.executeSkill({
          skillId,
          inputs: { prompt: results.refinedPrompt || originalPrompt }
        });
        results.skillResult = skillResult;

        // Step 3: Judge the result
        if (this.config.enableLLMJudge && skillResult.outputs) {
          const judgment = await llmJudge.judge({
            type: 'code-quality',
            content: JSON.stringify(skillResult.outputs),
            context: { skillId, inputs: { prompt: originalPrompt } }
          });
          results.judgment = judgment;
        }
      }

      // Step 4: Visual feedback if URL provided
      if (screenshotUrl && this.config.enableVisualFeedback) {
        const visualResult = await visualFeedback.compareScreenshot({
          url: screenshotUrl,
          name: `workflow-${Date.now()}`
        });
        results.visualFeedback = visualResult;
      }

      return results;
    } catch (error) {
      console.error('[Phase14] Full workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Cleans up all Phase 14 components
   */
  async cleanup(): Promise<void> {
    try {
      if (this.config.enablePromptEngineer) {
        await promptEngineer.stop();
      }

      if (this.config.enableVisualFeedback) {
        await visualFeedback.cleanup();
      }

      this.initialized = false;
      console.log('[Phase14] Cleanup completed');
    } catch (error) {
      console.error('[Phase14] Cleanup failed:', error);
    }
  }

  /**
   * Gets status of all Phase 14 components
   */
  getStatus(): {
    initialized: boolean;
    components: {
      promptEngineer: boolean;
      skillManager: boolean;
      visualFeedback: boolean;
      llmJudge: boolean;
    };
    stats: {
      skillsCount: number;
      judgmentHistoryCount: number;
    };
  } {
    return {
      initialized: this.initialized,
      components: {
        promptEngineer: this.config.enablePromptEngineer,
        skillManager: this.config.enableSkillManager,
        visualFeedback: this.config.enableVisualFeedback,
        llmJudge: this.config.enableLLMJudge
      },
      stats: {
        skillsCount: skillManager.getSkills().length,
        judgmentHistoryCount: llmJudge.getJudgmentHistory().length
      }
    };
  }
}

// Export singleton instance
export const phase14Integration = new Phase14Integration({
  autoInitialize: false // Initialize manually or via config
});

// Export all Phase 14 components for direct access
export {
  promptEngineer,
  skillManager,
  visualFeedback,
  llmJudge
};

