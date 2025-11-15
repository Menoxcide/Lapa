// Tests for Skill Manager component

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillManager from '../../ui/components/SkillManager.js';

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
    
    render(<SkillManager onClose={mockOnClose} />);
    
    // Should show loading state
    expect(screen.getByText('Loading skills...')).toBeInTheDocument();
  });
  
  it('should render empty state when no skills exist', async () => {
    // Mock loadConfig to return empty agents
    const { loadConfig } = require('../../core/yaml-agent-loader');
    loadConfig.mockResolvedValue({ agents: {} });
    
    render(<SkillManager onClose={mockOnClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('No skills')).toBeInTheDocument();
    });
    
    // Should show empty state
    expect(screen.getByText('No skills')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new skill.')).toBeInTheDocument();
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
    
    render(<SkillManager onClose={mockOnClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });
    
    // Should show the skills
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Review code for quality and best practices')).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
    expect(screen.getByText('Ensure code quality through comprehensive testing')).toBeInTheDocument();
    
    // Should show capabilities and tools
    expect(screen.getByText('code-review')).toBeInTheDocument();
    expect(screen.getByText('linting')).toBeInTheDocument();
    expect(screen.getByText('code-analyzer')).toBeInTheDocument();
    expect(screen.getByText('security-scanner')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('tdd')).toBeInTheDocument();
    expect(screen.getByText('test-generator')).toBeInTheDocument();
    expect(screen.getByText('test-runner')).toBeInTheDocument();
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
    
    render(<SkillManager onClose={mockOnClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });
    
    // Should show model information
    expect(screen.getByText('Model: DeepSeek-R1-671B')).toBeInTheDocument();
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
    
    render(<SkillManager onClose={mockOnClose} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });
    
    // Should show default model
    expect(screen.getByText('Model: Default')).toBeInTheDocument();
  });
});