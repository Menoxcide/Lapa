/**
 * Internal Communications Skill
 * 
 * Generate structured reports and FAQs from agent-to-agent communications.
 * Integrates with A2A mediator and event bus to extract and format communications.
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';
import { eventBus } from '@lapa/core/event-bus.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateReport, generateFAQ, generateSummary } from './report-generator.ts';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'internal-comms',
  name: 'Internal Communications',
  description: 'Generate structured reports and FAQs from agent-to-agent communications',
  version: '1.0.0',
  author: 'LAPA Team',
  category: 'other',
  inputs: [
    {
      name: 'operation',
      type: 'string',
      required: true,
      description: 'Operation type (report, faq, summary)'
    },
    {
      name: 'source',
      type: 'string',
      required: true,
      description: 'Source of communication (session, agent, event-log)'
    },
    {
      name: 'sessionId',
      type: 'string',
      required: false,
      description: 'Session ID for session-based operations'
    },
    {
      name: 'agentId',
      type: 'string',
      required: false,
      description: 'Agent ID for agent-specific operations'
    },
    {
      name: 'options',
      type: 'object',
      required: false,
      description: 'Additional options (format, template, etc.)'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      description: 'Whether operation succeeded'
    },
    {
      name: 'report',
      type: 'object',
      description: 'Generated report or FAQ'
    },
    {
      name: 'filePath',
      type: 'string',
      description: 'Path to generated report file'
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Report metadata (itemCount, format, etc.)'
    }
  ],
  dependencies: [],
  tags: ['report', 'faq', 'communication', 'summary']
} as SkillMetadata;

export interface InternalCommsInputs {
  operation: 'report' | 'faq' | 'summary';
  source: 'session' | 'agent' | 'event-log';
  sessionId?: string;
  agentId?: string;
  options?: {
    format?: 'markdown' | 'html' | 'json';
    template?: string;
    includeTimestamps?: boolean;
    filterByAgent?: string[];
  };
}

export interface InternalCommsOutputs {
  success: boolean;
  report?: {
    title: string;
    content: string;
    format: string;
    items: Array<{
      type: string;
      content: string;
      timestamp?: Date;
      agent?: string;
    }>;
  };
  filePath?: string;
  metadata?: {
    itemCount: number;
    format: string;
    generatedAt: Date;
  };
  error?: string;
}

/**
 * Executes the Internal Communications skill
 */
export async function execute(
  inputs: InternalCommsInputs,
  context?: Record<string, unknown>
): Promise<InternalCommsOutputs> {
  const startTime = Date.now();

  try {
    await eventBus.publish({
      id: `skill-internal-comms-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'internal-comms',
        inputs
      }
    } as any);

    // Collect communication data based on source
    let communications: Array<{
      type: string;
      content: string;
      timestamp: Date;
      agent?: string;
      source: string;
    }> = [];

    switch (inputs.source) {
      case 'session': {
        if (!inputs.sessionId) {
          throw new Error('sessionId is required for session-based operations');
        }
        // Collect communications from session
        // In production, would query session manager or memory systems
        communications = await collectSessionCommunications(inputs.sessionId);
        break;
      }

      case 'agent': {
        if (!inputs.agentId) {
          throw new Error('agentId is required for agent-based operations');
        }
        // Collect communications from agent
        communications = await collectAgentCommunications(inputs.agentId);
        break;
      }

      case 'event-log': {
        // Collect from event log
        communications = await collectEventLogCommunications(inputs.options);
        break;
      }
    }

    // Filter communications if needed
    if (inputs.options?.filterByAgent && inputs.options.filterByAgent.length > 0) {
      communications = communications.filter(c =>
        c.agent && inputs.options?.filterByAgent?.includes(c.agent)
      );
    }

    const format = inputs.options?.format || 'markdown';
    let result: InternalCommsOutputs = { success: false };

    // Generate output based on operation type
    switch (inputs.operation) {
      case 'report': {
        const report = await generateReport(communications, {
          format,
          template: inputs.options?.template,
          includeTimestamps: inputs.options?.includeTimestamps ?? true
        });

        // Save report to file
        const reportsDir = join(tmpdir(), 'lapa-reports');
        await mkdir(reportsDir, { recursive: true });
        const reportId = `report-${Date.now()}`;
        const filePath = join(reportsDir, `${reportId}.${format === 'json' ? 'json' : format === 'html' ? 'html' : 'md'}`);
        await writeFile(filePath, report.content, 'utf-8');

        result = {
          success: true,
          report: {
            title: report.title,
            content: report.content,
            format,
            items: communications.map(c => ({
              type: c.type,
              content: c.content,
              timestamp: c.timestamp,
              agent: c.agent
            }))
          },
          filePath,
          metadata: {
            itemCount: communications.length,
            format,
            generatedAt: new Date()
          }
        };
        break;
      }

      case 'faq': {
        const faq = await generateFAQ(communications, {
          format,
          template: inputs.options?.template
        });

        const reportsDir = join(tmpdir(), 'lapa-reports');
        await mkdir(reportsDir, { recursive: true });
        const reportId = `faq-${Date.now()}`;
        const filePath = join(reportsDir, `${reportId}.${format === 'json' ? 'json' : format === 'html' ? 'html' : 'md'}`);
        await writeFile(filePath, faq.content, 'utf-8');

        result = {
          success: true,
          report: {
            title: faq.title,
            content: faq.content,
            format,
            items: faq.items
          },
          filePath,
          metadata: {
            itemCount: faq.items.length,
            format,
            generatedAt: new Date()
          }
        };
        break;
      }

      case 'summary': {
        const summary = await generateSummary(communications, {
          format,
          template: inputs.options?.template
        });

        const reportsDir = join(tmpdir(), 'lapa-reports');
        await mkdir(reportsDir, { recursive: true });
        const reportId = `summary-${Date.now()}`;
        const filePath = join(reportsDir, `${reportId}.${format === 'json' ? 'json' : format === 'html' ? 'html' : 'md'}`);
        await writeFile(filePath, summary.content, 'utf-8');

        result = {
          success: true,
          report: {
            title: summary.title,
            content: summary.content,
            format,
            items: summary.items
          },
          filePath,
          metadata: {
            itemCount: summary.items.length,
            format,
            generatedAt: new Date()
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${inputs.operation}`);
    }

    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-internal-comms-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'internal-comms',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-internal-comms-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'internal-comms',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      }
    } as any);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Collects communications from a session
 */
async function collectSessionCommunications(sessionId: string): Promise<Array<{
  type: string;
  content: string;
  timestamp: Date;
  agent?: string;
  source: string;
}>> {
  // In production, would query session manager or memory systems
  // For now, return empty array - would be populated from actual session data
  return [];
}

/**
 * Collects communications from an agent
 */
async function collectAgentCommunications(agentId: string): Promise<Array<{
  type: string;
  content: string;
  timestamp: Date;
  agent?: string;
  source: string;
}>> {
  // In production, would query agent logs or memory systems
  return [];
}

/**
 * Collects communications from event log
 */
async function collectEventLogCommunications(options?: Record<string, unknown>): Promise<Array<{
  type: string;
  content: string;
  timestamp: Date;
  agent?: string;
  source: string;
}>> {
  // In production, would query event bus or event log
  // For now, placeholder
  return [];
}

export default {
  metadata: skillMetadata,
  execute
};

