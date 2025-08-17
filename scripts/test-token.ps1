# Token and Publisher Verification Script

Write-Host "🔐 Testing Publisher and Token Setup" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue
Write-Host ""

# Check current configuration
Write-Host "📋 Current Configuration:" -ForegroundColor Green
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "   Publisher ID: $($packageJson.publisher)"
Write-Host "   Extension Name: $($packageJson.name)"
Write-Host "   Version: $($packageJson.version)"
Write-Host ""

# Test token with vsce
Write-Host "🧪 Testing Token Authentication..." -ForegroundColor Yellow

if (-not $env:VSCE_PAT) {
    Write-Host "   ❌ No VSCE_PAT environment variable set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: `$env:VSCE_PAT = 'your-token-here'" -ForegroundColor Gray
    exit 1
}

Write-Host "   Token length: $($env:VSCE_PAT.Length) characters"
Write-Host "   Token ending: ...$($env:VSCE_PAT.Substring($env:VSCE_PAT.Length - 4))"

# Test basic authentication
Write-Host "   Testing authentication..." -ForegroundColor Gray
try {
    $result = vsce ls-publishers 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Token authentication successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Token authentication failed: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error testing token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Verify your PAT was created at: https://dev.azure.com/zameerkh0696/" -ForegroundColor Gray
Write-Host "2. Check PAT permissions include 'Marketplace (Manage)'" -ForegroundColor Gray  
Write-Host "3. Verify publisher exists at: https://marketplace.visualstudio.com/manage/publishers/zameerkh0696" -ForegroundColor Gray
Write-Host ""

# Show the exact URLs to check
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   Publisher Management: https://marketplace.visualstudio.com/manage/publishers/zameerkh0696"
Write-Host "   Azure DevOps PAT: https://dev.azure.com/zameerkh0696/_usersSettings/tokens"
Write-Host "   Organization Settings: https://dev.azure.com/zameerkh0696/_settings/"
