/**
 * Mode Transition Logic and Guards for Roo Mode Controller
 * 
 * This module implements the mode transition logic with guards for the Roo Mode Controller,
 * ensuring smooth and secure mode switching across the LAPA system.
 */

import { ModeGuard, ModeTransitionRequest, RooMode } from '../types/mode-types.ts';
import { rooModeController } from '../modes.ts';

/**
 * Creates a guard that prevents transitioning to the same mode
 * @returns ModeGuard instance
 */
export function createNoSameModeGuard(): ModeGuard {
  return {
    name: 'no-same-mode',
    description: 'Prevents transitioning to the same mode',
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      return transition.fromMode !== transition.toMode;
    },
    errorMessage: 'Cannot transition to the same mode'
  };
}

/**
 * Creates a guard that limits mode transitions based on frequency
 * @param maxTransitions Maximum number of transitions allowed per time window
 * @param timeWindow Time window in milliseconds
 * @returns ModeGuard instance
 */
export function createFrequencyLimitGuard(maxTransitions: number, timeWindow: number): ModeGuard {
  const transitionHistory: number[] = [];
  
  return {
    name: 'frequency-limit',
    description: `Limits mode transitions to ${maxTransitions} per ${timeWindow}ms`,
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      const now = Date.now();
      // Remove old entries outside the time window
      const windowStart = now - timeWindow;
      while (transitionHistory.length > 0 && transitionHistory[0] < windowStart) {
        transitionHistory.shift();
      }
      
      // Check if we're within the limit
      if (transitionHistory.length >= maxTransitions) {
        return false;
      }
      
      // Record this transition attempt
      transitionHistory.push(now);
      return true;
    },
    errorMessage: `Mode transition frequency limit exceeded (${maxTransitions} per ${timeWindow}ms)`
  };
}

/**
 * Creates a guard that validates mode transitions based on a whitelist
 * @param allowedTransitions Map of allowed transitions (fromMode -> toMode[])
 * @returns ModeGuard instance
 */
export function createWhitelistGuard(allowedTransitions: Record<RooMode, RooMode[]>): ModeGuard {
  return {
    name: 'whitelist',
    description: 'Validates mode transitions against a whitelist',
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      const allowed = allowedTransitions[transition.fromMode];
      return !!allowed && allowed.includes(transition.toMode);
    },
    errorMessage: 'Mode transition not allowed by whitelist'
  };
}

/**
 * Creates a guard that validates mode transitions based on a blacklist
 * @param forbiddenTransitions Map of forbidden transitions (fromMode -> toMode[])
 * @returns ModeGuard instance
 */
export function createBlacklistGuard(forbiddenTransitions: Record<RooMode, RooMode[]>): ModeGuard {
  return {
    name: 'blacklist',
    description: 'Validates mode transitions against a blacklist',
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      const forbidden = forbiddenTransitions[transition.fromMode];
      return !forbidden || !forbidden.includes(transition.toMode);
    },
    errorMessage: 'Mode transition forbidden by blacklist'
  };
}

/**
 * Creates a guard that checks system resources before allowing mode transition
 * @param minResources Minimum resources required for transition
 * @returns ModeGuard instance
 */
export function createResourceGuard(minResources: { memoryMB?: number }): ModeGuard {
  return {
    name: 'resource-check',
    description: 'Checks system resources before allowing mode transition',
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      // Check memory if specified
      if (minResources.memoryMB) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        if (used > minResources.memoryMB) {
          console.warn(`Memory usage (${used.toFixed(2)}MB) exceeds limit (${minResources.memoryMB}MB)`);
          return false;
        }
      }
      
      return true;
    },
    errorMessage: 'Insufficient system resources for mode transition'
  };
}

/**
 * Creates a guard that ensures required agents are available before mode transition
 * @param requiredAgents Function that returns required agents for a mode
 * @returns ModeGuard instance
 */
export function createAgentAvailabilityGuard(
  requiredAgents: (mode: RooMode) => string[]
): ModeGuard {
  return {
    name: 'agent-availability',
    description: 'Ensures required agents are available before mode transition',
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      const required = requiredAgents(transition.toMode);
      const availableAgents = rooModeController.getModeConfig(transition.toMode)?.capabilities || [];
      
      // Check if all required agents are available
      for (const agent of required) {
        if (!availableAgents.includes(agent)) {
          console.warn(`Required agent '${agent}' not available for mode ${transition.toMode}`);
          return false;
        }
      }
      
      return true;
    },
    errorMessage: 'Required agents not available for target mode'
  };
}

/**
 * Creates a composite guard that combines multiple guards
 * @param guards Array of guards to combine
 * @param strategy Combination strategy ('all' or 'any')
 * @returns ModeGuard instance
 */
export function createCompositeGuard(guards: ModeGuard[], strategy: 'all' | 'any' = 'all'): ModeGuard {
  return {
    name: `composite-${strategy}`,
    description: `Combines ${guards.length} guards with ${strategy} strategy`,
    check: async (transition: ModeTransitionRequest): Promise<boolean> => {
      if (strategy === 'all') {
        // All guards must pass
        for (const guard of guards) {
          const result = await guard.check(transition);
          if (!result) {
            return false;
          }
        }
        return true;
      } else {
        // Any guard must pass
        for (const guard of guards) {
          const result = await guard.check(transition);
          if (result) {
            return true;
          }
        }
        return false;
      }
    },
    errorMessage: `Composite guard check failed with ${strategy} strategy`
  };
}

/**
 * Default mode transition guards for LAPA system
 */
export const DEFAULT_MODE_GUARDS: ModeGuard[] = [
  createNoSameModeGuard(),
  createFrequencyLimitGuard(10, 60000), // 10 transitions per minute
  createResourceGuard({ memoryMB: 1024 }) // 1GB memory limit
];

/**
 * Initializes default mode guards
 */
export function initializeDefaultGuards(): void {
  // Add default guards to the mode controller
  for (const guard of DEFAULT_MODE_GUARDS) {
    rooModeController.addGuard(guard);
  }
  
  console.log(`Initialized ${DEFAULT_MODE_GUARDS.length} default mode guards`);
}

/**
 * Creates a whitelist of allowed mode transitions for LAPA system
 * @returns Record of allowed transitions
 */
export function createLAPAWhitelist(): Record<RooMode, RooMode[]> {
  return {
    code: ['architect', 'ask', 'debug', 'custom'],
    architect: ['code', 'ask', 'debug', 'custom'],
    ask: ['code', 'architect', 'debug', 'custom'],
    debug: ['code', 'architect', 'ask', 'custom'],
    custom: ['code', 'architect', 'ask', 'debug']
  };
}

/**
 * Creates a blacklist of forbidden mode transitions for LAPA system
 * @returns Record of forbidden transitions
 */
export function createLAPABlacklist(): Record<RooMode, RooMode[]> {
  return {
    code: [], // No forbidden transitions from code mode
    architect: [], // No forbidden transitions from architect mode
    ask: [], // No forbidden transitions from ask mode
    debug: [], // No forbidden transitions from debug mode
    custom: [] // No forbidden transitions from custom mode
  };
}