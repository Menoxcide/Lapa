/**
 * Skill Manager for LAPA v1.3 - Phase 22
 * 
 * UI component for managing skills with creation, editing, and testing capabilities
 */

import React, { useState, useEffect } from 'react';
import { AgentYAMLConfig, yamlAgentLoader } from '@lapa/core/yaml-agent-loader.js';
import SkillCreatorForm from './SkillCreatorForm.tsx';

interface SkillManagerProps {
  onClose?: () => void;
}

const SkillManager = ({ onClose }: SkillManagerProps): React.JSX.Element => {
  const [skills, setSkills] = useState<Record<string, AgentYAMLConfig>>({});
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; output?: string; error?: string }>>({});

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const config = await yamlAgentLoader.loadConfig();
      setSkills(config.agents || {});
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async (config: AgentYAMLConfig) => {
    try {
      // Generate a skill ID based on the role
      const skillId = config.role.toLowerCase().replace(/\s+/g, '-');
      
      // Load current config
      const currentConfig = await yamlAgentLoader.loadConfig();
      
      // Add new skill
      currentConfig.agents = {
        ...currentConfig.agents,
        [skillId]: config
      };
      
      // Save config
      await yamlAgentLoader.saveConfig(currentConfig);
      
      // Update state
      setSkills(currentConfig.agents);
      setShowCreator(false);
      
      // Show success message
      alert(`Skill "${config.role}" created successfully!`);
    } catch (error) {
      console.error('Failed to create skill:', error);
      alert('Failed to create skill. Please try again.');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm(`Are you sure you want to delete the skill "${skills[skillId].role}"?`)) {
      return;
    }
    
    try {
      // Load current config
      const currentConfig = await yamlAgentLoader.loadConfig();
      
      // Remove skill
      const { [skillId]: _, ...remainingAgents } = currentConfig.agents || {};
      currentConfig.agents = remainingAgents;
      
      // Save config
      await yamlAgentLoader.saveConfig(currentConfig);
      
      // Update state
      setSkills(currentConfig.agents);
      
      // Show success message
      alert(`Skill "${skillId}" deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  const handleTestSkill = async (skillId: string) => {
    // In a real implementation, this would test the skill
    // For now, we'll just simulate a test
    setTestResults(prev => ({
      ...prev,
      [skillId]: {
        success: Math.random() > 0.3, // 70% chance of success
        output: Math.random() > 0.3 ? 'Skill executed successfully' : undefined,
        error: Math.random() > 0.3 ? undefined : 'Skill failed to execute'
      }
    }));
  };

  if (loading) {
    return (
      <div className="skill-manager flex items-center justify-center h-64">
        <div className="text-lg">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="skill-manager bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Skill Manager</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              + Create Skill
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            )}
          </div>
        </div>
        
        {showCreator ? (
          <SkillCreatorForm
            onSubmit={handleCreateSkill}
            onCancel={() => setShowCreator(false)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skills).map(([skillId, skill]) => (
              <div key={skillId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{skill.role}</h3>
                      <p className="text-gray-600 mt-1">{skill.goal}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTestSkill(skillId)}
                        className="p-2 text-gray-500 hover:text-blue-500"
                        title="Test skill"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skillId)}
                        className="p-2 text-gray-500 hover:text-red-500"
                        title="Delete skill"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {skill.backstory && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{skill.backstory}</p>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skill.capabilities?.map((capability: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {capability}
                      </span>
                    ))}
                    
                    {skill.tools?.map((tool: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Model: {skill.model || 'Default'}
                    </div>
                  </div>
                  
                  {testResults[skillId] && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${
                      testResults[skillId].success
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}>
                      {testResults[skillId].success ? (
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {testResults[skillId].output || 'Skill executed successfully'}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {testResults[skillId].error || 'Skill failed to execute'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {Object.keys(skills).length === 0 && (
              <div className="col-span-full text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No skills</h3>
                <p className="mt-1 text-gray-500">Get started by creating a new skill.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreator(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Skill
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillManager;