/**
 * NEURAFORGE Master Orchestrator
 * 
 * This module implements the master orchestration system for LAPA-VOID,
 * coordinating agent deployment, persona management, and multi-agent workflows.
 * 
 * When `/neuraforge` is invoked, this orchestrator operates on the ENTIRE
 * Lapa-Void-IDE project context, not just the persona system.
 */

import { personaManager, type EnhancedPersona } from '../agents/persona.manager.ts';
import { agentSpawningSystem, type SpawnRequest, type SpawnResult } from '../swarm/agent.spawn.ts';
import { AgentType, Task } from '../agents/moe-router.ts';
import { agentSelector, type AgentRecommendation } from './agent-selector.ts';
import { agentMonitor } from './agent-monitor.ts';
import { workflowGenerator, type GeneratedWorkflow } from './workflow-generator.ts';
import { taskRouter, type RoutingDecision } from './task-router.ts';
import { workflowOptimizer, type OptimizedWorkflow } from './workflow-optimizer.ts';
import { skillManager, type SkillExecutionRequest, type SkillExecutionResponse, type SkillMetadata } from './skill-manager.ts';
import { deploymentWorkflowOrchestrator, type DeploymentContext, type DeploymentWorkflowResult } from './deployment-workflow.ts';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
// Use a workaround for TypeScript compilation when targeting CommonJS
let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  // Fallback for environments where import.meta is not available
  __dirname = process.cwd();
}

export interface AgentDeployment {
  agentName: string;
  agentId?: string;
  personaId: string;
  persona?: EnhancedPersona;
  promptPath?: string;
  promptContent?: string;
  task?: string;
  status: 'pending' | 'initializing' | 'active' | 'completed' | 'failed';
  deployedAt?: Date;
  metrics?: DeploymentMetrics;
}

export interface DeploymentMetrics {
  deploymentTime: number;
  agentStatus: string;
  personaLoaded: boolean;
  promptLoaded: boolean;
  spawnSuccess: boolean;
  spawnTime?: number;
}

export interface OrchestrationMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
  activeAgents: number;
  agentSelectionAccuracy: number;
  taskRoutingEfficiency: number;
  workflowSuccessRate: number;
  skillsAvailable: number;
  skillsExecuted: number;
  skillsExecutionSuccessRate: number;
  lastUpdated: Date;
}

export interface MultiAgentWorkflow {
  workflowId: string;
  name: string;
  agents: AgentDeployment[];
  sequence: 'parallel' | 'sequential' | 'conditional';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  skills?: string[]; // Skill IDs used in this workflow
}

export interface SkillExecutionContext {
  agentId?: string;
  agentName?: string;
  deploymentId?: string;
  workflowId?: string;
  sessionId?: string;
  taskId?: string;
}

/**
 * NEURAFORGE Master Orchestrator
 */
export class NeuraforgeOrchestrator {
  private deployments: Map<string, AgentDeployment> = new Map();
  private workflows: Map<string, MultiAgentWorkflow> = new Map();
  private metrics: OrchestrationMetrics;
  private agentNameToTypeMap: Map<string, AgentType> = new Map();
  private skillExecutions: Map<string, { success: boolean; timestamp: Date }> = new Map();

  constructor() {
    this.initializeAgentNameMapping();
    this.metrics = this.initializeMetrics();
    
    // Initialize skill manager
    this.initializeSkillManager();
    
    // Start agent monitoring
    agentMonitor.startMonitoring(2000); // Update every 2 seconds
  }

  /**
   * Initialize Claude Skills integration
   */
  private async initializeSkillManager(): Promise<void> {
    try {
      await skillManager.initialize();
      const skills = skillManager.getSkills();
      this.metrics.skillsAvailable = skills.length;
      this.metrics.lastUpdated = new Date();
      console.log(`[NEURAFORGE] Claude Skills initialized: ${skills.length} skill(s) available`);
    } catch (error) {
      console.warn('[NEURAFORGE] Skill Manager initialization failed:', error);
      // Continue without skills if initialization fails
    }
  }

  /**
   * Initialize agent name to type mapping
   */
  private initializeAgentNameMapping(): void {
    // Map NEURAFORGE agent names to AgentType
    const mappings: Array<[string, AgentType]> = [
      ['ARCHITECT', 'planner'],
      ['CODER', 'coder'],
      ['REVIEWER', 'reviewer'],
      ['TEST', 'tester'],
      ['DEBUGGER', 'debugger'],
      ['OPTIMIZER', 'optimizer'],
      ['PLANNER', 'planner'],
      ['VALIDATOR', 'reviewer'],
      ['INTEGRATOR', 'coder'],
      ['DEPLOYER', 'planner'],
      ['DOCUMENTATION', 'reviewer'],
      ['RESEARCH_WIZARD', 'planner'],
      ['MCP', 'coder'],
      ['FEATURE', 'coder'],
      ['FILESYSTEM', 'coder'],
      ['NEURAFORGE', 'planner'],
      ['PERSONA_EVOLVER', 'planner'],
      ['GITHUB_OPERATIONS', 'planner'],
      ['WEB_RESEARCH_HYBRID', 'planner']
    ];

    mappings.forEach(([name, type]) => {
      this.agentNameToTypeMap.set(name, type);
    });
  }

  /**
   * Initialize orchestration metrics
   */
  private initializeMetrics(): OrchestrationMetrics {
    return {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageDeploymentTime: 0,
      activeAgents: 0,
      agentSelectionAccuracy: 100, // Start at 100%, adjust based on performance
      taskRoutingEfficiency: 100,
      workflowSuccessRate: 100,
      skillsAvailable: 0,
      skillsExecuted: 0,
      skillsExecutionSuccessRate: 100,
      lastUpdated: new Date()
    };
  }

  /**
   * Deploy an agent via /neuraforge command
   * 
   * Now supports AI-powered agent selection if agentName is not provided
   */
  async deployAgent(
    agentName?: string,
    task?: string,
    background: boolean = true,
    useAISelection: boolean = false
  ): Promise<AgentDeployment> {
    const startTime = Date.now();
    let selectedAgentName: string;
    
    // AI-powered agent selection if enabled and agentName not provided
    if ((!agentName || useAISelection) && task) {
      const recommendation = await agentSelector.getBestAgent(task);
      if (recommendation && recommendation.confidence > 0.6) {
        selectedAgentName = recommendation.agentName;
        console.log(`🤖 AI selected agent: ${selectedAgentName} (confidence: ${(recommendation.confidence * 100).toFixed(1)}%)`);
        console.log(`   Reasoning: ${recommendation.reasoning}`);
      } else {
        selectedAgentName = agentName || 'PLANNER'; // Fallback
      }
    } else {
      selectedAgentName = agentName || 'PLANNER'; // Fallback
    }
    
    if (!selectedAgentName) {
      throw new Error('Agent name required or provide task description for AI selection');
    }
    
    const deploymentId = `deploy-${selectedAgentName.toLowerCase()}-${Date.now()}`;

    const deployment: AgentDeployment = {
      agentName: selectedAgentName,
      personaId: this.getPersonaId(selectedAgentName),
      status: 'pending',
      deployedAt: new Date()
    };

    this.deployments.set(deploymentId, deployment);

    try {
      // 1. Load persona from PersonaManager
      await personaManager.waitForInitialization();
      const persona = deployment.personaId ? await personaManager.getEnhancedPersona(deployment.personaId) : undefined;
      
      if (!persona && selectedAgentName) {
        // Fallback: try to load from markdown directly
        const fallbackPersona = await this.loadPersonaFromMarkdown(selectedAgentName);
        if (fallbackPersona) {
          deployment.persona = fallbackPersona;
        } else {
          throw new Error(`Persona not found for agent: ${selectedAgentName}`);
        }
      } else if (persona) {
        deployment.persona = persona;
      }

      // 2. Load prompt file
      if (selectedAgentName) {
        const promptPath = await this.findPromptFile(selectedAgentName);
        if (promptPath) {
          deployment.promptPath = promptPath;
          deployment.promptContent = await readFile(promptPath, 'utf-8');
        }
      }

      // 3. Update status
      deployment.status = 'initializing';

      // 4. Spawn agent via AgentSpawningSystem
      const agentType = this.agentNameToTypeMap.get(selectedAgentName) || 'planner';
      const spawnRequest: SpawnRequest = {
        parentId: 'neuraforge-orchestrator',
        agentType,
        task: this.createTaskFromDescription(task || `Execute ${selectedAgentName} agent tasks`),
        context: {
          agentName: selectedAgentName,
          persona: deployment.persona,
          prompt: deployment.promptContent,
          deploymentId
        },
        priority: 'high'
      };

      const spawnResult = await agentSpawningSystem.spawnAgent(spawnRequest);
      
      if (spawnResult.success) {
        deployment.agentId = spawnResult.agentId;
        deployment.status = 'active';
        
        // Update metrics
        deployment.metrics = {
          deploymentTime: Date.now() - startTime,
          agentStatus: 'active',
          personaLoaded: !!deployment.persona,
          promptLoaded: !!deployment.promptContent,
          spawnSuccess: true,
          spawnTime: spawnResult.spawnTime
        };
      } else {
        deployment.status = 'failed';
        deployment.metrics = {
          deploymentTime: Date.now() - startTime,
          agentStatus: 'failed',
          personaLoaded: !!deployment.persona,
          promptLoaded: !!deployment.promptContent,
          spawnSuccess: false
        };
        throw new Error(`Failed to spawn agent: ${spawnResult.error}`);
      }

      // 5. Update orchestration metrics
      this.updateMetrics(deployment);
      
      // 6. Record outcome for AI learning
      if (task) {
        agentSelector.recordOutcome(
          task,
          selectedAgentName,
          deployment.status === 'active',
          deployment.metrics?.deploymentTime || 0
        );
      }

      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.metrics = {
        deploymentTime: Date.now() - startTime,
        agentStatus: 'failed',
        personaLoaded: false,
        promptLoaded: false,
        spawnSuccess: false
      };
      
      this.metrics.failedDeployments++;
      this.metrics.totalDeployments++;
      this.metrics.lastUpdated = new Date();
      
      throw error;
    }
  }

  /**
   * Get persona ID from agent name
   */
  private getPersonaId(agentName: string): string {
    // Map agent names to persona IDs
    const personaIdMap: Record<string, string> = {
      'ARCHITECT': 'architect-agent',
      'CODER': 'coder-agent',
      'REVIEWER': 'reviewer-agent',
      'TEST': 'test-agent',
      'DEBUGGER': 'debugger-agent',
      'OPTIMIZER': 'optimizer-agent',
      'PLANNER': 'planner-agent',
      'VALIDATOR': 'validator-agent',
      'INTEGRATOR': 'integrator-agent',
      'DEPLOYER': 'deployer-agent',
      'DOCUMENTATION': 'documentation-specialist',
      'RESEARCH_WIZARD': 'research-wizard',
      'MCP': 'mcp-agent',
      'FEATURE': 'feature-agent',
      'GITHUB_OPERATIONS': 'github-operations',
      'WEB_RESEARCH_HYBRID': 'web-research-hybrid',
      'FILESYSTEM': 'filesystem-expert',
      'NEURAFORGE': 'neuraforge',
      'PERSONA_EVOLVER': 'persona-evolver'
    };

    return personaIdMap[agentName] || agentName.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Load persona from markdown file directly (fallback)
   */
  private async loadPersonaFromMarkdown(agentName: string): Promise<EnhancedPersona | null> {
    try {
      const { personaMarkdownParser } = await import('../agents/persona-markdown-parser.ts');
      
      // Map agent names to persona file names
      const personaFileMap: Record<string, string> = {
        'DOCUMENTATION': 'DOCUMENTATION_SPECIALIST',
        'FILESYSTEM': 'FILESYSTEM_EXPERT',
        'RESEARCH_WIZARD': 'RESEARCH_WIZARD',
        'NEURAFORGE': 'NEURAFORGE',
        'PERSONA_EVOLVER': 'PERSONA_EVOLVER',
        'GITHUB_OPERATIONS': 'GITHUB_OPERATIONS',
        'WEB_RESEARCH_HYBRID': 'WEB_RESEARCH_HYBRID'
      };

      const personaFileName = personaFileMap[agentName] || agentName;
      const personaPath = join(__dirname, '..', '..', 'docs', 'personas', `${personaFileName}_PERSONA.md`);
      
      const parsedPersona = await personaMarkdownParser.parsePersonaFile(personaPath);
      
      // Convert ParsedPersona to EnhancedPersona
      return {
        id: parsedPersona.id,
        name: parsedPersona.name,
        personality: parsedPersona.personality,
        communicationStyle: parsedPersona.communicationStyle,
        expertiseAreas: parsedPersona.expertiseAreas,
        interactionPreferences: parsedPersona.interactionPreferences,
        behaviorRules: parsedPersona.behaviorRules,
        customInstructions: parsedPersona.customInstructions,
        markdownContent: parsedPersona.markdownContent,
        metadata: parsedPersona.metadata,
        sections: parsedPersona.sections
      };
    } catch (error) {
      console.warn(`Failed to load persona from markdown for ${agentName}:`, error);
      return null;
    }
  }

  /**
   * Find prompt file for agent
   */
  private async findPromptFile(agentName: string): Promise<string | null> {
    const promptNameMap: Record<string, string> = {
      'DOCUMENTATION': 'DOCUMENTATION_SPECIALIST',
      'FILESYSTEM': 'FILESYSTEM_EXPERT',
      'RESEARCHER': 'RESEARCH_WIZARD',
      'RESEARCH_WIZARD': 'RESEARCH_WIZARD',
      'NEURAFORGE': 'NEURAFORGE',
      'PERSONA_EVOLVER': 'PERSONA_EVOLVER',
      'GITHUB_OPERATIONS': 'GITHUB_OPERATIONS',
      'WEB_RESEARCH_HYBRID': 'WEB_RESEARCH_HYBRID'
    };

    let promptFileName: string;
    if (promptNameMap[agentName]) {
      promptFileName = promptNameMap[agentName];
    } else {
      promptFileName = agentName.endsWith('_AGENT') ? agentName : `${agentName}_AGENT`;
    }

    // Check docs/prompts/ first, then root
    const promptPathDocs = join(__dirname, '..', '..', 'docs', 'prompts', `${promptFileName}_PROMPT.txt`);
    const promptPathRoot = join(__dirname, '..', '..', `${promptFileName}_PROMPT.txt`);

    try {
      await readFile(promptPathDocs, 'utf-8');
      return promptPathDocs;
    } catch {
      try {
        await readFile(promptPathRoot, 'utf-8');
        return promptPathRoot;
      } catch {
        return null;
      }
    }
  }

  /**
   * Create task from description
   */
  private createTaskFromDescription(description: string): Task {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      type: 'general',
      priority: 5, // High priority (1-10 scale)
      context: {
        createdAt: new Date().toISOString(),
        source: 'neuraforge-orchestrator'
      }
    };
  }

  /**
   * Update orchestration metrics
   */
  private updateMetrics(deployment: AgentDeployment): void {
    this.metrics.totalDeployments++;
    
    if (deployment.status === 'active') {
      this.metrics.successfulDeployments++;
      this.metrics.activeAgents++;
    } else if (deployment.status === 'failed') {
      this.metrics.failedDeployments++;
    }

    // Update average deployment time
    if (deployment.metrics) {
      const totalTime = this.metrics.averageDeploymentTime * (this.metrics.totalDeployments - 1);
      this.metrics.averageDeploymentTime = (totalTime + deployment.metrics.deploymentTime) / this.metrics.totalDeployments;
    }

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId: string): AgentDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all active deployments
   */
  getActiveDeployments(): AgentDeployment[] {
    return Array.from(this.deployments.values()).filter(d => d.status === 'active');
  }

  /**
   * Get orchestration metrics
   */
  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Create multi-agent workflow
   * 
   * Now supports predictive workflow generation from task description
   */
  async createWorkflow(
    nameOrTask: string,
    agentNames?: string[],
    sequence?: 'parallel' | 'sequential' | 'conditional',
    tasks?: string[]
  ): Promise<MultiAgentWorkflow> {
    // If agentNames not provided, use predictive workflow generation
    if (!agentNames && !sequence) {
      const generated = await workflowGenerator.generateWorkflow(nameOrTask);
      
      // Optimize workflow
      const optimized = await workflowOptimizer.optimizeWorkflow(generated);
      
      console.log(`🤖 Generated workflow: ${optimized.optimizedWorkflow.name}`);
      console.log(`   Agents: ${optimized.optimizedWorkflow.agentSequence.join(' → ')}`);
      console.log(`   Estimated time: ${(optimized.optimizedWorkflow.estimatedDuration / 1000).toFixed(1)}s`);
      console.log(`   Optimizations: ${optimized.improvements.length} improvement(s) applied`);
      
      // Use optimized workflow
      agentNames = optimized.optimizedWorkflow.agentSequence;
      sequence = optimized.optimizedWorkflow.sequence;
      tasks = optimized.optimizedWorkflow.tasks;
      nameOrTask = optimized.optimizedWorkflow.name;
    }
    
    if (!agentNames || agentNames.length === 0) {
      throw new Error('Agent names required or provide task description for workflow generation');
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow: MultiAgentWorkflow = {
      workflowId,
      name: nameOrTask,
      agents: [],
      sequence: sequence || 'sequential',
      status: 'pending',
      startedAt: new Date()
    };

    // Use predictive routing for each agent
    const routingDecisions: RoutingDecision[] = [];
    for (let i = 0; i < agentNames.length; i++) {
      const agentName = agentNames[i];
      const task = tasks?.[i] || `Execute ${agentName} as part of workflow: ${nameOrTask}`;
      
      // Get routing decision
      const routing = await taskRouter.routeTask(task, 'high'); // High priority for workflows
      routingDecisions.push(routing);
      
      // Deploy agent with routing information
      try {
        const deployment = await this.deployAgent(agentName, task, true);
        workflow.agents.push(deployment);
      } catch (error) {
        console.error(`Failed to deploy agent ${agentName} for workflow:`, error);
        workflow.status = 'failed';
        return workflow;
      }
    }

    workflow.status = 'running';
    this.workflows.set(workflowId, workflow);

    console.log(`✅ Workflow created: ${workflowId}`);
    console.log(`   Routing decisions: ${routingDecisions.length} agent(s) routed`);

    return workflow;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): MultiAgentWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all available agents
   */
  async listAvailableAgents(): Promise<string[]> {
    return [
      // Core Helix Team (12 agents)
      'ARCHITECT',
      'CODER',
      'REVIEWER',
      'TEST',
      'DEBUGGER',
      'OPTIMIZER',
      'PLANNER',
      'VALIDATOR',
      'INTEGRATOR',
      'DEPLOYER',
      'DOCUMENTATION',
      'RESEARCH_WIZARD',
      // Specialized Agents
      'MCP',
      'FEATURE',
      'FILESYSTEM',
      // Master Orchestrator
      'NEURAFORGE',
      // Evolution Agent
      'PERSONA_EVOLVER'
    ];
  }

  /**
   * Execute a Claude Skill within an agent context
   * 
   * This method integrates Claude Skills into NEURAFORGE orchestration,
   * allowing agents to execute skills during workflow execution.
   * 
   * @param skillId The ID of the skill to execute
   * @param inputs Input parameters for the skill
   * @param context Execution context (agent, workflow, etc.)
   * @returns Skill execution response
   */
  async executeSkill(
    skillId: string,
    inputs: Record<string, unknown>,
    context?: SkillExecutionContext
  ): Promise<SkillExecutionResponse> {
    const startTime = Date.now();
    
    try {
      // Validate skill exists
      const skill = skillManager.getSkill(skillId);
      if (!skill) {
        this.metrics.skillsExecuted++;
        this.updateSkillMetrics(false);
        return {
          success: false,
          error: `Skill not found: ${skillId}`,
          executionTime: Date.now() - startTime
        };
      }

      // Prepare execution request
      const request: SkillExecutionRequest = {
        skillId,
        inputs,
        context: {
          ...context,
          orchestrator: 'neuraforge',
          timestamp: new Date().toISOString()
        },
        agentId: context?.agentId,
        sessionId: context?.sessionId
      };

      // Execute skill
      const result = await skillManager.executeSkill(request);

      // Track execution
      this.metrics.skillsExecuted++;
      this.skillExecutions.set(`${skillId}-${Date.now()}`, {
        success: result.success,
        timestamp: new Date()
      });

      // Update metrics
      this.updateSkillMetrics(result.success);

      console.log(`[NEURAFORGE] Skill executed: ${skillId} (${result.success ? 'success' : 'failed'})`);
      
      return result;
    } catch (error) {
      this.metrics.skillsExecuted++;
      this.updateSkillMetrics(false);
      
      console.error(`[NEURAFORGE] Skill execution failed: ${skillId}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get available skills that match a category or tag
   * 
   * @param category Optional category filter
   * @param tag Optional tag filter
   * @returns Array of matching skills
   */
  getAvailableSkills(category?: string, tag?: string): SkillMetadata[] {
    let skills = skillManager.getSkills();
    
    if (category) {
      skills = skills.filter(skill => skill.category === category);
    }
    
    if (tag) {
      skills = skills.filter(skill => skill.tags?.includes(tag));
    }
    
    return skills;
  }

  /**
   * Suggest skills for a given task description
   * 
   * Uses skill metadata (description, tags, category) to find relevant skills
   * 
   * @param taskDescription Task description to match against
   * @returns Array of suggested skills with relevance scores
   */
  suggestSkillsForTask(taskDescription: string): Array<{ skill: SkillMetadata; relevance: number }> {
    const skills = skillManager.getSkills();
    const suggestions: Array<{ skill: SkillMetadata; relevance: number }> = [];
    
    const taskLower = taskDescription.toLowerCase();
    const taskWords = taskLower.split(/\s+/);
    
    for (const skill of skills) {
      let relevance = 0;
      
      // Check description match
      const descLower = skill.description.toLowerCase();
      if (descLower.includes(taskLower)) {
        relevance += 0.5;
      }
      
      // Check word overlap
      const descWords = descLower.split(/\s+/);
      const matchingWords = taskWords.filter(word => 
        descWords.some(descWord => descWord.includes(word) || word.includes(descWord))
      );
      relevance += (matchingWords.length / taskWords.length) * 0.3;
      
      // Check category relevance (map common task keywords to categories)
      const categoryKeywords: Record<string, string[]> = {
        code: ['code', 'implement', 'write', 'create', 'build', 'develop'],
        test: ['test', 'testing', 'verify', 'validate', 'check'],
        debug: ['debug', 'fix', 'error', 'bug', 'issue', 'problem'],
        review: ['review', 'inspect', 'analyze', 'check', 'examine'],
        integrate: ['integrate', 'connect', 'merge', 'combine', 'link']
      };
      
      const category = categoryKeywords[skill.category];
      if (category) {
        const hasCategoryKeyword = category.some(keyword => taskLower.includes(keyword));
        if (hasCategoryKeyword) {
          relevance += 0.2;
        }
      }
      
      // Check tag match
      if (skill.tags) {
        const matchingTags = skill.tags.filter(tag => 
          taskLower.includes(tag.toLowerCase())
        );
        relevance += (matchingTags.length / skill.tags.length) * 0.1;
      }
      
      if (relevance > 0.1) {
        suggestions.push({ skill, relevance });
      }
    }
    
    // Sort by relevance descending
    return suggestions.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Update skill execution metrics
   */
  private updateSkillMetrics(success: boolean): void {
    const recentExecutions = Array.from(this.skillExecutions.values()).filter(
      exec => Date.now() - exec.timestamp.getTime() < 3600000 // Last hour
    );
    
    if (recentExecutions.length > 0) {
      const successful = recentExecutions.filter(exec => exec.success).length;
      this.metrics.skillsExecutionSuccessRate = (successful / recentExecutions.length) * 100;
    }
    
    // Update available skills count
    this.metrics.skillsAvailable = skillManager.getSkills().length;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Execute a skill as part of a workflow
   * 
   * This method integrates skills into multi-agent workflows,
   * allowing skills to be executed between agent steps or in parallel.
   * 
   * @param workflowId The workflow ID
   * @param skillId The skill ID to execute
   * @param inputs Input parameters
   * @returns Skill execution response
   */
  async executeSkillInWorkflow(
    workflowId: string,
    skillId: string,
    inputs: Record<string, unknown>
  ): Promise<SkillExecutionResponse> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: `Workflow not found: ${workflowId}`,
        executionTime: 0
      };
    }

    // Track skill usage in workflow
    if (!workflow.skills) {
      workflow.skills = [];
    }
    if (!workflow.skills.includes(skillId)) {
      workflow.skills.push(skillId);
    }

    // Execute skill with workflow context
    return await this.executeSkill(skillId, inputs, {
      workflowId,
      sessionId: workflowId
    });
  }

  /**
   * Execute deployment workflow
   * 
   * Executes the complete deployment workflow as specified in DEPLOYMENT_WORKFLOW.md
   * Agent Chain: VALIDATOR → TEST → REVIEWER → DEPLOYER → INTEGRATOR
   * 
   * @param context Deployment context (environment, version, configuration, etc.)
   * @returns Deployment workflow result
   */
  async executeDeploymentWorkflow(context: DeploymentContext): Promise<DeploymentWorkflowResult> {
    console.log(`[NEURAFORGE] Starting deployment workflow for ${context.deploymentId} to ${context.environment}`);
    
    // Execute deployment workflow with agent deployment
    const result = await deploymentWorkflowOrchestrator.executeWithAgentDeployment(context);
    
    // Update metrics based on deployment result
    if (result.success) {
      this.metrics.workflowSuccessRate = Math.min(100, this.metrics.workflowSuccessRate + 1);
    } else {
      this.metrics.workflowSuccessRate = Math.max(0, this.metrics.workflowSuccessRate - 1);
    }
    
    this.metrics.lastUpdated = new Date();
    
    console.log(`[NEURAFORGE] Deployment workflow ${result.success ? 'completed successfully' : 'failed'}`);
    console.log(`   Workflow ID: ${result.workflowId}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`   Execution path: ${result.executionPath.join(' → ')}`);
    
    if (result.errors.length > 0) {
      console.error(`   Errors: ${result.errors.join(', ')}`);
    }
    
    return result;
  }
}

// Export singleton instance
export const neuraforgeOrchestrator = new NeuraforgeOrchestrator();

