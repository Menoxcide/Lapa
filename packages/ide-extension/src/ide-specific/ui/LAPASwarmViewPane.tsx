/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Import our SwarmView component
import SwarmView from './SwarmView';

export class LAPASwarmViewPane implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private readonly _extensionUri: vscode.Uri;

	constructor(extensionUri: vscode.Uri) {
		this._extensionUri = extensionUri;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
				case 'startSwarm':
					vscode.commands.executeCommand('lapa.swarm.start');
					return;
				case 'stopSwarm':
					vscode.commands.executeCommand('lapa.swarm.stop');
					return;
				case 'pauseSwarm':
					vscode.commands.executeCommand('lapa.swarm.pause');
					return;
				case 'configureSwarm':
					vscode.commands.executeCommand('lapa.swarm.configure');
					return;
				case 'showStatus':
					vscode.commands.executeCommand('lapa.swarm.status');
					return;
				case 'lapa.enhancePrompt':
					// Handle enhance prompt request
					try {
						const result = await vscode.commands.executeCommand('lapa.enhancePrompt', message.prompt);
						// Send result back to webview
						webviewView.webview.postMessage({
							id: message.id,
							result: result,
							error: result?.success === false ? result.error : undefined
						});
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						webviewView.webview.postMessage({
							id: message.id,
							error: errorMessage
						});
					}
					return;
				case 'lapa.switchProvider':
					// Handle provider switch request
					try {
						const result = await vscode.commands.executeCommand('lapa.switchProvider', message.provider);
						// Send result back to webview
						webviewView.webview.postMessage({
							command: 'lapa.switchProvider',
							provider: message.provider,
							success: result?.success !== false
						});
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						webviewView.webview.postMessage({
							command: 'lapa.switchProvider',
							provider: message.provider,
							success: false,
							error: errorMessage
						});
					}
					return;
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		// Get the local path to main script run in the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>LAPA Swarm</title>
			</head>
			<body>
				<div id="root"></div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}