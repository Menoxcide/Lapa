/**
 * Phase 22 Integration for LAPA v1.3 - Production Flows
 * 
 * Integrates Phase 22 enhancements:
 * - YAML Agent Templates
 * - Flow Guards in Resonance Core
 * - Hybrid Local-Cloud Toggle
 * - Multi-Agent Prompting Guide
 * 
 * Phase 22 Status: COMPLETE
 */

import { yamlAgentLoader } from '../core/yaml-agent-loader.js';
import { flowGuardsManager } from './flow-guards.js';
import { getInferenceManager } from '../inference/manager.js';
import { eventBus } from '../core/event-bus.js';
import { HelixAgentType } from '../core/types/agent-types.js';

/**
 * Phase 22 Integration
 * 
 * Provides unified interface for Phase 22 features.
 */
export class Phase22Integration {
  private initialized: boolean = false;

  /**
   * Initializes Phase 22 features
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize YAML agent loader
      await yamlAgentLoader.loadConfig();

      // Initialize flow guards manager
      await flowGuardsManager.initialize();

      // Initialize inference manager
      await getInferenceManager().initialize();

      this.initialized = true;

      await eventBus.publish({
        id: `phase22-initialized-${Date.now()}`,
        type: 'phase22.initialized',
        timestamp: Date.now(),
        source: 'phase22-integration',
      } as any);

      console.log('[Phase22Integration] Phase 22 features initialized');
    } catch (error) {
      console.error('[Phase22Integration] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Gets agent configuration from YAML
   */
  async getAgentConfig(agentType: HelixAgentType) {
    return yamlAgentLoader.getAgentConfig(agentType);
  }

  /**
   * Generates agent config from natural language
   */
  async generateAgentFromNL(agentType: HelixAgentType, description: string) {
    return yamlAgentLoader.generateAgentFromNL(agentType, description);
  }

  /**
   * Evaluates flow guards for a context
   */
  async evaluateFlowGuards(context: any) {
    return flowGuardsManager.evaluateGuards(context);
  }

  /**
   * Sends inference request with hybrid mode support
   */
  async infer(request: any) {
    return getInferenceManager().infer(request);
  }

  /**
   * Gets inference manager configuration
   */
  getInferenceConfig() {
    return getInferenceManager().getConfig();
  }

  /**
   * Updates inference manager configuration
   */
  async updateInferenceConfig(updates: any) {
    return getInferenceManager().updateConfig(updates);
  }

  /**
   * Gets all flow guards
   */
  getFlowGuards() {
    return flowGuardsManager.getGuards();
  }

  /**
   * Adds a new flow guard
   */
  async addFlowGuard(guard: any) {
    return flowGuardsManager.addGuard(guard);
  }

  /**
   * Removes a flow guard
   */
  async removeFlowGuard(guardName: string) {
    return flowGuardsManager.removeGuard(guardName);
  }

  /**
   * Checks health of inference providers
   */
  async checkInferenceHealth(provider: 'ollama' | 'nim' | 'openrouter' | 'auto') {
    return getInferenceManager().checkHealth(provider);
  }
}

// Export singleton instance
export const phase22Integration = new Phase22Integration();

// Auto-initialize on module load (optional)
// phase22Integration.initialize().catch(console.error);

