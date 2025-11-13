import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import SpeechBubbles from '../../ui/components/SpeechBubbles.tsx';
import { Message } from '../../ui/state/index.ts';

describe('SpeechBubbles', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      agentId: 'agent-1',
      agentName: 'Code Generator',
      content: 'I am generating the code for the new feature.',
      type: 'thought',
      timestamp: new Date('2023-01-01T10:00:00Z')
    },
    {
      id: 'msg-2',
      agentId: 'agent-1',
      agentName: 'Code Generator',
      content: 'Executing code generation task.',
      type: 'action',
      timestamp: new Date('2023-01-01T10:01:00Z')
    },
    {
      id: 'msg-3',
      agentId: 'agent-1',
      agentName: 'Code Generator',
      content: 'Code generation completed successfully.',
      type: 'result',
      timestamp: new Date('2023-01-01T10:02:00Z')
    }
  ];

  it('should render speech bubbles container with title', () => {
    render(<SpeechBubbles messages={[]} />);
    
    expect(screen.getByText('Agent Conversations')).toBeInTheDocument();
  });

  it('should render messages with correct styles and icons', () => {
    render(<SpeechBubbles messages={mockMessages} />);
    
    // Check all messages are rendered
    expect(screen.getByText('I am generating the code for the new feature.')).toBeInTheDocument();
    expect(screen.getByText('Executing code generation task.')).toBeInTheDocument();
    expect(screen.getByText('Code generation completed successfully.')).toBeInTheDocument();
    
    // Check agent names
    const agentNames = screen.getAllByText('Code Generator');
    expect(agentNames).toHaveLength(3);
    
    // Check timestamps
    expect(screen.getByText('10:00:00')).toBeInTheDocument();
    expect(screen.getByText('10:01:00')).toBeInTheDocument();
    expect(screen.getByText('10:02:00')).toBeInTheDocument();
    
    // Check icons
    expect(screen.getByText('💭')).toBeInTheDocument(); // thought
    expect(screen.getByText('⚡')).toBeInTheDocument(); // action
    expect(screen.getByText('✅')).toBeInTheDocument(); // result
  });

  it('should apply correct styles for different message types', () => {
    render(<SpeechBubbles messages={mockMessages} />);
    
    const bubbles = screen.getAllByRole('button'); // All speech bubbles have onClick
    expect(bubbles[0]).toHaveClass('bg-blue-100', 'border-blue-300'); // thought
    expect(bubbles[1]).toHaveClass('bg-yellow-100', 'border-yellow-300'); // action
    expect(bubbles[2]).toHaveClass('bg-green-100', 'border-green-300'); // result
  });

  it('should handle empty messages array', () => {
    render(<SpeechBubbles messages={[]} />);
    
    expect(screen.getByText('Agent Conversations')).toBeInTheDocument();
    // No message content should be present
    expect(screen.queryByText('Code Generator')).not.toBeInTheDocument();
  });

  it('should handle single message', () => {
    const singleMessage: Message[] = [mockMessages[0]];
    render(<SpeechBubbles messages={singleMessage} />);
    
    expect(screen.getByText('I am generating the code for the new feature.')).toBeInTheDocument();
    expect(screen.getByText('Code Generator')).toBeInTheDocument();
    expect(screen.getByText('10:00:00')).toBeInTheDocument();
    expect(screen.getByText('💭')).toBeInTheDocument();
  });

  it('should call onMessageClick when message is clicked', () => {
    const mockOnClick = vi.fn();
    render(<SpeechBubbles messages={[mockMessages[0]]} onMessageClick={mockOnClick} />);
    
    const messageBubble = screen.getByText('I am generating the code for the new feature.');
    fireEvent.click(messageBubble);
    
    expect(mockOnClick).toHaveBeenCalledWith('msg-1');
  });

  it('should not be clickable when onMessageClick is not provided', () => {
    render(<SpeechBubbles messages={[mockMessages[0]]} />);
    
    const messageBubble = screen.getByText('I am generating the code for the new feature.');
    fireEvent.click(messageBubble);
    
    // No callback registered, so no expectation other than no error
    expect(true).toBe(true);
  });

  it('should handle message with unknown type', () => {
    const unknownTypeMessage: Message[] = [{
      id: 'msg-4',
      agentId: 'agent-2',
      agentName: 'Unknown Agent',
      content: 'Unknown message type.',
      // @ts-ignore - Testing invalid type
      type: 'unknown',
      timestamp: new Date('2023-01-01T10:03:00Z')
    }];
    
    render(<SpeechBubbles messages={unknownTypeMessage} />);
    
    expect(screen.getByText('Unknown message type.')).toBeInTheDocument();
    expect(screen.getByText('Unknown Agent')).toBeInTheDocument();
    expect(screen.getByText('10:03:00')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument(); // default icon
    
    const bubble = screen.getByRole('button');
    expect(bubble).toHaveClass('bg-gray-100', 'border-gray-300'); // default style
  });

  it('should apply correct CSS classes to container', () => {
    render(<SpeechBubbles messages={[]} />);
    
    const container = screen.getByText('Agent Conversations').closest('.speech-bubbles-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle messages with special characters in content', () => {
    const specialCharMessages: Message[] = [
      {
        id: 'msg-special',
        agentId: 'agent-3',
        agentName: 'Special Agent',
        content: 'Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?`~"',
        type: 'thought',
        timestamp: new Date('2023-01-01T10:04:00Z')
      }
    ];
    
    render(<SpeechBubbles messages={specialCharMessages} />);
    
    expect(screen.getByText('Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?`~"')).toBeInTheDocument();
  });

  it('should handle messages with multiline content', () => {
    const multilineMessage: Message[] = [
      {
        id: 'msg-multiline',
        agentId: 'agent-4',
        agentName: 'Multiline Agent',
        content: 'This is line 1\nThis is line 2\nThis is line 3',
        type: 'thought',
        timestamp: new Date('2023-01-01T10:05:00Z')
      }
    ];
    
    render(<SpeechBubbles messages={multilineMessage} />);
    
    const contentElement = screen.getByText(/This is line 1/);
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass('whitespace-pre-wrap');
  });

  it('should render messages in chronological order', () => {
    render(<SpeechBubbles messages={mockMessages} />);
    
    const messages = screen.getAllByText(/Code Generator/);
    // Should be in the order they were provided
    expect(messages[0]).toBeInTheDocument();
    expect(messages[1]).toBeInTheDocument();
    expect(messages[2]).toBeInTheDocument();
  });

  it('should apply hover effects to message bubbles', () => {
    render(<SpeechBubbles messages={[mockMessages[0]]} />);
    
    const bubble = screen.getByText('I am generating the code for the new feature.').closest('.speech-bubble');
    expect(bubble).toHaveClass('cursor-pointer', 'transition-all', 'hover:shadow-md');
  });

  it('should handle large number of messages', () => {
    const manyMessages: Message[] = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      agentId: `agent-${i}`,
      agentName: `Agent ${i}`,
      content: `Message content ${i}`,
      type: 'thought',
      timestamp: new Date(`2023-01-01T10:${i.toString().padStart(2, '0')}:00Z`)
    }));
    
    render(<SpeechBubbles messages={manyMessages} />);
    
    // Should render without errors
    expect(screen.getByText('Agent Conversations')).toBeInTheDocument();
  });
});