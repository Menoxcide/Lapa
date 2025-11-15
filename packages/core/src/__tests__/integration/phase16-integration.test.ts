/**
 * Phase 16 Integration Tests
 * 
 * Tests for Task Tree Orchestrator and LAPA Phase Summary Protocol (LPSP)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { phase16Integration, getPhase16Integration } from '../../orchestrator/phase16-integration.ts';
import { PhaseReporter } from '../../orchestrator/phase-reporter.ts';
import { PhaseAnalyzer } from '../../observability/phase-analyzer.ts';
import type { PhaseSummary } from '../../types/phase-summary.ts';

describe('Phase 16 Integration', () => {
  beforeEach(() => {
    // Reset integration before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Phase16Integration', () => {
    it('should initialize with default config', async () => {
      const integration = getPhase16Integration({
        enableTaskTree: true,
        enableLPSP: true,
        autoInitialize: false
      });

      await integration.initialize();

      const status = integration.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.taskTreeEnabled).toBe(true);
      expect(status.lpspEnabled).toBe(true);
    });

    it('should generate phase summary', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      const summary = await integration.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      expect(summary).toBeDefined();
      expect(summary.phase).toBe('16');
      expect(summary.title).toBe('Phase 16: Task Tree + LPSP');
      expect(summary.status).toBe('completed');
    });

    it('should report phase completion', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      const report = await integration.reportPhaseCompletion('16', {
        title: 'Phase 16: Task Tree + LPSP',
        description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.markdown).toBeDefined();
      expect(report.json).toBeDefined();
      expect(report.summary.phase).toBe('16');
    });

    it('should store and retrieve phase summaries', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      await integration.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      const summary = integration.getPhaseSummary('16');
      expect(summary).toBeDefined();
      expect(summary?.phase).toBe('16');
    });

    it('should list all phase summaries', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      await integration.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      const summaries = integration.listPhaseSummaries();
      expect(summaries.length).toBeGreaterThan(0);
      expect(summaries.some(s => s.phase === '16')).toBe(true);
    });

    it('should handle cleanup', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      await integration.cleanup();

      const status = integration.getStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('PhaseReporter', () => {
    it('should create phase reporter instance', () => {
      const reporter = new PhaseReporter({});

      expect(reporter).toBeDefined();
    });

    it('should generate phase summary', async () => {
      const reporter = new PhaseReporter({});

      const summary = await reporter.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      expect(summary).toBeDefined();
      expect(summary.phase).toBe('16');
      expect(summary.title).toBe('Phase 16: Task Tree + LPSP');
    });

    it('should generate markdown report', async () => {
      const reporter = new PhaseReporter({});

      const report = await reporter.reportPhaseCompletion('16', {
        title: 'Phase 16: Task Tree + LPSP',
        description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      });

      expect(report.markdown).toBeDefined();
      expect(report.markdown).toContain('Phase 16');
      expect(report.markdown).toContain('Task Tree + LPSP');
    });

    it('should store summaries', async () => {
      const reporter = new PhaseReporter({});

      await reporter.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      const summary = reporter.getSummary('16');
      expect(summary).toBeDefined();
      expect(summary?.phase).toBe('16');
    });
  });

  describe('PhaseAnalyzer', () => {
    it('should create phase analyzer instance', () => {
      const analyzer = new PhaseAnalyzer({
        includeEventLogs: false
      });

      expect(analyzer).toBeDefined();
    });

    it('should analyze git history', async () => {
      const analyzer = new PhaseAnalyzer({
        includeEventLogs: false
      });

      const result = await analyzer.analyzeGitHistory('16');

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.commits).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.commits)).toBe(true);
    });

    it('should analyze dependencies', async () => {
      const analyzer = new PhaseAnalyzer({
        includeEventLogs: false
      });

      const result = await analyzer.analyzeDependencies();

      expect(result).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.dependenciesAdded).toBeDefined();
      expect(result.dependenciesRemoved).toBeDefined();
      expect(Array.isArray(result.dependencies)).toBe(true);
    });

    it('should generate complete phase summary', async () => {
      const analyzer = new PhaseAnalyzer({
        includeEventLogs: false
      });

      const summary = await analyzer.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      expect(summary).toBeDefined();
      expect(summary.phase).toBe('16');
      expect(summary.title).toBe('Phase 16: Task Tree + LPSP');
      expect(summary.files).toBeDefined();
      expect(summary.commits).toBeDefined();
      expect(summary.components).toBeDefined();
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full workflow: analyze -> generate -> report', async () => {
      const integration = getPhase16Integration({
        enableLPSP: true,
        autoInitialize: true
      });

      // Generate summary
      const summary = await integration.generatePhaseSummary(
        '16',
        'Phase 16: Task Tree + LPSP',
        'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      );

      expect(summary).toBeDefined();

      // Report completion
      const report = await integration.reportPhaseCompletion('16', {
        title: 'Phase 16: Task Tree + LPSP',
        description: 'Implementation of Task Tree Orchestrator and LAPA Phase Summary Protocol'
      });

      expect(report).toBeDefined();
      expect(report.summary.phase).toBe('16');
      expect(report.markdown).toBeDefined();
      expect(report.json).toBeDefined();

      // Retrieve stored summary
      const stored = integration.getPhaseSummary('16');
      expect(stored).toBeDefined();
      expect(stored?.phase).toBe('16');
    });
  });
});

