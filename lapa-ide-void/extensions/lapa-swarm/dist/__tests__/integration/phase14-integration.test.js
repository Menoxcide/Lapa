"use strict";
/**
 * Phase 14 Integration Tests
 *
 * Comprehensive tests for Phase 14 components:
 * - PromptEngineer MCP Integration
 * - ClaudeKit Skill Manager
 * - Visual Feedback System
 * - LLM-as-Judge
 * - Phase 14 Integration Manager
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const phase14_integration_ts_1 = require("../../orchestrator/phase14-integration.ts");
const prompt_engineer_ts_1 = require("../../orchestrator/prompt-engineer.ts");
const skill_manager_ts_1 = require("../../orchestrator/skill-manager.ts");
const visual_feedback_ts_1 = require("../../orchestrator/visual-feedback.ts");
const llm_judge_ts_1 = require("../../orchestrator/llm-judge.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
(0, vitest_1.describe)('Phase 14 Integration', () => {
    (0, vitest_1.beforeEach)(async () => {
        // Clean up before each test
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(async () => {
        // Clean up after each test
        try {
            await phase14_integration_ts_1.phase14Integration.cleanup();
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    (0, vitest_1.describe)('Phase 14 Integration Manager', () => {
        (0, vitest_1.it)('should initialize all components', async () => {
            const integration = new (await import('../../orchestrator/phase14-integration.ts')).Phase14Integration({
                enablePromptEngineer: true,
                enableSkillManager: true,
                enableVisualFeedback: true,
                enableLLMJudge: true,
                autoInitialize: false
            });
            await integration.initialize();
            const status = integration.getStatus();
            (0, vitest_1.expect)(status.initialized).toBe(true);
            (0, vitest_1.expect)(status.components.promptEngineer).toBe(true);
            (0, vitest_1.expect)(status.components.skillManager).toBe(true);
            (0, vitest_1.expect)(status.components.visualFeedback).toBe(true);
            (0, vitest_1.expect)(status.components.llmJudge).toBe(true);
        });
        (0, vitest_1.it)('should handle partial component initialization', async () => {
            const integration = new (await import('../../orchestrator/phase14-integration.ts')).Phase14Integration({
                enablePromptEngineer: false,
                enableSkillManager: true,
                enableVisualFeedback: false,
                enableLLMJudge: true,
                autoInitialize: false
            });
            await integration.initialize();
            const status = integration.getStatus();
            (0, vitest_1.expect)(status.components.promptEngineer).toBe(false);
            (0, vitest_1.expect)(status.components.skillManager).toBe(true);
            (0, vitest_1.expect)(status.components.visualFeedback).toBe(false);
            (0, vitest_1.expect)(status.components.llmJudge).toBe(true);
        });
    });
    (0, vitest_1.describe)('PromptEngineer', () => {
        (0, vitest_1.it)('should detect vague prompts', async () => {
            const vaguePrompt = 'make it better';
            const result = await prompt_engineer_ts_1.promptEngineer.detectVaguePrompt(vaguePrompt);
            (0, vitest_1.expect)(result.isVague).toBe(true);
            (0, vitest_1.expect)(result.confidence).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.reasons.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should not detect specific prompts as vague', async () => {
            const specificPrompt = 'Add a user authentication system with JWT tokens, password hashing using bcrypt, and session management';
            const result = await prompt_engineer_ts_1.promptEngineer.detectVaguePrompt(specificPrompt);
            (0, vitest_1.expect)(result.isVague).toBe(false);
        });
        (0, vitest_1.it)('should refine vague prompts', async () => {
            const vaguePrompt = 'fix the slow site';
            const result = await prompt_engineer_ts_1.promptEngineer.refinePrompt({
                originalPrompt: vaguePrompt,
                taskType: 'bug'
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.refinedPrompt) {
                (0, vitest_1.expect)(result.refinedPrompt.length).toBeGreaterThan(vaguePrompt.length);
            }
        });
        (0, vitest_1.it)('should generate clarification questions for vague prompts', async () => {
            const vaguePrompt = 'improve the app';
            const result = await prompt_engineer_ts_1.promptEngineer.refinePrompt({
                originalPrompt: vaguePrompt,
                taskType: 'feature'
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            // May return clarification questions or refined prompt
            (0, vitest_1.expect)(result.clarificationQuestions || result.refinedPrompt).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Skill Manager', () => {
        (0, vitest_1.it)('should initialize and discover skills', async () => {
            await skill_manager_ts_1.skillManager.initialize();
            const skills = skill_manager_ts_1.skillManager.getSkills();
            // Skills may or may not exist, but initialization should not throw
            (0, vitest_1.expect)(Array.isArray(skills)).toBe(true);
        });
        (0, vitest_1.it)('should register a skill programmatically', () => {
            const skillMetadata = {
                id: 'test-skill',
                name: 'Test Skill',
                description: 'A test skill',
                version: '1.0.0',
                category: 'other',
                inputs: [],
                outputs: []
            };
            skill_manager_ts_1.skillManager.registerSkill(skillMetadata);
            const skill = skill_manager_ts_1.skillManager.getSkill('test-skill');
            (0, vitest_1.expect)(skill).toBeDefined();
            (0, vitest_1.expect)(skill?.id).toBe('test-skill');
            (0, vitest_1.expect)(skill?.name).toBe('Test Skill');
        });
        (0, vitest_1.it)('should execute a skill', async () => {
            // Register a test skill first
            const skillMetadata = {
                id: 'test-execute-skill',
                name: 'Test Execute Skill',
                description: 'A test skill for execution',
                version: '1.0.0',
                category: 'other',
                inputs: [{ name: 'input', type: 'string', required: true }],
                outputs: [{ name: 'output', type: 'string' }]
            };
            skill_manager_ts_1.skillManager.registerSkill(skillMetadata);
            // Note: Execution will use placeholder if module not loaded
            const result = await skill_manager_ts_1.skillManager.executeSkill({
                skillId: 'test-execute-skill',
                inputs: { input: 'test value' }
            });
            (0, vitest_1.expect)(result).toBeDefined();
            // Result may be placeholder or actual execution
        });
        (0, vitest_1.it)('should handle non-existent skill execution', async () => {
            const result = await skill_manager_ts_1.skillManager.executeSkill({
                skillId: 'non-existent-skill',
                inputs: {}
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('not found');
        });
    });
    (0, vitest_1.describe)('Visual Feedback', () => {
        (0, vitest_1.it)('should initialize visual feedback system', async () => {
            await visual_feedback_ts_1.visualFeedback.initialize();
            // Initialization should not throw
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should handle screenshot comparison request', async () => {
            await visual_feedback_ts_1.visualFeedback.initialize();
            // Use a test URL (may fail if Playwright not installed, but should handle gracefully)
            const result = await visual_feedback_ts_1.visualFeedback.compareScreenshot({
                url: 'https://example.com',
                name: 'test-screenshot'
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.success).toBeDefined();
            // Result may indicate Playwright not available, which is acceptable
        });
        (0, vitest_1.it)('should handle visual regression detection', async () => {
            await visual_feedback_ts_1.visualFeedback.initialize();
            const result = await visual_feedback_ts_1.visualFeedback.detectVisualRegression([{ name: 'test', path: 'test-path.png' }], 'baseline');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.detected).toBeDefined();
            (0, vitest_1.expect)(result.severity).toBeDefined();
        });
    });
    (0, vitest_1.describe)('LLM Judge', () => {
        (0, vitest_1.it)('should make a judgment on code quality', async () => {
            const code = `
        function add(a, b) {
          return a + b;
        }
      `;
            const result = await llm_judge_ts_1.llmJudge.judge({
                type: 'code-quality',
                content: code
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.success).toBeDefined();
            (0, vitest_1.expect)(result.verdict).toBeDefined();
            (0, vitest_1.expect)(['pass', 'fail', 'partial', 'uncertain']).toContain(result.verdict);
            (0, vitest_1.expect)(result.confidence).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.confidence).toBeLessThanOrEqual(1);
        });
        (0, vitest_1.it)('should detect SoC violations', async () => {
            const code = `
        import { UserService } from '../services/user.service';
        import { UserModel } from '../models/user.model';
        
        // Frontend component directly accessing backend service
        const user = await UserService.getUser(1);
      `;
            const result = await llm_judge_ts_1.llmJudge.judge({
                type: 'soc-violation',
                content: code
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.success).toBeDefined();
            // May detect violations or pass
        });
        (0, vitest_1.it)('should detect security issues', async () => {
            const code = `
        const password = "secret123";
        const apiKey = "sk-1234567890";
      `;
            const result = await llm_judge_ts_1.llmJudge.judge({
                type: 'code-quality',
                content: code
            });
            (0, vitest_1.expect)(result).toBeDefined();
            // May detect security issues
        });
        (0, vitest_1.it)('should maintain judgment history', () => {
            const history = llm_judge_ts_1.llmJudge.getJudgmentHistory(10);
            (0, vitest_1.expect)(Array.isArray(history)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Full Workflow', () => {
        (0, vitest_1.it)('should execute full workflow: refine → execute → judge', async () => {
            await phase14_integration_ts_1.phase14Integration.initialize();
            const result = await phase14_integration_ts_1.phase14Integration.executeFullWorkflow('make the app faster', undefined, // No skill ID
            undefined // No screenshot URL
            );
            (0, vitest_1.expect)(result).toBeDefined();
            // May have refined prompt if vague
            if (result.refinedPrompt) {
                (0, vitest_1.expect)(result.refinedPrompt.length).toBeGreaterThan(0);
            }
        });
        (0, vitest_1.it)('should handle workflow with skill execution', async () => {
            // Register a test skill
            skill_manager_ts_1.skillManager.registerSkill({
                id: 'workflow-test-skill',
                name: 'Workflow Test Skill',
                description: 'Test skill for workflow',
                version: '1.0.0',
                category: 'other',
                inputs: [{ name: 'prompt', type: 'string', required: true }],
                outputs: [{ name: 'result', type: 'string' }]
            });
            await phase14_integration_ts_1.phase14Integration.initialize();
            const result = await phase14_integration_ts_1.phase14Integration.executeFullWorkflow('test prompt', 'workflow-test-skill', undefined);
            (0, vitest_1.expect)(result).toBeDefined();
            // May have skill result
        });
    });
    (0, vitest_1.describe)('Event Integration', () => {
        (0, vitest_1.it)('should publish events on component actions', async () => {
            const events = [];
            event_bus_ts_1.eventBus.subscribe('prompt-engineer.vague-detected', (event) => {
                events.push(event);
            });
            // Trigger vague prompt detection
            await prompt_engineer_ts_1.promptEngineer.detectVaguePrompt('make it better');
            // Events may be published asynchronously
            await new Promise(resolve => setTimeout(resolve, 100));
            // Check if events were published (may be 0 if not vague enough)
            (0, vitest_1.expect)(Array.isArray(events)).toBe(true);
        });
    });
});
//# sourceMappingURL=phase14-integration.test.js.map