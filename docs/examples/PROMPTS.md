# Multi-Agent Prompting Guide for LAPA v1.3

## Overview

This guide provides best practices and YAML examples for multi-agent prompting in LAPA, covering veto/resonance patterns, agent coordination, and effective prompt engineering for swarm operations.

**Version**: v1.3.0-preview  
**Last Updated**: November 2025  
**Phase**: 22 - Production Flows

## Table of Contents

1. [Veto Patterns](#veto-patterns)
2. [Resonance Core Patterns](#resonance-core-patterns)
3. [Agent Coordination](#agent-coordination)
4. [YAML Configuration Examples](#yaml-configuration-examples)
5. [Best Practices](#best-practices)
6. [Virtual Workshops](#virtual-workshops)

## Veto Patterns

### Basic Veto Configuration

```yaml
# ~/.lapa/veto-config.yaml
veto:
  threshold: 0.833  # 5/6 consensus (83.3%)
  enabled: true
  consensusAlgorithm: "supermajority"
  
agents:
  - id: "architect"
    vetoWeight: 1.0
    canVeto: ["planning", "architecture"]
  
  - id: "reviewer"
    vetoWeight: 1.0
    canVeto: ["code-review", "security"]
  
  - id: "tester"
    vetoWeight: 1.0
    canVeto: ["testing", "quality"]
```

### Veto with Flow Guards

```yaml
# Flow guards for conditional veto routing
flowGuards:
  - name: "thermal-guard"
    condition: "system.temperature > 78"
    action: "route-to-eco"
    targetAgent: "optimizer"
    
  - name: "vram-guard"
    condition: "system.vram > 85"
    action: "throttle-inference"
    fallbackProvider: "openrouter"
    
  - name: "quality-guard"
    condition: "task.confidence < 0.8"
    action: "require-veto"
    requiredAgents: ["reviewer", "tester"]
```

### Example: Veto Request Pattern

```yaml
# Example veto request workflow
vetoRequest:
  taskId: "task-123"
  requester: "reviewer"
  reason: "Code violates security best practices"
  affectedAgents: ["coder", "architect"]
  
  # Consensus voting
  voting:
    sessionId: "veto-session-123"
    quorum: 5  # 5 out of 6 agents
    options:
      - id: "accept-veto"
        label: "Accept Veto"
        value: true
      - id: "reject-veto"
        label: "Reject Veto"
        value: false
```

## Resonance Core Patterns

### NetworkX Graph Configuration

```yaml
# Resonance Core graph structure
resonance:
  chamber: "NetworkX-graph"
  compaction: "ctx-zip@55%"
  decay: 0.85
  
  # Graph nodes (agents)
  nodes:
    - id: "architect"
      type: "planner"
      connections: ["coder", "reviewer", "integrator"]
      
    - id: "coder"
      type: "executor"
      connections: ["tester", "reviewer"]
      
    - id: "tester"
      type: "validator"
      connections: ["reviewer", "debugger"]
  
  # Graph edges (handoff paths)
  edges:
    - from: "architect"
      to: "coder"
      weight: 0.9
      latency: "<1s"
      
    - from: "coder"
      to: "tester"
      weight: 0.95
      latency: "<1s"
```

### Resonance with Flow Guards

```yaml
# Resonance Core with YAML-defined guards
resonance:
  flowGuards:
    - name: "error-resilience"
      condition: "handoff.errorCount > 3"
      action: "route-to-debugger"
      priority: "high"
      
    - name: "performance-optimization"
      condition: "handoff.latency > 1000"
      action: "optimize-path"
      targetAgent: "optimizer"
      
    - name: "quality-gate"
      condition: "task.confidence < 0.8"
      action: "require-review"
      blocking: true
```

## Agent Coordination

### Multi-Agent Prompt Pattern

```yaml
# Example: Multi-agent task decomposition
task:
  id: "implement-auth"
  description: "Implement user authentication system"
  
  agents:
    - role: "architect"
      prompt: |
        Design a secure authentication system with:
        - JWT token management
        - Password hashing (bcrypt)
        - Session management
        - Rate limiting
        
    - role: "coder"
      prompt: |
        Implement the authentication system based on architect's design:
        - Create auth routes
        - Implement middleware
        - Add validation
        
    - role: "tester"
      prompt: |
        Write comprehensive tests for authentication:
        - Unit tests for auth functions
        - Integration tests for auth flow
        - Security tests for vulnerabilities
        
    - role: "reviewer"
      prompt: |
        Review the authentication implementation:
        - Check security best practices
        - Verify code quality
        - Validate test coverage
```

### Handoff Coordination

```yaml
# Handoff coordination pattern
handoff:
  source: "architect"
  target: "coder"
  context:
    design: "auth-system-design.json"
    requirements: "auth-requirements.md"
    
  # A2A handshake
  handshake:
    required: true
    capabilities: ["code-generation", "test-integration"]
    timeout: 5000
    
  # State synchronization
  stateSync:
    type: "incremental"
    compression: "ctx-zip"
    maxSize: "1MB"
```

## YAML Configuration Examples

### Complete Agent Configuration

```yaml
# ~/.lapa/agents.yaml
version: "1.0"

agents:
  architect:
    role: "System Architect"
    goal: "Design scalable, maintainable system architectures"
    backstory: "Expert in system design with deep knowledge of distributed systems"
    model: "DeepSeek-R1-671B"
    capabilities:
      - "planning"
      - "architecture"
      - "design"
    tools:
      - "diagram-generator"
      - "architecture-analyzer"
    refineHooks:
      - "prompt-engineer"
      - "llm-judge"
    modeBehaviors:
      code:
        autonomy: "high"
        handoffAt: 0.4
      architect:
        autonomy: "very-high"
        handoffAt: 0.2

  coder:
    role: "Software Engineer"
    goal: "Write clean, efficient, and maintainable code"
    backstory: "Experienced developer with expertise in multiple languages"
    model: "Qwen3-Coder-480B-A35B-Instruct"
    capabilities:
      - "code-generation"
      - "refactoring"
    tools:
      - "code-generator"
      - "code-formatter"
      - "linting-tool"

globalSettings:
  enableAutoRefine: true
  defaultModel: "ollama"
  vetoThreshold: 0.833
```

### Hybrid Inference Configuration

```yaml
# ~/.lapa/inference.yaml
enabled: true
fallbackToCloud: true
sensitiveTasksLocalOnly: true

openrouterApiKey: "${OPENROUTER_API_KEY}"
openrouterBaseUrl: "https://openrouter.ai/api/v1"

thermalThresholds:
  vram: 85
  ram: 85
  cpu: 90
  temperature: 78

preferredProviders:
  - "ollama"
  - "nim"
  - "openrouter"
```

## YAML Tips and Best Practices

### YAML Configuration Tips

#### Tip 1: Use Consistent Structure
Always follow the standard YAML structure for agent configurations:
```yaml
version: "1.0"
agents:
  agent-name:
    role: "Clear Role Name"
    goal: "Specific Goal"
    backstory: "Detailed Backstory"
    model: "model-name"
    capabilities: ["cap1", "cap2"]
    tools: ["tool1", "tool2"]
globalSettings:
  setting1: value1
```

#### Tip 2: Environment Variables
Use environment variables for sensitive data:
```yaml
openrouterApiKey: "${OPENROUTER_API_KEY}"
apiBaseUrl: "${API_BASE_URL:-https://api.default.com}"
```

#### Tip 3: Validation
Always validate your YAML before using:
```bash
# Use a YAML validator
yamllint agents.yaml
```

#### Tip 4: Comments
Use comments to document complex configurations:
```yaml
agents:
  architect:
    # High autonomy for architecture decisions
    modeBehaviors:
      architect:
        autonomy: "very-high"
        # Force handoff at 20% confidence to prevent over-planning
        handoffAt: 0.2
```

#### Tip 5: Reusability
Create reusable configuration snippets:
```yaml
# Common agent template
_agentTemplate: &agentTemplate
  refineHooks:
    - "prompt-engineer"
    - "llm-judge"
  modeBehaviors:
    code:
      autonomy: "high"
      handoffAt: 0.4

agents:
  coder:
    <<: *agentTemplate
    role: "Software Engineer"
    # ... specific configuration
```

## Best Practices

### 1. Prompt Clarity

**Bad:**
```
"Make it better"
```

**Good:**
```yaml
prompt: |
  Optimize the authentication system by:
  - Reducing JWT token size by 30%
  - Implementing token refresh mechanism
  - Adding rate limiting (100 requests/minute)
  - Improving error messages for better UX
```

### 2. Agent Role Definition

**Best Practice:**
```yaml
agent:
  role: "Code Reviewer"
  goal: "Review code for quality, security, and best practices"
  backstory: |
    Meticulous reviewer with 10+ years of experience.
    Specializes in security vulnerabilities and code quality.
    Known for catching edge cases and performance issues.
```

### 3. Veto Usage

**When to Use Veto:**
- Security-critical operations
- Breaking changes to core architecture
- Performance regressions
- Quality degradation

**Example:**
```yaml
veto:
  trigger: "security-issue-detected"
  requiredAgents: ["reviewer", "security-specialist"]
  threshold: 0.833
  blocking: true
```

### 4. Resonance Patterns

**Effective Resonance:**
```yaml
resonance:
  # Use decay for context management
  decay: 0.85
  
  # Compress context for efficiency
  compaction: "ctx-zip@55%"
  
  # Enable fast path for common patterns
  fastPath:
    enabled: true
    ttl: 5000
```

## Virtual Workshops

### Workshop Structure

LAPA supports virtual workshops via WebRTC (Phase 19) for collaborative learning:

1. **Session Creation**
   ```yaml
   workshop:
     sessionId: "prompting-workshop-2025"
     host: "admin-user"
     maxParticipants: 50
     enableVetoes: true
     topics:
       - "Multi-agent prompting patterns"
       - "Veto system best practices"
       - "Resonance Core optimization"
   ```

2. **Interactive Examples**
   - Live prompt refinement
   - Real-time veto demonstrations
   - Resonance graph visualization

3. **Q&A Sessions**
   - PromptEngineer integration
   - Interactive clarification
   - Best practice discussions

### Workshop Topics

1. **Introduction to Multi-Agent Prompting**
   - Agent roles and responsibilities
   - Handoff patterns
   - Context management

2. **Veto System Deep Dive**
   - When to use vetoes
   - Consensus algorithms
   - Flow guard patterns

3. **Resonance Core Optimization**
   - Graph structure design
   - Performance tuning
   - Context compression strategies

4. **Production Patterns**
   - Error handling
   - Fallback strategies
   - Monitoring and observability

## Common Patterns

### Pattern 1: Stubborn Manager Problem

**Problem:** Agent refuses to hand off tasks.

**Solution:**
```yaml
agent:
  modeBehaviors:
    custom:
      autonomy: "medium"
      handoffAt: 0.4  # Force handoff at 40% confidence
      maxSteps: 25
      noContinue: true  # Prevent infinite loops
```

### Pattern 2: Quality Gate

**Problem:** Need to ensure quality before proceeding.

**Solution:**
```yaml
flowGuard:
  name: "quality-gate"
  condition: "task.confidence < 0.8"
  action: "require-review"
  blocking: true
  requiredAgents: ["reviewer", "tester"]
```

### Pattern 3: Thermal Safety

**Problem:** System overheating during inference.

**Solution:**
```yaml
flowGuard:
  name: "thermal-safety"
  condition: "system.temperature > 78"
  action: "route-to-eco"
  targetAgent: "optimizer"
  fallbackProvider: "openrouter"
```

## Resources

- [LAPA Master Plan](LAPA_Master_Plan.toon)
- [Protocols Documentation](PROTOCOLS.md)
- [Agent Documentation](AGENT.md)
- [Start Here Guide](START_HERE.md)

## Contributing

Contributions to this guide are welcome! Please follow the patterns and examples provided, and ensure all YAML configurations are valid and tested.

---

**Last Updated**: November 2025 - Phase 22 Complete

