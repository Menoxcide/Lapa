# Void → LAPA Retrofit Plan

**Date:** January 2025  
**Status:** 🚀 **READY TO BEGIN**

---

## 🎯 Goal

Retrofit `lapa-ide-void/src/vs/workbench/contrib/void` directory to remove all "Void" references and rename to "LAPA", including:
- Folder names (`void` → `lapa`)
- File names (if containing "void")
- Code references (variables, types, comments)
- Service names
- API names

---

## 📊 Current Structure Analysis

### Directory Structure
```
lapa-ide-void/src/vs/workbench/contrib/void/
├── browser/          → lapa/
│   ├── react/
│   ├── actionIDs.ts
│   ├── chatThreadService.ts
│   └── ...
├── common/           → lapa/
│   ├── chatThreadServiceTypes.ts
│   ├── voidSettingsService.ts  → lapaSettingsService.ts
│   └── ...
└── electron-main/    → lapa/
    ├── llmMessage/
    └── ...
```

### Files with "void" References
- **198 matches** found across 5 files
- Main areas:
  - `SidebarChat.tsx` (140 matches)
  - `lapa-commands.ts` (14 matches)
  - `sendLLMMessage.impl.ts` (9 matches)
  - `voidUpdateActions.ts` (26 matches)
  - `voidUpdateMainService.ts` (9 matches)

---

## 🏗️ Source Directory Consolidation Analysis

### Current Structure
```
lapa/
├── src/                          # Core LAPA source
├── packages/
│   ├── core/src/                 # Monorepo core (new)
│   └── ide-extension/src/       # Monorepo IDE extension (new)
├── extract/                      # Staging directory (temporary)
└── lapa-ide-void/
    ├── src/vs/workbench/contrib/void/  # IDE integration (baked-in)
    └── extensions/lapa-swarm/src/      # Extension (separate)
```

### Options

#### Option 1: Single Source Directory (Recommended) ⭐
**Structure:**
```
lapa/
├── src/                          # Single source of truth
│   ├── core/                     # Core LAPA functionality
│   ├── ide-integration/           # IDE-specific integration code
│   └── extension/                 # Extension-specific code
├── lapa-ide-void/
│   └── src/vs/workbench/contrib/lapa/  # Symlink or import from root src/
└── packages/                      # Monorepo packages (if using)
```

**Benefits:**
- ✅ Single source of truth
- ✅ No duplication
- ✅ Easier to maintain
- ✅ Clear separation of concerns

**Challenges:**
- ⚠️ Requires careful import path management
- ⚠️ Need to handle IDE-specific vs extension-specific code

#### Option 2: Separate Source Directories (Current)
**Structure:**
```
lapa/
├── src/                          # Core LAPA
├── lapa-ide-void/
│   ├── src/vs/workbench/contrib/lapa/  # IDE integration (baked-in)
│   └── extensions/lapa-swarm/src/      # Extension (separate)
```

**Benefits:**
- ✅ Clear separation: baked-in vs extension
- ✅ Independent development
- ✅ No import path conflicts

**Challenges:**
- ⚠️ Code duplication risk
- ⚠️ Need sync mechanism
- ⚠️ More complex maintenance

**Recommendation:** **Option 1** - Single source directory with clear subdirectories

---

## 📋 Retrofit Steps

### Phase 1: Directory Rename
1. Rename `void/` → `lapa/`
2. Update all import paths
3. Update VS Code contribution points

### Phase 2: File Rename
1. Rename files containing "void":
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

### Phase 3: Code References
1. Replace "void" in:
   - Type names (`IVoidSettingsService` → `ILAPASettingsService`)
   - Variable names (`voidSettings` → `lapaSettings`)
   - Service names (`VoidSettingsService` → `LAPASettingsService`)
   - Comments and documentation
   - String literals

### Phase 4: VS Code Integration
1. Update contribution points in `package.json`
2. Update action IDs
3. Update command IDs
4. Update view IDs
5. Update service registrations

### Phase 5: Testing
1. Build verification
2. Runtime testing
3. Integration testing
4. Regression testing

---

## 🔧 Implementation Script

Create automated script to:
1. Rename directories
2. Rename files
3. Replace code references
4. Update imports
5. Validate changes

---

## 📊 Extract Folder Analysis

### What is `/extract`?
**Purpose:** Staging directory for `extract-lapa.js` script

**Process:**
1. `extract-lapa.js` copies files from `src/` to `extract/`
2. Creates tar.gz archive
3. Builds TypeScript
4. Copies to final destination: `lapa-ide-void/extensions/lapa-swarm/src/`

**Status:** Temporary staging area - can be cleaned up after extraction

**Recommendation:** Keep for now, but document it's temporary

---

## 🎯 Success Criteria

- [ ] All "void" references removed
- [ ] Directory renamed to `lapa/`
- [ ] All files renamed
- [ ] All code references updated
- [ ] VS Code integration updated
- [ ] Build succeeds
- [ ] Tests pass
- [ ] No regression

---

## ⚠️ Risks

1. **Breaking Changes:** VS Code contribution points
2. **Import Paths:** Many files depend on current paths
3. **Service Registration:** Services registered by name
4. **Testing:** Need comprehensive testing

---

## 🔗 Related Documents

- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)
- [Source Directory Consolidation](SOURCE_DIRECTORY_CONSOLIDATION.md) (to be created)

---

**Last Updated:** January 2025  
**Status:** 🚀 **READY TO BEGIN**

