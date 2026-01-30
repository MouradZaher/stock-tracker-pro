@echo off
REM Start Dev Server with Portable Node.js
REM No admin rights needed!

SET NODE_PATH=D:\Fund Issuer\nodejs-portable\node-v20.18.2-win-x64
SET PATH=%NODE_PATH%;%PATH%

echo Starting Stock Tracker Pro with FREE Yahoo Finance data...
echo.
"%NODE_PATH%\node.exe" "%NODE_PATH%\node_modules\npm\bin\npm-cli.js" run dev
