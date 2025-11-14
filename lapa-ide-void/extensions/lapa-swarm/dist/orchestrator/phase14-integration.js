"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmJudge = exports.visualFeedback = exports.skillManager = exports.promptEngineer = exports.phase14Integration = exports.Phase14Integration = void 0;
const prompt_engineer_ts_1 = require("./prompt-engineer.ts");
Object.defineProperty(exports, "promptEngineer", { enumerable: true, get: function () { return prompt_engineer_ts_1.promptEngineer; } });
const skill_manager_ts_1 = require("./skill-manager.ts");
Object.defineProperty(exports, "skillManager", { enumerable: true, get: function () { return skill_manager_ts_1.skillManager; } });
const visual_feedback_ts_1 = require("./visual-feedback.ts");
Object.defineProperty(exports, "visualFeedback", { enumerable: true, get: function () { return visual_feedback_ts_1.visualFeedback; } });
const llm_judge_ts_1 = require("./llm-judge.ts");
Object.defineProperty(exports, "llmJudge", { enumerable: true, get: function () { return llm_judge_ts_1.llmJudge; } });
const event_bus_ts_1 = require("../core/event-bus.ts");
/**
 * Phase 14 Integration Manager
 *
 * Manages initialization and coordination of all Phase 14 components.
 */
class Phase14Integration {
    config;
    initialized = false;
    constructor(config) {
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
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            console.log('[Phase14] Initializing Phase 14 components...');
            // Initialize PromptEngineer
            if (this.config.enablePromptEngineer) {
                try {
                    await prompt_engineer_ts_1.promptEngineer.start();
                    console.log('[Phase14] PromptEngineer initialized');
                }
                catch (error) {
                    console.warn('[Phase14] PromptEngineer initialization failed:', error);
                }
            }
            // Initialize Skill Manager
            if (this.config.enableSkillManager) {
                try {
                    await skill_manager_ts_1.skillManager.initialize();
                    console.log('[Phase14] Skill Manager initialized');
                }
                catch (error) {
                    console.warn('[Phase14] Skill Manager initialization failed:', error);
                }
            }
            // Initialize Visual Feedback
            if (this.config.enableVisualFeedback) {
                try {
                    await visual_feedback_ts_1.visualFeedback.initialize();
                    console.log('[Phase14] Visual Feedback initialized');
                }
                catch (error) {
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
            await event_bus_ts_1.eventBus.publish({
                id: `phase14-init-${Date.now()}`,
                type: 'phase14.initialized',
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
        }
        catch (error) {
            console.error('[Phase14] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Sets up event listeners for cross-component communication
     */
    setupEventListeners() {
        // Listen for vague prompts that need refinement
        event_bus_ts_1.eventBus.subscribe('agent.prompt-detected', async (event) => {
            if (this.config.enablePromptEngineer && event.payload?.prompt) {
                const vagueCheck = await prompt_engineer_ts_1.promptEngineer.detectVaguePrompt(event.payload.prompt);
                if (vagueCheck.isVague) {
                    await event_bus_ts_1.eventBus.publish({
                        id: `vague-detected-${Date.now()}`,
                        type: 'prompt-engineer.vague-detected',
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
        event_bus_ts_1.eventBus.subscribe('agent.code-generated', async (event) => {
            if (this.config.enableLLMJudge && event.payload?.code) {
                const judgment = await llm_judge_ts_1.llmJudge.judge({
                    type: 'code-quality',
                    content: event.payload.code,
                    context: event.payload.context
                });
                if (judgment.verdict === 'fail' || judgment.verdict === 'partial') {
                    await event_bus_ts_1.eventBus.publish({
                        id: `quality-issue-${Date.now()}`,
                        type: 'llm-judge.quality-issue',
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
        event_bus_ts_1.eventBus.subscribe('ui.state-changed', async (event) => {
            if (this.config.enableVisualFeedback && event.payload?.url) {
                // Optionally trigger visual regression check
                // This would be done on-demand rather than automatically
            }
        });
    }
    /**
     * Refines a vague prompt using PromptEngineer
     */
    async refinePrompt(request) {
        if (!this.config.enablePromptEngineer) {
            throw new Error('PromptEngineer is not enabled');
        }
        return await prompt_engineer_ts_1.promptEngineer.refinePrompt(request);
    }
    /**
     * Executes a skill using Skill Manager
     */
    async executeSkill(request) {
        if (!this.config.enableSkillManager) {
            throw new Error('Skill Manager is not enabled');
        }
        return await skill_manager_ts_1.skillManager.executeSkill(request);
    }
    /**
     * Compares a screenshot using Visual Feedback
     */
    async compareScreenshot(request) {
        if (!this.config.enableVisualFeedback) {
            throw new Error('Visual Feedback is not enabled');
        }
        return await visual_feedback_ts_1.visualFeedback.compareScreenshot(request);
    }
    /**
     * Makes a judgment using LLM Judge
     */
    async judge(request) {
        if (!this.config.enableLLMJudge) {
            throw new Error('LLM Judge is not enabled');
        }
        return await llm_judge_ts_1.llmJudge.judge(request);
    }
    /**
     * Comprehensive workflow: Refine prompt → Execute skill → Judge result → Visual feedback
     */
    async executeFullWorkflow(originalPrompt, skillId, screenshotUrl) {
        const results = {};
        try {
            // Step 1: Refine prompt if vague
            if (this.config.enablePromptEngineer) {
                const vagueCheck = await prompt_engineer_ts_1.promptEngineer.detectVaguePrompt(originalPrompt);
                if (vagueCheck.isVague) {
                    const refinement = await prompt_engineer_ts_1.promptEngineer.refinePrompt({
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
                const skillResult = await skill_manager_ts_1.skillManager.executeSkill({
                    skillId,
                    inputs: { prompt: results.refinedPrompt || originalPrompt }
                });
                results.skillResult = skillResult;
                // Step 3: Judge the result
                if (this.config.enableLLMJudge && skillResult.outputs) {
                    const judgment = await llm_judge_ts_1.llmJudge.judge({
                        type: 'code-quality',
                        content: JSON.stringify(skillResult.outputs),
                        context: { skillId, inputs: { prompt: originalPrompt } }
                    });
                    results.judgment = judgment;
                }
            }
            // Step 4: Visual feedback if URL provided
            if (screenshotUrl && this.config.enableVisualFeedback) {
                const visualResult = await visual_feedback_ts_1.visualFeedback.compareScreenshot({
                    url: screenshotUrl,
                    name: `workflow-${Date.now()}`
                });
                results.visualFeedback = visualResult;
            }
            return results;
        }
        catch (error) {
            console.error('[Phase14] Full workflow execution failed:', error);
            throw error;
        }
    }
    /**
     * Cleans up all Phase 14 components
     */
    async cleanup() {
        try {
            if (this.config.enablePromptEngineer) {
                await prompt_engineer_ts_1.promptEngineer.stop();
            }
            if (this.config.enableVisualFeedback) {
                await visual_feedback_ts_1.visualFeedback.cleanup();
            }
            this.initialized = false;
            console.log('[Phase14] Cleanup completed');
        }
        catch (error) {
            console.error('[Phase14] Cleanup failed:', error);
        }
    }
    /**
     * Gets status of all Phase 14 components
     */
    getStatus() {
        return {
            initialized: this.initialized,
            components: {
                promptEngineer: this.config.enablePromptEngineer,
                skillManager: this.config.enableSkillManager,
                visualFeedback: this.config.enableVisualFeedback,
                llmJudge: this.config.enableLLMJudge
            },
            stats: {
                skillsCount: skill_manager_ts_1.skillManager.getSkills().length,
                judgmentHistoryCount: llm_judge_ts_1.llmJudge.getJudgmentHistory().length
            }
        };
    }
}
exports.Phase14Integration = Phase14Integration;
// Export singleton instance
exports.phase14Integration = new Phase14Integration({
    autoInitialize: false // Initialize manually or via config
});
//# sourceMappingURL=phase14-integration.js.map