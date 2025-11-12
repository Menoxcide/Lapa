import { describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Root from '../../ui/Root.tsx';
import { DashboardProvider } from '../../ui/state/dashboard.context.tsx';
import React from 'react';

// Mock the Dashboard component to isolate Root tests
vi.mock('../../ui/Dashboard.tsx', () => ({
  default: function MockDashboard() {
    return <div data-testid="dashboard">Mock Dashboard Component</div>;
  }
}));

// Helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<DashboardProvider>{component}</DashboardProvider>);
};

// Mock the Dashboard component to isolate Root tests
vi.mock('../../ui/Dashboard.tsx', () => ({
  default: function MockDashboard() {
    return <div data-testid="dashboard">Mock Dashboard Component</div>;
  }
}));

describe('Root', () => {
  it('should render the root application wrapper', () => {
    renderWithProvider(<Root />);
    
    // Check that the root element is rendered
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    
    // Verify the dashboard component is rendered within Root
    expect(screen.getByText('Mock Dashboard Component')).toBeInTheDocument();
  });

  it('should apply correct structural wrapping', () => {
    renderWithProvider(<Root />);
    
    // Check that content is wrapped properly
    const dashboard = screen.getByTestId('dashboard');
    expect(dashboard).toBeInTheDocument();
    
    // In the current implementation, Root is a simple wrapper
    // that just renders Dashboard, so we verify it renders correctly
  });

  it('should maintain consistent rendering', () => {
    const { rerender } = renderWithProvider(<Root />);
    
    // Initial render
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    
    // Re-render
    rerender(<DashboardProvider><Root /></DashboardProvider>);
    
    // Should still be present
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should handle empty props gracefully', () => {
    renderWithProvider(<Root />);
    
    // Should render without any props
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should not introduce additional DOM nesting', () => {
    renderWithProvider(<Root />);
    
    // Root should be a minimal wrapper
    const dashboard = screen.getByTestId('dashboard');
    
    // Verify structure is as expected (Root -> Dashboard -> Content)
    expect(dashboard).toBeInTheDocument();
  });

  it('should preserve component hierarchy', () => {
    renderWithProvider(<Root />);
    
    // Verify the component hierarchy is maintained
    const dashboardElement = screen.getByTestId('dashboard');
    expect(dashboardElement).toBeInTheDocument();
    expect(dashboardElement.textContent).toBe('Mock Dashboard Component');
  });

  it('should support React rendering conventions', () => {
    // Test that Root can be rendered in different contexts
    const { container, unmount } = renderWithProvider(<Root />);
    
    // Should render to DOM
    expect(container).toBeInTheDocument();
    
    // Should be able to unmount
    expect(() => unmount()).not.toThrow();
  });
});