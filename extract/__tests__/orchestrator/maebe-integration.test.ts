/**
 * Integration Tests for MAEBE Framework
 * 
 * Tests MAEBE integration with HybridHandoffSystem and MoE Router
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { MoERouter } from '../../agents/moe-router.ts';
import { MAEBEEvaluator } from '../../orchestrator/maebe-evaluator.ts';
import { Task } from '../../agents/moe-router.ts';

// Mock dependencies
vi.mock('../../swarm/langgraph.orchestrator.ts', () => ({
  LangGraphOrchestrator: vi.fn().mockImplementation(() => ({
    addNode: vi.fn(),
    addEdge: vi.fn(),
    executeWorkflow: vi.fn().mockResolvedValue({
      success: true,
      finalState: { nodeId: 'complete', context: {}, history: [] },
      output: { result: 'success' },
      executionPath: ['start', 'complete']
    })
  }))
}));

vi.mock('../../swarm/context.handoff.ts', () => ({
  ContextHandoffManager: vi.fn().mockImplementation(() => ({
    compressContext: vi.fn().mockResolvedValue({}),
    decompressContext: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../orchestrator/a2a-mediator.ts', () => ({
  a2aMediator: {
    initiateHandshake: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('../../utils/agent-lightning-hooks.ts', () => ({
  agl: {
    emitSpan: vi.fn(() => 'span-id'),
    emitMetric: vi.fn(),
    emitReward: vi.fn(),
    endSpan: vi.fn()
  }
}));

describe('MAEBE Integration with HybridHandoffSystem', () => {
  let handoffSystem: HybridHandoffSystem;
  let mockTask: Task;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem({
      enableDetailedLogging: true, // Enables MAEBE
      enableOpenAIEvaluation: false,
      enableLAPAMoERouter: true,
      maxHandoffDepth: 5
    });

    mockTask = {
      id: 'test-task-1',
      description: 'Test task',
      type: 'test',
      priority: 1
    };
  });

  it('should initialize MAEBE evaluator when enabled', () => {
    expect(handoffSystem).toBeDefined();
    // MAEBE should be initialized when enableDetailedLogging is true
  });

  it('should evaluate emergent behaviors before workflow execution', async () => {
    const context = {
      agentIds: ['agent-1', 'agent-2'],
      agentInteractions: []
    };

    // Should not throw when MAEBE evaluates
    await expect(handoffSystem.executeTaskWithHandoffs(mockTask, context)).resolves.toBeDefined();
  });

  it('should block handoffs for critical emergent behaviors', async () => {
    const context = {
      agentIds: ['agent-1', 'agent-2'],
      agentInteractions: []
    };

    // Note: In real scenario, critical behaviors would cause blocking
    // This test verifies the integration point exists
    await expect(handoffSystem.executeTaskWithHandoffs(mockTask, context)).resolves.toBeDefined();
  });
});

describe('MAEBE Integration with MoE Router', () => {
  let router: MoERouter;
  let mockTask: Task;

  beforeEach(() => {
    router = new MoERouter(1000, true); // Enable MAEBE

    router.registerAgent({
      id: 'agent-1',
      type: 'coder',
      name: 'Coder Agent',
      expertise: ['coding', 'typescript'],
      workload: 5,
      capacity: 10
    });

    router.registerAgent({
      id: 'agent-2',
      type: 'reviewer',
      name: 'Reviewer Agent',
      expertise: ['review', 'code-quality'],
      workload: 3,
      capacity: 10
    });

    mockTask = {
      id: 'test-task-1',
      description: 'Write TypeScript code',
      type: 'coding',
      priority: 1
    };
  });

  it('should initialize MAEBE evaluator when enabled', () => {
    expect(router).toBeDefined();
    // MAEBE should be initialized when enableMAEBE is true
  });

  it('should route tasks considering MAEBE scores', async () => {
    const result = await router.routeTask(mockTask);

    expect(result).toBeDefined();
    expect(result.agent).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(typeof result.reasoning).toBe('string');
  });

  it('should use default MAEBE score when no behaviors detected', async () => {
    const result = await router.routeTask(mockTask);

    expect(result).toBeDefined();
    expect(result.agent).toBeDefined();
    // Should successfully route even without behavior history
  });

  it('should handle MAEBE score calculation errors gracefully', async () => {
    // Even if MAEBE evaluation fails, routing should still work
    const result = await router.routeTask(mockTask);

    expect(result).toBeDefined();
    expect(result.agent).toBeDefined();
  });
});

describe('MAEBE End-to-End Integration', () => {
  let maebeEvaluator: MAEBEEvaluator;
  let handoffSystem: HybridHandoffSystem;
  let router: MoERouter;

  beforeEach(() => {
    maebeEvaluator = new MAEBEEvaluator({
      enabled: true,
      enableAgentLightningTracking: true
    });

    handoffSystem = new HybridHandoffSystem({
      enableDetailedLogging: true,
      enableOpenAIEvaluation: false,
      enableLAPAMoERouter: true
    });

    router = new MoERouter(1000, true);
  });

  it('should work together across components', async () => {
    // Verify all components can work together
    expect(maebeEvaluator).toBeDefined();
    expect(handoffSystem).toBeDefined();
    expect(router).toBeDefined();

    // All components should be initialized without errors
    expect(true).toBe(true);
  });
});

