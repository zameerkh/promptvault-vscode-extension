// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PromptDB } from './db';
import { PromptVaultViewProvider } from './panel';

let db: PromptDB;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	try {
		// Initialize database
		db = new PromptDB(context);
		
		// Register webview provider
		const promptVaultProvider = new PromptVaultViewProvider(context.extensionUri, context, db);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(PromptVaultViewProvider.viewType, promptVaultProvider)
		);

		// Register commands
		context.subscriptions.push(
			vscode.commands.registerCommand('promptVault.open', () => {
				vscode.commands.executeCommand('workbench.view.extension.promptVault');
			}),
			
			vscode.commands.registerCommand('promptVault.insert', async () => {
				const prompts = db.listPrompts(100);
				
				if (prompts.length === 0) {
					vscode.window.showInformationMessage('No prompts found. Create some prompts first!');
					return;
				}

				const items = prompts.map(prompt => ({
					label: prompt.title,
					description: prompt.categoryName,
					detail: prompt.body,
					prompt: prompt
				}));

				const selected = await vscode.window.showQuickPick(items, {
					placeHolder: 'Select a prompt to insert',
					matchOnDescription: true,
					matchOnDetail: true
				});

				if (selected) {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						const position = editor.selection.active;
						await editor.edit(editBuilder => {
							editBuilder.insert(position, selected.prompt.body);
						});
					}
				}
			}),

			vscode.commands.registerCommand('promptVault.refresh', () => {
				promptVaultProvider.refresh();
			})
		);

	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to activate PromptVault: ${message}`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Cleanup resources if needed
}
