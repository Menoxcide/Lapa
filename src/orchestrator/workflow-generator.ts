/**
 * Predictive Workflow Generation System
 * 
 * Auto-generates optimal multi-agent workflows based on task analysis
 * and historical patterns.
 */

import { agentSelector, type AgentRecommendation } from './agent-selector.ts';
import { neuraforgeOrchestrator, type MultiAgentWorkflow } from './neuraforge-orchestrator.ts';

export interface TaskDecomposition {
  mainTask: string;
  subtasks: Subtask[];
  dependencies: Dependency[];
  estimatedDuration: number; // milliseconds
  complexity: 'simple' | 'medium' | 'complex';
}

export interface Subtask {
  id: string;
  description: string;
  agentRecommendations: AgentRecommendation[];
  estimatedDuration: number;
  dependencies: string[]; // IDs of dependent subtasks
  priority: 'low' | 'medium' | 'high';
}

export interface Dependency {
  from: string; // Subtask ID
  to: string; // Subtask ID
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

/**
 * Predictive Workflow Generator
 */
export class WorkflowGenerator {
  private workflowPatterns: Map<string, WorkflowPattern> = new Map();
  private historicalWorkflows: GeneratedWorkflow[] = [];

  constructor() {
    this.initializeWorkflowPatterns();
  }

  /**
   * Initialize common workflow patterns
   */
  private initializeWorkflowPatterns(): void {
    // Feature implementation pattern
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

    // Bug fixing pattern
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

    // Refactoring pattern
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

    // Documentation pattern
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

  /**
   * Generate workflow from task description
   */
  async generateWorkflow(taskDescription: string): Promise<GeneratedWorkflow> {
    // 1. Analyze task and decompose
    const decomposition = await this.decomposeTask(taskDescription);

    // 2. Match to existing patterns
    const patternMatch = this.matchWorkflowPattern(decomposition);

    // 3. Generate agent sequence
    const agentSequence = await this.generateAgentSequence(decomposition, patternMatch);

    // 4. Determine execution sequence
    const sequence = this.determineExecutionSequence(decomposition, patternMatch);

    // 5. Generate tasks for each agent
    const tasks = this.generateTasks(decomposition, agentSequence);

    // 6. Calculate confidence and reasoning
    const confidence = this.calculateConfidence(decomposition, patternMatch, agentSequence);
    const reasoning = this.generateReasoning(decomposition, patternMatch, agentSequence);

    // 7. Estimate duration
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

    // Store for learning
    this.historicalWorkflows.push(workflow);
    if (this.historicalWorkflows.length > 100) {
      this.historicalWorkflows.shift();
    }

    return workflow;
  }

  /**
   * Decompose task into subtasks
   */
  private async decomposeTask(taskDescription: string): Promise<TaskDecomposition> {
    const lower = taskDescription.toLowerCase();
    
    // Simple keyword-based decomposition
    const subtasks: Subtask[] = [];
    const dependencies: Dependency[] = [];
    
    // Check for common patterns
    if (lower.includes('implement') || lower.includes('create') || lower.includes('build')) {
      // Implementation workflow
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
        type: 'parallel' // Can run in parallel with tests
      });
    }

    // Get agent recommendations for each subtask
    for (const subtask of subtasks) {
      const recommendations = await agentSelector.selectAgent(subtask.description);
      subtask.agentRecommendations = recommendations;
    }

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    if (subtasks.length <= 2) complexity = 'simple';
    else if (subtasks.length > 4) complexity = 'complex';

    // Estimate total duration
    const estimatedDuration = this.estimateWorkflowDuration(subtasks, dependencies);

    return {
      mainTask: taskDescription,
      subtasks,
      dependencies,
      estimatedDuration,
      complexity
    };
  }

  /**
   * Match task to workflow pattern
   */
  private matchWorkflowPattern(decomposition: TaskDecomposition): WorkflowPattern | null {
    const taskLower = decomposition.mainTask.toLowerCase();
    
    // Check each pattern
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

  /**
   * Generate agent sequence from decomposition
   */
  private async generateAgentSequence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null
  ): Promise<string[]> {
    if (pattern) {
      return [...pattern.agents];
    }

    // Generate from subtasks
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

    // Fallback to common sequence
    if (agentSequence.length === 0) {
      return ['PLANNER', 'CODER', 'TEST', 'REVIEWER'];
    }

    return agentSequence;
  }

  /**
   * Determine execution sequence
   */
  private determineExecutionSequence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null
  ): 'parallel' | 'sequential' | 'conditional' {
    if (pattern) {
      return pattern.sequence;
    }

    // Check dependencies
    const hasDependencies = decomposition.dependencies.length > 0;
    const hasParallelDeps = decomposition.dependencies.some(d => d.type === 'parallel');

    if (hasParallelDeps) {
      return 'conditional'; // Mix of sequential and parallel
    }

    return hasDependencies ? 'sequential' : 'parallel';
  }

  /**
   * Generate tasks for each agent
   */
  private generateTasks(
    decomposition: TaskDecomposition,
    agentSequence: string[]
  ): string[] {
    const tasks: string[] = [];

    // Map subtasks to agents
    for (let i = 0; i < agentSequence.length; i++) {
      const agent = agentSequence[i];
      const subtask = decomposition.subtasks[i] || decomposition.subtasks[0];
      
      tasks.push(subtask.description);
    }

    return tasks;
  }

  /**
   * Calculate workflow confidence
   */
  private calculateConfidence(
    decomposition: TaskDecomposition,
    pattern: WorkflowPattern | null,
    agentSequence: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Pattern match bonus
    if (pattern) {
      confidence += 0.3;
      confidence *= pattern.successRate;
    }

    // Agent recommendation confidence
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

    // Complexity penalty
    if (decomposition.complexity === 'complex') {
      confidence *= 0.9;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning for workflow
   */
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

  /**
   * Estimate workflow duration
   */
  private estimateDuration(
    decomposition: TaskDecomposition,
    agentSequence: string[]
  ): number {
    return decomposition.estimatedDuration;
  }

  /**
   * Estimate workflow duration from subtasks and dependencies
   */
  private estimateWorkflowDuration(
    subtasks: Subtask[],
    dependencies: Dependency[]
  ): number {
    // Simple estimation: sum of sequential tasks, max of parallel tasks
    const sequentialTasks = dependencies.filter(d => d.type === 'sequential');
    const parallelTasks = dependencies.filter(d => d.type === 'parallel');

    let duration = 0;

    // Calculate sequential path
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const visited = new Set<string>();

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

    // Add remaining tasks
    for (const task of subtasks) {
      if (!visited.has(task.id)) {
        duration += task.estimatedDuration;
      }
    }

    return duration;
  }

  /**
   * Get workflow patterns
   */
  getWorkflowPatterns(): Map<string, WorkflowPattern> {
    return new Map(this.workflowPatterns);
  }

  /**
   * Get historical workflows
   */
  getHistoricalWorkflows(): GeneratedWorkflow[] {
    return [...this.historicalWorkflows];
  }
}

interface WorkflowPattern {
  name: string;
  sequence: 'parallel' | 'sequential' | 'conditional';
  agents: string[];
  tasks: string[];
  successRate: number;
}

// Export singleton instance
export const workflowGenerator = new WorkflowGenerator();

