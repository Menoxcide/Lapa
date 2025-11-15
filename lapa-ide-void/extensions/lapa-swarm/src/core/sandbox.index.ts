/**
 * Global Sandbox System Index
 * 
 * Exports for the global sandbox system used across all agents and systems in LAPA-VOID
 */

export { GlobalSandboxManager } from './sandbox-manager.js';
export { GlobalSandboxTool } from './sandbox-tool.js';
export type {
  SandboxProviderType,
  SandboxStatus,
  SandboxCategory,
  SandboxMetadata,
  SandboxConfig,
  CreateSandboxOptions,
  SandboxExecutionContext,
  SandboxExecutionResult,
  ISandboxProvider,
  ISandboxManager,
  DEFAULT_SANDBOX_CONFIG
} from './types/sandbox-types.js';

