# Testing Workflow

**Purpose:** Create and validate comprehensive test suite  
**Use Case:** New module detected, test coverage improvement, test quality enhancement  
**Agent Chain:** `TEST → CODER (if tests need code changes) → REVIEWER → VALIDATOR`

## Steps

### 1. TEST - Test Creation & Validation
- Analyze code to test
- Create comprehensive test suite
- Ensure test isolation
- Add mocks (≥90% usage)
- Cover async paths (≥95%)
- Cover error paths (100%)
- Cover critical paths (100%)
- Optimize test performance
- Run test suite
- Fix flaky tests

**Output:** Test suite, test metrics, coverage report  
**Quality Gate:** Test coverage ≥95%, all tests passing, zero flaky tests

### 2. CODER - Code Fixes (if needed)
- Fix code issues identified by tests
- Improve code testability
- Fix failing tests
- Refactor for testability

**Output:** Fixed code, improved testability  
**Quality Gate:** All tests passing, code testable

### 3. REVIEWER - Test Review
- Review test quality
- Check test coverage
- Verify test patterns
- Review test documentation
- Provide feedback

**Output:** Test review, feedback  
**Quality Gate:** Tests reviewed, quality verified

### 4. VALIDATOR - Test Validation
- Validate test correctness
- Verify test coverage
- Check test compliance
- Validate test quality

**Output:** Validation report, test validation  
**Quality Gate:** Tests validated, coverage verified

## Completion Criteria

✅ Test suite created comprehensively  
✅ Test coverage ≥95%  
✅ All tests passing  
✅ Zero flaky tests  
✅ Tests reviewed and validated  
✅ Test quality verified

