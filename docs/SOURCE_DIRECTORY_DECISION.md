# Source Directory Consolidation Decision

**Date:** January 2025  
**Status:** Decision Made - Option 1 Approved

---

## 🎯 Decision: **Option 1 - Single Source Directory**

After reviewing the [Source Directory Consolidation Analysis](SOURCE_DIRECTORY_CONSOLIDATION.md), we have decided to proceed with **Option 1: Single Source Directory** with subdirectories.

---

## 📋 Rationale

### Why Option 1?

1. **Eliminates Code Duplication**
   - No need for `extract-lapa.js` sync script
   - No need for drift detection between copies
   - Single source of truth for all code

2. **Better Architecture**
   - Clear separation: `core/` | `ide-integration/` | `extension/`
   - Shared types and utilities across all layers
   - Easier refactoring and maintenance

3. **Simpler Maintenance**
   - One place to update code
   - No sync scripts needed
   - Easier to understand project structure

4. **Monorepo Ready**
   - Aligns with monorepo migration
   - Can use workspace packages
   - Better dependency management

---

## 🏗️ Target Structure

```
lapa/
├── src/                                    # Single source of truth
│   ├── core/                               # Core LAPA functionality
│   │   ├── agents/
│   │   ├── orchestrator/
│   │   ├── swarm/
│   │   ├── mcp/
│   │   └── ...
│   │
│   ├── ide-integration/                    # IDE-specific integration (baked-in)
│   │   ├── browser/                        # Browser process
│   │   │   ├── react/                      # React components
│   │   │   ├── services/                   # Browser services
│   │   │   └── ...
│   │   ├── common/                         # Shared code
│   │   │   ├── services/                   # Common services
│   │   │   └── types/                      # Shared types
│   │   └── electron-main/                  # Main process
│   │       ├── llmMessage/                 # LLM message handling
│   │       └── services/                   # Main services
│   │
│   └── extension/                          # Extension-specific
│       ├── extension.ts                    # Entry point
│       ├── ui/                             # UI components
│       │   ├── LAPASwarmViewPane.tsx
│       │   ├── LAPAActionBar.tsx
│       │   └── ...
│       └── ide-specific/                   # IDE-only code
│
├── lapa-ide-void/
│   └── src/vs/workbench/contrib/lapa/     # Import from root src/
│       └── [symlink or import mapping]
│
└── packages/                                # Monorepo (optional)
    ├── core/                                # Links to src/core/
    └── ide-extension/                       # Links to src/extension/
```

---

## 📝 Implementation Phases

### Phase 1: Reorganize `src/` ✅
- [x] Create `src/core/`, `src/ide-integration/`, `src/extension/`
- [ ] Move existing `src/` files to `src/core/`
- [ ] Move IDE integration code from `lapa-ide-void/src/vs/workbench/contrib/lapa/` to `src/ide-integration/`
- [ ] Move extension-specific code to `src/extension/`

### Phase 2: Update Import Paths 🔄
- [ ] Update IDE integration to import from root `src/`
- [ ] Update extension to import from root `src/`
- [ ] Update monorepo packages to use root `src/`
- [ ] Add TypeScript path mappings in `tsconfig.json`

### Phase 3: Update Build System 🔄
- [ ] Update `lapa-ide-void` build scripts
- [ ] Update extension build scripts
- [ ] Test all build targets

### Phase 4: Cleanup ⏭️
- [ ] Remove `extract-lapa.js` script
- [ ] Remove or repurpose drift detection scripts
- [ ] Remove `extract/` directory
- [ ] Update documentation

### Phase 5: Verification ⏭️
- [ ] Test IDE build
- [ ] Test extension build
- [ ] Test runtime functionality
- [ ] Verify no broken imports

---

## 🔧 Technical Details

### TypeScript Path Mappings

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@lapa/core/*": ["src/core/*"],
      "@lapa/ide-integration/*": ["src/ide-integration/*"],
      "@lapa/extension/*": ["src/extension/*"]
    }
  }
}
```

### Import Examples

**Before (duplication):**
```typescript
// lapa-ide-void/extensions/lapa-swarm/src/swarm/manager.ts
import { EventBus } from '../core/event-bus';
```

**After (single source):**
```typescript
// lapa-ide-void/src/vs/workbench/contrib/lapa/browser/services.ts
import { EventBus } from '../../../../../../src/core/event-bus';

// Or with path mapping:
import { EventBus } from '@lapa/core/event-bus';
```

---

## ✅ Benefits

- ✅ **Single source of truth** - No duplication
- ✅ **Clear separation** - core/ide-integration/extension
- ✅ **Easy maintenance** - One place to update
- ✅ **No sync needed** - Direct imports
- ✅ **Type safety** - Shared types
- ✅ **Simpler builds** - One build system

---

## ⚠️ Challenges & Mitigation

### Challenge 1: Import Path Length
**Issue:** Longer import paths (`../../../../../../src/core/...`)  
**Mitigation:** Use TypeScript path mappings (`@lapa/core/*`)

### Challenge 2: Build Complexity
**Issue:** Need to handle different build targets  
**Mitigation:** Separate build configs for IDE vs extension

### Challenge 3: Migration Effort
**Issue:** Requires refactoring existing code  
**Mitigation:** Incremental migration, phase-by-phase approach

---

## 📚 Related Documents

- [Source Directory Consolidation Analysis](SOURCE_DIRECTORY_CONSOLIDATION.md)
- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)
- [Void → LAPA Retrofit Plan](VOID_TO_LAPA_RETROFIT_PLAN.md)

---

## 🎯 Next Steps

1. **Immediate:** Create `src/core/`, `src/ide-integration/`, `src/extension/`
2. **This Week:** Move files to appropriate directories
3. **Next Week:** Update import paths and test builds
4. **Ongoing:** Complete Phase 2-5 incrementally

---

**Decision Date:** January 2025  
**Status:** Approved - Ready for Implementation

