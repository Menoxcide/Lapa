#!/usr/bin/env node
/**
 * NEURAFORGE Research Findings Processor CLI
 * 
 * Autonomously processes research findings from WEB_RESEARCH_HYBRID knowledge base.
 * Runs in the same CLI, processing findings one at a time, slowly.
 */

import { researchFindingsProcessor } from '../src/orchestrator/research-findings-processor.ts';
import { knowledgeBase } from '../src/research/knowledge-base.ts';

async function main() {
  console.log('\n🧠 NEURAFORGE - Research Findings Processor\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Initialize knowledge base
  console.log('📚 Initializing knowledge base...');
  await knowledgeBase.initialize();
  console.log('   ✅ Knowledge base ready\n');

  // Check for findings
  const stats = knowledgeBase.getStatistics();
  console.log('📊 Knowledge Base Statistics:');
  console.log(`   Total Findings: ${stats.totalFindings}`);
  console.log(`   By Status:`);
  console.log(`     - Pending: ${stats.byStatus.pending || 0}`);
  console.log(`     - In Progress: ${stats.byStatus['in-progress'] || 0}`);
  console.log(`     - Implemented: ${stats.byStatus.implemented || 0}`);
  console.log(`     - Rejected: ${stats.byStatus.rejected || 0}`);
  console.log(`   Average Value Potential: ${(stats.averageValuePotential * 100).toFixed(1)}%\n`);

  if (stats.totalFindings === 0) {
    console.log('📭 No findings in knowledge base yet.');
    console.log('   Run WEB_RESEARCH_HYBRID first to gather research findings.\n');
    return;
  }

  const pendingFindings = knowledgeBase.getPendingFindings(10);
  console.log(`🔍 Found ${pendingFindings.length} pending findings to process\n`);

  if (pendingFindings.length === 0) {
    console.log('✅ All findings have been processed!\n');
    return;
  }

  // Show preview of findings
  console.log('📋 Pending Findings Preview:');
  pendingFindings.slice(0, 5).forEach((entry, i) => {
    const f = entry.finding;
    console.log(`   ${i + 1}. ${f.title}`);
    console.log(`      Category: ${f.category} | Value: ${(f.valuePotential * 100).toFixed(1)}% | Source: ${f.source}`);
  });
  if (pendingFindings.length > 5) {
    console.log(`   ... and ${pendingFindings.length - 5} more\n`);
  } else {
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🚀 Starting autonomous processing...\n');
  console.log('   Processing will happen slowly, one finding at a time.\n');
  console.log('   Each finding will go through:');
  console.log('   1. Research & Analysis');
  console.log('   2. Planning');
  console.log('   3. Implementation (if applicable)');
  console.log('   4. Review & Validation\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Start processing
  await researchFindingsProcessor.startProcessing();

  console.log('\n✅ NEURAFORGE Research Processor Complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

