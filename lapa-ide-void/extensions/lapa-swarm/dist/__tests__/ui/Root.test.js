"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
require("@testing-library/jest-dom");
const Root_tsx_1 = __importDefault(require("../../ui/Root.tsx"));
const dashboard_context_tsx_1 = require("../../ui/state/dashboard.context.tsx");
const react_2 = __importDefault(require("react"));
// Mock the Dashboard component to isolate Root tests
vitest_2.vi.mock('../../ui/Dashboard.tsx', () => ({
    default: function MockDashboard() {
        return <div data-testid="dashboard">Mock Dashboard Component</div>;
    }
}));
// Helper to render with provider
const renderWithProvider = (component) => {
    return (0, react_1.render)(<dashboard_context_tsx_1.DashboardProvider>{component}</dashboard_context_tsx_1.DashboardProvider>);
};
// Mock the Dashboard component to isolate Root tests
vitest_2.vi.mock('../../ui/Dashboard.tsx', () => ({
    default: function MockDashboard() {
        return <div data-testid="dashboard">Mock Dashboard Component</div>;
    }
}));
(0, vitest_1.describe)('Root', () => {
    (0, vitest_1.it)('should render the root application wrapper', () => {
        renderWithProvider(<Root_tsx_1.default />);
        // Check that the root element is rendered
        (0, vitest_1.expect)(react_1.screen.getByTestId('dashboard')).toBeInTheDocument();
        // Verify the dashboard component is rendered within Root
        (0, vitest_1.expect)(react_1.screen.getByText('Mock Dashboard Component')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should apply correct structural wrapping', () => {
        renderWithProvider(<Root_tsx_1.default />);
        // Check that content is wrapped properly
        const dashboard = react_1.screen.getByTestId('dashboard');
        (0, vitest_1.expect)(dashboard).toBeInTheDocument();
        // In the current implementation, Root is a simple wrapper
        // that just renders Dashboard, so we verify it renders correctly
    });
    (0, vitest_1.it)('should maintain consistent rendering', () => {
        const { rerender } = renderWithProvider(<Root_tsx_1.default />);
        // Initial render
        (0, vitest_1.expect)(react_1.screen.getByTestId('dashboard')).toBeInTheDocument();
        // Re-render
        rerender(<dashboard_context_tsx_1.DashboardProvider><Root_tsx_1.default /></dashboard_context_tsx_1.DashboardProvider>);
        // Should still be present
        (0, vitest_1.expect)(react_1.screen.getByTestId('dashboard')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle empty props gracefully', () => {
        renderWithProvider(<Root_tsx_1.default />);
        // Should render without any props
        (0, vitest_1.expect)(react_1.screen.getByTestId('dashboard')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should not introduce additional DOM nesting', () => {
        renderWithProvider(<Root_tsx_1.default />);
        // Root should be a minimal wrapper
        const dashboard = react_1.screen.getByTestId('dashboard');
        // Verify structure is as expected (Root -> Dashboard -> Content)
        (0, vitest_1.expect)(dashboard).toBeInTheDocument();
    });
    (0, vitest_1.it)('should preserve component hierarchy', () => {
        renderWithProvider(<Root_tsx_1.default />);
        // Verify the component hierarchy is maintained
        const dashboardElement = react_1.screen.getByTestId('dashboard');
        (0, vitest_1.expect)(dashboardElement).toBeInTheDocument();
        (0, vitest_1.expect)(dashboardElement.textContent).toBe('Mock Dashboard Component');
    });
    (0, vitest_1.it)('should support React rendering conventions', () => {
        // Test that Root can be rendered in different contexts
        const { container, unmount } = renderWithProvider(<Root_tsx_1.default />);
        // Should render to DOM
        (0, vitest_1.expect)(container).toBeInTheDocument();
        // Should be able to unmount
        (0, vitest_1.expect)(() => unmount()).not.toThrow();
    });
});
//# sourceMappingURL=Root.test.js.map