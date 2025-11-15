/**
 * Global Sandbox Tool for LAPA-VOID
 * 
 * This tool enables any agent or system in LAPA-VOID to use the global
 * sandbox system for isolated execution and experimentation.
 */

import { BaseAgentTool } from './agent-tool.js';
import { GlobalSandboxManager } from './sandbox-manager.js';
import { LAPAEventBus } from './event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';
import {
  SandboxConfig,
  CreateSandboxOptions,
  SandboxExecutionContext,
  SandboxMetadata
} from './types/sandbox-types.js';

/**
 * Global Sandbox Tool
 * 
 * Provides sandbox capabilities to any agent in LAPA-VOID
 */
export class GlobalSandboxTool extends BaseAgentTool {
  private sandboxManager: GlobalSandboxManager;

  constructor(
    eventBus?: LAPAEventBus,
    memoriEngine?: MemoriEngine,
    config?: SandboxConfig
  ) {
    super(
      'global-sandbox',
      'planning',
      'Global sandbox management for isolated execution and experimentation across all agents and systems in LAPA-VOID',
      '1.0.0'
    );

    this.sandboxManager = new GlobalSandboxManager(config, eventBus, memoriEngine);
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
      'execute',
      'promote',
      'archive',
      'delete',
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

      switch (action) {
        case 'create':
          return await this.handleCreate(params);
        case 'get':
          return await this.handleGet(params);
        case 'list':
          return await this.handleList(params);
        case 'update':
          return await this.handleUpdate(params);
        case 'execute':
          return await this.handleExecute(params);
        case 'promote':
          return await this.handlePromote(params);
        case 'archive':
          return await this.handleArchive(params);
        case 'delete':
          return await this.handleDelete(params);
        case 'cleanup':
          return await this.handleCleanup(params);
        case 'getPath':
          return await this.handleGetPath(params);
        case 'exists':
          return await this.handleExists(params);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            executionTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0
      };
    }
  }

  /**
   * Create sandbox
   */
  private async handleCreate(params: Record<string, any>): Promise<any> {
    const options: CreateSandboxOptions = {
      name: params.name || params.featureName,
      category: params.category || 'custom',
      provider: params.provider,
      description: params.description,
      owner: params.owner || params.agentId,
      tags: params.tags,
      metadata: params.metadata,
      expiresInDays: params.expiresInDays
    };

    if (!options.name) {
      return {
        success: false,
        error: 'name or featureName is required',
        output: null
      };
    }

    const sandbox = await this.sandboxManager.createSandbox(options);
    return {
      success: true,
      output: sandbox,
      metadata: {
        sandboxId: sandbox.id,
        category: sandbox.category,
        provider: sandbox.provider
      }
    };
  }

  /**
   * Get sandbox
   */
  private async handleGet(params: Record<string, any>): Promise<any> {
    const { sandboxId } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    const sandbox = await this.sandboxManager.getSandbox(sandboxId);
    return {
      success: true,
      output: sandbox,
      metadata: { found: !!sandbox }
    };
  }

  /**
   * List sandboxes
   */
  private async handleList(params: Record<string, any>): Promise<any> {
    const filter = params.filter || {};
    const sandboxes = await this.sandboxManager.listSandboxes(filter);
    return {
      success: true,
      output: sandboxes,
      metadata: { count: sandboxes.length }
    };
  }

  /**
   * Update sandbox
   */
  private async handleUpdate(params: Record<string, any>): Promise<any> {
    const { sandboxId, updates } = params;

    if (!sandboxId || !updates) {
      return {
        success: false,
        error: 'sandboxId and updates are required',
        output: null
      };
    }

    const sandbox = await this.sandboxManager.updateSandbox(sandboxId, updates);
    return {
      success: true,
      output: sandbox,
      metadata: { sandboxId }
    };
  }

  /**
   * Execute in sandbox
   */
  private async handleExecute(params: Record<string, any>): Promise<any> {
    const context: SandboxExecutionContext = {
      sandboxId: params.sandboxId,
      command: params.command,
      code: params.code,
      language: params.language,
      timeout: params.timeout,
      environment: params.environment,
      files: params.files,
      metadata: params.metadata
    };

    if (!context.sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    const result = await this.sandboxManager.execute(context);
    return {
      success: result.success,
      output: result,
      metadata: {
        sandboxId: context.sandboxId,
        executionTime: result.executionTime
      }
    };
  }

  /**
   * Promote sandbox
   */
  private async handlePromote(params: Record<string, any>): Promise<any> {
    const { sandboxId, targetPath } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    await this.sandboxManager.promoteSandbox(sandboxId, targetPath);
    return {
      success: true,
      output: { sandboxId, promoted: true, targetPath },
      metadata: { sandboxId }
    };
  }

  /**
   * Archive sandbox
   */
  private async handleArchive(params: Record<string, any>): Promise<any> {
    const { sandboxId } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    await this.sandboxManager.archiveSandbox(sandboxId);
    return {
      success: true,
      output: { sandboxId, archived: true },
      metadata: { sandboxId }
    };
  }

  /**
   * Delete sandbox
   */
  private async handleDelete(params: Record<string, any>): Promise<any> {
    const { sandboxId } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    await this.sandboxManager.deleteSandbox(sandboxId);
    return {
      success: true,
      output: { sandboxId, deleted: true },
      metadata: { sandboxId }
    };
  }

  /**
   * Cleanup sandboxes
   */
  private async handleCleanup(params: Record<string, any>): Promise<any> {
    await this.sandboxManager.cleanup();
    return {
      success: true,
      output: { cleaned: true },
      metadata: {}
    };
  }

  /**
   * Get sandbox path
   */
  private async handleGetPath(params: Record<string, any>): Promise<any> {
    const { sandboxId } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    const path = this.sandboxManager.getSandboxPath(sandboxId);
    return {
      success: true,
      output: path,
      metadata: { sandboxId }
    };
  }

  /**
   * Check if sandbox exists
   */
  private async handleExists(params: Record<string, any>): Promise<any> {
    const { sandboxId } = params;

    if (!sandboxId) {
      return {
        success: false,
        error: 'sandboxId is required',
        output: null
      };
    }

    const exists = this.sandboxManager.sandboxExists(sandboxId);
    return {
      success: true,
      output: exists,
      metadata: { sandboxId }
    };
  }
}

