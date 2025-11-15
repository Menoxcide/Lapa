/**
 * arXiv API Client for WEB_RESEARCH_HYBRID
 * 
 * Searches arXiv for AI research papers
 */

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: Date;
  updated: Date;
  categories: string[];
  pdfUrl: string;
  arxivUrl: string;
}

export interface ArxivSearchResult {
  papers: ArxivPaper[];
  query: string;
  totalResults: number;
  timestamp: Date;
}

export class ArxivClient {
  private baseUrl = 'http://export.arxiv.org/api/query';
  private rateLimitDelay = 2000; // 2 seconds between requests (arXiv is more strict)

  /**
   * Search arXiv for papers
   */
  async searchPapers(
    query: string,
    maxResults: number = 10,
    sortBy: 'relevance' | 'lastUpdatedDate' | 'submittedDate' = 'relevance'
  ): Promise<ArxivSearchResult> {
    try {
      await this.delay(this.rateLimitDelay);

      const sortOrder = sortBy === 'relevance' ? 'relevance' : 
                       sortBy === 'lastUpdatedDate' ? 'lastUpdatedDate' : 'submittedDate';

      const url = `${this.baseUrl}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=${sortOrder}&sortOrder=descending`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WEB_RESEARCH_HYBRID/1.0 (LAPA-VOID Research Agent)'
        }
      });

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xmlText = await response.text();
      const papers = this.parseArxivXML(xmlText);

      return {
        papers,
        query,
        totalResults: papers.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[ArxivClient] Error searching arXiv:', error);
      return {
        papers: [],
        query,
        totalResults: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Parse arXiv XML response
   */
  private parseArxivXML(xmlText: string): ArxivPaper[] {
    const papers: ArxivPaper[] = [];
    
    try {
      // Simple XML parsing (in production, use a proper XML parser)
      const entryMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
      
      for (const match of entryMatches) {
        const entry = match[1];
        
        const idMatch = entry.match(/<id>(.*?)<\/id>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/);
        
        const authors: string[] = [];
        const authorMatches = entry.matchAll(/<name>(.*?)<\/name>/g);
        for (const authorMatch of authorMatches) {
          authors.push(authorMatch[1].trim());
        }
        
        const categories: string[] = [];
        const categoryMatches = entry.matchAll(/<category term="(.*?)"/g);
        for (const categoryMatch of categoryMatches) {
          categories.push(categoryMatch[1]);
        }
        
        if (idMatch && titleMatch) {
          const arxivId = idMatch[1].replace('http://arxiv.org/abs/', '').replace('http://arxiv.org/abs/', '');
          
          papers.push({
            id: arxivId,
            title: titleMatch[1].replace(/\s+/g, ' ').trim(),
            summary: summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '',
            authors,
            published: publishedMatch ? new Date(publishedMatch[1]) : new Date(),
            updated: updatedMatch ? new Date(updatedMatch[1]) : new Date(),
            categories,
            pdfUrl: `http://arxiv.org/pdf/${arxivId}.pdf`,
            arxivUrl: `http://arxiv.org/abs/${arxivId}`
          });
        }
      }
    } catch (error) {
      console.error('[ArxivClient] Error parsing arXiv XML:', error);
    }

    return papers;
  }

  /**
   * Get recent papers in AI categories
   */
  async getRecentAIPapers(maxResults: number = 10): Promise<ArxivPaper[]> {
    const categories = [
      'cs.AI',      // Artificial Intelligence
      'cs.LG',      // Machine Learning
      'cs.CL',      // Computation and Language
      'cs.NE',      // Neural and Evolutionary Computing
      'stat.ML'     // Machine Learning (Statistics)
    ];

    const allPapers: ArxivPaper[] = [];

    for (const category of categories) {
      try {
        await this.delay(this.rateLimitDelay);
        const result = await this.searchPapers(`cat:${category}`, Math.floor(maxResults / categories.length), 'submittedDate');
        allPapers.push(...result.papers);
      } catch (error) {
        console.error(`[ArxivClient] Error fetching ${category}:`, error);
      }
    }

    return allPapers.slice(0, maxResults);
  }

  /**
   * Default AI search queries
   */
  getDefaultQueries(): string[] {
    return [
      'all:"multi-agent" OR all:"agent swarm"',
      'all:"orchestration" AND (all:"AI" OR all:"agent")',
      'all:"LLM" AND (all:"inference" OR all:"optimization")',
      'all:"recursive" AND (all:"improvement" OR all:"learning")',
      'all:"NIM" OR all:"NVIDIA inference"',
      'all:"quantization" AND all:"LLM"',
      'all:"swarm" AND (all:"coordination" OR all:"architecture")'
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const arxivClient = new ArxivClient();

