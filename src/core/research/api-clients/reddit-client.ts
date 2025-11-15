/**
 * Reddit API Client for WEB_RESEARCH_HYBRID
 * 
 * Searches Reddit for AI-related discussions and research
 */

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  createdUtc: number;
  permalink: string;
}

export interface RedditSearchResult {
  posts: RedditPost[];
  subreddit: string;
  query: string;
  timestamp: Date;
}

export class RedditClient {
  private baseUrl = 'https://www.reddit.com';
  private rateLimitDelay = 1000; // 1 second between requests

  /**
   * Search Reddit subreddits for AI-related content
   */
  async searchSubreddits(
    subreddits: string[],
    query: string,
    limit: number = 10
  ): Promise<RedditSearchResult[]> {
    const results: RedditSearchResult[] = [];

    for (const subreddit of subreddits) {
      try {
        await this.delay(this.rateLimitDelay);
        const posts = await this.searchSubreddit(subreddit, query, limit);
        
        if (posts.length > 0) {
          results.push({
            posts,
            subreddit,
            query,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error(`[RedditClient] Error searching r/${subreddit}:`, error);
      }
    }

    return results;
  }

  /**
   * Search a specific subreddit
   */
  private async searchSubreddit(
    subreddit: string,
    query: string,
    limit: number
  ): Promise<RedditPost[]> {
    const url = `${this.baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance&restrict_sr=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WEB_RESEARCH_HYBRID/1.0 (LAPA-VOID Research Agent)'
        }
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      const posts: RedditPost[] = [];

      if (data.data?.children) {
        for (const child of data.data.children) {
          const post = child.data;
          posts.push({
            id: post.id,
            title: post.title,
            selftext: post.selftext || '',
            url: post.url,
            subreddit: post.subreddit,
            author: post.author,
            score: post.score || 0,
            numComments: post.num_comments || 0,
            createdUtc: post.created_utc,
            permalink: `https://reddit.com${post.permalink}`
          });
        }
      }

      return posts;
    } catch (error) {
      console.error(`[RedditClient] Error fetching from r/${subreddit}:`, error);
      return [];
    }
  }

  /**
   * Get trending posts from AI-related subreddits
   */
  async getTrendingPosts(subreddits: string[], limit: number = 5): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];

    for (const subreddit of subreddits) {
      try {
        await this.delay(this.rateLimitDelay);
        const url = `${this.baseUrl}/r/${subreddit}/hot.json?limit=${limit}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WEB_RESEARCH_HYBRID/1.0 (LAPA-VOID Research Agent)'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.children) {
            for (const child of data.data.children) {
              const post = child.data;
              allPosts.push({
                id: post.id,
                title: post.title,
                selftext: post.selftext || '',
                url: post.url,
                subreddit: post.subreddit,
                author: post.author,
                score: post.score || 0,
                numComments: post.num_comments || 0,
                createdUtc: post.created_utc,
                permalink: `https://reddit.com${post.permalink}`
              });
            }
          }
        }
      } catch (error) {
        console.error(`[RedditClient] Error fetching trending from r/${subreddit}:`, error);
      }
    }

    return allPosts;
  }

  /**
   * Default AI-related subreddits to monitor
   */
  getDefaultSubreddits(): string[] {
    return [
      'MachineLearning',
      'artificial',
      'LocalLLaMA',
      'singularity',
      'ChatGPT',
      'OpenAI',
      'learnmachinelearning',
      'datascience',
      'compsci',
      'programming'
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const redditClient = new RedditClient();

