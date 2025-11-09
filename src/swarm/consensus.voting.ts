/**
 * Consensus Voting System for LAPA Swarm Intelligence
 * 
 * This module implements a consensus voting mechanism for the LAPA swarm,
 * enabling collective decision-making among agents. It supports various
 * voting algorithms and handles conflict resolution.
 */

import { Agent } from '../agents/moe-router';

// Vote option
export interface VoteOption {
  id: string;
  label: string;
  value: any;
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

// Voting algorithm types
export type VotingAlgorithm = 'simple-majority' | 'weighted-majority' | 'supermajority' | 'consensus-threshold';

/**
 * LAPA Consensus Voting System
 */
export class ConsensusVotingSystem {
  private sessions: Map<string, VotingSession> = new Map();
  private agents: Map<string, Agent> = new Map();
  
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
    if (session.votes.length === 0) {
      return {
        sessionId: session.id,
        winningOption: null,
        confidence: 0,
        voteDistribution: {},
        consensusReached: false,
        resolutionMethod: 'majority',
        details: 'No votes cast'
      };
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
        return this.calculateSimpleMajority(session, voteDistribution, totalWeight);
      case 'weighted-majority':
        return this.calculateWeightedMajority(session, voteDistribution, totalWeight);
      case 'supermajority':
        return this.calculateSupermajority(session, voteDistribution, totalWeight, threshold);
      case 'consensus-threshold':
        return this.calculateConsensusThreshold(session, voteDistribution, totalWeight, threshold);
      default:
        return this.calculateSimpleMajority(session, voteDistribution, totalWeight);
    }
  }
  
  /**
   * Calculates result using simple majority
   */
  private calculateSimpleMajority(
    session: VotingSession,
    voteDistribution: Record<string, number>,
    totalWeight: number
  ): ConsensusResult {
    // Count votes (ignoring weights for simple majority)
    const voteCounts: Record<string, number> = {};
    session.votes.forEach(vote => {
      voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
    });
    
    const totalVotes = session.votes.length;
    let winningOptionId: string | null = null;
    let maxVotes = 0;
    
    Object.entries(voteCounts).forEach(([optionId, count]) => {
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
      voteDistribution: voteCounts,
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
}

// Export singleton instance
export const consensusVotingSystem = new ConsensusVotingSystem();