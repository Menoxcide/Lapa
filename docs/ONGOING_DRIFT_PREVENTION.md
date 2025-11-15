# Ongoing Drift Prevention Guide

**Date:** January 2025  
**Status:** Active

---

## 🎯 Goal

Establish processes to prevent code drift and IDE integration drift going forward.

---

## 📋 Regular Checks

### Daily
- **Automated:** CI/CD runs drift detection on every PR
- **Manual:** Run before committing major changes
  ```bash
  npm run drift:detect
  npm run drift:ide
  ```

### Weekly
- **Review:** Check drift reports from CI/CD
- **Action:** Fix any drift detected
- **Documentation:** Update if structure changes

### Before Releases
- **Full Check:** Run all drift detection
- **Verification:** Ensure 100% sync
- **Documentation:** Update release notes

---

## 🔧 Automated Checks

### CI/CD Integration

**File:** `.github/workflows/drift-check.yml`

**Checks:**
- Code drift (core ↔ IDE extension)
- IDE integration drift (commands/types/config)
- Fails build if drift detected
- Comments on PRs with drift details

**Frequency:**
- On every PR
- On every push to main/develop
- Daily scheduled (2 AM UTC)

### Pre-Commit Hooks (Optional)

**File:** `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Check for drift before commit
npm run drift:detect
if [ $? -ne 0 ]; then
  echo "❌ Drift detected! Run 'npm run extract' to fix."
  exit 1
fi
```

---

## 📊 Drift Detection Commands

### Code Drift
```bash
# Detect drift between core and IDE extension
npm run drift:detect

# View report
open docs/reports/drift-report.html
```

### IDE Integration Drift
```bash
# Detect drift in IDE integration (commands/types/config)
npm run drift:ide

# View report
cat docs/reports/ide-integration-drift-report.json
```

### Full Check
```bash
# Run both checks
npm run drift:detect && npm run drift:ide
```

---

## 🛠️ Fixing Drift

### Code Drift (Core → IDE)

**If core has changes:**
```bash
npm run extract  # Sync core → IDE
npm run drift:detect  # Verify sync
```

**If IDE has changes that should be in core:**
1. Review changes
2. Copy to core manually
3. Run `npm run extract` to sync back
4. Verify with `npm run drift:detect`

### IDE Integration Drift

**If commands missing:**
1. Review `docs/COMMAND_INTEGRATION_PRIORITIES.md`
2. Add command handler to SidebarChat.tsx
3. Add UI integration
4. Test command execution
5. Run `npm run drift:ide` to verify

**If types/config drift:**
1. Review drift report
2. Sync type definitions
3. Verify config structure
4. Update documentation

---

## 📝 Best Practices

### 1. Always Sync After Core Changes
```bash
# After making changes to src/
npm run extract
npm run drift:detect
```

### 2. Check Integration After Adding Commands
```bash
# After adding new command to extension
npm run drift:ide
# Add integration if missing
```

### 3. Document IDE-Specific Changes
- Mark IDE-only files clearly
- Update `.driftignore` if needed
- Document why file is IDE-only

### 4. Regular Reviews
- Weekly drift report review
- Monthly architecture review
- Quarterly full audit

---

## 🚨 Red Flags

**Immediate action required if:**
- Sync percentage drops below 95%
- Critical files have drift
- Commands/types/config mismatch
- Runtime errors due to drift

**Action:**
1. Stop development on affected areas
2. Run full drift detection
3. Fix drift immediately
4. Verify with tests
5. Document fix

---

## 📊 Metrics to Track

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| Code Sync % | >95% | Daily (CI/CD) |
| IDE Integration % | 100% | Weekly |
| Drift Issues | 0 | Daily (CI/CD) |
| Command Coverage | 100% | Weekly |

---

## 🔗 Related Documents

- [Code Drift Analysis](CODE_DRIFT_ANALYSIS.md)
- [Drift Resolution Guide](DRIFT_RESOLUTION_GUIDE.md)
- [IDE Integration Drift Analysis](IDE_INTEGRATION_DRIFT_ANALYSIS.md)
- [Command Integration Priorities](COMMAND_INTEGRATION_PRIORITIES.md)

---

**Last Updated:** January 2025  
**Status:** Active

