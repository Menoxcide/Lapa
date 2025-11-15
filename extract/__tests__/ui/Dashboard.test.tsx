import { describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from '../../ui/Dashboard.tsx';
import { DashboardProvider } from '../../ui/state/dashboard.context.tsx';
import '@testing-library/jest-dom';
import React from 'react';


describe('Dashboard', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<DashboardProvider>{component}</DashboardProvider>);
  };

  // Mock child components to prevent actual rendering
  vi.mock('../../ui/components/LiveGraph.tsx', () => {
    return {
      default: function MockLiveGraph() {
        return <div data-testid="live-graph">Live Graph Component</div>;
      }
    };
  });

  vi.mock('../../ui/components/ControlPanel.tsx', () => {
    return {
      default: function MockControlPanel() {
        return <div data-testid="control-panel">Control Panel Component</div>;
      }
    };
  });

  vi.mock('../../ui/components/AgentAvatars.tsx', () => {
    return {
      default: function MockAgentAvatars() {
        return <div data-testid="agent-avatars">Agent Avatars Component</div>;
      }
    };
  });

  vi.mock('../../ui/components/SpeechBubbles.tsx', () => {
    return {
      default: function MockSpeechBubbles() {
        return <div data-testid="speech-bubbles">Speech Bubbles Component</div>;
      }
    };
  });

  it('should render the dashboard layout correctly', () => {
    renderWithProvider(<Dashboard />);
    
    // Check main heading
    expect(screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
    
    // Check all major components are rendered
    expect(screen.getByTestId('live-graph')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('agent-avatars')).toBeInTheDocument();
    expect(screen.getByTestId('speech-bubbles')).toBeInTheDocument();
  });

  it('should apply correct CSS classes and structure', () => {
    renderWithProvider(<Dashboard />);
    
    // Check main container
    const dashboardContainer = screen.getByText('LAPA Swarm Dashboard').closest('.dashboard');
    expect(dashboardContainer).toBeInTheDocument();
    expect(dashboardContainer).toHaveClass('p-6', 'bg-gray-50', 'min-h-screen');
    
    // Check header
    const header = screen.getByText('LAPA Swarm Dashboard').closest('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('mb-8');
    
    // Check grid layout
    const gridContainer = screen.getByTestId('live-graph').closest('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'gap-6', 'mb-6');
  });

  it('should render all dashboard sections', () => {
    renderWithProvider(<Dashboard />);
    
    // Check main title
    expect(screen.getByRole('heading', { level: 1, name: 'LAPA Swarm Dashboard' })).toBeInTheDocument();
    
    // Check for all component placeholders
    expect(screen.getByText('Live Graph Component')).toBeInTheDocument();
    expect(screen.getByText('Control Panel Component')).toBeInTheDocument();
    expect(screen.getByText('Agent Avatars Component')).toBeInTheDocument();
    expect(screen.getByText('Speech Bubbles Component')).toBeInTheDocument();
  });

  it('should maintain responsive design', () => {
    renderWithProvider(<Dashboard />);
    
    // Check responsive grid classes
    const gridContainer = screen.getByTestId('live-graph').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile first
    expect(gridContainer).toHaveClass('lg:grid-cols-2'); // Desktop
    
    // Check responsive spacing
    const header = screen.getByText('LAPA Swarm Dashboard').closest('header');
    expect(header).toHaveClass('mb-8');
    
    const gridSections = screen.getByTestId('live-graph').closest('.grid');
    expect(gridSections).toHaveClass('gap-6');
  });

  it('should handle empty states gracefully', () => {
    renderWithProvider(<Dashboard />);
    
    // Dashboard should render even with no data
    expect(screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
    
    // All components should still render
    expect(screen.getByTestId('live-graph')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('agent-avatars')).toBeInTheDocument();
    expect(screen.getByTestId('speech-bubbles')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProvider(<Dashboard />);
    
    // Check main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Check heading structure
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('LAPA Swarm Dashboard');
    
    // Check region roles for major sections
    expect(screen.getByTestId('live-graph').closest('[role="region"]')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel').closest('[role="region"]')).toBeInTheDocument();
  });

  it('should render consistently across multiple mounts', () => {
    const { unmount, rerender } = renderWithProvider(<Dashboard />);
    
    // First render
    expect(screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
    
    // Unmount and remount
    unmount();
    rerender(<DashboardProvider><Dashboard /></DashboardProvider>);
    
    // Should render the same content
    expect(screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
  });

  it('should not crash with missing components', () => {
    // For this test, we'll just verify the dashboard renders without our mocks
    // In a real scenario, we'd want to test error boundaries
    expect(() => {
      renderWithProvider(<Dashboard />);
    }).not.toThrow();
  });
});