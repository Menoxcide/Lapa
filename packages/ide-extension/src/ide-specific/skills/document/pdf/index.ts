/**
 * PDF Document Manipulation Skill
 * 
 * Wraps the existing PDFProcessor as a skill for consistency.
 */

import { SkillMetadata } from '../../../orchestrator/skill-manager.ts';
import { eventBus } from '../../../core/event-bus.ts';
import { validateFile, calculateWordCount } from '../shared/utils.ts';
import { PDFProcessor } from '../../../rag/processors/pdf.processor.ts';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'document-pdf',
  name: 'PDF Document Manipulation',
  description: 'Read, extract text, and manipulate PDF documents',
  version: '1.0.0',
  author: 'LAPA Team',
  category: 'other',
  inputs: [
    {
      name: 'operation',
      type: 'string',
      required: true,
      description: 'Operation type (read, extract, convert)'
    },
    {
      name: 'filePath',
      type: 'string',
      required: true,
      description: 'Path to PDF file'
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
      name: 'text',
      type: 'string',
      description: 'Extracted text'
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Document metadata (pageCount, etc.)'
    }
  ],
  dependencies: [],
  tags: ['pdf', 'document', 'extract']
} as SkillMetadata;

export interface PdfSkillInputs {
  operation: 'read' | 'extract' | 'convert';
  filePath: string;
  options?: {
    pages?: number[];
    password?: string;
  };
}

export interface PdfSkillOutputs {
  success: boolean;
  text?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
  };
  error?: string;
}

// PDF processor instance
let pdfProcessor: PDFProcessor | null = null;

/**
 * Gets or creates PDF processor instance
 */
async function getPdfProcessor(): Promise<PDFProcessor> {
  if (!pdfProcessor) {
    pdfProcessor = new PDFProcessor({
      baseUrl: 'http://localhost:8000', // Placeholder - would use actual NeMo Retriever URL
      timeout: 30000,
      pdfProcessing: true,
      videoProcessing: false
    });
  }
  return pdfProcessor;
}

/**
 * Executes the PDF skill
 */
export async function execute(
  inputs: PdfSkillInputs,
  context?: Record<string, unknown>
): Promise<PdfSkillOutputs> {
  const startTime = Date.now();

  try {
    await eventBus.publish({
      id: `skill-pdf-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pdf',
        inputs
      }
    } as any);

    const fileInfo = await validateFile(inputs.filePath);
    if (!fileInfo.exists) {
      throw new Error(`File not found: ${inputs.filePath}`);
    }

    let result: PdfSkillOutputs = { success: false };

    switch (inputs.operation) {
      case 'read':
      case 'extract': {
        try {
          const processor = await getPdfProcessor();
          const text = await processor.extractText(inputs.filePath);

          const wordCount = calculateWordCount(text);

          result = {
            success: true,
            text,
            metadata: {
              wordCount,
              characterCount: text.length
            }
          };
        } catch (error) {
          throw new Error(
            `Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        break;
      }

      case 'convert': {
        // Conversion would convert PDF to other formats
        // For now, placeholder
        result = {
          success: false,
          error: 'PDF conversion not yet implemented'
        };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${inputs.operation}`);
    }

    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-pdf-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pdf',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-pdf-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pdf',
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

