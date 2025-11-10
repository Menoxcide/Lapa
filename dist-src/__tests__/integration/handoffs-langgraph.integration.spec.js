import { HybridHandoffSystem } from '../../src/orchestrator/handoffs';
import { LangGraphOrchestrator } from '../../src/swarm/langgraph.orchestrator';
// Mock the OpenAI agents SDK
jest.mock('@openai/agents', () => {
    return {
        run: jest.fn()
    };
});
// Import the mocked run function
import { run } from '@openai/agents';
describe('Handoffs with LangGraph Integration', () => {
    let handoffSystem;
    let orchestrator;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new HybridHandoffSystem();
        orchestrator = new LangGraphOrchestrator('start');
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Workflow Integration', () => {
        it('should integrate handoff evaluation into LangGraph workflow', async () => {
            // Register the OpenAI agent
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent to recommend a handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.92,
                    reason: 'Task requires specialized knowledge'
                }
            };
            run.mockResolvedValue(mockEvaluationResult);
            // Create a task
            const task = {
                id: 'integration-task-123',
                description: 'Complex analysis task requiring handoff',
                input: 'Analyze this dataset',
                priority: 'high'
            };
            // Execute task with handoffs
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Verify the task was processed
            expect(result).toBeDefined();
            expect(run).toHaveBeenCalledWith(mockOpenAIAgent, expect.stringContaining('Evaluate this context for handoff'));
        }, 15000);
        it('should handle workflow with multiple potential handoff points', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock alternating responses - first recommends handoff, second does not
            run
                .mockResolvedValueOnce({
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.88,
                    reason: 'Initial analysis needed'
                }
            })
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Final processing completed by OpenAI agent'
                }
            });
            const task = {
                id: 'multi-stage-task-123',
                description: 'Multi-stage task with multiple handoff opportunities',
                input: 'Process this complex request',
                priority: 'medium'
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                stage: 1,
                data: 'initial data'
            });
            // Should have called run twice - once for evaluation, once for execution
            expect(run).toHaveBeenCalledTimes(2);
            expect(result).toBeDefined();
        }, 15000);
        it('should gracefully handle workflow when no handoff is recommended', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock response indicating no handoff needed
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: false,
                    confidence: 0.75,
                    reason: 'Task can be handled by current agent'
                }
            };
            run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'no-handoff-task-123',
                description: 'Simple task that should not require handoff',
                input: 'Simple processing request',
                priority: 'low'
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should only call run once for evaluation
            expect(run).toHaveBeenCalledTimes(1);
            expect(result).toBeDefined();
        }, 15000);
    });
    describe('Error Recovery in Workflow', () => {
        it('should recover from handoff evaluation errors', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock an error on the first call (evaluation), success on second (execution)
            run
                .mockRejectedValueOnce(new Error('Evaluation service unavailable'))
                .mockResolvedValueOnce({
                finalOutput: {
                    result: 'Task completed after evaluation error'
                }
            });
            const task = {
                id: 'error-recovery-task-123',
                description: 'Task that experiences evaluation error',
                input: 'Process with error recovery',
                priority: 'medium'
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should have called run twice - once that failed, once that succeeded
            expect(run).toHaveBeenCalledTimes(2);
            expect(result).toBeDefined();
        }, 15000);
        it('should handle OpenAI agent execution failures', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation recommending handoff, then execution failure
            run
                .mockResolvedValueOnce({
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.9,
                    reason: 'Specialized processing required'
                }
            })
                .mockRejectedValueOnce(new Error('OpenAI service timeout'));
            const task = {
                id: 'execution-failure-task-123',
                description: 'Task that fails during OpenAI execution',
                input: 'Process with execution failure',
                priority: 'high'
            };
            await expect(handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            })).rejects.toThrow('Failed to handoff to OpenAI agent: OpenAI service timeout');
            // Should have called run twice - once for evaluation, once for execution
            expect(run).toHaveBeenCalledTimes(2);
        }, 15000);
    });
    describe('Configuration Integration', () => {
        it('should respect confidence threshold in workflow decisions', async () => {
            // Create handoff system with higher confidence threshold
            handoffSystem = new HybridHandoffSystem({ confidenceThreshold: 0.95 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation with confidence below threshold
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.90, // Below our 0.95 threshold
                    reason: 'Moderate complexity task'
                }
            };
            run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'threshold-task-123',
                description: 'Task with confidence below threshold',
                input: 'Process with confidence check',
                priority: 'medium'
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // The system should still process the task even with confidence below threshold
            expect(result).toBeDefined();
            expect(run).toHaveBeenCalledTimes(1); // Only evaluation call
        }, 15000);
        it('should respect maximum handoff depth', async () => {
            // Create handoff system with limited depth
            handoffSystem = new HybridHandoffSystem({ maxHandoffDepth: 1 });
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock evaluation that would trigger another handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'Test OpenAI Agent',
                    confidence: 0.95,
                    reason: 'Recursive handoff scenario'
                }
            };
            run.mockResolvedValue(mockEvaluationResult);
            const task = {
                id: 'depth-limit-task-123',
                description: 'Task that might trigger deep handoff recursion',
                input: 'Process with depth limit',
                priority: 'high'
            };
            const result = await handoffSystem.executeTaskWithHandoffs(task, {
                userData: { id: 'user-456' },
                history: []
            });
            // Should process the task without infinite recursion
            expect(result).toBeDefined();
            // Verify that the system respects the depth limit (implementation dependent)
        }, 15000);
    });
});
//# sourceMappingURL=handoffs-langgraph.integration.spec.js.map