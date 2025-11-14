/**
 * Swarm View v2 for LAPA v1.3.0-preview — Phase 21
 * 
 * Enhanced React Flow canvas with zoom/pan, AgentNodes, HandoffEdges,
 * PerfHeatmap overlay, ApprovalGate, InlineDiff, ThoughtBubble.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getSessionShareInfo, generateSessionShareLink } from '../swarm/sessions.ts';
import { LAPAActionBar } from './LAPAActionBar';

interface AgentNode {
  id: string;
  type: string;
  name: string;
  avatar?: string;
  progress: number; // 0-100
  badge?: string;
  position: { x: number; y: number };
  status: 'idle' | 'working' | 'waiting' | 'complete';
}

interface HandoffEdge {
  id: string;
  source: string;
  target: string;
  latency?: number; // milliseconds
  animated?: boolean;
}

interface SwarmViewProps {
  nodes?: AgentNode[];
  edges?: HandoffEdge[];
  sessionId?: string; // Added sessionId prop for sharing
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

const SwarmView: React.FC<SwarmViewProps> = ({
  nodes = [],
  edges = [],
  sessionId,
  onNodeClick,
  onEdgeClick
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showApprovalGate, setShowApprovalGate] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Mock data for demonstration
  const defaultNodes: AgentNode[] = [
    {
      id: 'architect',
      type: 'Architect',
      name: 'Architect',
      progress: 75,
      position: { x: 100, y: 100 },
      status: 'working'
    },
    {
      id: 'coder',
      type: 'Coder',
      name: 'Coder',
      progress: 50,
      position: { x: 300, y: 100 },
      status: 'working'
    },
    {
      id: 'tester',
      type: 'Tester',
      name: 'Tester',
      progress: 25,
      position: { x: 500, y: 100 },
      status: 'waiting'
    }
  ];

  const defaultEdges: HandoffEdge[] = [
    {
      id: 'architect-coder',
      source: 'architect',
      target: 'coder',
      latency: 450,
      animated: true
    },
    {
      id: 'coder-tester',
      source: 'coder',
      target: 'tester',
      latency: 0,
      animated: false
    }
  ];

  const displayNodes = nodes.length > 0 ? nodes : defaultNodes;
  const displayEdges = edges.length > 0 ? edges : defaultEdges;

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handlePan = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  };

  const handleApproval = (approved: boolean) => {
    if (approved) {
      // Process approval
      console.log('Approved:', pendingApproval);
    } else {
      // Reject
      console.log('Rejected:', pendingApproval);
    }
    setShowApprovalGate(false);
    setPendingApproval(null);
  };
  
  const handleShareSession = () => {
    if (sessionId) {
      const shareInfo = getSessionShareInfo(sessionId);
      if (shareInfo) {
        setShareLink(shareInfo.shareLink);
        setShowShareModal(true);
      }
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    // Show a toast or notification that the link was copied
    console.log('Share link copied to clipboard');
  };

  const handleStartSwarm = () => {
    console.log('Starting swarm...');
  };

  const handleStopSwarm = () => {
    console.log('Stopping swarm...');
  };

  const handlePauseSwarm = () => {
    console.log('Pausing/resuming swarm...');
  };

  return (
    <div className="swarm-view relative w-full h-full bg-gray-100 overflow-hidden flex flex-col">
      {/* Action Bar */}
      <LAPAActionBar 
        onStartSwarm={handleStartSwarm}
        onStopSwarm={handleStopSwarm}
        onPauseSwarm={handlePauseSwarm}
      />
      
      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => handleZoom(0.1)}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(-0.1)}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            −
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded ${
              showHeatmap ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Heatmap
          </button>
          {sessionId && (
            <button
              onClick={handleShareSession}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Share
            </button>
          )}
          <span className="px-3 py-1 text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Canvas */}
        <div
          className="swarm-canvas relative w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {displayEdges.map((edge) => {
              const sourceNode = displayNodes.find(n => n.id === edge.source);
              const targetNode = displayNodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.position.x + 50;
              const y1 = sourceNode.position.y + 50;
              const x2 = targetNode.position.x + 50;
              const y2 = targetNode.position.y + 50;

              return (
                <g key={edge.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={edge.animated ? '#3b82f6' : '#9ca3af'}
                    strokeWidth="2"
                    strokeDasharray={edge.animated ? '5,5' : 'none'}
                    className={edge.animated ? 'animate-pulse' : ''}
                  />
                  {edge.latency !== undefined && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      className="text-xs fill-gray-600"
                      textAnchor="middle"
                    >
                      {edge.latency}ms
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {displayNodes.map((node) => (
            <div
              key={node.id}
              className={`agent-node absolute w-24 h-24 bg-white rounded-lg shadow-md border-2 cursor-pointer transition-all ${
                selectedNode === node.id ? 'border-blue-500' : 'border-gray-300'
              } ${node.status === 'working' ? 'ring-2 ring-green-400' : ''}`}
              style={{
                left: node.position.x,
                top: node.position.y
              }}
              onClick={() => handleNodeClick(node.id)}
            >
              <div className="p-2 h-full flex flex-col items-center justify-center">
                <div className="text-2xl mb-1">{node.avatar || '🤖'}</div>
                <div className="text-xs font-semibold text-center">{node.name}</div>
                {node.badge && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-1 rounded mt-1">
                    {node.badge}
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all"
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Performance Heatmap Overlay */}
          {showHeatmap && (
            <div className="absolute inset-0 pointer-events-none opacity-50">
              {/* Mock heatmap visualization */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500 via-yellow-500 to-red-500 opacity-20" />
              <div className="absolute top-4 right-4 bg-white rounded p-2 shadow-lg pointer-events-auto">
                <div className="text-xs font-semibold mb-1">Performance Heatmap</div>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" title="Low usage" />
                  <div className="w-3 h-3 bg-yellow-500 rounded" title="Medium usage" />
                  <div className="w-3 h-3 bg-red-500 rounded" title="High usage" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Approval Gate Modal */}
        {showApprovalGate && pendingApproval && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Approve Changes</h3>
              <div className="mb-4">
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(pendingApproval, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleApproval(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowApprovalGate(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Share Session Modal */}
        {showShareModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Share Session</h3>
              <p className="text-gray-600 mb-4">
                Share this link with others to collaborate on this swarm session.
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thought Bubble (for selected node) */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
            <div className="text-sm font-semibold mb-2">Agent Thoughts</div>
            <div className="text-xs text-gray-600">
              Current task: Processing request...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwarmView;