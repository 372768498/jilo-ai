@echo off
echo ========================================
echo Installing Dependencies
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install: https://nodejs.org/
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.

echo Removing old node_modules...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del /f /q package-lock.json

echo.
echo Installing fresh dependencies...
echo This may take 30-60 seconds...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Dependencies installed!
    echo ========================================
    echo.
    echo You can now run:
    echo   - Double click: RUN_TEST.bat
    echo   - Or in PowerShell: node test_prison_battle.js
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR! Installation failed
    echo ========================================
    echo.
    echo Please try manually:
    echo   npm cache clean --force
    echo   npm install
    echo.
)

pause
