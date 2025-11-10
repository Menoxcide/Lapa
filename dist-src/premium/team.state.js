/**
 * Team State Synchronization for LAPA Premium
 *
 * This module provides real-time state synchronization across team members
 * for collaborative work in LAPA Core.
 */
// Import necessary modules
import { EventEmitter } from 'events';
/**
 * Team State Manager class
 */
export class TeamStateManager extends EventEmitter {
    constructor(maxHistoryPerTeam = 100) {
        super();
        this.states = new Map();
        this.updateHistory = new Map();
        this.maxHistoryPerTeam = maxHistoryPerTeam;
    }
    /**
     * Creates a new team state
     * @param teamId Team ID
     * @param members Initial team members
     * @returns Created team state
     */
    createTeamState(teamId, members = []) {
        try {
            const initialState = {
                teamId,
                members,
                sharedContext: {},
                lastUpdated: new Date(),
                version: 1,
            };
            this.states.set(teamId, initialState);
            this.updateHistory.set(teamId, []);
            // Emit creation event
            this.emit('teamCreated', initialState);
            return initialState;
        }
        catch (error) {
            console.error('Failed to create team state:', error);
            throw error;
        }
    }
    /**
     * Gets team state
     * @param teamId Team ID
     * @returns Team state
     */
    getTeamState(teamId) {
        try {
            return this.states.get(teamId);
        }
        catch (error) {
            console.error('Failed to get team state:', error);
            return undefined;
        }
    }
    /**
     * Updates team state
     * @param teamId Team ID
     * @param updaterId ID of the user making the update
     * @param changes Changes to apply
     * @returns Updated team state
     */
    updateTeamState(teamId, updaterId, changes) {
        try {
            const currentState = this.states.get(teamId);
            if (!currentState) {
                throw new Error(`Team state not found for team ${teamId}`);
            }
            // Apply changes
            const updatedState = {
                ...currentState,
                ...changes,
                lastUpdated: new Date(),
                version: currentState.version + 1,
            };
            // Update shared context specifically
            if (changes.sharedContext) {
                updatedState.sharedContext = {
                    ...currentState.sharedContext,
                    ...changes.sharedContext,
                };
            }
            // Save updated state
            this.states.set(teamId, updatedState);
            // Record update in history
            const updateRecord = {
                teamId,
                updaterId,
                changes,
                timestamp: new Date(),
            };
            const history = this.updateHistory.get(teamId) || [];
            history.push(updateRecord);
            // Maintain history size limit
            if (history.length > this.maxHistoryPerTeam) {
                history.shift();
            }
            this.updateHistory.set(teamId, history);
            // Emit update event
            this.emit('teamUpdated', updatedState, updateRecord);
            return updatedState;
        }
        catch (error) {
            console.error('Failed to update team state:', error);
            throw error;
        }
    }
    /**
     * Adds a member to a team
     * @param teamId Team ID
     * @param memberId Member ID to add
     * @returns Updated team state
     */
    addTeamMember(teamId, memberId) {
        try {
            const currentState = this.states.get(teamId);
            if (!currentState) {
                throw new Error(`Team state not found for team ${teamId}`);
            }
            // Check if member already exists
            if (currentState.members.includes(memberId)) {
                return currentState;
            }
            // Add member
            const updatedMembers = [...currentState.members, memberId];
            return this.updateTeamState(teamId, 'system', {
                members: updatedMembers,
            });
        }
        catch (error) {
            console.error('Failed to add team member:', error);
            throw error;
        }
    }
    /**
     * Removes a member from a team
     * @param teamId Team ID
     * @param memberId Member ID to remove
     * @returns Updated team state
     */
    removeTeamMember(teamId, memberId) {
        try {
            const currentState = this.states.get(teamId);
            if (!currentState) {
                throw new Error(`Team state not found for team ${teamId}`);
            }
            // Remove member
            const updatedMembers = currentState.members.filter(id => id !== memberId);
            return this.updateTeamState(teamId, 'system', {
                members: updatedMembers,
            });
        }
        catch (error) {
            console.error('Failed to remove team member:', error);
            throw error;
        }
    }
    /**
     * Gets team update history
     * @param teamId Team ID
     * @param limit Number of recent updates to retrieve
     * @returns Update history
     */
    getTeamUpdateHistory(teamId, limit) {
        try {
            const history = this.updateHistory.get(teamId) || [];
            if (limit) {
                return history.slice(-limit);
            }
            return history;
        }
        catch (error) {
            console.error('Failed to get team update history:', error);
            return [];
        }
    }
    /**
     * Gets team members
     * @param teamId Team ID
     * @returns List of team members
     */
    getTeamMembers(teamId) {
        try {
            const state = this.states.get(teamId);
            return state ? state.members : [];
        }
        catch (error) {
            console.error('Failed to get team members:', error);
            return [];
        }
    }
    /**
     * Checks if a user is a member of a team
     * @param teamId Team ID
     * @param userId User ID
     * @returns Whether user is a member
     */
    isTeamMember(teamId, userId) {
        try {
            const state = this.states.get(teamId);
            return state ? state.members.includes(userId) : false;
        }
        catch (error) {
            console.error('Failed to check team membership:', error);
            return false;
        }
    }
    /**
     * Updates shared context for a team
     * @param teamId Team ID
     * @param updaterId ID of the user making the update
     * @param context Context updates
     * @returns Updated team state
     */
    updateSharedContext(teamId, updaterId, context) {
        try {
            return this.updateTeamState(teamId, updaterId, {
                sharedContext: context,
            });
        }
        catch (error) {
            console.error('Failed to update shared context:', error);
            throw error;
        }
    }
    /**
     * Gets shared context for a team
     * @param teamId Team ID
     * @returns Shared context
     */
    getSharedContext(teamId) {
        try {
            const state = this.states.get(teamId);
            return state ? state.sharedContext : {};
        }
        catch (error) {
            console.error('Failed to get shared context:', error);
            return {};
        }
    }
    /**
     * Deletes a team state
     * @param teamId Team ID
     * @returns Deletion result
     */
    deleteTeamState(teamId) {
        try {
            const result = this.states.delete(teamId);
            this.updateHistory.delete(teamId);
            if (result) {
                this.emit('teamDeleted', teamId);
            }
            return result;
        }
        catch (error) {
            console.error('Failed to delete team state:', error);
            return false;
        }
    }
}
// Export singleton instance
export const teamStateManager = new TeamStateManager();
//# sourceMappingURL=team.state.js.map