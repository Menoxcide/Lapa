"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const moe_router_ts_1 = require("../../agents/moe-router.ts");
const ray_parallel_ts_1 = require("../../agents/ray-parallel.ts");
const consensus_voting_ts_1 = require("../../swarm/consensus.voting.ts");
const context_handoff_ts_1 = require("../../swarm/context.handoff.ts");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
(0, vitest_1.describe)('Swarm Workflow Integration', () => {
    let moeRouter;
    let parallelExecutor;
    let votingSystem;
    let contextHandoff;
    let orchestrator;
    beforeEach(() => {
        moeRouter = new moe_router_ts_1.MoERouter();
        parallelExecutor = new ray_parallel_ts_1.RayParallelExecutor();
        votingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
        contextHandoff = new context_handoff_ts_1.ContextHandoffManager();
        orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start');
    });
    (0, vitest_1.describe)('Agent Routing and Parallel Execution', () => {
        (0, vitest_1.it)('should route task and execute in parallel', async () => {
            // Setup agents
            const agents = [
                {
                    id: 'coder-agent',
                    type: 'coder',
                    name: 'JavaScript Developer',
                    expertise: ['javascript', 'react', 'nodejs'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'reviewer-agent',
                    type: 'reviewer',
                    name: 'Code Quality Expert',
                    expertise: ['code-review', 'best-practices', 'security'],
                    workload: 0,
                    capacity: 3
                }
            ];
            agents.forEach(agent => moeRouter.registerAgent(agent));
            // Create task
            const task = {
                id: 'feature-task-1',
                description: 'Implement user authentication with JWT tokens in React application',
                type: 'code_generation',
                priority: 2,
                context: {
                    project: 'web-app',
                    requirements: 'Secure authentication using JWT'
                }
            };
            // Route task
            const routingResult = moeRouter.routeTask(task);
            (0, vitest_1.expect)(routingResult.agent.id).toBe('coder-agent');
            (0, vitest_1.expect)(routingResult.confidence).toBeGreaterThan(0.46);
            // Execute task in parallel
            const taskResult = await parallelExecutor.executeTask(task);
            (0, vitest_1.expect)(taskResult.success).toBe(true);
            (0, vitest_1.expect)(taskResult.taskId).toBe(task.id);
            (0, vitest_1.expect)(taskResult.result).toContain('Generated code for');
        });
        (0, vitest_1.it)('should handle multiple tasks with routing and parallel execution', async () => {
            // Setup agents
            const agents = [
                {
                    id: 'agent-1',
                    type: 'coder',
                    name: 'Frontend Developer',
                    expertise: ['html', 'css', 'javascript'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'agent-2',
                    type: 'coder',
                    name: 'Backend Developer',
                    expertise: ['nodejs', 'express', 'mongodb'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'agent-3',
                    type: 'reviewer',
                    name: 'QA Engineer',
                    expertise: ['testing', 'qa', 'automation'],
                    workload: 0,
                    capacity: 5
                }
            ];
            agents.forEach(agent => moeRouter.registerAgent(agent));
            // Create multiple tasks
            const tasks = [
                {
                    id: 'task-1',
                    description: 'Create responsive navbar component',
                    type: 'code_generation',
                    priority: 1
                },
                {
                    id: 'task-2',
                    description: 'Implement REST API for user management',
                    type: 'code_generation',
                    priority: 2
                },
                {
                    id: 'task-3',
                    description: 'Write unit tests for authentication module',
                    type: 'testing',
                    priority: 3
                }
            ];
            // Route and execute all tasks
            const routingResults = tasks.map(task => moeRouter.routeTask(task));
            const executionResults = await parallelExecutor.executeTasks(tasks);
            // Verify routing results
            (0, vitest_1.expect)(routingResults).toHaveLength(3);
            routingResults.forEach(result => {
                (0, vitest_1.expect)(result.agent).toBeDefined();
                (0, vitest_1.expect)(result.confidence).toBeGreaterThanOrEqual(0);
            });
            // Verify execution results
            (0, vitest_1.expect)(executionResults).toHaveLength(3);
            executionResults.forEach(result => {
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.taskId).toBeDefined();
            });
        });
    });
    (0, vitest_1.describe)('Consensus Voting Workflow', () => {
        (0, vitest_1.it)('should conduct voting and reach consensus', () => {
            // Register agents for voting
            const agents = [
                {
                    id: 'voter-1',
                    type: 'coder',
                    name: 'Developer 1',
                    expertise: ['frontend'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'voter-2',
                    type: 'coder',
                    name: 'Developer 2',
                    expertise: ['backend'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'voter-3',
                    type: 'reviewer',
                    name: 'Tech Lead',
                    expertise: ['architecture', 'security'],
                    workload: 0,
                    capacity: 5
                }
            ];
            agents.forEach(agent => votingSystem.registerAgent(agent));
            // Create voting session
            const options = [
                { id: 'tech-a', label: 'Technology A', value: 'tech-a' },
                { id: 'tech-b', label: 'Technology B', value: 'tech-b' },
                { id: 'tech-c', label: 'Technology C', value: 'tech-c' }
            ];
            const sessionId = votingSystem.createVotingSession('Select primary frontend framework', options, 3 // Quorum of 3
            );
            (0, vitest_1.expect)(sessionId).toBeDefined();
            // Cast votes
            const voteResults = [
                votingSystem.castVote(sessionId, 'voter-1', 'tech-a', 'Best ecosystem'),
                votingSystem.castVote(sessionId, 'voter-2', 'tech-a', 'Team experience'),
                votingSystem.castVote(sessionId, 'voter-3', 'tech-b', 'Better performance')
            ];
            voteResults.forEach(result => (0, vitest_1.expect)(result).toBe(true));
            // Close voting and check results
            const result = votingSystem.closeVotingSession(sessionId, 'simple-majority');
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            (0, vitest_1.expect)(result.winningOption).toBeDefined();
            (0, vitest_1.expect)(result.consensusReached).toBe(true);
            (0, vitest_1.expect)(result.voteDistribution).toBeDefined();
        });
        (0, vitest_1.it)('should handle voting without reaching consensus', () => {
            // Register agents
            const agents = [
                {
                    id: 'decision-maker-1',
                    type: 'coder',
                    name: 'Architect',
                    expertise: ['system-design'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'decision-maker-2',
                    type: 'reviewer',
                    name: 'Security Expert',
                    expertise: ['security'],
                    workload: 0,
                    capacity: 3
                }
            ];
            agents.forEach(agent => votingSystem.registerAgent(agent));
            // Create voting session with high threshold
            const options = [
                { id: 'option-1', label: 'Approach 1', value: 'approach-1' },
                { id: 'option-2', label: 'Approach 2', value: 'approach-2' }
            ];
            const sessionId = votingSystem.createVotingSession('Security protocol selection', options);
            // Cast split votes
            votingSystem.castVote(sessionId, 'decision-maker-1', 'option-1');
            votingSystem.castVote(sessionId, 'decision-maker-2', 'option-2');
            // Close with supermajority requirement
            const result = votingSystem.closeVotingSession(sessionId, 'supermajority', 0.8);
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            // With split votes, consensus should not be reached
            (0, vitest_1.expect)(result.consensusReached).toBe(false);
        });
    });
    (0, vitest_1.describe)('Context Handoff Between Agents', () => {
        (0, vitest_1.it)('should successfully handoff context between agents', async () => {
            // Initiate handoff
            const handoffRequest = {
                sourceAgentId: 'agent-alpha',
                targetAgentId: 'agent-beta',
                taskId: 'task-xyz',
                context: {
                    userData: { id: 'user-123', name: 'John Doe' },
                    projectState: { version: '1.2.0', features: ['auth', 'dashboard'] },
                    previousResults: 'Authentication module implemented successfully'
                },
                priority: 'high'
            };
            const initiationResponse = await contextHandoff.initiateHandoff(handoffRequest);
            (0, vitest_1.expect)(initiationResponse.success).toBe(true);
            (0, vitest_1.expect)(initiationResponse.handoffId).toBeDefined();
            (0, vitest_1.expect)(initiationResponse.compressedSize).toBeGreaterThan(0);
            // Check handoff status
            const status = contextHandoff.getHandoffStatus(initiationResponse.handoffId);
            (0, vitest_1.expect)(status).toBeDefined();
            (0, vitest_1.expect)(status?.status).toBe('transferring');
            (0, vitest_1.expect)(status?.progress).toBe(50);
            // Complete handoff
            const receivedContext = await contextHandoff.completeHandoff(initiationResponse.handoffId, 'agent-beta');
            (0, vitest_1.expect)(receivedContext).toBeDefined();
            (0, vitest_1.expect)(receivedContext.userData).toEqual(handoffRequest.context.userData);
            (0, vitest_1.expect)(receivedContext.projectState).toEqual(handoffRequest.context.projectState);
            (0, vitest_1.expect)(receivedContext.previousResults).toBe(handoffRequest.context.previousResults);
            // Verify handoff is marked as completed
            const completedStatus = contextHandoff.getHandoffStatus(initiationResponse.handoffId);
            (0, vitest_1.expect)(completedStatus?.status).toBe('completed');
            (0, vitest_1.expect)(completedStatus?.progress).toBe(100);
        });
        (0, vitest_1.it)('should handle handoff cancellation', async () => {
            // Initiate handoff
            const handoffRequest = {
                sourceAgentId: 'sender-agent',
                targetAgentId: 'receiver-agent',
                taskId: 'cancellation-test',
                context: { data: 'test data' },
                priority: 'medium'
            };
            const initiationResponse = await contextHandoff.initiateHandoff(handoffRequest);
            // Cancel handoff
            const cancellationResult = contextHandoff.cancelHandoff(initiationResponse.handoffId);
            (0, vitest_1.expect)(cancellationResult).toBe(true);
            // Verify handoff is removed
            const status = contextHandoff.getHandoffStatus(initiationResponse.handoffId);
            (0, vitest_1.expect)(status).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('LangGraph Orchestration Workflow', () => {
        (0, vitest_1.it)('should execute a complete workflow through the orchestrator', async () => {
            // Setup workflow graph
            const nodes = [
                {
                    id: 'start',
                    type: 'process',
                    label: 'Workflow Start'
                },
                {
                    id: 'analyze',
                    type: 'agent',
                    label: 'Problem Analyzer',
                    agentType: 'planner'
                },
                {
                    id: 'implement',
                    type: 'agent',
                    label: 'Solution Implementer',
                    agentType: 'coder'
                },
                {
                    id: 'review',
                    type: 'agent',
                    label: 'Code Reviewer',
                    agentType: 'reviewer'
                },
                {
                    id: 'end',
                    type: 'process',
                    label: 'Workflow End'
                }
            ];
            const edges = [
                {
                    id: 'e1',
                    source: 'start',
                    target: 'analyze'
                },
                {
                    id: 'e2',
                    source: 'analyze',
                    target: 'implement'
                },
                {
                    id: 'e3',
                    source: 'implement',
                    target: 'review'
                },
                {
                    id: 'e4',
                    source: 'review',
                    target: 'end'
                }
            ];
            // Add nodes and edges to orchestrator
            nodes.forEach(node => orchestrator.addNode(node));
            edges.forEach(edge => orchestrator.addEdge(edge));
            // Execute workflow
            const initialContext = {
                problemStatement: 'User authentication not working',
                projectId: 'project-abc',
                priority: 'high'
            };
            const result = await orchestrator.executeWorkflow(initialContext);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.executionPath).toEqual(['start', 'analyze', 'implement', 'review', 'end']);
            (0, vitest_1.expect)(result.output).toBeDefined();
            (0, vitest_1.expect)(result.finalState).toBeDefined();
        });
        (0, vitest_1.it)('should handle workflow with decision points', async () => {
            // Setup workflow with decision
            const nodes = [
                {
                    id: 'init',
                    type: 'process',
                    label: 'Initialize'
                },
                {
                    id: 'check-complexity',
                    type: 'decision',
                    label: 'Complexity Check'
                },
                {
                    id: 'simple-solution',
                    type: 'agent',
                    label: 'Quick Fix Agent',
                    agentType: 'debugger'
                },
                {
                    id: 'complex-solution',
                    type: 'agent',
                    label: 'Deep Analysis Agent',
                    agentType: 'planner'
                },
                {
                    id: 'finalize',
                    type: 'process',
                    label: 'Finalize Solution'
                }
            ];
            const edges = [
                {
                    id: 'edge-1',
                    source: 'init',
                    target: 'check-complexity'
                },
                {
                    id: 'edge-2',
                    source: 'check-complexity',
                    target: 'simple-solution'
                },
                {
                    id: 'edge-3',
                    source: 'check-complexity',
                    target: 'complex-solution'
                },
                {
                    id: 'edge-4',
                    source: 'simple-solution',
                    target: 'finalize'
                },
                {
                    id: 'edge-5',
                    source: 'complex-solution',
                    target: 'finalize'
                }
            ];
            // Add nodes and edges to orchestrator
            nodes.forEach(node => orchestrator.addNode(node));
            edges.forEach(edge => orchestrator.addEdge(edge));
            // Execute workflow
            const context = {
                issue: 'Application crashes on startup',
                complexity: 'low'
            };
            const result = await orchestrator.executeWorkflow(context);
            (0, vitest_1.expect)(result.success).toBe(true);
            // Should follow the first available path from decision node
            (0, vitest_1.expect)(result.executionPath).toContain('init');
            (0, vitest_1.expect)(result.executionPath).toContain('check-complexity');
            (0, vitest_1.expect)(result.executionPath).toContain('simple-solution');
            (0, vitest_1.expect)(result.executionPath).toContain('finalize');
        });
    });
    (0, vitest_1.describe)('Complete Swarm Workflow', () => {
        (0, vitest_1.it)('should execute a complete swarm intelligence workflow', async () => {
            // This test simulates a complete workflow involving all components:
            // 1. Task routing
            // 2. Parallel execution
            // 3. Context handoff
            // 4. Consensus voting
            // 5. Workflow orchestration
            // Setup agents
            const agents = [
                {
                    id: 'planner-agent',
                    type: 'planner',
                    name: 'Task Planner',
                    expertise: ['planning', 'decomposition'],
                    workload: 0,
                    capacity: 3
                },
                {
                    id: 'coder-agent',
                    type: 'coder',
                    name: 'Implementation Expert',
                    expertise: ['implementation', 'coding'],
                    workload: 0,
                    capacity: 5
                },
                {
                    id: 'reviewer-agent',
                    type: 'reviewer',
                    name: 'Quality Assurance',
                    expertise: ['review', 'testing'],
                    workload: 0,
                    capacity: 5
                }
            ];
            // Register agents with all systems
            agents.forEach(agent => {
                moeRouter.registerAgent(agent);
                votingSystem.registerAgent(agent);
            });
            // Step 1: Create and route task
            const task = {
                id: 'swarm-task-1',
                description: 'Implement real-time chat feature with WebSocket connections',
                type: 'feature_development',
                priority: 3,
                context: {
                    requirements: 'Low latency messaging with user presence indicators',
                    constraints: 'Must support 1000+ concurrent users'
                }
            };
            const routingResult = moeRouter.routeTask(task);
            (0, vitest_1.expect)(routingResult.agent.type).toBe('planner');
            // Step 2: Execute planning task
            const planningResult = await parallelExecutor.executeTask({
                ...task,
                id: 'planning-' + task.id
            });
            (0, vitest_1.expect)(planningResult.success).toBe(true);
            // Step 3: Handoff context from planner to coder
            const handoffRequest = {
                sourceAgentId: 'planner-agent',
                targetAgentId: 'coder-agent',
                taskId: task.id,
                context: {
                    plan: planningResult.result,
                    requirements: task.context?.requirements,
                    constraints: task.context?.constraints
                },
                priority: 'high'
            };
            const handoffResponse = await contextHandoff.initiateHandoff(handoffRequest);
            (0, vitest_1.expect)(handoffResponse.success).toBe(true);
            const coderContext = await contextHandoff.completeHandoff(handoffResponse.handoffId, 'coder-agent');
            (0, vitest_1.expect)(coderContext.plan).toBe(planningResult.result);
            // Step 4: Execute implementation task
            const implementationResult = await parallelExecutor.executeTask({
                ...task,
                id: 'implementation-' + task.id,
                description: 'Implement chat feature based on provided plan'
            });
            (0, vitest_1.expect)(implementationResult.success).toBe(true);
            // Step 5: Handoff to reviewer
            const reviewHandoffRequest = {
                sourceAgentId: 'coder-agent',
                targetAgentId: 'reviewer-agent',
                taskId: task.id,
                context: {
                    implementation: implementationResult.result,
                    originalRequirements: task.context?.requirements
                },
                priority: 'medium'
            };
            const reviewHandoffResponse = await contextHandoff.initiateHandoff(reviewHandoffRequest);
            (0, vitest_1.expect)(reviewHandoffResponse.success).toBe(true);
            const reviewContext = await contextHandoff.completeHandoff(reviewHandoffResponse.handoffId, 'reviewer-agent');
            (0, vitest_1.expect)(reviewContext.implementation).toBe(implementationResult.result);
            // Step 6: Conduct quality review voting
            const voteOptions = [
                { id: 'approve', label: 'Approve Implementation', value: 'approved' },
                { id: 'revise', label: 'Request Revisions', value: 'revisions-needed' },
                { id: 'reject', label: 'Reject Completely', value: 'rejected' }
            ];
            const votingSessionId = votingSystem.createVotingSession('Review implementation quality', voteOptions);
            // Simulate voting
            votingSystem.castVote(votingSessionId, 'planner-agent', 'approve', 'Plan well-executed');
            votingSystem.castVote(votingSessionId, 'coder-agent', 'approve', 'Clean implementation');
            votingSystem.castVote(votingSessionId, 'reviewer-agent', 'approve', 'Meets requirements');
            const votingResult = votingSystem.closeVotingSession(votingSessionId);
            (0, vitest_1.expect)(votingResult.winningOption?.id).toBe('approve');
            (0, vitest_1.expect)(votingResult.consensusReached).toBe(true);
            // Step 7: Orchestrate final workflow
            const workflowNodes = [
                {
                    id: 'begin',
                    type: 'process',
                    label: 'Start Integration'
                },
                {
                    id: 'integrate',
                    type: 'agent',
                    label: 'System Integrator',
                    agentType: 'coder'
                },
                {
                    id: 'test',
                    type: 'agent',
                    label: 'Testing Specialist',
                    agentType: 'tester'
                },
                {
                    id: 'deploy',
                    type: 'process',
                    label: 'Deployment'
                }
            ];
            const workflowEdges = [
                { id: 'wf-1', source: 'begin', target: 'integrate' },
                { id: 'wf-2', source: 'integrate', target: 'test' },
                { id: 'wf-3', source: 'test', target: 'deploy' }
            ];
            // Setup orchestrator
            const workflowOrchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('begin');
            workflowNodes.forEach(node => workflowOrchestrator.addNode(node));
            workflowEdges.forEach(edge => workflowOrchestrator.addEdge(edge));
            // Execute final workflow
            const finalContext = {
                feature: 'real-time-chat',
                implementation: implementationResult.result,
                reviewStatus: 'approved',
                votingResults: votingResult
            };
            const workflowResult = await workflowOrchestrator.executeWorkflow(finalContext);
            (0, vitest_1.expect)(workflowResult.success).toBe(true);
            (0, vitest_1.expect)(workflowResult.executionPath).toEqual(['begin', 'integrate', 'test', 'deploy']);
        });
    });
});
//# sourceMappingURL=swarm-workflow.test.js.map