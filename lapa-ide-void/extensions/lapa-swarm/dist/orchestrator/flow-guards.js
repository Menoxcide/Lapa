"use strict";
/**
 * Flow Guards for LAPA v1.3 - Phase 22
 *
 * Extends Resonance Core with YAML-defined guards for veto routing.
 * Inspired by CrewAI's event-driven Flows with routers and guards.
 *
 * Features:
 * - YAML-defined guard conditions
 * - Conditional veto routing
 * - Thermal/performance guards
 * - Quality gates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowGuardsManager = exports.FlowGuardsManager = exports.FlowGuardsConfigSchema = exports.FlowGuardSchema = void 0;
const zod_1 = require("zod");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const event_bus_ts_1 = require("../core/event-bus.ts");
const consensus_voting_ts_1 = require("../swarm/consensus.voting.ts");
const js_yaml_1 = __importDefault(require("js-yaml"));
// Flow guard configuration
exports.FlowGuardSchema = zod_1.z.object({
    name: zod_1.z.string(),
    condition: zod_1.z.union([
        zod_1.z.string(), // Simple string condition (e.g., "system.temperature > 78")
        zod_1.z.object({
            type: zod_1.z.enum(['system', 'task', 'handoff', 'custom']),
            metric: zod_1.z.string().optional(),
            operator: zod_1.z.enum(['>', '<', '>=', '<=']).optional(),
            value: zod_1.z.number().optional(),
            expression: zod_1.z.string().optional(),
        }),
    ]),
    action: zod_1.z.union([
        zod_1.z.string(), // Simple action (e.g., "route-to-eco")
        zod_1.z.object({
            type: zod_1.z.enum(['route', 'require-veto', 'throttle', 'fallback', 'block', 'custom']),
            targetAgent: zod_1.z.string().optional(),
            requiredAgents: zod_1.z.array(zod_1.z.string()).optional(),
            factor: zod_1.z.number().optional(),
            provider: zod_1.z.enum(['ollama', 'nim', 'openrouter']).optional(),
            reason: zod_1.z.string().optional(),
            handler: zod_1.z.string().optional(),
        }),
    ]),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    blocking: zod_1.z.boolean().default(false),
    enabled: zod_1.z.boolean().default(true),
});
exports.FlowGuardsConfigSchema = zod_1.z.object({
    version: zod_1.z.string().optional(),
    guards: zod_1.z.array(exports.FlowGuardSchema),
    globalSettings: zod_1.z.object({
        enableGuards: zod_1.z.boolean().default(true),
        defaultPriority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
    }).optional(),
});
/**
 * Flow Guards Manager
 *
 * Manages YAML-defined flow guards for veto routing and conditional actions.
 */
class FlowGuardsManager {
    config;
    configPath;
    consensusVoting;
    guards = new Map();
    constructor(configPath) {
        const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
        this.configPath = configPath || (0, path_1.join)(homeDir, '.lapa', 'flow-guards.yaml');
        this.config = {
            guards: [],
            globalSettings: {
                enableGuards: true,
                defaultPriority: 'medium',
            },
        };
        this.consensusVoting = new consensus_voting_ts_1.ConsensusVotingSystem();
    }
    /**
     * Initializes the flow guards manager and loads configuration
     */
    async initialize() {
        try {
            await this.loadConfig();
            this.registerGuards();
        }
        catch (error) {
            console.error('[FlowGuardsManager] Failed to initialize:', error);
        }
    }
    /**
     * Loads configuration from YAML file
     */
    async loadConfig() {
        try {
            if ((0, fs_1.existsSync)(this.configPath)) {
                const content = await (0, promises_1.readFile)(this.configPath, 'utf-8');
                const parsed = this.parseYAML(content);
                // Validate the configuration
                // Temporarily disable validation due to import issues
                // const validationResult = validateFlowGuardsConfig(parsed);
                // if (!validationResult.isValid) {
                //   console.warn('[FlowGuardsManager] Configuration validation warnings:', validationResult.errors);
                //   // Still try to use the config but log warnings
                // }
                this.config = exports.FlowGuardsConfigSchema.parse(parsed);
            }
            else {
                // Create default config with common guards
                this.config = this.createDefaultConfig();
                await this.saveConfig();
            }
        }
        catch (error) {
            console.error('[FlowGuardsManager] Failed to load config:', error);
            this.config = this.createDefaultConfig();
        }
    }
    /**
     * Creates default flow guards configuration
     */
    createDefaultConfig() {
        return {
            version: '1.0',
            guards: [
                {
                    name: 'thermal-guard',
                    condition: 'system.temperature > 78',
                    action: { type: 'route', targetAgent: 'optimizer' },
                    priority: 'high',
                    blocking: false,
                    enabled: true,
                },
                {
                    name: 'vram-guard',
                    condition: 'system.vram > 85',
                    action: { type: 'fallback', provider: 'openrouter' },
                    priority: 'high',
                    blocking: false,
                    enabled: true,
                },
                {
                    name: 'quality-gate',
                    condition: 'task.confidence < 0.8',
                    action: { type: 'require-veto', requiredAgents: ['reviewer', 'tester'] },
                    priority: 'critical',
                    blocking: true,
                    enabled: true,
                },
                {
                    name: 'error-resilience',
                    condition: 'handoff.errorCount > 3',
                    action: { type: 'route', targetAgent: 'debugger' },
                    priority: 'high',
                    blocking: false,
                    enabled: true,
                },
                {
                    name: 'performance-optimization',
                    condition: 'handoff.latency > 1000',
                    action: { type: 'route', targetAgent: 'optimizer' },
                    priority: 'medium',
                    blocking: false,
                    enabled: true,
                },
            ],
            globalSettings: {
                enableGuards: true,
                defaultPriority: 'medium',
            },
        };
    }
    /**
     * Saves configuration to YAML file
     */
    async saveConfig() {
        try {
            // Convert config to YAML format
            const yamlContent = js_yaml_1.default.dump(this.config, {
                indent: 2,
                noRefs: true,
                lineWidth: -1,
            });
            // Write to file
            await (0, promises_1.writeFile)(this.configPath, yamlContent, 'utf-8');
        }
        catch (error) {
            console.error('[FlowGuardsManager] Failed to save config:', error);
            throw new Error(`Failed to save flow guards configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Parses YAML/JSON content
     */
    parseYAML(content) {
        try {
            // Try parsing as JSON first
            return JSON.parse(content);
        }
        catch (jsonError) {
            try {
                // If JSON parsing fails, try YAML
                return js_yaml_1.default.load(content);
            }
            catch (yamlError) {
                console.error('[FlowGuardsManager] Failed to parse config as JSON or YAML:', jsonError, yamlError);
                throw new Error('Invalid configuration format. Expected valid JSON or YAML.');
            }
        }
    }
    /**
     * Registers all guards from configuration
     */
    registerGuards() {
        this.guards.clear();
        for (const guard of this.config.guards) {
            if (guard.enabled) {
                this.guards.set(guard.name, guard);
            }
        }
    }
    /**
     * Evaluates a guard condition
     */
    evaluateCondition(guard, context) {
        // Default to true if globalSettings is undefined or enableGuards is not set
        const guardsEnabled = this.config.globalSettings?.enableGuards ?? true;
        if (!guardsEnabled) {
            return false;
        }
        const condition = guard.condition;
        // Handle string conditions
        if (typeof condition === 'string') {
            return this.evaluateStringCondition(condition, context);
        }
        // Handle object conditions
        if (typeof condition === 'object') {
            return this.evaluateObjectCondition(condition, context);
        }
        return false;
    }
    /**
     * Evaluates a string condition (e.g., "system.temperature > 78")
     */
    evaluateStringCondition(condition, context) {
        try {
            // Parse simple conditions like "system.temperature > 78"
            const parts = condition.split(/\s+/);
            if (parts.length !== 3) {
                return false;
            }
            const [path, operator, valueStr] = parts;
            const value = parseFloat(valueStr);
            // Extract metric value from context
            let metricValue;
            if (path.startsWith('system.')) {
                const metric = path.split('.')[1];
                metricValue = context.system?.[metric];
            }
            else if (path.startsWith('task.')) {
                const metric = path.split('.')[1];
                metricValue = context.task?.[metric];
            }
            else if (path.startsWith('handoff.')) {
                const metric = path.split('.')[1];
                metricValue = context.handoff?.[metric];
            }
            if (metricValue === undefined) {
                return false;
            }
            // Evaluate operator
            switch (operator) {
                case '>':
                    return metricValue > value;
                case '<':
                    return metricValue < value;
                case '>=':
                    return metricValue >= value;
                case '<=':
                    return metricValue <= value;
                default:
                    return false;
            }
        }
        catch (error) {
            console.error('[FlowGuardsManager] Failed to evaluate string condition:', error);
            return false;
        }
    }
    /**
     * Evaluates an object condition
     */
    evaluateObjectCondition(condition, context) {
        // In production, implement full object condition evaluation
        return false;
    }
    /**
     * Executes a guard action
     */
    async executeAction(guard, context) {
        const action = guard.action;
        // Handle string actions (e.g., "route-to-eco")
        if (typeof action === 'string') {
            return this.executeStringAction(action, guard, context);
        }
        // Handle object actions
        if (typeof action === 'object') {
            return this.executeObjectAction(action, guard, context);
        }
        return { success: false };
    }
    /**
     * Executes a string action
     */
    async executeStringAction(action, guard, context) {
        // Handle common string actions
        if (action === 'route-to-eco' || action === 'route-to-optimizer') {
            return {
                success: true,
                result: { type: 'route', targetAgent: 'optimizer' },
            };
        }
        if (action === 'throttle-inference') {
            return {
                success: true,
                result: { type: 'throttle', factor: 0.5 },
            };
        }
        if (action === 'require-veto') {
            return {
                success: true,
                result: { type: 'require-veto', requiredAgents: ['reviewer', 'tester'] },
            };
        }
        return { success: false };
    }
    /**
     * Executes an object action
     */
    async executeObjectAction(action, guard, context) {
        switch (action.type) {
            case 'route':
                if (action.targetAgent) {
                    await event_bus_ts_1.eventBus.publish({
                        id: `flow-guard-route-${Date.now()}`,
                        type: 'flow-guard.route',
                        timestamp: Date.now(),
                        source: 'flow-guards',
                        payload: {
                            guard: guard.name,
                            targetAgent: action.targetAgent,
                            context,
                        },
                    });
                    return { success: true, result: { type: 'route', targetAgent: action.targetAgent } };
                }
                break;
            case 'require-veto':
                if (action.requiredAgents && action.requiredAgents.length > 0) {
                    // Create voting session for veto
                    const voteOptions = [
                        { id: 'accept', label: 'Accept', value: true },
                        { id: 'reject', label: 'Reject', value: false },
                    ];
                    const sessionId = this.consensusVoting.createVotingSession(`Flow guard veto: ${guard.name}`, voteOptions, action.requiredAgents.length);
                    await event_bus_ts_1.eventBus.publish({
                        id: `flow-guard-veto-${Date.now()}`,
                        type: 'flow-guard.veto',
                        timestamp: Date.now(),
                        source: 'flow-guards',
                        payload: {
                            guard: guard.name,
                            sessionId,
                            requiredAgents: action.requiredAgents,
                            context,
                        },
                    });
                    return { success: true, result: { type: 'require-veto', sessionId } };
                }
                break;
            case 'fallback':
                if (action.provider) {
                    await event_bus_ts_1.eventBus.publish({
                        id: `flow-guard-fallback-${Date.now()}`,
                        type: 'flow-guard.fallback',
                        timestamp: Date.now(),
                        source: 'flow-guards',
                        payload: {
                            guard: guard.name,
                            provider: action.provider,
                            context,
                        },
                    });
                    return { success: true, result: { type: 'fallback', provider: action.provider } };
                }
                break;
            case 'block':
                await event_bus_ts_1.eventBus.publish({
                    id: `flow-guard-block-${Date.now()}`,
                    type: 'flow-guard.block',
                    timestamp: Date.now(),
                    source: 'flow-guards',
                    payload: {
                        guard: guard.name,
                        reason: action.reason || 'Flow guard blocked',
                        context,
                    },
                });
                return { success: true, result: { type: 'block', reason: action.reason } };
            default:
                return { success: false };
        }
        return { success: false };
    }
    /**
     * Evaluates all guards for a given context
     */
    async evaluateGuards(context) {
        // Validate the context
        // Temporarily disable validation due to import issues
        // const contextValidation = validateGuardContext(context);
        // if (!contextValidation.isValid) {
        //   console.warn('[FlowGuardsManager] Context validation errors:', contextValidation.errors);
        // }
        const triggeredGuards = [];
        // Sort guards by priority
        const sortedGuards = Array.from(this.guards.values()).sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        for (const guard of sortedGuards) {
            if (this.evaluateCondition(guard, context)) {
                const actionResult = await this.executeAction(guard, context);
                if (actionResult.success) {
                    triggeredGuards.push({ guard, action: actionResult.result });
                    // If blocking, stop evaluation
                    if (guard.blocking) {
                        break;
                    }
                }
            }
        }
        return triggeredGuards;
    }
    /**
     * Gets all registered guards
     */
    getGuards() {
        return Array.from(this.guards.values());
    }
    /**
     * Adds a new guard
     */
    async addGuard(guard) {
        // Validate the guard before adding
        // Temporarily disable validation due to import issues
        // const validationResult = validateFlowGuard(guard);
        // if (!validationResult.isValid) {
        //   throw new Error(`Invalid flow guard: ${validationResult.errors.map(e => `${e.path}: ${e.message}`).join('; ')}`);
        // }
        const validated = exports.FlowGuardSchema.parse(guard);
        this.guards.set(validated.name, validated);
        this.config.guards.push(validated);
        await this.saveConfig();
    }
    /**
     * Removes a guard
     */
    async removeGuard(guardName) {
        this.guards.delete(guardName);
        this.config.guards = this.config.guards.filter(g => g.name !== guardName);
        await this.saveConfig();
    }
}
exports.FlowGuardsManager = FlowGuardsManager;
// Export singleton instance
exports.flowGuardsManager = new FlowGuardsManager();
//# sourceMappingURL=flow-guards.js.map