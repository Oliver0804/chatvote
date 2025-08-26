# Docker 問題排除指南

## 常見 Docker 啟動問題

### 1. URL Scheme 錯誤
```
urllib3.exceptions.URLSchemeUnknown: Not supported URL scheme http+docker
```

**原因**: Docker 環境配置問題，通常出現在 Linux 系統上

**解決方案**:

#### Linux 系統
```bash
# 檢查 Docker 服務狀態
sudo systemctl status docker

# 啟動 Docker 服務
sudo systemctl start docker

# 設定開機自動啟動
sudo systemctl enable docker

# 將用戶加入 docker 群組（避免每次都要 sudo）
sudo usermod -aG docker $USER
# 登出後重新登入生效
```

#### 檢查 Docker 版本兼容性
```bash
# 檢查 Docker 版本
docker --version
docker-compose --version

# 或使用新版指令
docker compose version
```

### 2. 權限問題
```bash
# 如果出現權限錯誤
sudo chown $USER:$USER /var/run/docker.sock
# 或
sudo chmod 666 /var/run/docker.sock
```

### 3. 自動回退方案

運行腳本已內建智能回退機制：

1. **嘗試 Docker** → 失敗時自動使用開發模式
2. **多版本支援** → 支援 `docker-compose` 和 `docker compose`
3. **詳細提示** → 提供具體的解決建議

## 替代啟動方式

### 開發模式（推薦）
```bash
# 直接使用開發模式
./run.sh dev

# 或
npm run dev
```

### 手動 Docker 啟動
```bash
# 檢查 Docker 狀態
docker info

# 使用新版 Docker Compose
docker compose up -d

# 或使用舊版
docker-compose up -d
```

### 建置並運行
```bash
# 建置映像
docker build -t chatvote .

# 直接運行容器
docker run -p 3000:3000 chatvote
```

## 系統需求

- **Node.js**: 14+ 
- **Docker**: 20.10+ (可選)
- **Docker Compose**: 1.29+ 或 Docker Compose V2

## 快速診斷

運行診斷指令：
```bash
echo "=== Docker 環境診斷 ==="
echo "Docker 版本: $(docker --version 2>/dev/null || echo '未安裝')"
echo "Docker Compose: $(docker-compose --version 2>/dev/null || echo '未安裝')"
echo "Docker 服務: $(docker info >/dev/null 2>&1 && echo '運行中' || echo '未運行')"
echo "Node.js 版本: $(node --version 2>/dev/null || echo '未安裝')"
```

由 Bashcat (BASHCAT.NET) 維護