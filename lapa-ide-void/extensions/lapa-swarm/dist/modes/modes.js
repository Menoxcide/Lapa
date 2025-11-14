"use strict";
/**
 * Roo Mode Controller for LAPA v1.2 Phase 10
 *
 * This module implements the core mode controller with switching logic,
 * integrating with the existing event bus and agent tool systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rooModeController = exports.RooModeController = void 0;
const event_bus_ts_1 = require("../core/event-bus.ts");
/**
 * Roo Mode Controller
 * Manages mode switching and mode-specific behavior routing across the LAPA system
 */
class RooModeController {
    eventBus;
    modeState;
    modeConfigs;
    modeGuards;
    isInitialized;
    constructor(eventBusInstance = event_bus_ts_1.eventBus) {
        this.eventBus = eventBusInstance;
        this.modeState = {
            currentMode: 'ask', // Default mode
            previousMode: null,
            modeStartTime: Date.now(),
            modeData: {}
        };
        this.modeConfigs = new Map();
        this.modeGuards = [];
        this.isInitialized = false;
        // Initialize default mode configurations
        this.initializeDefaultModes();
    }
    /**
     * Initialize the mode controller
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('RooModeController is already initialized');
            return;
        }
        // Subscribe to mode change events
        this.eventBus.subscribe('mode.change.request', async (event) => {
            const request = event.payload;
            await this.requestModeChange(request);
        });
        this.isInitialized = true;
        console.log('RooModeController initialized');
        // Publish initialization event
        await this.eventBus.publish({
            id: `mode-controller-init-${Date.now()}`,
            type: 'mode.controller.initialized',
            timestamp: Date.now(),
            source: 'roo-mode-controller',
            payload: {
                initialMode: this.modeState.currentMode
            }
        });
    }
    /**
     * Initialize default mode configurations
     */
    initializeDefaultModes() {
        const defaultModes = [
            {
                name: 'Code Mode',
                type: 'code',
                description: 'Enhanced code generation and review capabilities',
                capabilities: ['code_generation', 'code_review', 'refactoring', 'testing'],
                agentBehaviors: {
                    coder: 'enhanced_code_generation',
                    reviewer: 'detailed_code_review',
                    tester: 'comprehensive_testing'
                },
                transitionHooks: {
                    onEnter: async () => {
                        console.log('Entering Code Mode');
                        // Could adjust agent configurations here
                    },
                    onExit: async () => {
                        console.log('Exiting Code Mode');
                    }
                }
            },
            {
                name: 'Architect Mode',
                type: 'architect',
                description: 'System design and planning optimizations',
                capabilities: ['system_design', 'architecture_planning', 'technology_selection'],
                agentBehaviors: {
                    planner: 'high_level_architecture',
                    optimizer: 'scalability_analysis'
                },
                transitionHooks: {
                    onEnter: async () => {
                        console.log('Entering Architect Mode');
                    },
                    onExit: async () => {
                        console.log('Exiting Architect Mode');
                    }
                }
            },
            {
                name: 'Ask Mode',
                type: 'ask',
                description: 'Improved question answering and documentation',
                capabilities: ['question_answering', 'documentation_generation', 'knowledge_retrieval'],
                agentBehaviors: {
                    researcher: 'comprehensive_research',
                    reviewer: 'accuracy_checking'
                },
                transitionHooks: {
                    onEnter: async () => {
                        console.log('Entering Ask Mode');
                    },
                    onExit: async () => {
                        console.log('Exiting Ask Mode');
                    }
                }
            },
            {
                name: 'Debug Mode',
                type: 'debug',
                description: 'Enhanced troubleshooting and error analysis',
                capabilities: ['bug_detection', 'error_analysis', 'fix_recommendation'],
                agentBehaviors: {
                    debugger: 'deep_error_analysis',
                    optimizer: 'performance_debugging'
                },
                transitionHooks: {
                    onEnter: async () => {
                        console.log('Entering Debug Mode');
                    },
                    onExit: async () => {
                        console.log('Exiting Debug Mode');
                    }
                }
            },
            {
                name: 'Custom Mode',
                type: 'custom',
                description: 'User-defined mode configurations',
                capabilities: ['user_defined'],
                agentBehaviors: {},
                transitionHooks: {
                    onEnter: async () => {
                        console.log('Entering Custom Mode');
                    },
                    onExit: async () => {
                        console.log('Exiting Custom Mode');
                    }
                }
            }
        ];
        // Register all default modes
        for (const mode of defaultModes) {
            this.modeConfigs.set(mode.type, mode);
        }
        console.log('Default modes initialized');
    }
    /**
     * Get current mode
     * @returns Current mode
     */
    getCurrentMode() {
        return this.modeState.currentMode;
    }
    /**
     * Get mode configuration
     * @param mode Mode type
     * @returns Mode configuration or undefined if not found
     */
    getModeConfig(mode) {
        return this.modeConfigs.get(mode);
    }
    /**
     * Request a mode change
     * @param request Mode transition request
     * @returns Promise that resolves with the transition result
     */
    async requestModeChange(request) {
        const startTime = Date.now();
        // Validate request
        if (request.fromMode !== this.modeState.currentMode) {
            return {
                success: false,
                fromMode: request.fromMode,
                toMode: request.toMode,
                transitionTime: Date.now() - startTime,
                error: `Current mode (${this.modeState.currentMode}) does not match requested fromMode (${request.fromMode})`
            };
        }
        // Check if mode is the same
        if (request.toMode === this.modeState.currentMode) {
            return {
                success: true,
                fromMode: request.fromMode,
                toMode: request.toMode,
                transitionTime: Date.now() - startTime
            };
        }
        // Run guards
        for (const guard of this.modeGuards) {
            try {
                const passed = await guard.check(request);
                if (!passed) {
                    return {
                        success: false,
                        fromMode: request.fromMode,
                        toMode: request.toMode,
                        transitionTime: Date.now() - startTime,
                        error: guard.errorMessage
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    fromMode: request.fromMode,
                    toMode: request.toMode,
                    transitionTime: Date.now() - startTime,
                    error: `Guard check failed: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
        // Execute transition
        return await this.executeModeTransition(request, startTime);
    }
    /**
     * Execute mode transition
     * @param request Transition request
     * @param startTime Start time for transition
     * @returns Promise that resolves with the transition result
     */
    async executeModeTransition(request, startTime) {
        const fromMode = this.modeState.currentMode;
        const toMode = request.toMode;
        // Get mode configurations
        const fromConfig = this.modeConfigs.get(fromMode);
        const toConfig = this.modeConfigs.get(toMode);
        if (!toConfig) {
            return {
                success: false,
                fromMode,
                toMode,
                transitionTime: Date.now() - startTime,
                error: `Target mode configuration not found for ${toMode}`
            };
        }
        try {
            // Execute exit hook for current mode
            if (fromConfig?.transitionHooks?.onExit) {
                await fromConfig.transitionHooks.onExit();
            }
            // Update mode state
            this.modeState.previousMode = this.modeState.currentMode;
            this.modeState.currentMode = toMode;
            this.modeState.modeStartTime = Date.now();
            this.modeState.modeData = {};
            // Execute enter hook for new mode
            if (toConfig.transitionHooks?.onEnter) {
                await toConfig.transitionHooks.onEnter();
            }
            // Publish mode change event
            await this.eventBus.publish({
                id: `mode-change-${Date.now()}`,
                type: 'mode.changed',
                timestamp: Date.now(),
                source: 'roo-mode-controller',
                payload: {
                    fromMode,
                    toMode,
                    reason: request.reason,
                    context: request.context
                }
            });
            return {
                success: true,
                fromMode,
                toMode,
                transitionTime: Date.now() - startTime
            };
        }
        catch (error) {
            // Restore previous mode on failure
            this.modeState.currentMode = fromMode;
            this.modeState.previousMode = toMode;
            return {
                success: false,
                fromMode,
                toMode,
                transitionTime: Date.now() - startTime,
                error: `Transition failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Add a mode guard
     * @param guard Mode guard to add
     */
    addGuard(guard) {
        this.modeGuards.push(guard);
        console.log(`Added mode guard: ${guard.name}`);
    }
    /**
     * Remove a mode guard
     * @param guardName Name of the guard to remove
     * @returns Boolean indicating if guard was removed
     */
    removeGuard(guardName) {
        const initialLength = this.modeGuards.length;
        this.modeGuards = this.modeGuards.filter(guard => guard.name !== guardName);
        const removed = this.modeGuards.length < initialLength;
        if (removed) {
            console.log(`Removed mode guard: ${guardName}`);
        }
        return removed;
    }
    /**
     * Get all registered mode guards
     * @returns Array of mode guards
     */
    getGuards() {
        return [...this.modeGuards];
    }
    /**
     * Update mode configuration
     * @param mode Mode type
     * @param config New configuration
     */
    updateModeConfig(mode, config) {
        this.modeConfigs.set(mode, config);
        console.log(`Updated configuration for mode: ${mode}`);
    }
    /**
     * Get mode state
     * @returns Current mode state
     */
    getModeState() {
        return { ...this.modeState };
    }
    /**
     * Check if controller is initialized
     * @returns Boolean indicating if controller is initialized
     */
    isControllerInitialized() {
        return this.isInitialized;
    }
}
exports.RooModeController = RooModeController;
// Export singleton instance
exports.rooModeController = new RooModeController();
//# sourceMappingURL=modes.js.map