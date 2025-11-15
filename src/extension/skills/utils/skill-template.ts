/**
 * Skill Template Generator for LAPA
 * 
 * This utility helps generate skill templates following LAPA skill patterns.
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';

export interface SkillTemplateOptions {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'test' | 'debug' | 'review' | 'integrate' | 'other';
  author?: string;
  version?: string;
  inputs?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  dependencies?: string[];
  tags?: string[];
}

/**
 * Generates a skill TypeScript template
 */
export function generateSkillTemplate(options: SkillTemplateOptions): string {
  const {
    id,
    name,
    description,
    category,
    author = 'LAPA Team',
    version = '1.0.0',
    inputs = [],
    outputs = [],
    dependencies = [],
    tags = []
  } = options;

  const metadata: SkillMetadata = {
    id,
    name,
    description,
    version,
    author,
    category,
    inputs,
    outputs,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    tags: tags.length > 0 ? tags : undefined
  };

  const metadataString = JSON.stringify(metadata, null, 2)
    .replace(/"/g, "'")
    .replace(/'/g, "'");

  const inputsType = inputs.length > 0
    ? `{
${inputs.map(i => `  ${i.name}${i.required ? '' : '?'}: ${i.type};`).join('\n')}
}`
    : 'Record<string, unknown>';

  const returnType = outputs.length > 0
    ? `{
${outputs.map(o => `  ${o.name}: ${o.type};`).join('\n')}
}`
    : 'Record<string, unknown>';

  return `/**
 * ${name}
 * 
 * ${description}
 */

import { SkillMetadata } from '@lapa/core/orchestrator/skill-manager.js';
import { eventBus } from '@lapa/core/event-bus.js';

// Skill metadata
export const skillMetadata: SkillMetadata = ${metadataString.replace(/'/g, "'")} as SkillMetadata;

// Skill inputs type
export interface ${name.replace(/\s+/g, '')}Inputs extends ${inputsType} {}

// Skill outputs type
export interface ${name.replace(/\s+/g, '')}Outputs extends ${returnType} {}

/**
 * Executes the ${name} skill
 * @param inputs Skill inputs
 * @param context Optional execution context
 * @returns Skill outputs
 */
export async function execute(
  inputs: ${name.replace(/\s+/g, '')}Inputs,
  context?: Record<string, unknown>
): Promise<${name.replace(/\s+/g, '')}Outputs> {
  const startTime = Date.now();
  
  try {
    // Publish skill execution started event
    await eventBus.publish({
      id: \`skill-${id}-exec-\${Date.now()}\`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: '${id}',
        inputs
      }
    } as any);

    // TODO: Implement skill logic here
    
    const result: ${name.replace(/\s+/g, '')}Outputs = {
      // TODO: Return actual results
${outputs.map(o => `      ${o.name}: undefined as ${o.type},`).join('\n')}
    };

    const executionTime = Date.now() - startTime;

    // Publish skill execution completed event
    await eventBus.publish({
      id: \`skill-${id}-complete-\${Date.now()}\`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: '${id}',
        executionTime,
        outputs: result
      }
    } as any);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Publish skill execution failed event
    await eventBus.publish({
      id: \`skill-${id}-fail-\${Date.now()}\`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: '${id}',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      }
    } as any);

    throw error;
  }
}

// Default export for convenience
export default {
  metadata: skillMetadata,
  execute
};
`;
}

/**
 * Generates a skill YAML metadata template
 */
export function generateSkillYamlTemplate(options: SkillTemplateOptions): string {
  const {
    id,
    name,
    description,
    category,
    author = 'LAPA Team',
    version = '1.0.0',
    inputs = [],
    outputs = [],
    dependencies = [],
    tags = []
  } = options;

  const yaml = `id: ${id}
name: ${name}
description: ${description}
version: ${version}
author: ${author}
category: ${category}
${inputs.length > 0 ? `inputs:\n${inputs.map(i => `  - name: ${i.name}\n    type: ${i.type}\n    required: ${i.required}\n    description: ${i.description || ''}`).join('\n')}` : 'inputs: []'}
${outputs.length > 0 ? `outputs:\n${outputs.map(o => `  - name: ${o.name}\n    type: ${o.type}\n    description: ${o.description || ''}`).join('\n')}` : 'outputs: []'}
${dependencies.length > 0 ? `dependencies:\n${dependencies.map(d => `  - ${d}`).join('\n')}` : ''}
${tags.length > 0 ? `tags:\n${tags.map(t => `  - ${t}`).join('\n')}` : ''}
`;

  return yaml;
}

/**
 * Validates skill template options
 */
export function validateSkillTemplateOptions(options: Partial<SkillTemplateOptions>): string[] {
  const errors: string[] = [];

  if (!options.id || typeof options.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!options.name || typeof options.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!options.description || typeof options.description !== 'string') {
    errors.push('description is required and must be a string');
  }

  if (!options.category || !['code', 'test', 'debug', 'review', 'integrate', 'other'].includes(options.category)) {
    errors.push('category is required and must be one of: code, test, debug, review, integrate, other');
  }

  return errors;
}

