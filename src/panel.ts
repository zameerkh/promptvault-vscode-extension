import * as vscode from 'vscode';
import * as path from 'path';
import { PromptDB, Prompt, Category, PromptWithCategory } from './db';

export class PromptVaultViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'promptVault.sidebar';
    
    private _view?: vscode.WebviewView;
    private _db: PromptDB;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        db: PromptDB
    ) {
        this._db = db;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            await this._handleMessage(data);
        });

        // Initialize webview with data after a short delay to ensure DOM is loaded
        setTimeout(() => {
            this._handleListCategories();
            this._handleSearch();
        }, 100);
    }

    private async _handleMessage(data: any): Promise<void> {
        console.log('Webview received message:', data);
        try {
            switch (data.type) {
                case 'search':
                    await this._handleSearch(data.query, data.categoryId);
                    break;
                case 'createPrompt':
                    await this._handleCreatePrompt(data.title, data.body, data.categoryId);
                    break;
                case 'updatePrompt':
                    await this._handleUpdatePrompt(data.id, data.title, data.body, data.categoryId);
                    break;
                case 'deletePrompt':
                    await this._handleDeletePrompt(data.id);
                    break;
                case 'createCategory':
                    await this._handleCreateCategory(data.name);
                    break;
                case 'deleteCategory':
                    await this._handleDeleteCategory(data.id);
                    break;
                case 'listCategories':
                    await this._handleListCategories();
                    break;
                case 'insert':
                    await this._handleInsert(data.text);
                    break;
                case 'exportJson':
                    await this._handleExportJson();
                    break;
                case 'exportCsv':
                    await this._handleExportCsv();
                    break;
                case 'exportCategory':
                    await this._handleExportCategory(data.categoryId);
                    break;
                case 'import':
                    await this._handleImport(data.content);
                    break;
                case 'bulkDelete':
                    await this._handleBulkDelete(data.promptIds);
                    break;
                case 'bulkUpdateCategory':
                    await this._handleBulkUpdateCategory(data.promptIds, data.categoryId);
                    break;
                default:
                    console.warn(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error handling webview message:', error);
            this._postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
        }
    }

    private async _handleSearch(query: string = '', categoryId?: string): Promise<void> {
        try {
            const prompts = query.trim() 
                ? this._db.searchPrompts(query, 50, categoryId)
                : this._db.listPrompts(50, 0, categoryId);
            
            this._postMessage({
                type: 'prompts',
                data: prompts
            });
        } catch (error) {
            console.error('Search error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to search prompts'
            });
        }
    }

    private async _handleCreatePrompt(title: string, body: string, categoryId: string): Promise<void> {
        try {
            const prompt = this._db.upsertPrompt({ title, body, categoryId });
            vscode.window.showInformationMessage(`Prompt "${prompt.title}" created successfully`);
            
            // Refresh the prompt list
            await this._handleSearch();
        } catch (error) {
            console.error('Create prompt error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to create prompt'
            });
        }
    }

    private async _handleUpdatePrompt(id: string, title: string, body: string, categoryId: string): Promise<void> {
        try {
            const prompt = this._db.upsertPrompt({ id, title, body, categoryId });
            vscode.window.showInformationMessage(`Prompt "${prompt.title}" updated successfully`);
            
            // Refresh the prompt list
            await this._handleSearch();
        } catch (error) {
            console.error('Update prompt error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to update prompt'
            });
        }
    }

    private async _handleDeletePrompt(id: string): Promise<void> {
        try {
            const success = this._db.deletePrompt(id);
            if (success) {
                vscode.window.showInformationMessage('Prompt deleted successfully');
                // Refresh the prompt list
                await this._handleSearch();
            } else {
                this._postMessage({
                    type: 'error',
                    message: 'Failed to delete prompt'
                });
            }
        } catch (error) {
            console.error('Delete prompt error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to delete prompt'
            });
        }
    }

    private async _handleCreateCategory(name: string): Promise<void> {
        try {
            const category = this._db.upsertCategory({ name });
            vscode.window.showInformationMessage(`Category "${category.name}" created successfully`);
            
            // Refresh categories list
            await this._handleListCategories();
        } catch (error) {
            console.error('Create category error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to create category'
            });
        }
    }

    private async _handleDeleteCategory(id: string): Promise<void> {
        try {
            const result = this._db.deleteCategory(id);
            if (result.success) {
                vscode.window.showInformationMessage('Category deleted successfully');
                // Refresh categories and prompts
                await this._handleListCategories();
                await this._handleSearch();
            } else {
                this._postMessage({
                    type: 'error',
                    message: result.error || 'Failed to delete category'
                });
            }
        } catch (error) {
            console.error('Delete category error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to delete category'
            });
        }
    }

    private async _handleListCategories(): Promise<void> {
        try {
            const categories = this._db.listCategories();
            this._postMessage({
                type: 'categories',
                data: categories
            });
        } catch (error) {
            console.error('List categories error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to load categories'
            });
        }
    }

    private async _handleInsert(text: string): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const position = activeEditor.selection.active;
                await activeEditor.edit(editBuilder => {
                    editBuilder.insert(position, text);
                });
            } else {
                vscode.window.showWarningMessage('No active editor to insert text into');
            }
        } catch (error) {
            console.error('Insert text error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to insert text'
            });
        }
    }

    private async _handleExportJson(): Promise<void> {
        try {
            const exportData = this._db.exportToJson();
            const fileName = `promptvault-export-${new Date().toISOString().split('T')[0]}.json`;
            
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData, 'utf8'));
                vscode.window.showInformationMessage(`Exported ${this._db.getStats().promptCount} prompts to ${uri.fsPath}`);
            }
        } catch (error) {
            console.error('Export JSON error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to export to JSON'
            });
        }
    }

    private async _handleExportCsv(): Promise<void> {
        try {
            const exportData = this._db.exportToCsv();
            const fileName = `promptvault-export-${new Date().toISOString().split('T')[0]}.csv`;
            
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: {
                    'CSV Files': ['csv'],
                    'All Files': ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData, 'utf8'));
                vscode.window.showInformationMessage(`Exported ${this._db.getStats().promptCount} prompts to ${uri.fsPath}`);
            }
        } catch (error) {
            console.error('Export CSV error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to export to CSV'
            });
        }
    }

    private async _handleExportCategory(categoryId: string): Promise<void> {
        try {
            const result = this._db.exportCategory(categoryId);
            if (result.success && result.data) {
                const category = this._db.getCategory(categoryId);
                const fileName = `promptvault-${category?.name || 'category'}-${new Date().toISOString().split('T')[0]}.json`;
                
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(fileName),
                    filters: {
                        'JSON Files': ['json'],
                        'All Files': ['*']
                    }
                });

                if (uri) {
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(result.data, 'utf8'));
                    const promptCount = JSON.parse(result.data).data.prompts.length;
                    vscode.window.showInformationMessage(`Exported category with ${promptCount} prompts to ${uri.fsPath}`);
                }
            } else {
                this._postMessage({
                    type: 'error',
                    message: result.error || 'Failed to export category'
                });
            }
        } catch (error) {
            console.error('Export category error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to export category'
            });
        }
    }

    private async _handleImport(content: string): Promise<void> {
        try {
            const result = this._db.importFromJson(content);
            
            if (result.success) {
                let message = `Successfully imported ${result.imported?.prompts || 0} prompts and ${result.imported?.categories || 0} categories`;
                
                if (result.conflicts && result.conflicts.length > 0) {
                    message += `\n\nConflicts resolved:\n${result.conflicts.map(c => `• ${c.type}: ${c.name} - ${c.action}`).join('\n')}`;
                }
                
                vscode.window.showInformationMessage(message);
                
                // Refresh the UI
                await this._handleListCategories();
                await this._handleSearch();
            } else {
                this._postMessage({
                    type: 'error',
                    message: result.error || 'Import failed'
                });
            }
        } catch (error) {
            console.error('Import error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to import data'
            });
        }
    }

    private async _handleBulkDelete(promptIds: string[]): Promise<void> {
        try {
            const result = this._db.bulkDeletePrompts(promptIds);
            
            if (result.success) {
                vscode.window.showInformationMessage(`Successfully deleted ${result.deleted} prompts`);
                await this._handleSearch(); // Refresh the view
            } else {
                this._postMessage({
                    type: 'error',
                    message: result.error || 'Bulk delete failed'
                });
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to delete prompts'
            });
        }
    }

    private async _handleBulkUpdateCategory(promptIds: string[], categoryId: string): Promise<void> {
        try {
            const result = this._db.bulkUpdateCategory(promptIds, categoryId);
            
            if (result.success) {
                const category = this._db.getCategory(categoryId);
                vscode.window.showInformationMessage(`Successfully moved ${result.updated} prompts to "${category?.name || 'Unknown'}"`);
                await this._handleSearch(); // Refresh the view
            } else {
                this._postMessage({
                    type: 'error',
                    message: result.error || 'Bulk update failed'
                });
            }
        } catch (error) {
            console.error('Bulk update error:', error);
            this._postMessage({
                type: 'error',
                message: 'Failed to update prompts'
            });
        }
    }

    private _postMessage(message: any): void {
        console.log('Sending message to webview:', message);
        if (this._view) {
            this._view.webview.postMessage(message);
        } else {
            console.warn('No webview available to post message to');
        }
    }

    public refresh(): void {
        if (this._view) {
            this._handleListCategories();
            this._handleSearch();
        }
    }

    public handleImport(jsonContent: string): void {
        this._handleImport(jsonContent);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css'));

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>PromptVault</title>
            </head>
            <body>
                <div class="header">
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search prompts..." />
                        <select id="categoryFilter" class="category-filter">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    <div class="button-container">
                        <button id="newPromptBtn" class="button">+ New Prompt</button>
                        <button id="newCategoryBtn" class="button secondary">+ New Category</button>
                    </div>
                </div>

                <div id="promptList" class="prompt-list">
                    <div class="loading">Loading prompts...</div>
                </div>

                <!-- Prompt Dialog -->
                <div id="promptDialogOverlay" class="dialog-overlay">
                    <div class="dialog">
                        <div class="dialog-header">
                            <h2 class="dialog-title">Create Prompt</h2>
                        </div>
                        <div class="dialog-body">
                            <div class="form-group">
                                <label class="form-label" for="promptTitle">Title</label>
                                <input type="text" id="promptTitle" class="form-input" placeholder="Enter prompt title..." />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="promptCategory">Category</label>
                                <select id="promptCategory" class="form-select">
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="promptBody">Body</label>
                                <textarea id="promptBody" class="form-textarea" placeholder="Enter your prompt content..."></textarea>
                            </div>
                        </div>
                        <div class="dialog-actions">
                            <button id="promptDialogCancel" class="button secondary">Cancel</button>
                            <button id="promptDialogSave" class="button">Save</button>
                        </div>
                    </div>
                </div>

                <!-- Category Dialog -->
                <div id="categoryDialogOverlay" class="dialog-overlay">
                    <div class="dialog">
                        <div class="dialog-header">
                            <h2 class="dialog-title">Create Category</h2>
                        </div>
                        <div class="dialog-body">
                            <div class="form-group">
                                <label class="form-label" for="categoryName">Name</label>
                                <input type="text" id="categoryName" class="form-input" placeholder="Enter category name..." />
                            </div>
                        </div>
                        <div class="dialog-actions">
                            <button id="categoryDialogCancel" class="button secondary">Cancel</button>
                            <button id="categoryDialogSave" class="button">Save</button>
                        </div>
                    </div>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
