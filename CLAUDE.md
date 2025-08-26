# ChatVote - Claude Code 項目說明

## 項目概述
ChatVote 是一個專為直播主與聊天室互動設計的實時投票系統，使用 Node.js + Socket.io 開發，支援 Docker 部署。

## 技術架構
- **後端**: Node.js + Express
- **實時通信**: Socket.io
- **前端**: HTML5 + CSS3 + JavaScript
- **圖表**: Chart.js
- **QR Code**: qrcode 庫
- **容器化**: Docker + Docker Compose

## 核心功能
1. **創建投票**: 輸入問題和選項，設定 5-10 分鐘倒計時
2. **隨機 URL**: 生成唯一投票 URL 和 QR Code
3. **實時投票**: WebSocket 即時更新投票結果
4. **IP 防護**: 防止同一 IP 重複投票
5. **結果展示**: 左右佈局顯示圓餅圖和詳細統計
6. **歷史記錄**: 查看過去 7 天的投票記錄
7. **端口管理**: 智能端口衝突檢測和處理

## 頁面結構
- `/` - 首頁（創建投票）
- `/vote/:id` - 投票頁面
- `/result/:id` - 結果頁面
- `/active` - 活躍投票列表
- `/history` - 歷史投票記錄

## 部署方式

### 開發模式
```bash
./run.sh dev
```

### Docker 模式
```bash
./run.sh docker
```

### 其他指令
```bash
./run.sh build    # 構建 Docker 映像
./run.sh stop     # 停止所有服務
./run.sh logs     # 查看容器日誌
./run.sh clean    # 清理容器和映像
./run.sh restart  # 重新啟動服務
```

## 端口管理
系統內建智能端口衝突處理：
1. 自動檢測端口佔用（支援 lsof、netstat、nc）
2. 提供三種處理選項：
   - 停止現有進程
   - 自定義端口（1024-65535）
   - 取消啟動
3. 支援 Docker 動態端口映射

## 環境變數
- `PORT`: 應用端口（默認 3000）
- `EXTERNAL_PORT`: Docker 外部端口（默認 3000）
- `NODE_ENV`: 運行環境（默認 production）

## 項目特色
- **直播友好**: 專為直播互動設計
- **簡單易用**: 一鍵啟動，自動處理端口衝突
- **實時更新**: WebSocket 即時同步
- **移動優化**: 響應式設計，支援手機投票
- **數據管理**: 自動清理過期數據，節省空間

## 維護信息
- 項目名稱: ChatVote
- 維護者: Bashcat (BASHCAT.NET)
- 版本: v1.0
- 授權: 自有專案（非 MIT）

## 技術債務和改進
1. ✅ 端口衝突自動處理
2. ✅ Docker 回退模式優化
3. ✅ 多平台端口檢測相容性
4. ✅ 歷史投票數據管理
5. ✅ 響應式設計優化

## Git 工作流程
```bash
git add .
git commit -m "描述修改內容"
git push origin main
```

## 常見問題
1. **端口被佔用**: 腳本會自動檢測並提供解決方案
2. **Docker 啟動失敗**: 自動回退到開發模式
3. **投票不更新**: 檢查 WebSocket 連接狀態
4. **QR Code 掃不到**: 確認網路連接和防火牆設定

## 開發注意事項
- 所有靜態資源使用絕對路徑（避免嵌套 URL 問題）
- WebSocket 事件需要適當的錯誤處理
- 投票數據僅存儲 7 天，過期自動清理
- IP 記錄用於防重複投票，不做其他用途

## 測試建議
1. 測試端口衝突處理機制
2. 驗證不同瀏覽器的 WebSocket 連接
3. 確認移動設備的響應式佈局
4. 測試長時間運行的記憶體使用情況