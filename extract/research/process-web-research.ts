/**
 * Process Web Research Results and Submit to NEURAFORGE
 * 
 * This script processes web search results and converts them into research findings
 * for submission to NEURAFORGE via the event bus.
 */

import { webResearchHybrid, type ResearchFinding } from './web-research-hybrid.ts';

/**
 * Process web search results into research findings
 */
export function processWebSearchResults(searchResults: Array<{
  title: string;
  content: string;
  searchTerm: string;
}>): ResearchFinding[] {
  const findings: ResearchFinding[] = [];

  for (const result of searchResults) {
    // Extract relevant information from search results
    const finding: ResearchFinding = {
      findingId: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'web-search',
      category: categorizeResult(result.searchTerm, result.content),
      title: result.title || `Research: ${result.searchTerm}`,
      description: result.content.substring(0, 500), // First 500 chars
      data: {
        searchTerm: result.searchTerm,
        fullContent: result.content,
        title: result.title,
        extractedAt: new Date().toISOString()
      },
      valuePotential: calculateValuePotential(result.content, result.searchTerm),
      implementationSuggestion: generateImplementationSuggestion(result.searchTerm, result.content),
      tags: extractTags(result.searchTerm, result.content),
      timestamp: new Date()
    };

    findings.push(finding);
  }

  return findings;
}

/**
 * Categorize research result based on search term and content
 */
function categorizeResult(searchTerm: string, content: string): ResearchFinding['category'] {
  const lowerTerm = searchTerm.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerTerm.includes('nim') || lowerContent.includes('nvidia nim')) {
    return 'nim-inference';
  }
  if (lowerTerm.includes('orchestration') || lowerContent.includes('orchestration')) {
    return 'orchestration';
  }
  if (lowerTerm.includes('swarm') || lowerContent.includes('swarm')) {
    return 'swarm-architectures';
  }
  if (lowerTerm.includes('agent') || lowerContent.includes('agent')) {
    return 'ai-agents';
  }
  if (lowerTerm.includes('recursive') || lowerContent.includes('recursive')) {
    return 'recursive-improvement';
  }
  if (lowerTerm.includes('learning') || lowerContent.includes('continuous learning')) {
    return 'continuous-learning';
  }
  if (lowerTerm.includes('inference') || lowerContent.includes('inference')) {
    return 'inference-optimization';
  }
  if (lowerTerm.includes('quantization') || lowerContent.includes('quantization')) {
    return 'model-quantization';
  }

  return 'other';
}

/**
 * Calculate value potential (0.0 to 1.0)
 */
function calculateValuePotential(content: string, searchTerm: string): number {
  let value = 0.01; // Base 1% value (meets threshold)

  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();

  // Increase value based on relevance indicators
  if (lowerContent.includes('lapa') || lowerContent.includes('neuraforge')) {
    value += 0.20; // High relevance to our project
  }
  if (lowerContent.includes('multi-agent') || lowerContent.includes('agent swarm')) {
    value += 0.15; // Relevant to our architecture
  }
  if (lowerContent.includes('orchestration') || lowerContent.includes('coordination')) {
    value += 0.10; // Relevant to NEURAFORGE
  }
  if (lowerContent.includes('2025') || lowerContent.includes('latest')) {
    value += 0.05; // Recent information
  }
  if (lowerContent.includes('research') || lowerContent.includes('paper')) {
    value += 0.05; // Research-backed
  }

  // Cap at 1.0
  return Math.min(value, 1.0);
}

/**
 * Generate implementation suggestion
 */
function generateImplementationSuggestion(searchTerm: string, content: string): string {
  const suggestions: string[] = [];

  if (content.toLowerCase().includes('orchestration')) {
    suggestions.push('Consider enhancing NEURAFORGE orchestrator with findings from this research');
  }
  if (content.toLowerCase().includes('agent')) {
    suggestions.push('Evaluate agent architecture improvements based on this research');
  }
  if (content.toLowerCase().includes('inference')) {
    suggestions.push('Review inference optimization opportunities for LAPA-VOID');
  }
  if (content.toLowerCase().includes('swarm')) {
    suggestions.push('Explore swarm architecture patterns for multi-agent coordination');
  }

  return suggestions.join('. ') || `Review ${searchTerm} findings for potential LAPA-VOID improvements`;
}

/**
 * Extract tags from search term and content
 */
function extractTags(searchTerm: string, content: string): string[] {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();

  // Extract key terms
  const keyTerms = [
    'ai', 'agent', 'llm', 'orchestration', 'swarm', 'inference', 'nim',
    'multi-agent', 'coordination', 'optimization', 'research', '2025'
  ];

  for (const term of keyTerms) {
    if (lowerContent.includes(term) || lowerTerm.includes(term)) {
      tags.push(term);
    }
  }

  // Add category-based tags
  if (lowerContent.includes('neuraforge')) tags.push('neuraforge');
  if (lowerContent.includes('lapa')) tags.push('lapa-void');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Submit findings to NEURAFORGE
 */
export async function submitFindingsToNeuraforge(findings: ResearchFinding[]): Promise<void> {
  console.log(`[WEB_RESEARCH_HYBRID] Processing ${findings.length} research findings...`);

  for (const finding of findings) {
    // Only submit findings with >= 1% value potential
    if (finding.valuePotential >= 0.01) {
      await webResearchHybrid.submitFindingToNeuraforge(finding);
    }
  }

  console.log(`[WEB_RESEARCH_HYBRID] Submitted findings to NEURAFORGE`);
}

