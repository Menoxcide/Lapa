/**
 * Welcome/Onboarding Window for LAPA v1.3.0-preview — Phase 21
 * 
 * First-launch modal: Quick-start video embed, Mode tour, MCP intro, Settings wizard.
 * Features: Helix-team avatars + role picker.
 */

import React, { useState } from 'react';

interface WelcomeTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const steps = [
    {
      title: 'Welcome to LAPA!',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-lg mb-4">
            Your Autonomous MoE-Powered Coding Swarm
          </p>
          <p className="text-gray-600">
            Local-First, Cursor-Native, Fully Self-Driving
          </p>
        </div>
      )
    },
    {
      title: 'Meet the Helix Team',
      content: (
        <div>
          <p className="mb-4">Choose your primary role to get started:</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'architect', name: 'Architect', emoji: '🏗️', desc: 'Plan and design' },
              { id: 'coder', name: 'Coder', emoji: '💻', desc: 'Write code' },
              { id: 'tester', name: 'Tester', emoji: '🧪', desc: 'Test and debug' },
              { id: 'reviewer', name: 'Reviewer', emoji: '👀', desc: 'Review code' },
              { id: 'researcher', name: 'Researcher', emoji: '🔍', desc: 'Research and analyze' },
              { id: 'integrator', name: 'Integrator', emoji: '🔗', desc: 'Integrate systems' }
            ].map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedRole === role.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-3xl mb-2">{role.emoji}</div>
                <div className="font-semibold">{role.name}</div>
                <div className="text-xs text-gray-600">{role.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Modes Overview',
      content: (
        <div>
          <p className="mb-4">LAPA has multiple modes for different tasks:</p>
          <div className="space-y-3">
            {[
              { mode: 'Code', desc: 'Generate and modify code' },
              { mode: 'Architect', desc: 'Plan and design systems' },
              { mode: 'Ask', desc: 'Answer questions and provide insights' },
              { mode: 'Debug', desc: 'Find and fix bugs' },
              { mode: 'Custom', desc: 'Create your own custom mode' }
            ].map(({ mode, desc }) => (
              <div key={mode} className="flex items-center p-3 bg-gray-50 rounded">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {mode[0]}
                </div>
                <div>
                  <div className="font-semibold">{mode}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'MCP Integration',
      content: (
        <div>
          <p className="mb-4">
            LAPA supports Model Context Protocol (MCP) for extensibility:
          </p>
          <ul className="space-y-2 list-disc list-inside text-gray-700">
            <li>Browse and install MCP servers from the marketplace</li>
            <li>Auto-create custom tools with natural language prompts</li>
            <li>One-click installation and configuration</li>
            <li>100K+ skills available</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="text-sm font-semibold text-blue-800">
              💡 Tip: Visit the MCP Marketplace to discover powerful tools!
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Settings Wizard',
      content: (
        <div>
          <p className="mb-4">Let's configure your environment:</p>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Inference Backend
              </label>
              <select className="w-full p-2 border rounded">
                <option>Ollama (Default - 4s startup)</option>
                <option>NIM (52 t/s, 9.2GB VRAM)</option>
                <option>Auto (Smart Switching)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">
                Performance Mode
              </label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full"
              />
              <div className="text-xs text-gray-600 mt-1">
                Hardware-aware performance (5 = balanced)
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">Enable ROI tracking</span>
              </label>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="welcome-tour fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Welcome to LAPA</h2>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip Tour
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {steps[currentStep].title}
            </h3>
            <div>{steps[currentStep].content}</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTour;

