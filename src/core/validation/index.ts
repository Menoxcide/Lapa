/**
 * Validation Module for LAPA v1.2 Phase 10
 * 
 * This module exports all validation functionality including:
 * - ValidationManager: Comprehensive validation checks for critical operations
 * - ErrorRecoveryManager: Error recovery mechanisms with retry strategies
 * - ContextPreservationManager: Context preservation during handoffs
 * - FidelityMetricsTracker: Fidelity tracking and monitoring
 * - FallbackStrategiesManager: Automated fallback mechanisms
 */

export { ValidationManager, ValidationResult } from './validation-manager.ts';
export { ErrorRecoveryManager } from './error-recovery.ts';
export { ContextPreservationManager } from './context-preservation.ts';
export { FidelityMetricsTracker } from './fidelity-metrics.ts';
export { FallbackStrategiesManager } from './fallback-strategies.ts';
export { validateFlowGuard, validateFlowGuardsConfig, validateGuardContext } from './flow-guard-validation.ts';