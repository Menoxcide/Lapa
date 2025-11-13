/**
 * Consensus Voting System for LAPA Swarm Intelligence
 *
 * This module implements a consensus voting mechanism for the LAPA swarm,
 * enabling collective decision-making among agents. It supports various
 * voting algorithms and handles conflict resolution.
 *
 * Enhanced with advanced state sync conflict handling mechanisms and
 * dedicated conflict resolution patterns for complex state synchronization.
 */

import { Agent } from '../agents/moe-router.ts';

// Vote option
export interface VoteOption {
  id: string;
  label: string;
  value: unknown;
}

// Vote record
export interface Vote {
  agentId: string;
  optionId: string;
  weight: number; // Agent's voting weight
  timestamp: Date;
  rationale?: string; // Optional explanation for the vote
}

// Voting session
export interface VotingSession {
  id: string;
  topic: string;
  options: VoteOption[];
  votes: Vote[];
  status: 'open' | 'closed' | 'resolved';
  createdAt: Date;
  closedAt?: Date;
  quorum?: number; // Minimum number of votes required
}

// Consensus result
export interface ConsensusResult {
  sessionId: string;
  winningOption: VoteOption | null;
  confidence: number; // 0-1 scale
  voteDistribution: Record<string, number>; // Option ID to vote count
  consensusReached: boolean;
  resolutionMethod: 'majority' | 'weighted' | 'supermajority' | 'unanimous';
  details: string;
}

// Conflict resolution strategy
export type ConflictResolutionStrategy = 'merge' | 'override' | 'rollback' | 'negotiate';

// State synchronization conflict
export interface StateSyncConflict {
  conflictId: string;
  sessionId: string;
  conflictingStates: Record<string, unknown>;
  timestamps: Record<string, number>;
  agentsInvolved: string[];
  resolutionStrategy?: ConflictResolutionStrategy;
  resolvedAt?: number;
  resolutionDetails?: string;
}

// Voting algorithm types
export type VotingAlgorithm = 'simple-majority' | 'weighted-majority' | 'supermajority' | 'consensus-threshold';

/**
 * LAPA Consensus Voting System
 */
export class ConsensusVotingSystem {
  private sessions: Map<string, VotingSession> = new Map();
  private agents: Map<string, Agent> = new Map();
  private stateConflicts: Map<string, StateSyncConflict> = new Map();
  
  /**
   * Registers an agent with the voting system
   * @param agent The agent to register
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    console.log(`Registered agent ${agent.name} (${agent.id}) for voting`);
  }
  
  /**
   * Unregisters an agent from the voting system
   * @param agentId The ID of the agent to unregister
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`Unregistered agent ${agentId} from voting`);
  }
  
  /**
   * Records a state synchronization conflict
   * @param conflict State synchronization conflict details
   */
  recordStateConflict(conflict: StateSyncConflict): void {
    this.stateConflicts.set(conflict.conflictId, conflict);
    console.log(`Recorded state conflict: ${conflict.conflictId}`);
  }
  
  /**
   * Resolves a state synchronization conflict
   * @param conflictId ID of the conflict to resolve
   * @param strategy Resolution strategy to use
   * @param details Additional resolution details
   */
  resolveStateConflict(conflictId: string, strategy: ConflictResolutionStrategy, details?: string): boolean {
    const conflict = this.stateConflicts.get(conflictId);
    if (!conflict) {
      console.error(`Conflict ${conflictId} not found`);
      return false;
    }
    
    conflict.resolutionStrategy = strategy;
    conflict.resolvedAt = Date.now();
    conflict.resolutionDetails = details;
    
    console.log(`Resolved state conflict ${conflictId} using ${strategy} strategy`);
    return true;
  }
  
  /**
   * Gets all recorded state conflicts
   * @returns Array of state conflicts
   */
  getStateConflicts(): StateSyncConflict[] {
    return Array.from(this.stateConflicts.values());
  }
  
  /**
   * Gets unresolved state conflicts
   * @returns Array of unresolved state conflicts
   */
  getUnresolvedConflicts(): StateSyncConflict[] {
    return Array.from(this.stateConflicts.values()).filter(conflict => !conflict.resolvedAt);
  }
  
  /**
   * Creates a new voting session
   * @param topic Topic or question for voting
   * @param options Available voting options
   * @param quorum Minimum number of votes required (optional)
   * @returns ID of the new voting session
   */
  createVotingSession(topic: string, options: VoteOption[], quorum?: number): string {
    const sessionId = this.generateSessionId(topic);
    const session: VotingSession = {
      id: sessionId,
      topic,
      options,
      votes: [],
      status: 'open',
      createdAt: new Date(),
      quorum
    };
    
    this.sessions.set(sessionId, session);
    console.log(`Created voting session: ${sessionId} for topic: ${topic}`);
    
    return sessionId;
  }
  
  /**
   * Casts a vote in a voting session
   * @param sessionId ID of the voting session
   * @param agentId ID of the voting agent
   * @param optionId ID of the selected option
   * @param rationale Optional explanation for the vote
   * @returns Boolean indicating success
   */
  castVote(sessionId: string, agentId: string, optionId: string, rationale?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Voting session ${sessionId} not found`);
      return false;
    }
    
    if (session.status !== 'open') {
      console.error(`Voting session ${sessionId} is not open for voting`);
      return false;
    }
    
    // Validate option exists
    if (!session.options.some(option => option.id === optionId)) {
      console.error(`Invalid option ${optionId} for session ${sessionId}`);
      return false;
    }
    
    // Check if agent has already voted
    if (session.votes.some(vote => vote.agentId === agentId)) {
      console.error(`Agent ${agentId} has already voted in session ${sessionId}`);
      return false;
    }
    
    // Get agent weight (default to 1 if not found)
    const agent = this.agents.get(agentId);
    const weight = agent ? this.calculateAgentWeight(agent) : 1;
    
    // Record vote
    const vote: Vote = {
      agentId,
      optionId,
      weight,
      timestamp: new Date(),
      rationale
    };
    
    session.votes.push(vote);
    console.log(`Agent ${agentId} voted for option ${optionId} in session ${sessionId}`);
    
    return true;
  }
  
  /**
   * Closes a voting session and calculates results
   * @param sessionId ID of the voting session
   * @param algorithm Voting algorithm to use
   * @param threshold Threshold for consensus (used with supermajority and consensus-threshold)
   * @returns Consensus result
   */
  closeVotingSession(
    sessionId: string, 
    algorithm: VotingAlgorithm = 'simple-majority',
    threshold: number = 0.67
  ): ConsensusResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Voting session ${sessionId} not found`);
    }
    
    if (session.status !== 'open') {
      throw new Error(`Voting session ${sessionId} is not open`);
    }
    
    // Close session
    session.status = 'closed';
    session.closedAt = new Date();
    
    console.log(`Closed voting session: ${sessionId}`);
    
    // Calculate results
    return this.calculateConsensusResult(session, algorithm, threshold);
  }
  
  /**
   * Gets the current status of a voting session
   * @param sessionId ID of the voting session
   * @returns Voting session or undefined if not found
   */
  getVotingSession(sessionId: string): VotingSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Gets all voting sessions
   * @returns Array of all voting sessions
   */
  getAllVotingSessions(): VotingSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Calculates consensus result based on votes
   * @param session Voting session
   * @param algorithm Voting algorithm to use
   * @param threshold Threshold for consensus
   * @returns Consensus result
   */
  private calculateConsensusResult(
    session: VotingSession,
    algorithm: VotingAlgorithm,
    threshold: number
  ): ConsensusResult {
    // Check for potential conflicts in voting session
    const conflicts = this.detectVotingConflicts(session);
    if (conflicts.length > 0) {
      console.warn(`Detected ${conflicts.length} voting conflicts in session ${session.id}`);
      // Record conflicts for later resolution
      conflicts.forEach(conflict => {
        this.recordStateConflict({
          conflictId: `vote-conflict-${session.id}-${conflict.optionId}-${Date.now()}`,
          sessionId: session.id,
          conflictingStates: {
            optionId: conflict.optionId,
            voteCount: conflict.voteCount,
            conflictingVotes: conflict.conflictingVotes
          },
          timestamps: {
            detected: Date.now()
          },
          agentsInvolved: conflict.conflictingVotes.map(vote => vote.agentId),
          resolutionDetails: 'Auto-detected voting conflict'
        });
      });
    }
    // Calculate vote distribution
    const voteDistribution: Record<string, number> = {};
    let totalWeight = 0;
    
    // Initialize distribution
    session.options.forEach(option => {
      voteDistribution[option.id] = 0;
    });
    
    // Count votes
    session.votes.forEach(vote => {
      voteDistribution[vote.optionId] = (voteDistribution[vote.optionId] || 0) + vote.weight;
      totalWeight += vote.weight;
    });
    
    if (session.votes.length === 0) {
      return {
        sessionId: session.id,
        winningOption: null,
        confidence: 0,
        voteDistribution, // Use the initialized distribution
        consensusReached: false,
        resolutionMethod: 'majority',
        details: 'No votes cast'
      };
    }
    
    // Check quorum if specified
    if (session.quorum && session.votes.length < session.quorum) {
      return {
        sessionId: session.id,
        winningOption: null,
        confidence: 0,
        voteDistribution,
        consensusReached: false,
        resolutionMethod: 'majority',
        details: `Quorum not met (${session.votes.length}/${session.quorum} votes)`
      };
    }
    
    // Determine winner based on algorithm
    switch (algorithm) {
      case 'simple-majority':
        return this.calculateSimpleMajority(session, voteDistribution);
      case 'weighted-majority':
        return this.calculateWeightedMajority(session, voteDistribution, totalWeight);
      case 'supermajority':
        return this.calculateSupermajority(session, voteDistribution, totalWeight, threshold);
      case 'consensus-threshold':
        return this.calculateConsensusThreshold(session, voteDistribution, totalWeight, threshold);
      default:
        return this.calculateSimpleMajority(session, voteDistribution);
    }
  }
  
  /**
   * Calculates result using simple majority
   */
  private calculateSimpleMajority(
    session: VotingSession,
    _voteDistribution: Record<string, number> // Parameter not used as we create our own distribution for actual vote counts
  ): ConsensusResult {
    // For simple majority, we need to count actual votes, not weighted votes
    // So we create a new distribution from session.votes ignoring weights
    const actualVoteCounts: Record<string, number> = {};
    
    // Initialize with all options to ensure all options appear in distribution
    session.options.forEach(option => {
      actualVoteCounts[option.id] = 0;
    });
    
    // Count actual votes (not weighted)
    session.votes.forEach(vote => {
      actualVoteCounts[vote.optionId] += 1;
    });
    
    const totalVotes = session.votes.length;
    let winningOptionId: string | null = null;
    let maxVotes = 0;
    
    Object.entries(actualVoteCounts).forEach(([optionId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningOptionId = optionId;
      }
    });
    
    const winningOption = winningOptionId
      ? session.options.find(opt => opt.id === winningOptionId) || null
      : null;
    
    const confidence = totalVotes > 0 ? maxVotes / totalVotes : 0;
    const consensusReached = totalVotes > 0 && maxVotes > totalVotes / 2;
    
    return {
      sessionId: session.id,
      winningOption,
      confidence,
      voteDistribution: actualVoteCounts, // Return the actual vote counts, not the weighted distribution
      consensusReached,
      resolutionMethod: 'majority',
      details: `Simple majority: ${maxVotes}/${totalVotes} votes`
    };
  }
  
  /**
   * Calculates result using weighted majority
   */
  private calculateWeightedMajority(
    session: VotingSession,
    voteDistribution: Record<string, number>,
    totalWeight: number
  ): ConsensusResult {
    let winningOptionId: string | null = null;
    let maxWeight = 0;
    
    Object.entries(voteDistribution).forEach(([optionId, weight]) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        winningOptionId = optionId;
      }
    });
    
    const winningOption = winningOptionId 
      ? session.options.find(opt => opt.id === winningOptionId) || null 
      : null;
    
    const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0;
    const consensusReached = totalWeight > 0 && maxWeight > totalWeight / 2;
    
    return {
      sessionId: session.id,
      winningOption,
      confidence,
      voteDistribution,
      consensusReached,
      resolutionMethod: 'weighted',
      details: `Weighted majority: ${maxWeight}/${totalWeight} weight`
    };
  }
  
  /**
   * Calculates result using supermajority threshold
   */
  private calculateSupermajority(
    session: VotingSession,
    voteDistribution: Record<string, number>,
    totalWeight: number,
    threshold: number
  ): ConsensusResult {
    let winningOptionId: string | null = null;
    let maxWeight = 0;
    
    Object.entries(voteDistribution).forEach(([optionId, weight]) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        winningOptionId = optionId;
      }
    });
    
    const winningOption = winningOptionId 
      ? session.options.find(opt => opt.id === winningOptionId) || null 
      : null;
    
    const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0;
    const consensusReached = totalWeight > 0 && maxWeight >= totalWeight * threshold;
    
    return {
      sessionId: session.id,
      winningOption,
      confidence,
      voteDistribution,
      consensusReached,
      resolutionMethod: 'supermajority',
      details: `Supermajority (${(threshold * 100).toFixed(1)}%): ${maxWeight}/${totalWeight} weight`
    };
  }
  
  /**
   * Calculates result using consensus threshold
   */
  private calculateConsensusThreshold(
    session: VotingSession,
    voteDistribution: Record<string, number>,
    totalWeight: number,
    threshold: number
  ): ConsensusResult {
    // For consensus threshold, all agents must agree
    const uniqueVotes = new Set(session.votes.map(vote => vote.optionId));
    const consensusReached = uniqueVotes.size === 1 && 
                            session.votes.length === this.agents.size &&
                            totalWeight >= this.getTotalAgentWeight() * threshold;
    
    const winningOptionId = consensusReached ? session.votes[0].optionId : null;
    const winningOption = winningOptionId 
      ? session.options.find(opt => opt.id === winningOptionId) || null 
      : null;
    
    const confidence = consensusReached ? 1 : 0;
    
    return {
      sessionId: session.id,
      winningOption,
      confidence,
      voteDistribution,
      consensusReached,
      resolutionMethod: 'unanimous',
      details: `Consensus threshold (${(threshold * 100).toFixed(1)}%): ${consensusReached ? 'Reached' : 'Not reached'}`
    };
  }
  
  /**
   * Calculates an agent's voting weight based on expertise and performance
   * @param agent The agent
   * @returns Weight value
   */
  private calculateAgentWeight(agent: Agent): number {
    // Simple implementation based on expertise count and assumed performance
    // In a real system, this would be more sophisticated
    return Math.max(1, agent.expertise.length / 2);
  }
  
  /**
   * Gets total weight of all registered agents
   * @returns Total weight
   */
  private getTotalAgentWeight(): number {
    let total = 0;
    this.agents.forEach(agent => {
      total += this.calculateAgentWeight(agent);
    });
    return total;
  }
  
  /**
   * Generates a unique session ID
   * @param topic Session topic
   * @returns Unique session ID
   */
  private generateSessionId(topic: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
    return `vote_${topicSlug}_${timestamp}_${random}`;
  }
  
  /**
   * Detects potential conflicts in voting session
   * @param session Voting session to check
   * @returns Array of detected conflicts
   */
  private detectVotingConflicts(session: VotingSession): Array<{
    optionId: string;
    voteCount: number;
    conflictingVotes: Vote[];
  }> {
    const conflicts: Array<{
      optionId: string;
      voteCount: number;
      conflictingVotes: Vote[];
    }> = [];
    
    // Group votes by agent to detect duplicate voting
    const votesByAgent: Record<string, Vote[]> = {};
    session.votes.forEach(vote => {
      if (!votesByAgent[vote.agentId]) {
        votesByAgent[vote.agentId] = [];
      }
      votesByAgent[vote.agentId].push(vote);
    });
    
    // Check for agents that voted multiple times
    Object.entries(votesByAgent).forEach(([agentId, votes]) => {
      if (votes.length > 1) {
        // Multiple votes from same agent - potential conflict
        votes.forEach(vote => {
          const existingConflict = conflicts.find(c => c.optionId === vote.optionId);
          if (existingConflict) {
            existingConflict.conflictingVotes.push(vote);
            existingConflict.voteCount++;
          } else {
            conflicts.push({
              optionId: vote.optionId,
              voteCount: 1,
              conflictingVotes: [vote]
            });
          }
        });
      }
    });
    
    // Check for votes with very close timestamps that might indicate network issues
    const timeSortedVotes = [...session.votes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 1; i < timeSortedVotes.length; i++) {
      const timeDiff = timeSortedVotes[i].timestamp.getTime() - timeSortedVotes[i-1].timestamp.getTime();
      // If votes are within 100ms of each other, they might be conflicting due to network issues
      if (Math.abs(timeDiff) < 100 && timeSortedVotes[i].agentId !== timeSortedVotes[i-1].agentId) {
        // Potential conflict due to simultaneous voting
        const vote1 = timeSortedVotes[i-1];
        const vote2 = timeSortedVotes[i];
        
        // Add both votes to conflicts
        [vote1, vote2].forEach(vote => {
          const existingConflict = conflicts.find(c => c.optionId === vote.optionId);
          if (existingConflict) {
            if (!existingConflict.conflictingVotes.some(v => v.agentId === vote.agentId && v.timestamp === vote.timestamp)) {
              existingConflict.conflictingVotes.push(vote);
              existingConflict.voteCount++;
            }
          } else {
            conflicts.push({
              optionId: vote.optionId,
              voteCount: 1,
              conflictingVotes: [vote]
            });
          }
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Resolves voting conflicts using consensus
   * @param conflicts Conflicts to resolve
   * @returns Resolution details
   */
  resolveVotingConflicts(conflicts: StateSyncConflict[]): Record<string, string> {
    const resolutions: Record<string, string> = {};
    
    conflicts.forEach(conflict => {
      // For voting conflicts, we use a negotiate strategy by default
      // This would typically involve creating a new voting session to resolve the conflict
      this.resolveStateConflict(conflict.conflictId, 'negotiate', 'Resolved through consensus voting');
      resolutions[conflict.conflictId] = 'negotiate';
    });
    
    return resolutions;
  }
}

// Export singleton instance
export const consensusVotingSystem = new ConsensusVotingSystem();