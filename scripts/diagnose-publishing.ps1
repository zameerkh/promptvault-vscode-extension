# VS Code Publishing Diagnostics Script
# This script helps diagnose publishing authentication issues

param(
    [Parameter(Mandatory=$false)]
    [string]$PAT = $env:VSCE_PAT,
    
    [Parameter(Mandatory=$false)]
    [string]$Publisher = "zameerkh2932"
)

Write-Host "🔍 VS Code Publishing Diagnostics" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue
Write-Host ""

# Check if PAT is available
if (-not $PAT) {
    Write-Host "❌ No Personal Access Token found" -ForegroundColor Red
    Write-Host "Set VSCE_PAT environment variable or use -PAT parameter"
    exit 1
}

Write-Host "✅ PAT Token available (length: $($PAT.Length))" -ForegroundColor Green
Write-Host ""

# Test vsce commands
Write-Host "🔧 Testing vsce commands..." -ForegroundColor Yellow

# 1. Test PAT verification
Write-Host "1. Testing PAT verification..." -ForegroundColor Cyan
try {
    $verifyResult = vsce verify-pat $Publisher --pat $PAT 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PAT verification: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "   ❌ PAT verification: FAILED" -ForegroundColor Red
        Write-Host "   Error: $verifyResult" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ PAT verification: EXCEPTION" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Test extension show
Write-Host "`n2. Testing extension visibility..." -ForegroundColor Cyan
try {
    $showResult = vsce show "$Publisher.prompt-vault" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Extension visible: SUCCESS" -ForegroundColor Green
        # Extract version info
        $versionMatch = $showResult | Select-String "Version:\s+(.+)"
        if ($versionMatch) {
            Write-Host "   📊 Current marketplace version: $($versionMatch.Matches[0].Groups[1].Value)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Extension visibility: FAILED" -ForegroundColor Red
        Write-Host "   Error: $showResult" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Extension visibility: EXCEPTION" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test publishers list
Write-Host "`n3. Testing publisher access..." -ForegroundColor Cyan
try {
    $listResult = vsce ls-publishers 2>&1
    Write-Host "   📝 Available publishers: $listResult" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Publisher list: EXCEPTION" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Analyze package.json
Write-Host "`n4. Analyzing package.json..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-Host "   📦 Package name: $($packageJson.name)" -ForegroundColor Yellow
        Write-Host "   📦 Package version: $($packageJson.version)" -ForegroundColor Yellow
        Write-Host "   📦 Package publisher: $($packageJson.publisher)" -ForegroundColor Yellow
        
        if ($packageJson.publisher -eq $Publisher) {
            Write-Host "   ✅ Publisher ID matches parameter" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Publisher ID mismatch: package.json has '$($packageJson.publisher)', parameter is '$Publisher'" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Failed to parse package.json" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
}

# 5. Test raw publish attempt with verbose output
Write-Host "`n5. Testing publish with verbose output..." -ForegroundColor Cyan
Write-Host "   (This will attempt to publish and show detailed error info)" -ForegroundColor Gray

try {
    Write-Host "   Running: vsce publish --pat [REDACTED] --no-git-tag-version" -ForegroundColor Gray
    $publishResult = vsce publish --pat $PAT --no-git-tag-version 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Publish test: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Publish test: FAILED" -ForegroundColor Red
        Write-Host "   Full error output:" -ForegroundColor Red
        Write-Host $publishResult -ForegroundColor Red
        
        # Analyze error patterns
        if ($publishResult -match "401|unauthorized|authentication") {
            Write-Host "`n   💡 DIAGNOSIS: Authentication Error" -ForegroundColor Yellow
            Write-Host "   Possible causes:" -ForegroundColor Yellow
            Write-Host "   - PAT doesn't have Marketplace permissions" -ForegroundColor Yellow
            Write-Host "   - PAT was created in wrong Azure DevOps organization" -ForegroundColor Yellow
            Write-Host "   - Publisher ownership mismatch" -ForegroundColor Yellow
        }
        
        if ($publishResult -match "version") {
            Write-Host "`n   💡 DIAGNOSIS: Version Issue" -ForegroundColor Yellow
            Write-Host "   - Version might already exist in marketplace" -ForegroundColor Yellow
            Write-Host "   - Try bumping version number" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ Publish test: EXCEPTION" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Show recommendations
Write-Host "`n📋 RECOMMENDATIONS" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Blue

Write-Host "Based on the PAT URL you mentioned (dev.azure.com/zameerkh0696):" -ForegroundColor Yellow
Write-Host "1. Your PAT was created in Azure DevOps org: 'zameerkh0696'" -ForegroundColor Yellow
Write-Host "2. Your VS Code publisher is: '$Publisher'" -ForegroundColor Yellow
Write-Host "3. This mismatch might cause authentication issues" -ForegroundColor Yellow

Write-Host "`nPossible solutions:" -ForegroundColor Cyan
Write-Host "A. Create a new PAT in the correct Azure DevOps organization" -ForegroundColor White
Write-Host "B. Transfer publisher ownership to match PAT organization" -ForegroundColor White  
Write-Host "C. Continue using manual upload (which works)" -ForegroundColor White

Write-Host "`n🎉 Since manual upload works, your extension is successfully published!" -ForegroundColor Green
Write-Host "CLI publishing is a convenience feature - manual upload is perfectly valid." -ForegroundColor Green
