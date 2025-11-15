/**
 * Chat Input Toolbar Component
 * 
 * Combines Enhance Prompt button and Provider Switcher for chat interfaces.
 * Can be integrated into any chat input area.
 */

import React from 'react';
import { EnhancePromptButton } from './EnhancePromptButton.tsx';
import { ProviderSwitcher, ProviderType } from './ProviderSwitcher.tsx';

interface ChatInputToolbarProps {
  currentPrompt: string;
  currentProvider: ProviderType;
  onEnhanced?: (enhancedPrompt: string) => void;
  onProviderChange: (provider: ProviderType) => void;
  disabled?: boolean;
  className?: string;
  showEnhanceButton?: boolean;
  showProviderSwitcher?: boolean;
}

export const ChatInputToolbar: React.FC<ChatInputToolbarProps> = ({
  currentPrompt,
  currentProvider,
  onEnhanced,
  onProviderChange,
  disabled = false,
  className = '',
  showEnhanceButton = true,
  showProviderSwitcher = true
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {showEnhanceButton && (
          <EnhancePromptButton
            currentPrompt={currentPrompt}
            onEnhanced={onEnhanced}
            disabled={disabled}
            size="sm"
          />
        )}
      </div>
      
      {showProviderSwitcher && (
        <ProviderSwitcher
          currentProvider={currentProvider}
          onProviderChange={onProviderChange}
          size="sm"
          showLabels={true}
        />
      )}
    </div>
  );
};

export default ChatInputToolbar;

