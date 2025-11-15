# Coding Workflow

**Purpose:** Complete feature implementation from requirements to production-ready code  
**Use Case:** Implement a new feature, function, or module  
**Agent Chain:** `PLANNER → ARCHITECT → CODER → TEST → REVIEWER → VALIDATOR → INTEGRATOR`

## Steps

### 1. PLANNER - Task Planning & Decomposition
- Analyze requirements completely
- Decompose into manageable sub-tasks
- Identify dependencies and constraints
- Prioritize tasks intelligently
- Create execution timeline
- Assess risks and mitigation strategies
- Document comprehensive plan

**Output:** Task breakdown, execution plan, dependencies map  
**Quality Gate:** Plan completeness ≥100%, all dependencies identified

### 2. ARCHITECT - System Architecture Design
- Analyze architectural requirements
- Research best practices and patterns
- Design system architecture (components, interfaces, data flow)
- Create Architectural Decision Record (ADR)
- Validate against requirements and constraints
- Document architecture (diagrams, specifications)
- Review for scalability, security, performance

**Output:** Architecture design, ADR, component specifications  
**Quality Gate:** Architecture documented, ADR created, scalability validated

### 3. CODER - Code Implementation
- Understand architecture and requirements
- Design implementation approach
- Write code (TDD preferred)
- Write comprehensive tests
- Run quality gates (lint, test, coverage)
- Refactor for quality
- Document code (JSDoc/TSDoc)
- Verify integration points

**Output:** Production-ready code, test suite, documentation  
**Quality Gate:** 99.7%+ test coverage, zero lint errors, all tests passing

### 4. TEST - Test Suite Validation
- Review test coverage and quality
- Verify test isolation and independence
- Check mock usage (≥90%)
- Validate async test coverage (≥95%)
- Ensure error path coverage (100%)
- Verify critical path coverage (100%)
- Run full test suite
- Identify and fix flaky tests
- Optimize test performance

**Output:** Validated test suite, test metrics, coverage report  
**Quality Gate:** 100% test pass rate, ≥95% coverage, zero flaky tests

### 5. REVIEWER - Code Review & Quality Assurance
- Analyze code context and requirements
- Review systematically: security, performance, code quality, test coverage, documentation, architecture compliance
- Identify issues and improvements
- Provide constructive feedback
- Verify fixes (if blocking)
- Approve or request changes

**Output:** Code review report, feedback, approval status  
**Quality Gate:** All issues identified, constructive feedback provided, quality gates checked

### 6. VALIDATOR - Validation & Verification
- Validate all inputs and outputs
- Verify configuration compliance
- Check data validation and integrity
- Validate schema compliance
- Verify business rule enforcement
- Validate integration points
- Check system state validation
- Verify compliance requirements

**Output:** Validation report, compliance status  
**Quality Gate:** 100% validation coverage, all validations passing

### 7. INTEGRATOR - System Integration
- Analyze integration requirements
- Understand system interfaces
- Design integration approach
- Implement integration
- Test integration comprehensively
- Verify integration success
- Document integration
- Monitor integration health

**Output:** Integrated system, integration tests, integration documentation  
**Quality Gate:** 100% integration success, all integration tests passing

## Completion Criteria

✅ All agents completed their steps  
✅ All quality gates passed  
✅ Code is production-ready  
✅ Tests are comprehensive and passing  
✅ Documentation is complete  
✅ Integration verified  
✅ All metrics meet targets

