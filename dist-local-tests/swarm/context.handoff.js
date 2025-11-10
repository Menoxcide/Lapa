"use strict";
/**
 * Context Handoff Mechanism for LAPA Swarm Intelligence
 *
 * This module implements the context handoff mechanism for transferring
 * state and context between agents in the LAPA swarm. It ensures seamless
 * collaboration by preserving and transmitting relevant information.
 */
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
exports.contextHandoffManager = exports.ContextHandoffManager = void 0;
var ctx_zip_integration_1 = require("../mcp/ctx-zip.integration");
// Context repository for storing handoff data
var ContextRepository = /** @class */ (function () {
    function ContextRepository() {
        this.contexts = new Map();
        this.metadata = new Map();
    }
    /**
     * Stores compressed context data
     * @param handoffId Unique handoff identifier
     * @param compressedData Compressed context buffer
     * @param metadata Additional metadata
     */
    ContextRepository.prototype.storeContext = function (handoffId, compressedData, metadata) {
        this.contexts.set(handoffId, compressedData);
        this.metadata.set(handoffId, metadata);
        console.log("Stored context for handoff: ".concat(handoffId));
    };
    /**
     * Retrieves compressed context data
     * @param handoffId Unique handoff identifier
     * @returns Compressed context buffer or undefined if not found
     */
    ContextRepository.prototype.getContext = function (handoffId) {
        return this.contexts.get(handoffId);
    };
    /**
     * Retrieves metadata for a handoff
     * @param handoffId Unique handoff identifier
     * @returns Metadata or undefined if not found
     */
    ContextRepository.prototype.getMetadata = function (handoffId) {
        return this.metadata.get(handoffId);
    };
    /**
     * Removes context data (cleanup after successful transfer)
     * @param handoffId Unique handoff identifier
     */
    ContextRepository.prototype.removeContext = function (handoffId) {
        this.contexts.delete(handoffId);
        this.metadata.delete(handoffId);
        console.log("Removed context for handoff: ".concat(handoffId));
    };
    return ContextRepository;
}());
// Global context repository instance
var contextRepository = new ContextRepository();
/**
 * LAPA Context Handoff Manager
 */
var ContextHandoffManager = /** @class */ (function () {
    function ContextHandoffManager() {
        this.pendingHandoffs = new Map();
        this.handoffStatus = new Map();
    }
    /**
     * Initiates a context handoff between agents
     * @param request Handoff request details
     * @returns Promise that resolves with the handoff response
     */
    ContextHandoffManager.prototype.initiateHandoff = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var handoffId, contextString, startTime, compressedData, compressionTime, metadata, error_1, handoffId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Initiating context handoff from ".concat(request.sourceAgentId, " to ").concat(request.targetAgentId));
                        handoffId = this.generateHandoffId(request);
                        // Update status
                        this.updateHandoffStatus(handoffId, 'pending', 0);
                        contextString = JSON.stringify(request.context);
                        startTime = Date.now();
                        return [4 /*yield*/, (0, ctx_zip_integration_1.compressContext)(contextString, {
                                quality: this.getCompressionQuality(request.priority),
                                preserveSemantic: true,
                                contextType: 'agent_handoff'
                            })];
                    case 1:
                        compressedData = _a.sent();
                        compressionTime = Date.now() - startTime;
                        metadata = {
                            sourceAgentId: request.sourceAgentId,
                            targetAgentId: request.targetAgentId,
                            taskId: request.taskId,
                            priority: request.priority,
                            compressionTime: compressionTime,
                            originalSize: contextString.length,
                            compressedSize: compressedData.length
                        };
                        contextRepository.storeContext(handoffId, compressedData, metadata);
                        // Register pending handoff
                        this.pendingHandoffs.set(handoffId, request);
                        // Update status
                        this.updateHandoffStatus(handoffId, 'transferring', 50);
                        console.log("Context handoff initiated: ".concat(handoffId));
                        return [2 /*return*/, {
                                success: true,
                                handoffId: handoffId,
                                compressedSize: compressedData.length,
                                transferTime: compressionTime
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to initiate context handoff:', error_1);
                        handoffId = this.generateHandoffId(request);
                        this.updateHandoffStatus(handoffId, 'failed', 0, error_1 instanceof Error ? error_1.message : String(error_1));
                        return [2 /*return*/, {
                                success: false,
                                handoffId: handoffId,
                                error: error_1 instanceof Error ? error_1.message : String(error_1)
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Completes a context handoff by retrieving and decompressing the context
     * @param handoffId Unique handoff identifier
     * @param targetAgentId ID of the agent receiving the context
     * @returns Promise that resolves with the decompressed context
     */
    ContextHandoffManager.prototype.completeHandoff = function (handoffId, targetAgentId) {
        return __awaiter(this, void 0, void 0, function () {
            var request, compressedData, startTime, contextString, decompressionTime, context, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Completing context handoff: ".concat(handoffId, " for agent: ").concat(targetAgentId));
                        request = this.pendingHandoffs.get(handoffId);
                        if (!request) {
                            throw new Error("Handoff ".concat(handoffId, " not found"));
                        }
                        if (request.targetAgentId !== targetAgentId) {
                            throw new Error("Handoff ".concat(handoffId, " is not intended for agent ").concat(targetAgentId));
                        }
                        // Update status
                        this.updateHandoffStatus(handoffId, 'transferring', 75);
                        compressedData = contextRepository.getContext(handoffId);
                        if (!compressedData) {
                            throw new Error("Compressed context not found for handoff ".concat(handoffId));
                        }
                        startTime = Date.now();
                        return [4 /*yield*/, (0, ctx_zip_integration_1.decompressContext)(compressedData)];
                    case 1:
                        contextString = _a.sent();
                        decompressionTime = Date.now() - startTime;
                        context = JSON.parse(contextString);
                        // Clean up
                        contextRepository.removeContext(handoffId);
                        this.pendingHandoffs.delete(handoffId);
                        // Update status
                        this.updateHandoffStatus(handoffId, 'completed', 100);
                        console.log("Context handoff completed: ".concat(handoffId, " in ").concat(decompressionTime, "ms"));
                        return [2 /*return*/, context];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Failed to complete context handoff:', error_2);
                        this.updateHandoffStatus(handoffId, 'failed', 0, error_2 instanceof Error ? error_2.message : String(error_2));
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets the status of a context handoff
     * @param handoffId Unique handoff identifier
     * @returns Handoff status or undefined if not found
     */
    ContextHandoffManager.prototype.getHandoffStatus = function (handoffId) {
        return this.handoffStatus.get(handoffId);
    };
    /**
     * Cancels a pending context handoff
     * @param handoffId Unique handoff identifier
     * @returns Boolean indicating success
     */
    ContextHandoffManager.prototype.cancelHandoff = function (handoffId) {
        try {
            var request = this.pendingHandoffs.get(handoffId);
            if (!request) {
                return false;
            }
            // Clean up
            contextRepository.removeContext(handoffId);
            this.pendingHandoffs.delete(handoffId);
            this.handoffStatus.delete(handoffId);
            console.log("Cancelled context handoff: ".concat(handoffId));
            return true;
        }
        catch (error) {
            console.error('Failed to cancel context handoff:', error);
            return false;
        }
    };
    /**
     * Generates a unique handoff ID
     * @param request Handoff request details
     * @returns Unique handoff identifier
     */
    ContextHandoffManager.prototype.generateHandoffId = function (request) {
        var timestamp = Date.now();
        var random = Math.floor(Math.random() * 10000);
        return "handoff_".concat(request.sourceAgentId, "_").concat(request.targetAgentId, "_").concat(timestamp, "_").concat(random);
    };
    /**
     * Updates the status of a handoff
     * @param handoffId Unique handoff identifier
     * @param status New status
     * @param progress Progress percentage (0-100)
     * @param error Optional error message
     */
    ContextHandoffManager.prototype.updateHandoffStatus = function (handoffId, status, progress, error) {
        var statusObj = {
            handoffId: handoffId,
            status: status,
            progress: Math.max(0, Math.min(100, progress)),
            timestamp: new Date(),
            error: error
        };
        this.handoffStatus.set(handoffId, statusObj);
        // Log status changes
        if (status === 'completed') {
            console.log("Handoff ".concat(handoffId, " completed successfully"));
        }
        else if (status === 'failed') {
            console.error("Handoff ".concat(handoffId, " failed: ").concat(error));
        }
    };
    /**
     * Determines compression quality based on priority
     * @param priority Handoff priority
     * @returns Compression quality value (1-10)
     */
    ContextHandoffManager.prototype.getCompressionQuality = function (priority) {
        switch (priority) {
            case 'high':
                return 6; // Less compression for faster transfer
            case 'medium':
                return 8; // Balanced compression
            case 'low':
                return 9; // More compression for smaller size
            default:
                return 8;
        }
    };
    return ContextHandoffManager;
}());
exports.ContextHandoffManager = ContextHandoffManager;
// Export singleton instance
exports.contextHandoffManager = new ContextHandoffManager();
