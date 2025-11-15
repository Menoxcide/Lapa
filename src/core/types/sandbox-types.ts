/**
 * Global Sandbox Type Definitions for LAPA-VOID
 * 
 * This module defines types and interfaces for the global sandbox system
 * that can be used by any agent or system in the LAPA-VOID project.
 */

/**
 * Sandbox provider type
 */
export type SandboxProviderType = 'local' | 'mcp' | 'e2b' | 'feature' | 'custom';

/**
 * Sandbox status
 */
export type SandboxStatus = 'active' | 'archived' | 'promoted' | 'error' | 'expired';

/**
 * Sandbox type/category
 */
export type SandboxCategory = 
  | 'feature'      // Feature development sandbox
  | 'test'         // Testing sandbox
  | 'debug'        // Debugging sandbox
  | 'experiment'   // Experimental sandbox
  | 'integration'  // Integration sandbox
  | 'research'     // Research sandbox
  | 'custom';      // Custom sandbox

/**
 * Sandbox metadata
 */
export interface SandboxMetadata {
  id: string;
  name: string;
  status: SandboxStatus;
  category: SandboxCategory;
  provider: SandboxProviderType;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  promotedAt?: number;
  archivedAt?: number;
  description?: string;
  owner?: string; // Agent ID or system name that owns this sandbox
  tags?: string[];
  metadata?: Record<string, any>;
  iterationCount?: number;
  testCoverage?: number;
  notes?: string[];
}

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  baseDir?: string;
  archiveDir?: string;
  enableIsolation?: boolean;
  autoCleanup?: boolean;
  maxIterations?: number;
  defaultProvider?: SandboxProviderType;
  expirationDays?: number;
  enableMetrics?: boolean;
  allowPromotion?: boolean;
}

/**
 * Sandbox creation options
 */
export interface CreateSandboxOptions {
  name: string;
  category: SandboxCategory;
  provider?: SandboxProviderType;
  description?: string;
  owner?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  expiresInDays?: number;
}

/**
 * Sandbox execution context
 */
export interface SandboxExecutionContext {
  sandboxId: string;
  command?: string;
  code?: string;
  language?: string;
  timeout?: number;
  environment?: Record<string, string>;
  files?: Array<{ path: string; content: string }>;
  metadata?: Record<string, any>;
}

/**
 * Sandbox execution result
 */
export interface SandboxExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  executionTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Sandbox provider interface
 */
export interface ISandboxProvider {
  name: string;
  type: SandboxProviderType;
  initialize(): Promise<void>;
  createSandbox(options: CreateSandboxOptions): Promise<SandboxMetadata>;
  execute(context: SandboxExecutionContext): Promise<SandboxExecutionResult>;
  getSandbox(sandboxId: string): Promise<SandboxMetadata | null>;
  listSandboxes(filter?: Partial<SandboxMetadata>): Promise<SandboxMetadata[]>;
  deleteSandbox(sandboxId: string): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Sandbox manager interface
 */
export interface ISandboxManager {
  initialize(): Promise<void>;
  createSandbox(options: CreateSandboxOptions): Promise<SandboxMetadata>;
  getSandbox(sandboxId: string): Promise<SandboxMetadata | null>;
  listSandboxes(filter?: Partial<SandboxMetadata>): Promise<SandboxMetadata[]>;
  updateSandbox(sandboxId: string, updates: Partial<SandboxMetadata>): Promise<SandboxMetadata>;
  execute(context: SandboxExecutionContext): Promise<SandboxExecutionResult>;
  promoteSandbox(sandboxId: string, targetPath?: string): Promise<void>;
  archiveSandbox(sandboxId: string): Promise<void>;
  deleteSandbox(sandboxId: string): Promise<void>;
  cleanup(): Promise<void>;
  getSandboxPath(sandboxId: string): string;
  sandboxExists(sandboxId: string): boolean;
  registerProvider(provider: ISandboxProvider): void;
  getProvider(type: SandboxProviderType): ISandboxProvider | undefined;
}

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: Required<SandboxConfig> = {
  baseDir: '.lapa/sandboxes',
  archiveDir: '.lapa/sandboxes/archive',
  enableIsolation: true,
  autoCleanup: false,
  maxIterations: 10,
  defaultProvider: 'local',
  expirationDays: 30,
  enableMetrics: true,
  allowPromotion: true
};

