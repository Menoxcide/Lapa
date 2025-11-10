"use strict";
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
var handoffs_local_1 = require("../../src/orchestrator/handoffs.local");
// Mock the local inference functions
jest.mock('../../src/inference/ollama.local', function () {
    return {
        sendOllamaChatRequest: jest.fn(),
        sendOllamaInferenceRequest: jest.fn(),
        isOllamaAvailable: jest.fn()
    };
});
jest.mock('../../src/inference/nim.local', function () {
    return {
        sendNIMInferenceRequest: jest.fn(),
        isNIMAvailable: jest.fn()
    };
});
// Import the mocked functions
var ollama_local_1 = require("../../src/inference/ollama.local");
var nim_local_1 = require("../../src/inference/nim.local");
describe('Local Handoff Performance', function () {
    var handoffSystem;
    var mockLocalAgent;
    beforeEach(function () {
        handoffSystem = new handoffs_local_1.LocalHandoffSystem();
        mockLocalAgent = {
            id: 'local-agent-1',
            name: 'Test Local Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Latency Validation', function () {
        it('should complete local handoff within 2s target for simple tasks', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockRunResult, startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        mockRunResult = 'Quick task completed by local agent';
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue(mockRunResult);
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'simple context data for local' })];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should complete well within the 2s target
                        expect(duration).toBeLessThan(2000);
                        return [2 /*return*/];
                }
            });
        }); }, 10000); // 10 second timeout for the test
        it('should maintain <2s latency under moderate local inference load', function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock responses with slight delays to simulate inference latency
                        ollama_local_1.sendOllamaChatRequest.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Simulate typical local inference response time
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                    case 1:
                                        // Simulate typical local inference response time
                                        _a.sent();
                                        return [2 /*return*/, 'Task completed under moderate local load'];
                                }
                            });
                        }); });
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'moderate context data for local' })];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should stay under 2s even with inference latency
                        expect(duration).toBeLessThan(2000);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should track local handoff duration accurately', function () { return __awaiter(void 0, void 0, void 0, function () {
            var consoleLogSpy, consoleWarnSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock a response with known delay
                        ollama_local_1.sendOllamaChatRequest.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Simulate a specific delay
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 150); })];
                                    case 1:
                                        // Simulate a specific delay
                                        _a.sent();
                                        return [2 /*return*/, 'Local task completed'];
                                }
                            });
                        }); });
                        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'timed context data for local' })];
                    case 1:
                        _a.sent();
                        // Check that timing information was logged
                        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Handoff from .* to .* completed in .*ms/));
                        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                        // Configure a very short latency target for testing
                        handoffSystem.updateConfig({ latencyTargetMs: 100 });
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'task-456', { testData: 'slow context data for local' })];
                    case 2:
                        _a.sent();
                        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Handoff latency target exceeded'));
                        consoleLogSpy.mockRestore();
                        consoleWarnSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should meet latency target for batch local handoffs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var handoffPromises, handoffCount, startTime, i, results, endTime, totalTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock quick responses for batch processing
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue('Batch task completed by local');
                        handoffPromises = [];
                        handoffCount = 3;
                        startTime = performance.now();
                        for (i = 0; i < handoffCount; i++) {
                            handoffPromises.push(handoffSystem.initiateHandoff("source-agent-".concat(i), 'local-agent-1', "task-".concat(i), { testData: "batch context data ".concat(i, " for local") }));
                        }
                        return [4 /*yield*/, Promise.all(handoffPromises)];
                    case 1:
                        results = _a.sent();
                        endTime = performance.now();
                        totalTime = endTime - startTime;
                        // Verify all handoffs completed
                        expect(results).toHaveLength(handoffCount);
                        // Should complete within reasonable time
                        expect(totalTime).toBeLessThan(3000); // 3 seconds for 3 concurrent handoffs
                        // Verify all calls were made
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(handoffCount);
                        return [2 /*return*/];
                }
            });
        }); }, 15000); // 15 second timeout for concurrent test
    });
    describe('High-Load Performance', function () {
        it('should handle burst of local handoffs without significant latency degradation', function () { return __awaiter(void 0, void 0, void 0, function () {
            var burstSize, handoffPromises, startTime, i, results, endTime, totalTime, averageTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock responses with realistic delays
                        ollama_local_1.sendOllamaChatRequest.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var delay;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        delay = 30 + Math.random() * 150;
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, 'Burst task completed by local'];
                                }
                            });
                        }); });
                        burstSize = 8;
                        handoffPromises = [];
                        startTime = performance.now();
                        for (i = 0; i < burstSize; i++) {
                            handoffPromises.push(handoffSystem.initiateHandoff("source-agent-".concat(i), 'local-agent-1', "burst-task-".concat(i), { testData: "burst context data ".concat(i, " for local") }));
                        }
                        return [4 /*yield*/, Promise.all(handoffPromises)];
                    case 1:
                        results = _a.sent();
                        endTime = performance.now();
                        totalTime = endTime - startTime;
                        // Verify all handoffs completed
                        expect(results).toHaveLength(burstSize);
                        averageTime = totalTime / burstSize;
                        expect(averageTime).toBeLessThan(300); // Average < 300ms per handoff
                        // Total time should be reasonable for burst processing
                        expect(totalTime).toBeLessThan(5000); // 5 seconds for 8 concurrent handoffs
                        // Verify all calls were made
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(burstSize);
                        return [2 /*return*/];
                }
            });
        }); }, 20000); // 20 second timeout for burst test
        it('should maintain consistent performance with varying payload sizes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testCases, _i, testCases_1, testCase, startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock quick responses
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue('Variable payload task completed by local');
                        testCases = [
                            { size: 'small', context: { data: 'small payload' } },
                            { size: 'medium', context: { data: 'a'.repeat(1000) } },
                            { size: 'large', context: { data: 'b'.repeat(10000) } }
                        ];
                        _i = 0, testCases_1 = testCases;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testCases_1.length)) return [3 /*break*/, 4];
                        testCase = testCases_1[_i];
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', "payload-test-".concat(testCase.size), testCase.context)];
                    case 2:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // All should complete within 2s regardless of payload size
                        expect(duration).toBeLessThan(2000);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Should have made 3 calls total
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(3);
                        return [2 /*return*/];
                }
            });
        }); }, 15000);
    });
    describe('Performance Edge Cases', function () {
        it('should handle local handoff with retry delays within acceptable timeframe', function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, result, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Configure retry settings for test
                        handoffSystem.retryConfig = {
                            maxRetries: 2,
                            retryDelayMs: 50,
                            exponentialBackoff: true
                        };
                        // Mock first attempt failing, second succeeding
                        ollama_local_1.sendOllamaChatRequest
                            .mockRejectedValueOnce(new Error('Temporary local inference error'))
                            .mockResolvedValueOnce('Task completed after retry');
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'retry-task-456', { testData: 'context data with retry' })];
                    case 1:
                        result = _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        expect(result).toBe('Task completed after retry');
                        // Should still complete within 2s even with retry delays
                        expect(duration).toBeLessThan(2000);
                        // Should have retried once
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should gracefully handle timeout scenarios while maintaining system stability', function () { return __awaiter(void 0, void 0, void 0, function () {
            var slowHandoffPromises, handoffCount, startTime, i, results, endTime, totalTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock a slow response that exceeds reasonable limits
                        ollama_local_1.sendOllamaChatRequest.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Simulate a slow response (but not so slow that it times out the test)
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                                    case 1:
                                        // Simulate a slow response (but not so slow that it times out the test)
                                        _a.sent();
                                        return [2 /*return*/, 'Slow task completed by local'];
                                }
                            });
                        }); });
                        slowHandoffPromises = [];
                        handoffCount = 4;
                        startTime = performance.now();
                        for (i = 0; i < handoffCount; i++) {
                            slowHandoffPromises.push(handoffSystem.initiateHandoff("slow-source-".concat(i), 'local-agent-1', "slow-task-".concat(i), { testData: "slow context data ".concat(i, " for local") }));
                        }
                        return [4 /*yield*/, Promise.all(slowHandoffPromises)];
                    case 1:
                        results = _a.sent();
                        endTime = performance.now();
                        totalTime = endTime - startTime;
                        // Verify all handoffs completed
                        expect(results).toHaveLength(handoffCount);
                        // Total time should be reasonable even for slow concurrent operations
                        expect(totalTime).toBeLessThan(3000); // 3 seconds for 4 concurrent slow handoffs
                        // Verify all calls were made
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(handoffCount);
                        return [2 /*return*/];
                }
            });
        }); }, 15000);
    });
    describe('Fallback Performance', function () {
        it('should maintain performance when falling back from Ollama to NIM', function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Register agent with Ollama type but simulate Ollama unavailability
                        mockLocalAgent.type = 'ollama';
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock Ollama as unavailable and NIM as available
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(false);
                        nim_local_1.isNIMAvailable.mockResolvedValue(true);
                        // Mock NIM response
                        nim_local_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback');
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'fallback-task-456', { testData: 'context data with fallback' })];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should complete within 2s even with fallback
                        expect(duration).toBeLessThan(2000);
                        // Should have called NIM
                        expect(nim_local_1.sendNIMInferenceRequest).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should maintain performance when falling back from NIM to Ollama', function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Register agent with NIM type but simulate NIM unavailability
                        mockLocalAgent.type = 'nim';
                        handoffSystem.registerLocalAgent(mockLocalAgent);
                        // Mock NIM as unavailable and Ollama as available
                        nim_local_1.isNIMAvailable.mockResolvedValue(false);
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(true);
                        // Mock Ollama response
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback');
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.initiateHandoff('source-agent-123', 'local-agent-1', 'fallback-task-456', { testData: 'context data with fallback' })];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should complete within 2s even with fallback
                        expect(duration).toBeLessThan(2000);
                        // Should have called Ollama
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
});
