import { ConsensusVotingSystem } from '../../src/swarm/consensus.voting';
describe('ConsensusVotingSystem', () => {
    let votingSystem;
    let mockAgents;
    beforeEach(() => {
        votingSystem = new ConsensusVotingSystem();
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
    describe('registerAgent', () => {
        it('should register an agent successfully', () => {
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
    describe('unregisterAgent', () => {
        it('should unregister an agent successfully', () => {
            votingSystem.unregisterAgent('agent-1');
            // Similar to registerAgent, we'd need a getter method to verify
        });
    });
    describe('createVotingSession', () => {
        it('should create a voting session successfully', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' },
                { id: 'opt-2', label: 'Option 2', value: 'value2' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options, 3);
            expect(sessionId).toBeDefined();
            expect(typeof sessionId).toBe('string');
            expect(sessionId).toContain('vote_');
            const session = votingSystem.getVotingSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.topic).toBe('Test Topic');
            expect(session?.options).toEqual(options);
            expect(session?.status).toBe('open');
            expect(session?.quorum).toBe(3);
        });
        it('should create a voting session without quorum', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options);
            const session = votingSystem.getVotingSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.quorum).toBeUndefined();
        });
    });
    describe('castVote', () => {
        let sessionId;
        const options = [
            { id: 'opt-1', label: 'Option 1', value: 'value1' },
            { id: 'opt-2', label: 'Option 2', value: 'value2' }
        ];
        beforeEach(() => {
            sessionId = votingSystem.createVotingSession('Test Vote', options);
        });
        it('should cast a vote successfully', () => {
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-1', 'Because it is better');
            expect(result).toBe(true);
            const session = votingSystem.getVotingSession(sessionId);
            expect(session?.votes).toHaveLength(1);
            expect(session?.votes[0].agentId).toBe('agent-1');
            expect(session?.votes[0].optionId).toBe('opt-1');
            expect(session?.votes[0].rationale).toBe('Because it is better');
        });
        it('should fail to cast vote for non-existent session', () => {
            const result = votingSystem.castVote('non-existent-session', 'agent-1', 'opt-1');
            expect(result).toBe(false);
        });
        it('should fail to cast vote for closed session', () => {
            // Close the session
            votingSystem.closeVotingSession(sessionId);
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            expect(result).toBe(false);
        });
        it('should fail to cast vote for invalid option', () => {
            const result = votingSystem.castVote(sessionId, 'agent-1', 'invalid-option');
            expect(result).toBe(false);
        });
        it('should fail to cast duplicate vote from same agent', () => {
            // First vote
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            // Second vote from same agent
            const result = votingSystem.castVote(sessionId, 'agent-1', 'opt-2');
            expect(result).toBe(false);
            // Verify only first vote counted
            const session = votingSystem.getVotingSession(sessionId);
            expect(session?.votes).toHaveLength(1);
            expect(session?.votes[0].optionId).toBe('opt-1');
        });
    });
    describe('closeVotingSession', () => {
        let sessionId;
        const options = [
            { id: 'opt-1', label: 'Option 1', value: 'value1' },
            { id: 'opt-2', label: 'Option 2', value: 'value2' },
            { id: 'opt-3', label: 'Option 3', value: 'value3' }
        ];
        beforeEach(() => {
            sessionId = votingSystem.createVotingSession('Test Vote', options);
        });
        it('should close session and calculate simple majority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-2', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-3', 'opt-2');
            const result = votingSystem.closeVotingSession(sessionId, 'simple-majority');
            expect(result.sessionId).toBe(sessionId);
            expect(result.winningOption).toBeDefined();
            expect(result.winningOption?.id).toBe('opt-1');
            expect(result.consensusReached).toBe(true);
            expect(result.resolutionMethod).toBe('majority');
            expect(result.confidence).toBe(2 / 3);
        });
        it('should close session and calculate weighted majority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1'); // Weight 1
            votingSystem.castVote(sessionId, 'agent-2', 'opt-2'); // Weight 1
            votingSystem.castVote(sessionId, 'agent-3', 'opt-2'); // Weight 1
            const result = votingSystem.closeVotingSession(sessionId, 'weighted-majority');
            expect(result.sessionId).toBe(sessionId);
            expect(result.consensusReached).toBe(true);
        });
        it('should close session and calculate supermajority result', () => {
            // Cast votes
            votingSystem.castVote(sessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-2', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-3', 'opt-1');
            votingSystem.castVote(sessionId, 'agent-4', 'opt-2');
            const result = votingSystem.closeVotingSession(sessionId, 'supermajority', 0.6);
            expect(result.sessionId).toBe(sessionId);
            expect(result.winningOption?.id).toBe('opt-1');
            expect(result.consensusReached).toBe(true);
            expect(result.resolutionMethod).toBe('supermajority');
        });
        it('should handle session with no votes', () => {
            const result = votingSystem.closeVotingSession(sessionId);
            expect(result.sessionId).toBe(sessionId);
            expect(result.winningOption).toBeNull();
            expect(result.consensusReached).toBe(false);
            expect(result.details).toBe('No votes cast');
        });
        it('should handle session that does not meet quorum', () => {
            // Create session with quorum
            const quorumSessionId = votingSystem.createVotingSession('Quorum Test', options, 3);
            // Cast fewer votes than quorum
            votingSystem.castVote(quorumSessionId, 'agent-1', 'opt-1');
            votingSystem.castVote(quorumSessionId, 'agent-2', 'opt-1');
            const result = votingSystem.closeVotingSession(quorumSessionId);
            expect(result.consensusReached).toBe(false);
            expect(result.details).toContain('Quorum not met');
        });
        it('should throw error for non-existent session', () => {
            expect(() => votingSystem.closeVotingSession('non-existent-session'))
                .toThrow('Voting session non-existent-session not found');
        });
        it('should throw error for already closed session', () => {
            // Close session once
            votingSystem.closeVotingSession(sessionId);
            // Try to close again
            expect(() => votingSystem.closeVotingSession(sessionId))
                .toThrow('Voting session ' + sessionId + ' is not open');
        });
    });
    describe('getVotingSession', () => {
        it('should return a voting session by ID', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            const sessionId = votingSystem.createVotingSession('Test Topic', options);
            const session = votingSystem.getVotingSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.id).toBe(sessionId);
            expect(session?.topic).toBe('Test Topic');
        });
        it('should return undefined for non-existent session', () => {
            const session = votingSystem.getVotingSession('non-existent-session');
            expect(session).toBeUndefined();
        });
    });
    describe('getAllVotingSessions', () => {
        it('should return all voting sessions', () => {
            const options = [
                { id: 'opt-1', label: 'Option 1', value: 'value1' }
            ];
            votingSystem.createVotingSession('Topic 1', options);
            votingSystem.createVotingSession('Topic 2', options);
            const sessions = votingSystem.getAllVotingSessions();
            expect(sessions.length).toBeGreaterThanOrEqual(2);
        });
    });
    describe('calculateAgentWeight', () => {
        it('should calculate agent weight based on expertise', () => {
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
            expect(weight1).toBe(1); // Max(1, 2/2) = 1
            const agentWith5Expertise = {
                id: 'test-agent-2',
                type: 'coder',
                name: 'Test Agent 2',
                expertise: ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'],
                workload: 0,
                capacity: 5
            };
            const weight2 = votingSystem.calculateAgentWeight(agentWith5Expertise);
            expect(weight2).toBe(2.5); // Max(1, 5/2) = 2.5
        });
    });
    describe('getTotalAgentWeight', () => {
        it('should calculate total weight of all registered agents', () => {
            const totalWeight = votingSystem.getTotalAgentWeight();
            expect(totalWeight).toBeGreaterThan(0);
            // Based on our mock agents, each with 1-2 expertise areas
            expect(totalWeight).toBeCloseTo(5, 1); // Approximately 5 total weight
        });
    });
    describe('generateSessionId', () => {
        it('should generate unique session IDs', () => {
            const id1 = votingSystem.generateSessionId('Test Topic');
            const id2 = votingSystem.generateSessionId('Test Topic');
            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
            expect(id1).toContain('vote_test-topic');
            expect(id2).toContain('vote_test-topic');
        });
    });
});
//# sourceMappingURL=consensus.voting.test.js.map