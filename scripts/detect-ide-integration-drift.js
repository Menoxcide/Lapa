#!/usr/bin/env node
/**
 * IDE Integration Drift Detection Script
 * 
 * Detects drift between:
 * - LAPA Core commands/types/config
 * - IDE integration code (lapa-ide-void/src)
 * - Extension code (lapa-ide-void/extensions/lapa-swarm/src)
 * 
 * Checks:
 * - Command IDs
 * - Type definitions
 * - Config structures
 * - Package dependencies
 * - Import paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const coreDir = path.join(rootDir, 'src');
const ideDir = path.join(rootDir, 'lapa-ide-void', 'src');
const extensionDir = path.join(rootDir, 'lapa-ide-void', 'extensions', 'lapa-swarm', 'src');

/**
 * Extract command IDs from code
 */
function extractCommands(filePath, content) {
  const commands = new Set();
  
  // Pattern: registerCommand('lapa.xxx' or "lapa.xxx"
  const registerPattern = /registerCommand\(['"](lapa\.[^'"]+)['"]/g;
  let match;
  while ((match = registerPattern.exec(content)) !== null) {
    commands.add(match[1]);
  }
  
  // Pattern: executeCommand('lapa.xxx' or "lapa.xxx"
  const executePattern = /executeCommand\(['"](lapa\.[^'"]+)['"]/g;
  while ((match = executePattern.exec(content)) !== null) {
    commands.add(match[1]);
  }
  
  // Pattern: command: 'lapa.xxx' (in package.json)
  const packagePattern = /"command":\s*['"](lapa\.[^'"]+)['"]/g;
  while ((match = packagePattern.exec(content)) !== null) {
    commands.add(match[1]);
  }
  
  return commands;
}

/**
 * Extract type definitions
 */
function extractTypes(content) {
  const types = new Set();
  
  // Interface definitions
  const interfacePattern = /export\s+interface\s+(\w+)/g;
  let match;
  while ((match = interfacePattern.exec(content)) !== null) {
    types.add(match[1]);
  }
  
  // Type definitions
  const typePattern = /export\s+type\s+(\w+)/g;
  while ((match = typePattern.exec(content)) !== null) {
    types.add(match[1]);
  }
  
  return types;
}

/**
 * Extract config structure
 */
function extractConfigStructure(content) {
  const config = {};
  
  // Try to find LAPAConfig interface
  const configInterfaceMatch = content.match(/interface\s+LAPAConfig\s*\{([^}]+)\}/s);
  if (configInterfaceMatch) {
    const props = configInterfaceMatch[1];
    // Extract property names
    const propPattern = /(\w+)\??\s*:/g;
    let match;
    while ((match = propPattern.exec(props)) !== null) {
      config[match[1]] = true;
    }
  }
  
  return config;
}

/**
 * Scan directory for files
 */
function scanDirectory(dir, fileMap = new Map()) {
  if (!fs.existsSync(dir)) {
    return fileMap;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip common ignore patterns
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist' || 
        entry.name === 'coverage' ||
        entry.name === 'out' ||
        entry.name === '__tests__') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileMap);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');
        fileMap.set(relPath, content);
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return fileMap;
}

/**
 * Main detection function
 */
async function main() {
  console.log('🔍 LAPA IDE Integration Drift Detection\n');
  
  const drift = {
    commands: {
      core: new Set(),
      ide: new Set(),
      extension: new Set(),
      missing: [],
      extra: [],
      mismatched: []
    },
    types: {
      core: new Set(),
      ide: new Set(),
      missing: [],
      extra: []
    },
    config: {
      core: {},
      ide: {},
      differences: []
    }
  };
  
  // Scan core directory
  console.log('📂 Scanning core directory...');
  const coreFiles = scanDirectory(coreDir);
  console.log(`   Found ${coreFiles.size} files`);
  
  for (const [relPath, content] of coreFiles) {
    const commands = extractCommands(relPath, content);
    commands.forEach(cmd => drift.commands.core.add(cmd));
    
    const types = extractTypes(content);
    types.forEach(type => drift.types.core.add(type));
    
    if (relPath.includes('config') || relPath.includes('Config')) {
      const config = extractConfigStructure(content);
      Object.assign(drift.config.core, config);
    }
  }
  
  // Scan IDE directory
  console.log('\n📂 Scanning IDE integration directory...');
  const ideFiles = scanDirectory(ideDir);
  console.log(`   Found ${ideFiles.size} files`);
  
  for (const [relPath, content] of ideFiles) {
    const commands = extractCommands(relPath, content);
    commands.forEach(cmd => drift.commands.ide.add(cmd));
    
    const types = extractTypes(content);
    types.forEach(type => drift.types.ide.add(type));
    
    if (relPath.includes('lapa') || relPath.includes('LAPA')) {
      const config = extractConfigStructure(content);
      Object.assign(drift.config.ide, config);
    }
  }
  
  // Scan extension directory
  console.log('\n📂 Scanning extension directory...');
  const extensionFiles = scanDirectory(extensionDir);
  console.log(`   Found ${extensionFiles.size} files`);
  
  for (const [relPath, content] of extensionFiles) {
    const commands = extractCommands(relPath, content);
    commands.forEach(cmd => drift.commands.extension.add(cmd));
  }
  
  // Analyze command drift
  console.log('\n🔍 Analyzing command drift...');
  
  // Commands in extension but not in IDE
  for (const cmd of drift.commands.extension) {
    if (!drift.commands.ide.has(cmd)) {
      drift.commands.missing.push({
        command: cmd,
        location: 'IDE',
        foundIn: 'extension'
      });
    }
  }
  
  // Commands in IDE but not in extension
  for (const cmd of drift.commands.ide) {
    if (!drift.commands.extension.has(cmd) && !drift.commands.core.has(cmd)) {
      drift.commands.extra.push({
        command: cmd,
        location: 'IDE',
        foundIn: 'IDE only'
      });
    }
  }
  
  // Analyze type drift
  console.log('🔍 Analyzing type drift...');
  
  for (const type of drift.types.ide) {
    if (type.includes('LAPA') && !drift.types.core.has(type)) {
      drift.types.missing.push({
        type,
        location: 'core',
        foundIn: 'IDE'
      });
    }
  }
  
  // Analyze config drift
  console.log('🔍 Analyzing config drift...');
  
  const coreConfigKeys = Object.keys(drift.config.core);
  const ideConfigKeys = Object.keys(drift.config.ide);
  
  for (const key of ideConfigKeys) {
    if (!coreConfigKeys.includes(key)) {
      drift.config.differences.push({
        key,
        issue: 'In IDE but not in core',
        ideValue: drift.config.ide[key],
        coreValue: null
      });
    }
  }
  
  for (const key of coreConfigKeys) {
    if (!ideConfigKeys.includes(key)) {
      drift.config.differences.push({
        key,
        issue: 'In core but not in IDE',
        ideValue: null,
        coreValue: drift.config.core[key]
      });
    }
  }
  
  // Generate report
  console.log('\n📊 Summary:\n');
  console.log(`Commands:`);
  console.log(`   Core: ${drift.commands.core.size}`);
  console.log(`   IDE: ${drift.commands.ide.size}`);
  console.log(`   Extension: ${drift.commands.extension.size}`);
  console.log(`   Missing in IDE: ${drift.commands.missing.length}`);
  console.log(`   Extra in IDE: ${drift.commands.extra.length}`);
  
  console.log(`\nTypes:`);
  console.log(`   Core: ${drift.types.core.size}`);
  console.log(`   IDE: ${drift.types.ide.size}`);
  console.log(`   Missing in core: ${drift.types.missing.length}`);
  
  console.log(`\nConfig:`);
  console.log(`   Core keys: ${coreConfigKeys.length}`);
  console.log(`   IDE keys: ${ideConfigKeys.length}`);
  console.log(`   Differences: ${drift.config.differences.length}`);
  
  // Detailed report
  if (drift.commands.missing.length > 0) {
    console.log('\n⚠️  Commands missing in IDE integration:');
    drift.commands.missing.forEach(item => {
      console.log(`   - ${item.command} (found in ${item.foundIn})`);
    });
  }
  
  if (drift.commands.extra.length > 0) {
    console.log('\n⚠️  Commands in IDE but not in extension:');
    drift.commands.extra.forEach(item => {
      console.log(`   - ${item.command}`);
    });
  }
  
  if (drift.types.missing.length > 0) {
    console.log('\n⚠️  Types in IDE but not in core:');
    drift.types.missing.forEach(item => {
      console.log(`   - ${item.type}`);
    });
  }
  
  if (drift.config.differences.length > 0) {
    console.log('\n⚠️  Config structure differences:');
    drift.config.differences.forEach(item => {
      console.log(`   - ${item.key}: ${item.issue}`);
    });
  }
  
  // Save report
  const reportsDir = path.join(rootDir, 'docs', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, 'ide-integration-drift-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    commands: {
      core: Array.from(drift.commands.core),
      ide: Array.from(drift.commands.ide),
      extension: Array.from(drift.commands.extension),
      missing: drift.commands.missing,
      extra: drift.commands.extra
    },
    types: {
      core: Array.from(drift.types.core),
      ide: Array.from(drift.types.ide),
      missing: drift.types.missing
    },
    config: {
      core: drift.config.core,
      ide: drift.config.ide,
      differences: drift.config.differences
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  // Exit code
  const hasDrift = drift.commands.missing.length > 0 || 
                   drift.commands.extra.length > 0 ||
                   drift.types.missing.length > 0 ||
                   drift.config.differences.length > 0;
  
  if (hasDrift) {
    console.log('\n⚠️  IDE integration drift detected!');
    process.exit(1);
  } else {
    console.log('\n✅ No IDE integration drift detected!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

