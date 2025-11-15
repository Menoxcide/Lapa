/**
 * Recall Metrics for Phase 12 Memory Systems
 * 
 * Provides utilities to measure and validate recall performance
 * for Memori Engine, Episodic Memory, and Chroma Refinement.
 * Target: 99.5% recall (Premium), 85% recall (Free)
 */

import { memoriEngine } from './memori-engine.ts';
import { episodicMemoryStore } from './episodic.ts';
import { chromaRefine } from '../rag/chroma-refine.ts';
import { refragEngine } from '../rag/refrag.ts';
import type { EnhancedEntity } from './memori-engine.ts';
import type { Episode } from './episodic.ts';
import type { VectorSearchResult } from '../rag/chroma-refine.ts';
import { featureGate } from '../premium/feature-gate.ts';

export interface RecallMetrics {
  system: 'memori' | 'episodic' | 'chroma' | 'combined';
  totalItems: number;
  retrievedItems: number;
  recall: number; // 0-1
  precision?: number; // 0-1
  f1Score?: number; // 0-1
  averageLatency?: number; // milliseconds
  timestamp: Date;
}

export interface RecallTestResult {
  metrics: RecallMetrics[];
  overallRecall: number;
  targetMet: boolean; // 99.5% target
  details: {
    memoriRecall: number;
    episodicRecall: number;
    chromaRecall: number;
    combinedRecall: number;
  };
}

/**
 * Measures recall for Memori Engine entity retrieval
 */
export async function measureMemoriRecall(
  testEntities: Array<{ taskId: string; content: string }>,
  limit: number = 20
): Promise<RecallMetrics> {
  const startTime = Date.now();

  // Store all test entities
  const storedEntityIds: string[] = [];
  for (const testEntity of testEntities) {
    const entities = await memoriEngine.extractAndStoreEntities(
      testEntity.taskId,
      testEntity.content
    );
    storedEntityIds.push(...entities.map(e => e.id));
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  // Retrieve entities
  let retrievedCount = 0;
  const retrievedEntities: EnhancedEntity[] = [];

  for (const testEntity of testEntities) {
    const entities = await memoriEngine.getContextEntities(testEntity.taskId, limit);
    retrievedEntities.push(...entities);
    if (entities.length > 0) {
      retrievedCount++;
    }
  }

  const endTime = Date.now();
  const latency = endTime - startTime;

  // Calculate recall
  const totalItems = testEntities.length;
  const retrievedItems = retrievedCount;
  const recall = totalItems > 0 ? retrievedItems / totalItems : 0;

  // Calculate precision (retrieved relevant / total retrieved)
  const uniqueRetrieved = new Set(retrievedEntities.map(e => e.id));
  const precision = uniqueRetrieved.size > 0
    ? Array.from(uniqueRetrieved).filter(id => storedEntityIds.includes(id)).length / uniqueRetrieved.size
    : 0;

  // Calculate F1 score
  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return {
    system: 'memori',
    totalItems,
    retrievedItems,
    recall,
    precision,
    f1Score,
    averageLatency: latency / totalItems,
    timestamp: new Date()
  };
}

/**
 * Measures recall for Episodic Memory Store
 */
export async function measureEpisodicRecall(
  testEpisodes: Array<{ agentId: string; taskId: string; content: string }>,
  limit: number = 50
): Promise<RecallMetrics> {
  const startTime = Date.now();

  // Store all test episodes
  const storedEpisodeIds: string[] = [];
  for (const testEpisode of testEpisodes) {
    const episode = await episodicMemoryStore.storeEpisode({
      agentId: testEpisode.agentId,
      taskId: testEpisode.taskId,
      sessionId: 'test-session',
      content: testEpisode.content
    });
    storedEpisodeIds.push(episode.id);
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  // Retrieve episodes by agent
  const agentIds = [...new Set(testEpisodes.map(e => e.agentId))];
  let retrievedCount = 0;
  const retrievedEpisodes: Episode[] = [];

  for (const agentId of agentIds) {
    const episodes = await episodicMemoryStore.getEpisodesByAgent(agentId, limit);
    retrievedEpisodes.push(...episodes);
    if (episodes.length > 0) {
      retrievedCount++;
    }
  }

  const endTime = Date.now();
  const latency = endTime - startTime;

  // Calculate recall
  const totalItems = testEpisodes.length;
  const retrievedItems = retrievedCount;
  const recall = totalItems > 0 ? retrievedItems / totalItems : 0;

  // Calculate precision
  const uniqueRetrieved = new Set(retrievedEpisodes.map(e => e.id));
  const precision = uniqueRetrieved.size > 0
    ? Array.from(uniqueRetrieved).filter(id => storedEpisodeIds.includes(id)).length / uniqueRetrieved.size
    : 0;

  // Calculate F1 score
  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return {
    system: 'episodic',
    totalItems,
    retrievedItems,
    recall,
    precision,
    f1Score,
    averageLatency: latency / totalItems,
    timestamp: new Date()
  };
}

/**
 * Measures recall for Chroma Vector Refinement
 */
export async function measureChromaRecall(
  testDocuments: Array<{ id: string; content: string; query: string }>,
  similarityThreshold: number = 0.7
): Promise<RecallMetrics> {
  const startTime = Date.now();

  // Index all test documents
  const storedDocumentIds: string[] = [];
  for (const doc of testDocuments) {
    await chromaRefine.indexDocument({
      id: doc.id,
      content: doc.content,
      metadata: {
        timestamp: new Date(),
        source: 'manual' as const
      }
    });
    storedDocumentIds.push(doc.id);
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  // Search for each document
  let retrievedCount = 0;
  const retrievedDocuments: VectorSearchResult[] = [];

  for (const doc of testDocuments) {
    // Use REFRAG for efficient decoding
    const rawResults = await chromaRefine.searchSimilar(doc.query, {
      limit: 10,
      threshold: similarityThreshold
    });

    // Process through REFRAG if available
    let results: VectorSearchResult[];
    if (refragEngine && await refragEngine.initialize().catch(() => false)) {
      const refragResult = await refragEngine.processChunks(
        rawResults.map(r => ({
          id: r.document.id,
          content: r.document.content,
          metadata: r.document.metadata,
          similarity: r.similarity
        })),
        doc.query
      );
      // Use expanded chunks (most relevant)
      results = refragResult.expandedChunks.map(chunk => ({
        document: {
          id: chunk.id,
          content: chunk.originalContent,
          metadata: chunk.metadata
        },
        similarity: chunk.relevanceScore || 0,
        distance: 1 - (chunk.relevanceScore || 0)
      }));
    } else {
      results = rawResults;
    }

    retrievedDocuments.push(...results);
    if (results.length > 0 && results[0].similarity >= similarityThreshold) {
      retrievedCount++;
    }
  }

  const endTime = Date.now();
  const latency = endTime - startTime;

  // Calculate recall
  const totalItems = testDocuments.length;
  const retrievedItems = retrievedCount;
  const recall = totalItems > 0 ? retrievedItems / totalItems : 0;

  // Calculate precision
  const uniqueRetrieved = new Set(retrievedDocuments.map(r => r.document.id));
  const precision = uniqueRetrieved.size > 0
    ? Array.from(uniqueRetrieved).filter(id => storedDocumentIds.includes(id)).length / uniqueRetrieved.size
    : 0;

  // Calculate F1 score
  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return {
    system: 'chroma',
    totalItems,
    retrievedItems,
    recall,
    precision,
    f1Score,
    averageLatency: latency / totalItems,
    timestamp: new Date()
  };
}

/**
 * Measures combined recall across all three systems
 */
export async function measureCombinedRecall(
  testData: {
    entities: Array<{ taskId: string; content: string }>;
    episodes: Array<{ agentId: string; taskId: string; content: string }>;
    documents: Array<{ id: string; content: string; query: string }>;
  }
): Promise<RecallTestResult> {
  // Measure each system
  const memoriMetrics = await measureMemoriRecall(testData.entities);
  const episodicMetrics = await measureEpisodicRecall(testData.episodes);
  const chromaMetrics = await measureChromaRecall(testData.documents);

  // Calculate combined recall (weighted average)
  const totalItems = memoriMetrics.totalItems + episodicMetrics.totalItems + chromaMetrics.totalItems;
  const totalRetrieved = memoriMetrics.retrievedItems + episodicMetrics.retrievedItems + chromaMetrics.retrievedItems;
  const combinedRecall = totalItems > 0 ? totalRetrieved / totalItems : 0;

  // Calculate weighted average recall
  const weightedRecall = totalItems > 0
    ? (memoriMetrics.recall * memoriMetrics.totalItems +
       episodicMetrics.recall * episodicMetrics.totalItems +
       chromaMetrics.recall * chromaMetrics.totalItems) / totalItems
    : 0;

  // Get recall target from feature gate (free: 85%, pro: 99.5%)
  const recallTarget = featureGate.getMemoryRecallTarget();
  const targetMet = weightedRecall >= recallTarget;

  return {
    metrics: [memoriMetrics, episodicMetrics, chromaMetrics],
    overallRecall: weightedRecall,
    targetMet,
    details: {
      memoriRecall: memoriMetrics.recall,
      episodicRecall: episodicMetrics.recall,
      chromaRecall: chromaMetrics.recall,
      combinedRecall: weightedRecall
    }
  };
}

/**
 * Validates that recall meets the 99.5% target
 */
export function validateRecallTarget(metrics: RecallMetrics | RecallTestResult): {
  passed: boolean;
  message: string;
  recall: number;
  target: number;
} {
  // Get recall target from feature gate (free: 85%, pro: 99.5%)
  const target = featureGate.getMemoryRecallTarget();

  if ('overallRecall' in metrics) {
    // RecallTestResult
    const recall = metrics.overallRecall;
    return {
      passed: recall >= target,
      message: recall >= target
        ? `✅ Recall target met: ${(recall * 100).toFixed(2)}% >= ${(target * 100).toFixed(2)}%`
        : `❌ Recall target not met: ${(recall * 100).toFixed(2)}% < ${(target * 100).toFixed(2)}%`,
      recall,
      target
    };
  } else {
    // RecallMetrics
    const recall = metrics.recall;
    return {
      passed: recall >= target,
      message: recall >= target
        ? `✅ ${metrics.system} recall target met: ${(recall * 100).toFixed(2)}% >= ${(target * 100).toFixed(2)}%`
        : `❌ ${metrics.system} recall target not met: ${(recall * 100).toFixed(2)}% < ${(target * 100).toFixed(2)}%`,
      recall,
      target
    };
  }
}

/**
 * Generates a comprehensive recall report
 */
export function generateRecallReport(result: RecallTestResult): string {
  const validation = validateRecallTarget(result);
  
  let report = `\n=== Phase 12 Recall Metrics Report ===\n\n`;
  report += `Overall Recall: ${(result.overallRecall * 100).toFixed(2)}%\n`;
  report += `Target: 99.5%\n`;
  report += `Status: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

  report += `System-Specific Recall:\n`;
  report += `  - Memori Engine: ${(result.details.memoriRecall * 100).toFixed(2)}%\n`;
  report += `  - Episodic Memory: ${(result.details.episodicRecall * 100).toFixed(2)}%\n`;
  report += `  - Chroma Refinement: ${(result.details.chromaRecall * 100).toFixed(2)}%\n\n`;

  report += `Detailed Metrics:\n`;
  for (const metric of result.metrics) {
    report += `  ${metric.system.toUpperCase()}:\n`;
    report += `    - Total Items: ${metric.totalItems}\n`;
    report += `    - Retrieved: ${metric.retrievedItems}\n`;
    report += `    - Recall: ${(metric.recall * 100).toFixed(2)}%\n`;
    if (metric.precision !== undefined) {
      report += `    - Precision: ${(metric.precision * 100).toFixed(2)}%\n`;
    }
    if (metric.f1Score !== undefined) {
      report += `    - F1 Score: ${(metric.f1Score * 100).toFixed(2)}%\n`;
    }
    if (metric.averageLatency !== undefined) {
      report += `    - Avg Latency: ${metric.averageLatency.toFixed(2)}ms\n`;
    }
    report += `\n`;
  }

  return report;
}

