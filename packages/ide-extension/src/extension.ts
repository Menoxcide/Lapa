// LAPA IDE Extension Entry Point
// This file wraps @lapa/core for IDE integration

import * as vscode from 'vscode';
import { LAPASwarmViewPane } from './ide-specific/ui/LAPASwarmViewPane';
// Import from @lapa/core
import * as lapaCore from '@lapa/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('LAPA Swarm extension is now active!');
  
  // Initialize core
  // TODO: Initialize LAPA core here
  
  // Register IDE-specific components
  const viewProvider = vscode.window.registerWebviewViewProvider(
    'lapaSwarmView',
    new LAPASwarmViewPane(context.extensionUri),
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );
  
  context.subscriptions.push(viewProvider);
  
  // Register commands
  // TODO: Register commands that use @lapa/core
}

export function deactivate() {
  // Cleanup
}
