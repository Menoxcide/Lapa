# Monorepo Migration Plan

**Date:** January 2025  
**Status:** 🚀 **READY TO BEGIN**

---

## 🎯 Goal

Migrate from current structure to monorepo with workspaces to eliminate code duplication and establish single source of truth.

---

## 📊 Current Structure

```
lapa/
├── src/                          # Core LAPA code
├── lapa-ide-void/
│   ├── src/                      # IDE integration code
│   └── extensions/
│       └── lapa-swarm/
│           └── src/              # Extension code (duplicated from src/)
└── package.json
```

---

## 🏗️ Target Structure

```
lapa-monorepo/
├── packages/
│   ├── core/                     # @lapa/core
│   │   ├── src/                  # From root src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ide-extension/            # @lapa/ide-extension
│       ├── src/                  # IDE-specific wrapper
│       │   ├── extension.ts      # Entry point
│       │   └── ide-specific/     # IDE-only code
│       ├── dist/
│       ├── package.json          # Depends on @lapa/core
│       └── tsconfig.json
│
├── lapa-ide-void/                # Full IDE integration
│   ├── src/                      # IDE integration code
│   ├── extensions/
│   │   └── lapa-swarm/           # Symlink or workspace ref
│   └── package.json
│
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml
└── tsconfig.json                 # Root TypeScript config
```

---

## 📋 Migration Steps

### Phase 1: Preparation (Day 1-2)
- [x] Create migration plan
- [ ] Backup current state (git tag)
- [ ] Create packages/ directory structure
- [ ] Set up workspace configuration

### Phase 2: Core Package (Day 3-5)
- [ ] Create packages/core/
- [ ] Move src/ to packages/core/src/
- [ ] Create packages/core/package.json
- [ ] Update TypeScript configs
- [ ] Update build scripts
- [ ] Test core package builds

### Phase 3: IDE Extension Package (Day 6-8)
- [ ] Create packages/ide-extension/
- [ ] Extract IDE-specific code
- [ ] Create packages/ide-extension/package.json
- [ ] Set up workspace dependency
- [ ] Update imports
- [ ] Test extension package

### Phase 4: Workspace Configuration (Day 9-10)
- [ ] Configure pnpm workspaces
- [ ] Update root package.json
- [ ] Set up TypeScript project references
- [ ] Configure build system
- [ ] Test workspace builds

### Phase 5: IDE Integration Update (Day 11-13)
- [ ] Update lapa-ide-void to use workspace
- [ ] Update extension references
- [ ] Update build scripts
- [ ] Test IDE integration

### Phase 6: Testing & Validation (Day 14-16)
- [ ] Run all tests
- [ ] Verify builds
- [ ] Check drift detection
- [ ] Validate IDE integration
- [ ] Performance testing

### Phase 7: Documentation & Cleanup (Day 17-18)
- [ ] Update documentation
- [ ] Remove old scripts
- [ ] Update CI/CD
- [ ] Create migration guide
- [ ] Update README

### Phase 8: Final Validation (Day 19-20)
- [ ] Full system test
- [ ] Performance benchmarks
- [ ] Documentation review
- [ ] Team training (if needed)

---

## 🔧 Implementation Details

### Step 1: Workspace Configuration

**Root `package.json`:**
```json
{
  "name": "lapa-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "build:core": "pnpm --filter @lapa/core build",
    "build:ide": "pnpm --filter @lapa/ide-extension build",
    "test": "pnpm -r test",
    "sync": "pnpm run build && npm run drift:detect"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.9"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'packages/*'
```

### Step 2: Core Package Setup

**`packages/core/package.json`:**
```json
{
  "name": "@lapa/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest",
    "watch": "tsc -p tsconfig.json --watch"
  },
  "dependencies": {
    // Core dependencies from root package.json
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.9"
  }
}
```

### Step 3: IDE Extension Package Setup

**`packages/ide-extension/package.json`:**
```json
{
  "name": "@lapa/ide-extension",
  "version": "1.0.0",
  "main": "dist/extension.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest",
    "watch": "tsc -p tsconfig.json --watch"
  },
  "dependencies": {
    "@lapa/core": "workspace:*",
    "@types/vscode": "^1.85.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.9"
  }
}
```

---

## 🚨 Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Create feature branch
- Tag current state
- Incremental migration
- Extensive testing at each step

### Risk 2: Build System Complexity
**Mitigation:**
- Use proven tools (pnpm workspaces)
- Document build process
- Automate with scripts
- Test builds frequently

### Risk 3: Import Path Changes
**Mitigation:**
- Use TypeScript path mapping
- Update imports incrementally
- Test after each change
- Use find/replace carefully

---

## 📊 Success Criteria

- [ ] All code in packages/core/ (no duplication)
- [ ] IDE extension depends on @lapa/core
- [ ] All tests pass
- [ ] Builds succeed
- [ ] No drift detected
- [ ] IDE integration works
- [ ] Performance maintained or improved

---

## 🔗 Related Documents

- [Long-Term Sync Strategy](LONG_TERM_SYNC_STRATEGY.md)
- [Code Drift Analysis](CODE_DRIFT_ANALYSIS.md)
- [IDE Integration Drift Analysis](IDE_INTEGRATION_DRIFT_ANALYSIS.md)

---

**Last Updated:** January 2025  
**Status:** 🚀 **READY TO BEGIN**

