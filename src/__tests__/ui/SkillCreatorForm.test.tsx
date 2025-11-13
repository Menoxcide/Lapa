// Tests for Skill Creator Form component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillCreatorForm from '../../ui/components/SkillCreatorForm';

describe('SkillCreatorForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render form fields correctly', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Check that all form fields are present
    expect(screen.getByLabelText('Role *')).toBeInTheDocument();
    expect(screen.getByLabelText('Goal *')).toBeInTheDocument();
    expect(screen.getByLabelText('Backstory')).toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    
    // Check that capability and tool sections are present
    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    
    // Check that buttons are present
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Skill')).toBeInTheDocument();
  });
  
  it('should call onCancel when cancel button is clicked', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('should show validation errors for required fields', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    const submitButton = screen.getByText('Create Skill');
    fireEvent.click(submitButton);
    
    // Should show error messages for required fields
    expect(screen.getByText('Role is required')).toBeInTheDocument();
    expect(screen.getByText('Goal is required')).toBeInTheDocument();
  });
  
  it('should add and remove capabilities', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Add a capability
    const capabilityInput = screen.getByPlaceholderText('Add a capability');
    fireEvent.change(capabilityInput, { target: { value: 'code-generation' } });
    
    const addCapabilityButton = screen.getByText('Add');
    fireEvent.click(addCapabilityButton);
    
    // Check that the capability was added
    expect(screen.getByText('code-generation')).toBeInTheDocument();
    
    // Remove the capability
    const removeCapabilityButton = screen.getByText('code-generation').querySelector('button');
    if (removeCapabilityButton) {
      fireEvent.click(removeCapabilityButton);
    }
    
    // Check that the capability was removed
    expect(screen.queryByText('code-generation')).not.toBeInTheDocument();
  });
  
  it('should add and remove tools', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Add a tool
    const toolInput = screen.getByPlaceholderText('Add a tool');
    fireEvent.change(toolInput, { target: { value: 'code-generator' } });
    
    const addToolButton = screen.getByText('Add');
    // We need to make sure we're clicking the correct "Add" button
    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[1]); // Second "Add" button should be for tools
    
    // Check that the tool was added
    expect(screen.getByText('code-generator')).toBeInTheDocument();
    
    // Remove the tool
    const removeToolButton = screen.getByText('code-generator').querySelector('button');
    if (removeToolButton) {
      fireEvent.click(removeToolButton);
    }
    
    // Check that the tool was removed
    expect(screen.queryByText('code-generator')).not.toBeInTheDocument();
  });
  
  it('should call onSubmit with correct data when form is submitted', () => {
    render(
      <SkillCreatorForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Role *'), { target: { value: 'Code Reviewer' } });
    fireEvent.change(screen.getByLabelText('Goal *'), { target: { value: 'Review code for quality and best practices' } });
    fireEvent.change(screen.getByLabelText('Backstory'), { target: { value: 'Expert code reviewer with 10 years experience' } });
    
    // Select a model
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'DeepSeek-R1-671B' } });
    
    // Add a capability
    fireEvent.change(screen.getByPlaceholderText('Add a capability'), { target: { value: 'code-review' } });
    const addCapabilityButtons = screen.getAllByText('Add');
    fireEvent.click(addCapabilityButtons[0]);
    
    // Add a tool
    fireEvent.change(screen.getByPlaceholderText('Add a tool'), { target: { value: 'code-analyzer' } });
    const addToolButtons = screen.getAllByText('Add');
    fireEvent.click(addToolButtons[1]);
    
    // Submit the form
    const submitButton = screen.getByText('Create Skill');
    fireEvent.click(submitButton);
    
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