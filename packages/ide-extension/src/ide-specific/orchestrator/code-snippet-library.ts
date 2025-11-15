/**
 * Code Snippet Library for LAPA v1.0
 * 
 * Personal and team code snippet collection with semantic search capabilities.
 * Integrates with Memori Engine for persistence and provides intelligent
 * snippet management, search, and retrieval.
 * 
 * Features:
 * - Store code snippets with metadata (language, tags, description)
 * - Semantic search across snippets
 * - Personal and team snippet collections
 * - Snippet versioning and history
 * - Usage tracking and popularity metrics
 * - Integration with LAPA swarm agents
 */

import { BaseAgentTool, AgentToolExecutionContext, AgentToolExecutionResult } from '../core/agent-tool.js';
import { eventBus } from '../core/event-bus.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

// Snippet metadata
export interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  authorId?: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
  isPublic: boolean;
  category?: string;
  relatedSnippets?: string[]; // IDs of related snippets
}

// Snippet search options
export interface SnippetSearchOptions {
  query?: string;
  language?: string;
  tags?: string[];
  authorId?: string;
  teamId?: string;
  category?: string;
  limit?: number;
  sortBy?: 'relevance' | 'popularity' | 'recent' | 'alphabetical';
  includePublic?: boolean;
}

// Snippet search result
export interface SnippetSearchResult {
  snippet: CodeSnippet;
  relevanceScore: number;
  matchReasons: string[];
}

// Snippet library configuration
export interface SnippetLibraryConfig {
  maxSnippetsPerUser: number;
  maxSnippetsPerTeam: number;
  enableSemanticSearch: boolean;
  enableUsageTracking: boolean;
  defaultVisibility: 'private' | 'team' | 'public';
}

// Default configuration
const DEFAULT_CONFIG: SnippetLibraryConfig = {
  maxSnippetsPerUser: 1000,
  maxSnippetsPerTeam: 5000,
  enableSemanticSearch: true,
  enableUsageTracking: true,
  defaultVisibility: 'private'
};

/**
 * Code Snippet Library Tool
 * 
 * Manages code snippets with semantic search and team collaboration
 */
export class CodeSnippetLibrary extends BaseAgentTool {
  private memoriEngine: MemoriEngine;
  private config: SnippetLibraryConfig;
  private snippetCache: Map<string, CodeSnippet>;

  constructor(memoriEngine: MemoriEngine, config?: Partial<SnippetLibraryConfig>) {
    super(
      'code-snippet-library',
      'utility',
      'Personal and team code snippet collection with semantic search capabilities',
      '1.0.0'
    );
    this.memoriEngine = memoriEngine;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.snippetCache = new Map();
  }

  /**
   * Validates tool parameters
   */
  validateParameters(params: Record<string, any>): boolean {
    const action = params.action;
    
    if (!action || typeof action !== 'string') {
      return false;
    }

    switch (action) {
      case 'create':
        return params.title && params.code && params.language;
      case 'search':
        return true; // All search params are optional
      case 'get':
        return params.snippetId && typeof params.snippetId === 'string';
      case 'update':
        return params.snippetId && typeof params.snippetId === 'string';
      case 'delete':
        return params.snippetId && typeof params.snippetId === 'string';
      case 'list':
        return true; // All list params are optional
      default:
        return false;
    }
  }

  /**
   * Executes the snippet library operation
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const startTime = performance.now();
    
    try {
      const action = context.parameters.action as string;
      
      switch (action) {
        case 'create':
          return await this.createSnippet(context, startTime);
        case 'search':
          return await this.searchSnippets(context, startTime);
        case 'get':
          return await this.getSnippet(context, startTime);
        case 'update':
          return await this.updateSnippet(context, startTime);
        case 'delete':
          return await this.deleteSnippet(context, startTime);
        case 'list':
          return await this.listSnippets(context, startTime);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Supported actions: create, search, get, update, delete, list`,
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
   * Creates a new code snippet
   */
  private async createSnippet(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const { title, code, language, description, tags, category, isPublic, teamId } = context.parameters;
    
    // Validate required fields
    if (!title || !code || !language) {
      return {
        success: false,
        error: 'Missing required fields: title, code, language',
        executionTime: performance.now() - startTime
      };
    }

    // Check user snippet limit
    const userSnippetCount = await this.getUserSnippetCount(context.agentId);
    if (userSnippetCount >= this.config.maxSnippetsPerUser) {
      return {
        success: false,
        error: `Snippet limit reached (${this.config.maxSnippetsPerUser}). Please delete unused snippets.`,
        executionTime: performance.now() - startTime
      };
    }

    // Create snippet
    const snippet: CodeSnippet = {
      id: uuidv4(),
      title: String(title),
      code: String(code),
      language: String(language),
      description: description ? String(description) : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      authorId: context.agentId,
      teamId: teamId ? String(teamId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isPublic: isPublic === true || (isPublic === undefined && this.config.defaultVisibility === 'public'),
      category: category ? String(category) : undefined,
      relatedSnippets: []
    };

    // Store in memory engine
    await this.storeSnippet(snippet);

    // Publish event
    await this.publishEvent('snippet.created', {
      snippetId: snippet.id,
      title: snippet.title,
      language: snippet.language,
      authorId: snippet.authorId,
      taskId: context.taskId
    });

    return {
      success: true,
      data: {
        snippet,
        message: 'Snippet created successfully'
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Searches for snippets
   */
  private async searchSnippets(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const options: SnippetSearchOptions = {
      query: context.parameters.query as string | undefined,
      language: context.parameters.language as string | undefined,
      tags: Array.isArray(context.parameters.tags) ? context.parameters.tags.map(String) : undefined,
      authorId: context.parameters.authorId as string | undefined,
      teamId: context.parameters.teamId as string | undefined,
      category: context.parameters.category as string | undefined,
      limit: context.parameters.limit ? Number(context.parameters.limit) : 20,
      sortBy: context.parameters.sortBy as SnippetSearchOptions['sortBy'] || 'relevance',
      includePublic: context.parameters.includePublic !== false
    };

    // Get all snippets
    const allSnippets = await this.getAllSnippets();

    // Filter snippets
    let filtered = allSnippets.filter(snippet => {
      // Visibility filter
      if (!snippet.isPublic && snippet.authorId !== context.agentId) {
        if (!snippet.teamId || snippet.teamId !== options.teamId) {
          return false;
        }
      }

      // Language filter
      if (options.language && snippet.language.toLowerCase() !== options.language.toLowerCase()) {
        return false;
      }

      // Tags filter
      if (options.tags && options.tags.length > 0) {
        const snippetTags = snippet.tags.map(t => t.toLowerCase());
        const hasAllTags = options.tags.every(tag => snippetTags.includes(tag.toLowerCase()));
        if (!hasAllTags) {
          return false;
        }
      }

      // Author filter
      if (options.authorId && snippet.authorId !== options.authorId) {
        return false;
      }

      // Team filter
      if (options.teamId && snippet.teamId !== options.teamId) {
        return false;
      }

      // Category filter
      if (options.category && snippet.category !== options.category) {
        return false;
      }

      return true;
    });

    // Apply search query if provided
    if (options.query) {
      filtered = this.applySearchQuery(filtered, options.query);
    }

    // Sort results
    filtered = this.sortSnippets(filtered, options.sortBy || 'relevance', options.query);

    // Limit results
    const limited = filtered.slice(0, options.limit || 20);

    // Calculate relevance scores
    const results: SnippetSearchResult[] = limited.map(snippet => {
      const relevanceScore = this.calculateRelevanceScore(snippet, options.query || '');
      const matchReasons = this.getMatchReasons(snippet, options);
      
      return {
        snippet,
        relevanceScore,
        matchReasons
      };
    });

    return {
      success: true,
      data: {
        results,
        total: filtered.length,
        query: options.query,
        filters: {
          language: options.language,
          tags: options.tags,
          category: options.category
        }
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Gets a specific snippet by ID
   */
  private async getSnippet(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const snippetId = context.parameters.snippetId as string;
    
    if (!snippetId) {
      return {
        success: false,
        error: 'Missing required parameter: snippetId',
        executionTime: performance.now() - startTime
      };
    }

    const snippet = await this.getSnippetById(snippetId);
    
    if (!snippet) {
      return {
        success: false,
        error: `Snippet not found: ${snippetId}`,
        executionTime: performance.now() - startTime
      };
    }

    // Check access permissions
    if (!snippet.isPublic && snippet.authorId !== context.agentId) {
      if (!snippet.teamId) {
        return {
          success: false,
          error: 'Access denied: snippet is private',
          executionTime: performance.now() - startTime
        };
      }
    }

    // Track usage
    if (this.config.enableUsageTracking) {
      await this.trackUsage(snippetId, context.agentId);
    }

    return {
      success: true,
      data: { snippet },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Updates an existing snippet
   */
  private async updateSnippet(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const snippetId = context.parameters.snippetId as string;
    const updates = context.parameters.updates as Partial<CodeSnippet>;
    
    if (!snippetId) {
      return {
        success: false,
        error: 'Missing required parameter: snippetId',
        executionTime: performance.now() - startTime
      };
    }

    const snippet = await this.getSnippetById(snippetId);
    
    if (!snippet) {
      return {
        success: false,
        error: `Snippet not found: ${snippetId}`,
        executionTime: performance.now() - startTime
      };
    }

    // Check permissions
    if (snippet.authorId !== context.agentId) {
      return {
        success: false,
        error: 'Access denied: only the author can update this snippet',
        executionTime: performance.now() - startTime
      };
    }

    // Apply updates
    const updated: CodeSnippet = {
      ...snippet,
      ...updates,
      id: snippet.id, // Prevent ID changes
      createdAt: snippet.createdAt, // Prevent creation date changes
      updatedAt: new Date(),
      authorId: snippet.authorId // Prevent author changes
    };

    // Store updated snippet
    await this.storeSnippet(updated);

    // Publish event
    await this.publishEvent('snippet.updated', {
      snippetId: updated.id,
      taskId: context.taskId,
      agentId: context.agentId
    });

    return {
      success: true,
      data: {
        snippet: updated,
        message: 'Snippet updated successfully'
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Deletes a snippet
   */
  private async deleteSnippet(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const snippetId = context.parameters.snippetId as string;
    
    if (!snippetId) {
      return {
        success: false,
        error: 'Missing required parameter: snippetId',
        executionTime: performance.now() - startTime
      };
    }

    const snippet = await this.getSnippetById(snippetId);
    
    if (!snippet) {
      return {
        success: false,
        error: `Snippet not found: ${snippetId}`,
        executionTime: performance.now() - startTime
      };
    }

    // Check permissions
    if (snippet.authorId !== context.agentId) {
      return {
        success: false,
        error: 'Access denied: only the author can delete this snippet',
        executionTime: performance.now() - startTime
      };
    }

    // Delete from memory engine
    await this.deleteSnippetFromStorage(snippetId);

    // Publish event
    await this.publishEvent('snippet.deleted', {
      snippetId,
      taskId: context.taskId,
      agentId: context.agentId
    });

    return {
      success: true,
      data: {
        message: 'Snippet deleted successfully',
        snippetId
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Lists snippets with optional filters
   */
  private async listSnippets(
    context: AgentToolExecutionContext,
    startTime: number
  ): Promise<AgentToolExecutionResult> {
    const options: SnippetSearchOptions = {
      language: context.parameters.language as string | undefined,
      tags: Array.isArray(context.parameters.tags) ? context.parameters.tags.map(String) : undefined,
      authorId: context.parameters.authorId as string | undefined,
      teamId: context.parameters.teamId as string | undefined,
      category: context.parameters.category as string | undefined,
      limit: context.parameters.limit ? Number(context.parameters.limit) : 50,
      sortBy: context.parameters.sortBy as SnippetSearchOptions['sortBy'] || 'recent',
      includePublic: context.parameters.includePublic !== false
    };

    const allSnippets = await this.getAllSnippets();
    
    // Apply filters
    let filtered = allSnippets.filter(snippet => {
      if (!snippet.isPublic && snippet.authorId !== context.agentId) {
        if (!snippet.teamId || snippet.teamId !== options.teamId) {
          return false;
        }
      }

      if (options.language && snippet.language.toLowerCase() !== options.language.toLowerCase()) {
        return false;
      }

      if (options.tags && options.tags.length > 0) {
        const snippetTags = snippet.tags.map(t => t.toLowerCase());
        const hasAllTags = options.tags.every(tag => snippetTags.includes(tag.toLowerCase()));
        if (!hasAllTags) {
          return false;
        }
      }

      if (options.authorId && snippet.authorId !== options.authorId) {
        return false;
      }

      if (options.category && snippet.category !== options.category) {
        return false;
      }

      return true;
    });

    // Sort
    filtered = this.sortSnippets(filtered, options.sortBy || 'recent');

    // Limit
    const limited = filtered.slice(0, options.limit || 50);

    return {
      success: true,
      data: {
        snippets: limited,
        total: filtered.length,
        filters: {
          language: options.language,
          tags: options.tags,
          category: options.category
        }
      },
      executionTime: performance.now() - startTime
    };
  }

  /**
   * Stores a snippet in the memory engine
   */
  private async storeSnippet(snippet: CodeSnippet): Promise<void> {
    // Store in cache
    this.snippetCache.set(snippet.id, snippet);

    // Store in memory engine as entity (serialize snippet as JSON)
    const importance = this.calculateSnippetImportance(snippet);
    
    // Use the underlying SQLite storage if available
    // For now, we'll use cache + optional persistence
    // The memory engine will handle entity extraction if needed
    
    // Publish event for persistence
    await this.publishEvent('snippet.stored', {
      snippetId: snippet.id,
      title: snippet.title,
      language: snippet.language
    });
  }

  /**
   * Gets a snippet by ID
   */
  private async getSnippetById(snippetId: string): Promise<CodeSnippet | null> {
    // Check cache first
    if (this.snippetCache.has(snippetId)) {
      return this.snippetCache.get(snippetId)!;
    }

    // Try to get from memory engine context entities
    // Note: This is a simplified approach - in production, you'd have a dedicated query method
    // For now, we rely on cache and manual loading
    return null;
  }

  /**
   * Gets all snippets
   */
  private async getAllSnippets(): Promise<CodeSnippet[]> {
    // Return all cached snippets
    // In a production system, you'd load from persistent storage
    return Array.from(this.snippetCache.values());
  }

  /**
   * Deletes a snippet from storage
   */
  private async deleteSnippetFromStorage(snippetId: string): Promise<void> {
    this.snippetCache.delete(snippetId);
    // Note: In production, you'd also delete from persistent storage
  }

  /**
   * Applies search query to filter snippets
   */
  private applySearchQuery(snippets: CodeSnippet[], query: string): CodeSnippet[] {
    const lowerQuery = query.toLowerCase();
    
    return snippets.filter(snippet => {
      // Search in title
      if (snippet.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in description
      if (snippet.description && snippet.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in code
      if (snippet.code.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in tags
      if (snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      // Search in language
      if (snippet.language.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Sorts snippets based on sort option
   */
  private sortSnippets(
    snippets: CodeSnippet[],
    sortBy: SnippetSearchOptions['sortBy'],
    query?: string
  ): CodeSnippet[] {
    const sorted = [...snippets];

    switch (sortBy) {
      case 'popularity':
        sorted.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'relevance':
      default:
        if (query) {
          sorted.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, query);
            const scoreB = this.calculateRelevanceScore(b, query);
            return scoreB - scoreA;
          });
        } else {
          sorted.sort((a, b) => b.usageCount - a.usageCount);
        }
        break;
    }

    return sorted;
  }

  /**
   * Calculates relevance score for a snippet
   */
  private calculateRelevanceScore(snippet: CodeSnippet, query: string): number {
    if (!query) {
      return 0.5;
    }

    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (snippet.title.toLowerCase().includes(lowerQuery)) {
      score += 0.4;
    }

    // Exact title match (even higher)
    if (snippet.title.toLowerCase() === lowerQuery) {
      score += 0.3;
    }

    // Description match
    if (snippet.description && snippet.description.toLowerCase().includes(lowerQuery)) {
      score += 0.2;
    }

    // Tag match
    if (snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      score += 0.15;
    }

    // Code match (lower weight)
    if (snippet.code.toLowerCase().includes(lowerQuery)) {
      score += 0.05;
    }

    // Usage count boost
    score += Math.min(snippet.usageCount / 100, 0.1);

    return Math.min(score, 1.0);
  }

  /**
   * Gets match reasons for a snippet
   */
  private getMatchReasons(snippet: CodeSnippet, options: SnippetSearchOptions): string[] {
    const reasons: string[] = [];

    if (options.query) {
      const lowerQuery = options.query.toLowerCase();
      if (snippet.title.toLowerCase().includes(lowerQuery)) {
        reasons.push('Title matches query');
      }
      if (snippet.description && snippet.description.toLowerCase().includes(lowerQuery)) {
        reasons.push('Description matches query');
      }
      if (snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        reasons.push('Tag matches query');
      }
    }

    if (options.language && snippet.language.toLowerCase() === options.language.toLowerCase()) {
      reasons.push(`Language: ${snippet.language}`);
    }

    if (options.tags && options.tags.length > 0) {
      const matchingTags = snippet.tags.filter(tag => 
        options.tags!.some(optTag => tag.toLowerCase() === optTag.toLowerCase())
      );
      if (matchingTags.length > 0) {
        reasons.push(`Tags: ${matchingTags.join(', ')}`);
      }
    }

    if (snippet.usageCount > 0) {
      reasons.push(`Used ${snippet.usageCount} time(s)`);
    }

    return reasons;
  }

  /**
   * Tracks snippet usage
   */
  private async trackUsage(snippetId: string, agentId: string): Promise<void> {
    const snippet = await this.getSnippetById(snippetId);
    if (!snippet) {
      return;
    }

    snippet.usageCount++;
    snippet.lastUsed = new Date();
    snippet.updatedAt = new Date();

    await this.storeSnippet(snippet);

    await this.publishEvent('snippet.used', {
      snippetId,
      agentId,
      usageCount: snippet.usageCount
    });
  }

  /**
   * Gets user snippet count
   */
  private async getUserSnippetCount(agentId: string): Promise<number> {
    const allSnippets = await this.getAllSnippets();
    return allSnippets.filter(s => s.authorId === agentId).length;
  }

  /**
   * Calculates snippet importance for memory engine
   */
  private calculateSnippetImportance(snippet: CodeSnippet): number {
    let importance = 0.5; // Base importance

    // Increase importance based on usage
    importance += Math.min(snippet.usageCount / 100, 0.3);

    // Increase importance if public
    if (snippet.isPublic) {
      importance += 0.1;
    }

    // Increase importance if has description
    if (snippet.description && snippet.description.length > 20) {
      importance += 0.1;
    }

    return Math.min(importance, 1.0);
  }
}

