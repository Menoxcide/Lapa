/**
 * Distributed Stabilizer Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  CentralizedLQRSolver,
  DistributedStabilizer,
  SystemState,
  AgentInteractionGraph,
  AgentState
} from '../../orchestrator/distributed-stabilizer.ts';

describe('CentralizedLQRSolver', () => {
  let solver: CentralizedLQRSolver;
  let systemState: SystemState;

  beforeEach(() => {
    solver = new CentralizedLQRSolver();
    
    systemState = {
      agentStates: new Map([
        ['agent-1', {
          agentId: 'agent-1',
          status: 'unstable',
          workload: 8,
          capacity: 10,
          performance: 0.6,
          errorRate: 0.3,
          lastUpdate: Date.now()
        }]
      ]),
      globalMetrics: {
        totalAgents: 1,
        activeAgents: 1,
        averageWorkload: 0.8,
        systemStability: 0.5,
        convergenceRate: 0.0
      },
      timestamp: Date.now()
    };
  });

  it('should learn stabilizing controller', async () => {
    const rewardFunction = {
      evaluate: (state: SystemState, action: number[]) => {
        const stability = state.globalMetrics.systemStability;
        return stability;
      }
    };

    const controller = await solver.learnStabilizingController(
      systemState,
      rewardFunction
    );

    expect(controller).toBeDefined();
    expect(controller.gain).toBeDefined();
    expect(controller.stability).toBeGreaterThanOrEqual(0);
    expect(controller.stability).toBeLessThanOrEqual(1);
  });

  it('should evaluate stability', async () => {
    const controller = await solver.learnStabilizingController(
      systemState,
      { evaluate: () => 0.8 }
    );

    const metrics = await solver.evaluateStability(controller, systemState);
    
    expect(metrics).toBeDefined();
    expect(metrics.isStable).toBeDefined();
    expect(metrics.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(metrics.stabilityScore).toBeLessThanOrEqual(1);
  });
});

describe('DistributedStabilizer', () => {
  let stabilizer: DistributedStabilizer;
  let interactionGraph: AgentInteractionGraph;
  let solver: CentralizedLQRSolver;

  beforeEach(() => {
    solver = new CentralizedLQRSolver();
    
    interactionGraph = {
      nodes: [
        {
          agentId: 'agent-1',
          agentType: 'coder',
          capabilities: ['typescript'],
          neighbors: ['agent-2']
        },
        {
          agentId: 'agent-2',
          agentType: 'reviewer',
          capabilities: ['code-review'],
          neighbors: ['agent-1']
        }
      ],
      edges: [
        {
          source: 'agent-1',
          target: 'agent-2',
          interactionType: 'handoff',
          weight: 0.8
        }
      ],
      topology: 'mesh'
    };

    stabilizer = new DistributedStabilizer(interactionGraph, solver);
  });

  it('should learn distributed controllers', async () => {
    const systemState: SystemState = {
      agentStates: new Map([
        ['agent-1', {
          agentId: 'agent-1',
          status: 'unstable',
          workload: 8,
          capacity: 10,
          performance: 0.6,
          errorRate: 0.3,
          lastUpdate: Date.now()
        }],
        ['agent-2', {
          agentId: 'agent-2',
          status: 'stable',
          workload: 5,
          capacity: 10,
          performance: 0.9,
          errorRate: 0.1,
          lastUpdate: Date.now()
        }]
      ]),
      globalMetrics: {
        totalAgents: 2,
        activeAgents: 2,
        averageWorkload: 0.65,
        systemStability: 0.6,
        convergenceRate: 0.0
      },
      timestamp: Date.now()
    };

    const rewardFunction = {
      evaluate: (state: SystemState, action: number[]) => state.globalMetrics.systemStability
    };

    const controllers = await stabilizer.learnDistributedControllers(
      systemState,
      rewardFunction
    );

    expect(controllers).toBeDefined();
    expect(controllers.size).toBe(2);
    expect(controllers.has('agent-1')).toBe(true);
    expect(controllers.has('agent-2')).toBe(true);
  });

  it('should stabilize system', async () => {
    const systemState: SystemState = {
      agentStates: new Map([
        ['agent-1', {
          agentId: 'agent-1',
          status: 'unstable',
          workload: 8,
          capacity: 10,
          performance: 0.6,
          errorRate: 0.3,
          lastUpdate: Date.now()
        }]
      ]),
      globalMetrics: {
        totalAgents: 1,
        activeAgents: 1,
        averageWorkload: 0.8,
        systemStability: 0.5,
        convergenceRate: 0.0
      },
      timestamp: Date.now()
    };

    // Learn controllers first
    const rewardFunction = {
      evaluate: (state: SystemState, action: number[]) => state.globalMetrics.systemStability
    };
    await stabilizer.learnDistributedControllers(systemState, rewardFunction);

    // Stabilize
    const stabilized = await stabilizer.stabilizeSystem(systemState);

    expect(stabilized).toBeDefined();
    expect(stabilized.globalMetrics.systemStability).toBeGreaterThanOrEqual(0);
    expect(stabilized.globalMetrics.systemStability).toBeLessThanOrEqual(1);
  });
});

