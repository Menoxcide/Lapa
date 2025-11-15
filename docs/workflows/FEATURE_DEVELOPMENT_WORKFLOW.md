# Feature Development Workflow

**Purpose:** End-to-end feature development from idea to production with NEURAFORGE orchestration  
**Use Case:** New feature request, feature from brainstorm  
**Orchestrator:** NEURAFORGE  
**Primary Agent:** FEATURE

**Agent Chain (Standard):** `PLANNER → ARCHITECT → FEATURE → CODER → REVIEWER → TEST → INTEGRATOR → DOCUMENTATION_SPECIALIST → DEPLOYER`

**Agent Chain (Enhanced):** `WEB_RESEARCH_HYBRID → PLANNER → ARCHITECT → FEATURE → CODER → REVIEWER → TEST → INTEGRATOR → DOCUMENTATION_SPECIALIST → DEPLOYER`

## Steps

### 0. WEB_RESEARCH_HYBRID - Knowledge Base Research (Optional Enhanced)
- Query knowledge base for related research findings
- Research best practices for feature domain
- Search for existing solutions and patterns
- Gather implementation examples
- Compile research findings into knowledge package

**Output:** Research findings package, best practices, patterns  
**Quality Gate:** Research comprehensive, knowledge base queried, findings compiled

### 1. PLANNER - Feature Discovery & Planning
- Parse feature description
- Read from brainstorm (docs/BRAINSTORM_IDEAS.md)
- Review similar features in codebase
- Identify dependencies
- Check free/pro tier requirements
- Incorporate research findings (if enhanced)
- Decompose into sub-tasks
- Create workflow sequence
- Assess risks using research knowledge

**Output:** Feature specification, implementation roadmap, task decomposition, agent assignment plan  
**Quality Gate:** ✅ Feature requirements clearly defined, ✅ Integration points identified, ✅ Dependencies mapped, ✅ Effort estimated

### 2. ARCHITECT - Architecture & Design
- Review feature specification
- Analyze existing architecture
- Research architectural patterns from knowledge base (if enhanced)
- Create system design
- Define interfaces/types
- Plan integration points
- Design data flow
- Create ADR for feature
- Write design doc (docs/designs/[feature-name].md)

**Output:** Architecture design document, ADR, interface definitions, integration plan  
**Quality Gate:** ✅ Architecture follows LAPA-VOID patterns, ✅ Interfaces clearly defined, ✅ Integration strategy sound, ✅ Design document complete

### 3. FEATURE - Implementation
- Review design document
- Implement core functionality
- Follow existing patterns
- Integrate with memory systems (Memori Engine)
- Integrate with event bus (LAPAEventBus)
- Write tests (TDD)
- CODER assists with complex code
- ARCHITECT reviews implementation

**Output:** Feature implementation code, unit tests (99.7%+ coverage), integration tests, system integrations  
**Quality Gate:** ✅ Code follows patterns, ✅ Tests written (TDD), ✅ Memory integrated, ✅ Events published, ✅ Errors handled

### 4. REVIEWER - Code Review & Quality Assurance
- Review code quality
- Check style consistency
- Verify architecture compliance
- Check TypeScript strict mode
- Verify lint rules
- Review error handling
- Check security vulnerabilities
- Verify performance
- Provide feedback
- FEATURE addresses feedback

**Output:** Code review report, feedback, issue fixes, quality improvements, approval for testing  
**Quality Gate:** ✅ Zero lint errors, ✅ TypeScript strict mode, ✅ Code style consistent, ✅ Best practices followed

### 5. TEST - Testing & Validation
- Review feature code
- Create test suite (70% unit, 20% integration, 10% E2E)
- Run test suite
- Check coverage (99.7%+)
- FEATURE fixes failing tests
- VALIDATOR validates tests
- Run full test suite

**Output:** Comprehensive test suite, test coverage report (99.7%+), test execution results  
**Quality Gate:** ✅ 99.7%+ test coverage, ✅ All tests passing, ✅ Edge cases covered, ✅ Integration tested

### 6. INTEGRATOR - Integration & Optimization
- Review implementation
- Merge with main codebase
- Update dependencies
- Configure systems
- TEST runs regression tests
- OPTIMIZER optimizes performance (latency <1s, memory <500MB)
- Verify no regressions

**Output:** Integrated feature, regression test results, performance metrics, optimization report  
**Quality Gate:** ✅ Feature integrated, ✅ No regressions, ✅ Performance targets met, ✅ All systems working

### 7. DOCUMENTATION_SPECIALIST - Documentation
- Review implementation
- Update FEATURE_OVERVIEW.md
- Create usage guide
- Add code examples
- Document API (JSDoc/TSDoc)
- Write troubleshooting guide
- FEATURE reviews documentation

**Output:** Feature documentation, usage guide, code examples, API documentation  
**Quality Gate:** ✅ Documentation complete, ✅ Usage examples provided, ✅ API documented, ✅ Architecture explained

### 8. DEPLOYER - Deployment Preparation
- Review all deliverables
- Check quality gates
- Validate readiness
- Create deployment plan
- Define rollback strategy
- Plan release notes
- TEST runs final validation
- Generate release notes

**Output:** Deployment plan, release notes, deployment validation, rollback strategy  
**Quality Gate:** ✅ All quality gates passed, ✅ Deployment plan ready, ✅ Release notes complete, ✅ Feature ready for deployment

## Completion Criteria

✅ Research findings gathered (Enhanced - Optional)  
✅ Feature requirements clearly defined  
✅ Architecture designed and documented  
✅ Feature implemented completely  
✅ Code reviewed and approved  
✅ Tests comprehensive and passing (99.7%+ coverage)  
✅ Feature integrated successfully  
✅ Performance optimized (<1s latency, <500MB memory)  
✅ Documentation complete  
✅ Feature ready for deployment

## Execution Commands

**Start Feature Development:**
```
/neuraforge NEURAFORGE Feature Development Workflow [feature-name]
```

**Monitor Workflow:**
```
/neuraforge NEURAFORGE Monitor Feature Workflow [workflow-id]
```

