"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const LiveGraph = ({ nodes, edges, onNodeClick }) => {
    const svgRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // In a real implementation, we would use a library like D3.js for graph visualization
        // This is a simplified representation for now
        if (!svgRef.current)
            return;
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
        nodes.forEach(node => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x.toString());
            circle.setAttribute('cy', node.y.toString());
            circle.setAttribute('r', '20');
            circle.setAttribute('fill', node.color);
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '2');
            circle.addEventListener('click', () => onNodeClick?.(node.id));
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
    return (<div className="live-graph-container">
      <h2>Swarm Intelligence Flow</h2>
      <svg ref={svgRef} width="100%" height="500px" style={{ backgroundColor: '#f1f5f9', borderRadius: '8px' }}/>
    </div>);
};
exports.default = LiveGraph;
//# sourceMappingURL=LiveGraph.js.map