import React from 'react';
const SpeechBubbles = ({ messages, onMessageClick }) => {
    const getMessageStyle = (type) => {
        switch (type) {
            case 'thought': return 'bg-blue-100 border-blue-300';
            case 'action': return 'bg-yellow-100 border-yellow-300';
            case 'result': return 'bg-green-100 border-green-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'thought': return '💭';
            case 'action': return '⚡';
            case 'result': return '✅';
            default: return '💬';
        }
    };
    return (<div className="speech-bubbles-container">
      <h2>Agent Conversations</h2>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {messages.map(message => (<div key={message.id} className={`speech-bubble p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${getMessageStyle(message.type)}`} onClick={() => onMessageClick?.(message.id)}>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className="text-lg mr-2">{getTypeIcon(message.type)}</span>
                <span className="font-semibold">{message.agentName}</span>
              </div>
              <span className="text-xs text-gray-500">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-2 text-gray-800 whitespace-pre-wrap">{message.content}</p>
          </div>))}
      </div>
    </div>);
};
export default SpeechBubbles;
//# sourceMappingURL=SpeechBubbles.js.map