"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
const Dashboard_tsx_1 = __importDefault(require("../../ui/Dashboard.tsx"));
const dashboard_context_tsx_1 = require("../../ui/state/dashboard.context.tsx");
require("@testing-library/jest-dom");
const react_2 = __importDefault(require("react"));
(0, vitest_1.describe)('Dashboard', () => {
    const renderWithProvider = (component) => {
        return (0, react_1.render)(<dashboard_context_tsx_1.DashboardProvider>{component}</dashboard_context_tsx_1.DashboardProvider>);
    };
    // Mock child components to prevent actual rendering
    vitest_2.vi.mock('../../ui/components/LiveGraph.tsx', () => {
        return {
            default: function MockLiveGraph() {
                return <div data-testid="live-graph">Live Graph Component</div>;
            }
        };
    });
    vitest_2.vi.mock('../../ui/components/ControlPanel.tsx', () => {
        return {
            default: function MockControlPanel() {
                return <div data-testid="control-panel">Control Panel Component</div>;
            }
        };
    });
    vitest_2.vi.mock('../../ui/components/AgentAvatars.tsx', () => {
        return {
            default: function MockAgentAvatars() {
                return <div data-testid="agent-avatars">Agent Avatars Component</div>;
            }
        };
    });
    vitest_2.vi.mock('../../ui/components/SpeechBubbles.tsx', () => {
        return {
            default: function MockSpeechBubbles() {
                return <div data-testid="speech-bubbles">Speech Bubbles Component</div>;
            }
        };
    });
    (0, vitest_1.it)('should render the dashboard layout correctly', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Check main heading
        (0, vitest_1.expect)(react_1.screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
        // Check all major components are rendered
        (0, vitest_1.expect)(react_1.screen.getByTestId('live-graph')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('control-panel')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('agent-avatars')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('speech-bubbles')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should apply correct CSS classes and structure', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Check main container
        const dashboardContainer = react_1.screen.getByText('LAPA Swarm Dashboard').closest('.dashboard');
        (0, vitest_1.expect)(dashboardContainer).toBeInTheDocument();
        (0, vitest_1.expect)(dashboardContainer).toHaveClass('p-6', 'bg-gray-50', 'min-h-screen');
        // Check header
        const header = react_1.screen.getByText('LAPA Swarm Dashboard').closest('header');
        (0, vitest_1.expect)(header).toBeInTheDocument();
        (0, vitest_1.expect)(header).toHaveClass('mb-8');
        // Check grid layout
        const gridContainer = react_1.screen.getByTestId('live-graph').closest('.grid');
        (0, vitest_1.expect)(gridContainer).toBeInTheDocument();
        (0, vitest_1.expect)(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'gap-6', 'mb-6');
    });
    (0, vitest_1.it)('should render all dashboard sections', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Check main title
        (0, vitest_1.expect)(react_1.screen.getByRole('heading', { level: 1, name: 'LAPA Swarm Dashboard' })).toBeInTheDocument();
        // Check for all component placeholders
        (0, vitest_1.expect)(react_1.screen.getByText('Live Graph Component')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Control Panel Component')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Agent Avatars Component')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Speech Bubbles Component')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should maintain responsive design', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Check responsive grid classes
        const gridContainer = react_1.screen.getByTestId('live-graph').closest('.grid');
        (0, vitest_1.expect)(gridContainer).toHaveClass('grid-cols-1'); // Mobile first
        (0, vitest_1.expect)(gridContainer).toHaveClass('lg:grid-cols-2'); // Desktop
        // Check responsive spacing
        const header = react_1.screen.getByText('LAPA Swarm Dashboard').closest('header');
        (0, vitest_1.expect)(header).toHaveClass('mb-8');
        const gridSections = react_1.screen.getByTestId('live-graph').closest('.grid');
        (0, vitest_1.expect)(gridSections).toHaveClass('gap-6');
    });
    (0, vitest_1.it)('should handle empty states gracefully', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Dashboard should render even with no data
        (0, vitest_1.expect)(react_1.screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
        // All components should still render
        (0, vitest_1.expect)(react_1.screen.getByTestId('live-graph')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('control-panel')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('agent-avatars')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('speech-bubbles')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should have proper accessibility attributes', () => {
        renderWithProvider(<Dashboard_tsx_1.default />);
        // Check main landmark
        const main = react_1.screen.getByRole('main');
        (0, vitest_1.expect)(main).toBeInTheDocument();
        // Check heading structure
        const h1 = react_1.screen.getByRole('heading', { level: 1 });
        (0, vitest_1.expect)(h1).toBeInTheDocument();
        (0, vitest_1.expect)(h1).toHaveTextContent('LAPA Swarm Dashboard');
        // Check region roles for major sections
        (0, vitest_1.expect)(react_1.screen.getByTestId('live-graph').closest('[role="region"]')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByTestId('control-panel').closest('[role="region"]')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should render consistently across multiple mounts', () => {
        const { unmount, rerender } = renderWithProvider(<Dashboard_tsx_1.default />);
        // First render
        (0, vitest_1.expect)(react_1.screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
        // Unmount and remount
        unmount();
        rerender(<dashboard_context_tsx_1.DashboardProvider><Dashboard_tsx_1.default /></dashboard_context_tsx_1.DashboardProvider>);
        // Should render the same content
        (0, vitest_1.expect)(react_1.screen.getByText('LAPA Swarm Dashboard')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should not crash with missing components', () => {
        // For this test, we'll just verify the dashboard renders without our mocks
        // In a real scenario, we'd want to test error boundaries
        (0, vitest_1.expect)(() => {
            renderWithProvider(<Dashboard_tsx_1.default />);
        }).not.toThrow();
    });
});
//# sourceMappingURL=Dashboard.test.js.map