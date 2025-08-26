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
- 🏷️ **用戶 ID 管理**: 支援自定義用戶 ID 分類和查詢
- ⏱️ **差異化保存**: 不同用戶類型享有不同數據保存期限
- 📱 **響應式設計**: 支援手機和桌面裝置
- 🎭 **直播場景**: 完美適配直播間聊天室互動
- 🗄️ **數據持久化**: 使用 Supabase 數據庫，數據安全可靠

## 🚀 快速開始

### 前置需求

1. **Supabase 專案設定**：
   - 註冊 [Supabase](https://supabase.com) 帳號
   - 創建新專案
   - 取得專案 URL 和 API 金鑰

2. **環境變數配置**：
```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯 .env 檔案，填入您的 Supabase 資訊
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. **數據庫初始化**：
   - 在 Supabase 專案中執行 `supabase-schema.sql` 檔案中的 SQL 語句
   - 或使用 Supabase Dashboard 的 SQL 編輯器貼上並執行

### 使用便捷腳本（推薦）

1. 克隆專案：
```bash
git clone <repository-url>
cd chatvote
```

2. 使用智能啟動腳本：
```bash
# 開發模式
./run.sh dev

# Docker 模式  
./run.sh docker

# 其他指令
./run.sh stop     # 智能停止服務
./run.sh restart  # 重新啟動
./run.sh --help   # 查看所有選項
```

3. 訪問應用：
- 主頁：http://localhost:3000
- 活動投票列表：http://localhost:3000/polls
- 歷史投票：http://localhost:3000/history

### 使用 Docker Compose

```bash
docker-compose up -d
```

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

## 🗄️ Supabase 配置指南

### 1. 創建 Supabase 專案

1. 訪問 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊「New Project」創建新專案
3. 填寫專案名稱、組織和資料庫密碼
4. 選擇地區（建議選擇距離用戶最近的地區）
5. 等待專案初始化完成

### 2. 獲取 API 金鑰

在專案 Dashboard 中：
1. 點擊左側「Settings」→「API」
2. 複製以下資訊：
   - **Project URL**: 專案的 API 端點
   - **anon public**: 匿名公開金鑰
   - **service_role secret**: 服務角色金鑰（保密）

### 3. 初始化數據庫

在 Supabase Dashboard 中：
1. 點擊左側「SQL Editor」
2. 點擊「New query」
3. 複製 `supabase-schema.sql` 檔案的內容貼上
4. 點擊「Run」執行 SQL 語句

### 4. 環境變數配置

```bash
# 在專案根目錄創建 .env 檔案
cp .env.example .env

# 編輯 .env 檔案，填入從 Supabase 獲取的資訊
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. 驗證連接

啟動應用後，檢查控制台輸出：
```
✅ Supabase 連接成功
🗄️ Supabase 數據庫連接正常
```

## 🏷️ 用戶 ID 管理系統

ChatVote 2.0 引入了強大的用戶 ID 管理功能，讓你更好地組織和查詢投票資料。

### ✨ 功能特色

#### 🆔 用戶 ID 分類
- **自訂用戶名**: 建立投票時可輸入專屬用戶 ID（如 `oliver0804`、`streamer123`）
- **匿名模式**: 不填寫則自動設為匿名用戶
- **快速查詢**: 點擊投票列表中的用戶名即可查看該用戶所有投票

#### 📊 用戶類型系統
- **一般用戶** (預設): 投票資料保存 **7 天**
- **高級用戶**: 投票資料保存 **14 天**  
- **VIP 用戶**: 投票資料保存 **30 天**

#### 🔍 用戶投票查詢
```
訪問 /user/:userId 查看特定用戶的所有投票
例如: /user/oliver0804
```

### 📝 使用方式

#### 1. 建立投票時設定用戶資訊
```
建立投票頁面：
┌─────────────────────────────────┐
│ 用戶 ID（可選）: oliver0804      │
│ 用戶類型: VIP用戶（保存30天）    │
│ 問題: 今晚要玩什麼遊戲？         │
│ 選項: 1. APEX  2. 原神          │
└─────────────────────────────────┘
```

#### 2. 查詢用戶投票記錄
- **方式一**: 在活躍/歷史投票頁面點擊用戶名
- **方式二**: 直接訪問 `/user/用戶名`
- **展示內容**: 活躍投票、歷史投票、統計資訊

#### 3. 數據保存策略
| 用戶類型 | 保存期限 | 適用場景 |
|---------|---------|----------|
| 一般用戶 | 7 天 | 臨時投票、測試用戶 |
| 高級用戶 | 14 天 | 頻繁使用者 |
| VIP 用戶 | 30 天 | 直播主、重要用戶 |

### 🎯 實際應用場景

#### 🎬 直播主管理
```bash
# 直播主 oliver0804 的投票歷史
/user/oliver0804
- 看到所有歷史投票
- 分析觀眾喜好趨勢
- 重複使用成功的投票主題
```

#### 👥 觀眾分類
```bash
# 不同觀眾的投票記錄
/user/regular_viewer    # 一般觀眾
/user/mod_alice        # 版主/高級用戶  
/user/sponsor_bob      # 贊助者/VIP用戶
```

#### 📈 數據分析
- 追蹤活躍投票創建者
- 分析用戶參與度
- 投票主題偏好分析

### 💡 進階功能

#### API 查詢
```javascript
// 取得用戶投票資料
GET /api/user-polls/:userId

// 回應格式
{
  "active": [],      // 活躍投票
  "history": [],     // 歷史投票  
  "total": 15        // 總投票數
}
```

#### 投票分類顯示
- 活躍投票頁面顯示創建者和用戶類型徽章
- 歷史投票頁面支援按用戶篩選
- 用戶專屬頁面統一管理所有投票

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
├── .env.example           # 環境變數範例檔案
├── .env                   # 環境變數配置檔案（需自行建立）
├── supabase-schema.sql    # Supabase 數據庫架構 SQL
├── lib/
│   └── supabase.js        # Supabase 數據庫操作模組
└── public/                # 前端靜態檔案
    ├── index.html         # 建立投票頁面
    ├── vote.html          # 投票頁面
    ├── result.html        # 結果頁面
    ├── polls.html         # 活動投票列表
    ├── history.html       # 歷史投票頁面
    ├── user.html          # 用戶投票查詢頁面
    ├── style.css          # CSS 樣式
    └── js/                # JavaScript 檔案
        ├── create.js      # 建立投票邏輯
        ├── vote.js        # 投票邏輯
        ├── result.js      # 結果展示邏輯
        ├── polls.js       # 投票列表邏輯
        ├── history.js     # 歷史投票邏輯
        └── user.js        # 用戶查詢邏輯
```

## 🛠️ 技術架構

### 後端技術
- **Node.js** - JavaScript 運行環境
- **Express** - Web 應用框架
- **Socket.io** - WebSocket 即時通訊
- **Supabase** - PostgreSQL 數據庫和後端服務
- **QRCode** - QR Code 生成
- **UUID** - 唯一識別碼生成
- **dotenv** - 環境變數管理

### 前端技術
- **HTML5** - 網頁結構
- **CSS3** - 響應式樣式設計
- **JavaScript (ES6+)** - 互動邏輯
- **Chart.js** - 圓餅圖展示
- **Socket.io Client** - 即時通訊

### 數據庫技術
- **PostgreSQL** - 主要數據庫（由 Supabase 提供）
- **Row Level Security (RLS)** - 數據庫層級安全控制
- **實時訂閱** - Supabase 實時數據更新

### 部署技術
- **Docker** - 容器化部署
- **Docker Compose** - 多容器管理
- **Supabase Cloud** - 雲端數據庫託管

## 🔧 API 端點

### 投票相關
- `POST /api/create-poll` - 建立新投票（支援用戶ID和類型）
- `GET /api/poll/:pollId` - 獲取投票資訊
- `POST /api/vote/:pollId` - 提交投票
- `GET /api/active-polls` - 獲取活動投票列表
- `GET /api/history-polls` - 獲取歷史投票列表
- `GET /api/user-polls/:userId` - 獲取特定用戶的所有投票

### 頁面路由
- `GET /` - 建立投票頁面
- `GET /polls` - 活動投票列表
- `GET /history` - 歷史投票頁面
- `GET /user/:userId` - 用戶投票查詢頁面
- `GET /vote/:pollId` - 投票頁面
- `GET /result/:pollId` - 結果頁面

## ⚙️ 環境變數

| 變數名 | 說明 | 預設值 | 必需 |
|--------|------|--------|------|
| `SUPABASE_URL` | Supabase 專案 URL | 無 | ✅ |
| `SUPABASE_ANON_KEY` | Supabase 匿名金鑰 | 無 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服務角色金鑰 | 無 | ⚠️* |
| `PORT` | 伺服器端口 | `3000` | ❌ |
| `NODE_ENV` | 運行環境 | `production` | ❌ |
| `DEBUG` | 除錯模式 | `false` | ❌ |

*註：`SUPABASE_SERVICE_ROLE_KEY` 用於管理員操作（如清理過期投票），建議提供但非必需。

## 🔒 安全特性

- **IP 限制**: 每個 IP 位址只能對同一個投票投票一次
- **時間限制**: 投票自動在設定時間後結束
- **輸入驗證**: 前後端雙重驗證用戶輸入
- **數據庫安全**: 使用 Supabase Row Level Security (RLS) 保護數據
- **環境變數**: 敏感資訊通過環境變數安全管理
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