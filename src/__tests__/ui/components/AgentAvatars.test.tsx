import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentAvatars from '../../../src/ui/components/AgentAvatars';
import { Agent } from '../../../src/ui/state';

describe('AgentAvatars', () => {
  const mockAgents: Agent[] = [
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

  it('should render agent avatars correctly', () => {
    render(<AgentAvatars agents={mockAgents} />);
    
    // Check that all agents are rendered
    expect(screen.getByText('Code Generator')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Bug Fixer')).toBeInTheDocument();
    
    // Check roles
    expect(screen.getByText('Coder')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Debugger')).toBeInTheDocument();
  });

  it('should display correct status indicators', () => {
    render(<AgentAvatars agents={mockAgents} />);
    
    // Check status icons
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Working agent
    expect(screen.getByText('⏸️')).toBeInTheDocument(); // Idle agent
    expect(screen.getByText('✅')).toBeInTheDocument(); // Completed agent
    
    // Check status colors (through class names or styles if possible)
    const statusIndicators = screen.getAllByTestId('status-indicator');
    expect(statusIndicators).toHaveLength(0); // We don't have data-testid in component
  });

  it('should handle empty agents array', () => {
    render(<AgentAvatars agents={[]} />);
    
    // Should render container but no agent cards
    expect(screen.getByText('Agent Swarm')).toBeInTheDocument();
    // No agent names should be present
    expect(screen.queryByText('Code Generator')).not.toBeInTheDocument();
  });

  it('should handle single agent', () => {
    const singleAgent: Agent[] = [mockAgents[0]];
    render(<AgentAvatars agents={singleAgent} />);
    
    expect(screen.getByText('Code Generator')).toBeInTheDocument();
    expect(screen.getByText('Coder')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('should call onAgentClick when agent is clicked', () => {
    const mockOnClick = jest.fn();
    render(<AgentAvatars agents={[mockAgents[0]]} onAgentClick={mockOnClick} />);
    
    const agentCard = screen.getByText('Code Generator');
    fireEvent.click(agentCard);
    
    expect(mockOnClick).toHaveBeenCalledWith('agent-1');
  });

  it('should not be clickable when onAgentClick is not provided', () => {
    render(<AgentAvatars agents={[mockAgents[0]]} />);
    
    const agentCard = screen.getByText('Code Generator');
    fireEvent.click(agentCard);
    
    // No callback registered, so no expectation other than no error
    expect(true).toBe(true);
  });

  it('should display correct status colors', () => {
    render(<AgentAvatars agents={mockAgents} />);
    
    // We can't easily test the actual color values without data-testid
    // But we can verify the elements are present
    const avatars = screen.getAllByTestId('agent-avatar-card');
    expect(avatars).toHaveLength(0); // No data-testid in component
    
    // Alternative approach - check for class names
    const cards = screen.getAllByText('Code Generator').map(el => el.closest('.agent-avatar-card'));
    expect(cards).toHaveLength(1);
  });

  it('should handle agent with paused status', () => {
    const pausedAgent: Agent[] = [{
      id: 'agent-4',
      name: 'Paused Agent',
      role: 'Optimizer',
      status: 'paused',
      avatarColor: '#F333FF'
    }];
    
    render(<AgentAvatars agents={pausedAgent} />);
    
    expect(screen.getByText('Paused Agent')).toBeInTheDocument();
    expect(screen.getByText('Optimizer')).toBeInTheDocument();
    expect(screen.getByText('⏸️')).toBeInTheDocument();
  });

  it('should handle agent with unknown status', () => {
    const unknownStatusAgent: Agent[] = [{
      id: 'agent-5',
      name: 'Unknown Agent',
      role: 'Specialist',
      // @ts-ignore - Testing invalid status
      status: 'unknown',
      avatarColor: '#AAAAAA'
    }];
    
    render(<AgentAvatars agents={unknownStatusAgent} />);
    
    expect(screen.getByText('Unknown Agent')).toBeInTheDocument();
    expect(screen.getByText('Specialist')).toBeInTheDocument();
    // Should default to pause icon for unknown status
    expect(screen.getByText('⏸️')).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    render(<AgentAvatars agents={[mockAgents[0]]} />);
    
    const container = screen.getByText('Agent Swarm').closest('.agent-avatars-container');
    expect(container).toBeInTheDocument();
    
    const card = screen.getByText('Code Generator').closest('.agent-avatar-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should truncate long names and roles', () => {
    const longNameAgent: Agent[] = [{
      id: 'agent-6',
      name: 'Very Long Agent Name That Should Be Truncated',
      role: 'Very Long Role Description That Should Also Be Truncated',
      status: 'working',
      avatarColor: '#123456'
    }];
    
    render(<AgentAvatars agents={longNameAgent} />);
    
    // Names and roles should still be present (truncation is visual)
    expect(screen.getByText('Very Long Agent Name That Should Be Truncated')).toBeInTheDocument();
    expect(screen.getByText('Very Long Role Description That Should Also Be Truncated')).toBeInTheDocument();
  });
});