/**
 * NEURAFORGE Orchestrator - LAPA Module Merge Audit
 * 
 * This script audits all LAPA core modules to ensure they are correctly
 * merged into LAPA-VOID-IDE extension.
 */

import * as fs from 'fs';
import * as path from 'path';

// Get paths relative to script location
// Script is in lapa-ide-void/extensions/lapa-swarm/
const scriptDir = path.resolve(__dirname || process.cwd());
const extensionSrcPath = path.join(scriptDir, 'src');
// Core LAPA src is at root/src (3 levels up)
const coreSrcPath = path.resolve(scriptDir, '..', '..', '..', 'src');

interface ModuleAuditResult {
  module: string;
  category: string;
  status: '✅ MERGED' | '❌ MISSING' | '⚠️ PARTIAL' | '⚠️ DIFFERENT';
  corePath: string;
  extensionPath: string;
  details: string;
  issues?: string[];
}

const results: ModuleAuditResult[] = [];

// Define all LAPA modules that should be present
const requiredModules = {
  agents: [
    'agent-mode-extension.ts',
    'agent.md.generator.ts',
    'filesystem-persona-loader.ts',
    'moe-router.ts',
    'persona.manager.ts',
    'ray-parallel.ts',
    'researcher.ts',
    'tester.ts',
    'code-smell-detector.ts',
    'error-explainer.ts',
  ],
  core: [
    'ag-ui.ts',
    'agent-tool.ts',
    'event-bus.ts',
    'index.ts',
    'repo-rules.ts',
    'yaml-agent-loader.ts',
  ],
  orchestrator: [
    'a2a-mediator.ts',
    'command-palette-ai.ts',
    'flow-guards.ts',
    'git-commit-generator.ts',
    'handoff-recorder.ts',
    'prompt-engineer.ts',
    'skill-manager.ts',
    'workflow-generator.ts',
    'phase-reporter.ts',
    'code-snippet-library.ts',
    'inline-documentation-generator.ts',
  ],
  swarm: [
    'swarm-manager.ts',
    'agent.spawn.ts',
    'delegate.ts',
    'sessions.ts',
    'session-restore.ts',
    'session-persistence.ts',
  ],
  local: [
    'episodic.ts',
    'index.ts',
    'memori-engine.ts',
    'memori-sqlite.ts',
    'nim-integration.ts',
    'ollama-compatibility.ts',
    'recall-metrics.ts',
    'resource-manager.ts',
  ],
  inference: [
    'manager.ts',
    'nim.local.ts',
    'ollama.local.ts',
  ],
  mcp: [
    'cli.ts',
    'ctx-zip.integration.ts',
    'mcp-connector.ts',
    'scaffolding.ts',
  ],
  marketplace: [
    'cursor.ts',
    'index.ts',
    'registry.ts',
  ],
  premium: [
    'feature-gate.ts',
    'license.manager.ts',
    'blob.storage.ts',
    'stripe.payment.ts',
    'team.state.ts',
  ],
  ui: [
    'SwarmView.tsx',
    'Dashboard.tsx',
    'SettingsPanel.tsx',
    'McpMarketplace.tsx',
    'ROIWidget.tsx',
    'TaskHistory.tsx',
    'index.ts',
  ],
  observability: [
    'roi-dashboard.ts',
    'phase-analyzer.ts',
    'prometheus.ts',
    'langsmith.ts',
    'bench-v2.ts',
  ],
  multimodal: [
    'voice-agent.ts',
    'vision-agent.ts',
    'artifacts-builder.ts',
    'index.ts',
  ],
  rag: [
    'chroma-refine.ts',
    'config.ts',
    'index.ts',
    'pipeline.ts',
  ],
  security: [
    'hallucination-check.ts',
    'rbac.ts',
    'red-team.ts',
    'index.ts',
  ],
  skills: [
    'README.md',
  ],
};

// Helper to check if file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// Helper to check if directory exists
function dirExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

// Helper to get file size for comparison
function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

// Helper to check file similarity (basic check)
function filesSimilar(file1: string, file2: string): boolean {
  if (!fileExists(file1) || !fileExists(file2)) {
    return false;
  }
  
  const size1 = getFileSize(file1);
  const size2 = getFileSize(file2);
  
  // Files within 5% size difference are considered similar
  if (size1 === 0 || size2 === 0) return false;
  const diff = Math.abs(size1 - size2) / Math.max(size1, size2);
  return diff < 0.05;
}

// Audit each module category
console.log('🔍 NEURAFORGE: Auditing LAPA Module Merge...\n');
console.log(`Core LAPA: ${coreSrcPath}`);
console.log(`Extension: ${extensionSrcPath}\n`);

for (const [category, modules] of Object.entries(requiredModules)) {
  const coreCategoryPath = path.join(coreSrcPath, category);
  const extensionCategoryPath = path.join(extensionSrcPath, category);
  
  // Check if category directory exists in extension
  const categoryExists = dirExists(extensionCategoryPath);
  
  for (const module of modules) {
    const coreModulePath = path.join(coreCategoryPath, module);
    const extensionModulePath = path.join(extensionCategoryPath, module);
    
    const coreExists = fileExists(coreModulePath);
    const extensionExists = fileExists(extensionModulePath);
    
    let status: ModuleAuditResult['status'];
    let details: string;
    const issues: string[] = [];
    
    if (!coreExists) {
      // Module doesn't exist in core - might be extension-specific
      status = extensionExists ? '✅ MERGED' : '⚠️ PARTIAL';
      details = extensionExists 
        ? 'Extension-specific module (not in core LAPA)' 
        : 'Module missing in both core and extension';
    } else if (extensionExists) {
      // Both exist - check if similar
      if (filesSimilar(coreModulePath, extensionModulePath)) {
        status = '✅ MERGED';
        details = 'Module correctly merged from core LAPA';
      } else {
        status = '⚠️ DIFFERENT';
        details = 'Module exists but differs from core (may be modified)';
        const coreSize = getFileSize(coreModulePath);
        const extSize = getFileSize(extensionModulePath);
        issues.push(`Size difference: core ${coreSize} bytes, extension ${extSize} bytes`);
      }
    } else {
      // Missing in extension
      status = '❌ MISSING';
      details = 'Module exists in core LAPA but missing in extension';
      issues.push(`Core: ${coreModulePath}`);
      issues.push(`Expected: ${extensionModulePath}`);
    }
    
    results.push({
      module,
      category,
      status,
      corePath: coreModulePath,
      extensionPath: extensionModulePath,
      details,
      issues: issues.length > 0 ? issues : undefined,
    });
  }
}

// Check for additional files in extension (might be extensions-specific)
console.log('🔍 Checking for extension-specific modules...\n');

if (dirExists(extensionSrcPath)) {
  const extensionDirs = fs.readdirSync(extensionSrcPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const dir of extensionDirs) {
    if (!(dir in requiredModules)) {
      const dirPath = path.join(extensionSrcPath, dir);
      try {
        const files = fs.readdirSync(dirPath, { recursive: true });
        if (files.length > 0) {
          results.push({
            module: `Directory: ${dir}/`,
            category: 'extension-specific',
            status: '✅ MERGED',
            corePath: 'N/A',
            extensionPath: dirPath,
            details: `Extension-specific directory with ${files.length} file(s) - OK`,
          });
        }
      } catch (e) {
        // Ignore read errors
      }
    }
  }
}

// Generate report
console.log('📊 NEURAFORGE MODULE MERGE AUDIT REPORT\n');
console.log('='.repeat(80));

const merged = results.filter(r => r.status === '✅ MERGED').length;
const missing = results.filter(r => r.status === '❌ MISSING').length;
const partial = results.filter(r => r.status === '⚠️ PARTIAL').length;
const different = results.filter(r => r.status === '⚠️ DIFFERENT').length;

console.log(`\nSummary: ${merged} Merged | ${missing} Missing | ${partial} Partial | ${different} Different\n`);

// Group by category
const byCategory: Record<string, ModuleAuditResult[]> = {};
for (const result of results) {
  if (!byCategory[result.category]) {
    byCategory[result.category] = [];
  }
  byCategory[result.category].push(result);
}

for (const [category, categoryResults] of Object.entries(byCategory)) {
  const catMerged = categoryResults.filter(r => r.status === '✅ MERGED').length;
  const catTotal = categoryResults.length;
  console.log(`\n## ${category.toUpperCase()} (${catMerged}/${catTotal} merged)\n`);
  
  for (const result of categoryResults) {
    if (result.status !== '✅ MERGED') {
      console.log(`${result.status} ${result.module}`);
      console.log(`   ${result.details}`);
      if (result.issues && result.issues.length > 0) {
        for (const issue of result.issues) {
          console.log(`   ⚠️  ${issue}`);
        }
      }
    }
  }
  
  if (catMerged === catTotal) {
    console.log(`✅ All ${catTotal} modules merged correctly`);
  }
}

// Missing modules report
const missingModules = results.filter(r => r.status === '❌ MISSING');
if (missingModules.length > 0) {
  console.log('\n\n❌ MISSING MODULES REQUIRING ACTION:\n');
  console.log('='.repeat(80));
  for (const missing of missingModules) {
    console.log(`\n${missing.category}/${missing.module}`);
    console.log(`   Core: ${missing.corePath}`);
    console.log(`   Expected: ${missing.extensionPath}`);
    console.log(`   Action: Copy from core to extension`);
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n✅ Audit Complete: ${merged}/${results.length} modules verified\n`);

// Export results for further analysis
export { results, ModuleAuditResult };
