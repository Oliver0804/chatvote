# ChatVote Makefile
# 由 Bashcat (BASHCAT.NET) 維護

.PHONY: help dev docker build stop logs clean setup production

# 預設目標
help:
	@echo "🎭 ChatVote 直播互動投票系統 - 快速指令"
	@echo "由 Bashcat (BASHCAT.NET) 維護"
	@echo ""
	@echo "可用指令:"
	@echo "  make dev         - 開發模式運行"
	@echo "  make docker      - Docker 模式運行"
	@echo "  make build       - 構建 Docker 映像"
	@echo "  make stop        - 停止 Docker 容器"
	@echo "  make logs        - 查看容器日誌"
	@echo "  make clean       - 清理容器和映像"
	@echo "  make setup       - 安裝依賴"
	@echo "  make production  - 生產環境部署"
	@echo ""
	@echo "快速開始:"
	@echo "  開發: make dev"
	@echo "  生產: make production"

# 開發模式
dev:
	@echo "🚀 啟動開發模式..."
	npm run dev

# Docker 運行
docker:
	@echo "🐳 使用 Docker 啟動..."
	docker-compose up -d
	@echo "✅ Docker 容器已啟動"
	@echo "📍 應用地址: http://localhost:3000"

# 構建 Docker 映像
build:
	@echo "🔨 構建 Docker 映像..."
	docker build -t chatvote .
	@echo "✅ Docker 映像構建完成"

# 停止容器
stop:
	@echo "⏹️ 停止 Docker 容器..."
	docker-compose down
	@echo "✅ Docker 容器已停止"

# 查看日誌
logs:
	@echo "📋 查看容器日誌..."
	docker-compose logs -f

# 清理
clean:
	@echo "🧹 清理 Docker 容器和映像..."
	docker-compose down
	-docker rmi chatvote 2>/dev/null || true
	@echo "✅ 清理完成"

# 安裝依賴
setup:
	@echo "📦 安裝依賴..."
	npm install
	@echo "✅ 依賴安裝完成"

# 生產環境部署
production: build docker
	@echo "🎉 生產環境部署完成！"
	@echo "📍 應用地址: http://localhost:3000"