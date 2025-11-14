"use strict";
/**
 * Phase Reporter for LAPA v1.2.2 — Phase 16
 *
 * This module implements the LAPA Phase Summary Protocol (LPSP) reporter.
 * It integrates with the event bus and generates markdown summaries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseReporter = void 0;
exports.getPhaseReporter = getPhaseReporter;
exports.generatePhaseSummary = generatePhaseSummary;
exports.reportPhaseCompletion = reportPhaseCompletion;
const event_bus_ts_1 = require("../core/event-bus.ts");
const phase_analyzer_ts_1 = require("../observability/phase-analyzer.ts");
const phase_summary_ts_1 = require("../types/phase-summary.ts");
/**
 * Phase Reporter class
 */
class PhaseReporter {
    analyzer;
    config;
    summaries = new Map();
    constructor(config = {}) {
        this.config = {
            autoReport: config.autoReport ?? false,
            enableAGUI: config.enableAGUI ?? true,
            ...config
        };
        this.analyzer = new phase_analyzer_ts_1.PhaseAnalyzer(this.config);
        if (this.config.includeEventLogs) {
            this.analyzer.collectEvents();
        }
        if (this.config.autoReport) {
            this.setupEventListeners();
        }
    }
    /**
     * Sets up event listeners for automatic reporting
     */
    setupEventListeners() {
        event_bus_ts_1.eventBus.subscribe('phase.completed', async (event) => {
            const phaseNumber = event.payload?.phase;
            if (phaseNumber) {
                await this.reportPhaseCompletion(phaseNumber, {
                    title: event.payload.title || `Phase ${phaseNumber}`,
                    description: event.payload.description || ''
                });
            }
        });
    }
    /**
     * Generates a phase summary
     */
    async generatePhaseSummary(phaseNumber, title, description) {
        const partialSummary = await this.analyzer.generatePhaseSummary(phaseNumber, title, description);
        const summary = {
            phase: phaseNumber,
            version: '1.2.2',
            title,
            description,
            status: 'completed',
            startDate: Date.now(),
            endDate: Date.now(),
            files: [],
            commits: [],
            components: [],
            ...partialSummary
        };
        // Validate the summary
        const validated = (0, phase_summary_ts_1.validatePhaseSummary)(summary);
        this.summaries.set(phaseNumber, validated);
        return validated;
    }
    /**
     * Reports phase completion
     */
    async reportPhaseCompletion(phaseNumber, options) {
        const summary = await this.generatePhaseSummary(phaseNumber, options.title, options.description);
        // Generate markdown report
        const markdown = this.generateMarkdown(summary);
        // Generate HTML if enabled
        const html = this.config.enableAGUI
            ? this.generateHTML(summary)
            : undefined;
        // Generate JSON
        const json = JSON.stringify(summary, null, 2);
        const report = {
            summary,
            markdown,
            html,
            json
        };
        // Publish phase completion event
        await event_bus_ts_1.eventBus.publish({
            id: `phase-report-${Date.now()}`,
            type: 'phase.report.generated',
            timestamp: Date.now(),
            source: 'phase-reporter',
            payload: {
                phase: phaseNumber,
                report
            }
        });
        // Publish AG-UI event if enabled
        if (this.config.enableAGUI && summary.aguiComponents) {
            await event_bus_ts_1.eventBus.publish({
                id: `phase-agui-${Date.now()}`,
                type: 'ag-ui.message',
                timestamp: Date.now(),
                source: 'phase-reporter',
                payload: {
                    components: summary.aguiComponents
                }
            });
        }
        return report;
    }
    /**
     * Generates markdown report
     */
    generateMarkdown(summary) {
        const lines = [];
        lines.push(`# Phase ${summary.phase}: ${summary.title}`);
        lines.push('');
        lines.push(summary.description);
        lines.push('');
        // Status and dates
        lines.push(`## Status`);
        lines.push(`- **Status**: ${summary.status}`);
        lines.push(`- **Version**: ${summary.version}`);
        if (summary.startDate) {
            lines.push(`- **Start Date**: ${new Date(summary.startDate).toISOString()}`);
        }
        if (summary.endDate) {
            lines.push(`- **End Date**: ${new Date(summary.endDate).toISOString()}`);
        }
        if (summary.duration) {
            lines.push(`- **Duration**: ${(summary.duration / 1000 / 60).toFixed(2)} minutes`);
        }
        lines.push('');
        // Components
        if (summary.components.length > 0) {
            lines.push(`## Components (${summary.components.length})`);
            for (const component of summary.components) {
                lines.push(`- **${component.name}** (${component.status})`);
                lines.push(`  - Path: \`${component.path}\``);
                if (component.description) {
                    lines.push(`  - ${component.description}`);
                }
            }
            lines.push('');
        }
        // Files
        if (summary.files.length > 0) {
            lines.push(`## Files Changed (${summary.files.length})`);
            const byStatus = new Map();
            for (const file of summary.files) {
                const status = file.status;
                if (!byStatus.has(status)) {
                    byStatus.set(status, []);
                }
                byStatus.get(status).push(file);
            }
            for (const [status, files] of byStatus.entries()) {
                lines.push(`### ${status.charAt(0).toUpperCase() + status.slice(1)} (${files.length})`);
                for (const file of files) {
                    lines.push(`- \`${file.path}\``);
                    if (file.linesAdded || file.linesRemoved) {
                        lines.push(`  - +${file.linesAdded || 0} / -${file.linesRemoved || 0}`);
                    }
                }
                lines.push('');
            }
        }
        // Commits
        if (summary.commits.length > 0) {
            lines.push(`## Commits (${summary.commits.length})`);
            for (const commit of summary.commits) {
                lines.push(`- **${commit.hash.substring(0, 7)}** - ${commit.message}`);
                lines.push(`  - Author: ${commit.author}`);
                lines.push(`  - Date: ${new Date(commit.timestamp).toISOString()}`);
            }
            lines.push('');
        }
        // Dependencies
        if (summary.dependencies && summary.dependencies.length > 0) {
            lines.push(`## Dependencies (${summary.dependencies.length})`);
            for (const dep of summary.dependencies) {
                lines.push(`- **${dep.name}**${dep.version ? ` (${dep.version})` : ''}`);
                if (dep.type) {
                    lines.push(`  - Type: ${dep.type}`);
                }
                if (dep.purpose) {
                    lines.push(`  - Purpose: ${dep.purpose}`);
                }
            }
            lines.push('');
        }
        // Metrics
        if (summary.metrics && summary.metrics.length > 0) {
            lines.push(`## Metrics`);
            for (const metric of summary.metrics) {
                lines.push(`- **${metric.name}**: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`);
            }
            lines.push('');
        }
        // Tests
        if (summary.tests) {
            lines.push(`## Tests`);
            lines.push(`- **Total**: ${summary.tests.total}`);
            lines.push(`- **Passed**: ${summary.tests.passed}`);
            lines.push(`- **Failed**: ${summary.tests.failed}`);
            if (summary.tests.coverage) {
                lines.push(`- **Coverage**: ${summary.tests.coverage}%`);
            }
            lines.push('');
        }
        // Next steps
        if (summary.nextSteps && summary.nextSteps.length > 0) {
            lines.push(`## Next Steps`);
            for (const step of summary.nextSteps) {
                lines.push(`- ${step}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Generates HTML report
     */
    generateHTML(summary) {
        const markdown = this.generateMarkdown(summary);
        // Simple markdown to HTML conversion
        // In production, use a proper markdown library
        return `<div class="phase-summary">
      <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>`;
    }
    /**
     * Gets a stored summary
     */
    getSummary(phaseNumber) {
        return this.summaries.get(phaseNumber);
    }
    /**
     * Lists all stored summaries
     */
    listSummaries() {
        return Array.from(this.summaries.values());
    }
}
exports.PhaseReporter = PhaseReporter;
/**
 * Default phase reporter instance
 */
let defaultReporter = null;
/**
 * Gets or creates the default phase reporter
 */
function getPhaseReporter(config) {
    if (!defaultReporter) {
        defaultReporter = new PhaseReporter(config);
    }
    return defaultReporter;
}
/**
 * Generates and reports a phase summary
 */
async function generatePhaseSummary(phaseNumber, title, description) {
    const reporter = getPhaseReporter();
    return reporter.generatePhaseSummary(phaseNumber, title, description);
}
/**
 * Reports phase completion
 */
async function reportPhaseCompletion(phaseNumber, options) {
    const reporter = getPhaseReporter();
    return reporter.reportPhaseCompletion(phaseNumber, options);
}
//# sourceMappingURL=phase-reporter.js.map