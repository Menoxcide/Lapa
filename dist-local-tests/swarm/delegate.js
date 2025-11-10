"use strict";
/**
 * Swarm Delegate for LAPA v1.1 Local-First Implementation
 *
 * This module implements the swarm delegate that integrates local client functionality
 * into swarm operations. It enables swarm-level handoff functionality using local inference
 * while maintaining compatibility with existing swarm consensus and voting mechanisms.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swarmDelegate = exports.SwarmDelegate = void 0;
exports.delegateTask = delegateTask;
var handoffs_local_1 = require("../orchestrator/handoffs.local");
var consensus_voting_1 = require("./consensus.voting");
var context_handoff_1 = require("./context.handoff");
/**
 * LAPA Swarm Delegate
 *
 * Manages delegation of tasks within the swarm using local inference when available,
 * integrating with consensus mechanisms for collective decision-making.
 */
var SwarmDelegate = /** @class */ (function () {
    function SwarmDelegate(config) {
        this.registeredAgents = new Map();
        this.localHandoffSystem = new handoffs_local_1.LocalHandoffSystem();
        this.consensusVotingSystem = new consensus_voting_1.ConsensusVotingSystem();
        this.contextHandoffManager = new context_handoff_1.ContextHandoffManager();
        this.config = __assign({ enableLocalInference: true, latencyTargetMs: 2000, maxConcurrentDelegations: 10, enableConsensusVoting: true }, config);
    }
    /**
     * Registers a swarm agent for potential delegation
     * @param agent Swarm agent instance
     */
    SwarmDelegate.prototype.registerAgent = function (agent) {
        this.registeredAgents.set(agent.id, agent);
        this.consensusVotingSystem.registerAgent({
            id: agent.id,
            name: agent.name,
            expertise: agent.capabilities,
            workload: agent.workload,
            type: agent.type,
            capacity: agent.capacity
        });
        console.log("Registered swarm agent: ".concat(agent.name, " (").concat(agent.id, ")"));
    };
    /**
     * Delegates a task to the most appropriate agent using local inference when possible
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    SwarmDelegate.prototype.delegateTask = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, localResult, endTime_1, duration_1, consensusResult, endTime, duration, error_1, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = performance.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        console.log("Delegating task: ".concat(task.id, " using swarm delegate"));
                        if (!(this.config.enableLocalInference && this.hasLocalAgents())) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.delegateToLocalAgent(task, context)];
                    case 2:
                        localResult = _a.sent();
                        if (localResult.success) {
                            endTime_1 = performance.now();
                            duration_1 = endTime_1 - startTime;
                            return [2 /*return*/, __assign(__assign({}, localResult), { metrics: {
                                        duration: duration_1,
                                        latencyWithinTarget: duration_1 <= this.config.latencyTargetMs
                                    } })];
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.delegateViaConsensus(task, context)];
                    case 4:
                        consensusResult = _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        return [2 /*return*/, __assign(__assign({}, consensusResult), { metrics: {
                                    duration: duration,
                                    latencyWithinTarget: duration <= this.config.latencyTargetMs
                                } })];
                    case 5:
                        error_1 = _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        console.error("Task delegation failed for ".concat(task.id, ":"), error_1);
                        return [2 /*return*/, {
                                success: false,
                                taskId: task.id,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                metrics: {
                                    duration: duration,
                                    latencyWithinTarget: duration <= this.config.latencyTargetMs
                                }
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delegates a task to a local agent using local inference
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    SwarmDelegate.prototype.delegateToLocalAgent = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var result, targetAgentId, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        console.log("Attempting local delegation for task: ".concat(task.id));
                        return [4 /*yield*/, (0, handoffs_local_1.localHandoff)(task, context)];
                    case 1:
                        result = _b.sent();
                        targetAgentId = ((_a = result.handoffMetrics) === null || _a === void 0 ? void 0 : _a.providerUsed) || 'unknown-local-agent';
                        console.log("Local delegation successful for task: ".concat(task.id));
                        return [2 /*return*/, {
                                success: true,
                                taskId: task.id,
                                delegatedToAgentId: targetAgentId,
                                result: result
                            }];
                    case 2:
                        error_2 = _b.sent();
                        console.error("Local delegation failed for task ".concat(task.id, ":"), error_2);
                        return [2 /*return*/, {
                                success: false,
                                taskId: task.id,
                                error: error_2 instanceof Error ? error_2.message : String(error_2)
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delegates a task via consensus voting among swarm agents
     * @param task Task to delegate
     * @param context Context for the task
     * @returns Promise that resolves with the delegation result
     */
    SwarmDelegate.prototype.delegateViaConsensus = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var agentOptions, sessionId, agents, i, agent, hasRelevantCapability, consensusResult, winningAgentId, winningAgent, handoffRequest, handoffResponse, handoffResult, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enableConsensusVoting) {
                            return [2 /*return*/, {
                                    success: false,
                                    taskId: task.id,
                                    error: 'Consensus voting is disabled'
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        console.log("Initiating consensus-based delegation for task: ".concat(task.id));
                        agentOptions = Array.from(this.registeredAgents.values()).map(function (agent) { return ({
                            id: agent.id,
                            label: agent.name,
                            value: agent
                        }); });
                        if (agentOptions.length === 0) {
                            throw new Error('No agents registered for consensus voting');
                        }
                        sessionId = this.consensusVotingSystem.createVotingSession("Task delegation: ".concat(task.description), agentOptions);
                        agents = Array.from(this.registeredAgents.values());
                        for (i = 0; i < agents.length; i++) {
                            agent = agents[i];
                            hasRelevantCapability = agent.capabilities.some(function (cap) {
                                return task.description.toLowerCase().includes(cap.toLowerCase());
                            });
                            // Cast vote with rationale
                            this.consensusVotingSystem.castVote(sessionId, agent.id, agent.id, hasRelevantCapability ? "Agent has relevant capability for task" : "General purpose agent");
                        }
                        consensusResult = this.consensusVotingSystem.closeVotingSession('weighted-majority');
                        if (!consensusResult.consensusReached || !consensusResult.winningOption) {
                            throw new Error('Failed to reach consensus on task delegation');
                        }
                        winningAgentId = consensusResult.winningOption.id;
                        winningAgent = this.registeredAgents.get(winningAgentId);
                        if (!winningAgent) {
                            throw new Error("Winning agent ".concat(winningAgentId, " not found"));
                        }
                        console.log("Consensus reached: delegating task ".concat(task.id, " to agent ").concat(winningAgent.name));
                        handoffRequest = {
                            sourceAgentId: 'swarm-delegate',
                            targetAgentId: winningAgentId,
                            taskId: task.id,
                            context: context,
                            priority: (task.priority && ['low', 'medium', 'high'].includes(task.priority.toString()))
                                ? task.priority.toString()
                                : 'medium'
                        };
                        return [4 /*yield*/, this.contextHandoffManager.initiateHandoff(handoffRequest)];
                    case 2:
                        handoffResponse = _a.sent();
                        if (!handoffResponse.success) {
                            throw new Error("Failed to initiate context handoff: ".concat(handoffResponse.error));
                        }
                        return [4 /*yield*/, this.contextHandoffManager.completeHandoff(handoffResponse.handoffId, winningAgentId)];
                    case 3:
                        handoffResult = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                taskId: task.id,
                                delegatedToAgentId: winningAgentId,
                                result: handoffResult
                            }];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Consensus-based delegation failed for task ".concat(task.id, ":"), error_3);
                        return [2 /*return*/, {
                                success: false,
                                taskId: task.id,
                                error: error_3 instanceof Error ? error_3.message : String(error_3)
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if there are any local agents registered
     * @returns Boolean indicating if local agents exist
     */
    SwarmDelegate.prototype.hasLocalAgents = function () {
        var agents = Array.from(this.registeredAgents.values());
        for (var i = 0; i < agents.length; i++) {
            if (agents[i].isLocal) {
                return true;
            }
        }
        return false;
    };
    /**
     * Gets current swarm delegate configuration
     * @returns Current configuration
     */
    SwarmDelegate.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Updates swarm delegate configuration
     * @param newConfig Partial configuration to update
     */
    SwarmDelegate.prototype.updateConfig = function (newConfig) {
        this.config = __assign(__assign({}, this.config), newConfig);
        console.log('Swarm delegate configuration updated:', this.config);
    };
    /**
     * Gets registered agents
     * @returns Array of registered agents
     */
    SwarmDelegate.prototype.getRegisteredAgents = function () {
        return Array.from(this.registeredAgents.values());
    };
    return SwarmDelegate;
}());
exports.SwarmDelegate = SwarmDelegate;
// Export singleton instance
exports.swarmDelegate = new SwarmDelegate();
/**
 * Convenience function for delegating tasks using the swarm delegate
 * @param task Task to delegate
 * @param context Context for the task
 * @returns Promise that resolves with the delegation result
 */
function delegateTask(task, context) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.swarmDelegate.delegateTask(task, context)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
