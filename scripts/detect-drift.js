#!/usr/bin/env node
/**
 * Code Drift Detection Script
 * 
 * Detects differences between:
 * - LAPA Core (src/)
 * - LAPA-VOID IDE Integration (lapa-ide-void/extensions/lapa-swarm/src/)
 * 
 * Generates a comprehensive drift report showing:
 * - Files only in core
 * - Files only in IDE
 * - Files with different content
 * - Files in sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const coreDir = path.join(rootDir, 'src');
const ideDir = path.join(rootDir, 'lapa-ide-void', 'extensions', 'lapa-swarm', 'src');

// File extensions to track
const trackedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

// Load .driftignore file if it exists
function loadDriftIgnore() {
  const ignoreFile = path.join(rootDir, '.driftignore');
  const ignored = new Set();
  
  if (fs.existsSync(ignoreFile)) {
    const content = fs.readFileSync(ignoreFile, 'utf-8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    for (const line of lines) {
      // Convert to relative path format
      const normalized = line.replace(/\\/g, '/');
      ignored.add(normalized);
      
      // Also add directory patterns (for directory ignores)
      if (line.endsWith('/')) {
        ignored.add(line);
      }
    }
  }
  
  return ignored;
}

// Check if file should be ignored
function shouldIgnore(relPath, ignored) {
  const normalized = relPath.replace(/\\/g, '/');
  
  // Exact match
  if (ignored.has(normalized)) {
    return true;
  }
  
  // Directory match
  for (const ignorePattern of ignored) {
    if (ignorePattern.endsWith('/') && normalized.startsWith(ignorePattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate SHA-256 hash of file content
 */
function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Get relative path from base directory
 */
function getRelativePath(filePath, baseDir) {
  return path.relative(baseDir, filePath).replace(/\\/g, '/');
}

/**
 * Recursively collect all files in directory
 */
function collectFiles(dir, baseDir = dir, fileMap = new Map(), ignored = new Set()) {
  if (!fs.existsSync(dir)) {
    return fileMap;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = getRelativePath(fullPath, baseDir);

    // Skip node_modules, dist, coverage, etc.
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist' || 
        entry.name === 'coverage' ||
        entry.name === 'out') {
      continue;
    }

    // Skip ignored files
    if (shouldIgnore(relPath, ignored)) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, fileMap, ignored);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (trackedExtensions.includes(ext)) {
        const hash = hashFile(fullPath);
        if (hash) {
          fileMap.set(relPath, {
            path: fullPath,
            relPath,
            hash,
            size: fs.statSync(fullPath).size
          });
        }
      }
    }
  }

  return fileMap;
}

/**
 * Compare two file maps and detect drift
 */
function detectDrift(coreFiles, ideFiles) {
  const drift = {
    onlyInCore: [],
    onlyInIDE: [],
    different: [],
    same: [],
    stats: {
      coreFiles: coreFiles.size,
      ideFiles: ideFiles.size,
      totalDrift: 0,
      syncPercentage: 0
    }
  };

  // Check files in core
  for (const [relPath, coreFile] of coreFiles) {
    const ideFile = ideFiles.get(relPath);

    if (!ideFile) {
      drift.onlyInCore.push({
        path: relPath,
        size: coreFile.size
      });
    } else if (coreFile.hash !== ideFile.hash) {
      drift.different.push({
        path: relPath,
        coreSize: coreFile.size,
        ideSize: ideFile.size,
        coreHash: coreFile.hash.substring(0, 8),
        ideHash: ideFile.hash.substring(0, 8)
      });
    } else {
      drift.same.push({
        path: relPath,
        size: coreFile.size
      });
    }
  }

  // Check files only in IDE
  for (const [relPath, ideFile] of ideFiles) {
    if (!coreFiles.has(relPath)) {
      drift.onlyInIDE.push({
        path: relPath,
        size: ideFile.size
      });
    }
  }

  // Calculate statistics
  const totalFiles = drift.same.length + drift.different.length + drift.onlyInCore.length + drift.onlyInIDE.length;
  drift.stats.totalDrift = drift.onlyInCore.length + drift.onlyInIDE.length + drift.different.length;
  drift.stats.syncPercentage = totalFiles > 0 
    ? ((drift.same.length / totalFiles) * 100).toFixed(2)
    : 0;

  return drift;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(drift) {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LAPA Code Drift Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #007acc;
      padding-bottom: 10px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #007acc;
    }
    .stat-card.warning .value {
      color: #ff9800;
    }
    .stat-card.error .value {
      color: #f44336;
    }
    .stat-card.success .value {
      color: #4caf50;
    }
    .section {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #333;
    }
    .file-list {
      list-style: none;
      padding: 0;
    }
    .file-list li {
      padding: 8px;
      margin: 4px 0;
      background: #f9f9f9;
      border-left: 3px solid #007acc;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    .file-list li.different {
      border-left-color: #ff9800;
    }
    .file-list li.missing {
      border-left-color: #f44336;
    }
    .timestamp {
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .summary {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary.warning {
      background: #fff3cd;
      border-color: #ffc107;
    }
    .summary.error {
      background: #f8d7da;
      border-color: #f44336;
    }
    .summary.success {
      background: #d4edda;
      border-color: #4caf50;
    }
  </style>
</head>
<body>
  <h1>🔍 LAPA Code Drift Report</h1>
  
  <div class="timestamp">Generated: ${timestamp}</div>

  <div class="stats">
    <div class="stat-card ${drift.stats.syncPercentage >= 95 ? 'success' : drift.stats.syncPercentage >= 80 ? 'warning' : 'error'}">
      <h3>Sync Percentage</h3>
      <div class="value">${drift.stats.syncPercentage}%</div>
    </div>
    <div class="stat-card">
      <h3>Core Files</h3>
      <div class="value">${drift.stats.coreFiles}</div>
    </div>
    <div class="stat-card">
      <h3>IDE Files</h3>
      <div class="value">${drift.stats.ideFiles}</div>
    </div>
    <div class="stat-card ${drift.stats.totalDrift === 0 ? 'success' : 'error'}">
      <h3>Drift Issues</h3>
      <div class="value">${drift.stats.totalDrift}</div>
    </div>
  </div>

  ${drift.stats.totalDrift > 0 ? `
  <div class="summary ${drift.stats.totalDrift > 50 ? 'error' : 'warning'}">
    <strong>⚠️ Drift Detected!</strong>
    <p>Found ${drift.stats.totalDrift} drift issues. Review the sections below for details.</p>
  </div>
  ` : `
  <div class="summary success">
    <strong>✅ No Drift Detected!</strong>
    <p>All tracked files are in sync between core and IDE integration.</p>
  </div>
  `}

  ${drift.onlyInCore.length > 0 ? `
  <div class="section">
    <h2>📁 Files Only in Core (${drift.onlyInCore.length})</h2>
    <p>These files exist in core but not in IDE integration:</p>
    <ul class="file-list">
      ${drift.onlyInCore.map(f => `<li class="missing">${f.path} (${f.size} bytes)</li>`).join('\n')}
    </ul>
  </div>
  ` : ''}

  ${drift.onlyInIDE.length > 0 ? `
  <div class="section">
    <h2>📁 Files Only in IDE (${drift.onlyInIDE.length})</h2>
    <p>These files exist in IDE integration but not in core:</p>
    <ul class="file-list">
      ${drift.onlyInIDE.map(f => `<li class="missing">${f.path} (${f.size} bytes)</li>`).join('\n')}
    </ul>
  </div>
  ` : ''}

  ${drift.different.length > 0 ? `
  <div class="section">
    <h2>⚠️ Files with Different Content (${drift.different.length})</h2>
    <p>These files exist in both locations but have different content:</p>
    <ul class="file-list">
      ${drift.different.map(f => `
        <li class="different">
          ${f.path}<br>
          <small>Core: ${f.coreSize} bytes (hash: ${f.coreHash}...) | IDE: ${f.ideSize} bytes (hash: ${f.ideHash}...)</small>
        </li>
      `).join('\n')}
    </ul>
  </div>
  ` : ''}

  ${drift.same.length > 0 ? `
  <div class="section">
    <h2>✅ Files in Sync (${drift.same.length})</h2>
    <p>These files are identical in both locations:</p>
    <details>
      <summary>Click to expand (${drift.same.length} files)</summary>
      <ul class="file-list">
        ${drift.same.slice(0, 100).map(f => `<li>${f.path}</li>`).join('\n')}
        ${drift.same.length > 100 ? `<li><em>... and ${drift.same.length - 100} more files</em></li>` : ''}
      </ul>
    </details>
  </div>
  ` : ''}
</body>
</html>`;
}

/**
 * Generate JSON report
 */
function generateJSONReport(drift) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: drift.stats,
    drift: {
      onlyInCore: drift.onlyInCore,
      onlyInIDE: drift.onlyInIDE,
      different: drift.different,
      same: drift.same.length
    }
  }, null, 2);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 LAPA Code Drift Detection\n');
  console.log(`Core directory: ${coreDir}`);
  console.log(`IDE directory: ${ideDir}\n`);

  // Check if directories exist
  if (!fs.existsSync(coreDir)) {
    console.error(`❌ Core directory not found: ${coreDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(ideDir)) {
    console.error(`❌ IDE directory not found: ${ideDir}`);
    console.error(`   Run 'node scripts/extract-lapa.js' first to create IDE integration.`);
    process.exit(1);
  }

  // Load drift ignore patterns
  const ignored = loadDriftIgnore();
  if (ignored.size > 0) {
    console.log(`📋 Loaded ${ignored.size} ignore patterns from .driftignore\n`);
  }

  // Collect files
  console.log('📂 Scanning core directory...');
  const coreFiles = collectFiles(coreDir, coreDir, new Map(), ignored);
  console.log(`   Found ${coreFiles.size} files\n`);

  console.log('📂 Scanning IDE directory...');
  const ideFiles = collectFiles(ideDir, ideDir, new Map(), ignored);
  console.log(`   Found ${ideFiles.size} files\n`);

  // Detect drift
  console.log('🔍 Detecting drift...');
  const drift = detectDrift(coreFiles, ideFiles);
  console.log(`   Done!\n`);

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Core files: ${drift.stats.coreFiles}`);
  console.log(`   IDE files: ${drift.stats.ideFiles}`);
  console.log(`   Files in sync: ${drift.same.length}`);
  console.log(`   Files only in core: ${drift.onlyInCore.length}`);
  console.log(`   Files only in IDE: ${drift.onlyInIDE.length}`);
  console.log(`   Files with different content: ${drift.different.length}`);
  console.log(`   Sync percentage: ${drift.stats.syncPercentage}%\n`);

  // Generate reports
  const reportsDir = path.join(rootDir, 'docs', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const htmlReportPath = path.join(reportsDir, 'drift-report.html');
  const jsonReportPath = path.join(reportsDir, 'drift-report.json');

  console.log('📄 Generating reports...');
  fs.writeFileSync(htmlReportPath, generateHTMLReport(drift));
  fs.writeFileSync(jsonReportPath, generateJSONReport(drift));
  console.log(`   HTML report: ${htmlReportPath}`);
  console.log(`   JSON report: ${jsonReportPath}\n`);

  // Exit code based on drift
  if (drift.stats.totalDrift > 0) {
    console.log('⚠️  Drift detected! Review the reports for details.');
    process.exit(1);
  } else {
    console.log('✅ No drift detected! All files are in sync.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

