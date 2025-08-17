# PromptVault - Architecture & Design

This document explains the technical architecture, design decisions, and implementation details of the PromptVault VS Code extension.

## 🏗️ Architecture Overview

PromptVault follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                   │
├─────────────────────────────────────────────────────────────┤
│                     Extension Context                       │
├─────────────────┬───────────────┬───────────────────────────┤
│   extension.ts  │    panel.ts   │         db.ts             │
│   (Main Entry)  │ (UI Provider) │   (Data Layer)           │
└─────────────────┴───────────────┴───────────────────────────┘
         │                │                    │
         │                │                    │
         ▼                ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Command Palette │ │ Webview Sidebar │ │ JSON File Store │
│   Quick Pick    │ │   (HTML/CSS/JS) │ │ (globalStorage) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 📁 Project Structure

```
src/
├── extension.ts          # Extension activation & command registration
├── panel.ts             # Webview provider & UI logic
└── db.ts               # Data persistence & retrieval

media/
├── webview.html        # Sidebar UI template
├── webview.js         # Frontend JavaScript logic
├── webview.css        # Styling and themes
└── logo.svg          # Extension icon

package.json           # Extension manifest & configuration
webpack.config.js      # Build & bundling configuration
tsconfig.json         # TypeScript compiler settings
```

## 🔧 Core Components

### 1. Extension Entry Point (`extension.ts`)

**Purpose**: Main extension lifecycle management
- Extension activation/deactivation
- Command registration
- Database initialization
- UI provider registration

**Key Functions**:
```typescript
export function activate(context: vscode.ExtensionContext) {
    // Initialize database
    const db = new PromptDB(context.globalStorageUri);
    
    // Register webview provider
    const provider = new PromptVaultViewProvider(context, db);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('promptVault', provider)
    );
    
    // Register commands
    registerCommands(context, db);
}
```

### 2. Data Layer (`db.ts`)

**Purpose**: Data persistence and retrieval using JSON file storage
- CRUD operations for prompts and categories
- Search functionality
- File-based storage using VS Code's globalStorage

**Design Decisions**:
- **JSON over SQLite**: Simpler deployment, no native dependencies
- **File-based storage**: Uses VS Code's globalStorage for cross-platform compatibility
- **In-memory caching**: Fast access with file persistence
- **UUID-based IDs**: Unique identifiers for prompts and categories

**Data Schema**:
```typescript
interface Prompt {
    id: string;           // UUID
    title: string;        // User-friendly name
    body: string;         // Prompt content
    categoryId: string;   // Reference to category
    createdAt: Date;      // Creation timestamp
    updatedAt: Date;      // Last modified timestamp
}

interface Category {
    id: string;           // UUID
    name: string;         // Category name
    createdAt: Date;      // Creation timestamp
}
```

### 3. UI Provider (`panel.ts`)

**Purpose**: Webview management and extension-webview communication
- Webview lifecycle management
- Message passing between extension and UI
- Data serialization for webview consumption

**Communication Flow**:
```
Extension ←──→ Panel ←──→ Webview
          JSON Messages  postMessage
```

**Message Types**:
- `search` - Search prompts with query and filters
- `createPrompt` - Add new prompt
- `updatePrompt` - Modify existing prompt
- `deletePrompt` - Remove prompt
- `createCategory` - Add new category
- `insert` - Insert prompt into active editor

### 4. Frontend (`webview.js`)

**Purpose**: User interface logic and interaction handling
- Dynamic UI rendering
- Form handling
- Search and filtering
- State management

**Key Features**:
- **Real-time search** with debounced input
- **Category filtering** with dropdown selection
- **Modal dialogs** for prompt/category creation
- **State persistence** using VS Code's webview state API

## 🗄️ Data Storage

### Storage Location
- **Windows**: `%APPDATA%\Code\User\globalStorage\zameerkh0696.promptvault-dev-toolkit\`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/zameerkh0696.promptvault-dev-toolkit/`
- **Linux**: `~/.config/Code/User/globalStorage/zameerkh0696.promptvault-dev-toolkit/`

### File Structure
```
globalStorage/
├── prompts.json        # All prompt data
├── categories.json     # Category definitions
└── metadata.json       # Extension metadata (version, etc.)
```

### Data Flow
1. **Read**: JSON files → Parse → In-memory objects
2. **Write**: In-memory objects → Stringify → JSON files
3. **Search**: In-memory filtering with text matching
4. **Backup**: Automatic file system persistence

## 🎨 UI/UX Design

### Design Principles
- **Minimal and Clean**: Focus on content, reduce visual clutter
- **VS Code Integration**: Match VS Code's native look and feel
- **Keyboard Friendly**: Support keyboard navigation and shortcuts
- **Responsive**: Adapt to different sidebar widths

### Theme Support
- **Light Theme**: Light backgrounds, dark text
- **Dark Theme**: Dark backgrounds, light text
- **High Contrast**: Enhanced contrast for accessibility
- **Custom CSS Variables**: Easy theme customization

### Component Hierarchy
```
PromptVault Panel
├── Search Input
├── Category Filter
├── Action Buttons (New Prompt, New Category)
├── Prompt List
│   └── Prompt Item
│       ├── Title & Category
│       ├── Body Preview
│       └── Actions (Insert, Edit, Delete)
└── Modal Dialogs
    ├── Prompt Dialog
    └── Category Dialog
```

## 🔍 Search Implementation

### Search Algorithm
1. **Text Matching**: Case-insensitive substring search
2. **Multi-field Search**: Search across title, body, and category
3. **Real-time Results**: Debounced input for performance
4. **Category Filtering**: Additional filter by category selection

### Search Flow
```typescript
searchPrompts(query: string, categoryId?: string) {
    return this.prompts.filter(prompt => {
        const matchesText = !query || 
            prompt.title.toLowerCase().includes(query.toLowerCase()) ||
            prompt.body.toLowerCase().includes(query.toLowerCase());
        
        const matchesCategory = !categoryId || 
            prompt.categoryId === categoryId;
            
        return matchesText && matchesCategory;
    });
}
```

## 🚀 Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load data on demand
- **Debounced Search**: Reduce search frequency during typing
- **In-memory Caching**: Keep frequently accessed data in memory
- **Efficient DOM Updates**: Update only changed elements

### Memory Management
- **JSON Parsing**: Parse files only when needed
- **Event Cleanup**: Proper event listener cleanup
- **Webview Disposal**: Clean up webview resources

## 🔒 Security

### Content Security Policy
- **Strict CSP**: Only allow necessary script sources
- **Nonce-based Scripts**: Secure inline script execution
- **No External Resources**: All assets bundled locally

### Data Privacy
- **Local Storage**: No cloud storage or external APIs
- **No Telemetry**: No usage data collection
- **Sandboxed Webview**: Isolated execution environment

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full workflow testing
- **Manual Testing**: User experience validation

### Test Structure
```
tests/
├── unit/
│   ├── db.test.ts
│   ├── panel.test.ts
│   └── extension.test.ts
├── integration/
│   └── workflow.test.ts
└── fixtures/
    └── sample-data.json
```

## 📦 Build & Deployment

### Build Pipeline
1. **TypeScript Compilation** (`tsc`)
2. **Webpack Bundling** (production optimization)
3. **Asset Processing** (CSS, HTML, SVG)
4. **Extension Packaging** (`vsce package`)

### Webpack Configuration
- **Entry Points**: Extension and webview code
- **Externals**: VS Code API excluded from bundle
- **Optimization**: Minification and tree-shaking
- **Source Maps**: Debug support in development

## 🔄 Future Architecture Considerations

### Scalability Improvements
- **Database Migration**: Consider SQLite for larger datasets
- **Plugin System**: Allow third-party integrations
- **Cloud Sync**: Optional cloud backup and sync
- **Team Collaboration**: Shared prompt repositories

### Performance Enhancements
- **Virtual Scrolling**: Handle large prompt lists
- **Web Workers**: Move heavy operations off main thread
- **Caching Layer**: Smart caching for frequently accessed data
- **Compression**: Compress stored data for space efficiency

---

This architecture provides a solid foundation for the PromptVault extension while maintaining simplicity and extensibility for future enhancements.
