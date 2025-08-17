# Publisher and Token Diagnostic Script
# Run this to check your current setup

Write-Host "🔍 PromptVault Publisher & Token Diagnostics" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check package.json publisher
Write-Host "📋 Current Configuration:" -ForegroundColor Green
if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "   Package Name: $($packageContent.name)"
    Write-Host "   Version: $($packageContent.version)"
    Write-Host "   Publisher: $($packageContent.publisher)"
    Write-Host ""
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
}

# Check if vsce is available
Write-Host "🔧 Tools Check:" -ForegroundColor Green
try {
    $vsceVersion = vsce --version 2>$null
    Write-Host "   ✅ vsce available (version: $vsceVersion)"
} catch {
    Write-Host "   ❌ vsce not found" -ForegroundColor Red
}

# Check PAT environment variable
Write-Host "🔑 Token Check:" -ForegroundColor Green
if ($env:VSCE_PAT) {
    $tokenLength = $env:VSCE_PAT.Length
    $maskedToken = "*" * ($tokenLength - 8) + $env:VSCE_PAT.Substring($tokenLength - 4)
    Write-Host "   ✅ PAT environment variable set (ending in: $($env:VSCE_PAT.Substring($tokenLength - 4)))"
} else {
    Write-Host "   ⚠️  No VSCE_PAT environment variable set" -ForegroundColor Yellow
}

# Try to list publishers
Write-Host "🏢 Publisher Check:" -ForegroundColor Green
if ($env:VSCE_PAT) {
    try {
        Write-Host "   Attempting to list publishers..." -ForegroundColor Gray
        $publishers = vsce ls-publishers 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Successfully connected to marketplace"
            if ($publishers) {
                Write-Host "   Publishers found:"
                $publishers | ForEach-Object { Write-Host "     - $_" }
            } else {
                Write-Host "   ⚠️  No publishers found for this account" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ Failed to connect: $publishers" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Error checking publishers: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Cannot check publishers without PAT" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Go to https://marketplace.visualstudio.com/manage to check/create publisher"
Write-Host "2. Go to https://dev.azure.com → Profile → Security → Personal access tokens"
Write-Host "3. Create PAT with 'Marketplace (Manage)' permissions"
Write-Host "4. Update publisher in package.json if needed"
Write-Host "5. Set PAT: `$env:VSCE_PAT = 'your-token-here'"
Write-Host ""

# Pause so user can read
Read-Host "Press Enter to continue..."
