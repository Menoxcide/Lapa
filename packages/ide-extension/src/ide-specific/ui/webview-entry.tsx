/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import SwarmView from './SwarmView';
import Dashboard from './Dashboard';
import SettingsPanel from './SettingsPanel';
import McpMarketplace from './McpMarketplace';
import ROIWidget from './ROIWidget';
import TaskHistory from './TaskHistory';

// Get the vscode API from the acquireVsCodeApi function
// This is injected by VS Code at runtime in the webview context
declare function acquireVsCodeApi(): {
	postMessage: (message: any) => void;
	getState: () => any;
	setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

// Determine which component to render based on panel/view type
// Check window global variable set by extension, URL parameters, or vscode state
function getPanelType(): 'swarm' | 'dashboard' | 'settings' | 'marketplace' | 'roi' | 'taskHistory' {
	// Check window global variable first (set by extension HTML)
	const windowPanelType = (window as any).__LAPA_PANEL_TYPE__;
	if (windowPanelType === 'dashboard' || windowPanelType === 'settings' || windowPanelType === 'marketplace' || 
	    windowPanelType === 'roi' || windowPanelType === 'taskHistory') {
		return windowPanelType;
	}
	
	// Check URL parameters
	const urlParams = new URLSearchParams(window.location.search);
	const panelType = urlParams.get('panel');
	
	if (panelType === 'dashboard' || panelType === 'settings' || panelType === 'marketplace' || 
	    panelType === 'roi' || panelType === 'taskHistory') {
		return panelType as 'dashboard' | 'settings' | 'marketplace' | 'roi' | 'taskHistory';
	}
	
	// Check vscode state
	const state = vscode.getState();
	if (state?.panelType) {
		return state.panelType;
	}
	
	// Default to swarm view for sidebar views
	return 'swarm';
}

// Initialize React root and render appropriate component
const container = document.getElementById('root');
if (container) {
	const root = ReactDOM.createRoot(container);
	const panelType = getPanelType();
	
	// Set state for future reference
	vscode.setState({ panelType });
	
	let component: React.ReactElement;
	
	switch (panelType) {
		case 'dashboard':
			component = <Dashboard />;
			break;
		case 'settings':
			component = <SettingsPanel onClose={() => {
				vscode.postMessage({ command: 'closePanel' });
			}} />;
			break;
		case 'marketplace':
			component = <McpMarketplace onClose={() => {
				vscode.postMessage({ command: 'closePanel' });
			}} />;
			break;
		case 'roi':
			component = <ROIWidget />;
			break;
		case 'taskHistory':
			component = <TaskHistory onClose={() => {
				vscode.postMessage({ command: 'closePanel' });
			}} />;
			break;
		case 'swarm':
		default:
			// Mock sessionId for now - can be passed via message from extension
			const sessionId = undefined;
			component = (
				<SwarmView
					sessionId={sessionId}
					onNodeClick={(nodeId) => {
						// Send message to extension
						vscode.postMessage({
							command: 'nodeClick',
							nodeId,
						});
					}}
					onEdgeClick={(edgeId) => {
						// Send message to extension
						vscode.postMessage({
							command: 'edgeClick',
							edgeId,
						});
					}}
				/>
			);
			break;
	}
	
	root.render(component);
} else {
	console.error('Root container not found');
}

