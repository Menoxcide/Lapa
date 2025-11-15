/**
 * Command Palette AI for LAPA v1.0
 * 
 * Natural language command discovery for Void IDE.
 * Allows users to find commands using natural language queries like
 * "How do I run tests?" instead of remembering exact command names.
 * 
 * Features:
 * - Natural language command search
 * - Command indexing and categorization
 * - Semantic search for command discovery
 * - Command suggestions based on context
 * - Integration with Void IDE command palette
 */

import * as vscode from 'vscode';
import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { performance } from 'perf_hooks';

// Command metadata
export interface CommandMetadata {
  id: string;
  title: string;
  category?: string;
  description?: string;
  keywords: string[];
  aliases: string[];
  context?: string[]; // When this command is available
}

// Command search result
export interface CommandSearchResult {
  command: CommandMetadata;
  relevanceScore: number;
  matchReasons: string[];
}

// Command search options
export interface CommandSearchOptions {
  query: string;
  limit?: number;
  category?: string;
  context?: string[];
}

/**
 * Command Palette AI Tool
 * 
 * Provides natural language command discovery
 */
export class CommandPaletteAI extends BaseAgentTool {
  private commands: Map<string, CommandMetadata> = new Map();
  private commandIndex: Map<string, Set<string>> = new Map(); // keyword -> command IDs

  constructor() {
    super(
      'command-palette-ai',
      'utility',
      'Natural language command discovery for Void IDE',
      '1.0.0'
    );
    this.initializeCommands();
  }

  /**
   * Initializes command registry with common commands
   */
  private initializeCommands(): void {
    // LAPA Swarm commands
    this.registerCommand({
      id: 'lapa.swarm.start',
      title: 'Start Swarm',
      category: 'swarm',
      description: 'Start a new LAPA swarm with a goal',
      keywords: ['start', 'swarm', 'begin', 'launch', 'run', 'execute', 'goal', 'task'],
      aliases: ['start swarm', 'begin swarm', 'launch swarm']
    });

    this.registerCommand({
      id: 'lapa.swarm.stop',
      title: 'Stop Swarm',
      category: 'swarm',
      description: 'Stop the currently running swarm',
      keywords: ['stop', 'swarm', 'end', 'terminate', 'cancel', 'halt'],
      aliases: ['stop swarm', 'end swarm', 'terminate swarm']
    });

    this.registerCommand({
      id: 'lapa.swarm.pause',
      title: 'Pause Swarm',
      category: 'swarm',
      description: 'Pause the currently running swarm',
      keywords: ['pause', 'swarm', 'suspend', 'wait'],
      aliases: ['pause swarm', 'suspend swarm']
    });

    this.registerCommand({
      id: 'lapa.swarm.resume',
      title: 'Resume Swarm',
      category: 'swarm',
      description: 'Resume a paused swarm',
      keywords: ['resume', 'swarm', 'continue', 'restart'],
      aliases: ['resume swarm', 'continue swarm']
    });

    this.registerCommand({
      id: 'lapa.swarm.status',
      title: 'Show Swarm Status',
      category: 'swarm',
      description: 'Display the current swarm status',
      keywords: ['status', 'swarm', 'state', 'info', 'information', 'check'],
      aliases: ['swarm status', 'check swarm', 'swarm info']
    });

    this.registerCommand({
      id: 'lapa.git.generateCommit',
      title: 'Generate Git Commit Message',
      category: 'git',
      description: 'Generate a commit message from git changes',
      keywords: ['git', 'commit', 'message', 'generate', 'create', 'write', 'auto'],
      aliases: ['generate commit', 'git commit message', 'auto commit']
    });

    // Common IDE commands
    this.registerCommand({
      id: 'workbench.action.files.newUntitledFile',
      title: 'New File',
      category: 'file',
      description: 'Create a new untitled file',
      keywords: ['new', 'file', 'create', 'untitled', 'blank'],
      aliases: ['new file', 'create file']
    });

    this.registerCommand({
      id: 'workbench.action.files.save',
      title: 'Save',
      category: 'file',
      description: 'Save the active file',
      keywords: ['save', 'file', 'store', 'write'],
      aliases: ['save file']
    });

    this.registerCommand({
      id: 'workbench.action.files.saveAs',
      title: 'Save As',
      category: 'file',
      description: 'Save the active file with a new name',
      keywords: ['save', 'as', 'file', 'rename', 'new name'],
      aliases: ['save as', 'save file as']
    });

    this.registerCommand({
      id: 'workbench.action.findInFiles',
      title: 'Find in Files',
      category: 'search',
      description: 'Search for text across all files',
      keywords: ['find', 'search', 'files', 'text', 'grep', 'look'],
      aliases: ['find in files', 'search files', 'grep']
    });

    this.registerCommand({
      id: 'workbench.action.replaceInFiles',
      title: 'Replace in Files',
      category: 'search',
      description: 'Find and replace text across files',
      keywords: ['replace', 'find', 'files', 'substitute', 'change'],
      aliases: ['replace in files', 'find and replace']
    });

    this.registerCommand({
      id: 'workbench.action.terminal.new',
      title: 'New Terminal',
      category: 'terminal',
      description: 'Open a new terminal',
      keywords: ['terminal', 'new', 'open', 'console', 'shell', 'command'],
      aliases: ['new terminal', 'open terminal']
    });

    this.registerCommand({
      id: 'workbench.action.showCommands',
      title: 'Show Command Palette',
      category: 'general',
      description: 'Open the command palette',
      keywords: ['command', 'palette', 'commands', 'menu', 'show'],
      aliases: ['command palette', 'show commands']
    });

    this.registerCommand({
      id: 'workbench.action.openSettings',
      title: 'Open Settings',
      category: 'settings',
      description: 'Open user settings',
      keywords: ['settings', 'preferences', 'config', 'configure', 'options'],
      aliases: ['open settings', 'settings', 'preferences']
    });

    // Testing commands
    this.registerCommand({
      id: 'workbench.action.debug.start',
      title: 'Start Debugging',
      category: 'debug',
      description: 'Start debugging the current session',
      keywords: ['debug', 'start', 'run', 'debugging', 'breakpoint'],
      aliases: ['start debug', 'debug', 'run debug']
    });

    this.registerCommand({
      id: 'workbench.action.debug.stop',
      title: 'Stop Debugging',
      category: 'debug',
      description: 'Stop the current debugging session',
      keywords: ['debug', 'stop', 'end', 'terminate'],
      aliases: ['stop debug', 'end debug']
    });

    // Git commands
    this.registerCommand({
      id: 'git.stage',
      title: 'Stage Changes',
      category: 'git',
      description: 'Stage selected changes',
      keywords: ['git', 'stage', 'add', 'changes', 'commit'],
      aliases: ['stage', 'git stage', 'add to stage']
    });

    this.registerCommand({
      id: 'git.commit',
      title: 'Commit',
      category: 'git',
      description: 'Commit staged changes',
      keywords: ['git', 'commit', 'save', 'changes'],
      aliases: ['commit', 'git commit']
    });
  }

  /**
   * Registers a command in the index
   */
  private registerCommand(metadata: CommandMetadata): void {
    this.commands.set(metadata.id, metadata);

    // Index by keywords
    for (const keyword of metadata.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (!this.commandIndex.has(lowerKeyword)) {
        this.commandIndex.set(lowerKeyword, new Set());
      }
      this.commandIndex.get(lowerKeyword)!.add(metadata.id);
    }

    // Index by aliases
    for (const alias of metadata.aliases) {
      const lowerAlias = alias.toLowerCase();
      if (!this.commandIndex.has(lowerAlias)) {
        this.commandIndex.set(lowerAlias, new Set());
      }
      this.commandIndex.get(lowerAlias)!.add(metadata.id);
    }
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    const action = params.action;
    if (!action || typeof action !== 'string') {
      return false;
    }

    if (action === 'search') {
      return params.query && typeof params.query === 'string';
    }

    if (action === 'suggest' || action === 'execute') {
      return params.query && typeof params.query === 'string';
    }

    return false;
  }

  /**
   * Executes the command palette AI operation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();

    try {
      const action = context.parameters.action as string;

      switch (action) {
        case 'search':
          return await this.searchCommands(context, startTime);
        case 'suggest':
          return await this.suggestCommands(context, startTime);
        case 'execute':
          return await this.executeCommand(context, startTime);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Supported: search, suggest, execute`,
            executionTime: performance.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime
      };
    }
  }

  /**
   * Searches for commands matching a natural language query
   */
  private async searchCommands(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const query = (context.parameters.query as string).toLowerCase();
    const limit = context.parameters.limit ? Number(context.parameters.limit) : 10;
    const category = context.parameters.category as string | undefined;

    // Find matching commands
    const matches = this.findMatchingCommands(query, category);

    // Sort by relevance
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    const limited = matches.slice(0, limit);

    // Publish event
    await this.publishEvent('command.search', {
      query,
      resultsCount: limited.length,
      taskId: context.taskId
    });

    return {
      success: true,
      data: {
        results: limited,
        query,
        total: matches.length
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Suggests commands based on natural language query
   */
  private async suggestCommands(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const query = (context.parameters.query as string).toLowerCase();

    // Find top suggestions
    const matches = this.findMatchingCommands(query);
    const topMatches = matches.slice(0, 5);

    // Generate natural language suggestions
    const suggestions = topMatches.map(result => ({
      command: result.command,
      suggestion: this.generateSuggestion(result.command, query),
      confidence: result.relevanceScore
    }));

    return {
      success: true,
      data: {
        suggestions,
        query
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Executes a command based on natural language query
   */
  private async executeCommand(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const query = (context.parameters.query as string).toLowerCase();

    // Find best matching command
    const matches = this.findMatchingCommands(query);
    if (matches.length === 0) {
      return {
        success: false,
        error: `No command found matching: "${query}"`,
        executionTime: performance.now() - startTime
      };
    }

    const bestMatch = matches[0];
    const commandId = bestMatch.command.id;

    try {
      // Execute the command
      await vscode.commands.executeCommand(commandId);

      // Publish event
      await this.publishEvent('command.executed', {
        commandId,
        query,
        taskId: context.taskId
      });

      return {
        success: true,
        data: {
          commandId,
          command: bestMatch.command,
          query
        },
        executionTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: performance.now() - startTime
      };
    }
  }

  /**
   * Finds commands matching a query
   */
  private findMatchingCommands(query: string, category?: string): CommandSearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matches = new Map<string, { command: CommandMetadata; score: number; reasons: string[] }>();

    // Search through all commands
    for (const [commandId, command] of this.commands.entries()) {
      // Filter by category if specified
      if (category && command.category !== category) {
        continue;
      }

      let score = 0;
      const reasons: string[] = [];

      // Check title match
      const titleLower = command.title.toLowerCase();
      if (titleLower.includes(query)) {
        score += 0.5;
        reasons.push('Title matches query');
      }

      // Check description match
      if (command.description) {
        const descLower = command.description.toLowerCase();
        if (descLower.includes(query)) {
          score += 0.3;
          reasons.push('Description matches query');
        }
      }

      // Check keyword matches
      for (const word of queryWords) {
        if (command.keywords.some(k => k.toLowerCase() === word)) {
          score += 0.2;
          reasons.push(`Keyword matches: ${word}`);
        }
      }

      // Check alias matches
      for (const alias of command.aliases) {
        if (alias.toLowerCase().includes(query)) {
          score += 0.4;
          reasons.push(`Alias matches: ${alias}`);
        }
      }

      // Check category match
      if (command.category && queryWords.some(w => command.category!.toLowerCase().includes(w))) {
        score += 0.1;
        reasons.push(`Category matches: ${command.category}`);
      }

      if (score > 0) {
        matches.set(commandId, { command, score, reasons });
      }
    }

    // Convert to results
    return Array.from(matches.values()).map(({ command, score, reasons }) => ({
      command,
      relevanceScore: Math.min(score, 1.0),
      matchReasons: reasons
    }));
  }

  /**
   * Generates a natural language suggestion
   */
  private generateSuggestion(command: CommandMetadata, query: string): string {
    const examples: Record<string, string> = {
      'how do i': `To ${command.title.toLowerCase()}, use the command "${command.title}"`,
      'how to': `To ${command.title.toLowerCase()}, use the command "${command.title}"`,
      'run test': 'You can run tests using the "Run Tests" command',
      'save file': 'Use "Save" or "Save As" to save your file',
      'find text': 'Use "Find in Files" to search for text across all files',
      'open terminal': 'Use "New Terminal" to open a terminal',
      'git commit': 'Use "Commit" or "Generate Git Commit Message" for git commits'
    };

    for (const [pattern, suggestion] of Object.entries(examples)) {
      if (query.includes(pattern)) {
        return suggestion;
      }
    }

    return `Try using "${command.title}" - ${command.description || 'This command might help'}`;
  }
}

/**
 * Standalone function to search commands
 */
export async function searchCommands(query: string, limit: number = 10): Promise<CommandSearchResult[]> {
  const ai = new CommandPaletteAI();
  const context: AgentToolExecutionContext = {
    taskId: `search-${Date.now()}`,
    agentId: 'command-palette-ai',
    toolName: 'command-search',
    parameters: {
      action: 'search',
      query,
      limit
    },
    context: {}
  };

  const result = await ai.execute(context);
  if (!result.success) {
    throw new Error(result.error || 'Failed to search commands');
  }

  return result.data?.results || [];
}

/**
 * Standalone function to suggest commands
 */
export async function suggestCommand(query: string): Promise<{ command: CommandMetadata; suggestion: string; confidence: number }[]> {
  const ai = new CommandPaletteAI();
  const context: AgentToolExecutionContext = {
    taskId: `suggest-${Date.now()}`,
    agentId: 'command-palette-ai',
    toolName: 'command-suggest',
    parameters: {
      action: 'suggest',
      query
    },
    context: {}
  };

  const result = await ai.execute(context);
  if (!result.success) {
    throw new Error(result.error || 'Failed to suggest commands');
  }

  return result.data?.suggestions || [];
}

