# VS Code Extension Installation Guide

The error you encountered happens when trying to install a VS Code extension in Visual Studio (the IDE). VS Code extensions must be installed in **Visual Studio Code**, not Visual Studio.

## Method 1: VS Code Command Line (Recommended)

```bash
# Install the extension directly using VS Code CLI
code --install-extension C:\Dev\Stash\PromptVault\prompt-vault-1.0.0.vsix
```

## Method 2: VS Code Extension Manager UI

1. Open **Visual Studio Code** (not Visual Studio)
2. Press `Ctrl+Shift+X` to open Extensions view
3. Click the `...` (More Actions) button in the Extensions view
4. Select "Install from VSIX..."
5. Navigate to and select: `C:\Dev\Stash\PromptVault\prompt-vault-1.0.0.vsix`
6. Click "Install"

## Method 3: PowerShell Script for Installation

Create an installation script that uses the correct VS Code CLI:

```powershell
# Install the extension using VS Code CLI
$vsixPath = "C:\Dev\Stash\PromptVault\prompt-vault-1.0.0.vsix"

Write-Host "Installing PromptVault extension in VS Code..."
& code --install-extension $vsixPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Extension installed successfully!" -ForegroundColor Green
    Write-Host "🔄 Please reload VS Code to activate the extension" -ForegroundColor Yellow
} else {
    Write-Host "❌ Installation failed" -ForegroundColor Red
}
```

## Verification

After installation, verify the extension is working:

1. Reload VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")
2. Check the Activity Bar for the PromptVault icon (should appear in the sidebar)
3. Try the command palette (`Ctrl+Shift+P`) and search for "PromptVault"

## Troubleshooting

- **VS Code not found**: Make sure VS Code is installed and `code` command is available in PATH
- **Permission issues**: Run PowerShell as Administrator if needed
- **Extension not appearing**: Try restarting VS Code completely

## Important Note

- ✅ Use **Visual Studio Code** (the lightweight editor)
- ❌ Don't use **Visual Studio** (the full IDE) - it won't work for VS Code extensions
