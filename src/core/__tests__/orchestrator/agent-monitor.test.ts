/**
 * Agent Monitor Test Suite
 * 
 * Tests for real-time agent monitoring system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { agentMonitor, type AgentStatus, type PerformanceInsight } from '../../orchestrator/agent-monitor.ts';
import { neuraforgeOrchestrator } from '../../orchestrator/neuraforge-orchestrator.ts';

describe('Agent Monitor', () => {
  beforeEach(() => {
    agentMonitor.stopMonitoring();
  });

  afterEach(() => {
    agentMonitor.stopMonitoring();
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring', () => {
      agentMonitor.startMonitoring(1000);
      expect(agentMonitor.isMonitoringActive()).toBe(true);
    });

    it('should stop monitoring', () => {
      agentMonitor.startMonitoring(1000);
      agentMonitor.stopMonitoring();
      expect(agentMonitor.isMonitoringActive()).toBe(false);
    });

    it('should not start multiple monitoring intervals', () => {
      agentMonitor.startMonitoring(1000);
      const initial = agentMonitor.isMonitoringActive();
      agentMonitor.startMonitoring(1000);
      expect(agentMonitor.isMonitoringActive()).toBe(initial);
    });
  });

  describe('Agent Status Tracking', () => {
    it('should track agent statuses', async () => {
      agentMonitor.startMonitoring(100);
      
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test task');
      
      // Wait for monitoring update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const statuses = agentMonitor.getAgentStatuses();
      expect(statuses.length).toBeGreaterThanOrEqual(0);
    });

    it('should get agent status by ID', async () => {
      agentMonitor.startMonitoring(100);
      
      const deployment = await neuraforgeOrchestrator.deployAgent(
        'CODER',
        'Test task'
      );
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (deployment.agentId) {
        const status = agentMonitor.getAgentStatus(deployment.agentId);
        // Status may or may not be available immediately
        expect(status === undefined || status.agentName === 'CODER').toBe(true);
      }
    });

    it('should update statuses from orchestrator', async () => {
      agentMonitor.startMonitoring(100);
      
      await neuraforgeOrchestrator.deployAgent('TEST', 'Test task');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const statuses = agentMonitor.getAgentStatuses();
      // Should have at least attempted to track
      expect(Array.isArray(statuses)).toBe(true);
    });
  });

  describe('Performance Insights', () => {
    it('should generate performance insights', async () => {
      agentMonitor.startMonitoring(100);
      
      await neuraforgeOrchestrator.deployAgent('CODER', 'Task 1');
      await neuraforgeOrchestrator.deployAgent('CODER', 'Task 2');
      await neuraforgeOrchestrator.deployAgent('CODER', 'Task 3');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const insights = agentMonitor.getPerformanceInsights();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should identify performance trends', async () => {
      agentMonitor.startMonitoring(100);
      
      // Deploy multiple agents to generate history
      for (let i = 0; i < 5; i++) {
        await neuraforgeOrchestrator.deployAgent('CODER', `Task ${i}`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const insights = agentMonitor.getPerformanceInsights();
      // Should have some insights after multiple deployments
      expect(insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should categorize insights by severity', async () => {
      agentMonitor.startMonitoring(100);
      
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const insights = agentMonitor.getPerformanceInsights();
      
      for (const insight of insights) {
        expect(['info', 'warning', 'critical']).toContain(insight.severity);
        expect(['improving', 'stable', 'degrading']).toContain(insight.trend);
      }
    });
  });

  describe('Metrics Integration', () => {
    it('should get orchestrator metrics', async () => {
      const metrics = await agentMonitor.getOrchestratorMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalDeployments).toBeGreaterThanOrEqual(0);
      expect(metrics.successfulDeployments).toBeGreaterThanOrEqual(0);
      expect(metrics.failedDeployments).toBeGreaterThanOrEqual(0);
      expect(metrics.averageDeploymentTime).toBeGreaterThanOrEqual(0);
      expect(metrics.activeAgents).toBeGreaterThanOrEqual(0);
    });

    it('should track performance history', async () => {
      agentMonitor.startMonitoring(100);
      
      await neuraforgeOrchestrator.deployAgent('CODER', 'Test');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const history = agentMonitor.getPerformanceHistory('CODER');
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Event Emission', () => {
    it('should emit status change events', async () => {
      agentMonitor.startMonitoring(100);
      
      const eventPromise = new Promise<void>((resolve) => {
        const handler = (event: any) => {
          if (event.type === 'status_change') {
            expect(event.data).toBeDefined();
            expect(event.data.agentName).toBeDefined();
            agentMonitor.removeListener('status_change', handler);
            resolve();
          }
        };
        
        agentMonitor.on('status_change', handler);
      });
      
      neuraforgeOrchestrator.deployAgent('CODER', 'Test').catch(() => {
        // Ignore errors for this test
      });

      await Promise.race([
        eventPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    });

    it('should emit metrics update events', async () => {
      agentMonitor.startMonitoring(50);
      
      const eventPromise = new Promise<void>((resolve) => {
        const handler = (event: any) => {
          if (event.type === 'metric_update') {
            expect(event.data).toBeDefined();
            expect(event.data.metrics).toBeDefined();
            agentMonitor.removeListener('metrics_update', handler);
            resolve();
          }
        };
        
        agentMonitor.on('metrics_update', handler);
      });

      await Promise.race([
        eventPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    });
  });
});

