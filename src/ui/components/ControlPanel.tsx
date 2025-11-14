import React from 'react';

interface ControlPanelProps {
  isRunning: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRedirect?: () => void;
  onReset?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isRunning, 
  onPause, 
  onResume, 
  onRedirect, 
  onReset 
}) => {
  return (
    <div className="control-panel bg-white rounded-lg shadow-md p-4" role="region" aria-label="Swarm Controls">
      <h2>Swarm Controls</h2>
      <div className="flex flex-wrap gap-3 mt-4" role="toolbar" aria-label="Swarm Control Actions">
        {isRunning ? (
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center"
            onClick={onPause}
            aria-label="Pause Swarm"
            aria-pressed={isRunning}
          >
            <span className="mr-2" aria-hidden="true">⏸️</span>
            Pause Swarm
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
            onClick={onResume}
            aria-label="Resume Swarm"
            aria-pressed={!isRunning}
          >
            <span className="mr-2" aria-hidden="true">▶️</span>
            Resume Swarm
          </button>
        )}
        
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
          onClick={onRedirect}
          aria-label="Redirect Task"
        >
          <span className="mr-2" aria-hidden="true">🔀</span>
          Redirect Task
        </button>
        
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          onClick={onReset}
          aria-label="Reset Swarm"
        >
          <span className="mr-2" aria-hidden="true">🔄</span>
          Reset Swarm
        </button>
      </div>
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Quick Actions">
          <button 
            className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
            aria-label="Add Agent"
          >
            Add Agent
          </button>
          <button 
            className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
            aria-label="Export Logs"
          >
            Export Logs
          </button>
          <button 
            className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
            aria-label="View Metrics"
          >
            View Metrics
          </button>
          <button 
            className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
            aria-label="Settings"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;