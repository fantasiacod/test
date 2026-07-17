@echo off
cd /d "%~dp0"
tar.exe -a -c -f "..\enterprise-task-system-v10-final.zip" *
echo Done!
