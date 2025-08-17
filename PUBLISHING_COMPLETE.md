# VS Code Extension Publishing Guide

This comprehensive guide covers everything you need to know about publishing VS Code extensions, from initial setup to ongoing maintenance.

## 📋 Table of Contents

1. [Initial Setup (First-Time Publishing)](#initial-setup)
2. [Publishing Process](#publishing-process)
3. [Incremental Updates](#incremental-updates)
4. [Automated Publishing](#automated-publishing)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

## 🚀 Initial Setup (First-Time Publishing)

### Prerequisites
- Node.js (v16 or higher)
- VS Code
- Git (for version control)
- Azure DevOps account (free)

### Step 1: Install Publishing Tools

```bash
# Install VS Code Extension CLI globally
npm install -g @vscode/vsce

# Verify installation
vsce --version
```

### Step 2: Create Azure DevOps Organization

1. **Go to Azure DevOps**: https://dev.azure.com
2. **Sign in** with your Microsoft account (create one if needed)
3. **Create organization**:
   - Choose organization name (e.g., "your-username")
   - Select location
   - Choose "Private" for initial setup
4. **Note your organization name** - you'll need this for publishing

### Step 3: Create VS Code Marketplace Publisher

1. **Go to Marketplace Management**: https://marketplace.visualstudio.com/manage
2. **Sign in** with the same Microsoft account
3. **Create new publisher**:
   - Click "Create new publisher"
   - **Publisher ID**: Choose unique ID (lowercase, no spaces)
   - **Display Name**: Your preferred display name
   - **Description**: Brief description of your extensions
   - **Email**: Contact email
   - Click "Create"

### Step 4: Generate Personal Access Token (PAT)

This is the most critical step for authentication:

1. **Go to Azure DevOps**: https://dev.azure.com/YOUR_ORGANIZATION_NAME
2. **Click your profile picture** → **Security** → **Personal access tokens**
3. **Create new token**:
   - **Name**: `VS Code Extension Publishing`
   - **Organization**: Select your organization
   - **Expiration**: 90 days (recommended)
   - **Scopes**: Select "Custom defined"
   - **Marketplace**: Check **"Manage"** ⚠️ IMPORTANT: Must be "Manage", not just "Read"
4. **Click "Create"** and **copy the token immediately** (you won't see it again!)

### Step 5: Set Up Your Extension Project

Create a properly structured extension project:

```bash
# Create project directory
mkdir my-vscode-extension
cd my-vscode-extension

# Initialize with Yeoman (optional)
npm install -g yo generator-code
yo code

# Or start with existing template
git clone https://github.com/microsoft/vscode-extension-samples
```

### Step 6: Configure package.json

Ensure your `package.json` has all required fields:

```json
{
  "name": "my-unique-extension-name",
  "displayName": "My Extension Display Name",
  "description": "Clear description of what your extension does",
  "version": "1.0.0",
  "publisher": "your-publisher-id",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/your-repo/issues"
  },
  "homepage": "https://github.com/your-username/your-repo#readme",
  "license": "MIT"
}
```

## 📤 Publishing Process

### Method 1: Command Line (Recommended)

```bash
# Set your Personal Access Token
export VSCE_PAT="your-personal-access-token"

# Or on Windows PowerShell
$env:VSCE_PAT = "your-personal-access-token"

# Publish the extension
vsce publish --pat $VSCE_PAT
```

### Method 2: Login Then Publish

```bash
# Login with your publisher ID
vsce login your-publisher-id
# Enter your PAT when prompted

# Then publish
vsce publish
```

### Method 3: Manual Upload

If command-line publishing fails:

1. **Package the extension**:
   ```bash
   vsce package
   ```
2. **Go to**: https://marketplace.visualstudio.com/manage/publishers/your-publisher-id
3. **Click**: "New extension" → "Visual Studio Code"
4. **Upload** the generated `.vsix` file

## 🔄 Incremental Updates

### Version Management

VS Code extensions use semantic versioning (major.minor.patch):

```bash
# Patch update (1.0.0 → 1.0.1) - Bug fixes
vsce publish patch

# Minor update (1.0.1 → 1.1.0) - New features
vsce publish minor

# Major update (1.1.0 → 2.0.0) - Breaking changes
vsce publish major

# Specific version
vsce publish 1.2.3
```

### Update Workflow

1. **Make your changes** in the codebase
2. **Test thoroughly** in Extension Development Host
3. **Update CHANGELOG.md** with changes
4. **Commit changes** to version control
5. **Publish with version bump**:
   ```bash
   vsce publish patch --pat $VSCE_PAT
   ```

### Pre-publish Checklist

- [ ] All features work as expected
- [ ] No console errors or warnings
- [ ] README.md is updated
- [ ] CHANGELOG.md includes new changes
- [ ] Version number is appropriate
- [ ] No sensitive data in published files
- [ ] Extension size is reasonable (<10MB recommended)

## 🤖 Automated Publishing

### Using GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm install
      
      - run: npm run compile
      
      - name: Publish to VS Code Marketplace
        run: vsce publish --pat ${{ secrets.VSCE_PAT }}
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

**Setup**:
1. Add `VSCE_PAT` to GitHub repository secrets
2. Push a version tag to trigger publishing:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### PowerShell Automation Script

For local automation, use the included `publish.ps1` script:

```powershell
# Package only
.\publish.ps1 -PackageOnly

# Publish with patch version bump
.\publish.ps1 -VersionBump patch

# Publish with custom PAT
.\publish.ps1 -PAT "your-token" -VersionBump minor

# Force publish despite warnings
.\publish.ps1 -Force
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 401 Unauthorized
**Cause**: Invalid or insufficient PAT permissions
**Solution**:
1. Verify PAT has "Marketplace (Manage)" scope
2. Check PAT hasn't expired
3. Ensure publisher ID matches in package.json

#### Extension Name Already Exists
**Cause**: Another extension uses the same name
**Solution**:
1. Choose a unique extension name
2. Update `name` field in package.json
3. Consider updating `displayName` as well

#### Display Name Already Taken
**Cause**: Display name conflicts with existing extension
**Solution**:
1. Modify `displayName` in package.json
2. Make it more specific or add suffix

#### Publisher Doesn't Exist
**Cause**: Publisher not created or typo in publisher ID
**Solution**:
1. Verify publisher exists at marketplace.visualstudio.com/manage
2. Check exact spelling in package.json
3. Create publisher if it doesn't exist

#### Package Too Large
**Cause**: Extension bundle exceeds size limits
**Solution**:
1. Add files to `.vscodeignore`
2. Remove unnecessary dependencies
3. Optimize assets (compress images, minify code)

### Debug Publishing Issues

```bash
# Check extension for issues before publishing
vsce package --dry-run

# Validate package.json
vsce ls

# Show what files will be included
vsce ls --tree

# Publish with verbose output
vsce publish --debug
```

### Token Management

```bash
# Test if token works
vsce ls-publishers

# Check current login status
vsce whoami

# Logout and re-login
vsce logout
vsce login your-publisher-id
```

## 📈 Best Practices

### Extension Metadata

1. **Clear Description**: Explain what your extension does in 1-2 sentences
2. **Good Icon**: 128x128 PNG icon that represents your extension
3. **Screenshots**: Show your extension in action
4. **Detailed README**: Include usage instructions and examples
5. **Proper Categories**: Choose appropriate categories for discoverability

### Version Management

1. **Semantic Versioning**: Follow semver strictly
2. **CHANGELOG.md**: Document all changes
3. **Git Tags**: Tag releases for easy reference
4. **Testing**: Test each version thoroughly before publishing

### Security

1. **Review Dependencies**: Regularly audit npm packages
2. **Secure PAT Storage**: Never commit tokens to git
3. **Minimal Permissions**: Use least privilege principle
4. **Code Review**: Review all changes before publishing

### Performance

1. **Bundle Size**: Keep extension small and fast
2. **Activation Events**: Use specific activation events
3. **Lazy Loading**: Load resources only when needed
4. **Memory Usage**: Monitor and optimize memory consumption

### Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **VS Code Compatibility**: Test with latest VS Code versions
3. **User Feedback**: Respond to issues and feature requests
4. **Deprecation Warnings**: Address VS Code API deprecations

## 📊 Monitoring & Analytics

### Marketplace Metrics

Track your extension's performance:

1. **Go to**: https://marketplace.visualstudio.com/manage/publishers/your-publisher-id
2. **View Analytics**:
   - Install counts
   - Download trends
   - User ratings and reviews
   - Geographic distribution

### Key Metrics to Monitor

- **Daily/Weekly/Monthly Active Users**
- **Installation Growth Rate**
- **User Ratings** (aim for 4+ stars)
- **Review Feedback**
- **Uninstall Rate**

## 🎯 Publishing Checklist

### Before First Publish
- [ ] Azure DevOps account created
- [ ] Publisher account created
- [ ] PAT generated with "Marketplace (Manage)" permissions
- [ ] package.json properly configured
- [ ] README.md written
- [ ] Extension tested thoroughly
- [ ] Icon and screenshots added

### Before Each Update
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] Code changes tested
- [ ] No breaking changes (or major version bump)
- [ ] README updated if needed
- [ ] Git changes committed

### After Publishing
- [ ] Verify extension appears in marketplace
- [ ] Test installation from marketplace
- [ ] Update any documentation
- [ ] Announce release (if significant)
- [ ] Monitor for issues

## 🔗 Useful Resources

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Publishing Documentation**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace Management**: https://marketplace.visualstudio.com/manage
- **Extension Guidelines**: https://code.visualstudio.com/api/references/extension-guidelines
- **Sample Extensions**: https://github.com/microsoft/vscode-extension-samples

---

This guide should cover everything you need for successful VS Code extension publishing. Keep this document updated as processes evolve!
