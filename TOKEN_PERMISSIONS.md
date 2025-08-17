# Token Permissions Check

## The Issue
Your token can authenticate (that's why `vsce login` worked), but it's missing the specific **publishing** permissions for the VS Code Marketplace.

## Quick Fix Steps

### 1. Check Current Token Permissions
1. Go to: https://dev.azure.com/zameerkh0696/_usersSettings/tokens
2. Find your current token (the one ending in "PklZ")
3. Click on it to see the permissions

### 2. What You Should See
For VS Code extension publishing, you need:
- ✅ **Marketplace (Manage)** - This gives read, write, AND publish permissions
- ❌ **Marketplace (Read)** - This is NOT enough for publishing

### 3. Create New Token (Recommended)
Since we can't modify existing token permissions:

1. **Go to**: https://dev.azure.com/zameerkh0696/_usersSettings/tokens
2. **Click**: "New Token"
3. **Fill in**:
   - Name: `VS Code Extension Publishing`
   - Organization: `zameerkh0696`
   - Expiration: 30/60/90 days (your choice)
4. **Scopes**: Select "Custom defined"
5. **Important**: Check **"Marketplace"** and make sure it shows **"Manage"**
   - NOT just "Read"
   - Should say "Read, write, & manage"
6. **Click**: "Create"
7. **Copy the new token immediately**

### 4. Test the New Token

```powershell
# Set the new token
$env:VSCE_PAT = "your-new-token-here"

# Test authentication
vsce ls-publishers

# Try publishing
vsce publish --pat $env:VSCE_PAT
```

## Visual Check
When creating the token, the Marketplace permissions should look like this:
```
☐ Marketplace (Read)                    # DON'T check this
☑ Marketplace (Manage)                  # CHECK this one!
  └── Read, write, & manage
```

## Alternative: Web Upload
If token issues persist, you can always upload manually:
1. We already have: `prompt-vault-1.0.1.vsix`
2. Go to: https://marketplace.visualstudio.com/manage/publishers/zameerkh0696
3. Click "New extension" → Upload the .vsix file

Let me know what permissions your current token has, and we can fix this!
