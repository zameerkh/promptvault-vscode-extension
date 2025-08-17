# PromptVault

A powerful VS Code extension for managing and organizing your code prompts, snippets, and templates. Keep your frequently used code patterns, AI prompts, and development snippets organized and easily accessible.

## 🚀 Features

- **📁 Category Organization**: Organize prompts into categories for easy management
- **🔍 Powerful Search**: Full-text search across all prompts and categories
- **⚡ Quick Access**: Access prompts via command palette and sidebar
- **💾 Local Storage**: All data stored locally on your machine
- **🔒 Privacy First**: No cloud storage, your prompts stay private
- **⌨️ Keyboard Shortcuts**: Quick insertion with keyboard shortcuts
- **🎨 Clean UI**: Intuitive sidebar interface with modern design

## 📦 Installation

### From VS Code Marketplace (Coming Soon)
1. Open Visual Studio Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "PromptVault"
4. Click Install

### Manual Installation (Current Version)
1. Download the latest `.vsix` file from the [releases page](https://github.com/zameerkh0696/promptvault-vscode-extension/releases)
2. Open Visual Studio Code
3. Press `Ctrl+Shift+P` to open Command Palette
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file

### Command Line Installation
```bash
# Install directly using VS Code CLI
code --install-extension prompt-vault-1.0.0.vsix
```

### Using the Installation Script (Developers)
```powershell
# Run the automated installation script
.\install.ps1
```

## 🎯 Usage

### Getting Started
1. After installation, look for the PromptVault icon in the Activity Bar (sidebar)
2. Click the icon to open the PromptVault panel
3. Create your first category using the "+" button next to "Categories"
4. Add your first prompt using the "New Prompt" button

### Creating Categories
1. Click the "+" button next to "Categories" in the sidebar
2. Enter a category name (e.g., "React Components", "SQL Queries", "AI Prompts")
3. Click "Save"

### Adding Prompts
1. Click "New Prompt" button in the sidebar
2. Fill in the prompt details:
   - **Title**: A descriptive name for your prompt
   - **Body**: The actual prompt/snippet content
   - **Category**: Select from your created categories
3. Click "Save"

### Using Prompts
- **Insert**: Click the "Insert" button to add the prompt to your active editor
- **Edit**: Modify existing prompts with the "Edit" button
- **Delete**: Remove unwanted prompts with the "Delete" button

### Search and Filter
- Use the search box to find prompts by title or content
- Filter by category using the category dropdown
- Search results update in real-time as you type

### Command Palette Access
Press `Ctrl+Shift+P` and search for:
- `PromptVault: Show Quick Pick` - Browse and insert prompts quickly
- `PromptVault: Focus` - Open the PromptVault sidebar

## 🔧 Development

### Prerequisites
- Node.js (v16 or higher)
- VS Code
- TypeScript

### Setup
```bash
# Clone the repository
git clone https://github.com/zameerkh0696/promptvault-vscode-extension.git
cd promptvault-vscode-extension

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
npm run package
```

### Testing
```bash
# Run in development mode
npm run watch

# Open in Extension Development Host
# Press F5 in VS Code with the project open
```

### Publishing
```powershell
# Package only
.\publish.ps1 -PackageOnly

# Package and publish to marketplace
.\publish.ps1 -PAT "your-personal-access-token"
```

## 📁 Project Structure

```
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── db.ts            # Data storage and retrieval
│   └── panel.ts         # Webview provider for sidebar UI
├── media/
│   ├── webview.html     # Sidebar UI template
│   ├── webview.js       # Frontend JavaScript
│   ├── webview.css      # Styling
│   └── logo.svg         # Extension icon
├── package.json         # Extension manifest
├── webpack.config.js    # Build configuration
└── publish.ps1         # Publishing automation script
```

## 🛠️ Configuration

PromptVault stores data locally using VS Code's built-in storage. No additional configuration required.

### Data Location
- **Windows**: `%APPDATA%\Code\User\globalStorage\zameerkh0696.prompt-vault`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/zameerkh0696.prompt-vault`
- **Linux**: `~/.config/Code/User/globalStorage/zameerkh0696.prompt-vault`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues and Support

If you encounter any issues or have suggestions:

1. Check the [Issues page](https://github.com/zameerkh0696/promptvault-vscode-extension/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - VS Code version
   - Operating system

## 🚀 Roadmap

- [ ] Export/Import functionality
- [ ] Syntax highlighting for code snippets
- [ ] Template variables and placeholders
- [ ] Shared team vaults
- [ ] Integration with popular AI services
- [ ] Custom keyboard shortcuts
- [ ] Bulk operations (import/export)

## 📊 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ for developers who love organized workflows**
