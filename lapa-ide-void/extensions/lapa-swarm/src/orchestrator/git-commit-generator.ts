/**
 * Automated Git Commit Message Generator for LAPA v1.0
 * 
 * This module generates meaningful commit messages from git diffs using AI.
 * Supports conventional commits format and analyzes code changes to create
 * descriptive, useful commit messages.
 * 
 * Features:
 * - Analyzes git diff and staged changes
 * - Generates conventional commit messages
 * - Supports multiple commit message formats
 * - Integrates with LAPA swarm agents
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { performance } from 'perf_hooks';

const execAsync = promisify(exec);

// Commit message format options
export type CommitMessageFormat = 
  | 'conventional'  // feat: add user authentication
  | 'descriptive'   // Add user authentication with JWT tokens
  | 'detailed';     // Add user authentication system with JWT tokens and refresh token support

// Git diff analysis result
export interface GitDiffAnalysis {
  filesChanged: number;
  insertions: number;
  deletions: number;
  fileTypes: string[];
  changeTypes: string[]; // 'feature', 'fix', 'refactor', 'test', 'docs', etc.
  affectedModules: string[];
  summary: string;
}

// Commit message generation options
export interface CommitMessageOptions {
  format?: CommitMessageFormat;
  includeBody?: boolean;
  maxLength?: number;
  useConventionalCommits?: boolean;
  scope?: string; // Optional scope for conventional commits
}

// Commit message result
export interface CommitMessageResult {
  subject: string;
  body?: string;
  fullMessage: string;
  format: CommitMessageFormat;
  confidence: number; // 0-1 confidence score
}

/**
 * Git Commit Message Generator Tool
 * 
 * Generates meaningful commit messages from git changes
 */
export class GitCommitMessageGenerator extends BaseAgentTool {
  private defaultOptions: CommitMessageOptions = {
    format: 'conventional',
    includeBody: true,
    maxLength: 72,
    useConventionalCommits: true
  };

  constructor() {
    super(
      'git-commit-generator',
      'utility',
      'Generates meaningful commit messages from git diffs using AI analysis',
      '1.0.0'
    );
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    // Optional parameters, all are valid
    if (params.format && !['conventional', 'descriptive', 'detailed'].includes(params.format)) {
      return false;
    }
    if (params.maxLength && (typeof params.maxLength !== 'number' || params.maxLength < 10)) {
      return false;
    }
    return true;
  }

  /**
   * Executes the commit message generation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();
    
    try {
      const options: CommitMessageOptions = {
        ...this.defaultOptions,
        ...context.parameters
      };

      // Get git diff
      const diff = await this.getGitDiff();
      
      if (!diff || diff.trim().length === 0) {
        return {
          success: false,
          error: 'No changes detected. Please stage your changes first.',
          executionTime: performance.now() - startTime
        };
      }

      // Analyze the diff
      const analysis = await this.analyzeGitDiff(diff);
      
      // Generate commit message
      const commitMessage = await this.generateCommitMessage(analysis, options, context);
      
      // Publish event
      await this.publishEvent('git.commit.message.generated', {
        format: commitMessage.format,
        confidence: commitMessage.confidence,
        taskId: context.taskId,
        agentId: context.agentId
      });

      return {
        success: true,
        data: {
          commitMessage: commitMessage.fullMessage,
          subject: commitMessage.subject,
          body: commitMessage.body,
          analysis: {
            filesChanged: analysis.filesChanged,
            changeTypes: analysis.changeTypes,
            summary: analysis.summary
          },
          confidence: commitMessage.confidence
        },
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
   * Gets git diff for staged changes
   */
  private async getGitDiff(): Promise<string> {
    try {
      // Get staged changes
      const { stdout: stagedDiff } = await execAsync('git diff --cached');
      
      // If no staged changes, get unstaged changes
      if (!stagedDiff || stagedDiff.trim().length === 0) {
        const { stdout: unstagedDiff } = await execAsync('git diff');
        return unstagedDiff || '';
      }
      
      return stagedDiff;
    } catch (error) {
      // Not a git repository or git not available
      throw new Error(`Failed to get git diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets git status for additional context
   */
  private async getGitStatus(): Promise<string> {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      return stdout;
    } catch (error) {
      return '';
    }
  }

  /**
   * Analyzes git diff to extract meaningful information
   */
  private async analyzeGitDiff(diff: string): Promise<GitDiffAnalysis> {
    const lines = diff.split('\n');
    const fileTypes = new Set<string>();
    const changeTypes = new Set<string>();
    const affectedModules = new Set<string>();
    let insertions = 0;
    let deletions = 0;
    let filesChanged = 0;
    let currentFile = '';

    for (const line of lines) {
      // Track file changes
      if (line.startsWith('diff --git')) {
        filesChanged++;
        const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
          currentFile = match[2];
          const ext = currentFile.split('.').pop()?.toLowerCase() || '';
          if (ext) fileTypes.add(ext);
          
          // Extract module/package from path
          const pathParts = currentFile.split('/');
          if (pathParts.length > 1) {
            affectedModules.add(pathParts[0]);
          }
        }
      }
      
      // Track additions/deletions
      if (line.startsWith('+') && !line.startsWith('+++')) {
        insertions++;
        // Detect change types from code patterns
        this.detectChangeType(line, changeTypes);
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
        this.detectChangeType(line, changeTypes);
      }
    }

    // Generate summary
    const summary = this.generateSummary(filesChanged, insertions, deletions, Array.from(changeTypes), Array.from(fileTypes));

    return {
      filesChanged,
      insertions,
      deletions,
      fileTypes: Array.from(fileTypes),
      changeTypes: Array.from(changeTypes),
      affectedModules: Array.from(affectedModules),
      summary
    };
  }

  /**
   * Detects change type from code line
   */
  private detectChangeType(line: string, changeTypes: Set<string>): void {
    const lowerLine = line.toLowerCase();
    
    // Feature detection
    if (lowerLine.includes('function') || lowerLine.includes('class') || 
        lowerLine.includes('export') || lowerLine.includes('def ') || 
        lowerLine.includes('async')) {
      changeTypes.add('feature');
    }
    
    // Fix detection
    if (lowerLine.includes('fix') || lowerLine.includes('bug') || 
        lowerLine.includes('error') || lowerLine.includes('exception')) {
      changeTypes.add('fix');
    }
    
    // Refactor detection
    if (lowerLine.includes('refactor') || lowerLine.includes('cleanup') ||
        lowerLine.includes('optimize') || lowerLine.includes('improve')) {
      changeTypes.add('refactor');
    }
    
    // Test detection
    if (lowerLine.includes('test') || lowerLine.includes('spec') || 
        lowerLine.includes('it(') || lowerLine.includes('describe(')) {
      changeTypes.add('test');
    }
    
    // Documentation detection
    if (lowerLine.includes('readme') || lowerLine.includes('doc') || 
        lowerLine.includes('comment') || lowerLine.includes('@param')) {
      changeTypes.add('docs');
    }
    
    // Performance detection
    if (lowerLine.includes('performance') || lowerLine.includes('cache') ||
        lowerLine.includes('optimize') || lowerLine.includes('speed')) {
      changeTypes.add('perf');
    }
    
    // Style detection
    if (lowerLine.includes('format') || lowerLine.includes('style') ||
        lowerLine.includes('lint') || lowerLine.includes('prettier')) {
      changeTypes.add('style');
    }
  }

  /**
   * Generates a summary of changes
   */
  private generateSummary(
    filesChanged: number,
    insertions: number,
    deletions: number,
    changeTypes: string[],
    fileTypes: string[]
  ): string {
    const parts: string[] = [];
    
    if (changeTypes.length > 0) {
      parts.push(`Changes include: ${changeTypes.join(', ')}`);
    }
    
    if (fileTypes.length > 0) {
      parts.push(`File types: ${fileTypes.join(', ')}`);
    }
    
    parts.push(`${insertions} insertions, ${deletions} deletions across ${filesChanged} file(s)`);
    
    return parts.join('. ');
  }

  /**
   * Generates commit message using AI analysis
   */
  private async generateCommitMessage(
    analysis: GitDiffAnalysis,
    options: CommitMessageOptions,
    context: AgentToolExecutionContext
  ): Promise<CommitMessageResult> {
    // Determine primary change type for conventional commits
    const primaryType = this.determinePrimaryType(analysis.changeTypes);
    
    // Generate subject line
    const subject = await this.generateSubject(analysis, primaryType, options);
    
    // Generate body if requested
    let body: string | undefined;
    if (options.includeBody) {
      body = this.generateBody(analysis, options);
    }
    
    // Combine into full message
    const fullMessage = body ? `${subject}\n\n${body}` : subject;
    
    // Calculate confidence based on analysis quality
    const confidence = this.calculateConfidence(analysis);
    
    return {
      subject,
      body,
      fullMessage,
      format: options.format || 'conventional',
      confidence
    };
  }

  /**
   * Determines primary change type for conventional commits
   */
  private determinePrimaryType(changeTypes: string[]): string {
    // Priority order for conventional commits
    const priority = ['fix', 'feat', 'perf', 'refactor', 'test', 'docs', 'style'];
    
    for (const type of priority) {
      if (changeTypes.includes(type)) {
        return type === 'feat' ? 'feat' : type;
      }
    }
    
    // Default to 'feat' if no specific type detected
    return 'feat';
  }

  /**
   * Generates commit message subject line
   */
  private async generateSubject(
    analysis: GitDiffAnalysis,
    primaryType: string,
    options: CommitMessageOptions
  ): Promise<string> {
    let subject = '';
    
    if (options.useConventionalCommits && options.format === 'conventional') {
      // Conventional commit format: type(scope): description
      const scope = options.scope || this.inferScope(analysis.affectedModules);
      const description = this.generateDescription(analysis);
      
      subject = scope 
        ? `${primaryType}(${scope}): ${description}`
        : `${primaryType}: ${description}`;
    } else {
      // Descriptive format
      subject = this.generateDescription(analysis);
    }
    
    // Enforce max length
    const maxLength = options.maxLength || 72;
    if (subject.length > maxLength) {
      subject = subject.substring(0, maxLength - 3) + '...';
    }
    
    return subject;
  }

  /**
   * Infers scope from affected modules
   */
  private inferScope(modules: string[]): string | undefined {
    if (modules.length === 0) return undefined;
    if (modules.length === 1) return modules[0];
    
    // If multiple modules, try to find common parent or use first significant one
    const significantModules = modules.filter(m => 
      !['src', 'lib', 'utils', 'common'].includes(m.toLowerCase())
    );
    
    return significantModules[0] || modules[0];
  }

  /**
   * Generates description from analysis
   */
  private generateDescription(analysis: GitDiffAnalysis): string {
    // Use change types to create description
    if (analysis.changeTypes.includes('feature')) {
      return this.extractFeatureDescription(analysis);
    }
    if (analysis.changeTypes.includes('fix')) {
      return `fix ${this.extractFixDescription(analysis)}`;
    }
    if (analysis.changeTypes.includes('refactor')) {
      return `refactor ${this.extractRefactorDescription(analysis)}`;
    }
    
    // Generic description
    const action = analysis.insertions > analysis.deletions ? 'add' : 'update';
    const what = analysis.fileTypes.length > 0 
      ? `${analysis.fileTypes[0]} files`
      : 'code';
    
    return `${action} ${what}`;
  }

  /**
   * Extracts feature description
   */
  private extractFeatureDescription(analysis: GitDiffAnalysis): string {
    // Try to infer from file types and modules
    if (analysis.affectedModules.includes('auth')) {
      return 'authentication';
    }
    if (analysis.affectedModules.includes('api')) {
      return 'API endpoint';
    }
    if (analysis.fileTypes.includes('test')) {
      return 'test coverage';
    }
    
    return 'new feature';
  }

  /**
   * Extracts fix description
   */
  private extractFixDescription(analysis: GitDiffAnalysis): string {
    return 'bug';
  }

  /**
   * Extracts refactor description
   */
  private extractRefactorDescription(analysis: GitDiffAnalysis): string {
    return 'code structure';
  }

  /**
   * Generates commit message body
   */
  private generateBody(analysis: GitDiffAnalysis, options: CommitMessageOptions): string {
    const lines: string[] = [];
    
    if (options.format === 'detailed') {
      lines.push(analysis.summary);
      
      if (analysis.affectedModules.length > 0) {
        lines.push(`\nAffected modules: ${analysis.affectedModules.join(', ')}`);
      }
      
      if (analysis.fileTypes.length > 0) {
        lines.push(`\nFile types: ${analysis.fileTypes.join(', ')}`);
      }
    } else {
      // Simple body
      lines.push(analysis.summary);
    }
    
    return lines.join('\n');
  }

  /**
   * Calculates confidence score for the generated message
   */
  private calculateConfidence(analysis: GitDiffAnalysis): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more information
    if (analysis.changeTypes.length > 0) confidence += 0.2;
    if (analysis.affectedModules.length > 0) confidence += 0.15;
    if (analysis.filesChanged > 0) confidence += 0.1;
    if (analysis.summary.length > 50) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }
}

/**
 * Standalone function to generate commit message
 * Can be used directly without agent tool wrapper
 */
export async function generateCommitMessage(
  options?: CommitMessageOptions
): Promise<CommitMessageResult> {
  const generator = new GitCommitMessageGenerator();
  const context: AgentToolExecutionContext = {
    taskId: `commit-${Date.now()}`,
    agentId: 'git-commit-generator',
    parameters: options || {}
  };
  
  const result = await generator.execute(context);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate commit message');
  }
  
  return result.data as CommitMessageResult;
}

