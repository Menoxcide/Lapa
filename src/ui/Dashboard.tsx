import React from 'react';
import LiveGraph from './components/LiveGraph.tsx';
import AgentAvatars from './components/AgentAvatars.tsx';
import SpeechBubbles from './components/SpeechBubbles.tsx';
import ControlPanel from './components/ControlPanel.tsx';
import { useDashboard } from './state/index.ts';

const Dashboard: React.FC = () => {
  const { state, pauseSwarm, resumeSwarm, redirectTask, resetSwarm } = useDashboard();

  return (
    <div className="dashboard p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">LAPA Swarm Dashboard</h1>
        <p className="text-gray-600">Monitor and control your autonomous coding swarm</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <LiveGraph
            nodes={state.nodes}
            edges={state.edges}
            onNodeClick={(nodeId) => console.log(`Clicked node: ${nodeId}`)}
          />
        </div>
        <div>
          <ControlPanel
            isRunning={state.isRunning}
            onPause={pauseSwarm}
            onResume={resumeSwarm}
            onRedirect={redirectTask}
            onReset={resetSwarm}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AgentAvatars
          agents={state.agents}
          onAgentClick={(agentId) => console.log(`Clicked agent: ${agentId}`)}
        />
        <SpeechBubbles
          messages={state.messages}
          onMessageClick={(messageId) => console.log(`Clicked message: ${messageId}`)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Swarm Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="metric-card bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Tasks Completed</h3>
            <p className="text-2xl font-bold text-blue-600">{state.metrics.tasksCompleted}</p>
          </div>
          <div className="metric-card bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Success Rate</h3>
            <p className="text-2xl font-bold text-green-600">{state.metrics.successRate}%</p>
          </div>
          <div className="metric-card bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Active Agents</h3>
            <p className="text-2xl font-bold text-yellow-600">{state.metrics.activeAgents}/5</p>
          </div>
          <div className="metric-card bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-800">Avg. Response Time</h3>
            <p className="text-2xl font-bold text-purple-600">{state.metrics.avgResponseTime}s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;