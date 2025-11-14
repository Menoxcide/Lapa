"use strict";
// Tests for Skill Manager component
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
const SkillManager_1 = __importDefault(require("../../ui/components/SkillManager"));
// Mock the yamlAgentLoader
jest.mock('../../core/yaml-agent-loader', () => ({
    yamlAgentLoader: {
        loadConfig: jest.fn(),
        saveConfig: jest.fn()
    }
}));
describe('SkillManager', () => {
    const mockOnClose = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should render loading state initially', async () => {
        // Mock loadConfig to delay resolution
        const { loadConfig } = require('../../core/yaml-agent-loader');
        loadConfig.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ agents: {} }), 100)));
        (0, react_2.render)(<SkillManager_1.default onClose={mockOnClose}/>);
        // Should show loading state
        expect(react_2.screen.getByText('Loading skills...')).toBeInTheDocument();
    });
    it('should render empty state when no skills exist', async () => {
        // Mock loadConfig to return empty agents
        const { loadConfig } = require('../../core/yaml-agent-loader');
        loadConfig.mockResolvedValue({ agents: {} });
        (0, react_2.render)(<SkillManager_1.default onClose={mockOnClose}/>);
        // Wait for loading to complete
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('No skills')).toBeInTheDocument();
        });
        // Should show empty state
        expect(react_2.screen.getByText('No skills')).toBeInTheDocument();
        expect(react_2.screen.getByText('Get started by creating a new skill.')).toBeInTheDocument();
    });
    it('should render skills when they exist', async () => {
        // Mock loadConfig to return some agents
        const { loadConfig } = require('../../core/yaml-agent-loader');
        loadConfig.mockResolvedValue({
            agents: {
                'code-reviewer': {
                    role: 'Code Reviewer',
                    goal: 'Review code for quality and best practices',
                    backstory: 'Expert code reviewer with 10 years experience',
                    model: 'DeepSeek-R1-671B',
                    capabilities: ['code-review', 'linting'],
                    tools: ['code-analyzer', 'security-scanner']
                },
                'tester': {
                    role: 'Tester',
                    goal: 'Ensure code quality through comprehensive testing',
                    model: 'GLM-4.5-Air',
                    capabilities: ['testing', 'tdd'],
                    tools: ['test-generator', 'test-runner']
                }
            }
        });
        (0, react_2.render)(<SkillManager_1.default onClose={mockOnClose}/>);
        // Wait for loading to complete
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Code Reviewer')).toBeInTheDocument();
        });
        // Should show the skills
        expect(react_2.screen.getByText('Code Reviewer')).toBeInTheDocument();
        expect(react_2.screen.getByText('Review code for quality and best practices')).toBeInTheDocument();
        expect(react_2.screen.getByText('Tester')).toBeInTheDocument();
        expect(react_2.screen.getByText('Ensure code quality through comprehensive testing')).toBeInTheDocument();
        // Should show capabilities and tools
        expect(react_2.screen.getByText('code-review')).toBeInTheDocument();
        expect(react_2.screen.getByText('linting')).toBeInTheDocument();
        expect(react_2.screen.getByText('code-analyzer')).toBeInTheDocument();
        expect(react_2.screen.getByText('security-scanner')).toBeInTheDocument();
        expect(react_2.screen.getByText('testing')).toBeInTheDocument();
        expect(react_2.screen.getByText('tdd')).toBeInTheDocument();
        expect(react_2.screen.getByText('test-generator')).toBeInTheDocument();
        expect(react_2.screen.getByText('test-runner')).toBeInTheDocument();
    });
    it('should show model information', async () => {
        // Mock loadConfig to return an agent with model info
        const { loadConfig } = require('../../core/yaml-agent-loader');
        loadConfig.mockResolvedValue({
            agents: {
                'code-reviewer': {
                    role: 'Code Reviewer',
                    goal: 'Review code for quality and best practices',
                    model: 'DeepSeek-R1-671B'
                }
            }
        });
        (0, react_2.render)(<SkillManager_1.default onClose={mockOnClose}/>);
        // Wait for loading to complete
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Code Reviewer')).toBeInTheDocument();
        });
        // Should show model information
        expect(react_2.screen.getByText('Model: DeepSeek-R1-671B')).toBeInTheDocument();
    });
    it('should show default model when none specified', async () => {
        // Mock loadConfig to return an agent without model info
        const { loadConfig } = require('../../core/yaml-agent-loader');
        loadConfig.mockResolvedValue({
            agents: {
                'code-reviewer': {
                    role: 'Code Reviewer',
                    goal: 'Review code for quality and best practices'
                    // No model specified
                }
            }
        });
        (0, react_2.render)(<SkillManager_1.default onClose={mockOnClose}/>);
        // Wait for loading to complete
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Code Reviewer')).toBeInTheDocument();
        });
        // Should show default model
        expect(react_2.screen.getByText('Model: Default')).toBeInTheDocument();
    });
});
//# sourceMappingURL=SkillManager.test.js.map