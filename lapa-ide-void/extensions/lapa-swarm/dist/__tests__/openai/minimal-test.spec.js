"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
// Import the mocked run function
const agents_1 = require("@openai/agents");
(0, vitest_1.describe)('Minimal Hybrid Handoff Test', () => {
    let handoffSystem;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
    });
    (0, vitest_1.it)('should execute task with handoff count tracking', async () => {
        handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
        // Mock evaluation recommending handoff
        const mockEvaluationResult = {
            finalOutput: {
                shouldHandoff: true,
                targetAgentId: 'Test OpenAI Agent',
                confidence: 0.95,
                reason: 'Task requires advanced reasoning capabilities'
            }
        };
        // Mock execution result
        const mockExecutionResult = {
            finalOutput: {
                result: 'Task completed successfully',
                confidence: 0.98
            }
        };
        agents_1.run
            .mockResolvedValueOnce(mockEvaluationResult)
            .mockResolvedValueOnce(mockExecutionResult);
        const task = {
            id: 'test-task-123',
            description: 'Test task',
            type: 'test',
            priority: 1
        };
        const result = await handoffSystem.executeTaskWithHandoffs(task, {
            userData: { id: 'user-456' },
            history: [],
            handoffCount: 0
        });
        (0, vitest_1.expect)(result.result).toBe('Task completed successfully');
        (0, vitest_1.expect)(result.confidence).toBe(0.98);
    }, 10000);
});
//# sourceMappingURL=minimal-test.spec.js.map