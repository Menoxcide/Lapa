/**
 * Error Explanation Agent (DebugSage) for LAPA v1.0
 * 
 * Dedicated agent that explains errors in plain language with fix suggestions.
 * Analyzes error messages, stack traces, and code context to provide clear,
 * actionable explanations and solutions.
 * 
 * Features:
 * - Plain language error explanations
 * - Fix suggestions with code examples
 * - Error pattern recognition and learning
 * - Integration with memory engine for error history
 * - Support for multiple error types (TypeScript, Python, JavaScript, etc.)
 */

import { Agent, Task } from './moe-router.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { eventBus } from '../core/event-bus.js';
import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { performance } from 'perf_hooks';

// Error types
export type ErrorCategory =
  | 'syntax'
  | 'type'
  | 'runtime'
  | 'logic'
  | 'import'
  | 'permission'
  | 'network'
  | 'unknown';

// Error explanation result
export interface ErrorExplanation {
  errorMessage: string;
  category: ErrorCategory;
  plainLanguageExplanation: string;
  rootCause: string;
  fixSuggestions: FixSuggestion[];
  codeExamples?: CodeExample[];
  relatedErrors?: string[]; // IDs of similar errors
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Fix suggestion
export interface FixSuggestion {
  title: string;
  description: string;
  codeFix?: string;
  steps: string[];
  confidence: number; // 0-1
}

// Code example
export interface CodeExample {
  before: string;
  after: string;
  explanation: string;
}

// Error context
export interface ErrorContext {
  errorMessage: string;
  stackTrace?: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  language?: string;
  projectType?: string;
}

/**
 * Error Explanation Agent (DebugSage)
 * 
 * Explains errors in plain language and provides fix suggestions
 */
export class ErrorExplainerAgent implements Agent {
  id: string;
  type: 'error-explainer' = 'error-explainer' as any;
  name: string = 'DebugSage';
  expertise: string[] = [
    'error-analysis',
    'debugging',
    'error-explanation',
    'fix-suggestions',
    'typescript',
    'javascript',
    'python',
    'runtime-errors',
    'syntax-errors',
    'type-errors'
  ];
  workload: number = 0;
  capacity: number = 10;

  private memoriEngine: MemoriEngine;
  private errorPatterns: Map<string, ErrorExplanation> = new Map();

  constructor(memoriEngine: MemoriEngine) {
    this.id = `error-explainer-${Date.now()}`;
    this.memoriEngine = memoriEngine;
  }

  /**
   * Executes error explanation task
   */
  async execute(task: Task): Promise<{ success: boolean; result: any; error?: string }> {
    this.workload++;
    
    try {
      const errorContext = task.context as ErrorContext;
      
      if (!errorContext || !errorContext.errorMessage) {
        return {
          success: false,
          result: null,
          error: 'Missing error context or error message'
        };
      }

      // Analyze and explain the error
      const explanation = await this.explainError(errorContext);

      // Store error pattern for learning
      await this.storeErrorPattern(errorContext, explanation);

      // Publish event
      await eventBus.publish({
        id: `error_explained_${Date.now()}`,
        type: 'error.explained',
        timestamp: Date.now(),
        source: 'error-explainer',
        payload: {
          taskId: task.id,
          errorMessage: errorContext.errorMessage,
          category: explanation.category,
          severity: explanation.severity
        }
      });

      this.workload--;
      
      return {
        success: true,
        result: explanation
      };
    } catch (error) {
      this.workload--;
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Explains an error in plain language
   */
  async explainError(context: ErrorContext): Promise<ErrorExplanation> {
    // Check for known error patterns
    const knownPattern = this.findKnownPattern(context.errorMessage);
    if (knownPattern) {
      return knownPattern;
    }

    // Analyze error message
    const category = this.categorizeError(context);
    const explanation = this.generateExplanation(context, category);
    const fixSuggestions = this.generateFixSuggestions(context, category);
    const severity = this.assessSeverity(context, category);

    return {
      errorMessage: context.errorMessage,
      category,
      plainLanguageExplanation: explanation,
      rootCause: this.identifyRootCause(context, category),
      fixSuggestions,
      codeExamples: this.generateCodeExamples(context, category),
      confidence: this.calculateConfidence(context, category),
      severity
    };
  }

  /**
   * Categorizes error type
   */
  private categorizeError(context: ErrorContext): ErrorCategory {
    const message = context.errorMessage.toLowerCase();
    const stackTrace = context.stackTrace?.toLowerCase() || '';

    // Syntax errors
    if (message.includes('syntax') || message.includes('unexpected token') || 
        message.includes('parse error') || message.includes('unexpected')) {
      return 'syntax';
    }

    // Type errors
    if (message.includes('type') && (message.includes('error') || message.includes('not assignable') ||
        message.includes('cannot find') || message.includes('does not exist'))) {
      return 'type';
    }

    // Import errors
    if (message.includes('cannot find module') || message.includes('module not found') ||
        message.includes('import') || message.includes('require') ||
        message.includes('cannot resolve')) {
      return 'import';
    }

    // Runtime errors
    if (message.includes('runtime') || message.includes('undefined is not') ||
        message.includes('null is not') || message.includes('cannot read property') ||
        message.includes('cannot read') || message.includes('is not a function')) {
      return 'runtime';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('access denied') ||
        message.includes('eacces') || message.includes('enoent')) {
      return 'permission';
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout') ||
        message.includes('connection') || message.includes('fetch failed')) {
      return 'network';
    }

    // Logic errors (often indicated by stack trace patterns)
    if (stackTrace.includes('at ') && !message.includes('error')) {
      return 'logic';
    }

    return 'unknown';
  }

  /**
   * Generates plain language explanation
   */
  private generateExplanation(context: ErrorContext, category: ErrorCategory): string {
    const message = context.errorMessage;
    const language = context.language || 'unknown';

    switch (category) {
      case 'syntax':
        return `There's a syntax error in your ${language} code. This means the code doesn't follow the correct structure or format that ${language} expects. The error message indicates: "${message}". Check for missing brackets, parentheses, semicolons, or incorrect keyword usage.`;

      case 'type':
        return `A type error occurred. This means you're trying to use a value in a way that doesn't match its expected type. The error "${message}" suggests there's a mismatch between what the code expects and what you're providing.`;

      case 'runtime':
        return `A runtime error happened while your code was executing. The error "${message}" indicates that something went wrong when the program tried to perform an operation. This often happens when trying to access properties or methods that don't exist, or when values are undefined or null.`;

      case 'import':
        return `An import error occurred. The code is trying to use a module, package, or file that can't be found. The error "${message}" means the system couldn't locate the required dependency. This could be because the package isn't installed, the path is incorrect, or the file doesn't exist.`;

      case 'permission':
        return `A permission error occurred. The error "${message}" indicates that the program doesn't have the necessary permissions to perform an operation, such as reading or writing a file, or accessing a resource.`;

      case 'network':
        return `A network error occurred. The error "${message}" suggests there was a problem connecting to a remote server or service. This could be due to network connectivity issues, server being down, or timeout problems.`;

      case 'logic':
        return `A logic error was detected. While the code may run without crashing, it's not producing the expected results. The error "${message}" suggests there might be an issue with the program's logic or flow.`;

      default:
        return `An error occurred: "${message}". This error doesn't match a common pattern, but it indicates something went wrong in your code. Review the error message and the code around line ${context.lineNumber || 'unknown'} for clues.`;
    }
  }

  /**
   * Identifies root cause
   */
  private identifyRootCause(context: ErrorContext, category: ErrorCategory): string {
    const message = context.errorMessage.toLowerCase();

    switch (category) {
      case 'syntax':
        if (message.includes('unexpected token')) {
          return 'Unexpected token in code - likely missing or extra punctuation';
        }
        if (message.includes('missing')) {
          return 'Missing required syntax element (bracket, parenthesis, etc.)';
        }
        return 'Invalid syntax structure';

      case 'type':
        if (message.includes('not assignable')) {
          return 'Type mismatch - value type doesn\'t match expected type';
        }
        if (message.includes('cannot find')) {
          return 'Type or symbol not found - may be undefined or not imported';
        }
        return 'Type system violation';

      case 'runtime':
        if (message.includes('undefined') || message.includes('null')) {
          return 'Accessing property or method on undefined/null value';
        }
        if (message.includes('is not a function')) {
          return 'Calling something that isn\'t a function';
        }
        return 'Runtime operation failure';

      case 'import':
        if (message.includes('cannot find module')) {
          return 'Module not installed or path incorrect';
        }
        return 'Import resolution failure';

      default:
        return 'Unknown root cause - requires further investigation';
    }
  }

  /**
   * Generates fix suggestions
   */
  private generateFixSuggestions(context: ErrorContext, category: ErrorCategory): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const message = context.errorMessage.toLowerCase();
    const codeSnippet = context.codeSnippet || '';

    switch (category) {
      case 'syntax':
        suggestions.push({
          title: 'Check for missing brackets or parentheses',
          description: 'Syntax errors often occur due to mismatched or missing brackets, parentheses, or braces.',
          steps: [
            'Count opening and closing brackets/parentheses',
            'Check for missing semicolons (if required by language)',
            'Verify all strings are properly closed',
            'Check for typos in keywords'
          ],
          confidence: 0.8
        });

        if (message.includes('unexpected token')) {
          suggestions.push({
            title: 'Remove or fix unexpected token',
            description: 'An unexpected token was found. Check the character before the error location.',
            codeFix: this.suggestSyntaxFix(codeSnippet, context.lineNumber),
            steps: [
              'Locate the unexpected token in the error message',
              'Check the code before and after that location',
              'Remove or correct the unexpected character'
            ],
            confidence: 0.7
          });
        }
        break;

      case 'type':
        suggestions.push({
          title: 'Check variable types',
          description: 'Ensure variables match their expected types.',
          steps: [
            'Verify the type of the variable causing the error',
            'Check if type casting is needed',
            'Ensure imports are correct',
            'Check TypeScript/type definitions if applicable'
          ],
          confidence: 0.8
        });

        if (message.includes('cannot find')) {
          suggestions.push({
            title: 'Verify symbol exists and is imported',
            description: 'The symbol may not be defined or imported correctly.',
            steps: [
              'Check if the symbol is defined in the current file',
              'Verify imports are correct',
              'Check if the package/module is installed',
              'Verify spelling and capitalization'
            ],
            confidence: 0.9
          });
        }
        break;

      case 'runtime':
        suggestions.push({
          title: 'Add null/undefined checks',
          description: 'Add checks before accessing properties or methods.',
          codeFix: this.suggestNullCheckFix(codeSnippet),
          steps: [
            'Identify where undefined/null values might occur',
            'Add optional chaining (?.) or null checks',
            'Provide default values where appropriate',
            'Initialize variables before use'
          ],
          confidence: 0.85
        });

        if (message.includes('is not a function')) {
          suggestions.push({
            title: 'Verify function exists and is callable',
            description: 'Ensure you\'re calling a function, not a property.',
            steps: [
              'Check if the name is spelled correctly',
              'Verify it\'s actually a function, not a property',
              'Check if the function is imported correctly',
              'Ensure the object/class has this method'
            ],
            confidence: 0.9
          });
        }
        break;

      case 'import':
        suggestions.push({
          title: 'Install missing package',
          description: 'The required package may not be installed.',
          steps: [
            'Check package.json or requirements.txt',
            'Run install command (npm install, pip install, etc.)',
            'Verify package name is correct',
            'Check if package is in the correct location'
          ],
          confidence: 0.9
        });

        suggestions.push({
          title: 'Check import path',
          description: 'The import path may be incorrect.',
          steps: [
            'Verify the file/module exists at the specified path',
            'Check relative vs absolute paths',
            'Verify file extensions if required',
            'Check case sensitivity'
          ],
          confidence: 0.8
        });
        break;

      case 'permission':
        suggestions.push({
          title: 'Check file permissions',
          description: 'Ensure the program has necessary permissions.',
          steps: [
            'Check file/directory permissions',
            'Run with appropriate user permissions if needed',
            'Verify file exists and is accessible',
            'Check if file is locked by another process'
          ],
          confidence: 0.85
        });
        break;

      case 'network':
        suggestions.push({
          title: 'Check network connectivity',
          description: 'Verify network connection and server availability.',
          steps: [
            'Check internet connection',
            'Verify server is running and accessible',
            'Check firewall settings',
            'Verify URL/endpoint is correct',
            'Check timeout settings'
          ],
          confidence: 0.8
        });
        break;
    }

    // Always add a general debugging suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        title: 'General debugging steps',
        description: 'Follow these steps to debug the error.',
        steps: [
          'Read the error message carefully',
          'Check the line number mentioned in the error',
          'Review the code around that line',
          'Check for similar errors in the codebase',
          'Search for the error message online'
        ],
        confidence: 0.6
      });
    }

    return suggestions;
  }

  /**
   * Generates code examples
   */
  private generateCodeExamples(context: ErrorContext, category: ErrorCategory): CodeExample[] {
    const examples: CodeExample[] = [];

    switch (category) {
      case 'runtime':
        examples.push({
          before: `const user = getUser();
console.log(user.name); // Error if user is null/undefined`,
          after: `const user = getUser();
console.log(user?.name); // Safe with optional chaining
// OR
if (user) {
  console.log(user.name);
}`,
          explanation: 'Use optional chaining (?.) or null checks to safely access properties.'
        });
        break;

      case 'type':
        examples.push({
          before: `function add(a: number, b: string) {
  return a + b; // Type error
}`,
          after: `function add(a: number, b: number) {
  return a + b; // Correct types
}`,
          explanation: 'Ensure function parameters match their expected types.'
        });
        break;

      case 'import':
        examples.push({
          before: `import { Component } from './Component'; // Error if file doesn't exist`,
          after: `import { Component } from './components/Component'; // Correct path
// OR
import { Component } from './Component.js'; // With extension if needed`,
          explanation: 'Verify the import path is correct and the file exists.'
        });
        break;
    }

    return examples;
  }

  /**
   * Assesses error severity
   */
  private assessSeverity(context: ErrorContext, category: ErrorCategory): 'low' | 'medium' | 'high' | 'critical' {
    const message = context.errorMessage.toLowerCase();

    // Critical: Prevents compilation/execution
    if (category === 'syntax' || (category === 'import' && message.includes('cannot find'))) {
      return 'critical';
    }

    // High: Breaks functionality
    if (category === 'runtime' || category === 'type') {
      return 'high';
    }

    // Medium: May cause issues
    if (category === 'permission' || category === 'network') {
      return 'medium';
    }

    // Low: Logic errors or unknown
    return 'low';
  }

  /**
   * Calculates confidence in explanation
   */
  private calculateConfidence(context: ErrorContext, category: ErrorCategory): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more context
    if (context.stackTrace) confidence += 0.2;
    if (context.codeSnippet) confidence += 0.15;
    if (context.filePath) confidence += 0.1;
    if (context.lineNumber) confidence += 0.05;

    // Known categories have higher confidence
    if (category !== 'unknown') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Suggests syntax fix
   */
  private suggestSyntaxFix(codeSnippet: string, lineNumber?: number): string | undefined {
    if (!codeSnippet) return undefined;

    // Simple suggestions based on common patterns
    if (codeSnippet.includes('function') && !codeSnippet.includes('{')) {
      return codeSnippet.replace(/function\s+\w+\s*\([^)]*\)\s*$/, (match) => match + ' {');
    }

    return undefined;
  }

  /**
   * Suggests null check fix
   */
  private suggestNullCheckFix(codeSnippet: string): string | undefined {
    if (!codeSnippet) return undefined;

    // Simple pattern matching for common null access patterns
    const patterns = [
      { pattern: /(\w+)\.(\w+)/g, replacement: '$1?.$2' },
      { pattern: /(\w+)\[(\w+)\]/g, replacement: '$1?.[$2]' }
    ];

    for (const { pattern, replacement } of patterns) {
      if (pattern.test(codeSnippet)) {
        return codeSnippet.replace(pattern, replacement);
      }
    }

    return undefined;
  }

  /**
   * Finds known error pattern
   */
  private findKnownPattern(errorMessage: string): ErrorExplanation | null {
    // Check cache
    for (const [pattern, explanation] of this.errorPatterns.entries()) {
      if (errorMessage.includes(pattern) || pattern.includes(errorMessage.substring(0, 50))) {
        return explanation;
      }
    }

    return null;
  }

  /**
   * Stores error pattern for learning
   */
  private async storeErrorPattern(context: ErrorContext, explanation: ErrorExplanation): Promise<void> {
    // Store in cache
    const patternKey = context.errorMessage.substring(0, 100);
    this.errorPatterns.set(patternKey, explanation);

    // Store in memory engine
    await this.memoriEngine.extractAndStoreEntities(
      'error-explainer',
      { id: `error-${Date.now()}` } as any,
      JSON.stringify({
        error: context.errorMessage,
        category: explanation.category,
        explanation: explanation.plainLanguageExplanation
      })
    );
  }
}

/**
 * Error Explanation Tool
 * 
 * Agent tool wrapper for error explanation functionality
 */
export class ErrorExplanationTool extends BaseAgentTool {
  private errorExplainer: ErrorExplainerAgent;

  constructor(memoriEngine: MemoriEngine) {
    super(
      'error-explanation',
      'debugging',
      'Explains errors in plain language with fix suggestions',
      '1.0.0'
    );
    this.errorExplainer = new ErrorExplainerAgent(memoriEngine);
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    return params.errorMessage && typeof params.errorMessage === 'string';
  }

  /**
   * Executes error explanation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();

    try {
      const errorContext: ErrorContext = {
        errorMessage: context.parameters.errorMessage as string,
        stackTrace: context.parameters.stackTrace as string | undefined,
        filePath: context.parameters.filePath as string | undefined,
        lineNumber: context.parameters.lineNumber as number | undefined,
        codeSnippet: context.parameters.codeSnippet as string | undefined,
        language: context.parameters.language as string | undefined,
        projectType: context.parameters.projectType as string | undefined
      };

      const task: Task = {
        id: context.taskId,
        description: `Explain error: ${errorContext.errorMessage}`,
        type: 'error-explanation',
        priority: 1,
        context: errorContext
      };

      const result = await this.errorExplainer.execute(task);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to explain error',
          executionTime: performance.now() - startTime
        };
      }

      // Publish event
      await this.publishEvent('error.explained', {
        taskId: context.taskId,
        agentId: context.agentId,
        errorMessage: errorContext.errorMessage,
        category: (result.result as ErrorExplanation).category
      });

      return {
        success: true,
        data: result.result,
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
}

