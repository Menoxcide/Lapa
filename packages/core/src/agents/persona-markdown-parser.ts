/**
 * Persona Markdown Parser for LAPA Agents
 * 
 * Parses markdown persona documents from docs/personas/ into Persona objects.
 * Extracts structured data from markdown format while preserving rich content.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { Persona } from './persona.manager.ts';

export interface PersonaMarkdownMetadata {
  version?: string;
  lastUpdated?: string;
  status?: 'ACTIVE' | 'DEPRECATED' | 'DRAFT';
  project?: string;
  role?: string;
}

export interface ParsedPersona extends Persona {
  markdownContent: string;
  metadata: PersonaMarkdownMetadata;
  sections: {
    identity?: {
      name: string;
      role: string;
      mission: string;
      coreResponsibilities: string[];
    };
    criticalRules?: string[];
    coreDirectives?: string;
    metricsDashboard?: string;
    workflowPatterns?: string[];
    decisionFrameworks?: string;
    codePatterns?: string;
  };
}

/**
 * Persona Markdown Parser
 * 
 * Parses markdown persona documents into structured Persona objects.
 */
export class PersonaMarkdownParser {
  private personasPath: string;

  constructor(personasPath?: string) {
    this.personasPath = personasPath || join(process.cwd(), 'docs', 'personas');
  }

  /**
   * Parse a single persona markdown file
   */
  async parsePersonaFile(filePath: string): Promise<ParsedPersona> {
    const content = await readFile(filePath, 'utf-8');
    const personaId = this.extractPersonaId(filePath);
    
    // Extract metadata from frontmatter or header
    const metadata = this.extractMetadata(content);
    
    // Extract agent identity
    const identity = this.extractAgentIdentity(content);
    
    // Extract critical rules
    const criticalRules = this.extractCriticalRules(content);
    
    // Extract core directives
    const coreDirectives = this.extractCoreDirectives(content);
    
    // Extract metrics dashboard
    const metricsDashboard = this.extractMetricsDashboard(content);
    
    // Extract workflow patterns
    const workflowPatterns = this.extractWorkflowPatterns(content);
    
    // Extract decision frameworks
    const decisionFrameworks = this.extractDecisionFrameworks(content);
    
    // Extract code patterns
    const codePatterns = this.extractCodePatterns(content);
    
    // Extract expertise areas from various sections
    const expertiseAreas = this.extractExpertiseAreas(content, identity);
    
    // Infer communication style and preferences
    const communicationStyle = this.inferCommunicationStyle(content);
    const interactionPreferences = this.inferInteractionPreferences(content);
    
    // Build behavior rules from critical rules
    const behaviorRules = this.buildBehaviorRules(criticalRules, content);
    
    // Build custom instructions from core directives
    const customInstructions = this.buildCustomInstructions(coreDirectives, content);

    if (!identity) {
      throw new Error(`Failed to extract agent identity from persona file: ${filePath}`);
    }

    return {
      id: personaId,
      name: identity.name,
      personality: identity.mission,
      communicationStyle,
      expertiseAreas,
      interactionPreferences,
      behaviorRules,
      customInstructions,
      markdownContent: content,
      metadata,
      sections: {
        identity,
        criticalRules,
        coreDirectives,
        metricsDashboard,
        workflowPatterns,
        decisionFrameworks,
        codePatterns
      }
    };
  }

  /**
   * Load all personas from markdown files
   * @param optimizeForTOON Whether to optimize personas with TOON
   */
  async loadAllPersonas(optimizeForTOON: boolean = true): Promise<ParsedPersona[] | any[]> {
    try {
      const files = await readdir(this.personasPath);
      const personaFiles = files.filter(f => f.endsWith('_PERSONA.md'));
      
      const personas = await Promise.all(
        personaFiles.map(file => 
          this.parsePersonaFile(join(this.personasPath, file))
            .catch(error => {
              console.error(`Failed to parse persona file ${file}:`, error);
              return null;
            })
        )
      );
      
      const validPersonas = personas.filter((p): p is ParsedPersona => p !== null);

      // Optimize with TOON if requested
      if (optimizeForTOON && validPersonas.length > 0) {
        try {
          // Dynamic import to avoid circular dependencies
          const { personaTOONOptimizer } = await import('./persona-toon-optimizer.ts');
          return validPersonas.map(p => personaTOONOptimizer.optimizePersona(p));
        } catch (error) {
          console.warn('TOON optimization failed during load, returning original personas:', error);
          return validPersonas;
        }
      }

      return validPersonas;
    } catch (error) {
      console.error(`Failed to load personas from ${this.personasPath}:`, error);
      return [];
    }
  }

  /**
   * Extract persona ID from file path
   */
  private extractPersonaId(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const match = fileName.match(/^(.+?)_PERSONA\.md$/);
    if (match) {
      return match[1].toLowerCase().replace(/_/g, '-');
    }
    return fileName.replace('.md', '').toLowerCase();
  }

  /**
   * Extract metadata from markdown frontmatter or header
   */
  private extractMetadata(content: string): PersonaMarkdownMetadata {
    const metadata: PersonaMarkdownMetadata = {};
    
    // Extract version
    const versionMatch = content.match(/\*\*Version:\*\*\s*([^\s|]+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1].trim();
    }
    
    // Extract last updated
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*([^\s|]+)/);
    if (lastUpdatedMatch) {
      metadata.lastUpdated = lastUpdatedMatch[1].trim();
    }
    
    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
    if (statusMatch) {
      const status = statusMatch[1].trim().toUpperCase();
      if (status === 'ACTIVE' || status === 'DEPRECATED' || status === 'DRAFT') {
        metadata.status = status as PersonaMarkdownMetadata['status'];
      }
    }
    
    // Extract project
    const projectMatch = content.match(/\*\*Project:\*\*\s*([^\s|]+)/);
    if (projectMatch) {
      metadata.project = projectMatch[1].trim();
    }
    
    // Extract role
    const roleMatch = content.match(/\*\*Role:\*\*\s*([^\n]+)/);
    if (roleMatch) {
      metadata.role = roleMatch[1].trim();
    }
    
    return metadata;
  }

  /**
   * Extract agent identity section
   */
  private extractAgentIdentity(content: string): ParsedPersona['sections']['identity'] {
    const identitySection = this.extractSection(content, '🎯 Agent Identity');
    if (!identitySection) {
      return undefined;
    }
    
    const nameMatch = identitySection.match(/\*\*Name\*\*:\s*(.+?)(?:\n|$)/);
    const roleMatch = identitySection.match(/\*\*Role\*\*:\s*(.+?)(?:\n|$)/);
    const missionMatch = identitySection.match(/\*\*Mission\*\*:\s*"(.+?)"/);
    
    const responsibilities: string[] = [];
    const responsibilitiesMatch = identitySection.match(/\*\*Core Responsibilities\*\*:\s*\n((?:- ✅ .+\n?)+)/);
    if (responsibilitiesMatch) {
      const respLines = responsibilitiesMatch[1].match(/- ✅ (.+)/g);
      if (respLines) {
        responsibilities.push(...respLines.map(line => line.replace(/- ✅ /, '').trim()));
      }
    }
    
    return {
      name: nameMatch?.[1]?.trim() || '',
      role: roleMatch?.[1]?.trim() || '',
      mission: missionMatch?.[1]?.trim() || '',
      coreResponsibilities: responsibilities
    };
  }

  /**
   * Extract critical autonomous rules
   */
  private extractCriticalRules(content: string): string[] {
    const rulesSection = this.extractSection(content, '🧠 CRITICAL AUTONOMOUS RULES');
    if (!rulesSection) {
      return [];
    }
    
    const rules: string[] = [];
    
    // Extract rule blocks (Rule 1, Rule 2, etc.)
    const ruleMatches = rulesSection.match(/### Rule \d+:.+?(?=### Rule \d+:|$)/gs);
    if (ruleMatches) {
      for (const ruleBlock of ruleMatches) {
        // Extract rule title
        const titleMatch = ruleBlock.match(/### Rule \d+:\s*(.+?)(?:\n|$)/);
        if (titleMatch) {
          rules.push(titleMatch[1].trim());
        }
        
        // Extract "Before ANY action" or "I NEVER accept" lists
        const beforeMatch = ruleBlock.match(/\*\*Before ANY action, I MUST:\*\*\s*\n((?:\d+\.\s*.+\n?)+)/);
        if (beforeMatch) {
          const items = beforeMatch[1].match(/\d+\.\s*(.+)/g);
          if (items) {
            rules.push(...items.map(item => item.replace(/^\d+\.\s*/, '').trim()));
          }
        }
        
        const neverMatch = ruleBlock.match(/\*\*I NEVER accept:\*\*\s*\n((?:- .+\n?)+)/);
        if (neverMatch) {
          const items = neverMatch[1].match(/- (.+)/g);
          if (items) {
            rules.push(...items.map(item => item.replace(/^- /, '').trim()));
          }
        }
      }
    }
    
    return rules;
  }

  /**
   * Extract core directives section
   */
  private extractCoreDirectives(content: string): string {
    const directivesSection = this.extractSection(content, '🚀 Core Directives');
    if (!directivesSection) {
      return '';
    }
    
    // Extract main directives text
    return directivesSection
      .replace(/^##\s+.*$/gm, '')
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Extract metrics dashboard section
   */
  private extractMetricsDashboard(content: string): string {
    const metricsSection = this.extractSection(content, '📊 CORE METRICS DASHBOARD');
    return metricsSection || '';
  }

  /**
   * Extract workflow patterns
   */
  private extractWorkflowPatterns(content: string): string[] {
    const patternsSection = this.extractSection(content, '🎯 AUTONOMOUS WORKFLOW PATTERNS');
    if (!patternsSection) {
      return [];
    }
    
    const patterns: string[] = [];
    const patternMatches = patternsSection.match(/### Pattern \d+:.+?(?=### Pattern \d+:|$)/gs);
    if (patternMatches) {
      for (const pattern of patternMatches) {
        const titleMatch = pattern.match(/### Pattern \d+:\s*(.+?)(?:\n|$)/);
        if (titleMatch) {
          patterns.push(titleMatch[1].trim());
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extract decision frameworks
   */
  private extractDecisionFrameworks(content: string): string {
    const frameworksSection = this.extractSection(content, '📋 Decision Framework');
    return frameworksSection || '';
  }

  /**
   * Extract code patterns
   */
  private extractCodePatterns(content: string): string {
    const patternsSection = this.extractSection(content, '💻 Code Patterns');
    return patternsSection || '';
  }

  /**
   * Extract expertise areas from content
   */
  private extractExpertiseAreas(content: string, identity?: ParsedPersona['sections']['identity']): string[] {
    const areas: string[] = [];
    
    // Extract from core responsibilities
    if (identity?.coreResponsibilities) {
      for (const resp of identity.coreResponsibilities) {
        // Extract key terms (simplified)
        const keywords = resp.match(/\b\w+(?:\s+\w+)?\b/g);
        if (keywords) {
          areas.push(...keywords.slice(0, 2)); // Take first 2 keywords
        }
      }
    }
    
    // Extract from expertise areas section if exists
    const expertiseSection = this.extractSection(content, '🎓 Expertise Areas');
    if (expertiseSection) {
      const listItems = expertiseSection.match(/- (.+)/g);
      if (listItems) {
        areas.push(...listItems.map(item => item.replace(/^- /, '').trim()));
      }
    }
    
    // Deduplicate and limit
    return [...new Set(areas)].slice(0, 10);
  }

  /**
   * Infer communication style from content
   */
  private inferCommunicationStyle(content: string): string {
    // Look for communication style indicators
    if (content.includes('concise') || content.includes('brief')) {
      return 'Technical and concise';
    }
    if (content.includes('detailed') || content.includes('comprehensive')) {
      return 'Structured and comprehensive';
    }
    if (content.includes('enthusiastic') || content.includes('excited')) {
      return 'Enthusiastic and engaging';
    }
    return 'Technical and professional';
  }

  /**
   * Infer interaction preferences from content
   */
  private inferInteractionPreferences(content: string): Persona['interactionPreferences'] {
    const prefs: Persona['interactionPreferences'] = {
      formality: 'technical',
      verbosity: 'moderate',
      tone: 'neutral'
    };
    
    // Infer formality
    if (content.includes('formal') || content.includes('professional')) {
      prefs.formality = 'formal';
    } else if (content.includes('casual') || content.includes('friendly')) {
      prefs.formality = 'casual';
    }
    
    // Infer verbosity
    if (content.includes('concise') || content.includes('brief')) {
      prefs.verbosity = 'concise';
    } else if (content.includes('detailed') || content.includes('comprehensive')) {
      prefs.verbosity = 'detailed';
    }
    
    // Infer tone
    if (content.includes('enthusiastic') || content.includes('excited')) {
      prefs.tone = 'enthusiastic';
    } else if (content.includes('analytical') || content.includes('methodical')) {
      prefs.tone = 'analytical';
    } else if (content.includes('friendly') || content.includes('welcoming')) {
      prefs.tone = 'friendly';
    }
    
    return prefs;
  }

  /**
   * Build behavior rules from critical rules and content
   */
  private buildBehaviorRules(criticalRules: string[], content: string): string[] {
    const rules = [...criticalRules];
    
    // Extract additional rules from behavior rules section
    const behaviorSection = this.extractSection(content, '🎯 Behavior Rules');
    if (behaviorSection) {
      const ruleMatches = behaviorSection.match(/- (.+)/g);
      if (ruleMatches) {
        rules.push(...ruleMatches.map(m => m.replace(/^- /, '').trim()));
      }
    }
    
    // Limit to most important rules
    return rules.slice(0, 10);
  }

  /**
   * Build custom instructions from core directives
   */
  private buildCustomInstructions(coreDirectives: string, content: string): string {
    if (coreDirectives) {
      return coreDirectives.substring(0, 500); // Limit length
    }
    
    // Fallback: extract from mission
    const missionMatch = content.match(/\*\*Mission\*\*:\s*"(.+?)"/);
    if (missionMatch) {
      return missionMatch[1];
    }
    
    return 'Follow agent persona guidelines and maintain high quality standards.';
  }

  /**
   * Extract a section from markdown content
   */
  private extractSection(content: string, sectionTitle: string): string {
    // Match section header (with or without emoji)
    const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`##\\s+${escapedTitle}[^#]*?(?=##|$)`, 's');
    const match = content.match(pattern);
    return match ? match[0].trim() : '';
  }
}

// Export singleton instance
export const personaMarkdownParser = new PersonaMarkdownParser();

