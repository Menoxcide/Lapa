/**
 * Enhance Prompt Button Component
 * 
 * Provides a GUI button for enhancing prompts using PromptEngineer MCP.
 * Can be used in chat interfaces, input fields, etc.
 */

import React, { useState } from 'react';

interface EnhancePromptButtonProps {
  currentPrompt: string;
  onEnhanced?: (enhancedPrompt: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancePromptButton: React.FC<EnhancePromptButtonProps> = ({
  currentPrompt,
  onEnhanced,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!currentPrompt.trim() || disabled || isEnhancing) {
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      // Import PromptEngineer client dynamically
      const { promptEngineer } = await import('../../orchestrator/prompt-engineer.ts');
      
      // Ensure PromptEngineer is started
      await promptEngineer.start();

      // Refine the prompt
      const result = await promptEngineer.refinePrompt({
        originalPrompt: currentPrompt,
        taskType: 'other'
      });

      if (result.success && result.refinedPrompt) {
        onEnhanced?.(result.refinedPrompt);
      } else if (result.clarificationQuestions && result.clarificationQuestions.length > 0) {
        // Show clarification questions in a dialog or inline
        const questions = result.clarificationQuestions.join('\n');
        const enhanced = `${currentPrompt}\n\nClarifications needed:\n${questions}`;
        onEnhanced?.(enhanced);
      } else {
        setError(result.error || 'Failed to enhance prompt');
      }
    } catch (err) {
      console.error('[EnhancePromptButton] Enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleEnhance}
        disabled={disabled || !currentPrompt.trim() || isEnhancing}
        className={`
          ${sizeClasses[size]}
          rounded-md
          font-medium
          transition-all
          duration-200
          flex items-center gap-1.5
          ${disabled || !currentPrompt.trim() || isEnhancing
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer hover:shadow-md'
          }
          ${className}
        `}
        title={isEnhancing ? 'Enhancing prompt...' : 'Enhance prompt with AI'}
      >
        {isEnhancing ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Enhancing...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Enhance</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded shadow-lg z-50 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default EnhancePromptButton;

