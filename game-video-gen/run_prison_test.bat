@echo off
echo ========================================
echo Prison Battle Video Generation Test
echo FAL.AI SORA2 - 10s Vertical Video
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found
    echo Please install: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo [INSTALL] Installing npm packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo [DONE] Dependencies installed
) else (
    echo [OK] Dependencies exist
)

echo.
echo [2/3] Generating video...
echo ========================================
echo Video Info:
echo   - Game: Prison Battle
echo   - Duration: 10 seconds
echo   - Format: Vertical (9:16)
echo   - Platform: TikTok/Douyin
echo ========================================
echo.
echo Please wait 1-2 minutes...
echo Estimated cost: ~$0.10-0.20 USD
echo.

node test_prison_battle.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Video generated!
    echo ========================================
    echo.
    echo Next steps:
    echo   1. Copy the video URL from above
    echo   2. Open in browser to download
    echo   3. Edit with video editor
    echo   4. Add text and music
    echo   5. Publish to TikTok
    echo.
) else (
    echo.
    echo ========================================
    echo FAILED! Video generation error
    echo ========================================
    echo.
    echo Common issues:
    echo   - Network connection
    echo   - Invalid API Key
    echo   - Service unavailable
    echo.
)

echo [3/3] Test completed
echo.
pause
