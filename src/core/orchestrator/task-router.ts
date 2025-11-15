/**
 * Predictive Task Routing System
 * 
 * Predicts optimal task routing based on agent availability,
 * workload, and historical performance.
 */

import { agentMonitor } from './agent-monitor.ts';
import { agentSelector, type AgentRecommendation } from './agent-selector.ts';
import { neuraforgeOrchestrator } from './neuraforge-orchestrator.ts';

export interface RoutingPrediction {
  agentName: string;
  estimatedWaitTime: number; // milliseconds
  estimatedCompletionTime: number; // milliseconds
  confidence: number; // 0-1
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AgentWorkload {
  agentName: string;
  currentWorkload: number;
  capacity: number;
  utilization: number; // 0-1
  averageTaskTime: number; // milliseconds
  queueLength: number;
  estimatedAvailability: Date;
}

export interface RoutingDecision {
  agentName: string;
  routingTime: Date;
  estimatedStartTime: Date;
  estimatedCompletionTime: Date;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

/**
 * Predictive Task Router
 */
export class TaskRouter {
  private routingHistory: Map<string, RoutingDecision[]> = new Map();
  private agentWorkloads: Map<string, AgentWorkload> = new Map();

  constructor() {
    // Update workloads periodically
    setInterval(async () => {
      await this.updateAgentWorkloads();
    }, 5000); // Every 5 seconds
    // Initial update (fire and forget) - use void to ensure promise is returned
    void this.updateAgentWorkloads().catch(console.error);
  }

  /**
   * Predict optimal routing for a task
   */
  async predictRouting(
    taskDescription: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<RoutingPrediction[]> {
    // 1. Get agent recommendations
    const recommendations = await agentSelector.selectAgent(taskDescription);

    // 2. Get current workloads
    this.updateAgentWorkloads();

    // 3. Calculate routing predictions
    const predictions: RoutingPrediction[] = [];

    for (const recommendation of recommendations) {
      const workload = this.agentWorkloads.get(recommendation.agentName);
      
      if (!workload) {
        // Agent not in workload map, assume available
        predictions.push({
          agentName: recommendation.agentName,
          estimatedWaitTime: 0,
          estimatedCompletionTime: recommendation.estimatedTime,
          confidence: recommendation.confidence * 0.8, // Lower confidence for unknown workload
          reasoning: `${recommendation.reasoning} Workload unknown.`,
          priority
        });
        continue;
      }

      // Calculate wait time based on current workload
      const estimatedWaitTime = this.calculateWaitTime(workload, priority);
      
      // Calculate completion time
      const estimatedCompletionTime = estimatedWaitTime + recommendation.estimatedTime;

      // Adjust confidence based on workload
      let confidence = recommendation.confidence;
      if (workload.utilization > 0.9) {
        confidence *= 0.7; // High utilization reduces confidence
      } else if (workload.utilization < 0.5) {
        confidence *= 1.1; // Low utilization increases confidence
        confidence = Math.min(confidence, 1.0);
      }

      // Generate reasoning
      const reasoning = this.generateRoutingReasoning(
        recommendation,
        workload,
        estimatedWaitTime,
        priority
      );

      predictions.push({
        agentName: recommendation.agentName,
        estimatedWaitTime,
        estimatedCompletionTime,
        confidence,
        reasoning,
        priority
      });
    }

    // Sort by estimated completion time (fastest first)
    predictions.sort((a, b) => a.estimatedCompletionTime - b.estimatedCompletionTime);

    return predictions;
  }

  /**
   * Route task to best agent
   */
  async routeTask(
    taskDescription: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<RoutingDecision> {
    const predictions = await this.predictRouting(taskDescription, priority);
    
    if (predictions.length === 0) {
      throw new Error('No routing predictions available');
    }

    // Select best prediction (lowest completion time with good confidence)
    const bestPrediction = predictions.find(p => p.confidence > 0.6) || predictions[0];

    const now = new Date();
    const routingDecision: RoutingDecision = {
      agentName: bestPrediction.agentName,
      routingTime: now,
      estimatedStartTime: new Date(now.getTime() + bestPrediction.estimatedWaitTime),
      estimatedCompletionTime: new Date(now.getTime() + bestPrediction.estimatedCompletionTime),
      priority: bestPrediction.priority,
      reasoning: bestPrediction.reasoning
    };

    // Store routing decision
    const history = this.routingHistory.get(bestPrediction.agentName) || [];
    history.push(routingDecision);
    if (history.length > 100) {
      history.shift();
    }
    this.routingHistory.set(bestPrediction.agentName, history);

    return routingDecision;
  }

  /**
   * Update agent workloads from monitor
   */
  private async updateAgentWorkloads(): Promise<void> {
    const statuses = agentMonitor.getAgentStatuses();
    const metrics = await agentMonitor.getOrchestratorMetrics();

    for (const status of statuses) {
      const utilization = status.capacity
        ? (status.currentWorkload || 0) / status.capacity
        : 0;

      const workload: AgentWorkload = {
        agentName: status.agentName,
        currentWorkload: status.currentWorkload || 0,
        capacity: status.capacity || 10,
        utilization,
        averageTaskTime: status.averageTaskTime || 0,
        queueLength: this.estimateQueueLength(status),
        estimatedAvailability: this.estimateAvailability(status)
      };

      this.agentWorkloads.set(status.agentName, workload);
    }
  }

  /**
   * Calculate wait time based on workload and priority
   */
  private calculateWaitTime(
    workload: AgentWorkload,
    priority: 'low' | 'medium' | 'high'
  ): number {
    // Base wait time from current tasks
    let waitTime = workload.queueLength * workload.averageTaskTime;

    // Priority adjustment
    switch (priority) {
      case 'high':
        waitTime *= 0.5; // High priority tasks wait less
        break;
      case 'low':
        waitTime *= 1.5; // Low priority tasks wait more
        break;
    }

    // Utilization penalty
    if (workload.utilization > 0.8) {
      waitTime *= 1.5; // High utilization increases wait
    }

    return Math.max(waitTime, 0);
  }

  /**
   * Estimate queue length
   */
  private estimateQueueLength(status: any): number {
    // Simple estimation based on current workload
    return Math.max(0, (status.currentWorkload || 0) - 1);
  }

  /**
   * Estimate availability time
   */
  private estimateAvailability(status: any): Date {
    const avgTime = status.averageTaskTime || 5000;
    const queueLength = this.estimateQueueLength(status);
    const waitTime = queueLength * avgTime;
    
    return new Date(Date.now() + waitTime);
  }

  /**
   * Generate routing reasoning
   */
  private generateRoutingReasoning(
    recommendation: AgentRecommendation,
    workload: AgentWorkload,
    waitTime: number,
    priority: 'low' | 'medium' | 'high'
  ): string {
    const reasons: string[] = [];

    reasons.push(recommendation.reasoning);

    if (workload.utilization < 0.5) {
      reasons.push(`Agent has low utilization (${(workload.utilization * 100).toFixed(0)}%)`);
    } else if (workload.utilization > 0.9) {
      reasons.push(`Warning: Agent has high utilization (${(workload.utilization * 100).toFixed(0)}%)`);
    }

    if (waitTime < 1000) {
      reasons.push('Immediate availability');
    } else {
      reasons.push(`Estimated wait: ${(waitTime / 1000).toFixed(1)}s`);
    }

    if (priority === 'high') {
      reasons.push('High priority task - prioritized routing');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Get agent workloads
   */
  getAgentWorkloads(): Map<string, AgentWorkload> {
    return new Map(this.agentWorkloads);
  }

  /**
   * Get routing history for an agent
   */
  getRoutingHistory(agentName: string): RoutingDecision[] {
    return [...(this.routingHistory.get(agentName) || [])];
  }

  /**
   * Get load balancing recommendations
   */
  getLoadBalancingRecommendations(): string[] {
    const recommendations: string[] = [];
    const workloads = Array.from(this.agentWorkloads.values());

    // Find overloaded agents
    const overloaded = workloads.filter(w => w.utilization > 0.9);
    if (overloaded.length > 0) {
      recommendations.push(
        `⚠️ ${overloaded.length} agent(s) are overloaded: ${overloaded.map(w => w.agentName).join(', ')}`
      );
    }

    // Find underutilized agents
    const underutilized = workloads.filter(w => w.utilization < 0.3);
    if (underutilized.length > 0) {
      recommendations.push(
        `ℹ️ ${underutilized.length} agent(s) are underutilized: ${underutilized.map(w => w.agentName).join(', ')}`
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const taskRouter = new TaskRouter();

