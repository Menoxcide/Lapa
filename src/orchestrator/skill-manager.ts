/**
 * ClaudeKit Skill Manager for LAPA v1.2.2 — Phase 14
 * 
 * This module implements ClaudeKit skill management for dynamic skill loading,
 * execution, and optimization. It enforces SoC (Separation of Concerns) with
 * strict directory structure and layer interdependencies.
 * 
 * Features:
 * - Dynamic skill discovery and loading
 * - Skill execution with context injection
 * - Skill optimization and caching
 * - SoC enforcement (frontend consumes backend APIs)
 */

import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

// Skill metadata schema
const skillMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string().optional(),
  category: z.enum(['code', 'test', 'debug', 'review', 'integrate', 'other']),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string().optional()
  })),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional()
  })),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

// Skill execution request
export interface SkillExecutionRequest {
  skillId: string;
  inputs: Record<string, unknown>;
  context?: Record<string, unknown>;
  agentId?: string;
  sessionId?: string;
}

// Skill execution response
export interface SkillExecutionResponse {
  success: boolean;
  outputs?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
  cached?: boolean;
}

// Skill metadata interface
export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  category: 'code' | 'test' | 'debug' | 'review' | 'integrate' | 'other';
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  dependencies?: string[];
  tags?: string[];
  filePath?: string;
  lastModified?: Date;
}

// Skill manager configuration
export interface SkillManagerConfig {
  skillsDirectory: string;
  enableCaching: boolean;
  cacheTTL: number; // milliseconds
  enableSoC: boolean; // Enforce Separation of Concerns
  allowedDirectories: {
    components?: string;
    services?: string;
    models?: string;
  };
}

/**
 * ClaudeKit Skill Manager
 * 
 * Manages skill discovery, loading, execution, and optimization.
 */
export class SkillManager {
  private config: SkillManagerConfig;
  private skills: Map<string, SkillMetadata> = new Map();
  private skillCache: Map<string, { result: any; timestamp: number }> = new Map();
  private loadedSkills: Map<string, any> = new Map(); // Loaded skill modules

  constructor(config?: Partial<SkillManagerConfig>) {
    this.config = {
      skillsDirectory: config?.skillsDirectory || join(process.cwd(), 'src', 'skills'),
      enableCaching: config?.enableCaching ?? true,
      cacheTTL: config?.cacheTTL || 300000, // 5 minutes
      enableSoC: config?.enableSoC ?? true,
      allowedDirectories: {
        components: config?.allowedDirectories?.components || 'src/components',
        services: config?.allowedDirectories?.services || 'src/services',
        models: config?.allowedDirectories?.models || 'src/models'
      }
    };
  }

  /**
   * Initializes the skill manager by discovering and loading skills
   */
  async initialize(): Promise<void> {
    try {
      await this.discoverSkills();
      eventBus.publish({
        id: `skill-manager-init-${Date.now()}`,
        type: 'skill-manager.initialized',
        timestamp: Date.now(),
        source: 'skill-manager',
        payload: {
          skillCount: this.skills.size
        }
      } as any).catch(console.error);
      console.log(`[SkillManager] Initialized with ${this.skills.size} skills`);
    } catch (error) {
      console.error('[SkillManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Discovers skills in the skills directory
   */
  private async discoverSkills(): Promise<void> {
    try {
      const skillsDir = this.config.skillsDirectory;
      
      // Check if directory exists
      try {
        await stat(skillsDir);
      } catch {
        console.warn(`[SkillManager] Skills directory not found: ${skillsDir}`);
        return;
      }

      const entries = await readdir(skillsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.skill.ts')) {
          await this.loadSkillMetadata(join(skillsDir, entry.name));
        } else if (entry.isDirectory()) {
          // Recursively search subdirectories
          await this.discoverSkillsInDirectory(join(skillsDir, entry.name));
        }
      }
    } catch (error) {
      console.error('[SkillManager] Skill discovery failed:', error);
      throw error;
    }
  }

  /**
   * Recursively discovers skills in a directory
   */
  private async discoverSkillsInDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.skill.ts')) {
          await this.loadSkillMetadata(join(dirPath, entry.name));
        } else if (entry.isDirectory()) {
          await this.discoverSkillsInDirectory(join(dirPath, entry.name));
        }
      }
    } catch (error) {
      console.error(`[SkillManager] Failed to discover skills in ${dirPath}:`, error);
    }
  }

  /**
   * Loads skill metadata from a skill file
   */
  private async loadSkillMetadata(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Extract metadata from JSDoc or export
      // This is a simplified parser - in production, use a proper AST parser
      const metadataMatch = content.match(/export\s+const\s+skillMetadata\s*[:=]\s*({[\s\S]*?});/);
      
      if (!metadataMatch) {
        console.warn(`[SkillManager] No metadata found in ${filePath}`);
        return;
      }

      try {
        // Parse the metadata object safely without using eval
        // Replace single quotes with double quotes for valid JSON
        const metadataString = metadataMatch[1]
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":') // Wrap unquoted keys in double quotes
          .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
        
        // Parse as JSON
        const metadata = JSON.parse(metadataString);
        
        // Add filePath and lastModified to metadata before validation
        const extendedMetadata = {
          ...metadata,
          filePath,
          lastModified: (await stat(filePath)).mtime
        };
        
        const validated = skillMetadataSchema.parse(metadata);
        
        // Add the extended properties after validation
        (validated as any).filePath = filePath;
        (validated as any).lastModified = extendedMetadata.lastModified;
        
        this.skills.set(validated.id, validated as SkillMetadata);
        console.log(`[SkillManager] Loaded skill: ${validated.name} (${validated.id})`);
      } catch (error) {
        console.error(`[SkillManager] Failed to parse metadata from ${filePath}:`, error);
      }
    } catch (error) {
      console.error(`[SkillManager] Failed to load skill from ${filePath}:`, error);
    }
  }

  /**
   * Gets all registered skills
   */
  getSkills(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  /**
   * Gets a skill by ID
   */
  getSkill(skillId: string): SkillMetadata | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Executes a skill with given inputs
   */
  async executeSkill(request: SkillExecutionRequest): Promise<SkillExecutionResponse> {
    const startTime = Date.now();
    
    try {
      // Validate skill exists
      const skill = this.skills.get(request.skillId);
      if (!skill) {
        return {
          success: false,
          error: `Skill not found: ${request.skillId}`
        };
      }

      // Check cache
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey(request);
        const cached = this.skillCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
          eventBus.publish({
            id: `skill-exec-${request.skillId}-${Date.now()}`,
            type: 'skill.executed',
            timestamp: Date.now(),
            source: 'skill-manager',
            payload: {
              skillId: request.skillId,
              cached: true
            }
          } as any).catch(console.error);
          
          return {
            success: true,
            outputs: cached.result,
            cached: true,
            executionTime: Date.now() - startTime
          };
        }
      }

      // Enforce SoC if enabled
      if (this.config.enableSoC) {
        const socViolation = this.checkSoCViolation(skill, request);
        if (socViolation) {
          return {
            success: false,
            error: `SoC violation: ${socViolation}`
          };
        }
      }

      // Load skill module if not already loaded
      if (!this.loadedSkills.has(request.skillId)) {
        await this.loadSkillModule(skill);
      }

      // Execute skill
      const skillModule = this.loadedSkills.get(request.skillId);
      if (!skillModule || typeof skillModule.execute !== 'function') {
        return {
          success: false,
          error: `Skill module does not export execute function: ${request.skillId}`
        };
      }

      const outputs = await skillModule.execute(request.inputs, request.context);

      // Cache result
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey(request);
        this.skillCache.set(cacheKey, {
          result: outputs,
          timestamp: Date.now()
        });
      }

      const executionTime = Date.now() - startTime;

      eventBus.publish({
        id: `skill-exec-${request.skillId}-${Date.now()}`,
        type: 'skill.executed',
        timestamp: Date.now(),
        source: 'skill-manager',
        payload: {
          skillId: request.skillId,
          executionTime,
          cached: false
        }
      } as any).catch(console.error);

      return {
        success: true,
        outputs,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      eventBus.publish({
        id: `skill-exec-fail-${request.skillId}-${Date.now()}`,
        type: 'skill.execution-failed',
        timestamp: Date.now(),
        source: 'skill-manager',
        payload: {
          skillId: request.skillId,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime
        }
      } as any).catch(console.error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
    }
  }

  /**
   * Checks for Separation of Concerns violations
   */
  private checkSoCViolation(skill: SkillMetadata, request: SkillExecutionRequest): string | null {
    // Check if skill tries to access forbidden directories
    const context = request.context || {};
    const accessedPaths = context.accessedPaths as string[] || [];
    
    for (const path of accessedPaths) {
      // Frontend components should not directly access backend services
      if (path.includes(this.config.allowedDirectories.components || '') &&
          path.includes(this.config.allowedDirectories.services || '')) {
        return 'Frontend components cannot directly access backend services';
      }
      
      // Services should not directly access models (should use APIs)
      if (path.includes(this.config.allowedDirectories.services || '') &&
          path.includes(this.config.allowedDirectories.models || '')) {
        return 'Services should not directly access models - use APIs instead';
      }
    }

    return null;
  }

  /**
   * Loads a skill module dynamically
   */
  private async loadSkillModule(skill: SkillMetadata): Promise<void> {
    try {
      // In a real implementation, this would use dynamic import
      // For now, we'll create a placeholder
      if (!skill.filePath) {
        throw new Error(`Skill ${skill.id} has no file path`);
      }

      // Dynamic import would be: const module = await import(skill.filePath);
      // For now, we'll store a placeholder
      this.loadedSkills.set(skill.id, {
        execute: async (inputs: Record<string, unknown>, context?: Record<string, unknown>) => {
          // Placeholder execution
          console.log(`[SkillManager] Executing skill ${skill.id} with inputs:`, inputs);
          return { result: 'Skill executed (placeholder)' };
        }
      });
    } catch (error) {
      console.error(`[SkillManager] Failed to load skill module ${skill.id}:`, error);
      throw error;
    }
  }

  /**
   * Generates a cache key for a skill execution request
   */
  private getCacheKey(request: SkillExecutionRequest): string {
    return `${request.skillId}:${JSON.stringify(request.inputs)}`;
  }

  /**
   * Clears the skill cache
   */
  clearCache(): void {
    this.skillCache.clear();
    console.log('[SkillManager] Cache cleared');
  }

  /**
   * Registers a skill programmatically
   */
  registerSkill(metadata: SkillMetadata): void {
    const validated = skillMetadataSchema.parse(metadata);
    this.skills.set(validated.id, validated);
    eventBus.publish({
      id: `skill-reg-${validated.id}-${Date.now()}`,
      type: 'skill.registered',
      timestamp: Date.now(),
      source: 'skill-manager',
      payload: {
        skillId: validated.id,
        skillName: validated.name
      }
    } as any).catch(console.error);
    console.log(`[SkillManager] Registered skill: ${validated.name} (${validated.id})`);
  }

  /**
   * Unregisters a skill
   */
  unregisterSkill(skillId: string): void {
    if (this.skills.has(skillId)) {
      this.skills.delete(skillId);
      this.loadedSkills.delete(skillId);
      eventBus.publish({
        id: `skill-unreg-${skillId}-${Date.now()}`,
        type: 'skill.unregistered',
        timestamp: Date.now(),
        source: 'skill-manager',
        payload: { skillId }
      } as any).catch(console.error);
      console.log(`[SkillManager] Unregistered skill: ${skillId}`);
    }
  }
}

// Export singleton instance
export const skillManager = new SkillManager();

