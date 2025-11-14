/**
 * Agent Diversity Lab System for LAPA Phase 5 I9
 * 
 * Implements agent diversity orchestration with sub-agent coordination
 * and hierarchical agent management (Phase 35 reference, W44 CrewAI hierarchy reference).
 * 
 * Features:
 * - Sub-agent testing and validation
 * - Hierarchical agent coordination
 * - Diversity metrics and validation
 * - Agent capability assessment
 */

import { eventBus } from '../core/event-bus.ts';
import type { LAPAEvent, AgentCreatedEvent, TaskCompletedEvent, AgentCoordinationEvent } from '../core/types/event-types.ts';

export interface AgentDiversityConfig {
  enableDiversityTesting: boolean;
  minDiversityScore: number; // 0-1, minimum diversity required
  maxSubAgents: number; // Maximum sub-agents per parent
  enableHierarchicalCoordination: boolean;
  diversityMetricsEnabled: boolean;
}

const DEFAULT_CONFIG: AgentDiversityConfig = {
  enableDiversityTesting: true,
  minDiversityScore: 0.7,
  maxSubAgents: 8,
  enableHierarchicalCoordination: true,
  diversityMetricsEnabled: true
};

export interface AgentCapability {
  capabilityId: string;
  capabilityName: string;
  proficiency: number; // 0-1
  usageCount: number;
  successRate: number;
}

export interface AgentProfile {
  agentId: string;
  role: string;
  capabilities: AgentCapability[];
  subAgents: string[]; // IDs of sub-agents
  parentAgent?: string; // ID of parent agent
  diversityScore: number; // 0-1
  coordinationScore: number; // 0-1
}

export interface DiversityMetrics {
  overallDiversity: number; // 0-1
  capabilityDiversity: number; // 0-1
  roleDiversity: number; // 0-1
  coordinationEfficiency: number; // 0-1
  subAgentDistribution: Map<string, number>; // role -> count
}

export class AgentDiversityLab {
  private config: AgentDiversityConfig;
  private agentProfiles: Map<string, AgentProfile>;
  private diversityMetrics: DiversityMetrics;
  private coordinationHistory: Array<{
    parentAgent: string;
    subAgents: string[];
    taskId: string;
    success: boolean;
    timestamp: Date;
  }>;

  constructor(config?: Partial<AgentDiversityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agentProfiles = new Map();
    this.diversityMetrics = this.initializeMetrics();
    this.coordinationHistory = [];
  }

  /**
   * Initialize the diversity lab
   */
  async initialize(): Promise<void> {
    // Load existing agent profiles
    await this.loadAgentProfiles();
    
    // Subscribe to agent events
    eventBus.subscribe('agent.created', this.handleAgentCreated.bind(this));
    eventBus.subscribe('task.completed', this.handleTaskCompletion.bind(this));
    eventBus.subscribe('agent.coordination', this.handleCoordination.bind(this));
  }

  /**
   * Register an agent profile
   */
  registerAgent(agentId: string, role: string, capabilities: AgentCapability[]): void {
    const profile: AgentProfile = {
      agentId,
      role,
      capabilities,
      subAgents: [],
      diversityScore: 0,
      coordinationScore: 0
    };

    this.agentProfiles.set(agentId, profile);
    this.updateDiversityMetrics();
  }

  /**
   * Create sub-agent relationship
   */
  createSubAgent(parentId: string, subAgentId: string): void {
    if (!this.config.enableHierarchicalCoordination) {
      return;
    }

    const parent = this.agentProfiles.get(parentId);
    const subAgent = this.agentProfiles.get(subAgentId);

    if (!parent || !subAgent) {
      throw new Error(`Agent not found: ${parentId} or ${subAgentId}`);
    }

    // Check sub-agent limit
    if (parent.subAgents.length >= this.config.maxSubAgents) {
      throw new Error(`Maximum sub-agents (${this.config.maxSubAgents}) reached for ${parentId}`);
    }

    parent.subAgents.push(subAgentId);
    subAgent.parentAgent = parentId;

    this.updateDiversityMetrics();
  }

  /**
   * Test agent diversity
   */
  async testDiversity(agentIds: string[]): Promise<{
    diversityScore: number;
    passed: boolean;
    recommendations: string[];
  }> {
    const profiles = agentIds
      .map(id => this.agentProfiles.get(id))
      .filter((p): p is AgentProfile => p !== undefined);

    if (profiles.length === 0) {
      return {
        diversityScore: 0,
        passed: false,
        recommendations: ['No valid agents found']
      };
    }

    // Calculate diversity metrics
    const capabilityDiversity = this.calculateCapabilityDiversity(profiles);
    const roleDiversity = this.calculateRoleDiversity(profiles);
    const overallDiversity = (capabilityDiversity + roleDiversity) / 2;

    const passed = overallDiversity >= this.config.minDiversityScore;

    const recommendations: string[] = [];
    if (!passed) {
      recommendations.push(`Diversity score ${overallDiversity.toFixed(2)} below threshold ${this.config.minDiversityScore}`);
      if (capabilityDiversity < 0.7) {
        recommendations.push('Add agents with different capabilities');
      }
      if (roleDiversity < 0.7) {
        recommendations.push('Add agents with different roles');
      }
    }

    return {
      diversityScore: overallDiversity,
      passed,
      recommendations
    };
  }

  /**
   * Test sub-agent coordination
   */
  async testSubAgentCoordination(
    parentAgentId: string,
    taskId: string
  ): Promise<{
    coordinationScore: number;
    passed: boolean;
    subAgentPerformance: Map<string, number>;
  }> {
    const parent = this.agentProfiles.get(parentAgentId);
    if (!parent || parent.subAgents.length === 0) {
      return {
        coordinationScore: 0,
        passed: false,
        subAgentPerformance: new Map()
      };
    }

    // Simulate coordination
    const subAgentPerformance = new Map<string, number>();
    for (const subAgentId of parent.subAgents) {
      const subAgent = this.agentProfiles.get(subAgentId);
      if (subAgent) {
        // Calculate performance based on capabilities and history
        const performance = this.calculateSubAgentPerformance(subAgent);
        subAgentPerformance.set(subAgentId, performance);
      }
    }

    // Calculate coordination score
    const coordinationScore = this.calculateCoordinationScore(
      parent,
      Array.from(subAgentPerformance.values())
    );

    // Record coordination
    this.coordinationHistory.push({
      parentAgent: parentAgentId,
      subAgents: parent.subAgents,
      taskId,
      success: coordinationScore >= 0.7,
      timestamp: new Date()
    });

    // Update parent coordination score
    parent.coordinationScore = coordinationScore;
    this.updateDiversityMetrics();

    return {
      coordinationScore,
      passed: coordinationScore >= 0.7,
      subAgentPerformance
    };
  }

  /**
   * Calculate capability diversity
   */
  private calculateCapabilityDiversity(profiles: AgentProfile[]): number {
    const allCapabilities = new Set<string>();
    const capabilityCounts = new Map<string, number>();

    for (const profile of profiles) {
      for (const capability of profile.capabilities) {
        allCapabilities.add(capability.capabilityId);
        capabilityCounts.set(
          capability.capabilityId,
          (capabilityCounts.get(capability.capabilityId) || 0) + 1
        );
      }
    }

    if (allCapabilities.size === 0) {
      return 0;
    }

    // Diversity = unique capabilities / total capability occurrences
    // Higher diversity = more unique capabilities relative to total
    const uniqueRatio = allCapabilities.size / Array.from(capabilityCounts.values())
      .reduce((sum, count) => sum + count, 0);

    return Math.min(1.0, uniqueRatio * profiles.length);
  }

  /**
   * Calculate role diversity
   */
  private calculateRoleDiversity(profiles: AgentProfile[]): number {
    const uniqueRoles = new Set(profiles.map(p => p.role));
    const totalRoles = profiles.length;

    if (totalRoles === 0) {
      return 0;
    }

    // Diversity = unique roles / total agents
    return uniqueRoles.size / totalRoles;
  }

  /**
   * Calculate sub-agent performance
   */
  private calculateSubAgentPerformance(subAgent: AgentProfile): number {
    if (subAgent.capabilities.length === 0) {
      return 0.5; // Default performance
    }

    // Average capability proficiency weighted by success rate
    const totalWeight = subAgent.capabilities.reduce(
      (sum, cap) => sum + cap.proficiency * cap.successRate,
      0
    );
    const totalProficiency = subAgent.capabilities.reduce(
      (sum, cap) => sum + cap.proficiency,
      0
    );

    return totalProficiency > 0 ? totalWeight / totalProficiency : 0.5;
  }

  /**
   * Calculate coordination score
   */
  private calculateCoordinationScore(
    parent: AgentProfile,
    subAgentPerformances: number[]
  ): number {
    if (subAgentPerformances.length === 0) {
      return 0;
    }

    // Average performance of sub-agents
    const avgPerformance = subAgentPerformances.reduce((sum, p) => sum + p, 0) / subAgentPerformances.length;

    // Factor in parent's coordination history
    const recentCoordinations = this.coordinationHistory
      .filter(c => c.parentAgent === parent.agentId)
      .slice(-10); // Last 10 coordinations

    const recentSuccessRate = recentCoordinations.length > 0
      ? recentCoordinations.filter(c => c.success).length / recentCoordinations.length
      : 0.5;

    // Combine average performance with success rate
    return (avgPerformance * 0.7 + recentSuccessRate * 0.3);
  }

  /**
   * Update diversity metrics
   */
  private updateDiversityMetrics(): void {
    const profiles = Array.from(this.agentProfiles.values());

    if (profiles.length === 0) {
      this.diversityMetrics = this.initializeMetrics();
      return;
    }

    // Calculate overall diversity
    const capabilityDiversity = this.calculateCapabilityDiversity(profiles);
    const roleDiversity = this.calculateRoleDiversity(profiles);
    const overallDiversity = (capabilityDiversity + roleDiversity) / 2;

    // Calculate coordination efficiency
    const coordinations = this.coordinationHistory.slice(-50); // Last 50
    const coordinationEfficiency = coordinations.length > 0
      ? coordinations.filter(c => c.success).length / coordinations.length
      : 0.5;

    // Calculate sub-agent distribution
    const subAgentDistribution = new Map<string, number>();
    for (const profile of profiles) {
      const count = subAgentDistribution.get(profile.role) || 0;
      subAgentDistribution.set(profile.role, count + profile.subAgents.length);
    }

    this.diversityMetrics = {
      overallDiversity,
      capabilityDiversity,
      roleDiversity,
      coordinationEfficiency,
      subAgentDistribution
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): DiversityMetrics {
    return {
      overallDiversity: 0,
      capabilityDiversity: 0,
      roleDiversity: 0,
      coordinationEfficiency: 0,
      subAgentDistribution: new Map()
    };
  }

  /**
   * Handle agent created event
   */
  private handleAgentCreated(event: AgentCreatedEvent): void {
    const { agentId, name, type, capabilities } = event.payload;
    // Convert string[] capabilities to AgentCapability[]
    const agentCapabilities: AgentCapability[] = (capabilities || []).map(cap => ({
      capabilityId: cap,
      capabilityName: cap,
      proficiency: 0.5, // Default proficiency
      usageCount: 0,
      successRate: 0.5 // Default success rate
    }));
    this.registerAgent(agentId, type, agentCapabilities);
  }

  /**
   * Handle task completion event
   */
  private handleTaskCompletion(event: TaskCompletedEvent): void {
    // TaskCompletedEvent doesn't have agentId in payload, so we'll use the source field
    const taskId = event.payload.taskId;
    const agentId = event.source; // Use source as agentId
    const success = event.payload.result !== undefined && event.payload.result !== null;
    
    // Update agent capabilities if we have the agent
    if (agentId && this.agentProfiles.has(agentId)) {
      this.updateAgentCapabilities(agentId, success, []);
    }
  }

  /**
   * Handle coordination event
   */
  private handleCoordination(event: AgentCoordinationEvent): void {
    const { agentId, coordinationType, participants, context } = event.payload;
    // Use the first participant as parent if hierarchical
    if (participants.length > 1) {
      const parentAgent = participants[0];
      const subAgents = participants.slice(1);
      const taskId = context?.taskId as string || 'unknown';
      this.testSubAgentCoordination(parentAgent, taskId);
    }
  }

  /**
   * Update agent capabilities based on task completion
   */
  private updateAgentCapabilities(
    agentId: string,
    success: boolean,
    usedCapabilities?: string[]
  ): void {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return;
    }

    if (usedCapabilities) {
      for (const capId of usedCapabilities) {
        const capability = profile.capabilities.find(c => c.capabilityId === capId);
        if (capability) {
          capability.usageCount++;
          if (success) {
            capability.successRate = (capability.successRate * (capability.usageCount - 1) + 1) / capability.usageCount;
          } else {
            capability.successRate = (capability.successRate * (capability.usageCount - 1)) / capability.usageCount;
          }
        }
      }
    }

    this.updateDiversityMetrics();
  }

  /**
   * Load agent profiles from persistent storage
   */
  private async loadAgentProfiles(): Promise<void> {
    // TODO: Load from persistent storage
    // This would integrate with Memori Engine's persistence
  }

  /**
   * Get agent profile
   */
  getAgentProfile(agentId: string): AgentProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  /**
   * Get diversity metrics
   */
  getDiversityMetrics(): DiversityMetrics {
    return { ...this.diversityMetrics };
  }

  /**
   * Get coordination history
   */
  getCoordinationHistory(limit: number = 50): typeof this.coordinationHistory {
    return this.coordinationHistory.slice(-limit);
  }
}

