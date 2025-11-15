# Void → LAPA Retrofit - Manual Steps

**Date:** January 2025  
**Status:** Ready for Execution

---

## ⚠️ Permission Error Solution

The automated script failed due to file locks (files open in IDE). Use these manual steps:

---

## 📋 Step-by-Step Manual Retrofit

### Step 1: Close All Files
1. Close all files in IDE
2. Close IDE if necessary
3. Ensure no processes are using the files

### Step 2: Rename Directory (Manual)
```powershell
# In PowerShell (as Administrator if needed)
cd X:\Lapa\lapa-ide-void\src\vs\workbench\contrib
Rename-Item -Path "void" -NewName "lapa"
```

Or use File Explorer:
1. Navigate to `lapa-ide-void\src\vs\workbench\contrib\`
2. Right-click `void` folder
3. Rename to `lapa`

### Step 3: Update package.json Scripts
**File:** `lapa-ide-void/package.json`

**Update lines 13-14:**
```json
"buildreact": "cd ./src/vs/workbench/contrib/lapa/browser/react/ && node build.js && cd ../../../../../../../",
"watchreact": "cd ./src/vs/workbench/contrib/lapa/browser/react/ && node build.js --watch && cd ../../../../../../../",
```

### Step 4: Run Code Replacement Script
After renaming directory, run:
```bash
node scripts/retrofit-void-to-lapa.js
```

This will:
- Rename files
- Replace code references
- Update imports

### Step 5: Manual File Renames
If script doesn't catch all files, manually rename:

**In `lapa-ide-void/src/vs/workbench/contrib/lapa/common/`:**
- `voidSettingsService.ts` → `lapaSettingsService.ts`
- `voidUpdateService.ts` → `lapaUpdateService.ts`
- `voidUpdateServiceTypes.ts` → `lapaUpdateServiceTypes.ts`
- `voidSCMTypes.ts` → `lapaSCMTypes.ts`
- `voidSettingsTypes.ts` → `lapaSettingsTypes.ts`
- `voidModelService.ts` → `lapaModelService.ts`

**In `lapa-ide-void/src/vs/workbench/contrib/lapa/browser/`:**
- `voidSettingsPane.ts` → `lapaSettingsPane.ts`
- `voidCommandBarService.ts` → `lapaCommandBarService.ts`
- `voidOnboardingService.ts` → `lapaOnboardingService.ts`
- `voidSCMService.ts` → `lapaSCMService.ts`
- `voidSelectionHelperWidget.ts` → `lapaSelectionHelperWidget.ts`
- `void.contribution.ts` → `lapa.contribution.ts`
- `voidUpdateActions.ts` → `lapaUpdateActions.ts`

**In `lapa-ide-void/src/vs/workbench/contrib/lapa/electron-main/`:**
- `voidSCMMainService.ts` → `lapaSCMMainService.ts`
- `voidUpdateMainService.ts` → `lapaUpdateMainService.ts`

### Step 6: Update Import Paths
Search and replace in all files:
- `/void/` → `/lapa/`
- `from '...void/` → `from '...lapa/`
- `import '...void/` → `import '...lapa/`

### Step 7: Update Service Names
Search and replace:
- `VoidSettingsService` → `LAPASettingsService`
- `IVoidSettingsService` → `ILAPASettingsService`
- `voidSettingsService` → `lapaSettingsService`
- `voidSettings` → `lapaSettings`

(Continue for all services - see retrofit script for full list)

### Step 8: Update Action IDs
**File:** `lapa-ide-void/src/vs/workbench/contrib/lapa/browser/actionIDs.ts`

Search and replace:
- `VOID_` → `LAPA_`
- `void.` → `lapa.`

### Step 9: Update package.json Contributions
**File:** `lapa-ide-void/package.json`

Search for `contributes` section and update:
- View container IDs containing "void"
- View IDs containing "void"
- Command IDs containing "void"

### Step 10: Test Build
```bash
cd lapa-ide-void
npm run compile
```

### Step 11: Fix Any Remaining Issues
- Check for TypeScript errors
- Fix import paths
- Update service registrations
- Test runtime

---

## 🔍 Verification Checklist

- [ ] Directory renamed: `void/` → `lapa/`
- [ ] All files renamed
- [ ] All code references updated
- [ ] All import paths updated
- [ ] package.json scripts updated
- [ ] package.json contributions updated
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Runtime works
- [ ] No "void" references remain (grep search)

---

## 🔧 Automated Verification

After manual steps, run:
```bash
# Search for remaining "void" references
grep -r "void" lapa-ide-void/src/vs/workbench/contrib/lapa/ --include="*.ts" --include="*.tsx" | grep -v "avoid" | grep -v "void\s" | grep -v "void\."
```

Should return minimal results (only in comments or unrelated contexts).

---

**Last Updated:** January 2025  
**Status:** Ready for Manual Execution

