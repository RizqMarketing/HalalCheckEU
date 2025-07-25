@echo off
echo 🚀 Starting HalalCheck EU - Minimal Setup

:: Copy minimal env
copy .env.minimal .env > nul

echo ✅ Environment configured with OpenAI API key

:: Start backend
echo 🔧 Starting backend...
cd backend
call npm install --silent
call npm run build
start /B npm start
cd ..

:: Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 15 /nobreak > nul

:: Check if backend is running
curl -s http://localhost:3001/health > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Backend running on http://localhost:3001
) else (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)

:: Start frontend
echo 🎨 Starting frontend...
cd frontend
call npm install --silent
call npm run build
start /B npm start
cd ..

:: Wait for frontend to start
echo ⏳ Waiting for frontend to start...
timeout /t 20 /nobreak > nul

:: Check if frontend is running
curl -s http://localhost:3000 > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Frontend running on http://localhost:3000
) else (
    echo ❌ Frontend failed to start
    pause
    exit /b 1
)

echo.
echo 🎉 HalalCheck EU is ready!
echo 🌐 Open http://localhost:3000 in your browser
echo 🧪 Ready to test halal ingredient analysis
echo.
echo Press any key to run automated tests, or Ctrl+C to just keep services running
pause > nul

:: Run automated halal tests
echo 🧪 Running halal check tests...
call test-halal-check.bat

echo.
echo ✅ All done! Services are still running.
echo 🌐 Visit http://localhost:3000 to test manually
echo Press any key to exit...
pause > nul