@echo off
echo ====================================
echo   Restarting Enterprise Task Server
echo ====================================
echo.
echo Stopping old server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting new server...
cd /d "C:\Users\GAMING PC\.gemini\antigravity\scratch\enterprise-task-system"
node server/app.js
