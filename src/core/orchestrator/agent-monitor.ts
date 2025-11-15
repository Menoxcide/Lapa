/**
 * Real-Time Agent Monitoring System
 * 
 * Provides live monitoring of agent deployments, performance metrics,
 * and orchestration status for NEURAFORGE orchestrator.
 */

import type { AgentDeployment, OrchestrationMetrics } from './neuraforge-orchestrator.ts';
import { EventEmitter } from 'node:events';

export interface AgentStatus {
  agentId: string;
  agentName: string;
  status: 'pending' | 'initializing' | 'active' | 'completed' | 'failed';
  deployedAt?: Date;
  uptime?: number; // seconds
  tasksCompleted?: number;
  tasksFailed?: number;
  averageTaskTime?: number; // milliseconds
  currentWorkload?: number;
  capacity?: number;
}

export interface MonitoringEvent {
  type: 'deployment' | 'status_change' | 'metric_update' | 'workflow_update';
  timestamp: Date;
  data: any;
}

export interface PerformanceInsight {
  agentName: string;
  metric: string;
  value: number;
  trend: 'improving' | 'stable' | 'degrading';
  recommendation?: string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Real-Time Agent Monitor
 */
export class AgentMonitor extends EventEmitter {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  private insights: PerformanceInsight[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    super();
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.updateAgentStatuses();
      await this.calculatePerformanceInsights();
      await this.emitMetrics();
    }, intervalMs);

    console.log('✅ Real-time agent monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Real-time agent monitoring stopped');
  }

  /**
   * Update agent statuses from orchestrator
   */
  private async updateAgentStatuses(): Promise<void> {
    // Lazy import to avoid circular dependency
    const { neuraforgeOrchestrator } = await import('./neuraforge-orchestrator.ts');
    const deployments = neuraforgeOrchestrator.getActiveDeployments();
    const metrics = neuraforgeOrchestrator.getMetrics();

    // Update statuses
    for (const deployment of deployments) {
      const existing = this.agentStatuses.get(deployment.agentId || '');
      
      if (!existing || existing.status !== deployment.status) {
        // Status changed - emit event
        this.emit('status_change', {
          type: 'status_change',
          timestamp: new Date(),
          data: {
            agentId: deployment.agentId,
            agentName: deployment.agentName,
            oldStatus: existing?.status,
            newStatus: deployment.status
          }
        } as MonitoringEvent);
      }

      const uptime = deployment.deployedAt
        ? Math.floor((Date.now() - deployment.deployedAt.getTime()) / 1000)
        : 0;

      const status: AgentStatus = {
        agentId: deployment.agentId || '',
        agentName: deployment.agentName,
        status: deployment.status,
        deployedAt: deployment.deployedAt,
        uptime,
        tasksCompleted: deployment.metrics?.spawnSuccess ? 1 : 0,
        tasksFailed: deployment.metrics?.spawnSuccess ? 0 : 1,
        averageTaskTime: deployment.metrics?.deploymentTime,
        currentWorkload: deployment.status === 'active' ? 1 : 0,
        capacity: 10 // Default capacity
      };

      this.agentStatuses.set(deployment.agentId || '', status);

      // Track performance history
      if (deployment.metrics?.deploymentTime) {
        const history = this.performanceHistory.get(deployment.agentName) || [];
        history.push(deployment.metrics.deploymentTime);
        // Keep last 100 data points
        if (history.length > 100) {
          history.shift();
        }
        this.performanceHistory.set(deployment.agentName, history);
      }
    }

    // Remove inactive agents
    const activeIds = new Set(deployments.map(d => d.agentId).filter(Boolean));
    for (const [agentId] of this.agentStatuses) {
      if (!activeIds.has(agentId)) {
        this.agentStatuses.delete(agentId);
      }
    }
  }

  /**
   * Calculate performance insights
   */
  private async calculatePerformanceInsights(): Promise<void> {
    this.insights = [];

    // Analyze each agent's performance
    for (const [agentName, history] of this.performanceHistory) {
      if (history.length < 3) continue;

      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      
      if (older.length === 0) continue;

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'degrading';
      let severity: 'info' | 'warning' | 'critical';
      let recommendation: string | undefined;

      if (change < -10) {
        trend = 'improving';
        severity = 'info';
      } else if (change > 20) {
        trend = 'degrading';
        severity = change > 50 ? 'critical' : 'warning';
        recommendation = `Performance degradation detected. Consider optimizing ${agentName} agent or checking system resources.`;
      } else {
        trend = 'stable';
        severity = 'info';
      }

      this.insights.push({
        agentName,
        metric: 'deployment_time',
        value: recentAvg,
        trend,
        recommendation,
        severity
      });
    }

    // Analyze orchestrator metrics (lazy import to avoid circular dependency)
    const { neuraforgeOrchestrator } = await import('./neuraforge-orchestrator.ts');
    const metrics = neuraforgeOrchestrator.getMetrics();
    
    if (metrics.totalDeployments > 0) {
      const successRate = (metrics.successfulDeployments / metrics.totalDeployments) * 100;
      
      if (successRate < 90) {
        this.insights.push({
          agentName: 'NEURAFORGE',
          metric: 'success_rate',
          value: successRate,
          trend: 'degrading',
          recommendation: `Deployment success rate is ${successRate.toFixed(1)}%. Investigate failed deployments.`,
          severity: successRate < 70 ? 'critical' : 'warning'
        });
      }

      if (metrics.averageDeploymentTime > 5000) {
        this.insights.push({
          agentName: 'NEURAFORGE',
          metric: 'deployment_time',
          value: metrics.averageDeploymentTime,
          trend: 'degrading',
          recommendation: `Average deployment time is ${(metrics.averageDeploymentTime / 1000).toFixed(1)}s. Consider optimizing agent spawning.`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Emit metrics update event
   */
  private async emitMetrics(): Promise<void> {
    // Lazy import to avoid circular dependency
    const { neuraforgeOrchestrator } = await import('./neuraforge-orchestrator.ts');
    const metrics = neuraforgeOrchestrator.getMetrics();
    const statuses = Array.from(this.agentStatuses.values());

    this.emit('metrics_update', {
      type: 'metric_update',
      timestamp: new Date(),
      data: {
        metrics,
        agentStatuses: statuses,
        insights: this.insights,
        activeAgents: statuses.filter(s => s.status === 'active').length,
        totalAgents: statuses.length
      }
    } as MonitoringEvent);
  }

  /**
   * Get current agent statuses
   */
  getAgentStatuses(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }

  /**
   * Get agent status by ID
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): PerformanceInsight[] {
    return [...this.insights];
  }

  /**
   * Get orchestrator metrics
   */
  async getOrchestratorMetrics(): Promise<OrchestrationMetrics> {
    // Lazy import to avoid circular dependency
    const { neuraforgeOrchestrator } = await import('./neuraforge-orchestrator.ts');
    return neuraforgeOrchestrator.getMetrics();
  }

  /**
   * Get performance history for an agent
   */
  getPerformanceHistory(agentName: string): number[] {
    return [...(this.performanceHistory.get(agentName) || [])];
  }

  /**
   * Get monitoring status
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Cleanup - optimized to prevent memory leaks
   */
  dispose(): void {
    // Stop monitoring if active
    this.stopMonitoring();
    
    // Clear all listeners to prevent memory leaks
    this.removeAllListeners();
    
    // Clear status maps to free memory
    this.agentStatuses.clear();
    this.performanceHistory.clear();
    this.insights = [];
    
    console.log('✅ AgentMonitor disposed and cleaned up');
  }
}

// Export singleton instance
export const agentMonitor = new AgentMonitor();

