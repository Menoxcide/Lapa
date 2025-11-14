"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const moe_router_ts_1 = require("../../agents/moe-router.ts");
const ray_parallel_ts_1 = require("../../agents/ray-parallel.ts");
const consensus_voting_ts_1 = require("../../swarm/consensus.voting.ts");
const context_handoff_ts_1 = require("../../swarm/context.handoff.ts");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
(0, vitest_1.describe)('Swarm Orchestration Stress Tests', () => {
    (0, vitest_1.describe)('MoE Router Stress Tests', () => {
        (0, vitest_1.it)('should handle extreme agent registration and routing', () => {
            const router = new moe_router_ts_1.MoERouter();
            const agentCount = 10000; // Extreme number of agents
            // Register extreme number of agents
            const registerStart = performance.now();
            for (let i = 0; i < agentCount; i++) {
                const agent = {
                    id: `extreme-agent-${i}`,
                    type: 'coder', // Simplify for stress test
                    name: `Extreme Agent ${i}`,
                    expertise: [`skill-${i % 100}`], // Limit expertise variations
                    workload: i % 50, // Varying workloads
                    capacity: 100
                };
                router.registerAgent(agent);
            }
            const registerTime = performance.now() - registerStart;
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(agentCount);
            // Create extreme number of tasks
            const taskCount = 50000;
            const tasks = [];
            for (let i = 0; i < taskCount; i++) {
                tasks.push({
                    id: `extreme-task-${i}`,
                    description: `Extreme task ${i} requiring skill-${i % 100}`,
                    type: 'code_generation',
                    priority: i % 5 + 1
                });
            }
            // Route all tasks
            const routeStart = performance.now();
            let successCount = 0;
            let errorCount = 0;
            for (const task of tasks) {
                try {
                    const result = router.routeTask(task);
                    if (result.agent)
                        successCount++;
                }
                catch (error) {
                    errorCount++;
                }
            }
            const routeTime = performance.now() - routeStart;
            console.log('Extreme Agent Registration and Routing:');
            console.log(`  Agents Registered: ${agentCount}`);
            console.log(`  Registration Time: ${registerTime.toFixed(2)}ms`);
            console.log(`  Tasks Routed: ${taskCount}`);
            console.log(`  Successful Routes: ${successCount}`);
            console.log(`  Failed Routes: ${errorCount}`);
            console.log(`  Routing Time: ${routeTime.toFixed(2)}ms`);
            console.log(`  Routes per Second: ${(successCount / (routeTime / 1000)).toFixed(2)}`);
            // Assertions for stress test
            (0, vitest_1.expect)(successCount).toBeGreaterThan(taskCount * 0.99); // 99% success rate acceptable
            (0, vitest_1.expect)(registerTime).toBeLessThan(20000); // Registration < 20 seconds
            (0, vitest_1.expect)(routeTime).toBeLessThan(120000); // Routing < 120 seconds
        }, 150000); // 150 second timeout
        (0, vitest_1.it)('should maintain stability under continuous routing pressure', () => {
            // Enable fake timers for this test
            vi.useFakeTimers();
            const router = new moe_router_ts_1.MoERouter();
            // Register moderate number of agents
            for (let i = 0; i < 1000; i++) {
                router.registerAgent({
                    id: `pressure-agent-${i}`,
                    type: i % 4 === 0 ? 'planner' :
                        i % 4 === 1 ? 'coder' :
                            i % 4 === 2 ? 'reviewer' : 'debugger',
                    name: `Pressure Agent ${i}`,
                    expertise: [`domain-${Math.floor(i / 100)}`, `skill-${i % 10}`],
                    workload: i % 20,
                    capacity: 50
                });
            }
            // Continuously route tasks for extended period
            const duration = 30000; // 30 seconds
            const startTime = Date.now();
            let routeCount = 0;
            let successCount = 0;
            let errorCount = 0;
            while (Date.now() - startTime < duration) {
                const task = {
                    id: `pressure-task-${routeCount}`,
                    description: `Pressure test task ${routeCount}`,
                    type: 'code_generation',
                    priority: routeCount % 3 + 1
                };
                try {
                    const result = router.routeTask(task);
                    if (result.agent)
                        successCount++;
                }
                catch (error) {
                    errorCount++;
                }
                routeCount++;
                // Small delay to prevent overwhelming the system
                if (routeCount % 1000 === 0) {
                    // eslint-disable-next-line no-await-in-loop
                    vi.advanceTimersByTime(1);
                }
            }
            console.log('Continuous Routing Pressure Test:');
            console.log(`  Duration: ${duration}ms`);
            console.log(`  Total Route Attempts: ${routeCount}`);
            console.log(`  Successful Routes: ${successCount}`);
            console.log(`  Failed Routes: ${errorCount}`);
            console.log(`  Success Rate: ${(successCount / routeCount * 100).toFixed(2)}%`);
            console.log(`  Routes per Second: ${(successCount / (duration / 1000)).toFixed(2)}`);
            // Restore real timers
            vi.useRealTimers();
            // Assertions for continuous pressure
            (0, vitest_1.expect)(successCount).toBeGreaterThan(routeCount * 0.99); // 99% success rate
            (0, vitest_1.expect)(routeCount).toBeGreaterThan(10000); // Should handle 10k+ routes
        }, 60000); // 60 second timeout
    });
    (0, vitest_1.describe)('Parallel Execution Stress Tests', () => {
        let executor;
        beforeEach(() => {
            executor = new ray_parallel_ts_1.RayParallelExecutor({
                maxConcurrency: 100, // High concurrency for stress test
                timeout: 30000, // Extended timeout
                retries: 3
            });
        });
        (0, vitest_1.it)('should handle massive parallel task execution', async () => {
            const taskCount = 10000; // Massive task load
            const tasks = [];
            // Create varied tasks
            for (let i = 0; i < taskCount; i++) {
                tasks.push({
                    id: `massive-task-${i}`,
                    description: `Massive parallel task ${i} with complex data`,
                    type: i % 4 === 0 ? 'code_generation' :
                        i % 4 === 1 ? 'code_review' :
                            i % 4 === 2 ? 'bug_fix' : 'optimization',
                    priority: i % 5 + 1,
                    context: {
                        data: `Complex context data for task ${i}`.repeat(20),
                        metadata: {
                            id: i,
                            timestamp: Date.now(),
                            sequence: i,
                            priority: i % 5 + 1,
                            tags: [`tag-${i % 100}`, `category-${Math.floor(i / 1000)}`]
                        },
                        nested: {
                            level1: {
                                level2: {
                                    level3: {
                                        value: Math.random() * 1000000,
                                        items: Array.from({ length: 50 }, (_, idx) => ({
                                            id: `nested-item-${idx}`,
                                            data: `Nested data ${idx}`.repeat(5)
                                        }))
                                    }
                                }
                            }
                        }
                    }
                });
            }
            const start = performance.now();
            const results = await executor.executeTasks(tasks);
            const totalTime = performance.now() - start;
            // Analyze results
            const successfulTasks = results.filter(r => r.success).length;
            const failedTasks = results.filter(r => !r.success).length;
            const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
            const avgExecutionTime = totalExecutionTime / results.length;
            console.log('Massive Parallel Task Execution:');
            console.log(`  Tasks Submitted: ${taskCount}`);
            console.log(`  Successful Tasks: ${successfulTasks}`);
            console.log(`  Failed Tasks: ${failedTasks}`);
            console.log(`  Success Rate: ${(successfulTasks / taskCount * 100).toFixed(2)}%`);
            console.log(`  Total Wall Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Average Execution Time: ${avgExecutionTime.toFixed(2)}ms`);
            console.log(`  Effective Concurrency: ${(totalExecutionTime / totalTime).toFixed(2)}x`);
            console.log(`  Tasks per Second: ${(successfulTasks / (totalTime / 1000)).toFixed(2)}`);
            // Assertions for massive parallel execution
            (0, vitest_1.expect)(successfulTasks).toBeGreaterThan(taskCount * 0.99); // 99% success rate
            (0, vitest_1.expect)(totalTime).toBeLessThan(600000); // Total < 10 minutes
            (0, vitest_1.expect)(avgExecutionTime).toBeLessThan(2000); // Avg < 2 seconds per task
        }, 660000); // 11 minute timeout
        (0, vitest_1.it)('should handle task execution with resource exhaustion', async () => {
            // Configure executor with very limited resources
            const limitedExecutor = new ray_parallel_ts_1.RayParallelExecutor({
                maxConcurrency: 2, // Very low concurrency
                timeout: 5000, // Short timeout
                retries: 1
            });
            const taskCount = 1000; // Still large number of tasks
            const tasks = [];
            // Create tasks that take varying amounts of time
            for (let i = 0; i < taskCount; i++) {
                tasks.push({
                    id: `resource-task-${i}`,
                    description: `Resource constrained task ${i}`,
                    type: 'code_generation',
                    priority: i % 3 + 1
                });
            }
            const start = performance.now();
            const results = await limitedExecutor.executeTasks(tasks);
            const totalTime = performance.now() - start;
            // Analyze results
            const successfulTasks = results.filter(r => r.success).length;
            const failedTasks = results.filter(r => !r.success).length;
            console.log('Resource Constrained Task Execution:');
            console.log(`  Tasks Submitted: ${taskCount}`);
            console.log(`  Successful Tasks: ${successfulTasks}`);
            console.log(`  Failed Tasks: ${failedTasks}`);
            console.log(`  Success Rate: ${(successfulTasks / taskCount * 100).toFixed(2)}%`);
            console.log(`  Total Wall Time: ${totalTime.toFixed(2)}ms`);
            // Even under resource constraints, most tasks should succeed
            (0, vitest_1.expect)(successfulTasks).toBeGreaterThan(taskCount * 0.95); // 95% success rate
        }, 660000); // 11 minute timeout
    });
    (0, vitest_1.describe)('Consensus Voting Stress Tests', () => {
        (0, vitest_1.it)('should handle massive concurrent voting sessions', () => {
            const votingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
            const agentCount = 1000;
            // Register many agents
            for (let i = 0; i < agentCount; i++) {
                votingSystem.registerAgent({
                    id: `massive-voter-${i}`,
                    type: 'coder',
                    name: `Massive Voter ${i}`,
                    expertise: [`domain-${Math.floor(i / 100)}`],
                    workload: i % 10,
                    capacity: 20
                });
            }
            const sessionCount = 5000; // Massive number of sessions
            const sessions = [];
            const options = [
                { id: 'a', label: 'Option A', value: 'a' },
                { id: 'b', label: 'Option B', value: 'b' },
                { id: 'c', label: 'Option C', value: 'c' }
            ];
            // Create all sessions
            const createStart = performance.now();
            for (let i = 0; i < sessionCount; i++) {
                const sessionId = votingSystem.createVotingSession(`Massive Session ${i}`, options, Math.floor(agentCount * 0.5) // 50% quorum
                );
                sessions.push(sessionId);
            }
            const createTime = performance.now() - createStart;
            // Cast votes in all sessions
            const voteStart = performance.now();
            let totalVotes = 0;
            for (let sessionIdx = 0; sessionIdx < sessions.length; sessionIdx++) {
                const sessionId = sessions[sessionIdx];
                // Have varying numbers of agents vote
                const voterCount = Math.floor(Math.random() * agentCount * 0.7) + 1;
                for (let voterIdx = 0; voterIdx < voterCount; voterIdx++) {
                    const optionId = options[voterIdx % options.length].id;
                    const success = votingSystem.castVote(sessionId, `massive-voter-${voterIdx}`, optionId);
                    if (success)
                        totalVotes++;
                }
            }
            const voteTime = performance.now() - voteStart;
            // Close all sessions
            const closeStart = performance.now();
            const results = sessions.map(sessionId => votingSystem.closeVotingSession(sessionId));
            const closeTime = performance.now() - closeStart;
            const totalTime = createTime + voteTime + closeTime;
            // Analyze results
            const successfulResults = results.filter(r => r.sessionId).length;
            console.log('Massive Concurrent Voting Sessions:');
            console.log(`  Agents Registered: ${agentCount}`);
            console.log(`  Voting Sessions: ${sessionCount}`);
            console.log(`  Total Votes Cast: ${totalVotes}`);
            console.log(`  Session Creation Time: ${createTime.toFixed(2)}ms`);
            console.log(`  Voting Time: ${voteTime.toFixed(2)}ms`);
            console.log(`  Session Close Time: ${closeTime.toFixed(2)}ms`);
            console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Successful Results: ${successfulResults}`);
            console.log(`  Sessions per Second: ${(sessionCount / (totalTime / 1000)).toFixed(2)}`);
            // Assertions for massive voting
            (0, vitest_1.expect)(successfulResults).toBe(sessionCount); // All sessions should produce results
            (0, vitest_1.expect)(totalTime).toBeLessThan(600000); // Total < 10 minutes
            (0, vitest_1.expect)(createTime).toBeLessThan(60000); // Creation < 60 seconds
        }, 660000); // 11 minute timeout
        (0, vitest_1.it)('should maintain data integrity with extreme voting activity', () => {
            const votingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
            const agentCount = 500;
            // Register agents
            for (let i = 0; i < agentCount; i++) {
                votingSystem.registerAgent({
                    id: `integrity-agent-${i}`,
                    type: 'reviewer',
                    name: `Integrity Agent ${i}`,
                    expertise: [`area-${i % 50}`],
                    workload: 0,
                    capacity: 100
                });
            }
            // Conduct extreme voting activity
            const rounds = 1000;
            const sessionsPerRound = 100;
            let totalSessions = 0;
            let totalVotes = 0;
            let integrityErrors = 0;
            for (let round = 0; round < rounds; round++) {
                const options = [
                    { id: 'opt1', label: 'Option 1', value: '1' },
                    { id: 'opt2', label: 'Option 2', value: '2' },
                    { id: 'opt3', label: 'Option 3', value: '3' }
                ];
                // Create sessions
                const sessionIds = [];
                for (let i = 0; i < sessionsPerRound; i++) {
                    try {
                        const sessionId = votingSystem.createVotingSession(`Integrity Test ${totalSessions + i}`, options);
                        sessionIds.push(sessionId);
                    }
                    catch (error) {
                        integrityErrors++;
                    }
                }
                totalSessions += sessionIds.length;
                // Cast votes
                for (const sessionId of sessionIds) {
                    // Random number of voters per session
                    const voterCount = Math.floor(Math.random() * agentCount * 0.3) + 1;
                    for (let voterIdx = 0; voterIdx < voterCount; voterIdx++) {
                        try {
                            const optionId = options[voterIdx % options.length].id;
                            const success = votingSystem.castVote(sessionId, `integrity-agent-${voterIdx}`, optionId);
                            if (success)
                                totalVotes++;
                        }
                        catch (error) {
                            integrityErrors++;
                        }
                    }
                    // Close session
                    try {
                        const result = votingSystem.closeVotingSession(sessionId);
                        if (!result.sessionId)
                            integrityErrors++;
                    }
                    catch (error) {
                        integrityErrors++;
                    }
                }
                // Periodic cleanup
                if (round % 100 === 0) {
                    // Verify system state
                    const allSessions = votingSystem.getAllVotingSessions();
                    if (allSessions.length > 10000) {
                        // Prevent unbounded growth
                        integrityErrors++;
                    }
                }
            }
            console.log('Extreme Voting Activity Integrity:');
            console.log(`  Rounds: ${rounds}`);
            console.log(`  Sessions Created: ${totalSessions}`);
            console.log(`  Total Votes Cast: ${totalVotes}`);
            console.log(`  Integrity Errors: ${integrityErrors}`);
            console.log(`  Error Rate: ${(integrityErrors / (totalSessions + totalVotes) * 100).toFixed(4)}%`);
            // Assertions for data integrity
            (0, vitest_1.expect)(integrityErrors).toBe(0); // No integrity errors should occur
            (0, vitest_1.expect)(totalSessions).toBe(rounds * sessionsPerRound); // All sessions created
            (0, vitest_1.expect)(totalVotes).toBeGreaterThan(100000); // Significant voting activity
        }, 660000); // 11 minute timeout
    });
    (0, vitest_1.describe)('Context Handoff Stress Tests', () => {
        (0, vitest_1.it)('should handle extreme volume of context handoffs', async () => {
            const handoffManager = new context_handoff_ts_1.ContextHandoffManager();
            const handoffCount = 10000; // Extreme volume
            // Create varied handoff requests
            const handoffRequests = [];
            for (let i = 0; i < handoffCount; i++) {
                handoffRequests.push({
                    sourceAgentId: `source-${i}`,
                    targetAgentId: `target-${Math.floor(Math.random() * 100)}`,
                    taskId: `task-${i}`,
                    context: {
                        data: `Extensive context data for handoff ${i}`.repeat(50),
                        metadata: {
                            id: i,
                            timestamp: Date.now(),
                            priority: i % 3,
                            tags: Array.from({ length: 20 }, (_, idx) => `tag-${idx}-${i}`)
                        },
                        complexStructure: {
                            arrays: Array.from({ length: 100 }, (_, idx) => ({
                                id: `item-${idx}`,
                                value: Math.random() * 1000000,
                                nested: {
                                    deep: Array.from({ length: 50 }, (_, deepIdx) => ({
                                        deepId: `deep-${deepIdx}`,
                                        data: `Deep nested data ${deepIdx}`.repeat(3)
                                    }))
                                }
                            })),
                            objects: Array.from({ length: 50 }, (_, idx) => ({
                                key: `object-key-${idx}`,
                                value: `Object value ${idx}`.repeat(10),
                                children: Array.from({ length: 30 }, (_, childIdx) => ({
                                    childKey: `child-${childIdx}`,
                                    childValue: `Child value ${childIdx}`
                                }))
                            }))
                        }
                    },
                    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
                });
            }
            // Process handoffs
            const start = performance.now();
            // Initiate all handoffs
            const initiationResults = [];
            for (const request of handoffRequests) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const result = await handoffManager.initiateHandoff(request);
                    initiationResults.push({ request, result });
                }
                catch (error) {
                    initiationResults.push({ request, result: { success: false, error } });
                }
            }
            const initiationTime = performance.now() - start;
            // Complete successful handoffs
            const completionStart = performance.now();
            const completionResults = [];
            for (const { request, result } of initiationResults) {
                if (result.success) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        const context = await handoffManager.completeHandoff(result.handoffId, request.targetAgentId);
                        completionResults.push({ success: true, context });
                    }
                    catch (error) {
                        completionResults.push({ success: false, error });
                    }
                }
            }
            const completionTime = performance.now() - completionStart;
            const totalTime = initiationTime + completionTime;
            // Analyze results
            const successfulInitiations = initiationResults.filter(({ result }) => result.success).length;
            const successfulCompletions = completionResults.filter(({ success }) => success).length;
            const failedInitiations = initiationResults.filter(({ result }) => !result.success).length;
            const failedCompletions = completionResults.filter(({ success }) => !success).length;
            console.log('Extreme Volume Context Handoffs:');
            console.log(`  Handoff Requests: ${handoffCount}`);
            console.log(`  Successful Initiations: ${successfulInitiations}`);
            console.log(`  Failed Initiations: ${failedInitiations}`);
            console.log(`  Successful Completions: ${successfulCompletions}`);
            console.log(`  Failed Completions: ${failedCompletions}`);
            console.log(`  Initiation Time: ${initiationTime.toFixed(2)}ms`);
            console.log(`  Completion Time: ${completionTime.toFixed(2)}ms`);
            console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Handoffs per Second: ${(successfulCompletions / (totalTime / 1000)).toFixed(2)}`);
            // Assertions for extreme volume
            (0, vitest_1.expect)(successfulInitiations).toBeGreaterThan(handoffCount * 0.99); // 99% success
            (0, vitest_1.expect)(successfulCompletions).toBe(successfulInitiations); // All completions should succeed
            (0, vitest_1.expect)(totalTime).toBeLessThan(600000); // Total < 10 minutes
        }, 660000); // 11 minute timeout
        (0, vitest_1.it)('should maintain consistency with concurrent handoffs', async () => {
            const handoffManager = new context_handoff_ts_1.ContextHandoffManager();
            // Simulate concurrent handoffs
            const concurrentOperations = 1000;
            const promises = [];
            for (let i = 0; i < concurrentOperations; i++) {
                const operation = async () => {
                    const requestId = `concurrent-${i}-${Date.now()}`;
                    const handoffRequest = {
                        sourceAgentId: `concurrent-source-${i}`,
                        targetAgentId: `concurrent-target-${i % 50}`,
                        taskId: `concurrent-task-${i}`,
                        context: {
                            id: requestId,
                            data: `Concurrent handoff data ${i}`.repeat(100),
                            timestamp: Date.now(),
                            sequence: i
                        },
                        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
                    };
                    // Initiate handoff
                    const initiationResult = await handoffManager.initiateHandoff(handoffRequest);
                    if (initiationResult.success) {
                        // Complete handoff
                        const completionResult = await handoffManager.completeHandoff(initiationResult.handoffId, handoffRequest.targetAgentId);
                        return {
                            initiation: initiationResult,
                            completion: completionResult,
                            success: true
                        };
                    }
                    return {
                        initiation: initiationResult,
                        completion: null,
                        success: false
                    };
                };
                promises.push(operation());
            }
            const start = performance.now();
            const results = await Promise.all(promises);
            const totalTime = performance.now() - start;
            // Analyze results
            const successfulOperations = results.filter(r => r.success).length;
            const failedOperations = results.filter(r => !r.success).length;
            console.log('Concurrent Handoff Consistency:');
            console.log(`  Concurrent Operations: ${concurrentOperations}`);
            console.log(`  Successful Operations: ${successfulOperations}`);
            console.log(`  Failed Operations: ${failedOperations}`);
            console.log(`  Success Rate: ${(successfulOperations / concurrentOperations * 100).toFixed(2)}%`);
            console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Operations per Second: ${(concurrentOperations / (totalTime / 1000)).toFixed(2)}`);
            // Verify data consistency
            const successfulResults = results.filter(r => r.success);
            for (const result of successfulResults) {
                (0, vitest_1.expect)(result.completion.id).toBe(result.initiation.handoffId.split('_')[1]);
                (0, vitest_1.expect)(result.completion.data).toContain('Concurrent handoff data');
            }
            // Assertions for concurrent consistency
            (0, vitest_1.expect)(successfulOperations).toBeGreaterThan(concurrentOperations * 0.99); // 99% success
            (0, vitest_1.expect)(totalTime).toBeLessThan(600000); // < 10 minutes
        }, 660000); // 11 minute timeout
    });
    (0, vitest_1.describe)('LangGraph Orchestration Stress Tests', () => {
        (0, vitest_1.it)('should handle extremely complex workflow graphs', async () => {
            const orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
            // Create an extremely complex graph
            const nodeCount = 1000;
            const nodes = [];
            // Create diverse node types
            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    id: `complex-node-${i}`,
                    type: i % 3 === 0 ? 'agent' : i % 3 === 1 ? 'process' : 'decision',
                    label: `Complex Node ${i}`,
                    agentType: i % 3 === 0 ? (i % 6 === 0 ? 'planner' : i % 6 === 3 ? 'coder' : 'reviewer') : undefined
                });
            }
            // Add all nodes
            const nodeAddStart = performance.now();
            nodes.forEach(node => orchestrator.addNode(node));
            const nodeAddTime = performance.now() - nodeAddStart;
            // Create complex edge structure
            const edges = [];
            // Connect nodes in various patterns
            for (let i = 0; i < nodeCount - 1; i++) {
                edges.push({
                    id: `main-edge-${i}`,
                    source: `complex-node-${i}`,
                    target: `complex-node-${i + 1}`
                });
            }
            // Add cross-connections
            for (let i = 0; i < nodeCount - 100; i += 20) {
                for (let j = 1; j <= 5; j++) {
                    if (i + j * 20 < nodeCount) {
                        edges.push({
                            id: `cross-edge-${i}-${j}`,
                            source: `complex-node-${i}`,
                            target: `complex-node-${i + j * 20}`
                        });
                    }
                }
            }
            // Add backward connections (cycles)
            for (let i = 100; i < nodeCount - 50; i += 75) {
                edges.push({
                    id: `backward-edge-${i}`,
                    source: `complex-node-${i}`,
                    target: `complex-node-${Math.max(0, i - 25)}`
                });
            }
            // Add all edges
            const edgeAddStart = performance.now();
            edges.forEach(edge => orchestrator.addEdge(edge));
            const edgeAddTime = performance.now() - edgeAddStart;
            // Execute workflow
            const context = {
                complexWorkflowId: 'extreme-complexity-test',
                data: 'Initial data for extremely complex workflow',
                metadata: {
                    nodeCount,
                    edgeCount: edges.length,
                    timestamp: Date.now(),
                    version: '1.0.0'
                },
                complexStructure: Array.from({ length: 1000 }, (_, i) => ({
                    id: `complex-item-${i}`,
                    value: Math.random() * 1000000,
                    nested: {
                        deep: Array.from({ length: 100 }, (_, j) => ({
                            deepId: `deep-${i}-${j}`,
                            data: `Deep data ${i}-${j}`.repeat(5)
                        }))
                    }
                }))
            };
            const workflowStart = performance.now();
            const result = await orchestrator.executeWorkflow(context);
            const workflowTime = performance.now() - workflowStart;
            const totalTime = nodeAddTime + edgeAddTime + workflowTime;
            console.log('Extremely Complex Workflow Graph:');
            console.log(`  Nodes in Graph: ${nodeCount}`);
            console.log(`  Edges in Graph: ${edges.length}`);
            console.log(`  Node Addition Time: ${nodeAddTime.toFixed(2)}ms`);
            console.log(`  Edge Addition Time: ${edgeAddTime.toFixed(2)}ms`);
            console.log(`  Workflow Execution Time: ${workflowTime.toFixed(2)}ms`);
            console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Execution Path Length: ${result.executionPath?.length || 0}`);
            console.log(`  Workflow Success: ${result.success}`);
            // Assertions for complex workflow
            (0, vitest_1.expect)(orchestrator.getNodes()).toHaveLength(nodeCount);
            (0, vitest_1.expect)(orchestrator.getEdges()).toHaveLength(edges.length);
            (0, vitest_1.expect)(totalTime).toBeLessThan(600000); // < 10 minutes
        }, 660000); // 11 minute timeout
        (0, vitest_1.it)('should maintain stability during prolonged workflow execution', async () => {
            // This test runs workflows continuously for an extended period
            const duration = 60000; // 1 minute
            const startTime = Date.now();
            let workflowCount = 0;
            let successCount = 0;
            let errorCount = 0;
            while (Date.now() - startTime < duration) {
                try {
                    const orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
                    // Create a moderately complex workflow
                    const nodes = [
                        { id: 'start', type: 'process', label: 'Start' },
                        { id: 'analyze', type: 'agent', label: 'Analyzer', agentType: 'planner' },
                        { id: 'process', type: 'agent', label: 'Processor', agentType: 'coder' },
                        { id: 'validate', type: 'agent', label: 'Validator', agentType: 'reviewer' },
                        { id: 'end', type: 'process', label: 'End' }
                    ];
                    const edges = [
                        { id: 'e1', source: 'start', target: 'analyze' },
                        { id: 'e2', source: 'analyze', target: 'process' },
                        { id: 'e3', source: 'process', target: 'validate' },
                        { id: 'e4', source: 'validate', target: 'end' }
                    ];
                    nodes.forEach(node => orchestrator.addNode(node));
                    edges.forEach(edge => orchestrator.addEdge(edge));
                    const context = {
                        workflowId: `prolonged-${workflowCount}`,
                        timestamp: Date.now(),
                        data: `Prolonged workflow data ${workflowCount}`.repeat(10)
                    };
                    // eslint-disable-next-line no-await-in-loop
                    const result = await orchestrator.executeWorkflow(context);
                    if (result.success) {
                        successCount++;
                    }
                    else {
                        errorCount++;
                    }
                }
                catch (error) {
                    errorCount++;
                }
                workflowCount++;
                // Small delay to prevent overwhelming system
                if (workflowCount % 50 === 0) {
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            console.log('Prolonged Workflow Execution Stability:');
            console.log(`  Duration: ${duration}ms`);
            console.log(`  Workflows Executed: ${workflowCount}`);
            console.log(`  Successful Workflows: ${successCount}`);
            console.log(`  Failed Workflows: ${errorCount}`);
            console.log(`  Success Rate: ${(successCount / workflowCount * 100).toFixed(2)}%`);
            console.log(`  Workflows per Second: ${(workflowCount / (duration / 1000)).toFixed(2)}`);
            // Assertions for prolonged execution
            (0, vitest_1.expect)(successCount).toBeGreaterThan(workflowCount * 0.99); // 99% success rate
            (0, vitest_1.expect)(workflowCount).toBeGreaterThan(100); // Should execute many workflows
        }, 120000); // 2 minute timeout
    });
    (0, vitest_1.describe)('Integrated Swarm Stress Tests', () => {
        (0, vitest_1.it)('should handle extreme integrated swarm workload', async () => {
            // This test combines all components under extreme load
            const router = new moe_router_ts_1.MoERouter();
            const executor = new ray_parallel_ts_1.RayParallelExecutor({ maxConcurrency: 200 });
            const votingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
            const handoffManager = new context_handoff_ts_1.ContextHandoffManager();
            // Set up large number of agents
            const agentCount = 1000;
            for (let i = 0; i < agentCount; i++) {
                const agent = {
                    id: `swarm-agent-${i}`,
                    type: i % 5 === 0 ? 'planner' :
                        i % 5 === 1 ? 'coder' :
                            i % 5 === 2 ? 'reviewer' :
                                i % 5 === 3 ? 'debugger' : 'optimizer',
                    name: `Swarm Agent ${i}`,
                    expertise: [`skill-${i % 100}`, `domain-${Math.floor(i / 100)}`],
                    workload: i % 50,
                    capacity: 100
                };
                router.registerAgent(agent);
                votingSystem.registerAgent(agent);
            }
            // Process extreme workload
            const workloadSize = 5000;
            const start = performance.now();
            let completedWorkflows = 0;
            let failedWorkflows = 0;
            for (let i = 0; i < workloadSize; i++) {
                try {
                    // 1. Route task
                    const task = {
                        id: `swarm-task-${i}`,
                        description: `Integrated swarm task ${i} requiring skill-${i % 100}`,
                        type: i % 4 === 0 ? 'planning' :
                            i % 4 === 1 ? 'code_generation' :
                                i % 4 === 2 ? 'code_review' : 'bug_fix',
                        priority: i % 5 + 1,
                        context: {
                            workflowId: `swarm-${i}`,
                            timestamp: Date.now(),
                            data: `Swarm workflow data ${i}`.repeat(20)
                        }
                    };
                    const routingResult = router.routeTask(task);
                    // 2. Execute task
                    // eslint-disable-next-line no-await-in-loop
                    const executionResult = await executor.executeTask(task);
                    // 3. Handoff context if successful
                    if (executionResult.success) {
                        const handoffRequest = {
                            sourceAgentId: routingResult.agent.id,
                            targetAgentId: `swarm-agent-${(i + 1) % agentCount}`,
                            taskId: task.id,
                            context: {
                                result: executionResult.result,
                                task: task.description,
                                agent: routingResult.agent.name
                            },
                            priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
                        };
                        // eslint-disable-next-line no-await-in-loop
                        const handoffResult = await handoffManager.initiateHandoff(handoffRequest);
                        if (handoffResult.success) {
                            // eslint-disable-next-line no-await-in-loop
                            await handoffManager.completeHandoff(handoffResult.handoffId, handoffRequest.targetAgentId);
                        }
                    }
                    // 4. Voting session
                    const options = [
                        { id: 'approve', label: 'Approve', value: 'approved' },
                        { id: 'revise', label: 'Revise', value: 'revisions' },
                        { id: 'reject', label: 'Reject', value: 'rejected' }
                    ];
                    const sessionId = votingSystem.createVotingSession(`Swarm Review ${i}`, options);
                    // Have multiple agents vote
                    const voterCount = Math.floor(agentCount * 0.1); // 10% of agents vote
                    for (let voterIdx = 0; voterIdx < voterCount; voterIdx++) {
                        const optionId = options[voterIdx % options.length].id;
                        votingSystem.castVote(sessionId, `swarm-agent-${voterIdx}`, optionId);
                    }
                    votingSystem.closeVotingSession(sessionId);
                    completedWorkflows++;
                }
                catch (error) {
                    failedWorkflows++;
                }
                // Periodic progress logging
                if (i > 0 && i % 500 === 0) {
                    const elapsed = performance.now() - start;
                    console.log(`Progress: ${i}/${workloadSize} workflows processed in ${elapsed.toFixed(2)}ms`);
                }
            }
            const totalTime = performance.now() - start;
            console.log('Extreme Integrated Swarm Workload:');
            console.log(`  Agents Registered: ${agentCount}`);
            console.log(`  Workflows Processed: ${workloadSize}`);
            console.log(`  Completed Workflows: ${completedWorkflows}`);
            console.log(`  Failed Workflows: ${failedWorkflows}`);
            console.log(`  Success Rate: ${(completedWorkflows / workloadSize * 100).toFixed(2)}%`);
            console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`  Workflows per Second: ${(completedWorkflows / (totalTime / 1000)).toFixed(2)}`);
            // Assertions for integrated stress test
            (0, vitest_1.expect)(completedWorkflows).toBeGreaterThan(workloadSize * 0.99); // 99% success rate
            (0, vitest_1.expect)(totalTime).toBeLessThan(3600000); // Total < 60 minutes
            (0, vitest_1.expect)(router.getAgents()).toHaveLength(agentCount); // All agents still registered
        }, 3660000); // 61 minute timeout
    });
});
//# sourceMappingURL=swarm-orchestration.stress.spec.js.map