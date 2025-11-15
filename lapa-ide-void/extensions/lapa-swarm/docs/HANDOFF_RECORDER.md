# Swarm Handoff Recorder

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free

---

## Overview

The Swarm Handoff Recorder is a debugging tool that records, analyzes, and replays agent handoffs in the LAPA swarm. It captures complete handoff context, timing, outcomes, and enables replay for debugging and learning.

## Features

- ✅ **Complete Recording**: Captures all handoff data including context, requests, responses
- ✅ **Handoff Replay**: Replay recorded handoffs for debugging
- ✅ **Analysis & Metrics**: Analyze handoff patterns, success rates, and performance
- ✅ **Storage**: Persistent storage via Memory Engine
- ✅ **Filtering**: Filter records by task, agent, or time range
- ✅ **Performance Tracking**: Track handoff durations and success rates
- ✅ **Event Integration**: Automatically records handoffs via event bus

## Use Cases

1. **Debugging**: Replay failed handoffs to identify issues
2. **Performance Analysis**: Analyze handoff patterns and bottlenecks
3. **Learning**: Study successful handoff patterns
4. **Testing**: Replay handoffs in test environments
5. **Monitoring**: Track handoff success rates over time

## Usage

### Via Agent Tool

```typescript
import { HandoffRecorder } from './orchestrator/handoff-recorder.js';
import { MemoriEngine } from './local/memori-engine.js';

const memoriEngine = new MemoriEngine({});
const recorder = new HandoffRecorder(memoriEngine, {
  enabled: true,
  maxRecords: 1000,
  recordContext: true,
  recordFullContext: false
});

// Record a handoff
const result = await recorder.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'record',
    sourceAgentId: 'agent-1',
    targetAgentId: 'agent-2',
    taskId: 'task-1',
    context: { data: 'test' },
    handoffRequest: { priority: 'high' },
    handoffResponse: { success: true, duration: 100 }
  }
});

// Replay a handoff
const replayResult = await recorder.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'replay',
    recordId: result.data.recordId,
    modifyContext: (ctx) => ({ ...ctx, modified: true })
  }
});

// Analyze handoffs
const analysisResult = await recorder.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'analyze',
    taskId: 'task-1' // Optional filter
  }
});

// List handoffs
const listResult = await recorder.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'list',
    limit: 50,
    offset: 0,
    taskId: 'task-1' // Optional filter
  }
});
```

### Standalone Functions

```typescript
import { recordHandoff, replayHandoff } from './orchestrator/handoff-recorder.js';

// Record a handoff
const recordId = await recordHandoff(
  'agent-1',
  'agent-2',
  'task-1',
  { data: 'test' },
  { priority: 'high' },
  { success: true, duration: 100 }
);

// Replay a handoff
const record = await replayHandoff(recordId, (ctx) => ({ ...ctx, modified: true }));
```

## Record Structure

```typescript
interface HandoffRecord {
  id: string;
  timestamp: number;
  sourceAgentId: string;
  targetAgentId: string;
  taskId: string;
  context: Record<string, any>;
  handoffRequest: any;
  handoffResponse: any;
  duration: number;
  success: boolean;
  error?: string;
  metadata: {
    priority: string;
    contextSize: number;
    compressionRatio?: number;
    handshakeAccepted: boolean;
  };
}
```

## Analysis Output

```typescript
interface HandoffAnalysis {
  recordId: string;
  summary: {
    totalHandoffs: number;
    successfulHandoffs: number;
    failedHandoffs: number;
    averageDuration: number;
    totalDuration: number;
  };
  patterns: {
    commonSourceAgents: Array<{ agentId: string; count: number }>;
    commonTargetAgents: Array<{ agentId: string; count: number }>;
    failureReasons: Array<{ reason: string; count: number }>;
  };
  timeline: Array<{
    timestamp: number;
    sourceAgentId: string;
    targetAgentId: string;
    duration: number;
    success: boolean;
  }>;
}
```

## Configuration

```typescript
interface RecordingOptions {
  enabled: boolean;              // Enable/disable recording
  maxRecords?: number;           // Maximum records to keep (default: 1000)
  recordContext?: boolean;       // Record handoff context (default: true)
  recordFullContext?: boolean;   // Record full context or summary (default: false)
  compressionEnabled?: boolean; // Enable context compression (default: true)
}
```

## Event Integration

The recorder automatically listens to handoff events:
- `handoff.initiated` - Handoff start
- `handoff.completed` - Successful handoff
- `handoff.failed` - Failed handoff

## Performance

- **Recording Time**: <10ms per handoff
- **Replay Time**: <50ms per handoff
- **Analysis Time**: <100ms for 1000 records
- **Memory Usage**: ~1KB per record

## Best Practices

1. **Enable Recording**: Keep recording enabled for production debugging
2. **Set Limits**: Configure maxRecords to prevent memory issues
3. **Filter Analysis**: Use filters to analyze specific scenarios
4. **Replay for Debugging**: Replay failed handoffs to identify root causes
5. **Monitor Patterns**: Regularly analyze patterns to improve handoff logic

---

**Last Updated**: January 2025

