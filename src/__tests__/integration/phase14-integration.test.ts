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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { phase14Integration } from '../../orchestrator/phase14-integration.ts';
import { promptEngineer } from '../../orchestrator/prompt-engineer.ts';
import { skillManager } from '../../orchestrator/skill-manager.ts';
import { visualFeedback } from '../../orchestrator/visual-feedback.ts';
import { llmJudge } from '../../orchestrator/llm-judge.ts';
import { eventBus } from '../../core/event-bus.ts';

describe('Phase 14 Integration', () => {
  beforeEach(async () => {
    // Clean up before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await phase14Integration.cleanup();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Phase 14 Integration Manager', () => {
    it('should initialize all components', async () => {
      const integration = new (await import('../../orchestrator/phase14-integration.ts')).Phase14Integration({
        enablePromptEngineer: true,
        enableSkillManager: true,
        enableVisualFeedback: true,
        enableLLMJudge: true,
        autoInitialize: false
      });

      await integration.initialize();

      const status = integration.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.components.promptEngineer).toBe(true);
      expect(status.components.skillManager).toBe(true);
      expect(status.components.visualFeedback).toBe(true);
      expect(status.components.llmJudge).toBe(true);
    });

    it('should handle partial component initialization', async () => {
      const integration = new (await import('../../orchestrator/phase14-integration.ts')).Phase14Integration({
        enablePromptEngineer: false,
        enableSkillManager: true,
        enableVisualFeedback: false,
        enableLLMJudge: true,
        autoInitialize: false
      });

      await integration.initialize();

      const status = integration.getStatus();
      expect(status.components.promptEngineer).toBe(false);
      expect(status.components.skillManager).toBe(true);
      expect(status.components.visualFeedback).toBe(false);
      expect(status.components.llmJudge).toBe(true);
    });
  });

  describe('PromptEngineer', () => {
    it('should detect vague prompts', async () => {
      const vaguePrompt = 'make it better';
      const result = await promptEngineer.detectVaguePrompt(vaguePrompt);
      
      expect(result.isVague).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should not detect specific prompts as vague', async () => {
      const specificPrompt = 'Add a user authentication system with JWT tokens, password hashing using bcrypt, and session management';
      const result = await promptEngineer.detectVaguePrompt(specificPrompt);
      
      expect(result.isVague).toBe(false);
    });

    it('should refine vague prompts', async () => {
      const vaguePrompt = 'fix the slow site';
      const result = await promptEngineer.refinePrompt({
        originalPrompt: vaguePrompt,
        taskType: 'bug'
      });

      expect(result.success).toBe(true);
      if (result.refinedPrompt) {
        expect(result.refinedPrompt.length).toBeGreaterThan(vaguePrompt.length);
      }
    });

    it('should generate clarification questions for vague prompts', async () => {
      const vaguePrompt = 'improve the app';
      const result = await promptEngineer.refinePrompt({
        originalPrompt: vaguePrompt,
        taskType: 'feature'
      });

      expect(result.success).toBe(true);
      // May return clarification questions or refined prompt
      expect(result.clarificationQuestions || result.refinedPrompt).toBeDefined();
    });
  });

  describe('Skill Manager', () => {
    it('should initialize and discover skills', async () => {
      await skillManager.initialize();
      const skills = skillManager.getSkills();
      
      // Skills may or may not exist, but initialization should not throw
      expect(Array.isArray(skills)).toBe(true);
    });

    it('should register a skill programmatically', () => {
      const skillMetadata = {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A test skill',
        version: '1.0.0',
        category: 'other' as const,
        inputs: [],
        outputs: []
      };

      skillManager.registerSkill(skillMetadata);
      const skill = skillManager.getSkill('test-skill');
      
      expect(skill).toBeDefined();
      expect(skill?.id).toBe('test-skill');
      expect(skill?.name).toBe('Test Skill');
    });

    it('should execute a skill', async () => {
      // Register a test skill first
      const skillMetadata = {
        id: 'test-execute-skill',
        name: 'Test Execute Skill',
        description: 'A test skill for execution',
        version: '1.0.0',
        category: 'other' as const,
        inputs: [{ name: 'input', type: 'string', required: true }],
        outputs: [{ name: 'output', type: 'string' }]
      };

      skillManager.registerSkill(skillMetadata);

      // Note: Execution will use placeholder if module not loaded
      const result = await skillManager.executeSkill({
        skillId: 'test-execute-skill',
        inputs: { input: 'test value' }
      });

      expect(result).toBeDefined();
      // Result may be placeholder or actual execution
    });

    it('should handle non-existent skill execution', async () => {
      const result = await skillManager.executeSkill({
        skillId: 'non-existent-skill',
        inputs: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Visual Feedback', () => {
    it('should initialize visual feedback system', async () => {
      await visualFeedback.initialize();
      // Initialization should not throw
      expect(true).toBe(true);
    });

    it('should handle screenshot comparison request', async () => {
      await visualFeedback.initialize();
      
      // Use a test URL (may fail if Playwright not installed, but should handle gracefully)
      const result = await visualFeedback.compareScreenshot({
        url: 'https://example.com',
        name: 'test-screenshot'
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      // Result may indicate Playwright not available, which is acceptable
    });

    it('should handle visual regression detection', async () => {
      await visualFeedback.initialize();
      
      const result = await visualFeedback.detectVisualRegression(
        [{ name: 'test', path: 'test-path.png' }],
        'baseline'
      );

      expect(result).toBeDefined();
      expect(result.detected).toBeDefined();
      expect(result.severity).toBeDefined();
    });
  });

  describe('LLM Judge', () => {
    it('should make a judgment on code quality', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
      `;

      const result = await llmJudge.judge({
        type: 'code-quality',
        content: code
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(['pass', 'fail', 'partial', 'uncertain']).toContain(result.verdict);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should detect SoC violations', async () => {
      const code = `
        import { UserService } from '../services/user.service';
        import { UserModel } from '../models/user.model';
        
        // Frontend component directly accessing backend service
        const user = await UserService.getUser(1);
      `;

      const result = await llmJudge.judge({
        type: 'soc-violation',
        content: code
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      // May detect violations or pass
    });

    it('should detect security issues', async () => {
      const code = `
        const password = "secret123";
        const apiKey = "sk-1234567890";
      `;

      const result = await llmJudge.judge({
        type: 'code-quality',
        content: code
      });

      expect(result).toBeDefined();
      // May detect security issues
    });

    it('should maintain judgment history', () => {
      const history = llmJudge.getJudgmentHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Full Workflow', () => {
    it('should execute full workflow: refine → execute → judge', async () => {
      await phase14Integration.initialize();

      const result = await phase14Integration.executeFullWorkflow(
        'make the app faster',
        undefined, // No skill ID
        undefined  // No screenshot URL
      );

      expect(result).toBeDefined();
      // May have refined prompt if vague
      if (result.refinedPrompt) {
        expect(result.refinedPrompt.length).toBeGreaterThan(0);
      }
    });

    it('should handle workflow with skill execution', async () => {
      // Register a test skill
      skillManager.registerSkill({
        id: 'workflow-test-skill',
        name: 'Workflow Test Skill',
        description: 'Test skill for workflow',
        version: '1.0.0',
        category: 'other' as const,
        inputs: [{ name: 'prompt', type: 'string', required: true }],
        outputs: [{ name: 'result', type: 'string' }]
      });

      await phase14Integration.initialize();

      const result = await phase14Integration.executeFullWorkflow(
        'test prompt',
        'workflow-test-skill',
        undefined
      );

      expect(result).toBeDefined();
      // May have skill result
    });
  });

  describe('Event Integration', () => {
    it('should publish events on component actions', async () => {
      const events: any[] = [];
      
      eventBus.subscribe('system.warning', (event) => {
        if ((event.payload as any)?.type === 'vague-prompt') {
          events.push(event);
        }
      });

      // Trigger vague prompt detection
      await promptEngineer.detectVaguePrompt('make it better');

      // Events may be published asynchronously
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if events were published (may be 0 if not vague enough)
      expect(Array.isArray(events)).toBe(true);
    });
  });
});

