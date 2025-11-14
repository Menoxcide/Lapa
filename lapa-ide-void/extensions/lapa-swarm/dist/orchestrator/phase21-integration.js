"use strict";
/**
 * Phase 21 Integration for LAPA v1.3.0-preview
 *
 * Unified interface for Phase 21: Ecosystem Ignition
 * Wires all components to event bus and provides centralized initialization.
 *
 * Features:
 * - Marketplace Registry initialization
 * - ROI Dashboard initialization
 * - Inference Manager v2 initialization
 * - UI component event wiring
 * - Cross-component event listeners
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase21Integration = void 0;
exports.getPhase21Integration = getPhase21Integration;
const event_bus_ts_1 = require("../core/event-bus.ts");
const registry_ts_1 = require("../marketplace/registry.ts");
const roi_dashboard_ts_1 = require("../observability/roi-dashboard.ts");
const manager_ts_1 = require("../inference/manager.ts");
const prometheus_ts_1 = require("../observability/prometheus.ts");
/**
 * Phase 21 Integration
 */
class Phase21Integration {
    config;
    marketplace;
    roiDashboard;
    inferenceManager;
    prometheus;
    eventSubscriptions = [];
    isInitialized = false;
    constructor(config) {
        this.config = {
            enableMarketplace: config?.enableMarketplace ?? true,
            enableROIDashboard: config?.enableROIDashboard ?? true,
            enableInferenceManager: config?.enableInferenceManager ?? true,
            enablePrometheus: config?.enablePrometheus ?? true,
            ...config
        };
    }
    /**
     * Initializes all Phase 21 components
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('[Phase21Integration] Already initialized');
            return;
        }
        try {
            // Initialize Prometheus if enabled
            if (this.config.enablePrometheus) {
                this.prometheus = new prometheus_ts_1.PrometheusMetrics({
                    enabled: this.config.prometheusConfig?.enabled ?? true,
                    prefix: this.config.prometheusConfig?.prefix || 'lapa_'
                }, event_bus_ts_1.eventBus);
                await this.prometheus.initialize();
                console.log('[Phase21Integration] Prometheus initialized');
            }
            // Initialize Marketplace Registry
            if (this.config.enableMarketplace) {
                this.marketplace = (0, registry_ts_1.getMarketplaceRegistry)(this.config.marketplaceConfig);
                await this.marketplace.initialize();
                console.log('[Phase21Integration] Marketplace Registry initialized');
            }
            // Initialize ROI Dashboard
            if (this.config.enableROIDashboard) {
                this.roiDashboard = (0, roi_dashboard_ts_1.getROIDashboard)(this.config.roiConfig, this.prometheus);
                console.log('[Phase21Integration] ROI Dashboard initialized');
            }
            // Initialize Inference Manager v2
            if (this.config.enableInferenceManager) {
                this.inferenceManager = (0, manager_ts_1.getInferenceManager)(this.config.inferenceConfig);
                await this.inferenceManager.initialize();
                console.log('[Phase21Integration] Inference Manager v2 initialized');
            }
            // Wire event listeners
            this.setupEventListeners();
            this.isInitialized = true;
            event_bus_ts_1.eventBus.publish({
                id: `phase21-init-${Date.now()}`,
                type: 'phase21.initialized',
                timestamp: Date.now(),
                source: 'phase21-integration',
                payload: {
                    components: {
                        marketplace: !!this.marketplace,
                        roiDashboard: !!this.roiDashboard,
                        inferenceManager: !!this.inferenceManager,
                        prometheus: !!this.prometheus
                    }
                }
            }).catch(console.error);
            console.log('[Phase21Integration] Phase 21 integration initialized successfully');
        }
        catch (error) {
            console.error('[Phase21Integration] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Sets up cross-component event listeners
     */
    setupEventListeners() {
        // Marketplace events
        if (this.marketplace) {
            const marketplaceSub = event_bus_ts_1.eventBus.subscribe('marketplace.skill.installed', (event) => {
                // Update ROI dashboard when skill is installed
                if (this.roiDashboard && event.payload?.skillId) {
                    // Track skill installation ROI
                    console.log('[Phase21Integration] Skill installed, tracking ROI:', event.payload.skillId);
                }
            });
            this.eventSubscriptions.push(marketplaceSub);
        }
        // Inference Manager events
        if (this.inferenceManager) {
            const inferenceSub = event_bus_ts_1.eventBus.subscribe('inference.backend.switched', (event) => {
                // Track backend switches in ROI
                if (this.roiDashboard && event.payload?.backend) {
                    console.log('[Phase21Integration] Backend switched:', event.payload.backend);
                }
            });
            this.eventSubscriptions.push(inferenceSub);
        }
        // ROI Dashboard events
        if (this.roiDashboard) {
            const roiSub = event_bus_ts_1.eventBus.subscribe('roi.updated', (event) => {
                // Update Prometheus metrics
                if (this.prometheus && event.payload?.metrics) {
                    const metrics = event.payload.metrics;
                    this.prometheus.setGauge('roi_time_saved_hours', metrics.timeSavedHours, {});
                    this.prometheus.setGauge('roi_cost_saved_usd', metrics.costSavedUSD, {});
                }
            });
            this.eventSubscriptions.push(roiSub);
        }
        // Settings changed events
        const settingsSub = event_bus_ts_1.eventBus.subscribe('settings.changed', (event) => {
            // Update components based on settings changes
            if (this.inferenceManager && event.payload?.inference) {
                if (event.payload.inference.backend) {
                    this.inferenceManager.switchBackend(event.payload.inference.backend);
                }
                if (event.payload.inference.perfMode) {
                    this.inferenceManager.setPerformanceMode(event.payload.inference.perfMode);
                }
            }
        });
        this.eventSubscriptions.push(settingsSub);
    }
    /**
     * Gets marketplace registry instance
     */
    getMarketplace() {
        return this.marketplace;
    }
    /**
     * Gets ROI dashboard instance
     */
    getROIDashboard() {
        return this.roiDashboard;
    }
    /**
     * Gets inference manager instance
     */
    getInferenceManager() {
        return this.inferenceManager;
    }
    /**
     * Gets Prometheus metrics instance
     */
    getPrometheus() {
        return this.prometheus;
    }
    /**
     * Gets component status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            marketplace: !!this.marketplace,
            roiDashboard: !!this.roiDashboard,
            inferenceManager: !!this.inferenceManager,
            prometheus: !!this.prometheus
        };
    }
    /**
     * Cleanup
     */
    dispose() {
        // Unsubscribe from events
        for (const subId of this.eventSubscriptions) {
            event_bus_ts_1.eventBus.unsubscribe(subId);
        }
        this.eventSubscriptions = [];
        // Dispose components
        if (this.roiDashboard) {
            this.roiDashboard.dispose();
        }
        if (this.inferenceManager) {
            this.inferenceManager.dispose();
        }
        this.isInitialized = false;
        console.log('[Phase21Integration] Phase 21 integration disposed');
    }
}
exports.Phase21Integration = Phase21Integration;
// Singleton instance
let phase21IntegrationInstance = null;
/**
 * Gets the Phase 21 integration instance
 */
function getPhase21Integration(config) {
    if (!phase21IntegrationInstance) {
        phase21IntegrationInstance = new Phase21Integration(config);
    }
    return phase21IntegrationInstance;
}
//# sourceMappingURL=phase21-integration.js.map