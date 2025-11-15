/**
 * FEATURE_AGENT Sandbox Tool
 * 
 * This tool enables FEATURE_AGENT to manage sandbox environments
 * for rapid feature prototyping and experimentation.
 */

import { BaseAgentTool } from '../core/agent-tool.js';
import { FeatureSandboxManager, SandboxMetadata, SandboxConfig } from './feature-sandbox.manager.js';
import { LAPAEventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';

/**
 * FEATURE_AGENT Sandbox Tool
 */
export class FeatureSandboxTool extends BaseAgentTool {
  private sandboxManager: FeatureSandboxManager;

  constructor(
    eventBus?: LAPAEventBus,
    memoriEngine?: MemoriEngine,
    config?: SandboxConfig
  ) {
    super(
      'feature-sandbox',
      'code-generation',
      'Manage sandbox environments for FEATURE_AGENT rapid prototyping',
      '1.0.0'
    );

    this.sandboxManager = new FeatureSandboxManager(config, eventBus, memoriEngine);
  }

  /**
   * Initialize sandbox manager
   */
  async initialize(): Promise<void> {
    await this.sandboxManager.initialize();
  }

  /**
   * Validate parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    const { action } = params;
    
    if (!action || typeof action !== 'string') {
      return false;
    }

    const validActions = [
      'create',
      'get',
      'list',
      'update',
      'promote',
      'archive',
      'cleanup',
      'getPath',
      'exists'
    ];

    return validActions.includes(action);
  }

  /**
   * Execute sandbox tool
   */
  async execute(context: any): Promise<any> {
    try {
      const { action, ...params } = context.parameters;

      if (!this.validateParameters(context.parameters)) {
        return {
          success: false,
          error: 'Invalid parameters: action is required and must be valid',
          executionTime: 0
        };
      }

      const startTime = Date.now();
      let result: any;

      switch (action) {
        case 'create':
          result = await this.handleCreate(params);
          break;

        case 'get':
          result = await this.handleGet(params);
          break;

        case 'list':
          result = await this.handleList(params);
          break;

        case 'update':
          result = await this.handleUpdate(params);
          break;

        case 'promote':
          result = await this.handlePromote(params);
          break;

        case 'archive':
          result = await this.handleArchive(params);
          break;

        case 'cleanup':
          result = await this.handleCleanup(params);
          break;

        case 'getPath':
          result = await this.handleGetPath(params);
          break;

        case 'exists':
          result = await this.handleExists(params);
          break;

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            executionTime: 0
          };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: result,
        executionTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0
      };
    }
  }

  /**
   * Handle create sandbox
   */
  private async handleCreate(params: Record<string, any>): Promise<SandboxMetadata> {
    const { featureName, description } = params;

    if (!featureName || typeof featureName !== 'string') {
      throw new Error('featureName is required and must be a string');
    }

    return await this.sandboxManager.createSandbox(featureName, description);
  }

  /**
   * Handle get sandbox
   */
  private async handleGet(params: Record<string, any>): Promise<SandboxMetadata | null> {
    const { sandboxId } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    return await this.sandboxManager.getSandbox(sandboxId);
  }

  /**
   * Handle list sandboxes
   */
  private async handleList(params: Record<string, any>): Promise<SandboxMetadata[]> {
    const { status } = params;
    return await this.sandboxManager.listSandboxes(status);
  }

  /**
   * Handle update sandbox
   */
  private async handleUpdate(params: Record<string, any>): Promise<SandboxMetadata> {
    const { sandboxId, updates } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('updates is required and must be an object');
    }

    return await this.sandboxManager.updateSandbox(sandboxId, updates);
  }

  /**
   * Handle promote sandbox
   */
  private async handlePromote(params: Record<string, any>): Promise<void> {
    const { sandboxId, targetPath } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    await this.sandboxManager.promoteSandbox(sandboxId, targetPath);
  }

  /**
   * Handle archive sandbox
   */
  private async handleArchive(params: Record<string, any>): Promise<void> {
    const { sandboxId } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    await this.sandboxManager.archiveSandbox(sandboxId);
  }

  /**
   * Handle cleanup sandbox
   */
  private async handleCleanup(params: Record<string, any>): Promise<void> {
    const { sandboxId } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    await this.sandboxManager.cleanupSandbox(sandboxId);
  }

  /**
   * Handle get sandbox path
   */
  private async handleGetPath(params: Record<string, any>): Promise<string> {
    const { sandboxId } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    return this.sandboxManager.getSandboxPath(sandboxId);
  }

  /**
   * Handle check if sandbox exists
   */
  private async handleExists(params: Record<string, any>): Promise<boolean> {
    const { sandboxId } = params;

    if (!sandboxId || typeof sandboxId !== 'string') {
      throw new Error('sandboxId is required and must be a string');
    }

    return this.sandboxManager.sandboxExists(sandboxId);
  }
}

