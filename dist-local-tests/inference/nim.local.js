"use strict";
/**
 * NVIDIA NIM Local Inference Integration for LAPA
 *
 * This module provides integration with NVIDIA NIM running locally via Docker.
 * It handles model loading, inference requests, and connection management.
 * Supports both traditional LLM models and Nemotron-Vision multimodal models with FP8 quantization.
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
exports.isNIMAvailable = isNIMAvailable;
exports.isNemotronVisionAvailable = isNemotronVisionAvailable;
exports.startNIMContainer = startNIMContainer;
exports.startNemotronVisionContainer = startNemotronVisionContainer;
exports.stopNIMContainer = stopNIMContainer;
exports.stopNemotronVisionContainer = stopNemotronVisionContainer;
exports.sendNIMInferenceRequest = sendNIMInferenceRequest;
exports.sendNemotronVisionInferenceRequest = sendNemotronVisionInferenceRequest;
exports.initializeNIMEnvironment = initializeNIMEnvironment;
var util_1 = require("util");
var child_process_1 = require("child_process");
var exec = (0, util_1.promisify)(child_process_1.exec);
// NIM Docker configuration
var NIM_DOCKER_IMAGE = 'nvcr.io/nim:latest';
var NIM_CONTAINER_NAME = 'lapa-nim';
var NIM_PORT = 8000;
// Nemotron-Vision specific configuration
var NEMOTRON_VISION_DOCKER_IMAGE = 'nvcr.io/nim/nemotron-vision:latest';
var NEMOTRON_VISION_CONTAINER_NAME = 'lapa-nim-nemotron-vision';
var NEMOTRON_VISION_PORT = 8001;
/**
 * Checks if NVIDIA NIM Docker container is running
 * @param containerName Name of the container to check (defaults to standard NIM container)
 * @returns Boolean indicating if NIM is available
 */
function isNIMAvailable() {
    return __awaiter(this, arguments, void 0, function (containerName) {
        var stdout, error_1;
        if (containerName === void 0) { containerName = NIM_CONTAINER_NAME; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exec("docker ps --filter \"name=".concat(containerName, "\" --format \"{{.Names}}\""))];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, stdout.trim() === containerName];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to check NIM availability:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Checks if Nemotron-Vision NIM Docker container is running
 * @returns Boolean indicating if Nemotron-Vision NIM is available
 */
function isNemotronVisionAvailable() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, isNIMAvailable(NEMOTRON_VISION_CONTAINER_NAME)];
        });
    });
}
/**
 * Starts NVIDIA NIM Docker container
 * @param modelName Optional model name to use (for Nemotron-Vision support)
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
function startNIMContainer(modelName_1) {
    return __awaiter(this, arguments, void 0, function (modelName, useFP8) {
        var isNemotronVision, error_2, error_3;
        if (useFP8 === void 0) { useFP8 = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isNemotronVision = (modelName === null || modelName === void 0 ? void 0 : modelName.toLowerCase().includes('nemotron-vision')) || (modelName === null || modelName === void 0 ? void 0 : modelName.toLowerCase().includes('nemotron'));
                    if (isNemotronVision) {
                        return [2 /*return*/, startNemotronVisionContainer(useFP8)];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    console.log('Starting NVIDIA NIM container...');
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 7]);
                    return [4 /*yield*/, exec("docker inspect ".concat(NIM_CONTAINER_NAME))];
                case 3:
                    _a.sent();
                    // Container exists, start it
                    return [4 /*yield*/, exec("docker start ".concat(NIM_CONTAINER_NAME))];
                case 4:
                    // Container exists, start it
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_2 = _a.sent();
                    // Container doesn't exist, create it
                    return [4 /*yield*/, exec("docker run -d --name ".concat(NIM_CONTAINER_NAME, " -p ").concat(NIM_PORT, ":").concat(NIM_PORT, " ").concat(NIM_DOCKER_IMAGE))];
                case 6:
                    // Container doesn't exist, create it
                    _a.sent();
                    return [3 /*break*/, 7];
                case 7: 
                // Wait for container to be ready
                return [4 /*yield*/, waitForNIMReady()];
                case 8:
                    // Wait for container to be ready
                    _a.sent();
                    console.log('NVIDIA NIM container started successfully');
                    return [3 /*break*/, 10];
                case 9:
                    error_3 = _a.sent();
                    console.error('Failed to start NIM container:', error_3);
                    throw error_3;
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Starts Nemotron-Vision NIM Docker container with FP8 quantization support
 * @param useFP8 Whether to enable FP8 quantization (default: false)
 * @returns Promise that resolves when container is ready
 */
function startNemotronVisionContainer() {
    return __awaiter(this, arguments, void 0, function (useFP8) {
        var envVars, error_4, error_5;
        if (useFP8 === void 0) { useFP8 = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    console.log('Starting Nemotron-Vision NIM container...');
                    envVars = useFP8 ? '-e NIM_MODEL_PROFILE=fp8' : '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, exec("docker inspect ".concat(NEMOTRON_VISION_CONTAINER_NAME))];
                case 2:
                    _a.sent();
                    // Container exists, start it
                    return [4 /*yield*/, exec("docker start ".concat(NEMOTRON_VISION_CONTAINER_NAME))];
                case 3:
                    // Container exists, start it
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_4 = _a.sent();
                    // Container doesn't exist, create it with FP8 support
                    return [4 /*yield*/, exec("docker run -d --name ".concat(NEMOTRON_VISION_CONTAINER_NAME, " -p ").concat(NEMOTRON_VISION_PORT, ":").concat(NEMOTRON_VISION_PORT, " ").concat(envVars, " ").concat(NEMOTRON_VISION_DOCKER_IMAGE))];
                case 5:
                    // Container doesn't exist, create it with FP8 support
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6: 
                // Wait for container to be ready
                return [4 /*yield*/, waitForNIMReady(NEMOTRON_VISION_PORT)];
                case 7:
                    // Wait for container to be ready
                    _a.sent();
                    console.log('Nemotron-Vision NIM container started successfully');
                    return [3 /*break*/, 9];
                case 8:
                    error_5 = _a.sent();
                    console.error('Failed to start Nemotron-Vision NIM container:', error_5);
                    throw error_5;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Waits for NVIDIA NIM service to be ready
 * @param port Port to check for readiness (defaults to standard NIM port)
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when service is ready
 */
function waitForNIMReady() {
    return __awaiter(this, arguments, void 0, function (port, timeout) {
        var startTime, response, error_6;
        if (port === void 0) { port = NIM_PORT; }
        if (timeout === void 0) { timeout = 30000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    if (!(Date.now() - startTime < timeout)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("http://localhost:".concat(port, "/health"))];
                case 3:
                    response = _a.sent();
                    if (response.ok) {
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_6 = _a.sent();
                    return [3 /*break*/, 5];
                case 5: 
                // Wait 1 second before retrying
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 6:
                    // Wait 1 second before retrying
                    _a.sent();
                    return [3 /*break*/, 1];
                case 7: throw new Error('NIM service failed to start within timeout period');
            }
        });
    });
}
/**
 * Stops NVIDIA NIM Docker container
 * @param containerName Name of the container to stop (defaults to standard NIM container)
 * @returns Promise that resolves when container is stopped
 */
function stopNIMContainer() {
    return __awaiter(this, arguments, void 0, function (containerName) {
        var error_7;
        if (containerName === void 0) { containerName = NIM_CONTAINER_NAME; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exec("docker stop ".concat(containerName))];
                case 1:
                    _a.sent();
                    console.log("NVIDIA NIM container (".concat(containerName, ") stopped"));
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    console.error('Failed to stop NIM container:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Stops Nemotron-Vision NIM Docker container
 * @returns Promise that resolves when container is stopped
 */
function stopNemotronVisionContainer() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, stopNIMContainer(NEMOTRON_VISION_CONTAINER_NAME)];
        });
    });
}
/**
 * Sends inference request to NVIDIA NIM
 * @param model Model name to use for inference
 * @param prompt Input prompt for the model
 * @param parameters Additional inference parameters
 * @param useNemotronVision Whether to use Nemotron-Vision container (default: false)
 * @returns Model response
 */
function sendNIMInferenceRequest(model_1, prompt_1) {
    return __awaiter(this, arguments, void 0, function (model, prompt, parameters, useNemotronVision) {
        var isNemotronVision, port, requestBody, response, data, error_8;
        if (parameters === void 0) { parameters = {}; }
        if (useNemotronVision === void 0) { useNemotronVision = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isNemotronVision = useNemotronVision || model.toLowerCase().includes('nemotron-vision') || model.toLowerCase().includes('nemotron');
                    port = isNemotronVision ? NEMOTRON_VISION_PORT : NIM_PORT;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    requestBody = __assign({ model: model, prompt: prompt }, parameters);
                    return [4 /*yield*/, fetch("http://localhost:".concat(port, "/v1/completions"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestBody)
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("NIM inference request failed: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    return [2 /*return*/, data.choices[0].text];
                case 4:
                    error_8 = _a.sent();
                    console.error('Failed to send NIM inference request:', error_8);
                    throw error_8;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Sends multimodal inference request to Nemotron-Vision NIM
 * @param model Model name to use for inference (defaults to nemotron-vision)
 * @param prompt Text prompt for the model
 * @param imageBase64 Base64 encoded image data
 * @param parameters Additional inference parameters
 * @returns Model response
 */
function sendNemotronVisionInferenceRequest() {
    return __awaiter(this, arguments, void 0, function (model, prompt, imageBase64, parameters) {
        var requestBody, response, data, error_9;
        if (model === void 0) { model = 'nemotron-vision'; }
        if (parameters === void 0) { parameters = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    requestBody = __assign({ model: model, prompt: prompt }, parameters);
                    // Add image data if provided
                    if (imageBase64) {
                        requestBody.image = imageBase64;
                    }
                    return [4 /*yield*/, fetch("http://localhost:".concat(NEMOTRON_VISION_PORT, "/v1/completions"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestBody)
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Nemotron-Vision inference request failed: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.choices[0].text];
                case 3:
                    error_9 = _a.sent();
                    console.error('Failed to send Nemotron-Vision inference request:', error_9);
                    throw error_9;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Initializes NVIDIA NIM environment
 * @param includeNemotronVision Whether to also initialize Nemotron-Vision environment (default: false)
 * @returns Promise that resolves when initialization is complete
 */
function initializeNIMEnvironment() {
    return __awaiter(this, arguments, void 0, function (includeNemotronVision) {
        var error_10, error_11, error_12;
        if (includeNemotronVision === void 0) { includeNemotronVision = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, , 13]);
                    // Ensure Docker is available
                    return [4 /*yield*/, exec('docker --version')];
                case 1:
                    // Ensure Docker is available
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, exec("docker image inspect ".concat(NIM_DOCKER_IMAGE))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_10 = _a.sent();
                    console.log('Pulling NVIDIA NIM Docker image...');
                    return [4 /*yield*/, exec("docker pull ".concat(NIM_DOCKER_IMAGE))];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6:
                    if (!includeNemotronVision) return [3 /*break*/, 11];
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 11]);
                    return [4 /*yield*/, exec("docker image inspect ".concat(NEMOTRON_VISION_DOCKER_IMAGE))];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 9:
                    error_11 = _a.sent();
                    console.log('Pulling Nemotron-Vision NIM Docker image...');
                    return [4 /*yield*/, exec("docker pull ".concat(NEMOTRON_VISION_DOCKER_IMAGE))];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 11:
                    console.log('NIM environment initialized');
                    return [3 /*break*/, 13];
                case 12:
                    error_12 = _a.sent();
                    console.error('Failed to initialize NIM environment:', error_12);
                    throw error_12;
                case 13: return [2 /*return*/];
            }
        });
    });
}
