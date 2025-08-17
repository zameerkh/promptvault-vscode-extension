# Changelog

All notable changes to the PromptVault VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-17

### Added
- 🎉 Initial release of PromptVault
- 🏪 Local JSON-based storage for prompts and categories  
- 🔍 Real-time search with debounced input filtering
- 📁 Category-based organization system
- ⚡ Quick insertion via sidebar "Insert" buttons
- 🎮 Command palette integration for prompt selection
- 🎨 Modern webview interface with VS Code theming
- 💾 Auto-save functionality for all changes
- 🚀 Optimized performance with efficient rendering
- 📖 Comprehensive documentation and README
- 🛠️ TypeScript throughout for type safety
- ✅ Production-ready code with clean architecture

### Features
- **Local Storage**: All data stored in VS Code global storage (no cloud dependencies)
- **Categories**: Create and manage custom categories for organization
- **Search**: Live search across prompt titles and content
- **Quick Insert**: One-click insertion from sidebar or command palette
- **Responsive UI**: Clean, accessible interface that matches VS Code themes
- **Cross-Platform**: JSON storage ensures compatibility across operating systems

### Developer Experience
- TypeScript implementation throughout
- Webpack bundling for optimized performance
- ESLint configuration for code quality
- Comprehensive project structure
- MIT License for open source collaboration

### Commands
- `PromptVault: Open` - Opens the sidebar panel
- `PromptVault: Insert Prompt` - Opens quick pick selection
- `PromptVault: Refresh` - Refreshes the prompt list

## [Unreleased]

### Planned Features
- Import/Export functionality
- Prompt templates with variables
- Syntax highlighting for code snippets  
- Tags and advanced filtering
- Keyboard shortcuts customization
- Bulk operations (delete, move categories)