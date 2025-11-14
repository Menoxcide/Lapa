/**
 * Module-to-Module Communication Integration Tests
 * 
 * Tests communication between all major modules:
 * - Event Bus ↔ All Modules
 * - A2A Mediator ↔ Swarm Sessions
 * - Handoff System ↔ LangGraph Orchestrator
 * - Memory Systems ↔ Event Bus
 * - MCP Connector ↔ Agents
 * - Security ↔ All Modules
 * - Observability ↔ All Modules
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../../core/event-bus.ts';
import { A2AMediator } from '../../swarm/a2a-mediator.ts';
import { SwarmSessionManager } from '../../swarm/sessions.ts';
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { LangGraphOrchestrator } from '../../swarm/langgraph.orchestrator.ts';
import { MemoriEngine } from '../../local/memori-engine.ts';
import { EpisodicMemoryStore } from '../../local/episodic.ts';
import { MCPConnector } from '../../mcp/mcp-connector.ts';
import { RBACSystem } from '../../security/rbac.ts';
import { PrometheusMetrics } from '../../observability/prometheus.ts';

describe('Module-to-Module Communication Integration', () => {
  let a2aMediator: A2AMediator;
  let sessionManager: SwarmSessionManager;
  let handoffSystem: HybridHandoffSystem;
  let orchestrator: LangGraphOrchestrator;
  let memoriEngine: MemoriEngine;
  let episodicMemory: EpisodicMemoryStore;
  let mcpConnector: MCPConnector;
  let rbacSystem: RBACSystem;
  let metrics: PrometheusMetrics;

  beforeEach(async () => {
    a2aMediator = new A2AMediator();
    sessionManager = new SwarmSessionManager();
    orchestrator = new LangGraphOrchestrator();
    handoffSystem = new HybridHandoffSystem();
    memoriEngine = new MemoriEngine();
    episodicMemory = new EpisodicMemoryStore();
    mcpConnector = new MCPConnector();
    rbacSystem = new RBACSystem();
    metrics = new PrometheusMetrics();

    await memoriEngine.initialize();
    await episodicMemory.initialize();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('Event Bus ↔ All Modules', () => {
    it('should propagate events from A2A Mediator to all subscribers', async () => {
      const events: any[] = [];
      eventBus.subscribe('a2a.handshake.request', (event) => {
        events.push(event);
      });

      const handshakeRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'Test task',
        context: {},
        priority: 'medium' as const
      };

      await a2aMediator.initiateHandshake(handshakeRequest);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('a2a.handshake.request');
    });

    it('should allow memory systems to subscribe to agent events', async () => {
      const memoryEvents: any[] = [];
      
      eventBus.subscribe('agent.interaction', (event) => {
        memoryEvents.push(event);
      });

      await eventBus.publish({
        id: 'test-1',
        type: 'agent.interaction',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          agentId: 'test-agent',
          interactionType: 'task-completion',
          context: { taskId: 'task-123' }
        }
      });

      expect(memoryEvents.length).toBe(1);
      expect(memoryEvents[0].payload.agentId).toBe('test-agent');
    });

    it('should allow observability to track all module events', async () => {
      const trackedEvents: any[] = [];
      
      eventBus.subscribe('*', (event) => {
        trackedEvents.push(event);
      });

      // Generate events from multiple modules
      await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'Test',
        context: {},
        priority: 'medium' as const
      });

      await eventBus.publish({
        id: 'memory-1',
        type: 'memory.episode.stored',
        timestamp: Date.now(),
        source: 'memori-engine',
        payload: { agentId: 'agent-1', episode: 'test' }
      });

      expect(trackedEvents.length).toBeGreaterThan(1);
    });
  });

  describe('A2A Mediator ↔ Swarm Sessions', () => {
    it('should integrate A2A handshakes with swarm sessions', async () => {
      const sessionId = await sessionManager.createSession({
        name: 'Test Session',
        enableA2A: true,
        maxParticipants: 5
      });

      const handshakeRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'Test task',
        context: { sessionId },
        priority: 'medium' as const
      };

      const handshakeResponse = await a2aMediator.initiateHandshake(handshakeRequest);
      const sessionHandshake = await sessionManager.initiateA2AHandshake(
        sessionId,
        'agent-1',
        'agent-2',
        { id: 'task-123', description: 'Test task', priority: 'medium' }
      );

      expect(handshakeResponse.success).toBe(true);
      expect(sessionHandshake.success).toBe(true);
    });

    it('should synchronize A2A state across swarm sessions', async () => {
      const sessionId = await sessionManager.createSession({
        name: 'Test Session',
        enableA2A: true
      });

      await sessionManager.addParticipant(sessionId, {
        agentId: 'agent-1',
        capabilities: ['coding'],
        role: 'coder'
      });

      await sessionManager.addParticipant(sessionId, {
        agentId: 'agent-2',
        capabilities: ['testing'],
        role: 'tester'
      });

      const syncRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        syncType: 'full' as const,
        state: { currentTask: 'task-123' },
        context: { sessionId }
      };

      const syncResponse = await a2aMediator.syncState(syncRequest);
      expect(syncResponse.success).toBe(true);
    });
  });

  describe('Handoff System ↔ LangGraph Orchestrator', () => {
    it('should coordinate handoffs through LangGraph workflow', async () => {
      const nodes = [
        { id: 'start', type: 'process' as const, label: 'Start' },
        { id: 'agent-1', type: 'agent' as const, label: 'Agent 1', agentType: 'coder' },
        { id: 'agent-2', type: 'agent' as const, label: 'Agent 2', agentType: 'reviewer' },
        { id: 'end', type: 'process' as const, label: 'End' }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      orchestrator.addEdge({ id: 'e1', source: 'start', target: 'agent-1' });
      orchestrator.addEdge({ id: 'e2', source: 'agent-1', target: 'agent-2' });
      orchestrator.addEdge({ id: 'e3', source: 'agent-2', target: 'end' });

      const workflowResult = await orchestrator.executeWorkflow({
        task: 'Test workflow',
        priority: 'high'
      });

      expect(workflowResult.success).toBe(true);
      expect(workflowResult.executionPath).toContain('agent-1');
      expect(workflowResult.executionPath).toContain('agent-2');
    });

    it('should handle handoff failures and retry through orchestrator', async () => {
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
  });

  describe('Memory Systems ↔ Event Bus', () => {
    it('should store episodes from event bus events', async () => {
      await eventBus.publish({
        id: 'episode-1',
        type: 'memory.episode.stored',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          agentId: 'test-agent',
          content: 'Test episode',
          importance: 0.8,
          tags: ['test']
        }
      });

      const episodes = await episodicMemory.search('test');
      expect(episodes.length).toBeGreaterThan(0);
    });

    it('should extract entities from events and store in Memori', async () => {
      await eventBus.publish({
        id: 'entity-1',
        type: 'agent.interaction',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: {
          agentId: 'test-agent',
          interactionType: 'code-generation',
          context: {
            file: 'test.ts',
            function: 'testFunction'
          }
        }
      });

      const entities = await memoriEngine.getEntityRelationships('test');
      expect(entities.length).toBeGreaterThan(0);
    });

    it('should allow memory systems to query each other', async () => {
      // Store in episodic
      await episodicMemory.store({
        agentId: 'agent-1',
        content: 'Completed task X',
        importance: 0.9,
        tags: ['task', 'completion']
      });

      // Query from Memori (cross-memory query)
      const recent = await memoriEngine.getRecentMemories('agent-1', 10);
      expect(recent).toBeDefined();
    });
  });

  describe('MCP Connector ↔ Agents', () => {
    it('should allow agents to use MCP tools', async () => {
      await mcpConnector.connect({
        name: 'test-server',
        command: 'node',
        args: ['test-mcp-server.js']
      });

      const tools = await mcpConnector.listTools();
      expect(tools.length).toBeGreaterThan(0);

      // Agent should be able to call MCP tool
      const result = await mcpConnector.callTool('test-tool', {});
      expect(result).toBeDefined();
    });

    it('should propagate MCP events to event bus', async () => {
      const mcpEvents: any[] = [];
      eventBus.subscribe('mcp.tool.called', (event) => {
        mcpEvents.push(event);
      });

      await mcpConnector.callTool('test-tool', {});
      expect(mcpEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Security ↔ All Modules', () => {
    it('should enforce RBAC on all module operations', async () => {
      await rbacSystem.createRole('developer', [
        'agent.create',
        'agent.read',
        'task.create'
      ]);

      await rbacSystem.assignRole('user-1', 'developer');

      const hasPermission = await rbacSystem.checkPermission(
        'user-1',
        'agent.create',
        'agent'
      );

      expect(hasPermission).toBe(true);
    });

    it('should block unauthorized module access', async () => {
      await rbacSystem.createRole('viewer', ['agent.read']);

      const hasPermission = await rbacSystem.checkPermission(
        'viewer-user',
        'agent.create',
        'agent'
      );

      expect(hasPermission).toBe(false);
    });

    it('should audit all security-relevant events', async () => {
      const auditEvents: any[] = [];
      eventBus.subscribe('security.audit', (event) => {
        auditEvents.push(event);
      });

      await rbacSystem.checkPermission('user-1', 'agent.create', 'agent');
      expect(auditEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Observability ↔ All Modules', () => {
    it('should collect metrics from all modules', async () => {
      // Generate activity from multiple modules
      await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'Test',
        context: {},
        priority: 'medium' as const
      });

      await eventBus.publish({
        id: 'test-1',
        type: 'task.completed',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: { taskId: 'task-123', duration: 100 }
      });

      const metrics = await metrics.getMetrics();
      expect(metrics).toBeDefined();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });

    it('should track cross-module communication latency', async () => {
      const startTime = Date.now();

      await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'Test',
        context: {},
        priority: 'medium' as const
      });

      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(1000); // Should be fast
    });
  });

  describe('End-to-End Module Communication', () => {
    it('should handle complete workflow across all modules', async () => {
      // 1. Create session
      const sessionId = await sessionManager.createSession({
        name: 'E2E Test',
        enableA2A: true
      });

      // 2. Add agents
      await sessionManager.addParticipant(sessionId, {
        agentId: 'agent-1',
        capabilities: ['coding'],
        role: 'coder'
      });

      // 3. A2A handshake
      const handshake = await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['testing'],
        protocolVersion: '1.0',
        taskId: 'task-123',
        taskDescription: 'E2E test',
        context: { sessionId },
        priority: 'high' as const
      });

      expect(handshake.success).toBe(true);

      // 4. Execute workflow
      const nodes = [
        { id: 'start', type: 'process' as const, label: 'Start' },
        { id: 'agent-1', type: 'agent' as const, label: 'Coder', agentType: 'coder' },
        { id: 'end', type: 'process' as const, label: 'End' }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      orchestrator.addEdge({ id: 'e1', source: 'start', target: 'agent-1' });
      orchestrator.addEdge({ id: 'e2', source: 'agent-1', target: 'end' });

      const workflowResult = await orchestrator.executeWorkflow({
        task: 'E2E workflow',
        sessionId
      });

      expect(workflowResult.success).toBe(true);

      // 5. Store in memory
      await episodicMemory.store({
        agentId: 'agent-1',
        content: 'Completed E2E workflow',
        importance: 1.0,
        tags: ['e2e', 'workflow']
      });

      // 6. Verify memory
      const episodes = await episodicMemory.search('E2E');
      expect(episodes.length).toBeGreaterThan(0);
    });
  });
});

