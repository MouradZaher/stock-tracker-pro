# Quick Deploy Guide

## Easy Deployment from Localhost to Production

### Method 1: Use the Deploy Script (Recommended)

Just double-click `deploy.bat` in your project folder, or run from command line:

```batch
deploy.bat
```

**What it does:**
1. Shows you all changed files
2. Asks for a commit message (or uses default)
3. Commits and pushes to GitHub
4. Vercel automatically deploys your changes

**Time to production:** 1-2 minutes after running the script

---

### Method 2: Manual Git Commands

If you prefer manual control:

```batch
git add -A
git commit -m "Your commit message here"
git push origin main
```

---

### Method 3: VS Code Source Control

1. Open Source Control panel (Ctrl+Shift+G)
2. Stage all changes (+ icon)
3. Type commit message in the box
4. Click ✓ Commit
5. Click "Sync Changes" or "Push"

---

## Verification

After deploying, wait 1-2 minutes then visit:
https://stock-tracker-pro.vercel.app/

The changes should be live!

---

## Troubleshooting

**"No changes to commit"**: You haven't modified any files since the last commit.

**"Push failed"**: Check your internet connection or GitHub authentication.

**Changes not showing on website**: Wait 2-3 minutes for Vercel to rebuild. Check the Vercel dashboard for deployment status.
