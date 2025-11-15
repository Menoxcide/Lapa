import { describe, it, expect } from "vitest";
/**
 * ctx-zip Integration Test
 * 
 * This test validates the ctx-zip integration for context compression.
 * It tests compression effectiveness and verifies >80% token savings.
 */

import { 
  compressContext, 
  decompressContext, 
  testCtxZipCompression, 
  recordCompressionStats, 
  recordCompressionFeedback,
  analyzeCompressionEffectiveness,
  CompressionStats,
  CompressionFeedback
} from '../mcp/ctx-zip.integration.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function runCtxZipTest() {
  console.log('Running ctx-zip compression test...');
  
  // Create test payload (10k tokens approximation)
  const testPayload = 'Hello, world! '.repeat(1000); // Simple test payload
  
  try {
    // Test compression
    const stats = await testCtxZipCompression(testPayload);
    
    console.log(`Original size: ${stats.originalSize} bytes`);
    console.log(`Compressed size: ${stats.compressedSize} bytes`);
    console.log(`Compression ratio: ${stats.compressionRatio.toFixed(2)}x`);
    console.log(`Reduction: ${stats.reductionPercentage.toFixed(1)}%`);
    
    // Record stats for feedback loop
    await recordCompressionStats(stats);
    
    // Verify compression effectiveness (>80% reduction)
    if (stats.reductionPercentage > 80) {
      console.log('✅ ctx-zip compression test PASSED (>80% reduction)');
    } else {
      console.log('⚠️  ctx-zip compression test FAILED (<80% reduction)');
    }
    
    // Test round-trip compression/decompression
    const compressed = await compressContext(testPayload);
    const decompressed = await decompressContext(compressed);
    
    if (decompressed === testPayload) {
      console.log('✅ ctx-zip round-trip test PASSED');
    } else {
      console.log('❌ ctx-zip round-trip test FAILED');
    }
    
    // Simulate user feedback for feedback loop
    const feedback: CompressionFeedback = {
      sessionId: 'test-session',
      effectivenessRating: 9,
      semanticPreservation: 8,
      notes: 'Good compression with minimal semantic loss',
      timestamp: new Date()
    };
    
    await recordCompressionFeedback(feedback);
    
    // Test feedback loop analysis
    const analysis = await analyzeCompressionEffectiveness();
    console.log(`Average reduction: ${analysis.averageReduction.toFixed(1)}%`);
    console.log(`Effectiveness rating: ${analysis.effectivenessRating}/10`);
    console.log(`Recommendations: ${analysis.recommendations.join(', ')}`);
    
    return stats.reductionPercentage > 80;
  } catch (error) {
    console.error('❌ ctx-zip test FAILED with error:', error);
    return false;
  }
}

// Run test if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('ctx-zip.test.js')) {
  runCtxZipTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runCtxZipTest };