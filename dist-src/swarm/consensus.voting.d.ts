/**
 * Consensus Voting System for LAPA Swarm Intelligence
 *
 * This module implements a consensus voting mechanism for the LAPA swarm,
 * enabling collective decision-making among agents. It supports various
 * voting algorithms and handles conflict resolution.
 */
import { Agent } from '../agents/moe-router';
export interface VoteOption {
    id: string;
    label: string;
    value: any;
}
export interface Vote {
    agentId: string;
    optionId: string;
    weight: number;
    timestamp: Date;
    rationale?: string;
}
export interface VotingSession {
    id: string;
    topic: string;
    options: VoteOption[];
    votes: Vote[];
    status: 'open' | 'closed' | 'resolved';
    createdAt: Date;
    closedAt?: Date;
    quorum?: number;
}
export interface ConsensusResult {
    sessionId: string;
    winningOption: VoteOption | null;
    confidence: number;
    voteDistribution: Record<string, number>;
    consensusReached: boolean;
    resolutionMethod: 'majority' | 'weighted' | 'supermajority' | 'unanimous';
    details: string;
}
export type VotingAlgorithm = 'simple-majority' | 'weighted-majority' | 'supermajority' | 'consensus-threshold';
/**
 * LAPA Consensus Voting System
 */
export declare class ConsensusVotingSystem {
    private sessions;
    private agents;
    /**
     * Registers an agent with the voting system
     * @param agent The agent to register
     */
    registerAgent(agent: Agent): void;
    /**
     * Unregisters an agent from the voting system
     * @param agentId The ID of the agent to unregister
     */
    unregisterAgent(agentId: string): void;
    /**
     * Creates a new voting session
     * @param topic Topic or question for voting
     * @param options Available voting options
     * @param quorum Minimum number of votes required (optional)
     * @returns ID of the new voting session
     */
    createVotingSession(topic: string, options: VoteOption[], quorum?: number): string;
    /**
     * Casts a vote in a voting session
     * @param sessionId ID of the voting session
     * @param agentId ID of the voting agent
     * @param optionId ID of the selected option
     * @param rationale Optional explanation for the vote
     * @returns Boolean indicating success
     */
    castVote(sessionId: string, agentId: string, optionId: string, rationale?: string): boolean;
    /**
     * Closes a voting session and calculates results
     * @param sessionId ID of the voting session
     * @param algorithm Voting algorithm to use
     * @param threshold Threshold for consensus (used with supermajority and consensus-threshold)
     * @returns Consensus result
     */
    closeVotingSession(sessionId: string, algorithm?: VotingAlgorithm, threshold?: number): ConsensusResult;
    /**
     * Gets the current status of a voting session
     * @param sessionId ID of the voting session
     * @returns Voting session or undefined if not found
     */
    getVotingSession(sessionId: string): VotingSession | undefined;
    /**
     * Gets all voting sessions
     * @returns Array of all voting sessions
     */
    getAllVotingSessions(): VotingSession[];
    /**
     * Calculates consensus result based on votes
     * @param session Voting session
     * @param algorithm Voting algorithm to use
     * @param threshold Threshold for consensus
     * @returns Consensus result
     */
    private calculateConsensusResult;
    /**
     * Calculates result using simple majority
     */
    private calculateSimpleMajority;
    /**
     * Calculates result using weighted majority
     */
    private calculateWeightedMajority;
    /**
     * Calculates result using supermajority threshold
     */
    private calculateSupermajority;
    /**
     * Calculates result using consensus threshold
     */
    private calculateConsensusThreshold;
    /**
     * Calculates an agent's voting weight based on expertise and performance
     * @param agent The agent
     * @returns Weight value
     */
    private calculateAgentWeight;
    /**
     * Gets total weight of all registered agents
     * @returns Total weight
     */
    private getTotalAgentWeight;
    /**
     * Generates a unique session ID
     * @param topic Session topic
     * @returns Unique session ID
     */
    private generateSessionId;
}
export declare const consensusVotingSystem: ConsensusVotingSystem;
