import { LAPAEventBus } from '../core/event-bus.ts';
import { LAPAEvent } from '../core/types/event-types.ts';

/**
 * Fidelity Metrics Tracker for LAPA v1.2 Phase 10
 * Tracks and monitors fidelity across all operations to ensure 99%+ success rates
 */
export class FidelityMetricsTracker {
  private eventBus: LAPAEventBus;
  private metrics: OperationMetrics;
  private fidelityThresholds: FidelityThresholds;

  constructor(eventBus: LAPAEventBus) {
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
  private initializeMetrics(): OperationMetrics {
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
  private initializeThresholds(): FidelityThresholds {
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
  private setupEventListeners(): void {
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
  private recordEventProcessingSuccess(event: LAPAEvent): void {
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
  private recordEventProcessingFailure(event: LAPAEvent): void {
    this.metrics.eventProcessing.total++;
    this.metrics.eventProcessing.failed++;
  }

  /**
   * Record successful agent tool execution
   * @param event Event representing tool execution
   */
  private recordAgentToolExecutionSuccess(event: LAPAEvent): void {
    this.metrics.agentToolExecution.total++;
    this.metrics.agentToolExecution.successful++;
    
    // Calculate latency if execution time is available in payload
    if (event.payload && typeof event.payload === 'object' && 'executionTime' in event.payload) {
      const latency = event.payload.executionTime as number;
      this.metrics.agentToolExecution.latencies.push(latency);
      this.updateAverageLatency(this.metrics.agentToolExecution);
    }
  }

  /**
   * Record failed agent tool execution
   * @param event Event representing tool execution failure
   */
  private recordAgentToolExecutionFailure(event: LAPAEvent): void {
    this.metrics.agentToolExecution.total++;
    this.metrics.agentToolExecution.failed++;
  }

  /**
   * Record start of cross-language communication
   * @param event Event representing cross-language communication start
   */
  private recordCrossLanguageCommunicationStart(event: LAPAEvent): void {
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
  private recordCrossLanguageCommunicationSuccess(event: LAPAEvent): void {
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
  private recordCrossLanguageCommunicationFailure(event: LAPAEvent): void {
    this.metrics.crossLanguageCommunication.total++;
    this.metrics.crossLanguageCommunication.failed++;
  }

  /**
   * Record successful mode switching
   * @param event Event representing mode change
   */
  private recordModeSwitchingSuccess(event: LAPAEvent): void {
    this.metrics.modeSwitching.total++;
    this.metrics.modeSwitching.successful++;
    
    // Calculate latency if transition time is available in payload
    if (event.payload && typeof event.payload === 'object' && 'transitionTime' in event.payload) {
      const latency = event.payload.transitionTime as number;
      this.metrics.modeSwitching.latencies.push(latency);
      this.updateAverageLatency(this.metrics.modeSwitching);
    }
  }

  /**
   * Record failed mode switching
   * @param event Event representing mode change failure
   */
  private recordModeSwitchingFailure(event: LAPAEvent): void {
    this.metrics.modeSwitching.total++;
    this.metrics.modeSwitching.failed++;
  }

  /**
   * Record successful context preservation
   * @param event Event representing context preservation
   */
  private recordContextPreservationSuccess(event: LAPAEvent): void {
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
  private recordContextPreservationFailure(event: LAPAEvent): void {
    this.metrics.contextPreservation.total++;
    this.metrics.contextPreservation.failed++;
  }

  /**
   * Update average latency for a metric
   * @param metric Metric to update
   */
  private updateAverageLatency(metric: OperationMetric): void {
    if (metric.latencies.length > 0) {
      const sum = metric.latencies.reduce((acc, latency) => acc + latency, 0);
      metric.averageLatency = sum / metric.latencies.length;
    }
  }

  /**
   * Get current fidelity metrics
   * @returns Current fidelity metrics
   */
  getMetrics(): OperationMetrics {
    return JSON.parse(JSON.stringify(this.metrics)); // Deep copy to prevent external modification
  }

  /**
   * Get fidelity rates for all operations
   * @returns Fidelity rates for all operations
   */
  getFidelityRates(): FidelityRates {
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
  validateFidelity(): FidelityValidationResult {
    const rates = this.getFidelityRates();
    
    const results: FidelityOperationResult[] = [
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
  private calculateRate(metric: OperationMetric): number {
    if (metric.total === 0) return 1; // Perfect score if no operations
    return metric.successful / metric.total;
  }

  /**
   * Calculate overall fidelity as average of all operation rates
   * @param results Fidelity operation results
   * @returns Overall fidelity rate
   */
  private calculateOverallFidelity(results: FidelityOperationResult[]): number {
    if (results.length === 0) return 1;
    const sum = results.reduce((acc, result) => acc + result.rate, 0);
    return sum / results.length;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }
}

/**
 * Interface for operation metrics
 */
interface OperationMetrics {
  eventProcessing: OperationMetric;
  agentToolExecution: OperationMetric;
  crossLanguageCommunication: OperationMetric;
  modeSwitching: OperationMetric;
  contextPreservation: OperationMetric;
}

/**
 * Interface for individual operation metric
 */
interface OperationMetric {
  total: number;
  successful: number;
  failed: number;
  averageLatency: number;
  latencies: number[];
}

/**
 * Interface for fidelity thresholds
 */
interface FidelityThresholds {
  eventProcessing: number;
  agentToolExecution: number;
  crossLanguageCommunication: number;
  modeSwitching: number;
  contextPreservation: number;
}

/**
 * Interface for fidelity rates
 */
interface FidelityRates {
  eventProcessing: number;
  agentToolExecution: number;
  crossLanguageCommunication: number;
  modeSwitching: number;
  contextPreservation: number;
}

/**
 * Interface for fidelity validation result
 */
interface FidelityValidationResult {
  allOperationsMeetThreshold: boolean;
  results: FidelityOperationResult[];
  overallFidelity: number;
}

/**
 * Interface for individual fidelity operation result
 */
interface FidelityOperationResult {
  operation: string;
  rate: number;
  threshold: number;
  meetsThreshold: boolean;
}