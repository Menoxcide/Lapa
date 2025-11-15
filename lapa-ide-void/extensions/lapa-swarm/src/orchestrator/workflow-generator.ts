/**
 * Predictive Workflow Generation System for LAPA-VOID IDE
 * 
 * Auto-generates optimal multi-agent workflows based on task analysis
 * and historical patterns. Adapted for IDE extension context.
 */

// Simplified agent selector for IDE context
interface AgentRecommendation {
  agentName: string;
  confidence: number;
  reasoning: string;
  estimatedSuccessRate: number;
  estimatedTime: number;
  capabilities: string[];
}

// Simple agent selector implementation
class SimpleAgentSelector {
  private agentCapabilities: Map<string, string[]> = new Map();

  constructor() {
    this.initializeAgentCapabilities();
  }

  private initializeAgentCapabilities(): void {
    const capabilities: Record<string, string[]> = {
      'ARCHITECT': ['planning', 'architecture', 'design', 'system-design'],
      'CODER': ['coding', 'implementation', 'programming', 'development'],
      'REVIEWER': ['code-review', 'quality-assurance', 'best-practices'],
      'TEST': ['testing', 'test-creation', 'test-automation'],
      'DEBUGGER': ['debugging', 'troubleshooting', 'bug-fixing'],
      'OPTIMIZER': ['optimization', 'performance', 'efficiency'],
      'PLANNER': ['planning', 'task-decomposition', 'scheduling'],
      'VALIDATOR': ['validation', 'verification', 'testing'],
      'INTEGRATOR': ['integration', 'merging', 'coordination'],
      'DEPLOYER': ['deployment', 'release-management', 'ci-cd'],
      'DOCUMENTATION': ['documentation', 'writing', 'technical-writing'],
      'RESEARCH_WIZARD': ['research', 'information-gathering', 'analysis'],
      'MCP': ['mcp', 'protocol', 'integration'],
      'FEATURE': ['feature-development', 'implementation'],
      'FILESYSTEM': ['filesystem', 'file-management', 'cleanup'],
      'NEURAFORGE': ['orchestration', 'coordination', 'multi-agent']
    };

    for (const [agent, caps] of Object.entries(capabilities)) {
      this.agentCapabilities.set(agent, caps);
    }
  }

  async selectAgent(taskDescription: string): Promise<AgentRecommendation[]> {
    const lower = taskDescription.toLowerCase();
    const recommendations: AgentRecommendation[] = [];

    for (const [agentName, capabilities] of this.agentCapabilities) {
      let score = 0;
      const matchedCapabilities: string[] = [];

      for (const capability of capabilities) {
        if (lower.includes(capability.toLowerCase())) {
          score += 1;
          matchedCapabilities.push(capability);
        }
      }

      if (score > 0) {
        const confidence = Math.min(score / capabilities.length, 1.0);
        recommendations.push({
          agentName,
          confidence,
          reasoning: `Matched capabilities: ${matchedCapabilities.join(', ')}`,
          estimatedSuccessRate: confidence * 0.9,
          estimatedTime: 10000,
          capabilities: matchedCapabilities
        });
      }
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    // Fallback if no matches
    if (recommendations.length === 0) {
      recommendations.push({
        agentName: 'PLANNER',
        confidence: 0.5,
        reasoning: 'Default fallback agent',
        estimatedSuccessRate: 0.5,
        estimatedTime: 10000,
        capabilities: []
      });
    }

    return recommendations;
  }
}

const agentSelector = new SimpleAgentSelector();

export interface TaskDecomposition {
  mainTask: string;
  subtasks: Subtask[];
  dependencies: Dependency[];
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface Subtask {
  id: string;
  description: string;
  agentRecommendations: AgentRecommendation[];
  estimatedDuration: number;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface Dependency {
  from: string;
  to: string;
  type: 'sequential' | 'parallel' | 'conditional';
}

export interface GeneratedWorkflow {
  workflowId: string;
  name: string;
  agentSequence: string[];
  sequence: 'parallel' | 'sequential' | 'conditional';
  tasks: string[];
  estimatedDuration: number;
  confidence: number;
  reasoning: string;
}

interface WorkflowPattern {
  name: string;
  sequence: 'parallel' | 'sequential' | 'conditional';
  agents: string[];
  tasks: string[];
  successRate: number;
}

/**
 * Predictive Workflow Generator
 */
export class WorkflowGenerator {
  private workflowPatterns: Map<string, WorkflowPattern> = new Map();
  private historicalWorkflows: GeneratedWorkflow[] = [];

  constructor() {
    this.initializeWorkflowPatterns();
  }

  private initializeWorkflowPatterns(): void {
    this.workflowPatterns.set('feature-implementation', {
      name: 'Feature Implementation',
      sequence: 'sequential',
      agents: ['PLANNER', 'CODER', 'TEST', 'REVIEWER'],
      tasks: [
        'Create implementation plan',
        'Implement feature code',
        'Create test suite',
        'Review code quality'
      ],
      successRate: 0.92
    });

    this.workflowPatterns.set('bug-fixing', {
      name: 'Bug Fixing',
      sequence: 'sequential',
      agents: ['DEBUGGER', 'CODER', 'TEST', 'REVIEWER'],
      tasks: [
        'Identify root cause',
        'Implement fix',
        'Verify fix with tests',
        'Code review'
      ],
      successRate: 0.88
    });

    this.workflowPatterns.set('refactoring', {
      name: 'Code Refactoring',
      sequence: 'sequential',
      agents: ['ARCHITECT', 'CODER', 'TEST', 'REVIEWER', 'OPTIMIZER'],
      tasks: [
        'Design refactoring strategy',
        'Implement refactoring',
        'Run test suite',
        'Code review',
        'Performance optimization'
      ],
      successRate: 0.85
    });

    this.workflowPatterns.set('documentation', {
      name: 'Documentation',
      sequence: 'parallel',
      agents: ['DOCUMENTATION', 'REVIEWER'],
      tasks: [
        'Write documentation',
        'Review documentation quality'
      ],
      successRate: 0.95
    });
  }

  async generateWorkflow(taskDescription: string): Promise<GeneratedWorkflow> {
    const decomposition = await this.decomposeTask(taskDescription);
    const patternMatch = this.matchWorkflowPattern(decomposition);
    const agentSequence = await this.generateAgentSequence(decomposition, patternMatch);
    const sequence = this.determineExecutionSequence(decomposition, patternMatch);
    const tasks = this.generateTasks(decomposition, agentSequence);
    const confidence = this.calculateConfidence(decomposition, patternMatch, agentSequence);
    const reasoning = this.generateReasoning(decomposition, patternMatch, agentSequence);
    const estimatedDuration = this.estimateDuration(decomposition, agentSequence);

    const workflow: GeneratedWorkflow = {
      workflowId: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: patternMatch?.name || 'Custom Workflow',
      agentSequence,
      sequence,
      tasks,
      estimatedDuration,
      confidence,
      reasoning
    };

    this.historicalWorkflows.push(workflow);
    if (this.historicalWorkflows.length > 100) {
      this.historicalWorkflows.shift();
    }

    return workflow;
  }

  private async decomposeTask(taskDescription: string): Promise<TaskDecomposition> {
    const lower = taskDescription.toLowerCase();
    const subtasks: Subtask[] = [];
    const dependencies: Dependency[] = [];

    if (lower.includes('implement') || lower.includes('create') || lower.includes('build')) {
      subtasks.push({
        id: 'plan',
        description: 'Create implementation plan',
        agentRecommendations: [],
        estimatedDuration: 5000,
        dependencies: [],
        priority: 'high'
      });

      subtasks.push({
        id: 'code',
        description: 'Implement code',
        agentRecommendations: [],
        estimatedDuration: 15000,
        dependencies: ['plan'],
        priority: 'high'
      });

      dependencies.push({
        from: 'plan',
        to: 'code',
        type: 'sequential'
      });
    }

    if (lower.includes('test') || lower.includes('testing')) {
      subtasks.push({
        id: 'test',
        description: 'Create and run tests',
        agentRecommendations: [],
        estimatedDuration: 10000,
        dependencies: ['code'],
        priority: 'medium'
      });

      dependencies.push({
        from: 'code',
        to: 'test',
        type: 'sequential'
      });
    }

    if (lower.includes('review') || lower.includes('quality')) {
      subtasks.push({
        id: 'review',
        description: 'Code review and quality check',
        agentRecommendations: [],
        estimatedDuration: 8000,
        dependencies: ['code'],
        priority: 'medium'
      });

      dependencies.push({
        from: 'code',
        to: 'review',
        type: 'parallel'
      });
    }

    for (const subtask of subtasks) {
      const recommendations = await agentSelector.selectAgent(subtask.description);
      subtask.agentRecommendations = recommendations;
    }

    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    if (subtasks.length <= 2) complexity = 'simple';
    else if (subtasks.length > 4) complexity = 'complex';

    const estimatedDuration = this.estimateWorkflowDuration(subtasks, dependencies);

    return {
      mainTask: taskDescription,
      subtasks,
      dependencies,
      estimatedDuration,
      complexity
    };
  }

  private matchWorkflowPattern(decomposition: TaskDecomposition): WorkflowPattern | null {
    const taskLower = decomposition.mainTask.toLowerCase();

    for (const [key, pattern] of this.workflowPatterns) {
      if (key === 'feature-implementation' &&
          (taskLower.includes('implement') || taskLower.includes('create') || taskLower.includes('build'))) {
        return pattern;
      }

      if (key === 'bug-fixing' &&
          (taskLower.includes('bug') || taskLower.includes('fix') || taskLower.includes('error'))) {
        return pattern;
      }

      if (key === 'refactoring' &&
          (taskLower.includes('refactor') || taskLower.includes('improve') || taskLower.includes('optimize'))) {
        return pattern;
      }

      if (key === 'documentation' &&
          (taskLower.includes('doc') || taskLower.includes('write') || taskLower.includes('document'))) {
        return pattern;
      }
    }

    return null;
  }

  private async generateAgentSequence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null
  ): Promise<string[]> {
    if (pattern) {
      return [...pattern.agents];
    }

    const agentSequence: string[] = [];
    const seen = new Set<string>();

    for (const subtask of decomposition.subtasks) {
      if (subtask.agentRecommendations.length > 0) {
        const bestAgent = subtask.agentRecommendations[0].agentName;
        if (!seen.has(bestAgent)) {
          agentSequence.push(bestAgent);
          seen.add(bestAgent);
        }
      }
    }

    if (agentSequence.length === 0) {
      return ['PLANNER', 'CODER', 'TEST', 'REVIEWER'];
    }

    return agentSequence;
  }

  private determineExecutionSequence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null
  ): 'parallel' | 'sequential' | 'conditional' {
    if (pattern) {
      return pattern.sequence;
    }

    const hasDependencies = decomposition.dependencies.length > 0;
    const hasParallelDeps = decomposition.dependencies.some(d => d.type === 'parallel');

    if (hasParallelDeps) {
      return 'conditional';
    }

    return hasDependencies ? 'sequential' : 'parallel';
  }

  private generateTasks(
    decomposition: TaskDecomposition,
    agentSequence: string[]
  ): string[] {
    const tasks: string[] = [];

    for (let i = 0; i < agentSequence.length; i++) {
      const agent = agentSequence[i];
      const subtask = decomposition.subtasks[i] || decomposition.subtasks[0];
      tasks.push(subtask.description);
    }

    return tasks;
  }

  private calculateConfidence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null,
    agentSequence: string[]
  ): number {
    let confidence = 0.5;

    if (pattern) {
      confidence += 0.3;
      confidence *= pattern.successRate;
    }

    let avgAgentConfidence = 0;
    let count = 0;
    for (const subtask of decomposition.subtasks) {
      if (subtask.agentRecommendations.length > 0) {
        avgAgentConfidence += subtask.agentRecommendations[0].confidence;
        count++;
      }
    }
    if (count > 0) {
      avgAgentConfidence /= count;
      confidence = (confidence + avgAgentConfidence) / 2;
    }

    if (decomposition.complexity === 'complex') {
      confidence *= 0.9;
    }

    return Math.min(confidence, 1.0);
  }

  private generateReasoning(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null,
    agentSequence: string[]
  ): string {
    const reasons: string[] = [];

    if (pattern) {
      reasons.push(`Matched to "${pattern.name}" pattern (${(pattern.successRate * 100).toFixed(0)}% success rate)`);
    }

    reasons.push(`Decomposed into ${decomposition.subtasks.length} subtasks`);
    reasons.push(`Selected ${agentSequence.length} agents: ${agentSequence.join(', ')}`);

    if (decomposition.complexity === 'complex') {
      reasons.push('Complex task requiring multiple agents');
    }

    return reasons.join('. ') + '.';
  }

  private estimateDuration(
    decomposition: TaskDecomposition,
    agentSequence: string[]
  ): number {
    return decomposition.estimatedDuration;
  }

  private estimateWorkflowDuration(
    subtasks: Subtask[],
    dependencies: Dependency[]
  ): number {
    const sequentialTasks = dependencies.filter(d => d.type === 'sequential');
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    let duration = 0;

    for (const dep of sequentialTasks) {
      const fromTask = taskMap.get(dep.from);
      const toTask = taskMap.get(dep.to);

      if (fromTask && !visited.has(dep.from)) {
        duration += fromTask.estimatedDuration;
        visited.add(dep.from);
      }

      if (toTask && !visited.has(dep.to)) {
        duration += toTask.estimatedDuration;
        visited.add(dep.to);
      }
    }

    for (const task of subtasks) {
      if (!visited.has(task.id)) {
        duration += task.estimatedDuration;
      }
    }

    return duration;
  }

  getWorkflowPatterns(): Map<string, WorkflowPattern> {
    return new Map(this.workflowPatterns);
  }

  getHistoricalWorkflows(): GeneratedWorkflow[] {
    return [...this.historicalWorkflows];
  }
}

export const workflowGenerator = new WorkflowGenerator();

