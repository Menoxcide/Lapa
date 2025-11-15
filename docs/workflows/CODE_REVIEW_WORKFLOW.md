# Code Review Workflow

**Purpose:** Comprehensive code quality review  
**Use Case:** Pull request, code submission, review request  
**Agent Chain:** `REVIEWER → TEST → VALIDATOR → CODER (if changes needed)`

## Steps

### 1. REVIEWER - Code Review
- Analyze code context
- Review systematically: security, performance, code quality, test coverage, documentation, pattern compliance
- Identify issues and improvements
- Provide constructive feedback
- Approve or request changes

**Output:** Review report, feedback, approval status  
**Quality Gate:** All issues identified, feedback provided

### 2. TEST - Test Review
- Review test coverage
- Verify test quality
- Check test isolation
- Validate test performance
- Run test suite
- Verify all tests passing

**Output:** Test review, test status  
**Quality Gate:** Tests reviewed, all passing

### 3. VALIDATOR - Code Validation
- Validate code correctness
- Verify compliance
- Check validations
- Verify system state

**Output:** Validation report  
**Quality Gate:** Code validated, compliant

### 4. CODER - Fix Implementation (if needed)
- Understand requested changes
- Implement changes
- Verify quality gates
- Respond to review

**Output:** Updated code, fix verification  
**Quality Gate:** Changes implemented, quality gates passed

## Completion Criteria

✅ Code reviewed comprehensively  
✅ All issues identified  
✅ Constructive feedback provided  
✅ Tests reviewed and passing  
✅ Code validated  
✅ Changes implemented (if needed)  
✅ Code approved

