"use strict";
// Tests for Skill Creator Form component
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
const SkillCreatorForm_1 = __importDefault(require("../../ui/components/SkillCreatorForm"));
describe('SkillCreatorForm', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should render form fields correctly', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        // Check that all form fields are present
        expect(react_2.screen.getByLabelText('Role *')).toBeInTheDocument();
        expect(react_2.screen.getByLabelText('Goal *')).toBeInTheDocument();
        expect(react_2.screen.getByLabelText('Backstory')).toBeInTheDocument();
        expect(react_2.screen.getByLabelText('Model')).toBeInTheDocument();
        // Check that capability and tool sections are present
        expect(react_2.screen.getByText('Capabilities')).toBeInTheDocument();
        expect(react_2.screen.getByText('Tools')).toBeInTheDocument();
        // Check that buttons are present
        expect(react_2.screen.getByText('Cancel')).toBeInTheDocument();
        expect(react_2.screen.getByText('Create Skill')).toBeInTheDocument();
    });
    it('should call onCancel when cancel button is clicked', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        const cancelButton = react_2.screen.getByText('Cancel');
        react_2.fireEvent.click(cancelButton);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
    it('should show validation errors for required fields', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        const submitButton = react_2.screen.getByText('Create Skill');
        react_2.fireEvent.click(submitButton);
        // Should show error messages for required fields
        expect(react_2.screen.getByText('Role is required')).toBeInTheDocument();
        expect(react_2.screen.getByText('Goal is required')).toBeInTheDocument();
    });
    it('should add and remove capabilities', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        // Add a capability
        const capabilityInput = react_2.screen.getByPlaceholderText('Add a capability');
        react_2.fireEvent.change(capabilityInput, { target: { value: 'code-generation' } });
        const addCapabilityButton = react_2.screen.getByText('Add');
        react_2.fireEvent.click(addCapabilityButton);
        // Check that the capability was added
        expect(react_2.screen.getByText('code-generation')).toBeInTheDocument();
        // Remove the capability
        const removeCapabilityButton = react_2.screen.getByText('code-generation').querySelector('button');
        if (removeCapabilityButton) {
            react_2.fireEvent.click(removeCapabilityButton);
        }
        // Check that the capability was removed
        expect(react_2.screen.queryByText('code-generation')).not.toBeInTheDocument();
    });
    it('should add and remove tools', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        // Add a tool
        const toolInput = react_2.screen.getByPlaceholderText('Add a tool');
        react_2.fireEvent.change(toolInput, { target: { value: 'code-generator' } });
        const addToolButton = react_2.screen.getByText('Add');
        // We need to make sure we're clicking the correct "Add" button
        const addButtons = react_2.screen.getAllByText('Add');
        react_2.fireEvent.click(addButtons[1]); // Second "Add" button should be for tools
        // Check that the tool was added
        expect(react_2.screen.getByText('code-generator')).toBeInTheDocument();
        // Remove the tool
        const removeToolButton = react_2.screen.getByText('code-generator').querySelector('button');
        if (removeToolButton) {
            react_2.fireEvent.click(removeToolButton);
        }
        // Check that the tool was removed
        expect(react_2.screen.queryByText('code-generator')).not.toBeInTheDocument();
    });
    it('should call onSubmit with correct data when form is submitted', () => {
        (0, react_2.render)(<SkillCreatorForm_1.default onSubmit={mockOnSubmit} onCancel={mockOnCancel}/>);
        // Fill in the form
        react_2.fireEvent.change(react_2.screen.getByLabelText('Role *'), { target: { value: 'Code Reviewer' } });
        react_2.fireEvent.change(react_2.screen.getByLabelText('Goal *'), { target: { value: 'Review code for quality and best practices' } });
        react_2.fireEvent.change(react_2.screen.getByLabelText('Backstory'), { target: { value: 'Expert code reviewer with 10 years experience' } });
        // Select a model
        react_2.fireEvent.change(react_2.screen.getByLabelText('Model'), { target: { value: 'DeepSeek-R1-671B' } });
        // Add a capability
        react_2.fireEvent.change(react_2.screen.getByPlaceholderText('Add a capability'), { target: { value: 'code-review' } });
        const addCapabilityButtons = react_2.screen.getAllByText('Add');
        react_2.fireEvent.click(addCapabilityButtons[0]);
        // Add a tool
        react_2.fireEvent.change(react_2.screen.getByPlaceholderText('Add a tool'), { target: { value: 'code-analyzer' } });
        const addToolButtons = react_2.screen.getAllByText('Add');
        react_2.fireEvent.click(addToolButtons[1]);
        // Submit the form
        const submitButton = react_2.screen.getByText('Create Skill');
        react_2.fireEvent.click(submitButton);
        // Check that onSubmit was called with correct data
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
            role: 'Code Reviewer',
            goal: 'Review code for quality and best practices',
            backstory: 'Expert code reviewer with 10 years experience',
            model: 'DeepSeek-R1-671B',
            capabilities: ['code-review'],
            tools: ['code-analyzer']
        });
    });
});
//# sourceMappingURL=SkillCreatorForm.test.js.map