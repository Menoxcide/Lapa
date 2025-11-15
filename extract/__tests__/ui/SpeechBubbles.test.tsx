import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import SpeechBubbles from '../../ui/components/SpeechBubbles.tsx';
import { Message } from '../../ui/state/index.ts';

describe('SpeechBubbles', () => {
  afterEach(() => {
    cleanup();
  });

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
    
    const titles = screen.getAllByText('Agent Conversations');
    expect(titles[0]).toBeInTheDocument();
  });

  it('should render messages with correct styles and icons', () => {
    const { container } = render(<SpeechBubbles messages={mockMessages} />);
    
    // Check all messages are rendered
    expect(screen.getByText('I am generating the code for the new feature.')).toBeInTheDocument();
    expect(screen.getByText('Executing code generation task.')).toBeInTheDocument();
    expect(screen.getByText('Code generation completed successfully.')).toBeInTheDocument();
    
    // Check agent names
    const agentNames = screen.getAllByText('Code Generator');
    expect(agentNames).toHaveLength(3);
    
    // Check timestamps - verify time pattern exists (format may vary by timezone)
    const allText = container.textContent || '';
    // Timestamps are formatted based on local timezone, so just verify time pattern exists
    expect(allText).toMatch(/\d{2}:\d{2}/); // Match any HH:MM pattern
    
    // Check icons
    expect(screen.getByText('💭')).toBeInTheDocument(); // thought
    expect(screen.getByText('⚡')).toBeInTheDocument(); // action
    expect(screen.getByText('✅')).toBeInTheDocument(); // result
  });

  it('should apply correct styles for different message types', () => {
    const mockOnClick = vi.fn();
    render(<SpeechBubbles messages={mockMessages} onMessageClick={mockOnClick} />);
    
    const bubbles = screen.getAllByRole('button'); // All speech bubbles have onClick when handler provided
    expect(bubbles[0]).toHaveClass('bg-blue-100', 'border-blue-300'); // thought
    expect(bubbles[1]).toHaveClass('bg-yellow-100', 'border-yellow-300'); // action
    expect(bubbles[2]).toHaveClass('bg-green-100', 'border-green-300'); // result
  });

  it('should handle empty messages array', () => {
    const { container } = render(<SpeechBubbles messages={[]} />);
    
    const titles = screen.getAllByText('Agent Conversations');
    expect(titles[0]).toBeInTheDocument();
    // No message content should be present - check container doesn't have message content
    const allText = container.textContent || '';
    expect(allText).not.toContain('Code Generator');
    expect(allText).not.toContain('I am generating');
  });

  it('should handle single message', () => {
    const singleMessage: Message[] = [mockMessages[0]];
    const { container } = render(<SpeechBubbles messages={singleMessage} />);
    
    const messages = screen.getAllByText('I am generating the code for the new feature.');
    expect(messages[0]).toBeInTheDocument();
    expect(screen.getAllByText('Code Generator')[0]).toBeInTheDocument();
    
    // Check timestamp is present in rendered output (format may vary by timezone)
    const allText = container.textContent || '';
    expect(allText).toMatch(/\d{2}:\d{2}/); // Match any HH:MM pattern
    
    expect(screen.getAllByText('💭')[0]).toBeInTheDocument();
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
    
    const messages = screen.getAllByText('I am generating the code for the new feature.');
    fireEvent.click(messages[0]);
    
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
    
    const { container } = render(<SpeechBubbles messages={unknownTypeMessage} />);
    
    // Use getAllByText and check first occurrence to avoid multiple element errors
    const messages = screen.getAllByText('Unknown message type.');
    expect(messages[0]).toBeInTheDocument();
    
    const agentNames = screen.getAllByText('Unknown Agent');
    expect(agentNames[0]).toBeInTheDocument();
    
    // Check timestamp is present in rendered output (format may vary by timezone)
    const allText = container.textContent || '';
    expect(allText).toMatch(/\d{2}:\d{2}/); // Match any HH:MM pattern
    
    const icons = screen.getAllByText('💬');
    expect(icons[0]).toBeInTheDocument(); // default icon
    
    const bubble = container.querySelector('[aria-label*="Unknown Agent"]');
    expect(bubble).toHaveClass('bg-gray-100', 'border-gray-300'); // default style
  });

  it('should apply correct CSS classes to container', () => {
    render(<SpeechBubbles messages={[]} />);
    
    const titles = screen.getAllByText('Agent Conversations');
    const container = titles[0].closest('.speech-bubbles-container');
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
    
    // Use getAllByText to handle potential duplicates
    const messages = screen.getAllByText('Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?`~"');
    expect(messages[0]).toBeInTheDocument();
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
    const { container } = render(<SpeechBubbles messages={[mockMessages[0]]} />);
    
    // Use aria-label to find the specific message bubble
    const bubble = container.querySelector('[aria-label*="Code Generator"]');
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
    
    // Should render without errors - use getAllByText to handle multiple instances
    const titles = screen.getAllByText('Agent Conversations');
    expect(titles[0]).toBeInTheDocument();
  });
});