# Source Directory Consolidation Analysis

**Date:** January 2025  
**Status:** Decision Made - See [SOURCE_DIRECTORY_DECISION.md](SOURCE_DIRECTORY_DECISION.md)

---

## 🎯 Question

Should we have:
1. **One single source directory** (consolidate everything)
2. **Separate source directories** (keep baked-in IDE separate from extension)

---

## 📊 Current Structure

```
lapa/
├── src/                                    # Core LAPA (412 files)
├── packages/
│   ├── core/src/                           # Monorepo core (copied from src/)
│   └── ide-extension/src/                  # Monorepo IDE extension
├── extract/                                 # Staging (temporary)
└── lapa-ide-void/
    ├── src/vs/workbench/contrib/void/      # IDE integration (baked-in)
    │   ├── browser/                        # Browser process code
    │   ├── common/                         # Shared code
    │   └── electron-main/                  # Main process code
    └── extensions/lapa-swarm/src/          # Extension (separate)
        └── [412 files from src/]
```

---

## 🔍 Analysis

### Current Issues

1. **Code Duplication:**
   - `src/` → `extensions/lapa-swarm/src/` (via extract script)
   - `packages/core/src/` → duplicate of `src/`
   - Three copies of same code

2. **Multiple Source Locations:**
   - Root `src/` (core)
   - `lapa-ide-void/src/vs/workbench/contrib/void/` (IDE integration)
   - `lapa-ide-void/extensions/lapa-swarm/src/` (extension)
   - `packages/core/src/` (monorepo)
   - `extract/` (staging)

3. **Sync Complexity:**
   - Need `extract-lapa.js` to sync
   - Need drift detection
   - Risk of inconsistency

---

## 🏗️ Option 1: Single Source Directory (Recommended) ⭐

### Structure
```
lapa/
├── src/                                    # Single source of truth
│   ├── core/                               # Core LAPA functionality
│   │   ├── agents/
│   │   ├── orchestrator/
│   │   ├── swarm/
│   │   └── ...
│   │
│   ├── ide-integration/                    # IDE-specific integration
│   │   ├── browser/                        # Browser process
│   │   ├── common/                         # Shared
│   │   └── electron-main/                  # Main process
│   │
│   └── extension/                          # Extension-specific
│       ├── extension.ts                    # Entry point
│       └── ide-specific/                  # IDE-only code
│
├── lapa-ide-void/
│   └── src/vs/workbench/contrib/lapa/     # Symlink or import from root
│
└── packages/                                # Monorepo (optional)
    ├── core/                                # Links to src/core/
    └── ide-extension/                       # Links to src/extension/
```

### Implementation

**Step 1: Reorganize `src/`**
```bash
mkdir -p src/core src/ide-integration src/extension
mv src/agents src/orchestrator src/swarm ... src/core/
# Move IDE-specific code to src/ide-integration/
# Move extension-specific code to src/extension/
```

**Step 2: Update IDE Integration**
```typescript
// lapa-ide-void/src/vs/workbench/contrib/lapa/browser/...
import { getSwarmManager } from '../../../../../../src/core/swarm';
import { LAPASettingsService } from '../../../../../../src/ide-integration/common';
```

**Step 3: Update Extension**
```typescript
// lapa-ide-void/extensions/lapa-swarm/src/extension.ts
import * as lapaCore from '../../../../src/core';
import { LAPASwarmViewPane } from './ide-specific/ui/LAPASwarmViewPane';
```

### Benefits
- ✅ **Single source of truth** - No duplication
- ✅ **Clear separation** - core/ide-integration/extension
- ✅ **Easy maintenance** - One place to update
- ✅ **No sync needed** - Direct imports
- ✅ **Type safety** - Shared types
- ✅ **Simpler builds** - One build system

### Challenges
- ⚠️ **Import paths** - Longer paths, need path mapping
- ⚠️ **Build complexity** - Need to handle different build targets
- ⚠️ **Migration effort** - Requires refactoring

---

## 🏗️ Option 2: Separate Source Directories (Current)

### Structure
```
lapa/
├── src/                                    # Core LAPA
├── lapa-ide-void/
│   ├── src/vs/workbench/contrib/lapa/     # IDE integration (baked-in)
│   └── extensions/lapa-swarm/src/          # Extension (separate, synced)
```

### Keep Current Approach
- Keep `src/` as core
- Keep `lapa-ide-void/src/vs/workbench/contrib/lapa/` as IDE integration
- Keep `lapa-ide-void/extensions/lapa-swarm/src/` as extension (synced)

### Benefits
- ✅ **Clear separation** - Baked-in vs extension
- ✅ **Independent development** - Can develop separately
- ✅ **No import conflicts** - Separate namespaces
- ✅ **Familiar structure** - Matches VS Code patterns

### Challenges
- ⚠️ **Code duplication** - Need sync mechanism
- ⚠️ **Drift risk** - Need drift detection
- ⚠️ **Maintenance overhead** - Multiple places to update
- ⚠️ **Sync complexity** - Need extract script

---

## 🎯 Recommendation: **Option 1 - Single Source Directory**

### Rationale

1. **Eliminates Duplication:**
   - No need for `extract-lapa.js`
   - No need for drift detection
   - Single source of truth

2. **Better Architecture:**
   - Clear separation: core/ide-integration/extension
   - Shared types and utilities
   - Easier refactoring

3. **Simpler Maintenance:**
   - One place to update code
   - No sync scripts needed
   - Easier to understand

4. **Monorepo Ready:**
   - Aligns with monorepo migration
   - Can use workspace packages
   - Better dependency management

### Migration Path

1. **Phase 1:** Reorganize `src/` into subdirectories
2. **Phase 2:** Update IDE integration to import from root
3. **Phase 3:** Update extension to import from root
4. **Phase 4:** Remove extract script and drift detection
5. **Phase 5:** Update monorepo packages to use root src/

---

## 📋 Action Plan

### Immediate
1. ⏭️ Create `src/core/`, `src/ide-integration/`, `src/extension/`
2. ⏭️ Move files to appropriate directories
3. ⏭️ Update import paths

### Short-Term
1. ⏭️ Update IDE integration imports
2. ⏭️ Update extension imports
3. ⏭️ Test builds

### Long-Term
1. ⏭️ Remove extract script
2. ⏭️ Remove drift detection (or repurpose)
3. ⏭️ Update documentation

---

## 🔗 Related Documents

- [Void → LAPA Retrofit Plan](VOID_TO_LAPA_RETROFIT_PLAN.md)
- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)

---

**Last Updated:** January 2025  
**Status:** Planning Phase

