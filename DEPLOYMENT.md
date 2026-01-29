# 🚀 Deployment Guide: GitHub & Vercel

Since we have a Vite + React + Supabase project, the best way to host it is **Vercel**. It's free, fast, and integrates perfectly.

## Step 1: Initialize Git (If needed)
Run these commands in your terminal to prepare the project:

```bash
# Initialize a new git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit for Vercel deployment"
```

## Step 2: Push to GitHub
1.  Go to [GitHub.com](https://github.com) and sign in.
2.  Click the **+** icon (top right) -> **New repository**.
3.  Name it `stock-tracker-pro` (or similar).
4.  Make it **Public** or **Private** (Private is better for safety).
5.  **Do NOT** initialize with README, .gitignore, or License (we have them).
6.  Click **Create repository**.
7.  Copy the commands under "…or push an existing repository from the command line". They will look like this:

```bash
git remote add origin https://github.com/MouradZaher/stock-tracker-pro.git
git branch -M main
git push -u origin main
```
Run those commands in your terminal.

## Step 3: Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up/login with **GitHub**.
2.  Click **Add New...** -> **Project**.
3.  Find your `stock-tracker-pro` repo in the list and click **Import**.
4.  **CRITICAL STEP**: Open the **Environment Variables** section.
    *   You need to copy your keys from your local `.env` file or Supabase dashboard.
    *   Add `VITE_SUPABASE_URL` -> Value: `https://your-project.supabase.co`
    *   Add `VITE_SUPABASE_ANON_KEY` -> Value: `your-long-anon-key-string`
5.  Click **Deploy**.

## Step 4: Final Success
*   Vercel will build your site.
*   Once done, it will give you a domain like `stock-tracker-pro.vercel.app`.
*   **Important**: Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
*   Add your new Vercel URL (e.g., `https://stock-tracker-pro.vercel.app`) to "Site URL" or "Redirect URLs" so the login links work!

## Troubleshooting
*   **Login not working?** Check that you added the Environment Variables in Vercel and updated the Redirect URL in Supabase.
*   **Build failed?** Check the Vercel logs. Usually it's a missing dependency (but we fixed those).
