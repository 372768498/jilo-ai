@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 GameVideoGen 快速测试
echo ========================================
echo.

echo [1/3] 检查环境...
cd /d C:\Users\jojo1\jilo-ai

if not exist ".env.local" (
    echo ❌ 错误: .env.local 文件不存在
    echo 请先配置环境变量
    pause
    exit /b 1
)

echo ✅ 环境检查通过

echo.
echo [2/3] 启动开发服务器...
echo 正在启动... (这需要几秒钟)
echo.

start "GameVideoGen Dev Server" cmd /k "npm run dev"

timeout /t 10 /nobreak >nul

echo.
echo [3/3] 打开测试页面...

start http://localhost:3000/game-video-gen

echo.
echo ========================================
echo ✅ 测试环境已就绪！
echo ========================================
echo.
echo 📋 测试步骤：
echo   1. 填写表单（游戏名称、描述等）
echo   2. 点击"生成视频"按钮
echo   3. 等待1-2分钟
echo   4. 查看生成的视频
echo.
echo 💡 提示：
echo   - 首次测试建议使用8秒时长
echo   - 保持控制台窗口打开查看日志
echo   - 测试完成后在控制台按 Ctrl+C 停止服务器
echo.
echo 📚 详细测试指南：查看 LOCAL_TEST_GUIDE.md
echo.
pause
