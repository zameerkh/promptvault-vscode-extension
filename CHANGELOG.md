# Changelog

All notable changes to the "PromptVault - Developer Toolkit" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-08-17

### Published
- 🎉 **Initial release to VS Code Marketplace**
- Extension now available at: https://marketplace.visualstudio.com/items?itemName=zameerkh0696.promptvault-dev-toolkit

### Added
- Local prompt and snippet vault with categories
- Full-text search across all prompts
- Sidebar webview interface
- QuickPick command for fast prompt access
- JSON-based local storage (privacy-focused)
- Command palette integration
- Modern, responsive UI design

### Features
- ✅ Category organization system
- ✅ Real-time search functionality  
- ✅ Quick insertion into active editor
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Keyboard shortcuts support
- ✅ State persistence between sessions
- ✅ Production-ready codebase

### Technical
- Built with TypeScript for type safety
- Webpack bundling for optimized performance
- CSP-compliant webview implementation
- Comprehensive error handling
- Clean, maintainable code architecture

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