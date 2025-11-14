"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const AgentAvatars = ({ agents, onAgentClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'idle': return 'bg-gray-300';
            case 'working': return 'bg-blue-500';
            case 'paused': return 'bg-yellow-500';
            case 'completed': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'idle': return '⏸️';
            case 'working': return '⚙️';
            case 'paused': return '⏸️';
            case 'completed': return '✅';
            default: return '⏸️';
        }
    };
    return (<div className="agent-avatars-container">
      <h2>Agent Swarm</h2>
      <div className="flex flex-wrap gap-4">
        {agents.map(agent => (<div key={agent.id} data-testid="agent-avatar-card" className={`agent-avatar-card cursor-pointer rounded-lg p-4 shadow-md transition-all hover:shadow-lg ${onAgentClick ? 'hover:bg-gray-50' : ''}`} onClick={() => onAgentClick?.(agent.id)}>
            <div className="flex items-center">
              <div className="avatar-placeholder w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3" style={{ backgroundColor: agent.avatarColor }}>
                {agent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{agent.name}</h3>
                <p className="text-sm text-gray-600 truncate">{agent.role}</p>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-lg">{getStatusIcon(agent.status)}</span>
                <div data-testid="status-indicator" className={`status-indicator w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
};
exports.default = AgentAvatars;
//# sourceMappingURL=AgentAvatars.js.map