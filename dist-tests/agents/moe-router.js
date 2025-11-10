"use strict";
/**
 * MoE Router for LAPA Core Agents
 *
 * This module implements the Mixture of Experts (MoE) routing logic for distributing
 * tasks among specialized agents in the LAPA swarm. It analyzes incoming tasks
 * and routes them to the most appropriate agent based on expertise and workload.
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moeRouter = exports.MoERouter = void 0;
/**
 * LAPA MoE Router class
 */
var MoERouter = /** @class */ (function () {
    /**
     * Registers an agent with the router
     * @param agent The agent to register
     */
    function MoERouter(maxMemoryEntries) {
        if (maxMemoryEntries === void 0) { maxMemoryEntries = 1000; }
        this.agents = [];
        this.routingMemory = [];
        this.maxMemoryEntries = maxMemoryEntries;
    }
    MoERouter.prototype.registerAgent = function (agent) {
        this.agents.push(agent);
        console.log("Registered agent: ".concat(agent.name, " (").concat(agent.type, ")"));
    };
    /**
     * Unregisters an agent from the router
     * @param agentId The ID of the agent to unregister
     */
    MoERouter.prototype.unregisterAgent = function (agentId) {
        this.agents = this.agents.filter(function (agent) { return agent.id !== agentId; });
        console.log("Unregistered agent with ID: ".concat(agentId));
    };
    /**
     * Updates an agent's workload
     * @param agentId The ID of the agent
     * @param workload The new workload value
     */
    MoERouter.prototype.updateAgentWorkload = function (agentId, workload) {
        var agent = this.agents.find(function (a) { return a.id === agentId; });
        if (agent) {
            agent.workload = workload;
        }
    };
    /**
     * Routes a task to the most appropriate agent
     * @param task The task to route
     * @returns Routing result with selected agent and confidence
     */
    MoERouter.prototype.routeTask = function (task) {
        var _this = this;
        if (this.agents.length === 0) {
            throw new Error('No agents registered with the router');
        }
        // Check routing memory first for recently used agents
        var recentRouting = this.getRecentRouting(task.id);
        if (recentRouting) {
            var agent = this.agents.find(function (a) { return a.id === recentRouting.agentId; });
            if (agent && agent.workload < agent.capacity) {
                return {
                    agent: agent,
                    confidence: 0.9,
                    reasoning: 'Using recent routing decision'
                };
            }
        }
        // Calculate suitability scores for each agent
        var scores = this.agents.map(function (agent) {
            // Skip agents at full capacity
            if (agent.workload >= agent.capacity) {
                return { agent: agent, score: -1, reasoning: 'At full capacity' };
            }
            // Calculate expertise match score (0-1)
            var expertiseScore = _this.calculateExpertiseMatch(task, agent);
            // Calculate workload factor (0-1, higher = less loaded)
            var workloadFactor = 1 - (agent.workload / agent.capacity);
            // Combine scores with weights
            var totalScore = (expertiseScore * 0.8) + (workloadFactor * 0.2);
            return {
                agent: agent,
                score: totalScore,
                reasoning: "Expertise match: ".concat((expertiseScore * 100).toFixed(1), "%, Workload factor: ").concat((workloadFactor * 100).toFixed(1), "%")
            };
        });
        // Filter out agents at full capacity
        var validScores = scores.filter(function (s) { return s.score >= 0; });
        if (validScores.length === 0) {
            // All agents at full capacity, select the one with lowest workload
            var leastLoaded = __spreadArray([], this.agents, true).sort(function (a, b) { return a.workload - b.workload; })[0];
            return {
                agent: leastLoaded,
                confidence: 0.3,
                reasoning: 'All agents at capacity, selecting least loaded agent'
            };
        }
        // Select the agent with highest score
        var bestMatch = validScores.reduce(function (best, current) {
            return current.score > best.score ? current : best;
        });
        // Convert score to confidence (0-1)
        var confidence = Math.min(bestMatch.score, 1);
        // Record routing decision for memory
        this.recordRoutingDecision(task.id, bestMatch.agent.id);
        return {
            agent: bestMatch.agent,
            confidence: confidence,
            reasoning: bestMatch.reasoning
        };
    };
    /**
     * Calculates expertise match between task and agent
     * @param task The task to evaluate
     * @param agent The agent to evaluate
     * @returns Match score between 0 and 1
     */
    MoERouter.prototype.calculateExpertiseMatch = function (task, agent) {
        // Simple keyword matching approach
        var taskLower = task.description.toLowerCase();
        var matchCount = 0;
        for (var _i = 0, _a = agent.expertise; _i < _a.length; _i++) {
            var expertise = _a[_i];
            if (taskLower.includes(expertise.toLowerCase())) {
                matchCount++;
            }
        }
        // Normalize to 0-1 scale
        return matchCount / agent.expertise.length;
    };
    /**
     * Gets all registered agents
     * @returns Array of registered agents
     */
    MoERouter.prototype.getAgents = function () {
        return __spreadArray([], this.agents, true);
    };
    /**
     * Gets agent by ID
     * @param agentId The ID of the agent
     * @returns The agent or undefined if not found
     */
    MoERouter.prototype.getAgentById = function (agentId) {
        return this.agents.find(function (agent) { return agent.id === agentId; });
    };
    /**
     * Records a routing decision for memory
     * @param taskId Task ID
     * @param agentId Agent ID
     */
    MoERouter.prototype.recordRoutingDecision = function (taskId, agentId) {
        this.routingMemory.push({
            taskId: taskId,
            agentId: agentId,
            timestamp: new Date()
        });
        // Trim memory if it exceeds the limit
        if (this.routingMemory.length > this.maxMemoryEntries) {
            this.routingMemory = this.routingMemory.slice(-this.maxMemoryEntries);
        }
    };
    /**
     * Gets recent routing decision for a task
     * @param taskId Task ID
     * @returns Routing decision or undefined if not found
     */
    MoERouter.prototype.getRecentRouting = function (taskId) {
        // Look for routing decisions in the last 10 minutes
        var cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
        // Find the most recent routing decision for this task
        var recentRouting = this.routingMemory
            .filter(function (entry) { return entry.taskId === taskId && entry.timestamp > cutoffTime; })
            .sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); })[0];
        return recentRouting ? { agentId: recentRouting.agentId, timestamp: recentRouting.timestamp } : undefined;
    };
    return MoERouter;
}());
exports.MoERouter = MoERouter;
// Default export for convenience
exports.moeRouter = new MoERouter();
