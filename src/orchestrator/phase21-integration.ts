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

import { eventBus } from '../core/event-bus.ts';
import { getMarketplaceRegistry, MarketplaceRegistry } from '../marketplace/registry.ts';
import { getROIDashboard, ROIDashboard } from '../observability/roi-dashboard.ts';
import { getInferenceManager, InferenceManager } from '../inference/manager.ts';
import { PrometheusMetrics } from '../observability/prometheus.ts';
import type { LAPAEvent } from '../types/event-types.ts';

/**
 * Phase 21 integration configuration
 */
export interface Phase21Config {
  enableMarketplace?: boolean;
  enableROIDashboard?: boolean;
  enableInferenceManager?: boolean;
  enablePrometheus?: boolean;
  marketplaceConfig?: Partial<Parameters<typeof getMarketplaceRegistry>[0]>;
  roiConfig?: Partial<Parameters<typeof getROIDashboard>[0]>;
  inferenceConfig?: Partial<Parameters<typeof getInferenceManager>[0]>;
  prometheusConfig?: {
    enabled: boolean;
    prefix?: string;
  };
}

/**
 * Phase 21 Integration
 */
export class Phase21Integration {
  private config: Phase21Config;
  private marketplace?: MarketplaceRegistry;
  private roiDashboard?: ROIDashboard;
  private inferenceManager?: InferenceManager;
  private prometheus?: PrometheusMetrics;
  private eventSubscriptions: Array<() => void> = [];
  private isInitialized: boolean = false;

  constructor(config?: Phase21Config) {
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
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[Phase21Integration] Already initialized');
      return;
    }

    try {
      // Initialize Prometheus if enabled
      if (this.config.enablePrometheus) {
        this.prometheus = new PrometheusMetrics(
          {
            enabled: this.config.prometheusConfig?.enabled ?? true,
            prefix: this.config.prometheusConfig?.prefix || 'lapa_'
          },
          eventBus
        );
        await this.prometheus.initialize();
        console.log('[Phase21Integration] Prometheus initialized');
      }

      // Initialize Marketplace Registry
      if (this.config.enableMarketplace) {
        this.marketplace = getMarketplaceRegistry(this.config.marketplaceConfig);
        await this.marketplace.initialize();
        console.log('[Phase21Integration] Marketplace Registry initialized');
      }

      // Initialize ROI Dashboard
      if (this.config.enableROIDashboard) {
        this.roiDashboard = getROIDashboard(this.config.roiConfig, this.prometheus);
        console.log('[Phase21Integration] ROI Dashboard initialized');
      }

      // Initialize Inference Manager v2
      if (this.config.enableInferenceManager) {
        this.inferenceManager = getInferenceManager(this.config.inferenceConfig);
        await this.inferenceManager.initialize();
        console.log('[Phase21Integration] Inference Manager v2 initialized');
      }

      // Wire event listeners
      this.setupEventListeners();

      this.isInitialized = true;

      eventBus.publish({
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
      } as any).catch(console.error);

      console.log('[Phase21Integration] Phase 21 integration initialized successfully');
    } catch (error) {
      console.error('[Phase21Integration] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sets up cross-component event listeners
   */
  private setupEventListeners(): void {
    // Marketplace events
    if (this.marketplace) {
      const marketplaceSub = eventBus.subscribe('marketplace.skill.installed', (event: LAPAEvent) => {
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
      const inferenceSub = eventBus.subscribe('inference.backend.switched', (event: LAPAEvent) => {
        // Track backend switches in ROI
        if (this.roiDashboard && event.payload?.backend) {
          console.log('[Phase21Integration] Backend switched:', event.payload.backend);
        }
      });
      this.eventSubscriptions.push(inferenceSub);
    }

    // ROI Dashboard events
    if (this.roiDashboard) {
      const roiSub = eventBus.subscribe('roi.updated', (event: LAPAEvent) => {
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
    const settingsSub = eventBus.subscribe('settings.changed', (event: LAPAEvent) => {
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
  getMarketplace(): MarketplaceRegistry | undefined {
    return this.marketplace;
  }

  /**
   * Gets ROI dashboard instance
   */
  getROIDashboard(): ROIDashboard | undefined {
    return this.roiDashboard;
  }

  /**
   * Gets inference manager instance
   */
  getInferenceManager(): InferenceManager | undefined {
    return this.inferenceManager;
  }

  /**
   * Gets Prometheus metrics instance
   */
  getPrometheus(): PrometheusMetrics | undefined {
    return this.prometheus;
  }

  /**
   * Gets component status
   */
  getStatus(): {
    initialized: boolean;
    marketplace: boolean;
    roiDashboard: boolean;
    inferenceManager: boolean;
    prometheus: boolean;
  } {
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
  dispose(): void {
    // Unsubscribe from events
    for (const unsubscribe of this.eventSubscriptions) {
      unsubscribe();
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

// Singleton instance
let phase21IntegrationInstance: Phase21Integration | null = null;

/**
 * Gets the Phase 21 integration instance
 */
export function getPhase21Integration(config?: Phase21Config): Phase21Integration {
  if (!phase21IntegrationInstance) {
    phase21IntegrationInstance = new Phase21Integration(config);
  }
  return phase21IntegrationInstance;
}

