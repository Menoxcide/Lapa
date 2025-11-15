/**
 * NEURAFORGE Agent Deployment Script
 * 
 * Handles /neuraforge [AGENT] command execution
 * Deploys agents in background with full persona context
 * 
 * Now integrated with NeuraforgeOrchestrator for full system integration
 */

import { neuraforgeOrchestrator } from '../src/orchestrator/neuraforge-orchestrator.ts';

interface DeploymentResult {
  success: boolean;
  agentId?: string;
  message: string;
  metrics?: {
    deploymentTime: number;
    agentStatus: string;
  };
}

/**
 * Deploy agent based on command
 * 
 * Now uses NeuraforgeOrchestrator for full system integration
 */
export async function deployAgent(
  agentName: string,
  task?: string,
  background: boolean = true
): Promise<DeploymentResult> {
  const startTime = Date.now();
  
  try {
    // Use NeuraforgeOrchestrator to deploy agent
    const deployment = await neuraforgeOrchestrator.deployAgent(agentName, task, background);
    
    const deploymentTime = Date.now() - startTime;
    
    return {
      success: deployment.status === 'active' || deployment.status === 'initializing',
      agentId: deployment.agentId,
      message: `✅ Deployed ${agentName} agent in background. Agent ID: ${deployment.agentId || 'pending'}. Status: ${deployment.status}. Monitoring execution...`,
      metrics: deployment.metrics || {
        deploymentTime,
        agentStatus: deployment.status,
        personaLoaded: !!deployment.persona,
        promptLoaded: !!deployment.promptContent,
        spawnSuccess: deployment.status === 'active'
      }
    };
    
  } catch (error) {
    const availableAgents = await listAvailableAgents();
    return {
      success: false,
      message: `Failed to deploy agent ${agentName}: ${error instanceof Error ? error.message : String(error)}\n\nAvailable agents:\n${availableAgents.map(a => `  - ${a}`).join('\n')}`
    };
  }
}

/**
 * List available agents
 * 
 * Now uses NeuraforgeOrchestrator for consistent agent listing
 */
export async function listAvailableAgents(): Promise<string[]> {
  return await neuraforgeOrchestrator.listAvailableAgents();
}

/**
 * Main command handler
 */
export async function handleNeuraforgeCommand(
  command: string,
  args?: { task?: string; background?: boolean }
): Promise<DeploymentResult> {
  // Parse command: /neuraforge [AGENT]
  const match = command.match(/\/neuraforge\s+(\w+)/i);
  
  if (!match) {
    const agents = await listAvailableAgents();
    return {
      success: false,
      message: `Usage: /neuraforge [AGENT]\n\nAvailable agents:\n${agents.map(a => `  - ${a}`).join('\n')}`
    };
  }
  
  const agentName = match[1].toUpperCase();
  const task = args?.task;
  const background = args?.background ?? true;
  
  return deployAgent(agentName, task, background);
}

/**
 * Main execution (when run directly)
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // List available agents
    console.log('🧠 NEURAFORGE Agent Deployment System\n');
    const agents = await listAvailableAgents();
    console.log('Available agents:');
    agents.forEach(agent => console.log(`  - ${agent}`));
    console.log('\nUsage: tsx scripts/neuraforge-deploy.ts [AGENT_NAME]');
    console.log('Example: tsx scripts/neuraforge-deploy.ts NEURAFORGE');
    return;
  }
  
  const agentName = args[0].toUpperCase();
  const task = args[1]; // Optional task
  
  console.log(`🚀 Deploying ${agentName} agent...\n`);
  
  const result = await deployAgent(agentName, task);
  
  if (result.success) {
    console.log(result.message);
    if (result.metrics) {
      console.log(`\n📊 Metrics:`);
      console.log(`   Deployment Time: ${result.metrics.deploymentTime}ms`);
      console.log(`   Agent Status: ${result.metrics.agentStatus}`);
    }
  } else {
    console.error(`❌ ${result.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('neuraforge-deploy')) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
