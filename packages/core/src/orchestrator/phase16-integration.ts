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

import { eventBus } from '../core/event-bus.ts';
import { PhaseReporter, getPhaseReporter, type PhaseReporterConfig } from './phase-reporter.ts';
import type { PhaseSummary, PhaseSummaryReport } from '../types/phase-summary.ts';

// Phase 16 integration configuration
export interface Phase16Config {
  enableTaskTree: boolean;
  enableLPSP: boolean;
  autoInitialize: boolean;
  phaseReporterConfig?: Partial<PhaseReporterConfig>;
}

/**
 * Phase 16 Integration Manager
 * 
 * Manages initialization and coordination of all Phase 16 components.
 */
export class Phase16Integration {
  private config: Phase16Config;
  private initialized: boolean = false;
  private phaseReporter?: PhaseReporter;

  constructor(config?: Partial<Phase16Config>) {
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
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('[Phase16] Initializing Phase 16 components...');

      // Initialize LPSP (Phase Reporter)
      if (this.config.enableLPSP) {
        try {
          this.phaseReporter = getPhaseReporter(this.config.phaseReporterConfig);
          console.log('[Phase16] Phase Reporter (LPSP) initialized');
        } catch (error) {
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
      await eventBus.publish({
        id: `phase16-init-${Date.now()}`,
        type: 'phase16.initialized',
        timestamp: Date.now(),
        source: 'phase16-integration',
        payload: {
          config: this.config
        }
      });
    } catch (error) {
      console.error('[Phase16] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generates a phase summary
   */
  async generatePhaseSummary(
    phaseNumber: string,
    title: string,
    description: string
  ): Promise<PhaseSummary> {
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
  async reportPhaseCompletion(
    phaseNumber: string,
    options: {
      title: string;
      description: string;
    }
  ): Promise<PhaseSummaryReport> {
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
  getPhaseSummary(phaseNumber: string): PhaseSummary | undefined {
    if (!this.phaseReporter) {
      return undefined;
    }

    return this.phaseReporter.getSummary(phaseNumber);
  }

  /**
   * Lists all stored phase summaries
   */
  listPhaseSummaries(): PhaseSummary[] {
    if (!this.phaseReporter) {
      return [];
    }

    return this.phaseReporter.listSummaries();
  }

  /**
   * Gets component status
   */
  getStatus(): {
    initialized: boolean;
    taskTreeEnabled: boolean;
    lpspEnabled: boolean;
    summariesCount: number;
  } {
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
  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('[Phase16] Phase 16 components cleaned up');
  }
}

/**
 * Default Phase 16 integration instance
 */
let defaultIntegration: Phase16Integration | null = null;

/**
 * Gets or creates the default Phase 16 integration
 */
export function getPhase16Integration(config?: Partial<Phase16Config>): Phase16Integration {
  if (!defaultIntegration || config) {
    defaultIntegration = new Phase16Integration(config);
  }
  return defaultIntegration;
}

/**
 * Phase 16 integration singleton instance
 */
export const phase16Integration = getPhase16Integration({
  enableTaskTree: true,
  enableLPSP: true,
  autoInitialize: false
});

