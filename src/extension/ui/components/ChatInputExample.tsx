/**
 * Example Chat Input Component
 * 
 * Demonstrates how to integrate EnhancePromptButton and ProviderSwitcher
 * into a chat interface.
 */

import React, { useState } from 'react';
import { ChatInputToolbar } from './ChatInputToolbar.tsx';
import { ProviderType } from './ProviderSwitcher.tsx';

export const ChatInputExample: React.FC = () => {
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<ProviderType>('ollama');

  const handleEnhanced = (enhanced: string) => {
    setInput(enhanced);
  };

  const handleProviderChange = async (newProvider: ProviderType) => {
    setProvider(newProvider);
    // In a real implementation, you would:
    // 1. Call the inference manager to switch backends
    // 2. Emit an event via event bus
    // 3. Update the UI state
    console.log(`Switching to provider: ${newProvider}`);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    console.log('Submitting:', input);
    // Submit logic here
  };

  return (
    <div className="chat-input-example p-4 space-y-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Chat Input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message... (Try typing something vague and click Enhance!)"
          className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ChatInputToolbar
        currentPrompt={input}
        currentProvider={provider}
        onEnhanced={handleEnhanced}
        onProviderChange={handleProviderChange}
        disabled={false}
        showEnhanceButton={true}
        showProviderSwitcher={true}
      />

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {provider && (
        <div className="text-xs text-gray-500">
          Current provider: <span className="font-semibold">{provider}</span>
        </div>
      )}
    </div>
  );
};

export default ChatInputExample;

