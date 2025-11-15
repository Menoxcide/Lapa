# Refactoring Workflow

**Purpose:** Improve code quality through systematic refactoring  
**Use Case:** Code quality improvement, technical debt reduction, code modernization  
**Agent Chain:** `PLANNER → ARCHITECT → CODER → TEST → REVIEWER → VALIDATOR`

## Steps

### 1. PLANNER - Refactoring Planning
- Analyze refactoring needs
- Decompose refactoring into tasks
- Identify dependencies
- Plan refactoring sequence
- Assess risks
- Create refactoring plan

**Output:** Refactoring plan, task breakdown  
**Quality Gate:** Plan complete, all dependencies identified

### 2. ARCHITECT - Refactoring Architecture
- Design refactored architecture
- Create ADR for refactoring
- Plan component changes
- Design new interfaces
- Validate architecture
- Document refactoring design

**Output:** Refactoring architecture, ADR  
**Quality Gate:** Architecture designed, ADR created

### 3. CODER - Refactoring Implementation
- Write tests for current behavior
- Refactor code systematically
- Verify tests pass
- Maintain functionality
- Improve code quality
- Document refactoring

**Output:** Refactored code, tests, documentation  
**Quality Gate:** Code refactored, all tests passing, functionality maintained

### 4. TEST - Refactoring Validation
- Run full test suite
- Verify no regressions
- Check test coverage
- Optimize test performance
- Verify test quality

**Output:** Test results, validation status  
**Quality Gate:** All tests passing, no regressions

### 5. REVIEWER - Refactoring Review
- Review refactoring approach
- Verify code quality improvement
- Check architecture compliance
- Review documentation
- Approve refactoring

**Output:** Review feedback, approval status  
**Quality Gate:** Refactoring approved, quality improved

### 6. VALIDATOR - Refactoring Verification
- Validate refactoring correctness
- Verify functionality maintained
- Check system state
- Validate no side effects
- Verify compliance

**Output:** Validation report, refactoring verification  
**Quality Gate:** Refactoring verified, functionality maintained

## Completion Criteria

✅ Refactoring planned comprehensively  
✅ Architecture designed  
✅ Code refactored systematically  
✅ All tests passing  
✅ No regressions  
✅ Code quality improved  
✅ Refactoring reviewed and approved

