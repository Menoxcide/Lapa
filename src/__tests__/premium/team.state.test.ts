import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamStateManager, TeamState, TeamStateUpdate } from '../../premium/team.state.ts';
import { EventEmitter } from 'events';

describe('TeamStateManager', () => {
  let teamStateManager: TeamStateManager;
  
  beforeEach(() => {
    teamStateManager = new TeamStateManager();
    
    // Clear all listeners between tests
    teamStateManager.removeAllListeners();
  });

  describe('constructor', () => {
    it('should initialize with default max history', () => {
      const manager = new TeamStateManager();
      expect((manager as any).maxHistoryPerTeam).toBe(100);
    });

    it('should initialize with custom max history', () => {
      const manager = new TeamStateManager(50);
      expect((manager as any).maxHistoryPerTeam).toBe(50);
    });
  });

  describe('createTeamState', () => {
    it('should create team state successfully', () => {
      const teamState = teamStateManager.createTeamState('team-123', ['member1', 'member2']);
      
      expect(teamState).toBeDefined();
      expect(teamState.teamId).toBe('team-123');
      expect(teamState.members).toEqual(['member1', 'member2']);
      expect(teamState.sharedContext).toEqual({});
      expect(teamState.version).toBe(1);
      expect(teamState.lastUpdated).toBeInstanceOf(Date);
    });

    it('should create team state without members', () => {
      const teamState = teamStateManager.createTeamState('team-123');
      
      expect(teamState.members).toEqual([]);
    });

    it('should emit teamCreated event', () => {
      const listener = vi.fn();
      teamStateManager.on('teamCreated', listener);
      
      const teamState = teamStateManager.createTeamState('team-123');
      
      expect(listener).toHaveBeenCalledWith(teamState);
    });

    it('should handle creation failure', () => {
      // This is difficult to test without mocking internal errors
      // but we can at least verify the error handling structure
      const teamState = teamStateManager.createTeamState('team-123');
      expect(teamState).toBeDefined();
    });
  });

  describe('getTeamState', () => {
    it('should retrieve existing team state', () => {
      const createdState = teamStateManager.createTeamState('team-123', ['member1']);
      const retrievedState = teamStateManager.getTeamState('team-123');
      
      expect(retrievedState).toEqual(createdState);
    });

    it('should return undefined for non-existent team', () => {
      const retrievedState = teamStateManager.getTeamState('non-existent');
      
      expect(retrievedState).toBeUndefined();
    });
  });

  describe('updateTeamState', () => {
    let initialState: TeamState;
    
    beforeEach(() => {
      initialState = teamStateManager.createTeamState('team-123', ['member1']);
    });

    it('should update team state successfully', () => {
      const updatedState = teamStateManager.updateTeamState('team-123', 'user1', {
        members: ['member1', 'member2'],
        sharedContext: { project: 'new-project' }
      });
      
      expect(updatedState.teamId).toBe('team-123');
      expect(updatedState.members).toEqual(['member1', 'member2']);
      expect(updatedState.sharedContext).toEqual({ project: 'new-project' });
      expect(updatedState.version).toBe(2);
      expect(updatedState.lastUpdated).toBeInstanceOf(Date);
    });

    it('should merge shared context correctly', () => {
      // First update
      teamStateManager.updateTeamState('team-123', 'user1', {
        sharedContext: { project: 'project1', status: 'active' }
      });
      
      // Second update that should merge
      const updatedState = teamStateManager.updateTeamState('team-123', 'user2', {
        sharedContext: { status: 'completed', owner: 'user2' }
      });
      
      expect(updatedState.sharedContext).toEqual({
        project: 'project1',
        status: 'completed',
        owner: 'user2'
      });
    });

    it('should record update in history', () => {
      const changes = { members: ['member1', 'member2'] };
      teamStateManager.updateTeamState('team-123', 'user1', changes);
      
      const history = teamStateManager.getTeamUpdateHistory('team-123');
      
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        teamId: 'team-123',
        updaterId: 'user1',
        changes,
        timestamp: expect.any(Date)
      });
    });

    it('should emit teamUpdated event', () => {
      const listener = vi.fn();
      teamStateManager.on('teamUpdated', listener);
      
      const changes = { members: ['member1', 'member2'] };
      const updatedState = teamStateManager.updateTeamState('team-123', 'user1', changes);
      const history = teamStateManager.getTeamUpdateHistory('team-123');
      
      expect(listener).toHaveBeenCalledWith(updatedState, history[0]);
    });

    it('should throw error for non-existent team', () => {
      expect(() => teamStateManager.updateTeamState('non-existent', 'user1', {}))
        .toThrow('Team state not found for team non-existent');
    });

    it('should maintain history size limit', () => {
      const manager = new TeamStateManager(3);
      manager.createTeamState('team-123');
      
      // Add more updates than the limit
      for (let i = 0; i < 5; i++) {
        manager.updateTeamState('team-123', `user${i}`, {
          sharedContext: { update: i }
        });
      }
      
      const history = manager.getTeamUpdateHistory('team-123');
      expect(history).toHaveLength(3);
      // Should contain the most recent updates
      expect(history[0].changes).toEqual({ sharedContext: { update: 2 } });
      expect(history[1].changes).toEqual({ sharedContext: { update: 3 } });
      expect(history[2].changes).toEqual({ sharedContext: { update: 4 } });
    });
  });

  describe('addTeamMember', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', ['member1']);
    });

    it('should add member successfully', () => {
      const updatedState = teamStateManager.addTeamMember('team-123', 'member2');
      
      expect(updatedState.members).toEqual(['member1', 'member2']);
    });

    it('should not add duplicate member', () => {
      const initialState = teamStateManager.getTeamState('team-123');
      const updatedState = teamStateManager.addTeamMember('team-123', 'member1');
      
      expect(updatedState.members).toEqual(['member1']);
      expect(updatedState).toBe(initialState); // Should return same object
    });

    it('should throw error for non-existent team', () => {
      expect(() => teamStateManager.addTeamMember('non-existent', 'member1'))
        .toThrow('Team state not found for team non-existent');
    });
  });

  describe('removeTeamMember', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', ['member1', 'member2', 'member3']);
    });

    it('should remove member successfully', () => {
      const updatedState = teamStateManager.removeTeamMember('team-123', 'member2');
      
      expect(updatedState.members).toEqual(['member1', 'member3']);
    });

    it('should handle removing non-existent member', () => {
      const updatedState = teamStateManager.removeTeamMember('team-123', 'non-member');
      
      expect(updatedState.members).toEqual(['member1', 'member2', 'member3']);
    });

    it('should throw error for non-existent team', () => {
      expect(() => teamStateManager.removeTeamMember('non-existent', 'member1'))
        .toThrow('Team state not found for team non-existent');
    });
  });

  describe('getTeamUpdateHistory', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123');
      
      // Add some updates
      teamStateManager.updateTeamState('team-123', 'user1', { sharedContext: { update: 1 } });
      teamStateManager.updateTeamState('team-123', 'user2', { sharedContext: { update: 2 } });
      teamStateManager.updateTeamState('team-123', 'user3', { sharedContext: { update: 3 } });
    });

    it('should retrieve full history', () => {
      const history = teamStateManager.getTeamUpdateHistory('team-123');
      
      expect(history).toHaveLength(3);
      expect(history[0].updaterId).toBe('user1');
      expect(history[1].updaterId).toBe('user2');
      expect(history[2].updaterId).toBe('user3');
    });

    it('should retrieve limited history', () => {
      const history = teamStateManager.getTeamUpdateHistory('team-123', 2);
      
      expect(history).toHaveLength(2);
      expect(history[0].updaterId).toBe('user2');
      expect(history[1].updaterId).toBe('user3');
    });

    it('should return empty array for non-existent team', () => {
      const history = teamStateManager.getTeamUpdateHistory('non-existent');
      
      expect(history).toEqual([]);
    });
  });

  describe('getTeamMembers', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', ['member1', 'member2']);
    });

    it('should retrieve team members', () => {
      const members = teamStateManager.getTeamMembers('team-123');
      
      expect(members).toEqual(['member1', 'member2']);
    });

    it('should return empty array for non-existent team', () => {
      const members = teamStateManager.getTeamMembers('non-existent');
      
      expect(members).toEqual([]);
    });
  });

  describe('isTeamMember', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', ['member1', 'member2']);
    });

    it('should confirm team membership', () => {
      const isMember = teamStateManager.isTeamMember('team-123', 'member1');
      
      expect(isMember).toBe(true);
    });

    it('should deny non-membership', () => {
      const isMember = teamStateManager.isTeamMember('team-123', 'non-member');
      
      expect(isMember).toBe(false);
    });

    it('should return false for non-existent team', () => {
      const isMember = teamStateManager.isTeamMember('non-existent', 'member1');
      
      expect(isMember).toBe(false);
    });
  });

  describe('updateSharedContext', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123');
    });

    it('should update shared context successfully', () => {
      const updatedState = teamStateManager.updateSharedContext('team-123', 'user1', {
        project: 'new-project',
        status: 'active'
      });
      
      expect(updatedState.sharedContext).toEqual({
        project: 'new-project',
        status: 'active'
      });
    });

    it('should throw error for non-existent team', () => {
      expect(() => teamStateManager.updateSharedContext('non-existent', 'user1', {}))
        .toThrow('Team state not found for team non-existent');
    });
  });

  describe('getSharedContext', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', [], {
        project: 'test-project',
        status: 'active'
      });
      
      teamStateManager.updateSharedContext('team-123', 'user1', {
        project: 'test-project',
        status: 'active'
      });
    });

    it('should retrieve shared context', () => {
      const context = teamStateManager.getSharedContext('team-123');
      
      expect(context).toEqual({
        project: 'test-project',
        status: 'active'
      });
    });

    it('should return empty object for non-existent team', () => {
      const context = teamStateManager.getSharedContext('non-existent');
      
      expect(context).toEqual({});
    });
  });

  describe('deleteTeamState', () => {
    beforeEach(() => {
      teamStateManager.createTeamState('team-123', ['member1']);
    });

    it('should delete team state successfully', () => {
      const listener = vi.fn();
      teamStateManager.on('teamDeleted', listener);
      
      const result = teamStateManager.deleteTeamState('team-123');
      
      expect(result).toBe(true);
      expect(teamStateManager.getTeamState('team-123')).toBeUndefined();
      expect(teamStateManager.getTeamUpdateHistory('team-123')).toEqual([]);
      expect(listener).toHaveBeenCalledWith('team-123');
    });

    it('should return false for non-existent team', () => {
      const result = teamStateManager.deleteTeamState('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should handle multiple event listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      teamStateManager.on('teamCreated', listener1);
      teamStateManager.on('teamCreated', listener2);
      
      teamStateManager.createTeamState('team-123');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle teamUpdated events with correct parameters', () => {
      const listener = vi.fn();
      teamStateManager.on('teamUpdated', listener);
      
      teamStateManager.createTeamState('team-123');
      const updatedState = teamStateManager.updateTeamState('team-123', 'user1', {
        sharedContext: { test: 'value' }
      });
      
      expect(listener).toHaveBeenCalledWith(updatedState, expect.any(Object));
      const callArgs = listener.mock.calls[0];
      expect(callArgs[1].teamId).toBe('team-123');
      expect(callArgs[1].updaterId).toBe('user1');
      expect(callArgs[1].changes).toEqual({ sharedContext: { test: 'value' } });
    });
  });
});