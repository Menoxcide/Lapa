/**
 * Provider Switcher Component (Extension Version)
 * 
 * Intuitive and nifty switching between NIM/Ollama/Cloud providers.
 * Adapted for VS Code extension environment.
 */

import React, { useState } from 'react';

export type ProviderType = 'ollama' | 'nim' | 'cloud';

interface ProviderSwitcherProps {
  currentProvider: ProviderType;
  onProviderChange: (provider: ProviderType) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

interface ProviderInfo {
  id: ProviderType;
  label: string;
  icon: string;
  description: string;
  color: string;
  darkColor: string;
}

const providers: ProviderInfo[] = [
  {
    id: 'ollama',
    label: 'Ollama',
    icon: '🦙',
    description: 'Local (Default)',
    color: 'bg-green-500 hover:bg-green-600',
    darkColor: 'dark:bg-green-600 dark:hover:bg-green-700'
  },
  {
    id: 'nim',
    label: 'NIM',
    icon: '⚡',
    description: 'Fast (52 t/s)',
    color: 'bg-purple-500 hover:bg-purple-600',
    darkColor: 'dark:bg-purple-600 dark:hover:bg-purple-700'
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: '☁️',
    description: 'Premium',
    color: 'bg-blue-500 hover:bg-blue-600',
    darkColor: 'dark:bg-blue-600 dark:hover:bg-blue-700'
  }
];

export const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  currentProvider,
  onProviderChange,
  className = '',
  size = 'md',
  showLabels = true
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const handleProviderChange = async (provider: ProviderType) => {
    if (provider === currentProvider || isTransitioning) return;

    setIsTransitioning(true);
    
    try {
      // Try to use VS Code command API if available
      const vscode = (window as any).acquireVsCodeApi ? (window as any).acquireVsCodeApi() : null;
      
      if (vscode && vscode.postMessage) {
        // In webview context, use postMessage
        vscode.postMessage({
          command: 'lapa.switchProvider',
          provider: provider,
          previousProvider: currentProvider
        });
      }

      onProviderChange(provider);
    } catch (error) {
      console.error('[ProviderSwitcher] Failed to switch provider:', error);
    } finally {
      // Small delay for smooth transition
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {providers.map((provider) => {
          const isActive = currentProvider === provider.id;
          const isDisabled = isTransitioning && !isActive;

          return (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              disabled={isDisabled}
              className={`
                ${sizeClasses[size]}
                rounded-md
                font-medium
                transition-all
                duration-200
                flex items-center gap-1.5
                relative
                ${isActive
                  ? `${provider.color} ${provider.darkColor} text-white shadow-md scale-105`
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={provider.description}
            >
              <span className="text-base">{provider.icon}</span>
              {showLabels && (
                <span className="whitespace-nowrap">{provider.label}</span>
              )}
              {isActive && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-white dark:bg-gray-200 rounded-full border-2 border-current"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {isTransitioning && (
        <div className="ml-2">
          <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProviderSwitcher;

