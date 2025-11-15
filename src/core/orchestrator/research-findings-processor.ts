/**
 * Research Findings Processor for NEURAFORGE
 * 
 * Autonomously processes research findings from WEB_RESEARCH_HYBRID knowledge base,
 * using AI to chain optimal agents together with subtasks for each finding.
 */

import { knowledgeBase, type KnowledgeBaseEntry } from '../research/knowledge-base.ts';
import { neuraforgeOrchestrator, type AgentDeployment } from './neuraforge-orchestrator.ts';
import { workflowGenerator, type GeneratedWorkflow, type TaskDecomposition } from './workflow-generator.ts';
import { agentSelector, type AgentRecommendation } from './agent-selector.ts';

export interface FindingProcessingResult {
  findingId: string;
  status: 'success' | 'failed' | 'skipped';
  workflowId?: string;
  agentsUsed: string[];
  duration: number;
  notes?: string;
}

export interface ProcessingConfig {
  delayBetweenFindings: number; // milliseconds
  delayBetweenAgents: number; // milliseconds
  maxConcurrentFindings: number;
  minValuePotential: number; // Only process findings above this value
}

/**
 * Research Findings Processor
 * 
 * Processes findings from knowledge base, one at a time, with optimal agent chains
 */
export class ResearchFindingsProcessor {
  private config: ProcessingConfig;
  private processingQueue: KnowledgeBaseEntry[] = [];
  private processingHistory: FindingProcessingResult[] = [];
  private isProcessing: boolean = false;

  constructor(config?: Partial<ProcessingConfig>) {
    this.config = {
      delayBetweenFindings: 5000, // 5 seconds between findings
      delayBetweenAgents: 2000, // 2 seconds between agents
      maxConcurrentFindings: 1, // Process one at a time
      minValuePotential: 0.01, // 1% threshold
      ...config
    };
  }

  /**
   * Start processing findings from knowledge base
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.log('[ResearchProcessor] Already processing findings');
      return;
    }

    this.isProcessing = true;
    console.log('\n🔬 NEURAFORGE Research Findings Processor\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
      // Get pending findings from knowledge base
      const pendingFindings = await this.getPendingFindings();
      
      if (pendingFindings.length === 0) {
        console.log('📭 No pending findings to process\n');
        this.isProcessing = false;
        return;
      }

      console.log(`📊 Found ${pendingFindings.length} pending findings to process\n`);
      console.log('🚀 Starting autonomous processing...\n');
      console.log('═══════════════════════════════════════════════════════════\n');

      // Process findings one at a time
      for (let i = 0; i < pendingFindings.length; i++) {
        const entry = pendingFindings[i];
        const finding = entry.finding;

        console.log(`\n[${i + 1}/${pendingFindings.length}] Processing Finding: ${finding.title}`);
        console.log(`   Category: ${finding.category}`);
        console.log(`   Source: ${finding.source}`);
        console.log(`   Value Potential: ${(finding.valuePotential * 100).toFixed(1)}%`);
        console.log(`   Finding ID: ${finding.findingId}\n`);

        // Skip if below threshold
        if (finding.valuePotential < this.config.minValuePotential) {
          console.log('   ⏭️  Skipped: Below value threshold\n');
          continue;
        }

        // Process the finding
        const result = await this.processFinding(entry);

        // Record result
        this.processingHistory.push(result);

        // Update knowledge base status
        if (result.status === 'success') {
          await knowledgeBase.updateImplementationStatus(
            finding.findingId,
            'in-progress',
            `Processing started: ${result.agentsUsed.join(', ')}`
          );
        }

        // Delay before next finding
        if (i < pendingFindings.length - 1) {
          console.log(`\n⏳ Waiting ${this.config.delayBetweenFindings / 1000}s before next finding...\n`);
          await this.delay(this.config.delayBetweenFindings);
        }
      }

      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('✅ Processing Complete!\n');
      this.printSummary();

    } catch (error) {
      console.error('[ResearchProcessor] Processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single finding
   */
  private async processFinding(entry: KnowledgeBaseEntry): Promise<FindingProcessingResult> {
    const finding = entry.finding;
    const startTime = Date.now();

    try {
      // Step 1: Analyze the finding and decompose into tasks
      console.log('   📋 Step 1: Analyzing finding and decomposing tasks...');
      const taskDecomposition = await this.decomposeFinding(finding);
      console.log(`   ✅ Decomposed into ${taskDecomposition.subtasks.length} subtasks\n`);

      // Step 2: Generate optimal workflow
      console.log('   🔗 Step 2: Generating optimal agent workflow...');
      const workflow = await this.generateWorkflow(finding, taskDecomposition);
      console.log(`   ✅ Workflow generated: ${workflow.agentSequence.join(' → ')}\n`);

      // Step 3: Execute workflow with agents
      console.log('   🚀 Step 3: Executing workflow with agents...\n');
      const agentsUsed = await this.executeWorkflow(finding, workflow);

      const duration = Date.now() - startTime;

      console.log(`\n   ✅ Finding processed successfully in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   📊 Agents used: ${agentsUsed.join(', ')}\n`);

      return {
        findingId: finding.findingId,
        status: 'success',
        workflowId: workflow.workflowId,
        agentsUsed,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\n   ❌ Error processing finding: ${error}`);
      
      return {
        findingId: finding.findingId,
        status: 'failed',
        agentsUsed: [],
        duration,
        notes: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Decompose finding into subtasks
   */
  private async decomposeFinding(finding: any): Promise<TaskDecomposition> {
    // Use AI/agent selector to decompose the finding into subtasks
    // This is a smart decomposition based on the finding's content
    
    const mainTask = `Implement research finding: ${finding.title}`;
    const subtasks: TaskDecomposition['subtasks'] = [];

    // Always start with research/analysis
    const researchRecommendations = await agentSelector.selectAgent(
      `Research and analyze: ${finding.title}. Review source: ${finding.source}. Understand: ${finding.description.substring(0, 200)}`
    );
    subtasks.push({
      id: 'research',
      description: `Research and analyze: ${finding.title}. Review source: ${finding.source}. Understand: ${finding.description.substring(0, 200)}`,
      agentRecommendations: researchRecommendations,
      estimatedDuration: 30000, // 30 seconds
      dependencies: [],
      priority: 'high'
    });

    // Then planning
    const planRecommendations = await agentSelector.selectAgent(
      `Create implementation plan for: ${finding.title}. Consider: ${finding.implementationSuggestion || 'general implementation'}`
    );
    subtasks.push({
      id: 'plan',
      description: `Create implementation plan for: ${finding.title}. Consider: ${finding.implementationSuggestion || 'general implementation'}`,
      agentRecommendations: planRecommendations,
      estimatedDuration: 20000, // 20 seconds
      dependencies: ['research'],
      priority: 'high'
    });

    // Then implementation (if applicable)
    if (finding.category.includes('agent') || finding.category.includes('orchestration') || 
        finding.category.includes('optimization') || finding.category.includes('inference')) {
      const implementRecommendations = await agentSelector.selectAgent(
        `Implement: ${finding.title}. ${finding.implementationSuggestion || ''}`
      );
      subtasks.push({
        id: 'implement',
        description: `Implement: ${finding.title}. ${finding.implementationSuggestion || ''}`,
        agentRecommendations: implementRecommendations,
        estimatedDuration: 60000, // 1 minute
        dependencies: ['plan'],
        priority: 'high'
      });
    }

    // Then review/validation
    const reviewRecommendations = await agentSelector.selectAgent(
      `Review implementation of: ${finding.title}`
    );
    subtasks.push({
      id: 'review',
      description: `Review implementation of: ${finding.title}`,
      agentRecommendations: reviewRecommendations,
      estimatedDuration: 15000, // 15 seconds
      dependencies: subtasks.length > 2 ? ['implement'] : ['plan'],
      priority: 'medium'
    });

    return {
      mainTask,
      subtasks,
      dependencies: this.buildDependencies(subtasks),
      estimatedDuration: subtasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
      complexity: subtasks.length > 3 ? 'complex' : subtasks.length > 2 ? 'medium' : 'simple'
    };
  }

  /**
   * Build dependencies from subtasks
   */
  private buildDependencies(subtasks: TaskDecomposition['subtasks']): TaskDecomposition['dependencies'] {
    const dependencies: TaskDecomposition['dependencies'] = [];
    
    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        dependencies.push({
          from: depId,
          to: subtask.id,
          type: 'sequential'
        });
      }
    }

    return dependencies;
  }

  /**
   * Generate optimal workflow for finding
   */
  private async generateWorkflow(
    finding: any,
    decomposition: TaskDecomposition
  ): Promise<GeneratedWorkflow> {
    // Use workflow generator to create optimal workflow
    // The generator takes a task description and creates a workflow
    const taskDescription = `${decomposition.mainTask}\n\nResearch Finding Details:\n- Title: ${finding.title}\n- Category: ${finding.category}\n- Source: ${finding.source}\n- Value: ${(finding.valuePotential * 100).toFixed(1)}%\n- Suggestion: ${finding.implementationSuggestion || 'N/A'}`;
    
    const workflow = await workflowGenerator.generateWorkflow(taskDescription);

    return workflow;
  }

  /**
   * Execute workflow with agents
   */
  private async executeWorkflow(
    finding: any,
    workflow: GeneratedWorkflow
  ): Promise<string[]> {
    const agentsUsed: string[] = [];

    console.log(`   📍 Workflow: ${workflow.agentSequence.join(' → ')}\n`);

    // Execute agents sequentially
    for (let i = 0; i < workflow.agentSequence.length; i++) {
      const agentName = workflow.agentSequence[i];
      const task = workflow.tasks[i] || `Process: ${finding.title}`;

      console.log(`   [${i + 1}/${workflow.agentSequence.length}] Deploying ${agentName}...`);
      console.log(`      Task: ${task}`);

      try {
        // Deploy agent via NEURAFORGE
        const deployment = await neuraforgeOrchestrator.deployAgent(
          agentName,
          `${task}\n\nResearch Finding:\nTitle: ${finding.title}\nDescription: ${finding.description}\nCategory: ${finding.category}\nValue: ${(finding.valuePotential * 100).toFixed(1)}%\nSuggestion: ${finding.implementationSuggestion || 'N/A'}`
        );

        if (deployment.status === 'active' || deployment.status === 'completed') {
          agentsUsed.push(agentName);
          console.log(`      ✅ ${agentName} deployed successfully`);
        } else {
          console.log(`      ⚠️  ${agentName} deployment: ${deployment.status}`);
        }

        // Delay before next agent
        if (i < workflow.agentSequence.length - 1) {
          await this.delay(this.config.delayBetweenAgents);
        }

      } catch (error) {
        console.error(`      ❌ Error deploying ${agentName}:`, error);
      }

      console.log('');
    }

    return agentsUsed;
  }

  /**
   * Get pending findings from knowledge base
   */
  private async getPendingFindings(): Promise<KnowledgeBaseEntry[]> {
    // Get pending findings from knowledge base
    const pendingFindings = knowledgeBase.getPendingFindings(50);

    // Filter by value threshold
    return pendingFindings.filter(
      entry => entry.finding.valuePotential >= this.config.minValuePotential
    );
  }

  /**
   * Print processing summary
   */
  private printSummary(): void {
    const successful = this.processingHistory.filter(r => r.status === 'success').length;
    const failed = this.processingHistory.filter(r => r.status === 'failed').length;
    const totalDuration = this.processingHistory.reduce((sum, r) => sum + r.duration, 0);

    console.log('📊 Processing Summary:');
    console.log(`   Total Processed: ${this.processingHistory.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`   Average per Finding: ${(totalDuration / this.processingHistory.length / 1000).toFixed(1)}s\n`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const researchFindingsProcessor = new ResearchFindingsProcessor();

