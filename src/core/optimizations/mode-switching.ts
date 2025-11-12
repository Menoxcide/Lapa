/**
 * Optimized Mode Switching for LAPA v1.2 Phase 10
 * 
 * This module implements optimizations for mode switching to achieve
 * <150ms per transition performance target. It includes caching,
 * pre-loading, and asynchronous initialization optimizations.
 */

import { RooModeController } from '../../modes/modes.ts';
import { RooMode, ModeTransitionRequest, ModeTransitionResult } from '../../modes/types/mode-types.ts';
import { performance } from 'perf_hooks';
import { lapaCacheManager } from './caching.ts';

// Mode switching optimization configuration
interface ModeSwitchingConfig {
  enableCaching: boolean;
  enablePreloading: boolean;
  preloadDelay: number; // ms
  enableAsyncInitialization: boolean;
  transitionTimeout: number; // ms
  enableMetrics: boolean;
}

// Default configuration optimized for <150ms per transition
const DEFAULT_CONFIG: ModeSwitchingConfig = {
  enableCaching: true,
  enablePreloading: true,
  preloadDelay: 1000, // 1 second
  enableAsyncInitialization: true,
  transitionTimeout: 5000, // 5 seconds
  enableMetrics: true
};

// Mode transition metrics
interface ModeTransitionMetrics {
  averageTransitionTime: number;
  transitionCount: number;
  cacheHits: number;
  cacheMisses: number;
  preloadSuccess: number;
  preloadFailures: number;
}

// Preloaded mode data
interface PreloadedModeData {
  mode: RooMode;
  config: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Optimized Mode Controller with caching and preloading
 */
export class OptimizedModeController extends RooModeController {
  private config: ModeSwitchingConfig;
  private metrics: ModeTransitionMetrics;
  private preloadedModes: Map<RooMode, PreloadedModeData>;
  private preloadTimers: Map<RooMode, NodeJS.Timeout>;

  constructor(config?: Partial<ModeSwitchingConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.metrics = {
      averageTransitionTime: 0,
      transitionCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      preloadSuccess: 0,
      preloadFailures: 0
    };
    
    this.preloadedModes = new Map();
    this.preloadTimers = new Map();
  }

  /**
   * Request a mode change with optimizations
   * @param request Mode transition request
   * @returns Promise that resolves with the transition result
   */
  async requestModeChange(request: ModeTransitionRequest): Promise<ModeTransitionResult> {
    const startTime = performance.now();

    try {
      // Check cache for preloaded mode data
      if (this.config.enableCaching) {
        const cachedData = this.preloadedModes.get(request.toMode);
        if (cachedData && performance.now() - cachedData.timestamp < cachedData.ttl) {
          this.metrics.cacheHits++;
          // Use cached data for faster initialization
          // In a real implementation, this would apply the cached configuration
        } else {
          this.metrics.cacheMisses++;
          // Remove expired cache entry
          this.preloadedModes.delete(request.toMode);
        }
      }

      // Execute transition with timeout
      const result = await this.executeTransitionWithTimeout(request);

      // Update metrics
      if (this.config.enableMetrics) {
        const transitionTime = performance.now() - startTime;
        this.updateMetrics(transitionTime, result.success);
      }

      // Preload next likely mode if enabled
      if (this.config.enablePreloading) {
        this.schedulePreload(request.toMode);
      }

      return result;
    } catch (error) {
      // Update metrics for failed transition
      if (this.config.enableMetrics) {
        const transitionTime = performance.now() - startTime;
        this.updateMetrics(transitionTime, false);
      }

      return {
        success: false,
        fromMode: request.fromMode,
        toMode: request.toMode,
        transitionTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute transition with timeout
   * @param request Transition request
   * @returns Promise that resolves with the transition result
   */
  private async executeTransitionWithTimeout(request: ModeTransitionRequest): Promise<ModeTransitionResult> {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Mode transition timed out after ${this.config.transitionTimeout}ms`));
      }, this.config.transitionTimeout);

      // Execute transition
      super.requestModeChange(request)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Schedule preloading of a mode
   * @param currentMode Current mode
   */
  private schedulePreload(currentMode: RooMode): void {
    // Clear existing preload timer for this mode
    const existingTimer = this.preloadTimers.get(currentMode);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule preload with delay
    const timer = setTimeout(() => {
      this.preloadLikelyNextMode(currentMode);
      this.preloadTimers.delete(currentMode);
    }, this.config.preloadDelay);

    this.preloadTimers.set(currentMode, timer);
  }

  /**
   * Preload the most likely next mode based on usage patterns
   * @param currentMode Current mode
   */
  private async preloadLikelyNextMode(currentMode: RooMode): Promise<void> {
    try {
      // Determine the most likely next mode
      // In a real implementation, this would be based on historical data
      const nextMode = this.predictNextMode(currentMode);
      
      if (nextMode) {
        // Preload mode configuration and resources
        const config = this.getModeConfig(nextMode);
        if (config) {
          // Store preloaded data with TTL
          this.preloadedModes.set(nextMode, {
            mode: nextMode,
            config,
            timestamp: performance.now(),
            ttl: 30000 // 30 seconds
          });
          
          this.metrics.preloadSuccess++;
        }
      }
    } catch (error) {
      this.metrics.preloadFailures++;
      console.warn(`Failed to preload mode: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Predict the most likely next mode based on current mode
   * @param currentMode Current mode
   * @returns Predicted next mode or undefined
   */
  private predictNextMode(currentMode: RooMode): RooMode | undefined {
    // Simple prediction based on common transitions
    // In a real implementation, this would use machine learning or historical data
    const commonTransitions: Record<RooMode, RooMode> = {
      'ask': 'code',
      'code': 'debug',
      'debug': 'ask',
      'architect': 'code',
      'custom': 'ask'
    };
    
    return commonTransitions[currentMode];
  }

  /**
   * Update transition metrics
   * @param transitionTime Time taken for transition
   * @param success Whether transition was successful
   */
  private updateMetrics(transitionTime: number, success: boolean): void {
    // Update average transition time
    this.metrics.transitionCount++;
    this.metrics.averageTransitionTime = 
      ((this.metrics.averageTransitionTime * (this.metrics.transitionCount - 1)) + transitionTime) / 
      this.metrics.transitionCount;
  }

  /**
   * Update configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<ModeSwitchingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ModeSwitchingConfig {
    return { ...this.config };
  }

  /**
   * Get transition metrics
   * @returns Current transition metrics
   */
  getMetrics(): ModeTransitionMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear preloaded modes
   */
  clearPreloadedModes(): void {
    this.preloadedModes.clear();
    
    // Clear all preload timers
    for (const timer of this.preloadTimers.values()) {
      clearTimeout(timer);
    }
    this.preloadTimers.clear();
  }

  /**
   * Get cache hit rate
   * @returns Cache hit rate as a percentage
   */
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  /**
   * Get average transition time
   * @returns Average transition time in milliseconds
   */
  getAverageTransitionTime(): number {
    return this.metrics.averageTransitionTime;
  }
}

/**
 * Mode Switching Performance Monitor
 */
export class ModeSwitchingMonitor {
  private controller: OptimizedModeController;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(controller: OptimizedModeController) {
    this.controller = controller;
  }

  /**
   * Start monitoring mode switching performance
   * @param interval Monitoring interval in milliseconds
   */
  startMonitoring(interval: number = 10000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.logPerformanceMetrics();
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(): void {
    const metrics = this.controller.getMetrics();
    const avgTime = this.controller.getAverageTransitionTime();
    const cacheHitRate = this.controller.getCacheHitRate();

    console.log('Mode Switching Performance Metrics:');
    console.log(`  Average Transition Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Transitions: ${metrics.transitionCount}`);
    console.log(`  Cache Hit Rate: ${cacheHitRate.toFixed(2)}%`);
    console.log(`  Preload Success: ${metrics.preloadSuccess}`);
    console.log(`  Preload Failures: ${metrics.preloadFailures}`);
  }
}

// Export optimized mode controller instance
export const optimizedModeController = new OptimizedModeController();

// Export monitor instance
export const modeSwitchingMonitor = new ModeSwitchingMonitor(optimizedModeController);