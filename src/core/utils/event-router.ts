/**
 * Event Routing Logic for LAPA Core Event Bus
 * 
 * This module implements event filtering and routing capabilities for the
 * LAPA event bus system. It ensures efficient distribution of events to
 * appropriate subscribers while maintaining performance and local-first
 * compliance.
 */

import type { LAPAEvent, LAPAEventMap } from '../types/event-types.ts';

// Event routing configuration
interface EventRoutingConfig {
  enablePatternMatching: boolean;
  enableWildcardRouting: boolean;
  maxRouteDepth: number;
  enableEventTransformation: boolean;
}

// Default configuration
const DEFAULT_ROUTING_CONFIG: EventRoutingConfig = {
  enablePatternMatching: true,
  enableWildcardRouting: true,
  maxRouteDepth: 5,
  enableEventTransformation: true
};

// Route rule definition
interface RouteRule {
  pattern: string | RegExp;
  target: string | ((event: LAPAEvent) => string);
  transform?: (event: LAPAEvent) => LAPAEvent;
  filter?: (event: LAPAEvent) => boolean;
  priority: number;
}

// Route table
type RouteTable = Map<string, RouteRule[]>;

/**
 * Event Router for LAPA Core
 * Handles event filtering and routing to appropriate destinations
 */
export class EventRouter {
  private config: EventRoutingConfig;
  private routeTable: RouteTable;
  private defaultRoutes: RouteRule[];

  constructor(config?: Partial<EventRoutingConfig>) {
    this.config = { ...DEFAULT_ROUTING_CONFIG, ...config };
    this.routeTable = new Map();
    this.defaultRoutes = [];
  }

  /**
   * Adds a route rule for event routing
   * @param eventType The event type to route
   * @param rule The route rule to add
   */
  addRouteRule<T extends keyof LAPAEventMap>(eventType: T, rule: RouteRule): void {
    if (!this.routeTable.has(eventType)) {
      this.routeTable.set(eventType, []);
    }
    
    const rules = this.routeTable.get(eventType)!;
    rules.push(rule);
    
    // Sort rules by priority (higher priority first)
    rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Adds a default route rule that applies to all events
   * @param rule The route rule to add
   */
  addDefaultRouteRule(rule: RouteRule): void {
    this.defaultRoutes.push(rule);
    
    // Sort rules by priority (higher priority first)
    this.defaultRoutes.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Removes a route rule for an event type
   * @param eventType The event type
   * @param rule The route rule to remove
   */
  removeRouteRule<T extends keyof LAPAEventMap>(eventType: T, rule: RouteRule): void {
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
  async routeEvent<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): Promise<LAPAEventMap[T]> {
    // Apply default routes first
    let routedEvent: LAPAEvent = await this.applyRoutes(event, this.defaultRoutes);
    
    // Apply type-specific routes
    const typeRules = this.routeTable.get(event.type);
    if (typeRules) {
      routedEvent = await this.applyRoutes(routedEvent, typeRules);
    }
    
    // Ensure the event maintains its original type
    return routedEvent as LAPAEventMap[T];
  }

  /**
   * Applies route rules to an event
   * @param event The event to apply routes to
   * @param rules The route rules to apply
   * @returns Promise that resolves with the transformed event
   */
  private async applyRoutes(event: LAPAEvent, rules: RouteRule[]): Promise<LAPAEvent> {
    let currentEvent = { ...event };
    
    for (const rule of rules) {
      // Check if the rule applies to this event
      if (this.ruleApplies(rule, currentEvent)) {
        // Apply transformation if configured
        if (rule.transform && this.config.enableEventTransformation) {
          currentEvent = rule.transform(currentEvent);
        }
        
        // Determine target
        let target: string;
        if (typeof rule.target === 'function') {
          target = rule.target(currentEvent);
        } else {
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
  private ruleApplies(rule: RouteRule, event: LAPAEvent): boolean {
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
        } else {
          return rule.pattern === event.type;
        }
      } else if (rule.pattern instanceof RegExp) {
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
  updateConfig(newConfig: Partial<EventRoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   * @returns Current configuration
   */
  getConfig(): EventRoutingConfig {
    return { ...this.config };
  }

  /**
   * Clears all route rules
   */
  clearRoutes(): void {
    this.routeTable.clear();
    this.defaultRoutes.length = 0;
  }
}

// Export singleton instance
export const eventRouter = new EventRouter();

// Export convenience function for routing events
export async function routeEvent<T extends keyof LAPAEventMap>(event: LAPAEventMap[T]): Promise<LAPAEventMap[T]> {
  return eventRouter.routeEvent(event);
}

// Predefined route rules for common LAPA event patterns
export function setupDefaultLAPARoutes(): void {
  // High priority route for system errors - send to all agents
  eventRouter.addDefaultRouteRule({
    pattern: 'system.error',
    target: 'all-agents',
    priority: 200,
    filter: (event) => event.type === 'system.error'
  });

  // Route handoff events to specific agents
  eventRouter.addRouteRule('handoff.initiated', {
    pattern: 'handoff.initiated',
    target: (event) => event.payload.targetAgentId,
    priority: 150
  });

  // Route task events to swarm orchestrator
  eventRouter.addRouteRule('task.created', {
    pattern: 'task.created',
    target: 'swarm-orchestrator',
    priority: 100
  });

  // Route agent events to agent manager
  eventRouter.addRouteRule('agent.registered', {
    pattern: 'agent.registered',
    target: 'agent-manager',
    priority: 100
  });

  // Route context events to context manager
  eventRouter.addRouteRule('context.compressed', {
    pattern: 'context.compressed',
    target: 'context-manager',
    priority: 100
  });

  // Route performance events to metrics collector
  eventRouter.addRouteRule('performance.metric', {
    pattern: 'performance.metric',
    target: 'metrics-collector',
    priority: 100
  });
}