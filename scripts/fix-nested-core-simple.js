#!/usr/bin/env node
/**
 * Simple Fix for Nested Core Directories
 * 
 * Finds all actual files in the nested structure (ignoring 'core' directories),
 * moves them to a temporary location, deletes src/core/, then restores files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const srcCoreDir = path.join(rootDir, 'src', 'core');
const tempBackupDir = path.join(rootDir, 'src_core_backup');

/**
 * Recursively find all files (excluding 'core' directories) and copy to backup
 */
function extractAllFiles(srcPath, backupPath, relativePath = '') {
  if (!fs.existsSync(srcPath)) return;
  
  const entries = fs.readdirSync(srcPath);
  
  for (const entry of entries) {
    // Skip 'core' directories - these are the nesting problem
    if (entry === 'core') continue;
    
    const srcEntryPath = path.join(srcPath, entry);
    const backupEntryPath = path.join(backupPath, relativePath ? path.join(relativePath, entry) : entry);
    
    const stats = fs.statSync(srcEntryPath);
    
    if (stats.isDirectory()) {
      // Create directory in backup
      if (!fs.existsSync(backupEntryPath)) {
        fs.mkdirSync(backupEntryPath, { recursive: true });
      }
      // Recurse
      extractAllFiles(srcEntryPath, backupPath, relativePath ? path.join(relativePath, entry) : entry);
    } else {
      // Copy file
      if (!fs.existsSync(path.dirname(backupEntryPath))) {
        fs.mkdirSync(path.dirname(backupEntryPath), { recursive: true });
      }
      fs.copyFileSync(srcEntryPath, backupEntryPath);
    }
  }
}

async function main() {
  console.log('🔧 Fixing nested core directories (simple approach)...\n');
  
  // Step 1: Extract all files to temp backup
  console.log('📦 Step 1: Extracting all files to backup (skipping nested core directories)...');
  if (fs.existsSync(tempBackupDir)) {
    fs.rmSync(tempBackupDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempBackupDir, { recursive: true });
  
  extractAllFiles(srcCoreDir, tempBackupDir);
  console.log('✅ Files extracted\n');
  
  // Step 2: Delete the entire nested src/core/ structure
  console.log('🗑️  Step 2: Deleting nested src/core/ structure...');
  fs.rmSync(srcCoreDir, { recursive: true, force: true });
  fs.mkdirSync(srcCoreDir, { recursive: true });
  console.log('✅ Deleted nested structure\n');
  
  // Step 3: Restore files from backup
  console.log('📦 Step 3: Restoring files to src/core/...');
  const backupContents = fs.readdirSync(tempBackupDir);
  let restoredCount = 0;
  
  for (const item of backupContents) {
    const backupItemPath = path.join(tempBackupDir, item);
    const destItemPath = path.join(srcCoreDir, item);
    
    const stats = fs.statSync(backupItemPath);
    if (stats.isDirectory()) {
      // Use copyDirectory approach for directories
      function copyDirRecursive(src, dest) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
          const srcEntry = path.join(src, entry);
          const destEntry = path.join(dest, entry);
          const entryStats = fs.statSync(srcEntry);
          if (entryStats.isDirectory()) {
            copyDirRecursive(srcEntry, destEntry);
          } else {
            fs.copyFileSync(srcEntry, destEntry);
          }
        }
      }
      copyDirRecursive(backupItemPath, destItemPath);
      restoredCount++;
      console.log(`✅ Restored: ${item}/`);
    } else {
      fs.copyFileSync(backupItemPath, destItemPath);
      restoredCount++;
      console.log(`✅ Restored: ${item}`);
    }
  }
  
  console.log(`\n✅ Restored ${restoredCount} items\n`);
  
  // Step 4: Clean up backup
  console.log('🧹 Step 4: Cleaning up backup...');
  fs.rmSync(tempBackupDir, { recursive: true, force: true });
  console.log('✅ Cleanup complete\n');
  
  // Step 5: Verify result
  console.log('✅ Verification: Contents of src/core/:');
  const finalContents = fs.readdirSync(srcCoreDir);
  if (finalContents.length === 0) {
    console.log('  ⚠️  src/core/ is empty! Files may have been lost.');
  } else {
    finalContents.forEach(item => {
      const itemPath = path.join(srcCoreDir, item);
      const stats = fs.statSync(itemPath);
      const type = stats.isDirectory() ? '📁' : '📄';
      console.log(`  ${type} ${item}`);
    });
  }
  
  console.log('\n🎉 Fix complete!');
  console.log('\n⚠️  IMPORTANT: Review src/core/ and verify all files are present.');
  console.log('   If files are missing, they may still be in the nested structure.');
  console.log('   You may need to manually check or restore from git.');
}

main().catch(console.error);


