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
describe('Fallback Mechanisms Tests', function () {
    var handoffSystem;
    var mockOllamaAgent;
    var mockNIMAgent;
    beforeEach(function () {
        handoffSystem = new handoffs_local_1.LocalHandoffSystem();
        mockOllamaAgent = {
            id: 'ollama-agent-1',
            name: 'Test Ollama Agent',
            model: 'llama3.1',
            type: 'ollama'
        };
        mockNIMAgent = {
            id: 'nim-agent-1',
            name: 'Test NIM Agent',
            model: 'meta/llama3-8b-instruct',
            type: 'nim'
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Ollama to NIM Fallback', function () {
        it('should fallback to NIM when Ollama is unavailable', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockOllamaAgent);
                        // Mock Ollama as unavailable initially, then NIM as available
                        ollama_local_1.isOllamaAvailable
                            .mockResolvedValueOnce(false) // First check - Ollama unavailable
                            .mockResolvedValueOnce(true); // Second check - Ollama available
                        nim_local_1.isNIMAvailable.mockResolvedValue(true);
                        // Mock NIM response
                        nim_local_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with NIM fallback');
                        // Mock Ollama failure then success (for retry)
                        ollama_local_1.sendOllamaChatRequest
                            .mockRejectedValueOnce(new Error('Ollama temporarily unavailable'))
                            .mockResolvedValueOnce('Task completed after Ollama recovery');
                        return [4 /*yield*/, handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'fallback-test-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'ollama-agent-1')];
                    case 1:
                        result = _a.sent();
                        // Should have tried NIM fallback first
                        expect(nim_local_1.sendNIMInferenceRequest).toHaveBeenCalled();
                        expect(result).toBe('Task completed with NIM fallback');
                        return [2 /*return*/];
                }
            });
        }); }, 15000);
        it('should recover to Ollama after temporary NIM failure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockNIMAgent);
                        // Mock NIM as unavailable initially, then Ollama as available
                        nim_local_1.isNIMAvailable
                            .mockResolvedValueOnce(false) // First check - NIM unavailable
                            .mockResolvedValueOnce(true); // Second check - NIM available
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(true);
                        // Mock Ollama response
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue('Task completed with Ollama fallback');
                        // Mock NIM failure then success (for retry)
                        nim_local_1.sendNIMInferenceRequest
                            .mockRejectedValueOnce(new Error('NIM temporarily unavailable'))
                            .mockResolvedValueOnce('Task completed after NIM recovery');
                        return [4 /*yield*/, handoffSystem.handoffToLocalAgent(mockNIMAgent, 'fallback-test-123', { testData: 'context data for fallback test' }, 'source-agent-123', 'nim-agent-1')];
                    case 1:
                        result = _a.sent();
                        // Should have tried Ollama fallback first
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalled();
                        expect(result).toBe('Task completed with Ollama fallback');
                        return [2 /*return*/];
                }
            });
        }); }, 15000);
    });
    describe('Multiple Fallback Attempts', function () {
        it('should handle multiple fallback attempts with different providers', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockOllamaAgent);
                        // Mock both providers as temporarily unavailable, then available
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(true);
                        nim_local_1.isNIMAvailable.mockResolvedValue(true);
                        // Mock failures on first attempts, success on retry
                        ollama_local_1.sendOllamaChatRequest
                            .mockRejectedValueOnce(new Error('Ollama connection error'))
                            .mockRejectedValueOnce(new Error('Ollama timeout'))
                            .mockResolvedValueOnce('Task completed after multiple fallbacks');
                        nim_local_1.sendNIMInferenceRequest
                            .mockRejectedValueOnce(new Error('NIM model loading'))
                            .mockResolvedValueOnce('Task completed with NIM on second attempt');
                        return [4 /*yield*/, handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'multi-fallback-test-123', { testData: 'context data for multi-fallback test' }, 'source-agent-123', 'ollama-agent-1')];
                    case 1:
                        result = _a.sent();
                        // Should have tried multiple fallbacks
                        expect(ollama_local_1.sendOllamaChatRequest).toHaveBeenCalledTimes(3);
                        expect(nim_local_1.sendNIMInferenceRequest).toHaveBeenCalledTimes(2);
                        expect(result).toBe('Task completed after multiple fallbacks');
                        return [2 /*return*/];
                }
            });
        }); }, 20000);
        it('should gracefully handle when all fallbacks fail', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockOllamaAgent);
                        // Mock both providers as unavailable
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(false);
                        nim_local_1.isNIMAvailable.mockResolvedValue(false);
                        // Mock all attempts to fail
                        ollama_local_1.sendOllamaChatRequest.mockRejectedValue(new Error('All Ollama attempts failed'));
                        nim_local_1.sendNIMInferenceRequest.mockRejectedValue(new Error('All NIM attempts failed'));
                        return [4 /*yield*/, expect(handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'all-fail-test-123', { testData: 'context data for all fail test' }, 'source-agent-123', 'ollama-agent-1')).rejects.toThrow('Failed to handoff to local agent')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Performance During Fallback', function () {
        it('should maintain latency targets during fallback operations', function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockOllamaAgent);
                        // Mock Ollama as unavailable and NIM as available with slight delay
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(false);
                        nim_local_1.isNIMAvailable.mockResolvedValue(true);
                        // Mock NIM response with slight delay to simulate fallback overhead
                        nim_local_1.sendNIMInferenceRequest.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, 'Task completed with fallback'];
                                }
                            });
                        }); });
                        startTime = performance.now();
                        return [4 /*yield*/, handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'perf-fallback-test-123', { testData: 'context data for perf fallback test' }, 'source-agent-123', 'ollama-agent-1')];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should still complete within reasonable time despite fallback
                        expect(duration).toBeLessThan(2000); // 2 seconds target
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should log appropriate warnings when fallback occurs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var consoleWarnSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handoffSystem.registerLocalAgent(mockOllamaAgent);
                        // Mock Ollama as unavailable and NIM as available
                        ollama_local_1.isOllamaAvailable.mockResolvedValue(false);
                        nim_local_1.isNIMAvailable.mockResolvedValue(true);
                        // Mock NIM response
                        nim_local_1.sendNIMInferenceRequest.mockResolvedValue('Task completed with fallback');
                        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                        return [4 /*yield*/, handoffSystem.handoffToLocalAgent(mockOllamaAgent, 'warning-test-123', { testData: 'context data for warning test' }, 'source-agent-123', 'ollama-agent-1')];
                    case 1:
                        _a.sent();
                        // Should log warning about fallback
                        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Falling back to NIM'));
                        consoleWarnSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
});
