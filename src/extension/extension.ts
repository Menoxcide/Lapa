// LAPA Swarm Extension Entry Point
// This file serves as the main entry point for the LAPA extension in LAPA IDE

import * as vscode from 'vscode';
import { LAPASwarmViewPane } from './ui/LAPASwarmViewPane';
import { getSwarmManager } from '@lapa/core/swarm/swarm-manager.js';
import { a2aMediator } from '@lapa/core/orchestrator/a2a-mediator.js';
import { featureGate } from '@lapa/core/premium/feature-gate.js';
import { generateCommitMessage } from '@lapa/core/orchestrator/git-commit-generator.js';
import { getPersonaLoader } from '@lapa/core/agents/filesystem-persona-loader.js';

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
	
	// Initialize persona loader and load all personas from filesystem
	initializePersonas(context);
	
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
	
	// Register view container and views following LAPA IDE patterns
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

	// Command Palette AI Command
	const commandPaletteAICommand = vscode.commands.registerCommand('lapa.commandPalette.ai', async () => {
		try {
			const { CommandPaletteAI } = await import('@lapa/core/orchestrator/command-palette-ai.js');
			const ai = new CommandPaletteAI();
			
			const query = await vscode.window.showInputBox({
				prompt: 'What would you like to do?',
				placeHolder: 'e.g., "How do I run tests?", "Save file", "Open terminal"',
			});

			if (!query) {
				return;
			}

			// Search for matching commands
			const context = {
				taskId: `palette-${Date.now()}`,
				agentId: 'command-palette-ai',
				parameters: {
					action: 'search',
					query,
					limit: 5
				}
			};

			const result = await ai.execute(context);
			
			if (!result.success || !result.data?.results || result.data.results.length === 0) {
				vscode.window.showInformationMessage(`No commands found for: "${query}"`);
				return;
			}

			// Show quick pick with results
			const items = result.data.results.map((r: any) => ({
				label: r.command.title,
				description: r.command.description || '',
				detail: `Relevance: ${(r.relevanceScore * 100).toFixed(0)}% - ${r.matchReasons.join(', ')}`,
				commandId: r.command.id
			}));

			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: `Found ${result.data.results.length} command(s) for "${query}"`
			});

			if (selected) {
				await vscode.commands.executeCommand(selected.commandId);
				vscode.window.showInformationMessage(`Executed: ${selected.label}`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Command Palette AI error: ${message}`);
		}
	});

	// Restore Swarm Session Command
	const restoreSessionCommand = vscode.commands.registerCommand('lapa.swarm.restore', async () => {
		try {
			// Import session restore manager
			const { SessionRestoreManager } = await import('@lapa/core/swarm/session-restore.js');
			const { SessionPersistenceManager } = await import('@lapa/core/swarm/session-persistence.js');
			const { MemoriEngine } = await import('@lapa/core/local/memori-engine.js');
			const { EpisodicMemory } = await import('@lapa/core/local/episodic.js');

			// Initialize managers (simplified - would need proper initialization)
			const memoriEngine = new MemoriEngine({});
			const episodicMemory = new EpisodicMemory({});
			const persistenceManager = new SessionPersistenceManager(
				{ enabled: true },
				memoriEngine,
				episodicMemory
			);
			const restoreManager = new SessionRestoreManager(persistenceManager, swarmManager);

			// List saved sessions
			const savedSessions = await persistenceManager.listSavedSessions();

			if (savedSessions.length === 0) {
				vscode.window.showInformationMessage('No saved sessions found to restore.');
				return;
			}

			// Show session picker
			const sessionItems = savedSessions.map(s => ({
				label: `Session: ${s.sessionId.substring(0, 8)}...`,
				description: `Last active: ${s.lastActivity.toLocaleString()}`,
				detail: `Status: ${s.status}`,
				sessionId: s.sessionId
			}));

			const selected = await vscode.window.showQuickPick(sessionItems, {
				placeHolder: 'Select a session to restore'
			});

			if (!selected) {
				return;
			}

			// Restore session
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Restoring session ${selected.sessionId.substring(0, 8)}...`,
				cancellable: false
			}, async () => {
				const result = await restoreManager.restoreSession(selected.sessionId);

				if (result.success && result.restored) {
					vscode.window.showInformationMessage(
						`Session restored: ${result.details?.participants} participants, ${result.details?.tasks} tasks`
					);
				} else {
					vscode.window.showErrorMessage(
						`Failed to restore session: ${result.error || 'Unknown error'}`
					);
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to restore session: ${message}`);
		}
	});

	// List Saved Sessions Command
	const listSessionsCommand = vscode.commands.registerCommand('lapa.swarm.listSessions', async () => {
		try {
			const { SessionPersistenceManager } = await import('@lapa/core/swarm/session-persistence.js');
			const { MemoriEngine } = await import('@lapa/core/local/memori-engine.js');
			const { EpisodicMemory } = await import('@lapa/core/local/episodic.js');

			const memoriEngine = new MemoriEngine({});
			const episodicMemory = new EpisodicMemory({});
			const persistenceManager = new SessionPersistenceManager(
				{ enabled: true },
				memoriEngine,
				episodicMemory
			);

			const sessions = await persistenceManager.listSavedSessions();

			if (sessions.length === 0) {
				vscode.window.showInformationMessage('No saved sessions found.');
				return;
			}

			const message = `Found ${sessions.length} saved session(s). Use "LAPA: Restore Session" to restore one.`;
			vscode.window.showInformationMessage(message);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to list sessions: ${message}`);
		}
	});

	// Generate Git Commit Message Command
	const generateCommitCommand = vscode.commands.registerCommand('lapa.git.generateCommit', async () => {
		try {
			// Show progress
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Generating commit message...',
				cancellable: false
			}, async () => {
				// Get format preference
				const format = await vscode.window.showQuickPick(
					[
						{ label: 'Conventional Commits', value: 'conventional' },
						{ label: 'Descriptive', value: 'descriptive' },
						{ label: 'Detailed', value: 'detailed' }
					],
					{ placeHolder: 'Select commit message format' }
				);

				if (!format) {
					return;
				}

				// Generate commit message
				const result = await generateCommitMessage({
					format: format.value as any,
					includeBody: format.value === 'detailed',
					useConventionalCommits: format.value === 'conventional'
				});

				// Show commit message in input box for editing
				const editedMessage = await vscode.window.showInputBox({
					prompt: 'Review and edit the generated commit message',
					value: result.fullMessage,
					ignoreFocusOut: true
				});

				if (editedMessage) {
					// Copy to clipboard
					await vscode.env.clipboard.writeText(editedMessage);
					
					// Show option to commit
					const action = await vscode.window.showInformationMessage(
						`Commit message generated (${(result.confidence * 100).toFixed(0)}% confidence). Copied to clipboard.`,
						'Commit Now',
						'Copy Only'
					);

					if (action === 'Commit Now') {
						// Execute git commit
						const terminal = vscode.window.createTerminal('Git Commit');
						terminal.sendText(`git commit -m "${editedMessage.replace(/"/g, '\\"')}"`);
						terminal.show();
					}
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to generate commit message: ${message}`);
		}
	});

	// Persona Management Commands
	const listPersonasCommand = vscode.commands.registerCommand('lapa.personas.list', async () => {
		try {
			const personaLoader = getPersonaLoader();
			const personas = personaLoader.getAllPersonas();
			
			if (personas.length === 0) {
				vscode.window.showInformationMessage('No personas loaded. Use "LAPA: Reload Personas" to load from filesystem.');
				return;
			}

			const items = personas.map(p => ({
				label: p.personaName,
				description: `ID: ${p.personaId}`,
				detail: `Version: ${p.metadata.version || 'N/A'} | Status: ${p.metadata.status || 'N/A'}`,
				personaId: p.personaId
			}));

			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: `Found ${personas.length} loaded personas`
			});

			if (selected) {
				const persona = personaLoader.getParsedPersona(selected.personaId);
				if (persona) {
					const filePath = personaLoader.getPersonaFilePath(selected.personaId);
					if (filePath) {
						const doc = await vscode.workspace.openTextDocument(filePath);
						await vscode.window.showTextDocument(doc);
					}
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to list personas: ${message}`);
		}
	});

	const reloadPersonasCommand = vscode.commands.registerCommand('lapa.personas.reload', async () => {
		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Reloading personas from filesystem...',
				cancellable: false
			}, async () => {
				const personaLoader = getPersonaLoader();
				const loadedCount = await personaLoader.loadAllPersonas();
				
				if (loadedCount > 0) {
					vscode.window.showInformationMessage(`✅ Reloaded ${loadedCount} personas from filesystem`);
				} else {
					vscode.window.showWarningMessage('⚠️ No personas found. Ensure docs/personas/ directory exists.');
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to reload personas: ${message}`);
		}
	});

	// Workflow Commands
	const generateWorkflowCommand = vscode.commands.registerCommand('lapa.workflow.generate', async () => {
		try {
			const taskDescription = await vscode.window.showInputBox({
				prompt: 'Describe the task for workflow generation',
				placeHolder: 'e.g., "Implement user authentication feature"',
			});

			if (!taskDescription) {
				return;
			}

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Generating workflow...',
				cancellable: false
			}, async () => {
				// Import workflow generator dynamically
				const { workflowGenerator } = await import('@lapa/core/orchestrator/workflow-generator.js');
				const workflow = await workflowGenerator.generateWorkflow(taskDescription);

				// Show workflow details
				const workflowDetails = [
					`**Workflow:** ${workflow.name}`,
					`**Agents:** ${workflow.agentSequence.join(' → ')}`,
					`**Sequence:** ${workflow.sequence}`,
					`**Confidence:** ${(workflow.confidence * 100).toFixed(0)}%`,
					`**Estimated Duration:** ${(workflow.estimatedDuration / 1000).toFixed(1)}s`,
					`**Reasoning:** ${workflow.reasoning}`
				].join('\n');

				const action = await vscode.window.showInformationMessage(
					`Workflow generated: ${workflow.name}`,
					'Execute Workflow',
					'View Details'
				);

				if (action === 'Execute Workflow') {
					// Execute workflow via swarm manager
					await vscode.commands.executeCommand('lapa.swarm.start', {
						goal: taskDescription,
						workflow: workflow
					});
				} else if (action === 'View Details') {
					const doc = await vscode.workspace.openTextDocument({
						content: workflowDetails,
						language: 'markdown'
					});
					await vscode.window.showTextDocument(doc);
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to generate workflow: ${message}`);
		}
	});

	// Upgrade Command (if not already defined)
	const upgradeCommand = vscode.commands.registerCommand('lapa.swarm.upgrade', async () => {
		vscode.window.showInformationMessage('Upgrade to LAPA Swarm Pro for advanced features!', 'Learn More')
			.then(selection => {
				if (selection === 'Learn More') {
					vscode.env.openExternal(vscode.Uri.parse('https://github.com/Menoxcide/Lapa#premium-features'));
				}
			});
	});

	// Activate License Command (if not already defined)
	const activateLicenseCommand = vscode.commands.registerCommand('lapa.swarm.activateLicense', async () => {
		const licenseKey = await vscode.window.showInputBox({
			prompt: 'Enter your LAPA Swarm Pro license key',
			placeHolder: 'XXXX-XXXX-XXXX-XXXX',
			password: false
		});

		if (licenseKey) {
			// License activation logic would go here
			vscode.window.showInformationMessage('License activation feature coming soon!');
		}
	});

	// Enhance Prompt Command
	const enhancePromptCommand = vscode.commands.registerCommand('lapa.enhancePrompt', async (prompt: string) => {
		try {
			const { promptEngineer } = await import('@lapa/core/orchestrator/prompt-engineer.js');
			
			// Ensure PromptEngineer is started
			await promptEngineer.start();

			// Refine the prompt
			const result = await promptEngineer.refinePrompt({
				originalPrompt: prompt,
				taskType: 'other'
			});

			if (result.success && result.refinedPrompt) {
				return {
					success: true,
					refinedPrompt: result.refinedPrompt,
					structuredPlan: result.structuredPlan,
					confidence: result.confidence
				};
			} else if (result.clarificationQuestions && result.clarificationQuestions.length > 0) {
				return {
					success: true,
					clarificationQuestions: result.clarificationQuestions,
					confidence: result.confidence
				};
			} else {
				throw new Error(result.error || 'Failed to enhance prompt');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[lapa.enhancePrompt] Error:', error);
			return {
				success: false,
				error: message
			};
		}
	});

	// Switch Provider Command
	const switchProviderCommand = vscode.commands.registerCommand('lapa.switchProvider', async (provider: 'ollama' | 'nim' | 'cloud') => {
		try {
			const { getInferenceManager } = await import('@lapa/core/inference/manager.js');
			
			// Get or create inference manager instance (singleton pattern)
			// For cloud, we'll map it to 'auto' or handle separately
			const backend = provider === 'cloud' ? 'auto' : provider;
			
			// Get the singleton instance
			const manager = getInferenceManager({
				defaultBackend: backend as any,
				perfMode: 5,
				enableThermalGuard: true,
				maxCpuTemp: 85,
				maxGpuTemp: 90,
				enableAutoFallback: true,
				healthCheckInterval: 5000,
				enableLivePreview: false,
				alertThresholds: {
					cpuTempWarning: 70,
					cpuTempCritical: 85,
					gpuTempWarning: 75,
					gpuTempCritical: 90,
					cpuUsageWarning: 80,
					memoryUsageWarning: 85,
					vramUsageWarning: 90,
					vramUsageCritical: 95
				}
			});

			// Ensure initialized
			if (!manager.isInitialized()) {
				await manager.initialize();
			}

			// Switch backend
			await manager.switchBackend(backend as any);

			// Save provider preference to settings
			const config = vscode.workspace.getConfiguration('lapa');
			await config.update('inference.provider', provider, vscode.ConfigurationTarget.Global);

			vscode.window.showInformationMessage(`Switched inference provider to: ${provider}`);
			
			return {
				success: true,
				provider: provider
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[lapa.switchProvider] Error:', error);
			vscode.window.showErrorMessage(`Failed to switch provider: ${message}`);
			return {
				success: false,
				error: message
			};
		}
	});

	// Open Settings Panel Command
	const openSettingsCommand = vscode.commands.registerCommand('lapa.settings.open', async () => {
		try {
			// Create and show settings webview panel
			const panel = vscode.window.createWebviewPanel(
				'lapaSettings',
				'LAPA Settings',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [context.extensionUri]
				}
			);

			// Import SettingsPanel component
			const { SettingsPanel } = await import('./ui/SettingsPanel.tsx');
			
			// Get webview HTML for SettingsPanel
			const scriptUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
			);
			const styleResetUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
			);
			const styleVSCodeUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
			);
			const styleMainUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css')
			);

			const nonce = getNonce();
			panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					<title>LAPA Settings</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;

			// Handle messages from webview
			panel.webview.onDidReceiveMessage(async message => {
				if (message.command === 'updateConfig') {
					const config = vscode.workspace.getConfiguration('lapa');
					await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open settings: ${message}`);
		}
	});

	// Open MCP Marketplace Command
	const openMarketplaceCommand = vscode.commands.registerCommand('lapa.marketplace.open', async () => {
		try {
			const panel = vscode.window.createWebviewPanel(
				'lapaMarketplace',
				'LAPA MCP Marketplace',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [context.extensionUri]
				}
			);

			const scriptUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
			);
			const styleResetUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
			);
			const styleVSCodeUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
			);
			const styleMainUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css')
			);

			const nonce = getNonce();
			panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					<title>LAPA MCP Marketplace</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;

			panel.webview.onDidReceiveMessage(async message => {
				if (message.command === 'installSkill') {
					// Handle skill installation
					vscode.window.showInformationMessage(`Installing skill: ${message.skillId}`);
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open marketplace: ${message}`);
		}
	});

	// Open Dashboard Command
	const openDashboardCommand = vscode.commands.registerCommand('lapa.dashboard.open', async () => {
		try {
			const panel = vscode.window.createWebviewPanel(
				'lapaDashboard',
				'LAPA Dashboard',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [context.extensionUri]
				}
			);

			const scriptUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
			);
			const styleResetUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
			);
			const styleVSCodeUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
			);
			const styleMainUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css')
			);

			const nonce = getNonce();
			panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					<title>LAPA Dashboard</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}">
						// Set panel type before loading main script
						window.__LAPA_PANEL_TYPE__ = 'dashboard';
					</script>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open dashboard: ${message}`);
		}
	});

	// Open ROI Widget Command
	const openROICommand = vscode.commands.registerCommand('lapa.roi.open', async () => {
		try {
			const panel = vscode.window.createWebviewPanel(
				'lapaROI',
				'LAPA ROI Widget',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [context.extensionUri]
				}
			);

			const scriptUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
			);
			const styleResetUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
			);
			const styleVSCodeUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
			);
			const styleMainUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css')
			);

			const nonce = getNonce();
			panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					<title>LAPA ROI Widget</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}">
						window.__LAPA_PANEL_TYPE__ = 'roi';
					</script>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open ROI widget: ${message}`);
		}
	});

	// Open Task History Command
	const openTaskHistoryCommand = vscode.commands.registerCommand('lapa.taskHistory.open', async () => {
		try {
			const panel = vscode.window.createWebviewPanel(
				'lapaTaskHistory',
				'LAPA Task History',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [context.extensionUri]
				}
			);

			const scriptUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
			);
			const styleResetUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
			);
			const styleVSCodeUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
			);
			const styleMainUri = panel.webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css')
			);

			const nonce = getNonce();
			panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					<title>LAPA Task History</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}">
						window.__LAPA_PANEL_TYPE__ = 'taskHistory';
					</script>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open task history: ${message}`);
		}
	});

	// Helper function for nonce generation
	function getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	context.subscriptions.push(
		startSwarmCommand,
		stopSwarmCommand,
		pauseSwarmCommand,
		commandPaletteAICommand,
		resumeSwarmCommand,
		configureSwarmCommand,
		statusSwarmCommand,
		restoreSessionCommand,
		listSessionsCommand,
		generateCommitCommand,
		upgradeCommand,
		activateLicenseCommand,
		listPersonasCommand,
		reloadPersonasCommand,
		generateWorkflowCommand,
		enhancePromptCommand,
		switchProviderCommand,
		openSettingsCommand,
		openMarketplaceCommand,
		openDashboardCommand,
		openROICommand,
		openTaskHistoryCommand
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

// Initialize persona system
async function initializePersonas(context: vscode.ExtensionContext) {
	try {
		const personaLoader = getPersonaLoader();
		const loadedCount = await personaLoader.initialize();
		
		if (loadedCount > 0) {
			console.log(`✅ Loaded ${loadedCount} agent personas from filesystem`);
			vscode.window.showInformationMessage(
				`LAPA: Loaded ${loadedCount} agent personas`,
				{ modal: false }
			);
		} else {
			console.warn('⚠️ No personas loaded from filesystem. Ensure docs/personas/ directory exists.');
		}
	} catch (error) {
		console.error('Failed to initialize personas:', error);
		vscode.window.showErrorMessage(
			`Failed to load personas: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

export function deactivate() {
	console.log('LAPA Swarm extension is now deactivated!');
}