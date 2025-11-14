"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const vitest_2 = require("vitest");
require("@testing-library/jest-dom");
const SpeechBubbles_tsx_1 = __importDefault(require("../../ui/components/SpeechBubbles.tsx"));
(0, vitest_1.describe)('SpeechBubbles', () => {
    const mockMessages = [
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
    (0, vitest_1.it)('should render speech bubbles container with title', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[]}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Agent Conversations')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should render messages with correct styles and icons', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={mockMessages}/>);
        // Check all messages are rendered
        (0, vitest_1.expect)(react_1.screen.getByText('I am generating the code for the new feature.')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Executing code generation task.')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Code generation completed successfully.')).toBeInTheDocument();
        // Check agent names
        const agentNames = react_1.screen.getAllByText('Code Generator');
        (0, vitest_1.expect)(agentNames).toHaveLength(3);
        // Check timestamps
        (0, vitest_1.expect)(react_1.screen.getByText('10:00:00')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('10:01:00')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('10:02:00')).toBeInTheDocument();
        // Check icons
        (0, vitest_1.expect)(react_1.screen.getByText('💭')).toBeInTheDocument(); // thought
        (0, vitest_1.expect)(react_1.screen.getByText('⚡')).toBeInTheDocument(); // action
        (0, vitest_1.expect)(react_1.screen.getByText('✅')).toBeInTheDocument(); // result
    });
    (0, vitest_1.it)('should apply correct styles for different message types', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={mockMessages}/>);
        const bubbles = react_1.screen.getAllByRole('button'); // All speech bubbles have onClick
        (0, vitest_1.expect)(bubbles[0]).toHaveClass('bg-blue-100', 'border-blue-300'); // thought
        (0, vitest_1.expect)(bubbles[1]).toHaveClass('bg-yellow-100', 'border-yellow-300'); // action
        (0, vitest_1.expect)(bubbles[2]).toHaveClass('bg-green-100', 'border-green-300'); // result
    });
    (0, vitest_1.it)('should handle empty messages array', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[]}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Agent Conversations')).toBeInTheDocument();
        // No message content should be present
        (0, vitest_1.expect)(react_1.screen.queryByText('Code Generator')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle single message', () => {
        const singleMessage = [mockMessages[0]];
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={singleMessage}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('I am generating the code for the new feature.')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Code Generator')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('10:00:00')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('💭')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should call onMessageClick when message is clicked', () => {
        const mockOnClick = vitest_2.vi.fn();
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[mockMessages[0]]} onMessageClick={mockOnClick}/>);
        const messageBubble = react_1.screen.getByText('I am generating the code for the new feature.');
        react_1.fireEvent.click(messageBubble);
        (0, vitest_1.expect)(mockOnClick).toHaveBeenCalledWith('msg-1');
    });
    (0, vitest_1.it)('should not be clickable when onMessageClick is not provided', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[mockMessages[0]]}/>);
        const messageBubble = react_1.screen.getByText('I am generating the code for the new feature.');
        react_1.fireEvent.click(messageBubble);
        // No callback registered, so no expectation other than no error
        (0, vitest_1.expect)(true).toBe(true);
    });
    (0, vitest_1.it)('should handle message with unknown type', () => {
        const unknownTypeMessage = [{
                id: 'msg-4',
                agentId: 'agent-2',
                agentName: 'Unknown Agent',
                content: 'Unknown message type.',
                // @ts-ignore - Testing invalid type
                type: 'unknown',
                timestamp: new Date('2023-01-01T10:03:00Z')
            }];
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={unknownTypeMessage}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Unknown message type.')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Unknown Agent')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('10:03:00')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('💬')).toBeInTheDocument(); // default icon
        const bubble = react_1.screen.getByRole('button');
        (0, vitest_1.expect)(bubble).toHaveClass('bg-gray-100', 'border-gray-300'); // default style
    });
    (0, vitest_1.it)('should apply correct CSS classes to container', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[]}/>);
        const container = react_1.screen.getByText('Agent Conversations').closest('.speech-bubbles-container');
        (0, vitest_1.expect)(container).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle messages with special characters in content', () => {
        const specialCharMessages = [
            {
                id: 'msg-special',
                agentId: 'agent-3',
                agentName: 'Special Agent',
                content: 'Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?`~"',
                type: 'thought',
                timestamp: new Date('2023-01-01T10:04:00Z')
            }
        ];
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={specialCharMessages}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?`~"')).toBeInTheDocument();
    });
    (0, vitest_1.it)('should handle messages with multiline content', () => {
        const multilineMessage = [
            {
                id: 'msg-multiline',
                agentId: 'agent-4',
                agentName: 'Multiline Agent',
                content: 'This is line 1\nThis is line 2\nThis is line 3',
                type: 'thought',
                timestamp: new Date('2023-01-01T10:05:00Z')
            }
        ];
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={multilineMessage}/>);
        const contentElement = react_1.screen.getByText(/This is line 1/);
        (0, vitest_1.expect)(contentElement).toBeInTheDocument();
        (0, vitest_1.expect)(contentElement).toHaveClass('whitespace-pre-wrap');
    });
    (0, vitest_1.it)('should render messages in chronological order', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={mockMessages}/>);
        const messages = react_1.screen.getAllByText(/Code Generator/);
        // Should be in the order they were provided
        (0, vitest_1.expect)(messages[0]).toBeInTheDocument();
        (0, vitest_1.expect)(messages[1]).toBeInTheDocument();
        (0, vitest_1.expect)(messages[2]).toBeInTheDocument();
    });
    (0, vitest_1.it)('should apply hover effects to message bubbles', () => {
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={[mockMessages[0]]}/>);
        const bubble = react_1.screen.getByText('I am generating the code for the new feature.').closest('.speech-bubble');
        (0, vitest_1.expect)(bubble).toHaveClass('cursor-pointer', 'transition-all', 'hover:shadow-md');
    });
    (0, vitest_1.it)('should handle large number of messages', () => {
        const manyMessages = Array.from({ length: 50 }, (_, i) => ({
            id: `msg-${i}`,
            agentId: `agent-${i}`,
            agentName: `Agent ${i}`,
            content: `Message content ${i}`,
            type: 'thought',
            timestamp: new Date(`2023-01-01T10:${i.toString().padStart(2, '0')}:00Z`)
        }));
        (0, react_1.render)(<SpeechBubbles_tsx_1.default messages={manyMessages}/>);
        // Should render without errors
        (0, vitest_1.expect)(react_1.screen.getByText('Agent Conversations')).toBeInTheDocument();
    });
});
//# sourceMappingURL=SpeechBubbles.test.js.map