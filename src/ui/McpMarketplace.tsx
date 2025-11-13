/**
 * MCP Marketplace Window for LAPA v1.3.0-preview — Phase 21
 * 
 * Command Palette → "LAPA: Open MCP Marketplace" → Inline gallery/searchable pane.
 * Features: Search/filter, One-click install, Rate/ROI badges, Auto-create modal.
 */

import React, { useState, useEffect } from 'react';
import { getMarketplaceRegistry, type SkillRegistryEntry } from '../marketplace/registry.ts';
import SkillCreatorModal from './SkillCreatorModal.tsx';

interface McpMarketplaceProps {
  onClose?: () => void;
}

const McpMarketplace: React.FC<McpMarketplaceProps> = ({ onClose }) => {
  const [skills, setSkills] = useState<SkillRegistryEntry[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<SkillRegistryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAutoCreate, setShowAutoCreate] = useState(false);
  const [showSkillCreator, setShowSkillCreator] = useState(false);
  const [autoCreatePrompt, setAutoCreatePrompt] = useState('');
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [marketplace] = useState(() => getMarketplaceRegistry());

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    filterSkills();
  }, [searchQuery, selectedCategory, skills]);

  const loadSkills = async () => {
    try {
      await marketplace.initialize();
      const allSkills = marketplace.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  };

  const filterSkills = () => {
    let filtered = skills;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(skill => skill.category === selectedCategory);
    }

    setFilteredSkills(filtered);
  };

  const handleInstall = async (skillId: string) => {
    setIsInstalling(skillId);
    try {
      const success = await marketplace.installSkill(skillId);
      if (success) {
        await loadSkills(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to install skill:', error);
      alert('Failed to install skill. Please try again.');
    } finally {
      setIsInstalling(null);
    }
  };

  const handleUninstall = async (skillId: string) => {
    try {
      await marketplace.uninstallSkill(skillId);
      await loadSkills(); // Refresh list
    } catch (error) {
      console.error('Failed to uninstall skill:', error);
      alert('Failed to uninstall skill. Please try again.');
    }
  };

  const handleAutoCreate = async () => {
    if (!autoCreatePrompt.trim()) {
      alert('Please enter a description for the tool you want to create.');
      return;
    }

    // TODO: Implement auto-create MCP server
    // This would:
    // 1. Use PromptEngineer to refine the prompt
    // 2. Scaffold TS/Python MCP server
    // 3. Install to ~/.lapa/mcp/
    // 4. Register in marketplace

    alert(`Auto-create feature coming soon! Your prompt: "${autoCreatePrompt}"`);
    setShowAutoCreate(false);
    setAutoCreatePrompt('');
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'code', label: 'Code' },
    { id: 'test', label: 'Test' },
    { id: 'debug', label: 'Debug' },
    { id: 'review', label: 'Review' },
    { id: 'integrate', label: 'Integrate' },
    { id: 'mcp', label: 'MCP' },
    { id: 'other', label: 'Other' }
  ];

  return (
    <div className="mcp-marketplace fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">MCP Marketplace</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSkillCreator(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Create Skill
            </button>
            <button
              onClick={() => setShowAutoCreate(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              + Auto-Create Tool
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search skills (e.g., 'web-search', 'GitHub')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery || selectedCategory !== 'all' ? 'No skills found matching your filters.' : 'No skills available. Try creating one!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => {
                const isInstalled = marketplace.isInstalled(skill.id);
                return (
                  <div
                    key={skill.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{skill.name}</h3>
                        {skill.verified && (
                          <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {skill.rating && (
                        <div className="text-sm">
                          ⭐ {skill.rating.toFixed(1)} ({skill.ratingCount})
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {skill.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {skill.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {skill.roiBoost && (
                      <div className="text-xs text-green-600 font-semibold mb-2">
                        💰 {skill.roiBoost}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {skill.installCount || 0} installs
                      </div>
                      {isInstalled ? (
                        <button
                          onClick={() => handleUninstall(skill.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Uninstall
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstall(skill.id)}
                          disabled={isInstalling === skill.id}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isInstalling === skill.id ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Create Modal */}
      {showAutoCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Auto-Create MCP Tool</h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe the tool you want to create. LAPA will scaffold a TypeScript or Python MCP server for you.
            </p>
            <textarea
              value={autoCreatePrompt}
              onChange={(e) => setAutoCreatePrompt(e.target.value)}
              placeholder="e.g., 'Build a GitHub Gist tool that can create, read, and delete gists'"
              className="w-full h-32 p-3 border rounded mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAutoCreate(false);
                  setAutoCreatePrompt('');
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoCreate}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default McpMarketplace;

