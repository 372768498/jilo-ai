@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     GameVideoGen - 完整安装和启动                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [步骤 1/4] 进入项目目录...
cd /d C:\Users\jojo1\jilo-ai
if errorlevel 1 (
    echo ❌ 无法进入项目目录
    echo 请确认路径是否正确: C:\Users\jojo1\jilo-ai
    pause
    exit /b 1
)
echo ✅ 已进入项目目录: %CD%

echo.
echo [步骤 2/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    echo 请下载安装: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装: 
node --version

echo.
echo [步骤 3/4] 安装项目依赖...
echo.
echo 正在安装所有项目依赖...
echo 这可能需要几分钟时间，请稍候...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ❌ 依赖安装失败！
    echo.
    echo 可能的解决方案:
    echo 1. 清除缓存: npm cache clean --force
    echo 2. 删除 node_modules 后重试
    echo 3. 检查网络连接
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 依赖安装完成！

echo.
echo [步骤 4/4] 启动开发服务器...
echo.
echo ────────────────────────────────────────────────────────────
echo  🚀 服务器启动中...
echo  📍 访问地址: http://localhost:3000/game-video-gen
echo  ⏹️  停止服务: 按 Ctrl+C
echo ────────────────────────────────────────────────────────────
echo.

npm run dev
