"use strict";
/**
 * YAML Agent Templates Loader for LAPA v1.3 - Phase 22
 *
 * This module loads and manages YAML-defined agent configurations for the helix team.
 * Enables rapid prototyping by abstracting LAPA's 16-agent helix into YAML templates.
 *
 * Inspired by CrewAI's role/goal/backstory YAML simplicity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.yamlAgentLoader = exports.YAMLAgentLoader = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const zod_1 = require("zod");
const prompt_engineer_ts_1 = require("../orchestrator/prompt-engineer.ts");
// YAML agent configuration schema
const AgentYAMLConfigSchema = zod_1.z.object({
    role: zod_1.z.string(),
    goal: zod_1.z.string(),
    backstory: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    refineHooks: zod_1.z.array(zod_1.z.string()).optional(),
    capabilities: zod_1.z.array(zod_1.z.string()).optional(),
    tools: zod_1.z.array(zod_1.z.string()).optional(),
    persona: zod_1.z.string().optional(),
    modeBehaviors: zod_1.z.record(zod_1.z.any()).optional(),
});
// Helix team YAML configuration
const HelixTeamYAMLConfigSchema = zod_1.z.object({
    version: zod_1.z.string().optional(),
    agents: zod_1.z.record(AgentYAMLConfigSchema),
    globalSettings: zod_1.z.object({
        enableAutoRefine: zod_1.z.boolean().optional(),
        defaultModel: zod_1.z.string().optional(),
        vetoThreshold: zod_1.z.number().optional(),
    }).optional(),
});
/**
 * YAML Agent Loader
 *
 * Loads and manages YAML-defined agent configurations from ~/.lapa/agents.yaml
 */
class YAMLAgentLoader {
    configPath;
    config = null;
    defaultConfig;
    constructor(configPath) {
        // Default to ~/.lapa/agents.yaml
        const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
        this.configPath = configPath || (0, path_1.join)(homeDir, '.lapa', 'agents.yaml');
        // Initialize default helix team configuration
        this.defaultConfig = this.createDefaultConfig();
    }
    /**
     * Creates default helix team configuration
     */
    createDefaultConfig() {
        return {
            version: '1.0',
            agents: {
                architect: {
                    role: 'System Architect',
                    goal: 'Design scalable, maintainable system architectures',
                    backstory: 'Expert in system design with deep knowledge of distributed systems and microservices',
                    model: 'DeepSeek-R1-671B',
                    capabilities: ['planning', 'architecture', 'design'],
                    tools: ['diagram-generator', 'architecture-analyzer'],
                },
                researcher: {
                    role: 'Research Specialist',
                    goal: 'Gather and analyze information from codebase and external sources',
                    backstory: 'Skilled in information retrieval, semantic search, and knowledge synthesis',
                    model: 'Qwen3-235B-A22B-Instruct',
                    capabilities: ['research', 'rag', 'semantic-search'],
                    tools: ['grep', 'tail', 'web-search'],
                },
                coder: {
                    role: 'Software Engineer',
                    goal: 'Write clean, efficient, and maintainable code',
                    backstory: 'Experienced developer with expertise in multiple programming languages',
                    model: 'Qwen3-Coder-480B-A35B-Instruct',
                    capabilities: ['code-generation', 'refactoring'],
                    tools: ['code-generator', 'code-formatter'],
                },
                tester: {
                    role: 'Quality Assurance Engineer',
                    goal: 'Ensure code quality through comprehensive testing',
                    backstory: 'Dedicated to finding bugs and ensuring software reliability',
                    model: 'GLM-4.5-Air',
                    capabilities: ['testing', 'tdd', 'test-generation'],
                    tools: ['test-generator', 'test-runner'],
                },
                reviewer: {
                    role: 'Code Reviewer',
                    goal: 'Review code for quality, security, and best practices',
                    backstory: 'Meticulous reviewer with keen eye for code quality and security issues',
                    model: 'Mixtral-8x22B',
                    capabilities: ['code-review', 'linting', 'security'],
                    tools: ['code-analyzer', 'security-scanner'],
                },
                integrator: {
                    role: 'Integration Specialist',
                    goal: 'Merge and integrate code changes seamlessly',
                    backstory: 'Expert in version control, merge strategies, and conflict resolution',
                    model: 'Llama-3.1-70B',
                    capabilities: ['integration', 'merging', 'conflict-resolution'],
                    tools: ['git', 'merge-tool'],
                },
                debugger: {
                    role: 'Debug Specialist',
                    goal: 'Identify and fix bugs efficiently',
                    backstory: 'Expert problem solver with deep understanding of debugging techniques',
                    model: 'DeepSeek-R1-671B',
                    capabilities: ['debugging', 'bug-hunting', 'tracing'],
                    tools: ['error-analyzer', 'stack-trace-parser'],
                },
                oracle: {
                    role: 'Intent Clarifier',
                    goal: 'Clarify user intent and requirements',
                    backstory: 'Skilled in understanding ambiguous requirements and asking clarifying questions',
                    model: 'Phi-3.5-Vision-4K-Instruct',
                    capabilities: ['intent-detection', 'clarification', 'q&a'],
                    tools: ['prompt-refiner', 'q&a-generator'],
                },
            },
            globalSettings: {
                enableAutoRefine: true,
                defaultModel: 'ollama',
                vetoThreshold: 0.833, // 5/6 consensus
            },
        };
    }
    /**
     * Loads YAML configuration from file
     */
    async loadConfig() {
        try {
            // Ensure directory exists
            const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
            if (!(0, fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            // Load config if exists, otherwise use default
            if ((0, fs_1.existsSync)(this.configPath)) {
                const yamlContent = await (0, promises_1.readFile)(this.configPath, 'utf-8');
                // Simple YAML parser (in production, use js-yaml or similar)
                this.config = this.parseYAML(yamlContent);
            }
            else {
                // Create default config file
                this.config = this.defaultConfig;
                await this.saveConfig(this.config);
            }
            // Validate and merge with defaults
            const validated = HelixTeamYAMLConfigSchema.parse(this.config);
            this.config = this.mergeWithDefaults(validated);
            return this.config;
        }
        catch (error) {
            console.error('[YAMLAgentLoader] Failed to load config:', error);
            return this.defaultConfig;
        }
    }
    /**
     * Saves YAML configuration to file
     */
    async saveConfig(config) {
        try {
            const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
            if (!(0, fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            const yamlContent = this.stringifyYAML(config);
            await (0, promises_1.writeFile)(this.configPath, yamlContent, 'utf-8');
        }
        catch (error) {
            console.error('[YAMLAgentLoader] Failed to save config:', error);
            throw error;
        }
    }
    /**
     * Gets agent configuration for a specific agent type
     */
    getAgentConfig(agentType) {
        if (!this.config) {
            return null;
        }
        return this.config.agents[agentType] || null;
    }
    /**
     * Auto-generates agent config from natural language via PromptEngineer
     */
    async generateAgentFromNL(agentType, description) {
        try {
            const refinement = await prompt_engineer_ts_1.promptEngineer.refinePrompt({
                originalPrompt: `Create a YAML agent configuration for ${agentType} agent: ${description}`,
                taskType: 'feature',
            });
            if (refinement.structuredPlan) {
                // Extract agent config from structured plan
                const config = {
                    role: refinement.structuredPlan.steps[0] || `${agentType} Agent`,
                    goal: refinement.structuredPlan.steps[1] || description,
                    backstory: refinement.structuredPlan.steps[2] || `Specialized ${agentType} agent`,
                    tools: refinement.structuredPlan.tools || [],
                };
                // Save to config
                if (!this.config) {
                    await this.loadConfig();
                }
                if (this.config) {
                    this.config.agents[agentType] = config;
                    await this.saveConfig(this.config);
                }
                return config;
            }
            // Fallback to basic config
            return {
                role: `${agentType} Agent`,
                goal: description,
                backstory: `Specialized ${agentType} agent`,
            };
        }
        catch (error) {
            console.error('[YAMLAgentLoader] Failed to generate agent from NL:', error);
            return {
                role: `${agentType} Agent`,
                goal: description,
                backstory: `Specialized ${agentType} agent`,
            };
        }
    }
    /**
     * Simple YAML parser (for basic YAML structures)
     * In production, use a proper YAML library like js-yaml
     */
    parseYAML(content) {
        // This is a simplified parser - in production, use js-yaml
        // For now, we'll expect JSON format or use a simple key-value parser
        try {
            // Try JSON first
            return JSON.parse(content);
        }
        catch {
            // Simple YAML-like parser for basic structures
            const lines = content.split('\n');
            const result = { agents: {}, globalSettings: {} };
            let currentSection = null;
            let currentAgent = null;
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#'))
                    continue;
                if (trimmed.startsWith('agents:')) {
                    currentSection = 'agents';
                    continue;
                }
                if (trimmed.startsWith('globalSettings:')) {
                    currentSection = 'globalSettings';
                    continue;
                }
                if (currentSection === 'agents' && trimmed.endsWith(':')) {
                    currentAgent = trimmed.slice(0, -1).trim();
                    result.agents[currentAgent] = {};
                    continue;
                }
                if (currentAgent && trimmed.includes(':')) {
                    const [key, ...valueParts] = trimmed.split(':');
                    const value = valueParts.join(':').trim();
                    result.agents[currentAgent][key.trim()] = this.parseValue(value);
                }
            }
            return result;
        }
    }
    /**
     * Parses a YAML value (handles strings, numbers, booleans, arrays)
     */
    parseValue(value) {
        const trimmed = value.trim();
        if (trimmed === 'true')
            return true;
        if (trimmed === 'false')
            return false;
        if (trimmed === 'null' || trimmed === '')
            return null;
        // Try number
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed === num.toString())
            return num;
        // Try array
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                return JSON.parse(trimmed);
            }
            catch {
                return trimmed.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            }
        }
        // Remove quotes
        return trimmed.replace(/^["']|["']$/g, '');
    }
    /**
     * Stringifies config to YAML format
     */
    stringifyYAML(config) {
        // Simple YAML stringifier - in production, use js-yaml
        let yaml = `version: "${config.version || '1.0'}"\n\n`;
        yaml += 'agents:\n';
        for (const [agentType, agentConfig] of Object.entries(config.agents || {})) {
            yaml += `  ${agentType}:\n`;
            const cfg = agentConfig;
            yaml += `    role: "${cfg.role || ''}"\n`;
            yaml += `    goal: "${cfg.goal || ''}"\n`;
            if (cfg.backstory)
                yaml += `    backstory: "${cfg.backstory}"\n`;
            if (cfg.model)
                yaml += `    model: "${cfg.model}"\n`;
            if (cfg.capabilities)
                yaml += `    capabilities: ${JSON.stringify(cfg.capabilities)}\n`;
            if (cfg.tools)
                yaml += `    tools: ${JSON.stringify(cfg.tools)}\n`;
            yaml += '\n';
        }
        if (config.globalSettings) {
            yaml += 'globalSettings:\n';
            const settings = config.globalSettings;
            if (settings.enableAutoRefine !== undefined) {
                yaml += `  enableAutoRefine: ${settings.enableAutoRefine}\n`;
            }
            if (settings.defaultModel) {
                yaml += `  defaultModel: "${settings.defaultModel}"\n`;
            }
            if (settings.vetoThreshold !== undefined) {
                yaml += `  vetoThreshold: ${settings.vetoThreshold}\n`;
            }
        }
        return yaml;
    }
    /**
     * Merges loaded config with defaults
     */
    mergeWithDefaults(config) {
        const merged = { ...this.defaultConfig };
        // Merge agents
        for (const [agentType, agentConfig] of Object.entries(config.agents || {})) {
            if (merged.agents[agentType]) {
                merged.agents[agentType] = {
                    ...merged.agents[agentType],
                    ...agentConfig,
                };
            }
            else {
                merged.agents[agentType] = agentConfig;
            }
        }
        // Merge global settings
        if (config.globalSettings) {
            merged.globalSettings = {
                ...merged.globalSettings,
                ...config.globalSettings,
            };
        }
        return merged;
    }
}
exports.YAMLAgentLoader = YAMLAgentLoader;
// Export singleton instance
exports.yamlAgentLoader = new YAMLAgentLoader();
//# sourceMappingURL=yaml-agent-loader.js.map