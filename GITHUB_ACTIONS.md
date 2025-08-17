# GitHub Actions CI/CD Pipeline

This repository uses **two separate GitHub Actions workflows** for automated building, testing, and publishing. This separation follows modern CI/CD best practices for reliability and maintainability.

## 🔄 Why Two Workflows?

We intentionally use **two workflows** instead of one because they serve different purposes and have different triggers:

### **Separation of Concerns**
- **🏗️ Build & Marketplace Publishing** - Handles code compilation and marketplace distribution
- **🏷️ Release & GitHub Artifacts** - Manages GitHub releases and downloadable VSIX files

### **Different Reliability Requirements**  
- **Marketplace publishing** can occasionally fail due to network issues or marketplace downtime
- **GitHub releases** should always work for providing downloadable assets
- If one fails, the other can still succeed

### **Different Triggers**
- **Build workflow** runs on every push (continuous integration)
- **Release workflow** only runs when `package.json` changes (selective release management)

## 📊 Workflow Execution Matrix

| Push Type | Build & Publish Workflow | Create Release Workflow |
|-----------|-------------------------|------------------------|
| **Code changes only** | ✅ Runs → Builds → ⏭️ Skips publishing | ❌ Doesn't run |
| **Documentation updates** | ✅ Runs → Builds → ⏭️ Skips publishing | ❌ Doesn't run |
| **Version bump** | ✅ Runs → Builds → 🚀 Publishes | ✅ Runs → 📦 Creates release |
| **package.json changes** | ✅ Runs → Builds → ⚡ Smart decision | ✅ Runs → ⚡ Smart decision |

## Workflows Overview

### 1. Build and Publish (`build-and-publish.yml`)
- **Trigger**: Every push to `main` branch
- **Purpose**: Continuous Integration + Conditional Marketplace Publishing
- **Smart Logic**: Only publishes when version changes detected
- **Steps**: Install dependencies → Compile TypeScript → Package extension → Conditionally publish to marketplace

### 2. Create Release (`release.yml`)  
- **Trigger**: Push to `main` branch when `package.json` is modified
- **Purpose**: GitHub Release Management + VSIX Distribution
- **Smart Logic**: Only creates releases when version changes detected
- **Steps**: Detect version change → Package VSIX → Create GitHub release → Attach VSIX file

### 3. PR Validation (`pr-validation.yml`)
- **Trigger**: Pull requests to `main` branch  
- **Purpose**: Quality gates without publishing
- **Steps**: Install dependencies → Compile TypeScript → Package extension → Upload artifact

## 👨‍💻 Developer Workflow Examples

### **Regular Development** (Code changes, bug fixes, documentation)
```bash
git add .
git commit -m "fix: resolve issue with search functionality" 
git push origin main
```
**Result**: 
- ✅ Build & Publish workflow runs → Builds → Validates → ⏭️ Skips publishing
- ❌ Create Release workflow doesn't run (package.json unchanged)

### **New Version Release** (Ready to publish)
```bash
npm version patch  # Updates package.json version
git push origin main --follow-tags
```
**Result**:
- ✅ Build & Publish workflow runs → Builds → 🚀 Publishes to VS Code Marketplace  
- ✅ Create Release workflow runs → 📦 Creates GitHub release with VSIX download

### **Manual Workflow Trigger** (Emergency or testing)
1. Go to GitHub Actions tab
2. Select "Build and Publish to VS Code Marketplace" 
3. Click "Run workflow" button

## Setup Instructions

### Repository Secrets
You need to add the following secret to your repository:

1. **Go to your repository**: https://github.com/zameerkh/promptvault-vscode-extension
2. **Click**: Settings → Secrets and variables → Actions
3. **Click**: "New repository secret"
4. **Add secret**:
   - **Name**: `VSCE_PAT`
   - **Value**: `[Your-Personal-Access-Token-Here]`

> ⚠️ **Security Note**: The PAT should have "Marketplace (Manage)" permissions for the `zameerkh0696` publisher.

### Personal Access Token Setup
1. Go to https://marketplace.visualstudio.com/manage
2. Create a new Personal Access Token
3. Select "Marketplace (Manage)" scope
4. Copy the token and add it as `VSCE_PAT` repository secret

## Testing the Pipeline

### Automatic Publishing
1. Make changes to your code
2. Update version in `package.json` (e.g., from `1.0.2` to `1.0.3`)
3. Commit and push to `main` branch
4. The pipeline will automatically:
   - Build the extension
   - Publish to VS Code Marketplace
   - Create a GitHub release

### Manual Publishing
You can also trigger the build manually:
1. Go to Actions tab in your repository
2. Select "Build and Publish to VS Code Marketplace"
3. Click "Run workflow"

## Commands Reference

The workflows use these npm scripts from `package.json`:
- `npm run compile` - Compile TypeScript
- `npm run package` - Create production bundle
- `npx @vscode/vsce publish` - Publish to marketplace (requires VSCE_PAT)
- `npx @vscode/vsce package` - Create VSIX file

## Troubleshooting

### Common Issues

#### **"Why did two workflows run?"**  
This is **normal behavior**! When you push a version bump:
- Build & Publish workflow runs because of push to `main`
- Create Release workflow runs because `package.json` was modified
- Both have smart logic to only act when version actually changes

#### **"One workflow succeeded, one failed"**
This is the **benefit of separation**! Examples:
- ✅ Marketplace publishing succeeds → Users can install via VS Code
- ❌ GitHub release fails → Users can still get extension from marketplace
- Or vice versa - you have redundancy

#### **"No publishing happened on version bump"**  
Check both workflows:
- Build & Publish workflow: Look for version change detection logs
- Create Release workflow: Verify it detected the version change
- Ensure version actually changed in the commit

### Workflow-Specific Issues

1. **Build & Publish fails**: Check that VSCE_PAT secret is set correctly
2. **Create Release fails**: Check GitHub token has `contents: write` permission  
3. **Build fails**: Ensure all dependencies are in package.json
4. **Release not created**: Verify package.json version was actually changed in the push

### Debugging Both Workflows
- Check the Actions tab for detailed logs from both workflows
- Verify repository secrets are set correctly (VSCE_PAT for marketplace)
- Ensure PAT has correct permissions
- Check version change detection logs in both workflows

### Debugging
- Check the Actions tab for detailed logs
- Verify repository secrets are set correctly
- Ensure PAT has correct permissions

## Security Best Practices
- Never commit Personal Access Tokens to git
- Use repository secrets for sensitive data
- Regularly rotate PAT tokens
- Review workflow permissions regularly
