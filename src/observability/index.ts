/**
 * Observability Module for LAPA v1.2 Phase 15
 * 
 * This module exports all observability functionality including:
 * - LangSmithTracer: Distributed tracing and performance monitoring
 * - PrometheusMetrics: Metrics collection and monitoring
 */

export { LangSmithTracer, getLangSmithTracer } from './langsmith.ts';
export type { 
  LangSmithConfig, 
  TraceSpan, 
  TraceContext 
} from './langsmith.ts';

export { PrometheusMetrics, getPrometheusMetrics } from './prometheus.ts';
export type { 
  PrometheusConfig, 
  PrometheusMetric, 
  MetricType, 
  MetricLabel, 
  MetricValue,
  DeepAgentsCallback 
} from './prometheus.ts';

