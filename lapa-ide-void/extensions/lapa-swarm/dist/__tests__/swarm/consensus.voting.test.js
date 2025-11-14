"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const consensus_voting_ts_1 = require("../../swarm/consensus.voting.ts");
(0, vitest_1.describe)('ConsensusVotingSystem', () => {
    let votingSystem;
    let mockAgents;
    beforeEach(() => {
        votingSystem = new consensus_voting_ts_1.ConsensusVotingSystem();
        mockAgents = [
            {
                id: 'agent-1',
                type: 'coder',
                name: 'Code Generator',
                expertise: ['javascript', 'typescript'],
                workload: 0,
                capacity: 5
            },
            {
                id: 'agent-2',
                type: 'reviewer',
                name: 'Code Reviewer',
                expertise: ['code-review', 'security'],
                workload: 0,
                capacity: 3
            },
            {
                id: 'agent-3',
                type: 'debugger',
                name: 'Bug Fixer',
                expertise: ['debugging', 'troubleshooting'],
                workload: 0,
                capacity: 4
            },
            {
                id: 'agent-4',
                type: 'optimizer',
                name: 'Performance Wizard',
                expertise: ['performance', 'optimization'],
                workload: 0,
                capacity: 4
            },
            {
                id: 'agent-5',
                type: 'planner',
                name: 'Strategic Planner',
                expertise: ['planning', 'architecture'],
                workload: 0,
                capacity: 3
            }
        ];
        // Register mock agents
        mockAgents.forEach(agent => votingSystem.registerAgent(agent));
    });
    (0, vitest_1.describe)('registerAgent', () => {
        (0, vitest_1.it)('should register an agent successfully', () => {
            const newAgent = {
                id: 'agent-6',
                type: 'tester',
                name: 'Test Architect',
                expertise: ['testing', 'qa'],
                workload: 0,
                capacity: 3
            };
            votingSystem.registerAgent(newAgent);
            // We can't directly check the agents map, but we can verify through other methods
            // This would require exposing a getter method in the actual implementation
        });
    });
    (0, vitest_1.describe)('unregisterAgent', () => {
        (0, vitest_1.it)('should unregister an agent successfully', () => {
            votingSystem.unregisterAgent('agent-1');
            // Similar to registerAgent, we'd need a getter method to verify
        });
    });
    (0, vitest_1.describe)('createVotingSession', () => {
        (0, vitest_1.it)('should create a voting session successfully', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' },
                { id: 'opt-2', label: 'Option 2', value: 'value2' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options, 3);
            (0, vitest_1.expect)(sessionId).toBeDefined();
            (0, vitest_1.expect)(typeof sessionId).toBe('string');
            (0, vitest_1.expect)(sessionId).toContain('vote_');
            const session = votingSystem.getVotingSession(sessionId);
            (0, vitest_1.expect)(session).toBeDefined();
            (0, vitest_1.expect)(session?.topic).toBe('Test Topic');
            (0, vitest_1.expect)(session?.options).toEqual(options);
            (0, vitest_1.expect)(session?.status).toBe('open');
            (0, vitest_1.expect)(session?.quorum).toBe(3);
        });
        (0, vitest_1.it)('should create a voting session without quorum', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options);
            const session = votingSystem.getVotingSession(sessionId);
            (0, vitest_1.expect)(session).toBeDefined();
            (0, vitest_1.expect)(session?.quorum).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('castVote', () => {
        let sessionId;
        const options = [
            { id: 'opt-1', label: 'Option 1', value: 'value1' },
            { id: 'opt-2', label: 'Option 2', value: 'value2' }
        ];
        beforeEach(() => {
            sessionId = votingSystem.createVotingSession('Test Vote', options);
        });
        (0, vitest_1.it)('should cast a vote successfully', () => {
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-1', 'Because it is better');
            (0, vitest_1.expect)(result).toBe(true);
            const session = votingSystem.getVotingSession(sessionId);
            (0, vitest_1.expect)(session?.votes).toHaveLength(1);
            (0, vitest_1.expect)(session?.votes[0].agentId).toBe('agent-1');
            (0, vitest_1.expect)(session?.votes[0].optionId).toBe('opt-1');
            (0, vitest_1.expect)(session?.votes[0].rationale).toBe('Because it is better');
        });
        (0, vitest_1.it)('should fail to cast vote for non-existent session', () => {
            const result = votingSystem.castVote('non-existent-session', 'agent-1', 'opt-1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should fail to cast vote for closed session', () => {
            // Close the session
            votingSystem.closeVotingSession(sessionId);
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should fail to cast vote for invalid option', () => {
            const result = votingSystem.castVote(sessionId, 'agent-1', 'invalid-option');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should fail to cast duplicate vote from same agent', () => {
            // First vote
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            // Second vote from same agent
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-2');
            (0, vitest_1.expect)(result).toBe(false);
            // Verify only first vote counted
            const session = votingSystem.getVotingSession(sessionId);
            (0, vitest_1.expect)(session?.votes).toHaveLength(1);
            (0, vitest_1.expect)(session?.votes[0].optionId).toBe('opt-1');
        });
    });
    (0, vitest_1.describe)('closeVotingSession', () => {
        let sessionId;
        const options = [
            { id: 'opt-1', label: 'Option 1', value: 'value1' },
            { id: 'opt-2', label: 'Option 2', value: 'value2' },
            { id: 'opt-3', label: 'Option 3', value: 'value3' }
        ];
        beforeEach(() => {
            sessionId = votingSystem.createVotingSession('Test Vote', options);
        });
        (0, vitest_1.it)('should close session and calculate simple majority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-2', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-3', 'opt-2');
            const result = votingSystem.closeVotingSession(sessionId, 'simple-majority');
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            (0, vitest_1.expect)(result.winningOption).toBeDefined();
            (0, vitest_1.expect)(result.winningOption?.id).toBe('opt-1');
            (0, vitest_1.expect)(result.consensusReached).toBe(true);
            (0, vitest_1.expect)(result.resolutionMethod).toBe('majority');
            (0, vitest_1.expect)(result.confidence).toBe(2 / 3);
        });
        (0, vitest_1.it)('should close session and calculate weighted majority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1'); // Weight 1
            votingSystem.castVote(sessionId, 'agent-2', 'opt-2'); // Weight 1
            votingSystem.castVote(sessionId, 'agent-3', 'opt-2'); // Weight 1
            const result = votingSystem.closeVotingSession(sessionId, 'weighted-majority');
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            (0, vitest_1.expect)(result.consensusReached).toBe(true);
        });
        (0, vitest_1.it)('should close session and calculate supermajority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-2', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-3', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-4', 'opt-2');
            const result = votingSystem.closeVotingSession(sessionId, 'supermajority', 0.6);
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            (0, vitest_1.expect)(result.winningOption?.id).toBe('opt-1');
            (0, vitest_1.expect)(result.consensusReached).toBe(true);
            (0, vitest_1.expect)(result.resolutionMethod).toBe('supermajority');
        });
        (0, vitest_1.it)('should handle session with no votes', () => {
            const result = votingSystem.closeVotingSession(sessionId);
            (0, vitest_1.expect)(result.sessionId).toBe(sessionId);
            (0, vitest_1.expect)(result.winningOption).toBeNull();
            (0, vitest_1.expect)(result.consensusReached).toBe(false);
            (0, vitest_1.expect)(result.details).toBe('No votes cast');
        });
        (0, vitest_1.it)('should handle session that does not meet quorum', () => {
            // Create session with quorum
            const quorumSessionId = votingSystem.createVotingSession('Quorum Test', options, 3);
            // Cast fewer votes than quorum
            votingSystem.castVote(quorumSessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(quorumSessionId, 'agent-2', 'opt-1');
            const result = votingSystem.closeVotingSession(quorumSessionId);
            (0, vitest_1.expect)(result.consensusReached).toBe(false);
            (0, vitest_1.expect)(result.details).toContain('Quorum not met');
        });
        (0, vitest_1.it)('should throw error for non-existent session', () => {
            (0, vitest_1.expect)(() => votingSystem.closeVotingSession('non-existent-session'))
                .toThrow('Voting session non-existent-session not found');
        });
        (0, vitest_1.it)('should throw error for already closed session', () => {
            // Close session once
            votingSystem.closeVotingSession(sessionId);
            // Try to close again
            (0, vitest_1.expect)(() => votingSystem.closeVotingSession(sessionId))
                .toThrow('Voting session ' + sessionId + ' is not open');
        });
    });
    (0, vitest_1.describe)('getVotingSession', () => {
        (0, vitest_1.it)('should return a voting session by ID', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options);
            const session = votingSystem.getVotingSession(sessionId);
            (0, vitest_1.expect)(session).toBeDefined();
            (0, vitest_1.expect)(session?.id).toBe(sessionId);
            (0, vitest_1.expect)(session?.topic).toBe('Test Topic');
        });
        (0, vitest_1.it)('should return undefined for non-existent session', () => {
            const session = votingSystem.getVotingSession('non-existent-session');
            (0, vitest_1.expect)(session).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getAllVotingSessions', () => {
        (0, vitest_1.it)('should return all voting sessions', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            votingSystem.createVotingSession('Topic 1', options);
            votingSystem.createVotingSession('Topic 2', options);
            const sessions = votingSystem.getAllVotingSessions();
            (0, vitest_1.expect)(sessions.length).toBeGreaterThanOrEqual(2);
        });
    });
    (0, vitest_1.describe)('calculateAgentWeight', () => {
        (0, vitest_1.it)('should calculate agent weight based on expertise', () => {
            // Access private method through casting
            const agentWith2Expertise = {
                id: 'test-agent-1',
                type: 'coder',
                name: 'Test Agent',
                expertise: ['skill1', 'skill2'],
                workload: 0,
                capacity: 5
            };
            const weight1 = votingSystem.calculateAgentWeight(agentWith2Expertise);
            (0, vitest_1.expect)(weight1).toBe(1); // Max(1, 2/2) = 1
            const agentWith5Expertise = {
                id: 'test-agent-2',
                type: 'coder',
                name: 'Test Agent 2',
                expertise: ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'],
                workload: 0,
                capacity: 5
            };
            const weight2 = votingSystem.calculateAgentWeight(agentWith5Expertise);
            (0, vitest_1.expect)(weight2).toBe(2.5); // Max(1, 5/2) = 2.5
        });
    });
    (0, vitest_1.describe)('getTotalAgentWeight', () => {
        (0, vitest_1.it)('should calculate total weight of all registered agents', () => {
            const totalWeight = votingSystem.getTotalAgentWeight();
            (0, vitest_1.expect)(totalWeight).toBeGreaterThan(0);
            // Based on our mock agents, each with 1-2 expertise areas
            (0, vitest_1.expect)(totalWeight).toBeCloseTo(5, 1); // Approximately 5 total weight
        });
    });
    (0, vitest_1.describe)('generateSessionId', () => {
        (0, vitest_1.it)('should generate unique session IDs', () => {
            const id1 = votingSystem.generateSessionId('Test Topic');
            const id2 = votingSystem.generateSessionId('Test Topic');
            (0, vitest_1.expect)(id1).toBeDefined();
            (0, vitest_1.expect)(id2).toBeDefined();
            (0, vitest_1.expect)(id1).not.toBe(id2);
            (0, vitest_1.expect)(id1).toContain('vote_test-topic');
            (0, vitest_1.expect)(id2).toContain('vote_test-topic');
        });
    });
});
//# sourceMappingURL=consensus.voting.test.js.map