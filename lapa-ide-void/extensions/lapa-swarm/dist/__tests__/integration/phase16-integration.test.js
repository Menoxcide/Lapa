"use strict";
/**
 * Phase 16 Integration Tests
 *
 * Tests for Task Tree Orchestrator and LAPA Phase Summary Protocol (LPSP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const phase16_integration_ts_1 = require("../../orchestrator/phase16-integration.ts");
const phase_reporter_ts_1 = require("../../orchestrator/phase-reporter.ts");
const phase_analyzer_ts_1 = require("../../observability/phase-analyzer.ts");
(0, vitest_1.describe)('Phase 16 Integration', () => {
    (0, vitest_1.beforeEach)(() => {
        // Reset integration before each test
    });
    (0, vitest_1.afterEach)(() => {
        // Cleanup after each test
    });
    (0, vitest_1.describe)('Phase16Integration', () => {
        (0, vitest_1.it)('should initialize with default config', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableTaskTree: true,
                enableLPSP: true,
                autoInitialize: false
            });
            await integration.initialize();
            const status = integration.getStatus();
            (0, vitest_1.expect)(status.initialized).toBe(true);
            (0, vitest_1.expect)(status.taskTreeEnabled).toBe(true);
            (0, vitest_1.expect)(status.lpspEnabled).toBe(true);
        });
        (0, vitest_1.it)('should generate phase summary', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            const summary = await integration.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            (0, vitest_1.expect)(summary).toBeDefined();
            (0, vitest_1.expect)(summary.phase).toBe('16');
            (0, vitest_1.expect)(summary.title).toBe('Phase 16: Task Tree + LPSP');
            (0, vitest_1.expect)(summary.status).toBe('completed');
        });
        (0, vitest_1.it)('should report phase completion', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            const report = await integration.reportPhaseCompletion('16', {
                title: 'Phase 16: Task Tree + LPSP',
                description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
            });
            (0, vitest_1.expect)(report).toBeDefined();
            (0, vitest_1.expect)(report.summary).toBeDefined();
            (0, vitest_1.expect)(report.markdown).toBeDefined();
            (0, vitest_1.expect)(report.json).toBeDefined();
            (0, vitest_1.expect)(report.summary.phase).toBe('16');
        });
        (0, vitest_1.it)('should store and retrieve phase summaries', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            await integration.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            const summary = integration.getPhaseSummary('16');
            (0, vitest_1.expect)(summary).toBeDefined();
            (0, vitest_1.expect)(summary?.phase).toBe('16');
        });
        (0, vitest_1.it)('should list all phase summaries', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            await integration.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            const summaries = integration.listPhaseSummaries();
            (0, vitest_1.expect)(summaries.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(summaries.some(s => s.phase === '16')).toBe(true);
        });
        (0, vitest_1.it)('should handle cleanup', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            await integration.cleanup();
            const status = integration.getStatus();
            (0, vitest_1.expect)(status.initialized).toBe(false);
        });
    });
    (0, vitest_1.describe)('PhaseReporter', () => {
        (0, vitest_1.it)('should create phase reporter instance', () => {
            const reporter = new phase_reporter_ts_1.PhaseReporter({
                enableEventLogs: false
            });
            (0, vitest_1.expect)(reporter).toBeDefined();
        });
        (0, vitest_1.it)('should generate phase summary', async () => {
            const reporter = new phase_reporter_ts_1.PhaseReporter({
                enableEventLogs: false
            });
            const summary = await reporter.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            (0, vitest_1.expect)(summary).toBeDefined();
            (0, vitest_1.expect)(summary.phase).toBe('16');
            (0, vitest_1.expect)(summary.title).toBe('Phase 16: Task Tree + LPSP');
        });
        (0, vitest_1.it)('should generate markdown report', async () => {
            const reporter = new phase_reporter_ts_1.PhaseReporter({
                enableEventLogs: false
            });
            const report = await reporter.reportPhaseCompletion('16', {
                title: 'Phase 16: Task Tree + LPSP',
                description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
            });
            (0, vitest_1.expect)(report.markdown).toBeDefined();
            (0, vitest_1.expect)(report.markdown).toContain('Phase 16');
            (0, vitest_1.expect)(report.markdown).toContain('Task Tree + LPSP');
        });
        (0, vitest_1.it)('should store summaries', async () => {
            const reporter = new phase_reporter_ts_1.PhaseReporter({
                enableEventLogs: false
            });
            await reporter.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            const summary = reporter.getSummary('16');
            (0, vitest_1.expect)(summary).toBeDefined();
            (0, vitest_1.expect)(summary?.phase).toBe('16');
        });
    });
    (0, vitest_1.describe)('PhaseAnalyzer', () => {
        (0, vitest_1.it)('should create phase analyzer instance', () => {
            const analyzer = new phase_analyzer_ts_1.PhaseAnalyzer({
                includeEventLogs: false
            });
            (0, vitest_1.expect)(analyzer).toBeDefined();
        });
        (0, vitest_1.it)('should analyze git history', async () => {
            const analyzer = new phase_analyzer_ts_1.PhaseAnalyzer({
                includeEventLogs: false
            });
            const result = await analyzer.analyzeGitHistory('16');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.files).toBeDefined();
            (0, vitest_1.expect)(result.commits).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(result.files)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(result.commits)).toBe(true);
        });
        (0, vitest_1.it)('should analyze dependencies', async () => {
            const analyzer = new phase_analyzer_ts_1.PhaseAnalyzer({
                includeEventLogs: false
            });
            const result = await analyzer.analyzeDependencies();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.dependencies).toBeDefined();
            (0, vitest_1.expect)(result.dependenciesAdded).toBeDefined();
            (0, vitest_1.expect)(result.dependenciesRemoved).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(result.dependencies)).toBe(true);
        });
        (0, vitest_1.it)('should generate complete phase summary', async () => {
            const analyzer = new phase_analyzer_ts_1.PhaseAnalyzer({
                includeEventLogs: false
            });
            const summary = await analyzer.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            (0, vitest_1.expect)(summary).toBeDefined();
            (0, vitest_1.expect)(summary.phase).toBe('16');
            (0, vitest_1.expect)(summary.title).toBe('Phase 16: Task Tree + LPSP');
            (0, vitest_1.expect)(summary.files).toBeDefined();
            (0, vitest_1.expect)(summary.commits).toBeDefined();
            (0, vitest_1.expect)(summary.components).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Integration Workflow', () => {
        (0, vitest_1.it)('should complete full workflow: analyze -> generate -> report', async () => {
            const integration = (0, phase16_integration_ts_1.getPhase16Integration)({
                enableLPSP: true,
                autoInitialize: true
            });
            // Generate summary
            const summary = await integration.generatePhaseSummary('16', 'Phase 16: Task Tree + LPSP', 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol');
            (0, vitest_1.expect)(summary).toBeDefined();
            // Report completion
            const report = await integration.reportPhaseCompletion('16', {
                title: 'Phase 16: Task Tree + LPSP',
                description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
            });
            (0, vitest_1.expect)(report).toBeDefined();
            (0, vitest_1.expect)(report.summary.phase).toBe('16');
            (0, vitest_1.expect)(report.markdown).toBeDefined();
            (0, vitest_1.expect)(report.json).toBeDefined();
            // Retrieve stored summary
            const stored = integration.getPhaseSummary('16');
            (0, vitest_1.expect)(stored).toBeDefined();
            (0, vitest_1.expect)(stored?.phase).toBe('16');
        });
    });
});
//# sourceMappingURL=phase16-integration.test.js.map