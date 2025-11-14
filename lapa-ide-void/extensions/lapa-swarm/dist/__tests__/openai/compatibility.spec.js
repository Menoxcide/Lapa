"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
const langgraph_orchestrator_js_1 = require("../../swarm/langgraph.orchestrator.js");
const vitest_2 = require("vitest");
// Mock the OpenAI agents SDK
vitest_2.vi.mock('@openai/agents', () => {
    return {
        run: vitest_2.vi.fn()
    };
});
// Import the mocked run function
const agents_1 = require("@openai/agents");
(0, vitest_1.describe)('OpenAI-LAPA Compatibility', () => {
    let handoffSystem;
    let orchestrator;
    let mockOpenAIAgent;
    beforeEach(() => {
        handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        orchestrator = new langgraph_orchestrator_js_1.LangGraphOrchestrator('start');
        mockOpenAIAgent = {
            id: 'openai-agent-1',
            name: 'Test OpenAI Agent',
            instructions: 'Test instructions',
            tools: [],
            model: 'gpt-4'
        };
        // Clear all mocks before each test
        // All mocks are automatically cleared in vitest
    });
    (0, vitest_1.describe)('Mixed Agent Environment', () => {
        (0, vitest_1.it)('should handle handoffs between OpenAI agents and LAPA agents seamlessly', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager for LAPA agents
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff to LAPA agent
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'lapa-handoff-123',
                compressedSize: 2048,
                transferTime: 75
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Handoff to LAPA agent completed successfully',
                processedData: 'LAPA processed data'
            });
            // Mock OpenAI evaluation recommending handoff to LAPA agent
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-data-processing-agent',
                    confidence: 0.88,
                    reason: 'Task requires LAPA specialized data processing capabilities'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const result = await handoffSystem.initiateHandoff('openai-agent-1', 'lapa-data-processing-agent', 'mixed-environment-task-456', {
                testData: 'context data for mixed environment',
                processingRequirements: ['data_analysis', 'pattern_recognition']
            });
            (0, vitest_1.expect)(result.result).toBe('Handoff to LAPA agent completed successfully');
            (0, vitest_1.expect)(result.processedData).toBe('LAPA processed data');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle round-trip handoffs from LAPA to OpenAI and back', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager for LAPA agents
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff initiation from LAPA to OpenAI
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'lapa-to-openai-123',
                compressedSize: 1536,
                transferTime: 60
            });
            // Mock OpenAI processing result
            const mockOpenAIResult = {
                finalOutput: {
                    analysis: 'OpenAI analysis complete',
                    recommendations: ['Optimize data flow', 'Enhance pattern recognition'],
                    confidence: 0.92
                }
            };
            agents_1.run.mockResolvedValueOnce(mockOpenAIResult);
            // Mock completion of handoff back to LAPA agent
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Round-trip handoff completed',
                integratedResults: {
                    openAIAnalysis: 'OpenAI analysis complete',
                    lapaprocessing: 'LAPA post-processing applied'
                }
            });
            // Simulate initiating handoff from LAPA agent context
            const result = await handoffSystem.initiateHandoff('lapa-initial-agent', 'Test OpenAI Agent', 'round-trip-task-456', {
                initialData: 'LAPA processed data',
                handoffReason: 'Advanced analysis required'
            });
            // Complete the handoff back to LAPA
            const finalResult = await handoffSystem.initiateHandoff('Test OpenAI Agent', 'lapa-final-agent', 'round-trip-completion-456', result);
            (0, vitest_1.expect)(finalResult.integratedResults.openAIAnalysis).toBe('OpenAI analysis complete');
            (0, vitest_1.expect)(finalResult.integratedResults.lapaprocessing).toBe('LAPA post-processing applied');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should maintain context integrity during mixed agent handoffs', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful LAPA handoff
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'context-integrity-123',
                compressedSize: 1024,
                transferTime: 45
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                userData: { id: 'user-456', preferences: { theme: 'dark' } },
                taskHistory: ['task-1', 'task-2'],
                processingState: 'intermediate',
                metrics: { accuracy: 0.95, speed: 'fast' }
            });
            // Mock OpenAI evaluation
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-context-preservation-agent',
                    confidence: 0.91,
                    reason: 'Context preservation required'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            // Complex context with nested structures
            const complexContext = {
                userData: {
                    id: 'user-456',
                    preferences: {
                        theme: 'dark',
                        language: 'en',
                        notifications: { email: true, push: false }
                    }
                },
                taskData: {
                    id: 'complex-task-789',
                    steps: [
                        { id: 'step-1', status: 'completed', result: 'data-collected' },
                        { id: 'step-2', status: 'pending', dependencies: ['step-1'] }
                    ],
                    metadata: {
                        createdAt: new Date().toISOString(),
                        tags: ['important', 'urgent'],
                        version: '1.2.3'
                    }
                },
                processingHistory: [
                    { agent: 'lapa-initial', timestamp: Date.now() - 1000, action: 'data-ingestion' },
                    { agent: 'lapa-processing', timestamp: Date.now() - 500, action: 'preprocessing' }
                ]
            };
            const result = await handoffSystem.initiateHandoff('openai-agent-1', 'lapa-context-preservation-agent', 'context-integrity-task-456', complexContext);
            // Verify context integrity
            (0, vitest_1.expect)(result.userData.id).toBe('user-456');
            (0, vitest_1.expect)(result.userData.preferences.theme).toBe('dark');
            (0, vitest_1.expect)(result.taskData.steps).toHaveLength(2);
            (0, vitest_1.expect)(result.taskData.metadata.tags).toEqual(['important', 'urgent']);
            (0, vitest_1.expect)(result.processingHistory).toHaveLength(2);
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockContextHandoffManager.initiateHandoff).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContextHandoffManager.completeHandoff).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Backward Compatibility', () => {
        (0, vitest_1.it)('should work with existing LAPA agent configurations', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Test with configuration that mimics existing LAPA setups
            handoffSystem.updateConfig({
                enableOpenAIEvaluation: true,
                confidenceThreshold: 0.75, // Typical LAPA threshold
                maxHandoffDepth: 5, // Generous depth for complex workflows
                latencyTargetMs: 3000 // Slightly relaxed for compatibility
            });
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock LAPA handoff
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'backward-compat-123',
                compressedSize: 512,
                transferTime: 30
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Backward compatible handoff completed',
                legacySupport: true
            });
            // Mock OpenAI evaluation with lower confidence (still above threshold)
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'legacy-lapa-agent',
                    confidence: 0.8, // Above the 0.75 threshold
                    reason: 'Legacy agent has required capabilities'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const result = await handoffSystem.initiateHandoff('modern-openai-agent', 'legacy-lapa-agent', 'backward-compat-task-456', {
                legacyDataFormat: true,
                compatibilityMode: 'strict'
            });
            (0, vitest_1.expect)(result.result).toBe('Backward compatible handoff completed');
            (0, vitest_1.expect)(result.legacySupport).toBe(true);
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle deprecated LAPA agent interfaces gracefully', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager with older interface
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn(),
                // Older interface might have additional methods
                getStatus: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock successful handoff with older response format
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'deprecated-interface-123',
                // Older format might have different field names
                size: 256, // Instead of compressedSize
                time: 25 // Instead of transferTime
                // Note: Newer fields are missing but system should handle gracefully
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Handled deprecated interface successfully',
                compatibilityLayer: 'active'
            });
            // Mock OpenAI evaluation
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'deprecated-lapa-agent',
                    confidence: 0.85,
                    reason: 'Deprecated agent required for legacy system integration'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const result = await handoffSystem.initiateHandoff('openai-agent-1', 'deprecated-lapa-agent', 'deprecated-interface-task-456', {
                legacyInterface: true,
                adapterRequired: true
            });
            (0, vitest_1.expect)(result.result).toBe('Handled deprecated interface successfully');
            (0, vitest_1.expect)(result.compatibilityLayer).toBe('active');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should maintain performance with mixed agent versions', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock LAPA handoffs with varying performance characteristics
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'mixed-version-123',
                compressedSize: 768,
                transferTime: 40
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Mixed version handoff completed',
                versionInfo: {
                    source: 'v1.2.0',
                    target: 'v2.1.0',
                    compatibility: 'full'
                }
            });
            // Mock OpenAI evaluation
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'version-mixed-agent',
                    confidence: 0.89,
                    reason: 'Version mixing required for gradual upgrade'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const startTime = performance.now();
            const result = await handoffSystem.initiateHandoff('openai-v1.0.0', 'version-mixed-agent', 'mixed-version-task-456', {
                versionMixing: true,
                upgradePath: 'gradual'
            });
            const endTime = performance.now();
            const duration = endTime - startTime;
            (0, vitest_1.expect)(result.result).toBe('Mixed version handoff completed');
            (0, vitest_1.expect)(result.versionInfo.compatibility).toBe('full');
            // Should still maintain performance targets
            (0, vitest_1.expect)(duration).toBeLessThan(2000);
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Feature Parity', () => {
        (0, vitest_1.it)('should support all features available to pure LAPA agent handoffs', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock feature-rich LAPA handoff response
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'feature-parity-123',
                compressedSize: 2048,
                transferTime: 85,
                encryption: 'AES-256',
                checksum: 'abc123def456',
                priority: 'high'
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Feature parity maintained',
                security: {
                    encrypted: true,
                    verified: true,
                    algorithm: 'AES-256'
                },
                performance: {
                    compressionRatio: 0.75,
                    transferSpeed: 'fast',
                    resourceUtilization: 'optimal'
                },
                auditTrail: [
                    { action: 'initiate', timestamp: Date.now() - 100 },
                    { action: 'transfer', timestamp: Date.now() - 50 },
                    { action: 'complete', timestamp: Date.now() }
                ]
            });
            // Mock OpenAI evaluation requesting feature-rich handoff
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'feature-complete-lapa-agent',
                    confidence: 0.93,
                    reason: 'Full feature set required for secure processing'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const result = await handoffSystem.initiateHandoff('openai-security-agent', 'feature-complete-lapa-agent', 'feature-parity-task-456', {
                securityCritical: true,
                requiresAudit: true,
                compliance: ['GDPR', 'HIPAA']
            });
            // Verify all features are supported
            (0, vitest_1.expect)(result.result).toBe('Feature parity maintained');
            (0, vitest_1.expect)(result.security.encrypted).toBe(true);
            (0, vitest_1.expect)(result.security.verified).toBe(true);
            (0, vitest_1.expect)(result.performance.compressionRatio).toBe(0.75);
            (0, vitest_1.expect)(result.auditTrail).toHaveLength(3);
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle complex routing scenarios with both agent types', async () => {
            handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
            // Mock the context handoff manager
            const mockContextHandoffManager = {
                initiateHandoff: vitest_2.vi.fn(),
                completeHandoff: vitest_2.vi.fn()
            };
            // Inject the mock
            handoffSystem.contextHandoffManager = mockContextHandoffManager;
            // Mock multiple LAPA handoff responses
            mockContextHandoffManager.initiateHandoff.mockResolvedValue({
                success: true,
                handoffId: 'routing-123',
                compressedSize: 1024,
                transferTime: 50
            });
            mockContextHandoffManager.completeHandoff.mockResolvedValue({
                result: 'Routing completed successfully',
                routingPath: ['openai-agent-1', 'lapa-specialist-1', 'lapa-analyzer-2', 'openai-agent-1'],
                finalDestination: 'openai-agent-1'
            });
            // Mock OpenAI evaluation for complex routing
            const mockEvaluationResult = {
                finalOutput: {
                    shouldHandoff: true,
                    targetAgentId: 'lapa-specialist-1',
                    confidence: 0.87,
                    reason: 'Specialized processing required, will route back after analysis'
                }
            };
            agents_1.run.mockResolvedValueOnce(mockEvaluationResult);
            const result = await handoffSystem.initiateHandoff('openai-initial-agent', 'lapa-specialist-1', 'complex-routing-task-456', {
                routingRequired: true,
                intermediateProcessing: ['specialized-analysis', 'data-validation'],
                finalAggregation: 'openai-agent-1'
            });
            (0, vitest_1.expect)(result.result).toBe('Routing completed successfully');
            (0, vitest_1.expect)(result.routingPath).toEqual([
                'openai-agent-1',
                'lapa-specialist-1',
                'lapa-analyzer-2',
                'openai-agent-1'
            ]);
            (0, vitest_1.expect)(result.finalDestination).toBe('openai-agent-1');
            (0, vitest_1.expect)(agents_1.run).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=compatibility.spec.js.map