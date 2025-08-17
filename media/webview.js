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
                selectedCategoryId: '',
                selectedPrompts: new Set()
            };
            this.debounceTimeout = null;
            this.renderTimeout = null;
            this.LARGE_DATASET_THRESHOLD = 100;
            this.VIRTUAL_SCROLL_ITEM_HEIGHT = 120;
            this.MAX_VISIBLE_ITEMS = 50;
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

            // Bulk operations event listeners
            const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
            if (bulkDeleteBtn) {
                bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteSelected());
            }

            const bulkMoveBtn = document.getElementById('bulkMoveBtn');
            if (bulkMoveBtn) {
                bulkMoveBtn.addEventListener('click', () => this.bulkMoveSelected());
            }

            const bulkClearBtn = document.getElementById('bulkClearBtn');
            if (bulkClearBtn) {
                bulkClearBtn.addEventListener('click', () => this.clearSelection());
            }

            // Export/Import event listeners
            const exportJsonBtn = document.getElementById('exportJsonBtn');
            if (exportJsonBtn) {
                exportJsonBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exportJson();
                });
            }

            const exportCsvBtn = document.getElementById('exportCsvBtn');
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exportCsv();
                });
            }

            const importBtn = document.getElementById('importBtn');
            if (importBtn) {
                importBtn.addEventListener('click', () => this.showImportDialog());
            }

            const importFileInput = document.getElementById('importFileInput');
            if (importFileInput) {
                importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
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
            const bulkCategorySelect = document.getElementById('bulkCategorySelect');
            
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

            if (bulkCategorySelect) {
                bulkCategorySelect.innerHTML = '<option value="">Move to Category...</option>' +
                    this.state.categories.map(cat => 
                        `<option value="${this.escapeHtml(cat.id)}">${this.escapeHtml(cat.name)}</option>`
                    ).join('');
            }
        }

        renderPrompts() {
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
            }
            
            // Use requestAnimationFrame for smooth rendering
            this.renderTimeout = setTimeout(() => {
                this._doRenderPrompts();
            }, 16); // ~60fps
        }

        _doRenderPrompts() {
            const promptList = document.getElementById('promptList');
            if (!promptList) {
                return;
            }

            const prompts = this.state.prompts;

            if (prompts.length === 0) {
                promptList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-title">No prompts found</div>
                        <div class="empty-state-text">Create your first prompt to get started!</div>
                        <button class="button" onclick="promptVault.openPromptDialog()">Create Prompt</button>
                    </div>
                `;
                this.updateBulkActionsVisibility();
                return;
            }

            // Performance optimization for large datasets
            const isLargeDataset = prompts.length > this.LARGE_DATASET_THRESHOLD;
            
            if (isLargeDataset) {
                promptList.classList.add('large-dataset');
                this._renderVirtualizedPrompts(prompts);
            } else {
                promptList.classList.remove('large-dataset');
                this._renderAllPrompts(prompts);
            }
            
            this.updateBulkActionsVisibility();
        }

        _renderAllPrompts(prompts) {
            const promptList = document.getElementById('promptList');
            const promptsHtml = prompts.map(prompt => this._renderPromptItem(prompt)).join('');
            promptList.innerHTML = promptsHtml;
        }

        _renderVirtualizedPrompts(prompts) {
            const promptList = document.getElementById('promptList');
            
            // For large datasets, limit initial render and add "show more" functionality
            const visiblePrompts = prompts.slice(0, this.MAX_VISIBLE_ITEMS);
            const remainingCount = prompts.length - visiblePrompts.length;
            
            let promptsHtml = visiblePrompts.map(prompt => this._renderPromptItem(prompt)).join('');
            
            if (remainingCount > 0) {
                promptsHtml += `
                    <div class="load-more-container">
                        <div class="load-more-info">Showing ${visiblePrompts.length} of ${prompts.length} prompts</div>
                        <button class="button secondary" onclick="promptVault.loadMorePrompts()">
                            Load ${Math.min(remainingCount, this.MAX_VISIBLE_ITEMS)} More
                        </button>
                        <button class="button secondary" onclick="promptVault.loadAllPrompts()">
                            Show All (${remainingCount} remaining)
                        </button>
                    </div>
                `;
            }
            
            promptList.innerHTML = promptsHtml;
        }

        _renderPromptItem(prompt) {
            return `
                <div class="prompt-item ${this.state.selectedPrompts.has(prompt.id) ? 'selected' : ''}">
                    <div class="prompt-header">
                        <div class="prompt-header-left">
                            <input type="checkbox" class="prompt-checkbox" ${this.state.selectedPrompts.has(prompt.id) ? 'checked' : ''} 
                                   onchange="promptVault.togglePromptSelection('${prompt.id}', this.checked)" />
                            <h3 class="prompt-title">${this.escapeHtml(prompt.title)}</h3>
                        </div>
                        <span class="prompt-category">${this.escapeHtml(prompt.categoryName || '')}</span>
                    </div>
                    <div class="prompt-body">${this.escapeHtml(prompt.body)}</div>
                    <div class="prompt-actions">
                        <button class="action-button primary" onclick="promptVault.insertPrompt('${prompt.id}')">Insert</button>
                        <button class="action-button" onclick="promptVault.editPrompt('${prompt.id}')">Edit</button>
                        <button class="action-button danger" onclick="promptVault.deletePrompt('${prompt.id}')">Delete</button>
                        <button class="action-button secondary" onclick="promptVault.exportSingleCategory('${prompt.categoryId}')">Export Category</button>
                    </div>
                </div>
            `;
        }

        loadMorePrompts() {
            const currentVisible = document.querySelectorAll('.prompt-item').length;
            const nextBatch = Math.min(currentVisible + this.MAX_VISIBLE_ITEMS, this.state.prompts.length);
            this.MAX_VISIBLE_ITEMS = nextBatch;
            this._doRenderPrompts();
        }

        loadAllPrompts() {
            this.MAX_VISIBLE_ITEMS = this.state.prompts.length;
            this._doRenderPrompts();
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

        // Bulk operations methods
        togglePromptSelection(promptId, isSelected) {
            if (isSelected) {
                this.state.selectedPrompts.add(promptId);
            } else {
                this.state.selectedPrompts.delete(promptId);
            }
            this.updateBulkActionsVisibility();
            this.saveState();
        }

        updateBulkActionsVisibility() {
            const bulkActions = document.getElementById('bulkActions');
            const selectedCount = document.querySelector('.selected-count');
            
            if (bulkActions && selectedCount) {
                const count = this.state.selectedPrompts.size;
                if (count > 0) {
                    bulkActions.style.display = 'flex';
                    selectedCount.textContent = `${count} selected`;
                } else {
                    bulkActions.style.display = 'none';
                }
            }
        }

        clearSelection() {
            this.state.selectedPrompts.clear();
            this.renderPrompts();
            this.saveState();
        }

        bulkDeleteSelected() {
            const count = this.state.selectedPrompts.size;
            if (count === 0) {
                return;
            }

            if (confirm(`Are you sure you want to delete ${count} selected prompt(s)?`)) {
                const promptIds = Array.from(this.state.selectedPrompts);
                vscode.postMessage({ type: 'bulkDelete', promptIds });
                this.clearSelection();
            }
        }

        bulkMoveSelected() {
            const bulkCategorySelect = document.getElementById('bulkCategorySelect');
            if (!bulkCategorySelect || !bulkCategorySelect.value) {
                this.showError('Please select a category to move to');
                return;
            }

            const count = this.state.selectedPrompts.size;
            if (count === 0) {
                return;
            }

            const promptIds = Array.from(this.state.selectedPrompts);
            vscode.postMessage({ 
                type: 'bulkUpdateCategory', 
                promptIds, 
                categoryId: bulkCategorySelect.value 
            });
            this.clearSelection();
            bulkCategorySelect.value = '';
        }

        // Export/Import methods
        exportJson() {
            vscode.postMessage({ type: 'exportJson' });
        }

        exportCsv() {
            vscode.postMessage({ type: 'exportCsv' });
        }

        exportSingleCategory(categoryId) {
            vscode.postMessage({ type: 'exportCategory', categoryId });
        }

        showImportDialog() {
            const importFileInput = document.getElementById('importFileInput');
            if (importFileInput) {
                importFileInput.click();
            }
        }

        handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                this.showError('Please select a JSON file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    vscode.postMessage({ type: 'import', content });
                } catch (error) {
                    this.showError('Failed to read file: ' + error.message);
                }
            };
            reader.readAsText(file);

            // Clear the input so the same file can be selected again
            event.target.value = '';
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
