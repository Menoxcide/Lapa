# Complete Agenda - All Tasks

**Date:** January 2025  
**Status:** Active

---

## 🎯 Current Priorities

### 1. Void → LAPA Retrofit (NEW - HIGH PRIORITY) 🔴
- [ ] Rename `void/` → `lapa/` directory
- [ ] Rename all files containing "void"
- [ ] Replace all code references
- [ ] Update VS Code contribution points
- [ ] Test build and runtime

### 2. Source Directory Consolidation (NEW - HIGH PRIORITY) 🔴
- [ ] Decide on approach (single vs separate)
- [ ] Reorganize `src/` structure
- [ ] Update imports
- [ ] Remove extract script (if consolidating)

### 3. Monorepo Migration (IN PROGRESS) 🟡
- [x] Create packages structure
- [x] Copy core source
- [x] Extract IDE-specific files
- [ ] Set up workspace (`pnpm install`)
- [ ] Test builds
- [ ] Update IDE integration

### 4. IDE Integration Drift (IN PROGRESS) 🟡
- [x] Create command handlers (22/22)
- [x] Create SwarmControlToolbar UI
- [ ] Add UI for remaining commands
- [ ] Test all integrations
- [ ] Verify no drift

---

## 📋 Detailed Task List

### Void → LAPA Retrofit

#### Phase 1: Directory & File Rename
- [ ] Close all files in IDE (to avoid permission errors)
- [ ] Rename `lapa-ide-void/src/vs/workbench/contrib/void/` → `lapa/`
- [ ] Rename files:
  - `voidSettingsService.ts` → `lapaSettingsService.ts`
  - `voidUpdateActions.ts` → `lapaUpdateActions.ts`
  - `voidUpdateMainService.ts` → `lapaUpdateMainService.ts`
  - `voidSettingsPane.ts` → `lapaSettingsPane.ts`
  - `voidCommandBarService.ts` → `lapaCommandBarService.ts`
  - `voidOnboardingService.ts` → `lapaOnboardingService.ts`
  - `voidSCMService.ts` → `lapaSCMService.ts`
  - `voidModelService.ts` → `lapaModelService.ts`
  - `voidSelectionHelperWidget.ts` → `lapaSelectionHelperWidget.ts`
  - `void.contribution.ts` → `lapa.contribution.ts`
  - `voidSCMMainService.ts` → `lapaSCMMainService.ts`
  - `voidUpdateService.ts` → `lapaUpdateService.ts`
  - `voidUpdateServiceTypes.ts` → `lapaUpdateServiceTypes.ts`
  - `voidSCMTypes.ts` → `lapaSCMTypes.ts`
  - `voidSettingsTypes.ts` → `lapaSettingsTypes.ts`

#### Phase 2: Code References
- [ ] Replace service names:
  - `VoidSettingsService` → `LAPASettingsService`
  - `IVoidSettingsService` → `ILAPASettingsService`
  - `voidSettingsService` → `lapaSettingsService`
- [ ] Replace type names
- [ ] Replace variable names
- [ ] Replace import paths (`/void/` → `/lapa/`)
- [ ] Replace action IDs (`VOID_` → `LAPA_`)
- [ ] Replace command IDs (`void.` → `lapa.`)
- [ ] Update comments

#### Phase 3: VS Code Integration
- [ ] Update `package.json` contribution points
- [ ] Update view container IDs
- [ ] Update view IDs
- [ ] Update command IDs
- [ ] Update service registrations

#### Phase 4: Testing
- [ ] Build verification
- [ ] Runtime testing
- [ ] Integration testing
- [ ] Regression testing

### Source Directory Consolidation

#### Decision Phase
- [x] Analyze current structure
- [x] Document options
- [ ] **Decision: Single source directory (recommended)**
- [ ] Get approval

#### Implementation Phase (if single source)
- [ ] Create `src/core/`, `src/ide-integration/`, `src/extension/`
- [ ] Move core files to `src/core/`
- [ ] Move IDE integration code to `src/ide-integration/`
- [ ] Move extension-specific code to `src/extension/`
- [ ] Update IDE integration imports
- [ ] Update extension imports
- [ ] Remove `extract/` folder (or document as temporary)
- [ ] Remove `extract-lapa.js` script
- [ ] Update drift detection (or remove)

### Monorepo Migration

#### Phase 3: Workspace Setup
- [ ] Install pnpm: `npm install -g pnpm`
- [ ] Run `pnpm install` to set up workspace
- [ ] Test core package build: `pnpm build:core`
- [ ] Test extension package build: `pnpm build:ide`
- [ ] Test all packages: `pnpm build`

#### Phase 4: IDE Integration Update
- [ ] Update `lapa-ide-void` to use workspace packages
- [ ] Update extension references
- [ ] Update build scripts
- [ ] Test IDE integration

### IDE Integration Drift

#### UI Integration
- [x] Tier 1: Swarm control toolbar ✅
- [ ] Tier 2: Settings, Dashboard, Git buttons
- [ ] Tier 3: Session, Persona, Workflow menus
- [ ] Tier 4: Marketplace, ROI, Task History panels
- [ ] Tier 5: Upgrade, License activation

#### Testing
- [ ] Test all command handlers
- [ ] Test UI interactions
- [ ] Verify error handling
- [ ] Run drift detection: `npm run drift:ide`

---

## 📊 Extract Folder Analysis

### What is `/extract`?
**Purpose:** Temporary staging directory for `extract-lapa.js` script

**Process:**
1. `extract-lapa.js` copies files from `src/` to `extract/`
2. Creates tar.gz archive (`lapa-v1.3.tar.gz`)
3. Builds TypeScript
4. Copies to final destination: `lapa-ide-void/extensions/lapa-swarm/src/`

**Status:** 
- ✅ Temporary staging area
- ⚠️ Can be cleaned up after extraction
- 📝 Documented in `extract/DIRECTIONS.md`

**Recommendation:** 
- Keep for now (used by extract script)
- Remove if consolidating to single source directory
- Document as temporary in README

---

## 🎯 Success Criteria

### Void → LAPA Retrofit
- [ ] Zero "void" references in `lapa-ide-void/src/vs/workbench/contrib/lapa/`
- [ ] All files renamed
- [ ] All code references updated
- [ ] Build succeeds
- [ ] Tests pass
- [ ] No regression

### Source Directory Consolidation
- [ ] Single source of truth established
- [ ] No code duplication
- [ ] Clear separation: core/ide-integration/extension
- [ ] All imports work
- [ ] Build succeeds

### Monorepo Migration
- [ ] Workspace set up
- [ ] All packages build
- [ ] IDE integration uses workspace
- [ ] No drift

### IDE Integration
- [ ] All 22 commands integrated
- [ ] All commands accessible from UI
- [ ] No drift detected

---

## 📅 Timeline

### This Week
1. **Void → LAPA Retrofit** (2-3 days)
   - Close files, run retrofit
   - Test and fix issues
   - Complete Phase 1-3

2. **Source Directory Decision** (1 day)
   - Review options
   - Make decision
   - Plan implementation

### Next Week
1. **Source Directory Consolidation** (if approved)
2. **Monorepo Workspace Setup**
3. **Complete IDE Integration UI**

### Following Week
1. **Testing & Validation**
2. **Documentation Updates**
3. **Final Cleanup**

---

## 🔗 Related Documents

- [Void → LAPA Retrofit Plan](VOID_TO_LAPA_RETROFIT_PLAN.md)
- [Source Directory Consolidation](SOURCE_DIRECTORY_CONSOLIDATION.md)
- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)
- [Command Integration Priorities](COMMAND_INTEGRATION_PRIORITIES.md)

---

**Last Updated:** January 2025  
**Status:** Active

