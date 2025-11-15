# Source Directory Consolidation Implementation Plan

**Date:** January 2025  
**Status:** In Progress

---

## 🎯 Goal

Consolidate all source directories into a single `src/` directory with clear subdirectories:
- `src/core/` - Core LAPA functionality
- `src/ide-integration/` - IDE-specific integration (baked-in)
- `src/extension/` - Extension-specific code

---

## 📋 Implementation Checklist

### Phase 1: Directory Structure Setup

- [ ] **1.1** Create new directory structure
  ```bash
  mkdir -p src/core src/ide-integration/browser src/ide-integration/common src/ide-integration/electron-main src/extension
  ```

- [ ] **1.2** Move core files from `src/` to `src/core/`
  - [ ] Move `src/agents/` → `src/core/agents/`
  - [ ] Move `src/orchestrator/` → `src/core/orchestrator/`
  - [ ] Move `src/swarm/` → `src/core/swarm/`
  - [ ] Move `src/mcp/` → `src/core/mcp/`
  - [ ] Move `src/core/` (existing) → merge with new `src/core/`
  - [ ] Move all other directories to `src/core/`

- [ ] **1.3** Move IDE integration from `lapa-ide-void/src/vs/workbench/contrib/lapa/`
  - [ ] Move `browser/` → `src/ide-integration/browser/`
  - [ ] Move `common/` → `src/ide-integration/common/`
  - [ ] Move `electron-main/` → `src/ide-integration/electron-main/`

- [ ] **1.4** Move extension-specific files
  - [ ] Move `lapa-ide-void/extensions/lapa-swarm/src/extension.ts` → `src/extension/extension.ts`
  - [ ] Move `lapa-ide-void/extensions/lapa-swarm/src/ui/` → `src/extension/ui/`
  - [ ] Move IDE-specific components → `src/extension/ide-specific/`

---

### Phase 2: Update Import Paths

- [ ] **2.1** Add TypeScript path mappings
  - [ ] Update root `tsconfig.json`
  - [ ] Update `lapa-ide-void/tsconfig.json`
  - [ ] Update extension `tsconfig.json`

- [ ] **2.2** Update IDE integration imports
  - [ ] Scan `src/ide-integration/` for imports
  - [ ] Update imports to use path mappings or relative paths to `src/core/`
  - [ ] Test TypeScript compilation

- [ ] **2.3** Update extension imports
  - [ ] Scan `src/extension/` for imports
  - [ ] Update imports to use path mappings or relative paths to `src/core/`
  - [ ] Test TypeScript compilation

- [ ] **2.4** Update `lapa-ide-void` imports
  - [ ] Find all references to `contrib/lapa/`
  - [ ] Update to import from `src/ide-integration/` or use path mappings
  - [ ] Update workbench integration points

- [ ] **2.5** Update monorepo packages
  - [ ] Update `packages/core/package.json` to reference `src/core/`
  - [ ] Update `packages/ide-extension/package.json` to reference `src/extension/`

---

### Phase 3: Update Build System

- [ ] **3.1** Update IDE build configuration
  - [ ] Update `lapa-ide-void/gulpfile.js` build tasks
  - [ ] Update `lapa-ide-void/package.json` build scripts
  - [ ] Update React build script paths

- [ ] **3.2** Update extension build configuration
  - [ ] Update extension `tsconfig.json`
  - [ ] Update extension build scripts
  - [ ] Update webpack/esbuild configs

- [ ] **3.3** Test builds
  - [ ] Test IDE compilation: `cd lapa-ide-void && npm run compile`
  - [ ] Test extension build
  - [ ] Test React build: `npm run buildreact`

---

### Phase 4: Update IDE Integration Points

- [ ] **4.1** Update workbench contribution points
  - [ ] Update `lapa-ide-void/src/vs/workbench/workbench.common.main.ts`
  - [ ] Update workbench registration files
  - [ ] Update contribution point paths

- [ ] **4.2** Update service registrations
  - [ ] Update service registration in `lapa.contribution.ts`
  - [ ] Update service imports
  - [ ] Test service loading

- [ ] **4.3** Update React component paths
  - [ ] Update `build.js` in `src/ide-integration/browser/react/`
  - [ ] Update component import paths
  - [ ] Test React build

---

### Phase 5: Cleanup

- [ ] **5.1** Remove sync scripts
  - [ ] Delete `scripts/extract-lapa.js`
  - [ ] Remove from `package.json` scripts

- [ ] **5.2** Remove drift detection (or repurpose)
  - [ ] Delete `scripts/detect-drift.js` (or repurpose for monorepo)
  - [ ] Delete `.driftignore`
  - [ ] Remove from CI/CD workflows if consolidating

- [ ] **5.3** Remove `extract/` directory
  - [ ] Verify all code moved
  - [ ] Delete `extract/` directory

- [ ] **5.4** Update documentation
  - [ ] Update README.md
  - [ ] Update CONTRIBUTING.md
  - [ ] Update architecture docs
  - [ ] Update this document as completed

---

### Phase 6: Verification & Testing

- [ ] **6.1** Type checking
  - [ ] Run `tsc --noEmit` on all packages
  - [ ] Fix any type errors

- [ ] **6.2** Build testing
  - [ ] Test IDE build: `cd lapa-ide-void && npm run compile`
  - [ ] Test extension build
  - [ ] Test React build: `npm run buildreact`
  - [ ] Test watch modes

- [ ] **6.3** Runtime testing
  - [ ] Launch IDE with extension
  - [ ] Test all LAPA commands
  - [ ] Test UI components
  - [ ] Test services

- [ ] **6.4** Integration testing
  - [ ] Test IDE integration features
  - [ ] Test extension features
  - [ ] Test cross-package imports

---

## 🔧 Technical Implementation Details

### Directory Mapping

| Source | Destination |
|--------|-------------|
| `src/agents/` | `src/core/agents/` |
| `src/orchestrator/` | `src/core/orchestrator/` |
| `src/swarm/` | `src/core/swarm/` |
| `src/mcp/` | `src/core/mcp/` |
| `src/core/*` | `src/core/*` (merge) |
| `src/*` (other) | `src/core/*` |
| `lapa-ide-void/src/vs/workbench/contrib/lapa/browser/` | `src/ide-integration/browser/` |
| `lapa-ide-void/src/vs/workbench/contrib/lapa/common/` | `src/ide-integration/common/` |
| `lapa-ide-void/src/vs/workbench/contrib/lapa/electron-main/` | `src/ide-integration/electron-main/` |
| `lapa-ide-void/extensions/lapa-swarm/src/extension.ts` | `src/extension/extension.ts` |
| `lapa-ide-void/extensions/lapa-swarm/src/ui/` | `src/extension/ui/` |

### TypeScript Path Mapping

Add to root `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@lapa/core/*": ["src/core/*"],
      "@lapa/core": ["src/core/index"],
      "@lapa/ide-integration/*": ["src/ide-integration/*"],
      "@lapa/extension/*": ["src/extension/*"]
    }
  }
}
```

### Import Path Updates

**Before:**
```typescript
// From IDE integration
import { EventBus } from '../../../extensions/lapa-swarm/src/core/event-bus';

// From extension
import { EventBus } from '../core/event-bus';
```

**After:**
```typescript
// From IDE integration
import { EventBus } from '../../../../../../src/core/event-bus';
// Or with path mapping:
import { EventBus } from '@lapa/core/event-bus';

// From extension
import { EventBus } from '../../core/event-bus';
// Or with path mapping:
import { EventBus } from '@lapa/core/event-bus';
```

---

## 📝 Migration Script

Create `scripts/consolidate-src-directories.js` to automate Phase 1:

```javascript
#!/usr/bin/env node
/**
 * Source Directory Consolidation Script
 * 
 * Moves files from multiple source directories into a single src/ structure:
 * - src/core/ - Core LAPA functionality
 * - src/ide-integration/ - IDE-specific integration
 * - src/extension/ - Extension-specific code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// TODO: Implement file movement logic
// 1. Create new directory structure
// 2. Move files with path preservation
// 3. Update import paths (Phase 2)
// 4. Verify no files lost
```

---

## ✅ Success Criteria

- [ ] All source code in single `src/` directory
- [ ] No duplicate code between directories
- [ ] All imports updated and working
- [ ] All builds passing
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Sync scripts removed
- [ ] Drift detection removed (or repurposed)

---

## 🔗 Related Documents

- [Source Directory Consolidation Decision](SOURCE_DIRECTORY_DECISION.md)
- [Source Directory Consolidation Analysis](SOURCE_DIRECTORY_CONSOLIDATION.md)
- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)

---

**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1 - Directory Structure Setup

