# Context Engineering Guide

## Overview
This comprehensive guide covers context engineering anatomy, retrieval strategies, and optimization techniques for LAPA agents. Understanding context engineering is crucial for maximizing agent performance and minimizing token usage.

**Version**: v1.3.0-preview  
**Last Updated**: November 2025  
**Phase**: 5 I8 - CtxEngGui

## Table of Contents

1. [Context Engineering Anatomy](#context-engineering-anatomy)
2. [Retrieval Strategies](#retrieval-strategies)
3. [Context Compression](#context-compression)
4. [Context Optimization](#context-optimization)
5. [Best Practices](#best-practices)

## Context Engineering Anatomy

### Context Components

Context in LAPA consists of multiple layers:

#### 1. Session Context
- **Source**: Current agent session
- **Content**: Recent messages, task state, agent decisions
- **Lifetime**: Session duration
- **Size**: Variable, typically 1-10KB

#### 2. Memory Context
- **Source**: Memori Engine, Episodic Memory, Chroma
- **Content**: Historical interactions, entity relationships, patterns
- **Lifetime**: Persistent across sessions
- **Size**: Large, requires retrieval and filtering

#### 3. Codebase Context
- **Source**: Project files, git history, dependencies
- **Content**: Code structure, patterns, documentation
- **Lifetime**: Project lifetime
- **Size**: Very large, requires intelligent retrieval

#### 4. Agent Context
- **Source**: Agent configuration, skills, trust scores
- **Content**: Agent capabilities, preferences, history
- **Lifetime**: Agent lifetime
- **Size**: Small, typically <1KB

### Context Assembly Process

```typescript
// Context assembly example
interface ContextAssembly {
  sessionContext: SessionContext;      // Current session
  memoryContext: MemoryContext[];      // Retrieved memories
  codebaseContext: CodebaseContext[]; // Relevant files
  agentContext: AgentContext;          // Agent state
  compressedContext: string;           // Final compressed context
}
```

### Context Anatomy Reference (Phase 39)

The context engineering anatomy follows these principles:

1. **Layered Retrieval**: Retrieve from multiple sources in priority order
2. **Relevance Scoring**: Score and rank context by relevance
3. **Compression**: Compress context to fit token limits
4. **Injection**: Inject context at optimal points in prompts

## Retrieval Strategies

### Strategy 1: Query Decomposition (W42 Retrieval Reference)

Break complex queries into sub-queries for better retrieval:

```typescript
// Query decomposition example
const decomposed = decomposeQuery("How does authentication work in this codebase?");

// Results in:
// - "authentication implementation"
// - "login flow"
// - "session management"
// - "security patterns"
```

**Benefits**:
- More precise retrieval
- Better coverage of related concepts
- Improved recall (W42 CtxRet reference)

### Strategy 2: Hybrid RAG (W42 CtxRet + P32 QueryDecomp)

Combine multiple retrieval methods:

1. **Vector Search**: Semantic similarity via Chroma
2. **Keyword Search**: Exact matches and patterns
3. **Entity Search**: Named entity recognition
4. **Temporal Search**: Time-based relevance (episodic memory)

```typescript
// Hybrid RAG example
const results = await hybridRAG({
  query: "user authentication",
  vectorSearch: { topK: 10, threshold: 0.7 },
  keywordSearch: { terms: ["auth", "login", "session"] },
  entitySearch: { entities: ["User", "Session", "Token"] },
  temporalSearch: { recency: "7d" }
});
```

### Strategy 3: Context Rotation (P30 CtxChallenges)

Rotate context to prevent staleness:

```typescript
// Context rotation example
const rotatedContext = rotateContext({
  currentContext: sessionContext,
  maxAge: "24h",
  decayRate: 0.85,
  replacementStrategy: "fifo" // First in, first out
});
```

**Benefits**:
- Prevents context staleness
- Maintains relevance
- Reduces token waste

### Strategy 4: Adaptive RAG (W45 RAG Adaptive)

Adapt retrieval based on query complexity:

```typescript
// Adaptive RAG example
const strategy = selectRAGStrategy(query);

if (strategy === "simple") {
  // Use keyword search only
  return keywordSearch(query);
} else if (strategy === "complex") {
  // Use full hybrid RAG
  return hybridRAG(query);
} else {
  // Use vector search with entity filtering
  return vectorSearchWithEntities(query);
}
```

### Strategy 5: Context Summarization (P28 CtxSumm)

Summarize large contexts before injection:

```typescript
// Context summarization example
const summary = await summarizeContext({
  context: largeContext,
  maxTokens: 500,
  preserveEntities: true,
  preserveRelationships: true
});
```

## Context Compression

### ctx-zip Compression

LAPA uses ctx-zip for context compression:

```typescript
// ctx-zip compression example
import { compressContext } from '@ctx-zip/core';

const compressed = await compressContext({
  context: fullContext,
  targetRatio: 0.55, // 55% compression (P30 CtxCollapse reference)
  preserveStructure: true
});
```

**Compression Targets**:
- **Basic**: 2x compression
- **Aggressive**: 3-4x compression
- **Maximum**: 5x+ compression (with quality tradeoff)

### Compression Strategies

1. **Entity Extraction**: Extract and reference entities instead of full text
2. **Relationship Mapping**: Map relationships instead of full descriptions
3. **Pattern Recognition**: Replace patterns with references
4. **Summarization**: Summarize verbose sections

## Context Optimization

### Optimization Techniques

#### 1. Relevance Filtering
Filter context by relevance score:

```typescript
const filtered = filterByRelevance(context, {
  minScore: 0.7,
  maxItems: 20,
  diversityThreshold: 0.3
});
```

#### 2. Token Budget Management
Manage context within token budgets:

```typescript
const optimized = optimizeForTokenBudget(context, {
  maxTokens: 8000,
  priority: ["session", "memory", "codebase"],
  compression: "adaptive"
});
```

#### 3. Context Pruning
Remove low-value context:

```typescript
const pruned = pruneContext(context, {
  removeLowScore: true,
  removeDuplicates: true,
  removeStale: true,
  maxAge: "24h"
});
```

### Performance Optimization

#### Query Performance
- **Indexing**: Pre-index frequently accessed content
- **Caching**: Cache common query results
- **Parallel Retrieval**: Retrieve from multiple sources in parallel

#### Memory Performance
- **Lazy Loading**: Load context on demand
- **Incremental Updates**: Update context incrementally
- **Compression**: Compress stored context

## Best Practices

### 1. Start with Session Context
Always include current session context first:
- Most relevant to current task
- Smallest size
- Highest relevance

### 2. Use Retrieval Hierarchically
Retrieve in priority order:
1. Session context (always)
2. Recent memory (last 24h)
3. Relevant codebase files
4. Historical patterns
5. Entity relationships

### 3. Compress Aggressively
Use ctx-zip compression:
- Target 55% compression (P30 reference)
- Preserve structure and entities
- Monitor quality impact

### 4. Rotate Context Regularly
Prevent staleness:
- Rotate every 24 hours
- Use decay-based importance
- Replace with fresh context

### 5. Monitor Token Usage
Track context token usage:
- Set token budgets per agent
- Alert on budget overruns
- Optimize automatically

### 6. Use Query Decomposition
Break complex queries:
- Identify sub-queries
- Retrieve for each sub-query
- Combine results intelligently

### 7. Leverage Memory Unlock
Use memory unlock system:
- Progressive access to deeper memories
- Skill-based unlocking
- Trust-based access control

## Integration with Memory Systems

### Memori Engine Integration
```typescript
// Retrieve from Memori Engine
const memoriContext = await memoriEngine.getContext({
  agentId: "agent-1",
  query: "authentication",
  maxEntities: 10
});
```

### Episodic Memory Integration
```typescript
// Retrieve from Episodic Memory
const episodicContext = await episodicMemory.search({
  query: "authentication",
  includeTemporal: true,
  maxResults: 5
});
```

### Chroma Vector Integration
```typescript
// Retrieve from Chroma
const vectorContext = await chromaRefine.search({
  query: "authentication",
  topK: 10,
  threshold: 0.7
});
```

## Context Engineering Metrics

### Key Metrics
- **Recall**: Percentage of relevant context retrieved (target: 99.5%)
- **Precision**: Percentage of retrieved context that is relevant
- **Compression Ratio**: Size reduction achieved
- **Token Efficiency**: Tokens used per unit of information
- **Retrieval Latency**: Time to retrieve context

### Monitoring
- Track metrics per agent
- Monitor trends over time
- Alert on degradation
- Optimize based on metrics

## Advanced Techniques

### Context Caching
Cache frequently accessed context:
```typescript
const cached = await contextCache.get(query, {
  ttl: "1h",
  maxSize: "10MB"
});
```

### Context Prefetching
Prefetch likely-needed context:
```typescript
await prefetchContext({
  currentTask: task,
  likelyNextTasks: predictedTasks
});
```

### Context Personalization
Personalize context per agent:
```typescript
const personalized = personalizeContext(context, {
  agentId: "agent-1",
  preferences: agentPreferences,
  history: agentHistory
});
```

## Troubleshooting

### Common Issues

#### Issue: Low Recall
**Solution**: 
- Increase retrieval scope
- Use hybrid RAG
- Improve query decomposition

#### Issue: High Token Usage
**Solution**:
- Increase compression
- Filter by relevance
- Prune stale context

#### Issue: Stale Context
**Solution**:
- Enable context rotation
- Reduce context age
- Update retrieval frequency

#### Issue: Slow Retrieval
**Solution**:
- Enable caching
- Parallel retrieval
- Optimize indexes

## Resources

- [PROTOCOLS.md](PROTOCOLS.md) - Protocol specifications
- [FEATURE_OVERVIEW.md](FEATURE_OVERVIEW.md) - Feature capabilities
- [START_HERE.md](START_HERE.md) - Project overview
- [PROMPTS.md](examples/PROMPTS.md) - Prompting guide

---

**Context Engineering Guide - Phase 5 Complete**  
**Last Updated**: November 2025

