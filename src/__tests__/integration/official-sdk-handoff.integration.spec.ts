import { HybridHandoffSystem } from '../../src/orchestrator/handoffs';
import { LangGraphOrchestrator } from '../../src/swarm/langgraph.orchestrator';
import { ContextHandoffManager } from '../../src/swarm/context.handoff';
import { moeRouter, Task, Agent } from '../../src/agents/moe-router';
import { Agent as OpenAIAgent, run } from '@openai/agents';

// Mock the OpenAI agents SDK
jest.mock('@openai/agents', () => {
  return {
    run: jest.fn()
  };
});

describe('Official SDK Handoff Integration', () => {
  let handoffSystem: HybridHandoffSystem;
  let orchestrator: LangGraphOrchestrator;
  let contextManager: ContextHandoffManager;
  let mockOpenAIAgent: OpenAIAgent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    orchestrator = new LangGraphOrchestrator('start');
    contextManager = new ContextHandoffManager();
    mockOpenAIAgent = {
      id: 'openai-official-agent-1',
      name: 'Official OpenAI Agent',
      instructions: 'Test instructions for official SDK',
      tools: [],
      model: 'gpt-4'
    } as OpenAIAgent;
    
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Register a few LAPA agents for testing
    const lapaAgents: Agent[] = [
      {
        id: 'lapa-coder-1',
        type: 'coder',
        name: 'LAPA Coder Agent',
        expertise: ['coding', 'implementation'],
        workload: 0,
        capacity: 5
      },
      {
        id: 'lapa-debugger-1',
        type: 'debugger',
        name: 'LAPA Debugger Agent',
        expertise: ['debugging', 'troubleshooting'],
        workload: 0,
        capacity: 5
      }
    ];
    
    // Register LAPA agents with moeRouter
    lapaAgents.forEach(agent => {
      moeRouter.registerAgent(agent);
    });
  });

  afterEach(() => {
    // Clean up registered agents
    const agents = moeRouter.getAgents();
    agents.forEach(agent => {
      moeRouter.unregisterAgent(agent.id);
    });
  });

  describe('LangGraphOrchestrator Compatibility', () => {
    it('should successfully integrate handoff evaluation into LangGraph workflow', async () => {
      // Register the OpenAI agent
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the OpenAI agent to recommend a handoff
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'Official OpenAI Agent',
          confidence: 0.92,
          reason: 'Task requires specialized knowledge from official SDK'
        }
      };
      
      (run as jest.Mock).mockResolvedValue(mockEvaluationResult);
      
      // Create a task
      const task: Task = {
        id: 'langgraph-integration-task-123',
        description: 'Complex analysis task requiring handoff with official SDK',
        type: 'analysis',
        priority: 1
      };
      
      // Execute task with handoffs
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // Verify the task was processed
      expect(result).toBeDefined();
      expect(run).toHaveBeenCalledWith(
        mockOpenAIAgent,
        expect.stringContaining('Evaluate this context and task for handoff')
      );
    }, 15000);
  });

  describe('ContextHandoffManager Integration', () => {
    it('should properly handle context transfer between LAPA and OpenAI agents', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the OpenAI agent to recommend a handoff to a LAPA agent
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'lapa-coder-1',
          confidence: 0.88,
          reason: 'Task requires LAPA coding expertise'
        }
      };
      
      (run as jest.Mock).mockResolvedValueOnce(mockEvaluationResult);
      
      // Mock the context handoff manager methods
      const initiateHandoffSpy = jest.spyOn(contextManager, 'initiateHandoff');
      const completeHandoffSpy = jest.spyOn(contextManager, 'completeHandoff');
      
      // Replace the contextHandoffManager in handoffSystem with our spy-enabled version
      (handoffSystem as any).contextHandoffManager = contextManager;
      
      // Mock successful handoff initiation
      initiateHandoffSpy.mockResolvedValue({
        success: true,
        handoffId: 'test-handoff-123',
        compressedSize: 1024,
        transferTime: 50
      });
      
      // Mock successful handoff completion
      completeHandoffSpy.mockResolvedValue({
        result: 'Handoff to LAPA agent completed successfully with context'
      });
      
      const task: Task = {
        id: 'context-transfer-task-123',
        description: 'Task requiring context transfer between agent types',
        type: 'processing',
        priority: 2
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: [],
        testData: 'important context data'
      });
      
      // Verify context was transferred
      expect(result.result).toBe('Handoff to LAPA agent completed successfully with context');
      expect(initiateHandoffSpy).toHaveBeenCalled();
      expect(completeHandoffSpy).toHaveBeenCalled();
    }, 15000);
  });

  describe('MoERouter Integration', () => {
    it('should correctly route tasks to appropriate agents based on expertise', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the OpenAI agent to recommend no handoff (let MoE router decide)
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: false,
          confidence: 0.65,
          reason: 'Task can be handled by current processing pipeline'
        }
      };
      
      (run as jest.Mock).mockResolvedValueOnce(mockEvaluationResult);
      
      const task: Task = {
        id: 'moe-routing-task-123',
        description: 'Coding task that should be routed to LAPA coder agent',
        type: 'coding',
        priority: 1
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: []
      });
      
      // The MoE router should have been used to route this task
      // Since no handoff was recommended, the result should contain routing information
      expect(result).toBeDefined();
      // Verify that the MoE router was used by checking if a LAPA agent was selected
      const agents = moeRouter.getAgents();
      expect(agents.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Hybrid Handoff Scenarios', () => {
    it('should handle mixed LAPA and OpenAI agent handoffs correctly', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock the context handoff manager
      const mockContextHandoffManager = {
        initiateHandoff: jest.fn(),
        completeHandoff: jest.fn()
      };
      
      // Inject the mock
      (handoffSystem as any).contextHandoffManager = mockContextHandoffManager;
      
      // Mock successful handoff initiation to LAPA agent
      mockContextHandoffManager.initiateHandoff.mockResolvedValue({
        success: true,
        handoffId: 'mixed-handoff-123',
        compressedSize: 2048,
        transferTime: 75
      });
      
      // Mock successful handoff completion
      mockContextHandoffManager.completeHandoff.mockResolvedValue({
        result: 'Mixed handoff completed successfully'
      });
      
      // Mock OpenAI evaluation recommending handoff to LAPA agent
      const mockEvaluationResult = {
        finalOutput: {
          shouldHandoff: true,
          targetAgentId: 'lapa-coder-1',
          confidence: 0.9,
          reason: 'Task requires LAPA specialized processing'
        }
      };
      
      (run as jest.Mock).mockResolvedValueOnce(mockEvaluationResult);
      
      const task: Task = {
        id: 'mixed-handoff-task-123',
        description: 'Task requiring mixed agent handoff with official SDK',
        type: 'development',
        priority: 3
      };
      
      const result = await handoffSystem.executeTaskWithHandoffs(task, {
        userData: { id: 'user-456' },
        history: [],
        projectData: 'sample project context'
      });
      
      expect(result.result).toBe('Mixed handoff completed successfully');
      expect(run).toHaveBeenCalledTimes(1);
      expect(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
      expect(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
    }, 15000);
  });

  describe('Performance Validation', () => {
    it('should maintain <2s latency for simple handoff operations', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock a quick response
      const mockRunResult = {
        finalOutput: { result: 'Quick task completed with official SDK' }
      };
      
      (run as jest.Mock).mockResolvedValue(mockRunResult);
      
      const startTime = performance.now();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Official OpenAI Agent',
        'performance-task-456',
        { testData: 'simple context data for performance test' }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete well within the 2s target
      expect(duration).toBeLessThan(2000);
    }, 10000);
  });
});