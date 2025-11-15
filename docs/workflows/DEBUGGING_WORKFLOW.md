# Debugging Workflow

**Purpose:** Detect, analyze, and permanently fix bugs  
**Use Case:** Bug report, error detected, test failure  
**Agent Chain:** `DEBUGGER → TEST → REVIEWER → VALIDATOR`

## Steps

### 1. DEBUGGER - Bug Detection & Root Cause Analysis
- Reproduce bug reliably
- Analyze bug behavior and context
- Trace execution path
- Identify root cause (not symptom)
- Design fix approach
- Implement root cause fix
- Create regression test
- Verify fix completely
- Test edge cases
- Document bug and fix

**Output:** Bug fix, regression test, bug documentation  
**Quality Gate:** Bug reproduced, root cause fixed, regression test created

### 2. TEST - Regression Test Validation
- Verify regression test quality
- Ensure test catches the bug
- Check test isolation
- Validate test coverage
- Run full test suite
- Verify no regressions introduced
- Optimize test performance

**Output:** Validated regression test, test suite status  
**Quality Gate:** Regression test catches bug, all tests passing

### 3. REVIEWER - Code Review
- Review fix approach
- Verify root cause fix (not symptom)
- Check code quality
- Review regression test
- Verify fix completeness
- Check for similar issues
- Provide feedback
- Approve fix

**Output:** Review feedback, approval status  
**Quality Gate:** Fix approved, root cause verified, code quality checked

### 4. VALIDATOR - Fix Verification
- Validate fix correctness
- Verify bug is permanently fixed
- Check for similar bugs
- Validate system state
- Verify no side effects
- Check compliance

**Output:** Validation report, fix verification status  
**Quality Gate:** Fix verified, bug permanently resolved

## Completion Criteria

✅ Bug reproduced reliably  
✅ Root cause identified and fixed  
✅ Regression test created and passing  
✅ Fix reviewed and approved  
✅ Fix verified completely  
✅ Bug documented  
✅ Prevention strategy in place

