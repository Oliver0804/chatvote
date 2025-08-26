#!/bin/bash

# ChatVote 快速運行腳本
# 由 Bashcat (BASHCAT.NET) 維護

echo "🎭 ChatVote 直播互動投票系統 - 快速啟動"
echo "由 Bashcat (BASHCAT.NET) 維護"
echo ""

# 檢查端口是否被佔用
check_port() {
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被佔用
    else
        return 1  # 端口空閒
    fi
}

# 停止佔用端口 3000 的進程
stop_port_process() {
    echo "🛑 停止佔用端口 3000 的進程..."
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -ti:3000)
        if [ -n "$pid" ]; then
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
            sleep 2
            echo "✅ 已停止進程 $pid"
        fi
    else
        echo "⚠️  lsof 未安裝，無法自動停止進程"
        echo "請手動停止佔用端口 3000 的進程"
    fi
}

# 檢查參數
if [ "$1" = "dev" ]; then
    echo "🚀 啟動開發模式..."
    
    # 檢查端口衝突
    if check_port; then
        echo "⚠️  端口 3000 已被佔用"
        read -p "是否停止現有進程並繼續？(y/N): " response
        if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
            stop_port_process
        else
            echo "❌ 取消啟動"
            exit 1
        fi
    fi
    
    npm run dev
elif [ "$1" = "docker" ]; then
    echo "🐳 使用 Docker 啟動..."
    
    # 檢查 Docker 是否可用
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安裝或不在 PATH 中"
        echo "請安裝 Docker 後再試"
        exit 1
    fi
    
    # 檢查 Docker 服務是否運行
    if ! docker info &> /dev/null; then
        echo "❌ Docker 服務未運行"
        echo "請啟動 Docker 服務："
        echo "  sudo systemctl start docker  # Linux"
        echo "  或開啟 Docker Desktop        # macOS/Windows"
        echo ""
        echo "🚀 使用開發模式啟動..."
        npm run dev
        exit 0
    fi
    
    # 嘗試使用 docker-compose 或 docker compose
    if command -v docker-compose &> /dev/null; then
        if docker-compose up -d 2>/dev/null; then
            echo "✅ Docker 容器已啟動"
            echo "📍 應用地址: http://localhost:3000"
        else
            echo "❌ Docker Compose 啟動失敗，嘗試使用新版指令..."
            if docker compose up -d 2>/dev/null; then
                echo "✅ Docker 容器已啟動"
                echo "📍 應用地址: http://localhost:3000"
            else
                echo "❌ Docker 啟動失敗，使用開發模式..."
                npm run dev
            fi
        fi
    elif docker compose version &> /dev/null; then
        if docker compose up -d; then
            echo "✅ Docker 容器已啟動"
            echo "📍 應用地址: http://localhost:3000"
        else
            echo "❌ Docker 啟動失敗，使用開發模式..."
            npm run dev
        fi
    else
        echo "❌ Docker Compose 不可用，使用開發模式..."
        npm run dev
    fi
elif [ "$1" = "build" ]; then
    echo "🔨 構建 Docker 映像..."
    docker build -t chatvote .
    echo "✅ Docker 映像構建完成"
elif [ "$1" = "stop" ]; then
    echo "⏹️  停止服務..."
    
    # 停止 Docker 容器
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose down 2>/dev/null
    fi
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        docker compose down 2>/dev/null
    fi
    
    # 停止端口 3000 的進程
    stop_port_process
    
    echo "✅ 所有服務已停止"
elif [ "$1" = "logs" ]; then
    echo "📋 查看容器日誌..."
    docker-compose logs -f
elif [ "$1" = "clean" ]; then
    echo "🧹 清理 Docker 容器和映像..."
    docker-compose down
    docker rmi chatvote 2>/dev/null || true
    echo "✅ 清理完成"
elif [ "$1" = "restart" ]; then
    echo "🔄 重新啟動服務..."
    
    # 停止現有服務
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose down 2>/dev/null
    fi
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        docker compose down 2>/dev/null
    fi
    stop_port_process
    
    sleep 2
    
    # 重新啟動（默認使用開發模式）
    echo "🚀 重新啟動開發模式..."
    npm run dev
else
    echo "使用方法:"
    echo "  ./run.sh dev     - 開發模式運行"
    echo "  ./run.sh docker  - Docker 模式運行"
    echo "  ./run.sh build   - 構建 Docker 映像"
    echo "  ./run.sh stop    - 停止所有服務"
    echo "  ./run.sh logs    - 查看容器日誌"
    echo "  ./run.sh clean   - 清理容器和映像"
    echo "  ./run.sh restart - 重新啟動服務"
    echo ""
    echo "快速開始:"
    echo "  開發: ./run.sh dev"
    echo "  生產: ./run.sh docker"
    echo "  停止: ./run.sh stop"
fi