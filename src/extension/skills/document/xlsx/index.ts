/**
 * XLSX Spreadsheet Manipulation Skill
 * 
 * Create, read, modify, and convert XLSX spreadsheets using SheetJS (xlsx).
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';
import { eventBus } from '@lapa/core/event-bus.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { validateFile, getTempFilePath } from '../shared/utils.ts';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'document-xlsx',
  name: 'XLSX Spreadsheet Manipulation',
  description: 'Create, read, modify, and convert XLSX spreadsheets',
  version: '1.0.0',
  author: 'LAPA Team',
  category: 'other',
  inputs: [
    {
      name: 'operation',
      type: 'string',
      required: true,
      description: 'Operation type (read, write, extract, convert, modify)'
    },
    {
      name: 'filePath',
      type: 'string',
      required: false,
      description: 'Path to XLSX file'
    },
    {
      name: 'content',
      type: 'object',
      required: false,
      description: 'Content to write/modify (worksheets array)'
    },
    {
      name: 'options',
      type: 'object',
      required: false,
      description: 'Additional options for the operation'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      description: 'Whether operation succeeded'
    },
    {
      name: 'data',
      type: 'object',
      description: 'Extracted data (for read/extract operations)'
    },
    {
      name: 'filePath',
      type: 'string',
      description: 'Path to generated/modified file'
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Document metadata (sheetCount, rowCount, etc.)'
    }
  ],
  dependencies: [],
  tags: ['xlsx', 'spreadsheet', 'excel', 'office']
} as SkillMetadata;

export interface XlsxSkillInputs {
  operation: 'read' | 'write' | 'extract' | 'convert' | 'modify';
  filePath?: string;
  content?: {
    worksheets?: Array<{
      name: string;
      data: unknown[][];
    }>;
  };
  options?: {
    sheetName?: string;
    range?: string;
    header?: boolean;
  };
}

export interface XlsxSkillOutputs {
  success: boolean;
  data?: unknown;
  filePath?: string;
  metadata?: {
    sheetCount?: number;
    rowCount?: number;
    columnCount?: number;
  };
  error?: string;
}

/**
 * Executes the XLSX skill
 */
export async function execute(
  inputs: XlsxSkillInputs,
  context?: Record<string, unknown>
): Promise<XlsxSkillOutputs> {
  const startTime = Date.now();

  try {
    await eventBus.publish({
      id: `skill-xlsx-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-xlsx',
        inputs
      }
    } as any);

    const XLSX = await import('xlsx');
    let result: XlsxSkillOutputs = { success: false };

    switch (inputs.operation) {
      case 'read':
      case 'extract': {
        if (!inputs.filePath) {
          throw new Error('filePath is required for read/extract operations');
        }

        const fileInfo = await validateFile(inputs.filePath);
        if (!fileInfo.exists) {
          throw new Error(`File not found: ${inputs.filePath}`);
        }

        // Read XLSX file
        const buffer = await readFile(inputs.filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Extract data
        const sheetName = inputs.options?.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = inputs.options?.header
          ? XLSX.utils.sheet_to_json(worksheet)
          : XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Calculate metadata
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const rowCount = range.e.r - range.s.r + 1;
        const columnCount = range.e.c - range.s.c + 1;

        result = {
          success: true,
          data,
          metadata: {
            sheetCount: workbook.SheetNames.length,
            rowCount,
            columnCount
          }
        };
        break;
      }

      case 'write': {
        if (!inputs.content) {
          throw new Error('content is required for write operations');
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add worksheets
        if (inputs.content.worksheets && inputs.content.worksheets.length > 0) {
          for (const wsData of inputs.content.worksheets) {
            const worksheet = XLSX.utils.aoa_to_sheet(wsData.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, wsData.name);
          }
        } else {
          // Default worksheet
          const worksheet = XLSX.utils.aoa_to_sheet([['Empty Spreadsheet']]);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        }

        // Generate file
        const outputPath = inputs.filePath || getTempFilePath('.xlsx');
        await mkdir(outputPath.substring(0, outputPath.lastIndexOf('/') || outputPath.lastIndexOf('\\')), { recursive: true });
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        await writeFile(outputPath, buffer);

        result = {
          success: true,
          filePath: outputPath,
          metadata: {
            sheetCount: inputs.content.worksheets?.length || 1
          }
        };
        break;
      }

      case 'convert': {
        if (!inputs.filePath) {
          throw new Error('filePath is required for convert operations');
        }

        const buffer = await readFile(inputs.filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Convert to CSV or JSON
        const convertFormat = (inputs.options as any)?.format || 'csv';
        const sheetName = inputs.options?.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        let outputBuffer: Buffer;
        let extension: string;

        if (convertFormat === 'csv') {
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          outputBuffer = Buffer.from(csv, 'utf-8');
          extension = '.csv';
        } else if (convertFormat === 'json') {
          const json = JSON.stringify(
            XLSX.utils.sheet_to_json(worksheet),
            null,
            2
          );
          outputBuffer = Buffer.from(json, 'utf-8');
          extension = '.json';
        } else {
          throw new Error(`Unsupported conversion format: ${convertFormat}`);
        }

        const outputPath = getTempFilePath(extension);
        await writeFile(outputPath, outputBuffer);

        result = {
          success: true,
          filePath: outputPath,
          data: outputBuffer.toString('utf-8')
        };
        break;
      }

      case 'modify': {
        if (!inputs.filePath) {
          throw new Error('filePath is required for modify operations');
        }

        // Read, modify, and write back
        const buffer = await readFile(inputs.filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Modify would depend on specific requirements
        // For now, placeholder
        result = {
          success: false,
          error: 'Modification not yet implemented - requires specific modification instructions'
        };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${inputs.operation}`);
    }

    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-xlsx-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-xlsx',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-xlsx-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-xlsx',
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

export default {
  metadata: skillMetadata,
  execute
};

