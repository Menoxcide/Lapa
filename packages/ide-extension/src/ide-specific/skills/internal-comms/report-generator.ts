/**
 * Report Generator for Internal Communications
 * 
 * Generates structured reports, FAQs, and summaries from agent communications.
 */

export interface Communication {
  type: string;
  content: string;
  timestamp: Date;
  agent?: string;
  source: string;
}

export interface ReportOptions {
  format?: 'markdown' | 'html' | 'json';
  template?: string;
  includeTimestamps?: boolean;
}

export interface GeneratedReport {
  title: string;
  content: string;
  items: Array<{
    type: string;
    content: string;
    timestamp?: Date;
    agent?: string;
  }>;
}

/**
 * Generates a structured report from communications
 */
export async function generateReport(
  communications: Communication[],
  options: ReportOptions = {}
): Promise<GeneratedReport> {
  const format = options.format || 'markdown';
  const includeTimestamps = options.includeTimestamps ?? true;

  const title = `Agent Communication Report - ${new Date().toISOString()}`;
  const items = communications.map(c => ({
    type: c.type,
    content: c.content,
    timestamp: includeTimestamps ? c.timestamp : undefined,
    agent: c.agent
  }));

  let content = '';

  switch (format) {
    case 'markdown': {
      content = generateMarkdownReport(title, items, includeTimestamps);
      break;
    }

    case 'html': {
      content = generateHTMLReport(title, items, includeTimestamps);
      break;
    }

    case 'json': {
      content = JSON.stringify({
        title,
        items,
        generatedAt: new Date().toISOString()
      }, null, 2);
      break;
    }
  }

  return {
    title,
    content,
    items
  };
}

/**
 * Generates a FAQ from communications
 */
export async function generateFAQ(
  communications: Communication[],
  options: ReportOptions = {}
): Promise<GeneratedReport> {
  const format = options.format || 'markdown';

  // Extract Q&A pairs from communications
  const qaPairs: Array<{ question: string; answer: string; agent?: string }> = [];

  // Simple pattern matching for Q&A (in production, would use LLM)
  for (let i = 0; i < communications.length - 1; i++) {
    const comm1 = communications[i];
    const comm2 = communications[i + 1];

    // Simple heuristics: questions often end with '?' or contain question words
    if (comm1.content.includes('?') || /^(what|how|why|when|where|who|which)/i.test(comm1.content.trim())) {
      qaPairs.push({
        question: comm1.content,
        answer: comm2.content,
        agent: comm2.agent
      });
    }
  }

  const title = 'Frequently Asked Questions';
  const items = qaPairs.map(qa => ({
    type: 'qa',
    content: `Q: ${qa.question}\nA: ${qa.answer}`,
    agent: qa.agent
  }));

  let content = '';

  switch (format) {
    case 'markdown': {
      content = generateMarkdownFAQ(title, qaPairs);
      break;
    }

    case 'html': {
      content = generateHTMLFAQ(title, qaPairs);
      break;
    }

    case 'json': {
      content = JSON.stringify({
        title,
        items: qaPairs,
        generatedAt: new Date().toISOString()
      }, null, 2);
      break;
    }
  }

  return {
    title,
    content,
    items
  };
}

/**
 * Generates a summary from communications
 */
export async function generateSummary(
  communications: Communication[],
  options: ReportOptions = {}
): Promise<GeneratedReport> {
  const format = options.format || 'markdown';

  const title = `Communication Summary - ${new Date().toISOString()}`;

  // Group by agent
  const byAgent = new Map<string, Communication[]>();
  for (const comm of communications) {
    const agent = comm.agent || 'unknown';
    if (!byAgent.has(agent)) {
      byAgent.set(agent, []);
    }
    byAgent.get(agent)!.push(comm);
  }

  const items = communications.map(c => ({
    type: c.type,
    content: c.content,
    timestamp: c.timestamp,
    agent: c.agent
  }));

  let content = '';

  switch (format) {
    case 'markdown': {
      content = generateMarkdownSummary(title, communications, byAgent);
      break;
    }

    case 'html': {
      content = generateHTMLSummary(title, communications, byAgent);
      break;
    }

    case 'json': {
      content = JSON.stringify({
        title,
        summary: {
          totalCommunications: communications.length,
          byAgent: Object.fromEntries(
            Array.from(byAgent.entries()).map(([agent, comms]) => [
              agent,
              comms.length
            ])
          ),
          timeRange: {
            start: communications[0]?.timestamp,
            end: communications[communications.length - 1]?.timestamp
          }
        },
        items,
        generatedAt: new Date().toISOString()
      }, null, 2);
      break;
    }
  }

  return {
    title,
    content,
    items
  };
}

/**
 * Generates Markdown report
 */
function generateMarkdownReport(
  title: string,
  items: GeneratedReport['items'],
  includeTimestamps: boolean
): string {
  let md = `# ${title}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Total Items: ${items.length}\n\n---\n\n`;

  for (const item of items) {
    md += `## ${item.type}\n\n`;
    if (item.agent) {
      md += `**Agent**: ${item.agent}\n\n`;
    }
    if (includeTimestamps && item.timestamp) {
      md += `**Timestamp**: ${item.timestamp.toISOString()}\n\n`;
    }
    md += `${item.content}\n\n---\n\n`;
  }

  return md;
}

/**
 * Generates Markdown FAQ
 */
function generateMarkdownFAQ(
  title: string,
  qaPairs: Array<{ question: string; answer: string; agent?: string }>
): string {
  let md = `# ${title}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Total Q&A Pairs: ${qaPairs.length}\n\n---\n\n`;

  for (let i = 0; i < qaPairs.length; i++) {
    const qa = qaPairs[i];
    md += `## Q${i + 1}: ${qa.question}\n\n`;
    md += `**Answer**: ${qa.answer}\n\n`;
    if (qa.agent) {
      md += `*Answered by: ${qa.agent}*\n\n`;
    }
    md += `---\n\n`;
  }

  return md;
}

/**
 * Generates Markdown summary
 */
function generateMarkdownSummary(
  title: string,
  communications: Communication[],
  byAgent: Map<string, Communication[]>
): string {
  let md = `# ${title}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Overview\n\n`;
  md += `- **Total Communications**: ${communications.length}\n`;
  md += `- **Agents Involved**: ${byAgent.size}\n`;
  md += `- **Time Range**: ${communications[0]?.timestamp.toISOString()} to ${communications[communications.length - 1]?.timestamp.toISOString()}\n\n`;
  md += `## By Agent\n\n`;

  for (const [agent, comms] of byAgent.entries()) {
    md += `### ${agent}\n\n`;
    md += `- **Communications**: ${comms.length}\n\n`;
  }

  md += `---\n\n## Communications\n\n`;

  for (const comm of communications) {
    md += `### ${comm.type}\n\n`;
    if (comm.agent) {
      md += `**Agent**: ${comm.agent}\n\n`;
    }
    md += `**Timestamp**: ${comm.timestamp.toISOString()}\n\n`;
    md += `${comm.content}\n\n---\n\n`;
  }

  return md;
}

/**
 * Generates HTML report
 */
function generateHTMLReport(
  title: string,
  items: GeneratedReport['items'],
  includeTimestamps: boolean
): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    .item { margin: 20px 0; padding: 15px; border-left: 3px solid #007acc; }
    .metadata { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="metadata">Generated: ${new Date().toISOString()}</p>
  <p class="metadata">Total Items: ${items.length}</p>
`;

  for (const item of items) {
    html += `  <div class="item">
    <h2>${item.type}</h2>`;
    if (item.agent) {
      html += `    <p class="metadata"><strong>Agent:</strong> ${item.agent}</p>`;
    }
    if (includeTimestamps && item.timestamp) {
      html += `    <p class="metadata"><strong>Timestamp:</strong> ${item.timestamp.toISOString()}</p>`;
    }
    html += `    <p>${item.content.replace(/\n/g, '<br>')}</p>
  </div>
`;
  }

  html += `</body>
</html>`;

  return html;
}

/**
 * Generates HTML FAQ
 */
function generateHTMLFAQ(
  title: string,
  qaPairs: Array<{ question: string; answer: string; agent?: string }>
): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .qa { margin: 20px 0; padding: 15px; border-left: 3px solid #28a745; }
    .question { font-weight: bold; color: #007acc; }
    .answer { margin-top: 10px; }
    .agent { color: #888; font-size: 0.9em; font-style: italic; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Total Q&A Pairs: ${qaPairs.length}</p>
`;

  for (let i = 0; i < qaPairs.length; i++) {
    const qa = qaPairs[i];
    html += `  <div class="qa">
    <div class="question">Q${i + 1}: ${qa.question}</div>
    <div class="answer">${qa.answer}</div>`;
    if (qa.agent) {
      html += `    <div class="agent">Answered by: ${qa.agent}</div>`;
    }
    html += `  </div>
`;
  }

  html += `</body>
</html>`;

  return html;
}

/**
 * Generates HTML summary
 */
function generateHTMLSummary(
  title: string,
  communications: Communication[],
  byAgent: Map<string, Communication[]>
): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2, h3 { color: #333; }
    .overview { background: #f5f5f5; padding: 15px; margin: 20px 0; }
    .comm { margin: 15px 0; padding: 10px; border-left: 3px solid #007acc; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="overview">
    <h2>Overview</h2>
    <p><strong>Total Communications:</strong> ${communications.length}</p>
    <p><strong>Agents Involved:</strong> ${byAgent.size}</p>
    <p><strong>Time Range:</strong> ${communications[0]?.timestamp.toISOString()} to ${communications[communications.length - 1]?.timestamp.toISOString()}</p>
  </div>
  <h2>By Agent</h2>
`;

  for (const [agent, comms] of byAgent.entries()) {
    html += `  <h3>${agent}</h3>
    <p>Communications: ${comms.length}</p>
`;
  }

  html += `  <h2>Communications</h2>
`;

  for (const comm of communications) {
    html += `  <div class="comm">
    <h3>${comm.type}</h3>
    <p><strong>Agent:</strong> ${comm.agent || 'Unknown'}</p>
    <p><strong>Timestamp:</strong> ${comm.timestamp.toISOString()}</p>
    <p>${comm.content.replace(/\n/g, '<br>')}</p>
  </div>
`;
  }

  html += `</body>
</html>`;

  return html;
}

