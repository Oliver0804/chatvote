#!/bin/bash

# ChatVote 快速運行腳本
# 由 Bashcat (BASHCAT.NET) 維護

echo "🎭 ChatVote 直播互動投票系統 - 快速啟動"
echo "由 Bashcat (BASHCAT.NET) 維護"
echo ""

# 檢查端口是否被佔用
check_port() {
    local port=${1:-3000}
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被佔用
    else
        return 1  # 端口空閒
    fi
}

# 驗證端口號碼
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1024 ] && [ $port -le 65535 ]; then
        return 0  # 有效端口
    else
        return 1  # 無效端口
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
    
    # 檢查端口衝突並處理
    PORT=3000
    if check_port $PORT; then
        echo "⚠️  端口 $PORT 已被佔用"
        echo "請選擇處理方式："
        echo "1) 停止現有進程並使用端口 $PORT"
        echo "2) 使用其他端口"
        echo "3) 取消啟動"
        read -p "請選擇 (1/2/3): " choice
        
        case $choice in
            1)
                stop_port_process
                ;;
            2)
                while true; do
                    read -p "請輸入新的端口號 (1024-65535): " new_port
                    if validate_port $new_port; then
                        if ! check_port $new_port; then
                            PORT=$new_port
                            echo "✅ 將使用端口 $PORT"
                            break
                        else
                            echo "❌ 端口 $new_port 也被佔用，請選擇其他端口"
                        fi
                    else
                        echo "❌ 無效的端口號，請輸入 1024-65535 之間的數字"
                    fi
                done
                ;;
            3|*)
                echo "❌ 取消啟動"
                exit 1
                ;;
        esac
    fi
    
    # 設定環境變數並啟動
    export PORT=$PORT
    echo "🚀 在端口 $PORT 啟動開發模式..."
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
    
    # 檢查端口並處理衝突
    DOCKER_PORT=3000
    if check_port $DOCKER_PORT; then
        echo "⚠️  端口 $DOCKER_PORT 已被佔用"
        echo "請選擇處理方式："
        echo "1) 停止現有進程並使用端口 $DOCKER_PORT"
        echo "2) 使用其他端口"
        echo "3) 取消啟動"
        read -p "請選擇 (1/2/3): " choice
        
        case $choice in
            1)
                stop_port_process
                ;;
            2)
                while true; do
                    read -p "請輸入新的端口號 (1024-65535): " new_port
                    if validate_port $new_port; then
                        if ! check_port $new_port; then
                            DOCKER_PORT=$new_port
                            echo "✅ 將使用端口 $DOCKER_PORT"
                            break
                        else
                            echo "❌ 端口 $new_port 也被佔用，請選擇其他端口"
                        fi
                    else
                        echo "❌ 無效的端口號，請輸入 1024-65535 之間的數字"
                    fi
                done
                ;;
            3|*)
                echo "❌ 取消啟動"
                exit 1
                ;;
        esac
    fi
    
    # 設定環境變數並啟動 Docker
    export EXTERNAL_PORT=$DOCKER_PORT
    echo "🐳 在端口 $DOCKER_PORT 啟動 Docker 容器..."
    
    # 嘗試使用 docker-compose 或 docker compose
    if command -v docker-compose &> /dev/null; then
        if EXTERNAL_PORT=$DOCKER_PORT docker-compose up -d 2>/dev/null; then
            echo "✅ Docker 容器已啟動"
            echo "📍 應用地址: http://localhost:$DOCKER_PORT"
        else
            echo "❌ Docker Compose 啟動失敗，嘗試使用新版指令..."
            if EXTERNAL_PORT=$DOCKER_PORT docker compose up -d 2>/dev/null; then
                echo "✅ Docker 容器已啟動"
                echo "📍 應用地址: http://localhost:$DOCKER_PORT"
            else
                echo "❌ Docker 啟動失敗，使用開發模式..."
                # 檢查端口衝突
                if check_port $DOCKER_PORT; then
                    echo "⚠️  端口 $DOCKER_PORT 仍被佔用，需要處理端口衝突"
                    echo "請選擇處理方式："
                    echo "1) 停止現有進程並使用端口 $DOCKER_PORT"
                    echo "2) 使用其他端口"
                    echo "3) 取消啟動"
                    read -p "請選擇 (1/2/3): " choice
                    
                    case $choice in
                        1)
                            stop_port_process
                            if check_port $DOCKER_PORT; then
                                echo "❌ 無法停止佔用端口的進程，請手動處理"
                                exit 1
                            fi
                            ;;
                        2)
                            while true; do
                                read -p "請輸入新的端口號 (1024-65535): " new_port
                                if validate_port $new_port; then
                                    if ! check_port $new_port; then
                                        DOCKER_PORT=$new_port
                                        echo "✅ 將使用端口 $DOCKER_PORT"
                                        break
                                    else
                                        echo "❌ 端口 $new_port 也被佔用，請選擇其他端口"
                                    fi
                                else
                                    echo "❌ 無效的端口號，請輸入 1024-65535 之間的數字"
                                fi
                            done
                            ;;
                        3|*)
                            echo "❌ 取消啟動"
                            exit 1
                            ;;
                    esac
                fi
                export PORT=$DOCKER_PORT
                npm run dev
            fi
        fi
    elif docker compose version &> /dev/null; then
        if EXTERNAL_PORT=$DOCKER_PORT docker compose up -d; then
            echo "✅ Docker 容器已啟動"
            echo "📍 應用地址: http://localhost:$DOCKER_PORT"
        else
            echo "❌ Docker 啟動失敗，使用開發模式..."
            # 檢查端口衝突
            if check_port $DOCKER_PORT; then
                echo "⚠️  端口 $DOCKER_PORT 仍被佔用，需要處理端口衝突"
                echo "請選擇處理方式："
                echo "1) 停止現有進程並使用端口 $DOCKER_PORT"
                echo "2) 使用其他端口"
                echo "3) 取消啟動"
                read -p "請選擇 (1/2/3): " choice
                
                case $choice in
                    1)
                        stop_port_process
                        if check_port $DOCKER_PORT; then
                            echo "❌ 無法停止佔用端口的進程，請手動處理"
                            exit 1
                        fi
                        ;;
                    2)
                        while true; do
                            read -p "請輸入新的端口號 (1024-65535): " new_port
                            if validate_port $new_port; then
                                if ! check_port $new_port; then
                                    DOCKER_PORT=$new_port
                                    echo "✅ 將使用端口 $DOCKER_PORT"
                                    break
                                else
                                    echo "❌ 端口 $new_port 也被佔用，請選擇其他端口"
                                fi
                            else
                                echo "❌ 無效的端口號，請輸入 1024-65535 之間的數字"
                            fi
                        done
                        ;;
                    3|*)
                        echo "❌ 取消啟動"
                        exit 1
                        ;;
                esac
            fi
            export PORT=$DOCKER_PORT
            npm run dev
        fi
    else
        echo "❌ Docker Compose 不可用，使用開發模式..."
        # 檢查端口衝突
        if check_port $DOCKER_PORT; then
            echo "⚠️  端口 $DOCKER_PORT 仍被佔用，需要處理端口衝突"
            echo "請選擇處理方式："
            echo "1) 停止現有進程並使用端口 $DOCKER_PORT"
            echo "2) 使用其他端口"
            echo "3) 取消啟動"
            read -p "請選擇 (1/2/3): " choice
            
            case $choice in
                1)
                    stop_port_process
                    if check_port $DOCKER_PORT; then
                        echo "❌ 無法停止佔用端口的進程，請手動處理"
                        exit 1
                    fi
                    ;;
                2)
                    while true; do
                        read -p "請輸入新的端口號 (1024-65535): " new_port
                        if validate_port $new_port; then
                            if ! check_port $new_port; then
                                DOCKER_PORT=$new_port
                                echo "✅ 將使用端口 $DOCKER_PORT"
                                break
                            else
                                echo "❌ 端口 $new_port 也被佔用，請選擇其他端口"
                            fi
                        else
                            echo "❌ 無效的端口號，請輸入 1024-65535 之間的數字"
                        fi
                    done
                    ;;
                3|*)
                    echo "❌ 取消啟動"
                    exit 1
                    ;;
            esac
        fi
        export PORT=$DOCKER_PORT
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