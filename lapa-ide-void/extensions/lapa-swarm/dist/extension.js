"use strict";
// LAPA Swarm Extension Entry Point
// This file serves as the main entry point for the LAPA extension in VoidChassis
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
function activate(context) {
    console.log('LAPA Swarm extension is now active!');
    // Register commands, if any
    // const disposable = vscode.commands.registerCommand('lapa.startSwarm', () => {
    // 	// Command implementation
    // });
    // context.subscriptions.push(disposable);
}
function deactivate() {
    console.log('LAPA Swarm extension is now deactivated!');
}
//# sourceMappingURL=extension.js.map