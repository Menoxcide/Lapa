/**
 * Code Smell Detection Agent for LAPA v1.0
 * 
 * Detects code smells and anti-patterns in codebases.
 * Extends review agent capabilities with automated pattern detection.
 * 
 * Features:
 * - Pattern-based code smell detection
 * - Severity scoring and categorization
 * - Fix suggestions with examples
 * - Integration with review workflow
 * - Learning from past detections
 */

import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { performance } from 'perf_hooks';

// Code smell types
export type CodeSmellType =
  | 'long-method'
  | 'long-parameter-list'
  | 'duplicate-code'
  | 'magic-numbers'
  | 'god-class'
  | 'feature-envy'
  | 'data-clumps'
  | 'primitive-obsession'
  | 'switch-statements'
  | 'comments'
  | 'dead-code'
  | 'speculative-generality'
  | 'lazy-class'
  | 'message-chains'
  | 'middle-man'
  | 'inappropriate-intimacy'
  | 'alternative-classes'
  | 'refused-bequest'
  | 'temporary-field'
  | 'long-class';

// Severity levels
export type SmellSeverity = 'low' | 'medium' | 'high' | 'critical';

// Code smell detection result
export interface CodeSmell {
  type: CodeSmellType;
  severity: SmellSeverity;
  location: {
    file: string;
    line: number;
    column?: number;
    function?: string;
    class?: string;
  };
  description: string;
  suggestion: string;
  example?: {
    before: string;
    after: string;
  };
  confidence: number; // 0-1
}

// Detection options
export interface CodeSmellDetectionOptions {
  filePath?: string;
  code?: string;
  language?: string;
  severityThreshold?: SmellSeverity;
  types?: CodeSmellType[];
}

/**
 * Code Smell Detection Agent
 */
export class CodeSmellDetector extends BaseAgentTool {
  private memoriEngine?: MemoriEngine;
  private detectionPatterns: Map<CodeSmellType, DetectionPattern> = new Map();

  constructor(memoriEngine?: MemoriEngine) {
    super(
      'code-smell-detector',
      'quality',
      'Detects code smells and anti-patterns in code',
      '1.0.0'
    );
    this.memoriEngine = memoriEngine;
    this.initializePatterns();
  }

  /**
   * Initializes detection patterns
   */
  private initializePatterns(): void {
    // Long Method
    this.detectionPatterns.set('long-method', {
      type: 'long-method',
      severity: 'medium',
      detect: (code: string, language: string) => {
        const lines = code.split('\n').length;
        const complexity = this.calculateComplexity(code);
        return lines > 50 || complexity > 10;
      },
      description: 'Method is too long (typically > 50 lines or high complexity)',
      suggestion: 'Extract smaller methods with single responsibilities'
    });

    // Long Parameter List
    this.detectionPatterns.set('long-parameter-list', {
      type: 'long-parameter-list',
      severity: 'medium',
      detect: (code: string, language: string) => {
        const paramMatches = code.match(/\(([^)]+)\)/);
        if (!paramMatches) return false;
        const params = paramMatches[1].split(',').filter(p => p.trim());
        return params.length > 5;
      },
      description: 'Function has too many parameters (> 5)',
      suggestion: 'Use parameter objects or builder pattern'
    });

    // Magic Numbers
    this.detectionPatterns.set('magic-numbers', {
      type: 'magic-numbers',
      severity: 'low',
      detect: (code: string, language: string) => {
        // Match numeric literals that aren't 0, 1, or -1
        const magicNumberRegex = /\b([2-9]|\d{2,})\b/g;
        const matches = code.match(magicNumberRegex);
        return !!(matches && matches.length > 3);
      },
      description: 'Code contains magic numbers without named constants',
      suggestion: 'Replace with named constants or configuration values'
    });

    // Duplicate Code
    this.detectionPatterns.set('duplicate-code', {
      type: 'duplicate-code',
      severity: 'high',
      detect: (code: string, language: string) => {
        const lines = code.split('\n');
        const seen = new Set<string>();
        let duplicates = 0;
        
        for (let i = 0; i < lines.length - 3; i++) {
          const block = lines.slice(i, i + 3).join('\n').trim();
          if (block.length > 20 && seen.has(block)) {
            duplicates++;
          }
          seen.add(block);
        }
        
        return duplicates > 2;
      },
      description: 'Code contains duplicated blocks',
      suggestion: 'Extract common code into reusable functions or classes'
    });

    // God Class
    this.detectionPatterns.set('god-class', {
      type: 'god-class',
      severity: 'high',
      detect: (code: string, language: string) => {
        const lines = code.split('\n').length;
        const methodCount = (code.match(/(?:function|method|def)\s+\w+/gi) || []).length;
        const fieldCount = (code.match(/(?:private|public|protected)\s+\w+/gi) || []).length;
        return lines > 500 || methodCount > 20 || fieldCount > 15;
      },
      description: 'Class is too large and handles too many responsibilities',
      suggestion: 'Split into smaller, focused classes following Single Responsibility Principle'
    });

    // Dead Code
    this.detectionPatterns.set('dead-code', {
      type: 'dead-code',
      severity: 'low',
      detect: (code: string, language: string) => {
        // Check for commented-out code blocks
        const commentedBlocks = code.match(/\/\*[\s\S]{50,}\*\//g);
        return !!(commentedBlocks && commentedBlocks.length > 2);
      },
      description: 'Code contains commented-out or unused code',
      suggestion: 'Remove dead code or use version control for history'
    });

    // Switch Statements (code smell when too many cases)
    this.detectionPatterns.set('switch-statements', {
      type: 'switch-statements',
      severity: 'medium',
      detect: (code: string, language: string) => {
        const switchMatches = code.match(/switch\s*\([^)]+\)\s*\{[\s\S]{0,500}\}/g);
        if (!switchMatches) return false;
        return switchMatches.some(block => {
          const cases = (block.match(/case\s+/g) || []).length;
          return cases > 5;
        });
      },
      description: 'Switch statement with many cases suggests polymorphism needed',
      suggestion: 'Consider using polymorphism, strategy pattern, or lookup tables'
    });

    // Feature Envy
    this.detectionPatterns.set('feature-envy', {
      type: 'feature-envy',
      severity: 'medium',
      detect: (code: string, language: string) => {
        // Method accesses more external class members than its own
        const externalAccess = (code.match(/this\.\w+\.\w+/g) || []).length;
        const selfAccess = (code.match(/this\.\w+(?!\.)/g) || []).length;
        return externalAccess > selfAccess * 2 && externalAccess > 3;
      },
      description: 'Method accesses more data from other classes than its own',
      suggestion: 'Move method to the class it most frequently accesses'
    });

    // Primitive Obsession
    this.detectionPatterns.set('primitive-obsession', {
      type: 'primitive-obsession',
      severity: 'low',
      detect: (code: string, language: string) => {
        // Multiple primitive parameters that could be an object
        const functionParams = code.match(/function\s+\w+\s*\(([^)]+)\)/g);
        if (!functionParams) return false;
        return functionParams.some(params => {
          const paramList = params.match(/\(([^)]+)\)/)?.[1];
          if (!paramList) return false;
          const primitives = paramList.split(',').filter(p => 
            /^\s*(string|number|boolean|int|float)\s+\w+/i.test(p.trim())
          );
          return primitives.length > 4;
        });
      },
      description: 'Using primitives instead of small objects for domain concepts',
      suggestion: 'Create value objects to represent domain concepts'
    });

    // Comments (too many comments can indicate unclear code)
    this.detectionPatterns.set('comments', {
      type: 'comments',
      severity: 'low',
      detect: (code: string, language: string) => {
        const commentLines = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
        const totalLines = code.split('\n').length;
        return commentLines > totalLines * 0.3; // More than 30% comments
      },
      description: 'Excessive comments may indicate unclear code',
      suggestion: 'Improve code clarity so comments become unnecessary'
    });
  }

  /**
   * Calculates cyclomatic complexity
   */
  private calculateComplexity(code: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPoints = [
      /if\s*\(/gi,
      /else\s+if\s*\(/gi,
      /switch\s*\(/gi,
      /case\s+/gi,
      /catch\s*\(/gi,
      /while\s*\(/gi,
      /for\s*\(/gi,
      /\?\s*.*\s*:/g, // Ternary operators
      /&&|\|\|/g // Logical operators
    ];

    for (const pattern of decisionPoints) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    if (!params.action || typeof params.action !== 'string') {
      return false;
    }

    if (params.action === 'detect') {
      return params.code || params.filePath;
    }

    return false;
  }

  /**
   * Executes code smell detection
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();

    try {
      const action = context.parameters.action as string;

      if (action === 'detect') {
        return await this.detectSmells(context, startTime);
      }

      return {
        success: false,
        error: `Unknown action: ${action}. Supported: detect`,
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
   * Detects code smells in code
   */
  private async detectSmells(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const code = context.parameters.code as string | undefined;
    const filePath = context.parameters.filePath as string | undefined;
    const language = (context.parameters.language as string) || 'typescript';
    const severityThreshold = context.parameters.severityThreshold as SmellSeverity | undefined;
    const types = context.parameters.types as CodeSmellType[] | undefined;

    if (!code && !filePath) {
      return {
        success: false,
        error: 'Either code or filePath must be provided',
        executionTime: performance.now() - startTime
      };
    }

    // For now, we'll work with code directly
    // In production, would read from filePath if provided
    const codeContent = code || '';

    const detectedSmells: CodeSmell[] = [];

    // Run detection patterns
    for (const [smellType, pattern] of this.detectionPatterns.entries()) {
      // Filter by requested types
      if (types && !types.includes(smellType)) {
        continue;
      }

      // Check severity threshold
      if (severityThreshold && !this.meetsSeverityThreshold(pattern.severity, severityThreshold)) {
        continue;
      }

      try {
        const detected = pattern.detect(codeContent, language);
        if (detected) {
          const smell: CodeSmell = {
            type: smellType,
            severity: pattern.severity,
            location: {
              file: filePath || 'unknown',
              line: this.findLineNumber(codeContent, smellType),
              function: this.findFunctionName(codeContent)
            },
            description: pattern.description,
            suggestion: pattern.suggestion,
            confidence: this.calculateConfidence(smellType, codeContent, language),
            example: this.generateExample(smellType)
          };

          detectedSmells.push(smell);
        }
      } catch (error) {
        // Continue with other patterns if one fails
        console.warn(`Pattern detection failed for ${smellType}:`, error);
      }
    }

    // Sort by severity and confidence
    detectedSmells.sort((a, b) => {
      const severityOrder: Record<SmellSeverity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    // Store in memory for learning
    if (this.memoriEngine && detectedSmells.length > 0) {
      await this.storeDetections(detectedSmells, filePath || 'unknown');
    }

    // Publish event
    await this.publishEvent('code-smell.detected', {
      count: detectedSmells.length,
      filePath: filePath || 'unknown',
      taskId: context.taskId
    });

    return {
      success: true,
      data: {
        smells: detectedSmells,
        summary: {
          total: detectedSmells.length,
          bySeverity: this.groupBySeverity(detectedSmells),
          byType: this.groupByType(detectedSmells)
        }
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Checks if severity meets threshold
   */
  private meetsSeverityThreshold(severity: SmellSeverity, threshold: SmellSeverity): boolean {
    const order: SmellSeverity[] = ['low', 'medium', 'high', 'critical'];
    return order.indexOf(severity) >= order.indexOf(threshold);
  }

  /**
   * Finds line number for smell (simplified)
   */
  private findLineNumber(code: string, smellType: CodeSmellType): number {
    // Simplified: find first occurrence of pattern
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (this.detectionPatterns.get(smellType)?.detect(lines[i], 'typescript')) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Finds function name containing smell
   */
  private findFunctionName(code: string): string | undefined {
    const match = code.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
    return match?.[1];
  }

  /**
   * Calculates detection confidence
   */
  private calculateConfidence(smellType: CodeSmellType, code: string, language: string): number {
    // Base confidence based on pattern match strength
    let confidence = 0.7;

    // Adjust based on code characteristics
    const pattern = this.detectionPatterns.get(smellType);
    if (pattern) {
      // More complex patterns = higher confidence
      if (code.length > 500) confidence += 0.1;
      if (code.split('\n').length > 50) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generates example fix
   */
  private generateExample(smellType: CodeSmellType): { before: string; after: string } | undefined {
    const examples: Record<CodeSmellType, { before: string; after: string }> = {
      'long-method': {
        before: 'function processOrder(order) { /* 100 lines */ }',
        after: 'function processOrder(order) {\n  validateOrder(order);\n  calculateTotal(order);\n  processPayment(order);\n}'
      },
      'long-parameter-list': {
        before: 'function createUser(name, email, age, city, country, phone, role) {}',
        after: 'function createUser(userData: UserData) {}'
      },
      'magic-numbers': {
        before: 'if (status === 2) { /* ... */ }',
        after: 'const ACTIVE_STATUS = 2;\nif (status === ACTIVE_STATUS) { /* ... */ }'
      },
      'duplicate-code': {
        before: '// Same code block repeated 3 times',
        after: '// Extract to: function processItem(item) { /* ... */ }'
      },
      'god-class': {
        before: 'class UserManager { /* 500 lines, 20 methods */ }',
        after: 'class UserValidator { }\nclass UserRepository { }\nclass UserService { }'
      },
      'dead-code': {
        before: '/* oldFunction(); */',
        after: '// Removed dead code'
      },
      'switch-statements': {
        before: 'switch(type) { case 1: ... case 10: ... }',
        after: 'const handlers = { type1: handler1, type2: handler2 };'
      },
      'feature-envy': {
        before: 'class Order { calculateTotal() { return this.cart.items.reduce(...) } }',
        after: 'class Cart { calculateTotal() { return this.items.reduce(...) } }'
      },
      'primitive-obsession': {
        before: 'function createUser(name: string, email: string, age: number) {}',
        after: 'function createUser(user: User) {}'
      },
      'comments': {
        before: '// This function does X\n// Then it does Y\nfunction doSomething() {}',
        after: 'function doSomething() { doX(); doY(); }'
      },
      'data-clumps': {
        before: '// Multiple parameters always used together',
        after: '// Extract to: class Address { }'
      },
      'speculative-generality': {
        before: '// Over-engineered for current needs',
        after: '// Simplify to current requirements'
      },
      'lazy-class': {
        before: '// Class does very little',
        after: '// Merge into related class'
      },
      'message-chains': {
        before: 'obj.getA().getB().getC().getValue()',
        after: 'obj.getValue() // Delegate method'
      },
      'middle-man': {
        before: '// Class only delegates',
        after: '// Remove and call directly'
      },
      'inappropriate-intimacy': {
        before: '// Classes access private members',
        after: '// Extract common interface'
      },
      'alternative-classes': {
        before: '// Two classes do same thing',
        after: '// Merge or differentiate'
      },
      'refused-bequest': {
        before: '// Subclass ignores parent methods',
        after: '// Use composition instead'
      },
      'temporary-field': {
        before: '// Field only used sometimes',
        after: '// Extract to parameter object'
      },
      'long-class': {
        before: '// Class too long',
        after: '// Split into smaller classes'
      }
    };

    return examples[smellType];
  }

  /**
   * Groups smells by severity
   */
  private groupBySeverity(smells: CodeSmell[]): Record<SmellSeverity, number> {
    return smells.reduce((acc, smell) => {
      acc[smell.severity] = (acc[smell.severity] || 0) + 1;
      return acc;
    }, {} as Record<SmellSeverity, number>);
  }

  /**
   * Groups smells by type
   */
  private groupByType(smells: CodeSmell[]): Record<CodeSmellType, number> {
    return smells.reduce((acc, smell) => {
      acc[smell.type] = (acc[smell.type] || 0) + 1;
      return acc;
    }, {} as Record<CodeSmellType, number>);
  }

  /**
   * Stores detections in memory
   */
  private async storeDetections(smells: CodeSmell[], filePath: string): Promise<void> {
    if (!this.memoriEngine) return;

    try {
      for (const smell of smells) {
        await this.memoriEngine.store({
          id: `smell-${Date.now()}-${Math.random()}`,
          type: 'code-smell',
          content: JSON.stringify(smell),
          metadata: {
            smellType: smell.type,
            severity: smell.severity,
            filePath
          }
        });
      }
    } catch (error) {
      console.warn('Failed to store code smell detections:', error);
    }
  }
}

// Detection pattern interface
interface DetectionPattern {
  type: CodeSmellType;
  severity: SmellSeverity;
  detect: (code: string, language: string) => boolean;
  description: string;
  suggestion: string;
}

