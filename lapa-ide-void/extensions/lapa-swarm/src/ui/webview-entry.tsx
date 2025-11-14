/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import SwarmView from './SwarmView';

// Get the vscode API from the acquireVsCodeApi function
// This is injected by VS Code at runtime in the webview context
declare function acquireVsCodeApi(): {
	postMessage: (message: any) => void;
	getState: () => any;
	setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

// Initialize React root and render SwarmView
const container = document.getElementById('root');
if (container) {
	const root = ReactDOM.createRoot(container);
	
	// Mock sessionId for now - can be passed via message from extension
	const sessionId = undefined;
	
	root.render(
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
} else {
	console.error('Root container not found');
}

