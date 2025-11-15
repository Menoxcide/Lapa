# Chat UI Components

This directory contains reusable UI components for chat interfaces and prompt enhancement.

## Components

### EnhancePromptButton

A button component that enhances prompts using the PromptEngineer MCP integration.

**Usage:**
```tsx
import { EnhancePromptButton } from './components/EnhancePromptButton';

<EnhancePromptButton
  currentPrompt={userInput}
  onEnhanced={(enhanced) => setUserInput(enhanced)}
  size="sm"
/>
```

**Props:**
- `currentPrompt: string` - The current prompt text to enhance
- `onEnhanced?: (enhancedPrompt: string) => void` - Callback when enhancement completes
- `disabled?: boolean` - Whether the button is disabled
- `className?: string` - Additional CSS classes
- `size?: 'sm' | 'md' | 'lg'` - Button size

### ProviderSwitcher

An intuitive toggle-style component for switching between NIM/Ollama/Cloud providers.

**Usage:**
```tsx
import { ProviderSwitcher, ProviderType } from './components/ProviderSwitcher';

<ProviderSwitcher
  currentProvider="ollama"
  onProviderChange={(provider) => handleProviderChange(provider)}
  size="sm"
  showLabels={true}
/>
```

**Props:**
- `currentProvider: ProviderType` - Current provider ('ollama' | 'nim' | 'cloud')
- `onProviderChange: (provider: ProviderType) => void` - Callback when provider changes
- `className?: string` - Additional CSS classes
- `size?: 'sm' | 'md' | 'lg'` - Component size
- `showLabels?: boolean` - Whether to show provider labels

### ChatInputToolbar

A combined toolbar component that includes both Enhance Prompt button and Provider Switcher.

**Usage:**
```tsx
import { ChatInputToolbar } from './components/ChatInputToolbar';
import { ProviderType } from './components/ProviderSwitcher';

const [prompt, setPrompt] = useState('');
const [provider, setProvider] = useState<ProviderType>('ollama');

<ChatInputToolbar
  currentPrompt={prompt}
  currentProvider={provider}
  onEnhanced={(enhanced) => setPrompt(enhanced)}
  onProviderChange={setProvider}
  showEnhanceButton={true}
  showProviderSwitcher={true}
/>
```

## Integration Example

Here's a complete example of integrating these components into a chat interface:

```tsx
import React, { useState } from 'react';
import { ChatInputToolbar } from './components/ChatInputToolbar';
import { ProviderType } from './components/ProviderSwitcher';

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<ProviderType>('ollama');

  const handleEnhanced = (enhanced: string) => {
    setInput(enhanced);
  };

  const handleProviderChange = async (newProvider: ProviderType) => {
    // Update backend configuration
    setProvider(newProvider);
    // Emit event or call API to switch backend
  };

  return (
    <div className="chat-container">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your message..."
        className="w-full p-3 border rounded"
      />
      
      <ChatInputToolbar
        currentPrompt={input}
        currentProvider={provider}
        onEnhanced={handleEnhanced}
        onProviderChange={handleProviderChange}
      />
      
      <button onClick={handleSubmit}>Send</button>
    </div>
  );
};
```

## Styling

All components use Tailwind CSS classes and support dark mode. They follow the LAPA design system with:
- Smooth transitions and animations
- Hover states
- Disabled states
- Responsive sizing

## Backend Integration

The ProviderSwitcher emits events via the event bus when switching providers. Make sure to handle these events in your backend:

```typescript
import { eventBus } from '@lapa/core/event-bus.js';

eventBus.subscribe('provider.switch', (event) => {
  const { provider } = event.payload;
  // Switch backend accordingly
});
```

