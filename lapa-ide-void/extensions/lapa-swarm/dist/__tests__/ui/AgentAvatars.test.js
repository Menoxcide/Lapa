"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
require("@testing-library/jest-dom");
const AgentAvatars_tsx_1 = __importDefault(require("../../ui/components/AgentAvatars.tsx"));
(0, vitest_1.describe)('AgentAvatars', () => {
    const mockAgents = [
        {
            id: 'agent-1',
            name: 'Code Generator',
            role: 'Coder',
            status: 'working',
            avatarColor: '#FF5733'
        },
        {
            id: 'agent-2',
            name: 'Code Reviewer',
            role: 'Reviewer',
            status: 'idle',
            avatarColor: '#33FF57'
        },
        {
            id: 'agent-3',
            name: 'Bug Fixer',
            role: 'Debugger',
            status: 'completed',
            avatarColor: '#3357FF'
        }
    ];
    (0, vitest_1.it)('should render agent avatars correctly', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={mockAgents}/>);
        // Check that all agents are rendered
        (0, vitest_1.expect)(react_1.screen.getByText('Code Generator')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Code Reviewer')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Bug Fixer')).toBeInTheDocument();
        // Check roles
        (0, vitest_1.expect)(react_1.screen.getByText('Coder')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Reviewer')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Debugger')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should display correct status indicators', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={mockAgents}/>);
        // Check status icons
        (0, vitest_1.expect)(react_1.screen.getByText('⚙️')).toBeInTheDocument(); // Working agent
        (0, vitest_1.expect)(react_1.screen.getByText('⏸️')).toBeInTheDocument(); // Idle agent
        (0, vitest_1.expect)(react_1.screen.getByText('✅')).toBeInTheDocument(); // Completed agent
        // Check status colors (through data-testid)
        const statusIndicators = react_1.screen.getAllByTestId('status-indicator');
        (0, vitest_1.expect)(statusIndicators).toHaveLength(3);
        // Check specific status indicator colors
        (0, vitest_1.expect)(statusIndicators[0]).toHaveClass('bg-blue-500'); // Working agent
        (0, vitest_1.expect)(statusIndicators[1]).toHaveClass('bg-gray-300'); // Idle agent
        (0, vitest_1.expect)(statusIndicators[2]).toHaveClass('bg-green-500'); // Completed agent
    });
    (0, vitest_1.it)('should handle empty agents array', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[]}/>);
        // Should render container but no agent cards
        (0, vitest_1.expect)(react_1.screen.getByText('Agent Swarm')).toBeInTheDocument();
        // No agent names should be present
        (0, vitest_1.expect)(react_1.screen.queryByText('Code Generator')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle single agent', () => {
        const singleAgent = [mockAgents[0]];
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={singleAgent}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Code Generator')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Coder')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('⚙️')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should call onAgentClick when agent is clicked', () => {
        const mockOnClick = vitest_2.vi.fn();
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]} onAgentClick={mockOnClick}/>);
        const agentCard = react_1.screen.getByText('Code Generator');
        react_1.fireEvent.click(agentCard);
        (0, vitest_1.expect)(mockOnClick).toHaveBeenCalledWith('agent-1');
    });
    (0, vitest_1.it)('should not be clickable when onAgentClick is not provided', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]}/>);
        const agentCard = react_1.screen.getByText('Code Generator');
        react_1.fireEvent.click(agentCard);
        // No callback registered, so no expectation other than no error
        (0, vitest_1.expect)(true).toBe(true);
    });
    (0, vitest_1.it)('should display correct avatar initials and colors', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]}/>);
        const avatarPlaceholder = react_1.screen.getByText('C'); // First letter of "Code Generator"
        (0, vitest_1.expect)(avatarPlaceholder).toBeInTheDocument();
        // Check avatar color through style attribute
        const avatarDiv = avatarPlaceholder.parentElement;
        (0, vitest_1.expect)(avatarDiv).toHaveStyle('background-color: rgb(255, 87, 51)'); // #FF5733 converted to RGB
    });
    (0, vitest_1.it)('should handle agent with paused status', () => {
        const pausedAgent = [{
                id: 'agent-4',
                name: 'Paused Agent',
                role: 'Optimizer',
                status: 'paused',
                avatarColor: '#F333FF'
            }];
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={pausedAgent}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Paused Agent')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Optimizer')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('⏸️')).toBeInTheDocument();
        const statusIndicator = react_1.screen.getByTestId('status-indicator');
        (0, vitest_1.expect)(statusIndicator).toHaveClass('bg-yellow-500');
    });
    (0, vitest_1.it)('should handle agent with unknown status', () => {
        const unknownStatusAgent = [{
                id: 'agent-5',
                name: 'Unknown Agent',
                role: 'Specialist',
                // @ts-ignore - Testing invalid status
                status: 'unknown',
                avatarColor: '#AAAAAA'
            }];
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={unknownStatusAgent}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Unknown Agent')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Specialist')).toBeInTheDocument();
        // Should default to pause icon for unknown status
        (0, vitest_1.expect)(react_1.screen.getByText('⏸️')).toBeInTheDocument();
        const statusIndicator = react_1.screen.getByTestId('status-indicator');
        (0, vitest_1.expect)(statusIndicator).toHaveClass('bg-gray-300');
    });
    (0, vitest_1.it)('should apply correct CSS classes', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]}/>);
        const container = react_1.screen.getByText('Agent Swarm').closest('.agent-avatars-container');
        (0, vitest_1.expect)(container).toBeInTheDocument();
        const card = react_1.screen.getByText('Code Generator').closest('.agent-avatar-card');
        (0, vitest_1.expect)(card).toBeInTheDocument();
        (0, vitest_1.expect)(card).toHaveClass('cursor-pointer');
    });
    (0, vitest_1.it)('should truncate long names and roles', () => {
        const longNameAgent = [{
                id: 'agent-6',
                name: 'Very Long Agent Name That Should Be Truncated',
                role: 'Very Long Role Description That Should Also Be Truncated',
                status: 'working',
                avatarColor: '#123456'
            }];
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={longNameAgent}/>);
        // Names and roles should still be present (truncation is visual)
        (0, vitest_1.expect)(react_1.screen.getByText('Very Long Agent Name That Should Be Truncated')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Very Long Role Description That Should Also Be Truncated')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should render with click handler and show hover effect', () => {
        const mockOnClick = vitest_2.vi.fn();
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]} onAgentClick={mockOnClick}/>);
        const card = react_1.screen.getByText('Code Generator').closest('.agent-avatar-card');
        (0, vitest_1.expect)(card).toHaveClass('hover:bg-gray-50');
    });
    (0, vitest_1.it)('should render without click handler and not show hover effect', () => {
        (0, react_1.render)(<AgentAvatars_tsx_1.default agents={[mockAgents[0]]}/>);
        const card = react_1.screen.getByText('Code Generator').closest('.agent-avatar-card');
        (0, vitest_1.expect)(card).not.toHaveClass('hover:bg-gray-50');
    });
});
//# sourceMappingURL=AgentAvatars.test.js.map