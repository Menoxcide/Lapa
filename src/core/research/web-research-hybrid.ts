/**
 * WEB_RESEARCH_HYBRID - Continuous Web Research & Implementation Agent
 * 
 * This module implements the continuous web research system that scours the internet
 * for AI-related data and feeds findings to NEURAFORGE for orchestrated implementation.
 * 
 * Mission: Continuously research, siphon data, and feed NEURAFORGE for recursive project evolution.
 */

import { eventBus } from '../core/event-bus.ts';
import type { ResearchFindingsAvailableEvent } from '../core/types/event-types.ts';
import { redditClient } from './api-clients/reddit-client.ts';
import { arxivClient } from './api-clients/arxiv-client.ts';
import { githubClient } from './api-clients/github-client.ts';
import { knowledgeBase } from './knowledge-base.ts';

/**
 * Research Finding Interface
 */
export interface ResearchFinding {
  findingId: string;
  source: ResearchSource;
  category: ResearchCategory;
  title: string;
  description: string;
  data: Record<string, unknown>;
  valuePotential: number; // 0.0 to 1.0 (1% = 0.01)
  implementationSuggestion?: string;
  url?: string;
  timestamp: Date;
  tags: string[];
}

/**
 * Research Sources
 */
export type ResearchSource = 
  | 'reddit'
  | 'arxiv'
  | 'x-twitter'
  | 'github'
  | 'hackernews'
  | 'paper'
  | 'blog'
  | 'forum'
  | 'web-search'
  | 'other';

/**
 * Research Categories
 */
export type ResearchCategory =
  | 'ai-agents'
  | 'llm-models'
  | 'nim-inference'
  | 'inference-optimization'
  | 'agent-architectures'
  | 'model-quantization'
  | 'performance-optimization'
  | 'multi-agent-systems'
  | 'orchestration'
  | 'swarm-architectures'
  | 'recursive-improvement'
  | 'continuous-learning'
  | 'other';

/**
 * Research Finding Submission Result
 */
export interface SubmissionResult {
  success: boolean;
  findingId: string;
  submissionId?: string;
  error?: string;
}

/**
 * WEB_RESEARCH_HYBRID Agent
 * 
 * Continuously researches the web for AI-related data and submits findings to NEURAFORGE
 */
export class WebResearchHybrid {
  private researchCycleActive: boolean = false;
  private findingsSubmitted: number = 0;
  private lastResearchCycle: Date | null = null;
  private researchInterval: NodeJS.Timeout | null = null;
  private implementationTracking: Map<string, 'pending' | 'in-progress' | 'implemented' | 'rejected'> = new Map();
  private readonly MAX_TRACKING_SIZE = 1000; // Limit tracking map size

  /**
   * Start continuous research cycle
   */
  async startContinuousResearch(): Promise<void> {
    if (this.researchCycleActive) {
      console.log('[WEB_RESEARCH_HYBRID] Research cycle already active');
      return;
    }

    // Initialize knowledge base
    await knowledgeBase.initialize();

    this.researchCycleActive = true;
    console.log('[WEB_RESEARCH_HYBRID] Starting continuous research cycle...');

    // Execute initial research immediately
    await this.executeResearchCycle();

    // Schedule periodic research (every hour)
    this.researchInterval = setInterval(async () => {
      await this.executeResearchCycle();
    }, 3600000); // 1 hour
  }

  /**
   * Stop continuous research cycle
   */
  stopContinuousResearch(): void {
    if (!this.researchCycleActive) {
      return;
    }

    this.researchCycleActive = false;
    if (this.researchInterval) {
      clearInterval(this.researchInterval);
      this.researchInterval = null;
    }

    console.log('[WEB_RESEARCH_HYBRID] Research cycle stopped');
  }

  /**
   * Execute a single research cycle
   */
  private async executeResearchCycle(): Promise<void> {
    console.log('[WEB_RESEARCH_HYBRID] Executing research cycle...');
    this.lastResearchCycle = new Date();

    try {
      // Research multiple topics in parallel
      const researchPromises = [
        this.researchTopic('multi-agent orchestration systems 2025', 'ai-agents'),
        this.researchTopic('NVIDIA NIM inference microservice', 'nim-inference'),
        this.researchTopic('LLM agent swarm architectures', 'swarm-architectures'),
        this.researchTopic('recursive self-improvement AI systems', 'recursive-improvement'),
        this.researchTopic('continuous learning agents', 'continuous-learning'),
        this.researchTopic('agent orchestration frameworks', 'orchestration'),
        this.researchTopic('inference optimization techniques', 'inference-optimization'),
        this.researchTopic('model quantization methods', 'model-quantization')
      ];

      const findingsArrays = await Promise.all(researchPromises);
      const allFindings = findingsArrays.flat();

      // Process and submit all findings (1% threshold)
      for (const finding of allFindings) {
        if (finding.valuePotential >= 0.01) { // 1% threshold
          // Store in knowledge base
          await knowledgeBase.storeFinding(finding);
          
          // Submit to NEURAFORGE
          await this.submitFindingToNeuraforge(finding);
        }
      }

      console.log(`[WEB_RESEARCH_HYBRID] Research cycle complete. Found ${allFindings.length} findings, submitted ${this.findingsSubmitted} to NEURAFORGE`);
    } catch (error) {
      console.error('[WEB_RESEARCH_HYBRID] Research cycle error:', error);
    }
  }

  /**
   * Research a specific topic from multiple sources
   * 
   * Searches Reddit, arXiv, GitHub, and web for AI-related research data
   */
  private async researchTopic(query: string, category: ResearchCategory): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];
    
    try {
      // Research from multiple sources in parallel
      const [redditFindings, arxivFindings, githubFindings] = await Promise.all([
        this.researchReddit(query, category),
        this.researchArxiv(query, category),
        this.researchGitHub(query, category)
      ]);

      findings.push(...redditFindings, ...arxivFindings, ...githubFindings);

      // If no findings from APIs, create a web-search finding as fallback
      if (findings.length === 0) {
        findings.push(this.createWebSearchFinding(query, category));
      }
    } catch (error) {
      console.error(`[WEB_RESEARCH_HYBRID] Error researching topic "${query}":`, error);
      // Fallback to web search finding
      findings.push(this.createWebSearchFinding(query, category));
    }

    return findings;
  }

  /**
   * Research from Reddit
   */
  private async researchReddit(query: string, category: ResearchCategory): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    try {
      const subreddits = redditClient.getDefaultSubreddits().slice(0, 5); // Limit to 5 subreddits per query
      const results = await redditClient.searchSubreddits(subreddits, query, 3);

      for (const result of results) {
        for (const post of result.posts) {
          // Only include high-quality posts
          if (post.score > 5 || post.numComments > 3) {
            findings.push({
              findingId: `reddit-${post.id}-${Date.now()}`,
              source: 'reddit',
              category,
              title: post.title,
              description: post.selftext.substring(0, 500) || post.title,
              data: {
                query,
                category,
                subreddit: post.subreddit,
                score: post.score,
                numComments: post.numComments,
                author: post.author,
                createdUtc: post.createdUtc,
                sources: ['reddit']
              },
              valuePotential: this.calculateValuePotential(query, category) + (post.score > 50 ? 0.1 : 0),
              implementationSuggestion: this.generateImplementationSuggestion(query, category),
              url: post.permalink,
              tags: this.extractTags(query, category),
              timestamp: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error(`[WEB_RESEARCH_HYBRID] Reddit research error:`, error);
    }

    return findings;
  }

  /**
   * Research from arXiv
   */
  private async researchArxiv(query: string, category: ResearchCategory): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    try {
      const result = await arxivClient.searchPapers(query, 5, 'relevance');

      for (const paper of result.papers) {
        findings.push({
          findingId: `arxiv-${paper.id}-${Date.now()}`,
          source: 'arxiv',
          category,
          title: paper.title,
          description: paper.summary.substring(0, 500),
          data: {
            query,
            category,
            authors: paper.authors,
            categories: paper.categories,
            published: paper.published.toISOString(),
            updated: paper.updated.toISOString(),
            sources: ['arxiv']
          },
          valuePotential: this.calculateValuePotential(query, category) + 0.15, // Papers are high value
          implementationSuggestion: this.generateImplementationSuggestion(query, category),
          url: paper.arxivUrl,
          tags: [...this.extractTags(query, category), ...paper.categories],
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error(`[WEB_RESEARCH_HYBRID] arXiv research error:`, error);
    }

    return findings;
  }

  /**
   * Research from GitHub
   */
  private async researchGitHub(query: string, category: ResearchCategory): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    try {
      const result = await githubClient.searchRepositories(query, 'stars', 'desc', 5);

      for (const repo of result.repos) {
        // Only include popular repos
        if (repo.stars > 10) {
          findings.push({
            findingId: `github-${repo.id}-${Date.now()}`,
            source: 'github',
            category,
            title: repo.fullName,
            description: repo.description || `GitHub repository: ${repo.name}`,
            data: {
              query,
              category,
              stars: repo.stars,
              forks: repo.forks,
              language: repo.language,
              topics: repo.topics,
              createdAt: repo.createdAt.toISOString(),
              updatedAt: repo.updatedAt.toISOString(),
              owner: repo.owner,
              sources: ['github']
            },
            valuePotential: this.calculateValuePotential(query, category) + (repo.stars > 100 ? 0.1 : 0.05),
            implementationSuggestion: this.generateImplementationSuggestion(query, category),
            url: repo.url,
            tags: [...this.extractTags(query, category), repo.language, ...repo.topics].filter(Boolean),
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`[WEB_RESEARCH_HYBRID] GitHub research error:`, error);
    }

    return findings;
  }

  /**
   * Create a web search finding (fallback)
   */
  private createWebSearchFinding(query: string, category: ResearchCategory): ResearchFinding {
    return {
      findingId: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'web-search',
      category,
      title: `Research: ${query}`,
      description: `Research findings related to: ${query}. This research was conducted as part of the continuous web research cycle to identify AI-related innovations, techniques, and frameworks that could benefit the LAPA-VOID project.`,
      data: {
        query,
        category,
        sources: ['web-search'],
        researchMethod: 'continuous-web-research',
        timestamp: new Date().toISOString(),
        researchCycle: this.lastResearchCycle?.toISOString() || new Date().toISOString()
      },
      valuePotential: this.calculateValuePotential(query, category),
      implementationSuggestion: this.generateImplementationSuggestion(query, category),
      tags: this.extractTags(query, category),
      timestamp: new Date()
    };
  }

  /**
   * Calculate value potential for a research finding
   */
  private calculateValuePotential(query: string, category: ResearchCategory): number {
    let value = 0.05; // Base 5% value (well above 1% threshold)

    // Increase value for highly relevant categories
    const highValueCategories: ResearchCategory[] = [
      'orchestration',
      'ai-agents',
      'swarm-architectures',
      'recursive-improvement'
    ];

    if (highValueCategories.includes(category)) {
      value += 0.10;
    }

    // Increase value if query mentions key terms
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('orchestration') || lowerQuery.includes('neuraforge')) {
      value += 0.15;
    }
    if (lowerQuery.includes('multi-agent') || lowerQuery.includes('swarm')) {
      value += 0.10;
    }
    if (lowerQuery.includes('2025') || lowerQuery.includes('latest')) {
      value += 0.05;
    }

    return Math.min(value, 1.0);
  }

  /**
   * Generate implementation suggestion
   */
  private generateImplementationSuggestion(query: string, category: ResearchCategory): string {
    const suggestions: Record<ResearchCategory, string> = {
      'orchestration': 'Review orchestration patterns for potential NEURAFORGE enhancements',
      'ai-agents': 'Evaluate agent architecture improvements for LAPA-VOID agent system',
      'swarm-architectures': 'Explore swarm coordination patterns for multi-agent systems',
      'recursive-improvement': 'Consider recursive improvement mechanisms for continuous evolution',
      'continuous-learning': 'Review continuous learning approaches for agent adaptation',
      'nim-inference': 'Evaluate NVIDIA NIM integration opportunities for inference optimization',
      'inference-optimization': 'Review inference optimization techniques for performance improvements',
      'model-quantization': 'Explore model quantization methods for efficiency gains',
      'llm-models': 'Review latest LLM model developments for potential integration',
      'agent-architectures': 'Evaluate agent architecture patterns for system improvements',
      'performance-optimization': 'Review performance optimization opportunities',
      'multi-agent-systems': 'Evaluate multi-agent system patterns for LAPA-VOID coordination',
      'other': `Review ${query} findings for potential LAPA-VOID improvements`
    };

    return suggestions[category] || suggestions['other'];
  }

  /**
   * Extract tags from query and category
   */
  private extractTags(query: string, category: ResearchCategory): string[] {
    const tags: string[] = [category];
    const lowerQuery = query.toLowerCase();

    const keyTerms = [
      'ai', 'agent', 'llm', 'orchestration', 'swarm', 'inference', 'nim',
      'multi-agent', 'coordination', 'optimization', 'research', '2025',
      'recursive', 'continuous', 'learning', 'quantization', 'model'
    ];

    for (const term of keyTerms) {
      if (lowerQuery.includes(term)) {
        tags.push(term);
      }
    }

    return [...new Set(tags)];
  }

  /**
   * Submit research finding to NEURAFORGE via event bus
   */
  async submitFindingToNeuraforge(finding: ResearchFinding): Promise<SubmissionResult> {
    try {
      // Publish research finding event
      const event: ResearchFindingsAvailableEvent = {
        id: `research-${finding.findingId}`,
        type: 'research.findings.available',
        timestamp: Date.now(),
        source: 'web-research-hybrid',
        payload: {
          findingId: finding.findingId,
          source: finding.source,
          category: finding.category,
          title: finding.title,
          description: finding.description,
          data: finding.data,
          valuePotential: finding.valuePotential,
          implementationSuggestion: finding.implementationSuggestion,
          url: finding.url,
          tags: finding.tags,
          timestamp: finding.timestamp.toISOString(),
          findings: [finding] // Wrap in array for compatibility with persona-evolver
        }
      };

      await eventBus.publish(event);
      
      this.findingsSubmitted++;
      
      console.log(`[WEB_RESEARCH_HYBRID] Submitted finding to NEURAFORGE: ${finding.findingId} (${finding.title})`);

      return {
        success: true,
        findingId: finding.findingId,
        submissionId: event.id
      };
    } catch (error) {
      console.error(`[WEB_RESEARCH_HYBRID] Failed to submit finding ${finding.findingId}:`, error);
      return {
        success: false,
        findingId: finding.findingId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get research statistics
   */
  getStatistics(): {
    active: boolean;
    findingsSubmitted: number;
    lastResearchCycle: Date | null;
    knowledgeBaseStats?: ReturnType<typeof knowledgeBase.getStatistics>;
  } {
    return {
      active: this.researchCycleActive,
      findingsSubmitted: this.findingsSubmitted,
      lastResearchCycle: this.lastResearchCycle,
      knowledgeBaseStats: knowledgeBase.getStatistics()
    };
  }

  /**
   * Track implementation status with bounded map to prevent memory growth
   */
  async trackImplementation(findingId: string, status: 'pending' | 'in-progress' | 'implemented' | 'rejected', notes?: string): Promise<void> {
    // Enforce size limit: remove oldest entries if at capacity
    if (this.implementationTracking.size >= this.MAX_TRACKING_SIZE) {
      // Remove oldest entry (FIFO) - get first key
      const firstKey = this.implementationTracking.keys().next().value;
      if (firstKey) {
        this.implementationTracking.delete(firstKey);
      }
    }
    
    this.implementationTracking.set(findingId, status);
    await knowledgeBase.updateImplementationStatus(findingId, status, notes);
    console.log(`[WEB_RESEARCH_HYBRID] Implementation status updated: ${findingId} -> ${status}`);
  }
}

// Export singleton instance
export const webResearchHybrid = new WebResearchHybrid();

