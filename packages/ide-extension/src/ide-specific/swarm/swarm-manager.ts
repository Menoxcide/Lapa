/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { SwarmDelegate } from './delegate.ts';
import { eventBus, LAPAEventBus } from '../core/event-bus.ts';
import { rooModeController } from '../modes/modes.ts';
import { featureGate } from '../premium/feature-gate.ts';

export interface SwarmState {
	id: string;
	agents: number;
	status: 'idle' | 'running' | 'paused';
	progress: number;
}

export interface SwarmConfig {
	goal: string;
	maxAgents?: number; // Optional, will be capped by feature gate
	perfMode: number; // 1-10
}

/**
 * Swarm Manager for LAPA-Void Integration
 * Handles start/stop/pause/resume operations for the swarm
 */
export class SwarmManager {
	private delegate: SwarmDelegate;
	private currentState: SwarmState | null = null;
	private eventBus: LAPAEventBus;

	constructor() {
		this.eventBus = eventBus;
		this.delegate = new SwarmDelegate(
			{
				enableLocalInference: true,
				latencyTargetMs: 1000,
				maxConcurrentDelegations: 10,
				enableConsensusVoting: true,
				enableAutoGenCore: true,
				enableRooModeIntegration: true,
				enableFastPath: true,
			},
			this.eventBus,
			rooModeController
		);
	}

	/**
	 * Start a new swarm session
	 */
	async start(config: SwarmConfig): Promise<SwarmState> {
		// Apply feature gate limits
		const maxAgentsAllowed = featureGate.getMaxAgents();
		const requestedMaxAgents = config.maxAgents || maxAgentsAllowed;
		const actualMaxAgents = Math.min(requestedMaxAgents, maxAgentsAllowed);
		
		// Warn if user requested more than free tier allows
		if (requestedMaxAgents > maxAgentsAllowed && !featureGate.hasPremiumLicense()) {
			console.warn(
				`[SwarmManager] Requested ${requestedMaxAgents} agents, but free tier allows ${maxAgentsAllowed}. ` +
				`Upgrade to Pro for full 16-agent Helix.`
			);
		}

		const state: SwarmState = {
			id: `swarm-${Date.now()}`,
			agents: 0,
			status: 'running',
			progress: 0,
		};

		this.currentState = state;

		// Publish start event with actual maxAgents
		this.eventBus.publish({
			id: `swarm-start-${state.id}`,
			type: 'SWARM_START',
			timestamp: Date.now(),
			source: 'swarm-manager',
			payload: {
				...config,
				maxAgents: actualMaxAgents,
			},
		});

		console.log(`Swarm ${state.id} started: ${config.goal} (max agents: ${actualMaxAgents})`);
		return state;
	}

	/**
	 * Stop the current swarm session
	 */
	async stop(id?: string): Promise<void> {
		const swarmId = id || this.currentState?.id;
		if (!swarmId) {
			throw new Error('No swarm to stop');
		}

		const state = this.currentState;
		if (state) {
			// Publish stop event
			this.eventBus.publish({
				id: `swarm-stop-${swarmId}`,
				type: 'SWARM_STOP',
				timestamp: Date.now(),
				source: 'swarm-manager',
				payload: { id: swarmId },
			});

			this.currentState = {
				...state,
				status: 'idle',
				agents: 0,
				progress: 0,
			};
		}

		console.log(`Swarm ${swarmId} stopped.`);
	}

	/**
	 * Pause the current swarm session
	 */
	async pause(id?: string, reason?: string): Promise<SwarmState> {
		const swarmId = id || this.currentState?.id;
		if (!swarmId || !this.currentState) {
			throw new Error('No swarm to pause');
		}

		if (this.currentState.status !== 'running') {
			throw new Error(`Swarm is not running (current status: ${this.currentState.status})`);
		}

		// Publish pause event
		this.eventBus.publish({
			id: `swarm-pause-${swarmId}`,
			type: 'SWARM_PAUSE',
			timestamp: Date.now(),
			source: 'swarm-manager',
			payload: { id: swarmId, reason },
		});

		this.currentState = {
			...this.currentState,
			status: 'paused',
		};

		console.log(`Swarm ${swarmId} paused${reason ? `: ${reason}` : ''}`);
		return this.currentState;
	}

	/**
	 * Resume a paused swarm session
	 */
	async resume(id?: string): Promise<SwarmState> {
		const swarmId = id || this.currentState?.id;
		if (!swarmId || !this.currentState) {
			throw new Error('No swarm to resume');
		}

		if (this.currentState.status !== 'paused') {
			throw new Error(`Swarm is not paused (current status: ${this.currentState.status})`);
		}

		// Publish resume event
		this.eventBus.publish({
			id: `swarm-resume-${swarmId}`,
			type: 'SWARM_RESUME',
			timestamp: Date.now(),
			source: 'swarm-manager',
			payload: { id: swarmId },
		});

		this.currentState = {
			...this.currentState,
			status: 'running',
		};

		console.log(`Swarm ${swarmId} resumed.`);
		return this.currentState;
	}

	/**
	 * Get current swarm status
	 */
	getStatus(): SwarmState | null {
		return this.currentState;
	}

	/**
	 * Get the SwarmDelegate instance
	 */
	getDelegate(): SwarmDelegate {
		return this.delegate;
	}
}

// Singleton instance
let swarmManagerInstance: SwarmManager | null = null;

export function getSwarmManager(): SwarmManager {
	if (!swarmManagerInstance) {
		swarmManagerInstance = new SwarmManager();
	}
	return swarmManagerInstance;
}

