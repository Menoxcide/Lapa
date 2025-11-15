# LAPA Command Integration Priorities

**Date:** January 2025  
**Status:** Planning Phase

---

## 🎯 Goal

Integrate all 21 missing LAPA commands into the IDE UI, prioritized by importance and usage frequency.

---

## 📊 Command Priority Analysis

### Tier 1: Critical Core Functionality (Week 1) 🔴

**Priority:** HIGHEST - Core swarm operations

1. **`lapa.swarm.start`** ⭐⭐⭐⭐⭐
   - **Usage:** Every session
   - **Impact:** Cannot use LAPA without this
   - **UI Location:** Main toolbar, command palette
   - **Status:** ❌ Missing

2. **`lapa.swarm.stop`** ⭐⭐⭐⭐⭐
   - **Usage:** Every session
   - **Impact:** Cannot stop swarm without this
   - **UI Location:** Main toolbar, status bar
   - **Status:** ❌ Missing

3. **`lapa.swarm.status`** ⭐⭐⭐⭐
   - **Usage:** Frequent (checking progress)
   - **Impact:** Users need to see swarm status
   - **UI Location:** Status bar, sidebar
   - **Status:** ❌ Missing

4. **`lapa.swarm.pause`** ⭐⭐⭐⭐
   - **Usage:** Common (pausing work)
   - **Impact:** Important for workflow control
   - **UI Location:** Main toolbar
   - **Status:** ❌ Missing

5. **`lapa.swarm.resume`** ⭐⭐⭐⭐
   - **Usage:** Common (resuming work)
   - **Impact:** Important for workflow control
   - **UI Location:** Main toolbar
   - **Status:** ❌ Missing

### Tier 2: Essential Features (Week 1-2) 🟡

**Priority:** HIGH - Frequently used features

6. **`lapa.enhancePrompt`** ⭐⭐⭐⭐
   - **Usage:** Very frequent
   - **Impact:** Core productivity feature
   - **UI Location:** Chat input, command palette
   - **Status:** ❌ Missing (but referenced in LAPASwarmViewPane)

7. **`lapa.git.generateCommit`** ⭐⭐⭐⭐
   - **Usage:** Every commit
   - **Impact:** High productivity gain
   - **UI Location:** Git panel, command palette
   - **Status:** ❌ Missing

8. **`lapa.settings.open`** ⭐⭐⭐
   - **Usage:** Occasional (configuration)
   - **Impact:** Users need to configure LAPA
   - **UI Location:** Settings menu, command palette
   - **Status:** ❌ Missing

9. **`lapa.swarm.configure`** ⭐⭐⭐
   - **Usage:** Occasional (setup)
   - **Impact:** Important for customization
   - **UI Location:** Settings, toolbar
   - **Status:** ❌ Missing

10. **`lapa.dashboard.open`** ⭐⭐⭐
    - **Usage:** Frequent (monitoring)
    - **Impact:** Users want to see dashboard
    - **UI Location:** Sidebar, command palette
    - **Status:** ❌ Missing

### Tier 3: Important Features (Week 2) 🟢

**Priority:** MEDIUM - Useful but not critical

11. **`lapa.swarm.restore`** ⭐⭐⭐
    - **Usage:** Occasional (session restore)
    - **Impact:** Useful for continuity
    - **UI Location:** Session menu
    - **Status:** ❌ Missing

12. **`lapa.swarm.listSessions`** ⭐⭐⭐
    - **Usage:** Occasional (session management)
    - **Impact:** Useful for session management
    - **UI Location:** Session menu
    - **Status:** ❌ Missing

13. **`lapa.personas.list`** ⭐⭐⭐
    - **Usage:** Occasional (persona selection)
    - **Impact:** Useful for persona management
    - **UI Location:** Persona panel
    - **Status:** ❌ Missing

14. **`lapa.personas.reload`** ⭐⭐
    - **Usage:** Rare (reloading personas)
    - **Impact:** Low - mostly for development
    - **UI Location:** Persona panel
    - **Status:** ❌ Missing

15. **`lapa.workflow.generate`** ⭐⭐⭐
    - **Usage:** Occasional (workflow creation)
    - **Impact:** Useful for automation
    - **UI Location:** Workflow menu
    - **Status:** ❌ Missing

### Tier 4: Advanced Features (Week 3) 🔵

**Priority:** LOW - Nice to have

16. **`lapa.commandPalette.ai`** ⭐⭐
    - **Usage:** Occasional (AI search)
    - **Impact:** Convenience feature
    - **UI Location:** Command palette
    - **Status:** ❌ Missing

17. **`lapa.marketplace.open`** ⭐⭐
    - **Usage:** Rare (browsing marketplace)
    - **Impact:** Low - mostly for discovery
    - **UI Location:** Marketplace menu
    - **Status:** ❌ Missing

18. **`lapa.roi.open`** ⭐⭐
    - **Usage:** Occasional (analytics)
    - **Impact:** Useful for power users
    - **UI Location:** Analytics menu
    - **Status:** ❌ Missing

19. **`lapa.taskHistory.open`** ⭐⭐
    - **Usage:** Occasional (history review)
    - **Impact:** Useful for tracking
    - **UI Location:** History menu
    - **Status:** ❌ Missing

### Tier 5: Premium Features (Week 3) 💎

**Priority:** LOW - Premium only

20. **`lapa.swarm.upgrade`** ⭐⭐
    - **Usage:** One-time (upgrading)
    - **Impact:** Important for monetization
    - **UI Location:** Upgrade prompt, settings
    - **Status:** ❌ Missing

21. **`lapa.swarm.activateLicense`** ⭐
    - **Usage:** One-time (activation)
    - **Impact:** Important for premium users
    - **UI Location:** Settings, upgrade flow
    - **Status:** ❌ Missing

---

## 📅 Integration Schedule

### Week 1: Core Functionality
**Target:** 5 commands (Tier 1)
- `lapa.swarm.start`
- `lapa.swarm.stop`
- `lapa.swarm.status`
- `lapa.swarm.pause`
- `lapa.swarm.resume`

### Week 1-2: Essential Features
**Target:** 5 commands (Tier 2)
- `lapa.enhancePrompt`
- `lapa.git.generateCommit`
- `lapa.settings.open`
- `lapa.swarm.configure`
- `lapa.dashboard.open`

### Week 2: Important Features
**Target:** 5 commands (Tier 3)
- `lapa.swarm.restore`
- `lapa.swarm.listSessions`
- `lapa.personas.list`
- `lapa.personas.reload`
- `lapa.workflow.generate`

### Week 3: Advanced & Premium
**Target:** 6 commands (Tier 4 & 5)
- `lapa.commandPalette.ai`
- `lapa.marketplace.open`
- `lapa.roi.open`
- `lapa.taskHistory.open`
- `lapa.swarm.upgrade`
- `lapa.swarm.activateLicense`

---

## 🎯 Success Metrics

| Tier | Commands | Target Week | Status |
|------|----------|-------------|--------|
| Tier 1 | 5 | Week 1 | ⏭️ Pending |
| Tier 2 | 5 | Week 1-2 | ⏭️ Pending |
| Tier 3 | 5 | Week 2 | ⏭️ Pending |
| Tier 4 | 4 | Week 3 | ⏭️ Pending |
| Tier 5 | 2 | Week 3 | ⏭️ Pending |
| **Total** | **21** | **3 weeks** | **0%** |

---

## 🔗 Related Documents

- [IDE Integration Drift Analysis](IDE_INTEGRATION_DRIFT_ANALYSIS.md)
- [IDE Integration Drift Summary](IDE_INTEGRATION_DRIFT_SUMMARY.md)

---

**Last Updated:** January 2025  
**Status:** Ready for implementation

