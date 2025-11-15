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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// Mock external dependencies
vi.mock('../../mcp/mcp-connector.ts', () => ({
  MCPConnector: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue([{ name: 'test-tool', description: 'Test' }]),
    callTool: vi.fn().mockResolvedValue({ result: 'success' }),
    disconnect: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../../observability/prometheus.ts', () => ({
  PrometheusMetrics: vi.fn().mockImplementation(() => ({
    getMetrics: vi.fn().mockResolvedValue({ events: 100, latency: 50 }),
    recordEvent: vi.fn(),
    recordLatency: vi.fn()
  }))
}));

// Mock memory systems for faster tests
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
    search: vi.fn().mockResolvedValue([]),
    getEpisodes: vi.fn().mockResolvedValue([])
  }))
}));

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
  let mockEventSubscribers: Map<string, Function[]>;

  beforeEach(async () => {
    // Setup mock event bus
    mockEventSubscribers = new Map();
    vi.spyOn(eventBus, 'subscribe').mockImplementation((eventType: any, handler: any, filter?: any) => {
      if (!mockEventSubscribers.has(eventType)) {
        mockEventSubscribers.set(eventType, []);
      }
      mockEventSubscribers.get(eventType)!.push(handler);
      return `subscription-${Date.now()}-${Math.random()}`;
    });

    vi.spyOn(eventBus, 'publish').mockImplementation(async (event: any) => {
      const handlers = mockEventSubscribers.get(event.type) || [];
      handlers.forEach(handler => handler(event));
      return Promise.resolve();
    });

    a2aMediator = new A2AMediator();
    sessionManager = new SwarmSessionManager();
    orchestrator = new LangGraphOrchestrator('start');
    handoffSystem = new HybridHandoffSystem();
    memoriEngine = new MemoriEngine();
    episodicMemory = new EpisodicMemoryStore();
    mcpConnector = new MCPConnector();
    rbacSystem = new RBACSystem();
    metrics = new PrometheusMetrics({ enabled: true }, eventBus);

    await memoriEngine.initialize();
    await episodicMemory.initialize();
  });

  afterEach(() => {
    eventBus.clear();
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
        metadata: {
          taskId: 'task-123',
          taskDescription: 'Test task',
          context: {},
          priority: 'medium' as 'low' | 'medium' | 'high'
        } as Record<string, unknown>
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
      
      // Subscribe to all known event types
      const eventTypes: any[] = ['a2a.handshake.request', 'memory.episode.stored', 'system.warning'];
      eventTypes.forEach(eventType => {
        eventBus.subscribe(eventType, (event: any) => {
          trackedEvents.push(event);
        });
      });

      // Generate events from multiple modules
      await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: {
          taskId: 'task-123',
          taskDescription: 'Test',
          context: {},
          priority: 'medium' as 'low' | 'medium' | 'high'
        } as Record<string, unknown>
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
      const sessionId = 'test-session-1';
      await sessionManager.createSession({
        sessionId: sessionId,
        hostUserId: 'host-user',
        enableA2A: true,
        maxParticipants: 5,
        enableVetoes: false
      }, 'host-user');

      const handshakeRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: {
          taskId: 'task-123',
          taskDescription: 'Test task',
          context: { sessionId },
          priority: 'medium' as 'low' | 'medium' | 'high'
        } as Record<string, unknown>
      };

      const handshakeResponse = await a2aMediator.initiateHandshake(handshakeRequest);
      const sessionHandshake = await sessionManager.initiateA2AHandshake(
        sessionId,
        'agent-1',
        'agent-2',
        { id: 'task-123', description: 'Test task', type: 'task', priority: 5 }
      );

      expect(handshakeResponse.success).toBe(true);
      expect(sessionHandshake.success).toBe(true);
    });

    it('should synchronize A2A state across swarm sessions', async () => {
      const sessionId = 'test-session-2';
      await sessionManager.createSession({
        sessionId: sessionId,
        hostUserId: 'host-user',
        enableA2A: true,
        maxParticipants: 5,
        enableVetoes: false
      }, 'host-user');

      await sessionManager.joinSession(sessionId, 'user-1', 'Agent 1', 'agent-1');
      await sessionManager.joinSession(sessionId, 'user-2', 'Agent 2', 'agent-2');

      const syncRequest = {
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        syncType: 'full' as const,
        state: { currentTask: 'task-123' },
        handshakeId: 'handshake-123'
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
      await episodicMemory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-x',
        sessionId: 'session-1',
        content: 'Completed task X'
      });

      // Query from Memori (cross-memory query)
      const recent = await memoriEngine.getRecentMemories('agent-1', 10);
      expect(recent).toBeDefined();
    });
  });

  describe('MCP Connector ↔ Agents', () => {
    it('should allow agents to use MCP tools', async () => {
      await mcpConnector.connect();

      const tools = await (mcpConnector as any).getTools?.() || [];
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
      rbacSystem.createRole({
        id: 'developer',
        name: 'Developer',
        description: 'Developer role',
        permissions: new Set(['agent.create', 'agent.read', 'task.create'] as any[])
      });

      rbacSystem.assignRole('user-1', 'developer');

      const hasPermission = rbacSystem.hasPermission(
        'user-1',
        'agent.create' as any
      );

      expect(hasPermission).toBe(true);
    });

    it('should block unauthorized module access', async () => {
      rbacSystem.createRole({
        id: 'viewer',
        name: 'Viewer',
        description: 'Viewer role',
        permissions: new Set(['agent.read'] as any[])
      });

      const hasPermission = rbacSystem.hasPermission(
        'viewer-user',
        'agent.create' as any
      );

      expect(hasPermission).toBe(false);
    });

    it('should audit all security-relevant events', async () => {
      const auditEvents: any[] = [];
      eventBus.subscribe('system.warning', (event: any) => {
        auditEvents.push(event);
      });

      rbacSystem.hasPermission('user-1', 'agent.create' as any);
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
        metadata: { taskId: 'task-123' } as Record<string, unknown>
      });

      await eventBus.publish({
        id: 'test-1',
        type: 'task.completed',
        timestamp: Date.now(),
        source: 'test-agent',
        payload: { taskId: 'task-123', duration: 100 }
      } as any);

      const metricsData = await metrics.getMetrics();
      expect(metricsData).toBeDefined();
      expect(Object.keys(metricsData).length).toBeGreaterThan(0);
    });

    it('should track cross-module communication latency', async () => {
      const startTime = Date.now();

      await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['coding'],
        protocolVersion: '1.0',
        metadata: {
          taskId: 'task-123',
          taskDescription: 'Test',
          context: {},
          priority: 'medium' as 'low' | 'medium' | 'high'
        } as Record<string, unknown>
      });

      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(1000); // Should be fast
    });
  });

  describe('End-to-End Module Communication', () => {
    it('should handle complete workflow across all modules', async () => {
      // 1. Create session
      const sessionId = await sessionManager.createSession({
        sessionId: 'e2e-session',
        hostUserId: 'host-user',
        enableA2A: true,
        maxParticipants: 10,
        enableVetoes: false
      }, 'host-user');

      // 2. Add agents
      await sessionManager.joinSession(sessionId, 'agent-1', 'Agent 1', 'agent-1');

      // 3. A2A handshake
      const handshake = await a2aMediator.initiateHandshake({
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        capabilities: ['testing'],
        protocolVersion: '1.0',
        metadata: {
          taskId: 'task-123',
          taskDescription: 'E2E test',
          context: { sessionId },
          priority: 'high' as const
        } as Record<string, unknown>
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
      await episodicMemory.storeEpisode({
        agentId: 'agent-1',
        taskId: 'task-123',
        sessionId: sessionId,
        content: 'Completed E2E workflow',
        context: {},
        tags: ['e2e', 'workflow']
      });

      // 6. Verify memory
      const episodes = await episodicMemory.search('E2E');
      expect(episodes.length).toBeGreaterThan(0);
    });
  });
});

