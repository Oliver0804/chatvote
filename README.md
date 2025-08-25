# 🎭 ChatVote - 直播互動投票系統

專為直播主與聊天室觀眾設計的即時互動投票系統，支援快速建立投票、QR Code 分享、即時統計和結果展示。

## 🌟 功能特色

- 🎬 **直播友善**: 專為直播主與觀眾互動設計
- ✅ **快速建立**: 輸入問題和選項，設定投票時間（5-60分鐘）
- 📱 **QR Code 分享**: 自動生成 QR Code，觀眾掃碼即可參與
- 🛡️ **IP 防護**: 基於 IP 位址防止重複投票
- ⚡ **即時更新**: 使用 WebSocket 即時更新投票結果
- 📊 **視覺化展示**: 投票結束後自動顯示圓餅圖
- 📋 **活動管理**: 查看所有進行中的投票
- 📱 **響應式設計**: 支援手機和桌面裝置
- 🎭 **直播場景**: 完美適配直播間聊天室互動

## 🚀 快速開始

### 使用 Docker Compose（推薦）

1. 克隆專案：
```bash
git clone <repository-url>
cd chatvote
```

2. 啟動服務：
```bash
docker-compose up -d
```

3. 訪問應用：
- 主頁：http://localhost:3000
- 活動投票列表：http://localhost:3000/polls

### 使用 Docker

```bash
# 建立映像
docker build -t chatvote .

# 運行容器
docker run -p 3000:3000 chatvote
```

### 本地開發

1. 安裝依賴：
```bash
npm install
```

2. 啟動開發服務器：
```bash
npm run dev
```

## 🎯 使用場景

### 🎬 直播互動
- **問答環節**: 讓觀眾快速選擇問題優先級
- **遊戲投票**: 直播遊戲中的選擇決策
- **內容決定**: 觀眾投票決定直播內容方向
- **意見調查**: 快速收集觀眾對話題的看法

### 📺 聊天室功能
- **即時回饋**: 觀眾透過投票表達意見
- **互動增強**: 提高聊天室參與度
- **決策參考**: 直播主根據投票結果做決定
- **趣味活動**: 增加直播間的娛樂性

## 📁 專案結構

```
chatvote/
├── server.js              # Express 伺服器主檔案
├── package.json           # Node.js 依賴配置
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
└── public/                # 前端靜態檔案
    ├── index.html         # 建立投票頁面
    ├── vote.html          # 投票頁面
    ├── result.html        # 結果頁面
    ├── polls.html         # 活動投票列表
    ├── style.css          # CSS 樣式
    └── js/                # JavaScript 檔案
        ├── create.js      # 建立投票邏輯
        ├── vote.js        # 投票邏輯
        ├── result.js      # 結果展示邏輯
        └── polls.js       # 投票列表邏輯
```

## 🛠️ 技術架構

### 後端技術
- **Node.js** - JavaScript 運行環境
- **Express** - Web 應用框架
- **Socket.io** - WebSocket 即時通訊
- **QRCode** - QR Code 生成
- **UUID** - 唯一識別碼生成

### 前端技術
- **HTML5** - 網頁結構
- **CSS3** - 響應式樣式設計
- **JavaScript (ES6+)** - 互動邏輯
- **Chart.js** - 圓餅圖展示
- **Socket.io Client** - 即時通訊

### 部署技術
- **Docker** - 容器化部署
- **Docker Compose** - 多容器管理

## 🔧 API 端點

### 投票相關
- `POST /api/create-poll` - 建立新投票
- `GET /api/poll/:pollId` - 獲取投票資訊
- `POST /api/vote/:pollId` - 提交投票
- `GET /api/active-polls` - 獲取活動投票列表

### 頁面路由
- `GET /` - 建立投票頁面
- `GET /polls` - 活動投票列表
- `GET /vote/:pollId` - 投票頁面
- `GET /result/:pollId` - 結果頁面

## ⚙️ 環境變數

| 變數名 | 說明 | 預設值 |
|--------|------|--------|
| `PORT` | 伺服器端口 | `3000` |
| `NODE_ENV` | 運行環境 | `production` |

## 🔒 安全特性

- **IP 限制**: 每個 IP 位址只能對同一個投票投票一次
- **時間限制**: 投票自動在設定時間後結束
- **輸入驗證**: 前後端雙重驗證用戶輸入
- **非 Root 用戶**: Docker 容器使用非特權用戶運行

## 🎯 使用流程

1. **建立投票**
   - 輸入問題和至少 2 個選項
   - 設定投票時間（5-60 分鐘）
   - 獲得隨機 URL 和 QR Code

2. **分享投票**
   - 複製投票連結或掃描 QR Code
   - 用戶可以查看活動投票列表

3. **即時投票**
   - 用戶選擇選項進行投票
   - 即時顯示投票統計
   - 防止同一 IP 重複投票

4. **查看結果**
   - 投票結束後自動跳轉結果頁面
   - 顯示詳細統計和圓餅圖
   - 支援結果分享

## 📱 響應式設計

系統完全支援響應式設計，適用於：
- 📱 手機設備（iOS/Android）
- 💻 平板設備
- 🖥️ 桌面電腦
- 📺 大螢幕顯示

## 🚦 健康檢查

Docker 配置包含健康檢查機制：
- 檢查間隔：30 秒
- 超時時間：10 秒  
- 重試次數：3 次
- 啟動延遲：40 秒

## 🐛 常見問題

### 投票無法載入
- 檢查投票 ID 是否正確
- 確認投票是否已過期
- 檢查網路連接狀況

### 無法投票
- 確認該 IP 是否已經投過票
- 檢查投票是否仍在進行中
- 重新載入頁面嘗試

### Docker 啟動失敗
- 確認 Docker 和 Docker Compose 已正確安裝
- 檢查端口 3000 是否被佔用
- 查看容器日誌：`docker-compose logs`

## 🐱 維護者

本專案由 **[Bashcat](https://bashcat.net)** 進行維護

- 🌐 官網：[BASHCAT.NET](https://bashcat.net)
- 📧 聯繫：透過官網聯繫表單
- 💬 社群：Discord / HackMD

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**🎭 ChatVote** - 讓直播互動更有趣！專為直播主與聊天室設計的即時投票系統 ✨