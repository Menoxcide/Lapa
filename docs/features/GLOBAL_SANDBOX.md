# 🌍 Global Sandbox System for LAPA-VOID

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ ACTIVE  
**Feature Type:** Core Feature (Free Tier)

---

## 🎯 Overview

The Global Sandbox System provides **isolated execution environments** that can be used by **any agent or system** in the LAPA-VOID project. Unlike the FEATURE_AGENT-specific sandbox, this system is designed for universal use across all agents and use cases.

**Key Features:**
- ✅ **Multi-Provider Support** - Local, MCP, E2B, custom providers
- ✅ **Universal Agent Access** - Any agent can use sandboxes
- ✅ **Unified Interface** - Consistent API across all sandbox types
- ✅ **Lifecycle Management** - Create, execute, promote, archive, cleanup
- ✅ **Event-Driven Architecture** - Integrated with LAPAEventBus
- ✅ **Memory Integration** - Works with MemoriEngine
- ✅ **Category Support** - Feature, test, debug, experiment, integration, research
- ✅ **Auto-Cleanup** - Automatic expiration and cleanup

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { GlobalSandboxManager } from '../core/sandbox-manager.js';
import { LAPAEventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';

const eventBus = new LAPAEventBus();
const memoriEngine = new MemoriEngine();

const sandboxManager = new GlobalSandboxManager(
  {
    baseDir: '.lapa/sandboxes',
    archiveDir: '.lapa/sandboxes/archive',
    defaultProvider: 'local'
  },
  eventBus,
  memoriEngine
);

await sandboxManager.initialize();

// Create a sandbox
const sandbox = await sandboxManager.createSandbox({
  name: 'my-feature',
  category: 'feature',
  description: 'My feature development',
  owner: 'coder-agent'
});

// Execute in sandbox
const result = await sandboxManager.execute({
  sandboxId: sandbox.id,
  command: 'ls',
  code: 'console.log("Hello from sandbox")',
  language: 'javascript'
});

// Promote to production
await sandboxManager.promoteSandbox(sandbox.id, 'src/features/my-feature');
```

### Using the Sandbox Tool

```typescript
import { GlobalSandboxTool } from '../core/sandbox-tool.js';
import { agentToolRegistry } from '../core/agent-tool.js';

const tool = new GlobalSandboxTool(eventBus, memoriEngine);
await tool.initialize();

// Register with agent tool registry
agentToolRegistry.registerTool(tool);

// Use from any agent
const result = await tool.execute({
  parameters: {
    action: 'create',
    name: 'test-feature',
    category: 'test',
    description: 'Testing sandbox',
    owner: 'test-agent'
  },
  taskId: 'task-123',
  agentId: 'test-agent'
});
```

---

## 📋 API Reference

### GlobalSandboxManager

#### Methods

**`initialize()`: Promise<void>**
- Initializes the sandbox manager
- Creates base directories
- Loads existing sandboxes
- Initializes default providers

**`createSandbox(options: CreateSandboxOptions): Promise<SandboxMetadata>`**
- Creates a new sandbox
- Returns sandbox metadata

**`getSandbox(sandboxId: string): Promise<SandboxMetadata | null>`**
- Gets sandbox metadata by ID

**`listSandboxes(filter?: Partial<SandboxMetadata>): Promise<SandboxMetadata[]>`**
- Lists all sandboxes with optional filter

**`updateSandbox(sandboxId: string, updates: Partial<SandboxMetadata>): Promise<SandboxMetadata>`**
- Updates sandbox metadata

**`execute(context: SandboxExecutionContext): Promise<SandboxExecutionResult>`**
- Executes command/code in sandbox

**`promoteSandbox(sandboxId: string, targetPath?: string): Promise<void>`**
- Promotes sandbox to production

**`archiveSandbox(sandboxId: string): Promise<void>`**
- Archives sandbox

**`deleteSandbox(sandboxId: string): Promise<void>`**
- Deletes sandbox permanently

**`cleanup(): Promise<void>`**
- Cleans up expired/inactive sandboxes

**`getSandboxPath(sandboxId: string): string`**
- Gets filesystem path for sandbox

**`sandboxExists(sandboxId: string): boolean`**
- Checks if sandbox exists

**`registerProvider(provider: ISandboxProvider): void`**
- Registers a custom sandbox provider

**`getProvider(type: SandboxProviderType): ISandboxProvider | undefined`**
- Gets a provider by type

---

## 🎨 Sandbox Categories

- **`feature`** - Feature development sandboxes
- **`test`** - Testing sandboxes
- **`debug`** - Debugging sandboxes
- **`experiment`** - Experimental sandboxes
- **`integration`** - Integration testing sandboxes
- **`research`** - Research sandboxes
- **`custom`** - Custom use case sandboxes

---

## 🔌 Sandbox Providers

### Local Provider (Default)
- **Type:** `local`
- **Features:** Filesystem-based, isolated directories
- **Use Case:** General purpose, feature development, testing

### MCP Provider
- **Type:** `mcp`
- **Features:** MCP protocol integration
- **Use Case:** MCP-specific sandboxes

### E2B Provider (Premium)
- **Type:** `e2b`
- **Features:** Cloud-based, secure code execution
- **Use Case:** Secure execution, premium features

### Custom Provider
- **Type:** `custom`
- **Features:** User-defined provider
- **Use Case:** Custom integrations

---

## 🔄 Integration with Existing Systems

### FEATURE_AGENT Sandbox

The FEATURE_AGENT-specific sandbox can optionally use the global system:

```typescript
import { GlobalSandboxManager } from '../core/sandbox-manager.js';

// Use global system for feature sandboxes
const sandbox = await globalSandboxManager.createSandbox({
  name: 'user-auth',
  category: 'feature',
  provider: 'local',
  owner: 'feature-agent'
});
```

### LocalSandboxProvider

The global system integrates with the existing `LocalSandboxProvider`:

- Automatically initialized as default provider
- Uses existing filesystem operations
- Provides command execution capabilities

### E2B Integration

E2B sandbox integration can be registered as a provider:

```typescript
import { E2BSandboxIntegration } from '../premium/e2b.sandbox.js';

const e2bProvider = new E2BSandboxIntegration(apiKey);
sandboxManager.registerProvider(e2bProvider);
```

---

## 📊 Events

The global sandbox system publishes events via LAPAEventBus:

- **`sandbox.manager.initialized`** - Manager initialized
- **`sandbox.created`** - Sandbox created
- **`sandbox.updated`** - Sandbox updated
- **`sandbox.executed`** - Command executed in sandbox
- **`sandbox.promoted`** - Sandbox promoted to production
- **`sandbox.archived`** - Sandbox archived
- **`sandbox.deleted`** - Sandbox deleted

---

## 🛡️ Security & Isolation

- **Isolated Directories** - Each sandbox has its own directory
- **Access Control** - Sandboxes can have owners
- **Expiration** - Automatic expiration and cleanup
- **Archive Safety** - Archived sandboxes preserved for reference

---

## 📝 Examples

### Example 1: Feature Development

```typescript
// Create feature sandbox
const sandbox = await sandboxManager.createSandbox({
  name: 'user-authentication',
  category: 'feature',
  description: 'User authentication feature',
  owner: 'feature-agent',
  tags: ['auth', 'security']
});

// Develop feature in sandbox
await sandboxManager.execute({
  sandboxId: sandbox.id,
  code: `
    // Feature implementation
    export function authenticateUser(credentials) {
      // Implementation here
    }
  `,
  language: 'javascript'
});

// Promote when ready
await sandboxManager.promoteSandbox(sandbox.id, 'src/features/auth');
```

### Example 2: Testing

```typescript
// Create test sandbox
const testSandbox = await sandboxManager.createSandbox({
  name: 'integration-tests',
  category: 'test',
  owner: 'test-agent'
});

// Run tests in sandbox
const result = await sandboxManager.execute({
  sandboxId: testSandbox.id,
  command: 'npm',
  code: 'test -- --run'
});
```

### Example 3: Experimentation

```typescript
// Create experiment sandbox
const experiment = await sandboxManager.createSandbox({
  name: 'ai-model-experiment',
  category: 'experiment',
  expiresInDays: 7,
  owner: 'research-agent'
});

// Run experiment
const result = await sandboxManager.execute({
  sandboxId: experiment.id,
  code: experimentCode,
  language: 'python'
});

// Archive when done
await sandboxManager.archiveSandbox(experiment.id);
```

---

## 🔗 Related Documents

- **FEATURE_AGENT Sandbox**: `docs/features/FEATURE_SANDBOX.md`
- **LocalSandboxProvider**: `src/sandbox/local.provider.ts`
- **E2B Integration**: `src/premium/e2b.sandbox.ts`
- **Event Bus**: `src/core/event-bus.ts`
- **Memory Engine**: `src/local/memori-engine.ts`

---

## 🚀 Future Enhancements

- [ ] **Cloud Provider Integration** - More cloud sandbox providers
- [ ] **Resource Limits** - CPU, memory, disk quotas
- [ ] **Network Isolation** - Network sandboxing
- [ ] **Snapshot System** - Save/restore sandbox states
- [ ] **Collaborative Sandboxes** - Multi-agent sandboxes
- [ ] **Sandbox Templates** - Pre-built sandbox templates

---

**Last Updated:** [AUTO-UPDATE on every change]  
**Status:** ✅ ACTIVE AND OPERATIONAL

🧠 **The Global Sandbox System enables safe experimentation and isolated execution across all agents and systems in LAPA-VOID!**

