# LAPA Command Integration Implementation Guide

**Date:** January 2025  
**Status:** 🚀 **IN PROGRESS**

---

## 🎯 Goal

Integrate all 21 missing LAPA commands into the IDE UI, starting with Tier 1 (critical) commands.

---

## ✅ Completed Integrations

### Tier 1: Critical Core Functionality
- [x] `lapa.switchProvider` - Already integrated ✅
- [x] `lapa.swarm.start` - Handler added ✅
- [x] `lapa.swarm.stop` - Handler added ✅
- [x] `lapa.swarm.pause` - Handler added ✅
- [x] `lapa.swarm.resume` - Handler added ✅
- [x] `lapa.swarm.status` - Handler added ✅
- [x] `lapa.swarm.configure` - Handler added ✅

### Tier 2: Essential Features
- [x] `lapa.enhancePrompt` - Handler added ✅
- [x] `lapa.git.generateCommit` - Handler added ✅
- [x] `lapa.settings.open` - Handler added ✅
- [x] `lapa.dashboard.open` - Handler added ✅

**Progress:** 11 of 22 commands (50%)

---

## 📋 Integration Pattern

### Step 1: Add Command Handler

**Location:** `lapa-ide-void/src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`

**Pattern:**
```typescript
const handleCommandName = useCallback(async () => {
  try {
    await commandService.executeCommand('lapa.command.name')
  } catch (error) {
    console.error('[SidebarChat] Failed to execute command:', error)
  }
}, [commandService])
```

### Step 2: Add UI Button/Control

**Location:** Toolbar, menu, or appropriate UI component

**Pattern:**
```tsx
<button onClick={handleCommandName}>
  Command Label
</button>
```

### Step 3: Test Integration

1. Build IDE
2. Test command execution
3. Verify error handling
4. Check UI feedback

---

## 🎨 UI Integration Locations

### Main Toolbar
- `lapa.swarm.start` - Start button
- `lapa.swarm.stop` - Stop button
- `lapa.swarm.pause` - Pause button
- `lapa.swarm.resume` - Resume button
- `lapa.swarm.status` - Status indicator

### Settings Menu
- `lapa.settings.open` - Settings item
- `lapa.swarm.configure` - Configure item

### Git Panel
- `lapa.git.generateCommit` - Generate commit button

### Chat Input
- `lapa.enhancePrompt` - Enhance button (already referenced)

### Sidebar
- `lapa.dashboard.open` - Dashboard button
- `lapa.marketplace.open` - Marketplace button
- `lapa.roi.open` - ROI widget button
- `lapa.taskHistory.open` - Task history button

### Command Palette
- All commands should be accessible via command palette
- `lapa.commandPalette.ai` - AI search

### Session Menu
- `lapa.swarm.restore` - Restore session
- `lapa.swarm.listSessions` - List sessions

### Persona Panel
- `lapa.personas.list` - List personas
- `lapa.personas.reload` - Reload button

### Workflow Menu
- `lapa.workflow.generate` - Generate workflow

### Premium/Upgrade
- `lapa.swarm.upgrade` - Upgrade button
- `lapa.swarm.activateLicense` - Activate license

---

## 🔧 Helper Module

**Created:** `lapa-ide-void/src/vs/workbench/contrib/void/browser/react/src/lapa-commands.ts`

**Provides:**
- Command ID constants
- Typed command execution helpers
- Organized command groups

**Usage:**
```typescript
import { LAPASwarmCommands, LAPA_COMMANDS } from '../lapa-commands.js'

// Execute command
await LAPASwarmCommands.start(commandService)
await LAPASwarmCommands.stop(commandService)
```

---

## 📊 Integration Status

| Command | Handler | UI Integration | Status |
|---------|---------|----------------|--------|
| `lapa.switchProvider` | ✅ | ✅ | ✅ Complete |
| `lapa.swarm.start` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.stop` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.pause` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.resume` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.status` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.configure` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.enhancePrompt` | ✅ | ✅ | ✅ Complete |
| `lapa.git.generateCommit` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.settings.open` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.dashboard.open` | ✅ | ⏭️ | 🔄 Handler ready |
| `lapa.swarm.restore` | ❌ | ❌ | ⏭️ Pending |
| `lapa.swarm.listSessions` | ❌ | ❌ | ⏭️ Pending |
| `lapa.personas.list` | ❌ | ❌ | ⏭️ Pending |
| `lapa.personas.reload` | ❌ | ❌ | ⏭️ Pending |
| `lapa.workflow.generate` | ❌ | ❌ | ⏭️ Pending |
| `lapa.commandPalette.ai` | ❌ | ❌ | ⏭️ Pending |
| `lapa.marketplace.open` | ❌ | ❌ | ⏭️ Pending |
| `lapa.roi.open` | ❌ | ❌ | ⏭️ Pending |
| `lapa.taskHistory.open` | ❌ | ❌ | ⏭️ Pending |
| `lapa.swarm.upgrade` | ❌ | ❌ | ⏭️ Pending |
| `lapa.swarm.activateLicense` | ❌ | ❌ | ⏭️ Pending |

**Progress:** 11 handlers created (50%), 2 UI integrated (9%)

---

## ⏭️ Next Steps

### Immediate (This Session)
1. ✅ Create command helper module
2. ✅ Add Tier 1 command handlers
3. ✅ Add Tier 2 command handlers
4. ⏭️ Add UI buttons for Tier 1 commands
5. ⏭️ Test command execution

### This Week
1. ⏭️ Add remaining command handlers (Tier 3-5)
2. ⏭️ Integrate UI buttons/controls
3. ⏭️ Add to command palette
4. ⏭️ Test all integrations
5. ⏭️ Update documentation

### Next Week
1. ⏭️ Polish UI integration
2. ⏭️ Add error handling UI
3. ⏭️ Add loading states
4. ⏭️ User testing
5. ⏭️ Final validation

---

## 🔗 Related Documents

- [Command Integration Priorities](COMMAND_INTEGRATION_PRIORITIES.md)
- [IDE Integration Drift Analysis](IDE_INTEGRATION_DRIFT_ANALYSIS.md)
- [IDE Integration Drift Summary](IDE_INTEGRATION_DRIFT_SUMMARY.md)

---

**Last Updated:** January 2025  
**Status:** 🚀 **IN PROGRESS - 50% Complete**

