import { MoERouter, Agent, Task } from '../../src/agents/moe-router';
import { RayParallelExecutor } from '../../src/agents/ray-parallel';
import { ConsensusVotingSystem } from '../../src/swarm/consensus.voting';
import { ContextHandoffManager } from '../../src/swarm/context.handoff';
import { LangGraphOrchestrator } from '../../src/swarm/langgraph.orchestrator';

describe('Swarm Orchestration Performance Benchmarks', () => {
  describe('MoE Router Performance', () => {
    let router: MoERouter;
    const agentCount = 100; // Large number of agents for stress testing

    beforeEach(() => {
      router = new MoERouter();
      
      // Register many agents to test routing performance
      for (let i = 0; i < agentCount; i++) {
        const agent: Agent = {
          id: `agent-${i}`,
          type: i % 5 === 0 ? 'planner' : 
                i % 5 === 1 ? 'coder' : 
                i % 5 === 2 ? 'reviewer' : 
                i % 5 === 3 ? 'debugger' : 'optimizer',
          name: `Agent ${i}`,
          expertise: [`skill-${i % 10}`, `domain-${Math.floor(i / 10)}`],
          workload: i % 20, // Varying workloads
          capacity: 20
        };
        router.registerAgent(agent);
      }
    });

    it('should route tasks efficiently with many agents', () => {
      const tasks: Task[] = [];
      
      // Create diverse tasks
      for (let i = 0; i < 1000; i++) {
        tasks.push({
          id: `task-${i}`,
          description: `Task requiring skill-${i % 10} expertise`,
          type: i % 4 === 0 ? 'planning' : 
                i % 4 === 1 ? 'code_generation' : 
                i % 4 === 2 ? 'code_review' : 'bug_fix',
          priority: i % 3 + 1
        });
      }
      
      const start = performance.now();
      
      // Route all tasks
      const results = tasks.map(task => router.routeTask(task));
      
      const totalTime = performance.now() - start;
      const avgTimePerRoute = totalTime / tasks.length;
      
      // Verify all tasks were routed
      expect(results).toHaveLength(tasks.length);
      results.forEach(result => {
        expect(result.agent).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      });
      
      console.log('MoE Router Performance:');
      console.log(`  Agents: ${agentCount}`);
      console.log(`  Tasks Routed: ${tasks.length}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Route: ${avgTimePerRoute.toFixed(4)}ms`);
      console.log(`  Routes per Second: ${(1000 / avgTimePerRoute).toFixed(2)}`);
      
      // Performance assertions
      expect(avgTimePerRoute).toBeLessThan(5); // Average < 5ms per route
      expect(totalTime).toBeLessThan(5000); // Total < 5 seconds
    });

    it('should handle routing with overloaded agents', () => {
      // Overload most agents
      router.getAgents().forEach((agent, index) => {
        if (index < agentCount * 0.9) { // Overload 90% of agents
          router.updateAgentWorkload(agent.id, agent.capacity + 5); // Over capacity
        }
      });
      
      const task: Task = {
        id: 'overload-test',
        description: 'Test task routing with overloaded agents',
        type: 'code_generation',
        priority: 2
      };
      
      const start = performance.now();
      const result = router.routeTask(task);
      const routeTime = performance.now() - start;
      
      expect(result.agent).toBeDefined();
      expect(result.confidence).toBe(0.3); // Confidence for overloaded agents
      
      console.log('Overloaded Agents Routing:');
      console.log(`  Route Time: ${routeTime.toFixed(4)}ms`);
      
      // Should still be fast even with overload handling
      expect(routeTime).toBeLessThan(10);
    });
  });

  describe('Parallel Execution Performance', () => {
    let executor: RayParallelExecutor;

    beforeEach(() => {
      executor = new RayParallelExecutor({
        maxConcurrency: 10,
        timeout: 10000,
        retries: 1
      });
    });

    it('should execute many tasks in parallel efficiently', async () => {
      const taskCount = 500;
      const tasks: Task[] = [];
      
      // Create varied tasks
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `parallel-task-${i}`,
          description: `Parallel execution task ${i}`,
          type: i % 3 === 0 ? 'code_generation' : 
                i % 3 === 1 ? 'code_review' : 'bug_fix',
          priority: i % 3 + 1,
          context: {
            data: `Context data for task ${i}`,
            size: i
          }
        });
      }
      
      const start = performance.now();
      const results = await executor.executeTasks(tasks);
      const totalTime = performance.now() - start;
      
      // Verify results
      expect(results).toHaveLength(taskCount);
      results.forEach((result, index) => {
        expect(result.taskId).toBe(`parallel-task-${index}`);
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      });
      
      // Calculate statistics
      const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
      const avgExecutionTime = totalExecutionTime / results.length;
      const successfulTasks = results.filter(r => r.success).length;
      
      console.log('Parallel Execution Performance:');
      console.log(`  Tasks Executed: ${taskCount}`);
      console.log(`  Successful Tasks: ${successfulTasks}`);
      console.log(`  Total Wall Clock Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Execution Time per Task: ${avgExecutionTime.toFixed(2)}ms`);
      console.log(`  Effective Concurrency: ${(totalExecutionTime / totalTime).toFixed(2)}x`);
      
      // Performance assertions
      expect(successfulTasks).toBe(taskCount); // All tasks should succeed
      expect(totalTime).toBeLessThan(30000); // Total < 30 seconds
    });

    it('should handle task retries efficiently', async () => {
      // Create tasks that will require retries
      const tasks: Task[] = [
        {
          id: 'retry-task-1',
          description: 'Task that will retry',
          type: 'code_generation',
          priority: 1
        },
        {
          id: 'retry-task-2',
          description: 'Another task that will retry',
          type: 'code_review',
          priority: 2
        }
      ];
      
      const start = performance.now();
      const results = await executor.executeTasks(tasks);
      const totalTime = performance.now() - start;
      
      // Verify results
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.taskId).toMatch(/retry-task-/);
        expect(result.success).toBe(true);
      });
      
      console.log('Task Retry Performance:');
      console.log(`  Tasks with Retries: ${tasks.length}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      
      // Should handle retries within reasonable time
      expect(totalTime).toBeLessThan(5000); // < 5 seconds even with retries
    });
  });

  describe('Consensus Voting Performance', () => {
    let votingSystem: ConsensusVotingSystem;
    const agentCount = 50;

    beforeEach(() => {
      votingSystem = new ConsensusVotingSystem();
      
      // Register many agents
      for (let i = 0; i < agentCount; i++) {
        votingSystem.registerAgent({
          id: `voter-${i}`,
          type: i % 5 === 0 ? 'planner' : 
                i % 5 === 1 ? 'coder' : 
                i % 5 === 2 ? 'reviewer' : 
                i % 5 === 3 ? 'debugger' : 'optimizer',
          name: `Voter ${i}`,
          expertise: [`domain-${Math.floor(i / 10)}`],
          workload: 0,
          capacity: 10
        });
      }
    });

    it('should handle large-scale voting sessions', () => {
      const options = [
        { id: 'option-a', label: 'Option A', value: 'a' },
        { id: 'option-b', label: 'Option B', value: 'b' },
        { id: 'option-c', label: 'Option C', value: 'c' },
        { id: 'option-d', label: 'Option D', value: 'd' }
      ];
      
      const start = performance.now();
      
      // Create multiple voting sessions
      const sessionCount = 100;
      const sessionIds: string[] = [];
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = votingSystem.createVotingSession(
          `Voting Session ${i}`,
          options,
          Math.floor(agentCount * 0.8) // 80% quorum
        );
        sessionIds.push(sessionId);
      }
      
      const creationTime = performance.now() - start;
      
      // Cast votes in all sessions
      const voteStart = performance.now();
      let voteCount = 0;
      
      sessionIds.forEach(sessionId => {
        // Have varying numbers of agents vote
        const voterCount = Math.floor(Math.random() * agentCount * 0.8) + 1;
        for (let i = 0; i < voterCount; i++) {
          const optionIndex = i % options.length;
          const success = votingSystem.castVote(
            sessionId,
            `voter-${i}`,
            options[optionIndex].id
          );
          
          if (success) voteCount++;
        }
      });
      
      const votingTime = performance.now() - voteStart;
      
      // Close all sessions
      const closeStart = performance.now();
      const results = sessionIds.map(sessionId => 
        votingSystem.closeVotingSession(sessionId)
      );
      const closeTime = performance.now() - closeStart;
      
      const totalTime = creationTime + votingTime + closeTime;
      
      // Verify results
      expect(results).toHaveLength(sessionCount);
      results.forEach(result => {
        expect(result.sessionId).toBeDefined();
        expect(result.consensusReached).toBeDefined();
      });
      
      console.log('Consensus Voting Performance:');
      console.log(`  Voting Sessions: ${sessionCount}`);
      console.log(`  Total Agents: ${agentCount}`);
      console.log(`  Total Votes Cast: ${voteCount}`);
      console.log(`  Session Creation Time: ${creationTime.toFixed(2)}ms`);
      console.log(`  Voting Time: ${votingTime.toFixed(2)}ms`);
      console.log(`  Session Close Time: ${closeTime.toFixed(2)}ms`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Session: ${(totalTime / sessionCount).toFixed(4)}ms`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // Total < 5 seconds
      expect(creationTime).toBeLessThan(1000); // Creation < 1 second
    });

    it('should handle complex voting algorithms efficiently', () => {
      const options = [
        { id: 'win', label: 'Winning Option', value: 'win' },
        { id: 'lose1', label: 'Losing Option 1', value: 'lose1' },
        { id: 'lose2', label: 'Losing Option 2', value: 'lose2' }
      ];
      
      const sessionId = votingSystem.createVotingSession(
        'Complex Algorithm Test',
        options
      );
      
      // Cast votes to create a clear winner
      for (let i = 0; i < agentCount; i++) {
        const optionId = i < agentCount * 0.6 ? 'win' : 
                         i < agentCount * 0.8 ? 'lose1' : 'lose2';
        votingSystem.castVote(sessionId, `voter-${i}`, optionId);
      }
      
      // Test different algorithms
      const algorithms: any[] = ['simple-majority', 'weighted-majority', 'supermajority'];
      const results = [];
      
      const start = performance.now();
      
      for (const algorithm of algorithms) {
        const result = votingSystem.closeVotingSession(sessionId, algorithm, 0.6);
        results.push({ algorithm, result });
      }
      
      const totalTime = performance.now() - start;
      
      // Verify all algorithms produced results
      expect(results).toHaveLength(algorithms.length);
      results.forEach(({ result }) => {
        expect(result.winningOption).toBeDefined();
        expect(result.consensusReached).toBeDefined();
      });
      
      console.log('Complex Voting Algorithms Performance:');
      console.log(`  Algorithms Tested: ${algorithms.length}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Algorithm: ${(totalTime / algorithms.length).toFixed(4)}ms`);
      
      // Should be fast even with complex algorithms
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Context Handoff Performance', () => {
    let handoffManager: ContextHandoffManager;

    beforeEach(() => {
      handoffManager = new ContextHandoffManager();
    });

    it('should handle high-volume context handoffs', async () => {
      const handoffCount = 200;
      const handoffs = [];
      
      // Create varied contexts
      for (let i = 0; i < handoffCount; i++) {
        handoffs.push({
          sourceAgentId: `source-${i}`,
          targetAgentId: `target-${(i + 1) % 10}`,
          taskId: `task-${i}`,
          context: {
            data: `Context data for handoff ${i}`.repeat(10),
            metadata: {
              timestamp: Date.now(),
              sequence: i,
              priority: i % 3
            },
            complex: Array.from({ length: 50 }, (_, idx) => ({
              id: `item-${idx}`,
              value: Math.random() * 1000
            }))
          },
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
        });
      }
      
      const start = performance.now();
      
      // Initiate all handoffs
      const initiationResults = [];
      for (const handoff of handoffs) {
        const result = await handoffManager.initiateHandoff(handoff);
        initiationResults.push(result);
      }
      
      const initiationTime = performance.now() - start;
      
      // Complete all handoffs
      const completionStart = performance.now();
      const completionResults = [];
      
      for (let i = 0; i < initiationResults.length; i++) {
        if (initiationResults[i].success) {
          const result = await handoffManager.completeHandoff(
            initiationResults[i].handoffId,
            handoffs[i].targetAgentId
          );
          completionResults.push(result);
        }
      }
      
      const completionTime = performance.now() - completionStart;
      const totalTime = initiationTime + completionTime;
      
      // Verify results
      const successfulInitiations = initiationResults.filter(r => r.success).length;
      expect(successfulInitiations).toBe(handoffCount);
      
      expect(completionResults).toHaveLength(handoffCount);
      completionResults.forEach((result, index) => {
        expect(result).toEqual(handoffs[index].context);
      });
      
      console.log('Context Handoff Performance:');
      console.log(`  Handoffs Processed: ${handoffCount}`);
      console.log(`  Successful Initiations: ${successfulInitiations}`);
      console.log(`  Initiation Time: ${initiationTime.toFixed(2)}ms`);
      console.log(`  Completion Time: ${completionTime.toFixed(2)}ms`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Handoff: ${(totalTime / handoffCount).toFixed(4)}ms`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Total < 10 seconds
      expect(initiationTime).toBeLessThan(5000); // Initiation < 5 seconds
    });

    it('should maintain performance with large contexts', async () => {
      // Create a very large context
      const largeContext = {
        massiveArray: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: `This is a lot of data for item ${i}`.repeat(10),
          nested: {
            deep: {
              value: Math.random() * 1000000,
              timestamp: Date.now() + i
            }
          }
        })),
        hugeString: 'Large string data. '.repeat(10000),
        complexObject: {
          level1: {
            level2: {
              level3: {
                level4: {
                  data: 'Deeply nested data'
                }
              }
            }
          }
        }
      };
      
      const handoffRequest = {
        sourceAgentId: 'large-source',
        targetAgentId: 'large-target',
        taskId: 'large-context-task',
        context: largeContext,
        priority: 'high' as const
      };
      
      const start = performance.now();
      const initiationResult = await handoffManager.initiateHandoff(handoffRequest);
      const initiationTime = performance.now() - start;
      
      expect(initiationResult.success).toBe(true);
      expect(initiationResult.compressedSize).toBeGreaterThan(1000); // Should be substantial
      
      const completionStart = performance.now();
      const receivedContext = await handoffManager.completeHandoff(
        initiationResult.handoffId,
        'large-target'
      );
      const completionTime = performance.now() - completionStart;
      const totalTime = initiationTime + completionTime;
      
      // Verify integrity
      expect(receivedContext.massiveArray).toHaveLength(largeContext.massiveArray.length);
      expect(receivedContext.hugeString).toBe(largeContext.hugeString);
      
      console.log('Large Context Handoff Performance:');
      console.log(`  Original Context Size: ~${JSON.stringify(largeContext).length} chars`);
      console.log(`  Compressed Size: ${initiationResult.compressedSize} bytes`);
      console.log(`  Initiation Time: ${initiationTime.toFixed(2)}ms`);
      console.log(`  Completion Time: ${completionTime.toFixed(2)}ms`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Compression Ratio: ${(JSON.stringify(largeContext).length / initiationResult.compressedSize!).toFixed(2)}x`);
      
      // Should handle large contexts efficiently
      expect(totalTime).toBeLessThan(3000); // < 3 seconds for large context
    });
  });

  describe('LangGraph Orchestration Performance', () => {
    it('should execute complex workflows efficiently', async () => {
      const orchestrator = new LangGraphOrchestrator('start');
      
      // Create a complex workflow graph
      const nodeCount = 50;
      const nodes = [];
      
      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: `node-${i}`,
          type: i % 3 === 0 ? 'agent' : i % 3 === 1 ? 'process' : 'decision',
          label: `Node ${i}`,
          agentType: i % 3 === 0 ? 'coder' : undefined
        });
      }
      
      nodes.forEach(node => orchestrator.addNode(node));
      
      // Create edges to form a complex graph
      const edges = [];
      for (let i = 0; i < nodeCount - 1; i++) {
        edges.push({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`
        });
      }
      
      // Add some branching edges
      for (let i = 0; i < nodeCount - 10; i += 5) {
        edges.push({
          id: `branch-${i}`,
          source: `node-${i}`,
          target: `node-${i + 7}`
        });
      }
      
      edges.forEach(edge => orchestrator.addEdge(edge));
      
      const start = performance.now();
      
      // Execute workflow
      const context = {
        workflowId: 'complex-performance-test',
        data: 'Initial workflow data',
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      const result = await orchestrator.executeWorkflow(context);
      
      const totalTime = performance.now() - start;
      
      // Verify execution
      expect(result.success).toBe(true);
      expect(result.executionPath).toBeDefined();
      expect(result.executionPath.length).toBeGreaterThan(0);
      
      console.log('LangGraph Orchestration Performance:');
      console.log(`  Nodes in Graph: ${nodeCount}`);
      console.log(`  Edges in Graph: ${edges.length}`);
      console.log(`  Execution Path Length: ${result.executionPath.length}`);
      console.log(`  Total Execution Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Node: ${(totalTime / result.executionPath.length).toFixed(4)}ms`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // < 5 seconds for complex workflow
      expect(result.executionPath.length).toBeGreaterThan(10); // Should traverse significant portion
    });

    it('should handle workflow with many decision points', async () => {
      const orchestrator = new LangGraphOrchestrator('start');
      
      // Create workflow with many decision points
      const decisionNodes = [];
      for (let i = 0; i < 20; i++) {
        decisionNodes.push({
          id: `decision-${i}`,
          type: 'decision',
          label: `Decision Point ${i}`
        });
      }
      
      // Add to orchestrator
      orchestrator.addNode({
        id: 'start',
        type: 'process',
        label: 'Start'
      });
      
      decisionNodes.forEach(node => orchestrator.addNode(node));
      
      orchestrator.addNode({
        id: 'end',
        type: 'process',
        label: 'End'
      });
      
      // Connect nodes
      orchestrator.addEdge({
        id: 'start-to-first',
        source: 'start',
        target: 'decision-0'
      });
      
      for (let i = 0; i < decisionNodes.length - 1; i++) {
        orchestrator.addEdge({
          id: `decision-${i}-to-${i + 1}`,
          source: `decision-${i}`,
          target: `decision-${i + 1}`
        });
      }
      
      orchestrator.addEdge({
        id: 'last-to-end',
        source: `decision-${decisionNodes.length - 1}`,
        target: 'end'
      });
      
      const start = performance.now();
      
      const context = {
        decisionCount: decisionNodes.length,
        testData: 'Decision workflow test'
      };
      
      const result = await orchestrator.executeWorkflow(context);
      
      const totalTime = performance.now() - start;
      
      expect(result.success).toBe(true);
      expect(result.executionPath).toHaveLength(decisionNodes.length + 2); // start + decisions + end
      
      console.log('Decision-Heavy Workflow Performance:');
      console.log(`  Decision Points: ${decisionNodes.length}`);
      console.log(`  Total Execution Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Decision: ${(totalTime / decisionNodes.length).toFixed(4)}ms`);
      
      // Should handle many decisions efficiently
      expect(totalTime).toBeLessThan(2000); // < 2 seconds
    });
  });

  describe('Integrated Swarm Performance', () => {
    it('should maintain performance across integrated swarm operations', async () => {
      // This test combines all swarm components in a realistic workflow
      const router = new MoERouter();
      const executor = new RayParallelExecutor({ maxConcurrency: 5 });
      const votingSystem = new ConsensusVotingSystem();
      const handoffManager = new ContextHandoffManager();
      
      // Set up agents
      const agents: Agent[] = [
        {
          id: 'swarm-planner',
          type: 'planner',
          name: 'Swarm Planner',
          expertise: ['planning', 'coordination'],
          workload: 0,
          capacity: 10
        },
        {
          id: 'swarm-coder',
          type: 'coder',
          name: 'Swarm Coder',
          expertise: ['implementation', 'coding'],
          workload: 0,
          capacity: 10
        },
        {
          id: 'swarm-reviewer',
          type: 'reviewer',
          name: 'Swarm Reviewer',
          expertise: ['review', 'quality'],
          workload: 0,
          capacity: 10
        }
      ];
      
      agents.forEach(agent => {
        router.registerAgent(agent);
        votingSystem.registerAgent(agent);
      });
      
      // Simulate a complete workflow with performance monitoring
      const iterations = 50;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = performance.now();
        
        // 1. Route task
        const task: Task = {
          id: `swarm-task-${i}`,
          description: `Swarm integration task ${i}`,
          type: 'feature_development',
          priority: i % 3 + 1
        };
        
        const routingResult = router.routeTask(task);
        
        // 2. Execute task
        const executionResult = await executor.executeTask(task);
        
        // 3. Handoff context
        if (executionResult.success) {
          const handoffRequest = {
            sourceAgentId: routingResult.agent.id,
            targetAgentId: 'swarm-reviewer',
            taskId: task.id,
            context: {
              result: executionResult.result,
              task: task.description
            },
            priority: 'medium' as const
          };
          
          const handoffResult = await handoffManager.initiateHandoff(handoffRequest);
          
          if (handoffResult.success) {
            await handoffManager.completeHandoff(
              handoffResult.handoffId,
              'swarm-reviewer'
            );
          }
        }
        
        // 4. Voting session
        const options = [
          { id: 'approve', label: 'Approve', value: 'approved' },
          { id: 'revise', label: 'Revise', value: 'revisions' }
        ];
        
        const sessionId = votingSystem.createVotingSession(
          `Review Task ${i}`,
          options
        );
        
        votingSystem.castVote(sessionId, 'swarm-planner', 'approve');
        votingSystem.castVote(sessionId, 'swarm-coder', 'approve');
        votingSystem.castVote(sessionId, 'swarm-reviewer', 'approve');
        
        votingSystem.closeVotingSession(sessionId);
        
        const iterationTime = performance.now() - iterationStart;
        times.push(iterationTime);
      }
      
      // Calculate statistics
      const totalTime = times.reduce((sum, t) => sum + t, 0);
      const avgTime = totalTime / iterations;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log('Integrated Swarm Performance:');
      console.log(`  Workflow Iterations: ${iterations}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Iteration: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min Time: ${minTime.toFixed(2)}ms`);
      console.log(`  Max Time: ${maxTime.toFixed(2)}ms`);
      console.log(`  Iterations per Second: ${(1000 / avgTime).toFixed(2)}`);
      
      // Performance assertions for integrated workflow
      expect(avgTime).toBeLessThan(500); // Average < 500ms per iteration
      expect(totalTime).toBeLessThan(30000); // Total < 30 seconds
      expect(minTime).toBeGreaterThan(0); // All times positive
    });
  });
});