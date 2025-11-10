import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '../../../src/ui/components/ControlPanel';
describe('ControlPanel', () => {
    const mockHandlers = {
        onPause: jest.fn(),
        onResume: jest.fn(),
        onRedirect: jest.fn(),
        onReset: jest.fn()
    };
    beforeEach(() => {
        // Clear all mocks before each test
        Object.values(mockHandlers).forEach(handler => handler.mockClear());
    });
    it('should render control panel with correct buttons when running', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        // Check that pause button is displayed
        expect(screen.getByText('Pause Swarm')).toBeInTheDocument();
        expect(screen.getByText('⏸️')).toBeInTheDocument();
        // Check that other buttons are present
        expect(screen.getByText('Redirect Task')).toBeInTheDocument();
        expect(screen.getByText('🔀')).toBeInTheDocument();
        expect(screen.getByText('Reset Swarm')).toBeInTheDocument();
        expect(screen.getByText('🔄')).toBeInTheDocument();
    });
    it('should render control panel with correct buttons when not running', () => {
        render(<ControlPanel isRunning={false} {...mockHandlers}/>);
        // Check that resume button is displayed
        expect(screen.getByText('Resume Swarm')).toBeInTheDocument();
        expect(screen.getByText('▶️')).toBeInTheDocument();
        // Check that other buttons are present
        expect(screen.getByText('Redirect Task')).toBeInTheDocument();
        expect(screen.getByText('Reset Swarm')).toBeInTheDocument();
    });
    it('should call onPause when pause button is clicked', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const pauseButton = screen.getByText('Pause Swarm');
        fireEvent.click(pauseButton);
        expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
        expect(mockHandlers.onResume).not.toHaveBeenCalled();
    });
    it('should call onResume when resume button is clicked', () => {
        render(<ControlPanel isRunning={false} {...mockHandlers}/>);
        const resumeButton = screen.getByText('Resume Swarm');
        fireEvent.click(resumeButton);
        expect(mockHandlers.onResume).toHaveBeenCalledTimes(1);
        expect(mockHandlers.onPause).not.toHaveBeenCalled();
    });
    it('should call onRedirect when redirect button is clicked', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const redirectButton = screen.getByText('Redirect Task');
        fireEvent.click(redirectButton);
        expect(mockHandlers.onRedirect).toHaveBeenCalledTimes(1);
    });
    it('should call onReset when reset button is clicked', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const resetButton = screen.getByText('Reset Swarm');
        fireEvent.click(resetButton);
        expect(mockHandlers.onReset).toHaveBeenCalledTimes(1);
    });
    it('should render quick action buttons', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        expect(screen.getByText('Add Agent')).toBeInTheDocument();
        expect(screen.getByText('Export Logs')).toBeInTheDocument();
        expect(screen.getByText('View Metrics')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    it('should apply correct CSS classes', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const container = screen.getByText('Swarm Controls').closest('.control-panel');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-4');
        const pauseButton = screen.getByText('Pause Swarm');
        expect(pauseButton).toHaveClass('px-4', 'py-2', 'bg-yellow-500', 'text-white', 'rounded-md');
    });
    it('should handle missing handler props gracefully', () => {
        // Render with some handlers missing
        render(<ControlPanel isRunning={true} onPause={mockHandlers.onPause}/>);
        const pauseButton = screen.getByText('Pause Swarm');
        fireEvent.click(pauseButton);
        expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
        // Other buttons should still render but won't have click handlers
        expect(screen.getByText('Redirect Task')).toBeInTheDocument();
        expect(screen.getByText('Reset Swarm')).toBeInTheDocument();
    });
    it('should render correct icons for all buttons', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        // Check all icons are present
        expect(screen.getByText('⏸️')).toBeInTheDocument(); // Pause
        expect(screen.getByText('🔀')).toBeInTheDocument(); // Redirect
        expect(screen.getByText('🔄')).toBeInTheDocument(); // Reset
        // Quick action icons aren't specified in the component, so we don't test them
    });
    it('should maintain button layout and styling', () => {
        render(<ControlPanel isRunning={false} {...mockHandlers}/>);
        const resumeButton = screen.getByText('Resume Swarm');
        expect(resumeButton).toHaveClass('bg-green-500');
        const redirectButton = screen.getByText('Redirect Task');
        expect(redirectButton).toHaveClass('bg-blue-500');
        const resetButton = screen.getByText('Reset Swarm');
        expect(resetButton).toHaveClass('bg-red-500');
    });
    it('should handle rapid successive clicks', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const pauseButton = screen.getByText('Pause Swarm');
        // Click multiple times rapidly
        fireEvent.click(pauseButton);
        fireEvent.click(pauseButton);
        fireEvent.click(pauseButton);
        // Handler should be called for each click
        expect(mockHandlers.onPause).toHaveBeenCalledTimes(3);
    });
    it('should display correct headings', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        expect(screen.getByText('Swarm Controls')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
    it('should render quick action buttons with correct styling', () => {
        render(<ControlPanel isRunning={true} {...mockHandlers}/>);
        const addButton = screen.getByText('Add Agent');
        expect(addButton).toHaveClass('px-3', 'py-2', 'bg-gray-100', 'rounded-md');
        const exportButton = screen.getByText('Export Logs');
        expect(exportButton).toHaveClass('bg-gray-100');
        // Check all quick action buttons are present
        const quickActions = screen.getAllByRole('button', { name: /Add Agent|Export Logs|View Metrics|Settings/ });
        expect(quickActions).toHaveLength(4);
    });
});
//# sourceMappingURL=ControlPanel.test.js.map