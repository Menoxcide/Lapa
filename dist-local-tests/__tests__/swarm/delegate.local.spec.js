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
var delegate_1 = require("../../swarm/delegate");
// Mock the local inference functions
jest.mock('../../inference/ollama.local', function () {
    return {
        sendOllamaChatRequest: jest.fn(),
        sendOllamaInferenceRequest: jest.fn(),
        isOllamaAvailable: jest.fn()
    };
});
jest.mock('../../inference/nim.local', function () {
    return {
        sendNIMInferenceRequest: jest.fn(),
        isNIMAvailable: jest.fn()
    };
});
// Import the mocked functions
var ollama_local_1 = require("../../inference/ollama.local");
describe('Swarm Delegate Local Integration', function () {
    var swarmDelegate;
    var mockLocalAgent;
    var mockRemoteAgent;
    beforeEach(function () {
        swarmDelegate = new delegate_1.SwarmDelegate();
        mockLocalAgent = {
            id: 'local-agent-1',
            name: 'Test Local Agent',
            capabilities: ['text-generation', 'qa'],
            workload: 0,
            isLocal: true,
            type: 'local',
            capacity: 10
        };
        mockRemoteAgent = {
            id: 'remote-agent-1',
            name: 'Test Remote Agent',
            capabilities: ['image-processing', 'data-analysis'],
            workload: 0,
            isLocal: false,
            type: 'remote',
            capacity: 5
        };
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    describe('Local Delegation', function () {
        it('should delegate to local agent when available and within latency target', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResult, task, context, startTime, result, endTime, duration;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
                        mockResult = { response: 'Task completed by local agent' };
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue(mockResult);
                        task = {
                            id: 'test-task-123',
                            description: 'Test task for local delegation',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Test input data' }
                        };
                        context = { testData: 'simple context data for local delegation' };
                        startTime = performance.now();
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _c.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        expect(result.delegatedToAgentId).toBeDefined();
                        expect(result.result).toBeDefined();
                        expect(result.metrics).toBeDefined();
                        expect((_a = result.metrics) === null || _a === void 0 ? void 0 : _a.duration).toBeCloseTo(duration, 1);
                        expect((_b = result.metrics) === null || _b === void 0 ? void 0 : _b.latencyWithinTarget).toBe(true);
                        // Should complete well within the 2s target
                        expect(duration).toBeLessThan(2000);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should fall back to consensus delegation when local delegation fails', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
                        swarmDelegate.registerAgent(mockRemoteAgent);
                        // Mock local inference failure
                        ollama_local_1.sendOllamaChatRequest.mockRejectedValue(new Error('Local inference unavailable'));
                        task = {
                            id: 'test-task-456',
                            description: 'Test task for fallback delegation',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Test input data' }
                        };
                        context = { testData: 'context data for fallback delegation' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should still succeed through fallback mechanism
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        expect(result.delegatedToAgentId).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Consensus Delegation', function () {
        it('should delegate via consensus when no local agents available', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockRemoteAgent);
                        task = {
                            id: 'test-task-789',
                            description: 'Test task for consensus delegation',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Test input data' }
                        };
                        context = { testData: 'context data for consensus delegation' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should succeed with consensus delegation
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        expect(result.delegatedToAgentId).toBe(mockRemoteAgent.id);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should delegate to most capable agent based on task description', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qaAgent, imageAgent, task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qaAgent = {
                            id: 'qa-agent-1',
                            name: 'QA Specialist Agent',
                            capabilities: ['question-answering', 'text-comprehension'],
                            workload: 0,
                            isLocal: true,
                            type: 'local',
                            capacity: 8
                        };
                        imageAgent = {
                            id: 'image-agent-1',
                            name: 'Image Processing Agent',
                            capabilities: ['image-recognition', 'computer-vision'],
                            workload: 0,
                            isLocal: false,
                            type: 'remote',
                            capacity: 6
                        };
                        swarmDelegate.registerAgent(qaAgent);
                        swarmDelegate.registerAgent(imageAgent);
                        task = {
                            id: 'test-task-999',
                            description: 'Answer questions about a document',
                            type: 'qa',
                            priority: 2,
                            context: { input: 'Document content with questions' }
                        };
                        context = { document: 'Sample document content' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should delegate to QA agent based on task description
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        // QA agent should be selected due to "question" in task description
                        expect(result.delegatedToAgentId).toBe(qaAgent.id);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Performance Validation', function () {
        it('should maintain <2s latency target for swarm delegation', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, startTime, result, endTime, duration;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
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
                                        return [2 /*return*/, { response: 'Task completed under latency target' }];
                                }
                            });
                        }); });
                        task = {
                            id: 'latency-test-task',
                            description: 'Latency validation task',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Input data for latency test' }
                        };
                        context = { testData: 'latency test context data' };
                        startTime = performance.now();
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _b.sent();
                        endTime = performance.now();
                        duration = endTime - startTime;
                        // Should stay under 2s even with inference latency
                        expect(result.success).toBe(true);
                        expect(duration).toBeLessThan(2000);
                        expect((_a = result.metrics) === null || _a === void 0 ? void 0 : _a.latencyWithinTarget).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should track delegation duration accurately', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
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
                                        return [2 /*return*/, { response: 'Timed task completed' }];
                                }
                            });
                        }); });
                        task = {
                            id: 'timing-test-task',
                            description: 'Timing validation task',
                            type: 'test',
                            priority: 0,
                            context: { input: 'Input data for timing test' }
                        };
                        context = { testData: 'timing test context data' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _c.sent();
                        // Should have accurate timing metrics
                        expect(result.success).toBe(true);
                        expect(result.metrics).toBeDefined();
                        expect((_a = result.metrics) === null || _a === void 0 ? void 0 : _a.duration).toBeGreaterThan(150); // At least the delay time
                        expect((_b = result.metrics) === null || _b === void 0 ? void 0 : _b.latencyWithinTarget).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Configuration Management', function () {
        it('should allow configuration updates', function () {
            var initialConfig = swarmDelegate.getConfig();
            expect(initialConfig.enableLocalInference).toBe(true);
            expect(initialConfig.latencyTargetMs).toBe(2000);
            // Update configuration
            swarmDelegate.updateConfig({
                enableLocalInference: false,
                latencyTargetMs: 1500
            });
            var updatedConfig = swarmDelegate.getConfig();
            expect(updatedConfig.enableLocalInference).toBe(false);
            expect(updatedConfig.latencyTargetMs).toBe(1500);
        });
        it('should disable local inference when configured', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Disable local inference
                        swarmDelegate.updateConfig({ enableLocalInference: false });
                        swarmDelegate.registerAgent(mockLocalAgent);
                        swarmDelegate.registerAgent(mockRemoteAgent);
                        task = {
                            id: 'config-test-task',
                            description: 'Configuration test task',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Input data for config test' }
                        };
                        context = { testData: 'config test context data' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should delegate via consensus even with local agents available
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        // Should delegate to one of the registered agents via consensus
                        expect([mockLocalAgent.id, mockRemoteAgent.id]).toContain(result.delegatedToAgentId);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Edge Cases', function () {
        it('should handle delegation with no registered agents', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        task = {
                            id: 'no-agents-task',
                            description: 'Task with no agents registered',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Input data' }
                        };
                        context = { testData: 'no agents context data' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should fail gracefully
                        expect(result.success).toBe(false);
                        expect(result.taskId).toBe(task.id);
                        expect(result.error).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
        it('should handle delegation with malformed task data', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
                        // Mock successful response
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue({ response: 'Task completed' });
                        task = {
                            id: 'minimal-task',
                            type: 'test',
                            priority: 1
                            // Missing description, context
                        };
                        context = { minimal: 'context data' };
                        return [4 /*yield*/, swarmDelegate.delegateTask(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should handle gracefully
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
    describe('Convenience Function', function () {
        it('should delegate tasks using convenience function', function () { return __awaiter(void 0, void 0, void 0, function () {
            var task, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        swarmDelegate.registerAgent(mockLocalAgent);
                        // Mock successful response
                        ollama_local_1.sendOllamaChatRequest.mockResolvedValue({ response: 'Task completed via convenience function' });
                        task = {
                            id: 'convenience-task',
                            description: 'Task for convenience function test',
                            type: 'test',
                            priority: 1,
                            context: { input: 'Input data' }
                        };
                        context = { testData: 'convenience function context data' };
                        return [4 /*yield*/, (0, delegate_1.delegateTask)(task, context)];
                    case 1:
                        result = _a.sent();
                        // Should work the same as instance method
                        expect(result.success).toBe(true);
                        expect(result.taskId).toBe(task.id);
                        expect(result.result).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); }, 10000);
    });
});
