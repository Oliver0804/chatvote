#!/bin/bash

# ChatVote 快速運行腳本
# 由 Bashcat (BASHCAT.NET) 維護

echo "🎭 ChatVote 直播互動投票系統 - 快速啟動"
echo "由 Bashcat (BASHCAT.NET) 維護"
echo ""

# 檢查參數
if [ "$1" = "dev" ]; then
    echo "🚀 啟動開發模式..."
    npm run dev
elif [ "$1" = "docker" ]; then
    echo "🐳 使用 Docker 啟動..."
    docker-compose up -d
    echo "✅ Docker 容器已啟動"
    echo "📍 應用地址: http://localhost:3000"
elif [ "$1" = "build" ]; then
    echo "🔨 構建 Docker 映像..."
    docker build -t chatvote .
    echo "✅ Docker 映像構建完成"
elif [ "$1" = "stop" ]; then
    echo "⏹️  停止 Docker 容器..."
    docker-compose down
    echo "✅ Docker 容器已停止"
elif [ "$1" = "logs" ]; then
    echo "📋 查看容器日誌..."
    docker-compose logs -f
elif [ "$1" = "clean" ]; then
    echo "🧹 清理 Docker 容器和映像..."
    docker-compose down
    docker rmi chatvote 2>/dev/null || true
    echo "✅ 清理完成"
else
    echo "使用方法:"
    echo "  ./run.sh dev     - 開發模式運行"
    echo "  ./run.sh docker  - Docker 模式運行"
    echo "  ./run.sh build   - 構建 Docker 映像"
    echo "  ./run.sh stop    - 停止 Docker 容器"
    echo "  ./run.sh logs    - 查看容器日誌"
    echo "  ./run.sh clean   - 清理容器和映像"
    echo ""
    echo "快速開始:"
    echo "  開發: ./run.sh dev"
    echo "  生產: ./run.sh docker"
fi