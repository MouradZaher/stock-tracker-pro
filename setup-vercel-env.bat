@echo off
REM Vercel Environment Variables Setup Script
REM This script helps configure Supabase credentials on Vercel

echo ========================================
echo  Vercel Environment Setup
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if errorlevel 1 (
    echo ERROR: Vercel CLI not found!
    echo.
    echo Please install it first:
    echo npm install -g vercel
    echo.
    pause
    exit /b 1
)

echo Vercel CLI found!
echo.

REM Login to Vercel
echo [Step 1/3] Logging in to Vercel...
vercel login

echo.
echo [Step 2/3] Setting environment variables...
echo.

REM Set VITE_SUPABASE_URL
echo Setting VITE_SUPABASE_URL...
echo https://bsrknlplxmvdjiikhyzu.supabase.co | vercel env add VITE_SUPABASE_URL production

REM Set VITE_SUPABASE_ANON_KEY
echo Setting VITE_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcmtubHBseG12ZGppaWtoeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTE4NzIsImV4cCI6MjA4NTEyNzg3Mn0.oUwuqdJakYT6F7JbO0e8PROorQEKcDI8UYkcLqnmRVE | vercel env add VITE_SUPABASE_ANON_KEY production

echo.
echo [Step 3/3] Deploying to production...
vercel --prod

echo.
echo ========================================
echo  Environment variables configured!
echo  Deployment complete.
echo ========================================
echo.
pause
