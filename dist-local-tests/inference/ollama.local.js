"use strict";
/**
 * Ollama Local Inference Integration for LAPA
 *
 * This module provides integration with Ollama running locally.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and multimodal models.
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
exports.isOllamaAvailable = isOllamaAvailable;
exports.startOllamaContainer = startOllamaContainer;
exports.stopOllamaContainer = stopOllamaContainer;
exports.sendOllamaInferenceRequest = sendOllamaInferenceRequest;
exports.sendOllamaChatRequest = sendOllamaChatRequest;
exports.pullOllamaModel = pullOllamaModel;
exports.listOllamaModels = listOllamaModels;
exports.initializeOllamaEnvironment = initializeOllamaEnvironment;
var ollama_1 = require("ollama");
var util_1 = require("util");
var child_process_1 = require("child_process");
var exec = (0, util_1.promisify)(child_process_1.exec);
// Ollama configuration
var OLLAMA_HOST = 'http://localhost:11434';
var OLLAMA_CONTAINER_NAME = 'ollama';
/**
 * Checks if Ollama is running
 * @returns Boolean indicating if Ollama is available
 */
function isOllamaAvailable() {
    return __awaiter(this, void 0, void 0, function () {
        var ollama, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    return [4 /*yield*/, ollama.list()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to check Ollama availability:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Starts Ollama Docker container
 * @returns Promise that resolves when container is ready
 */
function startOllamaContainer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    console.log('Starting Ollama container...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, exec("docker inspect ".concat(OLLAMA_CONTAINER_NAME))];
                case 2:
                    _a.sent();
                    // Container exists, start it
                    return [4 /*yield*/, exec("docker start ".concat(OLLAMA_CONTAINER_NAME))];
                case 3:
                    // Container exists, start it
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    // Container doesn't exist, create it
                    return [4 /*yield*/, exec("docker run -d --name ".concat(OLLAMA_CONTAINER_NAME, " -p 11434:11434 ollama/ollama:latest"))];
                case 5:
                    // Container doesn't exist, create it
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6: 
                // Wait for container to be ready
                return [4 /*yield*/, waitForOllamaReady()];
                case 7:
                    // Wait for container to be ready
                    _a.sent();
                    console.log('Ollama container started successfully');
                    return [3 /*break*/, 9];
                case 8:
                    error_3 = _a.sent();
                    console.error('Failed to start Ollama container:', error_3);
                    throw error_3;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Waits for Ollama service to be ready
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when service is ready
 */
function waitForOllamaReady() {
    return __awaiter(this, arguments, void 0, function (timeout) {
        var startTime, ollama, error_4;
        if (timeout === void 0) { timeout = 30000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    _a.label = 1;
                case 1:
                    if (!(Date.now() - startTime < timeout)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    // Simple health check - try to list models
                    return [4 /*yield*/, ollama.list()];
                case 3:
                    // Simple health check - try to list models
                    _a.sent();
                    return [2 /*return*/];
                case 4:
                    error_4 = _a.sent();
                    return [3 /*break*/, 5];
                case 5: 
                // Wait 1 second before retrying
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 6:
                    // Wait 1 second before retrying
                    _a.sent();
                    return [3 /*break*/, 1];
                case 7: throw new Error('Ollama service failed to start within timeout period');
            }
        });
    });
}
/**
 * Stops Ollama Docker container
 * @returns Promise that resolves when container is stopped
 */
function stopOllamaContainer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exec("docker stop ".concat(OLLAMA_CONTAINER_NAME))];
                case 1:
                    _a.sent();
                    console.log('Ollama container stopped');
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error('Failed to stop Ollama container:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Sends inference request to Ollama
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @returns Model response
 */
function sendOllamaInferenceRequest(model_1, prompt_1) {
    return __awaiter(this, arguments, void 0, function (model, prompt, parameters) {
        var ollama, requestBody, response, error_6;
        if (parameters === void 0) { parameters = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    requestBody = __assign({ model: model, prompt: prompt }, parameters);
                    return [4 /*yield*/, ollama.generate(requestBody)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.response];
                case 2:
                    error_6 = _a.sent();
                    console.error('Failed to send Ollama inference request:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Sends chat request to Ollama
 * @param model Model name to use for chat
 * @param messages Array of messages in the conversation
 * @param parameters Additional chat parameters
 * @returns Model response
 */
function sendOllamaChatRequest(model_1, messages_1) {
    return __awaiter(this, arguments, void 0, function (model, messages, parameters) {
        var ollama, requestBody, response, error_7;
        if (parameters === void 0) { parameters = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    requestBody = __assign({ model: model, messages: messages }, parameters);
                    return [4 /*yield*/, ollama.chat(requestBody)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.message.content];
                case 2:
                    error_7 = _a.sent();
                    console.error('Failed to send Ollama chat request:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Pulls a model from Ollama registry
 * @param model Model name to pull
 * @returns Promise that resolves when model is pulled
 */
function pullOllamaModel(model) {
    return __awaiter(this, void 0, void 0, function () {
        var ollama, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    console.log("Pulling model ".concat(model, "..."));
                    return [4 /*yield*/, ollama.pull({ model: model, stream: false })];
                case 1:
                    _a.sent();
                    console.log("Model ".concat(model, " pulled successfully"));
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Failed to pull model ".concat(model, ":"), error_8);
                    throw error_8;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Lists available models in Ollama
 * @returns Array of model names
 */
function listOllamaModels() {
    return __awaiter(this, void 0, void 0, function () {
        var ollama, response, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ollama = new ollama_1.Ollama({ host: OLLAMA_HOST });
                    return [4 /*yield*/, ollama.list()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.models.map(function (m) { return m.name; })];
                case 2:
                    error_9 = _a.sent();
                    console.error('Failed to list Ollama models:', error_9);
                    throw error_9;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Initializes Ollama environment
 * @returns Promise that resolves when initialization is complete
 */
function initializeOllamaEnvironment() {
    return __awaiter(this, void 0, void 0, function () {
        var error_10, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    // Ensure Docker is available
                    return [4 /*yield*/, exec('docker --version')];
                case 1:
                    // Ensure Docker is available
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, exec('docker image inspect ollama/ollama:latest')];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_10 = _a.sent();
                    console.log('Pulling Ollama Docker image...');
                    return [4 /*yield*/, exec('docker pull ollama/ollama:latest')];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6:
                    console.log('Ollama environment initialized');
                    return [3 /*break*/, 8];
                case 7:
                    error_11 = _a.sent();
                    console.error('Failed to initialize Ollama environment:', error_11);
                    throw error_11;
                case 8: return [2 /*return*/];
            }
        });
    });
}
