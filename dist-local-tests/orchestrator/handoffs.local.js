"use strict";
/**
 * Local Handoffs System for LAPA Swarm Intelligence
 *
 * This module implements the local handoff system combining LangGraph workflow orchestration
 * with local inference using Ollama as primary with NVIDIA NIM as fallback for task delegation between agents.
 * Implements zero-key handoff functionality for offline operation with <2s latency target.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.localHandoffSystem = exports.LocalHandoffSystem = exports.HANDOFF_CONFIG_PRESETS = exports.HandoffConfigValidationError = void 0;
exports.createOpenAI = createOpenAI;
exports.createOllama = createOllama;
exports.localHandoff = localHandoff;
var langgraph_orchestrator_1 = require("../swarm/langgraph.orchestrator");
var context_handoff_1 = require("../swarm/context.handoff");
var moe_router_1 = require("../agents/moe-router");
var perf_hooks_1 = require("perf_hooks");
var ollama_local_1 = require("../inference/ollama.local");
var nim_local_1 = require("../inference/nim.local");
// import { Gateway, GatewayConfig } from '@ai-sdk/gateway';
// New AI SDK imports for local clients
var openai_1 = require("@ai-sdk/openai");
var ollama_ai_provider_1 = require("ollama-ai-provider");
// Default retry configuration
var DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelayMs: 1000,
    exponentialBackoff: true
};
// Configuration validation error
var HandoffConfigValidationError = /** @class */ (function (_super) {
    __extends(HandoffConfigValidationError, _super);
    function HandoffConfigValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'HandoffConfigValidationError';
        return _this;
    }
    return HandoffConfigValidationError;
}(Error));
exports.HandoffConfigValidationError = HandoffConfigValidationError;
// Environment variable mapping
var ENV_VAR_MAPPING = {
    'HANDOFF_ENABLE_LOCAL_EVALUATION': 'enableLocalEvaluation',
    'HANDOFF_ENABLE_LAPA_MOE_ROUTER': 'enableLAPAMoERouter',
    'HANDOFF_ENABLE_CONTEXT_COMPRESSION': 'enableContextCompression',
    'HANDOFF_CONFIDENCE_THRESHOLD': 'confidenceThreshold',
    'HANDOFF_MINIMUM_CONFIDENCE_FOR_HANDOFF': 'minimumConfidenceForHandoff',
    'HANDOFF_MAX_HANDOFF_DEPTH': 'maxHandoffDepth',
    'HANDOFF_MAX_CONCURRENT_HANDOFFS': 'maxConcurrentHandoffs',
    'HANDOFF_LATENCY_TARGET_MS': 'latencyTargetMs',
    'HANDOFF_MAX_LATENCY_THRESHOLD_MS': 'maxLatencyThresholdMs',
    'HANDOFF_THROUGHPUT_TARGET_OPS_PER_SEC': 'throughputTargetOpsPerSec',
    'HANDOFF_MAX_RETRY_ATTEMPTS': 'maxRetryAttempts',
    'HANDOFF_RETRY_DELAY_MS': 'retryDelayMs',
    'HANDOFF_EXPONENTIAL_BACKOFF': 'exponentialBackoff',
    'HANDOFF_CIRCUIT_BREAKER_ENABLED': 'circuitBreakerEnabled',
    'HANDOFF_CIRCUIT_BREAKER_FAILURE_THRESHOLD': 'circuitBreakerFailureThreshold',
    'HANDOFF_CIRCUIT_BREAKER_TIMEOUT_MS': 'circuitBreakerTimeoutMs',
    'HANDOFF_LOAD_BALANCING_STRATEGY': 'loadBalancingStrategy',
    'HANDOFF_AGENT_SELECTION_ALGORITHM': 'agentSelectionAlgorithm',
    'HANDOFF_ENABLE_FALLBACK_MECHANISMS': 'enableFallbackMechanisms',
    'HANDOFF_FALLBACK_TO_MOE_ROUTER_ON_LOCAL_ERROR': 'fallbackToMoERouterOnLocalError',
    'HANDOFF_FALLBACK_TO_LAPA_AGENTS_ON_MOE_ROUTER_ERROR': 'fallbackToLAPAAgentsOnMoERouterError',
    'HANDOFF_ENABLE_DETAILED_LOGGING': 'enableDetailedLogging',
    'HANDOFF_LOG_LEVEL': 'logLevel',
    'HANDOFF_ENABLE_METRICS_COLLECTION': 'enableMetricsCollection',
    'HANDOFF_METRICS_COLLECTION_INTERVAL_MS': 'metricsCollectionIntervalMs',
    'HANDOFF_ENABLE_SECURITY_VALIDATION': 'enableSecurityValidation',
    'HANDOFF_SANITIZE_CONTEXT_DATA': 'sanitizeContextData',
    'HANDOFF_MAX_CONTEXT_SIZE_BYTES': 'maxContextSizeBytes',
    'HANDOFF_MAX_MEMORY_USAGE_PERCENTAGE': 'maxMemoryUsagePercentage',
    'HANDOFF_ENABLE_RESOURCE_THROTTLING': 'enableResourceThrottling',
    'HANDOFF_RESOURCE_THROTTLING_THRESHOLD_PERCENTAGE': 'resourceThrottlingThresholdPercentage'
};
// Loads configuration from environment variables
function loadConfigFromEnvironment() {
    var config = {};
    for (var _i = 0, _a = Object.entries(ENV_VAR_MAPPING); _i < _a.length; _i++) {
        var _b = _a[_i], envVar = _b[0], configKey = _b[1];
        var value = process.env[envVar];
        if (value !== undefined) {
            // Convert string values to appropriate types
            switch (configKey) {
                case 'enableLocalEvaluation':
                case 'enableLAPAMoERouter':
                case 'enableContextCompression':
                case 'exponentialBackoff':
                case 'circuitBreakerEnabled':
                case 'enableFallbackMechanisms':
                case 'fallbackToMoERouterOnLocalError':
                case 'fallbackToLAPAAgentsOnMoERouterError':
                case 'enableDetailedLogging':
                case 'enableMetricsCollection':
                case 'enableSecurityValidation':
                case 'sanitizeContextData':
                case 'enableResourceThrottling':
                    config[configKey] = value.toLowerCase() === 'true';
                    break;
                case 'confidenceThreshold':
                case 'minimumConfidenceForHandoff':
                case 'maxMemoryUsagePercentage':
                case 'resourceThrottlingThresholdPercentage':
                    var floatVal = parseFloat(value);
                    if (!isNaN(floatVal)) {
                        config[configKey] = floatVal;
                    }
                    break;
                case 'maxHandoffDepth':
                case 'maxConcurrentHandoffs':
                case 'latencyTargetMs':
                case 'maxLatencyThresholdMs':
                case 'throughputTargetOpsPerSec':
                case 'maxRetryAttempts':
                case 'retryDelayMs':
                case 'circuitBreakerFailureThreshold':
                case 'circuitBreakerTimeoutMs':
                case 'metricsCollectionIntervalMs':
                case 'maxContextSizeBytes':
                    var intVal = parseInt(value, 10);
                    if (!isNaN(intVal)) {
                        config[configKey] = intVal;
                    }
                    break;
                default:
                    // For string enums, use the value directly
                    config[configKey] = value;
            }
        }
    }
    return config;
}
// Threshold management for handoff decisions
var HandoffThresholdManager = /** @class */ (function () {
    function HandoffThresholdManager(config) {
        this.config = config;
    }
    /**
     * Determines if a handoff should occur based on confidence and thresholds
     * @param confidence Confidence score from evaluation (0-1)
     * @param currentDepth Current handoff depth
     * @returns Boolean indicating if handoff should occur
     */
    HandoffThresholdManager.prototype.shouldHandoff = function (confidence, currentDepth) {
        // Check if confidence meets minimum threshold
        if (confidence < this.config.minimumConfidenceForHandoff) {
            return false;
        }
        // Check if confidence meets target threshold
        if (confidence < this.config.confidenceThreshold) {
            return false;
        }
        // Check if max handoff depth has been reached
        if (currentDepth >= this.config.maxHandoffDepth) {
            return false;
        }
        return true;
    };
    /**
     * Checks if a latency value exceeds configured thresholds
     * @param latency Latency in milliseconds
     * @returns Object with threshold violation information
     */
    HandoffThresholdManager.prototype.checkLatencyThresholds = function (latency) {
        return {
            exceededTarget: latency > this.config.latencyTargetMs,
            exceededMax: latency > this.config.maxLatencyThresholdMs
        };
    };
    /**
     * Updates the configuration
     * @param newConfig New configuration
     */
    HandoffThresholdManager.prototype.updateConfig = function (newConfig) {
        this.config = __assign(__assign({}, this.config), newConfig);
    };
    return HandoffThresholdManager;
}());
// Validates HandoffConfig
function validateHandoffConfig(config) {
    var errors = [];
    // Validate confidence thresholds
    if (config.confidenceThreshold !== undefined && (config.confidenceThreshold < 0 || config.confidenceThreshold > 1)) {
        errors.push('confidenceThreshold must be between 0 and 1');
    }
    if (config.minimumConfidenceForHandoff !== undefined && (config.minimumConfidenceForHandoff < 0 || config.minimumConfidenceForHandoff > 1)) {
        errors.push('minimumConfidenceForHandoff must be between 0 and 1');
    }
    // Validate that minimum confidence is not greater than confidence threshold
    if (config.confidenceThreshold !== undefined && config.minimumConfidenceForHandoff !== undefined &&
        config.confidenceThreshold < config.minimumConfidenceForHandoff) {
        errors.push('confidenceThreshold must be greater than or equal to minimumConfidenceForHandoff');
    }
    // Validate numeric thresholds
    if (config.maxHandoffDepth !== undefined && config.maxHandoffDepth < 0) {
        errors.push('maxHandoffDepth must be non-negative');
    }
    if (config.maxConcurrentHandoffs !== undefined && config.maxConcurrentHandoffs < 1) {
        errors.push('maxConcurrentHandoffs must be at least 1');
    }
    if (config.latencyTargetMs !== undefined && config.latencyTargetMs < 0) {
        errors.push('latencyTargetMs must be non-negative');
    }
    if (config.maxLatencyThresholdMs !== undefined && config.maxLatencyThresholdMs < 0) {
        errors.push('maxLatencyThresholdMs must be non-negative');
    }
    // Validate that max latency is not less than target latency
    if (config.latencyTargetMs !== undefined && config.maxLatencyThresholdMs !== undefined &&
        config.maxLatencyThresholdMs < config.latencyTargetMs) {
        errors.push('maxLatencyThresholdMs must be greater than or equal to latencyTargetMs');
    }
    if (config.throughputTargetOpsPerSec !== undefined && config.throughputTargetOpsPerSec < 0) {
        errors.push('throughputTargetOpsPerSec must be non-negative');
    }
    if (config.maxRetryAttempts !== undefined && config.maxRetryAttempts < 0) {
        errors.push('maxRetryAttempts must be non-negative');
    }
    if (config.retryDelayMs !== undefined && config.retryDelayMs < 0) {
        errors.push('retryDelayMs must be non-negative');
    }
    if (config.circuitBreakerFailureThreshold !== undefined && config.circuitBreakerFailureThreshold < 0) {
        errors.push('circuitBreakerFailureThreshold must be non-negative');
    }
    if (config.circuitBreakerTimeoutMs !== undefined && config.circuitBreakerTimeoutMs < 0) {
        errors.push('circuitBreakerTimeoutMs must be non-negative');
    }
    if (config.metricsCollectionIntervalMs !== undefined && config.metricsCollectionIntervalMs < 0) {
        errors.push('metricsCollectionIntervalMs must be non-negative');
    }
    if (config.maxContextSizeBytes !== undefined && config.maxContextSizeBytes < 0) {
        errors.push('maxContextSizeBytes must be non-negative');
    }
    if (config.maxMemoryUsagePercentage !== undefined && (config.maxMemoryUsagePercentage < 0 || config.maxMemoryUsagePercentage > 100)) {
        errors.push('maxMemoryUsagePercentage must be between 0 and 100');
    }
    if (config.resourceThrottlingThresholdPercentage !== undefined && (config.resourceThrottlingThresholdPercentage < 0 || config.resourceThrottlingThresholdPercentage > 100)) {
        errors.push('resourceThrottlingThresholdPercentage must be between 0 and 100');
    }
    // Validate enum values
    if (config.loadBalancingStrategy !== undefined &&
        !['round-robin', 'least-connections', 'weighted'].includes(config.loadBalancingStrategy)) {
        errors.push('loadBalancingStrategy must be one of: round-robin, least-connections, weighted');
    }
    if (config.agentSelectionAlgorithm !== undefined &&
        !['confidence-based', 'workload-based', 'hybrid'].includes(config.agentSelectionAlgorithm)) {
        errors.push('agentSelectionAlgorithm must be one of: confidence-based, workload-based, hybrid');
    }
    if (config.logLevel !== undefined &&
        !['none', 'error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
        errors.push('logLevel must be one of: none, error, warn, info, debug');
    }
    // Throw aggregated error if any validation failed
    if (errors.length > 0) {
        throw new HandoffConfigValidationError("Configuration validation failed:\n".concat(errors.map(function (e) { return "- ".concat(e); }).join('\n')));
    }
}
// Configuration presets for different use cases
exports.HANDOFF_CONFIG_PRESETS = {
    development: {
        // Core functionality flags
        enableLocalEvaluation: true,
        enableLAPAMoERouter: true,
        enableContextCompression: true,
        // Decision thresholds
        confidenceThreshold: 0.7,
        minimumConfidenceForHandoff: 0.3,
        maxHandoffDepth: 5,
        maxConcurrentHandoffs: 20,
        // Performance targets
        latencyTargetMs: 3000,
        maxLatencyThresholdMs: 10000,
        throughputTargetOpsPerSec: 5,
        // Retry and error handling
        maxRetryAttempts: 5,
        retryDelayMs: 2000,
        exponentialBackoff: true,
        circuitBreakerEnabled: true,
        circuitBreakerFailureThreshold: 10,
        circuitBreakerTimeoutMs: 120000,
        // Agent selection
        loadBalancingStrategy: 'least-connections',
        agentSelectionAlgorithm: 'hybrid',
        // Fallback mechanisms
        enableFallbackMechanisms: true,
        fallbackToMoERouterOnLocalError: true,
        fallbackToLAPAAgentsOnMoERouterError: true,
        // Logging and monitoring
        enableDetailedLogging: true,
        logLevel: 'debug',
        enableMetricsCollection: true,
        metricsCollectionIntervalMs: 10000,
        // Security and compliance
        enableSecurityValidation: true,
        sanitizeContextData: true,
        maxContextSizeBytes: 2097152, // 2MB
        // Resource management
        maxMemoryUsagePercentage: 90,
        enableResourceThrottling: true,
        resourceThrottlingThresholdPercentage: 80
    },
    production: {
        // Core functionality flags
        enableLocalEvaluation: true,
        enableLAPAMoERouter: true,
        enableContextCompression: true,
        // Decision thresholds
        confidenceThreshold: 0.85,
        minimumConfidenceForHandoff: 0.6,
        maxHandoffDepth: 3,
        maxConcurrentHandoffs: 50,
        // Performance targets
        latencyTargetMs: 1500,
        maxLatencyThresholdMs: 4000,
        throughputTargetOpsPerSec: 20,
        // Retry and error handling
        maxRetryAttempts: 3,
        retryDelayMs: 1000,
        exponentialBackoff: true,
        circuitBreakerEnabled: true,
        circuitBreakerFailureThreshold: 5,
        circuitBreakerTimeoutMs: 60000,
        // Agent selection
        loadBalancingStrategy: 'least-connections',
        agentSelectionAlgorithm: 'hybrid',
        // Fallback mechanisms
        enableFallbackMechanisms: true,
        fallbackToMoERouterOnLocalError: true,
        fallbackToLAPAAgentsOnMoERouterError: true,
        // Logging and monitoring
        enableDetailedLogging: true,
        logLevel: 'info',
        enableMetricsCollection: true,
        metricsCollectionIntervalMs: 30000,
        // Security and compliance
        enableSecurityValidation: true,
        sanitizeContextData: true,
        maxContextSizeBytes: 1048576, // 1MB
        // Resource management
        maxMemoryUsagePercentage: 80,
        enableResourceThrottling: true,
        resourceThrottlingThresholdPercentage: 70
    },
    highPerformance: {
        // Core functionality flags
        enableLocalEvaluation: true,
        enableLAPAMoERouter: true,
        enableContextCompression: true,
        // Decision thresholds
        confidenceThreshold: 0.9,
        minimumConfidenceForHandoff: 0.7,
        maxHandoffDepth: 2,
        maxConcurrentHandoffs: 100,
        // Performance targets
        latencyTargetMs: 1000,
        maxLatencyThresholdMs: 3000,
        throughputTargetOpsPerSec: 50,
        // Retry and error handling
        maxRetryAttempts: 2,
        retryDelayMs: 500,
        exponentialBackoff: true,
        circuitBreakerEnabled: true,
        circuitBreakerFailureThreshold: 3,
        circuitBreakerTimeoutMs: 30000,
        // Agent selection
        loadBalancingStrategy: 'least-connections',
        agentSelectionAlgorithm: 'confidence-based',
        // Fallback mechanisms
        enableFallbackMechanisms: true,
        fallbackToMoERouterOnLocalError: true,
        fallbackToLAPAAgentsOnMoERouterError: true,
        // Logging and monitoring
        enableDetailedLogging: false,
        logLevel: 'warn',
        enableMetricsCollection: true,
        metricsCollectionIntervalMs: 60000,
        // Security and compliance
        enableSecurityValidation: true,
        sanitizeContextData: true,
        maxContextSizeBytes: 524288, // 512KB
        // Resource management
        maxMemoryUsagePercentage: 70,
        enableResourceThrottling: true,
        resourceThrottlingThresholdPercentage: 60
    }
};
// Default configuration
var DEFAULT_CONFIG = {
    // Core functionality flags
    enableLocalEvaluation: true,
    enableLAPAMoERouter: true,
    enableContextCompression: true,
    // Decision thresholds
    confidenceThreshold: 0.8,
    minimumConfidenceForHandoff: 0.5,
    maxHandoffDepth: 3,
    maxConcurrentHandoffs: 10,
    // Performance targets
    latencyTargetMs: 2000,
    maxLatencyThresholdMs: 5000,
    throughputTargetOpsPerSec: 10,
    // Retry and error handling
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    exponentialBackoff: true,
    circuitBreakerEnabled: true,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerTimeoutMs: 60000,
    // Agent selection
    loadBalancingStrategy: 'least-connections',
    agentSelectionAlgorithm: 'hybrid',
    // Fallback mechanisms
    enableFallbackMechanisms: true,
    fallbackToMoERouterOnLocalError: true,
    fallbackToLAPAAgentsOnMoERouterError: true,
    // Logging and monitoring
    enableDetailedLogging: true,
    logLevel: 'info',
    enableMetricsCollection: true,
    metricsCollectionIntervalMs: 30000,
    // Security and compliance
    enableSecurityValidation: true,
    sanitizeContextData: true,
    maxContextSizeBytes: 1048576, // 1MB
    // Resource management
    maxMemoryUsagePercentage: 80,
    enableResourceThrottling: true,
    resourceThrottlingThresholdPercentage: 70
};
/**
 * LAPA Local Handoff System
 */
var LocalHandoffSystem = /** @class */ (function () {
    function LocalHandoffSystem(config, hooks, retryConfig) {
        this.localAgents = new Map();
        this.hooks = {};
        this.langGraphOrchestrator = new langgraph_orchestrator_1.LangGraphOrchestrator('start');
        this.contextHandoffManager = new context_handoff_1.ContextHandoffManager();
        // Validate initial configuration if provided
        if (config) {
            validateHandoffConfig(config);
        }
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
        this.thresholdManager = new HandoffThresholdManager(this.config);
        this.hooks = hooks || {};
        // Use provided retry config or derive from handoff config
        this.retryConfig = retryConfig
            ? __assign(__assign({}, DEFAULT_RETRY_CONFIG), retryConfig) : {
            maxRetries: this.config.maxRetryAttempts,
            retryDelayMs: this.config.retryDelayMs,
            exponentialBackoff: this.config.exponentialBackoff
        };
        this.metrics = {
            totalHandoffs: 0,
            successfulHandoffs: 0,
            failedHandoffs: 0,
            averageLatency: 0,
            latencyHistory: []
        };
    }
    /**
     * Registers a Local Agent for potential handoffs
     * @param agent Local Agent instance
     */
    LocalHandoffSystem.prototype.registerLocalAgent = function (agent) {
        this.localAgents.set(agent.id, agent);
        console.log("Registered Local Agent: ".concat(agent.name));
    };
    /**
     * Registers an enhanced local agent with AI SDK compatibility
     * @param agent Enhanced Local Agent instance
     */
    LocalHandoffSystem.prototype.registerEnhancedLocalAgent = function (agent) {
        this.localAgents.set(agent.id, agent);
        console.log("Registered Enhanced Local Agent: ".concat(agent.name));
    };
    /**
     * Executes a task with local handoff capabilities
     * @param task Initial task to execute
     * @param context Initial context
     * @returns Promise that resolves with the final result
     */
    LocalHandoffSystem.prototype.executeTaskWithHandoffs = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var initialContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Executing task with local handoffs: ".concat(task.id));
                        initialContext = {
                            task: task,
                            context: context,
                            handoffHistory: [],
                            startTime: Date.now(),
                            handoffCount: 0,
                            totalDuration: 0,
                            logs: []
                        };
                        return [4 /*yield*/, this.executeWorkflowWithContext(initialContext)];
                    case 1:
                        result = _a.sent();
                        console.log("Task execution completed: ".concat(task.id));
                        return [2 /*return*/, result.output];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Task execution with handoffs failed:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes workflow with context and handoff capabilities
     * @param initialContext Initial workflow context
     * @returns Promise that resolves with the orchestration result
     */
    LocalHandoffSystem.prototype.executeWorkflowWithContext = function (initialContext) {
        return __awaiter(this, void 0, void 0, function () {
            var nodes, edges;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodes = [
                            {
                                id: 'start',
                                type: 'process',
                                label: 'Task Initialization'
                            },
                            {
                                id: 'evaluate',
                                type: 'agent',
                                label: 'Handoff Evaluation',
                                agentType: 'evaluator'
                            },
                            {
                                id: 'process',
                                type: 'agent',
                                label: 'Task Processing',
                                agentType: 'processor'
                            },
                            {
                                id: 'handoff',
                                type: 'decision',
                                label: 'Handoff Decision'
                            },
                            {
                                id: 'complete',
                                type: 'process',
                                label: 'Task Completion'
                            }
                        ];
                        edges = [
                            { id: 'e1', source: 'start', target: 'evaluate' },
                            { id: 'e2', source: 'evaluate', target: 'process' },
                            { id: 'e3', source: 'process', target: 'handoff' },
                            { id: 'e4', source: 'handoff', target: 'complete' }
                        ];
                        // Configure orchestrator with nodes and edges
                        nodes.forEach(function (node) { return _this.langGraphOrchestrator.addNode(node); });
                        edges.forEach(function (edge) { return _this.langGraphOrchestrator.addEdge(edge); });
                        return [4 /*yield*/, this.executeOptimizedWorkflow(initialContext)];
                    case 1: 
                    // Execute workflow with handoff optimizations
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Executes optimized workflow with intelligent handoff decisions
     * @param initialContext Initial workflow context
     * @returns Promise that resolves with the orchestration result
     */
    LocalHandoffSystem.prototype.executeOptimizedWorkflow = function (initialContext) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.langGraphOrchestrator.executeWorkflow(initialContext)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Optimized workflow execution failed:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                finalState: {},
                                output: null,
                                executionPath: [],
                                error: error_2 instanceof Error ? error_2.message : String(error_2)
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processes a node with handoff optimizations
     * @param node The node to process
     * @param context Current context
     * @returns Promise that resolves with the processing result
     */
    LocalHandoffSystem.prototype.processNodeWithHandoffOptimizations = function (node, context) {
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
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.processAgentNodeWithHandoff(node, context)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.langGraphOrchestrator['processProcessNode'](node, context)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        if (!(node.id === 'handoff')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.evaluateHandoff(context, context.task)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.langGraphOrchestrator['processDecisionNode'](node, context)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: throw new Error("Unknown node type: ".concat(node.type));
                }
            });
        });
    };
    /**
     * Processes an agent node with handoff considerations
     * @param node The agent node
     * @param context Current context
     * @returns Promise that resolves with the agent's output
     */
    LocalHandoffSystem.prototype.processAgentNodeWithHandoff = function (node, context) {
        return __awaiter(this, void 0, void 0, function () {
            var processingTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // In a real implementation, this would route to the appropriate agent
                        // For simulation, we'll just return the context with some modifications
                        console.log("Processing agent node with handoff considerations: ".concat(node.label));
                        processingTime = Math.random() * 1000 + 500;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, processingTime); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, context), { processedBy: node.label, timestamp: new Date().toISOString(), result: "Processed by ".concat(node.label, " agent"), processingTime: processingTime })];
                }
            });
        });
    };
    /**
     * Evaluates whether a handoff should occur using Local Agent or LAPA MoE Router
     * @param context Current context
     * @param task Current task
     * @returns Promise that resolves with the handoff evaluation
     */
    LocalHandoffSystem.prototype.evaluateHandoff = function (context, task) {
        return __awaiter(this, void 0, void 0, function () {
            var evaluatorAgent, evaluationTask, evaluationResult, finalOutput, evaluation, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // If local evaluation is disabled, use LAPA MoE Router for capability-based delegation
                        if (!this.config.enableLocalEvaluation) {
                            return [2 /*return*/, this.evaluateHandoffWithMoERouter(task)];
                        }
                        evaluatorAgent = Array.from(this.localAgents.values())[0];
                        if (!evaluatorAgent) {
                            console.warn('No local agent found for handoff evaluation, using LAPA MoE Router');
                            return [2 /*return*/, this.evaluateHandoffWithMoERouter(task)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        evaluationTask = {
                            id: "eval-".concat(Date.now()),
                            description: 'Evaluate whether a handoff should occur based on context and task requirements',
                            input: JSON.stringify({ context: context, task: task }),
                            priority: 'medium'
                        };
                        evaluationResult = void 0;
                        if (!(evaluatorAgent.type === 'ollama')) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, ollama_local_1.sendOllamaChatRequest)(evaluatorAgent.model, [{ role: 'user', content: "Evaluate this context and task for handoff: ".concat(evaluationTask.input) }])];
                    case 2:
                        evaluationResult = _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(evaluatorAgent.type === 'nim')) return [3 /*break*/, 5];
                        return [4 /*yield*/, (0, nim_local_1.sendNIMInferenceRequest)(evaluatorAgent.model, "Evaluate this context and task for handoff: ".concat(evaluationTask.input))];
                    case 4:
                        evaluationResult = _a.sent();
                        _a.label = 5;
                    case 5:
                        finalOutput = typeof evaluationResult === 'string' ? { response: evaluationResult } : evaluationResult;
                        evaluation = {
                            shouldHandoff: (finalOutput === null || finalOutput === void 0 ? void 0 : finalOutput.shouldHandoff) || false,
                            targetAgentId: finalOutput === null || finalOutput === void 0 ? void 0 : finalOutput.targetAgentId,
                            confidence: (finalOutput === null || finalOutput === void 0 ? void 0 : finalOutput.confidence) || 0,
                            reason: (finalOutput === null || finalOutput === void 0 ? void 0 : finalOutput.reason) || 'No specific reason provided'
                        };
                        console.log("Handoff evaluation completed: ".concat(evaluation.shouldHandoff ? 'HANDOFF' : 'CONTINUE'));
                        return [2 /*return*/, evaluation];
                    case 6:
                        error_3 = _a.sent();
                        console.error('Handoff evaluation with local agent failed:', error_3);
                        console.warn('Falling back to LAPA MoE Router for handoff evaluation');
                        return [2 /*return*/, this.evaluateHandoffWithMoERouter(task)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Evaluates handoff using LAPA MoE Router for capability-based delegation
     * @param task Current task
     * @returns Handoff evaluation result
     */
    LocalHandoffSystem.prototype.evaluateHandoffWithMoERouter = function (task, currentDepth) {
        if (currentDepth === void 0) { currentDepth = 0; }
        try {
            // Route task using MoE Router to find the most suitable agent
            var routingResult = moe_router_1.moeRouter.routeTask(task);
            // Use threshold manager to determine if handoff should occur
            var shouldHandoff = this.thresholdManager.shouldHandoff(routingResult.confidence, currentDepth);
            return {
                shouldHandoff: shouldHandoff,
                targetAgentId: routingResult.agent.id,
                confidence: routingResult.confidence,
                reason: routingResult.reasoning
            };
        }
        catch (error) {
            console.error('Handoff evaluation with MoE Router failed:', error);
            return {
                shouldHandoff: false,
                confidence: 0,
                reason: "Evaluation error: ".concat(error instanceof Error ? error.message : String(error))
            };
        }
    };
    /**
     * Balances workload among available agents
     * @returns Agent with the lowest workload
     */
    LocalHandoffSystem.prototype.selectAgentWithLowestWorkload = function () {
        var agents = moe_router_1.moeRouter.getAgents();
        if (agents.length === 0)
            return undefined;
        // Sort agents by workload (ascending)
        var sortedAgents = __spreadArray([], agents, true).sort(function (a, b) { return a.workload - b.workload; });
        return sortedAgents[0];
    };
    /**
     * Initiates a context handoff between agents
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @returns Promise that resolves with the handoff response
     */
    LocalHandoffSystem.prototype.initiateHandoff = function (sourceAgentId, targetAgentId, taskId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, handoffStartLog, targetAgent, result, duration, handoffCompleteLog, latencyCheck, error_4, handoffErrorLog;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Update metrics
                        this.metrics.totalHandoffs++;
                        startTime = perf_hooks_1.performance.now();
                        handoffStartLog = "Handoff started from ".concat(sourceAgentId, " to ").concat(targetAgentId, " for task ").concat(taskId);
                        console.log(handoffStartLog);
                        // Notify handoff start hook
                        if (this.hooks.onHandoffStart) {
                            try {
                                this.hooks.onHandoffStart(sourceAgentId, targetAgentId, taskId);
                            }
                            catch (error) {
                                console.error('Error in onHandoffStart hook:', error);
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        targetAgent = this.localAgents.get(targetAgentId);
                        result = void 0;
                        if (!targetAgent) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handoffToLocalAgent(targetAgent, taskId, context, sourceAgentId, targetAgentId)];
                    case 2:
                        // If target is a local agent, perform handoff using local inference
                        result = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.handoffToLAPAAgent(sourceAgentId, targetAgentId, taskId, context)];
                    case 4:
                        // If target is not a local agent, use existing context handoff mechanism
                        result = _a.sent();
                        _a.label = 5;
                    case 5:
                        duration = perf_hooks_1.performance.now() - startTime;
                        // Update metrics
                        this.metrics.successfulHandoffs++;
                        this.updateLatencyMetrics(duration);
                        handoffCompleteLog = "Handoff from ".concat(sourceAgentId, " to ").concat(targetAgentId, " completed in ").concat(duration, "ms");
                        console.log(handoffCompleteLog);
                        latencyCheck = this.thresholdManager.checkLatencyThresholds(duration);
                        if (latencyCheck.exceededTarget) {
                            console.warn("Handoff latency target exceeded: ".concat(duration, "ms > ").concat(this.config.latencyTargetMs, "ms"));
                        }
                        if (latencyCheck.exceededMax) {
                            console.error("Handoff latency maximum threshold exceeded: ".concat(duration, "ms > ").concat(this.config.maxLatencyThresholdMs, "ms"));
                        }
                        // Notify handoff complete hook
                        if (this.hooks.onHandoffComplete) {
                            try {
                                this.hooks.onHandoffComplete(sourceAgentId, targetAgentId, taskId, duration);
                            }
                            catch (error) {
                                console.error('Error in onHandoffComplete hook:', error);
                            }
                        }
                        return [2 /*return*/, result];
                    case 6:
                        error_4 = _a.sent();
                        // Update metrics
                        this.metrics.failedHandoffs++;
                        console.error("Handoff from ".concat(sourceAgentId, " to ").concat(targetAgentId, " failed:"), error_4);
                        handoffErrorLog = "Handoff from ".concat(sourceAgentId, " to ").concat(targetAgentId, " failed: ").concat(error_4 instanceof Error ? error_4.message : String(error_4));
                        console.error(handoffErrorLog);
                        // Notify handoff error hook
                        if (this.hooks.onHandoffError) {
                            try {
                                this.hooks.onHandoffError(sourceAgentId, targetAgentId, taskId, error_4);
                            }
                            catch (hookError) {
                                console.error('Error in onHandoffError hook:', hookError);
                            }
                        }
                        // Implement fallback mechanism
                        return [2 /*return*/, this.handleHandoffFailure(sourceAgentId, targetAgentId, taskId, context, error_4)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handles handoff to a local agent
     * @param targetAgent Target local agent
     * @param taskId Task ID
     * @param context Context to handoff
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @returns Promise that resolves with the handoff result
     */
    LocalHandoffSystem.prototype.handoffToLocalAgent = function (targetAgent, taskId, context, sourceAgentId, targetAgentId) {
        return __awaiter(this, void 0, void 0, function () {
            var handoffTask_1, result, error_5, _a, nimResult, nimError_1, _b, ollamaResult, ollamaError_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 19]);
                        handoffTask_1 = {
                            id: taskId,
                            description: 'Task handed off from another agent',
                            input: JSON.stringify(context),
                            priority: 'medium'
                        };
                        result = void 0;
                        if (!(targetAgent.type === 'ollama')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.runWithRetry(function () { return (0, ollama_local_1.sendOllamaChatRequest)(targetAgent.model, [{ role: 'user', content: "Process this task: ".concat(handoffTask_1.input) }]); }, "Handoff to Ollama agent ".concat(targetAgentId))];
                    case 1:
                        result = _c.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(targetAgent.type === 'nim')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.runWithRetry(function () { return (0, nim_local_1.sendNIMInferenceRequest)(targetAgent.model, "Process this task: ".concat(handoffTask_1.input)); }, "Handoff to NIM agent ".concat(targetAgentId))];
                    case 3:
                        result = _c.sent();
                        _c.label = 4;
                    case 4:
                        console.log("Handoff to local agent ".concat(targetAgentId, " completed successfully"));
                        return [2 /*return*/, result];
                    case 5:
                        error_5 = _c.sent();
                        console.error("Handoff to local agent ".concat(targetAgentId, " failed:"), error_5);
                        _a = targetAgent.type === 'ollama';
                        if (!_a) return [3 /*break*/, 7];
                        return [4 /*yield*/, (0, nim_local_1.isNIMAvailable)()];
                    case 6:
                        _a = (_c.sent());
                        _c.label = 7;
                    case 7:
                        if (!_a) return [3 /*break*/, 12];
                        console.log("Falling back to NIM for agent ".concat(targetAgentId));
                        _c.label = 8;
                    case 8:
                        _c.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.runWithRetry(function () { return (0, nim_local_1.sendNIMInferenceRequest)(targetAgent.model, "Process this task: ".concat(JSON.stringify(context))); }, "Fallback to NIM agent ".concat(targetAgentId))];
                    case 9:
                        nimResult = _c.sent();
                        console.log("Fallback to NIM for agent ".concat(targetAgentId, " successful"));
                        return [2 /*return*/, nimResult];
                    case 10:
                        nimError_1 = _c.sent();
                        console.error("Fallback to NIM for agent ".concat(targetAgentId, " also failed:"), nimError_1);
                        return [3 /*break*/, 11];
                    case 11: return [3 /*break*/, 18];
                    case 12:
                        _b = targetAgent.type === 'nim';
                        if (!_b) return [3 /*break*/, 14];
                        return [4 /*yield*/, (0, ollama_local_1.isOllamaAvailable)()];
                    case 13:
                        _b = (_c.sent());
                        _c.label = 14;
                    case 14:
                        if (!_b) return [3 /*break*/, 18];
                        console.log("Falling back to Ollama for agent ".concat(targetAgentId));
                        _c.label = 15;
                    case 15:
                        _c.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, this.runWithRetry(function () { return (0, ollama_local_1.sendOllamaChatRequest)(targetAgent.model, [{ role: 'user', content: "Process this task: ".concat(JSON.stringify(context)) }]); }, "Fallback to Ollama agent ".concat(targetAgentId))];
                    case 16:
                        ollamaResult = _c.sent();
                        console.log("Fallback to Ollama for agent ".concat(targetAgentId, " successful"));
                        return [2 /*return*/, ollamaResult];
                    case 17:
                        ollamaError_1 = _c.sent();
                        console.error("Fallback to Ollama for agent ".concat(targetAgentId, " also failed:"), ollamaError_1);
                        return [3 /*break*/, 18];
                    case 18: throw new Error("Failed to handoff to local agent: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Zero-key handoff function for offline operation
     * @param task Task to process
     * @param context Context for the task
     * @returns Promise that resolves with the handoff result
     */
    LocalHandoffSystem.prototype.localHandoff = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, evaluation, targetAgentId, targetAgent, result, endTime, duration, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Initiating zero-key local handoff for task: ".concat(task.id));
                        startTime = perf_hooks_1.performance.now();
                        return [4 /*yield*/, this.evaluateHandoff({ task: task, context: context }, task)];
                    case 1:
                        evaluation = _a.sent();
                        if (!evaluation.shouldHandoff) {
                            console.log('No handoff needed, continuing with current agent');
                            return [2 /*return*/, { result: 'No handoff needed', context: context }];
                        }
                        targetAgentId = evaluation.targetAgentId;
                        if (!targetAgentId) {
                            throw new Error('Handoff evaluation indicated handoff needed but no target agent specified');
                        }
                        targetAgent = this.localAgents.get(targetAgentId);
                        if (!targetAgent) {
                            throw new Error("Target agent ".concat(targetAgentId, " not found"));
                        }
                        return [4 /*yield*/, this.handoffToLocalAgent(targetAgent, task.id, context, 'current-agent', // source agent
                            targetAgentId)];
                    case 2:
                        result = _a.sent();
                        endTime = perf_hooks_1.performance.now();
                        duration = endTime - startTime;
                        console.log("Zero-key local handoff completed in ".concat(duration.toFixed(2), "ms"));
                        // Check latency target
                        if (duration > this.config.latencyTargetMs) {
                            console.warn("Handoff latency target exceeded: ".concat(duration.toFixed(2), "ms > ").concat(this.config.latencyTargetMs, "ms"));
                        }
                        return [2 /*return*/, __assign(__assign({}, result), { handoffMetrics: {
                                    duration: duration,
                                    targetAgent: targetAgentId,
                                    confidence: evaluation.confidence,
                                    latencyWithinTarget: duration <= this.config.latencyTargetMs
                                } })];
                    case 3:
                        error_6 = _a.sent();
                        console.error("Zero-key local handoff failed:", error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handles handoff to a LAPA agent
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @returns Promise that resolves with the handoff result
     */
    LocalHandoffSystem.prototype.handoffToLAPAAgent = function (sourceAgentId, targetAgentId, taskId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var request_1, response_1, result, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        request_1 = {
                            sourceAgentId: sourceAgentId,
                            targetAgentId: targetAgentId,
                            taskId: taskId,
                            context: context,
                            priority: 'medium'
                        };
                        return [4 /*yield*/, this.runWithRetry(function () { return _this.contextHandoffManager.initiateHandoff(request_1); }, "Initiate handoff from ".concat(sourceAgentId, " to ").concat(targetAgentId))];
                    case 1:
                        response_1 = _a.sent();
                        if (!response_1.success) {
                            throw new Error("Failed to initiate handoff: ".concat(response_1.error));
                        }
                        return [4 /*yield*/, this.runWithRetry(function () { return _this.contextHandoffManager.completeHandoff(response_1.handoffId, targetAgentId); }, "Complete handoff to ".concat(targetAgentId))];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        error_7 = _a.sent();
                        console.error("Handoff to LAPA agent ".concat(targetAgentId, " failed:"), error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes an operation with retry logic
     * @param operation The operation to execute
     * @param operationName Name of the operation for logging
     * @returns Promise that resolves with the operation result
     */
    LocalHandoffSystem.prototype.runWithRetry = function (operation, operationName) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, _loop_1, this_1, attempt, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var _b, error_8, delay_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 4]);
                                        _b = {};
                                        return [4 /*yield*/, operation()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_8 = _c.sent();
                                        lastError = error_8;
                                        console.warn("Attempt ".concat(attempt, " failed for ").concat(operationName, ":"), error_8);
                                        // If this is the last attempt, don't retry
                                        if (attempt === this_1.retryConfig.maxRetries) {
                                            return [2 /*return*/, "break"];
                                        }
                                        delay_1 = this_1.retryConfig.retryDelayMs;
                                        if (this_1.retryConfig.exponentialBackoff) {
                                            delay_1 = Math.pow(2, attempt - 1) * this_1.retryConfig.retryDelayMs;
                                        }
                                        console.log("Retrying ".concat(operationName, " in ").concat(delay_1, "ms..."));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _c.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= this.retryConfig.maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // If we get here, all retries failed
                    throw new Error("Operation ".concat(operationName, " failed after ").concat(this.retryConfig.maxRetries, " attempts: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message));
                }
            });
        });
    };
    /**
     * Updates handoff configuration
     * @param newConfig Partial configuration to update
     * @throws HandoffConfigValidationError if validation fails
     */
    LocalHandoffSystem.prototype.updateConfig = function (newConfig) {
        // Validate the new configuration
        validateHandoffConfig(newConfig);
        // Apply the new configuration
        this.config = __assign(__assign({}, this.config), newConfig);
        // Update threshold manager
        this.thresholdManager.updateConfig(this.config);
        // Update retry config if related settings changed
        if (newConfig.maxRetryAttempts !== undefined ||
            newConfig.retryDelayMs !== undefined ||
            newConfig.exponentialBackoff !== undefined) {
            this.retryConfig = {
                maxRetries: this.config.maxRetryAttempts,
                retryDelayMs: this.config.retryDelayMs,
                exponentialBackoff: this.config.exponentialBackoff
            };
        }
        console.log('Handoff configuration updated:', this.config);
    };
    /**
     * Loads a configuration preset
     * @param preset Preset name (development, production, highPerformance)
     * @throws Error if preset is not found
     */
    LocalHandoffSystem.prototype.loadPreset = function (preset) {
        var config = exports.HANDOFF_CONFIG_PRESETS[preset];
        if (!config) {
            throw new Error("Handoff configuration preset '".concat(preset, "' not found"));
        }
        // Validate and apply the preset configuration
        validateHandoffConfig(config);
        this.config = __assign({}, config);
        // Update threshold manager
        this.thresholdManager.updateConfig(this.config);
        // Update retry config
        this.retryConfig = {
            maxRetries: this.config.maxRetryAttempts,
            retryDelayMs: this.config.retryDelayMs,
            exponentialBackoff: this.config.exponentialBackoff
        };
        console.log("Handoff configuration loaded from preset: ".concat(preset));
    };
    /**
     * Loads configuration from environment variables
     * @throws HandoffConfigValidationError if validation fails
     */
    LocalHandoffSystem.prototype.loadConfigFromEnvironment = function () {
        var envConfig = loadConfigFromEnvironment();
        // Validate and apply the environment configuration
        validateHandoffConfig(envConfig);
        this.config = __assign(__assign({}, this.config), envConfig);
        // Update threshold manager
        this.thresholdManager.updateConfig(this.config);
        // Update retry config if related settings changed
        if (envConfig.maxRetryAttempts !== undefined ||
            envConfig.retryDelayMs !== undefined ||
            envConfig.exponentialBackoff !== undefined) {
            this.retryConfig = {
                maxRetries: this.config.maxRetryAttempts,
                retryDelayMs: this.config.retryDelayMs,
                exponentialBackoff: this.config.exponentialBackoff
            };
        }
        console.log('Handoff configuration loaded from environment variables');
    };
    /**
     * Gets current handoff configuration
     * @returns Current configuration
     */
    LocalHandoffSystem.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Validates current configuration and returns health status
     * @returns Object with validation result and any errors
     */
    LocalHandoffSystem.prototype.checkConfigHealth = function () {
        var errors = [];
        try {
            validateHandoffConfig(this.config);
        }
        catch (error) {
            if (error instanceof HandoffConfigValidationError) {
                // Split the error message into individual errors
                var errorLines = error.message.split('\n');
                // Skip the first line which is the general message
                errors.push.apply(errors, errorLines.slice(1).map(function (line) { return line.startsWith('- ') ? line.substring(2) : line; }));
            }
            else {
                errors.push(error instanceof Error ? error.message : String(error));
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    /**
     * Gets current handoff metrics
     * @returns Current metrics
     */
    LocalHandoffSystem.prototype.getMetrics = function () {
        return __assign({}, this.metrics);
    };
    /**
     * Updates latency metrics with new measurement
     * @param latency Latency in milliseconds
     */
    LocalHandoffSystem.prototype.updateLatencyMetrics = function (latency) {
        this.metrics.latencyHistory.push(latency);
        // Keep only the last 100 latency measurements
        if (this.metrics.latencyHistory.length > 100) {
            this.metrics.latencyHistory = this.metrics.latencyHistory.slice(-100);
        }
        // Calculate average latency
        var sum = this.metrics.latencyHistory.reduce(function (a, b) { return a + b; }, 0);
        this.metrics.averageLatency = sum / this.metrics.latencyHistory.length;
    };
    /**
     * Handles handoff failure with fallback mechanisms
     * @param sourceAgentId Source agent ID
     * @param targetAgentId Target agent ID
     * @param taskId Task ID
     * @param context Context to handoff
     * @param error Error that caused the failure
     * @returns Promise that resolves with a fallback result
     */
    LocalHandoffSystem.prototype.handleHandoffFailure = function (sourceAgentId, targetAgentId, taskId, context, error) {
        return __awaiter(this, void 0, void 0, function () {
            var alternativeAgent, fallbackResult, fallbackError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn("Handling handoff failure from ".concat(sourceAgentId, " to ").concat(targetAgentId, " for task ").concat(taskId));
                        alternativeAgent = this.selectAgentWithLowestWorkload();
                        if (!(alternativeAgent && alternativeAgent.id !== sourceAgentId)) return [3 /*break*/, 4];
                        console.log("Attempting fallback handoff to alternative agent: ".concat(alternativeAgent.id));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.handoffToLAPAAgent(sourceAgentId, alternativeAgent.id, taskId, context)];
                    case 2:
                        fallbackResult = _a.sent();
                        console.log("Fallback handoff to ".concat(alternativeAgent.id, " successful"));
                        return [2 /*return*/, fallbackResult];
                    case 3:
                        fallbackError_1 = _a.sent();
                        console.error("Fallback handoff to ".concat(alternativeAgent.id, " also failed:"), fallbackError_1);
                        return [3 /*break*/, 4];
                    case 4:
                        // If no alternative agent or fallback failed, return context with error information
                        console.error('All handoff attempts failed, returning context with error information');
                        return [2 /*return*/, __assign(__assign({}, context), { handoffError: error instanceof Error ? error.message : String(error), handoffFailed: true, sourceAgentId: sourceAgentId, attemptedTargetAgentId: targetAgentId })];
                }
            });
        });
    };
    return LocalHandoffSystem;
}());
exports.LocalHandoffSystem = LocalHandoffSystem;
// Export singleton instance
exports.localHandoffSystem = new LocalHandoffSystem();
/**
 * Creates a local OpenAI-compatible client for NIM endpoint
 * @param baseURL Custom base URL for the NIM endpoint (default: http://localhost:8000/v1)
 * @param apiKey API key (optional for local endpoints)
 * @returns Gateway instance configured for NIM
 */
function createOpenAI(baseURL, apiKey) {
    if (baseURL === void 0) { baseURL = 'http://localhost:8000/v1'; }
    // For local NIM, we use the AI SDK OpenAI provider
    return (0, openai_1.createOpenAI)({
        baseURL: baseURL,
        apiKey: apiKey || 'dummy-key', // Not required for local endpoints
    });
}
/**
 * Creates a local Ollama client
 * @param baseURL Custom base URL for Ollama endpoint (default: http://localhost:11434/v1)
 * @returns Object representing Ollama client configuration
 */
function createOllama(baseURL) {
    if (baseURL === void 0) { baseURL = 'http://localhost:11434/api'; }
    // For local Ollama, we use the ollama-ai-provider
    return (0, ollama_ai_provider_1.ollama)(baseURL);
}
/**
 * Zero-key handoff function for offline operation with fallback mechanisms
 * @param task Task to process
 * @param context Context for the task
 * @param preferredProvider Preferred provider ('ollama' | 'nim') (default: 'ollama')
 * @returns Promise that resolves with the handoff result
 */
function localHandoff(task_1, context_1) {
    return __awaiter(this, arguments, void 0, function (task, context, preferredProvider) {
        var startTime, result, endTime, duration, withinLatencyTarget, error_9, endTime, duration;
        if (preferredProvider === void 0) { preferredProvider = 'ollama'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = perf_hooks_1.performance.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log("Initiating zero-key local handoff for task: ".concat(task.id, " with preferred provider: ").concat(preferredProvider));
                    return [4 /*yield*/, exports.localHandoffSystem.executeTaskWithHandoffs(task, context)];
                case 2:
                    result = _a.sent();
                    endTime = perf_hooks_1.performance.now();
                    duration = endTime - startTime;
                    console.log("Zero-key local handoff completed in ".concat(duration.toFixed(2), "ms"));
                    withinLatencyTarget = duration <= 2000;
                    if (!withinLatencyTarget) {
                        console.warn("Handoff latency target exceeded: ".concat(duration.toFixed(2), "ms > 2000ms"));
                    }
                    return [2 /*return*/, __assign(__assign({}, result), { handoffMetrics: {
                                duration: duration,
                                providerUsed: preferredProvider,
                                latencyWithinTarget: withinLatencyTarget,
                                timestamp: new Date().toISOString()
                            } })];
                case 3:
                    error_9 = _a.sent();
                    endTime = perf_hooks_1.performance.now();
                    duration = endTime - startTime;
                    console.error("Zero-key local handoff failed after ".concat(duration.toFixed(2), "ms"), error_9);
                    throw error_9;
                case 4: return [2 /*return*/];
            }
        });
    });
}
