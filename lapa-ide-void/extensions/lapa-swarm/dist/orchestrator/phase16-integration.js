"use strict";
/**
 * Phase 16 Integration for LAPA v1.2.2
 *
 * This module integrates all Phase 16 components:
 * - Task Tree Orchestrator (task-tree.tsx)
 * - LAPA Phase Summary Protocol (LPSP) - phase-reporter.ts, phase-analyzer.ts, summary-renderer.ts
 *
 * It provides a unified interface for Phase 16 features (Task Tree + LPSP)
 * and integrates them with the orchestrator and event bus.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phase16Integration = exports.Phase16Integration = void 0;
exports.getPhase16Integration = getPhase16Integration;
const event_bus_ts_1 = require("../core/event-bus.ts");
const phase_reporter_ts_1 = require("./phase-reporter.ts");
/**
 * Phase 16 Integration Manager
 *
 * Manages initialization and coordination of all Phase 16 components.
 */
class Phase16Integration {
    config;
    initialized = false;
    phaseReporter;
    constructor(config) {
        this.config = {
            enableTaskTree: config?.enableTaskTree ?? true,
            enableLPSP: config?.enableLPSP ?? true,
            autoInitialize: config?.autoInitialize ?? false,
            phaseReporterConfig: config?.phaseReporterConfig,
            ...config
        };
        if (this.config.autoInitialize) {
            this.initialize().catch(console.error);
        }
    }
    /**
     * Initializes all Phase 16 components
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            console.log('[Phase16] Initializing Phase 16 components...');
            // Initialize LPSP (Phase Reporter)
            if (this.config.enableLPSP) {
                try {
                    this.phaseReporter = (0, phase_reporter_ts_1.getPhaseReporter)(this.config.phaseReporterConfig);
                    console.log('[Phase16] Phase Reporter (LPSP) initialized');
                }
                catch (error) {
                    console.warn('[Phase16] Phase Reporter initialization failed:', error);
                }
            }
            // Task Tree Orchestrator is a React component, so it's initialized when used
            if (this.config.enableTaskTree) {
                console.log('[Phase16] Task Tree Orchestrator ready (React component)');
            }
            this.initialized = true;
            console.log('[Phase16] Phase 16 components initialized successfully');
            // Publish initialization event
            await event_bus_ts_1.eventBus.publish({
                id: `phase16-init-${Date.now()}`,
                type: 'phase16.initialized',
                timestamp: Date.now(),
                source: 'phase16-integration',
                payload: {
                    config: this.config
                }
            });
        }
        catch (error) {
            console.error('[Phase16] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Generates a phase summary
     */
    async generatePhaseSummary(phaseNumber, title, description) {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.phaseReporter) {
            throw new Error('Phase Reporter not initialized. Enable LPSP in config.');
        }
        return this.phaseReporter.generatePhaseSummary(phaseNumber, title, description);
    }
    /**
     * Reports phase completion
     */
    async reportPhaseCompletion(phaseNumber, options) {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.phaseReporter) {
            throw new Error('Phase Reporter not initialized. Enable LPSP in config.');
        }
        return this.phaseReporter.reportPhaseCompletion(phaseNumber, options);
    }
    /**
     * Gets a stored phase summary
     */
    getPhaseSummary(phaseNumber) {
        if (!this.phaseReporter) {
            return undefined;
        }
        return this.phaseReporter.getSummary(phaseNumber);
    }
    /**
     * Lists all stored phase summaries
     */
    listPhaseSummaries() {
        if (!this.phaseReporter) {
            return [];
        }
        return this.phaseReporter.listSummaries();
    }
    /**
     * Gets component status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            taskTreeEnabled: this.config.enableTaskTree,
            lpspEnabled: this.config.enableLPSP,
            summariesCount: this.phaseReporter?.listSummaries().length || 0
        };
    }
    /**
     * Cleans up resources
     */
    async cleanup() {
        this.initialized = false;
        console.log('[Phase16] Phase 16 components cleaned up');
    }
}
exports.Phase16Integration = Phase16Integration;
/**
 * Default Phase 16 integration instance
 */
let defaultIntegration = null;
/**
 * Gets or creates the default Phase 16 integration
 */
function getPhase16Integration(config) {
    if (!defaultIntegration || config) {
        defaultIntegration = new Phase16Integration(config);
    }
    return defaultIntegration;
}
/**
 * Phase 16 integration singleton instance
 */
exports.phase16Integration = getPhase16Integration({
    enableTaskTree: true,
    enableLPSP: true,
    autoInitialize: false
});
//# sourceMappingURL=phase16-integration.js.map