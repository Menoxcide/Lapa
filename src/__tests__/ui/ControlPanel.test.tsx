import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ControlPanel from '../../ui/components/ControlPanel.tsx';

describe('ControlPanel', () => {
  it('should render control panel with pause button when running', () => {
    render(<ControlPanel isRunning={true} />);
    
    expect(screen.getByText('Swarm Controls')).toBeInTheDocument();
    expect(screen.getByText('⏸️ Pause Swarm')).toBeInTheDocument();
    expect(screen.queryByText('▶️ Resume Swarm')).not.toBeInTheDocument();
  });

  it('should render control panel with resume button when not running', () => {
    render(<ControlPanel isRunning={false} />);
    
    expect(screen.getByText('Swarm Controls')).toBeInTheDocument();
    expect(screen.getByText('▶️ Resume Swarm')).toBeInTheDocument();
    expect(screen.queryByText('⏸️ Pause Swarm')).not.toBeInTheDocument();
  });

  it('should call onPause when pause button is clicked', () => {
    const mockPause = vi.fn();
    render(<ControlPanel isRunning={true} onPause={mockPause} />);
    
    const pauseButton = screen.getByText('⏸️ Pause Swarm');
    fireEvent.click(pauseButton);
    
    expect(mockPause).toHaveBeenCalled();
  });

  it('should call onResume when resume button is clicked', () => {
    const mockResume = vi.fn();
    render(<ControlPanel isRunning={false} onResume={mockResume} />);
    
    const resumeButton = screen.getByText('▶️ Resume Swarm');
    fireEvent.click(resumeButton);
    
    expect(mockResume).toHaveBeenCalled();
  });

  it('should call onRedirect when redirect button is clicked', () => {
    const mockRedirect = vi.fn();
    render(<ControlPanel isRunning={true} onRedirect={mockRedirect} />);
    
    const redirectButton = screen.getByText('🔀 Redirect Task');
    fireEvent.click(redirectButton);
    
    expect(mockRedirect).toHaveBeenCalled();
  });

  it('should call onReset when reset button is clicked', () => {
    const mockReset = vi.fn();
    render(<ControlPanel isRunning={true} onReset={mockReset} />);
    
    const resetButton = screen.getByText('🔄 Reset Swarm');
    fireEvent.click(resetButton);
    
    expect(mockReset).toHaveBeenCalled();
  });

  it('should render quick action buttons', () => {
    render(<ControlPanel isRunning={true} />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add Agent')).toBeInTheDocument();
    expect(screen.getByText('Export Logs')).toBeInTheDocument();
    expect(screen.getByText('View Metrics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should apply correct CSS classes to buttons', () => {
    render(<ControlPanel isRunning={true} />);
    
    const pauseButton = screen.getByText('⏸️ Pause Swarm');
    expect(pauseButton).toHaveClass('bg-yellow-500', 'text-white', 'rounded-md');
    
    const redirectButton = screen.getByText('🔀 Redirect Task');
    expect(redirectButton).toHaveClass('bg-blue-500', 'text-white', 'rounded-md');
    
    const resetButton = screen.getByText('🔄 Reset Swarm');
    expect(resetButton).toHaveClass('bg-red-500', 'text-white', 'rounded-md');
  });

  it('should apply hover effects to buttons', () => {
    render(<ControlPanel isRunning={true} />);
    
    const pauseButton = screen.getByText('⏸️ Pause Swarm');
    expect(pauseButton).toHaveClass('hover:bg-yellow-600');
    
    const redirectButton = screen.getByText('🔀 Redirect Task');
    expect(redirectButton).toHaveClass('hover:bg-blue-600');
    
    const resetButton = screen.getByText('🔄 Reset Swarm');
    expect(resetButton).toHaveClass('hover:bg-red-600');
  });

  it('should render quick action buttons with correct styling', () => {
    render(<ControlPanel isRunning={true} />);
    
    const quickActionButtons = screen.getAllByRole('button').slice(4); // Skip main control buttons
    quickActionButtons.forEach(button => {
      expect(button).toHaveClass('bg-gray-100', 'rounded-md', 'hover:bg-gray-200');
    });
  });

  it('should handle missing callback functions gracefully', () => {
    render(<ControlPanel isRunning={true} />);
    
    const pauseButton = screen.getByText('⏸️ Pause Swarm');
    fireEvent.click(pauseButton);
    
    // Should not throw an error
    expect(true).toBe(true);
  });

  it('should render in a container with correct classes', () => {
    render(<ControlPanel isRunning={true} />);
    
    const container = screen.getByText('Swarm Controls').closest('.control-panel');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-4');
  });

  it('should display correct icons for all main controls', () => {
    render(<ControlPanel isRunning={true} />);
    
    expect(screen.getByText('⏸️')).toBeInTheDocument();
    expect(screen.getByText('🔀')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });

  it('should display correct icons for resume state', () => {
    render(<ControlPanel isRunning={false} />);
    
    expect(screen.getByText('▶️')).toBeInTheDocument();
    expect(screen.getByText('🔀')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });
});