/**
 * FEATURE_AGENT Sandbox Manager
 * 
 * This module implements sandbox management for FEATURE_AGENT workflow,
 * enabling isolated feature development and rapid prototyping.
 * 
 * Features:
 * - Create isolated sandbox environments
 * - Manage sandbox lifecycle (create, promote, archive, cleanup)
 * - Integrate with FEATURE_AGENT workflow
 * - Support sandbox promotion to production
 */

import { mkdir, writeFile, readFile, readdir, stat, rm, copyFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import { LAPAEventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';

/**
 * Sandbox status
 */
export type SandboxStatus = 'active' | 'archived' | 'promoted' | 'error';

/**
 * Sandbox metadata
 */
export interface SandboxMetadata {
  id: string;
  name: string;
  status: SandboxStatus;
  createdAt: number;
  updatedAt: number;
  promotedAt?: number;
  archivedAt?: number;
  description?: string;
  featureName: string;
  iterationCount: number;
  testCoverage?: number;
  notes?: string[];
}

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  baseDir?: string;
  archiveDir?: string;
  enableIsolation?: boolean;
  autoCleanup?: boolean;
  maxIterations?: number;
}

/**
 * Default sandbox configuration
 */
const DEFAULT_CONFIG: Required<SandboxConfig> = {
  baseDir: 'sandbox',
  archiveDir: 'sandbox/archive',
  enableIsolation: true,
  autoCleanup: false,
  maxIterations: 10
};

/**
 * FEATURE_AGENT Sandbox Manager
 */
export class FeatureSandboxManager {
  private config: Required<SandboxConfig>;
  private eventBus: LAPAEventBus;
  private memoriEngine?: MemoriEngine;
  private sandboxes: Map<string, SandboxMetadata> = new Map();

  constructor(
    config?: SandboxConfig,
    eventBus?: LAPAEventBus,
    memoriEngine?: MemoriEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventBus = eventBus || new LAPAEventBus();
    this.memoriEngine = memoriEngine;
  }

  /**
   * Initialize sandbox manager
   */
  async initialize(): Promise<void> {
    try {
      // Create base directories
      await mkdir(this.config.baseDir, { recursive: true });
      await mkdir(this.config.archiveDir, { recursive: true });

      // Load existing sandboxes
      await this.loadSandboxes();

      // Publish initialization event
      await this.eventBus.publish({
        id: `sandbox-init-${Date.now()}`,
        type: 'sandbox.manager.initialized',
        timestamp: Date.now(),
        source: 'feature-sandbox-manager',
        payload: {
          baseDir: this.config.baseDir,
          archiveDir: this.config.archiveDir,
          sandboxCount: this.sandboxes.size
        }
      });

      console.log(`[FeatureSandboxManager] Initialized with ${this.sandboxes.size} existing sandboxes`);
    } catch (error) {
      console.error('[FeatureSandboxManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create a new sandbox for feature development
   */
  async createSandbox(featureName: string, description?: string): Promise<SandboxMetadata> {
    try {
      const sandboxId = this.generateSandboxId(featureName);
      const sandboxPath = join(this.config.baseDir, sandboxId);

      // Check if sandbox already exists
      if (existsSync(sandboxPath)) {
        throw new Error(`Sandbox '${sandboxId}' already exists`);
      }

      // Create sandbox directory structure
      await mkdir(sandboxPath, { recursive: true });
      await mkdir(join(sandboxPath, 'src'), { recursive: true });
      await mkdir(join(sandboxPath, 'tests'), { recursive: true });
      await mkdir(join(sandboxPath, 'docs'), { recursive: true });

      // Create sandbox configuration file
      const configPath = join(sandboxPath, 'sandbox.config.json');
      const config = {
        id: sandboxId,
        name: featureName,
        createdAt: Date.now(),
        description,
        isolation: this.config.enableIsolation
      };
      await writeFile(configPath, JSON.stringify(config, null, 2));

      // Create README
      const readmePath = join(sandboxPath, 'README.md');
      const readme = `# Sandbox: ${featureName}

**Status:** Active  
**Created:** ${new Date().toISOString()}  
**Description:** ${description || 'No description provided'}

## Purpose
This sandbox is for rapid prototyping and experimentation of the ${featureName} feature.

## Structure
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Notes
- This is an isolated environment
- Changes here don't affect the main codebase
- Use \`promoteSandbox()\` to move to production when ready
`;
      await writeFile(readmePath, readme);

      // Create metadata
      const metadata: SandboxMetadata = {
        id: sandboxId,
        name: featureName,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description,
        featureName,
        iterationCount: 0,
        notes: []
      };

      // Save metadata
      this.sandboxes.set(sandboxId, metadata);
      await this.saveSandboxMetadata(sandboxId, metadata);

      // Store in memory
      if (this.memoriEngine) {
        // MemoriEngine doesn't have a direct store method
        // Use extractAndStoreEntities or store entities as part of task results
        // For now, we'll skip direct memory storage as it's typically done via task results
        // await this.memoriEngine.extractAndStoreEntities(...);
      }

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-created-${sandboxId}`,
        type: 'sandbox.created',
        timestamp: Date.now(),
        source: 'feature-sandbox-manager',
        payload: metadata
      });

      console.log(`[FeatureSandboxManager] Created sandbox: ${sandboxId}`);
      return metadata;
    } catch (error) {
      console.error(`[FeatureSandboxManager] Failed to create sandbox:`, error);
      throw error;
    }
  }

  /**
   * Get sandbox metadata
   */
  async getSandbox(sandboxId: string): Promise<SandboxMetadata | null> {
    const metadata = this.sandboxes.get(sandboxId);
    if (!metadata) {
      return null;
    }

    // Update from disk if needed
    const metadataPath = join(this.config.baseDir, sandboxId, 'metadata.json');
    if (existsSync(metadataPath)) {
      try {
        const diskMetadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
        return { ...metadata, ...diskMetadata };
      } catch (error) {
        console.warn(`[FeatureSandboxManager] Failed to load metadata from disk:`, error);
      }
    }

    return metadata;
  }

  /**
   * List all sandboxes
   */
  async listSandboxes(status?: SandboxStatus): Promise<SandboxMetadata[]> {
    const sandboxes = Array.from(this.sandboxes.values());
    if (status) {
      return sandboxes.filter(s => s.status === status);
    }
    return sandboxes;
  }

  /**
   * Update sandbox (increment iteration, add notes, etc.)
   */
  async updateSandbox(
    sandboxId: string,
    updates: Partial<SandboxMetadata>
  ): Promise<SandboxMetadata> {
    const metadata = this.sandboxes.get(sandboxId);
    if (!metadata) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    const updated: SandboxMetadata = {
      ...metadata,
      ...updates,
      updatedAt: Date.now()
    };

    this.sandboxes.set(sandboxId, updated);
    await this.saveSandboxMetadata(sandboxId, updated);

    // Publish event
    await this.eventBus.publish({
      id: `sandbox-updated-${sandboxId}`,
      type: 'sandbox.updated',
      timestamp: Date.now(),
      source: 'feature-sandbox-manager',
      payload: updated
    });

    return updated;
  }

  /**
   * Promote sandbox to production
   * Moves sandbox code to main codebase
   */
  async promoteSandbox(sandboxId: string, targetPath?: string): Promise<void> {
    const metadata = this.sandboxes.get(sandboxId);
    if (!metadata) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    if (metadata.status !== 'active') {
      throw new Error(`Cannot promote sandbox '${sandboxId}': status is '${metadata.status}'`);
    }

    try {
      const sandboxPath = join(this.config.baseDir, sandboxId);
      const srcPath = join(sandboxPath, 'src');

      // Check if source exists
      if (!existsSync(srcPath)) {
        throw new Error(`Sandbox source directory not found: ${srcPath}`);
      }

      // Determine target path
      const finalTargetPath = targetPath || `src/features/${metadata.featureName}`;

      // Copy sandbox code to target
      await this.copyDirectory(srcPath, finalTargetPath);

      // Copy tests if they exist
      const testsPath = join(sandboxPath, 'tests');
      if (existsSync(testsPath)) {
        const targetTestsPath = join('src/__tests__/features', metadata.featureName);
        await this.copyDirectory(testsPath, targetTestsPath);
      }

      // Update metadata
      const updated = await this.updateSandbox(sandboxId, {
        status: 'promoted',
        promotedAt: Date.now()
      });

      // Archive sandbox
      await this.archiveSandbox(sandboxId);

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-promoted-${sandboxId}`,
        type: 'sandbox.promoted',
        timestamp: Date.now(),
        source: 'feature-sandbox-manager',
        payload: {
          sandboxId,
          targetPath: finalTargetPath,
          metadata: updated
        }
      });

      console.log(`[FeatureSandboxManager] Promoted sandbox ${sandboxId} to ${finalTargetPath}`);
    } catch (error) {
      console.error(`[FeatureSandboxManager] Failed to promote sandbox:`, error);
      throw error;
    }
  }

  /**
   * Archive sandbox
   */
  async archiveSandbox(sandboxId: string): Promise<void> {
    const metadata = this.sandboxes.get(sandboxId);
    if (!metadata) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    try {
      const sandboxPath = join(this.config.baseDir, sandboxId);
      const archivePath = join(this.config.archiveDir, sandboxId);

      // Move to archive
      if (existsSync(sandboxPath)) {
        // Create archive directory
        await mkdir(archivePath, { recursive: true });

        // Copy files to archive
        await this.copyDirectory(sandboxPath, archivePath);

        // Remove from active
        await rm(sandboxPath, { recursive: true, force: true });
      }

      // Update metadata
      await this.updateSandbox(sandboxId, {
        status: 'archived',
        archivedAt: Date.now()
      });

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-archived-${sandboxId}`,
        type: 'sandbox.archived',
        timestamp: Date.now(),
        source: 'feature-sandbox-manager',
        payload: { sandboxId, metadata }
      });

      console.log(`[FeatureSandboxManager] Archived sandbox: ${sandboxId}`);
    } catch (error) {
      console.error(`[FeatureSandboxManager] Failed to archive sandbox:`, error);
      throw error;
    }
  }

  /**
   * Cleanup sandbox (permanent deletion)
   */
  async cleanupSandbox(sandboxId: string): Promise<void> {
    const metadata = this.sandboxes.get(sandboxId);
    if (!metadata) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    try {
      // Remove from active
      const sandboxPath = join(this.config.baseDir, sandboxId);
      if (existsSync(sandboxPath)) {
        await rm(sandboxPath, { recursive: true, force: true });
      }

      // Remove from archive
      const archivePath = join(this.config.archiveDir, sandboxId);
      if (existsSync(archivePath)) {
        await rm(archivePath, { recursive: true, force: true });
      }

      // Remove metadata
      this.sandboxes.delete(sandboxId);
      const metadataPath = join(this.config.baseDir, sandboxId, 'metadata.json');
      if (existsSync(metadataPath)) {
        await rm(metadataPath, { force: true });
      }

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-cleaned-${sandboxId}`,
        type: 'sandbox.cleaned',
        timestamp: Date.now(),
        source: 'feature-sandbox-manager',
        payload: { sandboxId }
      });

      console.log(`[FeatureSandboxManager] Cleaned up sandbox: ${sandboxId}`);
    } catch (error) {
      console.error(`[FeatureSandboxManager] Failed to cleanup sandbox:`, error);
      throw error;
    }
  }

  /**
   * Get sandbox path
   */
  getSandboxPath(sandboxId: string): string {
    return join(this.config.baseDir, sandboxId);
  }

  /**
   * Check if sandbox exists
   */
  sandboxExists(sandboxId: string): boolean {
    return this.sandboxes.has(sandboxId);
  }

  // Private helper methods

  /**
   * Generate sandbox ID from feature name
   */
  private generateSandboxId(featureName: string): string {
    const sanitized = featureName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const timestamp = Date.now().toString(36);
    return `${sanitized}-${timestamp}`;
  }

  /**
   * Load existing sandboxes
   */
  private async loadSandboxes(): Promise<void> {
    try {
      if (!existsSync(this.config.baseDir)) {
        return;
      }

      const entries = await readdir(this.config.baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = join(this.config.baseDir, entry.name, 'metadata.json');
          if (existsSync(metadataPath)) {
            try {
              const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
              this.sandboxes.set(entry.name, metadata);
            } catch (error) {
              console.warn(`[FeatureSandboxManager] Failed to load metadata for ${entry.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[FeatureSandboxManager] Failed to load sandboxes:', error);
    }
  }

  /**
   * Save sandbox metadata
   */
  private async saveSandboxMetadata(sandboxId: string, metadata: SandboxMetadata): Promise<void> {
    const sandboxPath = join(this.config.baseDir, sandboxId);
    const metadataPath = join(sandboxPath, 'metadata.json');
    
    await mkdir(sandboxPath, { recursive: true });
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await mkdir(dest, { recursive: true });
    
    const entries = await readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }
}

