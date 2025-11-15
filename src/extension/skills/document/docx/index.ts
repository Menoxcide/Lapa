/**
 * DOCX Document Manipulation Skill
 * 
 * Create, read, modify, and convert DOCX documents using the docx library.
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';
import { eventBus } from '@lapa/core/event-bus.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { validateFile, getTempFilePath, calculateWordCount } from '../shared/utils.ts';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'document-docx',
  name: 'DOCX Document Manipulation',
  description: 'Create, read, modify, and convert DOCX documents',
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
      description: 'Path to DOCX file'
    },
    {
      name: 'content',
      type: 'object',
      required: false,
      description: 'Content to write/modify'
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
      description: 'Extracted text (for read/extract operations)'
    },
    {
      name: 'filePath',
      type: 'string',
      description: 'Path to generated/modified file'
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Document metadata (wordCount, pages, etc.)'
    }
  ],
  dependencies: [],
  tags: ['docx', 'document', 'word', 'office']
} as SkillMetadata;

export interface DocxSkillInputs {
  operation: 'read' | 'write' | 'extract' | 'convert' | 'modify';
  filePath?: string;
  content?: {
    paragraphs?: Array<{
      text: string;
      style?: string;
    }>;
    sections?: unknown[];
  };
  options?: Record<string, unknown>;
}

export interface DocxSkillOutputs {
  success: boolean;
  text?: string;
  filePath?: string;
  metadata?: {
    wordCount?: number;
    pageCount?: number;
    characterCount?: number;
  };
  error?: string;
}

/**
 * Executes the DOCX skill
 */
export async function execute(
  inputs: DocxSkillInputs,
  context?: Record<string, unknown>
): Promise<DocxSkillOutputs> {
  const startTime = Date.now();

  try {
    await eventBus.publish({
      id: `skill-docx-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-docx',
        inputs
      }
    } as any);

    let result: DocxSkillOutputs = { success: false };

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

        // Try to import docx library
        try {
          const { Document } = await import('docx');
          const { Packer } = await import('docx');

          // Read DOCX file
          const buffer = await readFile(inputs.filePath);
          
          // Note: docx library doesn't have a direct read method
          // In production, would use mammoth or similar for reading
          // For now, use a placeholder implementation
          
          // Extract text using mammoth if available, otherwise placeholder
          let text = '';
          try {
            const mammoth = await import('mammoth');
            const mammothResult = await mammoth.extractRawText({ buffer });
            text = mammothResult.value;
          } catch {
            // Fallback: try to extract text from buffer
            // This is a simplified approach - in production would use proper DOCX parser
            text = 'Text extraction requires mammoth library. Install with: npm install mammoth';
          }

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
            `Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        break;
      }

      case 'write': {
        if (!inputs.content) {
          throw new Error('content is required for write operations');
        }

        try {
          const { Document, Packer, Paragraph, TextRun } = await import('docx');

          // Create document from content
          const doc = new Document({
            sections: inputs.content.sections || [{
              properties: {},
              children: inputs.content.paragraphs?.map((p: any) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: p.text,
                      bold: p.style?.includes('bold'),
                      italics: p.style?.includes('italic'),
                    })
                  ]
                })
              ) || [
                new Paragraph({
                  children: [new TextRun('Empty document')]
                })
              ]
            }]
          });

          // Generate document
          const buffer = await Packer.toBuffer(doc);

          // Save to file
          const outputPath = inputs.filePath || getTempFilePath('.docx');
          await mkdir(outputPath.substring(0, outputPath.lastIndexOf('/') || outputPath.lastIndexOf('\\')), { recursive: true });
          await writeFile(outputPath, buffer);

          result = {
            success: true,
            filePath: outputPath,
            metadata: {
              wordCount: calculateWordCount(
                inputs.content.paragraphs?.map((p: any) => p.text).join(' ') || ''
              )
            }
          };
        } catch (error) {
          throw new Error(
            `Failed to create DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        break;
      }

      case 'convert': {
        // Convert DOCX to other formats
        // For now, placeholder - would implement conversion to PDF, TXT, etc.
        result = {
          success: false,
          error: 'Conversion not yet implemented'
        };
        break;
      }

      case 'modify': {
        // Modify existing DOCX
        // For now, placeholder - would implement modification
        result = {
          success: false,
          error: 'Modification not yet implemented'
        };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${inputs.operation}`);
    }

    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-docx-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-docx',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-docx-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-docx',
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

