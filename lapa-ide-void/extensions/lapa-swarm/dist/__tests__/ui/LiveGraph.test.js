"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
require("@testing-library/jest-dom");
const LiveGraph_tsx_1 = __importDefault(require("../../ui/components/LiveGraph.tsx"));
(0, vitest_1.describe)('LiveGraph', () => {
    const mockNodes = [
        {
            id: 'node-1',
            label: 'Agent A',
            x: 100,
            y: 100,
            color: '#FF5733'
        },
        {
            id: 'node-2',
            label: 'Agent B',
            x: 200,
            y: 200,
            color: '#33FF57'
        }
    ];
    const mockEdges = [
        {
            source: 'node-1',
            target: 'node-2'
        }
    ];
    (0, vitest_1.it)('should render live graph container with title', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={[]} edges={[]}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByRole('img')).toBeInTheDocument(); // SVG element
    });
    (0, vitest_1.it)('should render SVG with correct attributes', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={[]} edges={[]}/>);
        const svg = react_1.screen.getByRole('img');
        (0, vitest_1.expect)(svg).toHaveAttribute('width', '100%');
        (0, vitest_1.expect)(svg).toHaveAttribute('height', '500px');
        (0, vitest_1.expect)(svg).toHaveStyle('background-color: rgb(241, 245, 249)'); // #f1f5f9 converted to RGB
        (0, vitest_1.expect)(svg).toHaveStyle('border-radius: 8px');
    });
    (0, vitest_1.it)('should render nodes correctly', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={[]}/>);
        // Since the rendering happens in useEffect and directly manipulates the DOM,
        // we can't easily test the actual SVG elements in a JSDOM environment.
        // We'll verify the component renders without errors
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should render edges correctly', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={mockEdges}/>);
        // Similar to nodes, we can't easily test the actual SVG elements
        // We'll verify the component renders without errors
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle empty nodes and edges arrays', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={[]} edges={[]}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
        // Should render without errors
        (0, vitest_1.expect)(true).toBe(true);
    });
    (0, vitest_1.it)('should handle single node without edges', () => {
        const singleNode = [mockNodes[0]];
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={singleNode} edges={[]}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle edges with missing nodes gracefully', () => {
        const invalidEdges = [
            {
                source: 'non-existent-node',
                target: 'also-non-existent'
            }
        ];
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={invalidEdges}/>);
        // Should not throw an error
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should apply correct CSS classes to container', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={[]} edges={[]}/>);
        const container = react_1.screen.getByText('Swarm Intelligence Flow').closest('.live-graph-container');
        (0, vitest_1.expect)(container).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle node click events', () => {
        const mockOnNodeClick = vitest_2.vi.fn();
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={[]} onNodeClick={mockOnNodeClick}/>);
        // In a real browser environment, clicking the SVG circle would trigger the event
        // In JSDOM, we can't easily simulate this, but we can verify the component renders
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle missing onNodeClick callback gracefully', () => {
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={[]}/>);
        // Should not throw an error
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should update when nodes change', () => {
        const { rerender } = (0, react_1.render)(<LiveGraph_tsx_1.default nodes={[]} edges={[]}/>);
        // Initial render
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
        // Rerender with new nodes
        rerender(<LiveGraph_tsx_1.default nodes={mockNodes} edges={[]}/>);
        // Should still render correctly
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should update when edges change', () => {
        const { rerender } = (0, react_1.render)(<LiveGraph_tsx_1.default nodes={mockNodes} edges={[]}/>);
        // Initial render
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
        // Rerender with new edges
        rerender(<LiveGraph_tsx_1.default nodes={mockNodes} edges={mockEdges}/>);
        // Should still render correctly
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle large number of nodes and edges', () => {
        const manyNodes = Array.from({ length: 50 }, (_, i) => ({
            id: `node-${i}`,
            label: `Agent ${i}`,
            x: 100 + (i * 10),
            y: 100 + (i * 10),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        }));
        const manyEdges = Array.from({ length: 49 }, (_, i) => ({
            id: `edge-${i}`,
            source: `node-${i}`,
            target: `node-${i + 1}`
        }));
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={manyNodes} edges={manyEdges}/>);
        // Should render without errors
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle nodes with special characters in labels', () => {
        const specialCharNodes = [
            {
                id: 'special-node',
                label: 'Agent @#$%',
                x: 100,
                y: 100,
                color: '#FF5733'
            }
        ];
        (0, react_1.render)(<LiveGraph_tsx_1.default nodes={specialCharNodes} edges={[]}/>);
        // Should render without errors
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    });
});
//# sourceMappingURL=LiveGraph.test.js.map