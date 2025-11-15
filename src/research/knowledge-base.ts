/**
 * Knowledge Base for WEB_RESEARCH_HYBRID
 * 
 * Stores and retrieves research findings for long-term knowledge management
 */

import type { ResearchFinding } from './web-research-hybrid.ts';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface KnowledgeBaseEntry {
  finding: ResearchFinding;
  storedAt: Date;
  accessedCount: number;
  lastAccessed: Date;
  implementationStatus?: 'pending' | 'in-progress' | 'implemented' | 'rejected';
  implementationNotes?: string;
}

export class ResearchKnowledgeBase {
  private storagePath: string;
  private entries: Map<string, KnowledgeBaseEntry> = new Map();

  constructor(storagePath: string = './data/research-knowledge-base') {
    this.storagePath = storagePath;
  }

  /**
   * Initialize knowledge base
   */
  async initialize(): Promise<void> {
    try {
      // Ensure storage directory exists
      if (!existsSync(this.storagePath)) {
        await mkdir(this.storagePath, { recursive: true });
      }

      // Load existing entries
      await this.loadEntries();
      
      console.log(`[KnowledgeBase] Initialized with ${this.entries.size} entries`);
    } catch (error) {
      console.error('[KnowledgeBase] Initialization error:', error);
    }
  }

  /**
   * Store a research finding
   */
  async storeFinding(finding: ResearchFinding): Promise<void> {
    try {
      const entry: KnowledgeBaseEntry = {
        finding,
        storedAt: new Date(),
        accessedCount: 0,
        lastAccessed: new Date(),
        implementationStatus: 'pending'
      };

      this.entries.set(finding.findingId, entry);
      await this.saveEntry(entry);
      
      console.log(`[KnowledgeBase] Stored finding: ${finding.findingId}`);
    } catch (error) {
      console.error(`[KnowledgeBase] Error storing finding ${finding.findingId}:`, error);
    }
  }

  /**
   * Retrieve a finding by ID
   */
  getFinding(findingId: string): KnowledgeBaseEntry | undefined {
    const entry = this.entries.get(findingId);
    if (entry) {
      entry.accessedCount++;
      entry.lastAccessed = new Date();
    }
    return entry;
  }

  /**
   * Search findings by query
   */
  searchFindings(query: string, limit: number = 10): KnowledgeBaseEntry[] {
    const lowerQuery = query.toLowerCase();
    const results: KnowledgeBaseEntry[] = [];

    for (const entry of this.entries.values()) {
      const finding = entry.finding;
      const searchableText = [
        finding.title,
        finding.description,
        finding.category,
        ...finding.tags
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        results.push(entry);
      }
    }

    // Sort by value potential and recency
    results.sort((a, b) => {
      const valueDiff = b.finding.valuePotential - a.finding.valuePotential;
      if (valueDiff !== 0) return valueDiff;
      return b.finding.timestamp.getTime() - a.finding.timestamp.getTime();
    });

    return results.slice(0, limit);
  }

  /**
   * Get findings by category
   */
  getFindingsByCategory(category: string, limit: number = 10): KnowledgeBaseEntry[] {
    const results: KnowledgeBaseEntry[] = [];

    for (const entry of this.entries.values()) {
      if (entry.finding.category === category) {
        results.push(entry);
      }
    }

    results.sort((a, b) => b.finding.valuePotential - a.finding.valuePotential);
    return results.slice(0, limit);
  }

  /**
   * Get pending findings (not yet implemented)
   */
  getPendingFindings(limit: number = 50): KnowledgeBaseEntry[] {
    const results: KnowledgeBaseEntry[] = [];

    for (const entry of this.entries.values()) {
      const status = entry.implementationStatus || 'pending';
      if (status === 'pending' || status === 'in-progress') {
        results.push(entry);
      }
    }

    // Sort by value potential (highest first), then by recency
    results.sort((a, b) => {
      const valueDiff = b.finding.valuePotential - a.finding.valuePotential;
      if (valueDiff !== 0) return valueDiff;
      return b.finding.timestamp.getTime() - a.finding.timestamp.getTime();
    });

    return results.slice(0, limit);
  }

  /**
   * Get all entries (for internal access)
   */
  getAllEntries(): KnowledgeBaseEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Update implementation status
   */
  async updateImplementationStatus(
    findingId: string,
    status: KnowledgeBaseEntry['implementationStatus'],
    notes?: string
  ): Promise<void> {
    const entry = this.entries.get(findingId);
    if (entry) {
      entry.implementationStatus = status;
      entry.implementationNotes = notes;
      await this.saveEntry(entry);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalFindings: number;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    averageValuePotential: number;
  } {
    const stats = {
      totalFindings: this.entries.size,
      byCategory: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageValuePotential: 0
    };

    let totalValue = 0;

    for (const entry of this.entries.values()) {
      const finding = entry.finding;

      // Count by category
      stats.byCategory[finding.category] = (stats.byCategory[finding.category] || 0) + 1;

      // Count by source
      stats.bySource[finding.source] = (stats.bySource[finding.source] || 0) + 1;

      // Count by status
      const status = entry.implementationStatus || 'pending';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      totalValue += finding.valuePotential;
    }

    stats.averageValuePotential = this.entries.size > 0 ? totalValue / this.entries.size : 0;

    return stats;
  }

  /**
   * Save entry to disk
   */
  private async saveEntry(entry: KnowledgeBaseEntry): Promise<void> {
    try {
      const filePath = join(this.storagePath, `${entry.finding.findingId}.json`);
      await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[KnowledgeBase] Error saving entry ${entry.finding.findingId}:`, error);
    }
  }

  /**
   * Load entries from disk
   */
  private async loadEntries(): Promise<void> {
    try {
      // In a full implementation, this would load all JSON files from storagePath
      // For now, we'll keep entries in memory
      this.entries.clear();
    } catch (error) {
      console.error('[KnowledgeBase] Error loading entries:', error);
    }
  }
}

export const knowledgeBase = new ResearchKnowledgeBase();

