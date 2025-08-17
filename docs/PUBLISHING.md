# VS Code Extension Publishing Guide

This document provides step-by-step instructions for publishing the PromptVault VS Code extension to the Visual Studio Code Marketplace.

## Prerequisites

1. **Microsoft Account**: Same account used for Azure DevOps and VS Code Marketplace
2. **Publisher Account**: Created at https://marketplace.visualstudio.com/manage
3. **Personal Access Token (PAT)**: With Marketplace → Manage permissions
4. **vsce Tool**: Visual Studio Code Extension Manager (`npm install -g vsce` or `npm install -g @vscode/vsce`)

## Step 1: Create Personal Access Token (PAT)

### Azure DevOps Token Creation
1. Navigate to https://dev.azure.com/
2. Sign in with your Microsoft account
3. Click profile icon (top right) → **Personal access tokens**
4. Click **+ New Token**
5. Configure token settings:
   ```
   Name: VS Code Extension Publishing
   Organization: All accessible organizations
   Expiration: 90 days (or preferred duration)
   Scopes: Custom defined
   ✅ Marketplace → Manage
   ```
6. Click **Create** and copy the token immediately

### Token Security
⚠️ **Important**: Store the token securely - you won't be able to view it again.

## Step 2: Publisher Account Setup

### Create Publisher
1. Visit https://marketplace.visualstudio.com/manage
2. Sign in with the same Microsoft account
3. Create new publisher with details:
   ```
   Publisher ID: promptvault (must match package.json)
   Publisher display name: PromptVault
   Description: Creator of productivity extensions for developers
   ```

### Verify Publisher Name
The publisher name in `package.json` must exactly match your publisher ID:
```json
{
  "publisher": "promptvault"
}
```

## Step 3: Authentication Methods

### Method 1: Direct Publishing with PAT
```bash
# Set environment variable (recommended)
$env:VSCE_PAT="your-personal-access-token-here"
vsce publish --pat $env:VSCE_PAT

# Or inline (less secure)
vsce publish --pat your-personal-access-token-here
```

### Method 2: Login then Publish
```bash
# Login with publisher name
vsce login your-publisher-name
# Enter PAT when prompted

# Then publish
vsce publish
```

### Method 3: Upload .vsix File
If command-line publishing fails:
1. Package the extension: `vsce package`
2. Go to https://marketplace.visualstudio.com/manage
3. Click **New extension** → **Visual Studio Code**
4. Upload the `.vsix` file manually

## Step 4: Publishing Commands

### Build and Publish
```bash
# Ensure code is compiled
npm run compile

# Package (optional - publish does this automatically)
vsce package

# Publish to marketplace
vsce publish
```

### Version Management
```bash
# Publish with version bump
vsce publish patch    # 1.0.0 → 1.0.1
vsce publish minor    # 1.0.0 → 1.1.0  
vsce publish major    # 1.0.0 → 2.0.0

# Publish specific version
vsce publish 1.0.1
```

## Step 5: Publishing Workflow

### Pre-publish Checklist
- [ ] Code compiled successfully (`npm run compile`)
- [ ] Tests passing (if applicable)
- [ ] README.md updated with latest features
- [ ] CHANGELOG.md updated with release notes
- [ ] Version number incremented in package.json
- [ ] All files committed to Git
- [ ] Publisher name matches in package.json and marketplace

### Complete Publishing Process
```bash
# 1. Final build
npm run vscode:prepublish

# 2. Version check
vsce show promptvault.prompt-vault

# 3. Publish
vsce publish --pat your-pat-token

# 4. Verify publication
vsce show promptvault.prompt-vault
```

## Troubleshooting Common Issues

### 401 Unauthorized Error
**Cause**: Token permissions or publisher mismatch
**Solution**: 
- Verify PAT has "Marketplace → Manage" permissions
- Check publisher name matches exactly
- Ensure using the correct Microsoft account

### Publisher Not Found
**Cause**: Publisher name mismatch or doesn't exist
**Solution**:
- Create publisher at https://marketplace.visualstudio.com/manage
- Update package.json with exact publisher ID

### Version Already Exists
**Cause**: Attempting to publish same version twice
**Solution**: 
- Increment version in package.json
- Or use `vsce publish patch/minor/major`

### Token Expired
**Cause**: PAT token has expired
**Solution**:
- Create new token at https://dev.azure.com/
- Update environment variable or login again

## Step 6: Post-Publishing

### Verification Steps
1. Visit marketplace page: https://marketplace.visualstudio.com/items?itemName=promptvault.prompt-vault
2. Install extension in VS Code
3. Test core functionality
4. Monitor extension analytics and reviews

### Extension Management
```bash
# Check extension status
vsce show promptvault.prompt-vault

# Unpublish extension (if needed)
vsce unpublish promptvault.prompt-vault

# List all your extensions
vsce ls-publishers
```

## Alternative: Manual Upload Process

If command-line publishing continues to fail:

### 1. Package Extension
```bash
vsce package
# Creates: prompt-vault-1.0.0.vsix
```

### 2. Manual Upload
1. Go to https://marketplace.visualstudio.com/manage/publishers/promptvault
2. Click **New extension** → **Visual Studio Code**
3. Upload the `.vsix` file
4. Fill in any additional marketplace details
5. Click **Upload**

### 3. Marketplace Optimization
- Add extension icon (128x128 PNG)
- Add screenshots to `/images` directory
- Update description and tags
- Add Q&A and review responses

## Security Best Practices

### Token Management
- Use environment variables for PAT storage
- Set shortest acceptable expiration time
- Rotate tokens regularly
- Don't commit tokens to version control

### Publisher Account
- Enable two-factor authentication
- Use strong, unique passwords
- Regularly review access permissions
- Monitor extension download analytics

## Success Indicators

✅ **Extension Published Successfully** when you see:
```
INFO  Publishing 'promptvault.prompt-vault v1.0.0'...
DONE  Published promptvault.prompt-vault v1.0.0
```

✅ **Extension Available** on marketplace at:
`https://marketplace.visualstudio.com/items?itemName=promptvault.prompt-vault`

✅ **Installation Working** via:
- VS Code Extensions panel search
- Command line: `code --install-extension promptvault.prompt-vault`

---

## Quick Reference Commands

```bash
# Authentication
vsce login publisher-name
$env:VSCE_PAT="your-token"

# Publishing
vsce publish --pat $env:VSCE_PAT
vsce publish patch
vsce package

# Management  
vsce show extension-name
vsce unpublish extension-name
vsce ls-publishers
```

This guide covers the complete publishing process for VS Code extensions. Keep this document updated as the process evolves or new issues are discovered.

---

## Quick Start Scripts

For convenience, this project includes automated publishing scripts:

### PowerShell Script (Recommended)
```powershell
# Package and publish with patch version bump
.\publish.ps1

# Package only (no publishing)
.\publish.ps1 -PackageOnly

# Publish with specific version bump
.\publish.ps1 -VersionBump minor -PAT "your-token-here"

# Force publish even if Azure DevOps seems unavailable
.\publish.ps1 -Force -PAT "your-token-here"
```

### Batch File (Windows)
```batch
# Simple publish
publish.bat

# Package only
publish.bat --package-only

# With custom options
publish.bat --pat "your-token-here" --version minor

# Force publish
publish.bat --force
```

### Script Features
- ✅ Automatic prerequisite checking (vsce installation, TypeScript compilation)
- ✅ Azure DevOps service status verification
- ✅ Intelligent error handling with helpful suggestions
- ✅ Colored output for better readability
- ✅ Automatic fallback to manual upload instructions
- ✅ Comprehensive publishing summary

### Current Status
- ✅ Extension packaged successfully: `prompt-vault-1.0.0.vsix`
- ⚠️  Azure DevOps Services status: Check with scripts
- 📦 Ready for automated or manual publishing
