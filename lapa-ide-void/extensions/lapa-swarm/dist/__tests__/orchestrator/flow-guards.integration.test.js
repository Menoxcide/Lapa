"use strict";
/**
 * Integration tests for Flow Guards functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = require("fs");
const path_1 = require("path");
const flow_guards_ts_1 = require("../../orchestrator/flow-guards.ts");
const flow_guard_authoring_ts_1 = require("../../orchestrator/flow-guard-authoring.ts");
(0, vitest_1.describe)('Flow Guards Integration', () => {
    let flowGuardsManager;
    let testConfigPath;
    let tempDir;
    (0, vitest_1.beforeEach)(() => {
        // Create a temporary directory for testing
        tempDir = (0, path_1.join)(process.cwd(), '.temp-tests');
        if (!(0, fs_1.existsSync)(tempDir)) {
            (0, fs_1.mkdirSync)(tempDir, { recursive: true });
        }
        testConfigPath = (0, path_1.join)(tempDir, 'flow-guards-test.yaml');
        flowGuardsManager = new flow_guards_ts_1.FlowGuardsManager(testConfigPath);
    });
    (0, vitest_1.afterEach)(() => {
        // Clean up test files
        if ((0, fs_1.existsSync)(tempDir)) {
            (0, fs_1.rmSync)(tempDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)('should parse YAML configuration correctly', async () => {
        // Create a test YAML configuration
        const yamlConfig = `
version: "1.0"
guards:
  - name: "thermal-guard"
    condition: "system.temperature > 78"
    action:
      type: "route"
      targetAgent: "optimizer"
    priority: "high"
    blocking: false
    enabled: true

  - name: "quality-gate"
    condition: "task.confidence < 0.8"
    action:
      type: "require-veto"
      requiredAgents: ["reviewer", "tester"]
    priority: "critical"
    blocking: true
    enabled: true

globalSettings:
  enableGuards: true
  defaultPriority: "medium"
`;
        // Write the config to file
        (0, fs_1.writeFileSync)(testConfigPath, yamlConfig, 'utf-8');
        // Initialize the manager
        await flowGuardsManager.initialize();
        // Check that guards were loaded
        const guards = flowGuardsManager.getGuards();
        expect(guards).toHaveLength(2);
        const thermalGuard = guards.find(g => g.name === 'thermal-guard');
        expect(thermalGuard).toBeDefined();
        expect(thermalGuard?.condition).toBe('system.temperature > 78');
        expect(thermalGuard?.action).toEqual({ type: 'route', targetAgent: 'optimizer' });
        const qualityGate = guards.find(g => g.name === 'quality-gate');
        expect(qualityGate).toBeDefined();
        expect(qualityGate?.condition).toBe('task.confidence < 0.8');
        expect(qualityGate?.action).toEqual({ type: 'require-veto', requiredAgents: ['reviewer', 'tester'] });
    });
    (0, vitest_1.it)('should parse JSON configuration correctly', async () => {
        // Create a test JSON configuration
        const jsonConfig = {
            version: "1.0",
            guards: [
                {
                    name: "vram-guard",
                    condition: "system.vram > 85",
                    action: { type: "fallback", provider: "openrouter" },
                    priority: "high",
                    blocking: false,
                    enabled: true
                }
            ],
            globalSettings: {
                enableGuards: true,
                defaultPriority: "medium"
            }
        };
        // Write the config to file as JSON
        (0, fs_1.writeFileSync)(testConfigPath, JSON.stringify(jsonConfig, null, 2), 'utf-8');
        // Initialize the manager
        await flowGuardsManager.initialize();
        // Check that guards were loaded
        const guards = flowGuardsManager.getGuards();
        expect(guards).toHaveLength(1);
        const vramGuard = guards[0];
        expect(vramGuard.name).toBe('vram-guard');
        expect(vramGuard.condition).toBe('system.vram > 85');
        expect(vramGuard.action).toEqual({ type: 'fallback', provider: 'openrouter' });
    });
    (0, vitest_1.it)('should save configuration to YAML file', async () => {
        // Initialize with default config
        await flowGuardsManager.initialize();
        // Add a new guard
        const newGuard = flow_guard_authoring_ts_1.FlowGuardAuthoring.createGuard('test-guard')
            .condition('system', 'cpu', '>', 90)
            .routeTo('monitor')
            .priority('high')
            .build();
        await flowGuardsManager.addGuard(newGuard);
        // Check that the file was created and contains the guard
        expect((0, fs_1.existsSync)(testConfigPath)).toBe(true);
        const fileContent = (0, fs_1.readFileSync)(testConfigPath, 'utf-8');
        expect(fileContent).toContain('test-guard');
        expect(fileContent).toContain('system.cpu > 90');
    });
    (0, vitest_1.it)('should evaluate guards correctly', async () => {
        // Create a test configuration
        const yamlConfig = `
version: "1.0"
guards:
  - name: "high-cpu-guard"
    condition: "system.cpu > 80"
    action:
      type: "route"
      targetAgent: "optimizer"
    priority: "high"
    blocking: false
    enabled: true
`;
        // Write the config to file
        (0, fs_1.writeFileSync)(testConfigPath, yamlConfig, 'utf-8');
        // Initialize the manager
        await flowGuardsManager.initialize();
        // Test context that should trigger the guard
        const context = {
            system: {
                cpu: 85 // Above threshold of 80
            }
        };
        const results = await flowGuardsManager.evaluateGuards(context);
        expect(results).toHaveLength(1);
        expect(results[0].guard.name).toBe('high-cpu-guard');
        expect(results[0].action).toEqual({ type: 'route', targetAgent: 'optimizer' });
    });
    (0, vitest_1.it)('should handle validation errors gracefully', async () => {
        // Create an invalid configuration
        const invalidConfig = `
version: "1.0"
guards:
  - name: "invalid-guard"
    condition: "invalid condition format"
    action: "unknown-action"
    priority: "invalid-priority"
`;
        // Write the config to file
        (0, fs_1.writeFileSync)(testConfigPath, invalidConfig, 'utf-8');
        // Initialize the manager - should fall back to default config
        await flowGuardsManager.initialize();
        // Should have default guards instead
        const guards = flowGuardsManager.getGuards();
        expect(guards.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=flow-guards.integration.test.js.map