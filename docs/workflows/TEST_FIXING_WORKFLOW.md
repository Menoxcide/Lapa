# Comprehensive Test Fixing & Debugging Workflow

**Purpose:** Systematically identify, debug, and fix all failing tests to achieve 100% pass rate  
**Use Case:** Test suite has failures, need to achieve 100% pass rate  
**Orchestrator:** NEURAFORGE  
**Primary Agent:** TEST

**Agent Chain:** `TEST → DEBUGGER → CODER → TEST → REVIEWER → VALIDATOR → INTEGRATOR`

## Steps

### 1. TEST - Test Analysis & Failure Identification
- Run full test suite with detailed reporting
- Collect all failing tests
- Categorize failures by type (assertion, timeout, mock, integration, state, event bus)
- Identify patterns and root causes
- Prioritize fixes by impact
- Create failure analysis report
- Create fix plan with execution sequence

**Output:** Failure analysis report, categorized failures, fix plan  
**Quality Gate:** ✅ All failures identified, ✅ Failures categorized, ✅ Root causes analyzed

### 2. DEBUGGER - Root Cause Analysis & Bug Fixing
- Review each failure category
- Reproduce failures reliably
- Trace execution paths
- Identify root causes (not symptoms)
- Fix bugs systematically (assertion, timeout, mocks, integration, state, event bus)
- Create regression tests
- Document fixes

**Output:** Fixed code, bug fixes, regression tests  
**Quality Gate:** ✅ All root causes identified, ✅ Bugs fixed, ✅ Regression tests created

### 3. CODER - Code Fixes & Test Updates
- Review all code changes
- Update test code as needed
- Fix broken test implementations
- Update mocks to real implementations
- Remove placeholders
- Fix test isolation issues
- Validate fixes (syntax, TypeScript, lint)

**Output:** Fixed code, updated tests, validated codebase  
**Quality Gate:** ✅ All code fixes applied, ✅ Tests updated, ✅ Code compiles

### 4. TEST - Test Suite Validation & Re-run
- Run full test suite
- Verify all fixes work
- Check for new failures
- Validate test coverage (≥95%)
- Fix remaining failures iteratively
- Verify 100% pass rate
- Optimize test performance

**Output:** Test results, test metrics, coverage report  
**Quality Gate:** ✅ All tests passing (100%), ✅ Coverage ≥95%, ✅ Zero flaky tests

### 5. REVIEWER - Code & Test Review
- Review all code changes
- Check test quality
- Verify fix approaches
- Review code patterns
- Check code style consistency
- Verify best practices
- Review security implications
- Approve fixes

**Output:** Code review report, feedback, approval status  
**Quality Gate:** ✅ All changes reviewed, ✅ Code quality verified, ✅ Fixes approved

### 6. VALIDATOR - System-Wide Validation
- Review all changes
- Validate all fixes correct
- Validate test quality
- Check system state
- Validate integration
- Verify compliance

**Output:** Validation report, compliance status  
**Quality Gate:** ✅ All validations passing, ✅ System state valid, ✅ Integration verified

### 7. INTEGRATOR - Integration Verification
- Review integration requirements
- Verify all integrations working
- Check all system connections
- Run integration tests
- Validate system health
- Monitor system metrics

**Output:** Integration verification, system health report  
**Quality Gate:** ✅ All integrations verified, ✅ Integration tests passing, ✅ System healthy

## Iterative Fixing Loop

If failures remain after Step 4:
```
TEST identifies remaining failures
  ↓
DEBUGGER fixes remaining issues
  ↓
CODER updates code/tests
  ↓
TEST re-runs suite
  ↓
[Loop until 100% pass rate]
```

## Completion Criteria

✅ **All failures identified and categorized**  
✅ All root causes fixed  
✅ All code fixes applied  
✅ All tests updated  
✅ **100% test pass rate achieved**  
✅ Test coverage ≥95%  
✅ Tests reviewed and approved  
✅ System validated completely  
✅ Integrations verified  
✅ **Zero failing tests**

