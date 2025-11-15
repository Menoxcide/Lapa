# 🎯 Agent Persona Action Workflows

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ ACTIVE  
**Project:** LAPA-VOID | **System:** NEURAFORGE Orchestration

---

## 🎯 Overview

This document defines intelligent, chain-of-thought workflows that orchestrate multiple agent personas in logical sequences to maximize success for specific task types. Each workflow is designed to leverage agent strengths, ensure quality gates, and optimize for both speed and excellence.

**Workflow Philosophy:**
- **Chain-of-Thought**: Each agent builds on previous agent's work
- **Quality Gates**: Every workflow includes validation and review steps
- **Autonomous Execution**: Workflows can run end-to-end without intervention
- **Adaptive**: Workflows can branch based on task complexity
- **Learning**: Each execution improves workflow efficiency

---

## 📋 Workflow Categories

### Core Development Workflows
1. **Coding Workflow** - Complete feature implementation
2. **Debugging Workflow** - Bug detection and resolution
3. **Feature Development Workflow** - End-to-end feature creation
4. **FEATURE_AGENT Implementation Workflow** - Autonomous feature implementation with sandbox mode (see `docs/workflows/FEATURE_AGENT_WORKFLOW.md`)
5. **Refactoring Workflow** - Code improvement and optimization

### Quality Assurance Workflows
6. **Code Review Workflow** - Comprehensive code quality check
7. **Testing Workflow** - Test suite creation and validation
8. **Validation Workflow** - System-wide validation

### Optimization Workflows
9. **Performance Optimization Workflow** - Performance improvement
10. **Architecture Review Workflow** - System architecture assessment

### Integration Workflows
11. **Integration Workflow** - System integration and connection
12. **Deployment Workflow** - Release and deployment

---

## 🔄 Workflow 1: Coding Workflow

**Purpose:** Complete feature implementation from requirements to production-ready code

**Use Case:** Implement a new feature, function, or module

**Agent Chain:**
```
PLANNER → ARCHITECT → CODER → TEST → REVIEWER → VALIDATOR → INTEGRATOR
```

### Workflow Steps

#### Step 1: PLANNER - Task Planning & Decomposition
**Agent:** PLANNER  
**Input:** Feature requirements, user story, or task description  
**Actions:**
- Analyze requirements completely
- Decompose into manageable sub-tasks
- Identify dependencies and constraints
- Prioritize tasks intelligently
- Create execution timeline
- Assess risks and mitigation strategies
- Document comprehensive plan

**Output:** Task breakdown, execution plan, dependencies map

**Quality Gate:** Plan completeness ≥100%, all dependencies identified

---

#### Step 2: ARCHITECT - System Architecture Design
**Agent:** ARCHITECT  
**Input:** Task plan from PLANNER  
**Actions:**
- Analyze architectural requirements
- Research best practices and patterns
- Design system architecture (components, interfaces, data flow)
- Create Architectural Decision Record (ADR)
- Validate against requirements and constraints
- Document architecture (diagrams, specifications)
- Review for scalability, security, performance

**Output:** Architecture design, ADR, component specifications

**Quality Gate:** Architecture documented, ADR created, scalability validated

---

#### Step 3: CODER - Code Implementation
**Agent:** CODER  
**Input:** Architecture design from ARCHITECT  
**Actions:**
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

---

#### Step 4: TEST - Test Suite Validation
**Agent:** TEST  
**Input:** Code and tests from CODER  
**Actions:**
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

---

#### Step 5: REVIEWER - Code Review & Quality Assurance
**Agent:** REVIEWER  
**Input:** Code and tests from CODER and TEST  
**Actions:**
- Analyze code context and requirements
- Review systematically:
  - Security vulnerabilities
  - Performance issues
  - Code quality and patterns
  - Test coverage and quality
  - Documentation completeness
  - Architecture compliance
- Identify issues and improvements
- Provide constructive feedback
- Verify fixes (if blocking)
- Approve or request changes

**Output:** Code review report, feedback, approval status

**Quality Gate:** All issues identified, constructive feedback provided, quality gates checked

---

#### Step 6: VALIDATOR - Validation & Verification
**Agent:** VALIDATOR  
**Input:** Reviewed code from REVIEWER  
**Actions:**
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

---

#### Step 7: INTEGRATOR - System Integration
**Agent:** INTEGRATOR  
**Input:** Validated code from VALIDATOR  
**Actions:**
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

---

### Workflow Completion Criteria

✅ All agents completed their steps  
✅ All quality gates passed  
✅ Code is production-ready  
✅ Tests are comprehensive and passing  
✅ Documentation is complete  
✅ Integration verified  
✅ All metrics meet targets

---

## 🐛 Workflow 2: Debugging Workflow

**Purpose:** Detect, analyze, and permanently fix bugs

**Use Case:** Bug report, error detected, test failure

**Agent Chain:**
```
DEBUGGER → TEST → REVIEWER → VALIDATOR
```

### Workflow Steps

#### Step 1: DEBUGGER - Bug Detection & Root Cause Analysis
**Agent:** DEBUGGER  
**Input:** Bug report, error message, test failure  
**Actions:**
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

---

#### Step 2: TEST - Regression Test Validation
**Agent:** TEST  
**Input:** Bug fix and regression test from DEBUGGER  
**Actions:**
- Verify regression test quality
- Ensure test catches the bug
- Check test isolation
- Validate test coverage
- Run full test suite
- Verify no regressions introduced
- Optimize test performance

**Output:** Validated regression test, test suite status

**Quality Gate:** Regression test catches bug, all tests passing

---

#### Step 3: REVIEWER - Code Review
**Agent:** REVIEWER  
**Input:** Bug fix from DEBUGGER  
**Actions:**
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

---

#### Step 4: VALIDATOR - Fix Verification
**Agent:** VALIDATOR  
**Input:** Reviewed fix from REVIEWER  
**Actions:**
- Validate fix correctness
- Verify bug is permanently fixed
- Check for similar bugs
- Validate system state
- Verify no side effects
- Check compliance

**Output:** Validation report, fix verification status

**Quality Gate:** Fix verified, bug permanently resolved

---

### Workflow Completion Criteria

✅ Bug reproduced reliably  
✅ Root cause identified and fixed  
✅ Regression test created and passing  
✅ Fix reviewed and approved  
✅ Fix verified completely  
✅ Bug documented  
✅ Prevention strategy in place

---

## 🚀 Workflow 3: Feature Development Workflow

**Purpose:** End-to-end feature development from idea to production with comprehensive NEURAFORGE orchestration

**Use Case:** New feature request, feature from brainstorm

**Orchestrator:** NEURAFORGE  
**Primary Agent:** FEATURE  

**Agent Chain (Standard):**
```
PLANNER → ARCHITECT → FEATURE → CODER → REVIEWER → TEST → INTEGRATOR → DOCUMENTATION_SPECIALIST → DEPLOYER
```

**Agent Chain (Enhanced with Research):**
```
WEB_RESEARCH_HYBRID → PLANNER → ARCHITECT → FEATURE → CODER → REVIEWER → TEST → INTEGRATOR → DOCUMENTATION_SPECIALIST → DEPLOYER
```

**Note:** The enhanced version incorporates WEB_RESEARCH_HYBRID's knowledge base to research best practices, existing solutions, and patterns before feature design. The workflow is orchestrated by NEURAFORGE with detailed quality gates at each stage.

### Workflow Steps

#### Step 0: WEB_RESEARCH_HYBRID - Knowledge Base Research (Enhanced Workflow - Optional)
**Orchestrator:** NEURAFORGE  
**Agent:** WEB_RESEARCH_HYBRID  
**Input:** Feature idea, user story, brainstorm item  
**Actions:**
- Query knowledge base for related research findings
- Research best practices for feature domain
- Search for existing solutions and patterns
- Gather implementation examples from research
- Find relevant papers, articles, and discussions
- Extract architectural patterns and techniques
- Identify potential pitfalls and lessons learned
- Compile research findings into knowledge package
- Send findings to PLANNER for informed planning

**Output:** Research findings package, knowledge base insights, best practices, patterns

**Quality Gate:** Research comprehensive, knowledge base queried, findings compiled

**Knowledge Base Integration:**
- Queries WEB_RESEARCH_HYBRID's accumulated knowledge base
- Searches for similar features, patterns, and solutions
- Retrieves relevant research from Reddit, arXiv, X, GitHub, etc.
- Provides context-aware research based on feature domain

---

#### Step 1: PLANNER - Feature Discovery & Planning
**Orchestrator:** NEURAFORGE  
**Agent:** PLANNER  
**Supporting Agents:** FEATURE, RESEARCH_WIZARD  
**Input:** Feature idea, user story, brainstorm item + Research findings (if enhanced)  
**Actions:**
- **NEURAFORGE receives feature request**
  - Parse feature description
  - Load FEATURE agent persona
  - Initialize workflow context
- **PLANNER analyzes feature**
  - Read from brainstorm (docs/BRAINSTORM_IDEAS.md)
  - Review similar features in codebase
  - Identify dependencies
  - Check free/pro tier requirements
  - **Incorporate research findings (if enhanced)**
- **RESEARCH_WIZARD (if needed)**
  - Research best practices
  - Find similar implementations
  - Gather technical references
- **PLANNER creates plan**
  - Decompose into sub-tasks
  - Estimate effort per task
  - Identify agent assignments
  - Create workflow sequence
  - **Consider research findings in task planning (if enhanced)**
  - **Assess risks using research knowledge (if enhanced)**
- **NEURAFORGE validates plan**
  - Check agent availability
  - Verify resource allocation
  - Approve workflow sequence

**Output:** Feature specification document, implementation roadmap, task decomposition, agent assignment plan, risk assessment

**Quality Gate:** ✅ Feature requirements clearly defined, ✅ Integration points identified, ✅ Dependencies mapped, ✅ Effort estimated, ✅ Agent assignments optimal

---

#### Step 2: ARCHITECT - Architecture & Design
**Orchestrator:** NEURAFORGE  
**Agent:** ARCHITECT  
**Supporting Agents:** FEATURE, PLANNER  
**Input:** Feature plan from PLANNER (includes research findings if enhanced)  
**Actions:**
- **ARCHITECT receives plan from PLANNER**
  - Review feature specification
  - Analyze existing architecture
  - Identify design patterns
- **ARCHITECT designs architecture**
  - **Research architectural patterns from knowledge base (if enhanced)**
  - **Apply proven patterns discovered in research (if enhanced)**
  - Create system design
  - Define interfaces/types
  - Plan integration points
  - Design data flow
  - Create ADR for feature
- **FEATURE validates design**
  - Check feature requirements match
  - Verify free/pro tier boundaries
  - Validate integration approach
- **ARCHITECT creates design document**
  - Write design doc (docs/designs/[feature-name].md)
  - Document decisions
  - Create diagrams if needed
- **NEURAFORGE reviews design**
  - Check architecture compliance
  - Verify LAPA-VOID patterns
  - Approve for implementation

**Output:** Architecture design document, ADR, interface definitions, integration plan, data flow diagrams (if needed), design decisions log

**Quality Gate:** ✅ Architecture follows LAPA-VOID patterns, ✅ Interfaces clearly defined, ✅ Integration strategy sound, ✅ Design document complete, ✅ Free/pro tier boundaries respected

---

#### Step 3: FEATURE - Implementation
**Orchestrator:** NEURAFORGE  
**Agent:** FEATURE  
**Supporting Agents:** CODER, ARCHITECT  
**Input:** Feature architecture from ARCHITECT  
**Actions:**
- **FEATURE receives design from ARCHITECT**
  - Review design document
  - Understand implementation plan
  - Prepare implementation context
- **FEATURE implements core functionality**
  - Create feature files
  - Implement core logic
  - Follow existing patterns
  - Integrate with memory systems
- **CODER assists with complex code**
  - Write optimized implementations
  - Handle edge cases
  - Ensure code quality
- **FEATURE integrates with systems**
  - Memory systems (Memori Engine)
  - Event bus (LAPAEventBus)
  - Agent system (if agent-related)
  - MCP protocol (if tool-related)
  - UI components (if user-facing)
- **FEATURE writes tests (TDD)**
  - Unit tests for functions
  - Integration tests for systems
  - Edge case coverage
- **ARCHITECT reviews implementation**
  - Check architecture compliance
  - Verify design adherence
  - Validate integration

**Output:** Feature implementation code, unit tests (99.7%+ coverage), integration tests, system integrations, error handling

**Quality Gate:** ✅ Code follows patterns, ✅ Tests written (TDD), ✅ Memory integrated, ✅ Events published, ✅ Errors handled, ✅ Integration complete

---

#### Step 4: REVIEWER - Code Review & Quality Assurance
**Orchestrator:** NEURAFORGE  
**Agent:** REVIEWER  
**Supporting Agents:** FEATURE, CODER  
**Input:** Code and tests from FEATURE and CODER  
**Actions:**
- **REVIEWER receives implementation**
  - Review code quality
  - Check style consistency
  - Verify architecture compliance
- **REVIEWER analyzes code**
  - Check TypeScript strict mode
  - Verify lint rules
  - Review error handling
  - Validate patterns
  - Check security vulnerabilities
  - Verify performance
- **REVIEWER provides feedback**
  - Identify issues
  - Suggest improvements
  - Create review report
- **FEATURE addresses feedback**
  - Fix issues
  - Implement improvements
  - Update code
- **REVIEWER validates fixes**
  - Re-review changes
  - Verify all issues resolved
  - Approve for testing

**Output:** Code review report, feedback, issue fixes, quality improvements, approval for testing

**Quality Gate:** ✅ Zero lint errors, ✅ TypeScript strict mode, ✅ Code style consistent, ✅ Best practices followed, ✅ Architecture compliant

---

#### Step 5: TEST - Testing & Validation
**Orchestrator:** NEURAFORGE  
**Agent:** TEST  
**Supporting Agents:** FEATURE, VALIDATOR  
**Input:** Reviewed code from REVIEWER  
**Actions:**
- **TEST receives implementation**
  - Review feature code
  - Understand test requirements
  - Plan test strategy
- **TEST creates test suite**
  - Unit tests (70% of tests)
  - Integration tests (20% of tests)
  - E2E tests (10% of tests)
- **TEST runs test suite**
  - Execute all tests
  - Check coverage (99.7%+)
  - Identify gaps
- **FEATURE fixes failing tests**
  - Address test failures
  - Add missing tests
  - Improve coverage
- **VALIDATOR validates tests**
  - Review test quality
  - Verify coverage
  - Validate test strategy
- **TEST validates feature**
  - Run full test suite
  - Verify all tests pass
  - Confirm coverage target

**Output:** Comprehensive test suite, test coverage report (99.7%+), test execution results, validation report

**Quality Gate:** ✅ 99.7%+ test coverage, ✅ All tests passing, ✅ Edge cases covered, ✅ Integration tested, ✅ E2E scenarios validated

---

#### Step 6: INTEGRATOR - Integration & Optimization
**Orchestrator:** NEURAFORGE  
**Agent:** INTEGRATOR  
**Supporting Agents:** FEATURE, OPTIMIZER, TEST  
**Input:** Validated code from TEST  
**Actions:**
- **INTEGRATOR receives tested feature**
  - Review implementation
  - Understand integration points
  - Plan integration strategy
- **INTEGRATOR integrates feature**
  - Merge with main codebase
  - Update dependencies
  - Configure systems
  - Verify connections
- **TEST runs regression tests**
  - Execute full test suite
  - Check for regressions
  - Validate existing features
- **OPTIMIZER optimizes performance**
  - Profile feature performance
  - Check latency (<1s target)
  - Verify memory (<500MB target)
  - Optimize bottlenecks
- **INTEGRATOR validates integration**
  - Check all systems working
  - Verify no regressions
  - Confirm performance targets
  - Validate memory usage

**Output:** Integrated feature, regression test results, performance metrics, optimization report, integration validation

**Quality Gate:** ✅ Feature integrated, ✅ No regressions, ✅ Performance targets met (<1s latency, <500MB memory), ✅ Memory efficient, ✅ All systems working

---

#### Step 7: DOCUMENTATION_SPECIALIST - Documentation
**Orchestrator:** NEURAFORGE  
**Agent:** DOCUMENTATION_SPECIALIST  
**Supporting Agents:** FEATURE  
**Input:** Integrated feature from INTEGRATOR  
**Actions:**
- **DOCUMENTATION_SPECIALIST receives feature**
  - Review implementation
  - Understand functionality
  - Plan documentation
- **DOCUMENTATION_SPECIALIST creates docs**
  - Update FEATURE_OVERVIEW.md
  - Create usage guide
  - Add code examples
  - Document API (JSDoc/TSDoc)
  - Write troubleshooting guide
- **FEATURE reviews documentation**
  - Verify accuracy
  - Check completeness
  - Validate examples
- **DOCUMENTATION_SPECIALIST finalizes**
  - Polish documentation
  - Ensure clarity
  - Complete all sections

**Output:** Feature documentation, usage guide, code examples, API documentation, troubleshooting guide

**Quality Gate:** ✅ Documentation complete, ✅ Usage examples provided, ✅ API documented, ✅ Architecture explained, ✅ Troubleshooting guide included

---

#### Step 8: DEPLOYER - Deployment Preparation
**Orchestrator:** NEURAFORGE  
**Agent:** DEPLOYER  
**Supporting Agents:** FEATURE, INTEGRATOR, TEST  
**Input:** Integrated feature from INTEGRATOR  
**Actions:**
- **DEPLOYER receives integrated feature**
  - Review all deliverables
  - Check quality gates
  - Plan deployment
- **DEPLOYER validates readiness**
  - Check all quality gates passed
  - Verify documentation complete
  - Confirm tests passing
  - Validate integration
- **DEPLOYER creates deployment plan**
  - Define deployment steps
  - Identify rollback strategy
  - Plan release notes
- **TEST runs final validation**
  - Execute smoke tests
  - Verify critical paths
  - Confirm readiness
- **DEPLOYER generates release notes**
  - Document feature changes
  - List improvements
  - Note breaking changes (if any)

**Output:** Deployment plan, release notes, deployment validation, rollback strategy

**Quality Gate:** ✅ All quality gates passed, ✅ Deployment plan ready, ✅ Release notes complete, ✅ Rollback strategy defined, ✅ Feature ready for deployment

---

### NEURAFORGE Orchestration Flow

**Complete Workflow Sequence:**
```
┌─────────────────────────────────────────────────────────────┐
│  NEURAFORGE: Feature Development Workflow Orchestration     │
└─────────────────────────────────────────────────────────────┘

0. WEB_RESEARCH_HYBRID → Knowledge Base Research (Optional Enhanced)
   ├─ Query knowledge base
   ├─ Research best practices
   └─ Compile findings
   ↓
1. PLANNER → Feature Discovery & Planning
   ├─ Analyze requirements
   ├─ Create roadmap
   └─ Decompose tasks
   ↓
2. ARCHITECT → Architecture & Design
   ├─ Design system
   ├─ Define interfaces
   └─ Create design doc
   ↓
3. FEATURE + CODER → Implementation
   ├─ Implement core
   ├─ Write tests (TDD)
   └─ Integrate systems
   ↓
4. REVIEWER → Code Review
   ├─ Review quality
   ├─ Check compliance
   └─ Approve code
   ↓
5. TEST → Testing & Validation
   ├─ Create test suite
   ├─ Run tests (99.7%+)
   └─ Validate functionality
   ↓
6. INTEGRATOR + OPTIMIZER → Integration & Optimization
   ├─ Integrate feature
   ├─ Optimize performance
   └─ Verify no regressions
   ↓
7. DOCUMENTATION_SPECIALIST → Documentation
   ├─ Create docs
   ├─ Write guides
   └─ Add examples
   ↓
8. DEPLOYER → Deployment Preparation
   ├─ Validate readiness
   ├─ Create deployment plan
   └─ Generate release notes
   ↓
✅ Feature Complete - Ready for Deployment
```

### Parallel Execution Opportunities

**Stage 3-4: Implementation & Review (Parallel)**
- FEATURE implements while REVIEWER reviews in parallel
- CODER assists FEATURE while REVIEWER reviews previous code

**Stage 5-6: Testing & Integration (Parallel)**
- TEST creates tests while INTEGRATOR prepares integration
- OPTIMIZER profiles while TEST runs tests

**Stage 7-8: Documentation & Deployment (Parallel)**
- DOCUMENTATION_SPECIALIST writes docs while DEPLOYER prepares deployment

### Agent Assignment Matrix

| Stage | Primary Agent | Supporting Agents | Orchestrator |
|-------|--------------|-------------------|--------------|
| 0. Research (Optional) | WEB_RESEARCH_HYBRID | - | NEURAFORGE |
| 1. Planning | PLANNER | FEATURE, RESEARCH_WIZARD | NEURAFORGE |
| 2. Architecture | ARCHITECT | FEATURE, PLANNER | NEURAFORGE |
| 3. Implementation | FEATURE | CODER, ARCHITECT | NEURAFORGE |
| 4. Review | REVIEWER | FEATURE, CODER | NEURAFORGE |
| 5. Testing | TEST | FEATURE, VALIDATOR | NEURAFORGE |
| 6. Integration | INTEGRATOR | FEATURE, OPTIMIZER, TEST | NEURAFORGE |
| 7. Documentation | DOCUMENTATION_SPECIALIST | FEATURE | NEURAFORGE |
| 8. Deployment | DEPLOYER | FEATURE, INTEGRATOR, TEST | NEURAFORGE |

### Workflow Completion Criteria

✅ **Research findings gathered from knowledge base** (Enhanced - Optional)  
✅ Feature requirements clearly defined  
✅ Architecture designed and documented  
✅ Feature implemented completely  
✅ Code reviewed and approved  
✅ Tests comprehensive and passing (99.7%+ coverage)  
✅ Feature integrated successfully  
✅ Performance optimized (<1s latency, <500MB memory)  
✅ Documentation complete  
✅ Feature ready for deployment  

### Enhanced Workflow Benefits

**With WEB_RESEARCH_HYBRID Integration:**
- ✅ **Informed Design**: Feature design based on best practices and research
- ✅ **Pattern Application**: Proven patterns from knowledge base applied
- ✅ **Risk Mitigation**: Common pitfalls identified through research
- ✅ **Innovation**: Latest techniques and approaches incorporated
- ✅ **Quality**: Research-backed implementation decisions
- ✅ **Efficiency**: Learn from existing solutions and avoid reinventing wheels

**With NEURAFORGE Orchestration:**
- ✅ **Optimal Agent Selection**: Right agent for each stage
- ✅ **Quality Gates**: Comprehensive validation at each stage
- ✅ **Parallel Execution**: Efficient workflow with parallel opportunities
- ✅ **Performance Monitoring**: Track metrics and optimize
- ✅ **Continuous Learning**: Improve workflow with each execution

### Execution Commands

**Start Feature Development:**
```
/neuraforge NEURAFORGE Feature Development Workflow [feature-name]
```

**Deploy Specific Stage:**
```
/neuraforge PLANNER [feature-name]
/neuraforge ARCHITECT [feature-name]
/neuraforge FEATURE [feature-name]
```

**Monitor Workflow:**
```
/neuraforge NEURAFORGE Monitor Feature Workflow [workflow-id]
```

### Metrics & Monitoring

**NEURAFORGE tracks:**
- Workflow execution time
- Agent handoff latency
- Quality gate pass rate
- Agent performance scores
- Feature completion rate

**Target Metrics:**
- Workflow execution: <30 minutes (simple), <2 hours (complex)
- Agent handoff latency: <1s
- Quality gate pass rate: 100%
- Agent performance: ≥9/10
- Feature completion: 100%

---

## ⚡ Workflow 4: Performance Optimization Workflow

**Purpose:** Identify and fix performance bottlenecks

**Use Case:** Performance degradation, optimization request, profiling results

**Agent Chain:**
```
OPTIMIZER → TEST → VALIDATOR → REVIEWER
```

### Workflow Steps

#### Step 1: OPTIMIZER - Performance Analysis & Optimization
**Agent:** OPTIMIZER  
**Input:** Performance issue, profiling data, optimization request  
**Actions:**
- Profile current performance
- Identify bottlenecks
- Analyze root causes
- Design optimization approach
- Implement optimizations
- Profile after optimization
- Measure improvement
- Verify no regressions
- Document optimizations

**Output:** Optimized code, performance metrics, optimization report

**Quality Gate:** Performance targets met, no regressions

---

#### Step 2: TEST - Optimization Validation
**Agent:** TEST  
**Input:** Optimized code from OPTIMIZER  
**Actions:**
- Run test suite
- Verify no test failures
- Check for performance regressions
- Validate optimization doesn't break functionality
- Run performance tests
- Verify test performance

**Output:** Test results, performance test validation

**Quality Gate:** All tests passing, no functionality regressions

---

#### Step 3: VALIDATOR - Optimization Verification
**Agent:** VALIDATOR  
**Input:** Optimized code and tests  
**Actions:**
- Validate optimization correctness
- Verify performance improvements
- Check system state
- Validate no side effects
- Verify compliance

**Output:** Validation report, optimization verification

**Quality Gate:** Optimizations verified, performance improved

---

#### Step 4: REVIEWER - Optimization Review
**Agent:** REVIEWER  
**Input:** Optimized code from OPTIMIZER  
**Actions:**
- Review optimization approach
- Verify performance improvements
- Check code quality
- Review documentation
- Approve optimizations

**Output:** Review feedback, approval status

**Quality Gate:** Optimizations approved, code quality maintained

---

### Workflow Completion Criteria

✅ Performance profiled and bottlenecks identified  
✅ Optimizations implemented  
✅ Performance targets met  
✅ No regressions introduced  
✅ Tests passing  
✅ Optimizations verified and approved

---

## 🏗️ Workflow 5: Architecture Review Workflow

**Purpose:** Comprehensive system architecture assessment and improvement

**Use Case:** Architecture review, technical debt assessment, scalability concerns

**Agent Chain:**
```
ARCHITECT → REVIEWER → VALIDATOR → PLANNER
```

### Workflow Steps

#### Step 1: ARCHITECT - Architecture Analysis
**Agent:** ARCHITECT  
**Input:** System to review, architecture concerns  
**Actions:**
- Review existing architecture
- Identify anti-patterns and issues
- Assess scalability and performance
- Check security vulnerabilities
- Evaluate technical debt
- Design improvements
- Create ADR for changes
- Plan refactoring
- Document improvements

**Output:** Architecture review, improvement plan, ADRs

**Quality Gate:** Architecture reviewed, improvements identified

---

#### Step 2: REVIEWER - Architecture Review Validation
**Agent:** REVIEWER  
**Input:** Architecture review from ARCHITECT  
**Actions:**
- Review architecture analysis
- Verify identified issues
- Check improvement plans
- Review ADRs
- Validate recommendations
- Provide feedback

**Output:** Review feedback, validation status

**Quality Gate:** Architecture review validated, recommendations approved

---

#### Step 3: VALIDATOR - Architecture Compliance Check
**Agent:** VALIDATOR  
**Input:** Architecture review and improvements  
**Actions:**
- Validate architecture compliance
- Verify improvement feasibility
- Check system constraints
- Validate scalability
- Verify security compliance

**Output:** Compliance report, validation status

**Quality Gate:** Architecture compliant, improvements validated

---

#### Step 4: PLANNER - Architecture Improvement Planning
**Agent:** PLANNER  
**Input:** Architecture improvements from ARCHITECT  
**Actions:**
- Plan architecture improvements
- Decompose into tasks
- Identify dependencies
- Create execution timeline
- Assess risks
- Prioritize improvements

**Output:** Improvement execution plan, task breakdown

**Quality Gate:** Improvement plan complete, all dependencies identified

---

### Workflow Completion Criteria

✅ Architecture reviewed comprehensively  
✅ Issues and improvements identified  
✅ ADRs created for changes  
✅ Improvement plan created  
✅ Architecture compliance verified

---

## 🔗 Workflow 6: Integration Workflow

**Purpose:** Integrate systems, APIs, or components seamlessly

**Use Case:** New system integration, API connection, component integration

**Agent Chain:**
```
INTEGRATOR → VALIDATOR → TEST → REVIEWER
```

### Workflow Steps

#### Step 1: INTEGRATOR - Integration Implementation
**Agent:** INTEGRATOR  
**Input:** Integration requirements, system/API to integrate  
**Actions:**
- Analyze integration requirements
- Understand system interfaces
- Design integration approach
- Implement integration
- Test integration comprehensively
- Verify integration success
- Document integration
- Monitor integration health

**Output:** Integrated system, integration tests, documentation

**Quality Gate:** Integration successful, tests passing

---

#### Step 2: VALIDATOR - Integration Validation
**Agent:** VALIDATOR  
**Input:** Integrated system from INTEGRATOR  
**Actions:**
- Validate integration correctness
- Verify interface compliance
- Check data validation
- Validate error handling
- Verify system state
- Check compliance

**Output:** Validation report, integration verification

**Quality Gate:** Integration validated, all validations passing

---

#### Step 3: TEST - Integration Testing
**Agent:** TEST  
**Input:** Integrated system from INTEGRATOR  
**Actions:**
- Review integration tests
- Run integration test suite
- Verify test coverage
- Check test quality
- Fix flaky tests
- Optimize test performance

**Output:** Test results, test validation

**Quality Gate:** All integration tests passing, coverage adequate

---

#### Step 4: REVIEWER - Integration Review
**Agent:** REVIEWER  
**Input:** Integrated system from INTEGRATOR  
**Actions:**
- Review integration code
- Check security
- Verify performance
- Review documentation
- Check architecture compliance
- Provide feedback
- Approve integration

**Output:** Review feedback, approval status

**Quality Gate:** Integration approved, all issues resolved

---

### Workflow Completion Criteria

✅ Integration implemented successfully  
✅ Integration tests passing  
✅ Integration validated  
✅ Integration reviewed and approved  
✅ Documentation complete  
✅ Integration health monitored

---

## 🚢 Workflow 7: Deployment Workflow

**Purpose:** Deploy code to production safely and reliably

**Use Case:** Release deployment, production update

**Agent Chain:**
```
VALIDATOR → TEST → REVIEWER → DEPLOYER → INTEGRATOR
```

### Workflow Steps

#### Step 1: VALIDATOR - Pre-Deployment Validation
**Agent:** VALIDATOR  
**Input:** Code to deploy  
**Actions:**
- Validate all configurations
- Verify system state
- Check compliance requirements
- Validate dependencies
- Verify data integrity
- Check security compliance

**Output:** Validation report, pre-deployment status

**Quality Gate:** All validations passing, ready for deployment

---

#### Step 2: TEST - Pre-Deployment Testing
**Agent:** TEST  
**Input:** Code to deploy  
**Actions:**
- Run full test suite
- Verify all tests passing
- Check test coverage
- Run integration tests
- Verify no regressions
- Run smoke tests

**Output:** Test results, test status

**Quality Gate:** All tests passing, coverage adequate

---

#### Step 3: REVIEWER - Deployment Review
**Agent:** REVIEWER  
**Input:** Code to deploy  
**Actions:**
- Review deployment readiness
- Check code quality
- Verify security
- Review documentation
- Check rollback plan
- Approve deployment

**Output:** Review feedback, deployment approval

**Quality Gate:** Deployment approved, all checks passed

---

#### Step 4: DEPLOYER - Deployment Execution
**Agent:** DEPLOYER  
**Input:** Approved code from REVIEWER  
**Actions:**
- Prepare deployment environment
- Execute deployment
- Monitor deployment process
- Verify deployment success
- Run post-deployment checks
- Document deployment

**Output:** Deployment status, deployment logs

**Quality Gate:** Deployment successful, verified

---

#### Step 5: INTEGRATOR - Post-Deployment Integration Check
**Agent:** INTEGRATOR  
**Input:** Deployed system  
**Actions:**
- Verify integration health
- Check system connections
- Monitor integration status
- Verify no integration issues
- Document integration status

**Output:** Integration status, health report

**Quality Gate:** Integration healthy, all connections verified

---

### Workflow Completion Criteria

✅ Pre-deployment validations passed  
✅ All tests passing  
✅ Deployment reviewed and approved  
✅ Deployment executed successfully  
✅ Post-deployment checks passed  
✅ Integration verified

---

## 🔄 Workflow 8: Code Review Workflow

**Purpose:** Comprehensive code quality review

**Use Case:** Pull request, code submission, review request

**Agent Chain:**
```
REVIEWER → TEST → VALIDATOR → CODER (if changes needed)
```

### Workflow Steps

#### Step 1: REVIEWER - Code Review
**Agent:** REVIEWER  
**Input:** Code to review  
**Actions:**
- Analyze code context
- Review systematically:
  - Security vulnerabilities
  - Performance issues
  - Code quality
  - Test coverage
  - Documentation
  - Pattern compliance
- Identify issues and improvements
- Provide constructive feedback
- Approve or request changes

**Output:** Review report, feedback, approval status

**Quality Gate:** All issues identified, feedback provided

---

#### Step 2: TEST - Test Review
**Agent:** TEST  
**Input:** Code and tests from review  
**Actions:**
- Review test coverage
- Verify test quality
- Check test isolation
- Validate test performance
- Run test suite
- Verify all tests passing

**Output:** Test review, test status

**Quality Gate:** Tests reviewed, all passing

---

#### Step 3: VALIDATOR - Code Validation
**Agent:** VALIDATOR  
**Input:** Reviewed code  
**Actions:**
- Validate code correctness
- Verify compliance
- Check validations
- Verify system state

**Output:** Validation report

**Quality Gate:** Code validated, compliant

---

#### Step 4: CODER - Fix Implementation (if needed)
**Agent:** CODER  
**Input:** Review feedback requiring changes  
**Actions:**
- Understand requested changes
- Implement changes
- Verify quality gates
- Respond to review

**Output:** Updated code, fix verification

**Quality Gate:** Changes implemented, quality gates passed

---

### Workflow Completion Criteria

✅ Code reviewed comprehensively  
✅ All issues identified  
✅ Constructive feedback provided  
✅ Tests reviewed and passing  
✅ Code validated  
✅ Changes implemented (if needed)  
✅ Code approved

---

## 🧪 Workflow 9: Testing Workflow

**Purpose:** Create and validate comprehensive test suite

**Use Case:** New module detected, test coverage improvement, test quality enhancement

**Agent Chain:**
```
TEST → CODER (if tests need code changes) → REVIEWER → VALIDATOR
```

---

## 🔧 Workflow 12: Comprehensive Test Fixing & Debugging Workflow

**Purpose:** Systematically identify, debug, and fix all failing tests to achieve 100% pass rate

**Use Case:** Test suite has failures, need to achieve 100% pass rate, comprehensive test debugging

**Orchestrator:** NEURAFORGE  
**Primary Agent:** TEST

**Agent Chain (Comprehensive):**
```
TEST → DEBUGGER → CODER → TEST → REVIEWER → VALIDATOR → INTEGRATOR
```

**Note:** This workflow orchestrates multiple agents to systematically fix all failing tests, ensuring no test is left behind until 100% pass rate is achieved.

### Workflow Steps

#### Step 1: TEST - Test Analysis & Failure Identification
**Orchestrator:** NEURAFORGE  
**Agent:** TEST  
**Input:** Test suite with failures  
**Actions:**
- **TEST receives test suite**
  - Run full test suite with detailed reporting
  - Collect all failing tests
  - Categorize failures by type:
    - Assertion failures
    - Timeout failures
    - Mock/placeholder issues
    - Integration failures
    - State management issues
    - Event bus issues
  - Identify patterns and root causes
  - Prioritize fixes by impact
  - Create failure analysis report
- **TEST creates fix plan**
  - Group related failures
  - Identify dependencies between fixes
  - Create execution sequence
  - Estimate fix complexity
- **NEURAFORGE validates plan**
  - Check agent availability
  - Verify resource allocation
  - Approve workflow sequence

**Output:** Failure analysis report, categorized failures, fix plan, priority matrix, execution sequence

**Quality Gate:** ✅ All failures identified, ✅ Failures categorized, ✅ Root causes analyzed, ✅ Fix plan complete

---

#### Step 2: DEBUGGER - Root Cause Analysis & Bug Fixing
**Orchestrator:** NEURAFORGE  
**Agent:** DEBUGGER  
**Supporting Agents:** TEST, CODER  
**Input:** Failure analysis from TEST  
**Actions:**
- **DEBUGGER receives failure analysis**
  - Review each failure category
  - Reproduce failures reliably
  - Trace execution paths
  - Identify root causes (not symptoms)
- **DEBUGGER fixes bugs systematically**
  - Fix assertion failures
  - Resolve timeout issues
  - Remove unnecessary mocks/placeholders
  - Fix integration issues
  - Resolve state management problems
  - Fix event bus issues
- **CODER assists with complex fixes**
  - Implement complex solutions
  - Handle edge cases
  - Refactor problematic code
- **DEBUGGER creates regression tests**
  - Add tests for fixed bugs
  - Ensure bugs don't regress
  - Document fixes

**Output:** Fixed code, bug fixes, regression tests, fix documentation

**Quality Gate:** ✅ All root causes identified, ✅ Bugs fixed, ✅ Regression tests created, ✅ Fixes documented

---

#### Step 3: CODER - Code Fixes & Test Updates
**Orchestrator:** NEURAFORGE  
**Agent:** CODER  
**Supporting Agents:** DEBUGGER, TEST  
**Input:** Bug fixes from DEBUGGER  
**Actions:**
- **CODER receives fixes**
  - Review all code changes
  - Update test code as needed
  - Fix broken test implementations
  - Update mocks to real implementations
  - Remove placeholders
  - Fix test isolation issues
- **CODER validates fixes**
  - Check syntax errors
  - Verify TypeScript compilation
  - Fix lint errors
  - Resolve type errors
- **TEST validates test updates**
  - Review test quality
  - Verify test correctness
  - Check test isolation

**Output:** Fixed code, updated tests, validated codebase

**Quality Gate:** ✅ All code fixes applied, ✅ Tests updated, ✅ Code compiles, ✅ No syntax errors, ✅ Type errors resolved

---

#### Step 4: TEST - Test Suite Validation & Re-run
**Orchestrator:** NEURAFORGE  
**Agent:** TEST  
**Supporting Agents:** DEBUGGER, VALIDATOR  
**Input:** Fixed code from CODER  
**Actions:**
- **TEST receives fixed codebase**
  - Run full test suite
  - Verify all fixes work
  - Check for new failures
  - Validate test coverage (≥95%)
  - Check test performance
- **TEST identifies remaining failures**
  - Analyze any new failures
  - Categorize remaining issues
  - Create follow-up fix plan
- **DEBUGGER fixes remaining issues**
  - Address new failures
  - Fix regression issues
  - Resolve edge cases
- **TEST iterates until 100% pass**
  - Re-run test suite
  - Fix remaining failures
  - Verify 100% pass rate
  - Optimize test performance

**Output:** Test results, remaining failures (if any), test metrics, coverage report

**Quality Gate:** ✅ All tests passing (100%), ✅ Coverage ≥95%, ✅ Test performance optimized, ✅ Zero flaky tests

---

#### Step 5: REVIEWER - Code & Test Review
**Orchestrator:** NEURAFORGE  
**Agent:** REVIEWER  
**Supporting Agents:** TEST, CODER  
**Input:** Fixed codebase with 100% passing tests  
**Actions:**
- **REVIEWER receives fixed codebase**
  - Review all code changes
  - Check test quality
  - Verify fix approaches
  - Review code patterns
- **REVIEWER analyzes quality**
  - Check code style consistency
  - Verify best practices
  - Review security implications
  - Check performance impact
  - Validate architecture compliance
- **REVIEWER provides feedback**
  - Identify any remaining issues
  - Suggest improvements
  - Create review report
- **CODER addresses feedback**
  - Fix identified issues
  - Implement improvements
  - Update code
- **REVIEWER validates fixes**
  - Re-review changes
  - Verify all issues resolved
  - Approve fixes

**Output:** Code review report, feedback, issue fixes, quality improvements, approval status

**Quality Gate:** ✅ All changes reviewed, ✅ Code quality verified, ✅ Architecture compliant, ✅ Security checked, ✅ All issues resolved, ✅ Fixes approved

---

#### Step 6: VALIDATOR - System-Wide Validation
**Orchestrator:** NEURAFORGE  
**Agent:** VALIDATOR  
**Supporting Agents:** REVIEWER, TEST  
**Input:** Reviewed codebase from REVIEWER  
**Actions:**
- **VALIDATOR receives fixed codebase**
  - Review all changes
  - Understand validation requirements
  - Plan validation strategy
- **VALIDATOR validates fixes**
  - Verify all fixes correct
  - Validate test quality
  - Check system state
  - Validate integration
- **VALIDATOR validates system state**
  - Check configuration compliance
  - Verify data integrity
  - Validate schema compliance
  - Check system constraints
- **TEST validates functionality**
  - Run smoke tests
  - Verify critical paths
  - Validate system health

**Output:** Validation report, compliance status, system health report, validation results

**Quality Gate:** ✅ All validations passing, ✅ System state valid, ✅ Integration verified, ✅ Compliance confirmed, ✅ System healthy

---

#### Step 7: INTEGRATOR - Integration Verification
**Orchestrator:** NEURAFORGE  
**Agent:** INTEGRATOR  
**Supporting Agents:** VALIDATOR, TEST  
**Input:** Validated codebase from VALIDATOR  
**Actions:**
- **INTEGRATOR receives validated codebase**
  - Review integration requirements
  - Understand system connections
  - Plan integration verification
- **INTEGRATOR verifies integrations**
  - Check all system connections
  - Verify API integrations
  - Validate service connections
  - Test external integrations
- **TEST runs integration tests**
  - Execute integration test suite
  - Verify integration functionality
  - Check for regressions
- **INTEGRATOR validates system health**
  - Check system performance
  - Verify resource usage
  - Monitor system metrics
  - Validate system stability

**Output:** Integration verification, integration tests results, system health report, performance metrics

**Quality Gate:** ✅ All integrations verified, ✅ Integration tests passing, ✅ System healthy, ✅ Performance maintained, ✅ No regressions

---

### NEURAFORGE Orchestration Flow

**Complete Workflow Sequence:**
```
┌─────────────────────────────────────────────────────────────┐
│  NEURAFORGE: Comprehensive Test Fixing & Debugging Workflow│
└─────────────────────────────────────────────────────────────┘

1. TEST → Test Analysis & Failure Identification
   ├─ Run test suite
   ├─ Categorize failures
   └─ Create fix plan
   ↓
2. DEBUGGER → Root Cause Analysis & Bug Fixing
   ├─ Reproduce failures
   ├─ Fix root causes
   └─ Create regression tests
   ↓
3. CODER → Code Fixes & Test Updates
   ├─ Fix code issues
   ├─ Update tests
   └─ Remove placeholders
   ↓
4. TEST → Test Suite Validation & Re-run
   ├─ Run test suite
   ├─ Fix remaining failures
   └─ Verify 100% pass rate
   ↓
5. REVIEWER → Code & Test Review
   ├─ Review changes
   ├─ Check quality
   └─ Approve fixes
   ↓
6. VALIDATOR → System-Wide Validation
   ├─ Validate fixes
   ├─ Check system state
   └─ Verify compliance
   ↓
7. INTEGRATOR → Integration Verification
   ├─ Verify integrations
   ├─ Check system health
   └─ Validate stability
   ↓
✅ 100% Test Pass Rate Achieved
```

### Iterative Fixing Loop

**If failures remain after Step 4:**
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

### Agent Assignment Matrix

| Stage | Primary Agent | Supporting Agents | Orchestrator |
|-------|--------------|-------------------|--------------|
| 1. Analysis | TEST | - | NEURAFORGE |
| 2. Debugging | DEBUGGER | TEST, CODER | NEURAFORGE |
| 3. Code Fixes | CODER | DEBUGGER, TEST | NEURAFORGE |
| 4. Validation | TEST | DEBUGGER, VALIDATOR | NEURAFORGE |
| 5. Review | REVIEWER | TEST, CODER | NEURAFORGE |
| 6. Validation | VALIDATOR | REVIEWER, TEST | NEURAFORGE |
| 7. Integration | INTEGRATOR | VALIDATOR, TEST | NEURAFORGE |

### Workflow Completion Criteria

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

### Execution Commands

**Start Test Fixing Workflow:**
```
/neuraforge NEURAFORGE Comprehensive Test Fixing Workflow
```

**Monitor Workflow:**
```
/neuraforge NEURAFORGE Monitor Test Fixing Workflow [workflow-id]
```

### Metrics & Monitoring

**NEURAFORGE tracks:**
- Initial failure count
- Failure categories
- Fix execution time
- Tests fixed per iteration
- Final pass rate (target: 100%)
- Test coverage maintained
- Performance impact

**Target Metrics:**
- Workflow execution: <2 hours (simple), <4 hours (complex)
- Agent handoff latency: <1s
- Quality gate pass rate: 100%
- **Final test pass rate: 100%**
- Test coverage maintained: ≥95%
- Zero regressions

---

### Workflow Steps

#### Step 1: TEST - Test Creation & Validation
**Agent:** TEST  
**Input:** Code to test, test requirements  
**Actions:**
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

---

#### Step 2: CODER - Code Fixes (if needed)
**Agent:** CODER  
**Input:** Test failures, testability issues  
**Actions:**
- Fix code issues identified by tests
- Improve code testability
- Fix failing tests
- Refactor for testability

**Output:** Fixed code, improved testability

**Quality Gate:** All tests passing, code testable

---

#### Step 3: REVIEWER - Test Review
**Agent:** REVIEWER  
**Input:** Test suite from TEST  
**Actions:**
- Review test quality
- Check test coverage
- Verify test patterns
- Review test documentation
- Provide feedback

**Output:** Test review, feedback

**Quality Gate:** Tests reviewed, quality verified

---

#### Step 4: VALIDATOR - Test Validation
**Agent:** VALIDATOR  
**Input:** Test suite from TEST  
**Actions:**
- Validate test correctness
- Verify test coverage
- Check test compliance
- Validate test quality

**Output:** Validation report, test validation

**Quality Gate:** Tests validated, coverage verified

---

### Workflow Completion Criteria

✅ Test suite created comprehensively  
✅ Test coverage ≥95%  
✅ All tests passing  
✅ Zero flaky tests  
✅ Tests reviewed and validated  
✅ Test quality verified

---

## 🔄 Workflow 10: Refactoring Workflow

**Purpose:** Improve code quality through systematic refactoring

**Use Case:** Code quality improvement, technical debt reduction, code modernization

**Agent Chain:**
```
PLANNER → ARCHITECT → CODER → TEST → REVIEWER → VALIDATOR
```

### Workflow Steps

#### Step 1: PLANNER - Refactoring Planning
**Agent:** PLANNER  
**Input:** Code to refactor, refactoring goals  
**Actions:**
- Analyze refactoring needs
- Decompose refactoring into tasks
- Identify dependencies
- Plan refactoring sequence
- Assess risks
- Create refactoring plan

**Output:** Refactoring plan, task breakdown

**Quality Gate:** Plan complete, all dependencies identified

---

#### Step 2: ARCHITECT - Refactoring Architecture
**Agent:** ARCHITECT  
**Input:** Refactoring plan from PLANNER  
**Actions:**
- Design refactored architecture
- Create ADR for refactoring
- Plan component changes
- Design new interfaces
- Validate architecture
- Document refactoring design

**Output:** Refactoring architecture, ADR

**Quality Gate:** Architecture designed, ADR created

---

#### Step 3: CODER - Refactoring Implementation
**Agent:** CODER  
**Input:** Refactoring architecture from ARCHITECT  
**Actions:**
- Write tests for current behavior
- Refactor code systematically
- Verify tests pass
- Maintain functionality
- Improve code quality
- Document refactoring

**Output:** Refactored code, tests, documentation

**Quality Gate:** Code refactored, all tests passing, functionality maintained

---

#### Step 4: TEST - Refactoring Validation
**Agent:** TEST  
**Input:** Refactored code from CODER  
**Actions:**
- Run full test suite
- Verify no regressions
- Check test coverage
- Optimize test performance
- Verify test quality

**Output:** Test results, validation status

**Quality Gate:** All tests passing, no regressions

---

#### Step 5: REVIEWER - Refactoring Review
**Agent:** REVIEWER  
**Input:** Refactored code from CODER  
**Actions:**
- Review refactoring approach
- Verify code quality improvement
- Check architecture compliance
- Review documentation
- Approve refactoring

**Output:** Review feedback, approval status

**Quality Gate:** Refactoring approved, quality improved

---

#### Step 6: VALIDATOR - Refactoring Verification
**Agent:** VALIDATOR  
**Input:** Refactored code from CODER  
**Actions:**
- Validate refactoring correctness
- Verify functionality maintained
- Check system state
- Validate no side effects
- Verify compliance

**Output:** Validation report, refactoring verification

**Quality Gate:** Refactoring verified, functionality maintained

---

### Workflow Completion Criteria

✅ Refactoring planned comprehensively  
✅ Architecture designed  
✅ Code refactored systematically  
✅ All tests passing  
✅ No regressions  
✅ Code quality improved  
✅ Refactoring reviewed and approved

---

## 🧹 Workflow 11: Project Cleaning & Consolidation Workflow

**Purpose:** Comprehensive project cleaning, archiving, consolidation, merging, purging, re-referencing, and pruning with maximum agent involvement

**Use Case:** Project cleanup, codebase consolidation, archive old code, merge duplicates, purge unused files, re-reference imports, prune dependencies

**Orchestrator:** NEURAFORGE  
**Primary Agent:** FILESYSTEM_EXPERT

**Agent Chain (Comprehensive):**
```
RESEARCH_WIZARD → PLANNER → ARCHITECT → FILESYSTEM_EXPERT → CODER → DEBUGGER → TEST → REVIEWER → VALIDATOR → INTEGRATOR → OPTIMIZER → DOCUMENTATION_SPECIALIST → DEPLOYER
```

**Note:** This workflow orchestrates all available agents to ensure comprehensive, safe, and validated project cleaning. Each agent contributes their expertise to maximize cleaning effectiveness while maintaining system integrity.

### Workflow Steps

#### Step 1: RESEARCH_WIZARD - Best Practices Research
**Orchestrator:** NEURAFORGE  
**Agent:** RESEARCH_WIZARD  
**Input:** Project cleaning request, cleanup goals  
**Actions:**
- Research project cleaning best practices
- Find patterns for safe codebase consolidation
- Research archive strategies and patterns
- Gather information on dependency pruning
- Research merge conflict resolution strategies
- Find re-referencing and import consolidation techniques
- Compile research findings into knowledge package
- Identify common pitfalls and warnings

**Output:** Research findings package, best practices guide, common pitfalls list, cleaning strategies

**Quality Gate:** ✅ Research comprehensive, ✅ Best practices identified, ✅ Pitfalls documented, ✅ Strategies compiled

---

#### Step 2: PLANNER - Cleaning Strategy & Planning
**Orchestrator:** NEURAFORGE  
**Agent:** PLANNER  
**Supporting Agents:** FILESYSTEM_EXPERT, RESEARCH_WIZARD  
**Input:** Cleaning request + Research findings from RESEARCH_WIZARD  
**Actions:**
- **NEURAFORGE receives cleaning request**
  - Parse cleaning goals (archive, consolidate, merge, purge, re-reference, prune)
  - Load FILESYSTEM_EXPERT agent persona
  - Initialize workflow context
- **PLANNER analyzes project**
  - Scan project structure
  - Identify cleaning opportunities:
    - Duplicate files/code
    - Unused files/dependencies
    - Outdated code
    - Dead code paths
    - Orphaned files
    - Broken references
    - Inconsistent imports
  - **Incorporate research findings**
- **PLANNER creates cleaning plan**
  - Decompose into cleaning tasks:
    - Archive tasks (what to archive, where)
    - Consolidation tasks (what to merge)
    - Purge tasks (what to delete)
    - Re-reference tasks (import fixes)
    - Pruning tasks (dependency removal)
  - Prioritize tasks by risk level
  - Create execution sequence
  - Identify dependencies between tasks
  - Plan rollback strategy
  - **Consider research best practices**
  - **Assess risks using research knowledge**
- **FILESYSTEM_EXPERT validates plan**
  - Check filesystem operations feasibility
  - Verify paths and permissions
  - Validate archive locations
- **NEURAFORGE validates plan**
  - Check agent availability
  - Verify resource allocation
  - Approve workflow sequence

**Output:** Comprehensive cleaning plan, task breakdown, risk assessment, execution roadmap, rollback strategy, priority matrix

**Quality Gate:** ✅ Cleaning goals clearly defined, ✅ All cleaning opportunities identified, ✅ Execution plan complete, ✅ Dependencies mapped, ✅ Risk assessment done, ✅ Rollback strategy defined

---

#### Step 3: ARCHITECT - Architecture Analysis & Impact Assessment
**Orchestrator:** NEURAFORGE  
**Agent:** ARCHITECT  
**Supporting Agents:** PLANNER, FILESYSTEM_EXPERT  
**Input:** Cleaning plan from PLANNER  
**Actions:**
- **ARCHITECT receives cleaning plan**
  - Review cleaning tasks
  - Analyze current architecture
  - Understand system dependencies
- **ARCHITECT assesses impact**
  - Map file dependencies
  - Identify architectural relationships
  - Assess consolidation impact
  - Evaluate merge feasibility
  - Check re-reference implications
  - Validate pruning safety
- **ARCHITECT designs cleaning architecture**
  - Plan file organization structure
  - Design consolidation approach
  - Create merge strategy
  - Plan archive structure
  - Design re-reference mapping
  - Create ADR for cleaning decisions
- **FILESYSTEM_EXPERT validates architecture**
  - Check filesystem constraints
  - Verify path structures
  - Validate archive locations
- **ARCHITECT creates impact report**
  - Document affected components
  - List breaking changes (if any)
  - Create migration guide
  - Document architectural decisions

**Output:** Architecture impact assessment, cleaning architecture design, ADR, dependency map, migration guide, impact report

**Quality Gate:** ✅ Architecture analyzed, ✅ Impact assessed, ✅ Dependencies mapped, ✅ Cleaning architecture designed, ✅ ADR created, ✅ Migration guide complete

---

#### Step 4: FILESYSTEM_EXPERT - Filesystem Operations Execution
**Orchestrator:** NEURAFORGE  
**Agent:** FILESYSTEM_EXPERT  
**Supporting Agents:** ARCHITECT, PLANNER  
**Input:** Cleaning architecture from ARCHITECT  
**Actions:**
- **FILESYSTEM_EXPERT receives architecture**
  - Review cleaning plan
  - Understand filesystem operations needed
  - Prepare execution context
- **FILESYSTEM_EXPERT creates backups**
  - Create full project backup
  - Snapshot current state
  - Document backup location
- **FILESYSTEM_EXPERT executes archiving**
  - Move files to archive locations
  - Create archive structure
  - Preserve file history
  - Document archived items
- **FILESYSTEM_EXPERT executes consolidation**
  - Merge duplicate files
  - Consolidate similar code
  - Combine related modules
  - Update file structure
- **FILESYSTEM_EXPERT executes purging**
  - Remove unused files
  - Delete dead code
  - Clean orphaned files
  - Remove temporary files
- **FILESYSTEM_EXPERT executes re-referencing**
  - Update import paths
  - Fix broken references
  - Consolidate imports
  - Update module references
- **FILESYSTEM_EXPERT executes pruning**
  - Remove unused dependencies
  - Clean package files
  - Update dependency lists
  - Remove orphaned packages
- **FILESYSTEM_EXPERT documents operations**
  - Log all filesystem changes
  - Create operation report
  - Document file movements
  - Record deletions

**Output:** Cleaned filesystem, archive structure, operation log, filesystem report, backup location

**Quality Gate:** ✅ All operations executed, ✅ Backups created, ✅ Operations logged, ✅ Filesystem cleaned, ✅ Archive structure created

---

#### Step 5: CODER - Code Fixes & Integration
**Orchestrator:** NEURAFORGE  
**Agent:** CODER  
**Supporting Agents:** FILESYSTEM_EXPERT, ARCHITECT  
**Input:** Cleaned filesystem from FILESYSTEM_EXPERT  
**Actions:**
- **CODER receives cleaned filesystem**
  - Review filesystem changes
  - Identify code issues
  - Understand integration needs
- **CODER fixes broken references**
  - Update import statements
  - Fix module paths
  - Correct file references
  - Update require statements
- **CODER fixes merge conflicts**
  - Resolve code conflicts
  - Integrate merged code
  - Fix duplicate definitions
  - Consolidate implementations
- **CODER updates code structure**
  - Refactor consolidated code
  - Update exports/imports
  - Fix namespace issues
  - Update type definitions
- **CODER validates code**
  - Check syntax errors
  - Verify TypeScript compilation
  - Fix lint errors
  - Resolve type errors
- **ARCHITECT reviews fixes**
  - Check architecture compliance
  - Verify integration correctness
  - Validate code structure

**Output:** Fixed code, updated imports, resolved conflicts, validated codebase, integration fixes

**Quality Gate:** ✅ All references fixed, ✅ Conflicts resolved, ✅ Code compiles, ✅ No syntax errors, ✅ Type errors resolved

---

#### Step 6: DEBUGGER - Issue Detection & Resolution
**Orchestrator:** NEURAFORGE  
**Agent:** DEBUGGER  
**Supporting Agents:** CODER, TEST  
**Input:** Fixed code from CODER  
**Actions:**
- **DEBUGGER receives fixed code**
  - Analyze codebase for issues
  - Identify potential problems
  - Check for regressions
- **DEBUGGER detects issues**
  - Find broken functionality
  - Identify missing dependencies
  - Detect runtime errors
  - Find integration problems
- **DEBUGGER analyzes root causes**
  - Trace issue origins
  - Identify cleaning-related bugs
  - Map problem dependencies
- **DEBUGGER fixes issues**
  - Resolve runtime errors
  - Fix missing dependencies
  - Correct integration issues
  - Restore broken functionality
- **CODER assists with complex fixes**
  - Implement complex solutions
  - Handle edge cases
- **DEBUGGER validates fixes**
  - Verify issue resolution
  - Test fixes
  - Document issues and fixes

**Output:** Issue fixes, bug resolution report, regression fixes, validated codebase

**Quality Gate:** ✅ All issues detected, ✅ Root causes identified, ✅ Issues fixed, ✅ Fixes validated, ✅ No regressions

---

#### Step 7: TEST - Comprehensive Testing & Validation
**Orchestrator:** NEURAFORGE  
**Agent:** TEST  
**Supporting Agents:** DEBUGGER, VALIDATOR  
**Input:** Fixed code from DEBUGGER  
**Actions:**
- **TEST receives cleaned codebase**
  - Review cleaning changes
  - Understand test requirements
  - Plan test strategy
- **TEST runs full test suite**
  - Execute all unit tests
  - Run integration tests
  - Execute E2E tests
  - Check test coverage
- **TEST identifies test failures**
  - Analyze failing tests
  - Identify cleaning-related failures
  - Map failures to cleaning operations
- **TEST fixes test issues**
  - Update test imports
  - Fix test references
  - Update test mocks
  - Correct test paths
- **TEST validates functionality**
  - Verify core functionality
  - Test critical paths
  - Validate integrations
  - Check edge cases
- **VALIDATOR validates tests**
  - Review test quality
  - Verify coverage
  - Validate test strategy
- **TEST creates regression tests**
  - Add tests for cleaning operations
  - Test archive functionality
  - Validate consolidation
  - Test purge safety

**Output:** Test results, test fixes, coverage report, regression tests, validation report

**Quality Gate:** ✅ All tests passing, ✅ Coverage maintained (≥95%), ✅ Functionality validated, ✅ Regression tests created, ✅ No test failures

---

#### Step 8: REVIEWER - Comprehensive Code Review
**Orchestrator:** NEURAFORGE  
**Agent:** REVIEWER  
**Supporting Agents:** TEST, CODER  
**Input:** Tested codebase from TEST  
**Actions:**
- **REVIEWER receives cleaned codebase**
  - Review all cleaning changes
  - Analyze code quality
  - Check architecture compliance
- **REVIEWER reviews cleaning operations**
  - Verify archive completeness
  - Check consolidation correctness
  - Validate purge safety
  - Review re-reference accuracy
  - Validate pruning correctness
- **REVIEWER analyzes code quality**
  - Check code style consistency
  - Verify best practices
  - Review security implications
  - Check performance impact
  - Validate architecture compliance
- **REVIEWER provides feedback**
  - Identify issues
  - Suggest improvements
  - Create review report
- **CODER addresses feedback**
  - Fix identified issues
  - Implement improvements
  - Update code
- **REVIEWER validates fixes**
  - Re-review changes
  - Verify all issues resolved
  - Approve cleaning

**Output:** Code review report, feedback, issue fixes, quality improvements, approval status

**Quality Gate:** ✅ All changes reviewed, ✅ Code quality verified, ✅ Architecture compliant, ✅ Security checked, ✅ All issues resolved, ✅ Cleaning approved

---

#### Step 9: VALIDATOR - System-Wide Validation
**Orchestrator:** NEURAFORGE  
**Agent:** VALIDATOR  
**Supporting Agents:** REVIEWER, TEST  
**Input:** Reviewed codebase from REVIEWER  
**Actions:**
- **VALIDATOR receives cleaned codebase**
  - Review all changes
  - Understand validation requirements
  - Plan validation strategy
- **VALIDATOR validates cleaning operations**
  - Verify archive integrity
  - Validate consolidation correctness
  - Check purge completeness
  - Validate re-reference accuracy
  - Verify pruning correctness
- **VALIDATOR validates system state**
  - Check configuration compliance
  - Verify data integrity
  - Validate schema compliance
  - Check system constraints
- **VALIDATOR validates integration**
  - Verify all integrations working
  - Check API compatibility
  - Validate interface compliance
  - Verify system connections
- **VALIDATOR validates compliance**
  - Check security compliance
  - Verify regulatory compliance
  - Validate standards compliance
- **TEST validates functionality**
  - Run smoke tests
  - Verify critical paths
  - Validate system health

**Output:** Validation report, compliance status, system health report, validation results

**Quality Gate:** ✅ All validations passing, ✅ System state valid, ✅ Integration verified, ✅ Compliance confirmed, ✅ System healthy

---

#### Step 10: INTEGRATOR - System Integration & Verification
**Orchestrator:** NEURAFORGE  
**Agent:** INTEGRATOR  
**Supporting Agents:** VALIDATOR, TEST, OPTIMIZER  
**Input:** Validated codebase from VALIDATOR  
**Actions:**
- **INTEGRATOR receives validated codebase**
  - Review integration requirements
  - Understand system connections
  - Plan integration verification
- **INTEGRATOR verifies integrations**
  - Check all system connections
  - Verify API integrations
  - Validate service connections
  - Test external integrations
- **TEST runs integration tests**
  - Execute integration test suite
  - Verify integration functionality
  - Check for regressions
- **INTEGRATOR validates system health**
  - Check system performance
  - Verify resource usage
  - Monitor system metrics
  - Validate system stability
- **OPTIMIZER checks performance**
  - Profile system performance
  - Check for performance regressions
  - Validate optimization opportunities
- **INTEGRATOR documents integration**
  - Document integration status
  - Create integration report
  - Record system health

**Output:** Integration verification, integration tests results, system health report, performance metrics

**Quality Gate:** ✅ All integrations verified, ✅ Integration tests passing, ✅ System healthy, ✅ Performance maintained, ✅ No regressions

---

#### Step 11: OPTIMIZER - Performance Optimization
**Orchestrator:** NEURAFORGE  
**Agent:** OPTIMIZER  
**Supporting Agents:** INTEGRATOR, TEST  
**Input:** Integrated codebase from INTEGRATOR  
**Actions:**
- **OPTIMIZER receives integrated codebase**
  - Review performance opportunities
  - Understand optimization needs
  - Plan optimization strategy
- **OPTIMIZER profiles performance**
  - Profile cleaned codebase
  - Identify performance bottlenecks
  - Measure optimization opportunities
  - Compare before/after metrics
- **OPTIMIZER optimizes codebase**
  - Optimize consolidated code
  - Improve import performance
  - Optimize dependency loading
  - Enhance code efficiency
- **OPTIMIZER validates optimizations**
  - Verify performance improvements
  - Check for regressions
  - Validate optimization correctness
- **TEST validates optimizations**
  - Run performance tests
  - Verify functionality maintained
  - Check test performance
- **OPTIMIZER documents optimizations**
  - Document performance improvements
  - Create optimization report
  - Record metrics

**Output:** Optimized codebase, performance metrics, optimization report, performance improvements

**Quality Gate:** ✅ Performance profiled, ✅ Optimizations applied, ✅ Performance improved or maintained, ✅ No regressions, ✅ Metrics documented

---

#### Step 12: DOCUMENTATION_SPECIALIST - Documentation Update
**Orchestrator:** NEURAFORGE  
**Agent:** DOCUMENTATION_SPECIALIST  
**Supporting Agents:** FILESYSTEM_EXPERT, ARCHITECT  
**Input:** Optimized codebase from OPTIMIZER  
**Actions:**
- **DOCUMENTATION_SPECIALIST receives cleaned codebase**
  - Review documentation needs
  - Understand changes
  - Plan documentation updates
- **DOCUMENTATION_SPECIALIST updates documentation**
  - Update project structure docs
  - Document archive locations
  - Update import guides
  - Document consolidation changes
  - Update dependency documentation
  - Create migration guide
- **DOCUMENTATION_SPECIALIST creates cleaning report**
  - Document all cleaning operations
  - List archived files
  - Document purged items
  - Record consolidation changes
  - Document re-reference changes
  - List pruned dependencies
- **FILESYSTEM_EXPERT reviews documentation**
  - Verify accuracy
  - Check completeness
  - Validate examples
- **DOCUMENTATION_SPECIALIST finalizes documentation**
  - Polish documentation
  - Ensure clarity
  - Complete all sections

**Output:** Updated documentation, cleaning report, migration guide, archive index, documentation updates

**Quality Gate:** ✅ Documentation complete, ✅ All changes documented, ✅ Migration guide created, ✅ Archive index complete, ✅ Examples accurate

---

#### Step 13: DEPLOYER - Deployment Preparation & Validation
**Orchestrator:** NEURAFORGE  
**Agent:** DEPLOYER  
**Supporting Agents:** INTEGRATOR, TEST, VALIDATOR  
**Input:** Documented codebase from DOCUMENTATION_SPECIALIST  
**Actions:**
- **DEPLOYER receives cleaned codebase**
  - Review all deliverables
  - Check quality gates
  - Plan deployment
- **DEPLOYER validates readiness**
  - Check all quality gates passed
  - Verify documentation complete
  - Confirm tests passing
  - Validate integration
  - Check system health
- **DEPLOYER creates deployment plan**
  - Define deployment steps
  - Identify rollback strategy
  - Plan release notes
  - Document deployment changes
- **TEST runs final validation**
  - Execute smoke tests
  - Verify critical paths
  - Confirm readiness
- **VALIDATOR validates deployment**
  - Check deployment readiness
  - Verify system state
  - Validate compliance
- **DEPLOYER generates release notes**
  - Document cleaning changes
  - List improvements
  - Note breaking changes (if any)
  - Document archive locations
  - List pruned dependencies

**Output:** Deployment plan, release notes, deployment validation, rollback strategy, readiness report

**Quality Gate:** ✅ All quality gates passed, ✅ Deployment plan ready, ✅ Release notes complete, ✅ Rollback strategy defined, ✅ System ready for deployment

---

### NEURAFORGE Orchestration Flow

**Complete Workflow Sequence:**
```
┌─────────────────────────────────────────────────────────────┐
│  NEURAFORGE: Project Cleaning & Consolidation Workflow    │
└─────────────────────────────────────────────────────────────┘

1. RESEARCH_WIZARD → Best Practices Research
   ├─ Research cleaning strategies
   ├─ Find best practices
   └─ Compile findings
   ↓
2. PLANNER → Cleaning Strategy & Planning
   ├─ Analyze project
   ├─ Identify opportunities
   └─ Create execution plan
   ↓
3. ARCHITECT → Architecture Analysis & Impact Assessment
   ├─ Assess impact
   ├─ Design cleaning architecture
   └─ Create migration guide
   ↓
4. FILESYSTEM_EXPERT → Filesystem Operations Execution
   ├─ Create backups
   ├─ Archive files
   ├─ Consolidate code
   ├─ Purge unused files
   ├─ Re-reference imports
   └─ Prune dependencies
   ↓
5. CODER → Code Fixes & Integration
   ├─ Fix broken references
   ├─ Resolve conflicts
   └─ Update code structure
   ↓
6. DEBUGGER → Issue Detection & Resolution
   ├─ Detect issues
   ├─ Fix bugs
   └─ Validate fixes
   ↓
7. TEST → Comprehensive Testing & Validation
   ├─ Run test suite
   ├─ Fix test issues
   └─ Create regression tests
   ↓
8. REVIEWER → Comprehensive Code Review
   ├─ Review changes
   ├─ Check quality
   └─ Approve cleaning
   ↓
9. VALIDATOR → System-Wide Validation
   ├─ Validate operations
   ├─ Check system state
   └─ Verify compliance
   ↓
10. INTEGRATOR → System Integration & Verification
    ├─ Verify integrations
    ├─ Check system health
    └─ Validate connections
    ↓
11. OPTIMIZER → Performance Optimization
    ├─ Profile performance
    ├─ Optimize codebase
    └─ Validate improvements
    ↓
12. DOCUMENTATION_SPECIALIST → Documentation Update
    ├─ Update docs
    ├─ Create cleaning report
    └─ Document changes
    ↓
13. DEPLOYER → Deployment Preparation & Validation
    ├─ Validate readiness
    ├─ Create deployment plan
    └─ Generate release notes
    ↓
✅ Project Cleaned - Ready for Deployment
```

### Parallel Execution Opportunities

**Stage 4-5: Filesystem & Code Fixes (Parallel)**
- FILESYSTEM_EXPERT executes operations while CODER prepares fixes
- CODER fixes issues while FILESYSTEM_EXPERT completes operations

**Stage 6-7: Debugging & Testing (Parallel)**
- DEBUGGER fixes issues while TEST prepares test suite
- TEST runs tests while DEBUGGER resolves issues

**Stage 8-9: Review & Validation (Parallel)**
- REVIEWER reviews code while VALIDATOR prepares validation
- VALIDATOR validates while REVIEWER completes review

**Stage 10-11: Integration & Optimization (Parallel)**
- INTEGRATOR verifies integration while OPTIMIZER profiles performance
- OPTIMIZER optimizes while INTEGRATOR completes verification

**Stage 12-13: Documentation & Deployment (Parallel)**
- DOCUMENTATION_SPECIALIST writes docs while DEPLOYER prepares deployment

### Agent Assignment Matrix

| Stage | Primary Agent | Supporting Agents | Orchestrator |
|-------|--------------|-------------------|--------------|
| 1. Research | RESEARCH_WIZARD | - | NEURAFORGE |
| 2. Planning | PLANNER | FILESYSTEM_EXPERT, RESEARCH_WIZARD | NEURAFORGE |
| 3. Architecture | ARCHITECT | PLANNER, FILESYSTEM_EXPERT | NEURAFORGE |
| 4. Filesystem | FILESYSTEM_EXPERT | ARCHITECT, PLANNER | NEURAFORGE |
| 5. Code Fixes | CODER | FILESYSTEM_EXPERT, ARCHITECT | NEURAFORGE |
| 6. Debugging | DEBUGGER | CODER, TEST | NEURAFORGE |
| 7. Testing | TEST | DEBUGGER, VALIDATOR | NEURAFORGE |
| 8. Review | REVIEWER | TEST, CODER | NEURAFORGE |
| 9. Validation | VALIDATOR | REVIEWER, TEST | NEURAFORGE |
| 10. Integration | INTEGRATOR | VALIDATOR, TEST, OPTIMIZER | NEURAFORGE |
| 11. Optimization | OPTIMIZER | INTEGRATOR, TEST | NEURAFORGE |
| 12. Documentation | DOCUMENTATION_SPECIALIST | FILESYSTEM_EXPERT, ARCHITECT | NEURAFORGE |
| 13. Deployment | DEPLOYER | INTEGRATOR, TEST, VALIDATOR | NEURAFORGE |

### Workflow Completion Criteria

✅ **Research findings gathered from best practices**  
✅ Cleaning strategy planned comprehensively  
✅ Architecture analyzed and impact assessed  
✅ Filesystem operations executed safely  
✅ All code fixes applied  
✅ All issues detected and resolved  
✅ Tests comprehensive and passing (≥95% coverage)  
✅ Code reviewed and approved  
✅ System validated completely  
✅ Integrations verified  
✅ Performance optimized  
✅ Documentation complete  
✅ Project ready for deployment  

### Cleaning Operations Covered

**Archiving:**
- ✅ Move old/unused files to archive
- ✅ Preserve file history
- ✅ Create archive structure
- ✅ Document archived items

**Consolidation:**
- ✅ Merge duplicate files
- ✅ Consolidate similar code
- ✅ Combine related modules
- ✅ Unify code patterns

**Purging:**
- ✅ Remove unused files
- ✅ Delete dead code
- ✅ Clean orphaned files
- ✅ Remove temporary files

**Re-referencing:**
- ✅ Update import paths
- ✅ Fix broken references
- ✅ Consolidate imports
- ✅ Update module references

**Pruning:**
- ✅ Remove unused dependencies
- ✅ Clean package files
- ✅ Update dependency lists
- ✅ Remove orphaned packages

### Execution Commands

**Start Project Cleaning:**
```
/neuraforge NEURAFORGE Project Cleaning Workflow [cleaning-goals]
```

**Deploy Specific Stage:**
```
/neuraforge PLANNER [cleaning-goals]
/neuraforge FILESYSTEM_EXPERT [cleaning-goals]
/neuraforge ARCHITECT [cleaning-goals]
```

**Monitor Workflow:**
```
/neuraforge NEURAFORGE Monitor Cleaning Workflow [workflow-id]
```

### Metrics & Monitoring

**NEURAFORGE tracks:**
- Cleaning operation execution time
- Files archived/consolidated/purged
- Dependencies pruned
- References re-referenced
- Test coverage maintained
- Performance improvements
- Agent performance scores

**Target Metrics:**
- Workflow execution: <2 hours (simple), <4 hours (complex)
- Agent handoff latency: <1s
- Quality gate pass rate: 100%
- Test coverage maintained: ≥95%
- Performance maintained or improved
- Zero regressions

---

## 🎯 Workflow Selection Guide

### Decision Tree: Which Workflow to Use?

```
Task Type?
├─ New Feature → Feature Development Workflow
├─ Bug Fix → Debugging Workflow
├─ Code Implementation → Coding Workflow
├─ Performance Issue → Performance Optimization Workflow
├─ Architecture Review → Architecture Review Workflow
├─ Integration → Integration Workflow
├─ Deployment → Deployment Workflow
├─ Code Review → Code Review Workflow
├─ Test Creation → Testing Workflow
├─ Code Improvement → Refactoring Workflow
└─ Project Cleaning → Project Cleaning & Consolidation Workflow
```

### Workflow Complexity Levels

**Simple Tasks (1-2 agents):**
- Quick bug fix → DEBUGGER → TEST
- Simple code review → REVIEWER
- Basic validation → VALIDATOR

**Medium Tasks (3-4 agents):**
- Standard coding → PLANNER → CODER → TEST → REVIEWER
- Performance optimization → OPTIMIZER → TEST → VALIDATOR
- Integration → INTEGRATOR → TEST → VALIDATOR

**Complex Tasks (5+ agents):**
- Feature development → Full Feature Development Workflow
- Complete coding → Full Coding Workflow
- Architecture review → Full Architecture Review Workflow
- Project cleaning → Full Project Cleaning & Consolidation Workflow (13 agents)

---

## 🔄 Workflow Execution Patterns

### Pattern 1: Sequential Execution
**Use Case:** Tasks with strict dependencies  
**Execution:** Agents execute one after another, each waiting for previous completion

### Pattern 2: Parallel Execution
**Use Case:** Independent tasks that can run simultaneously  
**Execution:** Multiple agents work in parallel on different aspects

### Pattern 3: Conditional Branching
**Use Case:** Workflows that branch based on results  
**Execution:** Workflow branches based on agent output (e.g., if review finds issues, branch to CODER)

### Pattern 4: Iterative Refinement
**Use Case:** Tasks requiring multiple passes  
**Execution:** Workflow loops back to previous agents for refinement

---

## 📊 Workflow Metrics

### Success Metrics
- **Workflow Completion Rate**: % of workflows completed successfully
- **Quality Gate Pass Rate**: % of quality gates passed
- **Agent Handoff Efficiency**: Time between agent handoffs
- **Workflow Execution Time**: Total time to complete workflow
- **Error Rate**: % of workflows requiring fixes or rework

### Performance Metrics
- **Average Workflow Duration**: Mean time to complete workflow
- **Agent Utilization**: % of time agents are active
- **Parallel Execution Rate**: % of workflows using parallel execution
- **Workflow Efficiency**: Output quality vs. execution time

---

## 🚀 Workflow Optimization

### Continuous Improvement
1. **Monitor Workflow Performance**: Track metrics for each workflow
2. **Identify Bottlenecks**: Find slow or inefficient steps
3. **Optimize Agent Handoffs**: Reduce handoff time and improve context transfer
4. **Refine Quality Gates**: Adjust gates based on results
5. **Learn from Failures**: Improve workflows based on failure patterns

### Adaptive Workflows
- Workflows can adapt based on:
  - Task complexity
  - Agent availability
  - Historical performance
  - User preferences
  - System constraints

---

## 📝 Workflow Documentation

### Workflow Template
Each workflow should document:
- **Purpose**: What the workflow accomplishes
- **Use Case**: When to use this workflow
- **Agent Chain**: Sequence of agents
- **Steps**: Detailed step-by-step process
- **Quality Gates**: Success criteria for each step
- **Completion Criteria**: Overall workflow success
- **Metrics**: How to measure workflow success

### Workflow Registry
Maintain a registry of all workflows with:
- Workflow name and ID
- Agent chain
- Average execution time
- Success rate
- Last updated date
- Version number

---

## 🎯 Future Enhancements

### Planned Improvements
- [ ] **AI-Powered Workflow Selection**: ML-based workflow recommendation
- [ ] **Dynamic Workflow Generation**: Auto-generate workflows for new task types
- [ ] **Workflow Analytics Dashboard**: Real-time workflow performance monitoring
- [ ] **Predictive Workflow Optimization**: Predict and optimize workflow paths
- [ ] **Multi-Workflow Orchestration**: Coordinate multiple workflows simultaneously
- [ ] **Workflow Templates**: Pre-built workflow templates for common patterns
- [ ] **Workflow Versioning**: Version control for workflows
- [ ] **Workflow A/B Testing**: Test workflow variations

---

## 📌 Usage Examples

### Example 1: Implementing a New Feature
```
User: "Implement user authentication feature"

NEURAFORGE executes: Feature Development Workflow
1. FEATURE → Analyzes requirements, designs feature
2. PLANNER → Creates execution plan
3. ARCHITECT → Designs architecture
4. CODER → Implements code
5. TEST → Creates and validates tests
6. REVIEWER → Reviews code
7. INTEGRATOR → Integrates feature
8. DEPLOYER → Deploys to production
```

### Example 2: Fixing a Critical Bug
```
User: "Fix authentication bug in login flow"

NEURAFORGE executes: Debugging Workflow
1. DEBUGGER → Reproduces bug, fixes root cause
2. TEST → Creates regression test
3. REVIEWER → Reviews fix
4. VALIDATOR → Verifies fix
```

### Example 3: Performance Optimization
```
User: "Optimize slow database queries"

NEURAFORGE executes: Performance Optimization Workflow
1. OPTIMIZER → Profiles, identifies bottlenecks, optimizes
2. TEST → Validates optimizations
3. VALIDATOR → Verifies improvements
4. REVIEWER → Reviews optimizations
```

### Example 4: Project Cleaning & Consolidation
```
User: "Clean up project: archive old code, merge duplicates, purge unused files, re-reference imports, prune dependencies"

NEURAFORGE executes: Project Cleaning & Consolidation Workflow
1. RESEARCH_WIZARD → Researches best practices for project cleaning
2. PLANNER → Creates comprehensive cleaning strategy
3. ARCHITECT → Analyzes architecture and assesses impact
4. FILESYSTEM_EXPERT → Executes archiving, consolidation, purging, re-referencing, pruning
5. CODER → Fixes broken references and merge conflicts
6. DEBUGGER → Detects and resolves issues
7. TEST → Validates all tests pass, creates regression tests
8. REVIEWER → Reviews all cleaning changes
9. VALIDATOR → Validates system-wide integrity
10. INTEGRATOR → Verifies all integrations working
11. OPTIMIZER → Optimizes cleaned codebase
12. DOCUMENTATION_SPECIALIST → Updates documentation
13. DEPLOYER → Prepares deployment with release notes
```

---

## 🎉 Conclusion

These Agent Persona Action Workflows provide intelligent, chain-of-thought orchestration that maximizes success for common development tasks. Each workflow is designed to:

- **Leverage Agent Strengths**: Each agent works in their area of expertise
- **Ensure Quality**: Multiple quality gates throughout
- **Optimize Efficiency**: Parallel execution where possible
- **Enable Autonomy**: Workflows can run end-to-end independently
- **Support Learning**: Each execution improves future workflows

**Workflows are living documents** - they evolve based on:
- Execution results
- Agent improvements
- New patterns discovered
- User feedback
- System changes

---

**Last Updated:** [AUTO-UPDATE on every change]  
**Next Review:** [AUTO-SCHEDULE weekly]  
**Status:** ✅ ACTIVE AND OPERATIONAL

🧠 **Ready to orchestrate intelligent agent workflows autonomously!**

