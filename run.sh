#!/bin/bash

# ChatVote 快速運行腳本
# 由 Bashcat (BASHCAT.NET) 維護

echo "🎭 ChatVote 直播互動投票系統 - 快速啟動"
echo "由 Bashcat (BASHCAT.NET) 維護"
echo ""

# 端口配置文件
PORT_CONFIG_FILE=".chatvote_port"

# 檢查端口是否被佔用
check_port() {
    local port=${1:-3000}
    # 先嘗試 lsof
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0  # 端口被佔用
        fi
    fi
    
    # 備選方案：使用 netstat
    if command -v netstat >/dev/null 2>&1; then
        if netstat -an | grep -q ":$port.*LISTEN"; then
            return 0  # 端口被佔用
        fi
    fi
    
    # 最後備選：嘗試連接
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost $port >/dev/null 2>&1; then
            return 0  # 端口被佔用
        fi
    fi
    
    return 1  # 端口空閒
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

# 停止佔用指定端口的進程
stop_port_process() {
    local port=${1:-3000}
    echo "🛑 停止佔用端口 $port 的進程..."
    
    # 嘗試 lsof
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pid" ]; then
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
            sleep 2
            echo "✅ 已停止進程 $pid"
            return 0
        fi
    fi
    
    # 嘗試使用 ss 和 awk 找到進程
    if command -v ss >/dev/null 2>&1; then
        local pid=$(ss -tlnp | grep ":$port " | awk -F'pid=' '{print $2}' | awk -F',' '{print $1}' | head -1)
        if [ -n "$pid" ]; then
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
            sleep 2
            echo "✅ 已停止進程 $pid"
            return 0
        fi
    fi
    
    # 嘗試 netstat 方式
    if command -v netstat >/dev/null 2>&1; then
        local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
        if [ -n "$pid" ] && [ "$pid" != "-" ]; then
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
            sleep 2
            echo "✅ 已停止進程 $pid"
            return 0
        fi
    fi
    
    echo "⚠️  無法自動停止端口 $port 的進程，請手動處理"
    return 1
}

# 保存端口配置
save_port() {
    local port=$1
    echo "$port" > "$PORT_CONFIG_FILE"
}

# 讀取上次使用的端口
get_last_port() {
    if [ -f "$PORT_CONFIG_FILE" ]; then
        local saved_port=$(cat "$PORT_CONFIG_FILE" 2>/dev/null)
        if validate_port "$saved_port"; then
            echo "$saved_port"
            return 0
        fi
    fi
    echo "3000"
}

# 停止 ChatVote 服務
stop_chatvote_service() {
    echo "🛑 正在停止 ChatVote 服務..."
    
    # 停止 Docker 容器
    if command -v docker >/dev/null 2>&1; then
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose down 2>/dev/null
        fi
        if docker compose version >/dev/null 2>&1; then
            docker compose down 2>/dev/null
        fi
        
        # 停止可能的 ChatVote 容器
        docker ps -q --filter "name=chatvote" | xargs -r docker stop 2>/dev/null
        docker ps -q --filter "name=voting-system" | xargs -r docker stop 2>/dev/null
    fi
    
    # 停止可能佔用記錄端口的進程
    local last_port=$(get_last_port)
    if check_port "$last_port"; then
        stop_port_process "$last_port"
    fi
    
    # 停止其他常見端口的 Node.js 進程
    for port in 3000 3001 3002 3003 3004 3005 3006; do
        if check_port "$port"; then
            local pid=$(lsof -ti:$port 2>/dev/null | head -1)
            if [ -n "$pid" ]; then
                local cmd=$(ps -p $pid -o comm= 2>/dev/null)
                if [[ "$cmd" =~ node|npm|nodemon ]]; then
                    echo "🔍 發現端口 $port 上的 Node.js 進程 (PID: $pid)"
                    stop_port_process "$port"
                fi
            fi
        fi
    done
    
    echo "✅ ChatVote 服務已停止"
}

# 檢查參數
if [ "$1" = "dev" ]; then
    echo "🚀 啟動開發模式..."
    
    # 獲取上次使用的端口
    PORT=$(get_last_port)
    echo "📌 上次使用端口：$PORT"
    
    # 檢查端口衝突並處理
    if check_port $PORT; then
        echo "⚠️  端口 $PORT 已被佔用"
        echo "請選擇處理方式："
        echo "1) 停止現有進程並使用端口 $PORT"
        echo "2) 自動停止所有 ChatVote 服務並重新啟動"
        echo "3) 使用其他端口"
        echo "4) 取消啟動"
        read -p "請選擇 (1/2/3/4): " choice
        
        case $choice in
            1)
                stop_port_process $PORT
                ;;
            2)
                stop_chatvote_service
                sleep 1
                # 重新檢查端口
                if check_port $PORT; then
                    echo "⚠️  自動清理後端口 $PORT 仍被佔用，嘗試強制停止..."
                    stop_port_process $PORT
                fi
                ;;
            3)
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
            4|*)
                echo "❌ 取消啟動"
                exit 1
                ;;
        esac
    fi
    
    # 保存端口配置並啟動
    save_port $PORT
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
    
    # 獲取上次使用的端口
    DOCKER_PORT=$(get_last_port)
    echo "📌 上次使用端口：$DOCKER_PORT"
    
    # 檢查端口並處理衝突
    if check_port $DOCKER_PORT; then
        echo "⚠️  端口 $DOCKER_PORT 已被佔用"
        echo "請選擇處理方式："
        echo "1) 停止現有進程並使用端口 $DOCKER_PORT"
        echo "2) 自動停止所有 ChatVote 服務並重新啟動"
        echo "3) 使用其他端口"
        echo "4) 取消啟動"
        read -p "請選擇 (1/2/3/4): " choice
        
        case $choice in
            1)
                stop_port_process $DOCKER_PORT
                ;;
            2)
                stop_chatvote_service
                sleep 1
                # 重新檢查端口
                if check_port $DOCKER_PORT; then
                    echo "⚠️  自動清理後端口 $DOCKER_PORT 仍被佔用，嘗試強制停止..."
                    stop_port_process $DOCKER_PORT
                fi
                ;;
            3)
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
            4|*)
                echo "❌ 取消啟動"
                exit 1
                ;;
        esac
    fi
    
    # 檢查是否需要重建Docker鏡像
    if [[ "$2" == "--rebuild" ]] || [[ "$2" == "-r" ]]; then
        echo "🔨 重建 Docker 鏡像..."
        
        # 先停止並移除舊容器和鏡像
        echo "🛑 停止並清理舊容器..."
        if command -v docker-compose &> /dev/null; then
            docker-compose down 2>/dev/null || true
        elif docker compose version &> /dev/null; then
            docker compose down 2>/dev/null || true
        fi
        
        # 移除舊的ChatVote相關容器和鏡像
        docker stop chatvote-voting-system-1 2>/dev/null || true
        docker rm chatvote-voting-system-1 2>/dev/null || true
        docker rmi chatvote-voting-system 2>/dev/null || true
        docker rmi chatvote 2>/dev/null || true
        
        # 重建鏡像
        if command -v docker-compose &> /dev/null; then
            docker-compose build --no-cache
        elif docker compose version &> /dev/null; then
            docker compose build --no-cache
        else
            docker build -t chatvote . --no-cache
        fi
        echo "✅ Docker 鏡像重建完成"
    fi
    
    # 保存端口配置並啟動 Docker
    save_port $DOCKER_PORT
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
                save_port $DOCKER_PORT
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
    stop_chatvote_service
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
    stop_chatvote_service
    sleep 2
    
    # 獲取上次使用的端口並重新啟動
    restart_port=$(get_last_port)
    echo "🚀 在端口 $restart_port 重新啟動開發模式..."
    export PORT=$restart_port
    npm run dev
else
    echo "使用方法:"
    echo "  ./run.sh dev     - 開發模式運行（記憶上次端口）"
    echo "  ./run.sh docker  - Docker 模式運行（記憶上次端口）"
    echo "  ./run.sh docker --rebuild - Docker 模式並重建鏡像"
    echo "  ./run.sh build   - 構建 Docker 映像"
    echo "  ./run.sh stop    - 智能停止所有 ChatVote 服務"
    echo "  ./run.sh logs    - 查看容器日誌"
    echo "  ./run.sh clean   - 清理容器和映像"
    echo "  ./run.sh restart - 重新啟動服務（使用上次端口）"
    echo ""
    echo "✨ 新功能:"
    echo "  🔍 智能端口記憶：自動記住上次使用的端口"
    echo "  🛑 智能服務停止：自動檢測並停止 ChatVote 相關進程"
    echo "  🔄 一鍵重啟：選項2可自動停止所有服務並重新啟動"
    echo ""
    echo "快速開始:"
    echo "  開發: ./run.sh dev"
    echo "  生產: ./run.sh docker"
    echo "  停止: ./run.sh stop"
fi