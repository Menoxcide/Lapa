# Void Directory Restoration and Retrofit Plan

**Date:** January 2025  
**Status:** 🔄 **IN PROGRESS**

---

## 🎯 The Situation

### What We Found:
- ✅ `lapa-ide-void/src/vs/workbench/contrib/void/` exists with **101 files**
- ❌ `lapa-ide-void/src/vs/workbench/contrib/lapa/` is **EMPTY**
- ⚠️ The retrofit was supposed to rename `void/` → `lapa/` but it didn't happen correctly

### Why This Matters:
- This is the **baked-in IDE integration** (like Void did to VS Code)
- Contains browser process, common services, and electron-main code
- This is what makes LAPA truly "baked in" to the IDE
- Without this, LAPA can only work as an extension

---

## 📊 Current Structure

```
lapa-ide-void/src/vs/workbench/contrib/
├── void/                    # ✅ EXISTS (101 files) - NEEDS RETROFIT
│   ├── browser/             # Browser process integration
│   │   ├── void.contribution.ts
│   │   ├── sidebarPane.ts
│   │   ├── quickEditActions.ts
│   │   ├── react/            # React components
│   │   └── ...
│   ├── common/              # Shared services
│   │   ├── voidSettingsService.ts
│   │   ├── voidModelService.ts
│   │   └── ...
│   └── electron-main/        # Main process
│       ├── voidUpdateMainService.ts
│       └── ...
│
└── lapa/                    # ❌ EMPTY - TARGET FOR RETROFIT
```

---

## 🔧 Retrofit Plan

### Phase 1: Copy and Rename Directory ✅

1. **Copy** `void/` → `lapa/` (preserve all files)
2. **Keep** `void/` temporarily (for reference)
3. **Verify** all 101 files copied

### Phase 2: Rename Files

Rename all files containing "void" to "lapa":

**Browser:**
- `void.contribution.ts` → `lapa.contribution.ts`
- `voidCommandBarService.ts` → `lapaCommandBarService.ts`
- `voidOnboardingService.ts` → `lapaOnboardingService.ts`
- `voidSelectionHelperWidget.ts` → `lapaSelectionHelperWidget.ts`
- `voidSettingsPane.ts` → `lapaSettingsPane.ts`
- `voidUpdateActions.ts` → `lapaUpdateActions.ts`
- `voidSCMService.ts` → `lapaSCMService.ts`
- `media/void.css` → `media/lapa.css`

**Common:**
- `voidSettingsService.ts` → `lapaSettingsService.ts`
- `voidSettingsTypes.ts` → `lapaSettingsTypes.ts`
- `voidModelService.ts` → `lapaModelService.ts`
- `voidSCMTypes.ts` → `lapaSCMTypes.ts`
- `voidUpdateService.ts` → `lapaUpdateService.ts`
- `voidUpdateServiceTypes.ts` → `lapaUpdateServiceTypes.ts`

**Electron-Main:**
- `voidUpdateMainService.ts` → `lapaUpdateMainService.ts`
- `voidSCMMainService.ts` → `lapaSCMMainService.ts`

**React Components:**
- `void-editor-widgets-tsx/` → `lapa-editor-widgets-tsx/`
- `void-onboarding/` → `lapa-onboarding/`
- `void-settings-tsx/` → `lapa-settings-tsx/`
- `void-tooltip/` → `lapa-tooltip/`
- `VoidCommandBar.tsx` → `LapaCommandBar.tsx`
- `VoidSelectionHelper.tsx` → `LapaSelectionHelper.tsx`
- `VoidOnboarding.tsx` → `LapaOnboarding.tsx`
- `VoidTooltip.tsx` → `LapaTooltip.tsx`

### Phase 3: Update Code References

Replace all code references:

1. **Type Names:**
   - `IVoidSettingsService` → `ILAPASettingsService`
   - `VoidSettingsService` → `LAPASettingsService`
   - `VoidModelService` → `LAPAModelService`
   - etc.

2. **Variable Names:**
   - `voidSettings` → `lapaSettings`
   - `voidModel` → `lapaModel`
   - etc.

3. **Service IDs:**
   - `'void.settings'` → `'lapa.settings'`
   - `'void.model'` → `'lapa.model'`
   - etc.

4. **Import Paths:**
   - `'./contrib/void/...'` → `'./contrib/lapa/...'`
   - `'../void/...'` → `'../lapa/...'`

5. **CSS Classes:**
   - `.void-*` → `.lapa-*`
   - `void-icon` → `lapa-icon`

6. **Comments:**
   - "Void" → "LAPA"
   - "void" → "lapa" (where appropriate)

### Phase 4: Update IDE Integration Points

1. **workbench.common.main.ts:**
   ```typescript
   // Change from:
   import './contrib/void/browser/void.contribution.js';
   
   // To:
   import './contrib/lapa/browser/lapa.contribution.js';
   ```

2. **package.json build scripts:**
   ```json
   // Update paths from void/ to lapa/
   "buildreact": "cd ./src/vs/workbench/contrib/lapa/browser/react/ && ..."
   ```

3. **Service Registrations:**
   - Update all service IDs
   - Update all command IDs
   - Update all view IDs

### Phase 5: Integration with LAPA Core

1. **Import LAPA Core:**
   ```typescript
   // In lapa.contribution.ts or services
   import { SwarmManager } from '../../../../../../src/core/swarm/swarm-manager';
   import { EventBus } from '../../../../../../src/core/event-bus';
   ```

2. **Connect Services:**
   - Connect IDE services to LAPA core
   - Use LAPA swarm instead of Void's agent system
   - Integrate LAPA memory and orchestration

### Phase 6: Cleanup

1. **Remove** `void/` directory (after verification)
2. **Update** documentation
3. **Test** build and runtime

---

## 🎯 Success Criteria

- [ ] All 101 files copied to `lapa/`
- [ ] All files renamed (void → lapa)
- [ ] All code references updated
- [ ] IDE imports updated to use `lapa/`
- [ ] Build succeeds
- [ ] Runtime works
- [ ] LAPA core integrated
- [ ] `void/` directory removed

---

## ⚠️ Important Notes

1. **Keep `void/` temporarily** - Don't delete until retrofit is verified
2. **Test incrementally** - Test after each phase
3. **Backup first** - Ensure git commit before starting
4. **Integration points** - Pay special attention to service registrations

---

## 🔗 Related Documents

- [Void → LAPA Retrofit Plan](VOID_TO_LAPA_RETROFIT_PLAN.md)
- [Architecture Clarification](ARCHITECTURE_CLARIFICATION.md)
- [Source Directory Decision](SOURCE_DIRECTORY_DECISION.md)

---

**Last Updated:** January 2025  
**Status:** Ready to Execute

