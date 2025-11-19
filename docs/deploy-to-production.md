# ChatVote 生產環境部署指南

## 🌐 Cloudflare 設置

### 1. DNS 記錄配置
在 Cloudflare 控制台中添加：
```
類型: A 或 CNAME
名稱: vote
內容: [您的服務器 IP] 或 dev.bashcat.net
代理狀態: ✅ 已代理（橘色雲朵）
```

### 2. SSL/TLS 設置
- 加密模式：完整 (Full) 或 完整（嚴格）
- 自動 HTTPS 重寫：✅ 開啟
- 始終使用 HTTPS：✅ 開啟

### 3. 頁面規則（可選）
```
URL: vote.bashcat.net/*
設定：
- SSL: 完整
- 快取等級: 標準
- 瀏覽器快取 TTL: 4 小時
```

## 🚀 服務器配置

### 1. 環境變數設置
```bash
# 在您的服務器上設置環境變數
export NODE_ENV=production
export PORT=3000  # 或您想要的端口
```

### 2. 反向代理設置 (Nginx 示例)
```nginx
server {
    listen 80;
    server_name vote.bashcat.net;
    
    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Google AdSense 設置

### 1. 添加新網站
在 AdSense 控制台中添加 `vote.bashcat.net`

### 2. 網站驗證
- 確保網站可正常訪問
- 確保 HTTPS 正常工作
- 確保有足夠內容

### 3. 廣告位置優化
```html
<!-- 建議的廣告位置 -->
<!-- 1. 頁面頂部 (已設置) -->
<!-- 2. 內容中間 -->
<!-- 3. 頁面底部 -->
```

## 🔧 部署步驟

### 1. 更新代碼
```bash
git pull origin main
npm install
```

### 2. 重啟服務
```bash
# 如使用 PM2
pm2 restart chatvote

# 或直接重啟
sudo systemctl restart chatvote
```

### 3. 檢查狀態
- 訪問 `https://vote.bashcat.net`
- 檢查 SSL 證書
- 測試投票功能
- 訪問 `/adsense-debug.html` 檢查廣告狀態

## 📈 監控和維護

### 1. 日誌監控
```bash
# 查看應用日誌
pm2 logs chatvote

# 查看系統資源
pm2 monit
```

### 2. AdSense 監控
- 定期檢查廣告展示狀況
- 監控收益報告
- 確保廣告符合政策

### 3. 性能優化
- 啟用 Cloudflare 快取
- 壓縮靜態資源
- 監控頁面載入速度

## ✅ 檢查清單

- [ ] Cloudflare DNS 記錄已添加
- [ ] SSL 證書正常運作
- [ ] HTTPS 重定向正常
- [ ] vote.bashcat.net 可正常訪問
- [ ] Socket.io 連接正常
- [ ] 投票功能正常
- [ ] AdSense 代碼已載入
- [ ] 廣告調試頁面可訪問
- [ ] Google AdSense 已添加新網站

## 🆘 故障排除

### 常見問題：
1. **502 Bad Gateway**: 檢查後端服務是否運行
2. **SSL 錯誤**: 檢查 Cloudflare SSL 設置
3. **廣告不顯示**: 等待 24-48 小時審核期
4. **Socket.io 連接失敗**: 檢查代理設置