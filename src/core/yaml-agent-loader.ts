/**
 * YAML Agent Templates Loader for LAPA v1.3 - Phase 22
 * 
 * This module loads and manages YAML-defined agent configurations for the helix team.
 * Enables rapid prototyping by abstracting LAPA's 16-agent helix into YAML templates.
 * 
 * Inspired by CrewAI's role/goal/backstory YAML simplicity.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { HelixAgentType } from './types/agent-types.ts';
import { promptEngineer } from '../orchestrator/prompt-engineer.ts';

// YAML agent configuration schema
const AgentYAMLConfigSchema = z.object({
  role: z.string(),
  goal: z.string(),
  backstory: z.string().optional(),
  model: z.string().optional(),
  refineHooks: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  persona: z.string().optional(),
  modeBehaviors: z.record(z.any()).optional(),
});

// Helix team YAML configuration
const HelixTeamYAMLConfigSchema = z.object({
  version: z.string().optional(),
  agents: z.record(AgentYAMLConfigSchema),
  globalSettings: z.object({
    enableAutoRefine: z.boolean().optional(),
    defaultModel: z.string().optional(),
    vetoThreshold: z.number().optional(),
  }).optional(),
});

export type AgentYAMLConfig = z.infer<typeof AgentYAMLConfigSchema>;
export type HelixTeamYAMLConfig = z.infer<typeof HelixTeamYAMLConfigSchema>;

/**
 * YAML Agent Loader
 * 
 * Loads and manages YAML-defined agent configurations from ~/.lapa/agents.yaml
 */
export class YAMLAgentLoader {
  private configPath: string;
  private config: HelixTeamYAMLConfig | null = null;
  private defaultConfig: HelixTeamYAMLConfig;

  constructor(configPath?: string) {
    // Default to ~/.lapa/agents.yaml
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    this.configPath = configPath || join(homeDir, '.lapa', 'agents.yaml');
    
    // Initialize default helix team configuration
    this.defaultConfig = this.createDefaultConfig();
  }

  /**
   * Creates default helix team configuration
   */
  private createDefaultConfig(): HelixTeamYAMLConfig {
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
  async loadConfig(): Promise<HelixTeamYAMLConfig> {
    try {
      // Ensure directory exists
      const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      // Load config if exists, otherwise use default
      if (existsSync(this.configPath)) {
        const yamlContent = await readFile(this.configPath, 'utf-8');
        // Simple YAML parser (in production, use js-yaml or similar)
        this.config = this.parseYAML(yamlContent);
      } else {
        // Create default config file
        this.config = this.defaultConfig;
        await this.saveConfig(this.config);
      }

      // Validate and merge with defaults
      const validated = HelixTeamYAMLConfigSchema.parse(this.config);
      this.config = this.mergeWithDefaults(validated);
      
      return this.config;
    } catch (error) {
      console.error('[YAMLAgentLoader] Failed to load config:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Saves YAML configuration to file
   */
  async saveConfig(config: HelixTeamYAMLConfig): Promise<void> {
    try {
      const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      const yamlContent = this.stringifyYAML(config);
      await writeFile(this.configPath, yamlContent, 'utf-8');
    } catch (error) {
      console.error('[YAMLAgentLoader] Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Gets agent configuration for a specific agent type
   */
  getAgentConfig(agentType: HelixAgentType): AgentYAMLConfig | null {
    if (!this.config) {
      return null;
    }
    return this.config.agents[agentType] || null;
  }

  /**
   * Auto-generates agent config from natural language via PromptEngineer
   */
  async generateAgentFromNL(
    agentType: HelixAgentType,
    description: string
  ): Promise<AgentYAMLConfig> {
    try {
      const refinement = await promptEngineer.refinePrompt({
        originalPrompt: `Create a YAML agent configuration for ${agentType} agent: ${description}`,
        taskType: 'feature',
      });

      if (refinement.structuredPlan) {
        // Extract agent config from structured plan
        const config: AgentYAMLConfig = {
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
    } catch (error) {
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
  private parseYAML(content: string): any {
    // This is a simplified parser - in production, use js-yaml
    // For now, we'll expect JSON format or use a simple key-value parser
    try {
      // Try JSON first
      return JSON.parse(content);
    } catch {
      // Simple YAML-like parser for basic structures
      const lines = content.split('\n');
      const result: any = { agents: {}, globalSettings: {} };
      let currentSection: string | null = null;
      let currentAgent: string | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

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
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null' || trimmed === '') return null;
    
    // Try number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed === num.toString()) return num;
    
    // Try array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      }
    }
    
    // Remove quotes
    return trimmed.replace(/^["']|["']$/g, '');
  }

  /**
   * Stringifies config to YAML format
   */
  private stringifyYAML(config: any): string {
    // Simple YAML stringifier - in production, use js-yaml
    let yaml = `version: "${config.version || '1.0'}"\n\n`;
    
    yaml += 'agents:\n';
    for (const [agentType, agentConfig] of Object.entries(config.agents || {})) {
      yaml += `  ${agentType}:\n`;
      const cfg = agentConfig as any;
      yaml += `    role: "${cfg.role || ''}"\n`;
      yaml += `    goal: "${cfg.goal || ''}"\n`;
      if (cfg.backstory) yaml += `    backstory: "${cfg.backstory}"\n`;
      if (cfg.model) yaml += `    model: "${cfg.model}"\n`;
      if (cfg.capabilities) yaml += `    capabilities: ${JSON.stringify(cfg.capabilities)}\n`;
      if (cfg.tools) yaml += `    tools: ${JSON.stringify(cfg.tools)}\n`;
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
  private mergeWithDefaults(config: HelixTeamYAMLConfig): HelixTeamYAMLConfig {
    const merged = { ...this.defaultConfig };
    
    // Merge agents
    for (const [agentType, agentConfig] of Object.entries(config.agents || {})) {
      if (merged.agents[agentType as HelixAgentType]) {
        merged.agents[agentType as HelixAgentType] = {
          ...merged.agents[agentType as HelixAgentType],
          ...agentConfig,
        };
      } else {
        merged.agents[agentType as HelixAgentType] = agentConfig;
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

// Export singleton instance
export const yamlAgentLoader = new YAMLAgentLoader();

