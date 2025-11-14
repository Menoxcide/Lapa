"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
require("@testing-library/jest-dom");
const ControlPanel_tsx_1 = __importDefault(require("../../ui/components/ControlPanel.tsx"));
(0, vitest_1.describe)('ControlPanel', () => {
    (0, vitest_1.it)('should render control panel with pause button when running', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Controls')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('⏸️ Pause Swarm')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.queryByText('▶️ Resume Swarm')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('should render control panel with resume button when not running', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={false}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Swarm Controls')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('▶️ Resume Swarm')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.queryByText('⏸️ Pause Swarm')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('should call onPause when pause button is clicked', () => {
        const mockPause = vitest_2.vi.fn();
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true} onPause={mockPause}/>);
        const pauseButton = react_1.screen.getByText('⏸️ Pause Swarm');
        react_1.fireEvent.click(pauseButton);
        (0, vitest_1.expect)(mockPause).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call onResume when resume button is clicked', () => {
        const mockResume = vitest_2.vi.fn();
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={false} onResume={mockResume}/>);
        const resumeButton = react_1.screen.getByText('▶️ Resume Swarm');
        react_1.fireEvent.click(resumeButton);
        (0, vitest_1.expect)(mockResume).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call onRedirect when redirect button is clicked', () => {
        const mockRedirect = vitest_2.vi.fn();
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true} onRedirect={mockRedirect}/>);
        const redirectButton = react_1.screen.getByText('🔀 Redirect Task');
        react_1.fireEvent.click(redirectButton);
        (0, vitest_1.expect)(mockRedirect).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call onReset when reset button is clicked', () => {
        const mockReset = vitest_2.vi.fn();
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true} onReset={mockReset}/>);
        const resetButton = react_1.screen.getByText('🔄 Reset Swarm');
        react_1.fireEvent.click(resetButton);
        (0, vitest_1.expect)(mockReset).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should render quick action buttons', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Quick Actions')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Add Agent')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Export Logs')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('View Metrics')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Settings')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should apply correct CSS classes to buttons', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        const pauseButton = react_1.screen.getByText('⏸️ Pause Swarm');
        (0, vitest_1.expect)(pauseButton).toHaveClass('bg-yellow-500', 'text-white', 'rounded-md');
        const redirectButton = react_1.screen.getByText('🔀 Redirect Task');
        (0, vitest_1.expect)(redirectButton).toHaveClass('bg-blue-500', 'text-white', 'rounded-md');
        const resetButton = react_1.screen.getByText('🔄 Reset Swarm');
        (0, vitest_1.expect)(resetButton).toHaveClass('bg-red-500', 'text-white', 'rounded-md');
    });
    (0, vitest_1.it)('should apply hover effects to buttons', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        const pauseButton = react_1.screen.getByText('⏸️ Pause Swarm');
        (0, vitest_1.expect)(pauseButton).toHaveClass('hover:bg-yellow-600');
        const redirectButton = react_1.screen.getByText('🔀 Redirect Task');
        (0, vitest_1.expect)(redirectButton).toHaveClass('hover:bg-blue-600');
        const resetButton = react_1.screen.getByText('🔄 Reset Swarm');
        (0, vitest_1.expect)(resetButton).toHaveClass('hover:bg-red-600');
    });
    (0, vitest_1.it)('should render quick action buttons with correct styling', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        const quickActionButtons = react_1.screen.getAllByRole('button').slice(4); // Skip main control buttons
        quickActionButtons.forEach(button => {
            (0, vitest_1.expect)(button).toHaveClass('bg-gray-100', 'rounded-md', 'hover:bg-gray-200');
        });
    });
    (0, vitest_1.it)('should handle missing callback functions gracefully', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        const pauseButton = react_1.screen.getByText('⏸️ Pause Swarm');
        react_1.fireEvent.click(pauseButton);
        // Should not throw an error
        (0, vitest_1.expect)(true).toBe(true);
    });
    (0, vitest_1.it)('should render in a container with correct classes', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        const container = react_1.screen.getByText('Swarm Controls').closest('.control-panel');
        (0, vitest_1.expect)(container).toBeInTheDocument();
        (0, vitest_1.expect)(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-4');
    });
    (0, vitest_1.it)('should display correct icons for all main controls', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={true}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('⏸️')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('🔀')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('🔄')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should display correct icons for resume state', () => {
        (0, react_1.render)(<ControlPanel_tsx_1.default isRunning={false}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('▶️')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('🔀')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('🔄')).toBeInTheDocument();
    });
});
//# sourceMappingURL=ControlPanel.test.js.map