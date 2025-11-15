# Monorepo Migration - Next Steps Guide

**Date:** January 2025  
**Status:** Ready for Next Phase

---

## 🎯 Current Status

✅ **Phase 1 & 2 Complete:**
- Packages structure created
- Core source copied
- IDE-specific files extracted
- Workspace configuration ready

⏭️ **Ready for Phase 3:**
- Workspace setup
- Import updates
- Build testing

---

## 📋 Step-by-Step Next Steps

### Step 1: Update Root Package.json

**Action:** Replace root `package.json` with workspace version

```bash
# Backup current package.json
cp package.json package.json.backup

# Use workspace version
cp package.json.workspace package.json
```

**Or manually update:**
- Change `name` to `"lapa-monorepo"`
- Add `"private": true`
- Update `scripts` to use `pnpm -r` and `pnpm --filter`
- Remove most dependencies (they're in packages now)

### Step 2: Install Workspace Dependencies

```bash
pnpm install
```

This will:
- Install dependencies for all packages
- Link workspace packages
- Set up @lapa/core and @lapa/ide-extension

### Step 3: Update IDE Extension Imports

**File:** `packages/ide-extension/src/extension.ts`

**Current:**
```typescript
// Direct imports from local files
import { getSwarmManager } from './swarm/swarm-manager.ts';
```

**Update to:**
```typescript
// Import from @lapa/core
import { getSwarmManager } from '@lapa/core/swarm';
```

**Files to update:**
- `packages/ide-extension/src/extension.ts`
- Any other files that import core functionality

### Step 4: Test Core Package Build

```bash
cd packages/core
pnpm build
```

**Expected:**
- TypeScript compiles successfully
- Output in `packages/core/dist/`
- No errors

### Step 5: Test Extension Package Build

```bash
cd packages/ide-extension
pnpm build
```

**Expected:**
- TypeScript compiles successfully
- Can resolve @lapa/core imports
- Output in `packages/ide-extension/dist/`

### Step 6: Test Workspace Build

```bash
# From root
pnpm build
```

**Expected:**
- Both packages build successfully
- No errors

### Step 7: Update IDE Integration

**File:** `lapa-ide-void/extensions/lapa-swarm/package.json`

**Add dependency:**
```json
{
  "dependencies": {
    "@lapa/ide-extension": "workspace:*"
  }
}
```

**Update imports in extension:**
- Change from local imports to `@lapa/ide-extension`

### Step 8: Run Tests

```bash
# Test core
pnpm test:core

# Test extension
pnpm test:ide

# Test all
pnpm test
```

### Step 9: Verify No Drift

```bash
npm run drift:detect
npm run drift:ide
```

**Expected:**
- 100% sync
- No integration drift

### Step 10: Remove Old Source (After Validation)

**Only after everything works:**
```bash
# Backup first
git add -A
git commit -m "chore: monorepo migration complete"

# Remove old src/ (keep for now until fully validated)
# rm -rf src/
```

---

## 🔧 Quick Commands Reference

```bash
# Workspace commands
pnpm build              # Build all packages
pnpm build:core         # Build core only
pnpm build:ide          # Build IDE extension only
pnpm test               # Test all packages
pnpm test:core          # Test core only
pnpm test:ide           # Test IDE extension only
pnpm clean              # Clean all packages

# Drift detection
npm run drift:detect    # Check code drift
npm run drift:ide       # Check IDE integration drift
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module '@lapa/core'"
**Solution:**
- Run `pnpm install` from root
- Verify `pnpm-workspace.yaml` includes `packages/*`
- Check package.json has correct workspace dependency

### Issue 2: TypeScript errors in IDE extension
**Solution:**
- Verify `tsconfig.json` has `references` to core
- Check `composite: true` in both configs
- Run `pnpm build:core` first

### Issue 3: Build fails
**Solution:**
- Check TypeScript versions match
- Verify all dependencies installed
- Check for circular dependencies

---

## 📊 Validation Checklist

Before considering migration complete:

- [ ] Root package.json updated to workspace
- [ ] `pnpm install` succeeds
- [ ] Core package builds (`pnpm build:core`)
- [ ] Extension package builds (`pnpm build:ide`)
- [ ] All tests pass (`pnpm test`)
- [ ] No drift detected (`npm run drift:detect`)
- [ ] IDE integration works
- [ ] IDE extension can import from @lapa/core
- [ ] lapa-ide-void can use workspace packages
- [ ] Performance is maintained

---

## 🚨 Rollback Plan

If migration fails:

1. **Restore from backup:**
   ```bash
   git checkout pre-monorepo-migration-*
   ```

2. **Or restore package.json:**
   ```bash
   cp package.json.backup package.json
   ```

3. **Remove packages:**
   ```bash
   rm -rf packages/
   ```

---

## 🔗 Related Documents

- [Monorepo Migration Plan](MONOREPO_MIGRATION_PLAN.md)
- [Monorepo Migration Progress](MONOREPO_MIGRATION_PROGRESS.md)
- [Long-Term Sync Strategy](LONG_TERM_SYNC_STRATEGY.md)

---

**Last Updated:** January 2025  
**Status:** Ready for execution

