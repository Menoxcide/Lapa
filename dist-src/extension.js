import * as vscode from 'vscode';
export function activate(context) {
    console.log('LAPA Swarm activated');
    let startSwarm = vscode.commands.registerCommand('lapa.startSwarm', () => {
        vscode.window.showInformationMessage('LAPA Swarm started!');
    });
    let stopSwarm = vscode.commands.registerCommand('lapa.stopSwarm', () => {
        vscode.window.showInformationMessage('LAPA Swarm stopped.');
    });
    context.subscriptions.push(startSwarm);
    context.subscriptions.push(stopSwarm);
}
export function deactivate() { }
//# sourceMappingURL=extension.js.map