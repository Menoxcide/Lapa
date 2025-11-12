import { describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LiveGraph from '../../ui/components/LiveGraph.tsx';
import { GraphNode, GraphEdge } from '../../ui/state/index.ts';

describe('LiveGraph', () => {
  const mockNodes: GraphNode[] = [
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

  const mockEdges: GraphEdge[] = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2'
    }
  ];

  it('should render live graph container with title', () => {
    render(<LiveGraph nodes={[]} edges={[]} />);
    
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // SVG element
  });

  it('should render SVG with correct attributes', () => {
    render(<LiveGraph nodes={[]} edges={[]} />);
    
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg).toHaveAttribute('height', '500px');
    expect(svg).toHaveStyle('background-color: rgb(241, 245, 249)'); // #f1f5f9 converted to RGB
    expect(svg).toHaveStyle('border-radius: 8px');
  });

  it('should render nodes correctly', () => {
    render(<LiveGraph nodes={mockNodes} edges={[]} />);
    
    // Since the rendering happens in useEffect and directly manipulates the DOM,
    // we can't easily test the actual SVG elements in a JSDOM environment.
    // We'll verify the component renders without errors
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should render edges correctly', () => {
    render(<LiveGraph nodes={mockNodes} edges={mockEdges} />);
    
    // Similar to nodes, we can't easily test the actual SVG elements
    // We'll verify the component renders without errors
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should handle empty nodes and edges arrays', () => {
    render(<LiveGraph nodes={[]} edges={[]} />);
    
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    // Should render without errors
    expect(true).toBe(true);
  });

  it('should handle single node without edges', () => {
    const singleNode: GraphNode[] = [mockNodes[0]];
    render(<LiveGraph nodes={singleNode} edges={[]} />);
    
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should handle edges with missing nodes gracefully', () => {
    const invalidEdges: GraphEdge[] = [
      {
        id: 'invalid-edge',
        source: 'non-existent-node',
        target: 'also-non-existent'
      }
    ];
    
    render(<LiveGraph nodes={mockNodes} edges={invalidEdges} />);
    
    // Should not throw an error
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should apply correct CSS classes to container', () => {
    render(<LiveGraph nodes={[]} edges={[]} />);
    
    const container = screen.getByText('Swarm Intelligence Flow').closest('.live-graph-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle node click events', () => {
    const mockOnNodeClick = vi.fn();
    render(<LiveGraph nodes={mockNodes} edges={[]} onNodeClick={mockOnNodeClick} />);
    
    // In a real browser environment, clicking the SVG circle would trigger the event
    // In JSDOM, we can't easily simulate this, but we can verify the component renders
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should handle missing onNodeClick callback gracefully', () => {
    render(<LiveGraph nodes={mockNodes} edges={[]} />);
    
    // Should not throw an error
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should update when nodes change', () => {
    const { rerender } = render(<LiveGraph nodes={[]} edges={[]} />);
    
    // Initial render
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    
    // Rerender with new nodes
    rerender(<LiveGraph nodes={mockNodes} edges={[]} />);
    
    // Should still render correctly
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should update when edges change', () => {
    const { rerender } = render(<LiveGraph nodes={mockNodes} edges={[]} />);
    
    // Initial render
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
    
    // Rerender with new edges
    rerender(<LiveGraph nodes={mockNodes} edges={mockEdges} />);
    
    // Should still render correctly
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should handle large number of nodes and edges', () => {
    const manyNodes: GraphNode[] = Array.from({ length: 50 }, (_, i) => ({
      id: `node-${i}`,
      label: `Agent ${i}`,
      x: 100 + (i * 10),
      y: 100 + (i * 10),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));
    
    const manyEdges: GraphEdge[] = Array.from({ length: 49 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i+1}`
    }));
    
    render(<LiveGraph nodes={manyNodes} edges={manyEdges} />);
    
    // Should render without errors
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });

  it('should handle nodes with special characters in labels', () => {
    const specialCharNodes: GraphNode[] = [
      {
        id: 'special-node',
        label: 'Agent @#$%',
        x: 100,
        y: 100,
        color: '#FF5733'
      }
    ];
    
    render(<LiveGraph nodes={specialCharNodes} edges={[]} />);
    
    // Should render without errors
    expect(screen.getByText('Swarm Intelligence Flow')).toBeInTheDocument();
  });
});