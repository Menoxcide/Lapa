/**
 * Agent Mode Awareness Extension for LAPA v1.2 Phase 10
 * 
 * This module extends existing agents with mode awareness capabilities,
 * enabling them to adapt their behavior based on the current Roo mode.
 */

import { Agent, AgentType, Task } from './moe-router.ts';
import { RooMode } from '../modes/types/mode-types.ts';
import { rooModeController } from '../modes/modes.ts';
import { personaManager } from './persona.manager.ts';
import { AgentTool } from '../core/types/agent-types.ts';

/**
 * Extended agent interface with mode awareness
 */
export interface ModeAwareAgent extends Agent {
  /**
   * Get the agent's behavior configuration for a specific mode
   * @param mode The mode to get behavior for
   * @returns Behavior configuration or undefined if not configured
   */
  getModeBehavior(mode: RooMode): ModeBehavior | undefined;
  
  /**
   * Set the agent's behavior configuration for a specific mode
   * @param mode The mode to set behavior for
   * @param behavior Behavior configuration
   */
  setModeBehavior(mode: RooMode, behavior: ModeBehavior): void;
  
  /**
   * Get the agent's persona ID for a specific mode
   * @param mode The mode to get persona for
   * @returns Persona ID or undefined if not configured
   */
  getModePersona(mode: RooMode): string | undefined;
  
  /**
   * Set the agent's persona ID for a specific mode
   * @param mode The mode to set persona for
   * @param personaId Persona ID
   */
  setModePersona(mode: RooMode, personaId: string): void;
  
  /**
   * Adapt the agent's behavior to the current mode
   * @returns Promise that resolves when adaptation is complete
   */
  adaptToCurrentMode(): Promise<void>;
  
  /**
   * Execute a task with mode-specific adaptations
   * @param task The task to execute
   * @returns Promise that resolves with the task result
   */
  executeTaskWithModeAdaptation(task: Task): Promise<any>;
  
  /**
   * Get the current mode
   * @returns Current mode
   */
  getCurrentMode(): RooMode;
}

/**
 * Mode behavior configuration
 */
export interface ModeBehavior {
  /**
   * Mode-specific expertise areas
   */
  expertise: string[];
  
  /**
   * Mode-specific workload capacity multiplier
   */
  capacityMultiplier: number;
  
  /**
   * Mode-specific tools
   */
  tools: string[];
  
  /**
   * Mode-specific custom instructions
   */
  customInstructions: string;
}

/**
 * Mode-aware agent decorator
 */
export class ModeAwareAgentDecorator implements ModeAwareAgent {
  private modeBehaviors: Map<RooMode, ModeBehavior> = new Map();
  private modePersonas: Map<RooMode, string> = new Map();
  private currentModeBehavior: ModeBehavior | null = null;
  private currentModePersona: string | null = null;
  
  constructor(private agent: Agent) {
    // Copy all properties from the original agent
    // Instead of using Object.assign, we'll manually set the properties
    // to avoid issues with readonly properties
  }
  
  // Delegate all other properties and methods to the original agent
  get id(): string {
    return this.agent.id;
  }
  
  get type(): AgentType {
    return this.agent.type;
  }
  
  get name(): string {
    return this.agent.name;
  }
  
  get expertise(): string[] {
    // Return mode-specific expertise if configured, otherwise default
    if (this.currentModeBehavior?.expertise.length) {
      return this.currentModeBehavior.expertise;
    }
    return this.agent.expertise;
  }
  
  get workload(): number {
    // Apply capacity multiplier if configured
    if (this.currentModeBehavior?.capacityMultiplier && this.currentModeBehavior.capacityMultiplier !== 1) {
      return Math.round(this.agent.workload * this.currentModeBehavior.capacityMultiplier);
    }
    return this.agent.workload;
  }
  
  get capacity(): number {
    // Apply capacity multiplier if configured
    if (this.currentModeBehavior?.capacityMultiplier && this.currentModeBehavior.capacityMultiplier !== 1) {
      return Math.round(this.agent.capacity * this.currentModeBehavior.capacityMultiplier);
    }
    return this.agent.capacity;
  }
  
  /**
   * Get the agent's behavior configuration for a specific mode
   * @param mode The mode to get behavior for
   * @returns Behavior configuration or undefined if not configured
   */
  getModeBehavior(mode: RooMode): ModeBehavior | undefined {
    return this.modeBehaviors.get(mode);
  }
  
  /**
   * Set the agent's behavior configuration for a specific mode
   * @param mode The mode to set behavior for
   * @param behavior Behavior configuration
   */
  setModeBehavior(mode: RooMode, behavior: ModeBehavior): void {
    this.modeBehaviors.set(mode, behavior);
    console.log(`Set behavior for agent ${this.name} in mode ${mode}`);
  }
  
  /**
   * Get the agent's persona ID for a specific mode
   * @param mode The mode to get persona for
   * @returns Persona ID or undefined if not configured
   */
  getModePersona(mode: RooMode): string | undefined {
    return this.modePersonas.get(mode);
  }
  
  /**
   * Set the agent's persona ID for a specific mode
   * @param mode The mode to set persona for
   * @param personaId Persona ID
   */
  setModePersona(mode: RooMode, personaId: string): void {
    this.modePersonas.set(mode, personaId);
    console.log(`Set persona ${personaId} for agent ${this.name} in mode ${mode}`);
  }
  
  /**
   * Adapt the agent's behavior to the current mode
   * @returns Promise that resolves when adaptation is complete
   */
  async adaptToCurrentMode(): Promise<void> {
    const currentMode = rooModeController.getCurrentMode();
    console.log(`Adapting agent ${this.name} to mode ${currentMode}`);
    
    // Get mode-specific behavior
    const behavior = this.modeBehaviors.get(currentMode);
    if (behavior) {
      // Apply mode-specific expertise
      if (behavior.expertise.length > 0) {
        // In a real implementation, we would update the agent's expertise
        // For now, we'll just log the change
        console.log(`Updating expertise for agent ${this.name}:`, behavior.expertise);
      }
      
      // Apply mode-specific capacity multiplier
      if (behavior.capacityMultiplier !== 1) {
        // In a real implementation, we would update the agent's capacity
        // For now, we'll just log the change
        console.log(`Adjusting capacity for agent ${this.name} by factor: ${behavior.capacityMultiplier}`);
      }
      
      // Store current behavior
      this.currentModeBehavior = behavior;
    }
    
    // Get mode-specific persona
    const personaId = this.modePersonas.get(currentMode);
    if (personaId) {
      // Verify persona exists
      const persona = await personaManager.getPersona(personaId);
      if (persona) {
        // In a real implementation, we would apply the persona to the agent
        // For now, we'll just log the change
        console.log(`Applying persona ${personaId} to agent ${this.name}`);
        this.currentModePersona = personaId;
      } else {
        console.warn(`Persona ${personaId} not found for agent ${this.name} in mode ${currentMode}`);
      }
    }
    
    console.log(`Agent ${this.name} adapted to mode ${currentMode}`);
  }
  
  /**
   * Execute a task with mode-specific adaptations
   * @param task The task to execute
   * @returns Promise that resolves with the task result
   */
  async executeTaskWithModeAdaptation(task: Task): Promise<any> {
    // Adapt to current mode if not already done
    if (!this.currentModeBehavior && !this.currentModePersona) {
      await this.adaptToCurrentMode();
    }
    
    // Apply persona to task description if persona is configured
    let processedTask = task;
    if (this.currentModePersona) {
      const persona = await personaManager.getPersona(this.currentModePersona);
      if (persona) {
        const adjustedDescription = personaManager.applyPersonaToContent(
          this.currentModePersona, 
          task.description
        );
        
        processedTask = {
          ...task,
          description: adjustedDescription
        };
        
        console.log(`Applied persona ${this.currentModePersona} to task description`);
      }
    }
    
    // Apply mode-specific custom instructions if configured
    if (this.currentModeBehavior?.customInstructions) {
      processedTask = {
        ...processedTask,
        description: `${processedTask.description}\n\nCustom Instructions: ${this.currentModeBehavior.customInstructions}`
      };
      
      console.log(`Applied custom instructions to task description`);
    }
    
    // In a real implementation, this would delegate to the actual agent execution logic
    // For now, we'll just log the task execution
    console.log(`Executing task with mode adaptations:`, processedTask);
    
    // Return a mock result
    return {
      success: true,
      result: `Task executed by ${this.name} in ${rooModeController.getCurrentMode()} mode`,
      taskId: task.id
    };
  }
  
  // Add missing method to resolve test failures
  getCurrentMode(): RooMode {
    return rooModeController.getCurrentMode();
  }
}
/**
 * Factory function to create a mode-aware agent from an existing agent
 * @param agent The base agent to extend
 * @returns Mode-aware agent
 */
export function createModeAwareAgent(agent: Agent): ModeAwareAgent {
  return new ModeAwareAgentDecorator(agent);
}

/**
 * Default mode behaviors for LAPA agents
 */
export const DEFAULT_MODE_BEHAVIORS: Record<RooMode, Partial<Record<AgentType, ModeBehavior>>> = {
  code: {
    coder: {
      expertise: ['code_generation', 'implementation', 'refactoring'],
      capacityMultiplier: 1.2,
      tools: ['code-generator', 'code-formatter', 'linting-tool'],
      customInstructions: 'Focus on clean, efficient, and well-documented code.'
    },
    reviewer: {
      expertise: ['code_review', 'quality_assurance', 'best_practices'],
      capacityMultiplier: 1.1,
      tools: ['code-analyzer', 'security-scanner', 'performance-analyzer'],
      customInstructions: 'Provide detailed feedback with specific improvement suggestions.'
    },
    tester: {
      expertise: ['test_creation', 'test_execution', 'coverage_analysis'],
      capacityMultiplier: 1.3,
      tools: ['test-generator', 'test-runner', 'coverage-analyzer'],
      customInstructions: 'Ensure comprehensive test coverage including edge cases.'
    }
  },
  architect: {
    planner: {
      expertise: ['system_design', 'architecture_planning', 'technology_selection'],
      capacityMultiplier: 1.5,
      tools: ['diagram-generator', 'architecture-analyzer', 'technology-recommender'],
      customInstructions: 'Create scalable, maintainable, and robust system architectures.'
    },
    optimizer: {
      expertise: ['performance_optimization', 'scalability', 'resource_management'],
      capacityMultiplier: 1.2,
      tools: ['performance-analyzer', 'resource-monitor', 'scaling-calculator'],
      customInstructions: 'Focus on measurable performance improvements and scalability.'
    }
  },
  ask: {
    researcher: {
      expertise: ['information_retrieval', 'knowledge_extraction', 'documentation'],
      capacityMultiplier: 1.3,
      tools: ['knowledge-retriever', 'document-parser', 'web-search'],
      customInstructions: 'Provide accurate, comprehensive, and well-structured information.'
    },
    reviewer: {
      expertise: ['fact_checking', 'accuracy_verification', 'content_validation'],
      capacityMultiplier: 1.1,
      tools: ['fact-checker', 'accuracy-analyzer', 'content-validator'],
      customInstructions: 'Verify all information for accuracy and cite reliable sources.'
    }
  },
  debug: {
    debugger: {
      expertise: ['bug_detection', 'error_analysis', 'fix_recommendation'],
      capacityMultiplier: 1.4,
      tools: ['error-analyzer', 'stack-trace-parser', 'fix-recommender'],
      customInstructions: 'Provide systematic debugging approach with clear resolution steps.'
    },
    optimizer: {
      expertise: ['performance_debugging', 'profiling', 'bottleneck_identification'],
      capacityMultiplier: 1.2,
      tools: ['profiling-tool', 'memory-analyzer', 'cpu-monitor'],
      customInstructions: 'Identify and resolve performance bottlenecks efficiently.'
    }
  },
  custom: {
    // Custom mode uses default behaviors
  },
  'test-engineer': {
    tester: {
      expertise: ['test_creation', 'test_execution', 'coverage_analysis'],
      capacityMultiplier: 1.5,
      tools: ['test-generator', 'test-runner', 'coverage-analyzer'],
      customInstructions: 'Ensure comprehensive test coverage including edge cases.'
    }
  },
  'docs-specialist': {
    reviewer: {
      expertise: ['documentation', 'content_validation', 'technical_writing'],
      capacityMultiplier: 1.2,
      tools: ['document-parser', 'content-validator'],
      customInstructions: 'Ensure documentation is clear, accurate, and well-structured.'
    }
  },
  'code-reviewer': {
    reviewer: {
      expertise: ['code_review', 'quality_assurance', 'best_practices'],
      capacityMultiplier: 1.4,
      tools: ['code-analyzer', 'security-scanner', 'performance-analyzer'],
      customInstructions: 'Provide detailed feedback with specific improvement suggestions.'
    }
  },
  orchestrator: {
    planner: {
      expertise: ['workflow_coordination', 'task_scheduling', 'resource_management'],
      capacityMultiplier: 1.3,
      tools: ['workflow-coordinator', 'task-scheduler'],
      customInstructions: 'Coordinate agents and manage task workflows efficiently.'
    }
  }
};

/**
 * Initializes mode behaviors for an agent
 * @param agent Mode-aware agent
 * @param agentType Type of the agent
 */
export function initializeModeBehaviors(agent: ModeAwareAgent, agentType: AgentType): void {
  console.log(`Initializing mode behaviors for agent ${agent.name} (${agentType})`);
  
  // Set up mode behaviors for each mode
  for (const [mode, behaviors] of Object.entries(DEFAULT_MODE_BEHAVIORS)) {
    const modeBehavior = behaviors[agentType as AgentType];
    if (modeBehavior) {
      agent.setModeBehavior(mode as RooMode, modeBehavior);
    }
  }
  
  // Set up mode personas for each mode
  const personaMappings: Record<RooMode, Partial<Record<AgentType, string>>> = {
    code: {
      coder: 'coder-default',
      reviewer: 'reviewer-default',
      tester: 'tester-default'
    },
    architect: {
      planner: 'planner-default',
      optimizer: 'optimizer-default'
    },
    ask: {
      researcher: 'planner-default', // Using planner for research capabilities
      reviewer: 'reviewer-default'
    },
    debug: {
      debugger: 'debugger-default',
      optimizer: 'optimizer-default'
    },
    custom: {
      // Custom mode uses default personas
    },
    'test-engineer': {
      tester: 'tester-default'
    },
    'docs-specialist': {
      reviewer: 'reviewer-default'
    },
    'code-reviewer': {
      reviewer: 'reviewer-default'
    },
    orchestrator: {
      planner: 'planner-default'
    }
  };
  
  for (const [mode, personas] of Object.entries(personaMappings)) {
    const personaId = personas[agentType as AgentType];
    if (personaId) {
      agent.setModePersona(mode as RooMode, personaId);
    }
  }
  
  console.log(`Mode behaviors initialized for agent ${agent.name}`);
}