@echo off
REM ========================================
REM  Stock Tracker Pro - Quick Deploy
REM ========================================

cd /d "d:\Fund Issuer\anti-proj"

echo.
echo ========================================
echo  Stock Tracker Pro - Quick Deploy
echo ========================================
echo.

REM Show what files changed
echo Current changes:
git status --short
echo.

REM Get commit message from user or use default
set /p commit_msg="Enter commit message (or press Enter for 'Update from localhost'): "
if "%commit_msg%"=="" set commit_msg=Update from localhost

echo.
echo [1/3] Adding all changes...
git add -A

echo [2/3] Committing: %commit_msg%
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo.
    echo No changes to commit!
    pause
    exit /b 0
)

echo [3/3] Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push failed! Check your connection.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS! Deployed to production
echo ========================================
echo.
echo Your changes are pushing to GitHub.
echo Vercel will auto-deploy in 1-2 minutes.
echo.
echo Live URL: https://stock-tracker-pro.vercel.app/
echo.
pause
