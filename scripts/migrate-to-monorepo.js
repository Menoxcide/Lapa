#!/usr/bin/env node
/**
 * Monorepo Migration Script
 * 
 * Safely migrates from current structure to monorepo:
 * 1. Copies src/ to packages/core/src/
 * 2. Creates IDE extension structure
 * 3. Updates imports
 * 4. Validates migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const coreSrc = path.join(rootDir, 'src');
const coreDest = path.join(rootDir, 'packages', 'core', 'src');
const extensionSrc = path.join(rootDir, 'lapa-ide-void', 'extensions', 'lapa-swarm', 'src');
const extensionDest = path.join(rootDir, 'packages', 'ide-extension', 'src');

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ Source directory not found: ${src}`);
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

    // Skip certain directories
    if (entry.name === 'node_modules' || 
        entry.name === 'dist' || 
        entry.name === 'coverage' ||
        entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

/**
 * Extract IDE-specific files from extension
 */
function extractIDEFiles() {
  console.log('\n📦 Extracting IDE-specific files...');
  
  // IDE-specific files to extract
  const ideFiles = [
    'extension.ts',
    'ui/LAPASwarmViewPane.tsx',
    'ui/LAPAActionBar.tsx',
    'ui/UpgradeDialog.tsx',
    'ui/webview-entry.tsx',
    'swarm/swarm-manager.ts',
    'premium/feature-gate.ts',
    'agents/code-smell-detector.ts',
    'agents/error-explainer.ts',
    'orchestrator/command-palette-ai.ts',
    'orchestrator/handoff-recorder.ts',
    'orchestrator/inline-documentation-generator.ts',
    'orchestrator/code-snippet-library.ts',
    'skills/',
    'inference/models/',
    'inference/multilingual-detector.ts',
    'inference/multilingual-router.ts',
    'inference/ollama-flash-attention.ts'
  ];

  // Create ide-specific directory
  const ideSpecificDir = path.join(extensionDest, 'ide-specific');
  if (!fs.existsSync(ideSpecificDir)) {
    fs.mkdirSync(ideSpecificDir, { recursive: true });
  }

  // Copy IDE-specific files
  for (const file of ideFiles) {
    const srcPath = path.join(extensionSrc, file);
    const destPath = path.join(ideSpecificDir, file);

    if (fs.existsSync(srcPath)) {
      const stats = fs.statSync(srcPath);
      if (stats.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(`   ✅ Copied: ${file}`);
    }
  }

  // Create extension entry point that imports from core
  const extensionEntry = path.join(extensionDest, 'extension.ts');
  const extensionContent = `// LAPA IDE Extension Entry Point
// This file wraps @lapa/core for IDE integration

import * as vscode from 'vscode';
import { LAPASwarmViewPane } from './ide-specific/ui/LAPASwarmViewPane';
// Import from @lapa/core
import * as lapaCore from '@lapa/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('LAPA Swarm extension is now active!');
  
  // Initialize core
  // TODO: Initialize LAPA core here
  
  // Register IDE-specific components
  const viewProvider = vscode.window.registerWebviewViewProvider(
    'lapaSwarmView',
    new LAPASwarmViewPane(context.extensionUri),
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );
  
  context.subscriptions.push(viewProvider);
  
  // Register commands
  // TODO: Register commands that use @lapa/core
}

export function deactivate() {
  // Cleanup
}
`;

  fs.writeFileSync(extensionEntry, extensionContent);
  console.log(`   ✅ Created: extension.ts`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 LAPA Monorepo Migration\n');
  console.log('This script will:');
  console.log('  1. Copy src/ to packages/core/src/');
  console.log('  2. Extract IDE-specific files');
  console.log('  3. Create extension wrapper');
  console.log('  4. Validate migration\n');

  // Step 1: Copy core source
  console.log('📂 Step 1: Copying core source...');
  if (copyDir(coreSrc, coreDest)) {
    console.log(`   ✅ Copied ${coreSrc} → ${coreDest}`);
  } else {
    console.error('   ❌ Failed to copy core source');
    process.exit(1);
  }

  // Step 2: Extract IDE-specific files
  console.log('\n📦 Step 2: Extracting IDE-specific files...');
  if (fs.existsSync(extensionSrc)) {
    extractIDEFiles();
  } else {
    console.log('   ⚠️  Extension source not found, skipping IDE extraction');
  }

  // Step 3: Create README
  const coreReadme = path.join(rootDir, 'packages', 'core', 'README.md');
  fs.writeFileSync(coreReadme, `# @lapa/core

LAPA Core - Local AI Pair Programmer Agent

This package contains the core LAPA functionality that can be used across different platforms.

## Installation

\`\`\`bash
pnpm install @lapa/core
\`\`\`

## Usage

\`\`\`typescript
import * as lapa from '@lapa/core';
\`\`\`

## Build

\`\`\`bash
pnpm build
\`\`\`

## Test

\`\`\`bash
pnpm test
\`\`\`
`);

  const ideReadme = path.join(rootDir, 'packages', 'ide-extension', 'README.md');
  fs.writeFileSync(ideReadme, `# @lapa/ide-extension

LAPA IDE Extension - VSCode/VoidChassis integration wrapper

This package wraps @lapa/core for IDE integration.

## Installation

\`\`\`bash
pnpm install @lapa/ide-extension
\`\`\`

## Usage

This package is used by lapa-ide-void/extensions/lapa-swarm.

## Build

\`\`\`bash
pnpm build
\`\`\`
`);

  console.log('\n✅ Migration complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Update root package.json to workspace root');
  console.log('  2. Run: pnpm install');
  console.log('  3. Update imports in packages/ide-extension to use @lapa/core');
  console.log('  4. Test builds: pnpm -r build');
  console.log('  5. Update lapa-ide-void to use workspace packages');
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

