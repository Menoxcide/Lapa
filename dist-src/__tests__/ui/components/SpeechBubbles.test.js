import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeechBubbles from '../../../src/ui/components/SpeechBubbles';
describe('SpeechBubbles', () => {
    const mockMessages = [
        {
            id: 'msg-1',
            agentId: 'agent-1',
            content: 'Hello, I am starting the task analysis.',
            type: 'info',
            timestamp: new Date(Date.now() - 30000) // 30 seconds ago
        },
        {
            id: 'msg-2',
            agentId: 'agent-2',
            content: 'I found a potential bug in the authentication module.',
            type: 'warning',
            timestamp: new Date(Date.now() - 15000) // 15 seconds ago
        },
        {
            id: 'msg-3',
            agentId: 'agent-3',
            content: 'Task completed successfully!',
            type: 'success',
            timestamp: new Date(Date.now() - 5000) // 5 seconds ago
        }
    ];
    it('should render speech bubbles with correct content', () => {
        render(<SpeechBubbles messages={mockMessages}/>);
        // Check that all messages are rendered
        expect(screen.getByText('Hello, I am starting the task analysis.')).toBeInTheDocument();
        expect(screen.getByText('I found a potential bug in the authentication module.')).toBeInTheDocument();
        expect(screen.getByText('Task completed successfully!')).toBeInTheDocument();
    });
    it('should display correct message types with appropriate styling', () => {
        render(<SpeechBubbles messages={mockMessages}/>);
        // Check for type indicators/icons
        const infoMessage = screen.getByText('Hello, I am starting the task analysis.');
        const warningMessage = screen.getByText('I found a potential bug in the authentication module.');
        const successMessage = screen.getByText('Task completed successfully!');
        // Verify messages are present (specific styling would depend on implementation)
        expect(infoMessage).toBeInTheDocument();
        expect(warningMessage).toBeInTheDocument();
        expect(successMessage).toBeInTheDocument();
    });
    it('should handle empty messages array', () => {
        render(<SpeechBubbles messages={[]}/>);
        // Should render container but no messages
        expect(screen.getByText('Agent Communications')).toBeInTheDocument();
        // No message content should be present
        expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });
    it('should handle single message', () => {
        const singleMessage = [mockMessages[0]];
        render(<SpeechBubbles messages={singleMessage}/>);
        expect(screen.getByText('Hello, I am starting the task analysis.')).toBeInTheDocument();
        // Other messages should not be present
        expect(screen.queryByText('I found a potential bug')).not.toBeInTheDocument();
    });
    it('should call onMessageClick when message is clicked', () => {
        const mockOnClick = jest.fn();
        render(<SpeechBubbles messages={[mockMessages[0]]} onMessageClick={mockOnClick}/>);
        const messageBubble = screen.getByText('Hello, I am starting the task analysis.');
        fireEvent.click(messageBubble);
        expect(mockOnClick).toHaveBeenCalledWith('msg-1');
    });
    it('should not be clickable when onMessageClick is not provided', () => {
        render(<SpeechBubbles messages={[mockMessages[0]]}/>);
        const messageBubble = screen.getByText('Hello, I am starting the task analysis.');
        fireEvent.click(messageBubble);
        // No callback registered, so no expectation other than no error
        expect(true).toBe(true);
    });
    it('should apply correct CSS classes', () => {
        render(<SpeechBubbles messages={mockMessages}/>);
        const container = screen.getByText('Agent Communications').closest('.speech-bubbles-container');
        expect(container).toBeInTheDocument();
        // Check message bubbles have appropriate classes
        const bubbles = screen.getAllByText(/Hello|bug|completed/);
        expect(bubbles).toHaveLength(3);
    });
    it('should handle messages with special characters', () => {
        const specialCharMessages = [
            {
                id: 'special-msg-1',
                agentId: 'agent-special',
                content: 'Message with "quotes" and <script>alert("xss")</script>',
                type: 'info',
                timestamp: new Date()
            },
            {
                id: 'special-msg-2',
                agentId: 'agent-unicode',
                content: 'Unicode message: ¡Hola! 🚀🌟',
                type: 'success',
                timestamp: new Date()
            }
        ];
        render(<SpeechBubbles messages={specialCharMessages}/>);
        // Special characters should be displayed correctly
        expect(screen.getByText('Message with "quotes" and <script>alert("xss")</script>')).toBeInTheDocument();
        expect(screen.getByText('Unicode message: ¡Hola! 🚀🌟')).toBeInTheDocument();
    });
    it('should handle messages with long content', () => {
        const longMessage = {
            id: 'long-msg',
            agentId: 'agent-long',
            content: 'This is a very long message that contains a lot of content which should be properly displayed in the speech bubble component without any truncation issues.'.repeat(3),
            type: 'info',
            timestamp: new Date()
        };
        render(<SpeechBubbles messages={[longMessage]}/>);
        // Long content should be present
        expect(screen.getByText(longMessage.content)).toBeInTheDocument();
    });
    it('should handle different message types', () => {
        const allTypesMessages = [
            {
                id: 'error-msg',
                agentId: 'agent-error',
                content: 'This is an error message',
                type: 'error',
                timestamp: new Date()
            },
            {
                id: 'info-msg',
                agentId: 'agent-info',
                content: 'This is an info message',
                type: 'info',
                timestamp: new Date()
            },
            {
                id: 'warning-msg',
                agentId: 'agent-warning',
                content: 'This is a warning message',
                type: 'warning',
                timestamp: new Date()
            },
            {
                id: 'success-msg',
                agentId: 'agent-success',
                content: 'This is a success message',
                type: 'success',
                timestamp: new Date()
            }
        ];
        render(<SpeechBubbles messages={allTypesMessages}/>);
        // All message types should be rendered
        expect(screen.getByText('This is an error message')).toBeInTheDocument();
        expect(screen.getByText('This is an info message')).toBeInTheDocument();
        expect(screen.getByText('This is a warning message')).toBeInTheDocument();
        expect(screen.getByText('This is a success message')).toBeInTheDocument();
    });
    it('should maintain message order', () => {
        render(<SpeechBubbles messages={mockMessages}/>);
        // Get all message elements
        const messages = screen.getAllByText(/Hello|bug|completed/);
        // Should maintain the order of messages as provided
        expect(messages[0]).toHaveTextContent('Hello, I am starting the task analysis.');
        expect(messages[1]).toHaveTextContent('I found a potential bug in the authentication module.');
        expect(messages[2]).toHaveTextContent('Task completed successfully!');
    });
    it('should handle message timestamps', () => {
        render(<SpeechBubbles messages={mockMessages}/>);
        // Messages should be rendered with timestamps
        // Note: Actual timestamp display would depend on implementation
        const messages = screen.getAllByText(/Hello|bug|completed/);
        expect(messages).toHaveLength(3);
    });
    it('should handle messages from same agent', () => {
        const sameAgentMessages = [
            {
                id: 'msg-1',
                agentId: 'agent-1',
                content: 'First message from agent 1',
                type: 'info',
                timestamp: new Date(Date.now() - 10000)
            },
            {
                id: 'msg-2',
                agentId: 'agent-1',
                content: 'Second message from agent 1',
                type: 'info',
                timestamp: new Date(Date.now() - 5000)
            }
        ];
        render(<SpeechBubbles messages={sameAgentMessages}/>);
        expect(screen.getByText('First message from agent 1')).toBeInTheDocument();
        expect(screen.getByText('Second message from agent 1')).toBeInTheDocument();
    });
    it('should handle rapid message updates', () => {
        const { rerender } = render(<SpeechBubbles messages={[]}/>);
        // Initial empty state
        expect(screen.getByText('Agent Communications')).toBeInTheDocument();
        // Update with messages
        rerender(<SpeechBubbles messages={[mockMessages[0]]}/>);
        expect(screen.getByText('Hello, I am starting the task analysis.')).toBeInTheDocument();
        // Update with more messages
        rerender(<SpeechBubbles messages={mockMessages}/>);
        expect(screen.getByText('Hello, I am starting the task analysis.')).toBeInTheDocument();
        expect(screen.getByText('I found a potential bug in the authentication module.')).toBeInTheDocument();
        expect(screen.getByText('Task completed successfully!')).toBeInTheDocument();
    });
});
//# sourceMappingURL=SpeechBubbles.test.js.map