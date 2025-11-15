/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/**
 * LAPA Command Integration Helper
 * 
 * Provides helper functions to execute LAPA extension commands from IDE UI.
 * This ensures all LAPA commands are accessible from the IDE integration.
 */

import { ICommandService } from '../../../../../../platform/commands/common/commands.js';

/**
 * LAPA Command IDs - All available commands
 */
export const LAPA_COMMANDS = {
	// Swarm Control (Tier 1 - Critical)
	SWARM_START: 'lapa.swarm.start',
	SWARM_STOP: 'lapa.swarm.stop',
	SWARM_PAUSE: 'lapa.swarm.pause',
	SWARM_RESUME: 'lapa.swarm.resume',
	SWARM_STATUS: 'lapa.swarm.status',
	SWARM_CONFIGURE: 'lapa.swarm.configure',
	
	// Session Management (Tier 2-3)
	SWARM_RESTORE: 'lapa.swarm.restore',
	SWARM_LIST_SESSIONS: 'lapa.swarm.listSessions',
	
	// Git Integration (Tier 2)
	GIT_GENERATE_COMMIT: 'lapa.git.generateCommit',
	
	// Persona Management (Tier 3)
	PERSONAS_LIST: 'lapa.personas.list',
	PERSONAS_RELOAD: 'lapa.personas.reload',
	
	// Workflow (Tier 3)
	WORKFLOW_GENERATE: 'lapa.workflow.generate',
	
	// Prompt Enhancement (Tier 2)
	ENHANCE_PROMPT: 'lapa.enhancePrompt',
	
	// UI Navigation (Tier 2-4)
	SETTINGS_OPEN: 'lapa.settings.open',
	DASHBOARD_OPEN: 'lapa.dashboard.open',
	MARKETPLACE_OPEN: 'lapa.marketplace.open',
	ROI_OPEN: 'lapa.roi.open',
	TASK_HISTORY_OPEN: 'lapa.taskHistory.open',
	
	// Command Palette (Tier 4)
	COMMAND_PALETTE_AI: 'lapa.commandPalette.ai',
	
	// Premium (Tier 5)
	SWARM_UPGRADE: 'lapa.swarm.upgrade',
	SWARM_ACTIVATE_LICENSE: 'lapa.swarm.activateLicense',
	
	// Provider (Already integrated)
	SWITCH_PROVIDER: 'lapa.switchProvider',
} as const;

/**
 * Execute a LAPA command
 */
export async function executeLAPACommand(
	commandService: ICommandService,
	commandId: string,
	...args: any[]
): Promise<any> {
	try {
		return await commandService.executeCommand(commandId, ...args);
	} catch (error) {
		console.error(`[LAPA] Failed to execute command ${commandId}:`, error);
		throw error;
	}
}

/**
 * Swarm Control Commands (Tier 1)
 */
export const LAPASwarmCommands = {
	/**
	 * Start a new swarm
	 */
	async start(commandService: ICommandService, goal?: string): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_START, goal);
	},
	
	/**
	 * Stop the active swarm
	 */
	async stop(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_STOP);
	},
	
	/**
	 * Pause the active swarm
	 */
	async pause(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_PAUSE);
	},
	
	/**
	 * Resume a paused swarm
	 */
	async resume(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_RESUME);
	},
	
	/**
	 * Get swarm status
	 */
	async status(commandService: ICommandService): Promise<any> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_STATUS);
	},
	
	/**
	 * Configure swarm settings
	 */
	async configure(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_CONFIGURE);
	},
};

/**
 * Session Management Commands (Tier 2-3)
 */
export const LAPASessionCommands = {
	/**
	 * Restore a previous session
	 */
	async restore(commandService: ICommandService, sessionId?: string): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_RESTORE, sessionId);
	},
	
	/**
	 * List all saved sessions
	 */
	async listSessions(commandService: ICommandService): Promise<any[]> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_LIST_SESSIONS);
	},
};

/**
 * Git Integration Commands (Tier 2)
 */
export const LAPAGitCommands = {
	/**
	 * Generate a git commit message
	 */
	async generateCommit(commandService: ICommandService): Promise<string> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.GIT_GENERATE_COMMIT);
	},
};

/**
 * Persona Management Commands (Tier 3)
 */
export const LAPAPersonaCommands = {
	/**
	 * List all available personas
	 */
	async list(commandService: ICommandService): Promise<any[]> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.PERSONAS_LIST);
	},
	
	/**
	 * Reload personas from filesystem
	 */
	async reload(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.PERSONAS_RELOAD);
	},
};

/**
 * Workflow Commands (Tier 3)
 */
export const LAPAWorkflowCommands = {
	/**
	 * Generate a workflow
	 */
	async generate(commandService: ICommandService, description?: string): Promise<any> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.WORKFLOW_GENERATE, description);
	},
};

/**
 * Prompt Enhancement Commands (Tier 2)
 */
export const LAPAPromptCommands = {
	/**
	 * Enhance a prompt
	 */
	async enhance(commandService: ICommandService, prompt: string): Promise<string> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.ENHANCE_PROMPT, prompt);
	},
};

/**
 * UI Navigation Commands (Tier 2-4)
 */
export const LAPAUINavigationCommands = {
	/**
	 * Open LAPA settings
	 */
	async openSettings(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SETTINGS_OPEN);
	},
	
	/**
	 * Open LAPA dashboard
	 */
	async openDashboard(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.DASHBOARD_OPEN);
	},
	
	/**
	 * Open MCP marketplace
	 */
	async openMarketplace(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.MARKETPLACE_OPEN);
	},
	
	/**
	 * Open ROI widget
	 */
	async openROI(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.ROI_OPEN);
	},
	
	/**
	 * Open task history
	 */
	async openTaskHistory(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.TASK_HISTORY_OPEN);
	},
};

/**
 * Premium Commands (Tier 5)
 */
export const LAPAPremiumCommands = {
	/**
	 * Upgrade to Pro
	 */
	async upgrade(commandService: ICommandService): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_UPGRADE);
	},
	
	/**
	 * Activate license
	 */
	async activateLicense(commandService: ICommandService, licenseKey: string): Promise<void> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.SWARM_ACTIVATE_LICENSE, licenseKey);
	},
};

/**
 * Command Palette Commands (Tier 4)
 */
export const LAPACommandPaletteCommands = {
	/**
	 * Open AI command search
	 */
	async ai(commandService: ICommandService, query?: string): Promise<any> {
		return executeLAPACommand(commandService, LAPA_COMMANDS.COMMAND_PALETTE_AI, query);
	},
};

