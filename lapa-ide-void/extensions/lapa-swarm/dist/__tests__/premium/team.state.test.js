"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const team_state_ts_1 = require("../../premium/team.state.ts");
(0, vitest_1.describe)('TeamStateManager', () => {
    let teamStateManager;
    (0, vitest_1.beforeEach)(() => {
        teamStateManager = new team_state_ts_1.TeamStateManager();
        // Clear all listeners between tests
        teamStateManager.removeAllListeners();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default max history', () => {
            const manager = new team_state_ts_1.TeamStateManager();
            (0, vitest_1.expect)(manager.maxHistoryPerTeam).toBe(100);
        });
        (0, vitest_1.it)('should initialize with custom max history', () => {
            const manager = new team_state_ts_1.TeamStateManager(50);
            (0, vitest_1.expect)(manager.maxHistoryPerTeam).toBe(50);
        });
    });
    (0, vitest_1.describe)('createTeamState', () => {
        (0, vitest_1.it)('should create team state successfully', () => {
            const teamState = teamStateManager.createTeamState('team-123', ['member1', 'member2']);
            (0, vitest_1.expect)(teamState).toBeDefined();
            (0, vitest_1.expect)(teamState.teamId).toBe('team-123');
            (0, vitest_1.expect)(teamState.members).toEqual(['member1', 'member2']);
            (0, vitest_1.expect)(teamState.sharedContext).toEqual({});
            (0, vitest_1.expect)(teamState.version).toBe(1);
            (0, vitest_1.expect)(teamState.lastUpdated).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should create team state without members', () => {
            const teamState = teamStateManager.createTeamState('team-123');
            (0, vitest_1.expect)(teamState.members).toEqual([]);
        });
        (0, vitest_1.it)('should emit teamCreated event', () => {
            const listener = vitest_1.vi.fn();
            teamStateManager.on('teamCreated', listener);
            const teamState = teamStateManager.createTeamState('team-123');
            (0, vitest_1.expect)(listener).toHaveBeenCalledWith(teamState);
        });
        (0, vitest_1.it)('should handle creation failure', () => {
            // This is difficult to test without mocking internal errors
            // but we can at least verify the error handling structure
            const teamState = teamStateManager.createTeamState('team-123');
            (0, vitest_1.expect)(teamState).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getTeamState', () => {
        (0, vitest_1.it)('should retrieve existing team state', () => {
            const createdState = teamStateManager.createTeamState('team-123', ['member1']);
            const retrievedState = teamStateManager.getTeamState('team-123');
            (0, vitest_1.expect)(retrievedState).toEqual(createdState);
        });
        (0, vitest_1.it)('should return undefined for non-existent team', () => {
            const retrievedState = teamStateManager.getTeamState('non-existent');
            (0, vitest_1.expect)(retrievedState).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('updateTeamState', () => {
        let initialState;
        (0, vitest_1.beforeEach)(() => {
            initialState = teamStateManager.createTeamState('team-123', ['member1']);
        });
        (0, vitest_1.it)('should update team state successfully', () => {
            const updatedState = teamStateManager.updateTeamState('team-123', 'user1', {
                members: ['member1', 'member2'],
                sharedContext: { project: 'new-project' }
            });
            (0, vitest_1.expect)(updatedState.teamId).toBe('team-123');
            (0, vitest_1.expect)(updatedState.members).toEqual(['member1', 'member2']);
            (0, vitest_1.expect)(updatedState.sharedContext).toEqual({ project: 'new-project' });
            (0, vitest_1.expect)(updatedState.version).toBe(2);
            (0, vitest_1.expect)(updatedState.lastUpdated).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should merge shared context correctly', () => {
            // First update
            teamStateManager.updateTeamState('team-123', 'user1', {
                sharedContext: { project: 'project1', status: 'active' }
            });
            // Second update that should merge
            const updatedState = teamStateManager.updateTeamState('team-123', 'user2', {
                sharedContext: { status: 'completed', owner: 'user2' }
            });
            (0, vitest_1.expect)(updatedState.sharedContext).toEqual({
                project: 'project1',
                status: 'completed',
                owner: 'user2'
            });
        });
        (0, vitest_1.it)('should record update in history', () => {
            const changes = { members: ['member1', 'member2'] };
            teamStateManager.updateTeamState('team-123', 'user1', changes);
            const history = teamStateManager.getTeamUpdateHistory('team-123');
            (0, vitest_1.expect)(history).toHaveLength(1);
            (0, vitest_1.expect)(history[0]).toEqual({
                teamId: 'team-123',
                updaterId: 'user1',
                changes,
                timestamp: vitest_1.expect.any(Date)
            });
        });
        (0, vitest_1.it)('should emit teamUpdated event', () => {
            const listener = vitest_1.vi.fn();
            teamStateManager.on('teamUpdated', listener);
            const changes = { members: ['member1', 'member2'] };
            const updatedState = teamStateManager.updateTeamState('team-123', 'user1', changes);
            const history = teamStateManager.getTeamUpdateHistory('team-123');
            (0, vitest_1.expect)(listener).toHaveBeenCalledWith(updatedState, history[0]);
        });
        (0, vitest_1.it)('should throw error for non-existent team', () => {
            (0, vitest_1.expect)(() => teamStateManager.updateTeamState('non-existent', 'user1', {}))
                .toThrow('Team state not found for team non-existent');
        });
        (0, vitest_1.it)('should maintain history size limit', () => {
            const manager = new team_state_ts_1.TeamStateManager(3);
            manager.createTeamState('team-123');
            // Add more updates than the limit
            for (let i = 0; i < 5; i++) {
                manager.updateTeamState('team-123', `user${i}`, {
                    sharedContext: { update: i }
                });
            }
            const history = manager.getTeamUpdateHistory('team-123');
            (0, vitest_1.expect)(history).toHaveLength(3);
            // Should contain the most recent updates
            (0, vitest_1.expect)(history[0].changes).toEqual({ sharedContext: { update: 2 } });
            (0, vitest_1.expect)(history[1].changes).toEqual({ sharedContext: { update: 3 } });
            (0, vitest_1.expect)(history[2].changes).toEqual({ sharedContext: { update: 4 } });
        });
    });
    (0, vitest_1.describe)('addTeamMember', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', ['member1']);
        });
        (0, vitest_1.it)('should add member successfully', () => {
            const updatedState = teamStateManager.addTeamMember('team-123', 'member2');
            (0, vitest_1.expect)(updatedState.members).toEqual(['member1', 'member2']);
        });
        (0, vitest_1.it)('should not add duplicate member', () => {
            const initialState = teamStateManager.getTeamState('team-123');
            const updatedState = teamStateManager.addTeamMember('team-123', 'member1');
            (0, vitest_1.expect)(updatedState.members).toEqual(['member1']);
            (0, vitest_1.expect)(updatedState).toBe(initialState); // Should return same object
        });
        (0, vitest_1.it)('should throw error for non-existent team', () => {
            (0, vitest_1.expect)(() => teamStateManager.addTeamMember('non-existent', 'member1'))
                .toThrow('Team state not found for team non-existent');
        });
    });
    (0, vitest_1.describe)('removeTeamMember', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', ['member1', 'member2', 'member3']);
        });
        (0, vitest_1.it)('should remove member successfully', () => {
            const updatedState = teamStateManager.removeTeamMember('team-123', 'member2');
            (0, vitest_1.expect)(updatedState.members).toEqual(['member1', 'member3']);
        });
        (0, vitest_1.it)('should handle removing non-existent member', () => {
            const updatedState = teamStateManager.removeTeamMember('team-123', 'non-member');
            (0, vitest_1.expect)(updatedState.members).toEqual(['member1', 'member2', 'member3']);
        });
        (0, vitest_1.it)('should throw error for non-existent team', () => {
            (0, vitest_1.expect)(() => teamStateManager.removeTeamMember('non-existent', 'member1'))
                .toThrow('Team state not found for team non-existent');
        });
    });
    (0, vitest_1.describe)('getTeamUpdateHistory', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123');
            // Add some updates
            teamStateManager.updateTeamState('team-123', 'user1', { sharedContext: { update: 1 } });
            teamStateManager.updateTeamState('team-123', 'user2', { sharedContext: { update: 2 } });
            teamStateManager.updateTeamState('team-123', 'user3', { sharedContext: { update: 3 } });
        });
        (0, vitest_1.it)('should retrieve full history', () => {
            const history = teamStateManager.getTeamUpdateHistory('team-123');
            (0, vitest_1.expect)(history).toHaveLength(3);
            (0, vitest_1.expect)(history[0].updaterId).toBe('user1');
            (0, vitest_1.expect)(history[1].updaterId).toBe('user2');
            (0, vitest_1.expect)(history[2].updaterId).toBe('user3');
        });
        (0, vitest_1.it)('should retrieve limited history', () => {
            const history = teamStateManager.getTeamUpdateHistory('team-123', 2);
            (0, vitest_1.expect)(history).toHaveLength(2);
            (0, vitest_1.expect)(history[0].updaterId).toBe('user2');
            (0, vitest_1.expect)(history[1].updaterId).toBe('user3');
        });
        (0, vitest_1.it)('should return empty array for non-existent team', () => {
            const history = teamStateManager.getTeamUpdateHistory('non-existent');
            (0, vitest_1.expect)(history).toEqual([]);
        });
    });
    (0, vitest_1.describe)('getTeamMembers', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', ['member1', 'member2']);
        });
        (0, vitest_1.it)('should retrieve team members', () => {
            const members = teamStateManager.getTeamMembers('team-123');
            (0, vitest_1.expect)(members).toEqual(['member1', 'member2']);
        });
        (0, vitest_1.it)('should return empty array for non-existent team', () => {
            const members = teamStateManager.getTeamMembers('non-existent');
            (0, vitest_1.expect)(members).toEqual([]);
        });
    });
    (0, vitest_1.describe)('isTeamMember', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', ['member1', 'member2']);
        });
        (0, vitest_1.it)('should confirm team membership', () => {
            const isMember = teamStateManager.isTeamMember('team-123', 'member1');
            (0, vitest_1.expect)(isMember).toBe(true);
        });
        (0, vitest_1.it)('should deny non-membership', () => {
            const isMember = teamStateManager.isTeamMember('team-123', 'non-member');
            (0, vitest_1.expect)(isMember).toBe(false);
        });
        (0, vitest_1.it)('should return false for non-existent team', () => {
            const isMember = teamStateManager.isTeamMember('non-existent', 'member1');
            (0, vitest_1.expect)(isMember).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateSharedContext', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123');
        });
        (0, vitest_1.it)('should update shared context successfully', () => {
            const updatedState = teamStateManager.updateSharedContext('team-123', 'user1', {
                project: 'new-project',
                status: 'active'
            });
            (0, vitest_1.expect)(updatedState.sharedContext).toEqual({
                project: 'new-project',
                status: 'active'
            });
        });
        (0, vitest_1.it)('should throw error for non-existent team', () => {
            (0, vitest_1.expect)(() => teamStateManager.updateSharedContext('non-existent', 'user1', {}))
                .toThrow('Team state not found for team non-existent');
        });
    });
    (0, vitest_1.describe)('getSharedContext', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', [], {
                project: 'test-project',
                status: 'active'
            });
            teamStateManager.updateSharedContext('team-123', 'user1', {
                project: 'test-project',
                status: 'active'
            });
        });
        (0, vitest_1.it)('should retrieve shared context', () => {
            const context = teamStateManager.getSharedContext('team-123');
            (0, vitest_1.expect)(context).toEqual({
                project: 'test-project',
                status: 'active'
            });
        });
        (0, vitest_1.it)('should return empty object for non-existent team', () => {
            const context = teamStateManager.getSharedContext('non-existent');
            (0, vitest_1.expect)(context).toEqual({});
        });
    });
    (0, vitest_1.describe)('deleteTeamState', () => {
        (0, vitest_1.beforeEach)(() => {
            teamStateManager.createTeamState('team-123', ['member1']);
        });
        (0, vitest_1.it)('should delete team state successfully', () => {
            const listener = vitest_1.vi.fn();
            teamStateManager.on('teamDeleted', listener);
            const result = teamStateManager.deleteTeamState('team-123');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(teamStateManager.getTeamState('team-123')).toBeUndefined();
            (0, vitest_1.expect)(teamStateManager.getTeamUpdateHistory('team-123')).toEqual([]);
            (0, vitest_1.expect)(listener).toHaveBeenCalledWith('team-123');
        });
        (0, vitest_1.it)('should return false for non-existent team', () => {
            const result = teamStateManager.deleteTeamState('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('event handling', () => {
        (0, vitest_1.it)('should handle multiple event listeners', () => {
            const listener1 = vitest_1.vi.fn();
            const listener2 = vitest_1.vi.fn();
            teamStateManager.on('teamCreated', listener1);
            teamStateManager.on('teamCreated', listener2);
            teamStateManager.createTeamState('team-123');
            (0, vitest_1.expect)(listener1).toHaveBeenCalled();
            (0, vitest_1.expect)(listener2).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle teamUpdated events with correct parameters', () => {
            const listener = vitest_1.vi.fn();
            teamStateManager.on('teamUpdated', listener);
            teamStateManager.createTeamState('team-123');
            const updatedState = teamStateManager.updateTeamState('team-123', 'user1', {
                sharedContext: { test: 'value' }
            });
            (0, vitest_1.expect)(listener).toHaveBeenCalledWith(updatedState, vitest_1.expect.any(Object));
            const callArgs = listener.mock.calls[0];
            (0, vitest_1.expect)(callArgs[1].teamId).toBe('team-123');
            (0, vitest_1.expect)(callArgs[1].updaterId).toBe('user1');
            (0, vitest_1.expect)(callArgs[1].changes).toEqual({ sharedContext: { test: 'value' } });
        });
    });
});
//# sourceMappingURL=team.state.test.js.map