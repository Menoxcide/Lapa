/**
 * Real-Time Agent Monitoring Dashboard
 * 
 * React component for displaying live agent status,
 * performance metrics, and orchestration insights.
 */

import React, { useState, useEffect } from 'react';
import type { AgentStatus, PerformanceInsight } from '@lapa/core/orchestrator/agent-monitor.js';
import type { OrchestrationMetrics } from '@lapa/core/orchestrator/neuraforge-orchestrator.js';

interface DashboardProps {
  updateInterval?: number; // milliseconds
}

export const AgentMonitoringDashboard: React.FC<DashboardProps> = ({ 
  updateInterval = 2000 
}) => {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<OrchestrationMetrics | null>(null);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Simulate real-time updates (in actual implementation, use WebSocket or EventEmitter)
    const interval = setInterval(() => {
      updateDashboard();
    }, updateInterval);

    updateDashboard();

    return () => clearInterval(interval);
  }, [updateInterval]);

  const updateDashboard = async () => {
    try {
      // In actual implementation, these would come from the orchestrator
      // For now, we'll use placeholder data structure
      // const monitor = await import('../orchestrator/agent-monitor.ts');
      // const orchestrator = await import('../orchestrator/neuraforge-orchestrator.ts');
      
      // setAgentStatuses(monitor.agentMonitor.getAgentStatuses());
      // setMetrics(orchestrator.neuraforgeOrchestrator.getMetrics());
      // setInsights(monitor.agentMonitor.getPerformanceInsights());
      // setIsMonitoring(monitor.agentMonitor.isMonitoringActive());
    } catch (error) {
      console.error('Failed to update dashboard:', error);
    }
  };

  const getStatusColor = (status: AgentStatus['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'initializing': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: PerformanceInsight['severity']): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="agent-monitoring-dashboard p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 NEURAFORGE Agent Monitoring
          </h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Updated every {updateInterval / 1000}s
            </span>
          </div>
        </div>

        {/* Orchestration Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Deployments</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalDeployments}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalDeployments > 0
                  ? `${((metrics.successfulDeployments / metrics.totalDeployments) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Avg Deployment Time</div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.averageDeploymentTime > 0
                  ? `${(metrics.averageDeploymentTime / 1000).toFixed(1)}s`
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Active Agents</div>
              <div className="text-2xl font-bold text-blue-600">{metrics.activeAgents}</div>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Performance Insights</h2>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {insight.agentName} - {insight.metric}
                      </div>
                      <div className="text-sm opacity-90">
                        Value: {insight.value.toFixed(2)} | Trend: {insight.trend}
                      </div>
                      {insight.recommendation && (
                        <div className="text-sm mt-2 font-medium">
                          💡 {insight.recommendation}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {insight.severity === 'critical' && '🔴'}
                      {insight.severity === 'warning' && '⚠️'}
                      {insight.severity === 'info' && 'ℹ️'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Status List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Active Agents ({agentStatuses.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workload
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentStatuses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No active agents
                    </td>
                  </tr>
                ) : (
                  agentStatuses.map((agent) => (
                    <tr key={agent.agentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-500">{agent.agentId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)} text-white`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatUptime(agent.uptime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ✅ {agent.tasksCompleted || 0} | ❌ {agent.tasksFailed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.averageTaskTime
                          ? `${(agent.averageTaskTime / 1000).toFixed(1)}s`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${((agent.currentWorkload || 0) / (agent.capacity || 10)) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {agent.currentWorkload || 0}/{agent.capacity || 10}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMonitoringDashboard;

