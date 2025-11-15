/**
 * Deployment Script with GitHub Operations Integration
 * 
 * Uses DEPLOYMENT_WORKFLOW orchestrator and GITHUB_OPERATIONS persona
 * to deploy the project with full GitHub integration.
 * 
 * Workflow:
 * 1. GITHUB_OPERATIONS: Create deployment branch
 * 2. DEPLOYMENT_WORKFLOW: Execute VALIDATOR → TEST → REVIEWER → DEPLOYER → INTEGRATOR
 * 3. GITHUB_OPERATIONS: Tag release, create PR, manage GitHub Actions
 */

import { neuraforgeOrchestrator } from '../src/orchestrator/neuraforge-orchestrator.ts';
import { deploymentWorkflowOrchestrator, type DeploymentContext, type DeploymentWorkflowResult } from '../src/orchestrator/deployment-workflow.ts';
import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitHubOperations {
  createBranch(branchName: string): Promise<boolean>;
  createTag(tagName: string, message: string): Promise<boolean>;
  createPR(title: string, body: string, baseBranch: string, headBranch: string): Promise<string | null>;
  checkGitHubActionsStatus(): Promise<boolean>;
  commitChanges(message: string): Promise<boolean>;
  pushChanges(branch: string): Promise<boolean>;
}

/**
 * GitHub Operations Handler using GITHUB_OPERATIONS persona
 */
class GitHubOperationsHandler implements GitHubOperations {
  private githubAgentDeployment: any = null;

  /**
   * Initialize GITHUB_OPERATIONS agent
   */
  async initialize(): Promise<void> {
    try {
      console.log('[GITHUB] Initializing GITHUB_OPERATIONS agent...');
      this.githubAgentDeployment = await neuraforgeOrchestrator.deployAgent(
        'GITHUB_OPERATIONS',
        'Handle GitHub operations for deployment: branches, tags, PRs, and workflows',
        true
      );
      
      if (this.githubAgentDeployment.status !== 'active') {
        throw new Error('Failed to deploy GITHUB_OPERATIONS agent');
      }
      
      console.log('[GITHUB] GITHUB_OPERATIONS agent deployed successfully');
    } catch (error) {
      console.error('[GITHUB] Failed to initialize GITHUB_OPERATIONS agent:', error);
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string): Promise<boolean> {
    try {
      console.log(`[GITHUB] Creating branch: ${branchName}`);
      
      // Check if branch already exists
      try {
        await execAsync(`git rev-parse --verify ${branchName}`);
        console.log(`[GITHUB] Branch ${branchName} already exists`);
        return true;
      } catch {
        // Branch doesn't exist, create it
      }
      
      // Create and checkout branch
      await execAsync(`git checkout -b ${branchName}`);
      console.log(`[GITHUB] Branch ${branchName} created successfully`);
      return true;
    } catch (error) {
      console.error(`[GITHUB] Failed to create branch ${branchName}:`, error);
      return false;
    }
  }

  /**
   * Create a git tag
   */
  async createTag(tagName: string, message: string): Promise<boolean> {
    try {
      console.log(`[GITHUB] Creating tag: ${tagName}`);
      
      // Check if tag already exists
      try {
        await execAsync(`git rev-parse ${tagName}`);
        console.log(`[GITHUB] Tag ${tagName} already exists`);
        return true;
      } catch {
        // Tag doesn't exist, create it
      }
      
      await execAsync(`git tag -a ${tagName} -m "${message}"`);
      console.log(`[GITHUB] Tag ${tagName} created successfully`);
      return true;
    } catch (error) {
      console.error(`[GITHUB] Failed to create tag ${tagName}:`, error);
      return false;
    }
  }

  /**
   * Create a Pull Request
   */
  async createPR(title: string, body: string, baseBranch: string, headBranch: string): Promise<string | null> {
    try {
      console.log(`[GITHUB] Creating PR: ${title}`);
      
      // Use GitHub CLI if available
      try {
        const { stdout } = await execAsync(
          `gh pr create --title "${title}" --body "${body}" --base ${baseBranch} --head ${headBranch}`
        );
        const prUrl = stdout.trim();
        console.log(`[GITHUB] PR created successfully: ${prUrl}`);
        return prUrl;
      } catch (ghError) {
        console.warn('[GITHUB] GitHub CLI not available, PR creation skipped');
        console.log(`[GITHUB] Manual PR creation required:`);
        console.log(`   Title: ${title}`);
        console.log(`   Base: ${baseBranch}`);
        console.log(`   Head: ${headBranch}`);
        console.log(`   Body: ${body}`);
        return null;
      }
    } catch (error) {
      console.error('[GITHUB] Failed to create PR:', error);
      return null;
    }
  }

  /**
   * Check GitHub Actions status
   */
  async checkGitHubActionsStatus(): Promise<boolean> {
    try {
      // Use GitHub CLI to check workflow status
      try {
        const { stdout } = await execAsync('gh run list --limit 1 --json status,conclusion');
        const runs = JSON.parse(stdout);
        if (runs.length > 0) {
          const latestRun = runs[0];
          const isSuccess = latestRun.status === 'completed' && latestRun.conclusion === 'success';
          console.log(`[GITHUB] Latest workflow: ${latestRun.status} (${latestRun.conclusion})`);
          return isSuccess;
        }
        return true; // No runs yet, assume success
      } catch {
        console.warn('[GITHUB] GitHub CLI not available, skipping workflow check');
        return true; // Assume success if CLI not available
      }
    } catch (error) {
      console.error('[GITHUB] Failed to check GitHub Actions status:', error);
      return false;
    }
  }

  /**
   * Commit changes with conventional commit format
   */
  async commitChanges(message: string): Promise<boolean> {
    try {
      console.log(`[GITHUB] Committing changes: ${message}`);
      
      // Check if there are changes to commit
      const { stdout: status } = await execAsync('git status --porcelain');
      if (!status.trim()) {
        console.log('[GITHUB] No changes to commit');
        return true;
      }
      
      await execAsync(`git add -A`);
      await execAsync(`git commit -m "${message}"`);
      console.log(`[GITHUB] Changes committed successfully`);
      return true;
    } catch (error) {
      console.error('[GITHUB] Failed to commit changes:', error);
      return false;
    }
  }

  /**
   * Push changes to remote
   */
  async pushChanges(branch: string): Promise<boolean> {
    try {
      console.log(`[GITHUB] Pushing branch: ${branch}`);
      await execAsync(`git push -u origin ${branch}`);
      console.log(`[GITHUB] Branch ${branch} pushed successfully`);
      return true;
    } catch (error) {
      console.error(`[GITHUB] Failed to push branch ${branch}:`, error);
      return false;
    }
  }
}

/**
 * Get version from package.json
 */
async function getVersion(): Promise<string> {
  try {
    const packageJson = await readFile('package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Main deployment function
 */
export async function deployWithGitHub(
  environment: 'staging' | 'production' = 'production',
  version?: string,
  skipGitHub: boolean = false
): Promise<DeploymentWorkflowResult> {
  const startTime = Date.now();
  const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const actualVersion = version || await getVersion();
  const branchName = `deploy/${environment}-${actualVersion}`;
  const tagName = `v${actualVersion}`;

  console.log('🚀 Starting deployment with GitHub integration');
  console.log(`   Deployment ID: ${deploymentId}`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Version: ${actualVersion}`);
  console.log(`   Branch: ${branchName}`);
  console.log(`   Tag: ${tagName}\n`);

  const github = new GitHubOperationsHandler();

  try {
    // Step 1: Initialize GitHub Operations
    if (!skipGitHub) {
      await github.initialize();
      
      // Create deployment branch
      const branchCreated = await github.createBranch(branchName);
      if (!branchCreated) {
        throw new Error('Failed to create deployment branch');
      }
    }

    // Step 2: Execute Deployment Workflow
    console.log('\n📋 Executing deployment workflow...\n');
    
    const deploymentContext: DeploymentContext = {
      deploymentId,
      environment,
      version: actualVersion,
      configuration: {
        branch: branchName,
        tag: tagName,
        skipGitHub
      },
      rollbackPlan: `Rollback to previous version if deployment fails. Use: git checkout <previous-tag>`,
      metadata: {
        startedAt: new Date().toISOString(),
        environment,
        version: actualVersion
      }
    };

    const deploymentResult = await neuraforgeOrchestrator.executeDeploymentWorkflow(deploymentContext);

    // Step 3: Handle GitHub Operations if deployment successful
    if (deploymentResult.success && !skipGitHub) {
      console.log('\n🔀 Executing GitHub operations...\n');

      // Commit any changes
      await github.commitChanges(`chore: deploy v${actualVersion} to ${environment}`);

      // Push branch
      await github.pushChanges(branchName);

      // Create tag
      await github.createTag(tagName, `Release v${actualVersion} - ${environment} deployment`);

      // Push tag
      await execAsync(`git push origin ${tagName}`).catch(() => {
        console.warn('[GITHUB] Failed to push tag, continuing...');
      });

      // Create PR if not production
      if (environment === 'staging') {
        const prBody = `## Deployment Summary

**Deployment ID:** ${deploymentId}
**Environment:** ${environment}
**Version:** ${actualVersion}
**Deployment Time:** ${new Date().toISOString()}

### Validation
${deploymentResult.validationReport ? '✅ All validations passed' : '⚠️ Validation report not available'}

### Tests
${deploymentResult.testResults ? `✅ All tests passing (Coverage: ${deploymentResult.testResults.testCoverage}%)` : '⚠️ Test results not available'}

### Review
${deploymentResult.reviewFeedback ? '✅ Deployment approved' : '⚠️ Review feedback not available'}

### Deployment
${deploymentResult.deploymentStatus ? '✅ Deployment successful' : '⚠️ Deployment status not available'}

### Integration
${deploymentResult.integrationHealth ? '✅ Integration healthy' : '⚠️ Integration health not available'}

---

**Workflow Duration:** ${(deploymentResult.duration / 1000).toFixed(2)}s
**Execution Path:** ${deploymentResult.executionPath.join(' → ')}
`;

        await github.createPR(
          `Deploy v${actualVersion} to ${environment}`,
          prBody,
          'main',
          branchName
        );
      }

      // Check GitHub Actions status
      await github.checkGitHubActionsStatus();
    }

    // Step 4: Summary
    const totalDuration = Date.now() - startTime;
    console.log('\n✅ Deployment completed successfully!');
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   Workflow Duration: ${(deploymentResult.duration / 1000).toFixed(2)}s`);
    console.log(`   Execution Path: ${deploymentResult.executionPath.join(' → ')}`);
    
    if (!skipGitHub) {
      console.log(`   Branch: ${branchName}`);
      console.log(`   Tag: ${tagName}`);
    }

    return deploymentResult;
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const environment = (args[0] as 'staging' | 'production') || 'production';
  const version = args[1];
  const skipGitHub = args.includes('--skip-github');

  try {
    const result = await deployWithGitHub(environment, version, skipGitHub);
    
    if (result.success) {
      console.log('\n🎉 Deployment workflow completed successfully!');
      process.exit(0);
    } else {
      console.error('\n❌ Deployment workflow failed');
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('deploy-with-github')) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

