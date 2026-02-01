@echo off
title 游戏视频生成器 - 开发环境
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     游戏视频生成器 - 本地开发环境启动                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d C:\Users\jojo1\jilo-ai

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo ⚠ 未找到 node_modules，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖已安装
)

echo.
echo [2/3] 检查环境变量...
if not exist ".env.local" (
    echo ⚠ 未找到 .env.local 文件
    echo 💡 创建默认环境变量文件...
    (
        echo # FAL.AI API
        echo NEXT_PUBLIC_FAL_KEY=77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a
        echo.
        echo # OpenAI API ^(需要配置^)
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Supabase ^(可选^)
        echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
        echo.
        echo # 应用配置
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
    echo ✅ 已创建 .env.local 文件
    echo 💡 请编辑 .env.local 配置你的 OpenAI API Key
    echo.
    pause
) else (
    echo ✅ 环境变量文件存在
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo 🌐 应用将在以下地址运行:
echo    - 本地:   http://localhost:3000
echo    - 游戏视频生成器: http://localhost:3000/game-video-gen
echo.
echo 📝 提示:
echo    - 按 Ctrl+C 可停止服务器
echo    - 修改代码会自动热更新
echo    - 查看终端获取详细日志
echo.
echo ⏳ 正在启动...
echo.

timeout /t 3 /nobreak >nul
start http://localhost:3000

call npm run dev

pause
