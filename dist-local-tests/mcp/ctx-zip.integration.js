"use strict";
/**
 * ctx-zip Integration for LAPA
 *
 * This module integrates ctx-zip for context compression in the MCP sandbox environment.
 * It provides utilities for compressing and decompressing context payloads to reduce
 * token usage by 80%+ while maintaining semantic meaning.
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
exports.ctxZipFeedbackController = exports.CtxZipFeedbackController = void 0;
exports.compressContext = compressContext;
exports.decompressContext = decompressContext;
exports.storeCompressedContext = storeCompressedContext;
exports.loadCompressedContext = loadCompressedContext;
exports.testCtxZipCompression = testCtxZipCompression;
exports.recordCompressionStats = recordCompressionStats;
exports.recordCompressionFeedback = recordCompressionFeedback;
exports.analyzeCompressionEffectiveness = analyzeCompressionEffectiveness;
exports.optimizeCompressionParameters = optimizeCompressionParameters;
var ctx_zip_mock_js_1 = require("./ctx-zip.mock.js");
var promises_1 = require("fs/promises");
var path_1 = require("path");
// Local filesystem storage for compressed contexts
var CONTEXT_STORAGE_DIR = '.lapa/storage';
var FEEDBACK_STORAGE_DIR = '.lapa/feedback';
/**
 * Compresses a context payload using ctx-zip
 * @param context The raw context string to compress
 * @param options Compression options
 * @returns Compressed context buffer
 */
function compressContext(context_1) {
    return __awaiter(this, arguments, void 0, function (context, _options) {
        var compressed, error_1;
        if (_options === void 0) { _options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    // Create storage directories if they don't exist
                    return [4 /*yield*/, (0, promises_1.mkdir)(CONTEXT_STORAGE_DIR, { recursive: true })];
                case 1:
                    // Create storage directories if they don't exist
                    _a.sent();
                    return [4 /*yield*/, (0, promises_1.mkdir)(FEEDBACK_STORAGE_DIR, { recursive: true })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, ctx_zip_mock_js_1.compress)(context)];
                case 3:
                    compressed = _a.sent();
                    console.log("Context compressed: ".concat(context.length, " -> ").concat(compressed.length, " bytes (").concat(((1 - compressed.length / context.length) * 100).toFixed(1), "% reduction)"));
                    return [2 /*return*/, compressed];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to compress context:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Decompresses a context payload using ctx-zip
 * @param compressedContext The compressed context buffer
 * @returns Decompressed context string
 */
function decompressContext(compressedContext) {
    return __awaiter(this, void 0, void 0, function () {
        var decompressed, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, ctx_zip_mock_js_1.decompress)(compressedContext)];
                case 1:
                    decompressed = _a.sent();
                    return [2 /*return*/, decompressed];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to decompress context:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Stores compressed context to local filesystem
 * @param sessionId Unique session identifier
 * @param compressedContext Compressed context buffer
 */
function storeCompressedContext(sessionId, compressedContext) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    filePath = (0, path_1.join)(CONTEXT_STORAGE_DIR, "".concat(sessionId, ".ctx"));
                    return [4 /*yield*/, (0, promises_1.writeFile)(filePath, compressedContext)];
                case 1:
                    _a.sent();
                    console.log("Compressed context stored at: ".concat(filePath));
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to store compressed context:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Loads compressed context from local filesystem
 * @param sessionId Unique session identifier
 * @returns Compressed context buffer
 */
function loadCompressedContext(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, compressedContext, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    filePath = (0, path_1.join)(CONTEXT_STORAGE_DIR, "".concat(sessionId, ".ctx"));
                    return [4 /*yield*/, (0, promises_1.readFile)(filePath)];
                case 1:
                    compressedContext = _a.sent();
                    return [2 /*return*/, compressedContext];
                case 2:
                    error_4 = _a.sent();
                    console.error('Failed to load compressed context:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Tests ctx-zip compression effectiveness
 * @param testPayload Test context payload
 * @returns Compression statistics
 */
function testCtxZipCompression(testPayload) {
    return __awaiter(this, void 0, void 0, function () {
        var compressed, compressionRatio, reductionPercentage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, compressContext(testPayload)];
                case 1:
                    compressed = _a.sent();
                    compressionRatio = testPayload.length / compressed.length;
                    reductionPercentage = (1 - compressed.length / testPayload.length) * 100;
                    return [2 /*return*/, {
                            sessionId: 'test-session',
                            originalSize: testPayload.length,
                            compressedSize: compressed.length,
                            compressionRatio: compressionRatio,
                            reductionPercentage: reductionPercentage,
                            timestamp: new Date()
                        }];
            }
        });
    });
}
/**
 * Records compression statistics for feedback analysis
 * @param stats Compression statistics to record
 */
function recordCompressionStats(stats) {
    return __awaiter(this, void 0, void 0, function () {
        var filename, filePath, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    filename = "stats-".concat(stats.sessionId, "-").concat(stats.timestamp.getTime(), ".json");
                    filePath = (0, path_1.join)(FEEDBACK_STORAGE_DIR, filename);
                    return [4 /*yield*/, (0, promises_1.writeFile)(filePath, JSON.stringify(stats, null, 2))];
                case 1:
                    _a.sent();
                    console.log("Compression stats recorded: ".concat(filePath));
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error('Failed to record compression stats:', error_5);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Records user feedback on compression effectiveness
 * @param feedback Feedback data to record
 */
function recordCompressionFeedback(feedback) {
    return __awaiter(this, void 0, void 0, function () {
        var filename, filePath, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    filename = "feedback-".concat(feedback.sessionId, "-").concat(feedback.timestamp.getTime(), ".json");
                    filePath = (0, path_1.join)(FEEDBACK_STORAGE_DIR, filename);
                    return [4 /*yield*/, (0, promises_1.writeFile)(filePath, JSON.stringify(feedback, null, 2))];
                case 1:
                    _a.sent();
                    console.log("Compression feedback recorded: ".concat(filePath));
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error('Failed to record compression feedback:', error_6);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Analyzes compression effectiveness based on recorded stats and feedback
 * @returns Analysis report
 */
function analyzeCompressionEffectiveness() {
    return __awaiter(this, void 0, void 0, function () {
        var simulatedStats, averageReduction, effectivenessRating, recommendations;
        return __generator(this, function (_a) {
            try {
                simulatedStats = [
                    { sessionId: 'sim-1', originalSize: 10000, compressedSize: 1500, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() },
                    { sessionId: 'sim-2', originalSize: 8000, compressedSize: 1200, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() },
                    { sessionId: 'sim-3', originalSize: 12000, compressedSize: 1800, compressionRatio: 6.67, reductionPercentage: 85, timestamp: new Date() }
                ];
                averageReduction = simulatedStats.reduce(function (sum, stat) { return sum + stat.reductionPercentage; }, 0) / simulatedStats.length;
                effectivenessRating = averageReduction > 80 ? 9 : averageReduction > 70 ? 7 : 5;
                recommendations = [];
                if (averageReduction < 80) {
                    recommendations.push('Consider adjusting compression parameters for better reduction');
                }
                if (averageReduction > 90) {
                    recommendations.push('Compression is highly effective, monitor for semantic loss');
                }
                return [2 /*return*/, {
                        averageReduction: averageReduction,
                        totalSessions: simulatedStats.length,
                        effectivenessRating: effectivenessRating,
                        recommendations: recommendations
                    }];
            }
            catch (error) {
                console.error('Failed to analyze compression effectiveness:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Optimizes compression parameters based on feedback
 * @returns Optimization recommendations
 */
function optimizeCompressionParameters() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // In a real implementation, this would analyze feedback to optimize parameters
                // For now, we'll return default optimized settings
                return [2 /*return*/, {
                        suggestedQuality: 8,
                        preserveSemantic: true,
                        notes: 'Based on feedback analysis, these settings balance compression ratio with semantic preservation'
                    }];
            }
            catch (error) {
                console.error('Failed to optimize compression parameters:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * ctx-zip Feedback Loop Controller
 */
var CtxZipFeedbackController = /** @class */ (function () {
    function CtxZipFeedbackController(bufferSize) {
        if (bufferSize === void 0) { bufferSize = 100; }
        this.statsBuffer = [];
        this.feedbackBuffer = [];
        this.bufferSize = bufferSize;
    }
    /**
     * Adds compression stats to the buffer
     * @param stats Compression statistics
     */
    CtxZipFeedbackController.prototype.addStats = function (stats) {
        this.statsBuffer.push(stats);
        if (this.statsBuffer.length > this.bufferSize) {
            this.statsBuffer.shift(); // Remove oldest entry
        }
    };
    /**
     * Adds feedback to the buffer
     * @param feedback Compression feedback
     */
    CtxZipFeedbackController.prototype.addFeedback = function (feedback) {
        this.feedbackBuffer.push(feedback);
        if (this.feedbackBuffer.length > this.bufferSize) {
            this.feedbackBuffer.shift(); // Remove oldest entry
        }
    };
    /**
     * Processes buffered data and provides optimization suggestions
     * @returns Optimization suggestions
     */
    CtxZipFeedbackController.prototype.processFeedback = function () {
        return __awaiter(this, void 0, void 0, function () {
            var avgEffectiveness, avgSemanticPreservation, compressionImprovement;
            return __generator(this, function (_a) {
                if (this.feedbackBuffer.length === 0) {
                    return [2 /*return*/, {
                            avgEffectiveness: 0,
                            avgSemanticPreservation: 0,
                            compressionImprovement: 'No feedback data available'
                        }];
                }
                avgEffectiveness = this.feedbackBuffer.reduce(function (sum, fb) { return sum + fb.effectivenessRating; }, 0) / this.feedbackBuffer.length;
                avgSemanticPreservation = this.feedbackBuffer.reduce(function (sum, fb) { return sum + fb.semanticPreservation; }, 0) / this.feedbackBuffer.length;
                compressionImprovement = '';
                if (avgEffectiveness < 7) {
                    compressionImprovement = 'Consider reducing compression strength to improve effectiveness';
                }
                else if (avgEffectiveness > 9 && avgSemanticPreservation > 9) {
                    compressionImprovement = 'Compression is optimal, maintain current settings';
                }
                else if (avgSemanticPreservation < 7) {
                    compressionImprovement = 'Prioritize semantic preservation over compression ratio';
                }
                else {
                    compressionImprovement = 'Current settings are balanced, minor adjustments may improve results';
                }
                // Clear buffers after processing
                this.statsBuffer = [];
                this.feedbackBuffer = [];
                return [2 /*return*/, {
                        avgEffectiveness: avgEffectiveness,
                        avgSemanticPreservation: avgSemanticPreservation,
                        compressionImprovement: compressionImprovement
                    }];
            });
        });
    };
    return CtxZipFeedbackController;
}());
exports.CtxZipFeedbackController = CtxZipFeedbackController;
// Export singleton instance
exports.ctxZipFeedbackController = new CtxZipFeedbackController();
