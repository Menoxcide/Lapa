"use strict";
/**
 * LangGraph Orchestration for LAPA Swarm Intelligence
 *
 * This module implements the LangGraph orchestration layer for coordinating
 * multiple agents in the LAPA swarm. It manages agent interactions, state
 * transitions, and workflow execution using a graph-based approach.
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
exports.langGraphOrchestrator = exports.LangGraphOrchestrator = void 0;
/**
 * LAPA LangGraph Orchestrator
 */
var LangGraphOrchestrator = /** @class */ (function () {
    function LangGraphOrchestrator(initialState) {
        this.nodes = new Map();
        this.edges = new Map();
        this.initialState = initialState;
    }
    /**
     * Adds a node to the graph
     * @param node The node to add
     */
    LangGraphOrchestrator.prototype.addNode = function (node) {
        this.nodes.set(node.id, node);
        console.log("Added node: ".concat(node.label, " (").concat(node.id, ")"));
    };
    /**
     * Adds an edge to the graph
     * @param edge The edge to add
     */
    LangGraphOrchestrator.prototype.addEdge = function (edge) {
        this.edges.set(edge.id, edge);
        console.log("Added edge: ".concat(edge.source, " -> ").concat(edge.target));
    };
    /**
     * Gets all nodes in the graph
     * @returns Array of nodes
     */
    LangGraphOrchestrator.prototype.getNodes = function () {
        return Array.from(this.nodes.values());
    };
    /**
     * Gets all edges in the graph
     * @returns Array of edges
     */
    LangGraphOrchestrator.prototype.getEdges = function () {
        return Array.from(this.edges.values());
    };
    /**
     * Gets outbound edges for a node
     * @param nodeId The node ID
     * @returns Array of outbound edges
     */
    LangGraphOrchestrator.prototype.getOutboundEdges = function (nodeId) {
        return Array.from(this.edges.values()).filter(function (edge) { return edge.source === nodeId; });
    };
    /**
     * Executes the workflow starting from the initial state
     * @param initialContext Initial context for the workflow
     * @returns Promise that resolves with the orchestration result
     */
    LangGraphOrchestrator.prototype.executeWorkflow = function (initialContext) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPath, currentState, maxIterations, iterations, currentNode, result, outboundEdges, nextEdge, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        executionPath = [];
                        currentState = {
                            nodeId: this.initialState,
                            context: __assign({}, initialContext),
                            history: []
                        };
                        // Validate initial state exists
                        if (!this.nodes.has(this.initialState)) {
                            throw new Error("Initial state node '".concat(this.initialState, "' not found in graph"));
                        }
                        console.log("Starting workflow execution from node: ".concat(this.initialState));
                        maxIterations = 100;
                        iterations = 0;
                        _a.label = 1;
                    case 1:
                        if (!(iterations < maxIterations)) return [3 /*break*/, 3];
                        currentNode = this.nodes.get(currentState.nodeId);
                        if (!currentNode) {
                            throw new Error("Node '".concat(currentState.nodeId, "' not found during execution"));
                        }
                        executionPath.push(currentState.nodeId);
                        console.log("Executing node: ".concat(currentNode.label, " (").concat(currentNode.id, ")"));
                        return [4 /*yield*/, this.processNode(currentNode, currentState.context)];
                    case 2:
                        result = _a.sent();
                        // Update state history
                        currentState.history.push({
                            nodeId: currentState.nodeId,
                            timestamp: new Date(),
                            input: __assign({}, currentState.context),
                            output: result
                        });
                        outboundEdges = this.getOutboundEdges(currentState.nodeId);
                        if (outboundEdges.length === 0) {
                            // End of workflow
                            console.log("Workflow completed at node: ".concat(currentNode.label));
                            return [2 /*return*/, {
                                    success: true,
                                    finalState: currentState,
                                    output: result,
                                    executionPath: executionPath
                                }];
                        }
                        nextEdge = outboundEdges[0];
                        currentState.nodeId = nextEdge.target;
                        currentState.context = __assign({}, result); // Pass result as context to next node
                        iterations++;
                        return [3 /*break*/, 1];
                    case 3: throw new Error("Workflow exceeded maximum iterations (".concat(maxIterations, ")"));
                    case 4:
                        error_1 = _a.sent();
                        console.error('Workflow execution failed:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                finalState: {},
                                output: null,
                                executionPath: [],
                                error: error_1 instanceof Error ? error_1.message : String(error_1)
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processes a node based on its type
     * @param node The node to process
     * @param context Current context
     * @returns Promise that resolves with the processing result
     */
    LangGraphOrchestrator.prototype.processNode = function (node, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = node.type;
                        switch (_a) {
                            case 'agent': return [3 /*break*/, 1];
                            case 'process': return [3 /*break*/, 3];
                            case 'decision': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.processAgentNode(node, context)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.processProcessNode(node, context)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.processDecisionNode(node, context)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: throw new Error("Unknown node type: ".concat(node.type));
                }
            });
        });
    };
    /**
     * Processes an agent node
     * @param node The agent node
     * @param context Current context
     * @returns Promise that resolves with the agent's output
     */
    LangGraphOrchestrator.prototype.processAgentNode = function (node, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // In a real implementation, this would route to the appropriate agent
                        // For simulation, we'll just return the context with some modifications
                        console.log("Processing agent node: ".concat(node.label));
                        // Simulate agent processing
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.random() * 1000 + 500); })];
                    case 1:
                        // Simulate agent processing
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, context), { processedBy: node.label, timestamp: new Date().toISOString(), result: "Processed by ".concat(node.label, " agent") })];
                }
            });
        });
    };
    /**
     * Processes a process node
     * @param node The process node
     * @param context Current context
     * @returns Promise that resolves with the process output
     */
    LangGraphOrchestrator.prototype.processProcessNode = function (node, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Processing process node: ".concat(node.label));
                        // Simulate process execution
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.random() * 500 + 250); })];
                    case 1:
                        // Simulate process execution
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, context), { processedBy: node.label, timestamp: new Date().toISOString(), result: "Executed process ".concat(node.label) })];
                }
            });
        });
    };
    /**
     * Processes a decision node
     * @param node The decision node
     * @param context Current context
     * @returns Promise that resolves with the decision output
     */
    LangGraphOrchestrator.prototype.processDecisionNode = function (node, context) {
        return __awaiter(this, void 0, void 0, function () {
            var decision;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Processing decision node: ".concat(node.label));
                        // Simulate decision making
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.random() * 300 + 150); })];
                    case 1:
                        // Simulate decision making
                        _a.sent();
                        decision = Math.random() > 0.5 ? 'positive' : 'negative';
                        return [2 /*return*/, __assign(__assign({}, context), { processedBy: node.label, decision: decision, timestamp: new Date().toISOString(), result: "Decision made: ".concat(decision) })];
                }
            });
        });
    };
    return LangGraphOrchestrator;
}());
exports.LangGraphOrchestrator = LangGraphOrchestrator;
// Export singleton instance
exports.langGraphOrchestrator = new LangGraphOrchestrator('start');
