/**
 * Filesystem Persona Loader for LAPA
 * 
 * Bridges NEURAFORGE filesystem persona system (docs/personas/*.md) with
 * runtime PersonaManager. Enables loading personas from markdown files
 * into the runtime agent system.
 * 
 * This is the integration point between NEURAFORGE (filesystem-based
 * development tool) and LAPA (runtime agent system).
 */

import { readFile, readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { personaManager, type Persona } from './persona.manager.ts';

export interface FilesystemPersonaConfig {
  personasDirectory: string;
  enableAutoLoad: boolean;
  watchForChanges: boolean;
}

const DEFAULT_CONFIG: FilesystemPersonaConfig = {
  personasDirectory: join(process.cwd(), 'docs', 'personas'),
  enableAutoLoad: true,
  watchForChanges: false
};

export interface ParsedPersonaFile {
  personaId: string;
  personaName: string;
  content: string;
  metadata: {
    version?: string;
    lastUpdated?: string;
    status?: string;
  };
}

/**
 * Filesystem Persona Loader
 * 
 * Loads personas from markdown files in docs/personas/ directory
 * and integrates them with the runtime PersonaManager
 */
export class FilesystemPersonaLoader {
  private config: FilesystemPersonaConfig;
  private loadedPersonas: Map<string, ParsedPersonaFile>; // personaId -> parsed file
  private personaFilePaths: Map<string, string>; // personaId -> file path

  constructor(config?: Partial<FilesystemPersonaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadedPersonas = new Map();
    this.personaFilePaths = new Map();
  }

  /**
   * Initialize and load all personas from filesystem
   */
  async initialize(): Promise<void> {
    if (this.config.enableAutoLoad) {
      await this.loadAllPersonas();
    }
  }

  /**
   * Load all persona files from the personas directory
   */
  async loadAllPersonas(): Promise<number> {
    try {
      const files = await readdir(this.config.personasDirectory);
      const personaFiles = files.filter(
        file => file.endsWith('_PERSONA.md') || file.endsWith('_PERSONA.MD')
      );

      let loadedCount = 0;
      for (const file of personaFiles) {
        try {
          const filePath = join(this.config.personasDirectory, file);
          const parsed = await this.loadPersonaFromFile(filePath);
          
          if (parsed) {
            // Extract Persona object from markdown
            const persona = await this.parsePersonaFromMarkdown(parsed);
            
            // Load into runtime PersonaManager
            await this.loadPersonaIntoRuntime(persona, filePath);
            
            this.loadedPersonas.set(parsed.personaId, parsed);
            this.personaFilePaths.set(parsed.personaId, filePath);
            loadedCount++;
          }
        } catch (error) {
          console.error(`Failed to load persona from ${file}:`, error);
        }
      }

      console.log(`✅ FilesystemPersonaLoader: Loaded ${loadedCount} personas from filesystem`);
      return loadedCount;
    } catch (error) {
      console.error('Failed to load personas from filesystem:', error);
      return 0;
    }
  }

  /**
   * Load a single persona file
   */
  async loadPersonaFromFile(filePath: string): Promise<ParsedPersonaFile | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const fileName = basename(filePath, extname(filePath));
      
      // Extract persona ID from filename (e.g., NEURAFORGE_PERSONA.md -> NEURAFORGE)
      const personaId = fileName.replace(/_PERSONA$/i, '').toUpperCase();
      
      // Extract metadata from markdown frontmatter or headers
      const metadata = this.extractMetadata(content);
      
      // Extract persona name from content
      const personaName = this.extractPersonaName(content, personaId);

      return {
        personaId,
        personaName,
        content,
        metadata
      };
    } catch (error) {
      console.error(`Failed to read persona file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract metadata from markdown content
   */
  private extractMetadata(content: string): ParsedPersonaFile['metadata'] {
    const metadata: ParsedPersonaFile['metadata'] = {};
    
    // Extract version
    const versionMatch = content.match(/\*\*Version:\*\*\s*([^\n|]+)/i);
    if (versionMatch) {
      metadata.version = versionMatch[1].trim();
    }
    
    // Extract last updated
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*([^\n|]+)/i);
    if (lastUpdatedMatch) {
      metadata.lastUpdated = lastUpdatedMatch[1].trim();
    }
    
    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s*([^\n|]+)/i);
    if (statusMatch) {
      metadata.status = statusMatch[1].trim();
    }
    
    return metadata;
  }

  /**
   * Extract persona name from content
   */
  private extractPersonaName(content: string, defaultName: string): string {
    // Look for "**Name**: PERSONA_NAME" pattern
    const nameMatch = content.match(/\*\*Name\*\*:\s*([^\n]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    
    // Look for "# PERSONA_NAME" heading
    const headingMatch = content.match(/^#\s+([^\n-]+)/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    
    return defaultName;
  }

  /**
   * Parse Persona object from markdown content
   */
  private async parsePersonaFromMarkdown(parsed: ParsedPersonaFile): Promise<Persona> {
    // Extract key sections from markdown
    const personality = this.extractSection(parsed.content, 'personality', 'communicationStyle');
    const communicationStyle = this.extractSection(parsed.content, 'communicationStyle', 'expertise');
    const expertiseAreas = this.extractArray(parsed.content, 'expertiseAreas', 'expertise');
    const behaviorRules = this.extractArray(parsed.content, 'behaviorRules', 'behavior');
    const customInstructions = this.extractSection(parsed.content, 'customInstructions', 'custom');
    
    // Extract interaction preferences
    const interactionPreferences = this.extractInteractionPreferences(parsed.content);
    
    // Create Persona object
    const persona: Persona = {
      id: parsed.personaId.toLowerCase(),
      name: parsed.personaName,
      personality: personality || `${parsed.personaName} agent`,
      communicationStyle: communicationStyle || 'Technical and concise',
      expertiseAreas: expertiseAreas || [parsed.personaId.toLowerCase()],
      interactionPreferences: interactionPreferences || {
        formality: 'technical',
        verbosity: 'moderate',
        tone: 'neutral'
      },
      behaviorRules: behaviorRules || [],
      customInstructions: customInstructions || `Act as ${parsed.personaName}`
    };
    
    return persona;
  }

  /**
   * Extract a section from markdown content
   */
  private extractSection(content: string, searchTerm: string, alternativeSearch?: string): string | null {
    // Look for markdown sections like "## Section" or "**Field**: value"
    const patterns = [
      new RegExp(`\\*\\*${searchTerm}\\*\\*:?\\s*([^\\n]+)`, 'i'),
      new RegExp(`##\\s*${searchTerm}[^\\n]*\\n([^#]+)`, 'i'),
    ];
    
    if (alternativeSearch) {
      patterns.push(
        new RegExp(`\\*\\*${alternativeSearch}\\*\\*:?\\s*([^\\n]+)`, 'i'),
        new RegExp(`##\\s*${alternativeSearch}[^\\n]*\\n([^#]+)`, 'i')
      );
    }
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Extract array from markdown content
   */
  private extractArray(content: string, searchTerm: string, alternativeSearch?: string): string[] {
    const results: string[] = [];
    
    // Look for markdown lists or array patterns
    const listPattern = new RegExp(`(?:\\*\\*${searchTerm}\\*\\*|##\\s*${searchTerm})[^\\n]*\\n((?:[-*]\\s+[^\\n]+\\n?)+)`, 'i');
    const match = content.match(listPattern);
    
    if (match && match[1]) {
      const items = match[1].split('\n')
        .map(line => line.replace(/^[-*]\s+/, '').trim())
        .filter(item => item.length > 0);
      results.push(...items);
    }
    
    // If no results and alternative search provided, try that
    if (results.length === 0 && alternativeSearch) {
      const altPattern = new RegExp(`(?:\\*\\*${alternativeSearch}\\*\\*|##\\s*${alternativeSearch})[^\\n]*\\n((?:[-*]\\s+[^\\n]+\\n?)+)`, 'i');
      const altMatch = content.match(altPattern);
      if (altMatch && altMatch[1]) {
        const items = altMatch[1].split('\n')
          .map(line => line.replace(/^[-*]\s+/, '').trim())
          .filter(item => item.length > 0);
        results.push(...items);
      }
    }
    
    return results;
  }

  /**
   * Extract interaction preferences from content
   */
  private extractInteractionPreferences(content: string): Persona['interactionPreferences'] | null {
    const formality = this.extractField(content, 'formality', ['formal', 'casual', 'technical']);
    const verbosity = this.extractField(content, 'verbosity', ['concise', 'detailed', 'moderate']);
    const tone = this.extractField(content, 'tone', ['neutral', 'enthusiastic', 'analytical', 'friendly']);
    
    if (formality || verbosity || tone) {
      return {
        formality: (formality as any) || 'technical',
        verbosity: (verbosity as any) || 'moderate',
        tone: (tone as any) || 'neutral'
      };
    }
    
    return null;
  }

  /**
   * Extract a field value from content
   */
  private extractField(content: string, fieldName: string, allowedValues?: string[]): string | null {
    const pattern = new RegExp(`(?:\\*\\*)?${fieldName}(?:\\*\\*)?:?\\s*['"]?([^'",\\n\\s]+)`, 'i');
    const match = content.match(pattern);
    
    if (match && match[1]) {
      const value = match[1].trim().toLowerCase();
      if (!allowedValues || allowedValues.includes(value)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Load persona into runtime PersonaManager
   */
  private async loadPersonaIntoRuntime(persona: Persona, filePath: string): Promise<void> {
    try {
      // Check if persona already exists
      const existing = await personaManager.getPersona(persona.id);
      
      if (existing) {
        // Update existing persona
        personaManager.updatePersona(persona.id, persona);
        console.log(`📝 Updated persona ${persona.name} (${persona.id}) from filesystem`);
      } else {
        // Create new persona
        personaManager.createPersona(persona);
        console.log(`✨ Loaded persona ${persona.name} (${persona.id}) from filesystem`);
      }
    } catch (error) {
      console.error(`Failed to load persona ${persona.id} into runtime:`, error);
    }
  }

  /**
   * Reload a specific persona from filesystem
   */
  async reloadPersona(personaId: string): Promise<boolean> {
    const filePath = this.personaFilePaths.get(personaId);
    if (!filePath) {
      console.warn(`Persona ${personaId} not found in filesystem`);
      return false;
    }
    
    const parsed = await this.loadPersonaFromFile(filePath);
    if (!parsed) {
      return false;
    }
    
    const persona = await this.parsePersonaFromMarkdown(parsed);
    await this.loadPersonaIntoRuntime(persona, filePath);
    
    this.loadedPersonas.set(personaId, parsed);
    return true;
  }

  /**
   * Get parsed persona file
   */
  getParsedPersona(personaId: string): ParsedPersonaFile | undefined {
    return this.loadedPersonas.get(personaId);
  }

  /**
   * Get file path for a persona
   */
  getPersonaFilePath(personaId: string): string | undefined {
    return this.personaFilePaths.get(personaId);
  }

  /**
   * List all loaded personas from filesystem
   */
  listLoadedPersonas(): string[] {
    return Array.from(this.loadedPersonas.keys());
  }
}

// Export singleton instance
export const filesystemPersonaLoader = new FilesystemPersonaLoader();

