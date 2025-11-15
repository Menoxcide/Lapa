/**
 * Handoff Optimization Benchmarks for LAPA v1.2 Phase 10
 * 
 * This module contains comprehensive benchmarks to demonstrate <1s handoff latency
 * for the optimized handoff pipeline.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HybridHandoffSystem } from '../../orchestrator/handoffs.ts';
import { ContextHandoffManager } from '../../swarm/context.handoff.ts';
import { Agent as OpenAIAgent } from '@openai/agents';
import { vi } from 'vitest';
import { performance } from 'perf_hooks';

// Mock the OpenAI agents SDK
vi.mock('@openai/agents', () => {
  return {
    run: vi.fn()
  };
});

// Import the mocked run function
import { run } from '@openai/agents';

// Benchmark configuration
interface BenchmarkConfig {
  warmupRuns: number;
  testRuns: number;
  targetLatency: number; // ms
  concurrencyLevels: number[];
}

const BENCHMARK_CONFIG: BenchmarkConfig = {
  warmupRuns: 5,
  testRuns: 20,
  targetLatency: 1000, // 1s
  concurrencyLevels: [1, 5, 10, 20]
};

// Test data generators
function generateTestContext(size: 'small' | 'medium' | 'large'): Record<string, any> {
  switch (size) {
    case 'small':
      return {
        taskId: 'test-1',
        data: 'small test data',
        metadata: { priority: 'low' }
      };
    case 'medium':
      return {
        taskId: 'test-2',
        data: 'medium test data '.repeat(100),
        metadata: { priority: 'medium', tags: ['tag1', 'tag2', 'tag3'] },
        nested: {
          level1: {
            level2: {
              value: 'nested value'
            }
          }
        }
      };
    case 'large':
      return {
        taskId: 'test-3',
        data: 'large test data '.repeat(1000),
        metadata: { priority: 'high', tags: Array(20).fill('tag').map((_, i) => `tag${i}`) },
        nested: Array(100).fill(null).map((_, i) => ({
          id: i,
          data: `nested data ${i}`,
          children: Array(10).fill(null).map((_, j) => ({
            id: `${i}-${j}`,
            value: `child value ${j}`
          }))
        })),
        timestamps: Array(1000).fill(null).map(() => Date.now() + Math.random() * 1000000)
      };
  }
}

function generateTestAgent(name: string): OpenAIAgent {
  return {
    id: `agent-${name}`,
    name: `Test Agent ${name}`,
    instructions: 'Test instructions',
    tools: [],
    model: 'gpt-4'
  } as unknown as OpenAIAgent;
}

describe('Handoff Optimization Benchmarks', () => {
  let handoffSystem: HybridHandoffSystem;
  let contextHandoffManager: ContextHandoffManager;
  let mockOpenAIAgent: OpenAIAgent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem({
      latencyTargetMs: 1000,
      maxLatencyThresholdMs: 2000,
      enableDetailedLogging: false
    });
    
    contextHandoffManager = new ContextHandoffManager();
    mockOpenAIAgent = generateTestAgent('benchmark');
    handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
    
    // Mock quick responses
    (run as any).mockResolvedValue({
      finalOutput: { result: 'Benchmark task completed' }
    });
  });

  afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Single Handoff Performance', () => {
    it('should meet <1s latency target for small context handoff', async () => {
      // Warmup runs
      for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `warmup-task-${i}`,
          generateTestContext('small')
        );
      }

      // Benchmark runs
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const startTime = performance.now();
        
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `test-task-${i}`,
          generateTestContext('small')
        );
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('Small Context Handoff Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <${BENCHMARK_CONFIG.targetLatency}ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(BENCHMARK_CONFIG.targetLatency);
    }, 30000); // 30 second timeout

    it('should meet <1s latency target for medium context handoff', async () => {
      // Warmup runs
      for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `warmup-task-${i}`,
          generateTestContext('medium')
        );
      }

      // Benchmark runs
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const startTime = performance.now();
        
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `test-task-${i}`,
          generateTestContext('medium')
        );
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('Medium Context Handoff Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <${BENCHMARK_CONFIG.targetLatency}ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(BENCHMARK_CONFIG.targetLatency);
    }, 30000); // 30 second timeout

    it('should meet <1s latency target for large context handoff', async () => {
      // Warmup runs
      for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `warmup-task-${i}`,
          generateTestContext('large')
        );
      }

      // Benchmark runs
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const startTime = performance.now();
        
        await (handoffSystem as any).initiateHandoff(
          'source-agent-1',
          'Test Agent benchmark',
          `test-task-${i}`,
          generateTestContext('large')
        );
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('Large Context Handoff Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <${BENCHMARK_CONFIG.targetLatency}ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(BENCHMARK_CONFIG.targetLatency);
    }, 60000); // 60 second timeout
  });

  describe('Concurrent Handoff Performance', () => {
    for (const concurrency of BENCHMARK_CONFIG.concurrencyLevels) {
      it(`should handle ${concurrency} concurrent handoffs within <1s per handoff`, async () => {
        // Warmup runs
        const warmupPromises = [];
        for (let i = 0; i < Math.min(BENCHMARK_CONFIG.warmupRuns, concurrency); i++) {
          warmupPromises.push(
            (handoffSystem as any).initiateHandoff(
              `warmup-source-${i}`,
              'Test Agent benchmark',
              `warmup-task-${i}`,
              generateTestContext('medium')
            )
          );
        }
        await Promise.all(warmupPromises);

        // Benchmark runs
        const runDurations: number[] = [];
        
        for (let run = 0; run < BENCHMARK_CONFIG.testRuns; run++) {
          const handoffPromises = [];
          const startTime = performance.now();
          
          for (let i = 0; i < concurrency; i++) {
            handoffPromises.push(
              (handoffSystem as any).initiateHandoff(
                `source-${run}-${i}`,
                'Test Agent benchmark',
                `test-task-${run}-${i}`,
                generateTestContext('medium')
              )
            );
          }
          
          await Promise.all(handoffPromises);
          const endTime = performance.now();
          const totalDuration = endTime - startTime;
          const avgDuration = totalDuration / concurrency;
          
          runDurations.push(avgDuration);
        }

        // Calculate statistics
        const avgDuration = runDurations.reduce((a, b) => a + b, 0) / runDurations.length;
        const minDuration = Math.min(...runDurations);
        const maxDuration = Math.max(...runDurations);
        
        console.log(`${concurrency} Concurrent Handoff Performance:`);
        console.log(`  Average per handoff: ${avgDuration.toFixed(2)}ms`);
        console.log(`  Min per handoff: ${minDuration.toFixed(2)}ms`);
        console.log(`  Max per handoff: ${maxDuration.toFixed(2)}ms`);
        console.log(`  Target: <${BENCHMARK_CONFIG.targetLatency}ms`);
        
        // Verify target is met
        expect(avgDuration).toBeLessThan(BENCHMARK_CONFIG.targetLatency);
      }, 60000); // 60 second timeout
    }
  });

  describe('Context Handoff Manager Performance', () => {
    it('should handle context handoff initiation within 100ms', async () => {
      const testContext = generateTestContext('medium');
      
      // Warmup runs
      for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
        await contextHandoffManager.initiateHandoff({
          sourceAgentId: 'source-1',
          targetAgentId: 'target-1',
          taskId: `warmup-${i}`,
          context: testContext,
          priority: 'medium'
        });
      }

      // Benchmark runs
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const startTime = performance.now();
        
        await contextHandoffManager.initiateHandoff({
          sourceAgentId: 'source-1',
          targetAgentId: 'target-1',
          taskId: `test-${i}`,
          context: testContext,
          priority: 'medium'
        });
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('Context Handoff Initiation Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <100ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(100);
    }, 30000); // 30 second timeout

    it('should handle context handoff completion within 100ms', async () => {
      const testContext = generateTestContext('medium');
      
      // Initiate handoffs first
      const handoffResponses = [];
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns + BENCHMARK_CONFIG.warmupRuns; i++) {
        const response = await contextHandoffManager.initiateHandoff({
          sourceAgentId: 'source-1',
          targetAgentId: 'target-1',
          taskId: `task-${i}`,
          context: testContext,
          priority: 'medium'
        });
        handoffResponses.push(response);
      }

      // Benchmark completion
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const response = handoffResponses[BENCHMARK_CONFIG.warmupRuns + i];
        
        const startTime = performance.now();
        await contextHandoffManager.completeHandoff(response.handoffId, 'target-1');
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('Context Handoff Completion Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <100ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(100);
    }, 30000); // 30 second timeout
  });

  describe('End-to-End Handoff Pipeline', () => {
    it('should complete full handoff pipeline within <1s', async () => {
      const testContext = generateTestContext('medium');
      
      // Warmup runs
      for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
        // Initiate handoff
        const initiateResponse = await contextHandoffManager.initiateHandoff({
          sourceAgentId: 'source-1',
          targetAgentId: 'target-1',
          taskId: `warmup-${i}`,
          context: testContext,
          priority: 'medium'
        });
        
        // Complete handoff
        await contextHandoffManager.completeHandoff(initiateResponse.handoffId, 'target-1');
      }

      // Benchmark runs
      const durations: number[] = [];
      
      for (let i = 0; i < BENCHMARK_CONFIG.testRuns; i++) {
        const startTime = performance.now();
        
        // Initiate handoff
        const initiateResponse = await contextHandoffManager.initiateHandoff({
          sourceAgentId: 'source-1',
          targetAgentId: 'target-1',
          taskId: `test-${i}`,
          context: testContext,
          priority: 'medium'
        });
        
        // Complete handoff
        await contextHandoffManager.completeHandoff(initiateResponse.handoffId, 'target-1');
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('End-to-End Handoff Pipeline Performance:');
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <${BENCHMARK_CONFIG.targetLatency}ms`);
      
      // Verify target is met
      expect(avgDuration).toBeLessThan(BENCHMARK_CONFIG.targetLatency);
    }, 30000); // 30 second timeout
  });
});