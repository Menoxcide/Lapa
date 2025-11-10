import { MoERouter } from '../../src/agents/moe-router';
import { RayParallelExecutor } from '../../src/agents/ray-parallel';
import { ConsensusVotingSystem } from '../../src/swarm/consensus.voting';
import { ContextHandoffManager } from '../../src/swarm/context.handoff';
import { LangGraphOrchestrator } from '../../src/swarm/langgraph.orchestrator';
import { PersonaManager } from '../../src/agents/persona.manager';
import { testCtxZipCompression } from '../../src/mcp/ctx-zip.integration';
describe('End-to-End User Journeys', () => {
    describe('Complete Feature Development Journey', () => {
        let moeRouter;
        let parallelExecutor;
        let votingSystem;
        let contextHandoff;
        let orchestrator;
        let personaManager;
        beforeEach(() => {
            moeRouter = new MoERouter();
            parallelExecutor = new RayParallelExecutor();
            votingSystem = new ConsensusVotingSystem();
            contextHandoff = new ContextHandoffManager();
            orchestrator = new LangGraphOrchestrator('start');
            personaManager = new PersonaManager();
        });
        it('should complete a full feature development cycle', async () => {
            // Journey: User wants to implement a real-time chat feature
            console.log('Starting feature development journey...');
            // Step 1: Initialize agents with personas
            const agents = [
                {
                    id: 'planner-agent',
                    type: 'planner',
                    name: 'Strategic Planner',
                    expertise: ['planning', 'requirement-analysis', 'task-decomposition'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'coder-agent',
                    type: 'coder',
                    name: 'Expert Coder',
                    expertise: ['javascript', 'websocket', 'react', 'nodejs'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'reviewer-agent',
                    type: 'reviewer',
                    name: 'Quality Guardian',
                    expertise: ['code-review', 'security', 'best-practices'],
                    workload: 0,
                    capacity: 4
                },
                {
                    id: 'tester-agent',
                    type: 'tester',
                    name: 'Test Architect',
                    expertise: ['unit-testing', 'integration-testing', 'e2e-testing'],
                    workload: 0,
                    capacity: 4
                },
                {
                    id: 'debugger-agent',
                    type: 'debugger',
                    name: 'Bug Hunter',
                    expertise: ['troubleshooting', 'debugging', 'performance'],
                    workload: 0,
                    capacity: 3
                }
            ];
            // Register agents with all systems
            agents.forEach(agent => {
                moeRouter.registerAgent(agent);
                votingSystem.registerAgent(agent);
            });
            console.log('Agents initialized with personas');
            // Step 2: User submits feature request
            const featureRequest = {
                id: 'req-001',
                title: 'Real-time Chat Feature',
                description: 'Implement a real-time chat system with user presence indicators and message history',
                priority: 2,
                requirements: [
                    'WebSocket-based real-time messaging',
                    'User presence indicators (online/offline)',
                    'Message history with pagination',
                    'Support for 1000+ concurrent users',
                    'End-to-end encryption for private messages'
                ]
            };
            console.log('Feature request submitted:', featureRequest.title);
            // Step 3: Route initial planning task
            const planningTask = {
                id: 'plan-task-001',
                description: `Create implementation plan for: ${featureRequest.title}`,
                type: 'planning',
                priority: featureRequest.priority,
                context: {
                    requirements: featureRequest.requirements,
                    constraints: 'Must support high concurrency'
                }
            };
            const planningRoute = moeRouter.routeTask(planningTask);
            expect(planningRoute.agent.type).toBe('planner');
            console.log(`Planning task routed to: ${planningRoute.agent.name}`);
            // Step 4: Execute planning in parallel
            const planningResult = await parallelExecutor.executeTask(planningTask);
            expect(planningResult.success).toBe(true);
            console.log('Planning phase completed');
            // Step 5: Handoff plan to coder
            const codingHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'planner-agent',
                targetAgentId: 'coder-agent',
                taskId: 'coding-task-001',
                context: {
                    plan: planningResult.result,
                    requirements: featureRequest.requirements,
                    featureTitle: featureRequest.title
                },
                priority: 'high'
            });
            expect(codingHandoff.success).toBe(true);
            console.log('Plan handed off to coder');
            const codingContext = await contextHandoff.completeHandoff(codingHandoff.handoffId, 'coder-agent');
            // Step 6: Execute coding task
            const codingTask = {
                id: 'code-task-001',
                description: `Implement chat feature based on plan`,
                type: 'code_generation',
                priority: featureRequest.priority,
                context: codingContext
            };
            const codingRoute = moeRouter.routeTask(codingTask);
            expect(codingRoute.agent.id).toBe('coder-agent');
            const codingResult = await parallelExecutor.executeTask(codingTask);
            expect(codingResult.success).toBe(true);
            console.log('Coding phase completed');
            // Step 7: Handoff to reviewer
            const reviewHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'coder-agent',
                targetAgentId: 'reviewer-agent',
                taskId: 'review-task-001',
                context: {
                    implementation: codingResult.result,
                    requirements: featureRequest.requirements,
                    featureTitle: featureRequest.title
                },
                priority: 'medium'
            });
            expect(reviewHandoff.success).toBe(true);
            console.log('Implementation handed off to reviewer');
            const reviewContext = await contextHandoff.completeHandoff(reviewHandoff.handoffId, 'reviewer-agent');
            // Step 8: Conduct code review voting
            const reviewSessionId = votingSystem.createVotingSession('Code Review: Real-time Chat Feature', [
                { id: 'approve', label: 'Approve', value: 'approved' },
                { id: 'revise', label: 'Request Revisions', value: 'revisions' },
                { id: 'reject', label: 'Reject', value: 'rejected' }
            ], 3 // Quorum of 3 reviewers
            );
            // Simulate voting
            votingSystem.castVote(reviewSessionId, 'planner-agent', 'approve', 'Plan well-executed');
            votingSystem.castVote(reviewSessionId, 'coder-agent', 'approve', 'Clean implementation');
            votingSystem.castVote(reviewSessionId, 'reviewer-agent', 'approve', 'Meets all requirements');
            const reviewResult = votingSystem.closeVotingSession(reviewSessionId);
            expect(reviewResult.consensusReached).toBe(true);
            expect(reviewResult.winningOption?.id).toBe('approve');
            console.log('Code review voting completed with approval');
            // Step 9: Handoff to tester
            const testingHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'reviewer-agent',
                targetAgentId: 'tester-agent',
                taskId: 'test-task-001',
                context: {
                    implementation: codingResult.result,
                    requirements: featureRequest.requirements,
                    reviewOutcome: reviewResult,
                    featureTitle: featureRequest.title
                },
                priority: 'medium'
            });
            expect(testingHandoff.success).toBe(true);
            console.log('Implementation handed off to tester');
            const testingContext = await contextHandoff.completeHandoff(testingHandoff.handoffId, 'tester-agent');
            // Step 10: Execute testing task
            const testingTask = {
                id: 'testing-task-001',
                description: `Create and execute tests for chat feature`,
                type: 'testing',
                priority: featureRequest.priority,
                context: testingContext
            };
            const testingRoute = moeRouter.routeTask(testingTask);
            expect(testingRoute.agent.id).toBe('tester-agent');
            const testingResult = await parallelExecutor.executeTask(testingTask);
            expect(testingResult.success).toBe(true);
            console.log('Testing phase completed');
            // Step 11: Set up workflow orchestration for integration
            // Define workflow nodes
            orchestrator.addNode({
                id: 'start',
                type: 'process',
                label: 'Start Integration'
            });
            orchestrator.addNode({
                id: 'integrate',
                type: 'agent',
                label: 'System Integrator',
                agentType: 'coder'
            });
            orchestrator.addNode({
                id: 'validate',
                type: 'agent',
                label: 'Validation Specialist',
                agentType: 'tester'
            });
            orchestrator.addNode({
                id: 'deploy',
                type: 'process',
                label: 'Deploy to Staging'
            });
            orchestrator.addNode({
                id: 'end',
                type: 'process',
                label: 'Feature Complete'
            });
            // Define workflow edges
            orchestrator.addEdge({
                id: 'edge-1',
                source: 'start',
                target: 'integrate'
            });
            orchestrator.addEdge({
                id: 'edge-2',
                source: 'integrate',
                target: 'validate'
            });
            orchestrator.addEdge({
                id: 'edge-3',
                source: 'validate',
                target: 'deploy'
            });
            orchestrator.addEdge({
                id: 'edge-4',
                source: 'deploy',
                target: 'end'
            });
            // Execute integration workflow
            const workflowContext = {
                feature: featureRequest.title,
                implementation: codingResult.result,
                tests: testingResult.result,
                reviewStatus: 'approved'
            };
            const workflowResult = await orchestrator.executeWorkflow(workflowContext);
            expect(workflowResult.success).toBe(true);
            console.log('Integration workflow completed');
            // Step 12: Verify ctx-zip compression effectiveness throughout
            const contextSamples = [
                JSON.stringify(featureRequest),
                JSON.stringify(planningResult),
                JSON.stringify(codingResult),
                JSON.stringify(reviewContext),
                JSON.stringify(testingContext)
            ];
            for (const sample of contextSamples) {
                const compressionStats = await testCtxZipCompression(sample);
                expect(compressionStats.reductionPercentage).toBeGreaterThan(70);
            }
            console.log('Context compression validated across all phases');
            // Journey completion verification
            expect(workflowResult.executionPath).toEqual(['start', 'integrate', 'validate', 'deploy', 'end']);
            expect(workflowResult.finalState.context.feature).toBe(featureRequest.title);
            console.log('Feature development journey completed successfully');
        }, 30000); // Extended timeout for complex journey
    });
    describe('Bug Resolution Journey', () => {
        it('should resolve a production bug through swarm intelligence', async () => {
            console.log('Starting bug resolution journey...');
            // Initialize systems
            const moeRouter = new MoERouter();
            const parallelExecutor = new RayParallelExecutor();
            const votingSystem = new ConsensusVotingSystem();
            const contextHandoff = new ContextHandoffManager();
            // Set up agents
            const agents = [
                {
                    id: 'debugger-agent',
                    type: 'debugger',
                    name: 'Bug Hunter',
                    expertise: ['debugging', 'troubleshooting', 'root-cause-analysis'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'coder-agent',
                    type: 'coder',
                    name: 'Fix Specialist',
                    expertise: ['bug-fixing', 'code-correction', 'optimization'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'reviewer-agent',
                    type: 'reviewer',
                    name: 'Quality Guardian',
                    expertise: ['code-review', 'regression-prevention', 'best-practices'],
                    workload: 0,
                    capacity: 4
                },
                {
                    id: 'tester-agent',
                    type: 'tester',
                    name: 'Regression Tester',
                    expertise: ['regression-testing', 'verification', 'validation'],
                    workload: 0,
                    capacity: 4
                }
            ];
            agents.forEach(agent => {
                moeRouter.registerAgent(agent);
                votingSystem.registerAgent(agent);
            });
            // Bug report
            const bugReport = {
                id: 'bug-789',
                title: 'Chat messages not delivered to offline users',
                description: 'When a user is offline, messages sent to them are not delivered upon their return online',
                severity: 'high',
                environment: 'Production',
                reportedBy: 'user-support-123',
                stepsToReproduce: [
                    'User A goes offline',
                    'User B sends 5 messages to User A',
                    'User A comes back online',
                    'User A does not see the 5 messages'
                ],
                expectedBehavior: 'Offline messages should be delivered when user comes online',
                actualBehavior: 'Messages are lost and never delivered'
            };
            console.log('Bug report received:', bugReport.title);
            // Step 1: Route debugging task
            const debugTask = {
                id: 'debug-789',
                description: `Investigate: ${bugReport.title}`,
                type: 'bug_investigation',
                priority: 3, // High priority
                context: {
                    bugReport: bugReport,
                    systemLogs: 'Log data showing message queue processing...',
                    userReports: 'Multiple reports of message loss'
                }
            };
            const debugRoute = moeRouter.routeTask(debugTask);
            expect(debugRoute.agent.type).toBe('debugger');
            console.log(`Debug task routed to: ${debugRoute.agent.name}`);
            // Step 2: Execute debugging
            const debugResult = await parallelExecutor.executeTask(debugTask);
            expect(debugResult.success).toBe(true);
            console.log('Debugging phase completed');
            // Step 3: Handoff findings to fix specialist
            const fixHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'debugger-agent',
                targetAgentId: 'coder-agent',
                taskId: 'fix-789',
                context: {
                    bugAnalysis: debugResult.result,
                    rootCause: 'Message queue not persisting offline messages',
                    bugReport: bugReport
                },
                priority: 'high'
            });
            expect(fixHandoff.success).toBe(true);
            console.log('Debug findings handed off to fix specialist');
            const fixContext = await contextHandoff.completeHandoff(fixHandoff.handoffId, 'coder-agent');
            // Step 4: Execute fix implementation
            const fixTask = {
                id: 'implement-fix-789',
                description: `Implement fix for: ${bugReport.title}`,
                type: 'bug_fix',
                priority: 3,
                context: fixContext
            };
            const fixRoute = moeRouter.routeTask(fixTask);
            expect(fixRoute.agent.id).toBe('coder-agent');
            const fixResult = await parallelExecutor.executeTask(fixTask);
            expect(fixResult.success).toBe(true);
            console.log('Fix implementation completed');
            // Step 5: Handoff to reviewer
            const reviewHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'coder-agent',
                targetAgentId: 'reviewer-agent',
                taskId: 'review-fix-789',
                context: {
                    fixImplementation: fixResult.result,
                    bugReport: bugReport,
                    rootCause: fixContext.rootCause
                },
                priority: 'high'
            });
            expect(reviewHandoff.success).toBe(true);
            console.log('Fix implementation handed off to reviewer');
            const reviewContext = await contextHandoff.completeHandoff(reviewHandoff.handoffId, 'reviewer-agent');
            // Step 6: Conduct fix review voting
            const reviewSessionId = votingSystem.createVotingSession(`Review Fix: ${bugReport.title}`, [
                { id: 'approve', label: 'Approve Fix', value: 'approved' },
                { id: 'revise', label: 'Request Changes', value: 'revisions' },
                { id: 'reject', label: 'Reject Fix', value: 'rejected' }
            ]);
            // Simulate voting
            votingSystem.castVote(reviewSessionId, 'debugger-agent', 'approve', 'Root cause properly addressed');
            votingSystem.castVote(reviewSessionId, 'coder-agent', 'approve', 'Clean and effective fix');
            votingSystem.castVote(reviewSessionId, 'reviewer-agent', 'approve', 'No regression risks identified');
            const reviewResult = votingSystem.closeVotingSession(reviewSessionId);
            expect(reviewResult.consensusReached).toBe(true);
            expect(reviewResult.winningOption?.id).toBe('approve');
            console.log('Fix review completed with approval');
            // Step 7: Handoff to regression tester
            const testHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'reviewer-agent',
                targetAgentId: 'tester-agent',
                taskId: 'test-fix-789',
                context: {
                    fixImplementation: fixResult.result,
                    reviewOutcome: reviewResult,
                    bugReport: bugReport
                },
                priority: 'high'
            });
            expect(testHandoff.success).toBe(true);
            console.log('Fix handed off to regression tester');
            const testContext = await contextHandoff.completeHandoff(testHandoff.handoffId, 'tester-agent');
            // Step 8: Execute regression testing
            const testTask = {
                id: 'regression-test-789',
                description: `Test fix for: ${bugReport.title}`,
                type: 'testing',
                priority: 3,
                context: testContext
            };
            const testRoute = moeRouter.routeTask(testTask);
            expect(testRoute.agent.id).toBe('tester-agent');
            const testResult = await parallelExecutor.executeTask(testTask);
            expect(testResult.success).toBe(true);
            console.log('Regression testing completed');
            // Step 9: Verify bug is resolved
            const verification = {
                bugId: bugReport.id,
                fixApproved: reviewResult.consensusReached && reviewResult.winningOption?.id === 'approve',
                testsPassed: testResult.success,
                regressionRisk: 'low'
            };
            expect(verification.fixApproved).toBe(true);
            expect(verification.testsPassed).toBe(true);
            console.log('Bug resolution verified successfully');
            console.log('Bug resolution journey completed');
        }, 20000); // Extended timeout for complex journey
    });
    describe('Performance Optimization Journey', () => {
        it('should optimize system performance through collaborative analysis', async () => {
            console.log('Starting performance optimization journey...');
            // Initialize systems
            const moeRouter = new MoERouter();
            const parallelExecutor = new RayParallelExecutor();
            const votingSystem = new ConsensusVotingSystem();
            const contextHandoff = new ContextHandoffManager();
            // Set up agents
            const agents = [
                {
                    id: 'analyzer-agent',
                    type: 'optimizer',
                    name: 'Performance Analyst',
                    expertise: ['performance-analysis', 'profiling', 'metrics'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'optimizer-agent',
                    type: 'optimizer',
                    name: 'Optimization Specialist',
                    expertise: ['code-optimization', 'database-tuning', 'caching'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'tester-agent',
                    type: 'tester',
                    name: 'Performance Tester',
                    expertise: ['load-testing', 'benchmarking', 'stress-testing'],
                    workload: 0,
                    capacity: 4
                },
                {
                    id: 'reviewer-agent',
                    type: 'reviewer',
                    name: 'Architecture Reviewer',
                    expertise: ['system-architecture', 'scalability', 'best-practices'],
                    workload: 0,
                    capacity: 3
                }
            ];
            agents.forEach(agent => {
                moeRouter.registerAgent(agent);
                votingSystem.registerAgent(agent);
            });
            // Performance issue report
            const perfIssue = {
                id: 'perf-456',
                system: 'Chat Message Processing',
                metric: 'Message Delivery Latency',
                currentValue: '2.3s',
                target: '< 500ms',
                impact: 'High - Affects user experience for all users',
                trend: 'Degraded over last 2 weeks',
                peakHours: '18:00-22:00 EST'
            };
            console.log('Performance issue identified:', perfIssue.system);
            // Step 1: Route performance analysis task
            const analysisTask = {
                id: 'perf-analysis-456',
                description: `Analyze performance issue in ${perfIssue.system}`,
                type: 'performance_analysis',
                priority: 2,
                context: {
                    perfIssue: perfIssue,
                    systemMetrics: 'Latency metrics showing degradation...',
                    userImpact: perfIssue.impact
                }
            };
            const analysisRoute = moeRouter.routeTask(analysisTask);
            expect(analysisRoute.agent.type).toBe('optimizer');
            console.log(`Performance analysis routed to: ${analysisRoute.agent.name}`);
            // Step 2: Execute performance analysis
            const analysisResult = await parallelExecutor.executeTask(analysisTask);
            expect(analysisResult.success).toBe(true);
            console.log('Performance analysis completed');
            // Step 3: Handoff analysis to optimizer
            const optimizationHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'analyzer-agent',
                targetAgentId: 'optimizer-agent',
                taskId: 'optimize-456',
                context: {
                    analysis: analysisResult.result,
                    perfIssue: perfIssue,
                    bottlenecks: ['Database queries', 'Message serialization', 'Network I/O']
                },
                priority: 'medium'
            });
            expect(optimizationHandoff.success).toBe(true);
            console.log('Analysis handed off to optimization specialist');
            const optimizationContext = await contextHandoff.completeHandoff(optimizationHandoff.handoffId, 'optimizer-agent');
            // Step 4: Execute optimization implementation
            const optimizationTask = {
                id: 'implement-optimization-456',
                description: `Implement performance optimizations for ${perfIssue.system}`,
                type: 'optimization',
                priority: 2,
                context: optimizationContext
            };
            const optimizationRoute = moeRouter.routeTask(optimizationTask);
            expect(optimizationRoute.agent.id).toBe('optimizer-agent');
            const optimizationResult = await parallelExecutor.executeTask(optimizationTask);
            expect(optimizationResult.success).toBe(true);
            console.log('Optimization implementation completed');
            // Step 5: Handoff to performance tester
            const testingHandoff = await contextHandoff.initiateHandoff({
                sourceAgentId: 'optimizer-agent',
                targetAgentId: 'tester-agent',
                taskId: 'perf-test-456',
                context: {
                    optimizations: optimizationResult.result,
                    perfIssue: perfIssue,
                    expectedImprovements: ['Database query time reduced by 60%', 'Serialization improved by 40%']
                },
                priority: 'medium'
            });
            expect(testingHandoff.success).toBe(true);
            console.log('Optimizations handed off to performance tester');
            const testingContext = await contextHandoff.completeHandoff(testingHandoff.handoffId, 'tester-agent');
            // Step 6: Execute performance testing
            const testingTask = {
                id: 'performance-test-456',
                description: `Test performance optimizations`,
                type: 'testing',
                priority: 2,
                context: testingContext
            };
            const testingRoute = moeRouter.routeTask(testingTask);
            expect(testingRoute.agent.id).toBe('tester-agent');
            const testingResult = await parallelExecutor.executeTask(testingTask);
            expect(testingResult.success).toBe(true);
            console.log('Performance testing completed');
            // Step 7: Conduct optimization review voting
            const reviewSessionId = votingSystem.createVotingSession(`Review Performance Optimizations: ${perfIssue.system}`, [
                { id: 'approve', label: 'Approve Optimizations', value: 'approved' },
                { id: 'monitor', label: 'Approve with Monitoring', value: 'monitor' },
                { id: 'revise', label: 'Request Revisions', value: 'revisions' }
            ]);
            // Simulate voting
            votingSystem.castVote(reviewSessionId, 'analyzer-agent', 'approve', 'Significant improvements measured');
            votingSystem.castVote(reviewSessionId, 'optimizer-agent', 'approve', 'Safe and effective optimizations');
            votingSystem.castVote(reviewSessionId, 'tester-agent', 'monitor', 'Approve but monitor under load');
            votingSystem.castVote(reviewSessionId, 'reviewer-agent', 'approve', 'Architecture soundness verified');
            const reviewResult = votingSystem.closeVotingSession(reviewSessionId);
            expect(reviewResult.consensusReached).toBe(true);
            console.log('Optimization review completed');
            // Step 8: Verify performance improvements
            const verification = {
                issueId: perfIssue.id,
                optimizationsApproved: reviewResult.consensusReached,
                testsPassed: testingResult.success,
                performanceImproved: true, // Based on test results
                monitoringRequired: reviewResult.winningOption?.id === 'monitor'
            };
            expect(verification.optimizationsApproved).toBe(true);
            expect(verification.testsPassed).toBe(true);
            expect(verification.monitoringRequired).toBe(true);
            console.log('Performance optimization verified successfully');
            console.log('Performance optimization journey completed');
        }, 25000); // Extended timeout for complex journey
    });
});
//# sourceMappingURL=user-journey.test.js.map