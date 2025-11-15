# 🧪 FEATURE_AGENT Sandbox System

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ ACTIVE  
**Feature Type:** Core Feature (Free Tier)

---

## 🎯 Overview

The FEATURE_AGENT Sandbox System enables isolated feature development and rapid prototyping. It provides a safe environment for FEATURE_AGENT to experiment with new features without affecting the main codebase.

**Key Features:**
- ✅ Isolated sandbox environments
- ✅ Sandbox lifecycle management (create, promote, archive, cleanup)
- ✅ Integration with FEATURE_AGENT workflow
- ✅ Automatic promotion to production
- ✅ Event-driven architecture
- ✅ Memory integration

---

## 🚀 Quick Start

### Creating a Sandbox

```typescript
import { FeatureSandboxManager } from '../agents/feature-sandbox.manager.js';
import { LAPAEventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';

const eventBus = new LAPAEventBus();
const memoriEngine = new MemoriEngine();

const sandboxManager = new FeatureSandboxManager(
  {
    baseDir: 'sandbox',
    archiveDir: 'sandbox/archive'
  },
  eventBus,
  memoriEngine
);

await sandboxManager.initialize();

// Create a new sandbox
const sandbox = await sandboxManager.createSandbox(
  'user-authentication',
  'Implement user authentication feature'
);

console.log(`Sandbox created: ${sandbox.id}`);
console.log(`Path: ${sandboxManager.getSandboxPath(sandbox.id)}`);
```

### Using the Sandbox Tool

```typescript
import { FeatureSandboxTool } from '../agents/feature-sandbox.tool.js';

const tool = new FeatureSandboxTool(eventBus, memoriEngine);
await tool.initialize();

// Create sandbox via tool
const result = await tool.execute({
  parameters: {
    action: 'create',
    featureName: 'user-authentication',
    description: 'Implement user authentication feature'
  },
  taskId: 'task-123',
  agentId: 'feature-agent'
});

console.log('Sandbox created:', result.output);
```

---

## 📋 API Reference

### FeatureSandboxManager

#### Methods

**`initialize(): Promise<void>`**
- Initializes the sandbox manager
- Creates base directories
- Loads existing sandboxes

**`createSandbox(featureName: string, description?: string): Promise<SandboxMetadata>`**
- Creates a new sandbox for feature development
- Returns sandbox metadata

**`getSandbox(sandboxId: string): Promise<SandboxMetadata | null>`**
- Retrieves sandbox metadata
- Returns null if sandbox doesn't exist

**`listSandboxes(status?: SandboxStatus): Promise<SandboxMetadata[]>`**
- Lists all sandboxes
- Optionally filters by status

**`updateSandbox(sandboxId: string, updates: Partial<SandboxMetadata>): Promise<SandboxMetadata>`**
- Updates sandbox metadata
- Increments iteration count, adds notes, etc.

**`promoteSandbox(sandboxId: string, targetPath?: string): Promise<void>`**
- Promotes sandbox to production
- Moves code to main codebase
- Archives sandbox automatically

**`archiveSandbox(sandboxId: string): Promise<void>`**
- Archives sandbox
- Moves to archive directory

**`cleanupSandbox(sandboxId: string): Promise<void>`**
- Permanently deletes sandbox
- Removes from active and archive

**`getSandboxPath(sandboxId: string): string`**
- Returns sandbox directory path

**`sandboxExists(sandboxId: string): boolean`**
- Checks if sandbox exists

### FeatureSandboxTool

#### Actions

**`create`** - Create a new sandbox
```typescript
{
  action: 'create',
  featureName: string,
  description?: string
}
```

**`get`** - Get sandbox metadata
```typescript
{
  action: 'get',
  sandboxId: string
}
```

**`list`** - List sandboxes
```typescript
{
  action: 'list',
  status?: SandboxStatus
}
```

**`update`** - Update sandbox
```typescript
{
  action: 'update',
  sandboxId: string,
  updates: Partial<SandboxMetadata>
}
```

**`promote`** - Promote sandbox to production
```typescript
{
  action: 'promote',
  sandboxId: string,
  targetPath?: string
}
```

**`archive`** - Archive sandbox
```typescript
{
  action: 'archive',
  sandboxId: string
}
```

**`cleanup`** - Cleanup sandbox
```typescript
{
  action: 'cleanup',
  sandboxId: string
}
```

**`getPath`** - Get sandbox path
```typescript
{
  action: 'getPath',
  sandboxId: string
}
```

**`exists`** - Check if sandbox exists
```typescript
{
  action: 'exists',
  sandboxId: string
}
```

---

## 🔄 Workflow Integration

### Sandbox Mode Workflow

The sandbox system integrates with the FEATURE_AGENT workflow:

1. **Create Sandbox** - FEATURE_AGENT creates isolated environment
2. **Rapid Prototyping** - Implement feature in sandbox
3. **Iterate** - Update sandbox with iterations
4. **Validate** - Test in sandbox environment
5. **Promote** - Move to production when ready
6. **Archive** - Sandbox automatically archived after promotion

### Example Workflow

```typescript
// 1. Create sandbox
const sandbox = await sandboxManager.createSandbox('new-feature');

// 2. Work in sandbox
const sandboxPath = sandboxManager.getSandboxPath(sandbox.id);
// ... implement feature in sandboxPath/src ...

// 3. Update iteration
await sandboxManager.updateSandbox(sandbox.id, {
  iterationCount: 1,
  notes: ['Initial implementation', 'Added core functionality']
});

// 4. Promote when ready
await sandboxManager.promoteSandbox(sandbox.id, 'src/features/new-feature');
// Sandbox is automatically archived
```

---

## 📁 Directory Structure

```
sandbox/
├── [feature-name]-[timestamp]/
│   ├── src/              # Source code
│   ├── tests/            # Test files
│   ├── docs/             # Documentation
│   ├── sandbox.config.json
│   ├── metadata.json
│   └── README.md
└── archive/
    └── [feature-name]-[timestamp]/
        └── ... (archived sandboxes)
```

---

## 🎯 Use Cases

### Use Case 1: Rapid Prototyping
- Create sandbox for experimental feature
- Implement quickly without quality gates
- Test concept
- Promote if successful, archive if not

### Use Case 2: Feature Development
- Create sandbox for new feature
- Implement with full quality gates
- Iterate until ready
- Promote to production

### Use Case 3: Feature Refactoring
- Create sandbox for refactoring
- Test refactored code in isolation
- Validate before merging
- Promote when validated

---

## 🔔 Events

The sandbox system publishes events via LAPAEventBus:

- `sandbox.manager.initialized` - Manager initialized
- `sandbox.created` - Sandbox created
- `sandbox.updated` - Sandbox updated
- `sandbox.promoted` - Sandbox promoted to production
- `sandbox.archived` - Sandbox archived
- `sandbox.cleaned` - Sandbox cleaned up

---

## 💾 Memory Integration

Sandbox metadata is stored in Memori Engine:
- Sandbox creation events
- Promotion decisions
- Iteration history
- Learnings and notes

---

## ✅ Quality Gates

**Sandbox Creation:**
- ✅ Valid feature name
- ✅ Directory structure created
- ✅ Metadata initialized
- ✅ Event published

**Sandbox Promotion:**
- ✅ Sandbox exists and is active
- ✅ Source code exists
- ✅ Files copied successfully
- ✅ Sandbox archived

**Sandbox Update:**
- ✅ Sandbox exists
- ✅ Updates valid
- ✅ Metadata saved
- ✅ Event published

---

## 🧪 Testing

Comprehensive test suite in `src/__tests__/agents/feature-sandbox.manager.spec.ts`:

- ✅ Sandbox creation
- ✅ Metadata management
- ✅ Sandbox promotion
- ✅ Archiving
- ✅ Cleanup
- ✅ Event publishing
- ✅ Memory integration

---

## 📊 Metrics

**Sandbox Metrics:**
- Total sandboxes created
- Sandboxes promoted
- Sandboxes archived
- Average iterations per sandbox
- Promotion success rate

---

## 🔒 Security

**Sandbox Isolation:**
- ✅ Isolated directory structure
- ✅ No access to main codebase during development
- ✅ Controlled promotion process
- ✅ Archive for audit trail

---

## 🚀 Future Enhancements

- [ ] Sandbox templates
- [ ] Auto-promotion based on quality gates
- [ ] Sandbox sharing between agents
- [ ] Sandbox versioning
- [ ] Sandbox analytics dashboard

---

## 📚 Related Documents

- **FEATURE_AGENT Workflow**: `docs/workflows/FEATURE_AGENT_WORKFLOW.md`
- **FEATURE_AGENT Persona**: `docs/personas/FEATURE_AGENT_PERSONA.md`
- **Event Bus**: `src/core/event-bus.ts`
- **Memory Engine**: `src/local/memori-engine.ts`

---

**Last Updated:** [AUTO-UPDATE]  
**Status:** ✅ ACTIVE

🧠 **Ready for FEATURE_AGENT rapid prototyping!**

