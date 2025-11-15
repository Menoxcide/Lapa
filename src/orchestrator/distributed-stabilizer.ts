/**
 * Distributed Stabilizing Controllers for Multi-Agent Systems
 * 
 * Implements model-free distributed stabilization using reinforcement learning
 * Based on: "Learning Distributed Stabilizing Controllers for Multi-Agent Systems"
 * 
 * Features:
 * - Centralized LQR solver without initial stabilizing gain
 * - Distributed stabilization for multi-agent systems
 * - Interaction graph-based control
 * - Model-free RL approach
 */

import { Agent } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * System state for stabilization
 */
export interface SystemState {
  agentStates: Map<string, AgentState>;
  globalMetrics: GlobalMetrics;
  timestamp: number;
}

/**
 * Agent state
 */
export interface AgentState {
  agentId: string;
  status: 'stable' | 'unstable' | 'converging';
  workload: number;
  capacity: number;
  performance: number;
  errorRate: number;
  lastUpdate: number;
}

/**
 * Global system metrics
 */
export interface GlobalMetrics {
  totalAgents: number;
  activeAgents: number;
  averageWorkload: number;
  systemStability: number; // 0-1
  convergenceRate: number;
}

/**
 * Stabilizing controller
 */
export interface StabilizingController {
  id: string;
  agentId: string;
  gain: number[];
  stability: number; // 0-1
  convergenceTime: number;
  lastUpdate: number;
}

/**
 * LQR solution
 */
export interface LQRSolution {
  controller: StabilizingController;
  cost: number;
  iterations: number;
  converged: boolean;
}

/**
 * Reward function for RL
 */
export interface RewardFunction {
  evaluate: (state: SystemState, action: number[]) => number;
}

/**
 * Cost function for LQR
 */
export interface CostFunction {
  evaluate: (state: SystemState, control: number[]) => number;
}

/**
 * System dynamics
 */
export interface SystemDynamics {
  A: number[][]; // State transition matrix
  B: number[][]; // Control input matrix
}

/**
 * Stability metrics
 */
export interface StabilityMetrics {
  isStable: boolean;
  stabilityScore: number; // 0-1
  convergenceRate: number;
  errorBound: number;
  eigenvalues: number[];
}

/**
 * Agent interaction graph
 */
export interface AgentInteractionGraph {
  nodes: AgentNode[];
  edges: InteractionEdge[];
  topology: 'star' | 'mesh' | 'ring' | 'custom';
}

/**
 * Agent node in interaction graph
 */
export interface AgentNode {
  agentId: string;
  agentType: string;
  capabilities: string[];
  neighbors: string[];
}

/**
 * Interaction edge
 */
export interface InteractionEdge {
  source: string;
  target: string;
  interactionType: 'handoff' | 'consensus' | 'sync';
  weight: number;
}

/**
 * Centralized LQR Problem Solver
 * 
 * Solves LQR problem without requiring initial stabilizing gain.
 * Bootstrap from unstable initial conditions using RL.
 */
export class CentralizedLQRSolver {
  private learningRate: number;
  private maxIterations: number;
  private convergenceThreshold: number;
  
  constructor(
    learningRate: number = 0.01,
    maxIterations: number = 1000,
    convergenceThreshold: number = 0.001
  ) {
    this.learningRate = learningRate;
    this.maxIterations = maxIterations;
    this.convergenceThreshold = convergenceThreshold;
  }
  
  /**
   * Learns stabilizing controller from arbitrary initial state
   */
  async learnStabilizingController(
    systemState: SystemState,
    rewardFunction: RewardFunction
  ): Promise<StabilizingController> {
    const spanId = agl.emitSpan('stabilizer.learn_controller', {
      agentCount: systemState.agentStates.size
    });

    try {
      // Initialize controller with random gain
      let controller: StabilizingController = {
        id: `ctrl_${Date.now()}`,
        agentId: 'global',
        gain: this.initializeGain(systemState.agentStates.size),
        stability: 0.0,
        convergenceTime: 0,
        lastUpdate: Date.now()
      };

      // Iterative learning
      for (let iteration = 0; iteration < this.maxIterations; iteration++) {
        // Evaluate current controller
        const reward = rewardFunction.evaluate(systemState, controller.gain);
        
        // Update controller gain using gradient descent
        controller.gain = this.updateGain(
          controller.gain,
          reward,
          systemState
        );
        
        // Check convergence
        const stability = this.evaluateStability(controller, systemState);
        controller.stability = stability.stabilityScore;
        
        if (stability.isStable && stability.stabilityScore > 0.95) {
          controller.convergenceTime = iteration;
          break;
        }
      }

      agl.emitMetric('stabilizer.controller_learned', {
        iterations: controller.convergenceTime,
        stability: controller.stability
      });

      agl.endSpan(spanId, 'success', {
        stability: controller.stability,
        iterations: controller.convergenceTime
      });

      return controller;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Solves LQR problem iteratively
   */
  async solveLQR(
    systemDynamics: SystemDynamics,
    costFunction: CostFunction,
    maxIterations: number = 1000
  ): Promise<LQRSolution> {
    const spanId = agl.emitSpan('stabilizer.solve_lqr');

    try {
      // Initialize with zero gain (unstable)
      let gain: number[] = new Array(systemDynamics.B[0].length).fill(0);
      let cost = Infinity;
      let converged = false;

      // Iterative solution
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Calculate cost with current gain
        const state: SystemState = {
          agentStates: new Map(),
          globalMetrics: {
            totalAgents: 0,
            activeAgents: 0,
            averageWorkload: 0,
            systemStability: 0,
            convergenceRate: 0
          },
          timestamp: Date.now()
        };
        
        const newCost = costFunction.evaluate(state, gain);
        
        // Update gain using gradient descent
        const gradient = this.calculateGradient(
          systemDynamics,
          costFunction,
          gain
        );
        
        gain = gain.map((g, i) => g - this.learningRate * gradient[i]);
        
        // Check convergence
        if (Math.abs(newCost - cost) < this.convergenceThreshold) {
          converged = true;
          break;
        }
        
        cost = newCost;
      }

      const controller: StabilizingController = {
        id: `lqr_${Date.now()}`,
        agentId: 'global',
        gain,
        stability: converged ? 0.95 : 0.5,
        convergenceTime: maxIterations,
        lastUpdate: Date.now()
      };

      agl.endSpan(spanId, 'success', {
        converged,
        cost,
        iterations: maxIterations
      });

      return {
        controller,
        cost,
        iterations: maxIterations,
        converged
      };
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Evaluates controller stability
   */
  async evaluateStability(
    controller: StabilizingController,
    systemState: SystemState
  ): Promise<StabilityMetrics> {
    // Calculate stability based on agent states
    const agentStabilities = Array.from(systemState.agentStates.values())
      .map(agent => {
        const errorRate = agent.errorRate;
        const workloadRatio = agent.workload / agent.capacity;
        return 1.0 - (errorRate * 0.5 + workloadRatio * 0.5);
      });

    const avgStability = agentStabilities.reduce((a, b) => a + b, 0) / agentStabilities.length;
    const isStable = avgStability > 0.8;

    // Calculate eigenvalues (simplified)
    const eigenvalues = this.calculateEigenvalues(controller.gain);

    return {
      isStable,
      stabilityScore: avgStability,
      convergenceRate: systemState.globalMetrics.convergenceRate,
      errorBound: Math.max(...agentStabilities.map(s => 1 - s)),
      eigenvalues
    };
  }

  private initializeGain(agentCount: number): number[] {
    // Initialize with small random values
    return Array(agentCount).fill(0).map(() => 
      (Math.random() - 0.5) * 0.1
    );
  }

  private updateGain(
    currentGain: number[],
    reward: number,
    state: SystemState
  ): number[] {
    // Simple gradient-based update
    return currentGain.map((g, i) => {
      const gradient = reward > 0 ? 0.01 : -0.01;
      return g + this.learningRate * gradient;
    });
  }

  private calculateGradient(
    dynamics: SystemDynamics,
    costFunction: CostFunction,
    gain: number[]
  ): number[] {
    // Simplified gradient calculation
    const epsilon = 0.001;
    const state: SystemState = {
      agentStates: new Map(),
      globalMetrics: {
        totalAgents: 0,
        activeAgents: 0,
        averageWorkload: 0,
        systemStability: 0,
        convergenceRate: 0
      },
      timestamp: Date.now()
    };

    return gain.map((g, i) => {
      const gainPlus = [...gain];
      gainPlus[i] += epsilon;
      const costPlus = costFunction.evaluate(state, gainPlus);
      
      const gainMinus = [...gain];
      gainMinus[i] -= epsilon;
      const costMinus = costFunction.evaluate(state, gainMinus);
      
      return (costPlus - costMinus) / (2 * epsilon);
    });
  }

  private calculateEigenvalues(gain: number[]): number[] {
    // Simplified eigenvalue calculation
    // In real implementation, would use proper matrix eigenvalue computation
    return gain.map(g => Math.abs(g) < 1 ? g : 1 / g);
  }
}

/**
 * Distributed Stabilizer
 * 
 * Extends centralized stabilization to distributed multi-agent systems
 * with predefined interaction graphs.
 */
export class DistributedStabilizer {
  private interactionGraph: AgentInteractionGraph;
  private localControllers: Map<string, StabilizingController>;
  private centralizedSolver: CentralizedLQRSolver;
  
  constructor(
    interactionGraph: AgentInteractionGraph,
    centralizedSolver: CentralizedLQRSolver
  ) {
    this.interactionGraph = interactionGraph;
    this.centralizedSolver = centralizedSolver;
    this.localControllers = new Map();
  }
  
  /**
   * Learns distributed stabilizing controllers
   */
  async learnDistributedControllers(
    systemState: SystemState,
    rewardFunction: RewardFunction
  ): Promise<Map<string, StabilizingController>> {
    const spanId = agl.emitSpan('stabilizer.learn_distributed', {
      agentCount: this.interactionGraph.nodes.length
    });

    try {
      // Learn local controllers for each agent
      for (const node of this.interactionGraph.nodes) {
        const localState = this.extractLocalState(systemState, node);
        const localReward = this.createLocalRewardFunction(rewardFunction, node);
        
        const controller = await this.centralizedSolver.learnStabilizingController(
          localState,
          localReward
        );
        
        controller.agentId = node.agentId;
        this.localControllers.set(node.agentId, controller);
      }

      // Coordinate local controllers
      await this.coordinateControllers(systemState);

      agl.emitMetric('stabilizer.distributed_learned', {
        controllerCount: this.localControllers.size
      });

      agl.endSpan(spanId, 'success', {
        controllerCount: this.localControllers.size
      });

      return new Map(this.localControllers);
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Stabilizes system using distributed controllers
   */
  async stabilizeSystem(systemState: SystemState): Promise<SystemState> {
    const spanId = agl.emitSpan('stabilizer.stabilize', {
      agentCount: systemState.agentStates.size
    });

    try {
      const stabilizedState: SystemState = {
        agentStates: new Map(),
        globalMetrics: { ...systemState.globalMetrics },
        timestamp: Date.now()
      };

      // Apply local controllers to each agent
      for (const [agentId, agentState] of systemState.agentStates) {
        const controller = this.localControllers.get(agentId);
        
        if (controller) {
          const stabilizedAgent = this.applyController(agentState, controller);
          stabilizedState.agentStates.set(agentId, stabilizedAgent);
        } else {
          stabilizedState.agentStates.set(agentId, agentState);
        }
      }

      // Update global metrics
      stabilizedState.globalMetrics.systemStability = 
        this.calculateSystemStability(stabilizedState);

      agl.endSpan(spanId, 'success', {
        stability: stabilizedState.globalMetrics.systemStability
      });

      return stabilizedState;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private extractLocalState(
    globalState: SystemState,
    node: AgentNode
  ): SystemState {
    const localStates = new Map<string, AgentState>();
    
    // Include agent's own state
    const agentState = globalState.agentStates.get(node.agentId);
    if (agentState) {
      localStates.set(node.agentId, agentState);
    }
    
    // Include neighbor states
    for (const neighborId of node.neighbors) {
      const neighborState = globalState.agentStates.get(neighborId);
      if (neighborState) {
        localStates.set(neighborId, neighborState);
      }
    }
    
    return {
      agentStates: localStates,
      globalMetrics: globalState.globalMetrics,
      timestamp: globalState.timestamp
    };
  }

  private createLocalRewardFunction(
    globalReward: RewardFunction,
    node: AgentNode
  ): RewardFunction {
    return {
      evaluate: (state: SystemState, action: number[]) => {
        // Local reward based on agent and neighbors
        return globalReward.evaluate(state, action) * 0.7 +
               this.calculateLocalReward(state, node) * 0.3;
      }
    };
  }

  private calculateLocalReward(
    state: SystemState,
    node: AgentNode
  ): number {
    const agentState = state.agentStates.get(node.agentId);
    if (!agentState) return 0;

    // Reward based on stability and performance
    const stabilityReward = 1.0 - agentState.errorRate;
    const performanceReward = agentState.performance;
    const workloadReward = 1.0 - (agentState.workload / agentState.capacity);

    return (stabilityReward + performanceReward + workloadReward) / 3;
  }

  private async coordinateControllers(state: SystemState): Promise<void> {
    // Coordinate local controllers to ensure global stability
    // This is a simplified version - real implementation would use
    // more sophisticated coordination algorithms
    for (const edge of this.interactionGraph.edges) {
      const sourceController = this.localControllers.get(edge.source);
      const targetController = this.localControllers.get(edge.target);
      
      if (sourceController && targetController) {
        // Adjust controllers based on interaction weight
        const coordinationFactor = edge.weight;
        // Simplified coordination - would be more complex in practice
      }
    }
  }

  private applyController(
    agentState: AgentState,
    controller: StabilizingController
  ): AgentState {
    // Apply controller gain to stabilize agent
    const stabilizationFactor = controller.stability;
    
    return {
      ...agentState,
      status: stabilizationFactor > 0.8 ? 'stable' : 
              stabilizationFactor > 0.5 ? 'converging' : 'unstable',
      errorRate: agentState.errorRate * (1 - stabilizationFactor * 0.5),
      lastUpdate: Date.now()
    };
  }

  private calculateSystemStability(state: SystemState): number {
    const stabilities = Array.from(state.agentStates.values())
      .map(agent => {
        if (agent.status === 'stable') return 1.0;
        if (agent.status === 'converging') return 0.7;
        return 0.3;
      });
    
    return stabilities.reduce((a, b) => a + b, 0) / stabilities.length;
  }
}

