import React, { useEffect, useRef } from 'react';
import { GraphNode, GraphEdge } from '../state/index.ts';

interface LiveGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

const LiveGraph: React.FC<LiveGraphProps> = ({ nodes, edges, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // In a real implementation, we would use a library like D3.js for graph visualization
    // This is a simplified representation for now
    if (!svgRef.current) return;

    // Clear previous render
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    // Set dimensions
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Render edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', '#94a3b8');
        line.setAttribute('stroke-width', '2');
        svgRef.current?.appendChild(line);
      }
    });

    // Render nodes
    nodes.forEach((node, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', node.color);
      if (onNodeClick) {
        circle.setAttribute('role', 'button');
        circle.setAttribute('tabindex', '0');
        circle.setAttribute('aria-label', `Node ${node.id || index + 1}: ${node.label || 'Unnamed node'}, click to view details`);
        circle.addEventListener('click', () => onNodeClick?.(node.id));
        circle.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNodeClick?.(node.id);
          }
        });
      } else {
        circle.setAttribute('role', 'img');
        circle.setAttribute('aria-label', `Node ${node.id || index + 1}: ${node.label || 'Unnamed node'}`);
      }
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');
      svgRef.current?.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', (node.y + 5).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '12px');
      text.textContent = node.label.charAt(0);
      svgRef.current?.appendChild(text);
    });
  }, [nodes, edges, onNodeClick]);

  return (
    <div className="live-graph-container" role="region" aria-label="Swarm Intelligence Flow Graph">
      <h2>Swarm Intelligence Flow</h2>
      <svg
        ref={svgRef}
        width="100%"
        height="500px"
        style={{ backgroundColor: '#f1f5f9', borderRadius: '8px' }}
        role="img"
        aria-label="Interactive graph showing swarm intelligence flow with nodes and edges"
      />
    </div>
  );
};

export default LiveGraph;