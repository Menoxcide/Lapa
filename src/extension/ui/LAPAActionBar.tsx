/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as React from 'react';

interface LAPAActionBarProps {
	// Add props as needed for the action bar
	onStartSwarm?: () => void;
	onStopSwarm?: () => void;
	onPauseSwarm?: () => void;
}

export const LAPAActionBar: React.FC<LAPAActionBarProps> = (props) => {
	const [isSwarmRunning, setIsSwarmRunning] = React.useState(false);
	const [isSwarmPaused, setIsSwarmPaused] = React.useState(false);

	const handleStartSwarm = () => {
		setIsSwarmRunning(true);
		props.onStartSwarm?.();
	};

	const handleStopSwarm = () => {
		setIsSwarmRunning(false);
		setIsSwarmPaused(false);
		props.onStopSwarm?.();
	};

	const handlePauseSwarm = () => {
		setIsSwarmPaused(!isSwarmPaused);
		props.onPauseSwarm?.();
	};

	return (
		<div className="lapa-action-bar flex items-center gap-2 p-2 bg-vscode-sideBar-background border-b border-vscode-sideBar-border">
			<button 
				className={`px-3 py-1 rounded text-sm ${
					isSwarmRunning 
						? 'bg-vscode-button-secondaryBackground text-vscode-button-secondaryForeground hover:bg-vscode-button-secondaryHoverBackground' 
						: 'bg-vscode-button-background text-vscode-button-foreground hover:bg-vscode-button-hoverBackground'
				}`}
				onClick={handleStartSwarm}
				disabled={isSwarmRunning && !isSwarmPaused}
			>
				{isSwarmRunning && !isSwarmPaused ? 'Running...' : 'Start Swarm'}
			</button>
			
			<button 
				className="px-3 py-1 rounded text-sm bg-vscode-button-background text-vscode-button-foreground hover:bg-vscode-button-hoverBackground"
				onClick={handleStopSwarm}
				disabled={!isSwarmRunning}
			>
				Stop
			</button>
			
			<button 
				className={`px-3 py-1 rounded text-sm ${
					isSwarmPaused 
						? 'bg-vscode-button-background text-vscode-button-foreground hover:bg-vscode-button-hoverBackground' 
						: 'bg-vscode-button-secondaryBackground text-vscode-button-secondaryForeground hover:bg-vscode-button-secondaryHoverBackground'
				}`}
				onClick={handlePauseSwarm}
				disabled={!isSwarmRunning}
			>
				{isSwarmPaused ? 'Resume' : 'Pause'}
			</button>
			
			<div className="flex-1"></div>
			
			<button 
				className="px-3 py-1 rounded text-sm bg-vscode-button-background text-vscode-button-foreground hover:bg-vscode-button-hoverBackground"
				onClick={() => {
					// Send message to extension to open configuration
					const vscode = (window as any).acquireVsCodeApi?.();
					if (vscode) {
						vscode.postMessage({ command: 'configureSwarm' });
					}
				}}
			>
				Settings
			</button>
		</div>
	);
};