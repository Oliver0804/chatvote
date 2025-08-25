@echo off
REM ChatVote 快速運行腳本 (Windows)
REM 由 Bashcat (BASHCAT.NET) 維護

echo 🎭 ChatVote 直播互動投票系統 - 快速啟動
echo 由 Bashcat (BASHCAT.NET) 維護
echo.

if "%1"=="dev" (
    echo 🚀 啟動開發模式...
    npm run dev
) else if "%1"=="docker" (
    echo 🐳 使用 Docker 啟動...
    docker-compose up -d
    echo ✅ Docker 容器已啟動
    echo 📍 應用地址: http://localhost:3000
) else if "%1"=="build" (
    echo 🔨 構建 Docker 映像...
    docker build -t chatvote .
    echo ✅ Docker 映像構建完成
) else if "%1"=="stop" (
    echo ⏹️ 停止 Docker 容器...
    docker-compose down
    echo ✅ Docker 容器已停止
) else if "%1"=="logs" (
    echo 📋 查看容器日誌...
    docker-compose logs -f
) else if "%1"=="clean" (
    echo 🧹 清理 Docker 容器和映像...
    docker-compose down
    docker rmi chatvote 2>nul
    echo ✅ 清理完成
) else (
    echo 使用方法:
    echo   run.bat dev     - 開發模式運行
    echo   run.bat docker  - Docker 模式運行
    echo   run.bat build   - 構建 Docker 映像
    echo   run.bat stop    - 停止 Docker 容器
    echo   run.bat logs    - 查看容器日誌
    echo   run.bat clean   - 清理容器和映像
    echo.
    echo 快速開始:
    echo   開發: run.bat dev
    echo   生產: run.bat docker
)