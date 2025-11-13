/**
 * Inference Manager v2 for LAPA v1.3.0-preview — Phase 21
 * 
 * Health checks, thermal guard, auto-fallback between NIM/Ollama.
 * Hardware-aware performance modes with thermal capping.
 * 
 * Features:
 * - Health checks for NIM and Ollama
 * - Thermal monitoring and capping
 * - Auto-fallback between backends
 * - Hardware-aware performance modes (1-10)
 * - Live preview and simulation
 */

import { eventBus } from '../core/event-bus.ts';
import { isOllamaAvailable, startOllamaContainer, sendOllamaChatRequest } from './ollama.local.ts';
import { isNIMAvailable, startNIMContainer, sendNIMInferenceRequest, stopNIMContainer } from './nim.local.ts';
import si from 'systeminformation';

// Alert threshold configuration
interface AlertThresholds {
  cpuTempWarning: number; // Celsius
  cpuTempCritical: number; // Celsius
  gpuTempWarning: number; // Celsius
  gpuTempCritical: number; // Celsius
  cpuUsageWarning: number; // Percentage
  memoryUsageWarning: number; // Percentage
  vramUsageWarning: number; // Percentage
  vramUsageCritical: number; // Percentage
}

// Inference backend type
export type InferenceBackend = 'ollama' | 'nim' | 'auto';

// Performance mode (1-10, hardware-aware)
export type PerformanceMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// System health status
export interface SystemHealth {
  cpuTemp: number; // Celsius
  gpuTemp: number; // Celsius
  cpuUsage: number; // Percentage
  gpuUsage: number; // Percentage
  memoryUsage: number; // Percentage
  vramUsage: number; // Percentage
  thermalThrottle: boolean;
}

// Inference manager configuration
export interface InferenceManagerConfig {
  defaultBackend: InferenceBackend;
  perfMode: PerformanceMode;
  enableThermalGuard: boolean;
  maxCpuTemp: number; // Celsius (default: 85)
  maxGpuTemp: number; // Celsius (default: 90)
  enableAutoFallback: boolean;
  healthCheckInterval: number; // milliseconds (default: 5000)
  enableLivePreview: boolean;
  alertThresholds: AlertThresholds;
}

// Inference request
export interface InferenceRequest {
  model: string;
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  parameters?: Record<string, any>;
  backend?: InferenceBackend;
}

// Inference response
export interface InferenceResponse {
  response: string;
  backend: InferenceBackend;
  tokensUsed?: number;
  latency: number; // milliseconds
  healthStatus: SystemHealth;
}

/**
 * Inference Manager v2
 * 
 * Manages inference backends with health checks, thermal guard, and auto-fallback.
 */
export class InferenceManager {
  private config: InferenceManagerConfig;
  private currentBackend: InferenceBackend;
  private healthStatus: SystemHealth;
  private healthCheckTimer?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(config?: Partial<InferenceManagerConfig>) {
    this.config = {
      defaultBackend: config?.defaultBackend || 'ollama',
      perfMode: config?.perfMode || 5,
      enableThermalGuard: config?.enableThermalGuard ?? true,
      maxCpuTemp: config?.maxCpuTemp || 85,
      maxGpuTemp: config?.maxGpuTemp || 90,
      enableAutoFallback: config?.enableAutoFallback ?? true,
      healthCheckInterval: config?.healthCheckInterval || 5000,
      enableLivePreview: config?.enableLivePreview ?? true,
      alertThresholds: {
        cpuTempWarning: config?.alertThresholds?.cpuTempWarning || 70,
        cpuTempCritical: config?.alertThresholds?.cpuTempCritical || 85,
        gpuTempWarning: config?.alertThresholds?.gpuTempWarning || 75,
        gpuTempCritical: config?.alertThresholds?.gpuTempCritical || 90,
        cpuUsageWarning: config?.alertThresholds?.cpuUsageWarning || 80,
        memoryUsageWarning: config?.alertThresholds?.memoryUsageWarning || 85,
        vramUsageWarning: config?.alertThresholds?.vramUsageWarning || 80,
        vramUsageCritical: config?.alertThresholds?.vramUsageCritical || 95
      }
    };

    this.currentBackend = this.config.defaultBackend;
    this.healthStatus = {
      cpuTemp: 0,
      gpuTemp: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      memoryUsage: 0,
      vramUsage: 0,
      thermalThrottle: false
    };
  }

  /**
   * Initializes the inference manager
   */
  async initialize(): Promise<void> {
    try {
      // Start health monitoring
      if (this.config.enableThermalGuard) {
        await this.startHealthMonitoring();
      }

      // Initialize default backend
      await this.ensureBackendAvailable(this.currentBackend);

      this.isInitialized = true;

      eventBus.publish({
        id: `inference-init-${Date.now()}`,
        type: 'inference.initialized',
        timestamp: Date.now(),
        source: 'inference-manager',
        payload: {
          backend: this.currentBackend,
          perfMode: this.config.perfMode
        }
      } as any).catch(console.error);

      console.log(`[InferenceManager] Initialized with backend: ${this.currentBackend}, perfMode: ${this.config.perfMode}`);
    } catch (error) {
      console.error('[InferenceManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Starts health monitoring
   */
  private async startHealthMonitoring(): Promise<void> {
    this.healthCheckTimer = setInterval(async () => {
      await this.updateHealthStatus();
      
      // Check for alerts
      await this.checkAlerts();
      
      // Check for thermal throttling
      if (this.healthStatus.thermalThrottle && this.config.enableAutoFallback) {
        await this.handleThermalThrottle();
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Updates system health status
   */
  private async updateHealthStatus(): Promise<void> {
    try {
      // Get real system monitoring data using systeminformation library
      const [cpuTempData, cpuLoadData, memData, graphicsData] = await Promise.all([
        si.cpuTemperature(),
        si.currentLoad(),
        si.mem(),
        si.graphics()
      ]).catch((error) => {
        console.error('[InferenceManager] Failed to get system information:', error);
        // Return default values on error
        return [{ main: 0, max: 0 }, { currentLoad: 0 }, { active: 0, total: 1 }, { controllers: [] }];
      });
      
      // Log raw data for debugging
      console.debug('[InferenceManager] Raw system data:', {
        cpuTempData,
        cpuLoadData,
        memData,
        graphicsData
      });
      
      // Extract CPU temperature (main average or max if available)
      const cpuTemp = cpuTempData.main || cpuTempData.max || 0;
      
      // Extract GPU temperature (first GPU with temperature data)
      let gpuTemp = 0;
      if (graphicsData.controllers && graphicsData.controllers.length > 0) {
        const gpuWithTemp = graphicsData.controllers.find(c =>
          c.temperatureGpu !== undefined && c.temperatureGpu > 0
        );
        gpuTemp = gpuWithTemp ? gpuWithTemp.temperatureGpu! : 0;
      }
      
      // Extract CPU usage
      const cpuUsage = cpuLoadData.currentLoad || 0;
      
      // Extract GPU usage (first GPU with utilization data)
      let gpuUsage = 0;
      if (graphicsData.controllers && graphicsData.controllers.length > 0) {
        const gpuWithUtil = graphicsData.controllers.find(c =>
          c.utilizationGpu !== undefined && c.utilizationGpu >= 0
        );
        gpuUsage = gpuWithUtil ? gpuWithUtil.utilizationGpu! : 0;
      }
      
      // Extract system memory usage
      const memoryUsage = memData.total > 0 ? Math.round((memData.active / memData.total) * 100) : 0;
      
      // Extract VRAM usage (first GPU with memory data)
      let vramUsage = 0;
      if (graphicsData.controllers && graphicsData.controllers.length > 0) {
        const gpuWithMem = graphicsData.controllers.find(c =>
          c.memoryUsed !== undefined && c.memoryUsed >= 0 && c.memoryTotal !== undefined && c.memoryTotal > 0
        );
        if (gpuWithMem) {
          vramUsage = Math.round((gpuWithMem.memoryUsed! / gpuWithMem.memoryTotal!) * 100);
        }
      }
      
      const health: SystemHealth = {
        cpuTemp,
        gpuTemp,
        cpuUsage,
        gpuUsage,
        memoryUsage,
        vramUsage,
        thermalThrottle: false
      };

      // Check for thermal throttling
      health.thermalThrottle =
        health.cpuTemp > this.config.maxCpuTemp ||
        health.gpuTemp > this.config.maxGpuTemp;

      this.healthStatus = health;

      // Emit health update event
      eventBus.publish({
        id: `inference-health-${Date.now()}`,
        type: 'inference.health.updated',
        timestamp: Date.now(),
        source: 'inference-manager',
        payload: { health }
      } as any).catch(console.error);
    } catch (error) {
      console.error('[InferenceManager] Failed to update health status:', error);
    }
  }

  /**
   * Checks for system alerts based on thresholds
   */
  private async checkAlerts(): Promise<void> {
    try {
      const alerts: string[] = [];
      const { alertThresholds } = this.config;
      const { cpuTemp, gpuTemp, cpuUsage, memoryUsage } = this.healthStatus;

      // CPU Temperature Alerts
      if (cpuTemp >= alertThresholds.cpuTempCritical) {
        alerts.push(`CPU Critical Temperature: ${cpuTemp.toFixed(1)}°C`);
      } else if (cpuTemp >= alertThresholds.cpuTempWarning) {
        alerts.push(`CPU High Temperature: ${cpuTemp.toFixed(1)}°C`);
      }

      // GPU Temperature Alerts
      if (gpuTemp >= alertThresholds.gpuTempCritical) {
        alerts.push(`GPU Critical Temperature: ${gpuTemp.toFixed(1)}°C`);
      } else if (gpuTemp >= alertThresholds.gpuTempWarning) {
        alerts.push(`GPU High Temperature: ${gpuTemp.toFixed(1)}°C`);
      }

      // CPU Usage Alerts
      if (cpuUsage >= alertThresholds.cpuUsageWarning) {
        alerts.push(`High CPU Usage: ${cpuUsage.toFixed(1)}%`);
      }

      // Memory Usage Alerts
      if (memoryUsage >= alertThresholds.memoryUsageWarning) {
        alerts.push(`High Memory Usage: ${memoryUsage.toFixed(1)}%`);
      }
      
      // VRAM Usage Alerts
      if (vramUsage >= alertThresholds.vramUsageCritical) {
        alerts.push(`VRAM Critical Usage: ${vramUsage.toFixed(1)}%`);
      } else if (vramUsage >= alertThresholds.vramUsageWarning) {
        alerts.push(`High VRAM Usage: ${vramUsage.toFixed(1)}%`);
      }

      // Emit alerts if any
      if (alerts.length > 0) {
        eventBus.publish({
          id: `inference-alerts-${Date.now()}`,
          type: 'inference.alerts.triggered',
          timestamp: Date.now(),
          source: 'inference-manager',
          payload: {
            alerts,
            health: { ...this.healthStatus }
          }
        } as any).catch(console.error);

        // Log alerts
        for (const alert of alerts) {
          console.warn(`[InferenceManager] ALERT: ${alert}`);
        }
      }
    } catch (error) {
      console.error('[InferenceManager] Failed to check alerts:', error);
    }
  }

  /**
   * Handles thermal throttling by switching to lower-performance backend
   */
  private async handleThermalThrottle(): Promise<void> {
    // Emit thermal throttle event before taking action
    eventBus.publish({
      id: `inference-thermal-throttle-${Date.now()}`,
      type: 'inference.thermal.throttle',
      timestamp: Date.now(),
      source: 'inference-manager',
      payload: {
        health: { ...this.healthStatus },
        backend: this.currentBackend,
        perfMode: this.config.perfMode
      }
    } as any).catch(console.error);

    if (this.currentBackend === 'nim') {
      console.log('[InferenceManager] Thermal throttle detected, switching to Ollama');
      await this.switchBackend('ollama');
    } else if (this.config.perfMode > 3) {
      console.log('[InferenceManager] Thermal throttle detected, reducing performance mode');
      this.setPerformanceMode(Math.max(1, this.config.perfMode - 2) as PerformanceMode);
    }
  }

  /**
   * Ensures backend is available, starts if needed
   */
  private async ensureBackendAvailable(backend: InferenceBackend): Promise<void> {
    if (backend === 'auto') {
      // Try NIM first, fallback to Ollama
      if (await isNIMAvailable()) {
        this.currentBackend = 'nim';
        return;
      } else if (await isOllamaAvailable()) {
        this.currentBackend = 'ollama';
        return;
      } else {
        // Start Ollama as default
        await startOllamaContainer();
        this.currentBackend = 'ollama';
        return;
      }
    }

    if (backend === 'nim') {
      if (!(await isNIMAvailable())) {
        await startNIMContainer();
      }
      this.currentBackend = 'nim';
    } else if (backend === 'ollama') {
      if (!(await isOllamaAvailable())) {
        await startOllamaContainer();
      }
      this.currentBackend = 'ollama';
    }
  }

  /**
   * Switches inference backend
   */
  async switchBackend(backend: InferenceBackend): Promise<void> {
    try {
      await this.ensureBackendAvailable(backend);
      
      eventBus.publish({
        id: `inference-backend-switch-${Date.now()}`,
        type: 'inference.backend.switched',
        timestamp: Date.now(),
        source: 'inference-manager',
        payload: { backend: this.currentBackend }
      } as any).catch(console.error);

      console.log(`[InferenceManager] Switched to backend: ${this.currentBackend}`);
    } catch (error) {
      console.error(`[InferenceManager] Failed to switch backend:`, error);
      throw error;
    }
  }

  /**
   * Sets performance mode (1-10)
   */
  setPerformanceMode(mode: PerformanceMode): void {
    this.config.perfMode = mode;
    
    // Adjust batch size and other parameters based on mode
    // Higher mode = more aggressive performance
    
    eventBus.publish({
      id: `inference-perf-mode-${Date.now()}`,
      type: 'inference.perf-mode.changed',
      timestamp: Date.now(),
      source: 'inference-manager',
      payload: { perfMode: mode }
    } as any).catch(console.error);
  }

  /**
   * Gets current performance mode
   */
  getPerformanceMode(): PerformanceMode {
    return this.config.perfMode;
  }

  /**
   * Sends inference request with auto-fallback
   */
  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = Date.now();
    const backend = request.backend || this.currentBackend;

    try {
      // Check health before inference
      if (this.config.enableThermalGuard) {
        await this.updateHealthStatus();
        if (this.healthStatus.thermalThrottle && backend === 'nim') {
          // Auto-fallback to Ollama if thermal throttling
          return this.infer({ ...request, backend: 'ollama' });
        }
      }

      let response: string;
      let tokensUsed: number | undefined;

      if (backend === 'nim' || (backend === 'auto' && this.currentBackend === 'nim')) {
        response = await sendNIMInferenceRequest(
          request.model,
          request.prompt,
          this.getInferenceParameters()
        );
      } else {
        // Use Ollama
        if (request.messages) {
          response = await sendOllamaChatRequest(
            request.model,
            request.messages,
            this.getInferenceParameters()
          );
        } else {
          response = await sendOllamaChatRequest(
            request.model,
            [{ role: 'user', content: request.prompt }],
            this.getInferenceParameters()
          );
        }
      }

      const latency = Date.now() - startTime;

      return {
        response,
        backend: this.currentBackend,
        tokensUsed,
        latency,
        healthStatus: { ...this.healthStatus }
      };
    } catch (error) {
      // Auto-fallback on error
      if (this.config.enableAutoFallback && backend !== 'ollama') {
        console.log(`[InferenceManager] Inference failed, falling back to Ollama:`, error);
        return this.infer({ ...request, backend: 'ollama' });
      }
      throw error;
    }
  }

  /**
   * Gets inference parameters based on performance mode
   */
  private getInferenceParameters(): Record<string, any> {
    // Adjust parameters based on perfMode (1-10)
    // Higher mode = more tokens, higher temperature, etc.
    const baseParams: Record<string, any> = {
      temperature: 0.7 + (this.config.perfMode * 0.03), // 0.7 to 1.0
      top_p: 0.9,
      top_k: 40,
    };

    // Adjust batch size for higher performance modes
    if (this.config.perfMode >= 7) {
      baseParams.batch_size = 4;
    } else if (this.config.perfMode >= 5) {
      baseParams.batch_size = 2;
    } else {
      baseParams.batch_size = 1;
    }

    return baseParams;
  }

  /**
   * Gets current health status
   */
  getHealthStatus(): SystemHealth {
    return { ...this.healthStatus };
  }

  /**
   * Gets current backend
   */
  getCurrentBackend(): InferenceBackend {
    return this.currentBackend;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}

// Singleton instance
let inferenceManagerInstance: InferenceManager | null = null;

/**
 * Gets the inference manager instance
 */
export function getInferenceManager(config?: Partial<InferenceManagerConfig>): InferenceManager {
  if (!inferenceManagerInstance) {
    inferenceManagerInstance = new InferenceManager(config);
  }
  return inferenceManagerInstance;
}
