#!/usr/bin/env node
/**
 * Source Directory Consolidation Script - Phase 1
 * 
 * Moves files from multiple source directories into a single src/ structure:
 * - src/core/ - Core LAPA functionality
 * - src/ide-integration/ - IDE-specific integration
 * - src/extension/ - Extension-specific code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Directories to move from src/ to src/core/
const coreDirectories = [
  'agents',
  'communication',
  'coordination',
  // 'core' - Handle separately by merging contents, not moving directory
  'inference',
  'local',
  'marketplace',
  'mcp',
  'modeling',
  'modes',
  'multimodal',
  'observability',
  'orchestrator',
  'premium',
  'rag',
  'research',
  'sandbox',
  'security',
  'shims',
  'swarm',
  'types',
  'utils',
  'validation',
];

// Files to move from src/ to src/core/
const coreFiles = [
  'DIRECTIONS.md',
  'generate-phase.js',
  'index.ts',
];

// Test directory
const testDir = '__tests__';

// Source paths
const srcDir = path.join(rootDir, 'src');
const ideIntegrationSource = path.join(rootDir, 'lapa-ide-void', 'src', 'vs', 'workbench', 'contrib', 'lapa');
const extensionSource = path.join(rootDir, 'lapa-ide-void', 'extensions', 'lapa-swarm', 'src');

// Destination paths
const coreDest = path.join(rootDir, 'src', 'core');
const ideIntegrationDest = path.join(rootDir, 'src', 'ide-integration');
const extensionDest = path.join(rootDir, 'src', 'extension');

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source doesn't exist: ${src}`);
    return false;
  }

  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

/**
 * Move directory (copy then remove)
 */
function moveDirectory(src, dest) {
  if (copyDirectory(src, dest)) {
    fs.rmSync(src, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Move file
 */
function moveFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source file doesn't exist: ${src}`);
    return false;
  }

  // Create destination directory if needed
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
  fs.unlinkSync(src);
  return true;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Source Directory Consolidation - Phase 1\n');

  // Step 1: Move core directories (EXCLUDE 'core' - handle separately)
  console.log('📦 Step 1: Moving core directories to src/core/...');
  let movedCount = 0;
  for (const dir of coreDirectories) {
    // Skip 'core' directory - we'll merge its contents instead
    if (dir === 'core') {
      console.log(`⚠️  Skipping 'core' directory - will merge contents separately`);
      continue;
    }
    
    const srcPath = path.join(srcDir, dir);
    const destPath = path.join(coreDest, dir);
    
    // Skip if source is the same as destination (already there)
    if (srcPath === destPath) {
      console.log(`⚠️  Skipped (already in place): ${dir}/`);
      continue;
    }
    
    if (fs.existsSync(srcPath)) {
      // Check if destination already exists
      if (fs.existsSync(destPath)) {
        console.log(`⚠️  Destination exists: ${dir}/ - merging contents...`);
        // Merge contents
        copyDirectory(srcPath, destPath);
        fs.rmSync(srcPath, { recursive: true, force: true });
        console.log(`✅ Merged: ${dir}/ → src/core/${dir}/`);
      } else {
        if (moveDirectory(srcPath, destPath)) {
          console.log(`✅ Moved: ${dir}/ → src/core/${dir}/`);
        }
      }
      movedCount++;
    } else {
      console.log(`⚠️  Skipped (not found): ${dir}/`);
    }
  }
  console.log(`   Processed ${movedCount} directories\n`);
  
  // Step 1.5: Merge existing src/core/ contents (if any remain)
  const existingCorePath = path.join(srcDir, 'core');
  if (fs.existsSync(existingCorePath) && existingCorePath !== coreDest) {
    console.log('📦 Step 1.5: Merging existing src/core/ contents...');
    const existingCoreContents = fs.readdirSync(existingCorePath);
    for (const item of existingCoreContents) {
      const srcItemPath = path.join(existingCorePath, item);
      const destItemPath = path.join(coreDest, item);
      
      // Skip 'core' subdirectory to prevent nesting
      if (item === 'core') {
        console.log(`⚠️  Skipping nested 'core' directory to prevent recursion`);
        continue;
      }
      
      if (fs.existsSync(destItemPath)) {
        // Destination exists - merge if directory, skip if file
        if (fs.statSync(srcItemPath).isDirectory() && fs.statSync(destItemPath).isDirectory()) {
          copyDirectory(srcItemPath, destItemPath);
          fs.rmSync(srcItemPath, { recursive: true, force: true });
          console.log(`✅ Merged: core/${item}/ → src/core/${item}/`);
        } else {
          // File exists, skip
          fs.rmSync(srcItemPath, { force: true });
          console.log(`⚠️  Skipped (file exists): core/${item}`);
        }
      } else {
        // Move to destination
        const stats = fs.statSync(srcItemPath);
        if (stats.isDirectory()) {
          moveDirectory(srcItemPath, destItemPath);
        } else {
          moveFile(srcItemPath, destItemPath);
        }
        console.log(`✅ Moved: core/${item} → src/core/${item}`);
      }
    }
    // Try to remove empty src/core/ directory
    try {
      const remaining = fs.readdirSync(existingCorePath);
      if (remaining.length === 0 || (remaining.length === 1 && remaining[0] === 'core')) {
        if (fs.existsSync(path.join(existingCorePath, 'core'))) {
          fs.rmSync(path.join(existingCorePath, 'core'), { recursive: true, force: true });
        }
        fs.rmSync(existingCorePath, { recursive: true, force: true });
        console.log(`✅ Removed empty src/core/ directory`);
      }
    } catch (e) {
      // Ignore errors - directory might not be empty
    }
    console.log();
  }

  // Step 2: Move core files
  console.log('📄 Step 2: Moving core files to src/core/...');
  movedCount = 0;
  for (const file of coreFiles) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(coreDest, file);
    
    if (fs.existsSync(srcPath)) {
      if (moveFile(srcPath, destPath)) {
        console.log(`✅ Moved: ${file} → src/core/${file}`);
        movedCount++;
      }
    }
  }
  console.log(`   Moved ${movedCount} files\n`);

  // Step 3: Move test directory
  console.log('🧪 Step 3: Moving test directory to src/core/__tests__/...');
  const testSrc = path.join(srcDir, testDir);
  const testDest = path.join(coreDest, testDir);
  if (fs.existsSync(testSrc)) {
    if (moveDirectory(testSrc, testDest)) {
      console.log(`✅ Moved: __tests__/ → src/core/__tests__/\n`);
    }
  } else {
    console.log(`⚠️  Test directory not found\n`);
  }

  // Step 4: Move IDE integration
  console.log('🔧 Step 4: Moving IDE integration to src/ide-integration/...');
  if (fs.existsSync(ideIntegrationSource)) {
    const browserSrc = path.join(ideIntegrationSource, 'browser');
    const browserDest = path.join(ideIntegrationDest, 'browser');
    const commonSrc = path.join(ideIntegrationSource, 'common');
    const commonDest = path.join(ideIntegrationDest, 'common');
    const electronMainSrc = path.join(ideIntegrationSource, 'electron-main');
    const electronMainDest = path.join(ideIntegrationDest, 'electron-main');

    if (fs.existsSync(browserSrc)) {
      moveDirectory(browserSrc, browserDest);
      console.log(`✅ Moved: browser/ → src/ide-integration/browser/`);
    }
    if (fs.existsSync(commonSrc)) {
      moveDirectory(commonSrc, commonDest);
      console.log(`✅ Moved: common/ → src/ide-integration/common/`);
    }
    if (fs.existsSync(electronMainSrc)) {
      moveDirectory(electronMainSrc, electronMainDest);
      console.log(`✅ Moved: electron-main/ → src/ide-integration/electron-main/`);
    }
  } else {
    console.log(`⚠️  IDE integration source not found: ${ideIntegrationSource}`);
  }
  console.log();

  // Step 5: Move extension-specific files
  console.log('📦 Step 5: Moving extension-specific files to src/extension/...');
  if (fs.existsSync(extensionSource)) {
    // Move extension.ts
    const extensionTsSrc = path.join(extensionSource, 'extension.ts');
    const extensionTsDest = path.join(extensionDest, 'extension.ts');
    if (fs.existsSync(extensionTsSrc)) {
      moveFile(extensionTsSrc, extensionTsDest);
      console.log(`✅ Moved: extension.ts → src/extension/extension.ts`);
    }

    // Move ui/ directory (extension-specific UI)
    const uiSrc = path.join(extensionSource, 'ui');
    const uiDest = path.join(extensionDest, 'ui');
    if (fs.existsSync(uiSrc)) {
      moveDirectory(uiSrc, uiDest);
      console.log(`✅ Moved: ui/ → src/extension/ui/`);
    }

    // Move skills/ directory (extension-specific)
    const skillsSrc = path.join(extensionSource, 'skills');
    const skillsDest = path.join(extensionDest, 'skills');
    if (fs.existsSync(skillsSrc)) {
      moveDirectory(skillsSrc, skillsDest);
      console.log(`✅ Moved: skills/ → src/extension/skills/`);
    }
  } else {
    console.log(`⚠️  Extension source not found: ${extensionSource}`);
  }
  console.log();

  console.log('🎉 Phase 1 Migration Complete!\n');
  console.log('📋 Next Steps:');
  console.log('1. Update import paths in all moved files');
  console.log('2. Add TypeScript path mappings');
  console.log('3. Update build configurations');
  console.log('4. Test compilation');
}

main().catch(console.error);

