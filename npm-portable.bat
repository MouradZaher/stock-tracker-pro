@echo off
REM Portable Node.js Runner for Stock Tracker Pro
REM No admin rights needed!

SET NODE_PATH=D:\Fund Issuer\nodejs-portable\node-v20.18.2-win-x64
SET PATH=%NODE_PATH%;%PATH%

REM Run the command passed as argument
"%NODE_PATH%\node.exe" "%NODE_PATH%\node_modules\npm\bin\npm-cli.js" %*
