"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InferenceManager = void 0;
exports.getInferenceManager = getInferenceManager;
const event_bus_ts_1 = require("../core/event-bus.ts");
const ollama_local_ts_1 = require("./ollama.local.ts");
const nim_local_ts_1 = require("./nim.local.ts");
const systeminformation_1 = __importDefault(require("systeminformation"));
/**
 * Inference Manager v2
 *
 * Manages inference backends with health checks, thermal guard, and auto-fallback.
 */
class InferenceManager {
    config;
    currentBackend;
    healthStatus;
    healthCheckTimer;
    isInitialized = false;
    constructor(config) {
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
    async initialize() {
        try {
            // Start health monitoring
            if (this.config.enableThermalGuard) {
                await this.startHealthMonitoring();
            }
            // Initialize default backend
            await this.ensureBackendAvailable(this.currentBackend);
            this.isInitialized = true;
            event_bus_ts_1.eventBus.publish({
                id: `inference-init-${Date.now()}`,
                type: 'inference.initialized',
                timestamp: Date.now(),
                source: 'inference-manager',
                payload: {
                    backend: this.currentBackend,
                    perfMode: this.config.perfMode
                }
            }).catch(console.error);
            console.log(`[InferenceManager] Initialized with backend: ${this.currentBackend}, perfMode: ${this.config.perfMode}`);
        }
        catch (error) {
            console.error('[InferenceManager] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Starts health monitoring
     */
    async startHealthMonitoring() {
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
    async updateHealthStatus() {
        try {
            // Get real system monitoring data using systeminformation library
            const [cpuTempData, cpuLoadData, memData, graphicsData] = await Promise.all([
                systeminformation_1.default.cpuTemperature(),
                systeminformation_1.default.currentLoad(),
                systeminformation_1.default.mem(),
                systeminformation_1.default.graphics()
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
                const gpuWithTemp = graphicsData.controllers.find(c => c.temperatureGpu !== undefined && c.temperatureGpu > 0);
                gpuTemp = gpuWithTemp ? gpuWithTemp.temperatureGpu : 0;
            }
            // Extract CPU usage
            const cpuUsage = cpuLoadData.currentLoad || 0;
            // Extract GPU usage (first GPU with utilization data)
            let gpuUsage = 0;
            if (graphicsData.controllers && graphicsData.controllers.length > 0) {
                const gpuWithUtil = graphicsData.controllers.find(c => c.utilizationGpu !== undefined && c.utilizationGpu >= 0);
                gpuUsage = gpuWithUtil ? gpuWithUtil.utilizationGpu : 0;
            }
            // Extract system memory usage
            const totalMem = memData?.total ?? 0;
            const activeMem = memData?.active ?? 0;
            const memoryUsage = totalMem > 0 ? Math.round((activeMem / totalMem) * 100) : 0;
            // Extract VRAM usage (first GPU with memory data)
            let vramUsage = 0;
            if (graphicsData.controllers && graphicsData.controllers.length > 0) {
                const gpuWithMem = graphicsData.controllers.find(c => c.memoryUsed !== undefined && c.memoryUsed >= 0 && c.memoryTotal !== undefined && c.memoryTotal > 0);
                if (gpuWithMem) {
                    vramUsage = Math.round((gpuWithMem.memoryUsed / gpuWithMem.memoryTotal) * 100);
                }
            }
            const health = {
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
            event_bus_ts_1.eventBus.publish({
                id: `inference-health-${Date.now()}`,
                type: 'inference.health.updated',
                timestamp: Date.now(),
                source: 'inference-manager',
                payload: { health }
            }).catch(console.error);
        }
        catch (error) {
            console.error('[InferenceManager] Failed to update health status:', error);
        }
    }
    /**
     * Checks for system alerts based on thresholds
     */
    async checkAlerts() {
        try {
            const alerts = [];
            const { alertThresholds } = this.config;
            const { cpuTemp, gpuTemp, cpuUsage, memoryUsage, vramUsage } = this.healthStatus;
            // CPU Temperature Alerts
            if (cpuTemp >= alertThresholds.cpuTempCritical) {
                alerts.push(`CPU Critical Temperature: ${cpuTemp.toFixed(1)}°C`);
            }
            else if (cpuTemp >= alertThresholds.cpuTempWarning) {
                alerts.push(`CPU High Temperature: ${cpuTemp.toFixed(1)}°C`);
            }
            // GPU Temperature Alerts
            if (gpuTemp >= alertThresholds.gpuTempCritical) {
                alerts.push(`GPU Critical Temperature: ${gpuTemp.toFixed(1)}°C`);
            }
            else if (gpuTemp >= alertThresholds.gpuTempWarning) {
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
            }
            else if (vramUsage >= alertThresholds.vramUsageWarning) {
                alerts.push(`High VRAM Usage: ${vramUsage.toFixed(1)}%`);
            }
            // Emit alerts if any
            if (alerts.length > 0) {
                event_bus_ts_1.eventBus.publish({
                    id: `inference-alerts-${Date.now()}`,
                    type: 'inference.alerts.triggered',
                    timestamp: Date.now(),
                    source: 'inference-manager',
                    payload: {
                        alerts,
                        health: { ...this.healthStatus }
                    }
                }).catch(console.error);
                // Log alerts
                for (const alert of alerts) {
                    console.warn(`[InferenceManager] ALERT: ${alert}`);
                }
            }
        }
        catch (error) {
            console.error('[InferenceManager] Failed to check alerts:', error);
        }
    }
    /**
     * Handles thermal throttling by switching to lower-performance backend
     */
    async handleThermalThrottle() {
        // Emit thermal throttle event before taking action
        event_bus_ts_1.eventBus.publish({
            id: `inference-thermal-throttle-${Date.now()}`,
            type: 'inference.thermal.throttle',
            timestamp: Date.now(),
            source: 'inference-manager',
            payload: {
                health: { ...this.healthStatus },
                backend: this.currentBackend,
                perfMode: this.config.perfMode
            }
        }).catch(console.error);
        if (this.currentBackend === 'nim') {
            console.log('[InferenceManager] Thermal throttle detected, switching to Ollama');
            await this.switchBackend('ollama');
        }
        else if (this.config.perfMode > 3) {
            console.log('[InferenceManager] Thermal throttle detected, reducing performance mode');
            this.setPerformanceMode(Math.max(1, this.config.perfMode - 2));
        }
    }
    /**
     * Ensures backend is available, starts if needed
     */
    async ensureBackendAvailable(backend) {
        if (backend === 'auto') {
            // Try NIM first, fallback to Ollama
            if (await (0, nim_local_ts_1.isNIMAvailable)()) {
                this.currentBackend = 'nim';
                return;
            }
            else if (await (0, ollama_local_ts_1.isOllamaAvailable)()) {
                this.currentBackend = 'ollama';
                return;
            }
            else {
                // Start Ollama as default
                await (0, ollama_local_ts_1.startOllamaContainer)();
                this.currentBackend = 'ollama';
                return;
            }
        }
        if (backend === 'nim') {
            if (!(await (0, nim_local_ts_1.isNIMAvailable)())) {
                await (0, nim_local_ts_1.startNIMContainer)();
            }
            this.currentBackend = 'nim';
        }
        else if (backend === 'ollama') {
            if (!(await (0, ollama_local_ts_1.isOllamaAvailable)())) {
                await (0, ollama_local_ts_1.startOllamaContainer)();
            }
            this.currentBackend = 'ollama';
        }
    }
    /**
     * Switches inference backend
     */
    async switchBackend(backend) {
        try {
            await this.ensureBackendAvailable(backend);
            event_bus_ts_1.eventBus.publish({
                id: `inference-backend-switch-${Date.now()}`,
                type: 'inference.backend.switched',
                timestamp: Date.now(),
                source: 'inference-manager',
                payload: { backend: this.currentBackend }
            }).catch(console.error);
            console.log(`[InferenceManager] Switched to backend: ${this.currentBackend}`);
        }
        catch (error) {
            console.error(`[InferenceManager] Failed to switch backend:`, error);
            throw error;
        }
    }
    /**
     * Sets performance mode (1-10)
     */
    setPerformanceMode(mode) {
        this.config.perfMode = mode;
        // Adjust batch size and other parameters based on mode
        // Higher mode = more aggressive performance
        event_bus_ts_1.eventBus.publish({
            id: `inference-perf-mode-${Date.now()}`,
            type: 'inference.perf-mode.changed',
            timestamp: Date.now(),
            source: 'inference-manager',
            payload: { perfMode: mode }
        }).catch(console.error);
    }
    /**
     * Gets current performance mode
     */
    getPerformanceMode() {
        return this.config.perfMode;
    }
    /**
     * Sends inference request with auto-fallback
     */
    async infer(request) {
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
            let response;
            let tokensUsed;
            if (backend === 'nim' || (backend === 'auto' && this.currentBackend === 'nim')) {
                response = await (0, nim_local_ts_1.sendNIMInferenceRequest)(request.model, request.prompt, this.getInferenceParameters());
            }
            else {
                // Use Ollama
                if (request.messages) {
                    response = await (0, ollama_local_ts_1.sendOllamaChatRequest)(request.model, request.messages, this.getInferenceParameters());
                }
                else {
                    response = await (0, ollama_local_ts_1.sendOllamaChatRequest)(request.model, [{ role: 'user', content: request.prompt }], this.getInferenceParameters());
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
        }
        catch (error) {
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
    getInferenceParameters() {
        // Adjust parameters based on perfMode (1-10)
        // Higher mode = more tokens, higher temperature, etc.
        const baseParams = {
            temperature: 0.7 + (this.config.perfMode * 0.03), // 0.7 to 1.0
            top_p: 0.9,
            top_k: 40,
        };
        // Adjust batch size for higher performance modes
        if (this.config.perfMode >= 7) {
            baseParams.batch_size = 4;
        }
        else if (this.config.perfMode >= 5) {
            baseParams.batch_size = 2;
        }
        else {
            baseParams.batch_size = 1;
        }
        return baseParams;
    }
    /**
     * Gets current health status
     */
    getHealthStatus() {
        return { ...this.healthStatus };
    }
    /**
     * Gets current backend
     */
    getCurrentBackend() {
        return this.currentBackend;
    }
    /**
     * Cleanup
     */
    dispose() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
    }
    /**
     * Gets current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Updates configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        return this.getConfig();
    }
    /**
     * Checks health of a provider
     */
    async checkHealth(provider) {
        if (provider === 'nim') {
            return { provider, available: await (0, nim_local_ts_1.isNIMAvailable)() };
        }
        if (provider === 'ollama') {
            return { provider, available: await (0, ollama_local_ts_1.isOllamaAvailable)() };
        }
        if (provider === 'auto') {
            const nim = await (0, nim_local_ts_1.isNIMAvailable)();
            const ollama = await (0, ollama_local_ts_1.isOllamaAvailable)();
            return { provider, available: nim || ollama };
        }
        // Assume external provider availability is handled elsewhere
        return { provider, available: true };
    }
}
exports.InferenceManager = InferenceManager;
// Singleton instance
let inferenceManagerInstance = null;
/**
 * Gets the inference manager instance
 */
function getInferenceManager(config) {
    if (!inferenceManagerInstance) {
        inferenceManagerInstance = new InferenceManager(config);
    }
    return inferenceManagerInstance;
}
//# sourceMappingURL=manager.js.map