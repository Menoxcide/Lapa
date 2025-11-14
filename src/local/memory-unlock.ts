/**
 * Memory Unlock System for LAPA Phase 5 I6
 * 
 * Implements memory unlock mechanism (Phase 31 reference) that allows
 * agents to access deeper memory layers and unlock previously restricted
 * memory content based on trust, usage patterns, and agent capabilities.
 * 
 * Features:
 * - Progressive memory unlock based on agent trust scores
 * - Context-aware memory access control
 * - Integration with Memori Engine, Episodic Memory, and Chroma
 * - Skill-based memory unlocking (W52 skill market reference)
 */

import type { MemoriEngine } from './memori-engine.ts';
import type { EpisodicMemoryStore } from './episodic.ts';
import { eventBus } from '../core/event-bus.ts';
import type { LAPAEvent } from '../core/types/event-types.ts';

export interface MemoryUnlockConfig {
  enableProgressiveUnlock: boolean;
  trustThreshold: number; // 0-1, minimum trust to unlock
  usageBasedUnlock: boolean;
  skillBasedUnlock: boolean;
  maxUnlockLevel: number; // Maximum unlock depth
  unlockDecayRate: number; // How quickly unlocks decay if unused
}

const DEFAULT_CONFIG: MemoryUnlockConfig = {
  enableProgressiveUnlock: true,
  trustThreshold: 0.7,
  usageBasedUnlock: true,
  skillBasedUnlock: true,
  maxUnlockLevel: 5,
  unlockDecayRate: 0.05 // 5% decay per day of non-use
};

export interface MemoryUnlockLevel {
  level: number;
  name: string;
  description: string;
  requiredTrust: number;
  requiredSkills: string[];
  unlockedAt?: Date;
  lastAccessed?: Date;
  accessCount: number;
}

export interface AgentTrustScore {
  agentId: string;
  trustScore: number; // 0-1
  skillLevels: Map<string, number>; // skill -> level (0-1)
  totalInteractions: number;
  successfulInteractions: number;
  lastInteraction: Date;
}

export class MemoryUnlockSystem {
  private config: MemoryUnlockConfig;
  private memoriEngine: MemoriEngine;
  private episodicMemory?: EpisodicMemoryStore;
  private agentTrustScores: Map<string, AgentTrustScore>;
  private unlockedLevels: Map<string, Set<number>>; // agentId -> unlocked levels
  private unlockHistory: MemoryUnlockLevel[];

  constructor(
    memoriEngine: MemoriEngine,
    episodicMemory?: EpisodicMemoryStore,
    config?: Partial<MemoryUnlockConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoriEngine = memoriEngine;
    this.episodicMemory = episodicMemory;
    this.agentTrustScores = new Map();
    this.unlockedLevels = new Map();
    this.unlockHistory = [];
  }

  /**
   * Initialize the memory unlock system
   */
  async initialize(): Promise<void> {
    // Load existing trust scores and unlock states
    await this.loadTrustScores();
    await this.loadUnlockStates();
    
    // Subscribe to agent interaction events
    eventBus.subscribe('agent.interaction', this.handleAgentInteraction.bind(this));
    eventBus.subscribe('agent.skill.acquired', this.handleSkillAcquisition.bind(this));
  }

  /**
   * Get trust score for an agent
   */
  getAgentTrustScore(agentId: string): AgentTrustScore {
    if (!this.agentTrustScores.has(agentId)) {
      this.agentTrustScores.set(agentId, {
        agentId,
        trustScore: 0.5, // Default trust
        skillLevels: new Map(),
        totalInteractions: 0,
        successfulInteractions: 0,
        lastInteraction: new Date()
      });
    }
    return this.agentTrustScores.get(agentId)!;
  }

  /**
   * Update agent trust score based on interaction outcome
   */
  updateTrustScore(agentId: string, success: boolean, quality: number = 1.0): void {
    const trust = this.getAgentTrustScore(agentId);
    trust.totalInteractions++;
    if (success) {
      trust.successfulInteractions++;
    }
    trust.lastInteraction = new Date();

    // Calculate trust score: success rate weighted by quality
    const successRate = trust.successfulInteractions / trust.totalInteractions;
    trust.trustScore = Math.min(1.0, successRate * quality);

    // Check for new unlocks
    this.checkUnlocks(agentId);
  }

  /**
   * Register a skill acquisition for an agent
   */
  registerSkill(agentId: string, skillName: string, skillLevel: number): void {
    const trust = this.getAgentTrustScore(agentId);
    trust.skillLevels.set(skillName, Math.max(
      trust.skillLevels.get(skillName) || 0,
      skillLevel
    ));

    // Check for skill-based unlocks
    if (this.config.skillBasedUnlock) {
      this.checkUnlocks(agentId);
    }
  }

  /**
   * Check if agent qualifies for new memory unlocks
   */
  private checkUnlocks(agentId: string): void {
    if (!this.config.enableProgressiveUnlock) {
      return;
    }

    const trust = this.getAgentTrustScore(agentId);
    const currentUnlocks = this.unlockedLevels.get(agentId) || new Set();

    // Check each unlock level
    for (let level = 1; level <= this.config.maxUnlockLevel; level++) {
      if (currentUnlocks.has(level)) {
        continue; // Already unlocked
      }

      const unlockLevel = this.getUnlockLevel(level);
      if (!unlockLevel) {
        continue;
      }

      // Check trust requirement
      if (trust.trustScore < unlockLevel.requiredTrust) {
        continue;
      }

      // Check skill requirements
      const hasRequiredSkills = unlockLevel.requiredSkills.every(skill => {
        const skillLevel = trust.skillLevels.get(skill) || 0;
        return skillLevel >= 0.7; // Minimum skill level
      });

      if (hasRequiredSkills) {
        this.unlockLevel(agentId, level);
      }
    }
  }

  /**
   * Unlock a memory level for an agent
   */
  private unlockLevel(agentId: string, level: number): void {
    const currentUnlocks = this.unlockedLevels.get(agentId) || new Set();
    currentUnlocks.add(level);
    this.unlockedLevels.set(agentId, currentUnlocks);

    const unlockLevel = this.getUnlockLevel(level);
    if (unlockLevel) {
      unlockLevel.unlockedAt = new Date();
      this.unlockHistory.push({ ...unlockLevel });

      // Emit unlock event
      eventBus.emit({
        type: 'memory.unlocked',
        agentId,
        level,
        timestamp: new Date()
      } as LAPAEvent);
    }
  }

  /**
   * Get unlock level definition
   */
  private getUnlockLevel(level: number): MemoryUnlockLevel | null {
    const levels: Record<number, MemoryUnlockLevel> = {
      1: {
        level: 1,
        name: 'Basic Memory Access',
        description: 'Access to recent session memories',
        requiredTrust: 0.5,
        requiredSkills: [],
        accessCount: 0
      },
      2: {
        level: 2,
        name: 'Extended Memory Access',
        description: 'Access to cross-session memories',
        requiredTrust: 0.7,
        requiredSkills: ['memory-management'],
        accessCount: 0
      },
      3: {
        level: 3,
        name: 'Deep Memory Access',
        description: 'Access to entity relationships and patterns',
        requiredTrust: 0.8,
        requiredSkills: ['memory-management', 'pattern-recognition'],
        accessCount: 0
      },
      4: {
        level: 4,
        name: 'Episodic Memory Access',
        description: 'Full access to episodic memory with temporal context',
        requiredTrust: 0.9,
        requiredSkills: ['memory-management', 'temporal-reasoning'],
        accessCount: 0
      },
      5: {
        level: 5,
        name: 'Complete Memory Unlock',
        description: 'Full access to all memory systems including vector search',
        requiredTrust: 0.95,
        requiredSkills: ['memory-management', 'vector-search', 'rag'],
        accessCount: 0
      }
    };

    return levels[level] || null;
  }

  /**
   * Check if agent can access a memory level
   */
  canAccessLevel(agentId: string, level: number): boolean {
    const unlocks = this.unlockedLevels.get(agentId);
    return unlocks ? unlocks.has(level) : level === 1; // Level 1 is always accessible
  }

  /**
   * Get unlocked levels for an agent
   */
  getUnlockedLevels(agentId: string): number[] {
    const unlocks = this.unlockedLevels.get(agentId);
    return unlocks ? Array.from(unlocks).sort() : [1];
  }

  /**
   * Access memory at a specific level
   */
  async accessMemory(agentId: string, level: number, query: string): Promise<any> {
    if (!this.canAccessLevel(agentId, level)) {
      throw new Error(`Agent ${agentId} does not have access to level ${level}`);
    }

    // Update access count
    const unlockLevel = this.getUnlockLevel(level);
    if (unlockLevel) {
      unlockLevel.lastAccessed = new Date();
      unlockLevel.accessCount++;
    }

    // Access memory based on level
    switch (level) {
      case 1:
        // Basic: Recent session memories
        return await this.memoriEngine.getRecentMemories(agentId, 10);
      
      case 2:
        // Extended: Cross-session memories
        return await this.memoriEngine.getCrossSessionMemories(agentId, query);
      
      case 3:
        // Deep: Entity relationships
        return await this.memoriEngine.getEntityRelationships(query);
      
      case 4:
        // Episodic: Temporal context
        if (this.episodicMemory) {
          return await this.episodicMemory.search(query, { includeTemporal: true });
        }
        return null;
      
      case 5:
        // Complete: All memory systems
        return {
          memori: await this.memoriEngine.getEntityRelationships(query),
          episodic: this.episodicMemory 
            ? await this.episodicMemory.search(query, { includeTemporal: true })
            : null,
          // Vector search would be integrated here
        };
      
      default:
        return null;
    }
  }

  /**
   * Handle agent interaction events
   */
  private handleAgentInteraction(event: LAPAEvent): void {
    if (event.type === 'agent.interaction' && 'agentId' in event) {
      const success = 'success' in event ? (event as any).success : true;
      const quality = 'quality' in event ? (event as any).quality : 1.0;
      this.updateTrustScore((event as any).agentId, success, quality);
    }
  }

  /**
   * Handle skill acquisition events
   */
  private handleSkillAcquisition(event: LAPAEvent): void {
    if (event.type === 'agent.skill.acquired' && 'agentId' in event) {
      const { agentId, skillName, skillLevel } = event as any;
      this.registerSkill(agentId, skillName, skillLevel);
    }
  }

  /**
   * Load trust scores from persistent storage
   */
  private async loadTrustScores(): Promise<void> {
    // TODO: Load from persistent storage
    // This would integrate with Memori Engine's persistence
  }

  /**
   * Load unlock states from persistent storage
   */
  private async loadUnlockStates(): Promise<void> {
    // TODO: Load from persistent storage
    // This would integrate with Memori Engine's persistence
  }
}

