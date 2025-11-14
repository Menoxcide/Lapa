"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
// Import the mocked run function
const agents_1 = require("@openai/agents");
(0, vitest_1.describe)('HybridHandoffSystem', () => {
    let handoffSystem;
    let orchestrator;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        vitest_2.vi.clearAllMocks();
        vitest_2.vi.useFakeTimers();
    });
    afterEach(() => {
        vitest_2.vi.useRealTimers();
    });
    (0, vitest_1.describe)('Handoff Evaluation', () => {
        (0, vitest_1.it)('should evaluate handoff with OpenAI agent when enabled', async () => {
            // Register the mock agent
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the OpenAI agent response
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'target-agent-123',
                    confidence: 0.95,
                    reason: 'High complexity task detected'
                }
            };
            agents_1.run.mockResolvedValue(mockEvaluationResult);
            // Create a test context
            const testContext = {
                task: {
                    id: 'task-123',
                    description: 'Complex data analysis task',
                    input: 'Analyze sales data for Q4',
                    priority: 'high'
                },
                context: {
                    userData: { id: 'user-456', preferences: {} },
                    history: []
                }
            };
            // Private method access through casting
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(true);
            (0, vitest_1.expect)(evaluation.targetAgentId).toBe('target-agent-123');
            (0, vitest_1.expect)(evaluation.confidence).toBeCloseTo(0.95);
            (0, vitest_1.expect)(evaluation.reason).toBe('High complexity task detected');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledWith(mockOpenAIAgent, vitest_1.expect.stringContaining('Evaluate this context and task for handoff'));
        });
        (0, vitest_1.it)('should use default policy when OpenAI evaluation is disabled', async () => {
            // Create handoff system with OpenAI evaluation disabled
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({ enableOpenAIEvaluation: false });
            const testContext = {
                task: { id: 'task-123', description: 'Test task' },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBeCloseTo(0); // No confidence when no agents
            (0, vitest_1.expect)(evaluation.reason).toBe('No evaluator agent available');
        });
        (0, vitest_1.it)('should use default policy when no OpenAI agents are registered', async () => {
            const testContext = {
                task: { id: 'task-123', description: 'Test task' },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBeCloseTo(0.5, 1); // Default confidence when evaluation is disabled
            (0, vitest_1.expect)(evaluation.reason).toBe('No evaluator agent available');
        });
        (0, vitest_1.it)('should handle evaluation errors gracefully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock an error response from the OpenAI agent
            agents_1.run.mockRejectedValue(new Error('API timeout'));
            const testContext = {
                task: { id: 'task-123', description: 'Test task' },
                context: {}
            };
            const evaluation = await handoffSystem.evaluateHandoff(testContext, testContext.task);
            (0, vitest_1.expect)(evaluation.shouldHandoff).toBe(false);
            (0, vitest_1.expect)(evaluation.confidence).toBeCloseTo(0); // No confidence when error occurs
            (0, vitest_1.expect)(evaluation.reason).toContain('Evaluation error: API timeout');
        });
    });
    (0, vitest_1.describe)('Handoff Initiation with OpenAI Agents', () => {
        (0, vitest_1.it)('should initiate handoff to OpenAI agent successfully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed successfully' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', // Using the agent name
            'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(result.result).toBe('Task completed successfully');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should retry failed handoff to OpenAI agent', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the retry configuration for faster testing
            handoffSystem.retryConfig = {
                maxRetries: 3,
                retryDelayMs: 10,
                exponentialBackoff: false
            };
            // Fail twice, then succeed
            agents_1.run
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Timeout'))
                .mockResolvedValueOnce({
                finalOutput: { result: 'Task completed on third attempt' }
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(result.result).toBe('Task completed on third attempt');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3); // Verify call count
        });
        (0, vitest_1.it)('should fail handoff after max retries exceeded', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the retry configuration for faster testing
            handoffSystem.retryConfig = {
                maxRetries: 2,
                retryDelayMs: 10,
                exponentialBackoff: false
            };
            // Always fail
            agents_1.run.mockRejectedValue(new Error('Persistent error'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' })).rejects.toThrow('Failed to handoff to OpenAI agent: Persistent error');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(3); // Verify call count
        });
        (0, vitest_1.it)('should initiate handoff to regular LAPA agent when target is not an OpenAI agent', async () => {
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff initiation
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'handoff-123',
                compressedSize: 1024,
                transferTime: 50
            });
            // Mock successful handoff completion
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Handoff completed successfully'
            });
            const result = await handoffSystem.initiateHandoff('source-agent-123', 'regular-lapa-agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(result.result).toBe('Handoff completed successfully');
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Lifecycle Hooks', () => {
        (0, vitest_1.it)('should call lifecycle hooks during handoff process', async () => {
            // Create handoff system with hooks
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            agents_1.run.mockResolvedValue(mockRunResult);
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'task-456');
            (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'task-456', vitest_1.expect.any(Number) // Duration
            );
            // Wait for any asynchronous operations
            await vitest_2.vi.waitFor(() => (0, vitest_1.expect)(hooks.onHandoffComplete).toHaveBeenCalled());
            (0, vitest_1.expect)(hooks.onHandoffError).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should call error hook when handoff fails', async () => {
            const hooks = {
                onHandoffStart: vitest_2.vi.fn(),
                onHandoffComplete: vitest_2.vi.fn(),
                onHandoffError: vitest_2.vi.fn()
            };
            handoffSystem = new handoffs_ts_1.HybridHandoffSystem({}, hooks);
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock an error
            agents_1.run.mockRejectedValue(new Error('Handoff failed'));
            await (0, vitest_1.expect)(handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' })).rejects.toThrow('Failed to handoff to OpenAI agent: Handoff failed');
            (0, vitest_1.expect)(hooks.onHandoffStart).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'task-456');
            (0, vitest_1.expect)(hooks.onHandoffError).toHaveBeenCalledWith('source-agent-123', 'Test OpenAI Agent', 'task-456', vitest_1.expect.any(Error));
            (0, vitest_1.expect)(hooks.onHandoffComplete).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Performance Monitoring', () => {
        (0, vitest_1.it)('should warn when handoff latency exceeds target', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure a very short latency target for testing
            handoffSystem.updateConfig({ latencyTargetMs: 1 });
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            // Mock a slow response
            agents_1.run.mockImplementation(async () => {
                // Simulate a delay longer than the target
                await new Promise(resolve => setTimeout(resolve, 10));
                return mockRunResult;
            });
            // Spy on console.warn
            const consoleWarnSpy = vitest_2.vi.spyOn(console, 'warn').mockImplementation(() => { });
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(consoleWarnSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Handoff latency target exceeded'));
            consoleWarnSpy.mockRestore();
        });
        (0, vitest_1.it)('should meet latency target for fast handoffs', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Configure a reasonable latency target
            handoffSystem.updateConfig({ latencyTargetMs: 1000 });
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            // Mock a fast response
            agents_1.run.mockResolvedValue(mockRunResult);
            // Spy on console.warn to ensure it's not called
            const consoleWarnSpy = vitest_2.vi.spyOn(console, 'warn').mockImplementation(() => { });
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            (0, vitest_1.expect)(consoleWarnSpy).not.toHaveBeenCalledWith(vitest_1.expect.stringContaining('Handoff latency target exceeded'));
            consoleWarnSpy.mockRestore();
        });
        (0, vitest_1.it)('should complete handoff in under 2 seconds', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            const mockRunResult = {
                finalOutput: { result: 'Task completed' }
            };
            // Mock a response
            agents_1.run.mockResolvedValue(mockRunResult);
            // Measure execution time
            const startTime = Date.now();
            await handoffSystem.initiateHandoff('source-agent-123', 'Test OpenAI Agent', 'task-456', { testData: 'sample context data' });
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete in under 2 seconds
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
        });
    });
    (0, vitest_1.describe)('Configuration Management', () => {
        (0, vitest_1.it)('should update configuration correctly', () => {
            const initialConfig = handoffSystem.getConfig();
            (0, vitest_1.expect)(initialConfig.enableOpenAIEvaluation).toBe(true);
            (0, vitest_1.expect)(initialConfig.confidenceThreshold).toBe(0.8);
            (0, vitest_1.expect)(initialConfig.latencyTargetMs).toBe(2000);
            handoffSystem.updateConfig({
                enableOpenAIEvaluation: false,
                confidenceThreshold: 0.9,
                latencyTargetMs: 1500,
                maxHandoffDepth: 5
            });
            const updatedConfig = handoffSystem.getConfig();
            (0, vitest_1.expect)(updatedConfig.enableOpenAIEvaluation).toBe(false);
            (0, vitest_1.expect)(updatedConfig.confidenceThreshold).toBe(0.9);
            (0, vitest_1.expect)(updatedConfig.latencyTargetMs).toBe(1500);
        });
    });
});
//# sourceMappingURL=handoffs.spec.js.map