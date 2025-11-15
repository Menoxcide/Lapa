/**
 * PPTX Presentation Manipulation Skill
 * 
 * Create, read, modify, and convert PPTX presentations using pptxgenjs.
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';
import { eventBus } from '@lapa/core/event-bus.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { validateFile, getTempFilePath } from '../shared/utils.ts';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'document-pptx',
  name: 'PPTX Presentation Manipulation',
  description: 'Create, read, modify, and convert PPTX presentations',
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
      description: 'Path to PPTX file'
    },
    {
      name: 'content',
      type: 'object',
      required: false,
      description: 'Content to write/modify (slides array)'
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
      description: 'Document metadata (slideCount, etc.)'
    }
  ],
  dependencies: [],
  tags: ['pptx', 'presentation', 'powerpoint', 'office']
} as SkillMetadata;

export interface PptxSkillInputs {
  operation: 'read' | 'write' | 'extract' | 'convert' | 'modify';
  filePath?: string;
  content?: {
    slides?: Array<{
      title?: string;
      content?: Array<{
        text: string;
        type?: 'title' | 'bullet' | 'text';
      }>;
    }>;
  };
  options?: Record<string, unknown>;
}

export interface PptxSkillOutputs {
  success: boolean;
  text?: string;
  filePath?: string;
  metadata?: {
    slideCount?: number;
  };
  error?: string;
}

/**
 * Executes the PPTX skill
 */
export async function execute(
  inputs: PptxSkillInputs,
  context?: Record<string, unknown>
): Promise<PptxSkillOutputs> {
  const startTime = Date.now();

  try {
    await eventBus.publish({
      id: `skill-pptx-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pptx',
        inputs
      }
    } as any);

    let result: PptxSkillOutputs = { success: false };

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

        // Read PPTX file - would need a PPTX parser library
        // For now, placeholder
        result = {
          success: false,
          error: 'PPTX reading requires additional library (e.g., pptx-to-text). Not yet implemented.'
        };
        break;
      }

      case 'write': {
        if (!inputs.content) {
          throw new Error('content is required for write operations');
        }

        try {
          const PptxGenJS = (await import('pptxgenjs')).default;
          const pptx = new PptxGenJS();

          // Add slides from content
          if (inputs.content.slides) {
            for (const slideData of inputs.content.slides) {
              const slide = pptx.addSlide();

              if (slideData.title) {
                slide.addText(slideData.title, {
                  x: 0.5,
                  y: 0.5,
                  w: 9,
                  h: 1,
                  fontSize: 44,
                  bold: true
                });
              }

              if (slideData.content) {
                let yPos = slideData.title ? 2 : 0.5;
                for (const item of slideData.content) {
                  slide.addText(item.text, {
                    x: 0.5,
                    y: yPos,
                    w: 9,
                    h: 0.5,
                    fontSize: item.type === 'title' ? 32 : 18,
                    bullet: item.type === 'bullet'
                  });
                  yPos += 0.8;
                }
              }
            }
          } else {
            // Default slide
            pptx.addSlide().addText('Empty Presentation', {
              x: 0.5,
              y: 2,
              w: 9,
              h: 2,
              fontSize: 36
            });
          }

          // Generate presentation
          const outputPath = inputs.filePath || getTempFilePath('.pptx');
          await mkdir(outputPath.substring(0, outputPath.lastIndexOf('/') || outputPath.lastIndexOf('\\')), { recursive: true });
          
          const buffer = await pptx.write({ outputType: 'nodebuffer' });
          await writeFile(outputPath, buffer);

          result = {
            success: true,
            filePath: outputPath,
            metadata: {
              slideCount: inputs.content.slides?.length || 1
            }
          };
        } catch (error) {
          throw new Error(
            `Failed to create PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        break;
      }

      case 'convert':
      case 'modify': {
        result = {
          success: false,
          error: 'Conversion/modification not yet implemented'
        };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${inputs.operation}`);
    }

    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-pptx-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pptx',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await eventBus.publish({
      id: `skill-pptx-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'document-pptx',
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

