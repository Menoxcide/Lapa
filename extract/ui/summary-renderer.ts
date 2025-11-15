/**
 * Summary Renderer for LAPA v1.2.2 — Phase 16
 * 
 * This module converts phase summaries to various formats (Markdown, HTML, etc.)
 */

import type { PhaseSummary, PhaseSummaryReport } from '../types/phase-summary.ts';

/**
 * Summary renderer configuration
 */
export interface SummaryRendererConfig {
  format: 'markdown' | 'html' | 'json' | 'plain';
  includeMetadata?: boolean;
  includeDiffs?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Summary Renderer class
 */
export class SummaryRenderer {
  private config: SummaryRendererConfig;

  constructor(config: Partial<SummaryRendererConfig> = {}) {
    this.config = {
      format: config.format || 'markdown',
      includeMetadata: config.includeMetadata ?? true,
      includeDiffs: config.includeDiffs ?? false,
      theme: config.theme || 'light',
      ...config
    };
  }

  /**
   * Renders a phase summary report
   */
  render(report: PhaseSummaryReport): string {
    switch (this.config.format) {
      case 'markdown':
        return report.markdown;
      case 'html':
        return report.html || this.markdownToHTML(report.markdown);
      case 'json':
        return report.json || JSON.stringify(report.summary, null, 2);
      case 'plain':
        return this.toPlainText(report.summary);
      default:
        return report.markdown;
    }
  }

  /**
   * Converts markdown to HTML
   */
  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    // In production, use a proper markdown library like marked or markdown-it
    let html = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.+)\*\*$/gm, '<strong>$1</strong>')
      .replace(/^`(.+)`$/gm, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in proper HTML structure
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Phase Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      ${this.config.theme === 'dark' ? 'background: #1e1e1e; color: #d4d4d4;' : ''}
    }
    h1, h2, h3 { margin-top: 1.5em; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    ul { list-style-type: disc; padding-left: 20px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
  }

  /**
   * Converts summary to plain text
   */
  private toPlainText(summary: PhaseSummary): string {
    const lines: string[] = [];

    lines.push(`Phase ${summary.phase}: ${summary.title}`);
    lines.push('');
    lines.push(summary.description);
    lines.push('');
    lines.push(`Status: ${summary.status}`);
    lines.push(`Version: ${summary.version}`);
    lines.push(`Files: ${summary.files.length}`);
    lines.push(`Commits: ${summary.commits.length}`);
    lines.push(`Components: ${summary.components.length}`);

    return lines.join('\n');
  }

  /**
   * Renders summary as AG-UI component
   */
  renderAsAGUI(summary: PhaseSummary): Record<string, unknown> {
    return {
      componentType: 'PhaseSummary',
      componentId: `phase-summary-${summary.phase}`,
      props: {
        phase: summary.phase,
        title: summary.title,
        description: summary.description,
        status: summary.status,
        files: summary.files.length,
        commits: summary.commits.length,
        components: summary.components.length,
        metrics: summary.metrics?.length || 0
      },
      metadata: summary.metadata
    };
  }
}

/**
 * Default renderer instance
 */
let defaultRenderer: SummaryRenderer | null = null;

/**
 * Gets or creates the default renderer
 */
export function getSummaryRenderer(config?: Partial<SummaryRendererConfig>): SummaryRenderer {
  if (!defaultRenderer || config) {
    defaultRenderer = new SummaryRenderer(config);
  }
  return defaultRenderer;
}

/**
 * Renders a phase summary report
 */
export function renderSummary(
  report: PhaseSummaryReport,
  config?: Partial<SummaryRendererConfig>
): string {
  const renderer = getSummaryRenderer(config);
  return renderer.render(report);
}

