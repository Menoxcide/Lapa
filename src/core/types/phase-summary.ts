/**
 * LAPA Phase Summary Protocol (LPSP) Schema
 * 
 * This module defines the Zod-validated structure for phase summaries.
 * LPSP provides standardized phase completion reporting with traceability.
 */

import { z } from 'zod';

/**
 * File change information
 */
export const fileChangeSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'modified', 'deleted', 'renamed']),
  linesAdded: z.number().optional(),
  linesRemoved: z.number().optional(),
  diff: z.string().optional()
});

export type FileChange = z.infer<typeof fileChangeSchema>;

/**
 * Commit information
 */
export const commitInfoSchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  timestamp: z.number(),
  files: z.array(z.string()).optional()
});

export type CommitInfo = z.infer<typeof commitInfoSchema>;

/**
 * Dependency information
 */
export const dependencySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  type: z.enum(['npm', 'pip', 'cargo', 'go', 'other']).optional(),
  purpose: z.string().optional()
});

export type Dependency = z.infer<typeof dependencySchema>;

/**
 * Metric information
 */
export const metricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional()
});

export type Metric = z.infer<typeof metricSchema>;

/**
 * Phase summary schema
 */
export const phaseSummarySchema = z.object({
  phase: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['completed', 'in_progress', 'blocked', 'cancelled']),
  startDate: z.number(),
  endDate: z.number().optional(),
  duration: z.number().optional(), // in milliseconds
  
  // File and commit tracking
  files: z.array(fileChangeSchema),
  commits: z.array(commitInfoSchema),
  
  // Dependencies
  dependencies: z.array(dependencySchema).optional(),
  dependenciesAdded: z.array(dependencySchema).optional(),
  dependenciesRemoved: z.array(dependencySchema).optional(),
  
  // Metrics
  metrics: z.array(metricSchema).optional(),
  
  // Implementation details
  components: z.array(z.object({
    name: z.string(),
    path: z.string(),
    status: z.enum(['implemented', 'partial', 'planned']),
    description: z.string().optional()
  })),
  
  // Testing
  tests: z.object({
    total: z.number(),
    passed: z.number(),
    failed: z.number(),
    coverage: z.number().optional()
  }).optional(),
  
  // Next steps
  nextSteps: z.array(z.string()).optional(),
  
  // Metadata
  metadata: z.record(z.unknown()).optional(),
  
  // AG-UI rendering support
  aguiComponents: z.array(z.record(z.unknown())).optional()
});

export type PhaseSummary = z.infer<typeof phaseSummarySchema>;

/**
 * Phase summary report schema (for markdown output)
 */
export const phaseSummaryReportSchema = z.object({
  summary: phaseSummarySchema,
  markdown: z.string(),
  html: z.string().optional(),
  json: z.string().optional()
});

export type PhaseSummaryReport = z.infer<typeof phaseSummaryReportSchema>;

/**
 * Validation helper
 */
export function validatePhaseSummary(data: unknown): PhaseSummary {
  return phaseSummarySchema.parse(data);
}

/**
 * Validation helper with error details
 */
export function validatePhaseSummarySafe(data: unknown): {
  success: boolean;
  data?: PhaseSummary;
  errors?: z.ZodError;
} {
  const result = phaseSummarySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

