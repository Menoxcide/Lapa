/**
 * GitHub API Client for WEB_RESEARCH_HYBRID
 * 
 * Searches GitHub for trending AI repositories and projects
 */

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
}

export interface GitHubSearchResult {
  repos: GitHubRepo[];
  query: string;
  totalResults: number;
  timestamp: Date;
}

export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private rateLimitDelay = 1000; // 1 second between requests
  private apiToken?: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.GITHUB_TOKEN;
  }

  /**
   * Search GitHub repositories
   */
  async searchRepositories(
    query: string,
    sort: 'stars' | 'updated' | 'forks' = 'stars',
    order: 'desc' | 'asc' = 'desc',
    perPage: number = 10
  ): Promise<GitHubSearchResult> {
    try {
      await this.delay(this.rateLimitDelay);

      const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${perPage}`;

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WEB_RESEARCH_HYBRID/1.0 (LAPA-VOID Research Agent)'
      };

      if (this.apiToken) {
        headers['Authorization'] = `token ${this.apiToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('[GitHubClient] Rate limit exceeded. Consider using GITHUB_TOKEN.');
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const repos: GitHubRepo[] = [];

      if (data.items) {
        for (const item of data.items) {
          repos.push({
            id: item.id,
            name: item.name,
            fullName: item.full_name,
            description: item.description || '',
            url: item.html_url,
            stars: item.stargazers_count || 0,
            forks: item.forks_count || 0,
            language: item.language || '',
            topics: item.topics || [],
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            owner: item.owner?.login || ''
          });
        }
      }

      return {
        repos,
        query,
        totalResults: data.total_count || repos.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[GitHubClient] Error searching GitHub:', error);
      return {
        repos: [],
        query,
        totalResults: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get trending AI repositories
   */
  async getTrendingAIRepos(language?: string, perPage: number = 10): Promise<GitHubRepo[]> {
    const query = language 
      ? `language:${language} topic:ai OR topic:machine-learning OR topic:llm OR topic:agent`
      : 'topic:ai OR topic:machine-learning OR topic:llm OR topic:agent OR topic:multi-agent';
    
    const result = await this.searchRepositories(query, 'stars', 'desc', perPage);
    return result.repos;
  }

  /**
   * Search for agent-related repositories
   */
  async searchAgentRepos(perPage: number = 10): Promise<GitHubRepo[]> {
    const queries = [
      'multi-agent OR agent-swarm OR agent-orchestration',
      'LLM agent OR language-agent',
      'autonomous-agent OR AI-agent',
      'agent-framework OR agent-library'
    ];

    const allRepos: GitHubRepo[] = [];

    for (const query of queries) {
      try {
        await this.delay(this.rateLimitDelay);
        const result = await this.searchRepositories(query, 'stars', 'desc', Math.ceil(perPage / queries.length));
        allRepos.push(...result.repos);
      } catch (error) {
        console.error(`[GitHubClient] Error searching "${query}":`, error);
      }
    }

    // Remove duplicates and sort by stars
    const uniqueRepos = Array.from(
      new Map(allRepos.map(repo => [repo.id, repo])).values()
    ).sort((a, b) => b.stars - a.stars);

    return uniqueRepos.slice(0, perPage);
  }

  /**
   * Default search queries
   */
  getDefaultQueries(): string[] {
    return [
      'multi-agent OR agent-swarm',
      'LLM inference OR LLM optimization',
      'agent orchestration',
      'NVIDIA NIM OR NIM inference',
      'model quantization',
      'swarm intelligence OR swarm coordination',
      'recursive improvement OR self-improving AI'
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const githubClient = new GitHubClient();

