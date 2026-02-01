@echo off
echo ========================================
echo Game Video Test - Quick Start
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Checking npm packages...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Running test...
echo.

node test_prison_battle.js

echo.
echo Test finished!
echo.
pause
