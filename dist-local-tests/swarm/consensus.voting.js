"use strict";
/**
 * Consensus Voting System for LAPA Swarm Intelligence
 *
 * This module implements a consensus voting mechanism for the LAPA swarm,
 * enabling collective decision-making among agents. It supports various
 * voting algorithms and handles conflict resolution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.consensusVotingSystem = exports.ConsensusVotingSystem = void 0;
/**
 * LAPA Consensus Voting System
 */
var ConsensusVotingSystem = /** @class */ (function () {
    function ConsensusVotingSystem() {
        this.sessions = new Map();
        this.agents = new Map();
    }
    /**
     * Registers an agent with the voting system
     * @param agent The agent to register
     */
    ConsensusVotingSystem.prototype.registerAgent = function (agent) {
        this.agents.set(agent.id, agent);
        console.log("Registered agent ".concat(agent.name, " (").concat(agent.id, ") for voting"));
    };
    /**
     * Unregisters an agent from the voting system
     * @param agentId The ID of the agent to unregister
     */
    ConsensusVotingSystem.prototype.unregisterAgent = function (agentId) {
        this.agents.delete(agentId);
        console.log("Unregistered agent ".concat(agentId, " from voting"));
    };
    /**
     * Creates a new voting session
     * @param topic Topic or question for voting
     * @param options Available voting options
     * @param quorum Minimum number of votes required (optional)
     * @returns ID of the new voting session
     */
    ConsensusVotingSystem.prototype.createVotingSession = function (topic, options, quorum) {
        var sessionId = this.generateSessionId(topic);
        var session = {
            id: sessionId,
            topic: topic,
            options: options,
            votes: [],
            status: 'open',
            createdAt: new Date(),
            quorum: quorum
        };
        this.sessions.set(sessionId, session);
        console.log("Created voting session: ".concat(sessionId, " for topic: ").concat(topic));
        return sessionId;
    };
    /**
     * Casts a vote in a voting session
     * @param sessionId ID of the voting session
     * @param agentId ID of the voting agent
     * @param optionId ID of the selected option
     * @param rationale Optional explanation for the vote
     * @returns Boolean indicating success
     */
    ConsensusVotingSystem.prototype.castVote = function (sessionId, agentId, optionId, rationale) {
        var session = this.sessions.get(sessionId);
        if (!session) {
            console.error("Voting session ".concat(sessionId, " not found"));
            return false;
        }
        if (session.status !== 'open') {
            console.error("Voting session ".concat(sessionId, " is not open for voting"));
            return false;
        }
        // Validate option exists
        if (!session.options.some(function (option) { return option.id === optionId; })) {
            console.error("Invalid option ".concat(optionId, " for session ").concat(sessionId));
            return false;
        }
        // Check if agent has already voted
        if (session.votes.some(function (vote) { return vote.agentId === agentId; })) {
            console.error("Agent ".concat(agentId, " has already voted in session ").concat(sessionId));
            return false;
        }
        // Get agent weight (default to 1 if not found)
        var agent = this.agents.get(agentId);
        var weight = agent ? this.calculateAgentWeight(agent) : 1;
        // Record vote
        var vote = {
            agentId: agentId,
            optionId: optionId,
            weight: weight,
            timestamp: new Date(),
            rationale: rationale
        };
        session.votes.push(vote);
        console.log("Agent ".concat(agentId, " voted for option ").concat(optionId, " in session ").concat(sessionId));
        return true;
    };
    /**
     * Closes a voting session and calculates results
     * @param sessionId ID of the voting session
     * @param algorithm Voting algorithm to use
     * @param threshold Threshold for consensus (used with supermajority and consensus-threshold)
     * @returns Consensus result
     */
    ConsensusVotingSystem.prototype.closeVotingSession = function (sessionId, algorithm, threshold) {
        if (algorithm === void 0) { algorithm = 'simple-majority'; }
        if (threshold === void 0) { threshold = 0.67; }
        var session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error("Voting session ".concat(sessionId, " not found"));
        }
        if (session.status !== 'open') {
            throw new Error("Voting session ".concat(sessionId, " is not open"));
        }
        // Close session
        session.status = 'closed';
        session.closedAt = new Date();
        console.log("Closed voting session: ".concat(sessionId));
        // Calculate results
        return this.calculateConsensusResult(session, algorithm, threshold);
    };
    /**
     * Gets the current status of a voting session
     * @param sessionId ID of the voting session
     * @returns Voting session or undefined if not found
     */
    ConsensusVotingSystem.prototype.getVotingSession = function (sessionId) {
        return this.sessions.get(sessionId);
    };
    /**
     * Gets all voting sessions
     * @returns Array of all voting sessions
     */
    ConsensusVotingSystem.prototype.getAllVotingSessions = function () {
        return Array.from(this.sessions.values());
    };
    /**
     * Calculates consensus result based on votes
     * @param session Voting session
     * @param algorithm Voting algorithm to use
     * @param threshold Threshold for consensus
     * @returns Consensus result
     */
    ConsensusVotingSystem.prototype.calculateConsensusResult = function (session, algorithm, threshold) {
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
        var voteDistribution = {};
        var totalWeight = 0;
        // Initialize distribution
        session.options.forEach(function (option) {
            voteDistribution[option.id] = 0;
        });
        // Count votes
        session.votes.forEach(function (vote) {
            voteDistribution[vote.optionId] = (voteDistribution[vote.optionId] || 0) + vote.weight;
            totalWeight += vote.weight;
        });
        // Check quorum if specified
        if (session.quorum && session.votes.length < session.quorum) {
            return {
                sessionId: session.id,
                winningOption: null,
                confidence: 0,
                voteDistribution: voteDistribution,
                consensusReached: false,
                resolutionMethod: 'majority',
                details: "Quorum not met (".concat(session.votes.length, "/").concat(session.quorum, " votes)")
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
    };
    /**
     * Calculates result using simple majority
     */
    ConsensusVotingSystem.prototype.calculateSimpleMajority = function (session, voteDistribution, totalWeight) {
        // Count votes (ignoring weights for simple majority)
        var voteCounts = {};
        session.votes.forEach(function (vote) {
            voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
        });
        var totalVotes = session.votes.length;
        var winningOptionId = null;
        var maxVotes = 0;
        Object.entries(voteCounts).forEach(function (_a) {
            var optionId = _a[0], count = _a[1];
            if (count > maxVotes) {
                maxVotes = count;
                winningOptionId = optionId;
            }
        });
        var winningOption = winningOptionId
            ? session.options.find(function (opt) { return opt.id === winningOptionId; }) || null
            : null;
        var confidence = totalVotes > 0 ? maxVotes / totalVotes : 0;
        var consensusReached = totalVotes > 0 && maxVotes > totalVotes / 2;
        return {
            sessionId: session.id,
            winningOption: winningOption,
            confidence: confidence,
            voteDistribution: voteCounts,
            consensusReached: consensusReached,
            resolutionMethod: 'majority',
            details: "Simple majority: ".concat(maxVotes, "/").concat(totalVotes, " votes")
        };
    };
    /**
     * Calculates result using weighted majority
     */
    ConsensusVotingSystem.prototype.calculateWeightedMajority = function (session, voteDistribution, totalWeight) {
        var winningOptionId = null;
        var maxWeight = 0;
        Object.entries(voteDistribution).forEach(function (_a) {
            var optionId = _a[0], weight = _a[1];
            if (weight > maxWeight) {
                maxWeight = weight;
                winningOptionId = optionId;
            }
        });
        var winningOption = winningOptionId
            ? session.options.find(function (opt) { return opt.id === winningOptionId; }) || null
            : null;
        var confidence = totalWeight > 0 ? maxWeight / totalWeight : 0;
        var consensusReached = totalWeight > 0 && maxWeight > totalWeight / 2;
        return {
            sessionId: session.id,
            winningOption: winningOption,
            confidence: confidence,
            voteDistribution: voteDistribution,
            consensusReached: consensusReached,
            resolutionMethod: 'weighted',
            details: "Weighted majority: ".concat(maxWeight, "/").concat(totalWeight, " weight")
        };
    };
    /**
     * Calculates result using supermajority threshold
     */
    ConsensusVotingSystem.prototype.calculateSupermajority = function (session, voteDistribution, totalWeight, threshold) {
        var winningOptionId = null;
        var maxWeight = 0;
        Object.entries(voteDistribution).forEach(function (_a) {
            var optionId = _a[0], weight = _a[1];
            if (weight > maxWeight) {
                maxWeight = weight;
                winningOptionId = optionId;
            }
        });
        var winningOption = winningOptionId
            ? session.options.find(function (opt) { return opt.id === winningOptionId; }) || null
            : null;
        var confidence = totalWeight > 0 ? maxWeight / totalWeight : 0;
        var consensusReached = totalWeight > 0 && maxWeight >= totalWeight * threshold;
        return {
            sessionId: session.id,
            winningOption: winningOption,
            confidence: confidence,
            voteDistribution: voteDistribution,
            consensusReached: consensusReached,
            resolutionMethod: 'supermajority',
            details: "Supermajority (".concat((threshold * 100).toFixed(1), "%): ").concat(maxWeight, "/").concat(totalWeight, " weight")
        };
    };
    /**
     * Calculates result using consensus threshold
     */
    ConsensusVotingSystem.prototype.calculateConsensusThreshold = function (session, voteDistribution, totalWeight, threshold) {
        // For consensus threshold, all agents must agree
        var uniqueVotes = new Set(session.votes.map(function (vote) { return vote.optionId; }));
        var consensusReached = uniqueVotes.size === 1 &&
            session.votes.length === this.agents.size &&
            totalWeight >= this.getTotalAgentWeight() * threshold;
        var winningOptionId = consensusReached ? session.votes[0].optionId : null;
        var winningOption = winningOptionId
            ? session.options.find(function (opt) { return opt.id === winningOptionId; }) || null
            : null;
        var confidence = consensusReached ? 1 : 0;
        return {
            sessionId: session.id,
            winningOption: winningOption,
            confidence: confidence,
            voteDistribution: voteDistribution,
            consensusReached: consensusReached,
            resolutionMethod: 'unanimous',
            details: "Consensus threshold (".concat((threshold * 100).toFixed(1), "%): ").concat(consensusReached ? 'Reached' : 'Not reached')
        };
    };
    /**
     * Calculates an agent's voting weight based on expertise and performance
     * @param agent The agent
     * @returns Weight value
     */
    ConsensusVotingSystem.prototype.calculateAgentWeight = function (agent) {
        // Simple implementation based on expertise count and assumed performance
        // In a real system, this would be more sophisticated
        return Math.max(1, agent.expertise.length / 2);
    };
    /**
     * Gets total weight of all registered agents
     * @returns Total weight
     */
    ConsensusVotingSystem.prototype.getTotalAgentWeight = function () {
        var _this = this;
        var total = 0;
        this.agents.forEach(function (agent) {
            total += _this.calculateAgentWeight(agent);
        });
        return total;
    };
    /**
     * Generates a unique session ID
     * @param topic Session topic
     * @returns Unique session ID
     */
    ConsensusVotingSystem.prototype.generateSessionId = function (topic) {
        var timestamp = Date.now();
        var random = Math.floor(Math.random() * 10000);
        var topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
        return "vote_".concat(topicSlug, "_").concat(timestamp, "_").concat(random);
    };
    return ConsensusVotingSystem;
}());
exports.ConsensusVotingSystem = ConsensusVotingSystem;
// Export singleton instance
exports.consensusVotingSystem = new ConsensusVotingSystem();
