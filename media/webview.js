// PromptVault Webview JavaScript
(function() {
    'use strict';

    // Get VS Code API
    const vscode = acquireVsCodeApi();

    class PromptVaultWebview {
        constructor() {
            this.state = {
                prompts: [],
                categories: [],
                currentPromptId: null,
                searchQuery: '',
                selectedCategoryId: ''
            };
            this.debounceTimeout = null;
            this.initialize();
        }

        initialize() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupEventListeners();
                    this.loadCategories();
                    this.loadPrompts();
                    this.restoreState();
                });
            } else {
                this.setupEventListeners();
                this.loadCategories();
                this.loadPrompts();
                this.restoreState();
            }
        }

        restoreState() {
            // Restore state if available
            const savedState = vscode.getState();
            if (savedState) {
                this.state = { ...this.state, ...savedState };
                
                // Restore search input value
                const searchInput = document.getElementById('searchInput');
                if (searchInput && this.state.searchQuery) {
                    searchInput.value = this.state.searchQuery;
                }
                
                // Restore category filter
                const categoryFilter = document.getElementById('categoryFilter');
                if (categoryFilter && this.state.selectedCategoryId) {
                    categoryFilter.value = this.state.selectedCategoryId;
                }
            }
        }

        setupEventListeners() {
            // Search input
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.state.searchQuery = e.target.value;
                    this.debounceSearch();
                });
                
                // Also listen for keyup as a fallback
                searchInput.addEventListener('keyup', (e) => {
                    this.state.searchQuery = e.target.value;
                    this.debounceSearch();
                });
            }

            // Category filter
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', (e) => {
                    this.state.selectedCategoryId = e.target.value;
                    this.loadPrompts();
                });
            }

            // Buttons
            const newPromptBtn = document.getElementById('newPromptBtn');
            if (newPromptBtn) {
                newPromptBtn.addEventListener('click', () => this.openPromptDialog());
            }

            const newCategoryBtn = document.getElementById('newCategoryBtn');
            if (newCategoryBtn) {
                newCategoryBtn.addEventListener('click', () => this.openCategoryDialog());
            }

            // Dialog events
            const promptDialogCancel = document.getElementById('promptDialogCancel');
            if (promptDialogCancel) {
                promptDialogCancel.addEventListener('click', () => this.closePromptDialog());
            }

            const promptDialogSave = document.getElementById('promptDialogSave');
            if (promptDialogSave) {
                promptDialogSave.addEventListener('click', () => this.savePrompt());
            }

            const categoryDialogCancel = document.getElementById('categoryDialogCancel');
            if (categoryDialogCancel) {
                categoryDialogCancel.addEventListener('click', () => this.closeCategoryDialog());
            }

            const categoryDialogSave = document.getElementById('categoryDialogSave');
            if (categoryDialogSave) {
                categoryDialogSave.addEventListener('click', () => this.saveCategory());
            }

            // Close dialogs on overlay click
            const promptDialogOverlay = document.getElementById('promptDialogOverlay');
            if (promptDialogOverlay) {
                promptDialogOverlay.addEventListener('click', (e) => {
                    if (e.target === e.currentTarget) {
                        this.closePromptDialog();
                    }
                });
            }
            
            const categoryDialogOverlay = document.getElementById('categoryDialogOverlay');
            if (categoryDialogOverlay) {
                categoryDialogOverlay.addEventListener('click', (e) => {
                    if (e.target === e.currentTarget) {
                        this.closeCategoryDialog();
                    }
                });
            }

            // Handle messages from extension
            window.addEventListener('message', (event) => {
                const message = event.data;
                switch (message.type) {
                    case 'prompts':
                        this.state.prompts = message.data;
                        this.renderPrompts();
                        break;
                    case 'categories':
                        this.state.categories = message.data;
                        this.renderCategories();
                        break;
                    case 'error':
                        console.error('PromptVault error:', message.message);
                        this.showError(message.message);
                        break;
                }
                this.saveState();
            });
        }

        debounceSearch() {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(() => {
                this.loadPrompts();
            }, 300);
        }

        loadPrompts() {
            const message = {
                type: 'search',
                query: this.state.searchQuery,
                categoryId: this.state.selectedCategoryId || undefined
            };
            vscode.postMessage(message);
        }

        loadCategories() {
            vscode.postMessage({ type: 'listCategories' });
        }

        render() {
            this.renderCategories();
            this.renderPrompts();
        }

        renderCategories() {
            const categoryFilter = document.getElementById('categoryFilter');
            const promptCategorySelect = document.getElementById('promptCategory');
            
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                    this.state.categories.map(cat => 
                        `<option value="${this.escapeHtml(cat.id)}" ${cat.id === this.state.selectedCategoryId ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>`
                    ).join('');
            }

            if (promptCategorySelect) {
                promptCategorySelect.innerHTML = this.state.categories.map(cat => 
                    `<option value="${this.escapeHtml(cat.id)}">${this.escapeHtml(cat.name)}</option>`
                ).join('');
            }
        }

        renderPrompts() {
            const promptList = document.getElementById('promptList');
            if (!promptList) {
                return;
            }

            if (this.state.prompts.length === 0) {
                promptList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-title">No prompts found</div>
                        <div class="empty-state-text">Create your first prompt to get started!</div>
                        <button class="button" onclick="promptVault.openPromptDialog()">Create Prompt</button>
                    </div>
                `;
                return;
            }

            const promptsHtml = this.state.prompts.map(prompt => `
                <div class="prompt-item">
                    <div class="prompt-header">
                        <h3 class="prompt-title">${this.escapeHtml(prompt.title)}</h3>
                        <span class="prompt-category">${this.escapeHtml(prompt.categoryName || '')}</span>
                    </div>
                    <div class="prompt-body">${this.escapeHtml(prompt.body)}</div>
                    <div class="prompt-actions">
                        <button class="action-button primary" onclick="promptVault.insertPrompt('${prompt.id}')">Insert</button>
                        <button class="action-button" onclick="promptVault.editPrompt('${prompt.id}')">Edit</button>
                        <button class="action-button danger" onclick="promptVault.deletePrompt('${prompt.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
            
            promptList.innerHTML = promptsHtml;
        }

        openPromptDialog(promptId) {
            this.state.currentPromptId = promptId || null;
            const dialog = document.getElementById('promptDialogOverlay');
            const titleInput = document.getElementById('promptTitle');
            const bodyTextarea = document.getElementById('promptBody');
            const categorySelect = document.getElementById('promptCategory');

            if (promptId) {
                const prompt = this.state.prompts.find(p => p.id === promptId);
                if (prompt) {
                    titleInput.value = prompt.title;
                    bodyTextarea.value = prompt.body;
                    categorySelect.value = prompt.categoryId;
                }
            } else {
                titleInput.value = '';
                bodyTextarea.value = '';
                if (this.state.categories.length > 0) {
                    categorySelect.value = this.state.categories[0].id;
                } else {
                    categorySelect.value = '';
                }
            }

            if (dialog) {
                dialog.style.display = 'flex';
                titleInput.focus();
            }
        }

        closePromptDialog() {
            const dialog = document.getElementById('promptDialogOverlay');
            if (dialog) {
                dialog.style.display = 'none';
            }
            this.state.currentPromptId = null;
        }

        savePrompt() {
            const titleInput = document.getElementById('promptTitle');
            const bodyTextarea = document.getElementById('promptBody');
            const categorySelect = document.getElementById('promptCategory');

            const title = titleInput.value.trim();
            const body = bodyTextarea.value.trim();
            const categoryId = categorySelect.value;

            if (!title || !body) {
                this.showError('Title and body are required');
                return;
            }

            const message = this.state.currentPromptId
                ? {
                    type: 'updatePrompt',
                    id: this.state.currentPromptId,
                    title,
                    body,
                    categoryId
                }
                : {
                    type: 'createPrompt',
                    title,
                    body,
                    categoryId
                };

            vscode.postMessage(message);
            this.closePromptDialog();
        }

        editPrompt(id) {
            this.openPromptDialog(id);
        }

        deletePrompt(id) {
            if (confirm('Are you sure you want to delete this prompt?')) {
                vscode.postMessage({ type: 'deletePrompt', id });
            }
        }

        insertPrompt(id) {
            const prompt = this.state.prompts.find(p => p.id === id);
            if (prompt) {
                vscode.postMessage({ type: 'insert', text: prompt.body });
            }
        }

        openCategoryDialog() {
            const dialog = document.getElementById('categoryDialogOverlay');
            const nameInput = document.getElementById('categoryName');
            
            nameInput.value = '';
            if (dialog) {
                dialog.style.display = 'flex';
                nameInput.focus();
            }
        }

        closeCategoryDialog() {
            const dialog = document.getElementById('categoryDialogOverlay');
            if (dialog) {
                dialog.style.display = 'none';
            }
        }

        saveCategory() {
            const nameInput = document.getElementById('categoryName');
            const name = nameInput.value.trim();

            if (!name) {
                this.showError('Category name is required');
                return;
            }

            vscode.postMessage({ type: 'createCategory', name });
            this.closeCategoryDialog();
        }

        showError(message) {
            // Simple error display - in a real implementation you might want a toast or modal
            alert(message);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        saveState() {
            vscode.setState(this.state);
        }
    }

    // Initialize when DOM is loaded
    let promptVault;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            promptVault = new PromptVaultWebview();
            // Make functions available globally for HTML onclick handlers
            window.promptVault = promptVault;
        });
    } else {
        promptVault = new PromptVaultWebview();
        // Make functions available globally for HTML onclick handlers
        window.promptVault = promptVault;
    }
})();
