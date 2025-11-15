/**
 * Mode Types for Roo Mode Controller in LAPA v1.2 Phase 10
 * 
 * This module defines the core types and interfaces for the Roo Mode Controller
 * system, enabling seamless mode switching and mode-specific behavior routing.
 */

// Define the supported Roo modes
export type RooMode =
  | 'code'      // Enhanced code generation and review capabilities
  | 'architect' // System design and planning optimizations
  | 'ask'       // Improved question answering and documentation
  | 'debug'     // Enhanced troubleshooting and error analysis
  | 'custom'    // User-defined mode configurations
  | 'test-engineer'
  | 'docs-specialist'
  | 'code-reviewer'
  | 'orchestrator';

// Mode configuration interface
export interface ModeConfig {
  name: string;
  type: RooMode;
  description: string;
  capabilities: string[];
  agentBehaviors: Record<string, string>; // Agent type to behavior mapping
  transitionHooks: {
    onEnter?: () => Promise<void>;
    onExit?: () => Promise<void>;
  };
  constraints?: {
    maxConcurrentTasks?: number;
    resourceLimits?: {
      cpu?: number;
      memory?: number;
    };
  };
}

// Mode state interface
export interface ModeState {
  currentMode: RooMode;
  previousMode: RooMode | null;
  modeStartTime: number;
  modeData: Record<string, any>;
}

// Mode transition request
export interface ModeTransitionRequest {
  fromMode: RooMode;
  toMode: RooMode;
  reason?: string;
  context?: Record<string, any>;
}

// Mode transition result
export interface ModeTransitionResult {
  success: boolean;
  fromMode: RooMode;
  toMode: RooMode;
  transitionTime: number;
  error?: string;
}

// Mode guard interface
export interface ModeGuard {
  name: string;
  description: string;
  check: (transition: ModeTransitionRequest) => Promise<boolean>;
  errorMessage: string;
}

// Mode hook interface
export interface ModeHook {
  name: string;
  description: string;
  execute: (mode: RooMode, context?: Record<string, any>) => Promise<void>;
}