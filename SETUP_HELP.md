# Publisher and Token Setup Guide

It looks like there might be some confusion with the publisher setup and Personal Access Token. Let's get this sorted step by step.

## Step 1: Verify Your Azure DevOps Account

First, let's make sure you have the right information:

1. **Go to Azure DevOps**: https://dev.azure.com
2. **Sign in** with your Microsoft account
3. **Note your organization name** - this is important!

## Step 2: Check Your VS Code Marketplace Publishers

1. **Go to**: https://marketplace.visualstudio.com/manage
2. **Sign in** with the same Microsoft account
3. **Check if you have any existing publishers**
   - If you see any publishers listed, note the **Publisher ID**
   - If no publishers exist, you'll need to create one

## Step 3: Create or Verify Publisher (If Needed)

If you don't have a publisher or need to create a new one:

1. On the marketplace management page, click **"New Publisher"**
2. Fill in the details:
   - **Publisher ID**: Choose a unique ID (e.g., "zameerkh", "zameer-khan", etc.)
   - **Display Name**: Your preferred display name
   - **Email**: Your contact email
3. **Important**: Remember the exact Publisher ID you create/use

## Step 4: Create/Verify Personal Access Token (PAT)

1. **Go to**: https://dev.azure.com
2. Click your **profile picture** → **Security** → **Personal access tokens**
3. **Create new token** or verify existing token:
   - **Name**: VS Code Extension Publishing
   - **Organization**: Select your organization
   - **Expiration**: Set appropriate date
   - **Scopes**: Select **"Custom defined"**
   - **Marketplace**: Check **"Manage"** (this gives Read, write & manage permissions)
4. **Copy the token** - you won't see it again!

## Step 5: Update Our Configuration

Once you have the correct information, tell me:

1. **What is your correct Publisher ID?** (from marketplace.visualstudio.com/manage)
2. **What is your new Personal Access Token?** (the one with Marketplace permissions)

Then I'll update:
- `package.json` with the correct publisher
- All documentation with correct URLs
- Test the publishing process

## Quick Check Commands

Let's also verify what we currently have:

```powershell
# Check current package.json publisher
Get-Content package.json | Select-String "publisher"

# Check if vsce can list publishers (might show empty if no PAT is set)
vsce ls-publishers

# Test PAT (replace YOUR_PAT with actual token)
$env:VSCE_PAT = "YOUR_PAT_HERE"
vsce ls-publishers
```

## Common Issues & Solutions

**Issue**: "Publisher doesn't exist"
- **Solution**: Create publisher at marketplace.visualstudio.com/manage

**Issue**: "401 Unauthorized" 
- **Solution**: Verify PAT has Marketplace (Manage) permissions

**Issue**: "PAT expired"
- **Solution**: Create new PAT with longer expiration

**Issue**: "Publisher ID mismatch"
- **Solution**: Make sure package.json publisher matches exactly

Let me know your correct Publisher ID and PAT, and I'll get everything updated properly!
