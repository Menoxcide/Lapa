/**
 * MAEBE: Multi-Agent Emergent Behavior Framework
 * 
 * Index file for MAEBE framework exports
 * 
 * Based on: "MAEBE: Multi-Agent Emergent Behavior Framework"
 * Authors: Sinem Erisken, Timothy Gothard, Martin Leitgab, Ram Potham
 * arXiv:2506.03053v2
 */

export { MAEBEEvaluator } from './maebe-evaluator.ts';
export type {
  OrchestrationContext,
  AgentInteraction,
  OrchestrationMetrics,
  EmergentBehaviorReport,
  EmergentBehavior,
  BehaviorEvidence,
  MAEBEConfig,
  RiskThresholds
} from './maebe-evaluator.ts';

export { EmergentRiskAssessor } from './emergent-risk-assessor.ts';
export type {
  RiskAssessment,
  CoordinationRiskReport,
  CoordinationRisk,
  BehavioralRiskReport,
  BehavioralRisk,
  PerformanceRiskReport,
  PerformanceRisk,
  PerformanceThresholds,
  RiskAssessorConfig
} from './emergent-risk-assessor.ts';

export { GreatestGoodBenchmark } from '../validation/greatest-good-benchmark.ts';
export type {
  AgentDecision,
  MultiAgentContext,
  MoralPreference,
  GBBScore,
  GGBConfig
} from '../validation/greatest-good-benchmark.ts';

