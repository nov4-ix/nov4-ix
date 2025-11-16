import * as vscode from 'vscode';
import { CodeAssistantPanel } from './panels/CodeAssistantPanel';

export function activate(context: vscode.ExtensionContext) {
	// Register the command to open the WebView
	const startCommand = vscode.commands.registerCommand('son1k-go.start', () => {
		CodeAssistantPanel.render(context.extensionUri);
	});

	context.subscriptions.push(startCommand);
}

export function deactivate() {}
