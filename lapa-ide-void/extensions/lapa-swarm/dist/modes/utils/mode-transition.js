"use strict";
/**
 * Mode Transition Logic and Guards for Roo Mode Controller
 *
 * This module implements the mode transition logic with guards for the Roo Mode Controller,
 * ensuring smooth and secure mode switching across the LAPA system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODE_GUARDS = void 0;
exports.createNoSameModeGuard = createNoSameModeGuard;
exports.createFrequencyLimitGuard = createFrequencyLimitGuard;
exports.createWhitelistGuard = createWhitelistGuard;
exports.createBlacklistGuard = createBlacklistGuard;
exports.createResourceGuard = createResourceGuard;
exports.createAgentAvailabilityGuard = createAgentAvailabilityGuard;
exports.createCompositeGuard = createCompositeGuard;
exports.initializeDefaultGuards = initializeDefaultGuards;
exports.createLAPAWhitelist = createLAPAWhitelist;
exports.createLAPABlacklist = createLAPABlacklist;
const modes_ts_1 = require("../modes.ts");
/**
 * Creates a guard that prevents transitioning to the same mode
 * @returns ModeGuard instance
 */
function createNoSameModeGuard() {
    return {
        name: 'no-same-mode',
        description: 'Prevents transitioning to the same mode',
        check: async (transition) => {
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
function createFrequencyLimitGuard(maxTransitions, timeWindow) {
    const transitionHistory = [];
    return {
        name: 'frequency-limit',
        description: `Limits mode transitions to ${maxTransitions} per ${timeWindow}ms`,
        check: async (transition) => {
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
function createWhitelistGuard(allowedTransitions) {
    return {
        name: 'whitelist',
        description: 'Validates mode transitions against a whitelist',
        check: async (transition) => {
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
function createBlacklistGuard(forbiddenTransitions) {
    return {
        name: 'blacklist',
        description: 'Validates mode transitions against a blacklist',
        check: async (transition) => {
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
function createResourceGuard(minResources) {
    return {
        name: 'resource-check',
        description: 'Checks system resources before allowing mode transition',
        check: async (transition) => {
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
function createAgentAvailabilityGuard(requiredAgents) {
    return {
        name: 'agent-availability',
        description: 'Ensures required agents are available before mode transition',
        check: async (transition) => {
            const required = requiredAgents(transition.toMode);
            const availableAgents = modes_ts_1.rooModeController.getModeConfig(transition.toMode)?.capabilities || [];
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
function createCompositeGuard(guards, strategy = 'all') {
    return {
        name: `composite-${strategy}`,
        description: `Combines ${guards.length} guards with ${strategy} strategy`,
        check: async (transition) => {
            if (strategy === 'all') {
                // All guards must pass
                for (const guard of guards) {
                    const result = await guard.check(transition);
                    if (!result) {
                        return false;
                    }
                }
                return true;
            }
            else {
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
exports.DEFAULT_MODE_GUARDS = [
    createNoSameModeGuard(),
    createFrequencyLimitGuard(10, 60000), // 10 transitions per minute
    createResourceGuard({ memoryMB: 1024 }) // 1GB memory limit
];
/**
 * Initializes default mode guards
 */
function initializeDefaultGuards() {
    // Add default guards to the mode controller
    for (const guard of exports.DEFAULT_MODE_GUARDS) {
        modes_ts_1.rooModeController.addGuard(guard);
    }
    console.log(`Initialized ${exports.DEFAULT_MODE_GUARDS.length} default mode guards`);
}
/**
 * Creates a whitelist of allowed mode transitions for LAPA system
 * @returns Record of allowed transitions
 */
function createLAPAWhitelist() {
    return {
        code: ['architect', 'ask', 'debug', 'custom'],
        architect: ['code', 'ask', 'debug', 'custom'],
        ask: ['code', 'architect', 'debug', 'custom'],
        debug: ['code', 'architect', 'ask', 'custom'],
        custom: ['code', 'architect', 'ask', 'debug'],
        'test-engineer': ['code', 'debug', 'code-reviewer', 'docs-specialist'],
        'docs-specialist': ['ask', 'code', 'code-reviewer', 'architect'],
        'code-reviewer': ['code', 'architect', 'debug', 'docs-specialist'],
        orchestrator: ['architect', 'code', 'ask', 'debug']
    };
}
/**
 * Creates a blacklist of forbidden mode transitions for LAPA system
 * @returns Record of forbidden transitions
 */
function createLAPABlacklist() {
    return {
        code: [], // No forbidden transitions from code mode
        architect: [], // No forbidden transitions from architect mode
        ask: [], // No forbidden transitions from ask mode
        debug: [], // No forbidden transitions from debug mode
        custom: [], // No forbidden transitions from custom mode
        'test-engineer': [],
        'docs-specialist': [],
        'code-reviewer': [],
        orchestrator: []
    };
}
//# sourceMappingURL=mode-transition.js.map