import React from 'react';
import { GraphNode, GraphEdge } from '../state';
interface LiveGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    onNodeClick?: (nodeId: string) => void;
}
declare const LiveGraph: React.FC<LiveGraphProps>;
export default LiveGraph;
