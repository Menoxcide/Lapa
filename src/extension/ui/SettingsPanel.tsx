/**
 * Settings Panel for LAPA v1.3.0-preview — Phase 21
 * 
 * Full settings window with import/export, auto-approvals, API balances.
 * Command Palette → "LAPA: Open Settings" → Modal/full pane.
 */

import React, { useState, useEffect } from 'react';
import { ProviderSwitcher, ProviderType } from './components/ProviderSwitcher.tsx';

interface SettingsConfig {
  // General
  theme: 'light' | 'dark' | 'auto';
  onboardingTour: boolean;
  
  // Inference
  backend: 'ollama' | 'nim' | 'auto' | 'cloud';
  perfMode: number; // 1-10
  model: string;
  compression: boolean;
  
  // MCP/Skills
  mcpServers: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
  autoCreateMCP: boolean;
  projectOverrides: boolean;
  skillCreationEnabled: boolean;
  
  // Autonomy
  autoApproveWrites: boolean;
  autoApproveBrowser: boolean;
  autoApproveCommands: boolean;
  maxSteps: number;
  handoffThreshold: number;
  parallelAgentsLimit: number;
  
  // Feedback
  soundAlerts: boolean;
  ttsAlerts: boolean;
  browserWidth: number;
  browserHeight: number;
  screenshotQuality: number;
  
  // API Keys & Balances
  openRouterApiKey?: string;
  openRouterBalance?: number;
  groqApiKey?: string;
  groqBalance?: number;
  
  // Advanced
  roiTracking: boolean;
  i18nLanguage: string;
  thermalGuard: boolean;
  webrtcSessionPrefs: {
    maxParticipants: number;
    enableVetoes: boolean;
  };
}

const SettingsPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<SettingsConfig>({
    theme: 'auto',
    onboardingTour: true,
    backend: 'ollama',
    perfMode: 5,
    model: 'llama3.1:8b',
    compression: true,
    mcpServers: [],
    autoCreateMCP: false,
    projectOverrides: false,
    skillCreationEnabled: true,
    autoApproveWrites: false,
    autoApproveBrowser: false,
    autoApproveCommands: false,
    maxSteps: 25,
    handoffThreshold: 0.4,
    parallelAgentsLimit: 5,
    soundAlerts: false,
    ttsAlerts: false,
    browserWidth: 1920,
    browserHeight: 1080,
    screenshotQuality: 80,
    roiTracking: true,
    i18nLanguage: 'en',
    thermalGuard: true,
    webrtcSessionPrefs: {
      maxParticipants: 10,
      enableVetoes: true
    }
  });

  const [activeSection, setActiveSection] = useState<string>('general');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // Load settings from storage
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Load from ~/.lapa/config.json
      // For now, use defaults
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // TODO: Save to ~/.lapa/config.json
      console.log('Saving settings:', config);
      // Emit settings changed event
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const exportSettings = () => {
    setIsExporting(true);
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lapa-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setConfig(imported);
        saveSettings();
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const updateConfig = (updates: Partial<SettingsConfig>) => {
    setConfig({ ...config, ...updates });
    saveSettings();
  };

  return (
    <div className="settings-panel fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">LAPA Settings</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {[
                { id: 'general', label: 'General' },
                { id: 'inference', label: 'Inference' },
                { id: 'mcp-skills', label: 'MCP/Skills' },
                { id: 'autonomy', label: 'Autonomy' },
                { id: 'feedback', label: 'Feedback' },
                { id: 'api-keys', label: 'API Keys & Balances' },
                { id: 'advanced', label: 'Advanced' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'general' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">General Settings</h3>
                <div>
                  <label className="block mb-2">Theme</label>
                  <select
                    value={config.theme}
                    onChange={(e) => updateConfig({ theme: e.target.value as any })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (VS Code sync)</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.onboardingTour}
                      onChange={(e) => updateConfig({ onboardingTour: e.target.checked })}
                      className="mr-2"
                    />
                    Show onboarding tour on first launch
                  </label>
                </div>
                <div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all settings to defaults?')) {
                        loadSettings();
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'inference' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Inference Settings</h3>
                <div>
                  <label className="block mb-2">Backend Provider</label>
                  <ProviderSwitcher
                    currentProvider={(config.backend === 'auto' ? 'ollama' : config.backend) as ProviderType}
                    onProviderChange={(provider) => {
                      // Map cloud to auto for now, or handle separately
                      const backend = provider === 'cloud' ? 'cloud' : provider;
                      updateConfig({ backend: backend as any });
                    }}
                    size="md"
                    showLabels={true}
                    className="mb-2"
                  />
                  <div className="text-sm text-gray-600 mt-2">
                    {config.backend === 'ollama' && 'Local inference using Ollama (default, free)'}
                    {config.backend === 'nim' && 'Fast local inference using NVIDIA NIM (52 t/s, requires 9.2GB VRAM)'}
                    {config.backend === 'cloud' && 'Cloud inference using NVIDIA NIM Cloud (premium feature)'}
                    {config.backend === 'auto' && 'Auto-switching between available backends based on performance'}
                  </div>
                  {config.backend === 'auto' && (
                    <div className="mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Smart switching enabled</span>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Performance Mode: {config.perfMode}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.perfMode}
                    onChange={(e) => updateConfig({ perfMode: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Hardware-aware performance (1 = conservative, 10 = aggressive)
                  </div>
                </div>
                <div>
                  <label className="block mb-2">Model</label>
                  <select
                    value={config.model}
                    onChange={(e) => updateConfig({ model: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="llama3.1:8b">Llama 3.1 8B</option>
                    <option value="llama3.1:70b">Llama 3.1 70B</option>
                    <option value="qwen2.5:72b">Qwen 2.5 72B</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.compression}
                      onChange={(e) => updateConfig({ compression: e.target.checked })}
                      className="mr-2"
                    />
                    Enable compression (ctx-zip)
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'mcp-skills' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">MCP/Skills Settings</h3>
                <div>
                  <label className="block mb-2">MCP Servers</label>
                  <div className="space-y-2">
                    {config.mcpServers.map((server) => (
                      <div key={server.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{server.name}</span>
                        <input
                          type="checkbox"
                          checked={server.enabled}
                          onChange={(e) => {
                            const updated = config.mcpServers.map(s =>
                              s.id === server.id ? { ...s, enabled: e.target.checked } : s
                            );
                            updateConfig({ mcpServers: updated });
                          }}
                        />
                      </div>
                    ))}
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                      + Add Server
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.autoCreateMCP}
                      onChange={(e) => updateConfig({ autoCreateMCP: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-create MCP servers (Prompt to build tool?)
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.projectOverrides}
                      onChange={(e) => updateConfig({ projectOverrides: e.target.checked })}
                      className="mr-2"
                    />
                    Enable project-level overrides
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.skillCreationEnabled}
                      onChange={(e) => updateConfig({ skillCreationEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    Enable skill creation UI
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'autonomy' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Autonomy Settings</h3>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.autoApproveWrites}
                      onChange={(e) => updateConfig({ autoApproveWrites: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-approve file writes
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.autoApproveBrowser}
                      onChange={(e) => updateConfig({ autoApproveBrowser: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-approve browser actions
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.autoApproveCommands}
                      onChange={(e) => updateConfig({ autoApproveCommands: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-approve commands
                  </label>
                </div>
                <div>
                  <label className="block mb-2">Max Steps: {config.maxSteps}</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={config.maxSteps}
                    onChange={(e) => updateConfig({ maxSteps: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">Handoff Threshold: {config.handoffThreshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.handoffThreshold}
                    onChange={(e) => updateConfig({ handoffThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">Parallel Agents Limit: {config.parallelAgentsLimit}</label>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={config.parallelAgentsLimit}
                    onChange={(e) => updateConfig({ parallelAgentsLimit: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeSection === 'feedback' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Feedback Settings</h3>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.soundAlerts}
                      onChange={(e) => updateConfig({ soundAlerts: e.target.checked })}
                      className="mr-2"
                    />
                    Sound alerts
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.ttsAlerts}
                      onChange={(e) => updateConfig({ ttsAlerts: e.target.checked })}
                      className="mr-2"
                    />
                    TTS voice alerts
                  </label>
                </div>
                <div>
                  <label className="block mb-2">Browser Size</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={config.browserWidth}
                      onChange={(e) => updateConfig({ browserWidth: parseInt(e.target.value) })}
                      className="w-32 p-2 border rounded"
                      placeholder="Width"
                    />
                    <span className="self-center">×</span>
                    <input
                      type="number"
                      value={config.browserHeight}
                      onChange={(e) => updateConfig({ browserHeight: parseInt(e.target.value) })}
                      className="w-32 p-2 border rounded"
                      placeholder="Height"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2">Screenshot Quality: {config.screenshotQuality}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.screenshotQuality}
                    onChange={(e) => updateConfig({ screenshotQuality: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeSection === 'api-keys' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">API Keys & Balances</h3>
                <div>
                  <label className="block mb-2">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={config.openRouterApiKey || ''}
                    onChange={(e) => updateConfig({ openRouterApiKey: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="sk-or-..."
                  />
                  {config.openRouterBalance !== undefined && (
                    <div className="text-sm text-gray-600 mt-1">
                      Balance: ${config.openRouterBalance.toFixed(2)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Groq API Key</label>
                  <input
                    type="password"
                    value={config.groqApiKey || ''}
                    onChange={(e) => updateConfig({ groqApiKey: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="gsk_..."
                  />
                  {config.groqBalance !== undefined && (
                    <div className="text-sm text-gray-600 mt-1">
                      Balance: ${config.groqBalance.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'advanced' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Advanced Settings</h3>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.roiTracking}
                      onChange={(e) => updateConfig({ roiTracking: e.target.checked })}
                      className="mr-2"
                    />
                    Enable ROI tracking
                  </label>
                </div>
                <div>
                  <label className="block mb-2">Language</label>
                  <select
                    value={config.i18nLanguage}
                    onChange={(e) => updateConfig({ i18nLanguage: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.thermalGuard}
                      onChange={(e) => updateConfig({ thermalGuard: e.target.checked })}
                      className="mr-2"
                    />
                    Enable thermal guard (auto-fallback on overheating)
                  </label>
                </div>
                <div>
                  <label className="block mb-2">WebRTC Session Preferences</label>
                  <div className="space-y-2">
                    <div>
                      <label className="block mb-1">Max Participants: {config.webrtcSessionPrefs.maxParticipants}</label>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={config.webrtcSessionPrefs.maxParticipants}
                        onChange={(e) => updateConfig({
                          webrtcSessionPrefs: {
                            ...config.webrtcSessionPrefs,
                            maxParticipants: parseInt(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.webrtcSessionPrefs.enableVetoes}
                          onChange={(e) => updateConfig({
                            webrtcSessionPrefs: {
                              ...config.webrtcSessionPrefs,
                              enableVetoes: e.target.checked
                            }
                          })}
                          className="mr-2"
                        />
                        Enable cross-user vetoes
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={exportSettings}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export Settings'}
            </button>
            <label className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer">
              {isImporting ? 'Importing...' : 'Import Settings'}
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

