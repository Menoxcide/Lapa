# Architecture Review Workflow

**Purpose:** Comprehensive system architecture assessment and improvement  
**Use Case:** Architecture review, technical debt assessment, scalability concerns  
**Agent Chain:** `ARCHITECT → REVIEWER → VALIDATOR → PLANNER`

## Steps

### 1. ARCHITECT - Architecture Analysis
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

### 2. REVIEWER - Architecture Review Validation
- Review architecture analysis
- Verify identified issues
- Check improvement plans
- Review ADRs
- Validate recommendations
- Provide feedback

**Output:** Review feedback, validation status  
**Quality Gate:** Architecture review validated, recommendations approved

### 3. VALIDATOR - Architecture Compliance Check
- Validate architecture compliance
- Verify improvement feasibility
- Check system constraints
- Validate scalability
- Verify security compliance

**Output:** Compliance report, validation status  
**Quality Gate:** Architecture compliant, improvements validated

### 4. PLANNER - Architecture Improvement Planning
- Plan architecture improvements
- Decompose into tasks
- Identify dependencies
- Create execution timeline
- Assess risks
- Prioritize improvements

**Output:** Improvement execution plan, task breakdown  
**Quality Gate:** Improvement plan complete, all dependencies identified

## Completion Criteria

✅ Architecture reviewed comprehensively  
✅ Issues and improvements identified  
✅ ADRs created for changes  
✅ Improvement plan created  
✅ Architecture compliance verified

