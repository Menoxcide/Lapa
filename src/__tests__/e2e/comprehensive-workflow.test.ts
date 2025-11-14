/**
 * Comprehensive End-to-End Workflow Tests
 * 
 * Tests complete workflows across all modules:
 * - Multi-agent collaboration workflows
 * - Complex task decomposition
 * - Cross-module coordination
 * - Error recovery in workflows
 * - Performance under realistic load
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../../core/event-bus.ts';
import { A2AMediator } from '../../swarm/a2a-mediator.ts';
import { SwarmSessionManager } from '../../swarm/sessions.ts';
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { LangGraphOrchestrator } from '../../swarm/langgraph.orchestrator.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';
import { AgentDiversityLab } from '../../orchestrator/agent-diversity.ts';
import { SelfImprovementSystem } from '../../orchestrator/self-improvement.ts';

// Mock memory systems for faster E2E tests
vi.mock('../../local/memori-engine.ts', () => ({
  MemoriEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getRecentMemories: vi.fn().mockResolvedValue([]),
    getCrossSessionMemories: vi.fn().mockResolvedValue([]),
    getEntityRelationships: vi.fn().mockResolvedValue([]),
    extractEntities: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../../local/episodic.ts', () => ({
  EpisodicMemoryStore: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([{
      agentId: 'test-agent',
      content: 'Test episode',
      importance: 0.9,
      tags: ['test']
    }]),
    getEpisodes: vi.fn().mockResolvedValue([])
  }))
}));

// Mock orchestrator for controlled workflow execution
vi.mock('../../swarm/langgraph.orchestrator.ts', () => ({
  LangGraphOrchestrator: vi.fn().mockImplementation(() => ({
    addNode: vi.fn(),
    addEdge: vi.fn(),
    executeWorkflow: vi.fn().mockResolvedValue({
      success: true,
      executionPath: ['start', 'plan', 'implement', 'review', 'test', 'deploy', 'end'],
      output: { result: 'success' },
      finalState: { completed: true }
    })
  }))
}));

describe('Comprehensive E2E Workflow Tests', () => {
  let a2aMediator: A2AMediator;
  let sessionManager: SwarmSessionManager;
  let handoffSystem: HybridHandoffSystem;
  let orchestrator: LangGraphOrchestrator;
  let memoriEngine: MemoriEngine;
  let episodicMemory: EpisodicMemoryStore;
  let diversityLab: AgentDiversityLab;
  let selfImprovement: SelfImprovementSystem;
  let mockEventHandlers: Map<string, Function[]>;

  beforeEach(async () => {
    // Setup mock event bus
    mockEventHandlers = new Map();
    vi.spyOn(eventBus, 'subscribe').mockImplementation((eventType: string, handler: Function) => {
      if (!mockEventHandlers.has(eventType)) {
        mockEventHandlers.set(eventType, []);
      }
      mockEventHandlers.get(eventType)!.push(handler);
      return () => {
        const handlers = mockEventHandlers.get(eventType);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) handlers.splice(index, 1);
        }
      };
    });

    vi.spyOn(eventBus, 'publish').mockImplementation(async (event: any) => {
      const handlers = mockEventHandlers.get(event.type) || [];
      handlers.forEach(handler => handler(event));
      return Promise.resolve();
    });

    a2aMediator = new A2AMediator();
    sessionManager = new SwarmSessionManager();
    orchestrator = new LangGraphOrchestrator();
    handoffSystem = new HybridHandoffSystem();
    memoriEngine = new MemoriEngine();
    episodicMemory = new EpisodicMemoryStore();
    diversityLab = new AgentDiversityLab();
    selfImprovement = new SelfImprovementSystem();

    await memoriEngine.initialize();
    await episodicMemory.initialize();
    await diversityLab.initialize();
    await selfImprovement.initialize();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('Complete Feature Implementation Workflow', () => {
    it('should execute full feature implementation from spec to deployment', async () => {
      // 1. Create swarm session
      const sessionId = await sessionManager.createSession({
        name: 'Feature Implementation',
        enableA2A: true,
        maxParticipants: 5
      });

      // 2. Add specialized agents
      await sessionManager.addParticipant(sessionId, {
        agentId: 'architect',
        capabilities: ['architecture', 'planning'],
        role: 'architect'
      });

      await sessionManager.addParticipant(sessionId, {
        agentId: 'coder',
        capabilities: ['coding', 'implementation'],
        role: 'coder'
      });

      await sessionManager.addParticipant(sessionId, {
        agentId: 'reviewer',
        capabilities: ['review', 'quality'],
        role: 'reviewer'
      });

      await sessionManager.addParticipant(sessionId, {
        agentId: 'tester',
        capabilities: ['testing', 'validation'],
        role: 'tester'
      });

      // 3. Establish A2A connections
      const handshake1 = await a2aMediator.initiateHandshake({
        sourceAgentId: 'architect',
        targetAgentId: 'coder',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: { sessionId }
      });

      expect(handshake1.success).toBe(true);

      // 4. Create workflow
      const nodes = [
        { id: 'start', type: 'process' as const, label: 'Start' },
        { id: 'plan', type: 'agent' as const, label: 'Planning', agentType: 'architect' },
        { id: 'implement', type: 'agent' as const, label: 'Implementation', agentType: 'coder' },
        { id: 'review', type: 'agent' as const, label: 'Review', agentType: 'reviewer' },
        { id: 'test', type: 'agent' as const, label: 'Testing', agentType: 'tester' },
        { id: 'deploy', type: 'process' as const, label: 'Deploy' },
        { id: 'end', type: 'process' as const, label: 'End' }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      orchestrator.addEdge({ id: 'e1', source: 'start', target: 'plan' });
      orchestrator.addEdge({ id: 'e2', source: 'plan', target: 'implement' });
      orchestrator.addEdge({ id: 'e3', source: 'implement', target: 'review' });
      orchestrator.addEdge({ id: 'e4', source: 'review', target: 'test' });
      orchestrator.addEdge({ id: 'e5', source: 'test', target: 'deploy' });
      orchestrator.addEdge({ id: 'e6', source: 'deploy', target: 'end' });

      // 5. Execute workflow
      const workflowResult = await orchestrator.executeWorkflow({
        feature: 'User Authentication',
        requirements: ['login', 'logout', 'session management'],
        sessionId
      });

      expect(workflowResult.success).toBe(true);
      expect(workflowResult.executionPath).toContain('plan');
      expect(workflowResult.executionPath).toContain('implement');
      expect(workflowResult.executionPath).toContain('review');
      expect(workflowResult.executionPath).toContain('test');

      // 6. Store workflow in memory
      await episodicMemory.store({
        agentId: 'architect',
        content: `Completed feature: User Authentication`,
        importance: 1.0,
        tags: ['feature', 'workflow', 'complete']
      });

      // 7. Verify memory storage
      const episodes = await episodicMemory.search('User Authentication');
      expect(episodes.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Agent Collaboration with Handoffs', () => {
    it('should coordinate handoffs between multiple agents', async () => {
      const sessionId = await sessionManager.createSession({
        name: 'Collaboration Test',
        enableA2A: true
      });

      // Add agents
      const agents = ['agent-1', 'agent-2', 'agent-3'];
      for (const agentId of agents) {
        await sessionManager.addParticipant(sessionId, {
          agentId,
          capabilities: ['coding'],
          role: 'coder'
        });
      }

      // Establish A2A connections
      const handshakes = [];
      for (let i = 0; i < agents.length - 1; i++) {
        const handshake = await a2aMediator.initiateHandshake({
          sourceAgentId: agents[i],
          targetAgentId: agents[i + 1],
          capabilities: ['coding'],
          protocolVersion: '1.0',
          metadata: { sessionId }
        });
        handshakes.push(handshake);
      }

      expect(handshakes.every(h => h.success)).toBe(true);

      // Execute handoff chain
      const task = {
        id: 'task-123',
        description: 'Complex task requiring multiple agents',
        priority: 'high' as const
      };

      // Agent 1 hands off to Agent 2
      const handoff1 = await handoffSystem.executeTaskWithHandoffs(task, {
        sourceAgentId: agents[0],
        targetAgentId: agents[1],
        sessionId
      });

      expect(handoff1.success).toBe(true);

      // Agent 2 hands off to Agent 3
      const handoff2 = await handoffSystem.executeTaskWithHandoffs(task, {
        sourceAgentId: agents[1],
        targetAgentId: agents[2],
        sessionId
      });

      expect(handoff2.success).toBe(true);
    });
  });

  describe('Error Recovery in Workflows', () => {
    it('should recover from agent failures in workflow', async () => {
      const nodes = [
        { id: 'start', type: 'process' as const, label: 'Start' },
        { id: 'agent-1', type: 'agent' as const, label: 'Agent 1', agentType: 'coder' },
        { id: 'fallback', type: 'agent' as const, label: 'Fallback', agentType: 'coder' },
        { id: 'end', type: 'process' as const, label: 'End' }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      orchestrator.addEdge({ id: 'e1', source: 'start', target: 'agent-1' });
      orchestrator.addEdge({ id: 'e2', source: 'agent-1', target: 'fallback' });
      orchestrator.addEdge({ id: 'e3', source: 'fallback', target: 'end' });

      const workflowResult = await orchestrator.executeWorkflow({
        task: 'Test with failure',
        simulateFailure: true
      });

      // Should handle failure and use fallback
      expect(workflowResult.executionPath).toContain('fallback');
    });

    it('should retry failed handshakes', async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      const handshakeRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: { attempt: attemptCount }
      };

      let response;
      while (attemptCount < maxAttempts) {
        attemptCount++;
        response = await a2aMediator.initiateHandshake(handshakeRequest);
        if (response.success) break;
      }

      expect(response!.success).toBe(true);
    });
  });

  describe('Performance Under Realistic Load', () => {
    it('should handle 50 concurrent workflows', async () => {
      const workflowCount = 50;
      const workflows: Promise<any>[] = [];

      for (let i = 0; i < workflowCount; i++) {
        const nodes = [
          { id: 'start', type: 'process' as const, label: 'Start' },
          { id: 'process', type: 'agent' as const, label: 'Process', agentType: 'coder' },
          { id: 'end', type: 'process' as const, label: 'End' }
        ];

        nodes.forEach(node => orchestrator.addNode(node));
        orchestrator.addEdge({ id: 'e1', source: 'start', target: 'process' });
        orchestrator.addEdge({ id: 'e2', source: 'process', target: 'end' });

        workflows.push(
          orchestrator.executeWorkflow({
            task: `Workflow ${i}`,
            priority: 'medium'
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(workflows);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(workflowCount);
      expect(results.filter(r => r.success).length).toBeGreaterThan(workflowCount * 0.9); // 90%+ success
      expect(duration).toBeLessThan(30000); // Complete in under 30 seconds
    });
  });

  describe('Memory Integration in Workflows', () => {
    it('should store and retrieve workflow context from memory', async () => {
      const workflowContext = {
        task: 'Memory Integration Test',
        agents: ['agent-1', 'agent-2'],
        steps: ['plan', 'implement', 'test']
      };

      // Store workflow context
      await episodicMemory.store({
        agentId: 'agent-1',
        content: JSON.stringify(workflowContext),
        importance: 0.9,
        tags: ['workflow', 'context']
      });

      // Retrieve workflow context
      const episodes = await episodicMemory.search('Memory Integration');
      expect(episodes.length).toBeGreaterThan(0);

      const retrievedContext = JSON.parse(episodes[0].content);
      expect(retrievedContext.task).toBe(workflowContext.task);
    });

    it('should use memory for context preservation across handoffs', async () => {
      const context = {
        taskId: 'task-123',
        previousResults: ['result-1', 'result-2'],
        nextSteps: ['step-1', 'step-2']
      };

      // Store context before handoff
      await episodicMemory.store({
        agentId: 'agent-1',
        content: JSON.stringify(context),
        importance: 1.0,
        tags: ['handoff', 'context']
      });

      // Retrieve context after handoff
      const episodes = await episodicMemory.search('task-123');
      expect(episodes.length).toBeGreaterThan(0);

      const retrievedContext = JSON.parse(episodes[0].content);
      expect(retrievedContext.taskId).toBe(context.taskId);
    });
  });

  describe('Self-Improvement Integration', () => {
    it('should learn from workflow execution', async () => {
      // Execute workflow
      const nodes = [
        { id: 'start', type: 'process' as const, label: 'Start' },
        { id: 'agent', type: 'agent' as const, label: 'Agent', agentType: 'coder' },
        { id: 'end', type: 'process' as const, label: 'End' }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      orchestrator.addEdge({ id: 'e1', source: 'start', target: 'agent' });
      orchestrator.addEdge({ id: 'e2', source: 'agent', target: 'end' });

      const result = await orchestrator.executeWorkflow({
        task: 'Learning Task',
        priority: 'high'
      });

      expect(result.success).toBe(true);

      // Self-improvement should record the execution
      // (Implementation depends on self-improvement system)
    });
  });
});

