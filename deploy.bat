@echo off
echo Deploying S&P 500 Heatmap to Vercel...
echo.

cd /d "d:\Fund Issuer\anti-proj"

echo Adding changed files...
git add .

echo Committing changes...
git commit -m "Security fixes: restrict admin bypass to dev mode, add env vars, improve error handling + restore S&P 500 heatmap"

echo Pushing to GitHub (triggers Vercel deployment)...
git push origin main

echo.
echo ========================================
echo Deployment initiated successfully!
echo ========================================
echo.
echo Visit https://stock-tracker-pro.vercel.app/ in 1-2 minutes to see the changes.
echo.
pause
