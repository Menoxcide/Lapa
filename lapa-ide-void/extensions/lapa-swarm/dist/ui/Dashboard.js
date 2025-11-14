"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const LiveGraph_tsx_1 = __importDefault(require("./components/LiveGraph.tsx"));
const AgentAvatars_tsx_1 = __importDefault(require("./components/AgentAvatars.tsx"));
const SpeechBubbles_tsx_1 = __importDefault(require("./components/SpeechBubbles.tsx"));
const ControlPanel_tsx_1 = __importDefault(require("./components/ControlPanel.tsx"));
const index_ts_1 = require("./state/index.ts");
const Dashboard = () => {
    const { state, pauseSwarm, resumeSwarm, redirectTask, resetSwarm } = (0, index_ts_1.useDashboard)();
    return (<div className="dashboard p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">LAPA Swarm Dashboard</h1>
        <p className="text-gray-600">Monitor and control your autonomous coding swarm</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <LiveGraph_tsx_1.default nodes={state.nodes} edges={state.edges} onNodeClick={(nodeId) => console.log(`Clicked node: ${nodeId}`)}/>
        </div>
        <div>
          <ControlPanel_tsx_1.default isRunning={state.isRunning} onPause={pauseSwarm} onResume={resumeSwarm} onRedirect={redirectTask} onReset={resetSwarm}/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AgentAvatars_tsx_1.default agents={state.agents} onAgentClick={(agentId) => console.log(`Clicked agent: ${agentId}`)}/>
        <SpeechBubbles_tsx_1.default messages={state.messages} onMessageClick={(messageId) => console.log(`Clicked message: ${messageId}`)}/>
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
    </div>);
};
exports.default = Dashboard;
//# sourceMappingURL=Dashboard.js.map