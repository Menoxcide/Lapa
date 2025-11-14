/**
 * Skill Creator Form for LAPA v1.3 - Phase 22
 * 
 * UI component for creating new skills with YAML configuration
 */

import React, { useState } from 'react';
import { AgentYAMLConfig } from '../../core/yaml-agent-loader.js';

interface SkillCreatorFormProps {
  onSubmit: (config: AgentYAMLConfig) => void;
  onCancel: () => void;
}

const SkillCreatorForm = ({ onSubmit, onCancel }: SkillCreatorFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState({
    role: '',
    goal: '',
    backstory: '',
    model: 'Qwen3-Coder-480B-A35B-Instruct',
    capabilities: [] as string[],
    tools: [] as string[],
    newCapability: '',
    newTool: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addCapability = () => {
    if (formData.newCapability.trim() && !formData.capabilities.includes(formData.newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, prev.newCapability.trim()],
        newCapability: ''
      }));
    }
  };

  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  const addTool = () => {
    if (formData.newTool.trim() && !formData.tools.includes(formData.newTool.trim())) {
      setFormData(prev => ({
        ...prev,
        tools: [...prev.tools, prev.newTool.trim()],
        newTool: ''
      }));
    }
  };

  const removeTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t !== tool)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.goal.trim()) {
      newErrors.goal = 'Goal is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const config: AgentYAMLConfig = {
        role: formData.role,
        goal: formData.goal,
        backstory: formData.backstory || undefined,
        model: formData.model || undefined,
        capabilities: formData.capabilities.length > 0 ? formData.capabilities : undefined,
        tools: formData.tools.length > 0 ? formData.tools : undefined
      };
      
      onSubmit(config);
    }
  };

  return (
    <div className="skill-creator-form bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Skill</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., Code Reviewer"
          />
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
        </div>
        
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
            Goal *
          </label>
          <textarea
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md ${errors.goal ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="What should this skill accomplish?"
          />
          {errors.goal && <p className="mt-1 text-sm text-red-600">{errors.goal}</p>}
        </div>
        
        <div>
          <label htmlFor="backstory" className="block text-sm font-medium text-gray-700 mb-1">
            Backstory
          </label>
          <textarea
            id="backstory"
            name="backstory"
            value={formData.backstory}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Background information about this skill"
          />
        </div>
        
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Qwen3-Coder-480B-A35B-Instruct">Qwen3-Coder-480B-A35B-Instruct</option>
            <option value="DeepSeek-R1-671B">DeepSeek-R1-671B</option>
            <option value="Llama-3.1-70B">Llama-3.1-70B</option>
            <option value="Mixtral-8x22B">Mixtral-8x22B</option>
            <option value="GLM-4.5-Air">GLM-4.5-Air</option>
            <option value="Phi-3.5-Vision-4K-Instruct">Phi-3.5-Vision-4K-Instruct</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capabilities
          </label>
          <div className="flex">
            <input
              type="text"
              value={formData.newCapability}
              onChange={(e) => setFormData(prev => ({ ...prev, newCapability: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
              placeholder="Add a capability"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
            />
            <button
              type="button"
              onClick={addCapability}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.capabilities.map((capability, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {capability}
                <button
                  type="button"
                  onClick={() => removeCapability(capability)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tools
          </label>
          <div className="flex">
            <input
              type="text"
              value={formData.newTool}
              onChange={(e) => setFormData(prev => ({ ...prev, newTool: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
              placeholder="Add a tool"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
            />
            <button
              type="button"
              onClick={addTool}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tools.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                {tool}
                <button
                  type="button"
                  onClick={() => removeTool(tool)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white hover:bg-green-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Skill
          </button>
        </div>
      </form>
    </div>
  );
};

export default SkillCreatorForm;