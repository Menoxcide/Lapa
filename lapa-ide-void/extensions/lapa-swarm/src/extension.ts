// LAPA Swarm Extension Entry Point
// This file serves as the main entry point for the LAPA extension in VoidChassis

import * as vscode from 'vscode';
import { LAPASwarmViewPane } from './ui/LAPASwarmViewPane';
import { getSwarmManager } from './swarm/swarm-manager.ts';
import { a2aMediator } from './orchestrator/a2a-mediator.ts';
import { featureGate } from './premium/feature-gate.ts';

export function activate(context: vscode.ExtensionContext) {
	console.log('LAPA Swarm extension is now active!');
	
	// Initialize feature gate (loads license if available)
	// This ensures license validation happens on activation
	const licenseInfo = featureGate.getLicenseInfo();
	if (licenseInfo.hasLicense) {
		console.log(`[LAPA] License active: ${licenseInfo.features.length} features enabled`);
	} else {
		console.log('[LAPA] Free tier active - upgrade to Pro for full features');
	}
	
	// Initialize swarm manager
	const swarmManager = getSwarmManager();
	
	// Register view providers
	const viewProvider = vscode.window.registerWebviewViewProvider(
		'lapaSwarmView',
		new LAPASwarmViewPane(context.extensionUri),
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}
	);
	
	// Register auxiliary view provider
	const auxiliaryViewProvider = vscode.window.registerWebviewViewProvider(
		'lapaSwarmAuxiliaryView',
		new LAPASwarmViewPane(context.extensionUri),
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}
	);
	
	context.subscriptions.push(viewProvider, auxiliaryViewProvider);
	
	// Register view container and views following Void patterns
	registerViewContainer(context);
	
	// Register commands
	registerCommands(context, swarmManager);
	
	// Register MCP configuration provider
	registerMcpProvider(context);
	
	// Initialize A2A mediator
	initializeA2AMediator(context);
}

function registerViewContainer(context: vscode.ExtensionContext) {
	// Register the custom view container for LAPA Swarm in the auxiliary bar
	// This follows Void's pattern for registering view containers
	
	// The registration happens through package.json contributions
	// We just need to ensure our view provider is properly registered
	console.log('Registering LAPA Swarm view container...');
}

// Register commands using standard VS Code approach
function registerCommands(context: vscode.ExtensionContext, swarmManager: ReturnType<typeof getSwarmManager>) {
	// Start Swarm Command
	const startSwarmCommand = vscode.commands.registerCommand('lapa.swarm.start', async () => {
		try {
			const goal = await vscode.window.showInputBox({
				prompt: 'What should the swarm accomplish?',
				placeHolder: 'Enter swarm goal...',
			});

			if (!goal) {
				return;
			}

			// Get max agents from feature gate (free: 4, pro: 16)
			const maxAgents = featureGate.getMaxAgents();
			
			const config = {
				goal,
				maxAgents, // Will be capped by swarm manager if needed
				perfMode: 5,
			};

			const state = await swarmManager.start(config);
			vscode.window.showInformationMessage(`Swarm ${state.id} launched: ${goal}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to start swarm: ${message}`);
		}
	});

	// Stop Swarm Command
	const stopSwarmCommand = vscode.commands.registerCommand('lapa.swarm.stop', async () => {
		try {
			const state = swarmManager.getStatus();
			if (!state || state.status === 'idle') {
				vscode.window.showWarningMessage('No active swarm to stop.');
				return;
			}

			await swarmManager.stop();
			vscode.window.showInformationMessage('Swarm stopped successfully.');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to stop swarm: ${message}`);
		}
	});

	// Pause Swarm Command
	const pauseSwarmCommand = vscode.commands.registerCommand('lapa.swarm.pause', async () => {
		try {
			const state = swarmManager.getStatus();
			if (!state || state.status !== 'running') {
				vscode.window.showWarningMessage('No running swarm to pause.');
				return;
			}

			await swarmManager.pause();
			vscode.window.showInformationMessage('Swarm paused.');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to pause swarm: ${message}`);
		}
	});

	// Resume Swarm Command (using pause command with toggle logic)
	const resumeSwarmCommand = vscode.commands.registerCommand('lapa.swarm.resume', async () => {
		try {
			const state = swarmManager.getStatus();
			if (!state || state.status !== 'paused') {
				vscode.window.showWarningMessage('No paused swarm to resume.');
				return;
			}

			await swarmManager.resume();
			vscode.window.showInformationMessage('Swarm resumed.');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to resume swarm: ${message}`);
		}
	});

	// Configure Swarm Command
	const configureSwarmCommand = vscode.commands.registerCommand('lapa.swarm.configure', async () => {
		// Open settings with focus on LAPA Swarm configuration
		await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lapa.lapa-brain');
		vscode.window.showInformationMessage('Opening LAPA Swarm Configuration...');
	});

	// Show Swarm Status Command
	const statusSwarmCommand = vscode.commands.registerCommand('lapa.swarm.status', async () => {
		const state = swarmManager.getStatus();
		if (!state) {
			vscode.window.showInformationMessage('LAPA Swarm Status: Idle (no active swarm)');
		} else {
			vscode.window.showInformationMessage(
				`LAPA Swarm Status: ${state.status.toUpperCase()} | Agents: ${state.agents} | Progress: ${state.progress}% | ID: ${state.id}`
			);
		}
	});

	context.subscriptions.push(
		startSwarmCommand,
		stopSwarmCommand,
		pauseSwarmCommand,
		resumeSwarmCommand,
		configureSwarmCommand,
		statusSwarmCommand,
		upgradeCommand,
		activateLicenseCommand
	);
}

// Register MCP configuration provider
function registerMcpProvider(context: vscode.ExtensionContext) {
	// Register in-process MCP server provider
	if (vscode.lm && typeof vscode.lm.registerMcpConfigurationProvider === 'function') {
		const provider: vscode.McpConfigurationProvider = {
			provideMcpServerDefinitions: async () => {
				return [
					{
						id: 'lapa-swarm-mcp',
						name: 'LAPA Swarm MCP',
						description: 'LAPA Swarm tools via Model Context Protocol',
						transport: 'in-memory' as any, // Void pattern: in-memory transport
						tools: [
							{
								name: 'start-swarm',
								description: 'Start a new swarm session',
								parameters: {
									type: 'object',
									properties: {
										goal: { type: 'string', description: 'Swarm goal' },
										maxAgents: { type: 'number', description: 'Maximum agents' },
									},
								},
							},
							{
								name: 'stop-swarm',
								description: 'Stop the current swarm session',
								parameters: {
									type: 'object',
									properties: {
										id: { type: 'string', description: 'Swarm ID (optional)' },
									},
								},
							},
						],
					},
				];
			},
		};

		try {
			const registration = vscode.lm.registerMcpConfigurationProvider('lapa-swarm', provider);
			context.subscriptions.push(registration);
			console.log('MCP configuration provider registered');
		} catch (error) {
			console.warn('Failed to register MCP provider:', error);
			// MCP registration might not be available in all VS Code versions
		}
	}
}

// Initialize A2A mediator
function initializeA2AMediator(context: vscode.ExtensionContext) {
	try {
		// A2A mediator is already a singleton, just ensure it's initialized
		if (a2aMediator) {
			console.log('A2A mediator initialized');
		}
	} catch (error) {
		console.warn('Failed to initialize A2A mediator:', error);
	}
}

export function deactivate() {
	console.log('LAPA Swarm extension is now deactivated!');
}