/**
 * Tests for FEATURE_AGENT Sandbox Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeatureSandboxManager, SandboxMetadata } from '../../agents/feature-sandbox.manager.js';
import { LAPAEventBus } from '../../core/event-bus.js';
import { MemoriEngine } from '../../local/memori-engine.js';
import { mkdir, rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('FeatureSandboxManager', () => {
  let manager: FeatureSandboxManager;
  let eventBus: LAPAEventBus;
  let memoriEngine: MemoriEngine;
  const testBaseDir = 'test-sandbox';
  const testArchiveDir = 'test-sandbox/archive';

  beforeEach(async () => {
    // Clean up test directories
    if (existsSync(testBaseDir)) {
      await rm(testBaseDir, { recursive: true, force: true });
    }

    eventBus = new LAPAEventBus();
    memoriEngine = new MemoriEngine();

    manager = new FeatureSandboxManager(
      {
        baseDir: testBaseDir,
        archiveDir: testArchiveDir,
        enableIsolation: true,
        autoCleanup: false
      },
      eventBus,
      memoriEngine
    );

    await manager.initialize();
  });

  afterEach(async () => {
    // Clean up test directories
    if (existsSync(testBaseDir)) {
      await rm(testBaseDir, { recursive: true, force: true });
    }
  });

  describe('initialize', () => {
    it('should create base directories', async () => {
      expect(existsSync(testBaseDir)).toBe(true);
      expect(existsSync(testArchiveDir)).toBe(true);
    });

    it('should load existing sandboxes', async () => {
      // Create a sandbox first
      await manager.createSandbox('test-feature', 'Test feature description');
      
      // Create new manager instance
      const newManager = new FeatureSandboxManager(
        {
          baseDir: testBaseDir,
          archiveDir: testArchiveDir
        },
        eventBus,
        memoriEngine
      );
      
      await newManager.initialize();
      
      const sandboxes = await newManager.listSandboxes();
      expect(sandboxes.length).toBeGreaterThan(0);
    });
  });

  describe('createSandbox', () => {
    it('should create a new sandbox', async () => {
      const metadata = await manager.createSandbox('test-feature', 'Test feature');

      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      expect(metadata.name).toBe('test-feature');
      expect(metadata.status).toBe('active');
      expect(metadata.featureName).toBe('test-feature');
      expect(metadata.description).toBe('Test feature');
    });

    it('should create sandbox directory structure', async () => {
      const metadata = await manager.createSandbox('test-feature');
      const sandboxPath = manager.getSandboxPath(metadata.id);

      expect(existsSync(sandboxPath)).toBe(true);
      expect(existsSync(join(sandboxPath, 'src'))).toBe(true);
      expect(existsSync(join(sandboxPath, 'tests'))).toBe(true);
      expect(existsSync(join(sandboxPath, 'docs'))).toBe(true);
      expect(existsSync(join(sandboxPath, 'sandbox.config.json'))).toBe(true);
      expect(existsSync(join(sandboxPath, 'README.md'))).toBe(true);
    });

    it('should throw error if sandbox already exists', async () => {
      const metadata = await manager.createSandbox('test-feature');
      
      await expect(
        manager.createSandbox('test-feature')
      ).rejects.toThrow('already exists');
    });

    it('should publish sandbox.created event', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');
      
      await manager.createSandbox('test-feature');
      
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sandbox.created'
        })
      );
    });
  });

  describe('getSandbox', () => {
    it('should return sandbox metadata', async () => {
      const created = await manager.createSandbox('test-feature');
      const retrieved = await manager.getSandbox(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    it('should return null for non-existent sandbox', async () => {
      const retrieved = await manager.getSandbox('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('listSandboxes', () => {
    it('should list all sandboxes', async () => {
      await manager.createSandbox('feature-1');
      await manager.createSandbox('feature-2');
      await manager.createSandbox('feature-3');

      const sandboxes = await manager.listSandboxes();
      expect(sandboxes.length).toBe(3);
    });

    it('should filter by status', async () => {
      const sandbox1 = await manager.createSandbox('feature-1');
      const sandbox2 = await manager.createSandbox('feature-2');
      
      await manager.archiveSandbox(sandbox1.id);

      const active = await manager.listSandboxes('active');
      const archived = await manager.listSandboxes('archived');

      expect(active.length).toBe(1);
      expect(archived.length).toBe(1);
    });
  });

  describe('updateSandbox', () => {
    it('should update sandbox metadata', async () => {
      const created = await manager.createSandbox('test-feature');
      
      const updated = await manager.updateSandbox(created.id, {
        iterationCount: 5,
        testCoverage: 85.5,
        notes: ['First iteration', 'Added tests']
      });

      expect(updated.iterationCount).toBe(5);
      expect(updated.testCoverage).toBe(85.5);
      expect(updated.notes).toEqual(['First iteration', 'Added tests']);
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('should throw error for non-existent sandbox', async () => {
      await expect(
        manager.updateSandbox('non-existent', { iterationCount: 1 })
      ).rejects.toThrow('not found');
    });
  });

  describe('promoteSandbox', () => {
    it('should promote sandbox to production', async () => {
      const metadata = await manager.createSandbox('test-feature');
      const sandboxPath = manager.getSandboxPath(metadata.id);
      
      // Create some test files
      const { writeFile } = await import('fs/promises');
      await writeFile(join(sandboxPath, 'src', 'index.ts'), 'export const feature = "test";');
      await writeFile(join(sandboxPath, 'tests', 'index.test.ts'), 'describe("feature", () => {});');

      await manager.promoteSandbox(metadata.id, 'test-output');

      // Check that files were copied
      expect(existsSync('test-output/index.ts')).toBe(true);
      
      // Check that sandbox was archived
      const promoted = await manager.getSandbox(metadata.id);
      expect(promoted?.status).toBe('promoted');
      
      // Cleanup
      if (existsSync('test-output')) {
        await rm('test-output', { recursive: true, force: true });
      }
    });

    it('should throw error for non-existent sandbox', async () => {
      await expect(
        manager.promoteSandbox('non-existent')
      ).rejects.toThrow('not found');
    });

    it('should throw error for non-active sandbox', async () => {
      const metadata = await manager.createSandbox('test-feature');
      await manager.archiveSandbox(metadata.id);

      await expect(
        manager.promoteSandbox(metadata.id)
      ).rejects.toThrow('Cannot promote');
    });
  });

  describe('archiveSandbox', () => {
    it('should archive sandbox', async () => {
      const metadata = await manager.createSandbox('test-feature');
      
      await manager.archiveSandbox(metadata.id);

      const archived = await manager.getSandbox(metadata.id);
      expect(archived?.status).toBe('archived');
      expect(archived?.archivedAt).toBeDefined();
    });

    it('should move sandbox to archive directory', async () => {
      const metadata = await manager.createSandbox('test-feature');
      const sandboxPath = manager.getSandboxPath(metadata.id);
      
      await manager.archiveSandbox(metadata.id);

      // Original should be removed
      expect(existsSync(sandboxPath)).toBe(false);
      
      // Archive should exist
      const archivePath = join(testArchiveDir, metadata.id);
      expect(existsSync(archivePath)).toBe(true);
    });
  });

  describe('cleanupSandbox', () => {
    it('should permanently delete sandbox', async () => {
      const metadata = await manager.createSandbox('test-feature');
      
      await manager.cleanupSandbox(metadata.id);

      const retrieved = await manager.getSandbox(metadata.id);
      expect(retrieved).toBeNull();
      
      const sandboxPath = manager.getSandboxPath(metadata.id);
      expect(existsSync(sandboxPath)).toBe(false);
    });
  });

  describe('getSandboxPath', () => {
    it('should return correct sandbox path', async () => {
      const metadata = await manager.createSandbox('test-feature');
      const path = manager.getSandboxPath(metadata.id);

      expect(path).toBe(join(testBaseDir, metadata.id));
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('sandboxExists', () => {
    it('should return true for existing sandbox', async () => {
      const metadata = await manager.createSandbox('test-feature');
      expect(manager.sandboxExists(metadata.id)).toBe(true);
    });

    it('should return false for non-existent sandbox', () => {
      expect(manager.sandboxExists('non-existent')).toBe(false);
    });
  });
});

