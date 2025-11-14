"use strict";
/**
 * Event Routing Logic for LAPA Core Event Bus
 *
 * This module implements event filtering and routing capabilities for the
 * LAPA event bus system. It ensures efficient distribution of events to
 * appropriate subscribers while maintaining performance and local-first
 * compliance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = exports.EventRouter = void 0;
exports.routeEvent = routeEvent;
exports.setupDefaultLAPARoutes = setupDefaultLAPARoutes;
// Default configuration
const DEFAULT_ROUTING_CONFIG = {
    enablePatternMatching: true,
    enableWildcardRouting: true,
    maxRouteDepth: 5,
    enableEventTransformation: true
};
/**
 * Event Router for LAPA Core
 * Handles event filtering and routing to appropriate destinations
 */
class EventRouter {
    config;
    routeTable;
    defaultRoutes;
    constructor(config) {
        this.config = { ...DEFAULT_ROUTING_CONFIG, ...config };
        this.routeTable = new Map();
        this.defaultRoutes = [];
    }
    /**
     * Adds a route rule for event routing
     * @param eventType The event type to route
     * @param rule The route rule to add
     */
    addRouteRule(eventType, rule) {
        if (!this.routeTable.has(eventType)) {
            this.routeTable.set(eventType, []);
        }
        const rules = this.routeTable.get(eventType);
        rules.push(rule);
        // Sort rules by priority (higher priority first)
        rules.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Adds a default route rule that applies to all events
     * @param rule The route rule to add
     */
    addDefaultRouteRule(rule) {
        this.defaultRoutes.push(rule);
        // Sort rules by priority (higher priority first)
        this.defaultRoutes.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Removes a route rule for an event type
     * @param eventType The event type
     * @param rule The route rule to remove
     */
    removeRouteRule(eventType, rule) {
        const rules = this.routeTable.get(eventType);
        if (rules) {
            const index = rules.indexOf(rule);
            if (index !== -1) {
                rules.splice(index, 1);
            }
        }
    }
    /**
     * Routes an event based on configured rules
     * @param event The event to route
     * @returns Promise that resolves with the routed event
     */
    async routeEvent(event) {
        // Apply default routes first
        let routedEvent = await this.applyRoutes(event, this.defaultRoutes);
        // Apply type-specific routes
        const typeRules = this.routeTable.get(event.type);
        if (typeRules) {
            routedEvent = await this.applyRoutes(routedEvent, typeRules);
        }
        // Ensure the event maintains its original type
        return routedEvent;
    }
    /**
     * Applies route rules to an event
     * @param event The event to apply routes to
     * @param rules The route rules to apply
     * @returns Promise that resolves with the transformed event
     */
    async applyRoutes(event, rules) {
        let currentEvent = { ...event };
        for (const rule of rules) {
            // Check if the rule applies to this event
            if (this.ruleApplies(rule, currentEvent)) {
                // Apply transformation if configured
                if (rule.transform && this.config.enableEventTransformation) {
                    currentEvent = rule.transform(currentEvent);
                }
                // Determine target
                let target;
                if (typeof rule.target === 'function') {
                    target = rule.target(currentEvent);
                }
                else {
                    target = rule.target;
                }
                // Set target on event
                currentEvent.target = target;
                // Break after first matching rule with high priority (>= 100)
                if (rule.priority >= 100) {
                    break;
                }
            }
        }
        return currentEvent;
    }
    /**
     * Checks if a route rule applies to an event
     * @param rule The route rule
     * @param event The event
     * @returns Boolean indicating if the rule applies
     */
    ruleApplies(rule, event) {
        // Apply filter if present
        if (rule.filter && !rule.filter(event)) {
            return false;
        }
        // Pattern matching
        if (this.config.enablePatternMatching && rule.pattern) {
            if (typeof rule.pattern === 'string') {
                // Simple string matching with wildcard support
                if (this.config.enableWildcardRouting && rule.pattern.includes('*')) {
                    const regexPattern = rule.pattern.replace(/\*/g, '.*');
                    const regex = new RegExp(`^${regexPattern}$`);
                    return regex.test(event.type);
                }
                else {
                    return rule.pattern === event.type;
                }
            }
            else if (rule.pattern instanceof RegExp) {
                // Regex matching
                return rule.pattern.test(event.type);
            }
        }
        // If no pattern matching, rule applies by default
        return true;
    }
    /**
     * Updates the routing configuration
     * @param newConfig Partial configuration to update
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Gets the current configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Clears all route rules
     */
    clearRoutes() {
        this.routeTable.clear();
        this.defaultRoutes.length = 0;
    }
}
exports.EventRouter = EventRouter;
// Export singleton instance
exports.eventRouter = new EventRouter();
// Export convenience function for routing events
async function routeEvent(event) {
    return exports.eventRouter.routeEvent(event);
}
// Predefined route rules for common LAPA event patterns
function setupDefaultLAPARoutes() {
    // High priority route for system errors - send to all agents
    exports.eventRouter.addDefaultRouteRule({
        pattern: 'system.error',
        target: 'all-agents',
        priority: 200,
        filter: (event) => event.type === 'system.error'
    });
    // Route handoff events to specific agents
    exports.eventRouter.addRouteRule('handoff.initiated', {
        pattern: 'handoff.initiated',
        target: (event) => event.payload.targetAgentId,
        priority: 150
    });
    // Route task events to swarm orchestrator
    exports.eventRouter.addRouteRule('task.created', {
        pattern: 'task.created',
        target: 'swarm-orchestrator',
        priority: 100
    });
    // Route agent events to agent manager
    exports.eventRouter.addRouteRule('agent.registered', {
        pattern: 'agent.registered',
        target: 'agent-manager',
        priority: 100
    });
    // Route context events to context manager
    exports.eventRouter.addRouteRule('context.compressed', {
        pattern: 'context.compressed',
        target: 'context-manager',
        priority: 100
    });
    // Route performance events to metrics collector
    exports.eventRouter.addRouteRule('performance.metric', {
        pattern: 'performance.metric',
        target: 'metrics-collector',
        priority: 100
    });
}
//# sourceMappingURL=event-router.js.map