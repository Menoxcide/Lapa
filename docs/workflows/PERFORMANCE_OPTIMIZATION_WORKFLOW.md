# Performance Optimization Workflow

**Purpose:** Identify and fix performance bottlenecks  
**Use Case:** Performance degradation, optimization request, profiling results  
**Agent Chain:** `OPTIMIZER → TEST → VALIDATOR → REVIEWER`

## Steps

### 1. OPTIMIZER - Performance Analysis & Optimization
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

### 2. TEST - Optimization Validation
- Run test suite
- Verify no test failures
- Check for performance regressions
- Validate optimization doesn't break functionality
- Run performance tests
- Verify test performance

**Output:** Test results, performance test validation  
**Quality Gate:** All tests passing, no functionality regressions

### 3. VALIDATOR - Optimization Verification
- Validate optimization correctness
- Verify performance improvements
- Check system state
- Validate no side effects
- Verify compliance

**Output:** Validation report, optimization verification  
**Quality Gate:** Optimizations verified, performance improved

### 4. REVIEWER - Optimization Review
- Review optimization approach
- Verify performance improvements
- Check code quality
- Review documentation
- Approve optimizations

**Output:** Review feedback, approval status  
**Quality Gate:** Optimizations approved, code quality maintained

## Completion Criteria

✅ Performance profiled and bottlenecks identified  
✅ Optimizations implemented  
✅ Performance targets met  
✅ No regressions introduced  
✅ Tests passing  
✅ Optimizations verified and approved

