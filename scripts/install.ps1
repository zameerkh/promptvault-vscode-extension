# PromptVault Extension Installer Script
# This script installs the PromptVault extension in VS Code

param(
    [Parameter(Mandatory=$false)]
    [string]$VsixPath
)

# Colors for output
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$RESET = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color)
    Write-Host "$Color$Message$RESET"
}

function Write-Success { param([string]$Message) Write-ColorOutput $Message $GREEN }
function Write-Error { param([string]$Message) Write-ColorOutput $Message $RED }
function Write-Warning { param([string]$Message) Write-ColorOutput $Message $YELLOW }
function Write-Info { param([string]$Message) Write-ColorOutput $Message $BLUE }

Write-ColorOutput "🚀 PromptVault Extension Installer" $BLUE
Write-Host "===================================="

# Find the VSIX file if not provided
if (-not $VsixPath) {
    Write-Info "🔍 Looking for .vsix file..."
    $vsixFiles = Get-ChildItem -Filter "prompt-vault-*.vsix" | Sort-Object LastWriteTime -Descending
    
    if ($vsixFiles.Count -eq 0) {
        Write-Error "❌ No .vsix file found. Please run the publish script first:"
        Write-Host "   .\publish.ps1 -PackageOnly"
        exit 1
    }
    
    $VsixPath = $vsixFiles[0].FullName
    Write-Success "✅ Found: $(Split-Path -Leaf $VsixPath)"
}

# Verify the VSIX file exists
if (-not (Test-Path $VsixPath)) {
    Write-Error "❌ VSIX file not found: $VsixPath"
    exit 1
}

# Check if VS Code is available
Write-Info "🔍 Checking VS Code installation..."
try {
    $codeVersion = & code --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ VS Code is available"
        $versionLines = $codeVersion -split "`n"
        Write-Host "   Version: $($versionLines[0])"
    } else {
        throw "VS Code CLI not available"
    }
} catch {
    Write-Error "❌ VS Code CLI not found or not in PATH"
    Write-Warning "💡 Make sure VS Code is installed and the 'code' command is available"
    Write-Warning "   You can install it from: https://code.visualstudio.com/"
    Write-Warning "   During installation, make sure to check 'Add to PATH'"
    exit 1
}

# Install the extension
Write-Info "📦 Installing PromptVault extension..."
try {
    $installResult = & code --install-extension $VsixPath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Extension installed successfully!"
        Write-Info "🎉 PromptVault is now available in VS Code"
        Write-Warning "🔄 Please reload VS Code to activate the extension"
        Write-Host ""
        Write-Info "Next steps:"
        Write-Host "1. Reload VS Code (Ctrl+Shift+P → 'Developer: Reload Window')"
        Write-Host "2. Look for the PromptVault icon in the Activity Bar"
        Write-Host "3. Use Ctrl+Shift+P and search for 'PromptVault' commands"
        
        # Ask if user wants to open VS Code
        $openCode = Read-Host "`nWould you like to open VS Code now? (y/N)"
        if ($openCode -eq 'y' -or $openCode -eq 'Y') {
            Write-Info "🚀 Opening VS Code..."
            & code .
        }
    } else {
        Write-Error "❌ Installation failed:"
        Write-Host $installResult
        
        # Common error suggestions
        Write-Warning "💡 Common solutions:"
        Write-Warning "   - Try running as Administrator"
        Write-Warning "   - Make sure VS Code is not running"
        Write-Warning "   - Check if the extension is already installed"
        exit 1
    }
} catch {
    Write-Error "❌ Failed to install extension: $($_.Exception.Message)"
    exit 1
}

Write-Success "🎉 Installation completed successfully!"
