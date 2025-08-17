import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface Prompt {
    id: string;
    title: string;
    body: string;
    categoryId: string;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface PromptWithCategory extends Prompt {
    categoryName: string;
}

interface DatabaseData {
    prompts: Prompt[];
    categories: Category[];
}

export class PromptDB {
    private data!: DatabaseData;
    private dbPath: string;

    constructor(context: vscode.ExtensionContext) {
        try {
            this.dbPath = path.join(context.globalStorageUri.fsPath, 'prompts.json');
            
            // Ensure directory exists
            vscode.workspace.fs.createDirectory(context.globalStorageUri);
            
            this.loadDatabase();
            this.seedDefaultCategory();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private loadDatabase(): void {
        try {
            if (fs.existsSync(this.dbPath)) {
                const fileContent = fs.readFileSync(this.dbPath, 'utf8');
                this.data = JSON.parse(fileContent);
            } else {
                this.data = { prompts: [], categories: [] };
                this.saveDatabase();
            }
        } catch (error) {
            console.error('Failed to load database, creating new one:', error);
            this.data = { prompts: [], categories: [] };
            this.saveDatabase();
        }
    }

    private saveDatabase(): void {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Failed to save database:', error);
        }
    }

    private seedDefaultCategory(): void {
        if (this.data.categories.length === 0) {
            this.upsertCategory({ name: 'General' });
        }
    }

    public upsertPrompt(prompt: Partial<Prompt> & { title: string; body: string; categoryId: string }): Prompt {
        const id = prompt.id || uuidv4();
        const now = new Date().toISOString();
        
        const existingIndex = this.data.prompts.findIndex(p => p.id === id);
        const newPrompt: Prompt = {
            id,
            title: prompt.title,
            body: prompt.body,
            categoryId: prompt.categoryId,
            created_at: prompt.created_at || now,
            updated_at: now
        };

        if (existingIndex >= 0) {
            // Update existing prompt
            newPrompt.created_at = this.data.prompts[existingIndex].created_at;
            this.data.prompts[existingIndex] = newPrompt;
        } else {
            // Add new prompt
            this.data.prompts.push(newPrompt);
        }

        this.saveDatabase();
        return newPrompt;
    }

    public deletePrompt(id: string): boolean {
        const initialLength = this.data.prompts.length;
        this.data.prompts = this.data.prompts.filter(p => p.id !== id);
        
        if (this.data.prompts.length < initialLength) {
            this.saveDatabase();
            return true;
        }
        return false;
    }

    public getPrompt(id: string): Prompt | null {
        return this.data.prompts.find(p => p.id === id) || null;
    }

    public listPrompts(limit: number = 50, offset: number = 0, categoryId?: string): PromptWithCategory[] {
        let filteredPrompts = this.data.prompts;

        if (categoryId) {
            filteredPrompts = filteredPrompts.filter(p => p.categoryId === categoryId);
        }

        // Sort by updated_at DESC
        filteredPrompts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        // Apply pagination
        const paginatedPrompts = filteredPrompts.slice(offset, offset + limit);

        // Add category names
        return paginatedPrompts.map(prompt => {
            const category = this.data.categories.find(c => c.id === prompt.categoryId);
            return {
                ...prompt,
                categoryName: category?.name || 'Unknown'
            };
        });
    }

    public searchPrompts(searchQuery: string, limit: number = 50, categoryId?: string): PromptWithCategory[] {
        if (!searchQuery.trim()) {
            return this.listPrompts(limit, 0, categoryId);
        }

        const query = searchQuery.toLowerCase();
        
        let filteredPrompts = this.data.prompts.filter(prompt => {
            const titleMatch = prompt.title.toLowerCase().includes(query);
            const bodyMatch = prompt.body.toLowerCase().includes(query);
            return titleMatch || bodyMatch;
        });

        if (categoryId) {
            filteredPrompts = filteredPrompts.filter(p => p.categoryId === categoryId);
        }

        // Sort by relevance (title matches first) then by updated_at
        filteredPrompts.sort((a, b) => {
            const aTitle = a.title.toLowerCase().includes(query);
            const bTitle = b.title.toLowerCase().includes(query);
            
            if (aTitle && !bTitle) {
                return -1;
            }
            if (!aTitle && bTitle) {
                return 1;
            }
            
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        // Apply limit
        const limitedPrompts = filteredPrompts.slice(0, limit);

        // Add category names
        return limitedPrompts.map(prompt => {
            const category = this.data.categories.find(c => c.id === prompt.categoryId);
            return {
                ...prompt,
                categoryName: category?.name || 'Unknown'
            };
        });
    }

    public upsertCategory(category: Partial<Category> & { name: string }): Category {
        const id = category.id || uuidv4();
        
        // Check if category with same name already exists
        const existing = this.data.categories.find(c => c.name === category.name);
        if (existing && existing.id !== id) {
            return existing;
        }

        const existingIndex = this.data.categories.findIndex(c => c.id === id);
        const newCategory: Category = { id, name: category.name };

        if (existingIndex >= 0) {
            this.data.categories[existingIndex] = newCategory;
        } else {
            this.data.categories.push(newCategory);
        }

        this.saveDatabase();
        return newCategory;
    }

    public deleteCategory(id: string): { success: boolean; error?: string } {
        // Check if category is in use
        const promptCount = this.data.prompts.filter(p => p.categoryId === id).length;
        
        if (promptCount > 0) {
            return { 
                success: false, 
                error: `Cannot delete category. It is used by ${promptCount} prompt(s).` 
            };
        }

        // Don't allow deleting the last category
        if (this.data.categories.length <= 1) {
            return { 
                success: false, 
                error: 'Cannot delete the last category.' 
            };
        }

        const initialLength = this.data.categories.length;
        this.data.categories = this.data.categories.filter(c => c.id !== id);
        
        if (this.data.categories.length < initialLength) {
            this.saveDatabase();
            return { success: true };
        }
        
        return { success: false };
    }

    public listCategories(): Category[] {
        return [...this.data.categories].sort((a, b) => a.name.localeCompare(b.name));
    }

    public getCategory(id: string): Category | null {
        return this.data.categories.find(c => c.id === id) || null;
    }

    public close(): void {
        this.saveDatabase();
    }

    // Get database statistics
    public getStats(): { promptCount: number; categoryCount: number } {
        return {
            promptCount: this.data.prompts.length,
            categoryCount: this.data.categories.length
        };
    }
}
