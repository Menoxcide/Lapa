"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ControlPanel = ({ isRunning, onPause, onResume, onRedirect, onReset }) => {
    return (<div className="control-panel bg-white rounded-lg shadow-md p-4">
      <h2>Swarm Controls</h2>
      <div className="flex flex-wrap gap-3 mt-4">
        {isRunning ? (<button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center" onClick={onPause}>
            <span className="mr-2">⏸️</span>
            Pause Swarm
          </button>) : (<button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center" onClick={onResume}>
            <span className="mr-2">▶️</span>
            Resume Swarm
          </button>)}
        
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center" onClick={onRedirect}>
          <span className="mr-2">🔀</span>
          Redirect Task
        </button>
        
        <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center" onClick={onReset}>
          <span className="mr-2">🔄</span>
          Reset Swarm
        </button>
      </div>
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors">
            Add Agent
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors">
            Export Logs
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors">
            View Metrics
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors">
            Settings
          </button>
        </div>
      </div>
    </div>);
};
exports.default = ControlPanel;
//# sourceMappingURL=ControlPanel.js.map