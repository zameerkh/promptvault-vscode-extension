# Scripts

This folder contains utility scripts for the PromptVault VS Code Extension.

## PowerShell Scripts

### Publishing & Distribution
- **[publish.ps1](publish.ps1)** - Main publishing script with marketplace upload
- **[publish.bat](publish.bat)** - Batch wrapper for publishing script
- **[install.ps1](install.ps1)** - Local installation script

### Diagnostics & Testing
- **[diagnose-publishing.ps1](diagnose-publishing.ps1)** - Diagnose publishing issues
- **[diagnose.ps1](diagnose.ps1)** - General diagnostic script
- **[test-token.ps1](test-token.ps1)** - Test marketplace token validity

## Usage

All scripts should be run from the project root directory:

```powershell
# From project root
.\scripts\publish.ps1 -PAT "your-token-here"
.\scripts\install.ps1
.\scripts\test-token.ps1 -PAT "your-token-here"
```

## Note

These scripts are **legacy utilities**. The project now uses **GitHub Actions** for automated CI/CD. 

See [GitHub Actions Documentation](../docs/GITHUB_ACTIONS.md) for the modern automated workflow.
