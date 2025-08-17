# PromptVault Extension Publisher Script
# This script handles the complete publishing process for the VS Code extension

param(
    [Parameter(Mandatory=$false)]
    [string]$PAT,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("patch", "minor", "major", "package-only")]
    [string]$VersionBump = "patch",
    
    [Parameter(Mandatory=$false)]
    [switch]$PackageOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
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

function Test-Prerequisites {
    Write-Info "🔍 Checking prerequisites..."
    
    # Check if vsce is installed
    try {
        $vsceVersion = vsce --version 2>$null
        Write-Success "✅ vsce is installed (version: $vsceVersion)"
    } catch {
        Write-Error "❌ vsce is not installed. Install it with: npm install -g @vscode/vsce"
        return $false
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Error "❌ package.json not found. Are you in the correct directory?"
        return $false
    }
    
    # Check if TypeScript compiles
    Write-Info "🔨 Checking TypeScript compilation..."
    try {
        $compileResult = npm run compile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ TypeScript compilation successful"
        } else {
            Write-Error "❌ TypeScript compilation failed:"
            Write-Host $compileResult
            return $false
        }
    } catch {
        Write-Error "❌ Failed to run TypeScript compilation"
        return $false
    }
    
    return $true
}

function Get-PackageInfo {
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        return @{
            Name = $packageJson.name
            Version = $packageJson.version
            Publisher = $packageJson.publisher
            DisplayName = $packageJson.displayName
        }
    } catch {
        Write-Error "❌ Failed to read package.json"
        return $null
    }
}

function Test-AzureDevOpsStatus {
    Write-Info "🌐 Checking Azure DevOps Services status..."
    try {
        $response = Invoke-WebRequest -Uri "https://dev.azure.com" -Method Head -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Azure DevOps Services is available"
            return $true
        }
    } catch {
        Write-Warning "⚠️  Azure DevOps Services may be unavailable"
        Write-Warning "    You can still package the extension for manual upload"
        return $false
    }
    return $false
}

function Invoke-Package {
    Write-Info "📦 Packaging extension..."
    try {
        $packageResult = vsce package 2>&1
        if ($LASTEXITCODE -eq 0) {
            # Extract the .vsix filename from output
            $vsixMatch = $packageResult | Select-String "Packaged: (.+\.vsix)"
            if ($vsixMatch) {
                $vsixPath = $vsixMatch.Matches[0].Groups[1].Value
                Write-Success "✅ Extension packaged successfully: $(Split-Path -Leaf $vsixPath)"
                return $vsixPath
            } else {
                Write-Success "✅ Extension packaged successfully"
                # Try to find .vsix file in current directory
                $vsixFiles = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending
                if ($vsixFiles.Count -gt 0) {
                    return $vsixFiles[0].FullName
                }
            }
        } else {
            Write-Error "❌ Packaging failed:"
            Write-Host $packageResult
            return $null
        }
    } catch {
        Write-Error "❌ Failed to package extension: $($_.Exception.Message)"
        return $null
    }
}

function Invoke-Publish {
    param([string]$PersonalAccessToken, [string]$Version)
    
    Write-Info "🚀 Publishing to VS Code Marketplace..."
    
    # Get package info for error messages
    $packageInfo = Get-PackageInfo
    
    # Set environment variable if PAT provided
    if ($PersonalAccessToken) {
        $env:VSCE_PAT = $PersonalAccessToken
        Write-Info "📝 Using provided Personal Access Token"
    } elseif (-not $env:VSCE_PAT) {
        Write-Error "❌ No Personal Access Token provided. Set VSCE_PAT environment variable or use -PAT parameter"
        return $false
    }
    
    try {
        if ($Version -and $Version -ne "package-only") {
            $publishResult = vsce publish $Version --pat $env:VSCE_PAT 2>&1
        } else {
            $publishResult = vsce publish --pat $env:VSCE_PAT 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ Extension published successfully!"
            Write-Info "🎉 Your extension is now available on the VS Code Marketplace"
            return $true
        } else {
            Write-Error "❌ Publishing failed:"
            Write-Host $publishResult
            
            # Check for common errors and provide suggestions
            if ($publishResult -match "401|unauthorized") {
                Write-Warning "💡 This looks like an authentication error. Check:"
                Write-Warning "   - Your Personal Access Token is valid and not expired"
                Write-Warning "   - Your publisher name in package.json matches your Azure DevOps organization"
                Write-Warning "   - Your PAT has 'Marketplace (Manage)' permissions"
                Write-Warning "   - Your publisher account exists: https://marketplace.visualstudio.com/manage"
                Write-Host ""
                Write-Info "🔧 To create publisher account:"
                Write-Host "1. Visit: https://marketplace.visualstudio.com/manage"
                Write-Host "2. Sign in with your Azure DevOps account"
                Write-Host "3. Click 'Create new publisher'"
                Write-Host "4. Use publisher ID: $($packageInfo.Publisher)"
            }
            
            return $false
        }
    } catch {
        Write-Error "❌ Failed to publish extension: $($_.Exception.Message)"
        return $false
    }
}

function Show-ManualUploadInstructions {
    param([string]$VsixPath)
    
    Write-Warning "📋 Manual Upload Instructions:"
    Write-Host ""
    Write-Host "1. Go to: https://marketplace.visualstudio.com/manage"
    Write-Host "2. Sign in with your Azure DevOps account"
    Write-Host "3. Click 'New extension' → 'Visual Studio Code'"
    Write-Host "4. Upload the file: $(Split-Path -Leaf $VsixPath)"
    Write-Host ""
    Write-Info "💡 Keep this .vsix file for manual distribution or testing"
}

function Show-Summary {
    param($PackageInfo, [string]$VsixPath, [bool]$Published)
    
    Write-Host ""
    Write-ColorOutput "📊 PUBLISHING SUMMARY" $BLUE
    Write-Host "======================="
    Write-Host "Extension: $($PackageInfo.DisplayName) ($($PackageInfo.Name))"
    Write-Host "Version: $($PackageInfo.Version)"
    Write-Host "Publisher: $($PackageInfo.Publisher)"
    
    if ($VsixPath) {
        Write-Host "Package: $(Split-Path -Leaf $VsixPath)"
        Write-Host "Size: $([math]::Round((Get-Item $VsixPath).Length / 1KB, 2)) KB"
    }
    
    if ($Published) {
        Write-Success "Status: ✅ Published to Marketplace"
        Write-Host "URL: https://marketplace.visualstudio.com/items?itemName=$($PackageInfo.Publisher).$($PackageInfo.Name)"
    } else {
        Write-Warning "Status: 📦 Packaged (ready for manual upload)"
    }
    Write-Host ""
}

# Main execution
Write-ColorOutput "🚀 PromptVault Extension Publisher" $BLUE
Write-Host "=================================="

# Check prerequisites
if (-not (Test-Prerequisites)) {
    exit 1
}

# Get package information
$packageInfo = Get-PackageInfo
if (-not $packageInfo) {
    exit 1
}

Write-Info "📋 Extension Info:"
Write-Host "   Name: $($packageInfo.DisplayName) ($($packageInfo.Name))"
Write-Host "   Version: $($packageInfo.Version)"
Write-Host "   Publisher: $($packageInfo.Publisher)"
Write-Host ""

# Package the extension
$vsixPath = Invoke-Package
if (-not $vsixPath) {
    Write-Error "❌ Failed to package extension. Aborting."
    exit 1
}

# If package-only requested, stop here
if ($PackageOnly -or $VersionBump -eq "package-only") {
    Write-Success "✅ Package-only mode completed"
    Show-ManualUploadInstructions $vsixPath
    Show-Summary $packageInfo $vsixPath $false
    exit 0
}

# Check Azure DevOps status
$azureAvailable = Test-AzureDevOpsStatus

if (-not $azureAvailable -and -not $Force) {
    Write-Warning "⚠️  Azure DevOps Services appears to be unavailable."
    Write-Warning "    Use -Force to attempt publishing anyway, or use manual upload."
    Show-ManualUploadInstructions $vsixPath
    Show-Summary $packageInfo $vsixPath $false
    exit 0
}

# Attempt to publish
$published = Invoke-Publish -PersonalAccessToken $PAT -Version $VersionBump

if (-not $published) {
    Write-Warning "📋 Publishing failed, but you can upload manually:"
    Show-ManualUploadInstructions $vsixPath
}

# Show final summary
Show-Summary $packageInfo $vsixPath $published

if ($published) {
    Write-Success "🎉 Publishing completed successfully!"
    exit 0
} else {
    Write-Warning "⚠️  Extension packaged but not published"
    exit 1
}
