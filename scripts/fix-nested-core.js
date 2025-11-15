#!/usr/bin/env node
/**
 * Fix Nested Core Directories
 * 
 * The consolidation script accidentally created nested core/core/core... directories.
 * This script finds the deepest valid core directory and collapses it to src/core/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const srcCoreDir = path.join(rootDir, 'src', 'core');

/**
 * Find the deepest core directory that contains actual files (not just another core/)
 */
function findDeepestCore(startPath, depth = 0) {
  let current = startPath;
  let lastValid = startPath;
  
  // Go as deep as we can while still finding a core/core/ structure
  while (fs.existsSync(current)) {
    const contents = fs.readdirSync(current);
    
    // If this directory has files other than just 'core', it's valid
    const hasOtherFiles = contents.some(item => {
      if (item === 'core') {
        const corePath = path.join(current, 'core');
        return !fs.existsSync(corePath) || !fs.statSync(corePath).isDirectory();
      }
      return true;
    });
    
    if (hasOtherFiles) {
      lastValid = current;
    }
    
    // Check if there's another core/ directory
    const nextCore = path.join(current, 'core');
    if (fs.existsSync(nextCore) && fs.statSync(nextCore).isDirectory()) {
      current = nextCore;
      depth++;
    } else {
      break;
    }
  }
  
  return { deepest: current, lastValid, depth };
}

/**
 * Move all contents from source to destination, skipping 'core' directories
 */
function moveContentsExcludingCore(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const entries = fs.readdirSync(src);
  
  for (const entry of entries) {
    // Skip 'core' directory - we'll handle that separately
    if (entry === 'core') continue;
    
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    
    if (fs.existsSync(destPath)) {
      // If destination exists and is a directory, merge contents
      if (fs.statSync(srcPath).isDirectory() && fs.statSync(destPath).isDirectory()) {
        moveContentsExcludingCore(srcPath, destPath);
        fs.rmSync(srcPath, { recursive: true, force: true });
      } else {
        // File exists, skip or overwrite?
        fs.rmSync(srcPath, { recursive: true, force: true });
      }
    } else {
      // Move the entry
      fs.renameSync(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('🔧 Fixing nested core directories...\n');
  
  if (!fs.existsSync(srcCoreDir)) {
    console.log('❌ src/core/ does not exist!');
    return;
  }
  
  // Find the deepest valid core directory
  const { deepest, lastValid, depth } = findDeepestCore(srcCoreDir);
  
  console.log(`📊 Found nesting depth: ${depth}`);
  console.log(`📍 Deepest path: ${deepest}`);
  console.log(`📍 Last valid: ${lastValid}\n`);
  
  // Create a temporary backup location
  const tempDir = path.join(rootDir, 'src', 'core_temp_backup');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('📦 Step 1: Moving all valid content from deepest core to temp backup...');
  
  // Move all non-core contents from the deepest directory to temp
  moveContentsExcludingCore(deepest, tempDir);
  
  // Also collect from intermediate core directories
  let current = srcCoreDir;
  for (let i = 0; i < depth; i++) {
    const contents = fs.readdirSync(current);
    for (const item of contents) {
      if (item === 'core') {
        current = path.join(current, 'core');
        continue;
      }
      
      const itemPath = path.join(current, item);
      const tempPath = path.join(tempDir, item);
      
      if (!fs.existsSync(tempPath)) {
        if (fs.statSync(itemPath).isDirectory()) {
          moveContentsExcludingCore(itemPath, tempPath);
        } else {
          if (!fs.existsSync(path.dirname(tempPath))) {
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
          }
          fs.copyFileSync(itemPath, tempPath);
        }
      }
    }
  }
  
  console.log('✅ Content extracted\n');
  
  console.log('🗑️  Step 2: Removing all nested core directories...');
  // Remove the entire nested structure
  fs.rmSync(srcCoreDir, { recursive: true, force: true });
  fs.mkdirSync(srcCoreDir, { recursive: true });
  console.log('✅ Removed nested structure\n');
  
  console.log('📦 Step 3: Moving content back to src/core/...');
  // Move content back from temp to src/core/
  const tempContents = fs.readdirSync(tempDir);
  for (const item of tempContents) {
    const tempPath = path.join(tempDir, item);
    const destPath = path.join(srcCoreDir, item);
    fs.renameSync(tempPath, destPath);
  }
  
  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log('✅ Content restored\n');
  console.log('🎉 Nested core directories fixed!\n');
  
  // List what's now in src/core/
  const finalContents = fs.readdirSync(srcCoreDir);
  console.log(`📁 Contents of src/core/:`);
  finalContents.forEach(item => {
    const itemPath = path.join(srcCoreDir, item);
    const stats = fs.statSync(itemPath);
    const type = stats.isDirectory() ? '📁' : '📄';
    console.log(`  ${type} ${item}`);
  });
}

main().catch(console.error);


