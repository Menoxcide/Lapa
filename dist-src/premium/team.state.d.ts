/**
 * Team State Synchronization for LAPA Premium
 *
 * This module provides real-time state synchronization across team members
 * for collaborative work in LAPA Core.
 */
import { EventEmitter } from 'events';
/**
 * Team state data structure
 */
export interface TeamState {
    teamId: string;
    members: string[];
    sharedContext: Record<string, any>;
    lastUpdated: Date;
    version: number;
}
/**
 * Team state update event
 */
export interface TeamStateUpdate {
    teamId: string;
    updaterId: string;
    changes: Partial<TeamState>;
    timestamp: Date;
}
/**
 * Team State Manager class
 */
export declare class TeamStateManager extends EventEmitter {
    private states;
    private updateHistory;
    private maxHistoryPerTeam;
    constructor(maxHistoryPerTeam?: number);
    /**
     * Creates a new team state
     * @param teamId Team ID
     * @param members Initial team members
     * @returns Created team state
     */
    createTeamState(teamId: string, members?: string[]): TeamState;
    /**
     * Gets team state
     * @param teamId Team ID
     * @returns Team state
     */
    getTeamState(teamId: string): TeamState | undefined;
    /**
     * Updates team state
     * @param teamId Team ID
     * @param updaterId ID of the user making the update
     * @param changes Changes to apply
     * @returns Updated team state
     */
    updateTeamState(teamId: string, updaterId: string, changes: Partial<TeamState>): TeamState;
    /**
     * Adds a member to a team
     * @param teamId Team ID
     * @param memberId Member ID to add
     * @returns Updated team state
     */
    addTeamMember(teamId: string, memberId: string): TeamState;
    /**
     * Removes a member from a team
     * @param teamId Team ID
     * @param memberId Member ID to remove
     * @returns Updated team state
     */
    removeTeamMember(teamId: string, memberId: string): TeamState;
    /**
     * Gets team update history
     * @param teamId Team ID
     * @param limit Number of recent updates to retrieve
     * @returns Update history
     */
    getTeamUpdateHistory(teamId: string, limit?: number): TeamStateUpdate[];
    /**
     * Gets team members
     * @param teamId Team ID
     * @returns List of team members
     */
    getTeamMembers(teamId: string): string[];
    /**
     * Checks if a user is a member of a team
     * @param teamId Team ID
     * @param userId User ID
     * @returns Whether user is a member
     */
    isTeamMember(teamId: string, userId: string): boolean;
    /**
     * Updates shared context for a team
     * @param teamId Team ID
     * @param updaterId ID of the user making the update
     * @param context Context updates
     * @returns Updated team state
     */
    updateSharedContext(teamId: string, updaterId: string, context: Record<string, any>): TeamState;
    /**
     * Gets shared context for a team
     * @param teamId Team ID
     * @returns Shared context
     */
    getSharedContext(teamId: string): Record<string, any>;
    /**
     * Deletes a team state
     * @param teamId Team ID
     * @returns Deletion result
     */
    deleteTeamState(teamId: string): boolean;
}
export declare const teamStateManager: TeamStateManager;
