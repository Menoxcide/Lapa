import { describe, it, expect, beforeEach } from "vitest";
import { HybridHandoffSystem, HandoffConfigValidationError, HANDOFF_CONFIG_PRESETS } from '../orchestrator/handoffs.ts';

describe('Handoff Configuration Validation', () => {
  let handoffSystem: HybridHandoffSystem;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
  });

  it('should validate basic configuration correctly', () => {
    // Valid update
    expect(() => {
      handoffSystem.updateConfig({ confidenceThreshold: 0.9 });
    }).not.toThrow();
    
    // Invalid update
    expect(() => {
      handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
    }).toThrow(HandoffConfigValidationError);
  });

  it('should load configuration presets correctly', () => {
    handoffSystem.loadPreset('development');
    const devConfig = handoffSystem.getConfig();
    expect(devConfig.confidenceThreshold).toBeDefined();
    
    handoffSystem.loadPreset('production');
    const prodConfig = handoffSystem.getConfig();
    expect(prodConfig.confidenceThreshold).toBeDefined();
  });

  it('should load configuration from environment variables', () => {
    // Set some environment variables
    process.env.HANDOFF_CONFIDENCE_THRESHOLD = '0.85';
    process.env.HANDOFF_MAX_HANDOFF_DEPTH = '7';
    
    handoffSystem.loadConfigFromEnvironment();
    const envConfig = handoffSystem.getConfig();
    expect(envConfig.confidenceThreshold).toBe(0.85);
    expect(envConfig.maxHandoffDepth).toBe(7);
    
    // Clean up
    delete process.env.HANDOFF_CONFIDENCE_THRESHOLD;
    delete process.env.HANDOFF_MAX_HANDOFF_DEPTH;
  });

  it('should check configuration health', () => {
    const health = handoffSystem.checkConfigHealth();
    expect(health.isValid).toBeDefined();
    expect(Array.isArray(health.errors)).toBe(true);
  });
});