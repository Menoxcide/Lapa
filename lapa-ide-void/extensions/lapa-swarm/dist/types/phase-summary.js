"use strict";
/**
 * LAPA Phase Summary Protocol (LPSP) Schema
 *
 * This module defines the Zod-validated structure for phase summaries.
 * LPSP provides standardized phase completion reporting with traceability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phaseSummaryReportSchema = exports.phaseSummarySchema = exports.metricSchema = exports.dependencySchema = exports.commitInfoSchema = exports.fileChangeSchema = void 0;
exports.validatePhaseSummary = validatePhaseSummary;
exports.validatePhaseSummarySafe = validatePhaseSummarySafe;
const zod_1 = require("zod");
/**
 * File change information
 */
exports.fileChangeSchema = zod_1.z.object({
    path: zod_1.z.string(),
    status: zod_1.z.enum(['added', 'modified', 'deleted', 'renamed']),
    linesAdded: zod_1.z.number().optional(),
    linesRemoved: zod_1.z.number().optional(),
    diff: zod_1.z.string().optional()
});
/**
 * Commit information
 */
exports.commitInfoSchema = zod_1.z.object({
    hash: zod_1.z.string(),
    message: zod_1.z.string(),
    author: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    files: zod_1.z.array(zod_1.z.string()).optional()
});
/**
 * Dependency information
 */
exports.dependencySchema = zod_1.z.object({
    name: zod_1.z.string(),
    version: zod_1.z.string().optional(),
    type: zod_1.z.enum(['npm', 'pip', 'cargo', 'go', 'other']).optional(),
    purpose: zod_1.z.string().optional()
});
/**
 * Metric information
 */
exports.metricSchema = zod_1.z.object({
    name: zod_1.z.string(),
    value: zod_1.z.number(),
    unit: zod_1.z.string().optional(),
    timestamp: zod_1.z.number(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
/**
 * Phase summary schema
 */
exports.phaseSummarySchema = zod_1.z.object({
    phase: zod_1.z.string(),
    version: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    status: zod_1.z.enum(['completed', 'in_progress', 'blocked', 'cancelled']),
    startDate: zod_1.z.number(),
    endDate: zod_1.z.number().optional(),
    duration: zod_1.z.number().optional(), // in milliseconds
    // File and commit tracking
    files: zod_1.z.array(exports.fileChangeSchema),
    commits: zod_1.z.array(exports.commitInfoSchema),
    // Dependencies
    dependencies: zod_1.z.array(exports.dependencySchema).optional(),
    dependenciesAdded: zod_1.z.array(exports.dependencySchema).optional(),
    dependenciesRemoved: zod_1.z.array(exports.dependencySchema).optional(),
    // Metrics
    metrics: zod_1.z.array(exports.metricSchema).optional(),
    // Implementation details
    components: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        path: zod_1.z.string(),
        status: zod_1.z.enum(['implemented', 'partial', 'planned']),
        description: zod_1.z.string().optional()
    })),
    // Testing
    tests: zod_1.z.object({
        total: zod_1.z.number(),
        passed: zod_1.z.number(),
        failed: zod_1.z.number(),
        coverage: zod_1.z.number().optional()
    }).optional(),
    // Next steps
    nextSteps: zod_1.z.array(zod_1.z.string()).optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    // AG-UI rendering support
    aguiComponents: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())).optional()
});
/**
 * Phase summary report schema (for markdown output)
 */
exports.phaseSummaryReportSchema = zod_1.z.object({
    summary: exports.phaseSummarySchema,
    markdown: zod_1.z.string(),
    html: zod_1.z.string().optional(),
    json: zod_1.z.string().optional()
});
/**
 * Validation helper
 */
function validatePhaseSummary(data) {
    return exports.phaseSummarySchema.parse(data);
}
/**
 * Validation helper with error details
 */
function validatePhaseSummarySafe(data) {
    const result = exports.phaseSummarySchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
//# sourceMappingURL=phase-summary.js.map