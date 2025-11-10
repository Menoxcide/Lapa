/**
 * Consensus Voting System for LAPA Swarm Intelligence
 *
 * This module implements a consensus voting mechanism for the LAPA swarm,
 * enabling collective decision-making among agents. It supports various
 * voting algorithms and handles conflict resolution.
 */
/**
 * LAPA Consensus Voting System
 */
export class ConsensusVotingSystem {
    constructor() {
        this.sessions = new Map();
        this.agents = new Map();
    }
    /**
     * Registers an agent with the voting system
     * @param agent The agent to register
     */
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        console.log(`Registered agent ${agent.name} (${agent.id}) for voting`);
    }
    /**
     * Unregisters an agent from the voting system
     * @param agentId The ID of the agent to unregister
     */
    unregisterAgent(agentId) {
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
    createVotingSession(topic, options, quorum) {
        const sessionId = this.generateSessionId(topic);
        const session = {
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
    castVote(sessionId, agentId, optionId, rationale) {
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
        const vote = {
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
    closeVotingSession(sessionId, algorithm = 'simple-majority', threshold = 0.67) {
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
    getVotingSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Gets all voting sessions
     * @returns Array of all voting sessions
     */
    getAllVotingSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Calculates consensus result based on votes
     * @param session Voting session
     * @param algorithm Voting algorithm to use
     * @param threshold Threshold for consensus
     * @returns Consensus result
     */
    calculateConsensusResult(session, algorithm, threshold) {
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
        const voteDistribution = {};
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
    calculateSimpleMajority(session, voteDistribution, totalWeight) {
        // Count votes (ignoring weights for simple majority)
        const voteCounts = {};
        session.votes.forEach(vote => {
            voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
        });
        const totalVotes = session.votes.length;
        let winningOptionId = null;
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
    calculateWeightedMajority(session, voteDistribution, totalWeight) {
        let winningOptionId = null;
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
    calculateSupermajority(session, voteDistribution, totalWeight, threshold) {
        let winningOptionId = null;
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
    calculateConsensusThreshold(session, voteDistribution, totalWeight, threshold) {
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
    calculateAgentWeight(agent) {
        // Simple implementation based on expertise count and assumed performance
        // In a real system, this would be more sophisticated
        return Math.max(1, agent.expertise.length / 2);
    }
    /**
     * Gets total weight of all registered agents
     * @returns Total weight
     */
    getTotalAgentWeight() {
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
    generateSessionId(topic) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
        return `vote_${topicSlug}_${timestamp}_${random}`;
    }
}
// Export singleton instance
export const consensusVotingSystem = new ConsensusVotingSystem();
//# sourceMappingURL=consensus.voting.js.map