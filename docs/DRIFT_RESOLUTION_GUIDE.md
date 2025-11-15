# Code Drift Resolution Guide

**Last Updated:** January 2025

---

## 🎯 Overview

This guide helps you resolve code drift between:
- **LAPA Core** (`src/`)
- **LAPA-VOID IDE Integration** (`lapa-ide-void/extensions/lapa-swarm/src/`)

---

## 🔍 Detecting Drift

### Run Drift Detection

```bash
# Detect drift
npm run drift:detect

# Or directly
node scripts/detect-drift.js
```

**Output:**
- HTML report: `docs/reports/drift-report.html`
- JSON report: `docs/reports/drift-report.json`

### Understanding the Report

**Sync Percentage:**
- ✅ 95-100%: Excellent sync
- ⚠️ 80-94%: Minor drift
- ❌ <80%: Significant drift

**Drift Types:**
1. **Files Only in Core** - Need to sync to IDE
2. **Files Only in IDE** - Need to sync to core OR remove from IDE
3. **Files with Different Content** - Need to merge or choose version

---

## 🛠️ Resolution Strategies

### Strategy 1: Core → IDE Sync (Most Common)

**When to use:**
- Core has fixes/features that IDE needs
- Core is the source of truth

**Steps:**
```bash
# 1. Ensure core is up to date
git checkout main
git pull

# 2. Run extraction script
npm run extract

# 3. Verify sync
npm run drift:detect

# 4. Commit changes
git add lapa-ide-void/extensions/lapa-swarm/src/
git commit -m "chore: sync core code to IDE integration"
```

### Strategy 2: IDE → Core Sync (Less Common)

**When to use:**
- IDE has fixes that should be in core
- IDE-specific changes should be generalized

**Steps:**
```bash
# 1. Review IDE changes
git diff src/ lapa-ide-void/extensions/lapa-swarm/src/

# 2. Manually copy changes from IDE to core
# (Use your editor or git merge tools)

# 3. Verify changes
npm run drift:detect

# 4. Commit changes
git add src/
git commit -m "chore: sync IDE improvements to core"
```

### Strategy 3: Merge Conflicts

**When to use:**
- Both core and IDE have different changes to same file
- Need to combine both sets of changes

**Steps:**
```bash
# 1. Identify conflicting files from drift report

# 2. Use merge tool
# Option A: Manual merge
code src/path/to/file.ts
code lapa-ide-void/extensions/lapa-swarm/src/path/to/file.ts
# Compare and merge manually

# Option B: Use git merge
git checkout --ours src/path/to/file.ts  # Keep core version
# Then manually add IDE-specific changes

# 3. Sync merged version
npm run extract  # Core → IDE
# OR manually copy merged file to IDE

# 4. Verify
npm run drift:detect
```

### Strategy 4: Remove IDE-Only Files

**When to use:**
- IDE has files that shouldn't exist
- Files were added by mistake

**Steps:**
```bash
# 1. Review file from drift report
# 2. Determine if file should exist
# 3. If not needed, remove:
rm lapa-ide-void/extensions/lapa-swarm/src/path/to/file.ts

# 4. Verify
npm run drift:detect
```

---

## 📋 Common Scenarios

### Scenario 1: Bug Fix in Core

**Problem:** Fixed bug in core, but IDE still has old code

**Solution:**
```bash
npm run extract
npm run drift:detect  # Should show 100% sync
```

### Scenario 2: Feature Added to IDE

**Problem:** Added feature to IDE, but core doesn't have it

**Solution:**
1. Review if feature should be in core
2. If yes: Copy feature to core
3. If no: Document as IDE-specific
4. Run `npm run extract` to ensure core → IDE sync

### Scenario 3: Dependency Update

**Problem:** Updated dependency in core, but IDE has old version

**Solution:**
```bash
# 1. Update core package.json
# 2. Run npm install in core
npm install

# 3. Update IDE package.json manually or via extract
# 4. Run npm install in IDE
cd lapa-ide-void/extensions/lapa-swarm
npm install
cd ../../..

# 5. Verify
npm run drift:detect
```

### Scenario 4: Type Definition Changes

**Problem:** Updated types in core, but IDE types are outdated

**Solution:**
```bash
# Types are in src/, so extract should handle it
npm run extract

# But if types are IDE-specific, may need manual merge
```

---

## 🔄 Prevention

### Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for drift before commit
npm run drift:detect
if [ $? -ne 0 ]; then
  echo "❌ Drift detected! Run 'npm run extract' to fix."
  exit 1
fi
```

### Regular Sync Schedule

**Daily:**
- Run `npm run drift:detect` in CI/CD
- Review drift reports

**Weekly:**
- Run `npm run extract` to sync core → IDE
- Review and commit sync changes

**Before Releases:**
- Ensure 100% sync
- Run full drift detection
- Fix all drift issues

---

## 📊 Metrics

Track these metrics:
- **Sync Percentage:** Should be >95%
- **Drift Count:** Should be 0
- **Time to Resolve:** <1 day for critical drift

---

## 🚨 Critical Drift

**Immediate Action Required:**
- Sync percentage <80%
- Critical files have drift (core/orchestrator.ts, etc.)
- Runtime errors due to drift

**Steps:**
1. Stop development on affected areas
2. Run `npm run drift:detect`
3. Review drift report
4. Resolve drift immediately
5. Verify with tests
6. Commit fix

---

## 📝 Best Practices

1. **Always sync core → IDE** after core changes
2. **Review IDE changes** before committing
3. **Run drift detection** before PRs
4. **Document IDE-specific changes** clearly
5. **Keep sync percentage >95%** at all times

---

## 🔗 Related Documents

- [Code Drift Analysis](CODE_DRIFT_ANALYSIS.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Extraction Script](../scripts/extract-lapa.js)

---

**Last Updated:** January 2025

