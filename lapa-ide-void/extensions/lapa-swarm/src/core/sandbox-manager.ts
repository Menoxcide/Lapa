/**
 * Global Sandbox Manager for LAPA-VOID
 * 
 * This module implements a global sandbox management system that can be used
 * by any agent or system in the LAPA-VOID project. It supports multiple
 * sandbox providers (local, MCP, E2B, custom) and provides a unified interface.
 * 
 * Features:
 * - Multi-provider support (local, MCP, E2B, feature-specific)
 * - Unified sandbox lifecycle management
 * - Event-driven architecture
 * - Memory integration
 * - Metrics and monitoring
 * - Isolation and security
 */

import { mkdir, writeFile, readFile, readdir, stat, rm, copyFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import { LAPAEventBus } from './event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { BoundedMap } from '../utils/bounded-collections.js';
import { cachedStringify } from '../utils/serialization-cache.js';
import {
  SandboxMetadata,
  SandboxConfig,
  CreateSandboxOptions,
  SandboxExecutionContext,
  SandboxExecutionResult,
  ISandboxProvider,
  ISandboxManager,
  SandboxProviderType,
  SandboxStatus,
  DEFAULT_SANDBOX_CONFIG
} from './types/sandbox-types.js';

/**
 * Global Sandbox Manager
 * 
 * Manages sandboxes across all agents and systems in LAPA-VOID
 */
export class GlobalSandboxManager implements ISandboxManager {
  private config: Required<SandboxConfig>;
  private eventBus: LAPAEventBus;
  private memoriEngine?: MemoriEngine;
  // Optimized: Use bounded map to prevent unbounded growth
  private sandboxes: BoundedMap<string, SandboxMetadata>;
  private providers: Map<SandboxProviderType, ISandboxProvider> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    config?: SandboxConfig,
    eventBus?: LAPAEventBus,
    memoriEngine?: MemoriEngine
  ) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    this.eventBus = eventBus || new LAPAEventBus();
    this.memoriEngine = memoriEngine;
    // Initialize bounded map with reasonable limit (1000 sandboxes)
    this.sandboxes = new BoundedMap<string, SandboxMetadata>(1000);
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

      // Initialize default providers
      await this.initializeDefaultProviders();

      // Start cleanup task if auto-cleanup is enabled
      if (this.config.autoCleanup) {
        this.startCleanupTask();
      }

      // Publish initialization event
      await this.eventBus.publish({
        id: `sandbox-init-${Date.now()}`,
        type: 'sandbox.manager.initialized',
        timestamp: Date.now(),
        source: 'global-sandbox-manager',
        payload: {
          baseDir: this.config.baseDir,
          archiveDir: this.config.archiveDir,
          sandboxCount: this.sandboxes.size,
          providers: Array.from(this.providers.keys())
        }
      });

      console.log(`[GlobalSandboxManager] Initialized with ${this.sandboxes.size} existing sandboxes`);
    } catch (error) {
      console.error('[GlobalSandboxManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Register a sandbox provider
   */
  registerProvider(provider: ISandboxProvider): void {
    this.providers.set(provider.type, provider);
    console.log(`[GlobalSandboxManager] Registered provider: ${provider.type}`);
  }

  /**
   * Get a sandbox provider
   */
  getProvider(type: SandboxProviderType): ISandboxProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Create a new sandbox
   */
  async createSandbox(options: CreateSandboxOptions): Promise<SandboxMetadata> {
    try {
      const providerType = options.provider || this.config.defaultProvider;
      const provider = this.getProvider(providerType);

      if (!provider) {
        throw new Error(`Sandbox provider '${providerType}' not found`);
      }

      // Create sandbox using provider
      const sandbox = await provider.createSandbox(options);

      // Generate unique ID if not provided
      if (!sandbox.id) {
        sandbox.id = this.generateSandboxId(options.name);
      }

      // Set defaults
      sandbox.status = 'active';
      sandbox.createdAt = Date.now();
      sandbox.updatedAt = Date.now();
      sandbox.iterationCount = 0;

      // Set expiration if specified
      if (options.expiresInDays || this.config.expirationDays) {
        const days = options.expiresInDays || this.config.expirationDays;
        sandbox.expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
      }

      // Save metadata
      this.sandboxes.set(sandbox.id, sandbox);
      await this.saveSandboxMetadata(sandbox.id, sandbox);

      // Store in memory (via entity extraction if enabled)
      if (this.memoriEngine && this.memoriEngine.extractAndStoreEntities) {
        // Optimized: Use cached serialization
        const sandboxMetadata = cachedStringify(sandbox);
        await this.memoriEngine.extractAndStoreEntities(
          `sandbox-${sandbox.id}`,
          sandboxMetadata
        );
      }

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-created-${sandbox.id}`,
        type: 'sandbox.created',
        timestamp: Date.now(),
        source: 'global-sandbox-manager',
        payload: sandbox
      });

      console.log(`[GlobalSandboxManager] Created sandbox: ${sandbox.id} (${sandbox.category})`);
      return sandbox;
    } catch (error) {
      console.error(`[GlobalSandboxManager] Failed to create sandbox:`, error);
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
        console.warn(`[GlobalSandboxManager] Failed to load metadata from disk:`, error);
      }
    }

    return metadata;
  }

  /**
   * List sandboxes with optional filter
   * Optimized: Single pass filtering instead of multiple iterations
   */
  async listSandboxes(filter?: Partial<SandboxMetadata>): Promise<SandboxMetadata[]> {
    const sandboxes = Array.from(this.sandboxes.values());

    // Optimized: Early return if no filter
    if (!filter || Object.keys(filter).length === 0) {
      return sandboxes;
    }

    // Optimized: Single pass filter with early exit
    return sandboxes.filter(sandbox => {
      for (const [key, value] of Object.entries(filter)) {
        if (sandbox[key as keyof SandboxMetadata] !== value) {
          return false; // Early exit on first mismatch
        }
      }
      return true;
    });
  }

  /**
   * Update sandbox metadata
   */
  async updateSandbox(sandboxId: string, updates: Partial<SandboxMetadata>): Promise<SandboxMetadata> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    const updated: SandboxMetadata = {
      ...sandbox,
      ...updates,
      updatedAt: Date.now()
    };

    // Update iteration count
    if (updates.iterationCount !== undefined) {
      updated.iterationCount = updates.iterationCount;
    } else if (updates.status && updates.status !== sandbox.status) {
      updated.iterationCount = (updated.iterationCount || 0) + 1;
    }

    this.sandboxes.set(sandboxId, updated);
    await this.saveSandboxMetadata(sandboxId, updated);

    // Update memory (via entity extraction if enabled)
    if (this.memoriEngine && this.memoriEngine.extractAndStoreEntities) {
      // Optimized: Use cached serialization
      const updatedMetadata = cachedStringify(updated);
      await this.memoriEngine.extractAndStoreEntities(
        `sandbox-${sandboxId}`,
        updatedMetadata
      );
    }

    // Publish event
    await this.eventBus.publish({
      id: `sandbox-updated-${sandboxId}`,
      type: 'sandbox.updated',
      timestamp: Date.now(),
      source: 'global-sandbox-manager',
      payload: updated
    });

    return updated;
  }

  /**
   * Execute command/code in sandbox
   */
  async execute(context: SandboxExecutionContext): Promise<SandboxExecutionResult> {
    const sandbox = await this.getSandbox(context.sandboxId);
    if (!sandbox) {
      return {
        success: false,
        error: `Sandbox '${context.sandboxId}' not found`,
        exitCode: 1
      };
    }

    const provider = this.getProvider(sandbox.provider);
    if (!provider) {
      return {
        success: false,
        error: `Provider '${sandbox.provider}' not found`,
        exitCode: 1
      };
    }

    try {
      const result = await provider.execute(context);

      // Update iteration count
      if (result.success) {
        await this.updateSandbox(context.sandboxId, {
          iterationCount: (sandbox.iterationCount || 0) + 1
        });
      }

      // Publish event
      await this.eventBus.publish({
        id: `sandbox-executed-${context.sandboxId}`,
        type: 'sandbox.executed',
        timestamp: Date.now(),
        source: 'global-sandbox-manager',
        payload: { sandboxId: context.sandboxId, result }
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exitCode: 1
      };
    }
  }

  /**
   * Promote sandbox to production
   */
  async promoteSandbox(sandboxId: string, targetPath?: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    if (!this.config.allowPromotion) {
      throw new Error('Sandbox promotion is disabled');
    }

    const sandboxPath = this.getSandboxPath(sandboxId);
    const destination = targetPath || join(process.cwd(), sandbox.name);

    // Copy sandbox to destination
    await this.copyDirectory(sandboxPath, destination);

    // Update status
    await this.updateSandbox(sandboxId, {
      status: 'promoted',
      promotedAt: Date.now()
    });

    // Publish event
    await this.eventBus.publish({
      id: `sandbox-promoted-${sandboxId}`,
      type: 'sandbox.promoted',
      timestamp: Date.now(),
      source: 'global-sandbox-manager',
      payload: { sandboxId, targetPath: destination }
    });

    console.log(`[GlobalSandboxManager] Promoted sandbox: ${sandboxId} → ${destination}`);
  }

  /**
   * Archive sandbox
   */
  async archiveSandbox(sandboxId: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    const sandboxPath = this.getSandboxPath(sandboxId);
    const archivePath = join(this.config.archiveDir, sandboxId);

    // Move to archive
    await this.copyDirectory(sandboxPath, archivePath);
    await rm(sandboxPath, { recursive: true, force: true });

    // Update status
    await this.updateSandbox(sandboxId, {
      status: 'archived',
      archivedAt: Date.now()
    });

    // Publish event
    await this.eventBus.publish({
      id: `sandbox-archived-${sandboxId}`,
      type: 'sandbox.archived',
      timestamp: Date.now(),
      source: 'global-sandbox-manager',
      payload: { sandboxId, archivePath }
    });

    console.log(`[GlobalSandboxManager] Archived sandbox: ${sandboxId}`);
  }

  /**
   * Delete sandbox
   */
  async deleteSandbox(sandboxId: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox '${sandboxId}' not found`);
    }

    const provider = this.getProvider(sandbox.provider);
    if (provider && provider.deleteSandbox) {
      await provider.deleteSandbox(sandboxId);
    }

    const sandboxPath = this.getSandboxPath(sandboxId);
    await rm(sandboxPath, { recursive: true, force: true });

    this.sandboxes.delete(sandboxId);

    // Publish event
    await this.eventBus.publish({
      id: `sandbox-deleted-${sandboxId}`,
      type: 'sandbox.deleted',
      timestamp: Date.now(),
      source: 'global-sandbox-manager',
      payload: { sandboxId }
    });

    console.log(`[GlobalSandboxManager] Deleted sandbox: ${sandboxId}`);
  }

  /**
   * Cleanup expired/inactive sandboxes
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const toCleanup: string[] = [];

    for (const [id, sandbox] of this.sandboxes.entries()) {
      // Check expiration
      if (sandbox.expiresAt && sandbox.expiresAt < now) {
        toCleanup.push(id);
        continue;
      }

      // Check if archived for too long (30 days)
      if (sandbox.status === 'archived' && sandbox.archivedAt) {
        const archiveAge = now - sandbox.archivedAt;
        const maxArchiveAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (archiveAge > maxArchiveAge) {
          toCleanup.push(id);
        }
      }
    }

    for (const id of toCleanup) {
      await this.deleteSandbox(id);
    }

    console.log(`[GlobalSandboxManager] Cleaned up ${toCleanup.length} sandboxes`);
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
    return this.sandboxes.has(sandboxId) || existsSync(this.getSandboxPath(sandboxId));
  }

  /**
   * Initialize default providers
   */
  private async initializeDefaultProviders(): Promise<void> {
    // Local provider is always available
    try {
      const { LocalSandboxProvider } = await import('../sandbox/local.provider.js');
      const localProvider = new LocalSandboxProvider();
      await localProvider.initialize();
      const localSandboxProvider: ISandboxProvider = {
        name: 'local',
        type: 'local',
        initialize: async () => {
          await localProvider.initialize();
        },
        createSandbox: async (options) => {
          // Create local sandbox structure
          const sandboxId = this.generateSandboxId(options.name);
          const sandboxPath = this.getSandboxPath(sandboxId);
          await mkdir(sandboxPath, { recursive: true });
          await mkdir(join(sandboxPath, 'src'), { recursive: true });
          await mkdir(join(sandboxPath, 'tests'), { recursive: true });
          await mkdir(join(sandboxPath, 'docs'), { recursive: true });

          return {
            id: sandboxId,
            name: options.name,
            status: 'active',
            category: options.category,
            provider: 'local',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: options.description,
            owner: options.owner,
            tags: options.tags,
            metadata: options.metadata
          };
        },
        execute: async (context) => {
          // Execute via local provider
          try {
            const result = await localProvider.executeCommand(
              context.command || 'exec',
              context.code ? context.code.split(' ') : []
            );
            return {
              success: true,
              stdout: result.stdout || '',
              stderr: result.stderr || '',
              exitCode: result.exitCode || 0,
              executionTime: result.executionTime || 0
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              exitCode: 1
            };
          }
        },
        getSandbox: async (sandboxId) => {
          return this.sandboxes.get(sandboxId) || null;
        },
        listSandboxes: async (filter) => {
          return this.listSandboxes(filter);
        },
        deleteSandbox: async (sandboxId) => {
          const path = this.getSandboxPath(sandboxId);
          await rm(path, { recursive: true, force: true });
        },
        cleanup: async () => {
          // Cleanup handled by manager
        }
      };
      this.registerProvider(localSandboxProvider);
    } catch (error) {
      console.warn('[GlobalSandboxManager] Failed to initialize local provider:', error);
    }
  }

  /**
   * Generate unique sandbox ID
   */
  private generateSandboxId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${sanitizedName}-${timestamp}-${random}`;
  }

  /**
   * Load existing sandboxes from disk
   */
  private async loadSandboxes(): Promise<void> {
    if (!existsSync(this.config.baseDir)) {
      return;
    }

    try {
      const entries = await readdir(this.config.baseDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = join(this.config.baseDir, entry.name, 'metadata.json');
          if (existsSync(metadataPath)) {
            try {
              const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
              this.sandboxes.set(entry.name, metadata);
            } catch (error) {
              console.warn(`[GlobalSandboxManager] Failed to load metadata for ${entry.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[GlobalSandboxManager] Failed to load sandboxes:', error);
    }
  }

  /**
   * Save sandbox metadata to disk
   * Optimized: Use cached serialization
   */
  private async saveSandboxMetadata(sandboxId: string, metadata: SandboxMetadata): Promise<void> {
    const sandboxPath = this.getSandboxPath(sandboxId);
    await mkdir(sandboxPath, { recursive: true });
    
    const metadataPath = join(sandboxPath, 'metadata.json');
    // Optimized: Use cached serialization for frequently saved metadata
    const serialized = cachedStringify(metadata);
    await writeFile(metadataPath, serialized);
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

  /**
   * Start cleanup task
   * Optimized: Smart scheduling - only run when there are sandboxes to clean
   */
  private startCleanupTask(): void {
    const scheduleNextCleanup = async () => {
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
      }

      // Check if there are sandboxes that need cleanup
      const now = Date.now();
      const hasExpiredSandboxes = Array.from(this.sandboxes.values()).some(sandbox => {
        if (sandbox.expiresAt && sandbox.expiresAt < now) {
          return true;
        }
        if (sandbox.status === 'archived' && sandbox.archivedAt) {
          const archiveAge = now - sandbox.archivedAt;
          const maxArchiveAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          return archiveAge > maxArchiveAge;
        }
        return false;
      });

      if (hasExpiredSandboxes || this.sandboxes.size > 0) {
        // Active sandboxes exist, check more frequently (every 6 hours)
        try {
          await this.cleanup();
        } catch (error) {
          console.error('[GlobalSandboxManager] Cleanup task failed:', error);
        }
        this.cleanupTimer = setTimeout(scheduleNextCleanup, 6 * 60 * 60 * 1000); // 6 hours
      } else {
        // No sandboxes, check less frequently (every 24 hours)
        this.cleanupTimer = setTimeout(scheduleNextCleanup, 24 * 60 * 60 * 1000); // 24 hours
      }
    };

    // Start initial cleanup check
    scheduleNextCleanup();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.sandboxes.clear();
    this.providers.clear();
  }
}

