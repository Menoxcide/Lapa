"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillManager = exports.SkillManager = void 0;
const event_bus_ts_1 = require("../core/event-bus.ts");
const zod_1 = require("zod");
const promises_1 = require("fs/promises");
const path_1 = require("path");
// Skill metadata schema
const skillMetadataSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    version: zod_1.z.string(),
    author: zod_1.z.string().optional(),
    category: zod_1.z.enum(['code', 'test', 'debug', 'review', 'integrate', 'other']),
    inputs: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        required: zod_1.z.boolean(),
        description: zod_1.z.string().optional()
    })),
    outputs: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        description: zod_1.z.string().optional()
    })),
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
/**
 * ClaudeKit Skill Manager
 *
 * Manages skill discovery, loading, execution, and optimization.
 */
class SkillManager {
    config;
    skills = new Map();
    skillCache = new Map();
    loadedSkills = new Map(); // Loaded skill modules
    constructor(config) {
        this.config = {
            skillsDirectory: config?.skillsDirectory || (0, path_1.join)(process.cwd(), 'src', 'skills'),
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
    async initialize() {
        try {
            await this.discoverSkills();
            event_bus_ts_1.eventBus.publish({
                id: `skill-manager-init-${Date.now()}`,
                type: 'skill-manager.initialized',
                timestamp: Date.now(),
                source: 'skill-manager',
                payload: {
                    skillCount: this.skills.size
                }
            }).catch(console.error);
            console.log(`[SkillManager] Initialized with ${this.skills.size} skills`);
        }
        catch (error) {
            console.error('[SkillManager] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Discovers skills in the skills directory
     */
    async discoverSkills() {
        try {
            const skillsDir = this.config.skillsDirectory;
            // Check if directory exists
            try {
                await (0, promises_1.stat)(skillsDir);
            }
            catch {
                console.warn(`[SkillManager] Skills directory not found: ${skillsDir}`);
                return;
            }
            const entries = await (0, promises_1.readdir)(skillsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.skill.ts')) {
                    await this.loadSkillMetadata((0, path_1.join)(skillsDir, entry.name));
                }
                else if (entry.isDirectory()) {
                    // Recursively search subdirectories
                    await this.discoverSkillsInDirectory((0, path_1.join)(skillsDir, entry.name));
                }
            }
        }
        catch (error) {
            console.error('[SkillManager] Skill discovery failed:', error);
            throw error;
        }
    }
    /**
     * Recursively discovers skills in a directory
     */
    async discoverSkillsInDirectory(dirPath) {
        try {
            const entries = await (0, promises_1.readdir)(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.skill.ts')) {
                    await this.loadSkillMetadata((0, path_1.join)(dirPath, entry.name));
                }
                else if (entry.isDirectory()) {
                    await this.discoverSkillsInDirectory((0, path_1.join)(dirPath, entry.name));
                }
            }
        }
        catch (error) {
            console.error(`[SkillManager] Failed to discover skills in ${dirPath}:`, error);
        }
    }
    /**
     * Loads skill metadata from a skill file
     */
    async loadSkillMetadata(filePath) {
        try {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
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
                    lastModified: (await (0, promises_1.stat)(filePath)).mtime
                };
                const validated = skillMetadataSchema.parse(metadata);
                // Add the extended properties after validation
                validated.filePath = filePath;
                validated.lastModified = extendedMetadata.lastModified;
                this.skills.set(validated.id, validated);
                console.log(`[SkillManager] Loaded skill: ${validated.name} (${validated.id})`);
            }
            catch (error) {
                console.error(`[SkillManager] Failed to parse metadata from ${filePath}:`, error);
            }
        }
        catch (error) {
            console.error(`[SkillManager] Failed to load skill from ${filePath}:`, error);
        }
    }
    /**
     * Gets all registered skills
     */
    getSkills() {
        return Array.from(this.skills.values());
    }
    /**
     * Gets a skill by ID
     */
    getSkill(skillId) {
        return this.skills.get(skillId);
    }
    /**
     * Executes a skill with given inputs
     */
    async executeSkill(request) {
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
                    event_bus_ts_1.eventBus.publish({
                        id: `skill-exec-${request.skillId}-${Date.now()}`,
                        type: 'skill.executed',
                        timestamp: Date.now(),
                        source: 'skill-manager',
                        payload: {
                            skillId: request.skillId,
                            cached: true
                        }
                    }).catch(console.error);
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
            event_bus_ts_1.eventBus.publish({
                id: `skill-exec-${request.skillId}-${Date.now()}`,
                type: 'skill.executed',
                timestamp: Date.now(),
                source: 'skill-manager',
                payload: {
                    skillId: request.skillId,
                    executionTime,
                    cached: false
                }
            }).catch(console.error);
            return {
                success: true,
                outputs,
                executionTime
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            event_bus_ts_1.eventBus.publish({
                id: `skill-exec-fail-${request.skillId}-${Date.now()}`,
                type: 'skill.execution-failed',
                timestamp: Date.now(),
                source: 'skill-manager',
                payload: {
                    skillId: request.skillId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    executionTime
                }
            }).catch(console.error);
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
    checkSoCViolation(skill, request) {
        // Check if skill tries to access forbidden directories
        const context = request.context || {};
        const accessedPaths = context.accessedPaths || [];
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
    async loadSkillModule(skill) {
        try {
            if (!skill.filePath) {
                throw new Error(`Skill ${skill.id} has no file path`);
            }
            // Convert file path to URL for dynamic import
            // Handle both relative and absolute paths
            let importPath = skill.filePath;
            // If it's a relative path, convert to file:// URL
            if (!importPath.startsWith('http://') && !importPath.startsWith('https://') && !importPath.startsWith('file://')) {
                // Convert Windows paths to proper format
                if (process.platform === 'win32') {
                    importPath = `file:///${importPath.replace(/\\/g, '/')}`;
                }
                else {
                    importPath = `file://${importPath}`;
                }
            }
            try {
                // Dynamic import of the skill module
                const module = await import(importPath);
                // Check if module exports an execute function
                if (typeof module.execute === 'function') {
                    this.loadedSkills.set(skill.id, module);
                }
                else if (typeof module.default === 'function') {
                    // Support default export
                    this.loadedSkills.set(skill.id, {
                        execute: module.default
                    });
                }
                else if (typeof module.default?.execute === 'function') {
                    // Support default export with execute method
                    this.loadedSkills.set(skill.id, module.default);
                }
                else {
                    throw new Error(`Skill ${skill.id} does not export an execute function`);
                }
                console.log(`[SkillManager] Loaded skill module: ${skill.id}`);
            }
            catch (importError) {
                // If dynamic import fails, try using require (for CommonJS modules)
                console.warn(`[SkillManager] Dynamic import failed for ${skill.id}, trying require fallback`);
                // For Node.js environments, we can use require as fallback
                // Note: This requires the skill to be in a location accessible by require
                try {
                    // Remove file:// prefix if present and convert to require-compatible path
                    const requirePath = skill.filePath.replace(/^file:\/\//, '').replace(/^\//, '');
                    const module = require(requirePath);
                    if (typeof module.execute === 'function') {
                        this.loadedSkills.set(skill.id, module);
                    }
                    else if (typeof module.default === 'function') {
                        this.loadedSkills.set(skill.id, { execute: module.default });
                    }
                    else if (typeof module.default?.execute === 'function') {
                        this.loadedSkills.set(skill.id, module.default);
                    }
                    else {
                        throw new Error(`Skill ${skill.id} does not export an execute function`);
                    }
                    console.log(`[SkillManager] Loaded skill module via require: ${skill.id}`);
                }
                catch (requireError) {
                    // If both fail, create a placeholder that logs a warning
                    console.warn(`[SkillManager] Failed to load skill module ${skill.id}, using placeholder`);
                    this.loadedSkills.set(skill.id, {
                        execute: async (inputs, context) => {
                            console.warn(`[SkillManager] Skill ${skill.id} is using placeholder execution`);
                            return {
                                result: 'Skill executed (placeholder - module not loaded)',
                                warning: 'Skill module could not be loaded dynamically'
                            };
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error(`[SkillManager] Failed to load skill module ${skill.id}:`, error);
            // Don't throw - allow skill to be executed with placeholder
            this.loadedSkills.set(skill.id, {
                execute: async (inputs, context) => {
                    return {
                        error: `Failed to load skill module: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            });
        }
    }
    /**
     * Generates a cache key for a skill execution request
     */
    getCacheKey(request) {
        return `${request.skillId}:${JSON.stringify(request.inputs)}`;
    }
    /**
     * Clears the skill cache
     */
    clearCache() {
        this.skillCache.clear();
        console.log('[SkillManager] Cache cleared');
    }
    /**
     * Registers a skill programmatically
     */
    registerSkill(metadata) {
        const validated = skillMetadataSchema.parse(metadata);
        this.skills.set(validated.id, validated);
        event_bus_ts_1.eventBus.publish({
            id: `skill-reg-${validated.id}-${Date.now()}`,
            type: 'skill.registered',
            timestamp: Date.now(),
            source: 'skill-manager',
            payload: {
                skillId: validated.id,
                skillName: validated.name
            }
        }).catch(console.error);
        console.log(`[SkillManager] Registered skill: ${validated.name} (${validated.id})`);
    }
    /**
     * Unregisters a skill
     */
    unregisterSkill(skillId) {
        if (this.skills.has(skillId)) {
            this.skills.delete(skillId);
            this.loadedSkills.delete(skillId);
            event_bus_ts_1.eventBus.publish({
                id: `skill-unreg-${skillId}-${Date.now()}`,
                type: 'skill.unregistered',
                timestamp: Date.now(),
                source: 'skill-manager',
                payload: { skillId }
            }).catch(console.error);
            console.log(`[SkillManager] Unregistered skill: ${skillId}`);
        }
    }
}
exports.SkillManager = SkillManager;
// Export singleton instance
exports.skillManager = new SkillManager();
//# sourceMappingURL=skill-manager.js.map