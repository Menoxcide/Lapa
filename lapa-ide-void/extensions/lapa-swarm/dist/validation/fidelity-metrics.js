"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FidelityMetricsTracker = void 0;
/**
 * Fidelity Metrics Tracker for LAPA v1.2 Phase 10
 * Tracks and monitors fidelity across all operations to ensure 99%+ success rates
 */
class FidelityMetricsTracker {
    eventBus;
    metrics;
    fidelityThresholds;
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.metrics = this.initializeMetrics();
        this.fidelityThresholds = this.initializeThresholds();
        // Subscribe to relevant events
        this.setupEventListeners();
    }
    /**
     * Initialize metrics structure
     * @returns Initialized operation metrics
     */
    initializeMetrics() {
        return {
            eventProcessing: {
                total: 0,
                successful: 0,
                failed: 0,
                averageLatency: 0,
                latencies: []
            },
            agentToolExecution: {
                total: 0,
                successful: 0,
                failed: 0,
                averageLatency: 0,
                latencies: []
            },
            crossLanguageCommunication: {
                total: 0,
                successful: 0,
                failed: 0,
                averageLatency: 0,
                latencies: []
            },
            modeSwitching: {
                total: 0,
                successful: 0,
                failed: 0,
                averageLatency: 0,
                latencies: []
            },
            contextPreservation: {
                total: 0,
                successful: 0,
                failed: 0,
                averageLatency: 0,
                latencies: []
            }
        };
    }
    /**
     * Initialize fidelity thresholds
     * @returns Fidelity thresholds configuration
     */
    initializeThresholds() {
        return {
            eventProcessing: 0.995, // 99.5%
            agentToolExecution: 0.99, // 99%
            crossLanguageCommunication: 0.985, // 98.5%
            modeSwitching: 0.995, // 99.5%
            contextPreservation: 0.99 // 99%
        };
    }
    /**
     * Set up event listeners for metrics collection
     */
    setupEventListeners() {
        // Event processing metrics
        this.eventBus.subscribe('event.processed', (event) => {
            this.recordEventProcessingSuccess(event);
        });
        this.eventBus.subscribe('event.processing.failed', (event) => {
            this.recordEventProcessingFailure(event);
        });
        // Agent tool execution metrics
        this.eventBus.subscribe('tool.execution.completed', (event) => {
            this.recordAgentToolExecutionSuccess(event);
        });
        this.eventBus.subscribe('tool.execution.failed', (event) => {
            this.recordAgentToolExecutionFailure(event);
        });
        // Cross-language communication metrics
        this.eventBus.subscribe('cross.language.sent', (event) => {
            this.recordCrossLanguageCommunicationStart(event);
        });
        this.eventBus.subscribe('cross.language.received', (event) => {
            this.recordCrossLanguageCommunicationSuccess(event);
        });
        this.eventBus.subscribe('cross.language.failed', (event) => {
            this.recordCrossLanguageCommunicationFailure(event);
        });
        // Mode switching metrics
        this.eventBus.subscribe('mode.changed', (event) => {
            this.recordModeSwitchingSuccess(event);
        });
        this.eventBus.subscribe('mode.change.failed', (event) => {
            this.recordModeSwitchingFailure(event);
        });
        // Context preservation metrics
        this.eventBus.subscribe('context.preserved', (event) => {
            this.recordContextPreservationSuccess(event);
        });
        this.eventBus.subscribe('context.preservation.failed', (event) => {
            this.recordContextPreservationFailure(event);
        });
    }
    /**
     * Record successful event processing
     * @param event Event that was processed
     */
    recordEventProcessingSuccess(event) {
        this.metrics.eventProcessing.total++;
        this.metrics.eventProcessing.successful++;
        // Calculate latency if timestamp is available
        if (event.timestamp) {
            const latency = Date.now() - event.timestamp;
            this.metrics.eventProcessing.latencies.push(latency);
            this.updateAverageLatency(this.metrics.eventProcessing);
        }
    }
    /**
     * Record failed event processing
     * @param event Event that failed processing
     */
    recordEventProcessingFailure(event) {
        this.metrics.eventProcessing.total++;
        this.metrics.eventProcessing.failed++;
    }
    /**
     * Record successful agent tool execution
     * @param event Event representing tool execution
     */
    recordAgentToolExecutionSuccess(event) {
        this.metrics.agentToolExecution.total++;
        this.metrics.agentToolExecution.successful++;
        // Calculate latency if execution time is available in payload
        if (event.payload && typeof event.payload === 'object' && 'executionTime' in event.payload) {
            const latency = event.payload.executionTime;
            this.metrics.agentToolExecution.latencies.push(latency);
            this.updateAverageLatency(this.metrics.agentToolExecution);
        }
    }
    /**
     * Record failed agent tool execution
     * @param event Event representing tool execution failure
     */
    recordAgentToolExecutionFailure(event) {
        this.metrics.agentToolExecution.total++;
        this.metrics.agentToolExecution.failed++;
    }
    /**
     * Record start of cross-language communication
     * @param event Event representing cross-language communication start
     */
    recordCrossLanguageCommunicationStart(event) {
        // We track the start time for latency calculation
        if (event.timestamp) {
            // Store start time in a temporary map for latency calculation
            // In a full implementation, we would correlate with the response event
        }
    }
    /**
     * Record successful cross-language communication
     * @param event Event representing successful cross-language communication
     */
    recordCrossLanguageCommunicationSuccess(event) {
        this.metrics.crossLanguageCommunication.total++;
        this.metrics.crossLanguageCommunication.successful++;
        // Calculate latency if timestamp is available
        if (event.timestamp) {
            const latency = Date.now() - event.timestamp;
            this.metrics.crossLanguageCommunication.latencies.push(latency);
            this.updateAverageLatency(this.metrics.crossLanguageCommunication);
        }
    }
    /**
     * Record failed cross-language communication
     * @param event Event representing failed cross-language communication
     */
    recordCrossLanguageCommunicationFailure(event) {
        this.metrics.crossLanguageCommunication.total++;
        this.metrics.crossLanguageCommunication.failed++;
    }
    /**
     * Record successful mode switching
     * @param event Event representing mode change
     */
    recordModeSwitchingSuccess(event) {
        this.metrics.modeSwitching.total++;
        this.metrics.modeSwitching.successful++;
        // Calculate latency if transition time is available in payload
        if (event.payload && typeof event.payload === 'object' && 'transitionTime' in event.payload) {
            const latency = event.payload.transitionTime;
            this.metrics.modeSwitching.latencies.push(latency);
            this.updateAverageLatency(this.metrics.modeSwitching);
        }
    }
    /**
     * Record failed mode switching
     * @param event Event representing mode change failure
     */
    recordModeSwitchingFailure(event) {
        this.metrics.modeSwitching.total++;
        this.metrics.modeSwitching.failed++;
    }
    /**
     * Record successful context preservation
     * @param event Event representing context preservation
     */
    recordContextPreservationSuccess(event) {
        this.metrics.contextPreservation.total++;
        this.metrics.contextPreservation.successful++;
        // Calculate latency if timestamp is available
        if (event.timestamp) {
            const latency = Date.now() - event.timestamp;
            this.metrics.contextPreservation.latencies.push(latency);
            this.updateAverageLatency(this.metrics.contextPreservation);
        }
    }
    /**
     * Record failed context preservation
     * @param event Event representing context preservation failure
     */
    recordContextPreservationFailure(event) {
        this.metrics.contextPreservation.total++;
        this.metrics.contextPreservation.failed++;
    }
    /**
     * Update average latency for a metric
     * @param metric Metric to update
     */
    updateAverageLatency(metric) {
        if (metric.latencies.length > 0) {
            const sum = metric.latencies.reduce((acc, latency) => acc + latency, 0);
            metric.averageLatency = sum / metric.latencies.length;
        }
    }
    /**
     * Get current fidelity metrics
     * @returns Current fidelity metrics
     */
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics)); // Deep copy to prevent external modification
    }
    /**
     * Get fidelity rates for all operations
     * @returns Fidelity rates for all operations
     */
    getFidelityRates() {
        return {
            eventProcessing: this.calculateRate(this.metrics.eventProcessing),
            agentToolExecution: this.calculateRate(this.metrics.agentToolExecution),
            crossLanguageCommunication: this.calculateRate(this.metrics.crossLanguageCommunication),
            modeSwitching: this.calculateRate(this.metrics.modeSwitching),
            contextPreservation: this.calculateRate(this.metrics.contextPreservation)
        };
    }
    /**
     * Check if all operations meet their fidelity thresholds
     * @returns Fidelity validation result
     */
    validateFidelity() {
        const rates = this.getFidelityRates();
        const results = [
            {
                operation: 'eventProcessing',
                rate: rates.eventProcessing,
                threshold: this.fidelityThresholds.eventProcessing,
                meetsThreshold: rates.eventProcessing >= this.fidelityThresholds.eventProcessing
            },
            {
                operation: 'agentToolExecution',
                rate: rates.agentToolExecution,
                threshold: this.fidelityThresholds.agentToolExecution,
                meetsThreshold: rates.agentToolExecution >= this.fidelityThresholds.agentToolExecution
            },
            {
                operation: 'crossLanguageCommunication',
                rate: rates.crossLanguageCommunication,
                threshold: this.fidelityThresholds.crossLanguageCommunication,
                meetsThreshold: rates.crossLanguageCommunication >= this.fidelityThresholds.crossLanguageCommunication
            },
            {
                operation: 'modeSwitching',
                rate: rates.modeSwitching,
                threshold: this.fidelityThresholds.modeSwitching,
                meetsThreshold: rates.modeSwitching >= this.fidelityThresholds.modeSwitching
            },
            {
                operation: 'contextPreservation',
                rate: rates.contextPreservation,
                threshold: this.fidelityThresholds.contextPreservation,
                meetsThreshold: rates.contextPreservation >= this.fidelityThresholds.contextPreservation
            }
        ];
        const allMeetThreshold = results.every(result => result.meetsThreshold);
        return {
            allOperationsMeetThreshold: allMeetThreshold,
            results,
            overallFidelity: this.calculateOverallFidelity(results)
        };
    }
    /**
     * Calculate success rate for an operation
     * @param metric Operation metric
     * @returns Success rate (0-1)
     */
    calculateRate(metric) {
        if (metric.total === 0)
            return 1; // Perfect score if no operations
        return metric.successful / metric.total;
    }
    /**
     * Calculate overall fidelity as average of all operation rates
     * @param results Fidelity operation results
     * @returns Overall fidelity rate
     */
    calculateOverallFidelity(results) {
        if (results.length === 0)
            return 1;
        const sum = results.reduce((acc, result) => acc + result.rate, 0);
        return sum / results.length;
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics = this.initializeMetrics();
    }
}
exports.FidelityMetricsTracker = FidelityMetricsTracker;
//# sourceMappingURL=fidelity-metrics.js.map