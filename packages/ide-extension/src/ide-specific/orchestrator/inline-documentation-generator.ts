/**
 * Inline Documentation Generator for LAPA v1.0
 * 
 * Auto-generates JSDoc/TSDoc documentation for functions, classes, and methods.
 * Analyzes code structure and generates comprehensive documentation comments.
 * 
 * Features:
 * - Automatic JSDoc/TSDoc generation
 * - Parameter and return type inference
 * - Function/class/method analysis
 * - TypeScript and JavaScript support
 * - Integration with code editor
 */

import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { performance } from 'perf_hooks';

// Documentation style
export type DocumentationStyle = 'jsdoc' | 'tsdoc';

// Code element type
export type CodeElementType = 'function' | 'class' | 'method' | 'interface' | 'type' | 'enum';

// Generated documentation
export interface GeneratedDocumentation {
  element: {
    name: string;
    type: CodeElementType;
    signature: string;
    location: {
      line: number;
      column: number;
    };
  };
  documentation: string;
  style: DocumentationStyle;
  parameters?: ParameterDoc[];
  returns?: ReturnDoc;
  throws?: string[];
  examples?: string[];
  tags?: Record<string, string>;
}

// Parameter documentation
export interface ParameterDoc {
  name: string;
  type?: string;
  description: string;
  optional?: boolean;
  defaultValue?: string;
}

// Return documentation
export interface ReturnDoc {
  type?: string;
  description: string;
}

// Generation options
export interface DocumentationGenerationOptions {
  code: string;
  style?: DocumentationStyle;
  language?: string;
  includeExamples?: boolean;
  includeTags?: boolean;
}

/**
 * Inline Documentation Generator Tool
 */
export class InlineDocumentationGenerator extends BaseAgentTool {
  constructor() {
    super(
      'inline-documentation-generator',
      'utility',
      'Generates JSDoc/TSDoc documentation for code elements',
      '1.0.0'
    );
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    const action = params.action;
    if (!action || typeof action !== 'string') {
      return false;
    }

    if (action === 'generate') {
      return params.code && typeof params.code === 'string';
    }

    return false;
  }

  /**
   * Executes documentation generation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();

    try {
      const action = context.parameters.action as string;

      if (action === 'generate') {
        return await this.generateDocumentation(context, startTime);
      }

      return {
        success: false,
        error: `Unknown action: ${action}. Supported: generate`,
        executionTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime
      };
    }
  }

  /**
   * Generates documentation for code
   */
  private async generateDocumentation(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const code = context.parameters.code as string;
    const style = (context.parameters.style as DocumentationStyle) || 'jsdoc';
    const language = (context.parameters.language as string) || 'typescript';
    const includeExamples = context.parameters.includeExamples !== false;
    const includeTags = context.parameters.includeTags !== false;

    // Parse code and extract elements
    const elements = this.parseCodeElements(code, language);

    // Generate documentation for each element
    const documentation: GeneratedDocumentation[] = [];

    for (const element of elements) {
      const doc = this.generateElementDocumentation(element, style, language, includeExamples, includeTags);
      if (doc) {
        documentation.push(doc);
      }
    }

    // Publish event
    await this.publishEvent('documentation.generated', {
      count: documentation.length,
      style,
      taskId: context.taskId
    });

    return {
      success: true,
      data: {
        documentation,
        summary: {
          total: documentation.length,
          byType: this.groupByType(documentation)
        }
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Parses code to extract elements
   */
  private parseCodeElements(code: string, language: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Function detection
      const functionMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
      if (functionMatch) {
        elements.push({
          name: functionMatch[1],
          type: 'function',
          signature: trimmed,
          line: i + 1,
          parameters: this.parseParameters(functionMatch[2]),
          returnType: this.inferReturnType(lines, i, language)
        });
        continue;
      }

      // Arrow function detection
      const arrowMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:\(([^)]*)\)|(\w+))\s*=>/);
      if (arrowMatch) {
        elements.push({
          name: arrowMatch[1],
          type: 'function',
          signature: trimmed,
          line: i + 1,
          parameters: this.parseParameters(arrowMatch[2] || ''),
          returnType: this.inferReturnType(lines, i, language)
        });
        continue;
      }

      // Class detection
      const classMatch = trimmed.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        elements.push({
          name: classMatch[1],
          type: 'class',
          signature: trimmed,
          line: i + 1
        });
        continue;
      }

      // Method detection (inside class)
      const methodMatch = trimmed.match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(([^)]*)\)/);
      if (methodMatch && this.isInsideClass(lines, i)) {
        elements.push({
          name: methodMatch[1],
          type: 'method',
          signature: trimmed,
          line: i + 1,
          parameters: this.parseParameters(methodMatch[2]),
          returnType: this.inferReturnType(lines, i, language)
        });
        continue;
      }

      // Interface detection
      const interfaceMatch = trimmed.match(/(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        elements.push({
          name: interfaceMatch[1],
          type: 'interface',
          signature: trimmed,
          line: i + 1
        });
        continue;
      }

      // Type alias detection
      const typeMatch = trimmed.match(/(?:export\s+)?type\s+(\w+)\s*=/);
      if (typeMatch) {
        elements.push({
          name: typeMatch[1],
          type: 'type',
          signature: trimmed,
          line: i + 1
        });
        continue;
      }

      // Enum detection
      const enumMatch = trimmed.match(/(?:export\s+)?enum\s+(\w+)/);
      if (enumMatch) {
        elements.push({
          name: enumMatch[1],
          type: 'enum',
          signature: trimmed,
          line: i + 1
        });
        continue;
      }
    }

    return elements;
  }

  /**
   * Parses function parameters
   */
  private parseParameters(paramString: string): ParameterInfo[] {
    if (!paramString.trim()) return [];

    return paramString.split(',').map(param => {
      const trimmed = param.trim();
      const optional = trimmed.includes('?');
      const hasDefault = trimmed.includes('=');
      
      // Extract name and type
      const parts = trimmed.replace('?', '').split(':').map(p => p.trim());
      const name = parts[0].split('=')[0].trim();
      const type = parts[1]?.split('=')[0]?.trim();
      const defaultValue = hasDefault ? trimmed.split('=')[1]?.trim() : undefined;

      return {
        name,
        type,
        optional,
        defaultValue
      };
    });
  }

  /**
   * Infers return type from code
   */
  private inferReturnType(lines: string[], startLine: number, language: string): string | undefined {
    // Look for explicit return type annotation
    const signature = lines[startLine];
    const returnMatch = signature.match(/\)\s*:\s*(\w+)/);
    if (returnMatch) {
      return returnMatch[1];
    }

    // Look for return statements
    for (let i = startLine; i < Math.min(startLine + 50, lines.length); i++) {
      const returnMatch = lines[i].match(/return\s+(.+)/);
      if (returnMatch) {
        const value = returnMatch[1].trim();
        // Infer type from return value
        if (value === 'true' || value === 'false') return 'boolean';
        if (value.match(/^\d+$/)) return 'number';
        if (value.match(/^['"]/)) return 'string';
        if (value === 'null' || value === 'undefined') return 'void';
        if (value.startsWith('{')) return 'object';
        if (value.startsWith('[')) return 'array';
      }
    }

    return undefined;
  }

  /**
   * Checks if line is inside a class
   */
  private isInsideClass(lines: string[], lineIndex: number): boolean {
    let depth = 0;
    for (let i = 0; i < lineIndex; i++) {
      if (lines[i].includes('class ')) depth++;
      if (lines[i].includes('}') && depth > 0) depth--;
    }
    return depth > 0;
  }

  /**
   * Generates documentation for a code element
   */
  private generateElementDocumentation(
    element: CodeElement,
    style: DocumentationStyle,
    language: string,
    includeExamples: boolean,
    includeTags: boolean
  ): GeneratedDocumentation | null {
    const description = this.generateDescription(element);
    const parameters = element.parameters?.map(p => this.generateParameterDoc(p)) || [];
    const returns = element.returnType ? this.generateReturnDoc(element) : undefined;
    const examples = includeExamples ? this.generateExamples(element) : undefined;

    let docString = '';

    if (style === 'jsdoc') {
      docString = this.generateJSDoc(element, description, parameters, returns, examples, includeTags);
    } else {
      docString = this.generateTSDoc(element, description, parameters, returns, examples, includeTags);
    }

    return {
      element: {
        name: element.name,
        type: element.type,
        signature: element.signature,
        location: {
          line: element.line,
          column: 0
        }
      },
      documentation: docString,
      style,
      parameters: parameters.length > 0 ? parameters : undefined,
      returns,
      examples,
      tags: includeTags ? this.generateTags(element) : undefined
    };
  }

  /**
   * Generates JSDoc format documentation
   */
  private generateJSDoc(
    element: CodeElement,
    description: string,
    parameters: ParameterDoc[],
    returns: ReturnDoc | undefined,
    examples: string[] | undefined,
    includeTags: boolean
  ): string {
    const lines: string[] = ['/**'];

    // Description
    lines.push(` * ${description}`);

    // Parameters
    for (const param of parameters) {
      const optional = param.optional ? '[' : '';
      const type = param.type ? `{${param.type}}` : '';
      const defaultValue = param.defaultValue ? `=${param.defaultValue}` : '';
      lines.push(` * @param ${optional}${type} ${param.name}${defaultValue} - ${param.description}`);
    }

    // Returns
    if (returns) {
      const type = returns.type ? `{${returns.type}}` : '';
      lines.push(` * @returns ${type} ${returns.description}`);
    }

    // Examples
    if (examples && examples.length > 0) {
      lines.push(' *');
      for (const example of examples) {
        lines.push(` * @example`);
        lines.push(` * ${example}`);
      }
    }

    // Additional tags
    if (includeTags) {
      if (element.type === 'class') {
        lines.push(' * @class');
      }
      if (element.type === 'method' && element.name.startsWith('_')) {
        lines.push(' * @private');
      }
    }

    lines.push(' */');
    return lines.join('\n');
  }

  /**
   * Generates TSDoc format documentation
   */
  private generateTSDoc(
    element: CodeElement,
    description: string,
    parameters: ParameterDoc[],
    returns: ReturnDoc | undefined,
    examples: string[] | undefined,
    includeTags: boolean
  ): string {
    const lines: string[] = ['/**'];

    // Description
    lines.push(` * ${description}`);

    // Parameters
    for (const param of parameters) {
      const optional = param.optional ? ' - Optional' : '';
      const type = param.type ? ` - Type: ${param.type}` : '';
      lines.push(` * @param ${param.name}${optional}${type} - ${param.description}`);
    }

    // Returns
    if (returns) {
      const type = returns.type ? ` - Type: ${returns.type}` : '';
      lines.push(` * @returns${type} - ${returns.description}`);
    }

    // Examples
    if (examples && examples.length > 0) {
      lines.push(' *');
      for (const example of examples) {
        lines.push(` * @example`);
        lines.push(` * ${example}`);
      }
    }

    lines.push(' */');
    return lines.join('\n');
  }

  /**
   * Generates description for element
   */
  private generateDescription(element: CodeElement): string {
    const name = element.name;
    const type = element.type;

    // Generate based on type and name
    const descriptions: Record<CodeElementType, (name: string) => string> = {
      function: (n) => `Executes ${this.humanizeName(n)}.`,
      method: (n) => `Performs ${this.humanizeName(n)}.`,
      class: (n) => `Represents ${this.humanizeName(n)}.`,
      interface: (n) => `Defines the structure for ${this.humanizeName(n)}.`,
      type: (n) => `Type definition for ${this.humanizeName(n)}.`,
      enum: (n) => `Enumeration of ${this.humanizeName(n)} values.`
    };

    return descriptions[type]?.(name) || `Documentation for ${name}.`;
  }

  /**
   * Humanizes function/class names
   */
  private humanizeName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .toLowerCase();
  }

  /**
   * Generates parameter documentation
   */
  private generateParameterDoc(param: ParameterInfo): ParameterDoc {
    return {
      name: param.name,
      type: param.type,
      description: `The ${param.name} parameter.`,
      optional: param.optional,
      defaultValue: param.defaultValue
    };
  }

  /**
   * Generates return documentation
   */
  private generateReturnDoc(element: CodeElement): ReturnDoc {
    return {
      type: element.returnType,
      description: `Returns the result of ${this.humanizeName(element.name)}.`
    };
  }

  /**
   * Generates example code
   */
  private generateExamples(element: CodeElement): string[] {
    const examples: string[] = [];

    if (element.type === 'function' || element.type === 'method') {
      const params = element.parameters?.map(p => p.name).join(', ') || '';
      examples.push(`${element.name}(${params});`);
    }

    if (element.type === 'class') {
      examples.push(`const instance = new ${element.name}();`);
    }

    return examples;
  }

  /**
   * Generates additional tags
   */
  private generateTags(element: CodeElement): Record<string, string> {
    const tags: Record<string, string> = {};

    if (element.type === 'class') {
      tags.category = 'class';
    }

    if (element.parameters && element.parameters.length > 0) {
      tags.paramCount = element.parameters.length.toString();
    }

    return tags;
  }

  /**
   * Groups documentation by type
   */
  private groupByType(docs: GeneratedDocumentation[]): Record<CodeElementType, number> {
    return docs.reduce((acc, doc) => {
      acc[doc.element.type] = (acc[doc.element.type] || 0) + 1;
      return acc;
    }, {} as Record<CodeElementType, number>);
  }
}

// Internal code element representation
interface CodeElement {
  name: string;
  type: CodeElementType;
  signature: string;
  line: number;
  parameters?: ParameterInfo[];
  returnType?: string;
}

interface ParameterInfo {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
}

/**
 * Standalone function to generate documentation
 */
export async function generateDocumentation(
  code: string,
  style: DocumentationStyle = 'jsdoc',
  language: string = 'typescript'
): Promise<GeneratedDocumentation[]> {
  const generator = new InlineDocumentationGenerator();
  const context: AgentToolExecutionContext = {
    taskId: `doc-${Date.now()}`,
    agentId: 'documentation-generator',
    parameters: {
      action: 'generate',
      code,
      style,
      language
    }
  };

  const result = await generator.execute(context);
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate documentation');
  }

  return result.data?.documentation || [];
}

