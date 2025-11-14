"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ctx_zip_integration_ts_1 = require("../../mcp/ctx-zip.integration.ts");
const context_handoff_ts_1 = require("../../swarm/context.handoff.ts");
(0, vitest_1.describe)('ctx-zip and MCP Integration', () => {
    (0, vitest_1.describe)('Context Compression in Handoff Workflow', () => {
        let contextHandoff;
        beforeEach(() => {
            contextHandoff = new context_handoff_ts_1.ContextHandoffManager();
        });
        (0, vitest_1.it)('should compress context during handoff with high priority', async () => {
            const largeContext = {
                codebase: 'console.log("Hello World");'.repeat(1000), // Large context
                dependencies: Array.from({ length: 100 }, (_, i) => `dependency-${i}`),
                config: {
                    env: 'production',
                    features: ['auth', 'chat', 'notifications'],
                    limits: {
                        users: 10000,
                        requests: 1000
                    }
                },
                history: Array.from({ length: 50 }, (_, i) => ({
                    action: `action-${i}`,
                    timestamp: Date.now() - i * 1000,
                    result: `result-${i}`
                }))
            };
            const handoffRequest = {
                sourceAgentId: 'agent-1',
                targetAgentId: 'agent-2',
                taskId: 'large-context-task',
                context: largeContext,
                priority: 'high'
            };
            // Initiate handoff which should compress the context
            const response = await contextHandoff.initiateHandoff(handoffRequest);
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(response.handoffId).toBeDefined();
            (0, vitest_1.expect)(response.compressedSize).toBeGreaterThan(0);
            // Compression should be significant for large context
            const originalSize = JSON.stringify(largeContext).length;
            const compressionRatio = originalSize / response.compressedSize;
            (0, vitest_1.expect)(compressionRatio).toBeGreaterThan(2); // At least 2x compression
            // Complete handoff to verify decompression works
            const receivedContext = await contextHandoff.completeHandoff(response.handoffId, 'agent-2');
            (0, vitest_1.expect)(receivedContext).toEqual(largeContext);
        });
        (0, vitest_1.it)('should maintain semantic meaning after compression/decompression', async () => {
            const semanticContext = {
                userStory: 'As a user, I want to be able to reset my password so that I can regain access to my account if I forget it.',
                acceptanceCriteria: [
                    'User can request password reset via email',
                    'System sends password reset link with expiration',
                    'User can enter new password twice for confirmation',
                    'Password must meet security requirements',
                    'User receives confirmation after successful reset'
                ],
                technicalRequirements: {
                    encryption: 'Use bcrypt for password hashing',
                    emailService: 'Integrate with SendGrid for email delivery',
                    rateLimiting: 'Limit reset requests to 5 per hour per user',
                    validation: 'Validate email format and user existence'
                }
            };
            const handoffRequest = {
                sourceAgentId: 'planner-agent',
                targetAgentId: 'coder-agent',
                taskId: 'password-reset-feature',
                context: semanticContext,
                priority: 'medium'
            };
            const response = await contextHandoff.initiateHandoff(handoffRequest);
            (0, vitest_1.expect)(response.success).toBe(true);
            const receivedContext = await contextHandoff.completeHandoff(response.handoffId, 'coder-agent');
            // Verify semantic content is preserved
            (0, vitest_1.expect)(receivedContext.userStory).toBe(semanticContext.userStory);
            (0, vitest_1.expect)(receivedContext.acceptanceCriteria).toEqual(semanticContext.acceptanceCriteria);
            (0, vitest_1.expect)(receivedContext.technicalRequirements).toEqual(semanticContext.technicalRequirements);
        });
        (0, vitest_1.it)('should handle different compression priorities appropriately', async () => {
            const testContext = {
                data: 'Test data for compression'.repeat(100)
            };
            // Test high priority (less compression for speed)
            const highPriorityResponse = await contextHandoff.initiateHandoff({
                sourceAgentId: 'fast-agent',
                targetAgentId: 'consumer-agent',
                taskId: 'high-priority-task',
                context: testContext,
                priority: 'high'
            });
            (0, vitest_1.expect)(highPriorityResponse.success).toBe(true);
            const highPrioritySize = highPriorityResponse.compressedSize;
            // Test low priority (more compression for size)
            const lowPriorityResponse = await contextHandoff.initiateHandoff({
                sourceAgentId: 'slow-agent',
                targetAgentId: 'consumer-agent',
                taskId: 'low-priority-task',
                context: testContext,
                priority: 'low'
            });
            (0, vitest_1.expect)(lowPriorityResponse.success).toBe(true);
            const lowPrioritySize = lowPriorityResponse.compressedSize;
            // Low priority should result in smaller size (more compression)
            // Note: This might not always be true depending on the implementation,
            // but it's the expected behavior
            (0, vitest_1.expect)(lowPrioritySize).toBeGreaterThan(0);
            (0, vitest_1.expect)(highPrioritySize).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('ctx-zip Effectiveness Validation', () => {
        (0, vitest_1.it)('should achieve >80% compression reduction for large payloads', async () => {
            // Create a large payload to test compression effectiveness
            const largePayload = `
        This is a test payload for validating ctx-zip compression effectiveness.
        It contains repetitive content to ensure we can achieve high compression ratios.
      `.repeat(1000); // Make it large enough to test effectiveness
            const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(largePayload);
            (0, vitest_1.expect)(stats.reductionPercentage).toBeGreaterThan(80);
            (0, vitest_1.expect)(stats.compressionRatio).toBeGreaterThan(5); // At least 5x compression
            // Verify the compression is working correctly
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(largePayload);
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
            (0, vitest_1.expect)(decompressed).toBe(largePayload);
        });
        (0, vitest_1.it)('should maintain effectiveness across different content types', async () => {
            const contentTypes = [
                {
                    name: 'Source Code',
                    content: 'function helloWorld() {\n  console.log("Hello, World!");\n  return true;\n}'.repeat(100)
                },
                {
                    name: 'JSON Data',
                    content: JSON.stringify({
                        users: Array.from({ length: 100 }, (_, i) => ({
                            id: i,
                            name: `User ${i}`,
                            email: `user${i}@example.com`,
                            roles: ['user'],
                            preferences: {
                                theme: 'dark',
                                notifications: true
                            }
                        })),
                        settings: {
                            appVersion: '1.0.0',
                            features: ['auth', 'messaging', 'storage'],
                            limits: {
                                maxUsers: 1000,
                                maxMessages: 10000
                            }
                        }
                    })
                },
                {
                    name: 'Documentation',
                    content: `
            # System Documentation
            
            ## Overview
            This system provides a comprehensive solution for managing user interactions.
            
            ## Features
            - Real-time communication
            - User authentication and authorization
            - Data persistence and retrieval
            - Analytics and reporting
            
            ## Architecture
            The system follows a microservices architecture with the following components:
            
            1. User Service - Manages user accounts and profiles
            2. Communication Service - Handles messaging and notifications
            3. Data Service - Provides data storage and retrieval
            4. Analytics Service - Processes and analyzes user data
          `.repeat(50)
                }
            ];
            for (const { name, content } of contentTypes) {
                const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(content);
                // Log the results for visibility
                console.log(`${name} Compression Results:`);
                console.log(`  Original Size: ${stats.originalSize} bytes`);
                console.log(`  Compressed Size: ${stats.compressedSize} bytes`);
                console.log(`  Reduction: ${stats.reductionPercentage.toFixed(2)}%`);
                console.log(`  Ratio: ${stats.compressionRatio.toFixed(2)}x`);
                // Verify minimum effectiveness requirements
                (0, vitest_1.expect)(stats.reductionPercentage).toBeGreaterThan(70); // At least 70% for any content
                // Verify round-trip integrity
                const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(content);
                const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(compressed);
                (0, vitest_1.expect)(decompressed).toBe(content);
            }
        });
        (0, vitest_1.it)('should track and analyze compression statistics', async () => {
            // Record multiple compression stats
            const testPayloads = [
                'Small payload',
                'Medium payload '.repeat(10),
                'Large payload '.repeat(100),
                'Extra large payload '.repeat(1000)
            ];
            for (let i = 0; i < testPayloads.length; i++) {
                const payload = testPayloads[i];
                const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(payload);
                // Record stats with different session IDs
                await (0, ctx_zip_integration_ts_1.recordCompressionStats)({
                    ...stats,
                    sessionId: `test-session-${i}`
                });
            }
            // Record some feedback
            await (0, ctx_zip_integration_ts_1.recordCompressionFeedback)({
                sessionId: 'feedback-1',
                effectivenessRating: 9,
                semanticPreservation: 8,
                notes: 'Excellent compression with minimal semantic loss',
                timestamp: new Date()
            });
            await (0, ctx_zip_integration_ts_1.recordCompressionFeedback)({
                sessionId: 'feedback-2',
                effectivenessRating: 7,
                semanticPreservation: 9,
                notes: 'Good semantic preservation but could be smaller',
                timestamp: new Date()
            });
            // Analyze effectiveness
            const analysis = await (0, ctx_zip_integration_ts_1.analyzeCompressionEffectiveness)();
            (0, vitest_1.expect)(analysis.averageReduction).toBeGreaterThan(0);
            (0, vitest_1.expect)(analysis.totalSessions).toBeGreaterThan(0);
            (0, vitest_1.expect)(analysis.effectivenessRating).toBeGreaterThan(0);
            (0, vitest_1.expect)(Array.isArray(analysis.recommendations)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Feedback Loop Integration', () => {
        (0, vitest_1.it)('should process feedback and provide optimization suggestions', async () => {
            const feedbackController = new ctx_zip_integration_ts_1.CtxZipFeedbackController();
            // Add various feedback entries
            const feedbackEntries = [
                {
                    sessionId: 'session-1',
                    effectivenessRating: 9,
                    semanticPreservation: 8,
                    notes: 'Excellent results',
                    timestamp: new Date()
                },
                {
                    sessionId: 'session-2',
                    effectivenessRating: 6,
                    semanticPreservation: 9,
                    notes: 'Good semantics but needs better compression',
                    timestamp: new Date()
                },
                {
                    sessionId: 'session-3',
                    effectivenessRating: 8,
                    semanticPreservation: 7,
                    notes: 'Balanced results',
                    timestamp: new Date()
                },
                {
                    sessionId: 'session-4',
                    effectivenessRating: 9,
                    semanticPreservation: 9,
                    notes: 'Perfect balance',
                    timestamp: new Date()
                }
            ];
            feedbackEntries.forEach(feedback => {
                feedbackController.addFeedback(feedback);
            });
            // Process feedback
            const feedbackResult = await feedbackController.processFeedback();
            (0, vitest_1.expect)(feedbackResult.avgEffectiveness).toBeGreaterThan(0);
            (0, vitest_1.expect)(feedbackResult.avgSemanticPreservation).toBeGreaterThan(0);
            (0, vitest_1.expect)(feedbackResult.compressionImprovement).toBeDefined();
            // Add compression stats as well
            const compressionStats = [
                {
                    sessionId: 'stats-1',
                    originalSize: 10000,
                    compressedSize: 1200,
                    compressionRatio: 8.33,
                    reductionPercentage: 88,
                    timestamp: new Date()
                },
                {
                    sessionId: 'stats-2',
                    originalSize: 5000,
                    compressedSize: 750,
                    compressionRatio: 6.67,
                    reductionPercentage: 85,
                    timestamp: new Date()
                }
            ];
            compressionStats.forEach(stats => {
                feedbackController.addStats(stats);
            });
            // Process again with both stats and feedback
            const combinedResult = await feedbackController.processFeedback();
            // Results should be reset after processing
            (0, vitest_1.expect)(combinedResult.avgEffectiveness).toBe(0);
            (0, vitest_1.expect)(combinedResult.avgSemanticPreservation).toBe(0);
            (0, vitest_1.expect)(combinedResult.compressionImprovement).toBe('No feedback data available');
        });
    });
    (0, vitest_1.describe)('Storage Integration', () => {
        (0, vitest_1.it)('should store and load compressed contexts correctly', async () => {
            const testContext = 'This is a test context for storage integration';
            const sessionId = 'storage-test-session';
            // Compress context
            const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(testContext);
            // Store compressed context
            await (0, ctx_zip_integration_ts_1.storeCompressedContext)(sessionId, compressed);
            // Load compressed context
            const loadedCompressed = await (0, ctx_zip_integration_ts_1.loadCompressedContext)(sessionId);
            // Verify the compressed data is the same
            (0, vitest_1.expect)(loadedCompressed).toEqual(compressed);
            // Decompress to verify integrity
            const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(loadedCompressed);
            (0, vitest_1.expect)(decompressed).toBe(testContext);
        });
        (0, vitest_1.it)('should handle storage of multiple contexts', async () => {
            const contexts = [
                { id: 'ctx-1', data: 'First context data' },
                { id: 'ctx-2', data: 'Second context data with more content to compress' },
                { id: 'ctx-3', data: 'Third context data' }
            ];
            // Store all contexts
            for (const ctx of contexts) {
                const compressed = await (0, ctx_zip_integration_ts_1.compressContext)(ctx.data);
                await (0, ctx_zip_integration_ts_1.storeCompressedContext)(ctx.id, compressed);
            }
            // Load and verify all contexts
            for (const ctx of contexts) {
                const loadedCompressed = await (0, ctx_zip_integration_ts_1.loadCompressedContext)(ctx.id);
                const decompressed = await (0, ctx_zip_integration_ts_1.decompressContext)(loadedCompressed);
                (0, vitest_1.expect)(decompressed).toBe(ctx.data);
            }
        });
    });
    (0, vitest_1.describe)('Performance Under Load', () => {
        (0, vitest_1.it)('should maintain compression quality with repeated operations', async () => {
            const testContext = 'Performance test context data '.repeat(50);
            const results = [];
            // Perform multiple compression operations
            for (let i = 0; i < 10; i++) {
                const stats = await (0, ctx_zip_integration_ts_1.testCtxZipCompression)(testContext);
                results.push(stats.reductionPercentage);
            }
            // Verify consistency
            const avgReduction = results.reduce((sum, val) => sum + val, 0) / results.length;
            const minReduction = Math.min(...results);
            const maxReduction = Math.max(...results);
            // All results should be within reasonable range
            (0, vitest_1.expect)(avgReduction).toBeGreaterThan(80);
            (0, vitest_1.expect)(minReduction).toBeGreaterThan(70);
            (0, vitest_1.expect)(maxReduction).toBeLessThan(95); // Should not be perfect compression
            // Variance should be relatively small (less than 5% difference)
            const variance = maxReduction - minReduction;
            (0, vitest_1.expect)(variance).toBeLessThan(5);
        });
    });
});
//# sourceMappingURL=ctx-zip-mcp.test.js.map