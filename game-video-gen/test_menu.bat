@echo off
chcp 65001 >nul
cls

:menu
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        🎮 GameVideoGen 本地测试菜单                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 选择测试类型:
echo.
echo   [1] 快速测试 (4秒视频, 最便宜最快)
echo   [2] 《狱国争霸》完整测试 (12秒, 抖音竖屏)
echo   [3] 抖音平台测试 (8秒, 竖屏)
echo   [4] YouTube平台测试 (12秒, 横屏)
echo   [5] 快手平台测试 (4秒, 竖屏)
echo   [6] 查看测试指南
echo   [0] 退出
echo.
set /p choice="请输入选项 (0-6): "

if "%choice%"=="1" goto quick
if "%choice%"=="2" goto prison
if "%choice%"=="3" goto douyin
if "%choice%"=="4" goto youtube
if "%choice%"=="5" goto kuaishou
if "%choice%"=="6" goto guide
if "%choice%"=="0" goto end

echo 无效选项，请重新选择
timeout /t 2 >nul
cls
goto menu

:quick
cls
echo.
echo 🚀 运行快速测试...
echo.
node simple_test.js
goto pause_menu

:prison
cls
echo.
echo 🏰 运行《狱国争霸》完整测试...
echo.
node test_prison_battle.js
goto pause_menu

:douyin
cls
echo.
echo 📱 运行抖音平台测试...
echo.
node test_configs.js douyin 8
goto pause_menu

:youtube
cls
echo.
echo 📺 运行YouTube平台测试...
echo.
node test_configs.js youtube 12
goto pause_menu

:kuaishou
cls
echo.
echo 🎬 运行快手平台测试...
echo.
node test_configs.js kuaishou 4
goto pause_menu

:guide
cls
type local_test_guide.md
goto pause_menu

:pause_menu
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
cls
goto menu

:end
echo.
echo 👋 再见！
echo.
timeout /t 2 >nul
exit
