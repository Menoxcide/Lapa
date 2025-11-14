"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.phase22Integration = exports.Phase22Integration = void 0;
const yaml_agent_loader_js_1 = require("../core/yaml-agent-loader.js");
const flow_guards_js_1 = require("./flow-guards.js");
const manager_js_1 = require("../inference/manager.js");
const event_bus_js_1 = require("../core/event-bus.js");
/**
 * Phase 22 Integration
 *
 * Provides unified interface for Phase 22 features.
 */
class Phase22Integration {
    initialized = false;
    /**
     * Initializes Phase 22 features
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Initialize YAML agent loader
            await yaml_agent_loader_js_1.yamlAgentLoader.loadConfig();
            // Initialize flow guards manager
            await flow_guards_js_1.flowGuardsManager.initialize();
            // Initialize inference manager
            await (0, manager_js_1.getInferenceManager)().initialize();
            this.initialized = true;
            await event_bus_js_1.eventBus.publish({
                id: `phase22-initialized-${Date.now()}`,
                type: 'phase22.initialized',
                timestamp: Date.now(),
                source: 'phase22-integration',
            });
            console.log('[Phase22Integration] Phase 22 features initialized');
        }
        catch (error) {
            console.error('[Phase22Integration] Failed to initialize:', error);
            throw error;
        }
    }
    /**
     * Gets agent configuration from YAML
     */
    async getAgentConfig(agentType) {
        return yaml_agent_loader_js_1.yamlAgentLoader.getAgentConfig(agentType);
    }
    /**
     * Generates agent config from natural language
     */
    async generateAgentFromNL(agentType, description) {
        return yaml_agent_loader_js_1.yamlAgentLoader.generateAgentFromNL(agentType, description);
    }
    /**
     * Evaluates flow guards for a context
     */
    async evaluateFlowGuards(context) {
        return flow_guards_js_1.flowGuardsManager.evaluateGuards(context);
    }
    /**
     * Sends inference request with hybrid mode support
     */
    async infer(request) {
        return (0, manager_js_1.getInferenceManager)().infer(request);
    }
    /**
     * Gets inference manager configuration
     */
    getInferenceConfig() {
        return (0, manager_js_1.getInferenceManager)().getConfig();
    }
    /**
     * Updates inference manager configuration
     */
    async updateInferenceConfig(updates) {
        return (0, manager_js_1.getInferenceManager)().updateConfig(updates);
    }
    /**
     * Gets all flow guards
     */
    getFlowGuards() {
        return flow_guards_js_1.flowGuardsManager.getGuards();
    }
    /**
     * Adds a new flow guard
     */
    async addFlowGuard(guard) {
        return flow_guards_js_1.flowGuardsManager.addGuard(guard);
    }
    /**
     * Removes a flow guard
     */
    async removeFlowGuard(guardName) {
        return flow_guards_js_1.flowGuardsManager.removeGuard(guardName);
    }
    /**
     * Checks health of inference providers
     */
    async checkInferenceHealth(provider) {
        return (0, manager_js_1.getInferenceManager)().checkHealth(provider);
    }
}
exports.Phase22Integration = Phase22Integration;
// Export singleton instance
exports.phase22Integration = new Phase22Integration();
// Auto-initialize on module load (optional)
// phase22Integration.initialize().catch(console.error);
//# sourceMappingURL=phase22-integration.js.map