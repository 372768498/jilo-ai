@echo off
echo ========================================
echo Prison Battle Video Test
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

if not exist "node_modules\@fal-ai" (
    echo [ERROR] Dependencies not installed!
    echo.
    echo Please run INSTALL.bat first!
    echo.
    pause
    exit /b 1
)

echo Starting video generation...
echo Please wait 1-2 minutes...
echo.

node test_prison_battle.js

echo.
echo ========================================
echo Test completed!
echo ========================================
echo.
pause
