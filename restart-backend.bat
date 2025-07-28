@echo off
echo Stopping backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3003"') do (
    echo Killing process %%a
    taskkill /PID %%a /F 2>nul
)
timeout /t 2 /nobreak >nul
echo Starting updated backend server...
node simple-agent-server.js